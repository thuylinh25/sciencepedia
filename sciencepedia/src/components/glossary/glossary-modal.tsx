"use client";

/*
 * 'use client': modal mở theo thao tác người đọc, tải chi tiết và stream giải
 * thích AI. Chỉ được nạp qua `next/dynamic` từ `GlossaryTerm`.
 */

import type { RefObject } from "react";
import { ArrowRight, BookOpen, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useGlossary } from "@/hooks/use-glossary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  slug: string;
  term: string;
  /** Định nghĩa ngắn đã có từ tooltip — hiện ngay, không chờ API. */
  definition: string;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nút mở modal nằm trong tooltip đã đóng, nên phải trả focus về thuật ngữ. */
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function GlossaryModal({
  slug,
  term,
  definition,
  locale,
  open,
  onOpenChange,
  returnFocusRef,
}: Props) {
  const t = useTranslations("glossary");
  const tCommon = useTranslations("common");
  const {
    detail,
    detailError,
    retryDetail,
    explanation,
    explainStatus,
    explainError,
    explain,
  } = useGlossary(slug, { locale, enabled: open });

  const busy = explainStatus === "loading" || explainStatus === "streaming";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        {/* `text-left`: header mặc định căn giữa dưới `sm`, còn thân modal căn
            trái — trên điện thoại định nghĩa ngắn và định nghĩa đầy đủ trông như
            hai khối không liên quan. */}
        <DialogHeader className="text-left">
          {detail?.category && (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {detail.category}
            </p>
          )}
          <DialogTitle>{detail?.term ?? term}</DialogTitle>
          {/* Định nghĩa ngắn là description của dialog: trình đọc màn hình đọc
              nó ngay sau tiêu đề khi modal mở. */}
          <DialogDescription className="text-base leading-relaxed text-foreground">
            {detail?.shortDef ?? definition}
          </DialogDescription>
        </DialogHeader>

        {/* ------------------------------------------------ Định nghĩa đầy đủ */}
        <section aria-busy={!detail && !detailError} className="space-y-4">
          {detailError ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <span role="alert">{t("loadError")}</span>
              <Button size="sm" variant="outline" onClick={retryDetail}>
                <RotateCcw aria-hidden />
                {tCommon("retry")}
              </Button>
            </div>
          ) : !detail ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            <>
              {detail.image && (
                <figure className="overflow-hidden rounded-xl border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh R2, srcSet dựng sẵn trên server; xem AssetImage */}
                  <img
                    src={detail.image.src}
                    srcSet={detail.image.srcSet}
                    sizes="(min-width: 640px) 36rem, 100vw"
                    alt=""
                    width={1200}
                    height={675}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-contain"
                  />
                  {detail.image.credit && (
                    <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                      {t("imageCredit", { credit: detail.image.credit })}
                    </figcaption>
                  )}
                </figure>
              )}

              {detail.paragraphs.length > 0 ? (
                <div className="space-y-3 text-[0.95rem] leading-relaxed">
                  {detail.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noFullDef")}</p>
              )}
            </>
          )}
        </section>

        {/* ------------------------------------------------ Giải thích AI */}
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <Button
            variant={explanation ? "outline" : "accent"}
            size="sm"
            onClick={explain}
            disabled={busy}
          >
            <Sparkles aria-hidden />
            {explanation ? t("explainAgain") : t("explainSimply")}
          </Button>

          {/* aria-live: phần chữ stream vào được đọc lên dần, không cần người
              dùng trình đọc màn hình tự dò xem đã có trả lời chưa. */}
          <div aria-live="polite" className="mt-3 empty:hidden">
            {explainStatus === "loading" && (
              <p className="animate-pulse text-sm text-muted-foreground">
                {t("explaining")}
              </p>
            )}
            {explanation && (
              <p className="text-[0.95rem] leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            )}
            {explainStatus === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {explainError === "RATE_LIMITED"
                  ? t("aiRateLimited")
                  : explainError === "AI_BUSY"
                    ? t("aiBusy")
                    : explainError === "NOT_CONFIGURED"
                    ? t("aiNotConfigured")
                    : t("aiError")}
              </p>
            )}
          </div>

          {/* Nhãn KHÔNG được gỡ: đây là chữ chưa qua science-editor, đặt cạnh
              định nghĩa đã thẩm định. */}
          {explanation && (
            <p className="mt-3 text-xs text-muted-foreground">{t("aiNotice")}</p>
          )}
        </section>

        {/* ------------------------------------------------ Bài liên quan */}
        {detail && detail.related.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="size-4 text-accent" aria-hidden />
              {t("related")}
            </h3>
            <ul className="mt-2 divide-y rounded-xl border">
              {detail.related.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {article.title}
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href={`/glossary/${slug}`}
          className="justify-self-start text-sm font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("openPage")}
        </Link>
      </DialogContent>
    </Dialog>
  );
}
