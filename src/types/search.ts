/**
 * Kết quả tìm kiếm trả về từ /api/search.
 *
 * Hình dạng này do `src/lib/search.ts` chuẩn hoá, giống nhau bất kể backend là
 * Meilisearch hay Postgres — phía client không cần biết đang dùng cái nào.
 */
export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  summary: string;
  summaryEn: string | null;
  categorySlug: string;
  categoryName: string;
  categoryNameEn: string;
  coverImage: string | null;
  readingTime: number;
  views: number;
  publishedAt: number | null;
  /** Đã thoát HTML, chỉ còn lại thẻ <mark> — an toàn để render */
  titleHtml: string;
  summaryHtml: string;
};

export type SearchResponse = {
  hits: SearchHit[];
  total: number;
  page: number;
  backend: "meilisearch" | "postgres";
};
