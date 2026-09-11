"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import {
  AU_KM,
  compressionAt,
  PLANETS,
  TEXTURE_CREDIT,
} from "@/lib/solar-data";
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

  /**
   * Thiên thể được chọn sẵn qua `?body=<id>`.
   *
   * Đây là đích của nút "Xem trong Hệ Mặt Trời" trong bảng thông tin ở thư
   * viện ảnh: bấm từ Sao Kim thì phải tới đây với Sao Kim đã mở sẵn bảng, chứ
   * không phải tới một mô hình chưa chọn gì và bắt tìm lại hành tinh vừa xem.
   *
   * Đọc bằng `useSearchParams` chứ không nhận qua prop từ page: trang này là
   * static, còn `searchParams` trong Server Component sẽ ép nó thành dynamic
   * và mất cả phần prerender. Ở phía client thì query chỉ là một giá trị đọc
   * được, không ảnh hưởng gì tới cách trang được dựng.
   *
   * Lọc qua `PLANETS` trước khi nhận: `?body=` là dữ liệu từ URL, ai cũng gõ
   * được, và một id lạ phải cho ra "không chọn gì" chứ không phải một bảng
   * trống.
   */
  const searchParams = useSearchParams();
  const requestedBody = searchParams.get("body");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    requestedBody && PLANETS.some((planet) => planet.id === requestedBody)
      ? requestedBody
      : null,
  );
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

  const [settings, setSettings] = useState<SceneSettings>({
    playing: true,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    realScale: false,
    showMoons: true,
    showDwarfs: true,
    showEcliptic: false,
  });
  // Đổi key để buộc Canvas dựng lại — cách đơn giản nhất để "đặt lại góc nhìn"
  const [sceneKey, setSceneKey] = useState(0);

  /*
   * Sáu công tắc có gập lại hay không — chỉ có tác dụng dưới `sm`.
   *
   * Bảng điều khiển là một hàng `flex-wrap`. Trên màn hình rộng nó nằm gọn
   * một tới hai hàng, nhưng ở 360px thì chín phần tử xuống NĂM hàng và bảng
   * cao chừng 300px, tức gần nửa khung nhìn — nó không còn là bảng điều khiển
   * nữa mà là một tấm chắn đặt trước mô hình.
   *
   * Mặc định ĐÓNG. Người mở trang lần đầu trên điện thoại đến để xem Hệ Mặt
   * Trời chứ không để chỉnh sáu tuỳ chọn; hai thứ họ cần ngay là dừng/chạy và
   * tốc độ, và hai thứ đó ở lại ngoài.
   */
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => setWebgl(supportsWebGL()), []);

  /*
   * Giá trị khởi tạo của useState chỉ chạy một lần. Đi từ /solar-system?body=mars
   * sang ?body=venus bằng điều hướng phía client thì component không mount
   * lại, nên nếu chỉ đặt ở khởi tạo thì lần chuyển thứ hai sẽ không đổi gì.
   */
  useEffect(() => {
    if (
      requestedBody &&
      PLANETS.some((planet) => planet.id === requestedBody)
    ) {
      setSelectedId(requestedBody);
    }
  }, [requestedBody]);

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

        {/* ------------------------------------------------ Bảng điều khiển

            Dưới `sm` bảng phải gói gọn trong MỘT hàng.

            Bản cũ dùng `gap-x-5`, `px-5` và một nhãn "Tốc độ" hiện rõ. Ở
            360px thì hàng ấy tràn, `flex-wrap` đẩy nút tuỳ chọn và nút đặt
            lại xuống hàng hai, và tấm thẻ cao gấp đôi — nó phủ lên vành đai
            tiểu hành tinh và quỹ đạo các hành tinh trong. Đây là lần thứ hai
            một tấm nổi che mất mô hình trên điện thoại; lần trước là bảng
            thông tin hành tinh.

            Nhãn chuyển sang `sr-only` chứ KHÔNG xoá: thanh trượt vẫn cần một
            nhãn cho trình đọc màn hình, và một thanh trượt không nhãn là lỗi
            a11y chứ không phải một lựa chọn bố cục. Người nhìn thấy đã có nút
            phát/dừng ngay bên trái và số nhân "1.0×" ngay bên phải.

            Thanh trượt co giãn thay vì rộng cố định `w-24`: ở một hàng thì
            phần còn thừa nên thuộc về thứ duy nhất cần kéo. */}
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-white/10 bg-black/45 px-3 py-3 backdrop-blur-xl sm:inset-x-auto sm:left-4 sm:gap-x-5 sm:px-5 sm:py-3.5">
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

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-none">
            <Label
              htmlFor="speed"
              className="sr-only text-xs whitespace-nowrap text-white/70 sm:not-sr-only"
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
              className="h-1 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-white/25 accent-[var(--color-accent)] sm:w-24 sm:min-w-24"
            />
            <span className="w-9 shrink-0 font-mono text-xs text-white/70">
              {settings.speed.toFixed(1)}×
            </span>
          </div>

          {/* Nút gập, chỉ có dưới `sm`. Từ `sm` trở lên các công tắc luôn hiện
              nên nút này không còn việc gì để làm và bị ẩn hẳn — để lại một nút
              không đổi được gì là tệ hơn không có nút. */}
          <Button
            size="icon-sm"
            variant="glass"
            onClick={() => setOptionsOpen((open) => !open)}
            aria-expanded={optionsOpen}
            aria-controls="solar-options"
            aria-label={t("options")}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 sm:hidden"
          >
            <SlidersHorizontal className="size-4" />
          </Button>

          {/* `w-full` khi mở dưới `sm`: nhóm công tắc phải bắt đầu ở một hàng
              mới, không chen tiếp vào hàng có thanh tốc độ.

              `sm:contents` chứ không phải `sm:flex`: từ `sm` trở lên nhóm này
              phải BIẾN MẤT khỏi cây bố cục để sáu công tắc trở thành con trực
              tiếp của bảng, đúng như bản cũ. Bọc chúng trong một flex lồng sẽ
              đổi cách `flex-wrap` của bảng ngắt hàng, và hàng điều khiển trên
              desktop sẽ gãy khác đi. */}
          {/* Gập bằng LỚP, không bằng thuộc tính `hidden`.

              `[hidden]{display:none}` nằm trong stylesheet của trình duyệt, mà
              một lớp `flex` của Tailwind là khai báo của tác giả nên thắng
              nó. Đặt `hidden` cạnh `flex` thì nhóm vẫn hiện, và lỗi chỉ lộ ra
              trên máy thật. */}
          <div
            id="solar-options"
            className={`${optionsOpen ? "flex" : "hidden"} w-full flex-wrap items-center gap-x-5 gap-y-3 sm:contents`}
          >
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

            <div className="flex items-center gap-2">
              <Switch
                id="solar-moons"
                checked={settings.showMoons}
                onCheckedChange={(value) => update("showMoons", value)}
              />
              <Label htmlFor="solar-moons" className="text-xs text-white/70">
                {t("showMoons")}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="solar-dwarfs"
                checked={settings.showDwarfs}
                onCheckedChange={(value) => update("showDwarfs", value)}
              />
              <Label htmlFor="solar-dwarfs" className="text-xs text-white/70">
                {t("showDwarfs")}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="solar-ecliptic"
                checked={settings.showEcliptic}
                onCheckedChange={(value) => update("showEcliptic", value)}
              />
              <Label htmlFor="solar-ecliptic" className="text-xs text-white/70">
                {t("showEcliptic")}
              </Label>
            </div>
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

        {/* Hệ số nén nói ra thay vì để người xem tự đoán.

            Ở chế độ giáo dục hệ số đổi theo khoảng cách, và chính vì thế nó
            cần được nói: hai hành tinh cách nhau gấp đôi trên màn hình thì
            thật ra cách nhau gấp bốn. Một mô hình nén tỉ lệ mà không ghi
            mình nén bao nhiêu thì người xem sẽ đọc khoảng cách trên màn hình
            như khoảng cách thật. */}
        <span>
          {settings.realScale ? t("scaleRealNote") : t("scaleEducationalNote")}{" "}
          {t("scaleNeptune", {
            factor: Math.round(
              compressionAt(PLANETS[PLANETS.length - 1].realDistanceKm / AU_KM),
            ),
          })}
        </span>

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
