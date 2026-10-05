import type { Page, SectionExtract } from "./extract";
import { Topic, type Editorial, type Mapping, type Quote } from "./schema";
import { isVertebraCode } from "./vertebrae";

/**
 * Bộ trích + quyết định của người (D-n) + tệp biên tập → topic.
 *
 * Mọi mapping trong topic truy được về một dòng của bản chép trang. Máy không
 * thêm vai: mã không có từ khoá vai và không có quyết định `assign` thì nằm ở
 * `unassigned`, không vào chỉ mục — "trống hơn sai".
 */

export type Decision = {
  id: string;
  section: string;
  /** Không có `apply` = quyết định biên tập, không đổi mapping (vd. D-7: giữ một thể). */
  apply?:
    | { confirm: string }
    | { assign: string; role: Mapping["role"]; codes: string[]; side?: "left" | "right" };
};

export type SectionMeta = { id: string; part: string; heading: string; pdfPages: [number, number] };

const ROLE_KINDS = new Set(["primary", "related", "caution", "avoid"]);

export function assembleTopic(
  extract: SectionExtract,
  meta: SectionMeta,
  decisions: Decision[],
  editorial: Editorial,
): Topic {
  const errors: string[] = [];
  const mine = decisions.filter((d): d is Decision & { apply: NonNullable<Decision["apply"]> } => d.section === meta.id && !!d.apply);
  const labels = new Map(editorial.variants.map((v) => [v.id, v.label]));
  const known = new Set(extract.variants.map((v) => v.id));
  for (const id of labels.keys()) if (!known.has(id)) errors.push(`biên tập nêu thể "${id}" không có trong bộ trích`);

  const variants = extract.variants.map((v) => {
    const mappings: Mapping[] = [];
    const seen = new Set<string>();
    const add = (m: Mapping) => {
      const key = `${m.targetType}:${m.targetId}:${m.role}`;
      if (seen.has(key)) return;
      seen.add(key);
      mappings.push(m);
    };

    for (const f of v.fields) {
      if (!ROLE_KINDS.has(f.kind) || !f.vertebrae) continue;
      const confirm = mine.find((d) => "confirm" in d.apply && f.raw.includes(d.apply.confirm));
      const ref = { pdfPage: f.ref.pdfPage, bookPage: f.ref.bookPage };
      for (const c of f.vertebrae.codes) {
        add({
          targetType: "vertebra",
          targetId: c.code,
          role: f.kind as Mapping["role"],
          ...(c.side ? { side: c.side } : {}),
          raw: f.raw,
          ...(f.line ? { context: f.line } : {}),
          confidence: confirm && c.confidence === "uncertain" ? "exact" : c.confidence,
          ...(c.note ? { note: c.note } : {}),
          ...(confirm ? { decision: confirm.id } : {}),
          ref,
        });
      }
      for (const region of f.vertebrae.regions) {
        add({
          targetType: "region",
          targetId: region,
          role: f.kind as Mapping["role"],
          raw: f.raw,
          ...(f.line ? { context: f.line } : {}),
          confidence: "region-only",
          ref,
        });
      }
    }

    for (const m of extract.mentions.filter((x) => x.variant === v.id)) {
      const d = mine.find((x) => "assign" in x.apply && m.line.includes(x.apply.assign));
      if (!d || !("assign" in d.apply)) continue;
      for (const code of d.apply.codes) {
        if (!isVertebraCode(code)) {
          errors.push(`${d.id}: "${code}" không phải mã đốt sống`);
          continue;
        }
        add({
          targetType: "vertebra",
          targetId: code,
          role: d.apply.role,
          ...(d.apply.side ? { side: d.apply.side } : {}),
          raw: d.apply.assign,
          context: m.line,
          confidence: "exact",
          decision: d.id,
          ref: m.ref,
        });
      }
    }

    if (mappings.length > 0 && !labels.has(v.id)) {
      errors.push(`thể "${v.id}" có ${mappings.length} mapping nhưng tệp biên tập chưa đặt nhãn — không được bỏ rơi lặng lẽ`);
    }
    return {
      id: v.id,
      label: labels.get(v.id) ?? { vi: v.heading, en: v.heading },
      heading: v.heading,
      ref: v.ref,
      mappings,
    };
  });

  const assigned = new Set(
    mine.flatMap((d) => ("assign" in d.apply ? [d.apply.assign] : [])),
  );
  const unassigned = extract.mentions
    .filter((m) => ![...assigned].some((a) => m.line.includes(a)))
    .map((m) => ({ line: m.line, codes: m.vertebrae.codes.map((c) => c.code), ref: m.ref }));

  const uncertain = variants.flatMap((v) => v.mappings.filter((m) => m.confidence === "uncertain").map((m) => `${v.id}:${m.targetId}`));
  if (uncertain.length && editorial.review.mapping === "passed") {
    errors.push(`review.mapping = passed nhưng còn mã uncertain: ${uncertain.join(", ")}`);
  }

  if (errors.length) throw new Error(`[${meta.id}] ${errors.join("\n  ")}`);

  return Topic.parse({
    slug: editorial.slug,
    collection: "tac-dong-cot-song",
    section: meta.id,
    title: editorial.title,
    riskLevel: editorial.riskLevel,
    source: { docId: "pp-tdcs-vn", part: meta.part, heading: meta.heading, pdfPages: meta.pdfPages },
    variants,
    unassigned,
    review: editorial.review,
  });
}

const flat = (text: string) =>
  text
    .normalize("NFC")
    .replace(/\\\*/g, "*")
    .replace(/\*+/g, "")
    .replace(/^[-+]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Đoạn trích phải là nguyên văn của trang nó ghi. "…" cho phép lược giữa đoạn —
 * các mảnh hai bên vẫn phải có mặt, đúng thứ tự. Trả về lỗi, rỗng = đạt.
 */
export function verifyQuotes(quotes: Quote[], pages: Page[]): string[] {
  const errors: string[] = [];
  for (const q of quotes) {
    const page = pages.find((p) => p.pdfPage === q.pdfPage);
    if (!page) {
      errors.push(`tr.${q.pdfPage}: không có bản chép`);
      continue;
    }
    const text = flat(page.lines.join("\n"));
    let from = 0;
    for (const part of q.vi.split("…").map(flat).filter(Boolean)) {
      const at = text.indexOf(part, from);
      if (at < 0) {
        errors.push(`tr.${q.pdfPage}: không khớp nguyên văn — "${part.slice(0, 80)}"`);
        break;
      }
      from = at + part.length;
    }
  }
  return errors;
}
