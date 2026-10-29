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
        [-12, 0.15],
        [-6, 0.35],
        [-2, 0.55],
        [0, 0.72],
        [2, 0.88],
        [6, 0.93],
      ],
      altDeg,
    ),
    twilight: ramp(
      [
        [-16, 0],
        [-10, 0.28],
        [-4, 0.42],
        [0, 0.3],
        [3, 0],
      ],
      altDeg,
    ),
  };
}
