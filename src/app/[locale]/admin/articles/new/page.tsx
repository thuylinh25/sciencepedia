import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/article-form";

export default async function NewArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const loc = locale as Locale;

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("newArticle")}
      </h1>

      <ArticleForm
        defaultValues={{
          slug: "",
          title: "",
          titleEn: "",
          summary: "",
          summaryEn: "",
          content: "",
          contentEn: "",
          coverImage: "",
          categoryId: categories[0]?.id ?? "",
          tagIds: [],
          status: "DRAFT",
          featured: false,
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
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
