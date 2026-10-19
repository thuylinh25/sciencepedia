import assert from "node:assert/strict";
import { test } from "node:test";

import type { Atlas } from "./anatomy";
import { resolveContent, type AnatomyData } from "./structures";
import { SUPPLEMENT_PART_OF, withSupplements } from "./supplements";

// Chạy: npx tsx --test src/lib/human-atlas/supplements.test.ts

const cerebellumHalf = (id: string): Atlas["parts"][number] =>
  ({ id, name: "Cerebellum", conceptId: "FMA67944", system: "nervous", chunk: 0 }) as unknown as Atlas["parts"][number];
const atlas = { chunks: [], parts: [cerebellumHalf("FJ1781"), cerebellumHalf("FJ1830")], concepts: [{ id: "FMA67944", name: "cerebellum", elements: ["FJ1781", "FJ1830"] }] } as unknown as Atlas;

test("tiểu thuỳ Z-Anatomy THAY hai nửa tiểu não BodyParts3D; khái niệm rỗng bị bỏ", () => {
  const out = withSupplements(atlas);
  assert.ok(!out.parts.some((p) => p.id === "FJ1781" || p.id === "FJ1830"));
  assert.ok(!out.concepts.some((c) => c.id === "FMA67944"));
  assert.ok(out.parts.some((p) => p.conceptId === "ZA-culmen"));
});

test("keepReplaced giữ vỏ tiểu não BodyParts3D cho phép căn atlas MNI", () => {
  const out = withSupplements(atlas, { keepReplaced: true });
  assert.ok(out.parts.some((p) => p.id === "FJ1781"));
});

test("khái niệm ZA kế thừa nội dung Level 2 của cha FMA qua partOf", () => {
  assert.equal(SUPPLEMENT_PART_OF["ZA-culmen"], "FMA67944");
  assert.equal(SUPPLEMENT_PART_OF["ZA-olive"], "FMA62004");
  const data = { content: { FMA67944: { summary: { vi: "x", en: "x" } } }, structures: {}, terms: {} } as unknown as AnatomyData;
  assert.equal(resolveContent(data, "ZA-culmen")?.about, "FMA67944");
  assert.equal(resolveContent(data, "ZA-falx-cerebri"), null);
});
