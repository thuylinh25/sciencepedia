"use client";

import { useLocale, useTranslations } from "next-intl";
import { Minimize, Pause, Play } from "lucide-react";

import { formatTimeInTz } from "@/lib/night-sky/timezone";
import { cn } from "@/lib/utils";

/**
 * Sàn điều khiển thời gian NẰM TRONG khung trời — vị trí là lý do tồn tại
 * của nó: phần tử toàn màn hình là chính khung này, nên mọi thứ ở ngoài
 * khung (chips, panel, ô nhập giờ) đều biến mất khi vào toàn màn hình,
 * còn sàn này thì ở lại. Vào "chế độ quan sát" mà mất quyền tua giờ là
 * lỗi đã ghi ở bản review Phase 1; sàn này là cách sửa.
 *
 * Sàn chỉ lo DÒNG thời gian: cửa sổ 12:00 → 12:00 hôm sau theo giờ tường
 * của nơi đang xem (cha tính sẵn thành phút 0–1440), nút bước ±15′, chạy/
 * dừng và tốc độ. Chọn ngày, chọn nơi, preset ý định vẫn là việc của
 * thanh điều khiển phía trên khung.
 *
 * Kính mờ đen theo đúng ngôn ngữ lớp phủ của Hành trình thu phóng
 * (`bg-black/40 backdrop-blur`), chữ trắng — sàn ngồi trên bầu trời nên
 * không theo theme sáng/tối của trang.
 */
export function SkyDeck({
  tz,
  time,
  sliderMinutes,
  onSeekMinutes,
  playing,
  onTogglePlay,
  onStep,
  speed,
  onSpeedChange,
  isFullscreen,
  onExitFullscreen,
}: {
  tz: string;
  time: Date;
  /** Vị trí trên thanh trượt: phút trôi từ 12:00 địa phương, 0–1440. */
  sliderMinutes: number;
  onSeekMinutes: (minutes: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  /** Bước thời gian theo phút (âm = lùi). */
  onStep: (minutes: number) => void;
  /** Tốc độ chạy: giây bầu trời mỗi giây thật. */
  speed: number;
  onSpeedChange: (speed: number) => void;
  isFullscreen: boolean;
  onExitFullscreen: () => void;
}) {
  const t = useTranslations("nightSky");
  const locale = useLocale();

  const ghostButton =
    "inline-flex h-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/70";

  return (
    <div
      className="relative z-20 mx-3 mt-3 mb-3 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-black/45 px-2.5 py-2 text-white shadow-lg backdrop-blur-md sm:gap-2.5 sm:px-3.5"
      role="group"
      aria-label={t("deckLabel")}
    >
      <button
        type="button"
        className={cn(ghostButton, "w-8 text-sm font-semibold")}
        onClick={() => onStep(-15)}
        aria-label={t("deckStepBack")}
        title={t("deckStepBack")}
      >
        −15′
      </button>

      <button
        type="button"
        className={cn(ghostButton, "w-9 bg-white/10")}
        onClick={onTogglePlay}
        aria-label={playing ? t("deckPause") : t("deckPlay")}
        title={playing ? t("deckPause") : t("deckPlay")}
      >
        {playing ? (
          <Pause className="size-4" />
        ) : (
          <Play className="ml-0.5 size-4" />
        )}
      </button>

      <button
        type="button"
        className={cn(ghostButton, "w-8 text-sm font-semibold")}
        onClick={() => onStep(15)}
        aria-label={t("deckStepForward")}
        title={t("deckStepForward")}
      >
        +15′
      </button>

      <input
        type="range"
        min={0}
        max={1440}
        step={1}
        value={sliderMinutes}
        onChange={(event) => onSeekMinutes(Number(event.target.value))}
        aria-label={t("deckTimeline")}
        className="h-1.5 min-w-14 flex-1 cursor-pointer accent-sky-400"
      />

      <select
        value={speed}
        onChange={(event) => onSpeedChange(Number(event.target.value))}
        aria-label={t("deckSpeed")}
        className="h-8 shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/10 px-1.5 text-xs font-medium text-white [&>option]:text-black"
      >
        {[60, 300, 900].map((option) => (
          <option key={option} value={option}>
            ×{option}
          </option>
        ))}
      </select>

      <span className="hidden shrink-0 text-sm font-semibold tabular-nums min-[480px]:block">
        {formatTimeInTz(tz, time, locale)}
      </span>

      {isFullscreen && (
        <button
          type="button"
          className={cn(ghostButton, "w-8")}
          onClick={onExitFullscreen}
          aria-label={t("exitFullscreen")}
          title={t("exitFullscreen")}
        >
          <Minimize className="size-4" />
        </button>
      )}
    </div>
  );
}
