import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/admin/tag-manager";

export default async function AdminTagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("tags")}
      </h1>

      <TagManager
        tags={tags.map((tag) => ({
          id: tag.id,
          slug: tag.slug,
          name: tag.name,
          nameEn: tag.nameEn,
          color: tag.color,
          articleCount: tag._count.articles,
        }))}
      />
    </div>
  );
}
