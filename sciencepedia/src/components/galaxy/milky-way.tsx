"use client";


import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Pause, Play, Rocket, RotateCcw, X } from "lucide-react";

import {
  GALAXY_FACTS,
  GALAXY_FEATURES,
  GALAXY_OBJECTS,
  SUN_LY_FROM_CENTRE,
  TOUR_STOPS,
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
  () =>
    import("@/components/galaxy/galaxy-scene").then((mod) => mod.GalaxyScene),
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
  /**
   * Mô hình LUÔN mở ra ở trạng thái đang chạy, kể cả khi người dùng bật
   * `prefers-reduced-motion`. Quyết định của chủ sản phẩm, ghi lại vì nó đi
   * ngược mặc định của web.
   *
   * Lập luận: trang này có nút tạm dừng ngay trên thanh điều khiển, nên người
   * cần dừng vẫn dừng được bằng một cú bấm. Bản trước mở ra ở trạng thái dừng
   * để tôn trọng thiết lập, nhưng như thế người chủ động vào xem một mô hình
   * động lại gặp một mô hình đứng yên, và không có gì nói cho họ biết vì sao.
   *
   * Đánh đổi đã chấp nhận: người bật giảm chuyển động phải tự bấm dừng. Muốn
   * lùi lại thì đặt `playing` thành `!useReducedMotion()`.
   */

  const [settings, setSettings] = useState<GalaxySettings>({
    playing: true,
    speed: 1,
    showLabels: true,
    showSun: true,
    showObjects: true,
    view: "free",
    tour: false,
  });
  const [tourStep, setTourStep] = useState(0);
  // Đổi key để dựng lại Canvas — vừa để đặt lại góc nhìn, vừa để đổi vị trí
  // camera khi bật/tắt chế độ nhìn ngang đĩa.
  const [sceneKey, setSceneKey] = useState(0);

  useEffect(() => setWebgl(supportsWebGL()), []);

  /** Nhãn bấm được gồm cả mốc thiên hà lẫn tinh vân/cụm sao, nên tra cả hai */
  const selected = useMemo(() => {
    const feature = GALAXY_FEATURES.find((item) => item.id === selectedId);
    if (feature) {
      return {
        name: feature.name,
        nameEn: feature.nameEn,
        color: feature.color,
        text: feature.description,
        textEn: feature.descriptionEn,
      };
    }
    const object = GALAXY_OBJECTS.find((item) => item.id === selectedId);
    if (!object) return null;
    return {
      name: object.name,
      nameEn: object.nameEn,
      color: object.color,
      text: `${object.note} Cách Mặt Trời khoảng ${object.distanceLy.toLocaleString("vi")} năm ánh sáng.`,
      textEn: `${object.noteEn} About ${object.distanceLy.toLocaleString("en")} light-years from the Sun.`,
    };
  }, [selectedId]);

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
            onTourStep={setTourStep}
            onTourEnd={() => update("tour", false)}
          />
        )}

        {/* ------------------------------------------------ Bảng số liệu
            Ẩn trên màn hình hẹp: ở đó nó che mất chính mô hình. */}
        {!selected && (
          <dl className="pointer-events-none absolute top-4 right-4 hidden rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs backdrop-blur-xl sm:block">
            <div className="flex items-baseline justify-between gap-6">
              <dt className="text-white/55">{t("dashStars")}</dt>
              <dd className="font-mono text-white/90">
                100–400 {t("billion")}
              </dd>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-6">
              <dt className="text-white/55">{t("dashPlanets")}</dt>
              <dd className="font-mono text-white/90">~1 {t("trillion")}</dd>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-6">
              <dt className="text-white/55">{t("scaleSunLabel")}</dt>
              <dd className="font-mono text-yellow-300">
                {SUN_LY_FROM_CENTRE.toLocaleString(locale)} ly
              </dd>
            </div>
          </dl>
        )}

        {/* ------------------------------------------------ Lời dẫn chuyến bay */}
        {settings.tour && TOUR_STOPS[tourStep] && (
          <div className="absolute inset-x-4 top-4 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2">
            <p className="text-[11px] tracking-widest text-white/50 uppercase">
              {t("tourProgress", {
                step: tourStep + 1,
                total: TOUR_STOPS.length,
              })}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">
              {locale === "en"
                ? TOUR_STOPS[tourStep].nameEn
                : TOUR_STOPS[tourStep].name}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">
              {locale === "en"
                ? TOUR_STOPS[tourStep].captionEn
                : TOUR_STOPS[tourStep].caption}
            </p>
          </div>
        )}

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
              {locale === "en" ? selected.textEn : selected.text}
            </p>
          </div>
        )}
      </div>

      {/* Thanh điều khiển nằm dưới khung cảnh chứ không đè lên: trên màn hình
          hẹp nó xuống ba hàng và che mất phần lớn thiên hà. */}
      {/* ------------------------------------------------ Bảng điều khiển */}
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
            htmlFor="galaxy-speed"
            className="text-xs whitespace-nowrap text-muted-foreground"
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
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-accent)]"
          />
          <span className="w-9 font-mono text-xs text-muted-foreground">
            {settings.speed.toFixed(1)}×
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="galaxy-labels"
            checked={settings.showLabels}
            onCheckedChange={(value) => update("showLabels", value)}
          />
          <Label
            htmlFor="galaxy-labels"
            className="text-xs text-muted-foreground"
          >
            {tSolar("showLabels")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="galaxy-sun"
            checked={settings.showSun}
            onCheckedChange={(value) => update("showSun", value)}
          />
          <Label htmlFor="galaxy-sun" className="text-xs text-muted-foreground">
            {t("showSun")}
          </Label>
        </div>
        <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-0.5">
          {(["top", "side", "free"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => update("view", view as CameraView)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                settings.view === view
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`view.${view}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="galaxy-objects"
            checked={settings.showObjects}
            onCheckedChange={(value) => update("showObjects", value)}
          />
          <Label
            htmlFor="galaxy-objects"
            className="text-xs text-muted-foreground"
          >
            {t("showObjects")}
          </Label>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedId(null);
            // Tour bám theo mốc cố định nên phải dừng thiên hà lại
            setSettings((previous) => ({
              ...previous,
              tour: !previous.tour,
              playing: previous.tour,
            }));
          }}
          className="gap-2"
        >
          <Rocket className="size-4" />
          {settings.tour ? t("tourStop") : t("tourStart")}
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => {
            setSelectedId(null);
            setSceneKey((key) => key + 1);
          }}
          aria-label={tSolar("reset")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* ------------------------------------------------ Thang đo
          Nằm ngay dưới khung cảnh chứ không nổi lên trên nó: đặt chồng lên
          cảnh thì che mất chính thứ nó đang mô tả. */}
      <dl className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-baseline gap-2">
          <dt>{t("scaleSunLabel")}</dt>
          <dd className="font-mono font-medium text-foreground">
            {SUN_LY_FROM_CENTRE.toLocaleString(locale)} {t("lightYears")}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt>{t("scaleDiameterLabel")}</dt>
          <dd className="font-mono font-medium text-foreground">
            ~105.000 {t("lightYears")}
          </dd>
        </div>
      </dl>

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
