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
import { displayName, hasViName, viNameStatus } from "@/lib/human-atlas/names-vi";
import type { StructureArticle } from "@/lib/human-atlas/structure-links";
import {
  ANATOMY_SOURCES,
  fmaName,
  fmaSourceUrl,
  primaryPartOf,
  resolveContent,
  type AnatomyData,
  type Bilingual,
  type StructureContent,
} from "@/lib/human-atlas/structures";
import { ATLAS_PROVENANCE } from "@/lib/human-atlas/provenance";
import { SYSTEM_DESCRIPTIONS, sectionNumber } from "@/lib/human-atlas/system-descriptions";
import { SUPPLEMENT_SOURCE } from "@/lib/human-atlas/supplements";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/human-atlas/panel";

/**
 * Trang tải dữ liệu chính thức của BodyParts3D — nguồn của HÌNH. Trước đây trỏ
 * `lifesciencedb.jp/bp3d/`, tức công cụ Anatomography chứ không phải bộ dữ liệu.
 */
const MODEL_SOURCE_URL = ATLAS_PROVENANCE.model.sourceUrl;
const LYMPH_SOURCE_URL = ATLAS_PROVENANCE.lymphatic.sourceUrl;
const ZA_SOURCE_URL = ATLAS_PROVENANCE.zAnatomy.sourceUrl;

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
  anatomy,
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
  /** Dữ liệu FMA (Level 0–1); `null` khi chưa tải xong hoặc chưa phát hành — bảng vẫn đủ dùng. */
  anatomy: AnatomyData | null;
  focusOnOpen: boolean;
  onIsolate: () => void;
  onChoosePart: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("humanAtlas");
  const fromUmcg = parts.some((p) => SUPPLEMENT_SOURCE[p.id] === "umcg-lymphatic");
  const fromZa = parts.some((p) => SUPPLEMENT_SOURCE[p.id] === "z-anatomy");
  const fromBp3d = parts.length === 0 || parts.some((p) => !SUPPLEMENT_SOURCE[p.id]);
  const title = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const first = parts[0];
  const system = first?.system;
  const explainedKey = EXPLAINED[concept.id];
  const structure = anatomy?.structures[concept.id] ?? null;
  const name = displayName(locale, concept.id, concept.name);
  // Tên gốc chỉ hiện khi tên chính thật sự là bản dịch — không lặp cùng một chữ hai lần.
  const english = concept.name.charAt(0).toUpperCase() + concept.name.slice(1);
  const translated = locale === "vi" && hasViName(concept.id, concept.name) && name !== english;
  const unreviewed =
    translated && viNameStatus(concept.id, concept.name) === "machine-translated";

  /*
   * Chỉ hiện "Thuộc", không hiện cha is-a: is-a của FMA là lớp ontology
   * ("Organ with cavitated organ parts" cho tim) — đúng, nhưng với người đọc
   * nó là tiếng lóng. Dữ liệu vẫn giữ is-a cho tìm kiếm và các mức sau.
   */
  const partOfId = anatomy && structure ? primaryPartOf(anatomy, structure) : null;
  const partOfEn = anatomy && partOfId ? fmaName(anatomy, partOfId) : null;
  const partOf = partOfId && partOfEn ? displayName(locale, partOfId, partOfEn) : null;

  // Level 2: của chính nó, hoặc kế thừa (is-a, rồi cha part-of) — `about` nói là của ai.
  const resolved = anatomy ? resolveContent(anatomy, concept.id) : null;
  const aboutName =
    resolved && resolved.about !== concept.id && anatomy
      ? displayName(locale, resolved.about, fmaName(anatomy, resolved.about) ?? resolved.about)
      : null;

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
            <p lang="en" className="mt-1 text-sm leading-snug text-muted-foreground">
              <span className="sr-only">{t("detail.englishName")}: </span>
              {english}
            </p>
          )}
          {structure?.names.la && (
            <p lang="la" className="mt-0.5 text-sm leading-snug text-muted-foreground italic">
              <span className="sr-only">{t("detail.latinName")}: </span>
              {structure.names.la}
            </p>
          )}
          {unreviewed && (
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              {t("detail.nameMachine")}
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
        {/* Mô tả riêng nếu có. Không có thì mô tả của HỆ — nhưng dưới tiêu
            đề riêng, trong khung riêng: đặt thẳng đoạn "cơ xương tạo ra cử
            động…" dưới tên "Phần ức sườn cơ ngực lớn trái" là để người đọc
            tưởng đó là mô tả của đúng cấu trúc ấy. */}
        {resolved && !aboutName ? (
          <StructureText content={resolved.content} locale={locale} />
        ) : resolved && aboutName ? (
          <div className="rounded-xl border border-dashed p-3">
            <h3 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {t("detail.aboutParent", { name: aboutName })}
            </h3>
            <div className="mt-1.5">
              <StructureText content={resolved.content} locale={locale} />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">
              {t("detail.parentNote", {
                // Giữa câu: "…nói về cơ ngực lớn", không "…nói về Cơ ngực lớn".
                name: aboutName.charAt(0).toLocaleLowerCase(locale) + aboutName.slice(1),
              })}
            </p>
          </div>
        ) : explainedKey ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`explanations.${explainedKey}`)}
          </p>
        ) : (
          system && SYSTEM_DESCRIPTIONS[system] && (
            <div className="rounded-xl border border-dashed p-3">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                {t("detail.systemOverview", { system: t(`systemNames.${system}`) })}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {locale === "vi"
                  ? SYSTEM_DESCRIPTIONS[system].summary.vi
                  : SYSTEM_DESCRIPTIONS[system].summary.en}
              </p>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">
                {t("detail.systemNote")}
              </p>
            </div>
          )
        )}

        {partOf && (
          <dl className="grid shrink-0 grid-cols-[auto_1fr] gap-x-3 text-sm">
            <dt className="text-muted-foreground">{t("detail.partOf")}</dt>
            <dd className="min-w-0 font-medium">{partOf}</dd>
          </dl>
        )}

        {/* "Xem riêng" ngay dưới mô tả, trên phần mã tham chiếu: đó là việc
            người đọc muốn làm tiếp sau khi biết mình vừa chạm vào gì. Ở đáy
            bảng nó bị đọc như nút phụ và ít ai tìm thấy. */}
        <Button
          className="h-auto min-h-10 w-full shrink-0 py-2 whitespace-normal"
          variant={isolate ? "secondary" : "outline"}
          onClick={onIsolate}
          aria-pressed={isolate}
        >
          <Focus aria-hidden />
          {isolate ? t("detail.showSurrounding") : t("detail.isolate")}
        </Button>

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

        <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 border-y py-3 text-xs text-muted-foreground">
          <div>
            <dt>{t("detail.reference")}</dt>
            <dd className="mt-0.5 font-medium text-foreground tabular-nums">{concept.id}</dd>
          </div>
          {structure?.identifiers.ta98 && (
            <div>
              <dt>TA98</dt>
              <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                {structure.identifiers.ta98}
              </dd>
            </div>
          )}
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

        {/* Hai nguồn, hai vai: FMA cho thông tin giải phẫu của ĐÚNG cấu trúc
            này, BodyParts3D cho hình. Trước đây chỉ có một link chung tới trang
            chủ BodyParts3D, giống hệt nhau cho mọi cấu trúc. */}
        <div className="flex flex-col items-start gap-1">
          {/* Khái niệm Z-Anatomy mang mã nội bộ `ZA-…`, không phải mã FMA. */}
          {concept.id.startsWith("FMA") && (
          <a
            href={fmaSourceUrl(concept.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("detail.source")}
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
          )}
          {/* Nguồn HÌNH theo đúng mảnh đang chọn: mạng bạch huyết không phải
              BodyParts3D (giấy phép khác, phải ghi công UMCG). */}
          {(fromUmcg ? [[LYMPH_SOURCE_URL, t("detail.modelSourceLymph")]] : [])
            .concat(fromZa ? [[ZA_SOURCE_URL, t("detail.modelSourceZa")]] : [])
            .concat(
            fromBp3d ? [[MODEL_SOURCE_URL, t("detail.modelSource")]] : [],
          ).map(([href, label]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {label}
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 justify-center border-t pt-2">
        <Button variant="ghost" size="sm" className="atlas-phone:h-10" onClick={onClear}>
          {t("detail.clear")}
        </Button>
      </div>
    </section>
  );
}

/**
 * Tóm tắt, vị trí, chức năng — NGUYÊN VĂN đã duyệt, không cắt, không
 * line-clamp (docs/content-rules.md, "Không cắt chuỗi đã duyệt"). Dòng nguồn
 * đặt ngay dưới, link mở thẳng đúng mục sách; ghi "biên soạn từ" chứ không
 * "trích từ" — câu chữ là của Sciencepedia, sách chỉ là nguồn dữ kiện.
 */
function StructureText({ content, locale }: { content: StructureContent; locale: string }) {
  const t = useTranslations("humanAtlas.detail");
  const pick = (value: Bilingual) => (locale === "vi" ? value.vi : value.en);
  const openstax = ANATOMY_SOURCES["openstax-ap2e"];
  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      <p className="text-muted-foreground">{pick(content.summary)}</p>
      {(content.location || content.function) && (
        <dl className="space-y-2">
          {content.location && (
            <div>
              <dt className="text-xs font-semibold">{t("location")}</dt>
              <dd className="text-muted-foreground">{pick(content.location)}</dd>
            </div>
          )}
          {content.function && (
            <div>
              <dt className="text-xs font-semibold">{t("function")}</dt>
              <dd className="text-muted-foreground">{pick(content.function)}</dd>
            </div>
          )}
        </dl>
      )}
      <p className="text-[11px] leading-snug text-muted-foreground">
        {t("compiledFrom", { source: openstax.title })}{" "}
        {content.sources.map((source, index) => (
          <span key={source.url}>
            {index > 0 && ", "}
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("section", { number: sectionNumber(source.section) })}
            </a>
          </span>
        ))}
        {" · "}
        {t("reviewedBy")}
      </p>
    </div>
  );
}
