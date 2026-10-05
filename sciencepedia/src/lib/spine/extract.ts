import { stripDiacritics } from "@/lib/utils";

import { parseVertebraList, parseZones, type ParsedList, type Zone } from "./notation";

/**
 * Bản chép từng trang → các trường có nhãn của từng thể bệnh, kèm trang nguồn.
 *
 * Đây là bước MÁY của pipeline: nó không quyết định gì về y khoa, chỉ tách và
 * gắn nhãn. Kết quả (`extract.generated.json`) là đầu vào cho người duyệt; topic
 * JSON chỉ được dựng sau khi người duyệt đối chiếu với ảnh trang.
 *
 * Hai loại dòng:
 *  - **Trường có nhãn** ("Đốt sống trọng điểm: …", "Nhiệt độ biến đổi vùng….: …")
 *    — phần lớn tài liệu viết thế này, và vai trò đọc thẳng từ nhãn.
 *  - **Văn xuôi** ("Nếu bệnh nhân đau không ngồi thẳng lưng được có trọng điểm
 *    L4,5 và S1") — chỉ nhận mã đứng sau một từ khoá vai trò rõ ràng. Mã nào xuất
 *    hiện mà không có từ khoá ("lao đốt sống thường hay bị ở đốt sống T7, T8")
 *    vào `mentions` với vai trò TRỐNG: đó là nơi bệnh nằm, không phải nơi tác
 *    động, và máy không được phép đoán khác.
 */

export type PageMeta = { pdfPage: number; bookPage: number };
export type Page = PageMeta & { lines: string[] };

export type FieldKind = "primary" | "related" | "caution" | "avoid" | "zones" | "triangles" | "functions" | "treatment" | "other";

export type Field = {
  kind: FieldKind;
  label: string;
  raw: string;
  ref: PageMeta;
  from: "label" | "prose";
  /** Câu nguồn chứa trường văn xuôi — để bài và người duyệt thấy bối cảnh của mã. */
  line?: string;
  vertebrae?: ParsedList;
  zones?: Zone[];
  triangles?: number[];
  muscleSegments?: string[];
  functions?: string[];
};

export type ExtractedVariant = {
  id: string;
  heading: string;
  group?: string;
  ref: PageMeta;
  fields: Field[];
};

export type Mention = { line: string; ref: PageMeta; vertebrae: ParsedList; variant?: string };

export type SectionExtract = {
  id: string;
  pdfPages: [number, number];
  variants: ExtractedVariant[];
  mentions: Mention[];
};

export function parsePage(markdown: string): Page {
  const text = markdown.replace(/\r\n/g, "\n");
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const meta = front?.[1] ?? "";
  const num = (key: string) => Number(new RegExp(`^${key}:\\s*(\\d+)`, "m").exec(meta)?.[1] ?? NaN);
  const body = front ? text.slice(front[0].length) : text;
  return {
    pdfPage: num("pdfPage"),
    bookPage: num("bookPage"),
    lines: body.split("\n").map((l) => l.trim()).filter(Boolean),
  };
}

const plain = (line: string) =>
  line.replace(/\\\*/g, "*").replace(/\*+/g, "").replace(/^[-+]\s*/, "").replace(/\s+/g, " ").trim();

const ROMAN = /^([IVX]+)\s*[.\-/]\s*\S/;
const NUMBERED = /^(\d{1,2})\s*[/.\-]?\s*(?=\p{L})/u;

type Heading = { level: "group" | "variant"; text: string; body?: string };

// "1. Triệu chứng ỉa chảy kèm theo sốt…: nhiệt độ rối loạn…" (trang 43) và
// "Người hết sức mệt mỏi: nhiệt độ rối loạn…" — tiêu đề và nội dung chung một
// dòng, không in đậm. Dấu hiệu: phần sau dấu hai chấm mở bằng "nhiệt độ".
const INLINE_ITEM = /^((?:\d{1,2}\.\s+)?[^:]{3,90}):\s+(nhiệt độ\s.+)$/iu;

function heading(raw: string): Heading | null {
  const bold = raw.startsWith("**");
  // "**1. Đau lưng do thoái hoá, vôi hoá:** Đau lưng do thoái hoá thường…" (trang
  // 4): chỉ phần đậm là tiêu đề, phần sau là nội dung của chính thể ấy.
  const split = bold ? /^\*\*(.+?)\*\*\s*(.+)$/u.exec(raw) : null;
  if (split) {
    const h = heading(`**${split[1]}**`);
    if (h) return { ...h, body: plain(split[2]) };
  }
  const text = plain(raw);
  if (ROMAN.test(text) && (bold || text === text.toUpperCase())) return { level: "group", text };
  // In đậm + đánh số là tiêu đề, kể cả khi có phần chú thích sau dấu hai chấm
  // ("7- Sốt cao hoảng hốt: ( Sốt hay sợ…)"). "5/ Đờm nhiều" (trang 34) không in
  // đậm nhưng dấu "/" đủ để nhận.
  if (NUMBERED.test(text) && (bold || /^\d{1,2}\s*\/(?!.*: )/.test(text))) {
    return { level: "variant", text: text.replace(/:$/, "") };
  }
  const inline = !bold && INLINE_ITEM.exec(text);
  if (inline) return { level: "variant", text: inline[1].trim(), body: inline[2] };
  return null;
}

const fold = (text: string) => stripDiacritics(text).toLowerCase();

// Nhãn → vai trò. So khớp trên chuỗi đã bỏ dấu, nên "Đối sống" (lỗi in
// trang 13) vẫn rơi vào "doi song" và KHÔNG khớp — người duyệt sẽ thấy nó ở
// mentions thay vì máy âm thầm sửa.
const LABELS: { pattern: RegExp; kind: FieldKind }[] = [
  { pattern: /^(cac )?dot song (trong diem( chu yeu)?|td|chu yeu|vung trong diem|co trong diem( la)?)$/, kind: "primary" },
  { pattern: /^trong diem( chinh)?$/, kind: "primary" },
  { pattern: /^dot song lien quan$/, kind: "related" },
  { pattern: /^(nhiet do( bien doi)?( vung)?|nhiet do lien quan)$/, kind: "zones" },
  { pattern: /^(vung )?(tam giac co|co) bien doi$|^vung tam giac co bien doi$/, kind: "triangles" },
  { pattern: /^lien quan (den )?chuc nang$/, kind: "functions" },
  { pattern: /^(giai toa trong diem|trung tam dieu nhiet.*)$/, kind: "treatment" },
];

const LABEL_LINE = /^(?<label>[^:.…]{3,60}?)\s*(?:[.…]{2,}\s*:?|:)\s*(?<value>.*)$/u;

function classify(label: string): FieldKind | null {
  const key = fold(label).replace(/\s+/g, " ").trim();
  for (const { pattern, kind } of LABELS) if (pattern.test(key)) return kind;
  return null;
}

function parseTriangles(value: string): Pick<Field, "triangles" | "muscleSegments"> {
  const segment = /tiết cơ ngang\s*(.+)$/iu.exec(value);
  if (segment) return { muscleSegments: [segment[1].trim()] };
  // "1-3-4-5", "tam giác 1,2,3,4", "3 và 4": gạch nối là phân cách danh sách,
  // không phải khoảng — xem manifest.json, anomalies.
  return { triangles: [...value.matchAll(/\d+/g)].map((m) => Number(m[0])).filter((n) => n >= 1 && n <= 8) };
}

function labelled(kind: FieldKind, label: string, value: string, ref: PageMeta): Field {
  const field: Field = { kind, label, raw: value, ref, from: "label" };
  if (kind === "treatment") {
    // Dòng điều trị trộn vùng điều nhiệt với mã ("Vùng đầu, T7-T11", "Trung tâm
    // điều nhiệt vùng đầu. Giải tỏa trọng điểm T7"): chỉ đọc từ mã đầu tiên. Không
    // có mã thì là lời dặn ("Tuỳ theo hình thái…"), bỏ qua.
    const start = value.search(HAS_CODE);
    if (start >= 0) field.vertebrae = parseVertebraList(value.slice(start));
  } else if (kind === "primary" || kind === "related") {
    field.vertebrae = parseVertebraList(value.replace(/^là\s+/u, ""));
  } else if (kind === "zones") {
    field.zones = parseZones(value);
  } else if (kind === "triangles") {
    Object.assign(field, parseTriangles(value));
  } else if (kind === "functions") {
    field.functions = value.replace(/[.]$/, "").split(/\s*[,;]\s*/u).filter(Boolean);
  }
  return field;
}

// Từ khoá vai trò trong văn xuôi. Hẹp có chủ ý: "chữa ở L4.5" KHÔNG ở đây vì
// tài liệu dùng nó cả nghĩa khẳng định lẫn phủ định ("Không chữa ngay ở L4, L5").
const PROSE_TRIGGERS: { pattern: RegExp; kind: FieldKind }[] = [
  { pattern: /không được (?:chữa|tác động)(?: ở)?|tránh(?: tác động)?/iu, kind: "avoid" },
  { pattern: /thận trọng(?: khi (?:chữa|tác động)(?: ở)?)?/iu, kind: "caution" },
  { pattern: /trọng điểm(?: chính| thường| chủ yếu)?(?: là| ở| có)?|(?<![\p{L}])TĐ(?: là)?|tập trung(?: vào| giải quyết)?|cần tác động|trọng khu gồm có các đốt sống|thường có điểm/iu, kind: "primary" },
  // "Giải tỏa các đốt sống cổ, T12 và L1" — bước điều trị, đối chiếu với trọng điểm.
  { pattern: /giải tỏa(?: trọng điểm)?(?: các)?/iu, kind: "treatment" },
];

const HAS_CODE = /[CTLSD] ?\d|đốt\s+sống\s+cổ|vùng\s+S(?![\p{L}])/u;

// Chuỗi mã ngay sau từ khoá. Chữ cái đứng riêng ("T2 T,3T7") được nuốt vào để
// parser thấy và gắn cờ — cắt chuỗi ở đó thì mất luôn T3, T7, T8 phía sau.
const CODE_RUN = /^[\s:]*((?:(?:các\s+)?đốt\s+sống\s+cổ|đốt\s+sống|vùng\s+S(?![\p{L}])|vùng|cũng|có|là|ở|thường|[CTLSD] ?\d{1,2}|\d{1,2}|->|[\s,.;\-–—/]|và|hoặc|hay|bên\s+phải|bên\s+trái|phải|[CTLSDF](?![\p{L}\d]))+)/u;

function proseFields(line: string, ref: PageMeta): { fields: Field[]; rest: string } {
  const fields: Field[] = [];
  let rest = line;
  for (const { pattern, kind } of PROSE_TRIGGERS) {
    const global = new RegExp(pattern.source, "giu");
    rest = rest.replace(global, (match, offset: number, whole: string) => {
      let after = whole.slice(offset + match.length);
      let label = match.trim();
      // Cấm và thận trọng là dữ liệu an toàn: thà bắt thừa rồi gắn cờ còn hơn bỏ
      // sót. "không được chữa vùng chẩm và từ C1; 2; 3" (trang 19) — bỏ qua chữ
      // tới mã đầu tiên trong cùng câu, và giữ phần bỏ qua trong nhãn để người
      // duyệt thấy "vùng chẩm" cũng bị cấm.
      if (kind === "avoid" || kind === "caution") {
        const sentence = after.split(/\.(?=\s+\p{Lu})/u)[0];
        const start = sentence.search(HAS_CODE);
        if (start > 0 && start <= 40 && !/\d/.test(sentence.slice(0, start))) {
          label = `${label} ${sentence.slice(0, start).trim()}`;
          after = sentence.slice(start);
        }
      }
      const run = CODE_RUN.exec(after);
      if (!run || !HAS_CODE.test(run[1])) return match;
      const raw = run[1].replace(/[\s,.;]+$/u, "").trim();
      fields.push({ kind, label, raw, ref, from: "prose", line, vertebrae: parseVertebraList(raw) });
      return match;
    });
  }
  // Mã đã được nhận thì gạch khỏi dòng, phần còn lại mới đếm là mention.
  for (const f of fields) rest = rest.replace(f.raw, " ");
  return { fields, rest };
}

function slugify(text: string, taken: Set<string>): string {
  const base = fold(text)
    .replace(/^([ivx]+|\d+)\s*[.\-/]?\s*/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 7)
    .join("-") || "muc";
  let id = base;
  for (let k = 2; taken.has(id); k += 1) id = `${base}-${k}`;
  taken.add(id);
  return id;
}

export function extractSection(id: string, pdfPages: [number, number], pages: Page[]): SectionExtract {
  const variants: ExtractedVariant[] = [];
  const mentions: Mention[] = [];
  const taken = new Set<string>();
  let group: string | undefined;
  let current: ExtractedVariant | null = null;

  const ensureVariant = (ref: PageMeta) => {
    // Nhóm La Mã không có mục con đánh số ("VI. Đau đầu vùng chẩm…", trang 24) thì
    // chính nhóm là thể bệnh.
    current ??= { id: slugify(group ?? "chung", taken), heading: group ?? "(phần mở đầu của mục)", group, ref, fields: [] };
    if (!variants.includes(current)) variants.push(current);
    return current;
  };

  for (const page of pages.filter((p) => p.pdfPage >= pdfPages[0] && p.pdfPage <= pdfPages[1])) {
    const ref = { pdfPage: page.pdfPage, bookPage: page.bookPage };
    for (const raw of page.lines) {
      const h = heading(raw);
      if (h?.level === "group") {
        group = h.text;
        current = null;
        if (!h.body) continue;
      }
      if (h?.level === "variant") {
        current = { id: slugify(h.text, taken), heading: h.text, group, ref, fields: [] };
        variants.push(current);
        if (!h.body) continue;
      }

      const text = h?.body ?? plain(raw);
      const m = LABEL_LINE.exec(text);
      const kind = m?.groups ? classify(m.groups.label) : null;
      if (m?.groups && kind) {
        ensureVariant(ref).fields.push(labelled(kind, m.groups.label.trim(), m.groups.value.trim(), ref));
        continue;
      }

      const { fields, rest } = proseFields(text, ref);
      if (fields.length) ensureVariant(ref).fields.push(...fields);
      const leftover = parseVertebraList(rest.match(/[CTLSD] ?\d{1,2}(?:[\s,.;\-–>]*\d{1,2})*/gu)?.join(", ") ?? "");
      if (leftover.codes.length) mentions.push({ line: text, ref, vertebrae: leftover, variant: current?.id });
    }
  }
  return { id, pdfPages, variants, mentions };
}

/** Mọi thứ người duyệt PHẢI nhìn: mã không chắc, vai trò chồng nhau, mention. */
export function reviewFlags(section: SectionExtract): string[] {
  const flags: string[] = [];
  for (const v of section.variants) {
    const byRole = new Map<string, Set<string>>();
    const treated = new Set<string>();
    for (const f of v.fields) {
      const list = f.vertebrae;
      if (!list) continue;
      for (const issue of list.issues) flags.push(`[${v.id}] tr.${f.ref.pdfPage} ${f.label}: "${f.raw}" — ${issue}`);
      // Phần dư chỉ đáng xem khi có số: "thuộc Tam giác cơ 4" thì có, "rối loạn" thì không.
      if (list.remainder && /\d/.test(list.remainder)) {
        flags.push(`[${v.id}] tr.${f.ref.pdfPage} ${f.label}: bỏ qua phần "${list.remainder}"`);
      }
      if (f.kind === "treatment") {
        for (const c of list.codes) treated.add(c.code);
        continue;
      }
      for (const c of list.codes) {
        if (!byRole.has(c.code)) byRole.set(c.code, new Set());
        byRole.get(c.code)!.add(f.kind);
      }
    }
    for (const [code, roles] of byRole) {
      if (roles.size > 1) flags.push(`[${v.id}] ${code} mang nhiều vai: ${[...roles].join(" + ")}`);
    }
    // Dòng "Giải tỏa" nêu mã mà dòng "Trọng điểm" không có: hai dòng của cùng một
    // thể tự mâu thuẫn — người duyệt chọn, máy không gộp.
    const extra = [...treated].filter((code) => !byRole.has(code));
    if (extra.length && byRole.size) flags.push(`[${v.id}] phần giải tỏa có ${extra.join(", ")} mà trọng điểm không có`);
  }
  for (const m of section.mentions) {
    flags.push(`[mention] tr.${m.ref.pdfPage} ${m.vertebrae.codes.map((c) => c.code).join(", ")} — vai trò trống: "${m.line.slice(0, 120)}"`);
  }
  return flags;
}
