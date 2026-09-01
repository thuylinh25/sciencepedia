import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { getAllCategories, getCategoryBySlug, listArticles } from "@/server/queries";

import { JsonLd } from "@/components/json-ld";
import { CategoryIcon } from "@/components/category-icon";
import { ArticleGrid } from "@/components/article/article-grid";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300;

const PER_PAGE = 12;

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    return categories.map(({ slug }) => ({ slug }));
  } catch (error) {
    console.warn("[build] bỏ qua prerender danh mục:", (error as Error).message);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  // noindex cho slug không tồn tại — xem chú thích ở articles/[slug]/page.tsx
  if (!category) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  const loc = locale as Locale;
  const name = loc === "en" ? category.nameEn : category.name;
  const description =
    (loc === "en" ? category.descriptionEn : category.description) ?? name;

  return buildMetadata({
    title: name,
    description,
    path: `/categories/${category.slug}`,
    locale: loc,
    image: category.coverImage,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { page: rawPage } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const loc = locale as Locale;
  const t = await getTranslations("category");

  const name = loc === "en" ? category.nameEn : category.name;
  const description =
    loc === "en"
      ? (category.descriptionEn ?? category.description)
      : category.description;

  // `page` trả về đã được kẹp vào khoảng trang thật sự có bài
  const { items, page, totalPages } = await listArticles({
    page: Math.max(1, Number(rawPage) || 1),
    perPage: PER_PAGE,
    categorySlug: category.slug,
  });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sciencepedia", url: absoluteUrl(`/${locale}`) },
          { name: t("title"), url: absoluteUrl(`/${locale}/categories`) },
          {
            name,
            url: absoluteUrl(`/${locale}/categories/${category.slug}`),
          },
        ])}
      />

      {/* Đầu trang mang màu riêng của lĩnh vực */}
      <header
        className="relative overflow-hidden border-b py-16"
        style={{
          background: `linear-gradient(160deg, ${category.color}22, transparent 65%)`,
        }}
      >
        <div className="container-page">
          {category.parent && (
            <Link
              href={`/categories/${category.parent.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {loc === "en" ? category.parent.nameEn : category.parent.name}
            </Link>
          )}

          <div className="mt-3 flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl"
              style={{
                backgroundColor: `${category.color}26`,
                color: category.color,
              }}
            >
              <CategoryIcon name={category.icon} className="size-7" />
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("articleCount", { count: category._count.articles })}
              </p>
            </div>
          </div>

          {description && (
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          )}

          {category.children.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t("subcategories")}
              </p>
              <div className="flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link key={child.id} href={`/categories/${child.slug}`}>
                    <Badge
                      variant="outline"
                      className="bg-background/60 px-3 py-1 backdrop-blur transition-colors hover:border-accent"
                    >
                      {loc === "en" ? child.nameEn : child.name}
                      <span className="ml-1.5 text-muted-foreground">
                        {child._count.articles}
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container-page py-14">
        <ArticleGrid articles={items} locale={loc} />
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={PER_PAGE}
          itemsOnPage={items.length}
          basePath={`/categories/${category.slug}`}
          className="mt-14"
        />
      </div>
    </>
  );
}
