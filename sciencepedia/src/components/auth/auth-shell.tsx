import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AuthArtwork } from "@/components/auth/auth-artwork";
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
            ra như phần đuôi của form thay vì một tầng khác của trang.

            HAI KHỐI chứ không một dòng chữ chảy tự do. Bản trước để cả bản
            quyền lẫn hai liên kết trong một `flex-wrap` duy nhất, và ở bề
            ngang 24rem thì "Điều khoản sử dụng" rơi xuống dòng dưới một mình —
            trông như chữ bị tràn chứ không như một hàng hai phần. Tách làm hai
            nhóm thì lúc chật, chỗ gãy rơi vào ĐÚNG khe giữa hai nhóm: bản
            quyền một dòng, hai liên kết một dòng, cả hai đều trọn vẹn. */}
        <footer className="mx-auto mt-10 w-full max-w-sm border-t pt-5 text-xs text-muted-foreground/70">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p>© {new Date().getFullYear()} Sciencepedia</p>

            <p className="flex items-center gap-x-2.5">
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
          </div>
        </footer>
      </div>

      {/* Nửa phải: nền vũ trụ xanh, một câu trích.

          `auth-aside` thay cho `bg-cosmos` ở riêng trang này. `bg-cosmos` ngả
          gần đen vì nó sinh ra cho hero — nơi có chữ, nút và ảnh đè lên. Ở đây
          nửa màn hình chỉ có một câu trích, nên nền chịu được màu xanh sâu hơn
          và cần nó: hai cột cùng gần đen thì đường chia giữa chúng biến mất và
          bố cục đọc ra như một khối tối liền.

          `pb-44`: cột căn giữa theo chiều dọc, nhưng phần đáy đã dành cho hình
          minh hoạ. Đệm đáy lớn đẩy câu trích lên phía trên tâm, tức là nhường
          hẳn dải dưới cho hình thay vì để hai thứ tranh nhau một chỗ. */}
      <aside className="auth-aside starfield deep-space relative hidden flex-col justify-center overflow-hidden px-12 pt-12 pb-44 lg:flex">
        <div className="relative z-10 w-full max-w-lg">
          {/* Dấu ngoặc kép lớn, vẽ bằng ký tự của chính bộ chữ đang dùng cho
              câu trích — cùng một hình dáng, nên nó đọc ra như phần phóng to
              của câu chứ không phải một món trang trí mượn ở đâu về.

              ĐẶT TRONG LUỒNG, không `absolute`. Bản trước ghim nó ở
              `-top-14 -left-3` so với khối trích; con số đó chỉ đúng với đúng
              một cỡ chữ và đúng một độ dài câu, nên khi câu dài thêm một dòng
              hoặc bộ chữ dựng lại, dấu ngoặc trườn xuống đè lên chính dòng đầu
              — lỗi đã thấy trên máy thật. Một khối nằm trong luồng thì không
              có toạ độ nào để mà sai: chữ luôn bắt đầu bên dưới nó.

              `leading-[0.55]` cắt bỏ phần khoảng trắng phía dưới glyph, để
              dấu ngoặc ngồi sát câu trích như một dấu mở thật, chứ không trôi
              lửng cách một khoảng trống vô cớ. */}
          <span
            aria-hidden
            className="block font-display text-[7rem] leading-[0.55] font-bold text-sky-300/[0.18] select-none"
          >
            “
          </span>

          <blockquote className="relative mt-6">
            <p className="font-display text-[2.6rem] leading-[1.25] font-bold text-balance text-white">
              {t.rich("quote", {
                hl: (chunks) => <span className="text-primary">{chunks}</span>,
              })}
            </p>
            {/* Dấu đóng, đối xứng với dấu mở ở trên.

                Một dấu mở không có dấu đóng thì không phải cặp ngoặc kép —
                nó là một hình trang trí ngẫu nhiên đặt cạnh câu, và mắt đọc
                ra chính điều đó. Cặp đầy đủ mới đóng khung được câu trích.

                Căn PHẢI và đặt sau câu, trước dòng ghi tác giả: đó là chỗ dấu
                đóng đứng trong một câu trích thật — sau lời được trích, trước
                người nói nó. */}
            <span
              aria-hidden
              className="block text-right font-display text-[7rem] leading-[0.55] font-bold text-sky-300/[0.18] select-none"
            >
              ”
            </span>

            <footer className="mt-7 text-base text-white/55">
              — {t("quoteAuthor")}
            </footer>
          </blockquote>
        </div>

        {/* Hình minh hoạ NẰM TRỌN trong khung, góc dưới phải.

            Bản trước cho nó tràn qua hai mép (`-right-24 -bottom-20`) để trông
            lớn hơn khung chứa — thủ pháp mượn từ thiên hà ở hero. Ở hero nó
            hợp vì thứ bị cắt là một vệt sáng không có hình thù rõ; ở đây thứ
            bị cắt là một QUYỂN SÁCH MỞ có đường viền dứt khoát, nên mắt không
            đọc ra "hình lớn hơn khung" mà đọc ra "hình tải thiếu" — đúng như
            người dùng báo lại.

            Cỡ tính bằng `min()` chứ không `max-w-[…%]`: trên màn hình rất rộng
            thì 20rem là đủ cho một món trang trí, còn trên màn hình vừa thì
            38% giữ cho nó không lấn sang câu trích.

            Vị trí góc dưới phải vẫn là ràng buộc tương phản như cũ: câu trích
            là chữ trắng và nó ở nửa trên bên trái, nên vùng sáng nhất của hình
            phải ở xa chỗ đó. */}
        <AuthArtwork className="pointer-events-none absolute right-8 bottom-8 z-0 w-[min(20rem,38%)] opacity-90" />
      </aside>
    </div>
  );
}
