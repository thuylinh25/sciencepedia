import assert from "node:assert/strict";
import { test } from "node:test";

import { anatomicalSystem, viewStructures } from "./atlas-model";
import { SYSTEM_VIEWS, hasCard, viewById, viewKind, viewParts, viewStatus } from "./views";

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

test("góc nhìn thiếu dữ liệu (missing) là unavailable — không lên lưới", () => {
  const def = { ...viewById("respiratory-lungs")!, id: "x-missing", missing: { vi: "thiếu", en: "missing" } };
  assert.equal(viewStatus(def), "unavailable");
  const system = anatomicalSystem("respiratory")!;
  assert.ok(system.views.every((v) => v.usable && v.status !== "unavailable"));
});

test("dựng một phần thì là partial, có thẻ và nói rõ phần thiếu", () => {
  const views = anatomicalSystem("respiratory")!.views;
  const expect = {
    "respiratory-nose": "khoang mũi",
    "respiratory-expiration-muscles": "cơ thẳng bụng",
    "respiratory-innervation": "thần kinh hoành",
  };
  for (const [id, gap] of Object.entries(expect)) {
    const v = views.find((x) => x.def.id === id);
    assert.equal(v?.status, "partial", id);
    assert.ok(v?.def.partial?.vi.includes(gap), id);
  }
});

test("mọi góc nhìn theo hệ có đánh giá chất lượng nội bộ", () => {
  for (const v of SYSTEM_VIEWS.filter((x) => x.systemId === "respiratory" && viewKind(x) === "group" && !x.missing)) {
    assert.ok(v.quality, v.id);
  }
});

test("phổi mờ làm bối cảnh cho cây phế quản, khí quản, cơ hít vào", () => {
  const lungs = new Set(viewParts("respiratory-lungs")!.focus);
  for (const id of ["respiratory-bronchial-tree", "respiratory-trachea-bronchi", "respiratory-inspiration-muscles"]) {
    const context = new Set(viewParts(id)!.context ?? []);
    assert.ok([...lungs].every((p) => context.has(p)), id);
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
