"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Camera,
  Check,
  LocateFixed,
  Maximize,
  Minimize,
  Moon,
  RotateCcw,
  Share2,
  Sparkles,
  Sunrise,
  Sunset,
} from "lucide-react";

import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_LOCATION,
  SKY_LOCATIONS,
  findSkyLocation,
  type SkyLocation,
} from "@/lib/night-sky/locations";
import {
  equatorialAltAz,
  loadAstronomy,
  nextSunrise,
  nextSunset,
  singleBodyReport,
  skyReport,
  type RawAstronomy,
  type SkyReport,
} from "@/lib/night-sky/astro";
import {
  browserTimeZone,
  formatDateTimeInTz,
  fromInputValueInTz,
  gmtOffsetLabel,
  localDayTimeUtc,
  meteorShowerPeak,
  toInputValueInTz,
  utcToWallParts,
} from "@/lib/night-sky/timezone";
import { type CatalogEntry } from "@/lib/night-sky/catalog";
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
import { ObjectSearch } from "@/components/night-sky/object-search";
import { VisiblePanel } from "@/components/night-sky/visible-panel";
import {
  ObjectPanel,
  type SelectedObjectData,
} from "@/components/night-sky/object-panel";

/**
 * Vỏ trang "Mô phỏng bầu trời": thanh điều khiển của Sciencepedia lái
 * engine vẽ (VirtualSky qua `SkyCanvas`) và engine tính (astronomy-engine
 * qua `astro.ts`) — hai engine, hai việc: một cái VẼ bầu trời, một cái
 * TÍNH xem có gì trên bầu trời đó cho panel thông tin.
 *
 * ## Thời gian theo nơi đang xem
 *
 * Trạng thái `time` là một `Date` tuyệt đối, nhưng mọi thứ người đọc
 * thấy/gõ đều là giờ tường của nơi đang xem (`observer.tz`): ô nhập
 * datetime, dòng trạng thái, giờ mọc/lặn trong panel. Lớp đổi nằm ở
 * `timezone.ts`. Địa điểm tự định vị không có múi giờ danh mục — dùng múi
 * giờ của trình duyệt, vì người đọc đang đứng ở đó.
 *
 * ## Trạng thái trên URL
 *
 * `?loc=<id có sẵn>&t=<thời điểm ISO>`: đọc một lần lúc mount (liên kết
 * được chia sẻ mở đúng khung cảnh), ghi lại bằng `history.replaceState`
 * mỗi khi nơi/giờ đổi — không qua router nên trang tĩnh không bị biến
 * thành động. Toạ độ định vị KHÔNG bao giờ lên URL: liên kết chia sẻ chỉ
 * mang nơi danh mục, không mang vị trí cá nhân của người đọc.
 *
 * "Vị trí của tôi" không bao giờ tự chạy khi mở trang: quyền vị trí chỉ
 * xin khi người đọc bấm nút, và bị từ chối thì giữ nguyên nơi đang chọn
 * kèm một dòng ghi chú nhỏ — không hộp thoại, không chặn thao tác khác.
 */

type Observer = Pick<SkyLocation, "lat" | "lon" | "tz"> & { label: string };

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
  const [engine, setEngine] = useState<RawAstronomy | null>(null);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    azimuthDeg: number;
    nonce: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [captureOk, setCaptureOk] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  const observer: Observer =
    locationId === "custom" && custom
      ? custom
      : (() => {
          const found = findSkyLocation(locationId) ?? DEFAULT_LOCATION;
          return {
            lat: found.lat,
            lon: found.lon,
            tz: found.tz,
            label: isEnglish ? found.nameEn : found.name,
          };
        })();
  const tz = observer.tz;
  const browserTz = browserTimeZone();

  /* Đọc trạng thái từ URL một lần lúc mount: liên kết chia sẻ phải mở
     đúng nơi + lúc người gửi đang xem. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("loc");
    if (loc && findSkyLocation(loc)) setLocationId(loc);
    const rawTime = params.get("t");
    if (rawTime) {
      const parsed = new Date(rawTime);
      if (!Number.isNaN(parsed.getTime())) setTime(parsed);
    }
  }, []);

  /* Ghi trạng thái lên URL để nút Chia sẻ luôn chép đúng khung cảnh. */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (locationId === "custom") url.searchParams.delete("loc");
    else url.searchParams.set("loc", locationId);
    url.searchParams.set("t", time.toISOString());
    window.history.replaceState(null, "", url);
  }, [locationId, time]);

  useEffect(() => {
    let cancelled = false;
    loadAstronomy()
      .then((loaded) => {
        if (!cancelled) setEngine(loaded);
      })
      .catch(() => {
        // Engine tính nạp hỏng: khung trời vẫn chạy, panel đứng ở trạng
        // thái đang tính — trang không sập vì một tính năng phụ trợ.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const report: SkyReport | null = useMemo(
    () =>
      engine ? skyReport(engine, observer.lat, observer.lon, time) : null,
    [engine, observer.lat, observer.lon, time],
  );

  const selectedData: SelectedObjectData | null = useMemo(() => {
    if (!engine || !selected) return null;
    if (selected.body) {
      return {
        kind: "body",
        report: singleBodyReport(
          engine,
          selected.body,
          observer.lat,
          observer.lon,
          time,
        ),
      };
    }
    if (selected.raHours !== undefined && selected.decDeg !== undefined) {
      return {
        kind: "fixed",
        ...equatorialAltAz(
          engine,
          selected.raHours,
          selected.decDeg,
          observer.lat,
          observer.lon,
          time,
        ),
      };
    }
    return null;
  }, [engine, selected, observer.lat, observer.lon, time]);

  const selectObject = useCallback(
    (entry: CatalogEntry) => {
      setSelected(entry);
      if (!engine) return;
      // Xoay khung trời tới thiên thể — chỉ khi nó đang ở trên chân trời;
      // ở dưới chân trời thì xoay cũng không thấy gì, panel tự nói rõ.
      const position = entry.body
        ? singleBodyReport(engine, entry.body, observer.lat, observer.lon, time)
        : entry.raHours !== undefined && entry.decDeg !== undefined
          ? equatorialAltAz(
              engine,
              entry.raHours,
              entry.decDeg,
              observer.lat,
              observer.lon,
              time,
            )
          : null;
      if (position && position.altitudeDeg > 0) {
        setFocusRequest({
          azimuthDeg: position.azimuthDeg,
          nonce: Date.now(),
        });
      }
    },
    [engine, observer.lat, observer.lon, time],
  );

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
          tz: browserTimeZone(),
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

  /* Nút chụp chỉ sống khi khung trời đã có canvas thật để chụp. */
  useEffect(() => {
    if (ready) {
      setCaptureOk(Boolean(frameRef.current?.querySelector("canvas")));
    }
  }, [ready]);

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Không chép được (quyền clipboard): URL trên thanh địa chỉ đã mang
      // đúng khung cảnh nhờ replaceState — người đọc vẫn tự chép được.
    }
  }, []);

  const capture = useCallback(() => {
    const canvas = frameRef.current?.querySelector("canvas");
    if (!canvas) {
      setCaptureOk(false);
      return;
    }
    try {
      const strip = Math.max(76, Math.round(canvas.width * 0.075));
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height + strip;
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(canvas, 0, 0);
      ctx.fillStyle = "#05070f";
      ctx.fillRect(0, canvas.height, canvas.width, strip);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = `600 ${Math.round(strip * 0.3)}px system-ui, sans-serif`;
      ctx.fillText(`${t("title")} — Sciencepedia`, 24, canvas.height + strip * 0.42);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = `400 ${Math.round(strip * 0.23)}px system-ui, sans-serif`;
      ctx.fillText(
        `${observer.label} · ${formatDateTimeInTz(tz, time, locale)} · ${gmtOffsetLabel(tz, time)}`,
        24,
        canvas.height + strip * 0.78,
      );
      const wall = utcToWallParts(tz, time);
      const pad = (n: number) => String(n).padStart(2, "0");
      const link = document.createElement("a");
      link.download = `mo-phong-bau-troi-${locationId}-${wall.year}${pad(wall.month)}${pad(wall.day)}-${pad(wall.hour)}${pad(wall.minute)}.png`;
      link.href = out.toDataURL("image/png");
      link.click();
    } catch {
      setCaptureOk(false);
    }
  }, [locationId, locale, observer.label, t, time, tz]);

  const applyPreset = useCallback(
    (preset: "now" | "sunset" | "midnight" | "sunrise") => {
      if (preset === "now") {
        setTime(new Date());
      } else if (preset === "midnight") {
        // 00:00 ở CUỐI ngày địa phương đang xem (đầu ngày hôm sau): dòng
        // trạng thái hiện ngày mới nên người đọc thấy rõ ngày đã lăn.
        setTime(localDayTimeUtc(tz, time, 1, 0, 0));
      } else if (engine) {
        const startOfViewedDay = localDayTimeUtc(tz, time, 0, 0, 0);
        const startOfNextDay = localDayTimeUtc(tz, time, 1, 0, 0);
        const target =
          preset === "sunset"
            ? nextSunset(engine, observer.lat, observer.lon, startOfViewedDay)
            : nextSunrise(engine, observer.lat, observer.lon, startOfNextDay);
        if (target) setTime(target);
      }
    },
    [engine, observer.lat, observer.lon, time, tz],
  );

  const leonids = meteorShowerPeak(tz, new Date(), 11, 17, 19, 0);
  const geminids = meteorShowerPeak(tz, new Date(), 12, 13, 19, 0);
  const isNow = Math.abs(Date.now() - time.getTime()) < 3 * 60_000;

  const chipClass = "rounded-full";
  const presetButton = (
    key: string,
    icon: ReactNode,
    label: string,
    onClick: () => void,
    disabled = false,
  ) => (
    <Button
      key={key}
      type="button"
      size="sm"
      variant="outline"
      className={chipClass}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
    </Button>
  );

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
            value={toInputValueInTz(tz, time)}
            onChange={(event) => {
              const next = fromInputValueInTz(tz, event.target.value);
              if (next) setTime(next);
            }}
          />
        </div>

        <Button type="button" variant="outline" onClick={share}>
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Share2 className="size-4" />
          )}
          {copied ? t("copied") : t("share")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={capture}
          disabled={!captureOk}
        >
          <Camera className="size-4" />
          {t("capture")}
        </Button>
      </div>

      {/* Chips preset theo ý định quan sát: thay cho việc bắt người đọc
          tự gõ giờ cho những khoảnh khắc ai cũng muốn xem. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {presetButton(
          "now",
          <RotateCcw className="size-3.5" />,
          t("now"),
          () => applyPreset("now"),
        )}
        {presetButton(
          "sunset",
          <Sunset className="size-3.5" />,
          t("presetSunset"),
          () => applyPreset("sunset"),
          !engine,
        )}
        {presetButton(
          "midnight",
          <Moon className="size-3.5" />,
          t("presetMidnight"),
          () => applyPreset("midnight"),
        )}
        {presetButton(
          "sunrise",
          <Sunrise className="size-3.5" />,
          t("presetSunrise"),
          () => applyPreset("sunrise"),
          !engine,
        )}
        {leonids.visible &&
          presetButton(
            "leonids",
            <Sparkles className="size-3.5" />,
            t("eventLeonids"),
            () => setTime(leonids.instant),
          )}
        {geminids.visible &&
          presetButton(
            "geminids",
            <Sparkles className="size-3.5" />,
            t("eventGeminids"),
            () => setTime(geminids.instant),
          )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {observer.label} · {formatDateTimeInTz(tz, time, locale)} ·{" "}
        {gmtOffsetLabel(tz, time)}
        {browserTz !== tz && (
          <span className="mt-0.5 block">
            {t("statusBrowserTime", {
              when: formatDateTimeInTz(browserTz, time, locale),
            })}
          </span>
        )}
        {geoNote && <span className="mt-0.5 block">{geoNote}</span>}
      </p>

      {/* ------------------------------------------- khung trời + panel */}
      <div className="mt-4 lg:flex lg:items-start lg:gap-5">
        <div className="min-w-0 flex-1">
          <div
            ref={frameRef}
            className={cn(
              "relative overflow-hidden border border-white/10",
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
              focusRequest={focusRequest}
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

        {/* Panel nằm NGOÀI phần tử toàn màn hình: vào toàn màn hình là
            xem trời thuần, thoát ra là có lại danh sách và panel. */}
        <div className="mt-5 w-full shrink-0 lg:mt-0 lg:w-80">
          <ObjectSearch onSelect={selectObject} />
          <div className="mt-3">
            {selected ? (
              <ObjectPanel
                entry={selected}
                data={selectedData}
                moon={selected.type === "moon" ? (report?.moon ?? null) : null}
                tz={tz}
                viewedTime={time}
                onBack={() => setSelected(null)}
              />
            ) : (
              <VisiblePanel
                report={report}
                placeLabel={observer.label}
                tz={tz}
                viewedTime={time}
                isNow={isNow}
                onSelect={selectObject}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
