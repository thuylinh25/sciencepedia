import { NextRequest } from "next/server";

import { localeSchema } from "@/lib/validations";
import { getGlossaryDetail } from "@/server/glossary";

export const runtime = "nodejs";

/**
 * Chi tiết mục từ cho modal "Xem chi tiết".
 *
 * Được phép fetch phía client, khác với thân bài: modal chỉ mở khi người đọc
 * bấm, và cùng nội dung đó đã có bản render sẵn trên server ở
 * `/[locale]/glossary/[slug]` cho crawler và người không bật JS.
 *
 * Không có rate limit: dữ liệu công khai, đọc thuần, và nằm sau cache CDN.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const locale = localeSchema.catch("vi").parse(
    request.nextUrl.searchParams.get("locale"),
  );

  const detail = await getGlossaryDetail(slug, locale);
  if (!detail) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return Response.json(detail, {
    headers: {
      // Cùng nhịp với `revalidate = 300` của trang bài viết: sửa định nghĩa thì
      // tooltip và modal cập nhật trong cùng một khoảng.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
