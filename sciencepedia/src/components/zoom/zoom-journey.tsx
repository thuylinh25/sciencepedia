"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { PLANETS } from "@/lib/solar-data";
import { ZOOM_LEVELS, stepRatio, type ZoomLevel } from "@/lib/zoom-levels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const UniverseScene = dynamic(
  () =>
    import("@/components/universe/universe-scene").then((m) => m.UniverseScene),
  { ssr: false },
);
const GalaxyScene = dynamic(
  () => import("@/components/galaxy/galaxy-scene").then((m) => m.GalaxyScene),
  { ssr: false },
);
const SolarScene = dynamic(
  () => import("@/components/solar/scene").then((m) => m.SolarScene),
  { ssr: false },
);
const GlobeScene = dynamic(
  () => import("@/components/solar/globe-scene").then((m) => m.GlobeScene),
  { ssr: false },
);

/** Thời gian hoà mờ giữa hai cấp, mili giây. */
const FADE_MS = 900;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

function LevelScene({
  level,
  locale,
}: {
  level: ZoomLevel;
  locale: string;
}) {
  const earth = PLANETS.find((planet) => planet.id === "earth");


  switch (level.id) {
    case "universe":
      return (
        <UniverseScene
          settings={{
            playing: true,
            speed: 1,
            showFilaments: true,
            scientific: false,
            showScales: false,
            showLabels: false,
            distance: 26,
          }}
          locale={locale}
        />
      );
    case "milky-way":
      return (
        <GalaxyScene
          settings={{
            playing: true,
            speed: 1,
            showLabels: false,
            showSun: true,
            showObjects: false,
            view: "free",
            tour: false,
            scientific: false,
          }}
          onSelect={() => {}}
          locale={locale}
          onTourStep={() => {}}
          onTourEnd={() => {}}
        />
      );
    case "solar-system":
      return (
        <SolarScene
          settings={{
            playing: true,
            speed: 1,
            showOrbits: true,
            showLabels: false,
            realScale: false,
          }}
          selectedId={null}
          onSelect={() => {}}
          locale={locale}
        />
      );
    case "earth":
      return earth ? (
        <GlobeScene
          body={{
            texture: earth.texture,
            fallbackColor: earth.color,
            axialTilt: earth.axialTilt,
          }}
          spinning
          distance={3.2}
        />
      ) : null;
    default:
      return null;
  }
}

/**
 * Hành trình thu phóng bốn cấp.
 *
 * Mỗi lúc chỉ có một cảnh được gắn, trừ khoảng gần một giây lúc chuyển cấp khi
 * cả hai cùng tồn tại để hoà mờ. Chuyển động phóng to nằm ở lớp CSS chứ không
 * ở camera: cảnh đi ra phóng to dần rồi mờ đi, cảnh đi vào bắt đầu từ nhỏ rồi
 * lớn lên. Nhờ vậy không phải sửa gì bên trong ba cảnh đã có, và mỗi cảnh vẫn
 * giữ nguyên tỉ lệ riêng của nó.
 */
export function ZoomJourney() {
  const t = useTranslations("zoom");
  const tSolar = useTranslations("solar");
  const locale = useLocale();

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<{
    id: string;
    direction: "in" | "out";
  } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => setWebgl(supportsWebGL()), []);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= ZOOM_LEVELS.length || next === index) return;
      const direction = next > index ? "in" : "out";
      setOutgoing({ id: ZOOM_LEVELS[index].id, direction });
      setIndex(next);

      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOutgoing(null), FADE_MS);
    },
    [index],
  );

  const level = ZOOM_LEVELS[index];
  const ratio = stepRatio(index);
  const outgoingLevel = outgoing
    ? (ZOOM_LEVELS.find((item) => item.id === outgoing.id) ?? level)
    : level;

  if (webgl === false) {
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
        <p className="max-w-md text-muted-foreground">{tSolar("webglError")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100dvh-14rem)] min-h-[28rem] w-full overflow-hidden rounded-2xl border bg-[#02030a]">
        {webgl === null ? (
          <div className="grid h-full place-items-center text-sm text-white/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            {/* Cảnh đang rời đi: phóng to rồi mờ dần */}
            {outgoing && (
              <div
                key={`out-${outgoing.id}`}
                className="absolute inset-0 animate-[zoom-out_900ms_ease-in_forwards]"
                style={{
                  ["--zoom-to" as string]:
                    outgoing.direction === "in" ? "1.6" : "0.6",
                }}
              >
                <LevelScene level={outgoingLevel} locale={locale} />
              </div>
            )}

            <div
              key={`in-${level.id}`}
              className="absolute inset-0 animate-[zoom-in_900ms_ease-out_forwards]"
              style={{
                ["--zoom-from" as string]:
                  outgoing?.direction === "out" ? "1.6" : "0.6",
              }}
            >
              <LevelScene level={level} locale={locale} />
            </div>
          </>
        )}

        {/* --------------------------------------------- Điều khiển thu phóng */}
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          <Button
            size="sm"
            variant="glass"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
            {t("zoomOut")}
          </Button>

          <div className="flex items-center gap-1.5">
            {ZOOM_LEVELS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                onClick={() => go(i)}
                aria-label={locale === "en" ? step.nameEn : step.name}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-7 bg-white" : "w-2 bg-white/35 hover:bg-white/60",
                )}
              />
            ))}
          </div>

          <Button
            size="sm"
            variant="glass"
            onClick={() => go(index + 1)}
            disabled={index === ZOOM_LEVELS.length - 1}
            className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            {t("zoomIn")}
            <ChevronDown className="size-4" />
          </Button>
        </div>

        {/* Bội số giữa cấp này và cấp kế tiếp */}
        {ratio && (
          <p className="pointer-events-none absolute right-4 bottom-20 hidden text-right text-xs text-white/50 sm:block">
            {t("nextIsSmaller", {
              factor: Math.round(ratio).toLocaleString(locale),
            })}
          </p>
        )}
      </div>

      {/* ------------------------------------------------ Thông tin cấp hiện tại
          Để ngoài khung chứ không phủ lên cảnh: overlay ở góc trái trên che
          đúng phần thiên hà và cấu trúc sợi mà người xem đang muốn nhìn. */}
      <div className="mt-3 flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-baseline">
        <div className="shrink-0 sm:w-64">
          <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
            {t("levelOf", { step: index + 1, total: ZOOM_LEVELS.length })}
          </p>
          <h2
            className="font-display text-xl font-bold"
            style={{ color: level.color }}
          >
            {locale === "en" ? level.nameEn : level.name}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            {locale === "en" ? level.sizeEn : level.size}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {locale === "en" ? level.blurbEn : level.blurb}
          </p>
          {level.href && (
            <Link
              href={level.href}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
            >
              {t("openFull")}
              <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
