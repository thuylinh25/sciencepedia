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
  Cake,
  Camera,
  Check,
  Compass,
  History,
  LocateFixed,
  Maximize,
  Minimize,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Sunrise,
  Sunset,
  X,
} from "lucide-react";

import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_LOCATION,
  SKY_LOCATIONS,
  findSkyLocation,
  type SkyLocation,
} from "@/lib/night-sky/locations";
import {
  compassFor,
  compassName,
  equatorialAltAz,
  loadAstronomy,
  moonPhaseNameAt,
  nextSunrise,
  nextSunset,
  singleBodyReport,
  skyReport,
  type RawAstronomy,
  type SkyReport,
} from "@/lib/night-sky/astro";
import {
  browserTimeZone,
  dayWindowStartUtc,
  formatDateTimeInTz,
  formatTimeInTz,
  fromInputValueInTz,
  gmtOffsetLabel,
  localDayTimeUtc,
  meteorShowerPeak,
  toInputValueInTz,
  utcToWallParts,
  wallTimeToUtc,
} from "@/lib/night-sky/timezone";
import {
  findCatalogEntry,
  type CatalogEntry,
} from "@/lib/night-sky/catalog";
import { SKY_MOMENTS, type SkyMoment } from "@/lib/night-sky/moments";
import { halleyReport, type CometReport } from "@/lib/night-sky/comets";
import {
  buildQuiz,
  buildTourStops,
  type QuizQuestionData,
  type TourStop,
} from "@/lib/night-sky/tour";
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
import {
  SkyCanvas,
  type SkyCursorPos,
  type SkyMarkerPos,
} from "@/components/night-sky/sky-canvas";
import { SkyDeck } from "@/components/night-sky/sky-deck";
import { ObjectSearch } from "@/components/night-sky/object-search";
import { VisiblePanel } from "@/components/night-sky/visible-panel";
import {
  ObjectPanel,
  type SelectedObjectData,
} from "@/components/night-sky/object-panel";
import {
  fmtDayMonth,
  fmtDecDm,
  fmtDegrees,
  fmtEventTime,
  fmtRaHm,
  altitudeBand,
  altitudeBandLabel,
  headingFromOrientation,
  needsOrientationPermission,
  smoothHeading,
  daylightOverlay,
  placeCursorBox,
} from "@/components/night-sky/sky-format";
import { Badge } from "@/components/ui/badge";

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

/** Ba nấc của bottom sheet trên màn hình nhỏ (xem phần panel ở dưới). */
type SheetSnap = "peek" | "half" | "full";
const SHEET_ORDER: readonly SheetSnap[] = ["peek", "half", "full"];

/** Thẻ khoảnh khắc đang mở: một khoảnh khắc lịch sử trong `moments.ts`,
    hoặc "bầu trời ngày bạn sinh" sinh tại chỗ từ ngày người đọc nhập. */
type ActiveMoment =
  | { kind: "moment"; moment: SkyMoment }
  | { kind: "birthday"; dateText: string };

/** Tour đang chạy: các điểm dừng + vị trí hiện tại + đáp án trắc nghiệm
    đã chọn (khoá câu hỏi → khoá lựa chọn dạng chuỗi). */
type TourState = {
  stops: TourStop[];
  index: number;
  answers: Record<number, string>;
  quiz: QuizQuestionData[];
};

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string; at: string }
  | { status: "error" };

/**
 * Số phút GIỜ TƯỜNG trôi qua từ `from` tới `to` tại `tz` — thước đo của
 * thanh trượt thời gian. Đo bằng giờ tường (không phải giờ tuyệt đối) để
 * một vòng trượt 0–1440 luôn là đúng một ngày địa phương, kể cả ngày đổi
 * giờ mùa ở các múi có DST.
 */
function wallElapsedMinutes(tz: string, from: Date, to: Date): number {
  const a = utcToWallParts(tz, from);
  const b = utcToWallParts(tz, to);
  const aMin =
    Date.UTC(a.year, a.month - 1, a.day, a.hour, a.minute) / 60_000;
  const bMin =
    Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute) / 60_000;
  return bMin - aMin;
}

/** Thời điểm có giờ tường = giờ tường của `windowStart` + `minutes` phút. */
function instantAtWindowMinutes(
  tz: string,
  windowStart: Date,
  minutes: number,
): Date {
  const start = utcToWallParts(tz, windowStart);
  const shifted = new Date(
    Date.UTC(start.year, start.month - 1, start.day, start.hour, start.minute) +
      minutes * 60_000,
  );
  return wallTimeToUtc(tz, {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  });
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
  /* Gương ref của `ready` cho các listener native (wheel) — chúng chốt
     một lần lúc gắn, không đọc được state mới qua closure. */
  const engineReadyRef = useRef(false);
  engineReadyRef.current = ready;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [engine, setEngine] = useState<RawAstronomy | null>(null);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    azimuthDeg: number;
    nonce: number;
  } | null>(null);

  /* ---------------- Chế độ chỉ lên trời (S3) ----------------
     Khung trời xoay theo la bàn của điện thoại: sự kiện
     DeviceOrientation → hướng (helper thuần trong sky-format) →
     làm mượt → gửi xuống engine qua đúng kênh focusRequest.
     Phép chiếu của engine khoá theo đường chân trời nên chỉ phương
     vị đi theo máy; độ nghiêng không có trục để bám — ghi rõ vậy ở
     dòng gợi ý thay vì hứa hẹn "chỉ đâu thấy đó" hai chiều. */
  const [sensorOn, setSensorOn] = useState(false);
  const [sensorNote, setSensorNote] = useState<string | null>(null);
  const [sensorSupported, setSensorSupported] = useState(false);
  const sensorStateRef = useRef<{
    heading: number | null;
    lastSentAt: number;
    lastSentAz: number;
    suspendedUntil: number;
    gotData: boolean;
  } | null>(null);
  const sensorWatchdogRef = useRef<number | null>(null);

  useEffect(() => {
    setSensorSupported(
      typeof window !== "undefined" && "DeviceOrientationEvent" in window,
    );
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const st = sensorStateRef.current;
    if (!st) return;
    const ev = event as DeviceOrientationEvent & {
      webkitCompassHeading?: number;
    };
    const raw = headingFromOrientation(
      event.alpha,
      ev.webkitCompassHeading,
      window.screen.orientation?.angle ?? 0,
    );
    if (raw === null) return;
    st.gotData = true;
    st.heading = smoothHeading(st.heading, raw);
    const now = performance.now();
    if (now < st.suspendedUntil || now - st.lastSentAt < 100) return;
    const moved = Math.abs(((st.heading - st.lastSentAz + 540) % 360) - 180);
    if (moved < 0.5) return;
    st.lastSentAt = now;
    st.lastSentAz = st.heading;
    setFocusRequest({ azimuthDeg: st.heading, nonce: now });
  }, []);

  const stopSensor = useCallback(() => {
    window.removeEventListener(
      "deviceorientationabsolute",
      handleOrientation as EventListener,
    );
    window.removeEventListener("deviceorientation", handleOrientation);
    if (sensorWatchdogRef.current !== null) {
      window.clearTimeout(sensorWatchdogRef.current);
      sensorWatchdogRef.current = null;
    }
    sensorStateRef.current = null;
    setSensorOn(false);
  }, [handleOrientation]);

  useEffect(() => stopSensor, [stopSensor]);

  const toggleSensor = useCallback(async () => {
    if (sensorOn) {
      stopSensor();
      return;
    }
    setSensorNote(null);
    // iOS 13+: phải xin quyền cảm biến ngay trong cử chỉ chạm.
    const doe = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (
      typeof doe?.requestPermission === "function" &&
      needsOrientationPermission(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      )
    ) {
      try {
        if ((await doe.requestPermission()) !== "granted") {
          // Trả lời "denied" rõ ràng = người đọc vừa từ chối ở hộp
          // thoại thật của iOS — báo đúng lý do đó.
          setSensorNote(t("sensorDenied"));
          return;
        }
      } catch {
        // API xin quyền ném lỗi (môi trường không có cảm biến thật,
        // trình duyệt desktop): không kết luận là bị từ chối — cứ
        // nghe sự kiện, watchdog không-thấy-dữ-liệu sẽ kết luận.
      }
    }
    sensorStateRef.current = {
      heading: null,
      lastSentAt: 0,
      lastSentAz: -999,
      suspendedUntil: 0,
      gotData: false,
    };
    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation as EventListener,
    );
    window.addEventListener("deviceorientation", handleOrientation);
    setSensorOn(true);
    // Máy tính để bàn có API nhưng không có cảm biến: 2,5 giây không
    // thấy dữ liệu thì tự tắt kèm lời giải thích, tránh nút "bật mà
    // không chạy" làm người đọc tưởng trang hỏng.
    sensorWatchdogRef.current = window.setTimeout(() => {
      if (sensorStateRef.current && !sensorStateRef.current.gotData) {
        stopSensor();
        setSensorNote(t("sensorNoData"));
      }
    }, 2500);
  }, [handleOrientation, sensorOn, stopSensor, t]);
  const [copied, setCopied] = useState(false);
  const [captureOk, setCaptureOk] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  /* --- Phase 3: dòng thời gian, HUD, sheet, khoảnh khắc, tour, AI --- */
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [viewAzimuth, setViewAzimuth] = useState<number | null>(null);
  /* Thu phóng khung trời: góc nhìn do SkyCanvas báo lên (onFov); yêu cầu
     thu/phóng gửi xuống theo mẫu focusRequest (nút + con lăn dùng chung). */
  const [viewFov, setViewFov] = useState<number | null>(null);
  const [zoomRequest, setZoomRequest] = useState<{
    factor: number;
    nonce: number;
  } | null>(null);
  const requestZoom = useCallback((factor: number) => {
    setZoomRequest({ factor, nonce: Date.now() });
  }, []);
  const [hudDimmed, setHudDimmed] = useState(false);
  const hudTimerRef = useRef<number | null>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");
  const sheetDragRef = useRef<{
    startY: number;
    dragged: boolean;
    keepClick?: boolean;
  } | null>(null);
  const [activeMoment, setActiveMoment] = useState<ActiveMoment | null>(null);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState("");
  const [capturePulse, setCapturePulse] = useState(false);
  const [tour, setTour] = useState<TourState | null>(null);
  const [tourNotice, setTourNotice] = useState(false);
  const [tourPendingSunset, setTourPendingSunset] = useState(false);
  const [aiState, setAiState] = useState<AiState>({ status: "idle" });

  /** Mọi lần người đọc tự đổi giờ (gõ ô nhập, chips, khoảnh khắc, tour…)
      đều đi qua đây để dòng thời gian đang chạy dừng lại — chỉ vòng lặp
      phát của sàn mới được tự đẩy giờ đi. */
  const setViewedTime = useCallback((next: Date) => {
    setPlaying(false);
    setTime(next);
  }, []);

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

  /* Ghi trạng thái lên URL để nút Chia sẻ luôn chép đúng khung cảnh.
     Ghi tối đa một lần mỗi phút: dòng thời gian đang chạy đổi `time` mười
     lần mỗi giây, mà URL chỉ cần đúng tới phút là đủ cho một liên kết. */
  const lastUrlWriteRef = useRef("");
  useEffect(() => {
    const writeKey = `${locationId}|${Math.floor(time.getTime() / 60_000)}`;
    if (lastUrlWriteRef.current === writeKey) return;
    lastUrlWriteRef.current = writeKey;
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

  /* Báo cáo panel chỉ cần đúng tới phút: cắt `time` xuống phút để dòng
     thời gian chạy 10 nhịp/giây không tính lại toàn bộ bầu trời theo
     từng nhịp — con số người đọc thấy vẫn là của phút đang xem. */
  const reportTime = useMemo(
    () => new Date(Math.floor(time.getTime() / 60_000) * 60_000),
    [time],
  );
  const report: SkyReport | null = useMemo(
    () =>
      engine
        ? skyReport(engine, observer.lat, observer.lon, reportTime)
        : null,
    [engine, observer.lat, observer.lon, reportTime],
  );

  /* Ban ngày, danh sách "đang nhìn thấy" nói sai lời hứa: thiên thể ở
     trên chân trời nhưng chìm trong nắng. Khi giờ đang xem là ban ngày,
     tính thêm báo cáo tại hoàng hôn của chính ngày đang xem để panel
     liệt kê "tối nay sẽ thấy"; khung trời giữ nguyên giờ đang xem. */
  const eveningReport: SkyReport | null = useMemo(
    () =>
      engine && report?.sun.state === "day" && report.sun.sunset
        ? skyReport(engine, observer.lat, observer.lon, report.sun.sunset)
        : null,
    [engine, observer.lat, observer.lon, report],
  );
  /* Sao chổi Halley (comets.ts): chỉ khác null trong cửa sổ của hai
     lần ghé 1986/2061. Dấu trên khung bám giờ đang xem; dòng trong
     panel bám báo cáo mà panel đang hiển thị (ban ngày là hoàng hôn). */
  const comet: CometReport | null = useMemo(
    () =>
      engine
        ? halleyReport(engine, observer.lat, observer.lon, reportTime)
        : null,
    [engine, observer.lat, observer.lon, reportTime],
  );
  const eveningComet: CometReport | null = useMemo(
    () =>
      engine && report?.sun.state === "day" && report.sun.sunset
        ? halleyReport(engine, observer.lat, observer.lon, report.sun.sunset)
        : null,
    [engine, observer.lat, observer.lon, report],
  );

  const tonightMode = eveningReport !== null;
  /* Lớp phủ khí quyển trong khung theo độ cao Mặt Trời của giờ đang xem. */
  const overlay = report
    ? daylightOverlay(report.sun.altitudeDeg)
    : { day: 0, twilight: 0 };
  const [markerPos, setMarkerPos] = useState<SkyMarkerPos | null>(null);
  const markerTarget = useMemo(
    () =>
      comet && report
        ? {
            altDeg: comet.altitudeDeg,
            azDeg: comet.azimuthDeg,
            sunAltDeg: report.sun.altitudeDeg,
            sunAzDeg: report.sun.azimuthDeg,
          }
        : null,
    [comet, report],
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
          reportTime,
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
          reportTime,
        ),
      };
    }
    return null;
  }, [engine, selected, observer.lat, observer.lon, reportTime]);

  const selectObject = useCallback(
    (entry: CatalogEntry) => {
      setSelected(entry);
      // Trên điện thoại panel là bottom sheet: chọn thiên thể thì nâng
      // sheet lên ít nhất nấc giữa để panel thông tin lộ ra.
      setSheetSnap((snap) => (snap === "peek" ? "half" : snap));
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
  /* Bản mới nhất của selectObject cho hiệu ứng tour dùng: tour chỉ nên
     chạy lại khi đổi ĐIỂM DỪNG, không phải mỗi khi giờ (và kéo theo cả
     danh tính hàm) đổi. */
  const selectObjectRef = useRef(selectObject);
  selectObjectRef.current = selectObject;

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
        setActiveMoment(null);
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

  /* Con lăn chuột trên khung = thu/phóng. Engine có sẵn xử lý wheel
     nhưng CHỈ cho phép chiếu gnomic; trang dùng stereo nên đường đó
     chết — tự bắt ở đây và đi qua cùng `requestZoom` với nút bấm.
     Nghe kiểu native với passive: false vì phải chặn cuộn trang khi
     con trỏ đang trên khung (React gắn wheel dạng passive ở gốc,
     preventDefault trong onWheel sẽ bị bỏ qua). */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      if (!engineReadyRef.current) return;
      event.preventDefault();
      requestZoom(event.deltaY < 0 ? 1.25 : 1 / 1.25);
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [requestZoom]);

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
      setActiveMoment(null);
      if (preset === "now") {
        setViewedTime(new Date());
      } else if (preset === "midnight") {
        // 00:00 ở CUỐI ngày địa phương đang xem (đầu ngày hôm sau): dòng
        // trạng thái hiện ngày mới nên người đọc thấy rõ ngày đã lăn.
        setViewedTime(localDayTimeUtc(tz, time, 1, 0, 0));
      } else if (engine) {
        const startOfViewedDay = localDayTimeUtc(tz, time, 0, 0, 0);
        const startOfNextDay = localDayTimeUtc(tz, time, 1, 0, 0);
        const target =
          preset === "sunset"
            ? nextSunset(engine, observer.lat, observer.lon, startOfViewedDay)
            : nextSunrise(engine, observer.lat, observer.lon, startOfNextDay);
        if (target) setViewedTime(target);
      }
    },
    [engine, observer.lat, observer.lon, setViewedTime, time, tz],
  );

  /* ------------------------------------------------------------ */
  /* Phase 3 — dòng thời gian, khoảnh khắc, tour, AI               */
  /* ------------------------------------------------------------ */

  /* Cửa sổ của thanh trượt: 12:00 địa phương gần nhất không vượt quá
     `time` → 12:00 hôm sau (xem `dayWindowStartUtc` — buổi sáng thuộc
     về cửa sổ mở từ trưa hôm trước, đúng đêm quan sát của nó). */
  const windowStart = dayWindowStartUtc(tz, time);
  const windowEnd = localDayTimeUtc(tz, windowStart, 1, 12, 0);
  const sliderMinutes = Math.min(
    1440,
    Math.max(0, Math.round(wallElapsedMinutes(tz, windowStart, time))),
  );

  const timeRef = useRef(time);
  timeRef.current = time;
  const windowEndRef = useRef(windowEnd);
  windowEndRef.current = windowEnd;

  /* Vòng phát: mỗi 100 ms đẩy giờ đi `speed/10` giây bầu trời. Chạm cuối
     cửa sổ thì dừng ở đó — không tự vòng lại đầu ngày. */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = new Date(timeRef.current.getTime() + speed * 100);
      if (next.getTime() >= windowEndRef.current.getTime()) {
        setTime(windowEndRef.current);
        setPlaying(false);
      } else {
        setTime(next);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const seekMinutes = useCallback(
    (minutes: number) => {
      setViewedTime(
        instantAtWindowMinutes(tz, dayWindowStartUtc(tz, time), minutes),
      );
    },
    [setViewedTime, time, tz],
  );

  const stepMinutes = useCallback(
    (delta: number) => {
      setViewedTime(new Date(time.getTime() + delta * 60_000));
    },
    [setViewedTime, time],
  );

  const togglePlay = useCallback(() => {
    if (!playing && time.getTime() >= windowEnd.getTime() - 1000) {
      // Đang ở cuối cửa sổ mà bấm chạy: phát lại từ đầu cửa sổ.
      setTime(windowStart);
    }
    setPlaying((value) => !value);
  }, [playing, time, windowEnd, windowStart]);

  /* HUD mờ dần sau 3 giây không di chuột trên khung — "chế độ sân khấu":
     đang ngắm trời thì lớp chữ phải biết lui ra. */
  const wakeHud = useCallback(() => {
    setHudDimmed(false);
    if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
    hudTimerRef.current = window.setTimeout(() => setHudDimmed(true), 3000);
  }, []);

  useEffect(() => {
    wakeHud();
    return () => {
      if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
    };
  }, [wakeHud]);

  /* Ô đọc toạ độ tại con trỏ: RA/Dec do engine vẽ tính từ phép chiếu
     của chính nó (callback cursor qua SkyCanvas); độ cao + hướng đổi
     tại đây bằng ĐÚNG đường đổi của panel (`equatorialAltAz` — RA của
     engine là độ, chia 15 thành giờ như catalog vẫn dùng). Di chuột
     bắn sự kiện nhanh hơn nhịp render nhiều, nên handler ghi thẳng
     text/opacity vào nút DOM qua ref — không một lần setState nào.
     Bối cảnh (engine tính, nơi, lúc) cũng qua ref để handler không
     đổi danh tính theo nhịp render của trang. */
  const cursorBoxRef = useRef<HTMLDivElement>(null);
  const cursorMainRef = useRef<HTMLDivElement>(null);
  const cursorSubRef = useRef<HTMLDivElement>(null);
  const cursorContextRef = useRef({
    engine,
    lat: observer.lat,
    lon: observer.lon,
    time,
    isEnglish,
  });
  cursorContextRef.current = {
    engine,
    lat: observer.lat,
    lon: observer.lon,
    time,
    isEnglish,
  };
  const handleCursor = useCallback(
    (pos: SkyCursorPos | null) => {
      const box = cursorBoxRef.current;
      if (!box) return;
      if (!pos) {
        box.style.opacity = "0";
        return;
      }
      const ctx = cursorContextRef.current;
      const main = cursorMainRef.current;
      const sub = cursorSubRef.current;
      if (!main || !sub) return;
      /* Dòng chính nói bằng ngôn ngữ thường (hướng + cao cỡ nào) vì đó
         là thứ người mới cần; xích kinh/xích vĩ lùi xuống dòng phụ nhỏ
         cho người đã quen toạ độ xích đạo. */
      const raDec = `${t("cursorRa")} ${fmtRaHm(pos.raDeg)} · ${t("cursorDec")} ${fmtDecDm(pos.decDeg)}`;
      if (ctx.engine) {
        const { altitudeDeg, azimuthDeg } = equatorialAltAz(
          ctx.engine,
          pos.raDeg / 15,
          pos.decDeg,
          ctx.lat,
          ctx.lon,
          ctx.time,
        );
        const compass = compassFor(azimuthDeg);
        const band = altitudeBandLabel(altitudeBand(altitudeDeg));
        main.textContent = `${ctx.isEnglish ? compass.en : compass.vi} · ${ctx.isEnglish ? band.en : band.vi} · ${fmtDegrees(altitudeDeg)}`;
        sub.textContent = raDec;
        sub.style.display = "";
      } else {
        main.textContent = raDec;
        sub.style.display = "none";
      }
      /* Ô bám theo con trỏ: engine cho sẵn px của con trỏ trong hệ toạ
         độ canvas, mà canvas phủ kín khung nên dùng thẳng làm hệ toạ độ
         của khung (offsetParent của ô). Sự kiện không mang px (không
         xảy ra trên đường chuột) thì giữ nguyên vị trí cũ của ô. */
      const parent = box.offsetParent;
      if (pos.x !== null && pos.y !== null && parent) {
        const placed = placeCursorBox(
          { x: pos.x, y: pos.y },
          { width: box.offsetWidth, height: box.offsetHeight },
          { width: parent.clientWidth, height: parent.clientHeight },
        );
        box.style.left = `${placed.left}px`;
        box.style.top = `${placed.top}px`;
      }
      box.style.opacity = "1";
    },
    [t],
  );

  const applyMoment = useCallback(
    (moment: SkyMoment) => {
      setPlaying(false);
      setLocationId(moment.locationId);
      setTime(moment.instant);
      setActiveMoment({ kind: "moment", moment });
      setBirthdayOpen(false);
    },
    [],
  );

  /* Chọn một khoảnh khắc Halley thì xoay khung tới sao chổi luôn: cả
     điểm của khoảnh khắc là nó, bắt người đọc tự tìm là hỏng một nửa.
     Chỉ bắn một lần cho mỗi lần chọn (ref chốt id) và chỉ khi sao
     chổi thật sự ở trên chân trời tại khoảnh khắc đó. */
  const focusedMomentRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeMoment?.kind !== "moment") return;
    const id = activeMoment.moment.id;
    if (!id.startsWith("halley-")) {
      focusedMomentRef.current = null;
      return;
    }
    if (focusedMomentRef.current === id) return;
    if (!comet || comet.altitudeDeg <= 0) return;
    focusedMomentRef.current = id;
    setFocusRequest({ azimuthDeg: comet.azimuthDeg, nonce: Date.now() });
  }, [activeMoment, comet]);

  const applyBirthday = useCallback(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdayDate);
    if (!match) return;
    const [, year, month, day] = match.map(Number);
    const instant = wallTimeToUtc(tz, { year, month, day, hour: 21, minute: 0 });
    setPlaying(false);
    setTime(instant);
    setActiveMoment({
      kind: "birthday",
      dateText: fmtDayMonth(tz, instant, locale),
    });
    setBirthdayOpen(false);
    // Nháy nút Chụp ảnh một nhịp: tấm thiệp bầu trời ngày sinh là thứ
    // người đọc nhiều khả năng muốn lưu nhất sau thao tác này.
    setCapturePulse(true);
  }, [birthdayDate, locale, tz]);

  useEffect(() => {
    if (!capturePulse) return;
    const id = window.setTimeout(() => setCapturePulse(false), 2200);
    return () => window.clearTimeout(id);
  }, [capturePulse]);

  /* ---------------- Tour dẫn + trắc nghiệm ---------------- */

  const startTour = useCallback(() => {
    if (!report) return;
    setPlaying(false);
    const built = buildTourStops(report);
    if (!built.enough) {
      setTour(null);
      setTourNotice(true);
      return;
    }
    setTourNotice(false);
    setTour({
      stops: built.stops,
      index: 0,
      answers: {},
      quiz: buildQuiz(report, time),
    });
    setSheetSnap("peek");
  }, [report, time]);

  /* Sau cú nhảy hoàng hôn theo lời đề nghị của tour: báo cáo mới về thì
     dựng tour từ chính báo cáo đó. */
  useEffect(() => {
    if (!tourPendingSunset || !report) return;
    const built = buildTourStops(report);
    setTourPendingSunset(false);
    if (built.enough) {
      setTourNotice(false);
      setTour({
        stops: built.stops,
        index: 0,
        answers: {},
        quiz: buildQuiz(report, time),
      });
      setSheetSnap("peek");
    }
    // Vẫn không đủ (vùng cực, ngày trắng…): giữ nguyên thẻ đề nghị.
  }, [report, time, tourPendingSunset]);

  /* Vào một điểm dừng thiên thể = chọn thiên thể đó: panel nạp dữ liệu
     của nó và khung trời xoay tới, như người đọc tự chọn trong danh sách. */
  const tourIndex = tour?.index;
  useEffect(() => {
    if (!tour || tourIndex === undefined) return;
    const stop = tour.stops[tourIndex];
    if (stop?.kind === "object") {
      const entry = findCatalogEntry(stop.body.toLowerCase());
      if (entry) selectObjectRef.current(entry);
    }
  }, [tour, tourIndex]);

  const endTour = useCallback(() => {
    setTour(null);
    setSelected(null);
  }, []);

  const answerQuiz = useCallback((questionIndex: number, key: string) => {
    setTour((current) =>
      current && !(questionIndex in current.answers)
        ? {
            ...current,
            answers: { ...current.answers, [questionIndex]: key },
          }
        : current,
    );
  }, []);

  const retryQuiz = useCallback(() => {
    if (!report) return;
    setTour((current) =>
      current
        ? { ...current, answers: {}, quiz: buildQuiz(report, time) }
        : current,
    );
  }, [report, time]);

  /* ---------------- AI giải thích ---------------- */

  const explain = useCallback(async () => {
    if (!report || aiState.status === "loading") return;
    setAiState({ status: "loading" });
    const sunLine =
      report.sun.state === "day"
        ? report.sun.sunset
          ? t("sunDay", {
              place: observer.label,
              time: fmtEventTime(tz, report.sun.sunset, locale, time),
            })
          : t("sunNoEvent", { place: observer.label })
        : report.sun.state === "twilight"
          ? report.sun.darkTime
            ? t("sunTwilight", {
                place: observer.label,
                time: fmtEventTime(tz, report.sun.darkTime, locale, time),
              })
            : t("sunTwilightNoDark", { place: observer.label })
          : report.sun.sunrise
            ? t("sunNight", {
                place: observer.label,
                time: fmtEventTime(tz, report.sun.sunrise, locale, time),
              })
            : t("sunNoEvent", { place: observer.label });
    const objects = report.planets
      .filter((planet) => planet.altitudeDeg > 0)
      .sort((a, b) => b.altitudeDeg - a.altitudeDeg)
      .slice(0, 6)
      .map((planet) => {
        const entry = findCatalogEntry(planet.body.toLowerCase());
        return {
          name: entry
            ? isEnglish
              ? entry.nameEn
              : entry.nameVi
            : planet.body,
          altDeg: Math.round(planet.altitudeDeg * 10) / 10,
          compass: isEnglish ? planet.compassEn : planet.compassVi,
        };
      });
    try {
      const response = await fetch("/api/night-sky/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          placeName: observer.label,
          wallTimeText: formatDateTimeInTz(tz, time, locale),
          sunState: sunLine,
          moonLine: `${isEnglish ? report.moon.phaseNameEn : report.moon.phaseNameVi} · ${t("moonLit", { percent: Math.round(report.moon.illumFraction * 100) })}`,
          objects,
        }),
      });
      if (!response.ok) throw new Error("explain failed");
      const data = (await response.json()) as { text?: string };
      if (!data.text) throw new Error("explain empty");
      setAiState({
        status: "done",
        text: data.text,
        at: formatDateTimeInTz(tz, time, locale),
      });
    } catch {
      setAiState({ status: "error" });
    }
  }, [aiState.status, isEnglish, locale, observer.label, report, t, time, tz]);

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

  /* Nhãn một đáp án trắc nghiệm: thiên thể thì theo danh mục, số thì là
     chỉ số pha trăng hoặc chỉ số hướng la bàn. */
  const quizOptionLabel = (
    question: QuizQuestionData,
    option: string | number,
  ): string => {
    if (typeof option === "number") {
      const name =
        question.kind === "moonPhase"
          ? moonPhaseNameAt(option)
          : compassName(option);
      return isEnglish ? name.en : name.vi;
    }
    const entry = findCatalogEntry(option.toLowerCase());
    return entry ? (isEnglish ? entry.nameEn : entry.nameVi) : option;
  };

  const quizPrompt = (question: QuizQuestionData): string => {
    switch (question.kind) {
      case "highest":
        return t("quizHighest");
      case "moonPhase":
        return t("quizMoonPhase");
      case "nextRise":
        return t("quizNextRise");
      case "direction": {
        const entry = findCatalogEntry(question.body.toLowerCase());
        return t("quizDirection", {
          name: entry ? (isEnglish ? entry.nameEn : entry.nameVi) : question.body,
        });
      }
    }
  };

  const tourStop: TourStop | undefined = tour?.stops[tour.index];
  const tourLiveBody =
    tourStop?.kind === "object" && report
      ? tourStop.body === "Moon"
        ? report.moon
        : report.planets.find((planet) => planet.body === tourStop.body)
      : undefined;

  return (
    <div className="max-lg:pb-24">
      {/* -------------------------------------------------- thanh điều khiển */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1 sm:max-w-64">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("locationLabel")}
          </span>
          <Select
            value={locationId}
            onValueChange={(value) => {
              setLocationId(value);
              setActiveMoment(null);
            }}
          >
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
              if (next) {
                setViewedTime(next);
                setActiveMoment(null);
              }
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
          className={cn(capturePulse && "animate-pulse ring-2 ring-primary")}
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
            () => {
              setViewedTime(leonids.instant);
              setActiveMoment(null);
            },
          )}
        {geminids.visible &&
          presetButton(
            "geminids",
            <Sparkles className="size-3.5" />,
            t("eventGeminids"),
            () => {
              setViewedTime(geminids.instant);
              setActiveMoment(null);
            },
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
        {sensorNote && <span className="mt-0.5 block">{sensorNote}</span>}
        {sensorOn && !sensorNote && (
          <span className="mt-0.5 block">{t("sensorHint")}</span>
        )}
      </p>

      {/* ------------------------------------------- khung trời + panel */}
      {/* Nền sân khấu nhuộm theo trạng thái Mặt Trời tại giờ đang xem:
          ngày thì sáng, chạng vạng thì chàm sâu, đêm thì gần đen — đổi
          màu có chuyển tiếp một giây. Panel là thẻ mờ đặc nên chữ vẫn
          đọc rõ trên mọi nền, ở cả hai giao diện sáng/tối của trang. */}
      <div
        className={cn(
          "mt-4 rounded-[2rem] p-2.5 transition-colors duration-1000 sm:p-3.5 lg:flex lg:items-start lg:gap-5",
          report?.sun.state === "day" && "bg-sky-200/50 dark:bg-sky-950/50",
          report?.sun.state === "twilight" &&
            "bg-indigo-300/40 dark:bg-indigo-950/60",
          (report?.sun.state === "night" || !report) &&
            "bg-slate-300/40 dark:bg-black/50",
        )}
      >
        <div className="min-w-0 flex-1">
          <div
            ref={frameRef}
            onPointerMove={wakeHud}
            onPointerDown={() => {
              // Người đọc kéo tay thì cảm biến nhường 3 giây, không
              // giành lại hướng nhìn ngay giữa thao tác.
              if (sensorStateRef.current)
                sensorStateRef.current.suspendedUntil =
                  performance.now() + 3000;
            }}
            className={cn(
              "relative flex flex-col overflow-hidden border border-white/10",
              "bg-gradient-to-b from-[#0a1030] via-[#060a20] to-[#03040c]",
              "shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]",
              // Chiều cao phải CHỌN MỘT trong hai bộ, không cộng dồn: `h-full` đặt
              // cạnh `lg:h-[78vh]` thì biến thể responsive thắng trong cascade
              // của Tailwind, khung toàn màn hình kẹt ở 78vh chừa một dải đen
              // phía dưới (QA bản xem trước PR #167 bắt được).
              isFullscreen
                ? "h-full rounded-none"
                : "h-[62vh] rounded-3xl sm:h-[68vh] lg:h-[78vh]",
            )}
          >

            <SkyCanvas
              latitude={observer.lat}
              longitude={observer.lon}
              time={time}
              lang={locale}
              onReady={() => setReady(true)}
              focusRequest={focusRequest}
              zoomRequest={zoomRequest}
              onAzimuth={setViewAzimuth}
              onFov={setViewFov}
              onCursor={handleCursor}
              markerTarget={markerTarget}
              onMarkerPos={setMarkerPos}
            />

            {/* Lớp màu khí quyển nằm TRÊN canvas: canvas của engine
                tự tô nền trời đêm đặc (gradient của chính nó) nên đặt
                lớp màu ở dưới là không thấy gì (vòng 2 của PR #182).
                Nhưng phủ trên ở độ mờ 0,93 thì nhãn chỉ còn ~7% tương
                phản — nên cách sửa đúng là GIỚI HẠN độ mờ của lớp ngày
                (ramp trong sky-format.ts, đỉnh ~0,58) cộng bảng màu
                đậm, giữ đủ tương phản cho nhãn mà trời vẫn rõ là ngày.
                Thứ tự: ngày dưới, ấm trên nó. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#2e6bc2] via-[#5b97d9] to-[#9cc3ea] transition-opacity duration-700"
              style={{ opacity: overlay.day }}
            />
            {/* Lớp ấm nằm trên lớp ngày: ở hoàng hôn lớp ngày đã rút
                nhanh theo độ cao Mặt Trời, sắc cam phủ lên trên tạo
                đúng cảm giác chạng vạng thay vì xanh trưa kéo dài. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] transition-opacity duration-700"
              style={{
                opacity: overlay.twilight,
                // Dải ấm phải nhô lên từ ~55% chiều cao khung: nếu chỉ
                // đậm ở sát đáy, sàn điều khiển che mất đúng phần cam
                // nhất và hoàng hôn trông như xanh xám (QA PR #179).
                background:
                  "linear-gradient(180deg, #101d3d 0%, #2c3d66 45%, #b4552d 78%, #ff8c42 100%)",
              }}
            />

            {/* Chip ban ngày nằm giữa–trên cùng: ở khung hẹp nó tràn
                sang trái đè lên ô hướng (Linh báo trên điện thoại
                29/10) — màn nhỏ cho nó xuống dưới hàng trên cùng. */}
            {report?.sun.state === "day" && report.sun.sunset && (
              <div className="pointer-events-none absolute top-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium whitespace-nowrap text-amber-100 backdrop-blur-sm lg:top-3">
                <Sunrise className="size-3.5" />
                {t("daySkyChip", {
                  time: fmtEventTime(tz, report.sun.sunset, locale, time),
                })}
              </div>
            )}

            {!ready && (
              <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-slate-300">
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

            {sensorSupported && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={toggleSensor}
                aria-label={sensorOn ? t("sensorDisable") : t("sensorEnable")}
                aria-pressed={sensorOn}
                className={cn(
                  "absolute top-16 right-3 z-10 backdrop-blur",
                  sensorOn
                    ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                    : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                <Compass className="size-4" />
              </Button>
            )}

            {/* Cụm thu phóng: cạnh phải, giữa chiều cao khung — góc
                trên-phải đã có nút toàn màn hình, dưới-phải có đồng hồ.
                Số giữa là góc nhìn hiện tại (độ), engine kẹp [1, 60]
                nên hai đầu mút thì nút tương ứng mờ đi. */}
            {ready && viewFov !== null && (
              <div
                role="group"
                aria-label={t("zoomLabel")}
                className="absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-white/15 bg-black/45 px-1.5 py-2 text-white shadow-lg backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => requestZoom(1.4)}
                  disabled={Math.round(viewFov) <= 1}
                  aria-label={t("zoomIn")}
                  title={t("zoomIn")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/70 disabled:pointer-events-none disabled:opacity-35"
                >
                  <Plus className="size-4" />
                </button>
                <span className="text-[11px] leading-none font-semibold tabular-nums">
                  {Math.round(viewFov)}°
                </span>
                <button
                  type="button"
                  onClick={() => requestZoom(1 / 1.4)}
                  disabled={Math.round(viewFov) >= 60}
                  aria-label={t("zoomOut")}
                  title={t("zoomOut")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/70 disabled:pointer-events-none disabled:opacity-35"
                >
                  <Minus className="size-4" />
                </button>
              </div>
            )}

            {/* HUD: la bàn (góc phương vị tâm khung, đọc từ chính thể
                hiện của engine) + đồng hồ giờ tường. Cả hai tự mờ sau 3
                giây không di chuột trên khung (wakeHud). */}
            {viewAzimuth !== null && (
              <div
                aria-hidden
                className={cn(
                  cn(
                    "pointer-events-none absolute top-3 left-3 z-10 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white tabular-nums backdrop-blur-sm transition-opacity duration-500",
                    report?.sun.state === "day" ? "bg-black/60" : "bg-black/35",
                  ),
                  hudDimmed && "opacity-40",
                )}
              >
                {isEnglish
                  ? compassFor(viewAzimuth).en
                  : compassFor(viewAzimuth).vi}{" "}
                · {Math.round(viewAzimuth)}°
              </div>
            )}
            {/* Ô đọc toạ độ BÁM THEO con trỏ (trước đây cố định dưới
                HUD la bàn; Linh đổi theo mẫu TheSkyLive 2026-10-29: toạ
                độ hiện ngay chỗ trỏ). Nội dung và vị trí đều do
                handleCursor ghi thẳng vào DOM (placeCursorBox lo phần
                lật mép); ở đây chỉ dựng khung rỗng đang ẩn. Nằm trong
                phần tử toàn màn hình nên vào toàn màn hình vẫn đi theo,
                như sàn. */}
            <div
              ref={cursorBoxRef}
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-0 left-0 z-30 max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/15 px-3 py-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300",
                report?.sun.state === "day" ? "bg-black/65" : "bg-black/35",
              )}
            >
              <div ref={cursorMainRef} className="text-xs font-medium tabular-nums" />
              <div ref={cursorSubRef} className="text-[10px] text-white/65 tabular-nums" />
            </div>
            {/* Dấu sao chổi Halley: SkyCanvas chiếu bằng phép chiếu
                của chính engine theo nhịp thăm dò, đuôi hướng ra xa
                Mặt Trời. Chỉ hiện khi sao chổi ở trên chân trời và
                điểm chiếu nằm trong khung. */}
            {markerPos &&
              comet &&
              comet.altitudeDeg > 0 &&
              markerPos.xPct >= -2 &&
              markerPos.xPct <= 102 &&
              markerPos.yPct >= -2 &&
              markerPos.yPct <= 102 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute z-30"
                  style={{
                    left: `${markerPos.xPct}%`,
                    top: `${markerPos.yPct}%`,
                  }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div
                      className="absolute top-1/2 left-1/2 h-[3px] w-10 origin-left rounded-full bg-gradient-to-r from-cyan-100/80 to-transparent"
                      style={{
                        transform: `translateY(-50%) rotate(${markerPos.tailAngleDeg}deg)`,
                      }}
                    />
                    <div className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-50 shadow-[0_0_10px_3px_rgba(165,243,252,0.75)]" />
                    <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
                      {isEnglish ? "Comet Halley" : "Sao chổi Halley"}
                    </span>
                  </div>
                </div>
              )}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute right-3 bottom-3 z-10 text-right transition-opacity duration-500 lg:bottom-24",
                hudDimmed && "opacity-40",
              )}
            >
              <div className="font-display text-2xl font-bold text-white tabular-nums [text-shadow:0_1px_10px_rgba(0,0,0,0.85)]">
                {formatTimeInTz(tz, time, locale)}
              </div>
              <div className="text-xs text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
                {fmtDayMonth(tz, time, locale)}
              </div>
            </div>

            <SkyDeck
              tz={tz}
              time={time}
              sliderMinutes={sliderMinutes}
              onSeekMinutes={seekMinutes}
              playing={playing}
              onTogglePlay={togglePlay}
              onStep={stepMinutes}
              speed={speed}
              onSpeedChange={setSpeed}
              isFullscreen={isFullscreen}
              onExitFullscreen={toggleFullscreen}
            />

            {/* Thẻ đề nghị nhảy hoàng hôn khi trời chưa đủ tối cho tour. */}
            {tourNotice && !tour && (
              <div className="absolute bottom-3 lg:bottom-24 left-3 z-20 w-[calc(100%-1.5rem)] max-w-xs rounded-2xl border border-white/15 bg-black/60 p-4 text-white backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed">
                    {t("tourNeedsSunset")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTourNotice(false)}
                    aria-label={t("tourEnd")}
                    className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setTourPendingSunset(true);
                    applyPreset("sunset");
                  }}
                >
                  <Sunset className="size-4" />
                  {t("tourJumpSunset")}
                </Button>
              </div>
            )}

            {/* Thẻ tour: lời dẫn từng điểm dừng + trắc nghiệm cuối tour. */}
            {tour && tourStop && (
              <div className="absolute bottom-3 lg:bottom-24 left-3 z-20 max-h-[52%] w-[calc(100%-1.5rem)] max-w-xs overflow-y-auto rounded-2xl border border-white/15 bg-black/60 p-4 text-white backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                    {t("tourStopOf", {
                      k: tour.index + 1,
                      n: tour.stops.length,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={endTour}
                    aria-label={t("tourEnd")}
                    className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>

                {tourStop.kind === "intro" && (
                  <div className="mt-2">
                    <h3 className="font-display text-base font-bold">
                      {t("tourIntroTitle")}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/85">
                      {t("tourIntroBody")}
                    </p>
                  </div>
                )}

                {tourStop.kind === "object" && (
                  <div className="mt-2">
                    <h3 className="font-display text-base font-bold">
                      {(() => {
                        const entry = findCatalogEntry(
                          tourStop.body.toLowerCase(),
                        );
                        return entry
                          ? isEnglish
                            ? entry.nameEn
                            : entry.nameVi
                          : tourStop.body;
                      })()}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/85">
                      {(() => {
                        const entry = findCatalogEntry(
                          tourStop.body.toLowerCase(),
                        );
                        return entry
                          ? isEnglish
                            ? entry.factEn
                            : entry.factVi
                          : "";
                      })()}
                    </p>
                    {tourLiveBody && (
                      <p className="mt-2 text-xs font-medium text-white/70">
                        {t("tourLiveLine", {
                          alt: fmtDegrees(tourLiveBody.altitudeDeg),
                          dir: isEnglish
                            ? tourLiveBody.compassEn
                            : tourLiveBody.compassVi,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {tourStop.kind === "quiz" && (
                  <div className="mt-2 space-y-4">
                    <h3 className="font-display text-base font-bold">
                      {t("quizTitle")}
                    </h3>
                    {tour.quiz.map((question, questionIndex) => {
                      const chosen = tour.answers[questionIndex];
                      const answered = chosen !== undefined;
                      const correctKey = String(question.correct);
                      const allDone =
                        Object.keys(tour.answers).length >= tour.quiz.length;
                      return (
                        <fieldset key={questionIndex}>
                          <legend className="text-sm font-medium">
                            {quizPrompt(question)}
                          </legend>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {question.options.map((option) => {
                              const key = String(option);
                              const isCorrect = key === correctKey;
                              const isChosen = key === chosen;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={answered}
                                  onClick={() => answerQuiz(questionIndex, key)}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                    !answered &&
                                      "border-white/25 bg-white/5 hover:bg-white/15",
                                    answered &&
                                      isCorrect &&
                                      "border-emerald-300/70 bg-emerald-400/25 text-emerald-100",
                                    answered &&
                                      isChosen &&
                                      !isCorrect &&
                                      "border-red-300/70 bg-red-400/25 text-red-100",
                                    answered &&
                                      !isChosen &&
                                      !isCorrect &&
                                      "border-white/15 bg-white/5 text-white/50",
                                  )}
                                >
                                  {quizOptionLabel(question, option)}
                                </button>
                              );
                            })}
                          </div>
                          {answered && (
                            <p
                              className={cn(
                                "mt-1.5 text-xs font-medium",
                                chosen === correctKey
                                  ? "text-emerald-300"
                                  : "text-red-300",
                              )}
                            >
                              {chosen === correctKey
                                ? t("quizCorrect")
                                : t("quizWrong", {
                                    answer: quizOptionLabel(
                                      question,
                                      question.correct,
                                    ),
                                  })}
                            </p>
                          )}
                          {questionIndex === tour.quiz.length - 1 &&
                            allDone && (
                              <div className="pt-1">
                                <p className="text-sm font-semibold">
                                  {t("quizScore", {
                                    score: tour.quiz.filter(
                                      (q, i) =>
                                        tour.answers[i] === String(q.correct),
                                    ).length,
                                    total: tour.quiz.length,
                                  })}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={retryQuiz}
                                  >
                                    {t("quizRetry")}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={endTour}
                                  >
                                    {t("quizDone")}
                                  </Button>
                                </div>
                              </div>
                            )}
                        </fieldset>
                      );
                    })}
                  </div>
                )}

                {tourStop.kind === "quiz" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setTour((current) =>
                          current
                            ? { ...current, index: current.index - 1 }
                            : current,
                        )
                      }
                    >
                      {t("tourPrev")}
                    </Button>
                  </div>
                )}

                {tourStop.kind !== "quiz" && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={tour.index === 0}
                      onClick={() =>
                        setTour((current) =>
                          current
                            ? { ...current, index: current.index - 1 }
                            : current,
                        )
                      }
                    >
                      {t("tourPrev")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={tour.index >= tour.stops.length - 1}
                      onClick={() =>
                        setTour((current) =>
                          current
                            ? { ...current, index: current.index + 1 }
                            : current,
                        )
                      }
                    >
                      {t("tourNext")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("hint")}
          </p>
        </div>

        {/* Panel: trên lg là cột bên như cũ. Dưới lg nó thành bottom
            sheet dính đáy màn hình với ba nấc chiều cao (há miệng / nửa /
            gần đầy), kéo bằng tay cầm hoặc chạm để luân phiên nấc. Sheet
            nằm NGOÀI phần tử toàn màn hình nên khi xem toàn màn hình nó
            biến mất hẳn — điều khiển lúc đó là sàn điều khiển trong khung. */}
        <div
          className={cn(
            "w-full shrink-0 lg:mt-0 lg:w-80",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:flex max-lg:flex-col",
            "max-lg:rounded-t-3xl max-lg:border-t max-lg:bg-background max-lg:shadow-[0_-12px_40px_rgba(0,0,0,0.4)]",
            "max-lg:transition-[height] max-lg:duration-300",
            sheetSnap === "peek" && "max-lg:h-[5.25rem]",
            sheetSnap === "half" && "max-lg:h-[52dvh]",
            sheetSnap === "full" && "max-lg:h-[88dvh]",
          )}
        >
          <button
            type="button"
            aria-label={t("sheetToggle")}
            aria-expanded={sheetSnap !== "peek"}
            className="touch-none select-none lg:hidden"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              sheetDragRef.current = {
                startY: event.clientY,
                dragged: false,
              };
            }}
            onPointerMove={(event) => {
              const drag = sheetDragRef.current;
              if (!drag) return;
              const dy = event.clientY - drag.startY;
              if (dy < -48 || dy > 48) {
                drag.startY = event.clientY;
                drag.dragged = true;
                setSheetSnap((snap) => {
                  const idx = SHEET_ORDER.indexOf(snap);
                  const next =
                    dy < 0
                      ? Math.min(SHEET_ORDER.length - 1, idx + 1)
                      : Math.max(0, idx - 1);
                  return SHEET_ORDER[next];
                });
              }
            }}
            onPointerUp={() => {
              // Nhả tay sau một cú kéo: click đi kèm không được luân
              // phiên nấc thêm lần nữa.
              if (sheetDragRef.current) {
                sheetDragRef.current.keepClick = sheetDragRef.current.dragged;
              }
            }}
            onClick={() => {
              if (sheetDragRef.current?.keepClick) {
                sheetDragRef.current = null;
                return;
              }
              sheetDragRef.current = null;
              setSheetSnap((snap) =>
                snap === "peek" ? "half" : snap === "half" ? "full" : "peek",
              );
            }}
          >
            <span className="mx-auto mt-2 block h-1.5 w-10 rounded-full bg-muted-foreground/40" />
            <span className="block truncate px-4 pt-1.5 pb-2.5 text-left text-xs font-medium text-muted-foreground">
              {selected
                ? isEnglish
                  ? selected.nameEn
                  : selected.nameVi
                : t("visibleNow")}
            </span>
          </button>

          <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:px-3 max-lg:pb-4 lg:contents">
            <ObjectSearch onSelect={selectObject} />

            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={explain}
                disabled={!report || aiState.status === "loading"}
              >
                <Sparkles className="size-4" />
                {aiState.status === "loading" ? t("aiThinking") : t("aiExplain")}
              </Button>
              {aiState.status === "done" && (
                <div className="mt-3 rounded-2xl border bg-card p-4">
                  <Badge variant="soft">AI</Badge>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {aiState.text}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("aiFactsAt", { when: aiState.at })}
                  </p>
                </div>
              )}
              {aiState.status === "error" && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {t("aiError")}
                </p>
              )}
            </div>

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
                  report={eveningReport ?? report}
                  placeLabel={observer.label}
                  tz={tz}
                  viewedTime={time}
                  isNow={isNow}
                  tonightMode={tonightMode}
                  comet={tonightMode ? eveningComet : comet}
                  onFocusComet={() => {
                    if (tonightMode && report?.sun.sunset) {
                      // Như mọi dòng khác ở chế độ tối nay: nhảy tới
                      // hoàng hôn trước, tới đó mới có dữ kiện để xoay.
                      setPlaying(false);
                      setTime(report.sun.sunset);
                    } else if (comet) {
                      setFocusRequest({
                        azimuthDeg: comet.azimuthDeg,
                        nonce: Date.now(),
                      });
                    }
                  }}
                  onSelect={
                    tonightMode && report?.sun.sunset
                      ? () => {
                          // Đang liệt kê tối nay: chạm vào bất kỳ dòng
                          // nào là nhảy khung trời tới hoàng hôn — tới
                          // đó danh sách trở lại chế độ thường và chọn
                          // thiên thể mới có dữ kiện đúng để xoay tới.
                          setPlaying(false);
                          setTime(report.sun.sunset as Date);
                        }
                      : selectObject
                  }
                  onStartTour={startTour}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Máy thời gian nằm DƯỚI khung trời (PR-C): là nội dung
          khám phá, không phải điều khiển chính — để nó trên khung
          thì khung bị đẩy khỏi tầm nhìn đầu tiên. */}
      {/* Máy thời gian: khoảnh khắc có thật trong moments.ts, mở bằng
          đúng các setter của trang nên URL/Chia sẻ/Chụp bám theo. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <History className="size-3.5" aria-hidden />
          {t("momentsTitle")}
        </span>
        {SKY_MOMENTS.map((moment) =>
          presetButton(
            moment.id,
            null,
            isEnglish ? moment.labelEn : moment.labelVi,
            () => applyMoment(moment),
          ),
        )}
        {presetButton(
          "birthday",
          <Cake className="size-3.5" />,
          t("birthdayChip"),
          () => setBirthdayOpen((open) => !open),
        )}
      </div>

      {birthdayOpen && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            applyBirthday();
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t("birthdayLabel")}
            <Input
              type="date"
              required
              value={birthdayDate}
              onChange={(event) => setBirthdayDate(event.target.value)}
              className="w-44"
            />
          </label>
          <Button type="submit" size="sm">
            {t("birthdayGo")}
          </Button>
        </form>
      )}

      {activeMoment && (
        <div className="mt-3 rounded-2xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-bold">
              {activeMoment.kind === "moment"
                ? isEnglish
                  ? activeMoment.moment.labelEn
                  : activeMoment.moment.labelVi
                : t("birthdayTitle")}
            </h3>
            <button
              type="button"
              onClick={() => setActiveMoment(null)}
              aria-label={t("momentClose")}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {activeMoment.kind === "moment"
              ? isEnglish
                ? activeMoment.moment.blurbEn
                : activeMoment.moment.blurbVi
              : t("birthdayBlurb", { date: activeMoment.dateText })}
          </p>
          <p className="mt-2 text-xs font-medium">
            {t("momentViewing", {
              place: observer.label,
              when: formatDateTimeInTz(tz, time, locale),
            })}
          </p>
          {activeMoment.kind === "birthday" && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("birthdayCaptureHint")}
            </p>
          )}
          <p className="mt-3 border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("momentApproxNote")}
          </p>
        </div>
      )}
    </div>
  );
}
