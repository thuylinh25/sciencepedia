"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { PLANETS } from "@/lib/solar-data";
import { ZOOM_LEVELS, stepRatio } from "@/lib/zoom-levels";
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

function LevelScene({ id, locale }: { id: string; locale: string }) {
  const earth = PLANETS.find((planet) => planet.id === "earth");

  switch (id) {
    case "universe":
      return (
        <UniverseScene
          settings={{
            playing: true,
            speed: 1,
            showFilaments: true,
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

  if (webgl === false) {
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
        <p className="max-w-md text-muted-foreground">{tSolar("webglError")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100dvh-5rem)] min-h-[34rem] w-full overflow-hidden rounded-2xl border bg-[#02030a]">
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
                <LevelScene id={outgoing.id} locale={locale} />
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
              <LevelScene id={level.id} locale={locale} />
            </div>
          </>
        )}

        {/* --------------------------------------------- Thông tin cấp hiện tại */}
        <div className="pointer-events-none absolute inset-x-4 top-4 sm:max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
            <p className="text-[11px] tracking-widest text-white/50 uppercase">
              {t("levelOf", { step: index + 1, total: ZOOM_LEVELS.length })}
            </p>
            <h2
              className="mt-1 font-display text-2xl font-bold"
              style={{ color: level.color }}
            >
              {locale === "en" ? level.nameEn : level.name}
            </h2>
            <p className="font-mono text-sm text-white/70">
              {locale === "en" ? level.sizeEn : level.size}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-white/75">
              {locale === "en" ? level.blurbEn : level.blurb}
            </p>

            {level.href && (
              <span className="pointer-events-auto mt-3 inline-block">
                <Link
                  href={level.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 underline underline-offset-4 hover:text-white"
                >
                  {t("openFull")}
                  <ExternalLink className="size-3.5" />
                </Link>
              </span>
            )}
          </div>
        </div>

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

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t("note")}
      </p>
    </>
  );
}
