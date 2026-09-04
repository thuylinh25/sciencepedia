import { getLocale, getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";

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

  /**
   * Tách "Khám phá" khỏi "Công cụ".
   *
   * Bản trước dồn cả lĩnh vực, bốn mô hình 3D và trợ lý AI vào một cột dài
   * mười mục — mắt đọc thành một danh sách phẳng không có thứ bậc, và cột đó
   * cao gấp ba hai cột kia. Hai nhóm này trả lời hai câu hỏi khác nhau:
   * "có những gì để đọc" và "dùng cái gì để đọc".
   *
   * Cột "Tài nguyên" (RSS · API · Nguồn dữ liệu · Roadmap · GitHub) đã được
   * cân nhắc và **bỏ hẳn**: cả năm đều chưa tồn tại, dựng cột đó là dựng năm
   * link chết. Thêm lại từng mục khi có thật.
   */
  const explore = [
    { href: "/articles", label: tNav("articles") },
    { href: "/categories", label: tNav("categories") },
    ...categories.map((category) => ({
      href: `/categories/${category.slug}`,
      label: locale === "en" ? category.nameEn : category.name,
    })),
  ];

  const tools = [
    { href: "/search", label: tNav("search") },
    { href: "/models", label: tNav("models") },
    { href: "/solar-system", label: tNav("solarSystem") },
    { href: "/milky-way", label: tNav("milkyWay") },
    { href: "/universe", label: tNav("universe") },
    { href: "/zoom", label: tNav("zoom") },
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
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("aboutText")}
            </p>
            {/* Đã gỡ icon GitHub và RSS.

                GitHub trỏ "https://github.com" — trang chủ GitHub, không phải
                repo nào cả. RSS trỏ "/rss.xml", mà route đó KHÔNG tồn tại trong
                src/app: một link 404 đã sống trên production vì không ai bấm.

                Thêm lại khi có địa chỉ thật: repo công khai cho GitHub, và một
                route feed thật cho RSS. */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:hello@sciencepedia.dev"
                aria-label="Email"
                className="rounded-full border p-2.5 text-muted-foreground transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_18px_-4px_var(--color-accent)]"
              >
                <Mail className="size-5" />
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

          <nav aria-label={t("tools")}>
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("tools")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {tools.map((item) => (
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
        </div>
      </div>
    </footer>
  );
}
