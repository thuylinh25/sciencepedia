import "server-only";

import { prisma } from "@/lib/prisma";
import { stripDiacritics } from "@/lib/utils";
import { cleanQuery } from "@/lib/query-text";

/**
 * Full-text search bằng Postgres — phương án dự phòng khi không có Meilisearch.
 *
 * Dùng cột `searchVector` (tsvector, GENERATED ALWAYS ... STORED) tạo trong
 * migration 20260901120000_article_search_vector, có GIN index.
 *
 * Nhờ vậy website chạy đủ chức năng trên Vercel mà không cần host thêm dịch vụ
 * nào. Meilisearch vẫn tốt hơn (chịu lỗi chính tả, facet, gợi ý tức thời), nên
 * nếu có nó thì `src/lib/search.ts` sẽ ưu tiên dùng.
 */

export type SearchHitRow = {
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
  publishedAt: Date | null;
  /** Đoạn tóm tắt đã bọc <mark> quanh từ khớp, do ts_headline sinh ra */
  headline: string | null;
  rank: number;
};

/**
 * Chuyển câu người dùng gõ thành tsquery.
 *
 * Không dùng `websearch_to_tsquery` với chuỗi thô: nó hiểu cả toán tử OR/-/""
 * mà người dùng không có ý dùng, và một từ sai chính tả sẽ làm rỗng kết quả vì
 * mọi từ được AND với nhau. Ở đây tự dựng truy vấn OR có tiền tố (`:*`) để
 * "vu tru" khớp cả "vũ trụ" lẫn "vũ trụ học".
 *
 * Bỏ dấu bằng chính hàm dùng cho cột searchVector, nếu không hai bên lệch nhau.
 */
function toTokens(input: string): string[] {
  // cleanQuery bỏ từ đệm/ra lệnh. Bắt buộc ở đây vì Postgres AND toàn bộ các
  // từ — chỉ một từ đệm như "tra loi ngan" là đủ làm rỗng kết quả.
  return stripDiacritics(cleanQuery(input))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    // Giới hạn 12 từ: dài hơn chỉ làm chậm mà không tăng chất lượng
    .slice(0, 12);
}

/**
 * Dựng hai biến thể tsquery, dùng theo thứ tự:
 *
 *   AND (`&`) — chính xác: mọi từ phải xuất hiện. "gut & microbiome"
 *   OR  (`|`) — phủ rộng : chỉ cần một từ. Dùng khi AND không ra gì.
 *
 * Vì sao cần cả hai: chỉ dùng OR thì "vu tru" khớp 17/17 bài (bất kỳ bài nào
 * có "vu" hoặc "tru"), làm số kết quả vô nghĩa. Chỉ dùng AND thì một từ gõ sai
 * hoặc một từ đệm còn sót lại sẽ làm rỗng toàn bộ.
 *
 * `:*` cho khớp tiền tố, nhờ đó "vu tru" khớp cả "vu tru hoc".
 */
function toTsQueries(input: string): { and: string; or: string } | null {
  const tokens = toTokens(input);
  if (tokens.length === 0) return null;

  const prefixed = tokens.map((token) => `${token}:*`);
  return { and: prefixed.join(" & "), or: prefixed.join(" | ") };
}

export type PostgresSearchParams = {
  query: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
  sort?: "relevance" | "newest" | "popular";
};

export async function searchPostgres(
  params: PostgresSearchParams,
): Promise<{ hits: SearchHitRow[]; total: number }> {
  const queries = toTsQueries(params.query);
  if (!queries) return { hits: [], total: 0 };

  // Chính xác trước, phủ rộng sau — chỉ chạy lượt OR khi AND không ra gì
  const strict = await runSearch(queries.and, params);
  if (strict.total > 0) return strict;

  return runSearch(queries.or, params);
}

async function runSearch(
  tsQuery: string,
  {
    categorySlug,
    limit = 20,
    offset = 0,
    sort = "relevance",
  }: PostgresSearchParams,
): Promise<{ hits: SearchHitRow[]; total: number }> {
  // ORDER BY được chọn từ danh sách cố định, không nội suy dữ liệu người dùng
  const orderBy =
    sort === "newest"
      ? `a."publishedAt" DESC NULLS LAST`
      : sort === "popular"
        ? `a."views" DESC`
        : `rank DESC, a."views" DESC`;

  const categoryFilter = categorySlug
    ? `AND (c."slug" = $4 OR parent."slug" = $4)`
    : "";

  const params: unknown[] = [tsQuery, limit, offset];
  if (categorySlug) params.push(categorySlug);

  const hits = await prisma.$queryRawUnsafe<SearchHitRow[]>(
    `
    SELECT
      a."id",
      a."slug",
      a."title",
      a."titleEn",
      a."summary",
      a."summaryEn",
      c."slug"   AS "categorySlug",
      c."name"   AS "categoryName",
      c."nameEn" AS "categoryNameEn",
      a."coverImage",
      a."readingTime",
      a."views",
      a."publishedAt",
      ts_headline(
        'simple',
        sciencepedia_unaccent(coalesce(a."summary", '')),
        to_tsquery('simple', $1),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=40, MinWords=15, ShortWord=2, HighlightAll=FALSE'
      ) AS "headline",
      -- ts_rank_cd (cover density) + normalization 2 (chia theo độ dài tài liệu).
      -- ts_rank thường cộng dồn mọi lần khớp, nên một bài dài nhắc "sao" và
      -- "hoa" rải rác hàng chục lần vượt lên trên bài có đúng "Sao Hoả" ở tiêu
      -- đề. Đã đo: chỉ ts_rank_cd đưa sao-hoa lên đầu cho truy vấn "Sao Hoa".
      ts_rank_cd(a."searchVector", to_tsquery('simple', $1), 2) AS "rank"
    FROM "Article" a
    JOIN "Category" c ON c."id" = a."categoryId"
    LEFT JOIN "Category" parent ON parent."id" = c."parentId"
    WHERE a."status" = 'PUBLISHED'
      AND a."searchVector" @@ to_tsquery('simple', $1)
      ${categoryFilter}
    ORDER BY ${orderBy}
    LIMIT $2 OFFSET $3
    `,
    ...params,
  );

  const countParams: unknown[] = [tsQuery];
  if (categorySlug) countParams.push(categorySlug);

  const countRows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `
    SELECT count(*)::bigint AS count
    FROM "Article" a
    JOIN "Category" c ON c."id" = a."categoryId"
    LEFT JOIN "Category" parent ON parent."id" = c."parentId"
    WHERE a."status" = 'PUBLISHED'
      AND a."searchVector" @@ to_tsquery('simple', $1)
      ${categorySlug ? `AND (c."slug" = $2 OR parent."slug" = $2)` : ""}
    `,
    ...countParams,
  );

  return { hits, total: Number(countRows[0]?.count ?? 0) };
}

/** Lấy slug làm ngữ cảnh cho trợ lý AI. */
export async function searchSlugsPostgres(
  query: string,
  limit = 5,
): Promise<string[]> {
  const { hits } = await searchPostgres({ query, limit });
  return hits.map((hit) => hit.slug);
}

/** Kiểm tra cột searchVector đã tồn tại chưa — dùng cho /api/health. */
export async function isPostgresSearchReady(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Article' AND column_name = 'searchVector'
      ) AS "exists"
    `;
    return rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}
