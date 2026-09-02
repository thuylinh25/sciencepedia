import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ArticleCard as ArticleCardData } from "@/server/queries";
import { pick, pickName } from "@/lib/i18n-content";
import { cn, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  article: ArticleCardData;
  locale: Locale;
  /** `hero` dùng cho bài đầu tiên trong khối nổi bật. */
  variant?: "default" | "hero" | "compact";
  priority?: boolean;
  className?: string;
};

export async function ArticleCard({
  article,
  locale,
  variant = "default",
  priority = false,
  className,
}: Props) {
  const t = await getTranslations("article");

  const title = pick(locale, article.title, article.titleEn);
  const summary = pick(locale, article.summary, article.summaryEn);
  const category = pickName(locale, article.category);

  if (variant === "compact") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className={cn(
          "group flex items-start gap-4 rounded-xl p-2 transition-colors hover:bg-muted/60",
          className,
        )}
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {article.coverImage && (
            <Image
              src={article.coverImage}
              alt=""
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {category}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {t("readingTime", { minutes: article.readingTime })}
          </p>
        </div>
      </Link>
    );
  }

  const isHero = variant === "hero";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        isHero && "md:flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isHero ? "aspect-[16/10] md:aspect-auto md:w-1/2" : "aspect-[16/10]",
        )}
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt=""
            fill
            priority={priority}
            sizes={
              isHero
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="size-full"
            style={{
              background: `linear-gradient(135deg, ${article.category.color}33, ${article.category.color}0d)`,
            }}
          />
        )}

        {/* Dải vàng NatGeo chạy khi hover */}
        <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />

        {/* `category.color` do biên tập viên nhập vào CSDL, không ai bảo đảm
            được cặp (màu nền, chữ trắng) đạt 4.5:1 — vàng nhạt trên trắng là
            hợp lệ với ô chọn màu và không đọc được trên thẻ. Nền tối cố định
            giữ tương phản ở mọi màu; màu lĩnh vực chuyển thành chấm nhận diện. */}
        <Badge className="absolute top-3 left-3 gap-1.5 border-none bg-space-900/75 text-star shadow-sm backdrop-blur-sm">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: article.category.color }}
          />
          {category}
        </Badge>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col p-5",
          isHero && "justify-center md:p-8",
        )}
      >
        <h3
          className={cn(
            "font-display leading-tight font-bold tracking-tight text-balance transition-colors group-hover:text-primary",
            isHero ? "text-2xl md:text-3xl" : "line-clamp-2 text-lg",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "mt-2.5 text-sm leading-relaxed text-muted-foreground",
            isHero ? "line-clamp-4 md:text-base" : "line-clamp-2",
          )}
        >
          {summary}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t("readingTime", { minutes: article.readingTime })}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {formatNumber(article.views, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
}
