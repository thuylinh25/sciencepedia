import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { SKY_TARGETS } from "./sky-data";

/**
 * Thuật ngữ chủ sản phẩm chốt 2026-10-14 (docs/content-rules.md, "Thuật ngữ đã chốt"): nơron, hố đen,
 * lý thuyết dây. Chặn dạng cũ quay lại ở những nguồn chữ nằm trong repo — glossary và nhãn bầu trời.
 * Chỉ quét trường tiếng Việt: bản tiếng Anh giữ "neuron". Không dùng `\b`: nó không nhận chữ có dấu.
 */
const OLD = /(^|[^\p{L}])(neuron|nơ-ron|lỗ đen|thuyết dây)(?=$|[^\p{L}])/iu;

function oldForm(text: string): string | null {
  for (const match of text.matchAll(new RegExp(OLD.source, "giu"))) {
    const before = text.slice(0, match.index + match[1].length);
    if (match[2].toLowerCase() === "thuyết dây" && /lý $/i.test(before)) continue;
    return match[2];
  }
  return null;
}

test("glossary: định nghĩa tiếng Việt không dùng dạng cũ", () => {
  const entries = JSON.parse(
    readFileSync(path.join(process.cwd(), "prisma/seed-data/glossary.json"), "utf8"),
  ) as Record<string, unknown>[];
  for (const entry of entries) {
    for (const field of ["term", "shortDef", "fullDef"]) {
      const text = typeof entry[field] === "string" ? (entry[field] as string) : "";
      assert.equal(oldForm(text), null, `${String(entry.slug)}.${field}`);
    }
  }
});

test("bầu trời: tên và mô tả tiếng Việt không dùng dạng cũ", () => {
  for (const object of SKY_TARGETS) {
    for (const text of [object.name, object.blurb]) assert.equal(oldForm(text), null, object.id);
  }
});

test("bộ dò bắt dạng cũ, bỏ qua 'lý thuyết dây' và 'neurogenesis'", () => {
  assert.equal(oldForm("các lỗ đen siêu nặng"), "lỗ đen");
  assert.equal(oldForm("Thuyết dây cho rằng"), "Thuyết dây");
  assert.equal(oldForm("một nơ-ron"), "nơ-ron");
  assert.equal(oldForm("lý thuyết dây cho rằng"), null);
  assert.equal(oldForm("neurogenesis ở hồi hải mã"), null);
  assert.equal(oldForm("hố đen và nơron"), null);
});
