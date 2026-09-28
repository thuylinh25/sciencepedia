"use client";

// Client: bảng này mở/đóng theo cấu trúc người đọc vừa chạm trên canvas.

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, BookOpen, ChevronRight, Focus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  EXPLAINED,
  SYSTEM_COLORS,
  type Concept,
  type Part,
} from "@/lib/human-atlas/anatomy";
import { displayName, hasViName } from "@/lib/human-atlas/names-vi";
import type { StructureArticle } from "@/lib/human-atlas/structure-links";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/human-atlas/panel";

/** Trang dữ liệu gốc của BodyParts3D — giữ đúng liên kết bản gốc dùng. */
const SOURCE_URL = "https://lifesciencedb.jp/bp3d/";

/**
 * Bảng chi tiết của cấu trúc đang chọn.
 *
 * Không modal (`aria-modal="false"`): người đọc vẫn xoay mô hình, bật tắt hệ
 * trong khi bảng mở — đó là cả mục đích của việc chọn. Esc đóng bảng khi focus
 * đang ở trong nó.
 *
 * `data-atlas-sheet`: cảnh 3D đo khung này để đặt cấu trúc "xem riêng" vào
 * phần còn trống bên cạnh / phía trên, không nằm lọt sau bảng.
 */
export function StructureDetail({
  concept,
  parts,
  isolate,
  locale,
  articles,
  focusOnOpen,
  onIsolate,
  onChoosePart,
  onClear,
  onClose,
}: {
  concept: Concept;
  parts: Part[];
  isolate: boolean;
  locale: string;
  articles: StructureArticle[];
  focusOnOpen: boolean;
  onIsolate: () => void;
  onChoosePart: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("humanAtlas");
  const title = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const first = parts[0];
  const system = first?.system;
  const explainedKey = EXPLAINED[concept.name.toLowerCase()];
  const name = displayName(locale, concept.id, concept.name);
  const translated = locale === "vi" && hasViName(concept.id);

  useEffect(() => {
    // Không cướp focus khi bảng mở từ deep link lúc tải trang.
    if (focusOnOpen) title.current?.focus({ preventScroll: true });
  }, [concept.id, focusOnOpen]);

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-atlas-sheet
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className={cn(
        PANEL,
        "absolute z-30 flex flex-col gap-3 overflow-hidden p-4",
        "atlas-phone:inset-x-3 atlas-phone:bottom-[calc(6.5rem+env(safe-area-inset-bottom))]",
        isolate ? "atlas-phone:max-h-[44%]" : "atlas-phone:max-h-[52%]",
        "atlas-short:bottom-3 atlas-short:right-14 atlas-short:top-3 atlas-short:w-60",
        "atlas-wide:bottom-36 atlas-wide:right-20 atlas-wide:top-20 atlas-wide:w-80 atlas-wide:p-5",
      )}
    >
      <header className="flex shrink-0 items-start gap-3 pr-8">
        <span
          aria-hidden
          className="mt-2 h-0.5 w-6 shrink-0 rounded-full"
          style={{ background: system ? SYSTEM_COLORS[system] : undefined }}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {system ? t(`systemNames.${system}`) : t("detail.anatomy")}
          </p>
          <h2
            ref={title}
            id={titleId}
            tabIndex={-1}
            className="mt-1 font-display text-2xl leading-tight font-bold tracking-tight outline-none"
          >
            {name}
          </h2>
          {translated && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("detail.englishName")}: {concept.name}
            </p>
          )}
        </div>
      </header>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3"
        onClick={onClose}
        aria-label={t("detail.close")}
      >
        <X />
      </Button>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {explainedKey
            ? t(`explanations.${explainedKey}`)
            : system
              ? t(`systemDescriptions.${system}`)
              : ""}
        </p>
        {!explainedKey && (
          <p className="-mt-1 text-[11px] leading-snug text-muted-foreground">
            {t("detail.systemNote")}
          </p>
        )}

        {articles.length > 0 && (
          <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-3">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <BookOpen aria-hidden className="size-3.5" />
              {t("detail.readMore")}
            </p>
            <ul className="mt-1.5 space-y-1">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-sm leading-snug text-accent underline-offset-4 hover:underline"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="flex shrink-0 gap-6 border-y py-3 text-xs text-muted-foreground">
          <div>
            <dt>{t("detail.reference")}</dt>
            <dd className="mt-0.5 font-medium text-foreground tabular-nums">{concept.id}</dd>
          </div>
          <div>
            <dt>{t("detail.selectedPieces")}</dt>
            <dd className="mt-0.5 font-medium text-foreground tabular-nums">
              {parts.length.toLocaleString(locale)}
            </dd>
          </div>
        </dl>

        {parts.length > 1 && (
          <div>
            <h3 className="mb-1 text-xs font-semibold">{t("detail.included")}</h3>
            <ul>
              {parts.slice(0, 50).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onChoosePart(p.id)}
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {displayName(locale, p.conceptId, p.name)}
                    </span>
                    <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
            {parts.length > 50 && (
              <p className="mt-1 px-2 text-xs text-muted-foreground">
                {t("detail.more", { count: (parts.length - 50).toLocaleString(locale) })}
              </p>
            )}
          </div>
        )}

        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("detail.source")}
          <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t pt-3 atlas-phone:flex-row atlas-phone:gap-2">
        <Button
          className="atlas-phone:h-auto atlas-phone:min-h-10 atlas-phone:min-w-0 atlas-phone:flex-1 atlas-phone:py-2 atlas-phone:whitespace-normal"
          variant={isolate ? "secondary" : "outline"} onClick={onIsolate} aria-pressed={isolate}>
          <Focus aria-hidden />
          {isolate ? t("detail.showSurrounding") : t("detail.isolate")}
        </Button>
        <Button variant="ghost" size="sm" className="atlas-phone:h-10" onClick={onClear}>
          {t("detail.clear")}
        </Button>
      </div>
    </section>
  );
}
