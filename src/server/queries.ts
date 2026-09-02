import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Trường tối thiểu để dựng thẻ bài viết — tránh kéo cả `content`. */
export const articleCardSelect = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  summary: true,
  summaryEn: true,
  coverImage: true,
  readingTime: true,
  views: true,
  featured: true,
  publishedAt: true,
  category: {
    select: { slug: true, name: true, nameEn: true, color: true, icon: true },
  },
  tags: {
    select: { tag: { select: { slug: true, name: true, nameEn: true } } },
  },
  author: { select: { name: true, image: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCard = Prisma.ArticleGetPayload<{
  select: typeof articleCardSelect;
}>;

const PUBLISHED = { status: "PUBLISHED" as const };

// ---------------------------------------------------------------- Bài viết

export const getFeaturedArticles = unstable_cache(
  async (take = 3) =>
    prisma.article.findMany({
      where: { ...PUBLISHED, featured: true },
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ["featured-articles"],
  { revalidate: 300, tags: ["articles"] },
);

export const getLatestArticles = unstable_cache(
  async (take = 6) =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ["latest-articles"],
  { revalidate: 120, tags: ["articles"] },
);

export const getPopularArticles = unstable_cache(
  async (take = 5) =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: articleCardSelect,
      orderBy: { views: "desc" },
      take,
    }),
  ["popular-articles"],
  { revalidate: 600, tags: ["articles"] },
);

export type ListArticlesParams = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  sort?: "newest" | "popular" | "alphabetical";
};

export async function listArticles({
  page = 1,
  perPage = 12,
  categorySlug,
  tagSlug,
  sort = "newest",
}: ListArticlesParams = {}) {
  const where: Prisma.ArticleWhereInput = {
    ...PUBLISHED,
    ...(categorySlug
      ? {
          category: {
            OR: [
              { slug: categorySlug },
              { parent: { slug: categorySlug } },
            ],
          },
        }
      : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
  };

  const orderBy: Prisma.ArticleOrderByWithRelationInput =
    sort === "popular"
      ? { views: "desc" }
      : sort === "alphabetical"
        ? { title: "asc" }
        : { publishedAt: "desc" };

  const findPage = (target: number) =>
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy,
      skip: (target - 1) * perPage,
      take: perPage,
    });

  const requested = Math.max(1, Math.trunc(page) || 1);
  const [optimistic, total] = await Promise.all([
    findPage(requested),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Trang vượt quá số trang thật (link cũ, URL gõ tay, bài bị gỡ sau khi trang
  // được cache) phải rơi về trang cuối thay vì trả lưới rỗng — và `page` trả ra
  // là trang thật sự đang hiển thị, để thanh phân trang không trỏ đi đâu khác.
  const current = Math.min(requested, totalPages);
  const items = current === requested ? optimistic : await findPage(current);

  return { items, total, page: current, perPage, totalPages };
}

/** `cache` của React gộp các lần gọi trùng trong cùng một request. */
export const getArticleBySlug = cache(async (slug: string) =>
  prisma.article.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      category: {
        select: {
          slug: true,
          name: true,
          nameEn: true,
          color: true,
          icon: true,
          parent: { select: { slug: true, name: true, nameEn: true } },
        },
      },
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true, image: true, bio: true } },
      sources: { orderBy: { year: "desc" } },
      _count: { select: { comments: true } },
    },
  }),
);

export type ArticleDetail = NonNullable<
  Awaited<ReturnType<typeof getArticleBySlug>>
>;

/** Bài liên quan: ưu tiên trùng thẻ, bù thêm bằng bài cùng danh mục. */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  tagIds: string[],
  take = 3,
) {
  const byTag = tagIds.length
    ? await prisma.article.findMany({
        where: {
          ...PUBLISHED,
          id: { not: articleId },
          tags: { some: { tagId: { in: tagIds } } },
        },
        select: articleCardSelect,
        orderBy: { views: "desc" },
        take,
      })
    : [];

  if (byTag.length >= take) return byTag;

  const byCategory = await prisma.article.findMany({
    where: {
      ...PUBLISHED,
      categoryId,
      id: { not: articleId, notIn: byTag.map((a) => a.id) },
    },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
    take: take - byTag.length,
  });

  return [...byTag, ...byCategory];
}

/**
 * Tăng lượt đọc thêm một.
 *
 * Được gọi từ `/api/articles/[id]/view`, tức từ trình duyệt của người đọc, chứ
 * không phải từ server component của trang bài viết. Lý do: trang đặt
 * `revalidate = 300` và được prerender, nên phần lớn lượt truy cập đến từ bản
 * cache và server component không chạy lại — đếm ở đó thì bỏ sót gần hết. Đã
 * đo: sáu lượt truy cập liên tiếp mà con số không nhúc nhích.
 *
 * Lỗi ở đây được nuốt: một lượt đọc không đáng để làm hỏng gì.
 */
export async function incrementViews(id: string) {
  // Chốt phòng xa: nếu sau này lại có chỗ nào gọi hàm này trong lúc prerender,
  // mỗi lần deploy sẽ cộng khống một lượt cho từng bài được dựng sẵn.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  try {
    await prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error("[views] không tăng được lượt xem:", error);
  }
}

/**
 * Danh sách slug đã xuất bản — dùng cho `generateStaticParams` và sitemap.
 *
 * KHÔNG bọc `unstable_cache` ở đây. Next lưu kết quả của nó xuống `.next/cache`
 * và khôi phục thư mục đó giữa các lần build (Vercel cũng vậy), nên một bản
 * build có thể đọc lại danh sách cũ và lặng lẽ bỏ sót những bài mới đăng.
 * Đúng chuyện đã xảy ra: bài mới có mặt trong sitemap nhưng không được
 * prerender, phải chờ render theo yêu cầu ở lần truy cập đầu tiên.
 *
 * Hàm này chỉ chạy lúc build và lúc revalidate, mỗi lần một truy vấn — không
 * đáng để đánh đổi lấy nguy cơ build ra thiếu trang.
 */
export const getPublishedSlugs = cache(async () =>
  prisma.article.findMany({
    where: PUBLISHED,
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  }),
);

// ---------------------------------------------------------------- Danh mục

/**
 * Số bài PUBLISHED của từng danh mục, đã cộng dồn cả nhánh con.
 *
 * `_count.articles` của Prisma chỉ đếm bài gán trực tiếp và không lọc trạng
 * thái. Bài viết luôn nằm ở danh mục lá (ví dụ "Hệ Mặt Trời"), nên danh mục gốc
 * như "Vũ trụ" hiển thị 0 bài dù `listArticles` vẫn trả về bài của cả nhánh.
 */
const publishedCountByCategory = cache(async () => {
  const [groups, tree] = await Promise.all([
    prisma.article.groupBy({
      by: ["categoryId"],
      where: PUBLISHED,
      _count: { _all: true },
    }),
    prisma.category.findMany({ select: { id: true, parentId: true } }),
  ]);

  const parentOf = new Map(tree.map(({ id, parentId }) => [id, parentId]));
  const totals = new Map<string, number>(tree.map(({ id }) => [id, 0]));

  for (const group of groups) {
    // Cộng cho chính danh mục và mọi tổ tiên của nó. `seen` chặn vòng lặp vô
    // hạn nếu cây danh mục bị hỏng (hai danh mục trỏ vòng về nhau).
    const seen = new Set<string>();
    let cursor: string | null | undefined = group.categoryId;

    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      totals.set(cursor, (totals.get(cursor) ?? 0) + group._count._all);
      cursor = parentOf.get(cursor);
    }
  }

  return totals;
});

/** Thay `_count.articles` bằng con số đã cộng dồn ở trên. */
function withRolledUpCount<
  T extends { id: string; _count: { articles: number } },
>(category: T, totals: Map<string, number>): T {
  return {
    ...category,
    _count: { ...category._count, articles: totals.get(category.id) ?? 0 },
  };
}

export const getRootCategories = unstable_cache(
  async () => {
    const [categories, totals] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          children: {
            orderBy: { order: "asc" },
            include: { _count: { select: { articles: true } } },
          },
          _count: { select: { articles: true } },
        },
      }),
      publishedCountByCategory(),
    ]);

    return categories.map((category) => ({
      ...withRolledUpCount(category, totals),
      children: category.children.map((child) =>
        withRolledUpCount(child, totals),
      ),
    }));
  },
  ["root-categories"],
  { revalidate: 600, tags: ["categories", "articles"] },
);

export const getAllCategories = unstable_cache(
  async () => {
    const [categories, totals] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { _count: { select: { articles: true } } },
      }),
      publishedCountByCategory(),
    ]);

    return categories.map((category) => withRolledUpCount(category, totals));
  },
  ["all-categories"],
  { revalidate: 600, tags: ["categories", "articles"] },
);

export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { slug: true, name: true, nameEn: true } },
      children: {
        orderBy: { order: "asc" },
        include: { _count: { select: { articles: true } } },
      },
      _count: { select: { articles: true } },
    },
  });
  if (!category) return null;

  const totals = await publishedCountByCategory();

  return {
    ...withRolledUpCount(category, totals),
    children: category.children.map((child) =>
      withRolledUpCount(child, totals),
    ),
  };
});

// ---------------------------------------------------------------- Thẻ

export const getAllTags = unstable_cache(
  async () =>
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { articles: true } } },
    }),
  ["all-tags"],
  { revalidate: 600, tags: ["tags"] },
);

export const getTagBySlug = cache(async (slug: string) =>
  prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } },
  }),
);

// ---------------------------------------------------------------- Thống kê

export const getSiteStats = unstable_cache(
  async () => {
    const [articles, categories, tags, views] = await Promise.all([
      prisma.article.count({ where: PUBLISHED }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.article.aggregate({ where: PUBLISHED, _sum: { views: true } }),
    ]);

    return {
      articles,
      categories,
      tags,
      views: views._sum.views ?? 0,
    };
  },
  ["site-stats"],
  { revalidate: 900, tags: ["articles", "categories", "tags"] },
);

export async function getAdminStats() {
  const [total, published, drafts, users, views, recent, byCategory] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: PUBLISHED }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.article.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          views: true,
          updatedAt: true,
          category: { select: { name: true, nameEn: true, color: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({
        select: {
          name: true,
          nameEn: true,
          color: true,
          _count: { select: { articles: true } },
        },
        orderBy: { order: "asc" },
      }),
    ]);

  return {
    total,
    published,
    drafts,
    users,
    views: views._sum.views ?? 0,
    recent,
    byCategory,
  };
}
