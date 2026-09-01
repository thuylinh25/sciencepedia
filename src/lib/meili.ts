import { MeiliSearch, type Index } from "meilisearch";
import type { Article, Category, Tag } from "@prisma/client";

import { cleanQuery } from "@/lib/query-text";

export const ARTICLES_INDEX = "articles";

export type ArticleDocument = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  /**
   * Nội dung đã bỏ markdown, cắt bớt để index nhẹ.
   *
   * CẢNH BÁO: `body`/`bodyEn` được đánh chỉ mục để TÌM KIẾM nhưng không nằm
   * trong `displayedAttributes`, nên chúng luôn `undefined` trên các hit trả
   * về từ `searchArticles()`. Kiểu này mô tả tài liệu GỬI LÊN index, không
   * phải tài liệu nhận về. Cần thân bài thì đọc từ Postgres.
   */
  body: string;
  bodyEn: string;
  categorySlug: string;
  categoryName: string;
  categoryNameEn: string;
  tags: string[];
  tagNames: string[];
  status: string;
  featured: boolean;
  coverImage: string | null;
  readingTime: number;
  views: number;
  publishedAt: number | null;
};

let client: MeiliSearch | null = null;

export function meili(): MeiliSearch {
  if (!client) {
    const host = process.env.MEILISEARCH_HOST;
    if (!host) throw new Error("MEILISEARCH_HOST chưa được cấu hình");
    client = new MeiliSearch({
      host,
      apiKey: process.env.MEILISEARCH_MASTER_KEY,
    });
  }
  return client;
}

export function articlesIndex(): Index<ArticleDocument> {
  return meili().index<ArticleDocument>(ARTICLES_INDEX);
}

/** Tạo index + cấu hình. Chạy khi seed / reindex / khởi động lần đầu. */
export async function ensureIndex() {
  const c = meili();
  try {
    await c.getIndex(ARTICLES_INDEX);
  } catch {
    await c.createIndex(ARTICLES_INDEX, { primaryKey: "id" });
  }

  const index = articlesIndex();
  await index.updateSettings({
    searchableAttributes: [
      "title",
      "titleEn",
      "summary",
      "summaryEn",
      "tagNames",
      "categoryName",
      "categoryNameEn",
      "body",
      "bodyEn",
    ],
    filterableAttributes: ["categorySlug", "tags", "status", "featured"],
    sortableAttributes: ["publishedAt", "views", "readingTime"],
    displayedAttributes: [
      "id",
      "slug",
      "title",
      "titleEn",
      "summary",
      "summaryEn",
      "categorySlug",
      "categoryName",
      "categoryNameEn",
      "tags",
      "tagNames",
      "coverImage",
      "readingTime",
      "views",
      "publishedAt",
      "featured",
    ],
    /**
     * Bỏ `views:desc` khỏi ranking rules.
     *
     * Để nó ở đây nghĩa là một bài nhiều lượt xem nhưng ít liên quan vẫn có
     * thể vượt lên trên bài khớp chính xác — sai với một bách khoa toàn thư.
     * Ai muốn xếp theo độ phổ biến thì dùng tham số `sort=popular`, khi đó
     * SORT_MAP đưa `views:desc` vào một cách tường minh.
     */
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
    /**
     * KHÔNG dùng stopWords — đã thử và nó gây hại.
     *
     * stopWords loại từ khỏi INDEX. Khi đó tài liệu không còn token "what"/"is",
     * nên truy vấn "What is CRISPR?" có hai từ đầu không khớp gì cả; với
     * matchingStrategy "last" (cần khớp từ đầu câu) kết quả về RỖNG, dù chỉ
     * riêng "CRISPR" thì tìm ra ngay. Đo được:
     *
     *   có stopWords : "What is CRISPR?" -> RỖNG        | "CRISPR" -> crispr-la-gi
     *   có stopWords : "Tell me about the gut microbiome" -> RỖNG
     *
     * Cách đúng là để nguyên các từ chức năng trong index và dùng
     * matchingStrategy "frequency" khi tìm: nó bỏ đúng những từ phổ biến nhất
     * (chính là từ chức năng) trước, mà không phá cấu trúc truy vấn.
     *
     * Bài học nữa nếu sau này định thêm lại: không bao giờ đưa từ tiếng Việt
     * vừa là từ chức năng vừa là thuật ngữ vào đây — "sao" (Sao Hoả),
     * "mặt" (Mặt Trời), "trời", "nước", "khí", "ánh".
     */
    stopWords: [],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: { maxTotalHits: 2000 },
  });
}

function stripMarkdown(md: string, max = 4000) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export type ArticleWithRelations = Article & {
  category: Pick<Category, "slug" | "name" | "nameEn">;
  tags: { tag: Pick<Tag, "slug" | "name" | "nameEn"> }[];
};

export function toDocument(article: ArticleWithRelations): ArticleDocument {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    titleEn: article.titleEn ?? article.title,
    summary: article.summary,
    summaryEn: article.summaryEn ?? article.summary,
    body: stripMarkdown(article.content),
    bodyEn: stripMarkdown(article.contentEn ?? ""),
    categorySlug: article.category.slug,
    categoryName: article.category.name,
    categoryNameEn: article.category.nameEn,
    tags: article.tags.map((t) => t.tag.slug),
    tagNames: article.tags.flatMap((t) => [t.tag.name, t.tag.nameEn]),
    status: article.status,
    featured: article.featured,
    coverImage: article.coverImage,
    readingTime: article.readingTime,
    views: article.views,
    publishedAt: article.publishedAt ? article.publishedAt.getTime() : null,
  };
}

/**
 * Đồng bộ một bài viết lên Meilisearch.
 * Bài chưa PUBLISHED sẽ bị gỡ khỏi index thay vì thêm vào.
 * Lỗi search không được phép làm hỏng thao tác CRUD — chỉ log lại.
 */
export async function syncArticle(article: ArticleWithRelations) {
  try {
    if (article.status !== "PUBLISHED") {
      await removeArticle(article.id);
      return;
    }
    await articlesIndex().addDocuments([toDocument(article)]);
  } catch (error) {
    console.error("[meili] syncArticle thất bại:", error);
  }
}

export async function removeArticle(id: string) {
  try {
    await articlesIndex().deleteDocument(id);
  } catch (error) {
    console.error("[meili] removeArticle thất bại:", error);
  }
}

export type SearchParams = {
  q: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sort?: "relevance" | "newest" | "popular";
};

const SORT_MAP: Record<NonNullable<SearchParams["sort"]>, string[] | undefined> =
  {
    relevance: undefined,
    newest: ["publishedAt:desc"],
    popular: ["views:desc"],
  };

/** Escape dấu nháy kép để tránh hỏng cú pháp filter của Meilisearch. */
const q = (value: string) => `"${value.replace(/"/g, '\\"')}"`;


export async function searchArticles({
  q: query,
  category,
  tags,
  limit = 20,
  offset = 0,
  sort = "relevance",
}: SearchParams) {
  const filter: string[] = [`status = ${q("PUBLISHED")}`];
  if (category) filter.push(`categorySlug = ${q(category)}`);
  if (tags?.length) filter.push(`tags IN [${tags.map(q).join(", ")}]`);

  const options = {
    filter,
    limit,
    offset,
    sort: SORT_MAP[sort],
    attributesToHighlight: ["title", "titleEn", "summary", "summaryEn"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
    facets: ["categorySlug", "tags"],
  };

  /**
   * Hai lượt tìm, vì không có matchingStrategy nào đúng cho mọi kiểu truy vấn
   * (đã đo bằng chính dữ liệu của dự án):
   *
   *   truy vấn                             | "last"  | "frequency"
   *   -------------------------------------|---------|------------
   *   "How does deep sleep affect memory?" | SAI     | ĐÚNG
   *   "Ho den hinh thanh nhu the nao?"     | ĐÚNG    | RỖNG
   *
   * "last" bỏ dần từ ở CUỐI, nên với câu hỏi tiếng Anh nó giữ lại "how does"
   * và bỏ mất từ khoá ở cuối câu. "frequency" bỏ từ phổ biến nhất trước nên
   * giữ được từ khoá, nhưng với câu tiếng Việt KHÔNG DẤU dài thì nó thu hẹp
   * quá mức và trả về rỗng.
   *
   * Nên: ưu tiên "frequency" cho độ chính xác, rỗng thì hạ xuống "last" cho
   * độ phủ. Lượt thứ hai chỉ chạy khi lượt đầu không có gì.
   */
  const index = articlesIndex();
  const cleaned = cleanQuery(query);

  const precise = await index.search(cleaned, {
    ...options,
    matchingStrategy: "frequency",
  });

  if (precise.hits.length > 0 || cleaned.trim() === "") return precise;

  return index.search(cleaned, { ...options, matchingStrategy: "last" });
}

/**
 * Tìm slug bài viết để làm NGỮ CẢNH cho trợ lý AI.
 *
 * Khác `searchArticles` ở mục tiêu: ở đây cần ĐỘ PHỦ, không phải độ chính xác.
 * Mô hình được dặn tự nói khi ngữ cảnh không đủ, nên đưa thừa một bài không
 * liên quan rẻ hơn nhiều so với bỏ sót bài đúng.
 *
 * Lý do phải gộp hai matchingStrategy — đo trên chính dữ liệu dự án:
 *
 *   "Vi sao Sao Hoa co mau do? Tra loi ngan."
 *     frequency -> giac-ngu-sau-va-tri-nho   (SAI: "loi"/"ngan" hút sang bài khác)
 *     last      -> sao-hoa                    (ĐÚNG)
 *
 *   "How does deep sleep affect memory?"
 *     frequency -> giac-ngu-sau-va-tri-nho   (ĐÚNG)
 *     last      -> he-mien-dich-nhan-dien-virus (SAI)
 *
 * Không chiến lược nào thắng cả hai, và cái sai vẫn trả về kết quả khác rỗng
 * nên không thể dùng "rỗng thì thử cái kia". Vì vậy chạy song song rồi xếp
 * theo hạng tốt nhất giữa hai lượt.
 */
export async function searchSlugsForContext(
  query: string,
  limit = 5,
): Promise<string[]> {
  const index = articlesIndex();
  const cleaned = cleanQuery(query);
  const base = {
    filter: [`status = ${q("PUBLISHED")}`],
    limit,
    attributesToRetrieve: ["slug"],
  };

  const [byFrequency, byLast] = await Promise.all([
    index.search(cleaned, { ...base, matchingStrategy: "frequency" }),
    index.search(cleaned, { ...base, matchingStrategy: "last" }),
  ]);

  const bestRank = new Map<string, number>();
  for (const hits of [byFrequency.hits, byLast.hits]) {
    hits.forEach((hit, position) => {
      const current = bestRank.get(hit.slug);
      if (current === undefined || position < current) {
        bestRank.set(hit.slug, position);
      }
    });
  }

  return [...bestRank.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}
