"use client";

import { useReducedMotion } from "framer-motion";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Loader2, Pause, Play, RotateCcw } from "lucide-react";

import { PLANETS, TEXTURE_CREDIT } from "@/lib/solar-data";
import type { PlanetPositions } from "@/lib/horizons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlanetPanel } from "@/components/solar/planet-panel";
import type { SceneSettings } from "@/components/solar/scene";

/**
 * Cảnh 3D chỉ chạy được ở trình duyệt (WebGL), nên phải nạp động với ssr: false.
 * `dynamic(..., { ssr: false })` chỉ hợp lệ trong Client Component, đó là lý do
 * lớp bọc này tồn tại thay vì gọi thẳng từ page.tsx.
 */
const SolarScene = dynamic(
  () => import("@/components/solar/scene").then((mod) => mod.SolarScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-[#05070f]">
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

export function SolarSystem({
  positions,
}: {
  positions: PlanetPositions | null;
}) {
  const t = useTranslations("solar");
  const locale = useLocale();

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * Giảm chuyển động thì trang mở ra ở trạng thái ĐANG DỪNG, không phải tắt
   * hẳn chuyển động.
   *
   * Khác với hai khối trang trí ở trang chủ: trang này có nút tạm dừng, và
   * người xem chủ động vào đây để nhìn một mô hình động. Nên thiết lập hệ điều
   * hành quyết định trạng thái BAN ĐẦU, còn quyền bật lại vẫn nằm ở người xem.
   * Chặn vĩnh viễn sẽ lấy mất một tính năng mà họ cố ý tìm đến.
   *
   * Phải kiểm bằng JS: quy tắc CSS `prefers-reduced-motion` toàn cục không
   * chạm được vòng lặp `useFrame` của WebGL.
   */
  const reducedMotion = useReducedMotion();

  const [settings, setSettings] = useState<SceneSettings>({
    playing: !reducedMotion,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    realScale: false,
  });
  // Đổi key để buộc Canvas dựng lại — cách đơn giản nhất để "đặt lại góc nhìn"
  const [sceneKey, setSceneKey] = useState(0);

  useEffect(() => setWebgl(supportsWebGL()), []);

  const selected = useMemo(
    () => PLANETS.find((planet) => planet.id === selectedId) ?? null,
    [selectedId],
  );

  const update = <K extends keyof SceneSettings>(
    key: K,
    value: SceneSettings[K],
  ) => setSettings((previous) => ({ ...previous, [key]: value }));

  if (webgl === false) {
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
        <p className="max-w-md text-muted-foreground">{t("webglError")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100dvh-5rem)] min-h-[34rem] w-full overflow-hidden rounded-2xl border bg-[#05070f]">
        {webgl === null ? (
          <div className="grid h-full place-items-center text-sm text-white/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <SolarScene
            key={sceneKey}
            settings={settings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            locale={locale}
            longitudes={positions?.longitudes}
          />
        )}

        {/* ------------------------------------------------ Bảng điều khiển */}
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-black/45 px-5 py-3.5 backdrop-blur-xl sm:inset-x-auto sm:left-4">
          <Button
            size="icon-sm"
            variant="glass"
            onClick={() => update("playing", !settings.playing)}
            aria-label={settings.playing ? t("pause") : t("play")}
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
              htmlFor="speed"
              className="text-xs whitespace-nowrap text-white/70"
            >
              {t("speed")}
            </Label>
            <input
              id="speed"
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
              id="orbits"
              checked={settings.showOrbits}
              onCheckedChange={(value) => update("showOrbits", value)}
            />
            <Label htmlFor="orbits" className="text-xs text-white/70">
              {t("showOrbits")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="labels"
              checked={settings.showLabels}
              onCheckedChange={(value) => update("showLabels", value)}
            />
            <Label htmlFor="labels" className="text-xs text-white/70">
              {t("showLabels")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="scale"
              checked={settings.realScale}
              onCheckedChange={(value) => update("realScale", value)}
            />
            <Label htmlFor="scale" className="text-xs text-white/70">
              {t("realScale")}
            </Label>
          </div>

          <Button
            size="icon-sm"
            variant="glass"
            onClick={() => {
              setSelectedId(null);
              setSceneKey((key) => key + 1);
            }}
            aria-label={t("reset")}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>

        {/* ------------------------------------------------ Bảng thông tin */}
        <PlanetPanel
          planet={selected}
          onClose={() => setSelectedId(null)}
          locale={locale}
        />

        {/* Danh sách chọn nhanh hành tinh */}
        <div className="absolute top-4 right-4 hidden max-w-[9rem] flex-col gap-1 lg:flex">
          {PLANETS.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => setSelectedId(planet.id)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                selectedId === planet.id
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: planet.color }}
              />
              {locale === "en" ? planet.nameEn : planet.name}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------- Nguồn và độ tin cậy
          Người xem cần biết mình đang nhìn cấu hình thật của hôm nay hay chỉ
          là bố cục minh hoạ — hai thứ đó nói lên những điều rất khác nhau. */}
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {positions ? (
          <span>
            {t("positionsReal", { date: positions.epoch })}{" "}
            <a
              href="https://ssd.jpl.nasa.gov/horizons/"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              JPL Horizons
            </a>
          </span>
        ) : (
          <span>{t("positionsSchematic")}</span>
        )}

        <span>
          {t("texturesFrom")}{" "}
          <a
            href={TEXTURE_CREDIT.url}
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2"
          >
            {TEXTURE_CREDIT.name}
          </a>{" "}
          ({TEXTURE_CREDIT.license})
        </span>

        <a
          href="https://eyes.nasa.gov/apps/solar-system/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-medium text-primary-strong hover:underline"
        >
          {t("nasaEyes")}
          <ExternalLink className="size-3.5" />
        </a>
      </p>
    </>
  );
}
