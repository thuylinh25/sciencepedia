import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Ô tìm kiếm lớn trên hero — Server Component, không một hook nào.
 *
 * Ba ràng buộc đã định hình toàn bộ file này:
 *
 *  1. Chạy được khi tắt JS. Vì vậy là `<form method="get">` thật, không phải
 *     nút mở hộp thoại. `SearchCommand` (⌘K) vẫn còn nguyên cho người có JS.
 *
 *  2. Nằm trong HTML đầu tiên. Trang chủ là static/ISR; kéo `useSearchParams`
 *     hay bất kỳ hook nào vào đây sẽ tạo client boundary ngay màn hình đầu và
 *     buộc phải bọc `<Suspense>`. Đó là lý do KHÔNG dùng chung component với
 *     `SearchBar` của trang /search — bên đó cần đọc bộ lọc hiện tại nên buộc
 *     phải là client.
 *
 *  3. `routing.localePrefix === "always"`, mà thuộc tính `action` của <form>
 *     KHÔNG đi qua `Link` của next-intl nên không được thêm tiền tố ngôn ngữ
 *     tự động. `action="/search"` sẽ dẫn tới 404. `getPathname` sinh đúng
 *     "/vi/search" | "/en/search".
 *
 * Về màu: dùng `bg-star` + `text-space-900`, KHÔNG dùng `bg-card`/`bg-background`
 * — hai token đó lật sang tối ở dark theme, mà nền hero tối ở CẢ HAI theme nên
 * ô sẽ biến mất. `--star` và `--space-*` chỉ định nghĩa ở `:root`, bất biến
 * theo theme, nên ở đây không có nhánh `dark:` nào. Bóng cũng phải là bóng đen
 * sâu tuỳ chỉnh: `shadow-lg` của Tailwind (rgb(0 0 0/0.1)) vô hình trên nền vũ trụ.
 *
 * Không đặt `required`: submit rỗng đi tới `/search?q=` và rơi vào
 * `SearchDeadEnd` — đó là một trạng thái đã thiết kế, không phải lỗi.
 */
export async function SearchHeroForm({ locale }: { locale: Locale }) {
  const t = await getTranslations("home");
  const ts = await getTranslations("search");

  return (
    <form
      action={getPathname({ href: "/search", locale })}
      method="get"
      role="search"
      className="relative w-full max-w-2xl"
    >
      <label htmlFor="home-search" className="sr-only">
        {ts("title")}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-space-700/70"
      />
      <input
        id="home-search"
        type="search"
        name="q"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={t("heroSearchPlaceholder")}
        className="h-14 w-full rounded-full border border-transparent bg-star ps-13 pe-16 text-base text-space-900 shadow-[0_10px_34px_-8px_rgb(0_0_0/0.5)] outline-none placeholder:text-space-700/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-16 sm:ps-14 sm:pe-32 sm:text-lg"
      />
      <Button
        type="submit"
        variant="accent"
        aria-label={ts("submit")}
        className="absolute end-2 top-1/2 size-11 -translate-y-1/2 rounded-full p-0 sm:h-12 sm:w-auto sm:px-6"
      >
        <Search className="size-5 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">{ts("submit")}</span>
      </Button>
    </form>
  );
}
