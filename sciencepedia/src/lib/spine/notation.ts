import { SEGMENTS, VERTEBRA_ORDER, isVertebraCode, type Segment, type VertebraCode } from "./vertebrae";

/**
 * Đọc ký hiệu đốt sống viết tay trong tài liệu "Phương pháp Tác động Cột sống
 * Việt Nam" thành danh sách mã chuẩn.
 *
 * Tài liệu viết nén và không thống nhất — mọi dạng dưới đây có thật trong bản
 * scan (xem `content/tac-dong-cot-song/source/pages/`):
 *
 *   "T2,3,7,8"  "T3.4.5"  "L4,5 và S1"  "L1->L5 S1->5"  "C1- C5; T1- T10"
 *   "T1 – T8"   "C1; 2; 3"  "L2,3. S1,2"  "Song chỉnh L3// S3"  "C6,7, D11"
 *   "T6 F"  "C7; T1; T2; T3 bên phải"  "các đốt sống cổ và T11"  "vùng S"
 *
 * ## Ba luật không được nới
 *
 * 1. **Chỉ chữ cái + số mới là đốt sống.** "T" hay "F" đứng một mình là trái /
 *    phải (chủ sản phẩm xác nhận 2026-10-05): "ngực T, sườn F". Số trần chỉ được
 *    hiểu là đốt khi đứng ngay sau một mã cùng nhóm ("T2,3" = T2, T3).
 * 2. **Dừng ở từ khoá của hệ khái niệm khác.** "T7 thuộc Tam giác cơ 4" — số 4 là
 *    vùng tam giác cơ, không phải T4. "Tiết cơ ngang T8" là tiết đoạn cơ. Phần
 *    sau từ khoá trả về nguyên văn ở `remainder`, không đọc.
 * 3. **Vùng không bung thành đốt.** "các đốt sống cổ" là `region: cervical`,
 *    không phải C1–C7: tài liệu không nói đốt nào, nên chỉ mục không được nói thay.
 *
 * Gì không chắc thì vào `issues` và mọi mã của chuỗi đó hạ xuống `uncertain` —
 * người duyệt xem, máy không đoán.
 */

export type Side = "left" | "right";
export type Confidence = "exact" | "expanded" | "uncertain";
export type Region = "cervical" | "thoracic" | "lumbar" | "sacral";

export type ParsedCode = {
  code: VertebraCode;
  confidence: Confidence;
  side?: Side;
  note?: string;
};

export type ParsedList = {
  raw: string;
  codes: ParsedCode[];
  regions: Region[];
  issues: string[];
  /** Phần sau từ khoá dừng (tam giác cơ, lớp, tiết cơ…), giữ nguyên văn. */
  remainder?: string;
};

const SUBSCRIPTS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};

// `\b` của JS chỉ biết chữ ASCII: "tiết cơ\b" không bao giờ khớp vì "ơ" không
// phải \w. Ranh giới từ ở đây luôn viết bằng lookaround trên \p{L}.
const B = "(?<![\\p{L}\\d])";
const E = "(?![\\p{L}\\d])";

// Hết danh sách đốt: phần sau thuộc hệ khái niệm khác của phương pháp.
const STOP = new RegExp(`${B}(thuộc|tam giác|tiết cơ|lớp|cơ sâu|cơ vai|rối loạn)${E}`, "iu");

// Vùng gọi bằng chữ. "vùng cổ phải/trái/dưới/trên/gáy" là vùng NHIỆT ĐỘ, không
// phải nhóm đốt — chỉ nhận khi theo sau là ranh giới.
const REGION_WORDS: { pattern: RegExp; region: Region }[] = [
  { pattern: new RegExp(`${B}(?:các\\s+)?đốt(?:\\s+sống)?\\s+cổ${E}`, "iu"), region: "cervical" },
  { pattern: new RegExp(`${B}vùng\\s+cổ(?=\\s*(?:$|[,;.]|và${E}))`, "iu"), region: "cervical" },
  { pattern: new RegExp(`${B}vùng\\s+S${E}`, "u"), region: "sacral" },
];

const SIDE_WORDS: { pattern: RegExp; side: Side }[] = [
  { pattern: new RegExp(`${B}(?:bên\\s+)?phải${E}`, "iu"), side: "right" },
  { pattern: new RegExp(`${B}(?:bên\\s+)?trái${E}`, "iu"), side: "left" },
];

// Từ nối và từ đệm hay đứng giữa các mã: đọc như dấu phân cách, không báo lỗi.
const SEPARATOR_WORDS = new Set(["và", "hoặc", "hay"]);
const FILLER_WORDS = new Set(["song", "chỉnh", "đốt", "sống", "là", "các", "vùng", "hông", "thắt", "lưng", "TĐ", "chủ", "yếu", "ở", "cũng", "có", "thường"]);

type Token =
  | { kind: "code"; segment: Segment; n: number; letter: string }
  | { kind: "num"; n: number }
  | { kind: "letter"; letter: string }
  | { kind: "range" }
  | { kind: "sep" };

function normalize(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[₀-₉]/g, (c) => SUBSCRIPTS[c] ?? c)
    // "->", "–", "—", "-" giữa hai vế đều là khoảng.
    .replace(/->|→|[–—−]/g, "-")
    // "//" là ký hiệu song chỉnh — hai tay tác động cùng lúc vào hai điểm (chủ sản
    // phẩm giải thích 2026-10-05). Với chỉ mục, hai điểm là hai mã: đọc như dấu phân cách.
    .replace(/\/\//g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string, issues: string[]): Token[] {
  const tokens: Token[] = [];
  const unknown: string[] = [];
  // Không có cờ `i`: mã đốt trong tài liệu luôn viết hoa, còn "c" trong "các" thì không.
  const re = /([CTLSD]) ?(\d{1,2})|(\d{1,2})|(-)|([,;.])|(\p{L}+)/gu;
  for (const m of text.matchAll(re)) {
    if (m[1] && m[2]) {
      tokens.push({ kind: "code", segment: (m[1] === "D" ? "T" : m[1]) as Segment, n: Number(m[2]), letter: m[1] });
    } else if (m[3]) tokens.push({ kind: "num", n: Number(m[3]) });
    else if (m[4]) tokens.push({ kind: "range" });
    else if (m[5]) tokens.push({ kind: "sep" });
    else if (m[6]) {
      const word = m[6];
      if (/^[CTLSDF]$/.test(word)) tokens.push({ kind: "letter", letter: word });
      else if (SEPARATOR_WORDS.has(word.toLowerCase())) tokens.push({ kind: "sep" });
      else if (!FILLER_WORDS.has(word) && !FILLER_WORDS.has(word.toLowerCase())) unknown.push(word);
    }
  }
  // Một cờ cho cả chuỗi, không một cờ cho mỗi chữ: một câu văn xuôi lọt vào ô
  // danh sách đốt là MỘT việc người duyệt phải xem.
  if (unknown.length) issues.push(`chữ lạ trong danh sách đốt: "${unknown.slice(0, 6).join(" ")}${unknown.length > 6 ? " …" : ""}"`);
  return tokens;
}

function valid(segment: Segment, n: number) {
  return n >= 1 && n <= SEGMENTS[segment].count;
}

export function parseVertebraList(input: string): ParsedList {
  const issues: string[] = [];
  const regions: Region[] = [];
  let text = normalize(input);

  let remainder: string | undefined;
  const stop = STOP.exec(text);
  if (stop) {
    remainder = text.slice(stop.index).trim();
    text = text.slice(0, stop.index).trim();
  }

  for (const { pattern, region } of REGION_WORDS) {
    if (pattern.test(text)) {
      regions.push(region);
      text = text.replace(pattern, " ");
    }
  }

  // Bên trái/phải bằng chữ: áp cho cả danh sách — nhưng khi danh sách có nhiều
  // hơn một mã thì không biết nó áp cho mã nào, nên hạ độ tin cậy.
  let wordSide: Side | undefined;
  for (const { pattern, side } of SIDE_WORDS) {
    if (pattern.test(text)) {
      wordSide = side;
      text = text.replace(pattern, " ");
    }
  }

  const tokens = tokenize(text, issues);
  const out: ParsedCode[] = [];
  let current: Segment | null = null;
  let last: { segment: Segment; n: number } | null = null;
  let pendingRange = false;

  const push = (segment: Segment, n: number, confidence: Confidence, note?: string) => {
    if (!valid(segment, n)) {
      issues.push(`${segment}${n} không tồn tại`);
      return;
    }
    const code = `${segment}${n}`;
    if (!isVertebraCode(code)) return;
    if (!out.some((c) => c.code === code)) out.push({ code, confidence, ...(note ? { note } : {}) });
    last = { segment, n };
  };

  // Khoảng đi theo thứ tự giải phẫu, nên "C7 – T1" (trang 20) vắt qua hai nhóm
  // vẫn đọc được: C7, T1, không có gì ở giữa.
  const expandTo = (segment: Segment, n: number) => {
    const from = last as { segment: Segment; n: number } | null;
    const end = VERTEBRA_ORDER.indexOf(`${segment}${n}` as VertebraCode);
    const start = from ? VERTEBRA_ORDER.indexOf(`${from.segment}${from.n}` as VertebraCode) : -1;
    if (start < 0 || end <= start) {
      issues.push(`khoảng không đọc được tới ${segment}${n}`);
      push(segment, n, "uncertain");
      return;
    }
    const note = `bung từ khoảng ${from!.segment}${from!.n}–${segment}${n}`;
    for (const code of VERTEBRA_ORDER.slice(start + 1, end + 1)) {
      push(code[0] as Segment, Number(code.slice(1)), "expanded", note);
    }
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.kind === "code") {
      const note = token.letter === "D" ? `D${token.n} = T${token.n} (ký hiệu dorsal)` : undefined;
      if (pendingRange) expandTo(token.segment, token.n);
      else push(token.segment, token.n, note ? "expanded" : "exact", note);
      current = token.segment;
      pendingRange = false;
    } else if (token.kind === "num") {
      if (!current) {
        issues.push(`số ${token.n} không thuộc nhóm đốt nào`);
        continue;
      }
      if (pendingRange) expandTo(current, token.n);
      else push(current, token.n, "exact");
      pendingRange = false;
    } else if (token.kind === "range") {
      if (!last) issues.push("dấu khoảng không có vế đầu");
      else pendingRange = true;
    } else if (token.kind === "letter") {
      if (token.letter === "F") {
        // "T6 F" — F đứng riêng ngay sau một mã là bên phải của mã đó.
        const target = out[out.length - 1];
        if (target) target.side = "right";
        else issues.push('"F" không đứng sau mã đốt nào');
      } else if (token.letter === "T" && out.length > 0) {
        issues.push('"T" đứng riêng giữa danh sách đốt — trái, hay mã ngực thiếu số?');
      } else {
        issues.push(`chữ "${token.letter}" đứng riêng`);
      }
    }
  }
  if (pendingRange) issues.push("khoảng không có vế cuối");

  if (wordSide) {
    for (const code of out) code.side ??= wordSide;
    if (out.length > 1) issues.push(`"bên ${wordSide === "right" ? "phải" : "trái"}" áp cho cả ${out.length} mã hay chỉ mã cuối?`);
  }

  if (issues.length > 0) for (const code of out) code.confidence = "uncertain";

  return { raw: input, codes: out, regions, issues, ...(remainder ? { remainder } : {}) };
}

export type Zone = { zone: string; side?: Side };

/**
 * Vùng nhiệt độ: "Đầu, mặt, cổ, ngực T,sườn F" → đầu · mặt · cổ · ngực (trái) ·
 * sườn (phải). Tên vùng giữ nguyên chữ của tài liệu — "mỏ ác", "bụng con" là từ
 * của phương pháp, không dịch sang thuật ngữ giải phẫu.
 */
export function parseZones(input: string): Zone[] {
  return normalize(input)
    .replace(/[.]$/, "")
    .split(new RegExp(`\\s*(?:[,;]|${B}và${E}|-(?=\\s))\\s*`, "u"))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): Zone => {
      const letter = /^(.*\S)\s+([TF])$/u.exec(part);
      if (letter) return { zone: letter[1], side: letter[2] === "T" ? "left" : "right" };
      // "Đầu F giảm": F nằm giữa cụm.
      const inner = /^(.*\S)\s+F\s+(.+)$/u.exec(part);
      if (inner) return { zone: `${inner[1]} ${inner[2]}`, side: "right" };
      for (const { pattern, side } of SIDE_WORDS) {
        if (pattern.test(part)) return { zone: part.replace(pattern, "").replace(/\s+/g, " ").trim(), side };
      }
      return { zone: part };
    });
}
