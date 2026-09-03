"use client";

import { useReducedMotion } from "framer-motion";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Loader2, Pause, Play, RotateCcw } from "lucide-react";

import {
  COSMIC_LANDMARKS,
  NODE_TIERS,
  SCALE_STEPS,
  UNIVERSE_FACTS,
  UNIVERSE_SCALES,
} from "@/lib/universe-data";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { UniverseSettings } from "@/components/universe/universe-scene";

const UniverseScene = dynamic(
  () =>
    import("@/components/universe/universe-scene").then(
      (mod) => mod.UniverseScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-[#02030a]">
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

export function Universe() {
  const t = useTranslations("universe");
  const tSolar = useTranslations("solar");
  const tZoom = useTranslations("zoom");
  const locale = useLocale();

  const [webgl, setWebgl] = useState<boolean | null>(null);
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

  const [settings, setSettings] = useState<UniverseSettings>({
    playing: !reducedMotion,
    speed: 1,
    showFilaments: true,
    showScales: false,
    showLabels: true,
    distance: SCALE_STEPS[4].distance,
  });
  const [scaleIndex, setScaleIndex] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    COSMIC_LANDMARKS.find((item) => item.id === selectedId) ?? null;
  const [sceneKey, setSceneKey] = useState(0);

  useEffect(() => setWebgl(supportsWebGL()), []);

  const update = <K extends keyof UniverseSettings>(
    key: K,
    value: UniverseSettings[K],
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
      <div className="relative h-[calc(100dvh-5rem)] min-h-[34rem] w-full overflow-hidden rounded-2xl border bg-[#02030a]">
        {webgl === null ? (
          <div className="grid h-full place-items-center text-sm text-white/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <UniverseScene
            key={sceneKey}
            settings={settings}
            locale={locale}
            onSelect={setSelectedId}
          />
        )}

        {/* --------------------------------------------- Đây là mô hình gì
            Câu hỏi đầu tiên người xem đặt ra là "đang nhìn cái gì đây". Không
            trả lời thì mọi thứ còn lại đều vô nghĩa. Ẩn trên màn hình hẹp. */}
        <div className="pointer-events-none absolute top-4 left-4 hidden max-w-[15rem] rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl md:block">
          <h2 className="font-display text-sm font-bold text-white">
            {t("modelName")}
          </h2>
          <dl className="mt-2 space-y-1 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-white/50">{t("fieldRadius")}</dt>
              <dd className="font-mono text-white/85">480 Mly</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/50">{t("fieldKind")}</dt>
              <dd className="text-right text-white/85">{t("kindSimulated")}</dd>
            </div>
          </dl>

          <ul className="mt-3 space-y-1 border-t border-white/10 pt-2 text-[11px]">
            {(["supercluster", "cluster", "galaxy"] as const).map((tier) => (
              <li key={tier} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: NODE_TIERS[tier].color }}
                />
                <span className="text-white/75">
                  {locale === "en"
                    ? NODE_TIERS[tier].labelEn
                    : NODE_TIERS[tier].label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* --------------------------------------------- Mốc đang chọn */}
        {selected && (
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/65 p-4 backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:max-w-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-bold text-white">
                {locale === "en" ? selected.nameEn : selected.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={tSolar("reset")}
                className="shrink-0 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
            {selected.distanceMly > 0 && (
              <p className="mt-1 font-mono text-xs text-white/60">
                {selected.distanceMly.toLocaleString(locale)} {t("mly")}
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {locale === "en" ? selected.noteEn : selected.note}
            </p>
          </div>
        )}
      </div>

      {/* Thanh điều khiển nằm dưới khung cảnh chứ không đè lên nó */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border bg-card px-5 py-3.5">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => update("playing", !settings.playing)}
          aria-label={settings.playing ? tSolar("pause") : tSolar("play")}
        >
          {settings.playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <div className="flex items-center gap-2.5">
          <Label
            htmlFor="universe-speed"
            className="text-xs whitespace-nowrap text-muted-foreground"
          >
            {tSolar("speed")}
          </Label>
          <input
            id="universe-speed"
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={settings.speed}
            onChange={(event) => update("speed", Number(event.target.value))}
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-accent)]"
          />
          <span className="w-9 font-mono text-xs text-muted-foreground">
            {settings.speed.toFixed(1)}×
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="universe-filaments"
            checked={settings.showFilaments}
            onCheckedChange={(value) => update("showFilaments", value)}
          />
          <Label
            htmlFor="universe-filaments"
            className="text-xs text-muted-foreground"
          >
            {t("showFilaments")}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="universe-scales"
            checked={settings.showScales}
            onCheckedChange={(value) => update("showScales", value)}
          />
          <Label
            htmlFor="universe-scales"
            className="text-xs text-muted-foreground"
          >
            {t("showScales")}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="universe-labels"
            checked={settings.showLabels}
            onCheckedChange={(value) => update("showLabels", value)}
          />
          <Label
            htmlFor="universe-labels"
            className="text-xs text-muted-foreground"
          >
            {tSolar("showLabels")}
          </Label>
        </div>

        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setSceneKey((key) => key + 1)}
          aria-label={tSolar("reset")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* --------------------------------------------- Thanh tỉ lệ
          Nút "bậc thang kích thước" một mình không nói lên điều gì; thanh này
          cho biết ở mỗi tầm nhìn thì cấu trúc nào vừa khung. */}
      <div className="mt-3 rounded-2xl border bg-card px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <label
            htmlFor="universe-scale"
            className="text-xs text-muted-foreground"
          >
            {t("scaleSlider")}
          </label>
          <span className="font-mono text-sm font-medium">
            {SCALE_STEPS[scaleIndex].mly.toLocaleString(locale)} {t("mly")}
          </span>
        </div>

        <input
          id="universe-scale"
          type="range"
          min={0}
          max={SCALE_STEPS.length - 1}
          step={1}
          value={scaleIndex}
          onChange={(event) => {
            const next = Number(event.target.value);
            setScaleIndex(next);
            update("distance", SCALE_STEPS[next].distance);
          }}
          className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-accent)]"
        />

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          {SCALE_STEPS.map((step, i) => (
            <span
              key={step.mly}
              className={cn(
                i === scaleIndex && "font-semibold text-foreground",
              )}
            >
              {step.mly >= 1000 ? "1 Gly" : `${step.mly}`}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">{t("fitsInView")} </span>
          <span className="font-medium">
            {locale === "en"
              ? SCALE_STEPS[scaleIndex].structureEn
              : SCALE_STEPS[scaleIndex].structure}
          </span>
        </p>

        {/* Chế độ du hành không dựng lại ở đây: /zoom đã có sẵn hành trình bốn
            cấp từ Trái Đất ra tới mạng vũ trụ, làm thêm một cái thứ hai là hai
            thứ cùng làm một việc và phải bảo trì song song. */}
        <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
          {t("tourHint")}{" "}
          <Link
            href="/zoom"
            className="inline-flex items-center gap-1.5 font-medium text-primary-strong hover:underline"
          >
            {tZoom("title")}
            <ArrowRight className="size-4" />
          </Link>
        </p>
      </div>

      {/* ------------------------------------------------ Bậc thang kích thước */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("scalesTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t("scalesIntro")}
        </p>

        <ol className="mt-6 space-y-4">
          {UNIVERSE_SCALES.map((scale, index) => (
            <li
              key={scale.id}
              className="flex gap-4 rounded-2xl border p-5 transition-colors hover:border-accent/60"
            >
              <span
                className="mt-1 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${scale.color}22`,
                  color: scale.color,
                }}
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {locale === "en" ? scale.nameEn : scale.name}
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                    {locale === "en" ? scale.sizeEn : scale.size}
                  </span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {locale === "en" ? scale.descriptionEn : scale.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ Số liệu */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("factsTitle")}
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {UNIVERSE_FACTS.map((fact) => (
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
