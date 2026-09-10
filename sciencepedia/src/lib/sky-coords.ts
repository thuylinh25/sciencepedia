/**
 * Đổi qua lại giữa toạ độ xích đạo dạng chữ và độ thập phân.
 *
 * ## Vì sao lưu toạ độ dưới dạng CHUỖI trong CSDL
 *
 * Catalog thiên văn công bố toạ độ dạng sexagesimal ("00 42 44.330"), và đó là
 * dạng người biên tập chép từ SIMBAD sang. Lưu thẳng chuỗi đó thì cái nằm
 * trong CSDL đúng bằng cái đọc được ở nguồn — không có bước làm tròn nào chen
 * vào giữa, và khi đối chiếu lại thì so chuỗi với chuỗi.
 *
 * Aladin cần độ thập phân, nên việc quy đổi nằm ở đây, một chỗ duy nhất.
 *
 * ## Quy ước đọc
 *
 * Xích kinh (RA) tính bằng GIỜ khi viết sexagesimal (24h = 360°), xích vĩ
 * (Dec) tính bằng ĐỘ. Đây là nguồn nhầm lẫn kinh điển: cùng một cụm ba số
 * nhưng nhân hệ số khác nhau. Một chuỗi chỉ có MỘT số thì hiểu là độ thập
 * phân — dạng mà API trả về.
 */

/** Đủ mọi dấu phân cách mà catalog hay dùng: h m s d ° ′ ″ : và dấu cách */
const SEPARATORS = /[hmsd°'"′″:\s]+/;

function tokenize(value: string): { negative: boolean; parts: number[] } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Dấu âm phải bắt ở đây chứ không lấy từ Number(parts[0]): "-00 30 00" có
  // phần độ bằng 0, mà Number("-00") là -0 — sai dấu cho cả chuỗi.
  const negative = trimmed.startsWith("-");
  const body = trimmed.replace(/^[+-]/, "");

  const parts = body
    .split(SEPARATORS)
    .filter((token) => token.length > 0)
    .map(Number);

  if (parts.length === 0 || parts.length > 3) return null;
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;

  return { negative, parts };
}

function sexagesimalToDecimal(parts: number[]): number {
  const [first = 0, second = 0, third = 0] = parts;
  return first + second / 60 + third / 3600;
}

/**
 * Xích kinh → độ, hoặc `null` nếu chuỗi không đọc được.
 *
 *   parseRa("00 42 44.330")  → 10.6847
 *   parseRa("00h42m44.33s")  → 10.6847
 *   parseRa("10.6847")       → 10.6847   (đã là độ)
 */
export function parseRa(value: string): number | null {
  const parsed = tokenize(value);
  if (!parsed || parsed.negative) return null;

  const degrees =
    parsed.parts.length === 1
      ? parsed.parts[0]
      : sexagesimalToDecimal(parsed.parts) * 15;

  return degrees >= 0 && degrees < 360 ? degrees : null;
}

/**
 * Xích vĩ → độ, hoặc `null` nếu chuỗi không đọc được.
 *
 *   parseDec("+41 16 09.4") →  41.2693
 *   parseDec("-05 23 28")   →  -5.3911
 *   parseDec("41.2693")     →  41.2693
 */
export function parseDec(value: string): number | null {
  const parsed = tokenize(value);
  if (!parsed) return null;

  const magnitude =
    parsed.parts.length === 1
      ? parsed.parts[0]
      : sexagesimalToDecimal(parsed.parts);

  const degrees = parsed.negative ? -magnitude : magnitude;
  return degrees >= -90 && degrees <= 90 ? degrees : null;
}

function pad(value: number, width = 2): string {
  return value.toString().padStart(width, "0");
}

/** Độ → "00 42 44.33" (giờ, phút, giây) */
export function formatRa(degrees: number): string {
  const totalHours = ((degrees % 360) + 360) % 360 / 15;
  const hours = Math.floor(totalHours);
  const minutes = Math.floor((totalHours - hours) * 60);
  const seconds = ((totalHours - hours) * 60 - minutes) * 60;
  return `${pad(hours)} ${pad(minutes)} ${seconds.toFixed(2).padStart(5, "0")}`;
}

/** Độ → "+41 16 09.4" (độ, phút cung, giây cung) */
export function formatDec(degrees: number): string {
  const sign = degrees < 0 ? "-" : "+";
  const absolute = Math.abs(degrees);
  const wholeDegrees = Math.floor(absolute);
  const arcminutes = Math.floor((absolute - wholeDegrees) * 60);
  const arcseconds = ((absolute - wholeDegrees) * 60 - arcminutes) * 60;
  return `${sign}${pad(wholeDegrees)} ${pad(arcminutes)} ${arcseconds
    .toFixed(1)
    .padStart(4, "0")}`;
}

/**
 * Cặp toạ độ dạng chuỗi → cặp độ thập phân, hoặc `null` nếu một trong hai hỏng.
 *
 * Trả `null` cho cả cặp chứ không trả một nửa: một khung nhìn có RA đúng và
 * Dec sai thì trỏ vào chỗ vô nghĩa, tệ hơn là không trỏ đâu cả.
 */
export function parseCoordinates(
  ra: string,
  dec: string,
): { ra: number; dec: number } | null {
  const raDegrees = parseRa(ra);
  const decDegrees = parseDec(dec);
  if (raDegrees === null || decDegrees === null) return null;
  return { ra: raDegrees, dec: decDegrees };
}

/** Nhãn hiển thị cho người đọc, luôn cùng một dạng dù nguồn viết kiểu gì. */
export function formatCoordinates(ra: number, dec: number): string {
  return `${formatRa(ra)} ${formatDec(dec)}`;
}

/**
 * Tách một chuỗi người dùng gõ thành cặp RA/Dec.
 *
 * Chấp nhận cả ba dạng hay gặp:
 *   "10.6847 41.2693"            — độ thập phân
 *   "00 42 44.33 +41 16 07.5"    — sexagesimal, dec có dấu
 *   "00:42:44.33 +41:16:07.5"    — sexagesimal, dấu hai chấm
 *
 * Chỗ khó là biết cắt ở đâu. Dấu `+`/`-` đứng giữa chuỗi là ranh giới chắc
 * chắn nhất vì xích vĩ luôn có dấu khi viết đầy đủ. Không có dấu thì chia đôi
 * số cụm — đúng cho cả "2 cụm" lẫn "6 cụm", là hai dạng thực tế duy nhất.
 */
export function parseCoordinatePair(
  input: string,
): { ra: number; dec: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const signIndex = trimmed.search(/(?<=.)[+-]/);
  if (signIndex > 0) {
    return parseCoordinates(
      trimmed.slice(0, signIndex),
      trimmed.slice(signIndex),
    );
  }

  const tokens = trimmed.split(/[\s:]+/).filter(Boolean);
  if (tokens.length % 2 !== 0) return null;

  const half = tokens.length / 2;
  return parseCoordinates(
    tokens.slice(0, half).join(" "),
    tokens.slice(half).join(" "),
  );
}
