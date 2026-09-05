import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
  align = "left",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    /* Dưới `sm` phải xếp DỌC, không phải `flex-wrap`.

       `flex-wrap` nghe như đủ để link tự xuống dòng khi chật, nhưng không:
       khối tiêu đề mang `flex-1`, tức `flex-basis: 0`, nên nó co lại nhường
       chỗ cho link thay vì đẩy link sang hàng mới. Item có thể co thì hàng
       không bao giờ tràn, và hàng không tràn thì không có gì để wrap.

       Hệ quả trên điện thoại 360px: link "Xem tất cả bài viết" chiếm khoảng
       một nửa bề ngang, tiêu đề còn chưa tới 150px và "Bài viết nổi bật" phải
       xuống hai dòng — giữa một màn hình còn trống hẳn nửa bên phải.

       Từ `sm` trở lên mới có đủ chỗ cho cả hai đứng cùng hàng. */
    <div
      className={cn(
        /* `mb-6` dưới `sm`: 32px khoảng cách dưới tiêu đề là nhịp của màn hình
           rộng, còn trên điện thoại nó đẩy nội dung thật xuống dưới nếp gấp.
           12 chỗ dùng component này, nên đây là 12 lần tiết kiệm 8px. */
        "mb-6 flex gap-4 sm:mb-8",
        align === "center"
          ? "flex-col items-center text-center"
          : "flex-col items-start sm:flex-row sm:flex-wrap sm:items-end",
        className,
      )}
    >
      {/* `flex-1` chỉ có nghĩa khi đã xếp ngang. Ở chế độ cột nó làm khối tiêu
          đề giãn theo CHIỀU CAO, nên hoãn tới `sm` cùng lúc với `flex-row`. */}
      <div className={cn(align === "left" && "w-full sm:w-auto sm:flex-1")}>
        {/* Gạch vàng nhỏ — nhịp thị giác lặp lại của National Geographic */}
        <span
          className={cn(
            "mb-3 block h-1 w-10 rounded-full bg-accent",
            align === "center" && "mx-auto",
          )}
        />
        {/* `text-2xl` dưới `sm`, không phải `text-3xl`.

            Trả lại toàn bộ bề ngang cho tiêu đề (bỏ hàng ngang với link) là
            điều kiện CẦN nhưng chưa đủ. Ở 360px khung nội dung rộng 320px, mà
            tiêu đề dài nhất — "Mới trong kho tri thức", 22 ký tự — ở 30px đậm
            cần chừng 330px. Vẫn tràn, chỉ là tràn ít hơn trước.

            24px thì 22 ký tự còn chừng 264px, dư chỗ cho cả bản tiếng Anh
            ("New in the library") lẫn các tiêu đề động như tên thẻ.

            KHÔNG dùng `whitespace-nowrap` để ép một dòng: vài chỗ truyền tiêu
            đề động (tên thẻ, tên danh mục) không có trần độ dài, và ở đó
            nowrap đổi một dòng gãy lấy một dòng tràn ra ngoài màn hình.

            Bậc giữa `sm:text-3xl` giữ nhịp: 640px không cần tới 36px, và nhảy
            thẳng 24 → 36 làm chữ giật một nấc thấy rõ ở đúng ngưỡng đó. */}
        <h2 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-base text-pretty text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {href && linkLabel && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 text-sm font-medium text-primary-strong"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {children}
    </div>
  );
}
