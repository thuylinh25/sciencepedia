"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Pause, Play, RotateCcw, X } from "lucide-react";

import {
  GALAXY_FACTS,
  GALAXY_FEATURES,
  LY_PER_UNIT,
  SUN_LY_FROM_CENTRE,
} from "@/lib/galaxy-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type {
  CameraView,
  GalaxySettings,
} from "@/components/galaxy/galaxy-scene";

/**
 * Giống trang Hệ Mặt Trời: cảnh 3D chỉ chạy được ở trình duyệt nên phải nạp
 * động với ssr: false, và `dynamic(..., { ssr: false })` chỉ hợp lệ trong
 * Client Component — đó là lý do lớp bọc này tồn tại.
 */
const GalaxyScene = dynamic(
  () => import("@/components/galaxy/galaxy-scene").then((mod) => mod.GalaxyScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-[#04060e]">
        <span className="flex items-center gap-3 text-sm text-white/60">
          <Loader2 className="size-4 animate-spin" />
          Đang tải mô hình 3D…
        </span>
      </div>
    ),
  },
);

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

export function MilkyWay() {
  const t = useTranslations("galaxy");
  const tSolar = useTranslations("solar");
  const locale = useLocale();

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GalaxySettings>({
    playing: true,
    speed: 1,
    showLabels: true,
    showSun: true,
    view: "free",
  });
  // Đổi key để dựng lại Canvas — vừa để đặt lại góc nhìn, vừa để đổi vị trí
  // camera khi bật/tắt chế độ nhìn ngang đĩa.
  const [sceneKey, setSceneKey] = useState(0);

  useEffect(() => setWebgl(supportsWebGL()), []);

  const selected = useMemo(
    () => GALAXY_FEATURES.find((feature) => feature.id === selectedId) ?? null,
    [selectedId],
  );

  const update = <K extends keyof GalaxySettings>(
    key: K,
    value: GalaxySettings[K],
  ) => setSettings((previous) => ({ ...previous, [key]: value }));

  if (webgl === false) {
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
        <p className="max-w-md text-muted-foreground">{tSolar("webglError")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100dvh-5rem)] min-h-[34rem] w-full overflow-hidden rounded-2xl border bg-[#04060e]">
        {webgl === null ? (
          <div className="grid h-full place-items-center text-sm text-white/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <GalaxyScene
            key={sceneKey}
            settings={settings}
            onSelect={setSelectedId}
            locale={locale}
          />
        )}

        {/* ------------------------------------------------ Bảng điều khiển */}
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-black/45 px-5 py-3.5 backdrop-blur-xl sm:inset-x-auto sm:left-4">
          <Button
            size="icon-sm"
            variant="glass"
            onClick={() => update("playing", !settings.playing)}
            aria-label={settings.playing ? tSolar("pause") : tSolar("play")}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            {settings.playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          <div className="flex items-center gap-2.5">
            <Label
              htmlFor="galaxy-speed"
              className="text-xs whitespace-nowrap text-white/70"
            >
              {tSolar("speed")}
            </Label>
            <input
              id="galaxy-speed"
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={settings.speed}
              onChange={(event) => update("speed", Number(event.target.value))}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/25 accent-[var(--color-accent)]"
            />
            <span className="w-9 font-mono text-xs text-white/70">
              {settings.speed.toFixed(1)}×
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="galaxy-labels"
              checked={settings.showLabels}
              onCheckedChange={(value) => update("showLabels", value)}
            />
            <Label htmlFor="galaxy-labels" className="text-xs text-white/70">
              {tSolar("showLabels")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="galaxy-sun"
              checked={settings.showSun}
              onCheckedChange={(value) => update("showSun", value)}
            />
            <Label htmlFor="galaxy-sun" className="text-xs text-white/70">
              {t("showSun")}
            </Label>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-0.5">
            {(["top", "side", "free"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => update("view", view as CameraView)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  settings.view === view
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                {t(`view.${view}`)}
              </button>
            ))}
          </div>

          <Button
            size="icon-sm"
            variant="glass"
            onClick={() => {
              setSelectedId(null);
              setSceneKey((key) => key + 1);
            }}
            aria-label={tSolar("reset")}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>

        {/* ------------------------------------------------ Thang đo
            Không có nó thì người xem không biết một vòng xoắn là bao xa, và
            con số "26.670 năm ánh sáng" chỉ nằm trong bảng dưới cuối trang. */}
        <div className="pointer-events-none absolute top-4 left-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-xs backdrop-blur-xl">
          <dl className="space-y-1.5">
            <div>
              <dt className="text-white/55">{t("scaleSunLabel")}</dt>
              <dd className="font-mono text-sm text-yellow-300">
                {SUN_LY_FROM_CENTRE.toLocaleString(locale)} {t("lightYears")}
              </dd>
            </div>
            <div>
              <dt className="text-white/55">{t("scaleDiameterLabel")}</dt>
              <dd className="font-mono text-sm text-white/85">
                ~105.000 {t("lightYears")}
              </dd>
            </div>
            <div className="border-t border-white/10 pt-1.5">
              <dt className="text-white/55">{t("scaleGridLabel")}</dt>
              <dd className="font-mono text-sm text-white/85">
                {LY_PER_UNIT.toLocaleString(locale)} {t("lightYears")}
              </dd>
            </div>
          </dl>
        </div>

        {/* ------------------------------------------------ Bảng thông tin */}
        {selected && (
          <div className="absolute top-4 right-4 left-4 max-w-sm rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl sm:left-auto">
            <div className="flex items-start justify-between gap-3">
              <h2
                className="font-display text-xl font-bold"
                style={{ color: selected.color }}
              >
                {locale === "en" ? selected.nameEn : selected.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t("close")}
                className="shrink-0 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-white/75">
              {locale === "en" ? selected.descriptionEn : selected.description}
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Số liệu */}
      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("factsTitle")}
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {GALAXY_FACTS.map((fact) => (
            <div
              key={fact.labelEn}
              className="flex items-baseline justify-between gap-4 border-b py-2"
            >
              <dt className="text-sm text-muted-foreground">
                {locale === "en" ? fact.labelEn : fact.labelVi}
              </dt>
              <dd className="text-right text-sm font-medium">
                {locale === "en" ? fact.valueEn : fact.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          {t("disclaimer")}
        </p>
      </section>
    </>
  );
}
