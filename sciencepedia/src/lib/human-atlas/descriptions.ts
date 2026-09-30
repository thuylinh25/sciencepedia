/**
 * Mô tả ngắn (gloss 1-2 câu) của cấu trúc giải phẫu, khoá theo mã FMA.
 *
 * Bảng `descriptions.generated.json` do `scripts/atlas-descriptions.ts` sinh:
 * chọn cấu trúc chính, lấy câu mở đầu Wikipedia (map qua FMA), rồi science-editor
 * dịch + thẩm định phần tiếng Anh. Khoá đã TRẢI theo mọi mã cùng khái niệm nên
 * cả hai bên trái/phải và từng mảnh đều tra được một mục.
 *
 * Hai loại, dán nhãn khác nhau trên UI:
 *   reviewed = true  → bản tiếng Việt đã qua science-editor: hiện như mọi nội
 *                      dung khác, KHÔNG nhãn "do AI".
 *   reviewed = false → câu tiếng Anh nguyên văn từ nguồn chưa dịch (số ít mục
 *                      science-editor trả REWORK vì nguồn tả cấp nhóm).
 *
 * Câu chữ có nguồn (Wikipedia, CC BY-SA) trích dẫn ngay dưới — nên phần dữ kiện
 * không đi qua gate biên tập của site như bài viết; nguồn tự mang thẩm quyền.
 */
import DESCRIPTIONS from "./descriptions.generated.json";

export type StructureDescription = {
  text: string;
  lang: "vi" | "en";
  /** true = bản Việt đã duyệt (không nhãn AI); false = câu nguồn tiếng Anh. */
  reviewed: boolean;
  /** Tên bài + URL nguồn để ghi công. */
  title: string;
  url: string;
};

const MAP = DESCRIPTIONS as Record<string, StructureDescription>;

/** Mô tả theo mã FMA đầu tiên khớp (thử khái niệm rồi tới từng mảnh). */
export function structureDescription(...fmaIds: (string | null | undefined)[]): StructureDescription | null {
  for (const id of fmaIds) {
    if (id && MAP[id]) return MAP[id];
  }
  return null;
}
