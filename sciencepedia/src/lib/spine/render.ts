import type { Editorial, Mapping, Quote, Topic } from "./schema";
import { atlasCodeOf, atlasEmbedHref, atlasHref, compareVertebrae, type VertebraCode } from "./vertebrae";

/**
 * Topic + tệp biên tập → Markdown của bài (vi hoặc en), ghi vào
 * `docs/content/drafts/` để đi qua science-editor như mọi bài khác.
 *
 * Thân bài là Markdown thường — không component riêng, không JS: mã đốt sống là
 * link `/human-atlas?structure=…`, `localizeHref` thêm tiền tố ngôn ngữ lúc
 * render. Cả nhãn "Theo tài liệu…" lẫn lời miễn trừ nằm TRONG nội dung, nên chúng
 * đi theo bài tới mọi nơi bài hiện ra (tìm kiếm, chia sẻ, bản en).
 */

type Locale = "vi" | "en";

const DOC = {
  vi: "*Phương pháp Tác động Cột sống Việt Nam* (Chi hội Tác động cột sống Hà Nội — Hội Đông y thành phố Hà Nội)",
  en: "*Phương pháp Tác động Cột sống Việt Nam* (\"Vietnamese Spinal Impact Method\"; Hanoi Spinal Impact Association — Hanoi Association of Traditional Medicine)",
};

const T = {
  vi: {
    notice: (doc: string) =>
      `> **Tư liệu lưu trữ.** Bài này trình bày nội dung của tài liệu ${doc} để lưu trữ, nghiên cứu và tham khảo. Các đoạn trích là lời của tài liệu, không phải kết luận y khoa của Sciencepedia, và không thay thế chẩn đoán hay điều trị của nhân viên y tế.`,
    symptoms: "Triệu chứng được tài liệu mô tả",
    method: "Nội dung theo phương pháp Tác động cột sống",
    roles: { primary: "Trọng điểm", related: "Liên quan", caution: "Thận trọng", avoid: "Tránh" },
    vertebraeNamed: "Đốt sống tài liệu nêu",
    right: "phải",
    left: "trái",
    regions: { cervical: "các đốt sống cổ", thoracic: "các đốt sống ngực", lumbar: "các đốt sống thắt lưng", sacral: "vùng cùng" },
    atlas: "Xem trên Bản đồ cơ thể người",
    outOfScope: "Tài liệu nói phương pháp không áp dụng",
    sourceHeading: "Nguồn tài liệu",
    reading: "Đọc thêm",
    series: "Cùng loạt Tác động cột sống",
    sourceLine: (doc: string, a: number, b: number) =>
      `Tài liệu ${doc}, phần "${"%HEADING%"}", trang ${a - 1}–${b - 1} của sách (trang ${a}–${b} của bản scan). Bản chép từng trang lưu cùng mã nguồn Sciencepedia.`,
    closing:
      "> 🩺 Nội dung trên dùng cho mục đích lưu trữ, nghiên cứu và tham khảo. Nếu bạn đang có triệu chứng, hãy đến cơ sở y tế để được chẩn đoán và điều trị.",
  },
  en: {
    notice: (doc: string) =>
      `> **Archival material.** This article presents the content of the document ${doc} for archiving, research and reference. Quoted passages are the document's own words, not medical conclusions of Sciencepedia, and they do not replace diagnosis or treatment by a health professional.`,
    symptoms: "Symptoms described in the document",
    method: "Content according to the Spinal Impact method",
    roles: { primary: "Key point", related: "Related", caution: "Caution", avoid: "Avoid" },
    vertebraeNamed: "Vertebrae named by the document",
    right: "right",
    left: "left",
    regions: { cervical: "the cervical vertebrae", thoracic: "the thoracic vertebrae", lumbar: "the lumbar vertebrae", sacral: "the sacral region" },
    atlas: "View on the Human Atlas",
    outOfScope: "Where the document says the method does not apply",
    sourceHeading: "Source document",
    reading: "Further reading",
    series: "More from the Spinal Impact series",
    sourceLine: (doc: string, a: number, b: number) =>
      `The document ${doc}, section "${"%HEADING%"}", book pages ${a - 1}–${b - 1} (scan pages ${a}–${b}). The page-by-page transcription is kept with the Sciencepedia source code.`,
    closing:
      "> 🩺 This content is for archiving, research and reference. If you have symptoms, please see a health professional for diagnosis and treatment.",
  },
};

const ROLE_ORDER: Mapping["role"][] = ["primary", "related", "caution", "avoid"];

/*
 * Đoạn trích chỉ còn lời tài liệu: nhãn "Theo tài liệu (tr. N):", câu dẫn đầu mục và số
 * trang cuối đoạn đều bỏ theo yêu cầu chủ sản phẩm (2026-10-05). Gán lời cho tài liệu
 * nằm ở cấp mục — nhãn "Tư liệu lưu trữ" đầu bài và tiêu đề mục. Truy vết trang vẫn còn:
 * `ref.pdfPage` trong topic JSON và khoảng trang ở mục "Nguồn tài liệu" cuối bài.
 */
const squash = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();

function quote(q: Quote, locale: Locale): string {
  const text = (locale === "vi" ? q.vi : q.en).trim().replace(/\n+/g, " ");
  return `> ${text}`;
}

function codeLink(m: Mapping, locale: Locale): string {
  if (m.targetType === "region") {
    const label = T[locale].regions[m.targetId as keyof (typeof T)["vi"]["regions"]];
    const code = atlasCodeOf(m);
    return code ? `[${label}](${atlasHref([code])})` : label;
  }
  const code = m.targetId as VertebraCode;
  const side = m.side ? ` (${T[locale][m.side]})` : "";
  return `[${code}](${atlasHref([code])})${side}`;
}

function sortMappings(list: Mapping[]): Mapping[] {
  return [...list].sort((a, b) => {
    if (a.targetType !== b.targetType) return a.targetType === "vertebra" ? -1 : 1;
    if (a.targetType === "region") return 0;
    return compareVertebrae(a.targetId as VertebraCode, b.targetId as VertebraCode);
  });
}

function roleLines(mappings: Mapping[], locale: Locale): string[] {
  const lines: string[] = [];
  for (const role of ROLE_ORDER) {
    const of = sortMappings(mappings.filter((m) => m.role === role));
    if (of.length) lines.push(`- **${T[locale].roles[role]}:** ${of.map((m) => codeLink(m, locale)).join(", ")}`);
  }
  return lines;
}

export type SeriesEntry = { slug: string; title: { vi: string; en: string } };

export function renderArticle(
  topic: Topic,
  editorial: Editorial,
  locale: Locale,
  series: SeriesEntry[] = [],
): string {
  const t = T[locale];
  const out: string[] = [t.notice(DOC[locale]), ""];

  out.push(`## ${editorial.safety.heading[locale]}`, "", editorial.safety.body[locale].trim(), "");
  for (const block of editorial.general) out.push(`## ${block.heading[locale]}`, "", block.body[locale].trim(), "");

  if (editorial.symptoms.length) {
    out.push(`## ${t.symptoms}`, "");
    for (const q of editorial.symptoms) out.push(quote(q, locale), "");
  }

  out.push(`## ${t.method}`, "");
  for (const q of editorial.methodQuotes) out.push(quote(q, locale), "");
  const byId = new Map(topic.variants.map((v) => [v.id, v]));
  for (const ev of editorial.variants) {
    const v = byId.get(ev.id);
    if (!v) continue;
    out.push(`### ${ev.label[locale]}`, "");
    // Trọng điểm + khung atlas ngay dưới ĐOẠN TRÍCH nêu chúng, không gom cuối thể
    // (chủ sản phẩm, 2026-10-05). Mapping nào không tìm thấy nguyên văn trong đoạn nào
    // thì rơi xuống cuối thể — không bao giờ bị bỏ mất.
    const placed = new Set<Mapping>();
    const block = (mappings: Mapping[]) => {
      const lines = roleLines(mappings, locale);
      if (!lines.length) return;
      out.push(`${t.vertebraeNamed}:`, "", ...lines, "");
      const codes = [...new Set(mappings.map(atlasCodeOf).filter((c): c is VertebraCode => c !== null))];
      if (codes.length) out.push(`[${t.atlas} →](${atlasEmbedHref(codes)})`, "");
    };
    for (const q of ev.quotes) {
      out.push(quote(q, locale), "");
      const mine = v.mappings.filter((m) => !placed.has(m) && m.ref.pdfPage === q.pdfPage && squash(q.vi).includes(squash(m.raw)));
      mine.forEach((m) => placed.add(m));
      block(mine);
    }
    block(v.mappings.filter((m) => !placed.has(m)));
  }

  /* Mục tổng hợp "Đốt sống liên quan" đã bỏ theo yêu cầu chủ sản phẩm (2026-10-05):
     mỗi thể đã nêu đốt sống và có khung atlas riêng ngay dưới nó. Bảng đốt sống → bài
     vẫn có ở /human-atlas (chỉ mục sinh từ topic, không phụ thuộc mục này). */

  if (editorial.outOfScope.length) {
    out.push(`## ${t.outOfScope}`, "");
    for (const q of editorial.outOfScope) out.push(quote(q, locale), "");
  }

  out.push(`## ${t.reading}`, "");
  for (const r of editorial.furtherReading) out.push(`- [${r.title[locale]}](/articles/${r.slug})`);
  const siblings = series.filter((s) => s.slug !== editorial.slug);
  if (siblings.length) {
    out.push("", `**${t.series}:**`, "");
    for (const s of siblings) out.push(`- [${s.title[locale]}](/articles/${s.slug})`);
  }
  out.push("");

  out.push(
    `## ${t.sourceHeading}`,
    "",
    t.sourceLine(DOC[locale], topic.source.pdfPages[0], topic.source.pdfPages[1]).replace("%HEADING%", topic.source.heading),
    "",
    t.closing,
    "",
  );
  return out.join("\n");
}
