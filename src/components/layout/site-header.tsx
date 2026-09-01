"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, Orbit, Search, Sparkles } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { SearchCommand } from "@/components/search/search-command";
import { Logo } from "@/components/layout/logo";

const NAV = [
  { href: "/categories", key: "explore" as const },
  { href: "/categories/vu-tru", key: "cosmos" as const },
  { href: "/categories/suc-khoe", key: "health" as const },
  { href: "/solar-system", key: "solarSystem" as const, icon: Orbit },
  { href: "/assistant", key: "assistant" as const, icon: Sparkles },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
                <nav className="flex flex-col gap-1 px-4">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted",
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
