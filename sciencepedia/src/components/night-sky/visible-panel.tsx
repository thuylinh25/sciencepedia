"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Moon as MoonIcon, Route, Sun } from "lucide-react";

import type { SkyReport } from "@/lib/night-sky/astro";
import { findCatalogEntry, type CatalogEntry } from "@/lib/night-sky/catalog";
import { fmtDegrees, fmtEventTime } from "@/components/night-sky/sky-format";
import { cn } from "@/lib/utils";

/**
 * Danh sách "đang nhìn thấy" — cầu nối giữa khung trời và tri thức: người
 * đọc mới không biết chấm sáng kia là Sao Kim hay một ngôi sao, nên trang
 * tự tính (astronomy-engine, xem `astro.ts`) và liệt kê thay vì bắt họ
 * đoán. Mọi dòng đều là nút mở panel thông tin của đúng thiên thể đó.
 */
export function VisiblePanel({
  report,
  placeLabel,
  tz,
  viewedTime,
  isNow,
  onSelect,
  onStartTour,
}: {
  report: SkyReport | null;
  placeLabel: string;
  tz: string;
  viewedTime: Date;
  isNow: boolean;
  onSelect: (entry: CatalogEntry) => void;
  /** Mở tour dẫn — tour dựng từ chính báo cáo này (xem `tour.ts`). */
  onStartTour?: () => void;
}) {
  const t = useTranslations("nightSky");
  const locale = useLocale();
  const isEnglish = locale === "en";

  const selectById = (id: string) => {
    const entry = findCatalogEntry(id);
    if (entry) onSelect(entry);
  };

  const sunBanner = (): string => {
    if (!report) return "";
    const { sun } = report;
    if (sun.state === "day") {
      return sun.sunset
        ? t("sunDay", {
            place: placeLabel,
            time: fmtEventTime(tz, sun.sunset, locale, viewedTime),
          })
        : t("sunNoEvent", { place: placeLabel });
    }
    if (sun.state === "twilight") {
      return sun.darkTime
        ? t("sunTwilight", {
            place: placeLabel,
            time: fmtEventTime(tz, sun.darkTime, locale, viewedTime),
          })
        : t("sunTwilightNoDark", { place: placeLabel });
    }
    if (!sun.sunrise) return t("sunNoEvent", { place: placeLabel });
    const sunrise = fmtEventTime(tz, sun.sunrise, locale, viewedTime);
    return isNow
      ? t("sunNightTonight", { place: placeLabel, time: sunrise })
      : t("sunNight", { place: placeLabel, time: sunrise });
  };

  const above = report
    ? report.planets
        .filter((planet) => planet.altitudeDeg > 0)
        .sort((a, b) => b.altitudeDeg - a.altitudeDeg)
    : [];
  const below = report
    ? report.planets
        .filter((planet) => planet.altitudeDeg <= 0)
        .sort((a, b) => b.altitudeDeg - a.altitudeDeg)
    : [];

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">
          {isNow ? t("visibleNow") : t("visibleAtTime")}
        </h2>
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            disabled={!report}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            <Route className="size-3.5" />
            {t("tourStart")}
          </button>
        )}
      </div>

      {!report ? (
        <p className="mt-3 animate-pulse text-sm text-muted-foreground">
          {t("panelLoading")}
        </p>
      ) : (
        <>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <Sun className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <span>{sunBanner()}</span>
          </p>

          <button
            type="button"
            onClick={() => selectById("moon")}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
          >
            <MoonIcon className="size-5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {isEnglish ? "Moon" : "Mặt Trăng"} ·{" "}
                {isEnglish ? report.moon.phaseNameEn : report.moon.phaseNameVi}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("moonLit", {
                  percent: Math.round(report.moon.illumFraction * 100),
                })}
                {report.moon.rise &&
                  ` · ${t("riseLabel")} ${fmtEventTime(tz, report.moon.rise, locale, viewedTime)}`}
                {report.moon.set &&
                  ` · ${t("setLabel")} ${fmtEventTime(tz, report.moon.set, locale, viewedTime)}`}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <ul className="mt-3 divide-y">
            {[...above, ...below].map((planet) => {
              const entry = findCatalogEntry(planet.body.toLowerCase());
              const isAbove = planet.altitudeDeg > 0;
              return (
                <li key={planet.body}>
                  <button
                    type="button"
                    onClick={() => entry && onSelect(entry)}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        isAbove ? "bg-sky-400" : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {entry
                          ? isEnglish
                            ? entry.nameEn
                            : entry.nameVi
                          : planet.body}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {isAbove
                          ? `${fmtDegrees(planet.altitudeDeg)} · ${
                              isEnglish ? planet.compassEn : planet.compassVi
                            }`
                          : planet.rise
                            ? t("risesAt", {
                                time: fmtEventTime(
                                  tz,
                                  planet.rise,
                                  locale,
                                  viewedTime,
                                ),
                              })
                            : t("belowHorizonShort")}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
