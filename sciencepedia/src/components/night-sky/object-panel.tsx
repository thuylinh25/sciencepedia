"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowUpRight, Star } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { BodyReport, MoonReport } from "@/lib/night-sky/astro";
import {
  findCatalogEntry,
  type CatalogEntry,
} from "@/lib/night-sky/catalog";
import {
  fmtDayMonth,
  fmtDegrees,
  fmtEventTime,
} from "@/components/night-sky/sky-format";
import { Badge } from "@/components/ui/badge";

/** Dữ liệu đã tính cho thiên thể đang chọn: thiên thể hệ Mặt Trời đi qua
    báo cáo mọc/lặn của `astro.ts`; sao và chòm sao chỉ có độ cao/phương vị
    của điểm cố định (tâm chòm / vị trí sao). */
export type SelectedObjectData =
  | { kind: "body"; report: BodyReport }
  | {
      kind: "fixed";
      altitudeDeg: number;
      azimuthDeg: number;
      compassVi: string;
      compassEn: string;
    };

/**
 * Panel thông tin thiên thể của Sciencepedia — thay hộp thông tin mặc
 * định của engine (đã vô hiệu hoá trong `virtualsky.js`). Mọi con số đều
 * do astronomy-engine tính cho đúng nơi + lúc đang xem; phần chữ là nội
 * dung biên tập trong `catalog.ts` hoặc câu ghép từ chính dữ liệu đó.
 */
export function ObjectPanel({
  entry,
  data,
  moon,
  tz,
  viewedTime,
  onBack,
  isFavorite,
  onToggleFavorite,
}: {
  entry: CatalogEntry;
  data: SelectedObjectData | null;
  moon: MoonReport | null;
  tz: string;
  viewedTime: Date;
  onBack: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const t = useTranslations("nightSky");
  const locale = useLocale();
  const isEnglish = locale === "en";
  const name = isEnglish ? entry.nameEn : entry.nameVi;
  const altName = isEnglish ? entry.nameVi : entry.nameEn;

  const altitude = data
    ? data.kind === "body"
      ? data.report.altitudeDeg
      : data.altitudeDeg
    : null;
  const compass = data
    ? data.kind === "body"
      ? isEnglish
        ? data.report.compassEn
        : data.report.compassVi
      : isEnglish
        ? data.compassEn
        : data.compassVi
    : null;

  const typeLabel =
    entry.type === "sun"
      ? t("typeSun")
      : entry.type === "moon"
        ? t("typeMoon")
        : entry.type === "planet"
          ? t("typePlanet")
          : entry.type === "star"
            ? t("typeStar")
            : t("typeConstellation");

  const feasibility = (): string => {
    if (!data || altitude === null) return "";
    if (altitude <= 0) {
      if (
        data.kind === "body" &&
        data.report.rise &&
        data.report.rise.getTime() > viewedTime.getTime() - 15 * 60_000
      ) {
        return t("belowHorizonRises", {
          time: fmtEventTime(tz, data.report.rise, locale, viewedTime),
        });
      }
      return t("belowHorizon");
    }
    switch (entry.type) {
      case "sun":
        return t("feasibilitySun");
      case "moon":
        return t("feasibilityNakedEye");
      case "planet":
        if (entry.body === "Mercury") return t("feasibilityMercury");
        if (entry.body === "Uranus") return t("feasibilityBinoculars");
        if (entry.body === "Neptune") return t("feasibilityTelescope");
        return t("feasibilityNakedEye");
      case "star": {
        const mag = entry.magnitude ?? 3;
        if (mag <= 1.5) return t("feasibilityStarBright");
        if (mag <= 2.5) return t("feasibilityStar");
        return t("feasibilityStarFaint");
      }
      case "constellation":
        return t("feasibilityConstellation");
      default:
        return "";
    }
  };

  const stats: Array<{ label: string; value: string }> = [];
  if (data && altitude !== null && compass) {
    stats.push({ label: t("statAltitude"), value: fmtDegrees(altitude) });
    stats.push({ label: t("statDirection"), value: compass });
  }
  if (data?.kind === "body") {
    const report = data.report;
    stats.push({
      label: t("statRise"),
      value: report.rise
        ? fmtEventTime(tz, report.rise, locale, viewedTime)
        : "—",
    });
    stats.push({
      label: t("statSet"),
      value: report.set
        ? fmtEventTime(tz, report.set, locale, viewedTime)
        : "—",
    });
    stats.push({
      label: t("statCulmination"),
      value: report.culmination
        ? `${fmtEventTime(tz, report.culmination.time, locale, viewedTime)} · ${fmtDegrees(report.culmination.altitudeDeg)}`
        : "—",
    });
  }
  if (entry.type === "moon" && moon) {
    stats.push({
      label: t("statIllumination"),
      value: `${Math.round(moon.illumFraction * 100)}%`,
    });
    stats.push({
      label: t("statPhase"),
      value: isEnglish ? moon.phaseNameEn : moon.phaseNameVi,
    });
    if (moon.nextFullMoon) {
      stats.push({
        label: t("statNextFull"),
        value: fmtDayMonth(tz, moon.nextFullMoon, locale),
      });
    }
    if (moon.nextNewMoon) {
      stats.push({
        label: t("statNextNew"),
        value: fmtDayMonth(tz, moon.nextNewMoon, locale),
      });
    }
  }
  if (entry.type === "star" && entry.magnitude !== undefined) {
    stats.push({
      label: t("statMagnitude"),
      value: entry.magnitude.toFixed(2),
    });
  }
  if (entry.type === "constellation" && entry.brightestStar) {
    stats.push({
      label: t("statBrightest"),
      value: isEnglish ? entry.brightestStar.en : entry.brightestStar.vi,
    });
  }

  const hostConstellation =
    entry.type === "star" && entry.constellationId
      ? findCatalogEntry(entry.constellationId)
      : undefined;

  const description =
    entry.type === "star" && hostConstellation
      ? t("starInConstellation", {
          name: isEnglish ? hostConstellation.nameEn : hostConstellation.nameVi,
        })
      : entry.type === "constellation"
        ? t("constellationNote")
        : isEnglish
          ? entry.descriptionEn
          : entry.descriptionVi;

  const isBody = entry.type === "sun" || entry.type === "moon" || entry.type === "planet";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToList")}
      </button>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            {name}
          </h2>
          <p className="text-sm text-muted-foreground">{altName}</p>
        </div>
        <div className="flex items-start gap-1.5">
          <Badge variant="soft">{typeLabel}</Badge>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={isFavorite ?? false}
              aria-label={isFavorite ? t("favoriteRemove") : t("favoriteAdd")}
              title={isFavorite ? t("favoriteRemove") : t("favoriteAdd")}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Star
                className={
                  isFavorite
                    ? "size-4 fill-amber-400 text-amber-400"
                    : "size-4"
                }
              />
            </button>
          )}
        </div>
      </div>

      {!data ? (
        <p className="mt-4 animate-pulse text-sm text-muted-foreground">
          {t("panelLoading")}
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-background px-3 py-2"
              >
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm leading-relaxed">{feasibility()}</p>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          <div className="mt-5 border-t pt-4">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("exploreNext")}
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {isBody ? (
                <li>
                  <Link
                    href="/solar-system"
                    className="inline-flex items-center gap-1 font-medium text-primary-strong underline-offset-4 hover:underline"
                  >
                    {t("linkSolarSystem")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href="/space-map"
                    className="inline-flex items-center gap-1 font-medium text-primary-strong underline-offset-4 hover:underline"
                  >
                    {t("linkSpaceMap")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className="inline-flex items-center gap-1 font-medium text-primary-strong underline-offset-4 hover:underline"
                >
                  {t("linkArticles", { name })}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
