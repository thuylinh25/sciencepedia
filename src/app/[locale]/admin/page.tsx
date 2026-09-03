import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eye, FileText, PenLine, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getAdminStats } from "@/server/queries";
import { formatDate, formatNumber } from "@/lib/utils";
import { ReindexButton } from "@/components/admin/reindex-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const stats = await getAdminStats();
  const loc = locale as Locale;

  const cards = [
    { label: t("totalArticles"), value: stats.total, icon: FileText },
    { label: t("published"), value: stats.published, icon: Eye },
    { label: t("drafts"), value: stats.drafts, icon: PenLine },
    { label: t("totalUsers"), value: stats.users, icon: Users },
  ];

  const maxCategoryCount = Math.max(
    1,
    ...stats.byCategory.map((c) => c._count.articles),
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("dashboard")}
        </h1>
        <div className="flex gap-2">
          <ReindexButton />
          <Button asChild>
            <Link href="/admin/articles/new">{t("newArticle")}</Link>
          </Button>
        </div>
      </header>

      {/* Thẻ số liệu */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                {card.label}
              </p>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">
              {formatNumber(card.value, locale)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {t("totalViews")}
        </p>
        <p className="mt-2 font-display text-4xl font-bold">
          {formatNumber(stats.views, locale)}
        </p>
      </div>

      {/* Phân bố bài viết theo lĩnh vực */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          {t("viewsByCategory")}
        </h2>
        <ul className="space-y-3">
          {stats.byCategory.map((category) => (
            <li key={category.name} className="flex items-center gap-4">
              <span className="w-40 shrink-0 truncate text-sm">
                {loc === "en" ? category.nameEn : category.name}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full transition-all"
                  style={{
                    width: `${(category._count.articles / maxCategoryCount) * 100}%`,
                    backgroundColor: category.color,
                  }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {category._count.articles}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Bài viết gần đây */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          {t("recentArticles")}
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.titleField")}</TableHead>
              <TableHead className="w-32">{t("categories")}</TableHead>
              <TableHead className="w-32">{t("form.statusField")}</TableHead>
              <TableHead className="w-20 text-right">
                {t("totalViews")}
              </TableHead>
              <TableHead className="w-32">{t("save")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.recent.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="hover:text-primary-strong"
                  >
                    {article.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {loc === "en"
                    ? article.category.nameEn
                    : article.category.name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={article.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(article.views, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(article.updatedAt, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
