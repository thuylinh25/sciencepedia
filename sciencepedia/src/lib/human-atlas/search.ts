import type { Atlas, Concept } from "./anatomy";
import { SUGGESTED } from "./anatomy";
import { viName } from "./names-vi";

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

export type SearchIndex = {
  concepts: Concept[];
  /** Chuỗi đã bỏ dấu để so khớp, song song với `concepts`. */
  haystack: string[];
  byId: Map<string, Concept>;
  bySlug: Map<string, Concept>;
};

export function buildSearchIndex(atlas: Atlas): SearchIndex {
  const byId = new Map<string, Concept>();
  const bySlug = new Map<string, Concept>();
  const haystack: string[] = [];

  for (const concept of atlas.concepts) {
    byId.set(concept.id.toLowerCase(), concept);
    const vi = viName(concept.id, concept.name);
    haystack.push(fold(`${concept.name} ${vi ?? ""} ${concept.id}`));
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
  const out: Concept[] = [];
  index.haystack.forEach((text, i) => {
    if (text.includes(term)) out.push(index.concepts[i]);
  });
  // Tên ngắn trước — giữ cách xếp của bản gốc: "heart" đứng trên "heart valve".
  return out.sort((a, b) => a.name.length - b.name.length).slice(0, limit);
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
