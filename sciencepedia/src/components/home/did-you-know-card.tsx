import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ArticleCard } from "@/server/queries";
import { cn } from "@/lib/utils";

/**
 * Trích một câu từ kho tri thức.
 *
 * Tên khối là "Trích từ kho tri thức", KHÔNG phải "Bạn có biết?".
 * science-editor đã phủ quyết nhãn kia: schema không có trường trivia, thứ duy
 * nhất có thật ở đây là câu tóm tắt của bài. "Bạn có biết?" hứa một sự thật
 * được tuyển chọn riêng, nên gây hiểu sai về nguồn gốc của câu chữ.
 *
 * Ba ràng buộc biên tập:
 *  - Nội dung lấy nguyên văn từ \`summary\`/\`summaryEn\`. Không bịa, không sinh
 *    bằng LLM lúc render.
 *  - Hiện nguyên câu, không cắt, không "…". Thẻ giãn theo nội dung.
 *  - Dòng quy nguồn LUÔN hiện, có link tới bài, không giấu sau hover.
 *
 * Thiếu \`summaryEn\` thì trả \`null\` — fail-closed. Không rơi về tiếng Việt
 * trong ngữ cảnh tiếng Anh và tuyệt đối không dịch tại chỗ.
 */
export async function DidYouKnowCard({
  article,
  locale,
  className,
}: {
  article: ArticleCard;
  locale: Locale;
  className?: string;
}) {
  const t = await getTranslations("home");

  const summary =
    locale === "en" ? article.summaryEn?.trim() : article.summary.trim();
  if (!summary) return null;

  const title =
    locale === "en" ? (article.titleEn?.trim() ?? "") : article.title;
  if (!title) return null;

  return (
    <figure
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
        className,
      )}
    >
      <h3 className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        <Quote aria-hidden className="size-3.5" />
        {t("excerptTitle")}
      </h3>

      <blockquote className="mt-3 text-base leading-relaxed text-pretty">
        {summary}
      </blockquote>

      <figcaption className="mt-4">
        <Link
          href={`/articles/${article.slug}`}
          className="text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
        >
          {t("excerptSource", { title })}
        </Link>
      </figcaption>
    </figure>
  );
}
