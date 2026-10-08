import "server-only";

import { ThinkingLevel } from "@google/genai";
import sharp from "sharp";

import { generateGemini } from "@/lib/ai";
import { altFieldsToFill, parseCoverAlt, type CoverAlt } from "@/lib/cover-alt";

/**
 * Nhìn ảnh bìa rồi viết mô tả (alt) vi + en — cho form quản trị bài viết.
 *
 * Gọi từ hai chỗ: `POST /api/admin/cover-alt` (form điền ngay sau khi chọn ảnh,
 * người biên tập thấy và sửa trước khi lưu) và lượt lưu bài (lưới hứng cho ô
 * còn trống). Vì sao cho AI ghi alt vào CSDL trong khi giải thích thuật ngữ do
 * AI thì không: docs/architecture.md, mục "Mô tả ảnh bìa tự động".
 *
 * Hàm KHÔNG BAO GIỜ ném: thiếu khoá, 429, ảnh hỏng, mô hình trả rác → `null`.
 * Alt trống thì ảnh render `alt=""`; một lượt lưu hỏng vì máy chủ AI bận thì
 * người biên tập mất bài đang viết. Cùng nguyên tắc với `cover-intake.ts`.
 */

/** Ảnh lớn hơn thế này thì không đọc — ảnh bìa trên R2 cỡ 1024 chỉ vài trăm KB. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Cạnh dài gửi cho mô hình. Ảnh tính token theo kích thước, và 1024 px đã đủ
 * đọc chữ chú thích trên sơ đồ.
 */
const MODEL_IMAGE_EDGE = 1024;

/** Wikimedia trả 403 cho request không khai User-Agent — như `cover-intake.ts`. */
const USER_AGENT =
  "SciencepediaCoverAlt/1.0 (+https://sciencepedia-sciencepedia.vercel.app)";
const PRIVATE_HOST =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:)/i;

const PROMPT = `Bạn viết mô tả ảnh (thuộc tính alt) cho ảnh bìa một bài của SciencePedia — bách khoa khoa học tiếng Việt. Người đọc alt là người KHÔNG nhìn thấy ảnh (trình đọc màn hình) và máy tìm kiếm ảnh.

Quy tắc:
1. Tả đúng những gì NHÌN THẤY trong ảnh: vật thể, cảnh, kiểu ảnh (ảnh chụp, ảnh hiển vi, sơ đồ, hình vẽ, ảnh mô phỏng), màu sắc hay bố cục khi chúng mang thông tin, và chữ/chú thích đọc được trong ảnh.
2. Chỉ nêu tên riêng (thiên thể, loài, thiết bị, cấu trúc) khi ảnh tự cho thấy điều đó — qua chữ trong ảnh hoặc hình dạng không thể nhầm. Không chắc thì tả hình dạng, không đoán tên.
3. Không nêu nhận định khoa học nào ngoài những gì ảnh cho thấy. Không giải thích, không đánh giá.
4. Không mở đầu bằng "Ảnh của", "Hình ảnh cho thấy", "An image of", "A photo of".
5. Không ghi tên tác giả, nguồn, giấy phép, hay hình mờ (watermark).
6. Mỗi thứ tiếng đúng MỘT câu, tối đa 200 ký tự. Tiếng Việt có dấu, viết hoa kiểu câu.
7. Bản tiếng Anh tả cùng nội dung, không cần dịch từng chữ.

Trả về đúng MỘT đối tượng JSON, không kèm chữ nào khác:
{"vi":"...","en":"..."}`;

/** Đọc thân response nhưng dừng ngay khi vượt trần — không tin `content-length`. */
async function readCapped(response: Response, max: number): Promise<Buffer | null> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > max) return null;
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export function isCoverAltConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function describeCover(
  url: string,
  { timeoutMs = 25_000 }: { timeoutMs?: number } = {},
): Promise<CoverAlt | null> {
  if (!isCoverAltConfigured()) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  // Route nhận URL do người biên tập gõ: không để máy chủ tự gọi vào mạng nội bộ
  // (metadata đám mây 169.254.x, localhost…). Chặn theo tên/IP literal — rẻ, không
  // chống được DNS trỏ về IP nội bộ, nhưng đủ cho route chỉ EDITOR dùng.
  if (PRIVATE_HOST.test(parsed.hostname)) return null;

  // Một hạn chót cho cả hai chặng (tải ảnh + gọi mô hình), không phải mỗi chặng
  // một hạn: lượt lưu bài chờ đúng chừng này rồi đi tiếp.
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const response = await fetch(parsed, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!type.startsWith("image/")) throw new Error(`không phải ảnh: ${type || "?"}`);

    const body = await readCapped(response, MAX_IMAGE_BYTES);
    if (!body) throw new Error("ảnh quá lớn");

    /* Chuyển về WebP cạnh dài 1024 trước khi gửi: Gemini không nhận mọi kiểu
       ảnh (AVIF, GIF), và ảnh gốc Commons cỡ bản đồ thì tốn token vô ích.
       `animated: false` — GIF chỉ lấy khung đầu. */
    const image = await sharp(body, { animated: false })
      .rotate()
      .resize(MODEL_IMAGE_EDGE, MODEL_IMAGE_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const { text } = await generateGemini({
      prompt: PROMPT,
      images: [{ mimeType: "image/webp", data: image.toString("base64") }],
      json: true,
      // Tả cái nhìn thấy, không sáng tác: cùng ảnh nên ra cùng mô tả.
      temperature: 0.2,
      thinking: ThinkingLevel.LOW,
      maxOutputTokens: 4096,
      signal,
    });

    const alt = parseCoverAlt(text);
    if (!alt) console.warn("[cover-alt] đầu ra không hợp lệ", text.slice(0, 300));
    return alt;
  } catch (error) {
    console.warn("[cover-alt]", parsed.href, (error as Error)?.message ?? error);
    return null;
  }
}

type CoverAltFields = {
  coverImage: string | null;
  coverImageAlt: string | null;
  coverImageAltEn: string | null;
};

/**
 * Lưới hứng lúc LƯU bài: điền ô alt còn trống, và tạo lại alt cũ khi ảnh bìa
 * đã đổi (quy tắc trong `altFieldsToFill`).
 *
 * `submittedCover` là URL người biên tập gửi lên (trước `intakeCover`), dùng để
 * so với CSDL. `data.coverImage` là URL sau `intakeCover` — thường đã nằm trên
 * R2 — và là thứ đem đi tả.
 *
 * Mô hình hỏng mà alt gửi lên là alt của ảnh CŨ thì ghi `null`: trống thì ảnh
 * render `alt=""`, còn alt sai là nói dối người không nhìn thấy ảnh.
 */
export async function fillCoverAlt<T extends CoverAltFields>(
  data: T,
  {
    submittedCover,
    previous,
  }: {
    submittedCover: string | null;
    previous?: CoverAltFields | null;
  },
): Promise<T> {
  const fill = altFieldsToFill({
    cover: submittedCover,
    alt: { vi: data.coverImageAlt, en: data.coverImageAltEn },
    previousCover: previous?.coverImage ?? null,
    previousAlt: previous ? { vi: previous.coverImageAlt, en: previous.coverImageAltEn } : null,
  });
  if ((!fill.vi && !fill.en) || !data.coverImage) return data;

  // Ngắn hơn route: người biên tập đang chờ nút Lưu, và form thường đã điền rồi.
  const alt = await describeCover(data.coverImage, { timeoutMs: 15_000 });

  return {
    ...data,
    ...(fill.vi ? { coverImageAlt: alt?.vi ?? null } : {}),
    ...(fill.en ? { coverImageAltEn: alt?.en ?? null } : {}),
  };
}
