import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getRootCategories } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { CategoryCard } from "@/components/category/category-card";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "category" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/categories",
    locale: locale as Locale,
  });
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("category");
  const categories = await getRootCategories();
  const loc = locale as Locale;

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <StaggerItem key={category.id} className="h-full">
            <div className="flex h-full flex-col gap-3">
              <CategoryCard category={category} locale={loc} />

              {category.children.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {category.children.map((child) => (
                    <Link key={child.id} href={`/categories/${child.slug}`}>
                      <Badge
                        variant="outline"
                        className="transition-colors hover:border-accent hover:bg-accent/10"
                      >
                        {loc === "en" ? child.nameEn : child.name}
                        <span className="ml-1 text-muted-foreground">
                          {child._count.articles}
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
