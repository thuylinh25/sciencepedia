import { z } from "zod";

/**
 * Phần thuần của mô tả ảnh bìa tự động: đọc đầu ra mô hình và quyết định khi
 * nào phải tạo lại. Tách khỏi `src/server/cover-alt.ts` (gọi mạng, `server-only`)
 * để test được bằng `tsx --test` và để form phía client dùng chung quy tắc.
 *
 * Lý do của cả tính năng: docs/architecture.md, mục "Mô tả ảnh bìa tự động".
 */

export type CoverAlt = { vi: string; en: string };

/** Trần của cột — trùng `coverImageAlt` trong `articleSchema`. Prompt xin ≤ 200. */
export const COVER_ALT_MAX = 250;

/**
 * Mở đầu thừa: "Ảnh của…", "Hình ảnh cho thấy…", "An image of…". Trình đọc màn
 * hình đã báo "hình ảnh" trước khi đọc alt, nên mấy chữ này bị nghe hai lần.
 *
 * CHỈ bỏ khi theo sau là "của / cho thấy / mô tả" — "Ảnh chụp kính hiển vi điện
 * tử…" nói chất liệu của ảnh, là thông tin thật, phải giữ.
 */
const LEADING_FILLER = [
  /^(?:đây là\s+)?(?:một\s+)?(?:bức\s+)?(?:ảnh|hình ảnh|hình)\s+(?:của|cho thấy|mô tả|thể hiện)\s+/iu,
  /^(?:this is\s+)?(?:an?\s+|the\s+)?(?:image|photo|photograph|picture)\s+(?:of|showing|depicting)\s+/iu,
];

const rawSchema = z.object({
  vi: z.string(),
  en: z.string(),
});

function clean(value: string): string {
  let text = value.replace(/\s+/gu, " ").trim();
  // Mô hình hay bọc cả câu trong ngoặc kép.
  text = text.replace(/^["'“‘«]+|["'”’»]+$/gu, "").trim();
  for (const pattern of LEADING_FILLER) text = text.replace(pattern, "");
  if (text) text = text.charAt(0).toLocaleUpperCase("vi") + text.slice(1);
  return text;
}

/** Alt đã làm sạch: có chữ, không quá trần. Quá trần thì loại, không cắt cụt. */
const altSchema = z
  .string()
  .transform(clean)
  .pipe(z.string().min(3).max(COVER_ALT_MAX));

/**
 * Bóc JSON ra khỏi câu trả lời. Chế độ JSON của Gemini đã ràng buộc hình dạng,
 * nhưng đổi model là có thể mất ràng buộc ấy — cùng cách với `classify.ts`.
 */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const start = text.indexOf("{");
  const candidate = fenced?.[1] ?? (start >= 0 ? text.slice(start, text.lastIndexOf("}") + 1) : "");
  if (!candidate.trim()) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

/**
 * Đọc đầu ra mô hình thành `{vi, en}`, hoặc `null`.
 *
 * Một trong hai thứ tiếng hỏng là loại cả cặp: hai ô do cùng một lượt nhìn ảnh
 * sinh ra, một ô vô nghĩa là dấu hiệu lượt ấy hỏng, và nửa kết quả thì người
 * biên tập khó nhận ra ô nào đáng ngờ.
 */
export function parseCoverAlt(text: string): CoverAlt | null {
  const raw = rawSchema.safeParse(extractJson(text));
  if (!raw.success) return null;
  const vi = altSchema.safeParse(raw.data.vi);
  const en = altSchema.safeParse(raw.data.en);
  if (!vi.success || !en.success) return null;
  return { vi: vi.data, en: en.data };
}

type AltPair = { vi: string | null | undefined; en: string | null | undefined };

/**
 * Lúc LƯU: ô alt nào phải nhờ mô hình điền.
 *
 * - Ô trống → điền.
 * - Ảnh bìa đổi so với CSDL mà ô gửi lên còn y nguyên alt cũ trong CSDL → alt
 *   ấy tả ảnh CŨ, tức là sai cho ảnh mới (scripts/set-cover-alt.ts: "thay ảnh
 *   bìa thì alt cũ thành sai"). Coi như trống.
 * - Ô người biên tập đã gõ khác alt cũ → giữ nguyên, không bao giờ ghi đè.
 *
 * `previousCover` so với URL GỬI LÊN (trước `intakeCover`): bìa cũ trỏ ra ngoài
 * mà lượt này mới sao về R2 thì URL đổi nhưng vẫn là cùng một tấm ảnh.
 */
export function altFieldsToFill({
  cover,
  alt,
  previousCover = null,
  previousAlt = null,
}: {
  cover: string | null | undefined;
  alt: AltPair;
  previousCover?: string | null;
  previousAlt?: AltPair | null;
}): { vi: boolean; en: boolean } {
  if (!cover?.trim()) return { vi: false, en: false };
  const coverChanged = (previousCover ?? "").trim() !== cover.trim();

  const needs = (field: "vi" | "en"): boolean => {
    const current = alt[field]?.trim() ?? "";
    if (!current) return true;
    const old = previousAlt?.[field]?.trim() ?? "";
    return coverChanged && old !== "" && current === old;
  };

  return { vi: needs("vi"), en: needs("en") };
}

/**
 * Trong FORM: đổi ảnh bìa thì ô alt có phải xoá không.
 *
 * `anchor` là chữ ô ấy mang khi gắn với ảnh trước — alt nạp từ CSDL, hoặc alt
 * mô hình vừa điền. Ô còn đúng chữ ấy nghĩa là chưa ai sửa tay, nên nó tả ảnh
 * cũ: xoá. Ô đã khác anchor là chữ người biên tập gõ: để yên.
 */
export function isAltTiedToOldCover(current: string | null | undefined, anchor: string): boolean {
  const value = current?.trim() ?? "";
  return value !== "" && value === anchor.trim();
}
