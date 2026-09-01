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
        <div className="container-page flex h-16 items-center gap-4 lg:h-20">
          <Link href="/" className="shrink-0" aria-label="Sciencepedia">
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

            <LocaleSwitcher />
            <ThemeToggle />
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
              <SheetContent side="right" className="w-[300px]">
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
