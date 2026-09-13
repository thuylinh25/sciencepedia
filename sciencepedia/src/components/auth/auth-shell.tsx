import type { ReactNode } from "react";
import Image from "next/image";
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
          đáy cột, không bị kéo vào giữa và dính đáy form.

          `short:` và `shorter:` là hai biến thể theo CHIỀU CAO cửa sổ, khai
          trong globals.css. Đây là lỗi chiều cao chứ không phải bề ngang:
          cùng một laptop 1355px ngang, cửa sổ cao 900px thì form vừa khít,
          cửa sổ cao 607px thì phải cuộn mới thấy nút "Đăng nhập" — mà một
          form đăng nhập bắt cuộn để bấm nút chính là form hỏng.

          Lượt đầu chỉ có một bậc 820px và vẫn chưa đủ ở 607px. Nay hai bậc,
          và `login-form.tsx` / `register-form.tsx` siết theo — phần lớn
          chiều cao nằm trong form chứ không nằm ở khung này, nên siết mỗi
          khung là siết vào chỗ ít mỡ nhất.

          Nén bằng KHOẢNG CÁCH và một bậc cỡ tiêu đề, không đụng vào cỡ chữ
          của nhãn hay ô nhập: chỗ tiết kiệm được nằm ở khoảng trống, còn thu
          nhỏ ô nhập thì đổi lấy vài chục pixel bằng chính khả năng gõ đúng. */}
      <div className="flex flex-col px-6 py-10 short:py-5 shorter:py-3">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Link href="/" className="lg:hidden">
              <Logo />
            </Link>

            <h1 className="mt-8 font-display text-4xl font-bold tracking-tight lg:mt-0 short:text-3xl shorter:text-2xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground short:mt-2 shorter:mt-1.5">
              {subtitle}
            </p>

            <div className="mt-8 short:mt-5 shorter:mt-4">{children}</div>
          </div>
        </div>

        {/* Footer tối giản: bản quyền và hai trang pháp lý, phân cách bằng
            gạch đứng, có một đường kẻ mảnh phía trên.

            Đường kẻ làm việc mà khoảng trắng không làm nổi ở đây — cột trái
            kết thúc bằng một dòng chữ nhỏ, và không có gì phân định thì nó đọc
            ra như phần đuôi của form thay vì một tầng khác của trang.

            MỘT hàng, không xuống dòng, và chỗ tiết kiệm lấy từ dòng bản
            quyền chứ không từ hai liên kết.

            Đã thử hai bố cục trước đó. Bản đầu để cả ba phần trong một
            `flex-wrap`: "Điều khoản sử dụng" rơi xuống một mình, trông như
            chữ bị tràn. Bản thứ hai tách hai nhóm để chỗ gãy rơi vào khe giữa
            — gọn hơn, nhưng vẫn là hai dòng, và chủ sản phẩm không muốn hai
            dòng.

            Đo lại thì rõ là không có cách xếp nào cứu được: "© 2026
            Sciencepedia · Chính sách bảo mật | Điều khoản sử dụng" dài hơn
            24rem của cột form ở cỡ chữ 12px. Phải bỏ bớt chữ, và chữ đáng bỏ
            là tên thương hiệu trong dòng bản quyền — nó vừa được in ngay phía
            trên trong logo, còn hai liên kết pháp lý thì không rút gọn được:
            "Điều khoản" cụt nghĩa hơn "Điều khoản sử dụng", và đây là hai
            đường dẫn được bên xét duyệt ứng dụng đọc.

            `flex-nowrap` + `whitespace-nowrap` để nếu sau này có ai nới chữ
            dài ra thì nó tràn thấy được ngay, chứ không âm thầm gãy dòng lại. */}
        <footer className="mx-auto mt-10 w-full max-w-sm border-t pt-5 text-xs text-muted-foreground/70 short:mt-6 short:pt-3.5 shorter:mt-4 shorter:pt-3">
          <div className="flex flex-nowrap items-center justify-between gap-x-3 whitespace-nowrap">
            <p>© {new Date().getFullYear()}</p>

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

        {/* Ảnh nền, GHIM Ở ĐÁY cột chứ không phủ kín.

            Phủ kín là phản xạ đầu tiên và nó sai ở đây. Cột này hẹp và cao
            (chừng 0,8:1), còn ảnh là 16:9; `object-cover` toàn khung sẽ cắt
            mất hai phần ba bề ngang, mà quyển sách — thứ duy nhất đáng giữ —
            nằm lệch phải nên nó là phần bị cắt đầu tiên. Neo sang phải thì
            cứu được quyển sách, nhưng lúc đó chính nó nằm sau câu trích, và
            trang sách là vùng SÁNG NHẤT của ảnh: chữ trắng mất chỗ đứng.

            Ghim ở đáy theo đúng tỉ lệ gốc 16:9 thì không cắt một pixel nào,
            và nó tái lập đúng bố cục mà ảnh được vẽ ra để có: khoảng tối ở
            trên cho chữ, quyển sách ở dưới. Đệm `pb-44` của cột chính là dải
            đã chừa sẵn cho nó.

            Mép trên hoà vào nền bằng `mask-image` chứ không bằng một lớp
            gradient màu: nền cột là ba lớp gradient chồng nhau (xem
            `.auth-aside`), nên không có MỘT mã màu nào để mà khớp — đắp màu
            vào sẽ lộ một vệt ngang. Mặt nạ làm ảnh mờ dần về trong suốt, nền
            nào phía sau cũng ăn khớp. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
        >
          <div
            className="relative aspect-[16/9] w-full"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, #000 32%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, #000 32%)",
            }}
          >
            <Image
              src="/images/auth-book.jpg"
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
