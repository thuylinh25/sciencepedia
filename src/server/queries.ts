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

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
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

/** Tăng lượt xem — không chặn render, lỗi ở đây không nên làm hỏng trang. */
export async function incrementViews(id: string) {
  // Prerender lúc `next build` cũng chạy `after()`. Nếu không chặn ở đây thì
  // mỗi lần deploy lại cộng khống một lượt cho từng bài được dựng sẵn, đồng
  // thời ném thêm hàng chục lệnh ghi vào build.
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

export const getPublishedSlugs = unstable_cache(
  async () =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ["published-slugs"],
  { revalidate: 3600, tags: ["articles"] },
);

// ---------------------------------------------------------------- Danh mục

export const getRootCategories = unstable_cache(
  async () =>
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
  ["root-categories"],
  { revalidate: 600, tags: ["categories"] },
);

export const getAllCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { articles: true } } },
    }),
  ["all-categories"],
  { revalidate: 600, tags: ["categories"] },
);

export const getCategoryBySlug = cache(async (slug: string) =>
  prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { slug: true, name: true, nameEn: true } },
      children: {
        orderBy: { order: "asc" },
        include: { _count: { select: { articles: true } } },
      },
      _count: { select: { articles: true } },
    },
  }),
);

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
