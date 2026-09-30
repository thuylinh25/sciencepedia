import assert from "node:assert/strict";
import { test } from "node:test";

import type { Atlas } from "./anatomy";
import { buildSearchIndex, searchConcepts, spineAliases } from "./search";

// Chạy: npx tsx --test src/lib/human-atlas/search.test.ts

const concept = (id: string, name: string) => ({ id, name, elements: [id] });
const atlas = {
  parts: [],
  concepts: [
    concept("FMA13072", "first lumbar vertebra"),
    concept("FMA13073", "second lumbar vertebra"),
    concept("FMA10040", "intervertebral disk of first lumbar vertebra"),
    concept("FMA9164", "twelfth thoracic vertebra"),
    concept("FMA12519", "atlas"),
    concept("FMA16202", "first lumbar intervertebral symphysis"),
  ],
} as unknown as Atlas;
const names = (q: string) => searchConcepts(buildSearchIndex(atlas), q).map((c) => c.name);

test("ký hiệu lâm sàng của đốt sống", () => {
  assert.deepEqual(spineAliases("first lumbar vertebra"), ["l1"]);
  assert.deepEqual(spineAliases("twelfth thoracic vertebra"), ["t12", "d12"]);
  assert.deepEqual(spineAliases("intervertebral disk of first lumbar vertebra"), ["l1"]);
  assert.deepEqual(spineAliases("atlas"), ["c1"]);
  assert.deepEqual(spineAliases("lumbar vertebra"), []);
});

test("\"đốt L1\" ra đốt L1, đĩa L1 đứng sau, không ra L2 hay khớp", () => {
  const hits = names("L1");
  assert.equal(hits[0], "first lumbar vertebra");
  assert.ok(hits.includes("intervertebral disk of first lumbar vertebra"));
  assert.ok(!hits.includes("second lumbar vertebra"));
  assert.ok(!hits.includes("first lumbar intervertebral symphysis"));
  assert.deepEqual(names("vertebra L1"), ["first lumbar vertebra", "intervertebral disk of first lumbar vertebra"]);
});

test("ký hiệu khớp nguyên từ: \"l1\" không ăn vào \"l12\"", () => {
  assert.deepEqual(names("D12"), ["twelfth thoracic vertebra"]);
  assert.deepEqual(names("t1"), []);
  assert.deepEqual(names("c1"), ["atlas"]);
});

test("nhiều từ: mọi từ phải có, không cần liền nhau", () => {
  // "vertebra" nằm trong "intervertebral" — khớp chuỗi con, như tìm một từ.
  assert.deepEqual(names("lumbar first vertebra"), [
    "first lumbar vertebra",
    "first lumbar intervertebral symphysis",
    "intervertebral disk of first lumbar vertebra",
  ]);
});

test("có kết quả khớp cả cụm thì bỏ kết quả chỉ khớp từng từ", () => {
  assert.deepEqual(names("first lumbar"), [
    "first lumbar vertebra",
    "first lumbar intervertebral symphysis",
    "intervertebral disk of first lumbar vertebra",
  ]);
  // "1" khớp nguyên từ ("thắt lưng 1" trong tên Việt), không khớp số trong mã FMA.
  assert.deepEqual(names("lumbar 1"), ["first lumbar vertebra", "intervertebral disk of first lumbar vertebra"]);
});
