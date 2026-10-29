import {
  formatTimeInTz,
  isSameLocalDay,
} from "@/lib/night-sky/timezone";

/**
 * Định dạng hiển thị dùng chung cho panel của "Mô phỏng bầu trời".
 * Mọi giờ đều là giờ tường của nơi đang xem; sự kiện rơi sang ngày địa
 * phương khác thì kèm ngày/tháng, kẻo "mọc 05:12" của ngày mai đọc như
 * của hôm nay.
 */
export function fmtEventTime(
  tz: string,
  date: Date,
  locale: string,
  viewed: Date,
): string {
  const time = formatTimeInTz(tz, date, locale);
  if (isSameLocalDay(tz, date, viewed)) return time;
  const dayMonth = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${time} · ${dayMonth}`;
}

export function fmtDayMonth(tz: string, date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function fmtDegrees(value: number): string {
  return `${Math.round(value)}°`;
}

/**
 * Xích kinh (độ) → giờ + phút, kiểu ô toạ độ của Bản đồ bầu trời sâu
 * ("17h 45m"). Làm tròn TỔNG số phút trước rồi mới tách giờ/phút, để
 * phần lẻ dồn đúng qua mốc giờ (266,25° → "17h 45m"; 359,999° làm tròn
 * thành 1440 phút thì vòng về "0h 00m" chứ không in "24h 00m").
 */
export function fmtRaHm(raDeg: number): string {
  const normalized = ((raDeg % 360) + 360) % 360;
  const totalMinutes = Math.round((normalized / 15) * 60) % 1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/**
 * Xích vĩ (độ) → độ + phút cung có dấu ("−29° 00′", "+41° 16′"), cùng
 * kiểu ô toạ độ của Bản đồ bầu trời sâu. Dấu trừ là U+2212 như dạng nhà
 * vẫn in; giá trị làm tròn về 0 phút thì mang dấu cộng (không in
 * "−0° 00′"). Dồn qua mốc độ xử lý như ở `fmtRaHm`.
 */
export function fmtDecDm(decDeg: number): string {
  const clamped = Math.min(90, Math.max(-90, decDeg));
  const totalArcminutes = Math.round(Math.abs(clamped) * 60);
  const degrees = Math.floor(totalArcminutes / 60);
  const arcminutes = totalArcminutes % 60;
  const sign = clamped < 0 && totalArcminutes > 0 ? "−" : "+";
  return `${sign}${degrees}° ${String(arcminutes).padStart(2, "0")}′`;
}

/**
 * Góc nhìn sau một bước thu/phóng: `factor > 1` là phóng to nên góc
 * nhìn CHIA cho factor. Kẹp vào [1, 60] — đúng giới hạn cứng `setFOV`
 * của engine — để nút bấm và con lăn chuột dùng chung một luật và ô
 * hiển thị không bao giờ hứa một góc nhìn engine không cho.
 */
export function zoomFov(current: number, factor: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(factor) || factor <= 0) {
    return current;
  }
  return Math.min(60, Math.max(1, current / factor));
}

/**
 * Chỗ đặt ô đọc toạ độ: BÁM THEO con trỏ (yêu cầu của Linh 2026-10-29,
 * theo mẫu TheSkyLive — toạ độ hiện ngay chỗ trỏ, không phải ở một góc
 * cố định bắt mắt phải đi tìm). Ô lệch phải/xuống một nhịp để không che
 * điểm đang chỉ; chạm mép phải/dưới của khung thì lật sang phía đối
 * diện; kết quả luôn được kẹp trong khung với lề 4 px. Thuần số học để
 * test được — `handleCursor` chỉ áp kết quả vào style của ô.
 */
export function placeCursorBox(
  pointer: { x: number; y: number },
  box: { width: number; height: number },
  frame: { width: number; height: number },
): { left: number; top: number } {
  const GAP_X = 16;
  const GAP_Y = 18;
  const MARGIN = 4;
  let left = pointer.x + GAP_X;
  if (left + box.width > frame.width - MARGIN) {
    left = pointer.x - GAP_X - box.width;
  }
  let top = pointer.y + GAP_Y;
  if (top + box.height > frame.height - MARGIN) {
    top = pointer.y - GAP_Y - box.height;
  }
  return {
    left: Math.min(
      Math.max(left, MARGIN),
      Math.max(MARGIN, frame.width - box.width - MARGIN),
    ),
    top: Math.min(
      Math.max(top, MARGIN),
      Math.max(MARGIN, frame.height - box.height - MARGIN),
    ),
  };
}

/**
 * Độ đậm hai lớp phủ khí quyển trong khung theo độ cao Mặt Trời (độ):
 * `day` là lớp xanh ngày (làm chìm sao như mắt thật bị chói), `twilight`
 * là lớp ấm chạng vạng. Nội suy tuyến tính giữa các mốc, kẹp ở hai đầu.
 * Engine vẽ sao bất kể ngày đêm nên lớp phủ này là nơi duy nhất nói cho
 * khung trời biết "đang sáng đến mức nào" — thuần hàm để kiểm thử được.
 */
/** Dải độ cao nói bằng lời thường cho ô toạ độ con trỏ: người mới
 * không hình dung "47°" là cao cỡ nào cho tới khi có mốc so sánh. */
export type AltitudeBand = "below" | "horizon" | "low" | "high" | "zenith";

export function altitudeBand(altDeg: number): AltitudeBand {
  if (altDeg < 0) return "below";
  if (altDeg < 15) return "horizon";
  if (altDeg < 40) return "low";
  if (altDeg < 65) return "high";
  return "zenith";
}

const ALTITUDE_BAND_LABELS: Record<AltitudeBand, { vi: string; en: string }> = {
  below: { vi: "dưới chân trời", en: "below the horizon" },
  horizon: { vi: "sát chân trời", en: "near the horizon" },
  low: { vi: "thấp trên bầu trời", en: "low in the sky" },
  high: { vi: "cao trên bầu trời", en: "high in the sky" },
  zenith: { vi: "gần ngay đỉnh đầu", en: "almost overhead" },
};

export function altitudeBandLabel(band: AltitudeBand): { vi: string; en: string } {
  return ALTITUDE_BAND_LABELS[band];
}

/** Hướng la bàn (độ, 0 = Bắc, theo chiều kim đồng hồ) từ sự kiện
 * DeviceOrientation. iOS cho sẵn `webkitCompassHeading`; Android cho
 * `alpha` ngược chiều kim đồng hồ nên phải lật. Cộng góc xoay màn
 * hình để máy nằm ngang vẫn đúng hướng. Không có dữ liệu thì null. */
export function headingFromOrientation(
  alpha: number | null,
  webkitHeading: number | null | undefined,
  screenAngleDeg: number,
): number | null {
  const norm = (deg: number) => ((deg % 360) + 360) % 360;
  if (typeof webkitHeading === "number" && Number.isFinite(webkitHeading))
    return norm(webkitHeading + screenAngleDeg);
  if (alpha === null || !Number.isFinite(alpha)) return null;
  return norm(360 - alpha + screenAngleDeg);
}

/** Chỉ iOS/iPadOS mới thật sự cần (và tôn trọng) lời gọi xin quyền
 * cảm biến: Safari/WebKit từ iOS 13 chặn sự kiện orientation cho tới
 * khi `requestPermission` được chấp thuận. Các môi trường khác có
 * thể cũng phơi hàm này nhưng trả "denied" giả (stub trên desktop
 * không có cảm biến) — tin nó là báo sai lý do cho người đọc. */
export function needsOrientationPermission(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  // iPadOS giả danh Macintosh nhưng có cảm ứng đa điểm.
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  return false;
}

/** Làm mượt hướng la bàn theo vòng tròn (350° → 10° đi qua 0°, không
 * vòng ngược 340°). `factor` là tỉ lệ bước nhảy mỗi sự kiện. */
export function smoothHeading(
  prev: number | null,
  next: number,
  factor = 0.35,
): number {
  if (prev === null) return next;
  const delta = ((next - prev + 540) % 360) - 180;
  return ((prev + delta * factor) % 360 + 360) % 360;
}

export function daylightOverlay(altDeg: number): {
  day: number;
  twilight: number;
} {
  const ramp = (
    stops: ReadonlyArray<readonly [number, number]>,
    x: number,
  ): number => {
    if (x <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (x <= stops[i][0]) {
        const [x0, y0] = stops[i - 1];
        const [x1, y1] = stops[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return stops[stops.length - 1][1];
  };
  return {
    day: ramp(
      [
        [-18, 0],
        [-12, 0.08],
        [-6, 0.22],
        [-2, 0.34],
        [0, 0.44],
        [2, 0.52],
        [6, 0.58],
      ],
      altDeg,
    ),
    twilight: ramp(
      [
        [-16, 0],
        [-10, 0.3],
        [-4, 0.55],
        [0, 0.38],
        [3, 0],
      ],
      altDeg,
    ),
  };
}
