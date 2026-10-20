import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ATLAS_VIEWS,
  isUsableView,
  overviewFor,
  searchViews,
  systemViewSections,
  viewById,
  viewKind,
  viewParts,
} from "./views";

// Chạy: npx tsx --test src/lib/human-atlas/views.test.ts

test("id góc nhìn là duy nhất (deep link ?view=)", () => {
  const ids = ATLAS_VIEWS.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("mọi góc nhìn dựng được có mã mảnh đã sinh", () => {
  for (const view of ATLAS_VIEWS) {
    if (view.missing) continue;
    const parts = viewParts(view.id);
    assert.ok(parts, `${view.id}: thiếu trong view-parts.generated.json — chạy scripts/atlas-views.ts --write`);
    assert.ok(parts.focus.length > 0, `${view.id}: không có mảnh nổi bật`);
  }
});

test("bối cảnh không trùng mảnh nổi bật", () => {
  for (const view of ATLAS_VIEWS) {
    const parts = viewParts(view.id);
    if (!parts?.context) continue;
    const focus = new Set(parts.focus);
    assert.ok(!parts.context.some((id) => focus.has(id)), view.id);
  }
});

test("hệ hô hấp có đủ ba cấp", () => {
  const sections = systemViewSections("respiratory");
  for (const kind of ["overview", "group", "structure"] as const) {
    const section = sections.find((s) => s.kind === kind);
    assert.ok(section && section.views.length > 0, kind);
  }
});

test("deep link trong yêu cầu đều dựng được", () => {
  for (const id of ["respiratory-overview", "respiratory-lungs", "respiratory-trachea-bronchi", "right-lung", "trachea"]) {
    assert.ok(isUsableView(id), id);
  }
});

test("khí quản: một mảnh nổi bật; phổi = phổi phải + phổi trái", () => {
  assert.equal(viewParts("trachea")?.focus.length, 1);
  const lungs = new Set(viewParts("respiratory-lungs")?.focus);
  const right = viewParts("right-lung")?.focus ?? [];
  const left = viewParts("left-lung")?.focus ?? [];
  assert.equal(lungs.size, right.length + left.length);
  assert.ok([...right, ...left].every((id) => lungs.has(id)));
  assert.ok(!right.some((id) => left.includes(id)));
});

test("các thuỳ chia hết đúng phổi của chúng", () => {
  const union = (ids: string[]) => new Set(ids.flatMap((id) => viewParts(id)?.focus ?? []));
  const right = union(["right-upper-lobe", "right-middle-lobe", "right-lower-lobe"]);
  const left = union(["left-upper-lobe", "left-lower-lobe"]);
  assert.deepEqual([...right].sort(), [...(viewParts("right-lung")?.focus ?? [])].sort());
  assert.deepEqual([...left].sort(), [...(viewParts("left-lung")?.focus ?? [])].sort());
});

test('tìm "phổi" ra hệ, nhóm và từng phổi, tổng quan đứng đầu', () => {
  const ids = searchViews("phổi", 20).map((v) => v.id);
  for (const id of ["respiratory-overview", "respiratory-lungs", "right-lung", "left-lung"]) assert.ok(ids.includes(id), id);
  assert.equal(ids[0], "respiratory-overview");
  // Không dấu vẫn ra.
  assert.ok(searchViews("khi quan").some((v) => v.id === "trachea"));
});

test("góc nhìn theo vùng giữ nguyên kiểu", () => {
  assert.equal(viewKind(viewById("skull")!), "regional");
});

test("thẻ hệ mở tổng quan khi hệ có; hệ chưa có preset thì không", () => {
  assert.equal(overviewFor("cardiac"), "cardiac-overview");
  assert.equal(overviewFor("respiratory"), "respiratory-overview");
  assert.equal(overviewFor("endocrine"), "endocrine-overview");
  assert.equal(overviewFor("urinary"), "urinary-overview");
  // Bề mặt cơ thể không có góc nhìn (chủ sản phẩm bỏ, 2026-10-15).
  assert.equal(overviewFor("integumentary"), null);
});

test("tổng quan tim có mạch vành và mạch phổi, không chỉ 18 mảnh tim", () => {
  assert.ok((viewParts("cardiac-overview")?.focus.length ?? 0) > 18);
});

test("đoạn tuỷ: bốn lát nối liền nhau từ trên xuống, không hở không chồng", () => {
  const ids = ["spinal-cord-cervical", "spinal-cord-thoracic", "spinal-cord-lumbar", "spinal-cord-sacral"];
  const bands = ids.map((id) => viewParts(id)?.band);
  bands.forEach((b, i) => assert.ok(b, `${ids[i]}: chưa sinh lát`));
  assert.ok(bands[0]!.top! > bands[0]!.bottom!);
  assert.equal(bands[3]!.bottom, undefined);
  for (let i = 0; i < 3; i++) {
    assert.equal(bands[i]!.bottom, bands[i + 1]!.top, `${ids[i]} → ${ids[i + 1]}`);
    if (bands[i]!.top !== undefined) assert.ok(bands[i]!.top! > bands[i]!.bottom!, ids[i]);
  }
});
