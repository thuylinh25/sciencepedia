/**
 * Meilisearch trả về đoạn văn bản có chèn thẻ <mark> quanh từ khớp.
 * Không được đưa thẳng chuỗi đó vào dangerouslySetInnerHTML: tiêu đề bài viết
 * do biên tập viên nhập, nếu chứa HTML thì sẽ chạy trong trang.
 *
 * Cách an toàn: thoát toàn bộ HTML trước, rồi chỉ khôi phục đúng cặp
 * <mark>...</mark> mà chính chúng ta đã cấu hình làm highlightPreTag/PostTag.
 */
const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => ESCAPE[char]);
}

export function highlightToSafeHtml(input?: string | null): string {
  if (!input) return "";
  return escapeHtml(input)
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}
