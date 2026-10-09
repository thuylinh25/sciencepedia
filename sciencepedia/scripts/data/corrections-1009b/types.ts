/**
 * Kiểu dữ liệu cho `scripts/apply-corrections-2026-10-09-b.ts`. Mỗi bài một tệp kế hoạch trong
 * thư mục này; văn bản thay lấy NGUYÊN VĂN từ mục D của phiếu
 * `docs/content/checks/2026-10-08/<slug>.md`.
 */
export type Field = "title" | "summary" | "content" | "seoTitle" | "seoDescription";

export type Fix =
  /** Thay đúng một chỗ khớp nguyên văn. */
  | { field: Field; find: string; replace: string; why: string }
  /**
   * Thay CẢ mục: từ dòng tiêu đề `section` (khớp nguyên dòng, đúng một lần) tới trước tiêu đề
   * cùng cấp hoặc cấp cao hơn kế tiếp (hoặc hết bài). Tiểu mục cấp sâu hơn nằm trong mục bị thay.
   * `replace: ""` là xoá mục.
   */
  | { field: "content"; section: string; replace: string; why: string }
  /** Chèn một khối ngay TRƯỚC dòng tiêu đề `before` (khớp nguyên dòng, đúng một lần). */
  | { field: "content"; before: string; insert: string; why: string };

export type SourceIn = {
  title: string;
  publisher: string;
  doi?: string;
  url?: string | null;
  year: number;
  tier: number;
};

export type Plan = {
  slug: string;
  /** Ghi chú Revision (bản TRƯỚC đính chính). */
  note: string;
  fixes: Fix[];
  /** Mục "Đọc thêm": [tiêu đề, slug] — bài phải đang PUBLISHED. */
  reading: readonly (readonly [string, string])[];
  sources: SourceIn[];
  /** Chuỗi không được còn ở bất kỳ trường nào sau khi sửa. */
  forbid?: string[];
  toDraft?: boolean;
};
