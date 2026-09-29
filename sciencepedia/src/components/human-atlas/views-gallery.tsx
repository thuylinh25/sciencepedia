"use client";

// Client: chọn góc nhìn đổi state của trình xem, và ảnh thu nhỏ do cảnh 3D
// chụp ở client sau khi tải mô hình.

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ATLAS_VIEWS, isUsableView } from "@/lib/human-atlas/views";
import { Button } from "@/components/ui/button";

type Props = {
  locale: string;
  activeViewId: string | null;
  /** id góc nhìn → ảnh (data URL) do cảnh chụp; thiếu thì thẻ hiện khung chờ. */
  thumbnails: Record<string, string>;
  onChoose: (id: string) => void;
  onClose: () => void;
};

/**
 * Lưới "Góc nhìn theo vùng" phủ lên khung xem — theo lối Regional Views của
 * các atlas giải phẫu: thẻ lớn, ảnh chụp từ chính mô hình, nhãn đánh số ở chân
 * thẻ. Mô hình vẫn mờ phía sau (nền bán trong suốt) để người đọc không mất chỗ.
 *
 * Thẻ thiếu dữ liệu vẫn hiện (có trong kế hoạch) nhưng không bấm được, và nói
 * rõ thiếu gì.
 */
export function ViewsGallery({ locale, activeViewId, thumbnails, onChoose, onClose }: Props) {
  const t = useTranslations("humanAtlas.atlasViews");
  const close = useRef<HTMLButtonElement>(null);
  const pick = (v: { vi: string; en: string }) => (locale === "vi" ? v.vi : v.en);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="atlas-views-title"
      className="absolute inset-0 z-40 overflow-y-auto overscroll-contain bg-[#05070a]/80 px-4 pt-5 pb-8 backdrop-blur-sm sm:px-8"
    >
      <div className="relative mx-auto max-w-6xl">
        <h2 id="atlas-views-title" className="text-center font-display text-xl text-white/90 sm:text-2xl">
          {t("title")}
        </h2>
        <Button
          ref={close}
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 text-white/80 hover:bg-white/10 hover:text-white"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X aria-hidden />
        </Button>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {ATLAS_VIEWS.map((view, index) => {
            const usable = isUsableView(view.id);
            const active = view.id === activeViewId;
            const src = thumbnails[view.id];
            const label = `${index + 1}. ${pick(view.name)}`;
            return (
              <li key={view.id}>
                <button
                  type="button"
                  onClick={usable ? () => onChoose(view.id) : undefined}
                  aria-pressed={usable ? active : undefined}
                  aria-disabled={!usable || undefined}
                  aria-label={usable ? label : `${label} — ${t("missing")}`}
                  title={view.missing ? pick(view.missing) : undefined}
                  className={cn(
                    "group relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-white/[0.04] text-left outline-none ring-offset-2 ring-offset-[#05070a] transition focus-visible:ring-[3px] focus-visible:ring-ring",
                    usable ? "hover:bg-white/[0.08]" : "cursor-not-allowed",
                    active && "ring-2 ring-accent",
                  )}
                >
                  {src ? (
                    // Data URL do cảnh 3D chụp ở client — next/image không tối ưu được nó.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      width={240}
                      height={300}
                      className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className={cn("absolute inset-0 grid place-items-center text-[11px] text-white/40", usable && "animate-pulse")}
                    >
                      {usable ? t("rendering") : ""}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 pt-6 pb-2 text-center text-[13px] font-medium text-white">
                    {label}
                    {!usable && <span className="block text-[10px] font-normal text-white/60">{t("missing")}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
