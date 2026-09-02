import { getLocale, getTranslations } from "next-intl/server";
import { Github, Mail, Rss } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getRootCategories } from "@/server/queries";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const year = new Date().getFullYear();

  // Cùng lý do như thanh điều hướng: danh sách ghim cứng bỏ sót lĩnh vực mới
  let categories: { slug: string; name: string; nameEn: string }[] = [];
  try {
    categories = await getRootCategories();
  } catch (error) {
    console.warn("[footer] không nạp được danh mục:", (error as Error).message);
  }

  const explore = [
    { href: "/categories", label: tNav("categories") },
    ...categories.map((category) => ({
      href: `/categories/${category.slug}`,
      label: locale === "en" ? category.nameEn : category.name,
    })),
    { href: "/solar-system", label: tNav("solarSystem") },
    { href: "/milky-way", label: tNav("milkyWay") },
    { href: "/universe", label: tNav("universe") },
    { href: "/assistant", label: tNav("assistant") },
  ];

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <footer className="mt-24 border-t bg-muted/30">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("aboutText")}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub"
                className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
              >
                <Github className="size-4" />
              </a>
              <a
                href="/rss.xml"
                aria-label="RSS"
                className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
              >
                <Rss className="size-4" />
              </a>
              <a
                href="mailto:hello@sciencepedia.dev"
                aria-label="Email"
                className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
              >
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          <nav aria-label={t("explore")}>
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("explore")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("legal")}>
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("legal")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} Sciencepedia. {t("rights")}
          </p>
          <p>{t("builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
