import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");

  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { articles: true } },
      parent: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("categories")}
      </h1>

      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          nameEn: category.nameEn,
          description: category.description ?? "",
          descriptionEn: category.descriptionEn ?? "",
          icon: category.icon ?? "",
          color: category.color,
          coverImage: category.coverImage ?? "",
          parentId: category.parentId,
          parentName: category.parent?.name ?? null,
          order: category.order,
          articleCount: category._count.articles,
        }))}
      />
    </div>
  );
}
