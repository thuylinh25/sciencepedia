import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { Link } from "@/i18n/navigation";

/** Khung hai cột cho trang đăng nhập / đăng ký. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>

          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Nửa phải mang tinh thần NASA: nền vũ trụ, một câu trích.

          `items-center` chứ không `items-end`: câu trích trước đây dính sát
          đáy cột, nên hai phần ba trên của nửa màn hình là nền trống trơn
          trong khi cột trái đã kín chữ. Canh giữa theo chiều dọc thì câu trích
          ngang tầm mắt với ô nhập, và khoảng trống chia đều hai đầu thay vì
          dồn hết lên trên. */}
      <aside className="bg-cosmos starfield relative hidden items-center overflow-hidden p-12 lg:flex">
        {/* Dấu ngoặc kép lớn nằm SAU câu trích.

            Vẽ bằng ký tự `"` trong `font-display` chứ không phải một icon:
            dấu ngoặc của chính bộ chữ đang dùng cho câu trích thì cùng một
            hình dáng, nên nó đọc ra như phần phóng to của câu — không phải
            một món trang trí mượn ở đâu về.

            `select-none` và `aria-hidden`: nó không phải nội dung, và bôi đen
            câu trích mà dính thêm một dấu ngoặc mồ côi là phiền.

            Độ mờ rất thấp (6%): nó phải đọc ra như một vệt sáng trên nền vũ
            trụ, không phải một chữ cái. Đậm hơn thì chữ trắng của câu trích
            nằm đè lên nó và mất tương phản — chính ràng buộc đã ghi cho thiên
            hà ở hero. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-4 font-display text-[22rem] leading-none font-bold text-white/[0.06] select-none"
        >
          “
        </span>

        {/* Cỡ chữ 2xl → 3xl, chừng +12%. Câu trích là thứ duy nhất trong nửa
            màn hình này, nên nó chịu được — và ở 2xl nó trông như một dòng
            phụ chú bị bỏ quên giữa khoảng trống. */}
        <blockquote className="relative max-w-md text-star">
          <p className="font-display text-3xl leading-snug font-medium text-balance text-white">
            Ở đâu đó, một điều gì đó tuyệt vời đang chờ được biết đến.
          </p>
          <footer className="mt-5 text-sm text-white/60">— Carl Sagan</footer>
        </blockquote>
      </aside>
    </div>
  );
}
