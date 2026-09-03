import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const loc = locale as Locale;

  const [article, categories, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { tags: { select: { tagId: true } } },
    }),
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("edit")}: {article.title}
      </h1>

      <ArticleForm
        articleId={article.id}
        defaultValues={{
          slug: article.slug,
          title: article.title,
          titleEn: article.titleEn ?? "",
          summary: article.summary,
          summaryEn: article.summaryEn ?? "",
          content: article.content,
          contentEn: article.contentEn ?? "",
          coverImage: article.coverImage ?? "",
          categoryId: article.categoryId,
          tagIds: article.tags.map((tag) => tag.tagId),
          status: article.status,
          featured: article.featured,
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
          seoKeywords: article.seoKeywords ?? "",
        }}
        categories={categories.map((category) => ({
          id: category.id,
          name: loc === "en" ? category.nameEn : category.name,
          color: category.color,
        }))}
        tags={tags.map((tag) => ({
          id: tag.id,
          name: loc === "en" ? tag.nameEn : tag.name,
          color: tag.color,
        }))}
      />
    </div>
  );
}
