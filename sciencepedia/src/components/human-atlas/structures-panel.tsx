"use client";

// Client: ẩn/hiện/chọn cấu trúc đổi state của trình xem, vốn chỉ sống ở client.

import { useTranslations } from "next-intl";
import { ArrowLeft, Eye, EyeOff, Focus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnatomicalStructure } from "@/lib/human-atlas/atlas-model";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/human-atlas/panel";

type Props = {
  open: boolean;
  viewName: string;
  /** Tên hệ của góc nhìn — nhãn nút quay về trang của hệ ấy. */
  systemName: string;
  /** Góc nhìn `partial`: thiếu gì (views.ts). */
  note?: string | null;
  locale: string;
  structures: readonly AnatomicalStructure[];
  hidden: ReadonlySet<string>;
  /** Id cấu trúc đang chọn (tô sáng) — null nếu không. */
  selectedId: string | null;
  isolated: boolean;
  onSelect: (s: AnatomicalStructure) => void;
  onToggle: (s: AnatomicalStructure) => void;
  onIsolate: (s: AnatomicalStructure) => void;
  onShowAll: () => void;
  onBack: () => void;
  onClose: () => void;
};

/**
 * Bảng "Cấu trúc" của một góc nhìn giải phẫu — lớp dưới của Hệ → Góc nhìn.
 *
 * Nằm ĐÚNG chỗ danh sách hệ (cùng `id`, cùng nút mở trên điện thoại): trong một
 * góc nhìn theo hệ, bật/tắt cả hệ là rời góc nhìn, nên danh sách hệ không còn
 * việc gì để làm ở đó. "Về [tên hệ]" mở lưới Góc nhìn ở trang của hệ ấy (tab
 * "Theo hệ": Tổng quan + góc nhìn giải phẫu) — lối lên một cấp.
 *
 * Chỉ ba thao tác mà cảnh làm được thật: chọn (tô sáng + bay tới), ẩn/hiện (tập
 * `hiddenIn` của cảnh), xem riêng (chế độ `isolate` sẵn có). Không có "khoá",
 * "độ trong" riêng từng cấu trúc — cảnh không có đường vẽ cho chúng.
 */
export function StructuresPanel({
  open,
  viewName,
  systemName,
  note,
  locale,
  structures,
  hidden,
  selectedId,
  isolated,
  onSelect,
  onToggle,
  onIsolate,
  onShowAll,
  onBack,
  onClose,
}: Props) {
  const t = useTranslations("humanAtlas.atlasViews.structures");
  const name = (s: AnatomicalStructure) =>
    s.name ? (locale === "vi" ? s.name.vi : s.name.en) : t("rest");
  const shown = structures.filter((s) => !s.parts.every((id) => hidden.has(id))).length;
  const pristine = shown === structures.length && !isolated && !selectedId;

  return (
    <section
      id="atlas-systems"
      // Cảnh 3D đo bảng này để đặt mô hình vào phần khung còn trống bên phải nó.
      data-atlas-avoid="left"
      aria-label={t("title")}
      className={cn(
        PANEL,
        "absolute z-30 hidden flex-col px-3 pt-3",
        "atlas-wide:bottom-36 atlas-wide:left-4 atlas-wide:top-32 atlas-wide:flex atlas-wide:w-64 lg:atlas-wide:left-6",
        "atlas-phone:inset-x-3 atlas-phone:bottom-[calc(6.5rem+env(safe-area-inset-bottom))] atlas-phone:max-h-[45%]",
        "atlas-short:bottom-3 atlas-short:left-3 atlas-short:top-3 atlas-short:w-64",
        open && "atlas-phone:flex atlas-short:flex",
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <p className="truncate text-xs text-muted-foreground">{viewName}</p>
          {note && <p className="mt-1 text-[11px] leading-snug text-warning">{note}</p>}
        </div>
        <Button variant="ghost" size="icon-sm" className="atlas-wide:hidden" onClick={onClose} aria-label={t("close")}>
          <X />
        </Button>
      </div>

      <ul className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t px-1 py-1.5">
        {structures.map((s) => {
          const label = name(s);
          const off = s.parts.every((id) => hidden.has(id));
          const selected = selectedId === s.id;
          return (
            <li key={s.id} className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-pressed={!off}
                aria-label={off ? t("show", { name: label }) : t("hide", { name: label })}
                onClick={() => onToggle(s)}
              >
                {off ? <EyeOff aria-hidden className="text-muted-foreground" /> : <Eye aria-hidden />}
              </Button>
              <button
                type="button"
                disabled={off}
                aria-pressed={selected}
                aria-label={t("select", { name: label })}
                onClick={() => onSelect(s)}
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 items-center rounded-lg px-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent atlas-wide:min-h-9",
                  selected && "bg-muted font-medium",
                  s.rest && "italic",
                )}
              >
                <span className="truncate">{label}</span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("shrink-0", selected && isolated && "bg-muted")}
                aria-pressed={selected && isolated}
                aria-label={t("isolate", { name: label })}
                title={t("isolate", { name: label })}
                onClick={() => onIsolate(s)}
              >
                <Focus aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t py-1 text-xs text-muted-foreground">
        <span className="tabular-nums" aria-live="polite">
          {t("count", { shown, total: structures.length })}
        </span>
        <Button variant="ghost" size="sm" onClick={onShowAll} disabled={pristine}>
          {t("showAll")}
        </Button>
      </div>
      <div className="border-t py-1.5">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onBack}>
          <ArrowLeft aria-hidden />
          {t("backToSystem", { system: systemName })}
        </Button>
      </div>
    </section>
  );
}
