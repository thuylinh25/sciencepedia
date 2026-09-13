import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/layout/logo";
import { Link } from "@/i18n/navigation";

/** Khung hai cột cho trang đăng nhập / đăng ký. */
export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const tFooter = await getTranslations("footer");

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* Cột trái là flex dọc chứ không còn căn giữa cả khối.

          Lý do là cái footer mới ở dưới: nếu cả cột vẫn `items-center` thì
          footer bị kéo vào giữa và dính đáy form, đọc ra như một phần của
          form. Tách làm hai — phần co giãn ở trên ôm form vào chính giữa,
          footer neo ở đáy cột — thì footer đứng đúng chỗ người ta tìm nó. */}
      <div className="flex flex-col px-6 py-10">
        <div className="flex flex-1 items-center justify-center">
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

        {/* Footer tối giản, đúng ba mẩu: bản quyền và hai trang pháp lý.

            Trang đăng nhập nằm ngoài `SiteFooter` về mặt thị giác — footer
            đầy đủ cao gần bằng cả form và kéo mắt ra khỏi việc đang làm. Nhưng
            bỏ hẳn mọi lối ra pháp lý ở một trang thu thập thông tin đăng nhập
            thì lại thiếu. Ba mẩu chữ nhỏ là mức vừa đủ.

            `text-xs` và độ mờ thấp: nó phải đọc được khi người ta đi tìm, và
            không tranh chỗ khi người ta không tìm. */}
        <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground/70">
          <span>© {new Date().getFullYear()} Sciencepedia</span>
          <span aria-hidden>·</span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            {tFooter("privacy")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            {tFooter("terms")}
          </Link>
        </footer>
      </div>

      {/* Nửa phải mang tinh thần NASA: nền vũ trụ, một câu trích.

          `items-center justify-center` chứ không `items-end`: câu trích trước
          đây dính sát đáy cột, nên hai phần ba trên của nửa màn hình là nền
          trống trơn trong khi cột trái đã kín chữ. Canh giữa cả hai trục thì
          câu trích ngang tầm mắt với ô nhập, và khoảng trống chia đều bốn
          phía thay vì dồn về một góc.

          `deep-space` là lớp chiều sâu thêm 2026-09-13: tinh vân xanh rất mờ,
          ba cụm sao và ít bụi không gian. Nó chồng lên `bg-cosmos` +
          `starfield` chứ không thay — xem chú thích ở `globals.css` để biết vì
          sao nó là một lớp riêng thay vì sửa thẳng `starfield`. */}
      <aside className="bg-cosmos starfield deep-space relative hidden items-center justify-center overflow-hidden p-12 lg:flex">
        {/* Bọc câu trích và dấu ngoặc trong MỘT khối định vị.

            Trước đây dấu ngoặc neo vào chính `aside` (`-top-16 left-4`), nên
            khi câu trích được canh giữa thì hai thứ rời nhau ra: dấu ngoặc ở
            góc trên bên trái màn hình, câu trích ở giữa. Neo cả hai vào cùng
            một khối thì dấu ngoặc luôn nằm đúng phía trên bên trái câu, ở mọi
            bề rộng. */}
        <div className="relative w-full max-w-md">
          {/* Dấu ngoặc kép lớn nằm SAU câu trích.

              Vẽ bằng ký tự `"` trong `font-display` chứ không phải một icon:
              dấu ngoặc của chính bộ chữ đang dùng cho câu trích thì cùng một
              hình dáng, nên nó đọc ra như phần phóng to của câu — không phải
              một món trang trí mượn ở đâu về.

              `select-none` và `aria-hidden`: nó không phải nội dung, và bôi
              đen câu trích mà dính thêm một dấu ngoặc mồ côi là phiền.

              Độ mờ rất thấp (6%): nó phải đọc ra như một vệt sáng trên nền vũ
              trụ, không phải một chữ cái. Đậm hơn thì chữ trắng của câu trích
              nằm đè lên nó và mất tương phản — chính ràng buộc đã ghi cho
              thiên hà ở hero. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-12 font-display text-[20rem] leading-none font-bold text-white/[0.06] select-none"
          >
            “
          </span>

          {/* Cỡ chữ 3xl → 2,125rem, chừng +13%; giãn dòng 1,375 → 1,45.

              Câu trích là thứ duy nhất trong nửa màn hình này nên nó chịu được
              cỡ lớn, và ở 3xl nó vẫn còn đọc ra như một dòng phụ chú giữa
              khoảng trống. Giãn dòng nới theo cỡ chữ: cùng một `leading-snug`
              ở cỡ lớn hơn sẽ làm ba dòng dính vào nhau. */}
          <blockquote className="relative text-star">
            <p className="font-display text-[2.125rem] leading-[1.45] font-medium text-balance text-white">
              Ở đâu đó, một điều gì đó tuyệt vời đang chờ được biết đến.
            </p>
            <footer className="mt-6 text-sm text-white/60">— Carl Sagan</footer>
          </blockquote>
        </div>
      </aside>
    </div>
  );
}
