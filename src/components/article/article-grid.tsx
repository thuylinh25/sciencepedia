import { getTranslations } from "next-intl/server";
import { FileQuestion } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import type { ArticleCard as ArticleCardData } from "@/server/queries";
import { ArticleCard } from "@/components/article/article-card";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export async function ArticleGrid({
  articles,
  locale,
  columns = 3,
  className,
}: {
  articles: ArticleCardData[];
  locale: Locale;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const t = await getTranslations("article");

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
        <FileQuestion className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
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
