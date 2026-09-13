import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/layout/logo";
import { Link } from "@/i18n/navigation";

/**
 * Khung hai cột cho trang đăng nhập / đăng ký.
 *
 * `title` là `ReactNode` chứ không phải `string`: tiêu đề có một từ mang màu
 * thương hiệu, và chỗ đặt màu nằm TRONG câu chứ không quanh câu. Trang gọi
 * dựng nó bằng `t.rich`, nên câu vẫn nằm trọn trong tệp ngôn ngữ — cắt câu ra
 * làm hai khoá để nối lại bằng JSX là cách chắc chắn dịch sai ở ngôn ngữ có
 * trật tự từ khác.
 */
export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
}) {
  const t = await getTranslations("auth");
  const tFooter = await getTranslations("footer");

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* Cột trái là flex dọc chứ không căn giữa cả khối: footer phải neo ở
          đáy cột, không bị kéo vào giữa và dính đáy form. */}
      <div className="flex flex-col px-6 py-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Link href="/" className="lg:hidden">
              <Logo />
            </Link>

            <h1 className="mt-8 font-display text-4xl font-bold tracking-tight lg:mt-0">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>
          </div>
        </div>

        {/* Footer tối giản: bản quyền và hai trang pháp lý, phân cách bằng
            gạch đứng, có một đường kẻ mảnh phía trên.

            Đường kẻ làm việc mà khoảng trắng không làm nổi ở đây — cột trái
            kết thúc bằng một dòng chữ nhỏ, và không có gì phân định thì nó đọc
            ra như phần đuôi của form thay vì một tầng khác của trang. */}
        <footer className="mx-auto mt-10 w-full max-w-sm border-t pt-5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
            <span>© {new Date().getFullYear()} Sciencepedia</span>
            <span aria-hidden className="text-muted-foreground/30">
              |
            </span>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              {tFooter("privacy")}
            </Link>
            <span aria-hidden className="text-muted-foreground/30">
              |
            </span>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              {tFooter("terms")}
            </Link>
          </p>
        </footer>
      </div>

      {/* Nửa phải: nền vũ trụ xanh, một câu trích.

          `auth-aside` thay cho `bg-cosmos` ở riêng trang này. `bg-cosmos` ngả
          gần đen vì nó sinh ra cho hero — nơi có chữ, nút và ảnh đè lên. Ở đây
          nửa màn hình chỉ có một câu trích, nên nền chịu được màu xanh sâu hơn
          và cần nó: hai cột cùng gần đen thì đường chia giữa chúng biến mất và
          bố cục đọc ra như một khối tối liền. */}
      <aside className="auth-aside starfield deep-space relative hidden items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="relative w-full max-w-lg">
          {/* Dấu ngoặc kép lớn, vẽ bằng ký tự của chính bộ chữ đang dùng cho
              câu trích — cùng một hình dáng, nên nó đọc ra như phần phóng to
              của câu chứ không phải một món trang trí mượn ở đâu về.

              Ở mức mờ cũ (6%) nó gần như biến mất trên nền xanh. Nay 14% và
              mang chính màu xanh nhạt của nền, nên nó hiện ra là một hình
              khối chứ không phải một vệt bẩn — vẫn đủ nhạt để chữ trắng đè lên
              không mất tương phản. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-14 -left-3 font-display text-[11rem] leading-none font-bold text-sky-300/[0.14] select-none"
          >
            “
          </span>

          <blockquote className="relative">
            <p className="font-display text-[2.6rem] leading-[1.25] font-bold text-balance text-white">
              {t.rich("quote", {
                hl: (chunks) => (
                  <span className="text-primary">{chunks}</span>
                ),
              })}
            </p>
            <footer className="mt-7 text-base text-white/55">
              — {t("quoteAuthor")}
            </footer>
          </blockquote>
        </div>
      </aside>
    </div>
  );
}
