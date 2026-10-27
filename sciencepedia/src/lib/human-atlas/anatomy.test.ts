import assert from "node:assert/strict";
import { test } from "node:test";

import { correctSystems, GROUP_COLORS, type Atlas } from "./anatomy";
import groups from "./part-groups.generated.json";

// Chạy: npx tsx --test src/lib/human-atlas/anatomy.test.ts

const part = (id: string, conceptId: string, shift = 0): Atlas["parts"][number] => ({
  id,
  name: id,
  conceptId,
  system: "skeletal",
  chunk: 0,
  positions: 0,
  normals: 0,
  indices: 0,
  vertexCount: 10,
  indexCount: 12,
  bounds: [
    [0 + shift, 0, 0],
    [1 + shift, 1, 1],
  ],
});

const atlas = (parts: Atlas["parts"]): Atlas => ({
  version: "t",
  parts,
  concepts: [...new Set(parts.map((p) => p.conceptId))].map((id) => ({
    id,
    name: id,
    elements: parts.filter((p) => p.conceptId === id).map((p) => p.id),
  })),
  chunks: [],
  triangles: 0,
});

test("bản sao hình học CÙNG khái niệm bị bỏ, giữ bản đầu", () => {
  const out = correctSystems(atlas([part("A", "FMA1"), part("B", "FMA1")]));
  assert.deepEqual(out.parts.map((p) => p.id), ["A"]);
  assert.deepEqual(out.concepts[0].elements, ["A"]);
});

test("cùng hình KHÁC khái niệm, hay cùng khái niệm khác vị trí: giữ cả hai", () => {
  assert.equal(correctSystems(atlas([part("A", "FMA1"), part("B", "FMA2")])).parts.length, 2);
  assert.equal(correctSystems(atlas([part("A", "FMA1"), part("B", "FMA1", 0.2)])).parts.length, 2);
});

test("alias khái niệm: mảnh song sinh bị bỏ, phần tử trỏ sang mảnh giữ, không trùng phần tử", () => {
  const base = atlas([part("FJ1846", "FMA50737"), part("FJ2013", "FMA50737", 0.2), part("FJ3421", "FMA14812")]);
  // Khái niệm cha liệt kê CẢ hai bản (như FMA7161 trên dữ liệu thật).
  base.concepts.push({ id: "FMA7161", name: "FMA7161", elements: ["FJ1846", "FJ3421"] });
  const out = correctSystems(base);
  assert.deepEqual(
    out.parts.map((p) => p.id),
    ["FJ3421"],
  );
  // Khái niệm của mảnh bị bỏ vẫn sống, phần tử trỏ sang mảnh giữ.
  assert.deepEqual(out.concepts.find((c) => c.id === "FMA50737")?.elements, ["FJ3421"]);
  assert.deepEqual(out.concepts.find((c) => c.id === "FMA14812")?.elements, ["FJ3421"]);
  assert.deepEqual(out.concepts.find((c) => c.id === "FMA7161")?.elements, ["FJ3421"]);
});

test("mọi nhóm vật liệu sinh ra đều có màu", () => {
  for (const key of new Set(Object.values(groups as Record<string, string>))) {
    assert.ok(GROUP_COLORS[key], key);
  }
});
