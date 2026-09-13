import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/utils";
import {
  getAllCategories,
  getAllTags,
  getPublishedSlugs,
} from "@/server/queries";

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
    ...entry("/space-map", { changeFrequency: "monthly", priority: 0.7 }),

    /* Bốn công cụ còn lại. Chúng bị bỏ sót chứ không bị loại: cùng hạng với
       /solar-system và /space-map ngay trên, cùng là trang tĩnh có chữ, và
       cùng được liệt kê trong menu Công cụ lẫn ở footer. Một trang nằm trong
       điều hướng mà vắng mặt trong sitemap là một mâu thuẫn tự mình tạo ra. */
    ...entry("/milky-way", { changeFrequency: "monthly", priority: 0.7 }),
    ...entry("/universe", { changeFrequency: "monthly", priority: 0.7 }),
    ...entry("/zoom", { changeFrequency: "monthly", priority: 0.7 }),
    ...entry("/models", { changeFrequency: "monthly", priority: 0.6 }),

    /* Liên hệ: ưu tiên thấp, gần như không đổi, nhưng phải có mặt vì nó là
       một trong ba trang mà bên xét duyệt ứng dụng đi tìm — cùng nhóm với
       /privacy và /terms bên dưới. */
    ...entry("/contact", { changeFrequency: "yearly", priority: 0.4 }),
    // Nội dung đổi mỗi ngày theo dữ liệu NASA, nên changeFrequency là daily
    // dù bản thân trang là static.
    ...entry("/earth-live", { changeFrequency: "daily", priority: 0.7 }),
    ...entry("/assistant", { changeFrequency: "monthly", priority: 0.7 }),

    /* KHÔNG có trong sitemap, và đó là chủ ý:
         /login /register /forgot-password /reset-password — đã noindex
         /profile /bookmarks /admin                        — cần đăng nhập
         /search                                           — trang kết quả
         /random                                           — chuyển hướng
       Thêm bất kỳ route nào ở trên vào đây là mời Google lập chỉ mục một
       trang trống hoặc một trang riêng tư. */

    /* Hai trang pháp lý. Ưu tiên thấp và gần như không đổi, nhưng PHẢI có
       mặt: bên xét duyệt ứng dụng (Facebook, Google) tự tìm chúng bằng máy,
       và một URL chính sách chỉ sống trong footer thì khó chứng minh là công
       khai hơn hẳn một URL nằm trong sitemap. */
    ...entry("/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    ...entry("/terms", { changeFrequency: "yearly", priority: 0.3 }),
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
