/**
 * Lớp thiên văn của trang "Mô phỏng bầu trời": bọc `astronomy-engine` bản
 * vendor ở `public/night-sky/astronomy.browser.js` (MIT, xem `NOTICE.md`
 * trong thư mục đó) sau một API miền hẹp, có kiểu chặt.
 *
 * ## Vì sao bọc, không gọi thẳng biến toàn cục
 *
 * Engine là script thuần nạp bằng thẻ `<script>` và phơi ra `window.Astronomy`.
 * Nếu component nào cũng chạm vào biến toàn cục đó thì chữ ký của thư viện
 * (tên hàm, thứ tự tham số, `AstroTime` thay vì `Date`) rò khắp trang — đổi
 * thư viện là sửa khắp nơi. Ở đây chỉ còn các khái niệm của trang: độ cao,
 * phương vị, giờ mọc/lặn, pha trăng. Mọi giá trị đều do engine TÍNH từ
 * (nơi, lúc); tệp này không chứa một hằng số thiên văn nào tự nghĩ ra.
 *
 * ## Ngữ nghĩa "mọc / lặn" trong báo cáo
 *
 * `rise`/`set` của một thiên thể là cặp sự kiện của LƯỢT QUA bầu trời liên
 * quan tới thời điểm đang xem: thiên thể đang ở trên chân trời thì `rise`
 * là lần mọc đã bắt đầu lượt này (tìm ngược) và `set` là lần lặn sắp tới;
 * đang ở dưới chân trời thì `rise` là lần mọc sắp tới và `set` là lần lặn
 * kết thúc lượt đó. `culmination` là lần qua kinh tuyến của cùng lượt.
 * Gần cực, một thiên thể có thể không mọc/lặn trong cửa sổ tìm — khi đó
 * trường tương ứng là `null`, và UI phải nói "không mọc/lặn" thay vì bịa giờ.
 */

export type PlanetBodyName =
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune";

export type BodyName = "Sun" | "Moon" | PlanetBodyName;

export const PLANET_BODIES: readonly PlanetBodyName[] = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
] as const;

export type SunState = "day" | "twilight" | "night";

export type BodyReport = {
  body: BodyName;
  altitudeDeg: number;
  azimuthDeg: number;
  compassVi: string;
  compassEn: string;
  rise: Date | null;
  set: Date | null;
  culmination: { time: Date; altitudeDeg: number } | null;
};

export type SunReport = {
  altitudeDeg: number;
  azimuthDeg: number;
  state: SunState;
  sunrise: Date | null;
  sunset: Date | null;
  /** Lúc Mặt Trời xuống tới −18° (hết tối thiên văn); null khi đã tối hẳn
      hoặc không xuống tới trong cửa sổ tìm (vùng cực vào mùa hè). */
  darkTime: Date | null;
};

export type MoonReport = BodyReport & {
  body: "Moon";
  illumFraction: number;
  phaseAngleDeg: number;
  phaseNameVi: string;
  phaseNameEn: string;
  nextFullMoon: Date | null;
  nextNewMoon: Date | null;
};

export type SkyReport = {
  sun: SunReport;
  moon: MoonReport;
  planets: BodyReport[];
};

/* ------------------------------------------------------------------ */
/* Lớp bọc kiểu chặt quanh biến toàn cục của engine                    */
/* ------------------------------------------------------------------ */

type AstroTimeLike = { date: Date };

export type RawAstronomy = {
  Observer: new (latitude: number, longitude: number, height: number) => object;
  Body: Record<string, string>;
  Equator: (
    body: string,
    date: Date,
    observer: object,
    ofdate: boolean,
    aberration: boolean,
  ) => { ra: number; dec: number; dist: number };
  Horizon: (
    date: Date,
    observer: object,
    ra: number,
    dec: number,
  ) => { azimuth: number; altitude: number };
  SearchRiseSet: (
    body: string,
    observer: object,
    direction: number,
    dateStart: Date,
    limitDays: number,
  ) => AstroTimeLike | null;
  SearchHourAngle: (
    body: string,
    observer: object,
    hourAngle: number,
    dateStart: Date,
    direction?: number,
  ) => { time: AstroTimeLike; hor: { altitude: number; azimuth: number } };
  GeoVector: (
    body: string,
    date: Date,
    aberration: boolean,
  ) => { x: number; y: number; z: number };
  MoonPhase: (date: Date) => number;
  Illumination: (
    body: string,
    date: Date,
  ) => { phase_fraction: number; phase_angle: number };
  SearchAltitude: (
    body: string,
    observer: object,
    direction: number,
    dateStart: Date,
    limitDays: number,
    altitude: number,
  ) => AstroTimeLike | null;
  SearchMoonPhase: (
    targetLon: number,
    dateStart: Date,
    limitDays: number,
  ) => AstroTimeLike | null;
};

declare global {
  interface Window {
    Astronomy?: unknown;
  }
}

const REQUIRED_MEMBERS = [
  "Observer",
  "Body",
  "Equator",
  "Horizon",
  "SearchRiseSet",
  "SearchHourAngle",
  "MoonPhase",
  "GeoVector",
  "Illumination",
  "SearchAltitude",
  "SearchMoonPhase",
] as const;

/** Kiểm chứng hình dạng của biến toàn cục rồi mới tin — biên dữ liệu ngoài
    thì không `any`, chỉ `unknown` đã qua kiểm. */
export function asAstronomy(raw: unknown): RawAstronomy {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Astronomy engine không sẵn sàng");
  }
  const record = raw as Record<string, unknown>;
  for (const member of REQUIRED_MEMBERS) {
    if (typeof record[member] !== "function" && member !== "Body") {
      throw new Error(`Astronomy engine thiếu thành viên ${member}`);
    }
  }
  if (typeof record.Body !== "object" || record.Body === null) {
    throw new Error("Astronomy engine thiếu bảng Body");
  }
  return raw as RawAstronomy;
}

const ENGINE_SRC = "/night-sky/astronomy.browser.js";
let engineLoad: Promise<RawAstronomy> | null = null;

/** Nạp engine một lần cho cả trang (chỉ phía client). */
export function loadAstronomy(): Promise<RawAstronomy> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Astronomy engine chỉ chạy ở client"));
  }
  if (window.Astronomy) {
    try {
      return Promise.resolve(asAstronomy(window.Astronomy));
    } catch {
      return Promise.reject(new Error("Astronomy engine hỏng định dạng"));
    }
  }
  engineLoad ??= new Promise<RawAstronomy>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ENGINE_SRC;
    script.async = false;
    script.onload = () => {
      try {
        resolve(asAstronomy(window.Astronomy));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Nạp engine hỏng"));
      }
    };
    script.onerror = () => reject(new Error(`Không nạp được ${ENGINE_SRC}`));
    document.head.appendChild(script);
  });
  return engineLoad;
}

/* ------------------------------------------------------------------ */
/* Hướng la bàn và pha trăng — bảng biên tập, không phải hằng số đo    */
/* ------------------------------------------------------------------ */

const COMPASS: ReadonlyArray<{ vi: string; en: string }> = [
  { vi: "Bắc", en: "North" },
  { vi: "Đông Bắc", en: "Northeast" },
  { vi: "Đông", en: "East" },
  { vi: "Đông Nam", en: "Southeast" },
  { vi: "Nam", en: "South" },
  { vi: "Tây Nam", en: "Southwest" },
  { vi: "Tây", en: "West" },
  { vi: "Tây Bắc", en: "Northwest" },
];

/** Chỉ số hướng 0–7 (0 = Bắc, tăng theo chiều kim đồng hồ) theo phương vị. */
export function compassIndexFor(azimuthDeg: number): number {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  return Math.floor((normalized + 22.5) / 45) % 8;
}

/** Tên hướng 8 hướng theo phương vị (0° = Bắc, 90° = Đông). */
export function compassFor(azimuthDeg: number): { vi: string; en: string } {
  return COMPASS[compassIndexFor(azimuthDeg)];
}

/** Tên hướng theo chỉ số 0–7 — cho HUD và câu hỏi trắc nghiệm dùng chỉ số. */
export function compassName(index: number): { vi: string; en: string } {
  return COMPASS[((index % 8) + 8) % 8];
}

const MOON_PHASES: ReadonlyArray<{ vi: string; en: string }> = [
  { vi: "Trăng non", en: "New Moon" },
  { vi: "Lưỡi liềm đầu tháng", en: "Waxing Crescent" },
  { vi: "Thượng huyền", en: "First Quarter" },
  { vi: "Trăng khuyết đầu tháng", en: "Waxing Gibbous" },
  { vi: "Trăng tròn", en: "Full Moon" },
  { vi: "Trăng khuyết cuối tháng", en: "Waning Gibbous" },
  { vi: "Hạ huyền", en: "Last Quarter" },
  { vi: "Lưỡi liềm cuối tháng", en: "Waning Crescent" },
];

/** Chỉ số khoảng pha 0–7 theo góc pha (0° = trăng non, 180° = trăng tròn). */
export function moonPhaseIndexFor(phaseAngleDeg: number): number {
  const normalized = ((phaseAngleDeg % 360) + 360) % 360;
  return Math.floor((normalized + 22.5) / 45) % 8;
}

/** Tám khoảng pha biên tập theo góc pha (0° = trăng non, 180° = trăng tròn). */
export function moonPhaseName(phaseAngleDeg: number): {
  vi: string;
  en: string;
} {
  return MOON_PHASES[moonPhaseIndexFor(phaseAngleDeg)];
}

/** Tên pha theo chỉ số 0–7 — cho câu hỏi trắc nghiệm dùng chỉ số. */
export function moonPhaseNameAt(index: number): { vi: string; en: string } {
  return MOON_PHASES[((index % 8) + 8) % 8];
}

/* ------------------------------------------------------------------ */
/* Tính toán miền                                                      */
/* ------------------------------------------------------------------ */

function safe<T>(fn: () => T | null): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function altAzOf(
  engine: RawAstronomy,
  observer: object,
  body: string,
  date: Date,
): { altitudeDeg: number; azimuthDeg: number } {
  const equator = engine.Equator(body, date, observer, true, true);
  const horizon = engine.Horizon(date, observer, equator.ra, equator.dec);
  return { altitudeDeg: horizon.altitude, azimuthDeg: horizon.azimuth };
}

function bodyReport(
  engine: RawAstronomy,
  observer: object,
  body: BodyName,
  date: Date,
): BodyReport {
  const { altitudeDeg, azimuthDeg } = altAzOf(engine, observer, body, date);
  const compass = compassFor(azimuthDeg);
  const up = altitudeDeg > 0;

  const nextRise = safe(
    () => engine.SearchRiseSet(body, observer, 1, date, 2)?.date ?? null,
  );
  const prevRise = safe(
    () => engine.SearchRiseSet(body, observer, 1, date, -2)?.date ?? null,
  );
  const nextSet = safe(
    () => engine.SearchRiseSet(body, observer, -1, date, 2)?.date ?? null,
  );

  const nextTransit = safe(() =>
    engine.SearchHourAngle(body, observer, 0, date, 1),
  );
  let culmination: BodyReport["culmination"] = nextTransit
    ? { time: nextTransit.time.date, altitudeDeg: nextTransit.hor.altitude }
    : null;
  // Đang ở trên trời mà lần qua kinh tuyến tới lại rơi sau lần lặn tới thì
  // đó là đỉnh của LƯỢT SAU — đỉnh của lượt này là lần qua kinh tuyến trước.
  if (up && culmination && nextSet && culmination.time > nextSet) {
    const prevTransit = safe(() =>
      engine.SearchHourAngle(body, observer, 0, date, -1),
    );
    if (prevTransit) {
      culmination = {
        time: prevTransit.time.date,
        altitudeDeg: prevTransit.hor.altitude,
      };
    }
  }

  return {
    body,
    altitudeDeg,
    azimuthDeg,
    compassVi: compass.vi,
    compassEn: compass.en,
    rise: up ? prevRise : nextRise,
    set: nextSet,
    culmination,
  };
}

/** Độ cao/phương vị của một điểm cố định trên vòm trời (sao, tâm chòm sao)
    cho bởi xích kinh/xích vĩ J2000 — cho panel thông tin, không qua engine vẽ. */
export function equatorialAltAz(
  engine: RawAstronomy,
  raHours: number,
  decDeg: number,
  lat: number,
  lon: number,
  date: Date,
): { altitudeDeg: number; azimuthDeg: number; compassVi: string; compassEn: string } {
  const observer = new engine.Observer(lat, lon, 0);
  const horizon = engine.Horizon(date, observer, raHours, decDeg);
  const compass = compassFor(horizon.azimuth);
  return {
    altitudeDeg: horizon.altitude,
    azimuthDeg: horizon.azimuth,
    compassVi: compass.vi,
    compassEn: compass.en,
  };
}

/** Báo cáo đầy đủ cho một nơi + một lúc: Mặt Trời, Mặt Trăng, 7 hành tinh. */
export function skyReport(
  engine: RawAstronomy,
  lat: number,
  lon: number,
  date: Date,
): SkyReport {
  const observer = new engine.Observer(lat, lon, 0);

  const sunBase = bodyReport(engine, observer, "Sun", date);
  const sunState: SunState =
    sunBase.altitudeDeg > 0
      ? "day"
      : sunBase.altitudeDeg > -12
        ? "twilight"
        : "night";
  const darkTime =
    sunBase.altitudeDeg > -18
      ? safe(
          () =>
            engine.SearchAltitude("Sun", observer, -1, date, 1.5, -18)?.date ??
            null,
        )
      : null;

  const moonBase = bodyReport(engine, observer, "Moon", date);
  const illumination = engine.Illumination("Moon", date);
  const phaseAngleDeg = engine.MoonPhase(date);
  const phaseName = moonPhaseName(phaseAngleDeg);

  return {
    sun: {
      altitudeDeg: sunBase.altitudeDeg,
      azimuthDeg: sunBase.azimuthDeg,
      state: sunState,
      sunrise: sunBase.rise,
      sunset: sunBase.set,
      darkTime,
    },
    moon: {
      ...moonBase,
      body: "Moon",
      illumFraction: illumination.phase_fraction,
      phaseAngleDeg,
      phaseNameVi: phaseName.vi,
      phaseNameEn: phaseName.en,
      nextFullMoon: safe(
        () => engine.SearchMoonPhase(180, date, 40)?.date ?? null,
      ),
      nextNewMoon: safe(
        () => engine.SearchMoonPhase(0, date, 40)?.date ?? null,
      ),
    },
    planets: PLANET_BODIES.map((body) =>
      bodyReport(engine, observer, body, date),
    ),
  };
}

/** Báo cáo riêng cho một thiên thể hệ Mặt Trời (panel thông tin). */
export function singleBodyReport(
  engine: RawAstronomy,
  body: BodyName,
  lat: number,
  lon: number,
  date: Date,
): BodyReport {
  return bodyReport(engine, new engine.Observer(lat, lon, 0), body, date);
}

/** Lần Mặt Trời mọc tiếp theo sau `from` — nguyên liệu cho chip preset. */
export function nextSunrise(
  engine: RawAstronomy,
  lat: number,
  lon: number,
  from: Date,
): Date | null {
  const observer = new engine.Observer(lat, lon, 0);
  return safe(
    () => engine.SearchRiseSet("Sun", observer, 1, from, 2)?.date ?? null,
  );
}

/** Lần Mặt Trời lặn tiếp theo sau `from` — nguyên liệu cho chip preset. */
export function nextSunset(
  engine: RawAstronomy,
  lat: number,
  lon: number,
  from: Date,
): Date | null {
  const observer = new engine.Observer(lat, lon, 0);
  return safe(
    () => engine.SearchRiseSet("Sun", observer, -1, from, 2)?.date ?? null,
  );
}
