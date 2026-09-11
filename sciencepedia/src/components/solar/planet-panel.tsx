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
          /* Dưới `sm` là một tấm trượt ở ĐÁY, không phải bảng ở góc trên trái.

             Bảng cũ rộng `calc(100% - 2rem)` và neo `top-4`, nên trên máy 360px
             nó phủ gần trọn bề ngang khung và chừng nửa chiều cao — đúng giữa
             chỗ các hành tinh đang chạy. Trên màn hình rộng thì không sao vì
             bảng chỉ chiếm 22rem ở lề trái còn mô hình nằm giữa; trên điện
             thoại không có "lề" nào để mà nép vào.

             `bottom-24` để nằm TRÊN thanh điều khiển (thanh đó neo `bottom-4`
             và cao chừng 60px). `max-h-[42dvh]` cộng cuộn dọc: mô hình giữ
             được hơn nửa khung, và nội dung dài thì cuộn trong chính tấm trượt
             chứ không đẩy nó cao thêm.

             Từ `sm` trở lên giữ nguyên bảng góc trên trái như cũ. */
          className="absolute inset-x-4 bottom-24 max-h-[42dvh] overflow-y-auto rounded-2xl border border-white/10 bg-black/70 text-white backdrop-blur-xl sm:inset-x-auto sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-none sm:w-[min(22rem,calc(100%-2rem))] sm:overflow-hidden sm:bg-black/55"
        >
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: planet.color }}
          />

          {/* Đệm hẹp hơn dưới `sm`: ở đó tấm trượt bị giới hạn 42dvh, nên mỗi
              4px đệm cắt đi là 8px nội dung đọc được thêm. */}
          <div className="p-4 sm:p-5">
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

            <Button asChild size="sm" variant="accent" className="mt-5 w-full">
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
