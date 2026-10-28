"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LocateFixed, Maximize, Minimize, RotateCcw } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_LOCATION,
  SKY_LOCATIONS,
  findSkyLocation,
  type SkyLocation,
} from "@/lib/night-sky/locations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkyCanvas } from "@/components/night-sky/sky-canvas";

/**
 * Vỏ trang "Bầu trời đêm nay": thanh điều khiển của Sciencepedia lái engine
 * qua `SkyCanvas`.
 *
 * Trạng thái chỉ có hai thứ — nơi quan sát và thời gian — và cả hai đều nằm
 * ở đây, không nằm trong engine: engine chỉ là nơi vẽ (xem `sky-canvas.tsx`).
 * Phase 2 mới đồng bộ trạng thái này lên URL để chia sẻ liên kết; Phase 1 giữ
 * trong component cho trang tĩnh hoàn toàn và không thêm bề mặt lỗi.
 *
 * "Vị trí của tôi" không bao giờ tự chạy khi mở trang: quyền vị trí chỉ xin
 * khi người đọc bấm nút, và bị từ chối thì giữ nguyên nơi đang chọn kèm một
 * dòng ghi chú nhỏ — không hộp thoại, không chặn thao tác khác.
 */

type Observer = Pick<SkyLocation, "lat" | "lon"> & { label: string };

/** `datetime-local` cần chuỗi theo giờ địa phương, không phải ISO UTC. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function NightSky() {
  const t = useTranslations("nightSky");
  const locale = useLocale() as Locale;
  const isEnglish = locale === "en";

  const [locationId, setLocationId] = useState(DEFAULT_LOCATION.id);
  const [custom, setCustom] = useState<Observer | null>(null);
  const [time, setTime] = useState(() => new Date());
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const observer: Observer =
    locationId === "custom" && custom
      ? custom
      : (() => {
          const found = findSkyLocation(locationId) ?? DEFAULT_LOCATION;
          return {
            lat: found.lat,
            lon: found.lon,
            label: isEnglish ? found.nameEn : found.name,
          };
        })();

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoNote(t("geoUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setGeoNote(null);
        setCustom({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: t("yourLocation"),
        });
        setLocationId("custom");
      },
      () => {
        setLocating(false);
        setGeoNote(t("geoDenied"));
      },
      { timeout: 10_000 },
    );
  }, [t]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void frameRef.current?.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div>
      {/* -------------------------------------------------- thanh điều khiển */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1 sm:max-w-64">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("locationLabel")}
          </span>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger aria-label={t("locationLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKY_LOCATIONS.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {isEnglish ? location.nameEn : location.name}
                </SelectItem>
              ))}
              {custom && (
                <SelectItem value="custom">{custom.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={useMyLocation}
          disabled={locating}
        >
          <LocateFixed className="size-4" />
          {t("useMyLocation")}
        </Button>

        <div className="min-w-52 flex-1 sm:max-w-64">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("timeLabel")}
          </span>
          <Input
            type="datetime-local"
            aria-label={t("timeLabel")}
            value={toLocalInputValue(time)}
            onChange={(event) => {
              const next = new Date(event.target.value);
              if (!Number.isNaN(next.getTime())) setTime(next);
            }}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setTime(new Date())}
        >
          <RotateCcw className="size-4" />
          {t("now")}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {t("coordinates", {
          place: observer.label,
          lat: Math.abs(observer.lat).toFixed(4),
          lon: Math.abs(observer.lon).toFixed(4),
        })}
        {geoNote && <span className="mt-0.5 block">{geoNote}</span>}
      </p>

      {/* -------------------------------------------------------- khung trời */}
      <div
        ref={frameRef}
        className={cn(
          "relative mt-4 overflow-hidden border border-white/10",
          "bg-gradient-to-b from-[#0a1030] via-[#060a20] to-[#03040c]",
          "shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]",
          // Chiều cao phải CHỌN MỘT trong hai bộ, không cộng dồn: `h-full` đặt
          // cạnh `lg:h-[70vh]` thì biến thể responsive thắng trong cascade
          // của Tailwind, khung toàn màn hình kẹt ở 70vh chừa một dải đen
          // phía dưới (QA bản xem trước PR #167 bắt được).
          isFullscreen
            ? "h-full rounded-none"
            : "h-[56vh] rounded-3xl sm:h-[62vh] lg:h-[70vh]",
        )}
      >
        <SkyCanvas
          latitude={observer.lat}
          longitude={observer.lon}
          time={time}
          lang={locale}
          onReady={() => setReady(true)}
        />

        {!ready && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-300">
            <span className="animate-pulse">{t("loading")}</span>
          </p>
        )}

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
          className="absolute top-3 right-3 z-10 bg-white/10 text-white backdrop-blur hover:bg-white/20"
        >
          {isFullscreen ? (
            <Minimize className="size-4" />
          ) : (
            <Maximize className="size-4" />
          )}
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t("hint")}
      </p>
    </div>
  );
}
