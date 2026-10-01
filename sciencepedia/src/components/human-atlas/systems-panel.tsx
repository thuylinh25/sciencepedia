"use client";

// Client: bật tắt hệ đổi state của trình xem, vốn chỉ sống ở client.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HeartPulse, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SYSTEM_COLORS, type SystemId } from "@/lib/human-atlas/anatomy";
import { FALLBACK_ICON, SYSTEM_GROUP, SYSTEM_ICON } from "@/lib/human-atlas/systems";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PANEL } from "@/components/human-atlas/panel";

type Props = {
  open: boolean;
  systems: SystemId[];
  counts: Record<SystemId, number>;
  visible: SystemId[];
  visibleCount: number;
  /** Số mảnh của bộ dữ liệu đang nạp — mẫu số của bộ đếm. */
  totalCount: number;
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
 *
 * Tim, động mạch, tĩnh mạch gộp thành MỘT hàng "Hệ tim mạch" (2026-10-01, `SYSTEM_GROUP`):
 * chủ sản phẩm so với Human Anatomy Atlas — bật hệ tim mạch ở đó là tim cùng cả cây mạch;
 * bật riêng "Tim" (18 mảnh) chỉ ra một quả tim nhỏ giữa khung. Hàng con vẫn mở ra được để
 * bật/tắt riêng, nên không mất điều khiển nào.
 */
export function SystemsPanel({
  open,
  systems,
  counts,
  visible,
  visibleCount,
  totalCount,
  locale,
  presets,
  onClose,
  onToggle,
  onShowOnly,
}: Props) {
  const t = useTranslations("humanAtlas");
  const [expanded, setExpanded] = useState(false);
  const cardio = systems.filter((id) => SYSTEM_GROUP[id] === "cardiovascular");
  const cardioOn = cardio.length > 0 && cardio.every((id) => visible.includes(id));
  const cardioSome = cardio.some((id) => visible.includes(id));
  const cardioName = t("systemGroups.cardiovascular");

  const row = (id: SystemId, child = false) => {
    const name = t(`systemNames.${id}`);
    const Icon = SYSTEM_ICON[id] ?? FALLBACK_ICON;
    const on = visible.includes(id);
    const only = t("showOnly", { name: name.toLowerCase() });
    return (
      <li key={id} className={cn("flex items-center gap-2", child && "pl-5")}>
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
          {/* Icon cùng màu vật liệu 3D của hệ — màu không phải dấu hiệu duy
              nhất: tên hệ luôn đi kèm (WCAG 1.4.1). */}
          <Icon aria-hidden className="size-4 shrink-0" style={{ color: SYSTEM_COLORS[id] }} />
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
  };

  return (
    <section
      id="atlas-systems"
      // Cảnh 3D đo bảng này để đặt mô hình vào phần khung còn trống bên phải nó.
      data-atlas-avoid="left"
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
          if (SYSTEM_GROUP[id] !== "cardiovascular") return row(id);
          if (id !== cardio[0]) return null;
          const only = t("showOnly", { name: cardioName.toLowerCase() });
          return [
            <li key="cardiovascular" className="flex items-center gap-0.5">
              <button
                type="button"
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 text-left text-sm outline-none transition-opacity hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 atlas-wide:min-h-9",
                  !cardioSome && "opacity-60",
                )}
                title={only}
                aria-label={only}
                onClick={() => onShowOnly(cardio)}
              >
                <HeartPulse aria-hidden className="size-4 shrink-0" style={{ color: SYSTEM_COLORS.cardiac }} />
                <span className="truncate">{cardioName}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {cardio.reduce((n, c) => n + counts[c], 0).toLocaleString(locale)}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                // Hẹp hơn nút thường: cột 16rem, tên "Hệ tim mạch" bị cắt nếu nút rộng 32px.
                className="size-6 shrink-0"
                aria-expanded={expanded}
                aria-label={t(expanded ? "collapseGroup" : "expandGroup", { name: cardioName.toLowerCase() })}
                onClick={() => setExpanded((e) => !e)}
              >
                <ChevronDown aria-hidden className={cn("transition-transform", expanded && "rotate-180")} />
              </Button>
              <Switch
                checked={cardioOn}
                onCheckedChange={() =>
                  onShowOnly(cardioOn ? visible.filter((v) => !cardio.includes(v)) : [...new Set([...visible, ...cardio])])
                }
                aria-label={t("toggleSystem", { name: cardioName.toLowerCase() })}
              />
            </li>,
            ...(expanded ? cardio.map((c) => row(c, true)) : []),
          ];
        })}
      </ul>

      <div className="flex min-h-11 items-center justify-between gap-2 border-t text-xs text-muted-foreground">
        {/* aria-live: bật tắt một hệ thì trình đọc màn hình đọc lại con số. */}
        <span className="tabular-nums" aria-live="polite">
          {t("visibleCount", {
            count: visibleCount.toLocaleString(locale),
            total: totalCount.toLocaleString(locale),
          })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onShowOnly([])}>
          {t("hideAll")}
        </Button>
      </div>
    </section>
  );
}
