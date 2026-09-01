"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Planet } from "@/lib/solar-data";
import { Button } from "@/components/ui/button";

function formatKm(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PlanetPanel({
  planet,
  onClose,
  locale,
}: {
  planet: Planet | null;
  onClose: () => void;
  locale: string;
}) {
  const t = useTranslations("solar");

  return (
    <AnimatePresence>
      {planet && (
        <motion.aside
          key={planet.id}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-4 left-4 w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl"
        >
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: planet.color }}
          />

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {locale === "en" ? planet.nameEn : planet.name}
                </h2>
                <p className="mt-0.5 text-xs tracking-widest text-white/50 uppercase">
                  {locale === "en" ? planet.name : planet.nameEn}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-white/75">
              {locale === "en" ? planet.descriptionEn : planet.descriptionVi}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                {
                  label: t("diameter"),
                  value: `${formatKm(planet.realRadiusKm * 2, locale)} km`,
                },
                {
                  label: t("distance"),
                  value: `${formatKm(planet.realDistanceKm, locale)} km`,
                },
                {
                  label: t("orbitalPeriod"),
                  value:
                    planet.orbitalPeriodDays >= 365
                      ? `${(planet.orbitalPeriodDays / 365.25).toFixed(1)} ${locale === "en" ? "years" : "năm"}`
                      : `${planet.orbitalPeriodDays} ${locale === "en" ? "days" : "ngày"}`,
                },
                {
                  label: t("dayLength"),
                  value: `${planet.dayLengthHours.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} h`,
                },
                { label: t("moons"), value: String(planet.moons) },
                {
                  label: t("temperature"),
                  value: `${planet.temperatureC}°C`,
                },
                { label: t("gravity"), value: `${planet.gravity} m/s²` },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] tracking-wide text-white/45 uppercase">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <Button
              asChild
              size="sm"
              variant="accent"
              className="mt-5 w-full"
            >
              <Link href={`/articles/${planet.articleSlug}`}>
                {t("readMore")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
