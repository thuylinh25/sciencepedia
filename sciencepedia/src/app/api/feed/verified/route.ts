import type { NextRequest } from "next/server";

import { categoryNotice } from "@/lib/category-notices";
import { nextFeedOffset, parseFeedPage } from "@/lib/feed-page";
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
 *
 * Phân trang: `?limit=` (tối đa 50) và `?offset=`; `nextOffset` là offset của
 * trang sau, `null` ở trang cuối. Không tham số thì vẫn là 20 bài đầu.
 */
export async function GET(request: NextRequest) {
  const page = parseFeedPage(request.nextUrl.searchParams);
  const articles = await listVerifiedArticles(page.limit, page.offset);

  const items = articles.map((a) => ({
    slug: a.slug,
    url: absoluteUrl(`/vi/articles/${a.slug}`),
    title: a.title,
    summary: a.summary,
    // Bản EN chỉ trả khi bài CÓ cả tiêu đề lẫn tóm tắt tiếng Anh — trang /en
    // của bài chưa dịch là trang lặp nội dung (docs/architecture.md, mục SEO
    // bản /en), và kênh ngoài không được tự dịch bằng máy thay vào chỗ trống.
    en:
      a.titleEn && a.summaryEn
        ? {
            title: a.titleEn,
            summary: a.summaryEn,
            url: absoluteUrl(`/en/articles/${a.slug}`),
          }
        : null,
    coverImage: a.coverImage,
    coverImageAlt: a.coverImageAlt,
    publishedAt: a.publishedAt,
    reviewedAt: a.reviewedAt,
    category: a.category
      ? {
          slug: a.category.slug,
          name: a.category.name,
          nameEn: a.category.nameEn,
        }
      : null,
    notice: a.category
      ? categoryNotice(a.category.slug, a.category.parent?.slug)
      : null,
    tags: a.tags.map((t) => t.tag.name),
  }));

  return Response.json(
    { items, nextOffset: nextFeedOffset(page, articles.length) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
