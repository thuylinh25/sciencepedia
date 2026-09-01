import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getAllTags, getTagBySlug, listArticles } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { ArticleGrid } from "@/components/article/article-grid";
import { Pagination } from "@/components/pagination";

export const revalidate = 300;

const PER_PAGE = 12;

export async function generateStaticParams() {
  try {
    const tags = await getAllTags();
    return tags.map(({ slug }) => ({ slug }));
  } catch (error) {
    console.warn("[build] bỏ qua prerender thẻ:", (error as Error).message);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = await getTagBySlug(slug);
  // noindex cho slug không tồn tại — xem chú thích ở articles/[slug]/page.tsx
  if (!tag) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  const loc = locale as Locale;
  const name = loc === "en" ? tag.nameEn : tag.name;
  const t = await getTranslations({ locale, namespace: "tag" });

  return buildMetadata({
    title: t("taggedWith", { tag: name }),
    description: t("taggedWith", { tag: name }),
    path: `/tags/${tag.slug}`,
    locale: loc,
  });
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { page: rawPage } = await searchParams;

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const loc = locale as Locale;
  const t = await getTranslations("tag");
  const tCategory = await getTranslations("category");

  const name = loc === "en" ? tag.nameEn : tag.name;
  // `page` trả về đã được kẹp vào khoảng trang thật sự có bài
  const { items, page, totalPages } = await listArticles({
    page: Math.max(1, Number(rawPage) || 1),
    perPage: PER_PAGE,
    tagSlug: tag.slug,
  });

  return (
    <div className="container-page py-16">
      <SectionHeading
        title={t("taggedWith", { tag: name })}
        subtitle={tCategory("articleCount", { count: tag._count.articles })}
      />
      <ArticleGrid articles={items} locale={loc} />
      <Pagination
        page={page}
        totalPages={totalPages}
        perPage={PER_PAGE}
        itemsOnPage={items.length}
        basePath={`/tags/${tag.slug}`}
        className="mt-14"
      />
    </div>
  );
}
