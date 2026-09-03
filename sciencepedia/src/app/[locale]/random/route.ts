import { NextResponse } from "next/server";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getRandomPublishedSlug } from "@/server/queries";

/**
 * BẮT BUỘC. Không có dòng này Next sẽ prerender route lúc build và ghim vĩnh
 * viễn một bài — "ngẫu nhiên" thành "luôn luôn cùng một bài cho tới lần deploy
 * sau". `getRandomPublishedSlug` cũng cố ý không được bọc `unstable_cache` vì
 * cùng lý do.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale: Locale = (routing.locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : routing.defaultLocale;

  const slug = await getRandomPublishedSlug();

  // Kho rỗng thì đưa về danh sách bài, không 404: người đọc bấm "bài ngẫu
  // nhiên" và nhận trang lỗi sẽ tưởng link hỏng chứ không tưởng kho rỗng.
  const target = slug
    ? getPathname({ href: `/articles/${slug}`, locale })
    : getPathname({ href: "/articles", locale });

  // 307 chứ không 301/302: 301 bị trình duyệt và CDN nhớ vĩnh viễn, 302 vẫn có
  // thể bị cache ở tầng trung gian. Kèm no-store để chắc chắn không tầng nào
  // giữ lại, và noindex vì đây không phải một trang có nội dung.
  return NextResponse.redirect(new URL(target, request.url), {
    status: 307,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex",
    },
  });
}
