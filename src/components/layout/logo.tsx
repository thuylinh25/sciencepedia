import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Dấu hiệu nhận diện: khung chữ nhật vàng kiểu National Geographic,
 * bên trong là một quỹ đạo hành tinh tối giản.
 */
export function Logo({
  className,
  tone = "auto",
}: {
  className?: string;
  /**
   * `onDark` dùng khi logo nằm trên nền vũ trụ — hero tràn dưới header. Nền đó
   * tối ở CẢ HAI theme, nên đây không phải là trục light/dark mà là trục "nền
   * phía sau tối hay sáng". Ô vuông thương hiệu không đổi ở cả hai tone.
   */
  tone?: "auto" | "onDark";
}) {
  // useTranslations chạy được ở cả Server lẫn Client Component (next-intl v4);
  // Logo được dùng ở cả hai phía — chân trang (server) và header (client).
  const t = useTranslations("site");

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* Nền vàng, nét đen — khớp với icon ứng dụng đã cài.

          Trước đây là nền xanh `bg-accent` với nét trắng, tức người dùng thấy
          hai dấu hiệu nhận diện khác nhau cho cùng một sản phẩm: một cái trên
          màn hình chính điện thoại, một cái trên web.

          `bg-primary` + `text-primary-foreground` chứ không phải mã màu viết
          cứng: vàng thương hiệu nằm ở token, và `--primary-foreground` đã là
          màu tối (bắt buộc, vì vàng L≈0,86 không đi được với chữ trắng). Đổi
          bảng màu lần sau thì logo tự theo.

          `rounded-[30%]` thay `rounded-lg`: icon ứng dụng dùng dạng squircle
          bo sâu, `rounded-lg` cho ra một ô vuông bo nhẹ trông khác hẳn. */}
      <span className="relative grid size-9 place-items-center rounded-[30%] bg-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 text-primary-foreground"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4.4"
            stroke="currentColor"
            strokeWidth="1.6"
            transform="rotate(-24 12 12)"
          />
          <circle cx="20.2" cy="8.6" r="1.5" fill="currentColor" />
        </svg>
      </span>
      {/* data-wordmark: header ẩn khối chữ này ở máy hẹp để còn chỗ cho nút
          "Đăng nhập" dạng chữ. Drawer và trang đăng nhập có đủ chỗ nên vẫn hiện
          đầy đủ — vì vậy việc ẩn nằm ở nơi dùng, không nằm ở đây. */}
      <span data-wordmark className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate font-display text-base font-bold tracking-tight sm:text-lg",
            tone === "onDark" && "text-white",
          )}
        >
          Sciencepedia
        </span>
        <span
          className={cn(
            "hidden text-[10px] font-medium tracking-[0.18em] uppercase sm:block",
            tone === "onDark" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {t("wordmark")}
        </span>
      </span>
    </span>
  );
}
