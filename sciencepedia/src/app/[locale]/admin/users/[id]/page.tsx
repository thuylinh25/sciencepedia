import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, BookOpen, Box, Clock, Eye, History } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { cn, formatNumber } from "@/lib/utils";
import { pick } from "@/lib/i18n-content";
import { getUserActivityOverview, getUserActivityPage } from "@/server/activity";
import { Pagination } from "@/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PER_PAGE = 20;

const FILTERS = {
  all: null,
  article: "ARTICLE",
  model: "MODEL",
} as const;
type Filter = keyof typeof FILTERS;

/** 3725 giây → "1 giờ 2 phút"; dưới một phút thì ghi giây. */
function formatDuration(seconds: number, locale: string) {
  const vi = locale === "vi";
  if (seconds < 60) return vi ? `${seconds} giây` : `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return vi ? `${m} phút` : `${m} min`;
  return vi ? `${h} giờ ${m} phút` : `${h} h ${m} min`;
}

/** Lần xem gần nhất cần cả giờ: hai lượt trong cùng ngày là chuyện thường. */
function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminUserActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Layout admin chỉ chặn ở mức EDITOR; lịch sử xem là dữ liệu cá nhân → ADMIN.
  // `requireRole` ném lỗi, nên quyền thấp hơn không render được gì của trang này.
  try {
    await requireRole("ADMIN");
  } catch {
    notFound();
  }

  const query = await searchParams;
  const filter: Filter = query.type === "article" || query.type === "model" ? query.type : "all";
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const loc = locale as Locale;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) notFound();

  const t = await getTranslations("admin.activity");
  // Bảng chưa có (code lên trước migration) thì hiện trang rỗng, không lỗi 500
  const [overview, history] = await Promise.all([
    getUserActivityOverview(user.id),
    getUserActivityPage({ userId: user.id, type: FILTERS[filter], page, perPage: PER_PAGE }),
  ]).catch((error: Error) => {
    console.error("[admin/users/:id] không đọc được lịch sử xem:", error.message);
    return [
      { total: 0, articles: 0, models: 0, totalDuration: 0, lastActivityAt: null },
      { total: 0, items: [] },
    ] as const;
  });

  const cards = [
    { label: t("total"), value: formatNumber(overview.total, locale), icon: Eye },
    { label: t("articles"), value: formatNumber(overview.articles, locale), icon: BookOpen },
    { label: t("models"), value: formatNumber(overview.models, locale), icon: Box },
    { label: t("duration"), value: formatDuration(overview.totalDuration, locale), icon: Clock },
    {
      label: t("last"),
      value: overview.lastActivityAt ? formatDateTime(overview.lastActivityAt, locale) : t("never"),
      icon: History,
    },
  ];

  const basePath = `/admin/users/${user.id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {user.name ?? user.email}
        </h1>
        {user.name && <p className="text-sm text-muted-foreground">{user.email}</p>}
      </div>

      {/* Cùng thẻ số liệu với trang Tổng quan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                {card.label}
              </p>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <nav className="flex gap-2" aria-label={t("type")}>
        {(Object.keys(FILTERS) as Filter[]).map((key) => (
          <Link
            key={key}
            href={key === "all" ? basePath : `${basePath}?type=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {t(key === "all" ? "filterAll" : key === "article" ? "filterArticle" : "filterModel")}
          </Link>
        ))}
      </nav>

      {history.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("content")}</TableHead>
              <TableHead className="w-28">{t("type")}</TableHead>
              <TableHead className="w-28 text-right">{t("views")}</TableHead>
              <TableHead className="w-36 text-right">{t("time")}</TableHead>
              <TableHead className="w-40">{t("lastViewed")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.contentType === "ARTICLE" ? (
                    item.article ? (
                      <Link href={`/articles/${item.article.slug}`} className="hover:underline">
                        {pick(loc, item.article.title, item.article.titleEn)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{t("deleted")}</span>
                    )
                  ) : (
                    item.label ?? item.contentId
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.contentType === "ARTICLE" ? t("typeArticle") : t("typeModel")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(item.viewCount, locale)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDuration(item.totalDuration, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(item.lastViewedAt, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(history.total / PER_PAGE)}
        perPage={PER_PAGE}
        itemsOnPage={history.items.length}
        basePath={basePath}
        extraQuery={{ type: filter === "all" ? undefined : filter }}
      />
    </div>
  );
}
