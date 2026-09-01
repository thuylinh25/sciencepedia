import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { listArticles } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { ArticleGrid } from "@/components/article/article-grid";
import { Pagination } from "@/components/pagination";

const PER_PAGE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tSite = await getTranslations({ locale, namespace: "site" });

  return buildMetadata({
    title: t("articles"),
    description: tSite("description"),
    path: "/articles",
    locale: locale as Locale,
  });
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { page: rawPage, sort } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);

  const t = await getTranslations("nav");
  const tHome = await getTranslations("home");

  const { items, totalPages } = await listArticles({
    page,
    perPage: PER_PAGE,
    sort: sort === "popular" ? "popular" : "newest",
  });

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("articles")} subtitle={tHome("latestSubtitle")} />
      <ArticleGrid articles={items} locale={locale as Locale} />
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/articles"
        className="mt-14"
      />
    </div>
  );
}
