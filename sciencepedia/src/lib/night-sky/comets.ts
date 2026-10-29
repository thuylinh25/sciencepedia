/**
 * Sao chổi cho trang "Mô phỏng bầu trời": vị trí sao chổi Halley tính từ
 * phần tử quỹ đạo ĐÃ CÔNG BỐ, lan truyền bằng bài toán Kepler hai vật.
 *
 * ## Nguồn dữ kiện (không tự nghĩ ra một hằng số nào)
 *
 * Phần tử quỹ đạo (hướng của mặt phẳng quỹ đạo + hình dạng) lấy từ nghiệm
 * của JPL Small-Body Database cho 1P/Halley, epoch 1987-02-17 TT, hệ
 * hoàng đạo J2000: q = 0,585978 AU, e = 0,967143, i = 162,2627°,
 * Ω = 58,4201°, ω = 111,3325°, cận nhật 1986-02-09.449 TT. Nghiệm này
 * tái tạo đúng các dấu mốc đã ghi trong lịch sử quan trắc: cận nhật
 * 9/2/1986 và lần tiến gần Trái Đất nhất 0,42 AU ngày 11/4/1986 (kiểm
 * thử ở `comets.test.ts` chốt cả hai).
 *
 * Phía Trái Đất/Mặt Trời vẫn do astronomy-engine tính (GeoVector của
 * Mặt Trời) — tệp này chỉ thêm phía sao chổi, không thay engine ở đâu cả.
 *
 * Độ sáng theo quy ước quang trắc sao chổi m = 5,5 + 5·log10(Δ) +
 * 10·log10(r) (H = 5,5, n = 4 — các giá trị thường dùng cho Halley).
 * Đó là ƯỚC TÍNH: sao chổi thật bùng sáng thất thường theo hoạt động
 * nhân, giao diện luôn ghi "ước tính" cạnh con số.
 *
 * ## Lần ghé 2061
 *
 * Chưa có nghiệm quỹ đạo riêng cho 2061 ở độ tin cậy của 1986, nên lần
 * ghé này dùng CÙNG hướng quỹ đạo của nghiệm JPL trên, chỉ thay mốc cận
 * nhật bằng ngày dự báo đã công bố 28/7/2061, và mang cờ `forecast`.
 * Sai số vị trí cỡ vài độ quanh cận nhật — đủ cho một dấu chỉ hướng
 * "nó ở vùng trời đó", không phải số liệu trắc lượng; lời kể của
 * khoảnh khắc 2061 nói rõ đây là dự báo.
 */
import { equatorialAltAz, type RawAstronomy } from "./astro";

export type CometElements = {
  /** Khoảng cách cận nhật (AU). */
  qAu: number;
  /** Độ lệch tâm. */
  e: number;
  /** Độ nghiêng quỹ đạo (độ, hoàng đạo J2000). */
  iDeg: number;
  /** Kinh độ nút lên (độ, hoàng đạo J2000). */
  nodeDeg: number;
  /** Acgumen cận nhật (độ). */
  argPeriDeg: number;
  /** Mốc cận nhật, mili-giây UTC (TT và UTC lệch <1 phút ở đây). */
  tpMs: number;
};

export type CometApparition = {
  id: string;
  elements: CometElements;
  /** Cửa sổ quanh cận nhật mà trang quan tâm tới sao chổi (ngày). */
  windowBeforeDays: number;
  windowAfterDays: number;
  /** true = vị trí là dự báo suy từ nghiệm của lần ghé trước. */
  forecast: boolean;
};

export type CometReport = {
  apparitionId: string;
  forecast: boolean;
  raHours: number;
  decDeg: number;
  /** Khoảng cách tới Trái Đất (AU). */
  deltaAu: number;
  /** Khoảng cách tới Mặt Trời (AU). */
  rAu: number;
  /** Độ sáng biểu kiến ước tính (cấp sao). */
  magnitudeEst: number;
  altitudeDeg: number;
  azimuthDeg: number;
  compassVi: string;
  compassEn: string;
};

/** Hướng quỹ đạo chung cho cả hai lần ghé — nghiệm JPL epoch 1987-02-17. */
const HALLEY_ORIENTATION = {
  qAu: 0.585978,
  e: 0.967143,
  iDeg: 162.2627,
  nodeDeg: 58.4201,
  argPeriDeg: 111.3325,
} as const;

export const HALLEY_APPARITIONS: readonly CometApparition[] = [
  {
    id: "1986",
    elements: {
      ...HALLEY_ORIENTATION,
      tpMs: Date.UTC(1986, 1, 9, 10, 47), // cận nhật 1986-02-09.449 TT
    },
    windowBeforeDays: 240,
    windowAfterDays: 300,
    forecast: false,
  },
  {
    id: "2061",
    elements: {
      ...HALLEY_ORIENTATION,
      tpMs: Date.UTC(2061, 6, 28, 12, 0), // cận nhật dự báo 28/7/2061
    },
    windowBeforeDays: 240,
    windowAfterDays: 300,
    forecast: true,
  },
];

const GAUSS_K = 0.01720209895; // rad/ngày ở 1 AU (hằng số Gauss)
const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180; // hoàng đạo → xích đạo J2000
const DAY_MS = 86_400_000;

/** Giải E − e·sinE = M bằng Newton; e của Halley rất sát 1 nên khởi tạo
    ở π và lặp hào phóng — hội tụ vẫn chắc ở độ chính xác trang cần. */
function solveKeplerE(meanAnomalyRad: number, e: number): number {
  const twoPi = 2 * Math.PI;
  let m = ((meanAnomalyRad % twoPi) + twoPi) % twoPi;
  if (m > Math.PI) m -= twoPi;
  let E = Math.PI;
  for (let i = 0; i < 60; i++) {
    const step = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return E;
}

/** Vị trí nhật tâm của sao chổi trong hệ xích đạo J2000 (AU). */
export function cometHeliocentricEqj(
  elements: CometElements,
  date: Date,
): { x: number; y: number; z: number; rAu: number } {
  const a = elements.qAu / (1 - elements.e);
  const meanMotion = GAUSS_K / Math.pow(a, 1.5);
  const E = solveKeplerE(
    meanMotion * ((date.getTime() - elements.tpMs) / DAY_MS),
    elements.e,
  );
  const r = a * (1 - elements.e * Math.cos(E));
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + elements.e) * Math.sin(E / 2),
      Math.sqrt(1 - elements.e) * Math.cos(E / 2),
    );
  const u = nu + (elements.argPeriDeg * Math.PI) / 180;
  const node = (elements.nodeDeg * Math.PI) / 180;
  const inc = (elements.iDeg * Math.PI) / 180;
  // Hoàng đạo J2000 trước…
  const xE =
    r * (Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(inc));
  const yE =
    r * (Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(inc));
  const zE = r * (Math.sin(u) * Math.sin(inc));
  // …rồi xoay quanh trục x theo góc nghiêng hoàng đạo sang xích đạo J2000.
  return {
    x: xE,
    y: yE * Math.cos(OBLIQUITY_RAD) - zE * Math.sin(OBLIQUITY_RAD),
    z: yE * Math.sin(OBLIQUITY_RAD) + zE * Math.cos(OBLIQUITY_RAD),
    rAu: r,
  };
}

/**
 * Báo cáo sao chổi Halley cho một nơi + một lúc, hoặc null khi thời điểm
 * nằm ngoài cửa sổ của cả hai lần ghé (lúc đó sao chổi ở rất xa và mờ —
 * trang không nhắc tới nó). Độ cao/phương vị đi qua cùng `equatorialAltAz`
 * mà danh mục sao dùng, để mọi thiên thể trên trang nhất quán một đường.
 */
export function halleyReport(
  engine: RawAstronomy,
  lat: number,
  lon: number,
  date: Date,
): CometReport | null {
  const apparition = HALLEY_APPARITIONS.find((a) => {
    const dt = date.getTime() - a.elements.tpMs;
    return (
      dt >= -a.windowBeforeDays * DAY_MS && dt <= a.windowAfterDays * DAY_MS
    );
  });
  if (!apparition) return null;

  const helio = cometHeliocentricEqj(apparition.elements, date);
  // GeoVector("Sun") là vị trí Mặt Trời NHÌN TỪ Trái Đất → vị trí nhật
  // tâm của Trái Đất là số đối của nó; sao chổi địa tâm = nhật tâm của
  // sao chổi trừ nhật tâm của Trái Đất, tức cộng vectơ Mặt Trời địa tâm.
  const sunGeo = engine.GeoVector("Sun", date, false);
  const gx = helio.x + sunGeo.x;
  const gy = helio.y + sunGeo.y;
  const gz = helio.z + sunGeo.z;
  const deltaAu = Math.hypot(gx, gy, gz);
  const raHours = ((Math.atan2(gy, gx) / Math.PI) * 12 + 24) % 24;
  const decDeg = (Math.asin(gz / deltaAu) * 180) / Math.PI;
  const magnitudeEst =
    5.5 + 5 * Math.log10(deltaAu) + 10 * Math.log10(helio.rAu);
  const altAz = equatorialAltAz(engine, raHours, decDeg, lat, lon, date);
  return {
    apparitionId: apparition.id,
    forecast: apparition.forecast,
    raHours,
    decDeg,
    deltaAu,
    rAu: helio.rAu,
    magnitudeEst,
    altitudeDeg: altAz.altitudeDeg,
    azimuthDeg: altAz.azimuthDeg,
    compassVi: altAz.compassVi,
    compassEn: altAz.compassEn,
  };
}
