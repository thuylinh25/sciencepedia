import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  /** Bỏ trống ở mục cuối — đó là trang hiện tại, không phải link. */
  href?: string;
  /** Chấm màu lĩnh vực đứng trước nhãn. */
  dotColor?: string;
};

/**
 * Đường dẫn phân cấp.
 *
 * Trang bài viết là nơi phần lớn người đọc rơi thẳng vào từ Google, không có
 * lịch sử điều hướng nào phía sau. Trước đây chỗ này chỉ là hai link rời nằm
 * cạnh nhau trong một <nav> phẳng: không có gốc "Trang chủ", không có <ol>, nên
 * trình đọc màn hình không đọc ra được đây là một đường dẫn phân cấp và không
 * đếm được vị trí. Dữ liệu BreadcrumbList JSON-LD đã đúng ba bậc từ trước —
 * phần hiển thị mới là phần lệch.
 *
 * Server Component: chỉ hiển thị.
 */
export async function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const t = await getTranslations("common");

  return (
    <nav aria-label={t("breadcrumb")} className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  aria-hidden
                />
              )}

              {item.dotColor && (
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                />
              )}

              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                /* Mục cuối là trang hiện tại: không phải link, và aria-current
                   nói rõ điều đó thay vì để người dùng bàn phím đoán. */
                <span
                  aria-current="page"
                  /* Tiêu đề bài viết có thể rất dài; đường dẫn không được xuống
                     ba dòng trên máy 390px chỉ vì mục cuối. */
                  className={cn(
                    "max-w-[24ch] truncate sm:max-w-[40ch]",
                    last && "font-medium text-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
