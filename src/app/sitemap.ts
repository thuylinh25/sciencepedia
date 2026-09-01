import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/utils";
import { getAllCategories, getAllTags, getPublishedSlugs } from "@/server/queries";

/** Sinh cả hai bản ngôn ngữ cho mỗi đường dẫn, kèm hreflang alternates. */
function entry(
  path: string,
  options: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path === "/" ? "" : path}`),
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency ?? "weekly",
    priority: options.priority ?? 0.6,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((code) => [
          code,
          absoluteUrl(`/${code}${path === "/" ? "" : path}`),
        ]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = [
    ...entry("/", { changeFrequency: "daily", priority: 1 }),
    ...entry("/articles", { changeFrequency: "daily", priority: 0.9 }),
    ...entry("/categories", { priority: 0.8 }),
    ...entry("/tags", { priority: 0.5 }),
    ...entry("/solar-system", { changeFrequency: "monthly", priority: 0.8 }),
    ...entry("/assistant", { changeFrequency: "monthly", priority: 0.7 }),
  ];

  let articles: Awaited<ReturnType<typeof getPublishedSlugs>> = [];
  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  let tags: Awaited<ReturnType<typeof getAllTags>> = [];

  try {
    [articles, categories, tags] = await Promise.all([
      getPublishedSlugs(),
      getAllCategories(),
      getAllTags(),
    ]);
  } catch (error) {
    // Không có DB lúc build thì vẫn xuất sitemap với các trang tĩnh
    console.warn("[sitemap] không đọc được dữ liệu:", (error as Error).message);
    return staticEntries;
  }

  return [
    ...staticEntries,

    ...articles.flatMap((article) =>
      entry(`/articles/${article.slug}`, {
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    ),

    ...categories.flatMap((category) =>
      entry(`/categories/${category.slug}`, { priority: 0.7 }),
    ),

    ...tags.flatMap((tag) => entry(`/tags/${tag.slug}`, { priority: 0.4 })),
  ];
}
