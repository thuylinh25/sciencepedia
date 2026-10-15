import type { NextRequest } from "next/server";

import { categoryNotice } from "@/lib/category-notices";
import { absoluteUrl } from "@/lib/utils";
import { listVerifiedArticles } from "@/server/queries";

export const runtime = "nodejs";

/**
 * GET /api/feed/verified — bài đã xuất bản và đã qua thẩm định, mới ký trước.
 *
 * Người dùng là repo `sciencepedia-social`: một job định kỳ đọc feed này rồi
 * tạo bài trên fanpage. Feed chỉ chứa trường đã công khai trên trang bài, cộng
 * `reviewedAt` và `notice` — để caption mang đúng khung lưu ý (sức khoẻ,
 * phương pháp truyền thống) như trang web, thay vì kênh ngoài tự đoán theo tên
 * danh mục.
 *
 * Công khai, đọc thuần, sau cache CDN 5 phút — job chạy thưa hơn thế nhiều.
 */
export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;
  const articles = await listVerifiedArticles(limit);

  const items = articles.map((a) => ({
    slug: a.slug,
    url: absoluteUrl(`/vi/articles/${a.slug}`),
    title: a.title,
    summary: a.summary,
    coverImage: a.coverImage,
    coverImageAlt: a.coverImageAlt,
    publishedAt: a.publishedAt,
    reviewedAt: a.reviewedAt,
    category: a.category
      ? { slug: a.category.slug, name: a.category.name }
      : null,
    notice: a.category
      ? categoryNotice(a.category.slug, a.category.parent?.slug)
      : null,
    tags: a.tags.map((t) => t.tag.name),
  }));

  return Response.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
