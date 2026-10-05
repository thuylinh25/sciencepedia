import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { VERTEBRAE, VERTEBRA_ORDER, atlasHref } from "./vertebrae";

// Chạy: npx tsx --test src/lib/spine/vertebrae.test.ts

const fma = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/anatomy/fma-structures.json"), "utf8"),
) as { structures: Record<string, { names: { en: string } }> };

test("đủ 29 ký hiệu, đúng thứ tự giải phẫu", () => {
  assert.equal(VERTEBRAE.size, 7 + 12 + 5 + 5);
  assert.equal(VERTEBRA_ORDER[0], "C1");
  assert.equal(VERTEBRA_ORDER[7], "T1");
  assert.equal(VERTEBRA_ORDER[19], "L1");
  assert.equal(VERTEBRA_ORDER[28], "S5");
});

test("mã FMA trỏ đúng tên FMA — slug là tên ấy viết thường", () => {
  for (const v of VERTEBRAE.values()) {
    const record = fma.structures[v.fma];
    assert.ok(record, `${v.code}: ${v.fma} không có trong fma-structures.json`);
    const slug = record.names.en.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.equal(v.atlasSlug, slug, `${v.code}: slug lệch tên FMA "${record.names.en}"`);
  }
});

test("mỗi đốt C/T/L là một khái niệm riêng; S1–S5 cùng là xương cùng", () => {
  const single = [...VERTEBRAE.values()].filter((v) => v.segment !== "S");
  assert.equal(new Set(single.map((v) => v.fma)).size, single.length);
  const sacral = [...VERTEBRAE.values()].filter((v) => v.segment === "S");
  assert.ok(sacral.every((v) => v.fma === "FMA16202" && v.granularity === "group"));
});

test("link atlas: gộp xương cùng, theo thứ tự giải phẫu", () => {
  assert.equal(
    atlasHref(["S1", "L5", "L4", "S2"]),
    "/human-atlas?structure=fourth-lumbar-vertebra,fifth-lumbar-vertebra,sacrum#atlas-viewer",
  );
});
