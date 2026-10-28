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
