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
