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
