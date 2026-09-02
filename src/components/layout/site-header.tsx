"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Aperture,
  ChevronDown,
  Disc3,
  Menu,
  Orbit,
  Search,
  Sparkles,
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
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { SearchCommand } from "@/components/search/search-command";
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
];

const NAV = [{ href: "/assistant", key: "assistant" as const, icon: Sparkles }];

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const categoryName = (category: NavCategory) =>
    locale === "en" ? category.nameEn : category.name;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cmd/Ctrl + K mở tìm kiếm nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "glass border-b shadow-sm"
            : "border-b border-transparent bg-background/0",
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
            <Logo />
          </Link>

          <nav className="ml-6 hidden items-center gap-7 lg:flex">
            {/* Xếp ngang cả 5 lĩnh vực sẽ đẩy thanh nav quá bề ngang khả dụng
                (riêng "Trái Đất và Khí hậu" đã ~150px), nên gom vào menu xổ. */}
            {categories.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  data-active={isActive("/categories")}
                  className={cn(
                    "link-underline flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground",
                    isActive("/categories") && "text-foreground",
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
                  <DropdownMenuSeparator />
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
                  "link-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive("/categories") && "text-foreground",
                )}
              >
                {t("explore")}
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "link-underline flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground",
                  MODELS.some((item) => isActive(item.href)) && "text-foreground",
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
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                className={cn(
                  "link-underline flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive(item.href) && "text-foreground",
                )}
              >
                {item.icon && <item.icon className="size-4" />}
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden gap-2 rounded-full pr-2 pl-3 text-muted-foreground sm:flex"
            >
              <Search className="size-4" />
              <span>{t("search")}</span>
              <kbd className="ml-1 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] md:inline">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label={t("search")}
            >
              <Search className="size-5" />
            </Button>

            {/* Ngôn ngữ + theme chỉ là cài đặt: trên mobile chúng chiếm ~112px
                khiến hàng header không co nổi dưới 482px và đẩy nút đăng nhập
                ra ngoài viewport. Dưới lg, hai nút này nằm trong drawer. */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <UserMenu />

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
                    liệu, màn hình thấp sẽ không đủ chỗ cho cả khối cài đặt. */}
                <nav className="flex flex-col gap-1 overflow-y-auto px-4">
                  <Link
                    href="/categories"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
                      isActive("/categories") && "bg-muted text-primary",
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
                          "bg-muted text-primary",
                      )}
                    >
                      <CategoryIcon name={category.icon} className="size-4" />
                      {categoryName(category)}
                    </Link>
                  ))}

                  <p className="mt-3 px-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    {t("models")}
                  </p>
                  {MODELS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "ml-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        isActive(item.href) && "bg-muted text-primary",
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
                        isActive(item.href) && "bg-muted text-primary",
                      )}
                    >
                      {item.icon && <item.icon className="size-5" />}
                      {t(item.key)}
                    </Link>
                  ))}
                </nav>

                {/* Ngôn ngữ + theme bị ẩn khỏi thanh header dưới lg, đưa vào đây */}
                <Separator className="mt-2" />
                <div className="flex items-center gap-2 px-4 lg:hidden">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
