import assert from "node:assert/strict";
import { test } from "node:test";

import { anatomicalSystem, viewStructures } from "./atlas-model";
import { SYSTEM_VIEWS, hasCard, viewById, viewKind, viewParts } from "./views";

// Chạy: npx tsx --test src/lib/human-atlas/atlas-model.test.ts

test("hệ hô hấp: một tổng quan + góc nhìn giải phẫu, không thẻ cấu trúc", () => {
  const system = anatomicalSystem("respiratory");
  assert.ok(system);
  assert.equal(system.overview?.def.id, "respiratory-overview");
  assert.ok(system.views.length >= 10, `chỉ ${system.views.length} góc nhìn`);
  assert.ok(system.views.every((v) => viewKind(v.def) === "group"));
  for (const id of ["respiratory-lung-position", "respiratory-pulmonary-circulation", "respiratory-laryngeal-muscles"]) {
    assert.ok(system.views.some((v) => v.def.id === id && v.usable), id);
  }
});

test("góc nhìn thiếu dữ liệu vẫn có thẻ nhưng không dùng được, và nói thiếu gì", () => {
  const views = anatomicalSystem("respiratory")!.views;
  for (const id of ["respiratory-expiration-muscles", "respiratory-innervation"]) {
    const v = views.find((x) => x.def.id === id);
    assert.ok(v && !v.usable && v.def.missing, id);
  }
});

test("hệ chưa có preset thì không có mô hình", () => {
  assert.equal(anatomicalSystem("urinary"), null);
});

test("cấu trúc của mỗi góc nhìn hô hấp phủ đủ tập nổi bật, không chồng nhau", () => {
  const views = SYSTEM_VIEWS.filter((v) => v.systemId === "respiratory" && viewKind(v) !== "structure" && !v.missing);
  for (const view of views) {
    const list = viewStructures(view.id);
    assert.ok(list.length > 0, `${view.id}: không có cấu trúc`);
    const all = list.flatMap((s) => s.parts);
    assert.equal(new Set(all).size, all.length, `${view.id}: cấu trúc chồng mảnh`);
    assert.deepEqual([...all].sort(), [...viewParts(view.id)!.focus].sort(), view.id);
    // Hàng "Phần còn lại" là lối thoát, không phải cách chia chính.
    assert.ok(!list.some((s) => s.rest), `${view.id}: còn mảnh không thuộc cấu trúc nào`);
  }
});

test("cấu trúc lớn thắng cấu trúc con; cấu trúc dùng lại ở nhiều góc nhìn", () => {
  const lungs = viewStructures("respiratory-lungs").map((s) => s.id);
  assert.deepEqual(lungs, ["right-lung", "left-lung"]);
  const ids = (v: string) => viewStructures(v).map((s) => s.id);
  assert.ok(ids("respiratory-lung-position").includes("right-lung"));
  assert.ok(ids("respiratory-lung-position").includes("diaphragm"));
  assert.ok(ids("respiratory-inspiration-muscles").includes("diaphragm"));
  // Mở thẳng một cấu trúc chia được (?view=right-lung): bảng là ba thuỳ.
  assert.deepEqual(ids("right-lung"), ["right-upper-lobe", "right-middle-lobe", "right-lower-lobe"]);
  // Cấu trúc không chia được: một hàng là chính nó.
  assert.deepEqual(ids("trachea"), ["trachea"]);
});

test("góc nhìn không cấu trúc nào khớp thì không có bảng", () => {
  assert.deepEqual(viewStructures("endocrine-overview"), []);
  assert.deepEqual(viewStructures("skull"), []);
  assert.deepEqual(viewStructures(null), []);
});

test("cấp cấu trúc không có thẻ (không chụp ảnh thu nhỏ)", () => {
  assert.equal(hasCard(viewById("trachea")!), false);
  assert.equal(hasCard(viewById("respiratory-lungs")!), true);
  assert.equal(hasCard(viewById("skull")!), true);
});
