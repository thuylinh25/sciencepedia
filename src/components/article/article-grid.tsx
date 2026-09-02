import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FileQuestion } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ArticleCard as ArticleCardData } from "@/server/queries";
import { ArticleCard } from "@/components/article/article-card";
import { EmptyState } from "@/components/empty-state";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export async function ArticleGrid({
  articles,
  locale,
  columns = 3,
  className,
  empty,
}: {
  articles: ArticleCardData[];
  locale: Locale;
  columns?: 2 | 3 | 4;
  className?: string;
  /** Thay khối rỗng mặc định khi lý do rỗng khác nhau (ví dụ: chưa lưu bài nào). */
  empty?: ReactNode;
}) {
  const t = await getTranslations("article");

  if (articles.length === 0) {
    if (empty) return <>{empty}</>;

    return (
      <EmptyState
        icon={FileQuestion}
        title={t("empty")}
        description={t("emptyHint")}
      >
        <Link
          href="/articles"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("browseAll")}
        </Link>
      </EmptyState>
    );
  }

  return (
    <StaggerGroup
      className={cn(
        "grid gap-6",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {articles.map((article, index) => (
        <StaggerItem key={article.id} className="h-full">
          <ArticleCard
            article={article}
            locale={locale}
            priority={index < 3}
            className="h-full"
          />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
