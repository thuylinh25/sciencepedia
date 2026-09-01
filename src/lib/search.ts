import "server-only";

import { searchArticles as searchMeili, searchSlugsForContext } from "@/lib/meili";
import {
  searchPostgres,
  searchSlugsPostgres,
  type SearchHitRow,
} from "@/lib/search-postgres";
import { escapeHtml } from "@/lib/highlight";

/**
 * Một cửa duy nhất cho mọi tìm kiếm trong ứng dụng.
 *
 * Có `MEILISEARCH_HOST`  -> dùng Meilisearch (chịu lỗi chính tả, facet, nhanh hơn).
 * Không có, hoặc nó chết -> tự chuyển sang full-text search của Postgres.
 *
 * Nhờ lớp này mà website chạy đủ chức năng trên Vercel khi chưa host
 * Meilisearch ở đâu: chỉ cần bỏ trống MEILISEARCH_HOST.
 */

export type SearchBackend = "meilisearch" | "postgres" | "none";

export type UnifiedHit = {
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
  /** Tiêu đề đã bọc <mark>, đã thoát HTML — an toàn để render */
  titleHtml: string;
  /** Tóm tắt đã bọc <mark>, đã thoát HTML — an toàn để render */
  summaryHtml: string;
};

export type UnifiedSearchResult = {
  hits: UnifiedHit[];
  total: number;
  backend: SearchBackend;
};

export function meiliConfigured() {
  return Boolean(process.env.MEILISEARCH_HOST);
}

/**
 * ts_headline của Postgres trả về chuỗi đã chèn <mark>. Không được đưa thẳng
 * vào dangerouslySetInnerHTML: phần văn bản quanh nó là nội dung biên tập viên
 * nhập. Thoát toàn bộ HTML rồi khôi phục đúng cặp <mark> — cùng cách xử lý
 * highlight của Meilisearch trong src/lib/highlight.ts.
 */
function safeHighlight(raw: string | null, fallback: string): string {
  if (!raw) return escapeHtml(fallback);
  return escapeHtml(raw)
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}

function fromPostgres(row: SearchHitRow): UnifiedHit {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    summary: row.summary,
    summaryEn: row.summaryEn,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    categoryNameEn: row.categoryNameEn,
    coverImage: row.coverImage,
    readingTime: row.readingTime,
    views: row.views,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : null,
    // Postgres chỉ highlight phần summary; tiêu đề để nguyên
    titleHtml: escapeHtml(row.title),
    summaryHtml: safeHighlight(row.headline, row.summary),
  };
}

type MeiliHit = {
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
  _formatted?: {
    title?: string;
    titleEn?: string;
    summary?: string;
    summaryEn?: string;
  };
};

function fromMeili(hit: MeiliHit): UnifiedHit {
  return {
    id: hit.id,
    slug: hit.slug,
    title: hit.title,
    titleEn: hit.titleEn,
    summary: hit.summary,
    summaryEn: hit.summaryEn,
    categorySlug: hit.categorySlug,
    categoryName: hit.categoryName,
    categoryNameEn: hit.categoryNameEn,
    coverImage: hit.coverImage,
    readingTime: hit.readingTime,
    views: hit.views,
    publishedAt: hit.publishedAt,
    titleHtml: safeHighlight(hit._formatted?.title ?? null, hit.title),
    summaryHtml: safeHighlight(hit._formatted?.summary ?? null, hit.summary),
  };
}

export type SearchInput = {
  query: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
  sort?: "relevance" | "newest" | "popular";
};

export async function search({
  query,
  categorySlug,
  limit = 20,
  offset = 0,
  sort = "relevance",
}: SearchInput): Promise<UnifiedSearchResult> {
  if (query.trim().length < 2) {
    return { hits: [], total: 0, backend: meiliConfigured() ? "meilisearch" : "postgres" };
  }

  if (meiliConfigured()) {
    try {
      const result = await searchMeili({
        q: query,
        category: categorySlug,
        limit,
        offset,
        sort,
      });

      return {
        hits: (result.hits as unknown as MeiliHit[]).map(fromMeili),
        total: result.estimatedTotalHits ?? result.hits.length,
        backend: "meilisearch",
      };
    } catch (error) {
      // Meilisearch chết thì hạ xuống Postgres thay vì trả trang trắng
      console.warn(
        "[search] Meilisearch không phản hồi, dùng Postgres:",
        (error as Error).message,
      );
    }
  }

  try {
    const result = await searchPostgres({
      query,
      categorySlug,
      limit,
      offset,
      sort,
    });
    return {
      hits: result.hits.map(fromPostgres),
      total: result.total,
      backend: "postgres",
    };
  } catch (error) {
    console.error("[search] Postgres cũng thất bại:", error);
    return { hits: [], total: 0, backend: "none" };
  }
}

/**
 * Lấy slug làm ngữ cảnh cho trợ lý AI.
 * Ưu tiên Meilisearch (gộp hai matchingStrategy), rơi xuống Postgres nếu cần.
 */
export async function searchSlugsForRag(
  query: string,
  limit = 5,
): Promise<{ slugs: string[]; backend: SearchBackend }> {
  if (meiliConfigured()) {
    try {
      const slugs = await searchSlugsForContext(query, limit);
      if (slugs.length > 0) return { slugs, backend: "meilisearch" };
    } catch (error) {
      console.warn(
        "[search] RAG: Meilisearch lỗi, dùng Postgres:",
        (error as Error).message,
      );
    }
  }

  try {
    return {
      slugs: await searchSlugsPostgres(query, limit),
      backend: "postgres",
    };
  } catch (error) {
    console.error("[search] RAG: Postgres cũng thất bại:", error);
    return { slugs: [], backend: "none" };
  }
}
