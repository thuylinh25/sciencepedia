/**
 * Đổi qua lại giữa "giờ tường" của nơi quan sát và thời điểm UTC tuyệt đối.
 *
 * ## Vì sao cần tệp này
 *
 * Phase 1 để ô `datetime-local` hiểu theo giờ máy của người đọc: chọn Tokyo
 * nhưng gõ 21:00 thì engine nhận 21:00 giờ của máy — sai hẳn một múi giờ so
 * với điều người đọc nghĩ ("21:00 tối ở Tokyo"). Từ Phase 2, mọi giờ hiển
 * thị và sửa được trên trang là giờ tường của NƠI ĐANG XEM; engine thiên
 * văn chỉ nhận `Date` tuyệt đối. Lớp đổi này là chỗ duy nhất biết về múi
 * giờ — và nó chỉ dùng `Intl.DateTimeFormat`, không thêm thư viện ngày giờ.
 */

export type WallParts = {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number;
};

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(tz);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormatters.set(tz, formatter);
  }
  return formatter;
}

/** Các mảnh giờ tường của một thời điểm tuyệt đối tại múi giờ `tz`. */
export function utcToWallParts(
  tz: string,
  date: Date,
): WallParts & { second: number } {
  const parts = partsFormatter(tz).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // hourCycle "h23" cho 0–23; vài môi trường vẫn trả 24 ở nửa đêm.
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Lệch múi giờ (ms) của `tz` tại thời điểm `date`: giờ tường = UTC + lệch. */
function tzOffsetMs(tz: string, date: Date): number {
  const wall = utcToWallParts(tz, date);
  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  // Intl làm tròn xuống giây; bỏ phần lẻ của chính thời điểm trước khi trừ.
  return wallAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Thời điểm UTC có giờ tường đúng như `wall` tại `tz`. Đoán một lần rồi
 * hiệu chỉnh lại một lần: quanh giờ đổi giờ mùa (DST) độ lệch tại thời điểm
 * đoán và tại đáp án có thể khác nhau, vòng hiệu chỉnh thứ hai bắt được.
 */
export function wallTimeToUtc(tz: string, wall: WallParts): Date {
  const guess = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
  );
  const firstOffset = tzOffsetMs(tz, new Date(guess));
  let utc = guess - firstOffset;
  const secondOffset = tzOffsetMs(tz, new Date(utc));
  if (secondOffset !== firstOffset) utc = guess - secondOffset;
  return new Date(utc);
}

/** Giá trị cho ô `datetime-local`: giờ tường tại `tz`, dạng `YYYY-MM-DDTHH:mm`. */
export function toInputValueInTz(tz: string, date: Date): string {
  const wall = utcToWallParts(tz, date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${wall.year}-${pad(wall.month)}-${pad(wall.day)}` +
    `T${pad(wall.hour)}:${pad(wall.minute)}`
  );
}

/** Đọc giá trị ô `datetime-local` (giờ tường tại `tz`) thành thời điểm UTC. */
export function fromInputValueInTz(tz: string, value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return wallTimeToUtc(tz, { year, month, day, hour, minute });
}

/**
 * Thời điểm UTC mang giờ tường `hour:minute` của ngày cách ngày địa phương
 * chứa `base` đúng `dayDelta` ngày (0 = cùng ngày, 1 = ngày mai theo giờ
 * của nơi đang xem). Mọi preset "hoàng hôn nay / nửa đêm nay / bình minh
 * mai" đều neo vào khái niệm "ngày địa phương" này, không neo vào ngày UTC.
 */
export function localDayTimeUtc(
  tz: string,
  base: Date,
  dayDelta: number,
  hour: number,
  minute: number,
): Date {
  const wall = utcToWallParts(tz, base);
  const shifted = new Date(
    Date.UTC(wall.year, wall.month - 1, wall.day + dayDelta),
  );
  return wallTimeToUtc(tz, {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour,
    minute,
  });
}

/** "GMT+7" / "GMT-4" / "GMT+5:30" — nhãn lệch múi giờ ngắn cho dòng trạng thái. */
export function gmtOffsetLabel(tz: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  });
  const raw =
    formatter
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(raw);
  if (!match) return "GMT+0";
  const [, sign, hours, minutes] = match;
  const hourNumber = Number(hours);
  return minutes && minutes !== "00"
    ? `GMT${sign}${hourNumber}:${minutes}`
    : `GMT${sign}${hourNumber}`;
}

/** Ngày địa phương (khoá `YYYY-MM-DD`) của một thời điểm tại `tz`. */
export function localDateKey(tz: string, date: Date): string {
  const wall = utcToWallParts(tz, date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

/** Hai thời điểm có cùng ngày địa phương tại `tz` hay không. */
export function isSameLocalDay(tz: string, a: Date, b: Date): boolean {
  return localDateKey(tz, a) === localDateKey(tz, b);
}

export function formatTimeInTz(
  tz: string,
  date: Date,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatDateTimeInTz(
  tz: string,
  date: Date,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Múi giờ của trình duyệt người đọc — nơi ở "custom" theo định vị dùng nó. */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * Chip sự kiện mưa sao băng: cực đại rơi vào `peakMonth/peakDay` hằng năm
 * lúc `hour:minute` giờ tường của nơi đang xem. Chip chỉ hiện khi "hôm nay"
 * (theo giờ nơi đang xem) nằm trong cửa sổ [cực đại − 45 ngày, cực đại + 1
 * ngày] — đủ dài để người đọc lên kế hoạch, đủ ngắn để không thành nhiễu
 * quanh năm. Đã qua cửa sổ thì xét cực đại của năm sau.
 */
export function meteorShowerPeak(
  tz: string,
  at: Date,
  peakMonth: number,
  peakDay: number,
  hour: number,
  minute: number,
): { visible: boolean; instant: Date } {
  const today = utcToWallParts(tz, at);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const DAY = 86_400_000;

  let peakYear = today.year;
  let diffDays =
    (Date.UTC(peakYear, peakMonth - 1, peakDay) - todayUtc) / DAY;
  if (diffDays < -1) {
    peakYear += 1;
    diffDays = (Date.UTC(peakYear, peakMonth - 1, peakDay) - todayUtc) / DAY;
  }
  return {
    visible: diffDays <= 45 && diffDays >= -1,
    instant: wallTimeToUtc(tz, {
      year: peakYear,
      month: peakMonth,
      day: peakDay,
      hour,
      minute,
    }),
  };
}
