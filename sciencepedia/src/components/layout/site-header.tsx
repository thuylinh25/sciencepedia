"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Aperture,
  ChevronDown,
  Disc3,
  Globe,
  Menu,
  Orbit,
  Scaling,
  Search,
  Sparkles,
  Newspaper,
  Telescope,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/category-icon";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Logo } from "@/components/layout/logo";

/** Lĩnh vực gốc — do layout truyền vào từ CSDL, xem `NavCategory`. */
export type NavCategory = {
  slug: string;
  name: string;
  nameEn: string;
  icon: string | null;
};

/**
 * Ba mô hình 3D gom vào một menu xổ. Xếp ngang cả ba cùng "Khám phá" và
 * "Trợ lý AI" thì thanh nav vượt bề ngang khả dụng ở breakpoint lg, và danh
 * sách này còn dài ra khi thêm mô hình mới.
 */
const MODELS = [
  { href: "/solar-system", key: "solarSystem" as const, icon: Orbit },
  { href: "/milky-way", key: "milkyWay" as const, icon: Disc3 },
  { href: "/universe", key: "universe" as const, icon: Aperture },
  { href: "/zoom", key: "zoom" as const, icon: Scaling },
  // Bản đồ bầu trời không phải một bậc của thang kích thước như ba mô hình
  // trên, nhưng nó đứng cùng nhóm "nhìn vũ trụ bằng mắt" nên vào cùng menu.
  { href: "/space-map", key: "spaceMap" as const, icon: Telescope },
  // Không phải mô hình dựng bằng hình học như bốn mục trên: đây là ảnh thật
  // chụp vài giờ trước. Vẫn cùng menu vì nó trả lời cùng một câu hỏi — nhìn
  // thấy cái gì và nó trông thế nào.
  { href: "/earth-live", key: "earthLive" as const, icon: Globe },
];

/**
 * Mục phẳng, đứng sau hai menu xổ. Nay còn đúng MỘT.
 *
 * Thanh nav rút từ bốn mục xuống ba: Khám phá · Công cụ · Trợ lý AI.
 *
 * "Bài viết" chuyển XUỐNG trong menu "Khám phá", không bị xoá. Nó vẫn là lỗ
 * hổng điều hướng có thật: `/articles` là danh sách bài chính của cả site, mà
 * nếu không có mục nào trỏ tới thì người vào thẳng một bài rồi muốn xem còn gì
 * nữa sẽ không có đường.
 *
 * Bản trước từ chối gộp nó vào "Khám phá" vì menu ấy liệt kê các lĩnh vực, và
 * một mục "Bài viết" nằm lẫn trong đó trông như một lĩnh vực nữa. Lý do đó
 * vẫn đúng — nên nó KHÔNG nằm lẫn: nó đứng dưới đường kẻ ngăn, cùng khối với
 * "Danh mục", tức khối "xem toàn bộ" chứ không phải khối lĩnh vực.
 */
const NAV = [{ href: "/assistant", key: "assistant" as const, icon: Sparkles }];

/**
 * Route có hero nền tối tràn xuống dưới header. Thêm route mới vào đây khi
 * dựng thêm một hero tối nữa.
 *
 * Đây mới là trục quyết định thật của header: *nền phía sau tối hay sáng*,
 * KHÔNG phải theme. Hero vũ trụ tối ở cả light lẫn dark theme, nên hai tổ hợp
 * (light + hero) và (dark + hero) cho ra đúng MỘT bộ style.
 */
const DARK_HERO_ROUTES = ["/"];

/**
 * Route mà header rút gọn còn logo + ngôn ngữ + theme.
 *
 * Đăng nhập và đăng ký là hai trang có ĐÚNG MỘT việc để làm. Một thanh nav
 * đầy đủ ở đó chỉ chào mời người dùng bỏ dở việc ấy — và với người vừa nhập
 * sai mật khẩu, mỗi lối thoát thêm là một lý do để rời đi thay vì thử lại.
 *
 * Giữ lại ngôn ngữ và theme vì chúng KHÔNG dẫn đi đâu cả: chúng đổi chính
 * trang đang đứng, và người đọc tiếng Việt gặp form tiếng Anh thì cần nút đó
 * trước cả nút đăng nhập.
 *
 * Giữ logo, và nó vẫn bấm được về trang chủ: rút gọn không có nghĩa là nhốt
 * người dùng lại.
 */
const FOCUSED_ROUTES = ["/login", "/register"];

export function SiteHeader({
  categories,
  search,
}: {
  categories: NavCategory[];
  /**
   * Ô tìm kiếm, dựng sẵn ở layout rồi truyền xuống.
   *
   * Header buộc phải là Client Component (state cuộn, drawer, framer-motion),
   * mà `SearchHeaderForm` phải là Server Component để chạy khi tắt JS và để
   * `getPathname` sinh đúng tiền tố ngôn ngữ. Server Component không import
   * được vào client, nên nó đi qua prop — cùng lối hero từng dùng.
   */
  search?: ReactNode;
}) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const categoryName = (category: NavCategory) =>
    locale === "en" ? category.nameEn : category.name;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const overHero = DARK_HERO_ROUTES.includes(pathname);
  const focused = FOCUSED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const onDark = overHero && !scrolled;

  /* Lỗi ở trạng thái chưa cuộn không nằm ở cái nền trong suốt mà ở MÀU MỰC:
     nav dùng text-muted-foreground / text-foreground của light theme, tức chữ
     gần đen trên nền vũ trụ gần đen (nền vs chữ trắng là 17,8–20,0:1, hoàn
     toàn ổn). Đổ một nền đục lên là chữa nhầm bệnh và giết luôn hiệu ứng hero
     tràn dưới header. */
  const navIdle = onDark
    ? "text-white/75 hover:text-white"
    : "text-muted-foreground hover:text-foreground";
  const navActive = onDark ? "text-white" : "text-foreground";

  return (
    <>
      {/* Liệt kê thuộc tính tường minh chứ không transition-all:
          transition-all cũng animate backdrop-filter, gây giật trên Safari. */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,color] duration-300",
          onDark
            ? "border-b border-transparent bg-transparent text-white"
            : "glass-bar shadow-sm",
        )}
      >
        <div className="container-page flex h-16 min-w-0 items-center gap-3 sm:gap-4 lg:h-20">
          {/* Ngân sách bề ngang trên điện thoại chỉ đủ cho một trong hai: chữ
              "Sciencepedia" (103px) hoặc nút "Đăng nhập" dạng chữ (90px). Giữ
              nút, vì đó là hành động; logo vẫn còn icon để nhận diện. Từ 400px
              trở lên đủ chỗ cho cả hai. */}
          <Link
            href="/"
            className="shrink-0 [&_[data-wordmark]]:hidden min-[400px]:[&_[data-wordmark]]:flex"
            aria-label="Sciencepedia"
          >
            <Logo tone={onDark ? "onDark" : "auto"} />
          </Link>

          <nav
            className={cn(
              "ml-6 items-center gap-7",
              focused ? "hidden" : "hidden lg:flex",
            )}
          >
            {/* Xếp ngang cả 5 lĩnh vực sẽ đẩy thanh nav quá bề ngang khả dụng
                (riêng "Trái Đất và Khí hậu" đã ~150px), nên gom vào menu xổ. */}
            {categories.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  data-active={isActive("/categories")}
                  className={cn(
                    "link-underline flex items-center gap-1 rounded-sm text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    navIdle,
                    isActive("/categories") && navActive,
                  )}
                >
                  {t("explore")}
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.slug} asChild>
                      <Link href={`/categories/${category.slug}`}>
                        <CategoryIcon name={category.icon} className="size-4" />
                        {categoryName(category)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {/* Dưới đường kẻ ngăn là khối "xem toàn bộ", không phải
                      một lĩnh vực nữa — xem chú thích của `NAV`. */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/articles">
                      <Newspaper className="size-4" />
                      {t("articles")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/categories">{t("categories")}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/categories"
                data-active={isActive("/categories")}
                className={cn(
                  "link-underline text-sm font-semibold transition-colors",
                  navIdle,
                  isActive("/categories") && navActive,
                )}
              >
                {t("explore")}
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "link-underline flex items-center gap-1 rounded-sm text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                  navIdle,
                  MODELS.some((item) => isActive(item.href)) && navActive,
                )}
              >
                {t("models")}
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {MODELS.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      {t(item.key)}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {/* Nhãn RIÊNG, không dùng lại `nav.models`.

                    Từ khi menu đổi tên thành "Công cụ", dùng lại nhãn ấy cho
                    mục này là hứa sai: `/models` chỉ có ba mô hình 3D, còn
                    menu thì gồm cả bản đồ bầu trời, hành trình thu phóng và
                    Trái Đất từ L1. Một mục "xem tất cả" dẫn tới nơi có ít hơn
                    những gì vừa liệt kê là điều hướng nói dối. */}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/models">{t("modelsLibrary")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                className={cn(
                  "link-underline flex items-center gap-1.5 text-sm font-semibold transition-colors",
                  navIdle,
                  isActive(item.href) && navActive,
                )}
              >
                {item.icon && <item.icon className="size-4" />}
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* variant="ghost" mang theo hover:bg-muted hover:text-foreground —
              hỏng hoàn toàn trên nền tối. Vá một chỗ ở container thay vì sửa
              từng nút, để nút thêm sau này tự đúng. */}
          {/* `flex-1` chứ không `ml-auto`: ô tìm kiếm bên trong cần bề ngang
              thật để trông ra một ô nhập, mà `ml-auto` thì cụm này chỉ rộng
              bằng nội dung và ô sẽ co lại bằng chữ bên trong. `min-w-0` cho
              phép nó co dưới bề rộng nội dung trên màn hình hẹp. */}
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center justify-end gap-1.5",
              onDark &&
                "[&_[data-slot=button]]:text-white/80 [&_[data-slot=button]:hover]:bg-white/12 [&_[data-slot=button]:hover]:text-white",
            )}
          >
            {/* Nút tìm kiếm hiện ở MỌI trạng thái, kể cả khi ô tìm kiếm lớn
                trên hero còn trong tầm mắt.

                Bản trước ẩn nó khi đang ở đầu trang chủ, để tránh hai ô tìm
                kiếm cùng lúc. Lý do nghe hợp lý nhưng sai trong thực tế: header
                lúc mới vào trang bị khuyết một mục so với lúc đã cuộn, và người
                dùng nhận ra ngay — câu hỏi nguyên văn là "tại sao ô tìm kiếm
                khi cuộn xuống mới hiển thị".

                Hai thứ này khác vai trò: ô trên hero là lời mời bắt đầu một
                hành trình đọc, còn nút ở header là lối tắt luôn ở đúng chỗ trên
                mọi trang. Thanh điều hướng mà đổi thành phần theo vị trí cuộn
                thì người dùng phải học hai phiên bản của cùng một thanh. */}
            {/* Ô tìm kiếm là FORM THẬT, không phải nút mở hộp thoại.

                Bản trước bấm vào thì bật bảng lệnh ⌘K. Người dùng thấy một ô
                nhập nhưng gõ vào không được — phải bấm, đợi hộp thoại hiện,
                rồi mới gõ. Một thứ trông như ô nhập mà không nhận chữ là lời
                hứa bị phá ngay ở cú chạm đầu tiên. Nó cũng không chạy khi tắt
                JavaScript.

                Xem `SearchHeaderForm`. */}
            {!focused && search}

            {/* Dưới `sm` không đủ chỗ cho ô nhập, nên vẫn là một nút — nhưng
                nay nó ĐIỀU HƯỚNG tới /search thay vì mở hộp thoại. Trang đó có
                sẵn ô nhập lớn và bộ lọc, tức là nơi đáng tới hơn một hộp thoại
                nổi trên màn hình 360px. */}
            {!focused && (
              <Button variant="ghost" size="icon" className="sm:hidden" asChild>
                <Link href="/search" aria-label={t("search")}>
                  <Search className="size-5" />
                </Link>
              </Button>
            )}

            {/* Ngôn ngữ + theme chỉ là cài đặt: trên mobile chúng chiếm ~112px
                khiến hàng header không co nổi dưới 482px và đẩy nút đăng nhập
                ra ngoài viewport. Dưới lg, hai nút này nằm trong drawer. */}
            {/* Ở chế độ rút gọn, hai nút này phải hiện ở MỌI bề ngang: drawer
                — chỗ chứa chúng dưới `lg` — đã bị gỡ cùng với nav. */}
            {/* Chỉ còn nút đổi ngôn ngữ.

                Nút sáng/tối đã gỡ: giao diện đã theo cài đặt hệ điều hành, và
                phần lớn người dùng không đổi nó bao giờ — nhưng nó thì chiếm
                chỗ trên mọi trang, cạnh đúng hai thứ người ta thật sự bấm.
                Ngôn ngữ thì khác: nó đổi được NỘI DUNG người đọc nhận, và
                trình duyệt không đoán hộ được. */}
            <div
              className={cn(
                "items-center gap-1.5",
                focused ? "flex" : "hidden lg:flex",
              )}
            >
              <LocaleSwitcher />
            </div>
            {/* Không có UserMenu ở trang đăng nhập: nút "Đăng nhập" trong đó
                trỏ về chính trang đang đứng. */}
            {!focused && <UserMenu />}

            {!focused && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label={t("menu")}
                  >
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[320px]">
                  <SheetHeader>
                    <SheetTitle>
                      <Logo />
                    </SheetTitle>
                  </SheetHeader>
                  <Separator />
                  {/* Drawer phải cuộn được: danh sách lĩnh vực dài ra theo dữ
                    liệu, màn hình thấp sẽ không đủ chỗ cho cả khối cài đặt.

                    `min-h-0 flex-1` là phần bắt buộc, không phải trang trí.
                    SheetContent là flex column; trong flex column, một con
                    mặc định KHÔNG co được xuống dưới chiều cao nội dung của
                    nó (min-height: auto). Nên chỉ có overflow-y-auto thôi thì
                    nav cao bằng đúng danh sách, tràn khỏi drawer thay vì cuộn
                    — và mọi mục nằm dưới mép màn hình trở thành không với tới
                    được. Trên điện thoại, đó là "Mô hình 3D" và tất cả những
                    gì đứng sau danh sách lĩnh vực. */}
                  <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4">
                    <Link
                      href="/categories"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
                        isActive("/categories") &&
                          "bg-muted text-primary-strong",
                      )}
                    >
                      {t("explore")}
                    </Link>

                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/categories/${category.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "ml-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          isActive(`/categories/${category.slug}`) &&
                            "bg-muted text-primary-strong",
                        )}
                      >
                        <CategoryIcon name={category.icon} className="size-4" />
                        {categoryName(category)}
                      </Link>
                    ))}

                    {/* "Bài viết" đặt NGAY SAU danh sách lĩnh vực, cùng bậc
                      với "Khám phá" chứ không thụt vào như các lĩnh vực: nó là
                      toàn bộ kho không phân loại, không phải một lĩnh vực nữa.
                      Cùng lý do với vị trí của nó trong menu xổ trên desktop —
                      xem chú thích của `NAV`.

                      Không để nó rơi theo `NAV`: khi `NAV` rút còn "Trợ lý
                      AI", mục này sẽ biến mất hẳn khỏi điện thoại. */}
                    <Link
                      href="/articles"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
                        isActive("/articles") && "bg-muted text-primary-strong",
                      )}
                    >
                      <Newspaper className="size-4" />
                      {t("articles")}
                    </Link>

                    <Link
                      href="/models"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
                        isActive("/models") && "bg-muted text-primary-strong",
                      )}
                    >
                      {t("modelsLibrary")}
                    </Link>
                    {MODELS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "ml-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          isActive(item.href) && "bg-muted text-primary-strong",
                        )}
                      >
                        <item.icon className="size-4" />
                        {t(item.key)}
                      </Link>
                    ))}

                    {NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
                          isActive(item.href) && "bg-muted text-primary-strong",
                        )}
                      >
                        {item.icon && <item.icon className="size-5" />}
                        {t(item.key)}
                      </Link>
                    ))}
                  </nav>

                  {/* Ngôn ngữ bị ẩn khỏi thanh header dưới lg, đưa vào đây.
                      Nút sáng/tối đã gỡ khỏi cả hai chỗ — xem chú thích ở cụm
                      điều khiển bên phải header. */}
                  <Separator className="mt-2" />
                  <div className="flex items-center gap-2 px-4 lg:hidden">
                    <LocaleSwitcher />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
