import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { assembleTopic, verifyQuotes, type Decision, type SectionMeta } from "./assemble";
import { extractSection, parsePage } from "./extract";
import { renderArticle } from "./render";
import { Editorial } from "./schema";

// Chạy: npx tsx --test src/lib/spine/assemble.test.ts

const ROOT = path.join(process.cwd(), "content/tac-dong-cot-song");
const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const pages = readdirSync(path.join(ROOT, "source/pages")).sort().map((f) => parsePage(readFileSync(path.join(ROOT, "source/pages", f), "utf8")));
const manifest = read("source/manifest.json") as { sections: SectionMeta[] };
const decisions = (read("source/decisions.json") as { entries: Decision[] }).entries;
const meta = (id: string) => manifest.sections.find((s) => s.id === id)!;
const editorial = (slug: string) => Editorial.parse(read(`topics/${slug}.editorial.json`));

test("trích lệch một chữ thì bị từ chối", () => {
  assert.deepEqual(verifyQuotes([{ pdfPage: 3, vi: "Nếu bệnh nhân đau không ngồi thẳng lưng được có trọng điểm L4,5 và S1.", en: "x" }], pages), []);
  const errors = verifyQuotes([{ pdfPage: 3, vi: "Nếu bệnh nhân đau không ngồi thẳng lưng được có trọng điểm L4,5 và S2.", en: "x" }], pages);
  assert.equal(errors.length, 1);
});

test("dấu … cho lược, nhưng các mảnh phải đúng thứ tự", () => {
  const ok = "Nếu bệnh nhân bị ngoại cảm phong hàn không ra mồ hôi … trọng điểm thường cũng có T2.3.";
  assert.deepEqual(verifyQuotes([{ pdfPage: 3, vi: ok, en: "x" }], pages), []);
  const swapped = "trọng điểm thường cũng có T2.3. … Nếu bệnh nhân bị ngoại cảm phong hàn";
  assert.equal(verifyQuotes([{ pdfPage: 3, vi: swapped, en: "x" }], pages).length, 1);
});

test("quyết định D-6 gán vai 'liên quan' cho L4, L5, S1, S2 ở đau thần kinh tọa", () => {
  const topic = assembleTopic(extractSection("dau-than-kinh-toa", [7, 11], pages), meta("dau-than-kinh-toa"), decisions, editorial("dau-than-kinh-toa-theo-tac-dong-cot-song"));
  const related = topic.variants.flatMap((v) => v.mappings).filter((m) => m.role === "related");
  assert.deepEqual(related.map((m) => m.targetId), ["L4", "L5", "S1", "S2"]);
  assert.ok(related.every((m) => m.decision === "D-6"));
  // D-5 đã xác nhận cách đọc "T2 T,3T7 T8": không còn mã chưa chắc.
  assert.ok(topic.variants.flatMap((v) => v.mappings).every((m) => m.confidence !== "uncertain"));
  // Mốc đo (S5, S1) và đoạn giới thiệu giải phẫu chưa có quyết định → không vào chỉ mục.
  assert.equal(topic.unassigned.length, 3);
});

test("thể có mapping mà biên tập bỏ quên thì build dừng", () => {
  const e = editorial("dau-nua-dau-theo-tac-dong-cot-song");
  const missing = { ...e, variants: e.variants.filter((v) => v.id !== "mat-nhin-hinh-doi-sup-mi") };
  assert.throws(
    () => assembleTopic(extractSection("dau-nua-dau", [12, 14], pages), meta("dau-nua-dau"), decisions, missing),
    /mat-nhin-hinh-doi-sup-mi/,
  );
});

test("review.mapping = passed mà còn mã chưa chắc thì build dừng", () => {
  const e = editorial("dau-than-kinh-toa-theo-tac-dong-cot-song");
  const passed = { ...e, review: { ...e.review, mapping: "passed" as const } };
  const withoutD5 = decisions.filter((d) => d.id !== "D-5");
  assert.throws(
    () => assembleTopic(extractSection("dau-than-kinh-toa", [7, 11], pages), meta("dau-than-kinh-toa"), withoutD5, passed),
    /uncertain/,
  );
});

test("trọng điểm + khung atlas nằm ngay dưới từng đoạn trích nêu chúng", () => {
  const slug = "dau-lung-cap-theo-tac-dong-cot-song";
  const e = editorial(slug);
  const topic = assembleTopic(extractSection("dau-lung-cap", [2, 3], pages), meta("dau-lung-cap"), decisions, e);
  const md = renderArticle(topic, e, "vi");
  const part = md.slice(md.indexOf("### Các trọng điểm"), md.indexOf("## Đọc thêm"));
  // Bốn đoạn trích, bốn khung atlas — mỗi khung theo đúng mã của đoạn ngay trên nó.
  assert.equal(part.match(/#atlas-embed\)/g)?.length, 4);
  const order = [...part.matchAll(/structure=([a-z,-]+)#atlas-embed/g)].map((m) => m[1]);
  assert.deepEqual(order, [
    "second-thoracic-vertebra,third-thoracic-vertebra,seventh-thoracic-vertebra,eighth-thoracic-vertebra",
    "fourth-lumbar-vertebra,fifth-lumbar-vertebra,sacrum",
    "second-thoracic-vertebra,third-thoracic-vertebra",
    // D-37: "vùng S" song chỉnh tô cả khối xương cùng, cạnh C1–C2 của D-12.
    "atlas,axis,sacrum",
  ]);
});

// Mục chưa có tệp biên tập: mượn tệp của một bài, đặt nhãn theo tiêu đề thể — chỉ để
// chạy phần mapping của assembleTopic.
function topicOf(section: string, range: [number, number]) {
  const extract = extractSection(section, range, pages);
  const base = editorial("dau-lung-cap-theo-tac-dong-cot-song");
  const e = { ...base, section, variants: extract.variants.map((v) => ({ id: v.id, label: { vi: v.heading, en: v.heading }, quotes: [] })) };
  return assembleTopic(extract, meta(section), decisions, e);
}
const mappingsOf = (topic: ReturnType<typeof topicOf>, variant: string) => topic.variants.find((v) => v.id === variant)!.mappings;

test("D-37: vùng S thành mapping vùng 'sacral', vai liên quan — không bung thành S1–S5", () => {
  const topic = topicOf("dau-lung-cap", [2, 3]);
  const sweat = topic.variants.flatMap((v) => v.mappings).filter((m) => m.decision === "D-12" || m.decision === "D-37");
  assert.deepEqual(sweat.map((m) => `${m.targetType}:${m.targetId}:${m.role}`), ["vertebra:C1:primary", "vertebra:C2:primary", "region:sacral:related"]);
});

test("D-21…D-25 (keepRole): mã hai vai trong một thể chỉ còn vai trọng điểm", () => {
  const topic = topicOf("thieu-nang-tuan-hoan-nao", [17, 18]);
  for (const [variant, codes] of [["dau-dau", ["T1"]], ["lao-dao", ["T1"]], ["it-ngu", ["T1"]], ["dau-lung-tren", ["T1", "T3"]]] as const) {
    for (const code of codes) {
      assert.deepEqual(mappingsOf(topic, variant).filter((m) => m.targetId === code).map((m) => m.role), ["primary"], `${variant}:${code}`);
    }
  }
  // Mã khác của dải liên quan không bị đụng.
  assert.ok(mappingsOf(topic, "lao-dao").some((m) => m.targetId === "T2" && m.role === "related"));
});

test("keepRole trỏ vào mã không có vai ấy thì build dừng", () => {
  const extract = extractSection("thieu-nang-tuan-hoan-nao", [17, 18], pages);
  const base = editorial("dau-lung-cap-theo-tac-dong-cot-song");
  const e = { ...base, variants: extract.variants.map((v) => ({ id: v.id, label: { vi: v.heading, en: v.heading }, quotes: [] })) };
  const bad: Decision = { id: "D-x", section: "thieu-nang-tuan-hoan-nao", apply: { keepRole: "primary", variant: "lao-dao", codes: ["T5"] } };
  assert.throws(() => assembleTopic(extract, meta("thieu-nang-tuan-hoan-nao"), [bad], e), /D-x/);
});

test("D-26, D-27, D-29, D-30: bên phải và điều kiện đi theo quyết định", () => {
  const hap = mappingsOf(topicOf("huyet-ap-cao", [19, 19]), "benh-huyet-ap-cao").find((m) => m.decision === "D-26")!;
  assert.deepEqual([hap.targetId, hap.role, hap.side, hap.note], ["T3", "primary", "right", "khi tâm trương cần điều chỉnh"]);

  const dd = topicOf("dau-dau", [20, 32]);
  const caution = mappingsOf(dd, "dau-dau-do-tang-huyet-ap-kiem").filter((m) => m.role === "caution");
  assert.deepEqual(caution.map((m) => `${m.targetId}:${m.side}:${m.confidence}`), ["T6:right:exact", "T10:right:exact", "L3:right:exact"]);
  const laoDao = mappingsOf(dd, "dau-dau-lao-dao-muon-nga-kiem").filter((m) => m.role === "primary");
  assert.deepEqual(laoDao.map((m) => `${m.targetId}:${m.side}:${m.decision}`), ["C6:right:D-29", "C7:right:D-29", "T1:right:D-29"]);
});

test("đau lưng mạn tính: nơi bệnh nằm không vào chỉ mục, vùng xơ co là liên quan", () => {
  const topic = topicOf("dau-lung-man-tinh", [4, 6]);
  const all = topic.variants.flatMap((v) => v.mappings);
  // Lao T7, T8 (D-20) và L4, L5 viêm khớp cùng chậu (D-17) không có mapping nào.
  assert.equal(mappingsOf(topic, "dau-lung-do-nhiem-khuan-lao-dot").length, 0);
  assert.equal(mappingsOf(topic, "viem-khop-cung-chau").length, 0);
  assert.deepEqual(mappingsOf(topic, "dau-lung-do-thoai-hoa-voi-hoa").map((m) => `${m.targetId}:${m.role}`), ["T2:related", "T3:related", "T7:related", "T8:related"]);
  assert.deepEqual(mappingsOf(topic, "dau-lung-do-gai-doi").map((m) => `${m.targetId}:${m.role}`), ["C1:primary", "C3:primary", "C4:primary", "L4:related", "L5:related", "S1:related"]);
  assert.ok(all.every((m) => m.confidence !== "uncertain"));
});

test("bài render: có nhãn tư liệu, link atlas, lời khép bài; không có lời mời tự làm", () => {
  const slug = "dau-lung-cap-theo-tac-dong-cot-song";
  const e = editorial(slug);
  const topic = assembleTopic(extractSection("dau-lung-cap", [2, 3], pages), meta("dau-lung-cap"), decisions, e);
  for (const locale of ["vi", "en"] as const) {
    const md = renderArticle(topic, e, locale);
    assert.match(md, /^> \*\*(Tư liệu lưu trữ|Archival material)\.\*\*/);
    assert.match(md, /\[L5\]\(\/human-atlas\?structure=fifth-lumbar-vertebra#atlas-viewer\)/);
    assert.match(md, /🩺/);
    // Nút "Xem trên Bản đồ" là khung nhúng tại chỗ; mã đốt sống lẻ vẫn dẫn sang trang atlas.
    assert.match(md, /\]\(\/human-atlas\?structure=[a-z,-]+#atlas-embed\)/);
    assert.doesNotMatch(md, /tự thực hiện|làm theo các bước|điều trị ngay|try this at home/i);
  }
});

test("cùng mã, cùng vai trong một đoạn trích: chỉ hiện bản có bên (huyết áp cao, D-2…D-4)", () => {
  const slug = "huyet-ap-cao-theo-tac-dong-cot-song";
  const e = editorial(slug);
  const topic = assembleTopic(extractSection("huyet-ap-cao", [19, 19], pages), meta("huyet-ap-cao"), decisions, e);
  const md = renderArticle(topic, e, "vi");
  const caution = md.split("\n").find((l) => l.startsWith("- **Thận trọng:**"))!;
  assert.equal(caution.match(/\[T6\]/g)?.length, 1);
  assert.match(caution, /\[T6\]\([^)]+\) \(phải\)/);
});
