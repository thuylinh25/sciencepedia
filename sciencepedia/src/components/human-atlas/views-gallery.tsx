"use client";

// Client: chọn góc nhìn đổi state của trình xem, và ảnh thu nhỏ do cảnh 3D
// chụp ở client sau khi tải mô hình.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemId } from "@/lib/human-atlas/anatomy";
import {
  REGIONAL_VIEWS,
  isSystemView,
  isUsableView,
  systemsWithViews,
  viewById,
  type AtlasViewDef,
} from "@/lib/human-atlas/views";
import { anatomicalSystem } from "@/lib/human-atlas/atlas-model";
import { SYSTEM_DESCRIPTIONS } from "@/lib/human-atlas/system-descriptions";
import { Button } from "@/components/ui/button";

type Props = {
  locale: string;
  activeViewId: string | null;
  /** id góc nhìn → ảnh (data URL) do cảnh chụp; thiếu thì thẻ hiện khung chờ. */
  thumbnails: Record<string, string>;
  onChoose: (id: string) => void;
  onClose: () => void;
};

type Tab = "regional" | "system";

/**
 * Lưới góc nhìn, hai tab:
 *
 * - "Theo vùng": một vùng cơ thể với mọi hệ nằm cạnh nhau (bên dưới).
 * - "Theo hệ": chọn một hệ, rồi Tổng quan (một thẻ lớn) → các góc nhìn giải
 *   phẫu (lưới đánh số). Cấu trúc KHÔNG có thẻ ở đây: chúng là lớp dưới, nằm
 *   trong bảng "Cấu trúc" của trình xem sau khi mở một góc nhìn — lưới hai chục
 *   thẻ "Sụn mũi", "Thuỳ dưới phổi trái"… là thư viện mô hình, không phải atlas
 *   để học. Thẻ dựng từ `anatomicalSystem()`, không viết tay; hệ chỉ hiện ở
 *   tab này khi đã có preset.
 *
 * Lưới phủ lên khung xem — theo lối Regional Views của
 * các atlas giải phẫu: thẻ lớn, ảnh chụp từ chính mô hình, nhãn đánh số ở chân
 * thẻ. Mô hình vẫn mờ phía sau (nền bán trong suốt) để người đọc không mất chỗ.
 *
 * Thẻ thiếu dữ liệu vẫn hiện (có trong kế hoạch) nhưng không bấm được, và nói
 * rõ thiếu gì.
 *
 * ## Vì sao gắn vào <body> chứ không phủ trong khung xem
 *
 * Bản đầu là một vùng cuộn riêng (`inset-0 overflow-y-auto`) trong khung xem.
 * Trên điện thoại khung xem chiếm cả màn hình, nên vuốt đâu cũng chỉ cuộn lưới:
 * thanh cuộn của trang biến mất và không xuống được phần dưới trang. Nay lưới
 * nằm trong luồng cuộn của trang — bắt đầu từ mép trên khung xem, cao theo nội
 * dung, không tự cuộn — nên chỉ còn MỘT thanh cuộn là của trang.
 */
export function ViewsGallery({ locale, activeViewId, thumbnails, onChoose, onClose }: Props) {
  const t = useTranslations("humanAtlas.atlasViews");
  const close = useRef<HTMLButtonElement>(null);
  const pick = (v: { vi: string; en: string }) => (locale === "vi" ? v.vi : v.en);
  /** Vị trí khung xem trong trang (toạ độ tài liệu) — lưới phủ đúng từ đó xuống. */
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const systems = systemsWithViews();
  const current = viewById(activeViewId);
  // Mở lại lưới khi đang ở một góc nhìn theo hệ thì mở đúng tab và hệ ấy.
  const [tab, setTab] = useState<Tab>(isSystemView(current) ? "system" : "regional");
  const [system, setSystem] = useState<SystemId | undefined>(
    current && isSystemView(current) ? current.systemId : systems[0],
  );
  const tSystems = useTranslations("humanAtlas.systemNames");
  const model = system ? anatomicalSystem(system) : null;
  const summary = system ? SYSTEM_DESCRIPTIONS[system]?.short : undefined;

  useLayoutEffect(() => {
    const section = document.getElementById("atlas-viewer");
    if (!section) return;
    const measure = () => {
      const r = section.getBoundingClientRect();
      setFrame({ top: r.top + window.scrollY, height: r.height });
    };
    measure();
    // Mở lưới thì đưa mép trên khung xem lên đầu màn (scroll-mt chừa header dính).
    section.scrollIntoView({ block: "start", behavior: "instant" });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Lưới cao hơn khung xem thì phần thừa phủ lên nội dung bên dưới (thẻ hệ,
  // bảng ghi công) — đẩy nội dung xuống đúng bằng phần thừa, gỡ khi đóng.
  useLayoutEffect(() => {
    const node = overlay.current;
    const section = document.getElementById("atlas-viewer");
    if (!node || !section || !frame) return;
    const sync = () => {
      section.style.marginBottom = `${Math.max(0, node.offsetHeight - frame.height)}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      observer.disconnect();
      section.style.marginBottom = "";
    };
  }, [frame]);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!frame) return null;
  return createPortal(
    <div
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="atlas-views-title"
      style={{ top: frame.top, minHeight: frame.height }}
      className="atlas-gallery absolute inset-x-0 z-40 bg-(--gallery-page)/95 px-4 pt-5 pb-10 backdrop-blur-sm sm:px-8"
    >
      <div className="relative mx-auto max-w-6xl">
        <h2 id="atlas-views-title" className="text-center font-display text-xl text-(--gallery-fg) sm:text-2xl">
          {t("title")}
        </h2>
        <Button
          ref={close}
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 text-(--gallery-muted) hover:bg-(--gallery-card-hover) hover:text-(--gallery-fg)"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X aria-hidden />
        </Button>

        <div role="tablist" aria-label={t("title")} className="mt-4 flex justify-center gap-1">
          {(["regional", "system"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium text-(--gallery-muted) outline-none transition hover:text-(--gallery-fg) focus-visible:ring-[3px] focus-visible:ring-ring",
                tab === key && "bg-(--gallery-card-hover) text-(--gallery-fg) ring-1 ring-(--gallery-border)",
              )}
            >
              {t(key === "regional" ? "tabRegional" : "tabSystem")}
            </button>
          ))}
        </div>

        {tab === "regional" ? (
          <div role="tabpanel" className="mt-3">
            <ViewGrid views={REGIONAL_VIEWS} numbered {...{ activeViewId, thumbnails, onChoose, pick }} />
          </div>
        ) : (
          <div role="tabpanel" className="mt-3">
            {systems.length > 1 && (
              <div className="mb-2 flex flex-wrap justify-center gap-2">
                {systems.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={system === id}
                    onClick={() => setSystem(id)}
                    className={cn(
                      "rounded-full border border-(--gallery-border) px-3 py-1 text-xs text-(--gallery-muted) outline-none hover:bg-(--gallery-card-hover) hover:text-(--gallery-fg) focus-visible:ring-[3px] focus-visible:ring-ring",
                      system === id && "border-(--gallery-selected) bg-(--gallery-card-hover) text-(--gallery-fg)",
                    )}
                  >
                    {tSystems(id)}
                  </button>
                ))}
              </div>
            )}
            {system && (
              <>
                <h3 className="mt-2 text-center font-display text-lg text-(--gallery-fg) sm:text-xl">{tSystems(system)}</h3>
                {!model || (!model.overview && model.views.length === 0) ? (
                  <p className="mt-6 text-center text-sm text-(--gallery-muted)">{t("emptySystem")}</p>
                ) : (
                  <>
                    {model.overview && (
                      <section aria-labelledby="atlas-views-overview" className="mt-4">
                        <h4 id="atlas-views-overview" className="sr-only">
                          {t("section.overview")}
                        </h4>
                        <OverviewCard
                          view={model.overview.def}
                          usable={model.overview.usable}
                          active={model.overview.def.id === activeViewId}
                          src={thumbnails[model.overview.def.id]}
                          summary={summary ? pick(summary) : null}
                          count={model.views.length}
                          onChoose={onChoose}
                          pick={pick}
                        />
                      </section>
                    )}
                    {model.views.length > 0 && (
                      <section aria-labelledby="atlas-views-group" className="mt-6">
                        <h4
                          id="atlas-views-group"
                          className="text-[11px] font-semibold tracking-[0.14em] text-(--gallery-muted) uppercase"
                        >
                          {t("section.group")}
                        </h4>
                        <ViewGrid
                          views={model.views.map((v) => v.def)}
                          numbered
                          {...{ activeViewId, thumbnails, onChoose, pick }}
                        />
                      </section>
                    )}
                    {model.unavailable.length > 0 && (
                      <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-(--gallery-muted)">
                        {t("unavailable")}{" "}
                        {model.unavailable
                          .map((v) => `${pick(v.def.name)} (${v.def.missing ? pick(v.def.missing).toLowerCase() : t("missing").toLowerCase()})`)
                          .join("; ")}
                      </p>
                    )}
                  </>
                )}
                {system === "respiratory" && (
                  <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-(--gallery-muted)">
                    {t("dataNote.respiratory")}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Vùng vẽ mô hình của thẻ: ảnh thu nhỏ (nền trong suốt) trên quầng sáng
 * `--gallery-stage` — mô hình tối và bối cảnh mờ nổi lên nhờ nền, không nhờ
 * đổi vật liệu. Tách hẳn khỏi nhãn: nhãn không phủ lên mô hình.
 */
function Stage({ src, usable, className }: { src: string | undefined; usable: boolean; className?: string }) {
  const t = useTranslations("humanAtlas.atlasViews");
  return (
    <span
      className={cn(
        "relative block aspect-[4/5] w-full bg-[radial-gradient(ellipse_at_50%_45%,var(--gallery-stage)_0%,transparent_72%)]",
        className,
      )}
    >
      {src ? (
        // Data URL do cảnh 3D chụp ở client — next/image không tối ưu được nó.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={240} height={300} className="absolute inset-0 size-full object-contain" />
      ) : (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 grid place-items-center text-[11px] text-(--gallery-muted)",
            usable && "animate-pulse",
          )}
        >
          {usable ? t("rendering") : ""}
        </span>
      )}
    </span>
  );
}

/** Thẻ: chọn = viền xanh 2px (không glow); focus bàn phím = outline sáng, tách khỏi viền chọn. */
const CARD = cn(
  "group overflow-hidden border border-(--gallery-border) bg-(--gallery-card) text-left outline-none transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--gallery-fg)",
);

function ViewGrid({
  views,
  numbered = false,
  activeViewId,
  thumbnails,
  onChoose,
  pick,
}: {
  views: readonly AtlasViewDef[];
  numbered?: boolean;
  activeViewId: string | null;
  thumbnails: Record<string, string>;
  onChoose: (id: string) => void;
  pick: (v: { vi: string; en: string }) => string;
}) {
  const t = useTranslations("humanAtlas.atlasViews");
  return (
    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {views.map((view, index) => {
        const usable = isUsableView(view.id);
        const active = view.id === activeViewId;
        const label = numbered ? `${index + 1}. ${pick(view.name)}` : pick(view.name);
        return (
          <li key={view.id} className="flex">
            <button
              type="button"
              onClick={usable ? () => onChoose(view.id) : undefined}
              aria-pressed={usable ? active : undefined}
              aria-disabled={!usable || undefined}
              aria-label={
                !usable ? `${label} — ${t("missing")}` : view.partial ? `${label} — ${t("partial")}: ${pick(view.partial)}` : label
              }
              title={view.missing ? pick(view.missing) : undefined}
              className={cn(
                CARD,
                "flex w-full flex-col rounded-lg",
                usable ? "hover:bg-(--gallery-card-hover)" : "cursor-not-allowed",
                active && "border-(--gallery-selected) ring-1 ring-(--gallery-selected)",
              )}
            >
              <span className="relative block w-full">
                <Stage src={thumbnails[view.id]} usable={usable} />
                {usable && view.partial && (
                  <span
                    title={pick(view.partial)}
                    className="absolute top-2 left-2 rounded-full bg-(--gallery-badge) px-1.5 py-0.5 text-[10px] leading-none font-medium text-(--gallery-badge-fg)"
                  >
                    {t("partial")}
                  </span>
                )}
              </span>
              {/* Nhãn dưới vùng vẽ, cao tối thiểu hai dòng: thẻ cùng hàng cao bằng nhau. */}
              <span className="flex min-h-[3.25rem] flex-1 flex-col justify-center border-t border-(--gallery-border) px-2 py-2 text-center">
                <span className="line-clamp-2 text-[13px] leading-snug font-medium text-(--gallery-fg)">{label}</span>
                {/* Điện thoại không có hover để đọc `title`: nói luôn thiếu gì. */}
                {!usable && (
                  <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-(--gallery-muted)">
                    {view.missing ? pick(view.missing) : t("missing")}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Thẻ "Tổng quan" của một hệ: to hơn thẻ lưới, kèm câu ngắn đã duyệt của hệ
 * (`system-descriptions`) và số góc nhìn giải phẫu — điểm vào mặc định của hệ.
 */
function OverviewCard({
  view,
  usable,
  active,
  src,
  summary,
  count,
  onChoose,
  pick,
}: {
  view: AtlasViewDef;
  usable: boolean;
  active: boolean;
  src: string | undefined;
  summary: string | null;
  count: number;
  onChoose: (id: string) => void;
  pick: (v: { vi: string; en: string }) => string;
}) {
  const t = useTranslations("humanAtlas.atlasViews");
  return (
    <button
      type="button"
      onClick={usable ? () => onChoose(view.id) : undefined}
      aria-pressed={usable ? active : undefined}
      aria-disabled={!usable || undefined}
      className={cn(
        CARD,
        "mx-auto flex w-full max-w-2xl items-stretch gap-4 rounded-xl p-3 sm:gap-6 sm:p-4",
        usable ? "hover:bg-(--gallery-card-hover)" : "cursor-not-allowed",
        active && "border-(--gallery-selected) ring-1 ring-(--gallery-selected)",
      )}
    >
      <Stage src={src} usable={usable} className="w-28 shrink-0 rounded-lg sm:w-44" />
      <span className="flex min-w-0 flex-col justify-center gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-(--gallery-muted) uppercase">
          {t("section.overview")}
        </span>
        <span className="font-display text-lg leading-tight text-(--gallery-fg) sm:text-2xl">{pick(view.name)}</span>
        {summary && (
          <span className="line-clamp-3 text-xs leading-relaxed text-(--gallery-muted) sm:text-sm">{summary}</span>
        )}
        <span className="text-xs text-(--gallery-muted)">{t("viewCount", { count })}</span>
        {usable && (
          <span className="mt-1 inline-flex w-fit rounded-full border border-(--gallery-border) bg-(--gallery-card-hover) px-3 py-1 text-xs font-medium text-(--gallery-fg)">
            {t("openOverview")}
          </span>
        )}
      </span>
    </button>
  );
}
