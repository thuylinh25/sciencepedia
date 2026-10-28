/**
 * Khung lưu ý gắn theo danh mục — dữ liệu biên tập, không phải điều hướng.
 *
 * Danh mục và cây cha–con nằm ở CSDL (`Category.parentId`): thêm "Sơ cứu" hay
 * "Bệnh học" dưới `suc-khoe` là thêm một hàng, menu và thẻ trên trang Sức khoẻ
 * tự có. Riêng LỜI LƯU Ý thì ở đây, trong code: mỗi câu là một phán quyết biên
 * tập (science-editor) và có bản vi/en trong `messages/*.json`. Để nó thành ô
 * sửa được trong form quản trị là chỗ câu chữ trôi khỏi lần duyệt — cùng lý do
 * dấu duyệt mục từ chỉ đến từ `glossary.json`.
 *
 * Danh mục con KẾ THỪA lưu ý của cha khi không có lưu ý riêng: "Sơ cứu" thêm
 * sau dưới `suc-khoe` tự mang khung "không thay thế tư vấn y tế" mà không cần
 * sửa file này. Chỉ một bậc, vì cây danh mục chỉ có hai tầng.
 */
export type CategoryNoticeKind = "health" | "traditional";

const NOTICES: Record<string, CategoryNoticeKind> = {
  "suc-khoe": "health",
  // Loại "traditional" từng gắn cho ba nhóm Tác động cột sống / Bấm huyệt /
  // Y học cổ truyền (công dụng được MÔ TẢ theo trường phái, không trình bày
  // như hiệu quả đã chứng minh). Cả ba nhóm đã bị xóa khỏi CSDL ngày
  // 2026-10-28 theo quyết định của Linh — xem
  // `scripts/remove-traditional-categories.ts`. Loại khung vẫn giữ ở đây
  // cho một nhóm truyền thống tương lai nếu có quyết định biên tập mới.
};

export function categoryNotice(
  slug: string,
  parentSlug?: string | null,
): CategoryNoticeKind | null {
  return NOTICES[slug] ?? (parentSlug ? (NOTICES[parentSlug] ?? null) : null);
}
