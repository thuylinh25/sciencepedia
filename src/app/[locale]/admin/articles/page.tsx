import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { AdminArticleTable } from "@/components/admin/article-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";

const PER_PAGE = 20;

export default async function AdminArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { page: rawPage, q } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const t = await getTranslations("admin");

  const where = q
    ? { title: { contains: q, mode: "insensitive" as const } }
    : {};

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        featured: true,
        views: true,
        updatedAt: true,
        category: { select: { name: true, nameEn: true, color: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.article.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("articles")}
        </h1>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="size-4" />
            {t("newArticle")}
          </Link>
        </Button>
      </header>

      <AdminArticleTable articles={articles} locale={locale} />

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        basePath="/admin/articles"
        extraQuery={{ q }}
      />
    </div>
  );
}
