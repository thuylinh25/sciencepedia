import { stripDiacritics } from "@/lib/utils";

/**
 * Chuẩn hoá câu truy vấn người dùng gõ.
 *
 * Ở module riêng vì CẢ HAI backend tìm kiếm đều cần: Meilisearch
 * (`src/lib/meili.ts`) và Postgres FTS (`src/lib/search-postgres.ts`). Trước đây
 * chỉ nhánh Meilisearch lọc từ đệm, nên khi chạy trên Postgres, truy vấn
 * "Vi sao Sao Hoa co mau do? Tra loi ngan." không tìm ra bài Sao Hoả.
 */

/**
 * Từ đệm / từ ra lệnh cần bỏ Ở PHÍA TRUY VẤN (không phải phía index).
 *
 * Vì sao không dùng `stopWords` của Meilisearch: stopWords loại từ khỏi index,
 * khiến truy vấn chứa chúng khớp rỗng — đã đo: bật stopWords thì
 * "What is CRISPR?" trả RỖNG trong khi "CRISPR" trả đúng bài.
 *
 * Vì sao vẫn cần lọc: `matchingStrategy: "frequency"` của Meilisearch giữ lại
 * những từ HIẾM nhất, và một từ không tồn tại trong kho ("tell", "me") là hiếm
 * nhất tuyệt đối nên bị giữ và ép kết quả về rỗng. Postgres thì AND toàn bộ
 * các từ, nên một từ đệm cũng đủ làm rỗng.
 *
 * KHÔNG BAO GIỜ thêm từ tiếng Việt vừa là từ chức năng vừa là thuật ngữ:
 * "sao" (Sao Hoả), "mặt" (Mặt Trời), "trời", "nước", "khí", "ánh", "sâu",
 * "đen", "đỏ", "sáng".
 */
const QUERY_FILLERS = new Set([
  // Tiếng Anh — từ hỏi, đại từ, động từ ra lệnh
  "tell", "me", "us", "about", "please", "explain", "describe", "give",
  "show", "what", "whats", "which", "who", "how", "why", "when", "where",
  "is", "are", "am", "was", "were", "be", "been", "do", "does", "did",
  "can", "could", "would", "should", "will", "the", "a", "an", "of", "to",
  "for", "on", "in", "and", "or", "i", "you", "my", "your", "it", "its",
  "that", "this", "some", "any", "want", "know", "more", "info",
  "information", "overview", "summary", "summarize", "briefly", "short",
  // Tiếng Việt — chỉ từ chức năng thuần
  "hãy", "cho", "tôi", "mình", "bạn", "giải", "thích", "về", "là", "gì",
  "thế", "nào", "vì", "được", "bị", "của", "và", "các", "những", "một",
  "trả", "lời", "ngắn", "gọn", "kể", "nói", "biết", "muốn", "hỏi", "xin",
  "tóm", "tắt", "chi", "tiết", "vậy", "ạ", "nhé", "với", "trong", "khi",
  "đã", "sẽ", "này", "đó", "thì", "mà", "hoặc", "hay", "rất", "cũng",
]);

/**
 * Bản không dấu của danh sách trên — người dùng Việt thường gõ không dấu
 * ("vi sao", "tra loi ngan"), khi đó so khớp bản có dấu sẽ không ăn.
 */
const QUERY_FILLERS_NO_DIACRITICS = new Set(
  [...QUERY_FILLERS].map((word) => stripDiacritics(word)),
);

/**
 * Bỏ dấu câu và các từ đệm khỏi truy vấn.
 * Nếu sau khi lọc không còn gì (người dùng chỉ gõ toàn từ đệm), trả lại truy
 * vấn gốc để không biến một tìm kiếm hợp lệ thành rỗng.
 */
export function cleanQuery(input: string): string {
  const tokens = input
    .toLowerCase()
    .replace(/[?!.,;:"'()[\]{}]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const kept = tokens.filter(
    (token) =>
      !QUERY_FILLERS.has(token) &&
      !QUERY_FILLERS_NO_DIACRITICS.has(stripDiacritics(token)),
  );

  return kept.length > 0 ? kept.join(" ") : input;
}
