import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { locales } from "@/i18n/routing";

/**
 * Làm mới cache sau khi bài viết đổi trong CSDL. Đường DUY NHẤT: form quản trị,
 * API bài viết, cron đồng bộ nguồn đều gọi thẳng; script chạy ngoài Next (vd.
 * `scripts/publish.ts`) gọi qua `POST /api/revalidate` (`scripts/revalidate-site.ts`).
 *
 * Phạm vi — chỉ những gì thật sự đọc dữ liệu bài, không phải cả site:
 *   - tag `articles`: mọi `unstable_cache` đọc bài, nên cũng là trang chủ và
 *     `/categories` (đếm bài) — hai trang ISR mang tag này;
 *   - `/[locale]` và `/[locale]/articles`: gọi tường minh, không trông vào việc
 *     trang tình cờ còn đọc một query mang tag;
 *   - trang của từng slug, cho cả hai ngôn ngữ.
 * Thanh điều hướng, footer, trang tĩnh KHÔNG mang tag `articles` (xem
 * `getNavigationCategories`) nên không bị đụng tới.
 *
 * Trang bài phải dùng ĐƯỜNG DẪN THẬT (`/vi/articles/<slug>`). Tag ngầm của nó
 * là `_N_T_/vi/articles/<slug>`; dạng cũ `revalidatePath("/[locale]/articles/<slug>",
 * "page")` sinh tag `_N_T_/[locale]/articles/<slug>/page` — không khớp trang nào,
 * nên sửa bài từng chỉ hiện ra khi hết TTL 300 giây.
 *
 * Trả về các đường dẫn trang bài đã làm mới, để người gọi in ra.
 */
export function revalidateArticles(slugs: Iterable<string> = []): string[] {
  revalidateTag("articles");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/articles", "page");

  const paths: string[] = [];
  for (const slug of new Set(slugs)) {
    for (const locale of locales) {
      const path = `/${locale}/articles/${slug}`;
      revalidatePath(path);
      paths.push(path);
    }
  }
  return paths;
}
