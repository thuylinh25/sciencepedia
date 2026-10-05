import type { Editorial, Mapping, Quote, Topic } from "./schema";
import { VERTEBRAE, atlasHref, compareVertebrae, type VertebraCode } from "./vertebrae";

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
    methodIntro:
      "Các mục dưới đây trích nguyên văn từ tài liệu, kèm số trang. Bài chỉ ghi lại tài liệu nói gì; bài không hướng dẫn thao tác và không thay cho việc khám bệnh.",
    according: (page: number) => `Theo tài liệu (tr. ${page})`,
    roles: { primary: "Trọng điểm", related: "Liên quan", caution: "Thận trọng", avoid: "Tránh" },
    vertebraeNamed: "Đốt sống tài liệu nêu",
    right: "phải",
    left: "trái",
    regions: { cervical: "các đốt sống cổ", thoracic: "các đốt sống ngực", lumbar: "các đốt sống thắt lưng", sacral: "vùng cùng" },
    atlas: "Xem trên Bản đồ cơ thể người",
    summaryHeading: "Đốt sống liên quan",
    summaryIntro:
      "Tổng hợp từ các mục trên. Vai trò là cách tài liệu gọi tên (trọng điểm, liên quan, thận trọng, tránh), không phải khuyến cáo của Sciencepedia. Bấm mã để xem đốt sống trên Bản đồ cơ thể người.",
    sacrumNote: "Trên Bản đồ cơ thể người, S1–S5 hiện chung là xương cùng: mô hình không tách riêng năm đốt cùng.",
    outOfScope: "Tài liệu nói phương pháp không áp dụng",
    sourceHeading: "Nguồn tài liệu",
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
    methodIntro:
      "The passages below are translated from the document, with page numbers. The article records what the document says; it does not teach any technique and is not a substitute for medical care.",
    according: (page: number) => `According to the document (p. ${page}, translated)`,
    roles: { primary: "Key point", related: "Related", caution: "Caution", avoid: "Avoid" },
    vertebraeNamed: "Vertebrae named by the document",
    right: "right",
    left: "left",
    regions: { cervical: "the cervical vertebrae", thoracic: "the thoracic vertebrae", lumbar: "the lumbar vertebrae", sacral: "the sacral region" },
    atlas: "View on the Human Atlas",
    summaryHeading: "Related vertebrae",
    summaryIntro:
      "Compiled from the sections above. Roles are the document's own terms (key point, related, caution, avoid), not recommendations by Sciencepedia. Select a code to see the vertebra on the Human Atlas.",
    sacrumNote: "On the Human Atlas, S1–S5 are shown together as the sacrum: the model does not separate the five sacral vertebrae.",
    outOfScope: "Where the document says the method does not apply",
    sourceHeading: "Source document",
    sourceLine: (doc: string, a: number, b: number) =>
      `The document ${doc}, section "${"%HEADING%"}", book pages ${a - 1}–${b - 1} (scan pages ${a}–${b}). The page-by-page transcription is kept with the Sciencepedia source code.`,
    closing:
      "> 🩺 This content is for archiving, research and reference. If you have symptoms, please see a health professional for diagnosis and treatment.",
  },
};

const ROLE_ORDER: Mapping["role"][] = ["primary", "related", "caution", "avoid"];

function quote(q: Quote, locale: Locale): string {
  const text = (locale === "vi" ? q.vi : q.en).trim().replace(/\n+/g, " ");
  return `> **${T[locale].according(q.pdfPage - 1)}:** ${text}`;
}

function codeLink(m: Mapping, locale: Locale): string {
  if (m.targetType === "region") return T[locale].regions[m.targetId as keyof (typeof T)["vi"]["regions"]];
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

export function renderArticle(topic: Topic, editorial: Editorial, locale: Locale): string {
  const t = T[locale];
  const out: string[] = [t.notice(DOC[locale]), ""];

  out.push(`## ${editorial.safety.heading[locale]}`, "", editorial.safety.body[locale].trim(), "");
  for (const block of editorial.general) out.push(`## ${block.heading[locale]}`, "", block.body[locale].trim(), "");

  if (editorial.symptoms.length) {
    out.push(`## ${t.symptoms}`, "");
    for (const q of editorial.symptoms) out.push(quote(q, locale), "");
  }

  out.push(`## ${t.method}`, "", t.methodIntro, "");
  for (const q of editorial.methodQuotes) out.push(quote(q, locale), "");
  const byId = new Map(topic.variants.map((v) => [v.id, v]));
  for (const ev of editorial.variants) {
    const v = byId.get(ev.id);
    if (!v) continue;
    out.push(`### ${ev.label[locale]}`, "");
    for (const q of ev.quotes) out.push(quote(q, locale), "");
    const lines = roleLines(v.mappings, locale);
    if (lines.length) {
      out.push(`${t.vertebraeNamed}:`, "", ...lines, "");
      const codes = v.mappings.filter((m) => m.targetType === "vertebra").map((m) => m.targetId as VertebraCode);
      if (codes.length) out.push(`[${t.atlas} →](${atlasHref(codes)})`, "");
    }
  }

  const all = topic.variants.flatMap((v) => v.mappings);
  const vertebrae = [...new Set(all.filter((m) => m.targetType === "vertebra").map((m) => m.targetId as VertebraCode))].sort(compareVertebrae);
  if (vertebrae.length) {
    out.push(`## ${t.summaryHeading}`, "", t.summaryIntro, "");
    for (const code of vertebrae) {
      const roles = ROLE_ORDER.filter((r) => all.some((m) => m.targetId === code && m.role === r));
      out.push(`- [${code}](${atlasHref([code])}) — ${VERTEBRAE.get(code)![locale === "vi" ? "vi" : "en"]}: ${roles.map((r) => t.roles[r].toLowerCase()).join(", ")}`);
    }
    out.push("");
    if (vertebrae.some((c) => c.startsWith("S"))) out.push(`*${t.sacrumNote}*`, "");
    out.push(`[${t.atlas} →](${atlasHref(vertebrae)})`, "");
  }

  if (editorial.outOfScope.length) {
    out.push(`## ${t.outOfScope}`, "");
    for (const q of editorial.outOfScope) out.push(quote(q, locale), "");
  }

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
