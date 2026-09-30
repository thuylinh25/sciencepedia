import type { Atlas, Concept } from "./anatomy";
import { SUGGESTED } from "./anatomy";
import { viName } from "./names-vi";
import type { AnatomyData } from "./structures";

/**
 * Tìm kiếm và deep link trên danh mục khái niệm của atlas.
 *
 * So khớp bỏ dấu, không phân biệt hoa thường, trên cả tên tiếng Anh gốc, tên
 * tiếng Việt (nếu có) và mã FMA — gõ "tim", "Tim", "heart" hay "FMA7088" đều
 * ra cùng một mục. Người Việt hay gõ không dấu, nên "da day" phải ra "Dạ dày".
 */

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** "Urinary bladder" → "urinary-bladder". Dùng cho `?structure=`. */
export function structureSlug(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ORDINALS = [
  "first", "second", "third", "fourth", "fifth", "sixth",
  "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
];
const SPINE_LETTERS: Record<string, string[]> = {
  cervical: ["c"],
  // Việt Nam gọi đốt ngực là D (dorsal) lẫn T: "D12", "T12".
  thoracic: ["t", "d"],
  lumbar: ["l"],
};

/**
 * Ký hiệu lâm sàng của đốt sống ("L1", "C7", "T12"/"D12") — tên BodyParts3D chỉ có
 * "first lumbar vertebra", nên "đốt L1" không ra gì (chủ sản phẩm, 2026-09-30).
 * Đĩa gian đốt "of first lumbar vertebra" cũng mang ký hiệu: "đĩa L1" phải ra đĩa.
 */
export function spineAliases(name: string): string[] {
  if (/^atlas$/i.test(name)) return ["c1"];
  if (/^axis$/i.test(name)) return ["c2"];
  const m = /\b(\w+) (cervical|thoracic|lumbar) vertebra$/i.exec(name);
  const n = m ? ORDINALS.indexOf(m[1].toLowerCase()) + 1 : 0;
  return n ? SPINE_LETTERS[m![2].toLowerCase()].map((letter) => `${letter}${n}`) : [];
}

export type SearchIndex = {
  concepts: Concept[];
  /** Chuỗi đã bỏ dấu để so khớp, song song với `concepts`. */
  haystack: string[];
  byId: Map<string, Concept>;
  bySlug: Map<string, Concept>;
};

/**
 * `anatomy` (dữ liệu FMA, có thể chưa tải) thêm tên Latin, đồng nghĩa và mã
 * TA98 vào chuỗi so khớp — "cor" hay "A12.1.00.001" cũng ra tim. Chỉ mở rộng
 * cái được TÌM, không đổi slug: link `?structure=` phải giống nhau dù dữ liệu
 * FMA đã tải hay chưa.
 */
export function buildSearchIndex(atlas: Atlas, anatomy: AnatomyData | null = null): SearchIndex {
  const byId = new Map<string, Concept>();
  const bySlug = new Map<string, Concept>();
  const haystack: string[] = [];

  for (const concept of atlas.concepts) {
    byId.set(concept.id.toLowerCase(), concept);
    const vi = viName(concept.id, concept.name);
    const fma = anatomy?.structures[concept.id];
    const extra = fma
      ? [fma.names.la, ...fma.synonyms.en, ...fma.synonyms.la, fma.identifiers.ta98]
          .filter(Boolean)
          .join(" ")
      : "";
    haystack.push(fold(`${concept.name} ${vi ?? ""} ${concept.id} ${extra} ${spineAliases(concept.name).join(" ")}`));
  }

  /*
   * Slug tiếng Anh thắng slug tiếng Việt khi trùng nhau: đó là dạng ổn định
   * của link (`?structure=heart`), còn slug tiếng Việt (`?structure=tim`) là
   * lối tắt thêm vào. Đăng ký tiếng Anh trước, tiếng Việt chỉ lấp chỗ trống.
   */
  for (const concept of atlas.concepts) {
    const slug = structureSlug(concept.name);
    // Tên trùng nhau thì giữ khái niệm có nhiều mảnh hơn — thường là khái niệm cha.
    const existing = bySlug.get(slug);
    if (!existing || existing.elements.length < concept.elements.length) {
      bySlug.set(slug, concept);
    }
  }
  for (const concept of atlas.concepts) {
    const vi = viName(concept.id, concept.name);
    if (!vi) continue;
    const slug = structureSlug(vi);
    if (!bySlug.has(slug)) bySlug.set(slug, concept);
  }

  return { concepts: atlas.concepts, haystack, byId, bySlug };
}

export function searchConcepts(index: SearchIndex, query: string, limit = 80) {
  const term = fold(query);
  if (!term) {
    return SUGGESTED.map((name) => index.bySlug.get(structureSlug(name))).filter(
      (c): c is Concept => !!c,
    );
  }
  /*
   * Khớp THEO TỪ, không theo cả chuỗi: "đốt L1" là "đốt" + "L1", không nằm liền
   * trong "đốt sống thắt lưng 1 … l1". Từ có số ("l1", "c7", "1") phải khớp
   * nguyên từ — không thì "l1" ăn vào "l12", "1" ăn vào mọi mã FMA.
   */
  const matchers = term.split(/\s+/).map((word) =>
    /^[a-z]{0,2}\d+$/.test(word)
      ? (text: string) => new RegExp(`(^|[^a-z0-9])${word}($|[^a-z0-9])`).test(text)
      : (text: string) => text.includes(word),
  );
  const phrase: Concept[] = [];
  const words: Concept[] = [];
  index.haystack.forEach((text, i) => {
    if (!matchers.every((m) => m(text))) return;
    (text.includes(term) ? phrase : words).push(index.concepts[i]);
  });
  // Có kết quả khớp liền cả cụm thì chỉ lấy chúng: "dạ dày" không kéo theo "dây
  // chằng", "đáy chậu" (cũng có "da", "day"). Khớp từng từ chỉ để cứu câu như
  // "đốt L1". Tên ngắn trước như bản gốc: "heart" đứng trên "heart valve".
  const byLength = (a: Concept, b: Concept) => a.name.length - b.name.length;
  return (phrase.length ? phrase : words).sort(byLength).slice(0, limit);
}

/** `?structure=` nhận mã FMA, slug tiếng Anh hoặc slug tiếng Việt. */
export function resolveStructure(
  index: SearchIndex,
  value: string | null,
): Concept | null {
  if (!value) return null;
  const raw = value.trim();
  return (
    index.byId.get(raw.toLowerCase()) ??
    index.bySlug.get(structureSlug(raw)) ??
    null
  );
}
