import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Ô tìm kiếm trên thanh điều hướng — form thật, KHÔNG mở hộp thoại.
 *
 * ## Vì sao bỏ hộp thoại
 *
 * Bản trước là một nút trông như ô nhập; bấm vào thì bật `SearchCommand` (bảng
 * lệnh ⌘K). Hai vấn đề:
 *
 *  - Người dùng thấy một ô nhập nhưng gõ vào không được — phải bấm, đợi hộp
 *    thoại hiện, rồi mới gõ. Một thứ trông như ô nhập mà không nhận chữ là
 *    lời hứa bị phá ngay ở cú chạm đầu tiên.
 *  - Không chạy khi tắt JavaScript.
 *
 * Nay là `<form method="get">` thật: gõ và Enter đi thẳng tới `/search`.
 *
 * ## Ba ràng buộc kỹ thuật, giữ nguyên từ `SearchHeroForm`
 *
 *  1. Server Component, không hook nào — nên nó nằm trong HTML đầu tiên và
 *     chạy được khi tắt JS. Header là Client Component (framer-motion, state),
 *     nên form này được layout render rồi truyền xuống qua prop.
 *
 *  2. `routing.localePrefix === "always"`, mà thuộc tính `action` của <form>
 *     KHÔNG đi qua `Link` của next-intl nên không được thêm tiền tố ngôn ngữ.
 *     `action="/search"` sẽ dẫn tới 404. `getPathname` sinh đúng đường dẫn.
 *
 *  3. Không đặt `required`: submit rỗng đi tới `/search?q=` và rơi vào
 *     `SearchDeadEnd` — một trạng thái đã thiết kế, không phải lỗi.
 *
 * ## Vì sao nút vàng thay cho nhãn phím tắt
 *
 * Nhãn "Ctrl K" chỉ có nghĩa với người đã biết bảng lệnh tồn tại, và nó chiếm
 * đúng chỗ dễ thấy nhất của ô. Một nút "Khám phá" màu vàng nói được việc phải
 * làm, và trên di động — nơi không có phím tắt nào — nó là thứ duy nhất bấm
 * được.
 *
 * Dùng `primary` (vàng) chứ không `accent` (xanh) trên nền hero tối: vàng là
 * màu duy nhất trong hệ token bật hẳn lên khỏi nền vũ trụ. Không ghi đè màu
 * chữ — `--primary-foreground` đã là màu tối, biến thể mặc định của Button xử
 * lý đúng.
 *
 * ## Vì sao KHÔNG có prop `onDark`
 *
 * Header đổi màu theo vị trí cuộn và theo route, nhưng cả hai thứ đó chỉ biết
 * được ở phía client — còn component này phải là Server Component. Truyền một
 * cờ tĩnh xuống thì nó sai ngay khi người dùng cuộn.
 *
 * Nên ô dùng token trung tính `bg-background`: trắng ở giao diện sáng, tối ở
 * giao diện tối. Trên hero vũ trụ ở giao diện sáng nó là một viên thuốc trắng
 * nổi rõ — đúng hình dáng ô tìm kiếm cũ của hero mà nó thay thế.
 */
export async function SearchHeaderForm({ locale }: { locale: Locale }) {
  const t = await getTranslations("nav");
  const ts = await getTranslations("search");
  const th = await getTranslations("home");

  return (
    <form
      action={getPathname({ href: "/search", locale })}
      method="get"
      role="search"
      /* max-w-xl (36rem) → max-w-[32rem] (512px), ngắn chừng 11%.

         Ô tìm kiếm phải nổi bật, nhưng ở 36rem nó chiếm gần nửa bề ngang
         header và đẩy cụm nút bên phải sát mép. Nổi bật không phải là to
         nhất — nó là nút vàng bên trong ô và hiệu ứng focus. */
      className="hidden w-full max-w-[32rem] sm:block"
    >
      <div className="relative">
        <label htmlFor="header-search" className="sr-only">
          {ts("title")}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="header-search"
          type="search"
          name="q"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-full border bg-background ps-11 pe-32 text-sm shadow-[0_6px_20px_-8px_rgb(0_0_0/0.45)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--color-ring)]"
        />
        {/* `variant="secondary"` chứ không phải nút vàng mặc định.

            Vàng là màu hành động CHÍNH của trang, và ở header nó xuất hiện
            trên mọi màn hình cùng lúc với nút "Đăng nhập" — hai nút vàng cạnh
            nhau thì không nút nào còn là nút chính. Ô tìm kiếm đã có viền, có
            icon và có hiệu ứng focus để nói nó bấm được. */}
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          className="absolute end-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-4 text-sm font-semibold"
        >
          {th("heroSearchCta")}
        </Button>
      </div>
    </form>
  );
}
