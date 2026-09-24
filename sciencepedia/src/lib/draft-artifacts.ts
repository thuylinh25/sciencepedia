/**
 * Dấu vết công cụ soạn thảo AI còn sót trong văn bản bài.
 *
 * Ngày 2026-09-24, bài tia vũ trụ lên trang với năm ký hiệu `【1-03d267】` giữa
 * thân bài: dấu trích dẫn nội bộ của công cụ đã soạn nháp, dán nguyên sang form
 * quản trị. Không ai đọc lại bắt được, vì người đọc lướt coi nó như chú thích.
 *
 * Những mẫu dưới đây KHÔNG BAO GIỜ là nội dung hợp lệ của một bài tiếng Việt
 * hay tiếng Anh, nên dùng được để chặn cứng mà không lo chặn nhầm:
 *
 * - `【…】` ngắn: ngoặc kép kiểu CJK bọc mã trích dẫn.
 * - `citeturn0search3`, `turn0news1`: mã trích dẫn của công cụ tìm kiếm.
 * - `:contentReference[oaicite:0]{index=0}`: dấu tham chiếu khi sao chép.
 *
 * Một nơi định nghĩa, hai nơi dùng: schema của form quản trị (chặn lúc lưu)
 * và `scripts/check-publish.ts` (chặn lúc xuất bản, rà cả kho).
 */
const PATTERNS: RegExp[] = [
  /【[^】\n]{1,40}】/g,
  /\bcite(?:turn\d+[a-z]+\d+)+/gi,
  /\bturn\d+(?:search|news|view|fetch|image)\d+\b/gi,
  /:?contentReference\[oaicite:\d+\](?:\{index=\d+\})?/gi,
];

/** Các dấu vết tìm thấy, theo thứ tự xuất hiện. Rỗng nghĩa là sạch. */
export function findDraftArtifacts(text: string): string[] {
  return PATTERNS.flatMap((pattern) => [...text.matchAll(pattern)].map((m) => m[0]));
}
