import "server-only";

import sharp from "sharp";

import { assetKey, assetUrl } from "@/lib/asset";
import { LADDER, variantKey } from "@/lib/image-variants";
import { signR2Request, type R2Credentials } from "@/lib/r2-sign";

/**
 * Cloudflare R2 — nơi chứa ảnh bài viết và ảnh danh mục do biên tập tải lên.
 *
 * ## Vì sao không còn là Supabase Storage
 *
 * Ảnh trên Supabase phải đi qua `/_next/image` để có nhiều cỡ, mà hạn mức
 * Image Optimization của Vercel đã cạn (HTTP 402) — xem `docs/architecture.md`,
 * mục "Ảnh tĩnh KHÔNG đi qua `/_next/image`". Toàn bộ ảnh còn lại của trang đã
 * chuyển sang R2 và dùng các cỡ dựng sẵn; để riêng đường tải lên ở Supabase
 * nghĩa là mỗi ảnh biên tập viên thêm vào lại là một ảnh hỏng.
 *
 * ## Vì sao dựng biến thể NGAY lúc tải lên
 *
 * Cách rẻ hơn là để script `images:variants` chạy sau. Nhưng khi đó ảnh vừa
 * tải trông hoàn hảo trong trang quản trị rồi hỏng ngoài trang công khai, và
 * chỉ hỏng ở vài bề rộng màn hình — kiểu lỗi phát hiện muộn nhất có thể. Trả
 * thêm vài giây ở lượt tải lên để không ai phải nhớ chạy ba lệnh là đánh đổi
 * đúng.
 *
 * ## Quy ước tên tệp thay cho bản kê
 *
 * Bản kê `image-variants.json` sinh lúc dựng, nên không thể biết ảnh tải lên
 * sau đó. Thay vào đó đường này dựng đủ các nấc `LADDER` không vượt bề rộng
 * gốc và trả về URL của nấc LỚN NHẤT — con số trong tên tệp nói luôn "có tới
 * đây", và `assetSrcSet()` suy ngược cả bộ từ đó. Xem chú thích của
 * `widthsFromKey` trong `src/lib/image-variants.ts`.
 *
 * Bí mật: `CLOUDFLARE_R2_SECRET_ACCESS_KEY` chỉ đọc ở đây. Module đánh dấu
 * "server-only": lỡ import từ Client Component thì build báo lỗi thay vì âm
 * thầm nhúng khoá vào bundle trình duyệt.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Chỉ nhận đúng các định dạng ảnh web — không nhận SVG vì SVG chạy được script. */
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

function credentials(): R2Credentials {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Thiếu cấu hình Cloudflare R2");
  }
  return { accountId, bucket, accessKeyId, secretAccessKey };
}

export function isConfigured() {
  try {
    credentials();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sinh phần gốc của đường dẫn: `<prefix>/<năm>/<tháng>/<slug>-<random>`
 * Chia theo tháng để một thư mục không phình lên hàng chục nghìn tệp.
 * KHÔNG kèm đuôi — đuôi do từng biến thể tự gắn (`-<w>.webp`).
 */
export function buildStem(originalName: string, prefix = "articles"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const base =
    originalName
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "image";

  const random = crypto.randomUUID().slice(0, 8);

  return `${prefix}/${year}/${month}/${base}-${random}`;
}

async function send(
  method: "PUT" | "DELETE",
  key: string,
  body?: Buffer,
  headers?: Record<string, string>,
) {
  const signed = signR2Request(credentials(), { method, key, body, headers });
  const response = await fetch(signed.url, {
    method,
    headers: signed.headers,
    body: body ? new Uint8Array(body) : undefined,
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`R2 ${method} ${key}: HTTP ${response.status} — ${detail}`);
  }
}

export type UploadResult = {
  /** Đường dẫn gốc trong bucket, không có `-<w>.webp`. Lưu để còn xoá. */
  path: string;
  /** URL của nấc lớn nhất — cũng là thứ ghi vào CSDL. */
  url: string;
  /** Tên bucket, để hàng `Media` ghi đúng nơi tệp thật sự nằm. */
  bucket: string;
  /** Cỡ của nấc lớn nhất. KHÔNG phải cỡ tệp người dùng chọn — tệp ấy đã bị
   *  thay bằng WebP, ghi lại con số cũ là ghi một sự thật không còn tồn tại. */
  bytes: number;
  widths: number[];
};

/**
 * Dựng các cỡ rồi đẩy hết lên R2.
 *
 * `withoutEnlargement` giữ ảnh nhỏ ở đúng cỡ gốc, nên nấc lớn nhất luôn bằng
 * bề rộng thật — điều kiện để quy ước tên tệp không nói dối.
 */
export async function uploadImage(
  file: File,
  prefix?: string,
): Promise<UploadResult> {
  return uploadBuffer(Buffer.from(await file.arrayBuffer()), file.name, prefix);
}

/**
 * Cùng việc như `uploadImage` nhưng nhận sẵn byte.
 *
 * Tách ra vì có hai nguồn ảnh: tệp biên tập viên chọn, và ảnh tải về từ máy
 * chủ ngoài khi người ta dán một URL (`src/lib/cover-intake.ts`). Hai nguồn,
 * một cách xử lý — nếu chép đôi thì nấc, chất lượng WebP và header cache sẽ
 * lệch nhau ở lần sửa sau.
 */
export async function uploadBuffer(
  source: Buffer,
  originalName: string,
  prefix?: string,
): Promise<UploadResult> {
  const meta = await sharp(source).metadata();
  const origWidth = meta.width ?? 0;
  if (!origWidth) throw new Error("Không đọc được kích thước ảnh");

  const stem = buildStem(originalName, prefix);
  const targets = [...LADDER.filter((w) => w < origWidth), Math.min(origWidth, LADDER[LADDER.length - 1])];

  const widths: number[] = [];
  let bytes = 0;
  for (const width of [...new Set(targets)].sort((a, b) => a - b)) {
    const buffer = await sharp(source)
      .resize(width, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const actual = (await sharp(buffer).metadata()).width ?? width;
    if (widths.includes(actual)) continue;
    widths.push(actual);
    bytes = buffer.length;

    await send("PUT", variantKey(`${stem}.webp`, actual), buffer, {
      "content-type": "image/webp",
      // Tên tệp mang UUID nên nội dung là bất biến: đệm thoải mái.
      "cache-control": "public, max-age=31536000, immutable",
    });
  }

  return {
    path: stem,
    url: assetUrl(variantKey(`${stem}.webp`, widths[widths.length - 1])),
    bucket: credentials().bucket,
    bytes,
    widths,
  };
}

/**
 * Xoá MỌI biến thể của một ảnh.
 *
 * Nhận đường dẫn gốc (không đuôi), hỏi R2 xem thật sự có những khoá nào rồi
 * xoá đúng ngần ấy.
 *
 * ## Vì sao hỏi chứ không đoán theo `LADDER`
 *
 * Lượt đầu viết hàm này đoán: xoá từng nấc trong `LADDER`. Phép thử ngày
 * 2026-09-16 cho thấy nó để sót — ảnh gốc rộng 1400 px sinh ra một nấc 1400,
 * mà 1400 không nằm trong `LADDER`. Nấc LỚN NHẤT của mỗi ảnh chính là bề rộng
 * gốc, tức gần như luôn là con số lẻ, tức gần như luôn bị bỏ sót. Xoá ảnh mà
 * để lại đúng bản to nhất thì tệ hơn không xoá: người ta tin là đã xoá.
 */
export async function deleteImage(stem: string): Promise<void> {
  const prefix = `${stem}-`;
  const signed = signR2Request(credentials(), {
    method: "GET",
    // SigV4 đòi tham số truy vấn sắp theo alphabet.
    query: `list-type=2&prefix=${encodeURIComponent(prefix)}`,
  });
  const listing = await fetch(signed.url, { headers: signed.headers });
  if (!listing.ok) {
    throw new Error(`R2 LIST ${prefix}: HTTP ${listing.status}`);
  }

  const xml = await listing.text();
  const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  );

  for (const key of keys) {
    await send("DELETE", key);
  }
}

/**
 * Suy ngược đường dẫn gốc từ URL công khai (dùng khi chỉ có URL trong CSDL).
 * `…/articles/2026/09/x-ab12cd34-1200.webp` → `articles/2026/09/x-ab12cd34`
 */
export function pathFromPublicUrl(url: string): string | null {
  const key = assetKey(url);
  if (!key) return null;
  const stem = key.replace(/-\d+\.webp$/, "");
  return stem === key ? null : stem;
}
