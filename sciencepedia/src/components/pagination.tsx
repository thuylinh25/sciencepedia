import { getTranslations } from "next-intl/server";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Sinh dãy trang có dấu … khi số trang lớn. */
function pageRange(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (previous && current - previous > 1) result.push("gap");
    result.push(current);
    previous = current;
  }
  return result;
}

export async function Pagination({
  page,
  totalPages,
  perPage,
  itemsOnPage,
  basePath,
  extraQuery,
  className,
}: {
  page: number;
  totalPages: number;
  /** Số mục mỗi trang và số mục thật sự trả về — xem `lastPage` bên dưới. */
  perPage?: number;
  itemsOnPage?: number;
  basePath: string;
  extraQuery?: Record<string, string | undefined>;
  className?: string;
}) {
  const t = await getTranslations("common");

  // `totalPages` suy ra từ một truy vấn count riêng, còn danh sách đến từ truy
  // vấn khác. Nếu hai bên lệch nhau (count lấy từ cache cũ, backend tìm kiếm
  // trả total không khớp số hit) thì sẽ dựng link sang một trang rỗng. Trang
  // hiện tại trả về ít hơn `perPage` mục là bằng chứng chắc chắn rằng đã hết
  // dữ liệu — tin vào bằng chứng đó thay vì tin phép đếm.
  const short =
    perPage !== undefined && itemsOnPage !== undefined && itemsOnPage < perPage;
  const lastPage = short ? page : totalPages;

  if (lastPage <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(extraQuery ?? {})) {
      if (value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  /* size-11 = 44px: ngưỡng vùng chạm trên di động. size-10 (40px) cũ nằm dưới
     ngưỡng, mà phân trang là thứ luôn được bấm bằng ngón cái.

     Từ `sm` lên size-12 = 48px. Không phải để dễ bấm hơn — chuột đã đủ chính
     xác ở 44px — mà vì CÂN ĐỐI: hàng phân trang đứng dưới một lưới thẻ rộng
     cả nghìn pixel, và bảy nút 44px ở giữa khoảng trống ấy đọc ra như một
     dòng chú thích bị bỏ quên chứ không như điểm kết của danh sách. */
  const linkClass =
    "grid size-11 place-items-center rounded-full border text-sm font-medium transition-colors hover:bg-muted sm:size-12";

  /** Nút không bấm được: vẫn chiếm chỗ để hàng nút không nhảy khi sang trang. */
  const disabled = (icon: ReactNode, key: string) => (
    <span
      key={key}
      aria-hidden
      className={cn(linkClass, "pointer-events-none opacity-40")}
    >
      {icon}
    </span>
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 sm:gap-3",
        className,
      )}
    >
      {/* Về đầu và xuống cuối, ngoài lùi/tiến một trang.

          Hiện ở MỌI số trang, kể cả khi dãy chưa bị rút gọn bằng dấu … Với
          dưới 8 trang thì số 1 và số cuối đã nằm sẵn trên màn hình, nên hai
          nút này trỏ tới chỗ đã bấm được — tức có trùng lặp thật.

          Vẫn giữ, và đây là đánh đổi được chọn có ý thức: một hàng phân trang
          đổi THÀNH PHẦN theo số trang thì người dùng phải học hai phiên bản
          của cùng một thanh, và hai nút mép ngoài đổi chỗ giữa các lần tải là
          thứ gây khựng tay hơn hẳn một nút thừa. Cùng lập luận đã dùng cho nút
          tìm kiếm ở header — xem `site-header.tsx`.

          Nút bị vô hiệu vẫn chiếm chỗ, cùng lý do: hàng nút không được nhảy
          khi sang trang. */}
      {page > 1
        ? [
            <Link
              key="first"
              href={href(1)}
              className={linkClass}
              aria-label={t("firstPage")}
            >
              <ChevronsLeft className="size-4" />
            </Link>,
          ]
        : [disabled(<ChevronsLeft className="size-4" />, "first")]}

      {page > 1
        ? [
            <Link
              key="prev"
              href={href(page - 1)}
              className={linkClass}
              aria-label={t("previous")}
            >
              <ChevronLeft className="size-4" />
            </Link>,
          ]
        : [disabled(<ChevronLeft className="size-4" />, "prev")]}

      {pageRange(page, lastPage).map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              linkClass,
              item === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < lastPage
        ? [
            <Link
              key="next"
              href={href(page + 1)}
              className={linkClass}
              aria-label={t("next")}
            >
              <ChevronRight className="size-4" />
            </Link>,
          ]
        : [disabled(<ChevronRight className="size-4" />, "next")]}

      {page < lastPage
        ? [
            <Link
              key="last"
              href={href(lastPage)}
              className={linkClass}
              aria-label={t("lastPage")}
            >
              <ChevronsRight className="size-4" />
            </Link>,
          ]
        : [disabled(<ChevronsRight className="size-4" />, "last")]}
    </nav>
  );
}
