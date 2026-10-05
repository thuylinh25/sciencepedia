/**
 * Ký hiệu đốt sống (C1–C7, T1–T12, L1–L5, S1–S5) → khái niệm trên Bản đồ cơ thể
 * người. Một chỗ duy nhất: bài viết, chỉ mục tri thức và trang `/human-atlas`
 * đều tra ở đây, không ai tự viết mã FMA.
 *
 * Mã FMA và slug đã đối chiếu 2026-10-05 trên `.cache/anatomy/audit.json` (2.234
 * mảnh BodyParts3D) và `data/anatomy/fma-structures.json` — test cạnh file này
 * khoá lại phần đối chiếu được trong repo.
 *
 * ## Vì sao S1–S5 chỉ trỏ về MỘT khái niệm
 *
 * BodyParts3D dựng xương cùng thành một khối (FMA16202 "Sacrum"), không tách năm
 * đốt — ở người trưởng thành chúng đã dính liền. Ký hiệu S1–S5 vẫn hợp lệ trong
 * bài; trên atlas nó tô sáng cả xương cùng và mang `granularity: "group"` để
 * giao diện nói rõ điều đó, thay vì giả vờ tô được đúng một đốt.
 *
 * Xương cụt không có trong mô hình nên không có ở đây: ký hiệu nào không có
 * khái niệm thì không được trỏ đi đâu cả.
 */

export const SEGMENTS = {
  C: { count: 7, vi: "cổ", en: "cervical" },
  T: { count: 12, vi: "ngực", en: "thoracic" },
  L: { count: 5, vi: "thắt lưng", en: "lumbar" },
  S: { count: 5, vi: "cùng", en: "sacral" },
} as const;

export type Segment = keyof typeof SEGMENTS;
export type VertebraCode = `${Segment}${number}`;

export type Vertebra = {
  code: VertebraCode;
  segment: Segment;
  /** Mã FMA của khái niệm atlas tô sáng. */
  fma: string;
  /** Giá trị cho `?structure=` — slug tên tiếng Anh BodyParts3D. */
  atlasSlug: string;
  vi: string;
  en: string;
  /** "group": khái niệm atlas là cả một khối chứa đốt này (xương cùng). */
  granularity: "single" | "group";
};

const ORDINALS = [
  "first", "second", "third", "fourth", "fifth", "sixth",
  "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
];

// Thứ tự trong mảng = số thứ tự đốt. Mã FMA ngực không liên tiếp — chép từ dữ
// liệu, đừng suy ra bằng phép cộng.
const FMA: Record<Exclude<Segment, "S">, string[]> = {
  C: ["FMA12519", "FMA12520", "FMA12521", "FMA12522", "FMA12523", "FMA12524", "FMA12525"],
  T: [
    "FMA9165", "FMA9187", "FMA9209", "FMA9248", "FMA9922", "FMA9945",
    "FMA9968", "FMA9991", "FMA10014", "FMA10037", "FMA10059", "FMA10081",
  ],
  L: ["FMA13072", "FMA13073", "FMA13074", "FMA13075", "FMA13076"],
};

const SACRUM_FMA = "FMA16202";

function build(): Map<VertebraCode, Vertebra> {
  const out = new Map<VertebraCode, Vertebra>();
  for (const segment of ["C", "T", "L"] as const) {
    FMA[segment].forEach((fma, index) => {
      const n = index + 1;
      const code = `${segment}${n}` as VertebraCode;
      const name =
        segment === "C" && n === 1 ? "atlas" :
        segment === "C" && n === 2 ? "axis" :
        `${ORDINALS[index]} ${SEGMENTS[segment].en} vertebra`;
      const vi =
        segment === "C" && n === 1 ? "Đốt đội (C1)" :
        segment === "C" && n === 2 ? "Đốt trục (C2)" :
        `Đốt sống ${SEGMENTS[segment].vi} ${n}`;
      out.set(code, {
        code,
        segment,
        fma,
        atlasSlug: name.replace(/ /g, "-"),
        vi,
        en: segment === "C" && n <= 2 ? `${n === 1 ? "Atlas" : "Axis"} (C${n})` : `${capitalize(name)}`,
        granularity: "single",
      });
    });
  }
  for (let n = 1; n <= SEGMENTS.S.count; n += 1) {
    const code = `S${n}` as VertebraCode;
    out.set(code, {
      code,
      segment: "S",
      fma: SACRUM_FMA,
      atlasSlug: "sacrum",
      vi: `Đốt cùng ${n}`,
      en: `Sacral vertebra ${n}`,
      granularity: "group",
    });
  }
  return out;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const VERTEBRAE: ReadonlyMap<VertebraCode, Vertebra> = build();

/** Thứ tự giải phẫu từ trên xuống: C1 … C7, T1 … T12, L1 … L5, S1 … S5. */
export const VERTEBRA_ORDER: readonly VertebraCode[] = [...VERTEBRAE.keys()];

export function isVertebraCode(value: string): value is VertebraCode {
  return VERTEBRAE.has(value as VertebraCode);
}

export function compareVertebrae(a: VertebraCode, b: VertebraCode): number {
  return VERTEBRA_ORDER.indexOf(a) - VERTEBRA_ORDER.indexOf(b);
}

/**
 * Link tới atlas cho một tập đốt. Gộp trùng khái niệm (S1, S2 → một "sacrum"),
 * giữ thứ tự giải phẫu. Không mang tiền tố locale: `localizeHref` thêm lúc render.
 */
export function atlasHref(codes: readonly VertebraCode[]): string {
  const slugs = [...new Set(
    [...codes].sort(compareVertebrae).map((code) => VERTEBRAE.get(code)!.atlasSlug),
  )];
  return `/human-atlas?structure=${slugs.join(",")}#atlas-viewer`;
}

/** Như `atlasHref` nhưng đánh dấu `#atlas-embed`: trang bài dựng khung atlas tại chỗ. */
export function atlasEmbedHref(codes: readonly VertebraCode[]): string {
  return atlasHref(codes).replace(/#atlas-viewer$/, "#atlas-embed");
}

/** Mã FMA → các ký hiệu trỏ vào nó (FMA16202 → S1…S5). */
export function codesForFma(fma: string): VertebraCode[] {
  return VERTEBRA_ORDER.filter((code) => VERTEBRAE.get(code)!.fma === fma);
}
