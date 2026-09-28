"use client";

// Client: bật tắt hệ đổi state của trình xem, vốn chỉ sống ở client.

import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SYSTEM_COLORS, type SystemId } from "@/lib/human-atlas/anatomy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PANEL } from "@/components/human-atlas/panel";

type Props = {
  open: boolean;
  systems: SystemId[];
  counts: Record<SystemId, number>;
  visible: SystemId[];
  visibleCount: number;
  locale: string;
  presets: { all: SystemId[]; skeleton: SystemId[]; organs: SystemId[] };
  onClose: () => void;
  onToggle: (id: SystemId) => void;
  onShowOnly: (ids: SystemId[]) => void;
};

function same(a: SystemId[], b: SystemId[]) {
  return a.length === b.length && b.every((id) => a.includes(id));
}

/**
 * Danh sách hệ cơ thể.
 *
 * `atlas-wide`: cột bên trái, luôn mở. `atlas-phone` và `atlas-short`
 * (điện thoại xoay ngang): ẩn, mở bằng nút "Hệ cơ thể" ở thanh dưới — trên
 * điện thoại thành bảng nổi phía trên thanh đó, không phủ kín màn hình, nên
 * mô hình vẫn thấy được và vẫn thấy hệ vừa bật tắt thay đổi ra sao.
 */
export function SystemsPanel({
  open,
  systems,
  counts,
  visible,
  visibleCount,
  locale,
  presets,
  onClose,
  onToggle,
  onShowOnly,
}: Props) {
  const t = useTranslations("humanAtlas");

  return (
    <section
      id="atlas-systems"
      aria-label={t("systems")}
      className={cn(
        PANEL,
        "absolute z-30 hidden flex-col px-3 pt-3",
        "atlas-wide:bottom-36 atlas-wide:left-4 atlas-wide:top-32 atlas-wide:flex atlas-wide:w-64 lg:atlas-wide:left-6",
        "atlas-phone:inset-x-3 atlas-phone:bottom-[calc(6.5rem+env(safe-area-inset-bottom))] atlas-phone:max-h-[60%]",
        "atlas-short:bottom-3 atlas-short:left-3 atlas-short:top-3 atlas-short:w-64",
        open && "atlas-phone:flex atlas-short:flex",
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold">{t("systems")}</h2>
        <span className="hidden text-xs text-muted-foreground tabular-nums atlas-wide:inline">
          {systems.length}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="atlas-wide:hidden"
          onClick={onClose}
          aria-label={t("closeSystems")}
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b py-2.5">
        {(
          [
            ["all", presets.all],
            ["presetSkeleton", presets.skeleton],
            ["presetOrgans", presets.organs],
          ] as const
        ).map(([key, ids]) => (
          <Button
            key={key}
            size="sm"
            variant={same(visible, ids) ? "secondary" : "ghost"}
            aria-pressed={same(visible, ids)}
            onClick={() => onShowOnly(ids)}
          >
            {t(key)}
          </Button>
        ))}
      </div>

      <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1.5">
        {systems.map((id) => {
          const name = t(`systemNames.${id}`);
          const on = visible.includes(id);
          const only = t("showOnly", { name: name.toLowerCase() });
          return (
            <li key={id} className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 text-left text-sm outline-none transition-opacity hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 atlas-wide:min-h-9",
                  !on && "opacity-60",
                )}
                title={only}
                aria-label={only}
                onClick={() => onShowOnly([id])}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: SYSTEM_COLORS[id] }}
                />
                <span className="truncate">{name}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {counts[id].toLocaleString(locale)}
                </span>
              </button>
              <Switch
                checked={on}
                onCheckedChange={() => onToggle(id)}
                aria-label={t("toggleSystem", { name: name.toLowerCase() })}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex min-h-11 items-center justify-between gap-2 border-t text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t("visibleCount", { count: visibleCount.toLocaleString(locale) })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onShowOnly([])}>
          {t("hideAll")}
        </Button>
      </div>
    </section>
  );
}
