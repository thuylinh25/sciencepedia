import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

type CategoryLike = {
  slug: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  icon: string | null;
  color: string;
  _count?: { articles: number };
};

export async function CategoryCard({
  category,
  locale,
  className,
}: {
  category: CategoryLike;
  locale: Locale;
  className?: string;
}) {
  const t = await getTranslations("category");

  const name = locale === "en" ? category.nameEn : category.name;
  const description =
    locale === "en"
      ? (category.descriptionEn ?? category.description)
      : category.description;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      {/* Quầng màu riêng của lĩnh vực, sáng lên khi hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: category.color }}
      />

      <span
        className="grid size-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: `${category.color}1f`,
          color: category.color,
        }}
      >
        <CategoryIcon name={category.icon} className="size-6" />
      </span>

      <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
        {name}
      </h3>

      {description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      <span className="mt-5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {category._count && (
          <span>{t("articleCount", { count: category._count.articles })}</span>
        )}
        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}
