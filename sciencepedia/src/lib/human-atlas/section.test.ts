import assert from "node:assert/strict";
import { test } from "node:test";

import { sectionCap, sectionLoops } from "./section";

// Chạy: npx tsx --test src/lib/human-atlas/section.test.ts

/** Ống lăng trụ n cạnh, bán kính r, cao từ y 0 tới 1, không nắp (như lưới bó tuỷ ZA). */
function tube(n: number, r: number, flip = false) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pos.push(r * Math.cos(a), 0, r * Math.sin(a), r * Math.cos(a), 1, r * Math.sin(a));
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [b0, t0, b1, t1] = [i * 2, i * 2 + 1, j * 2, j * 2 + 1];
    if (flip) idx.push(b0, b1, t0, t0, b1, t1);
    else idx.push(b0, t0, b1, t0, t1, b1);
  }
  return { pos, idx };
}

const capArea = (cap: NonNullable<ReturnType<typeof sectionCap>>) => {
  let area = 0;
  const p = cap.positions;
  for (let t = 0; t < cap.indices.length; t += 3) {
    const [a, b, c] = [cap.indices[t] * 3, cap.indices[t + 1] * 3, cap.indices[t + 2] * 3];
    // Thành phần y của tích có hướng — dương = pháp tuyến hướng lên.
    area += ((p[c] - p[a]) * (p[b + 2] - p[a + 2]) - (p[b] - p[a]) * (p[c + 2] - p[a + 2])) / 2;
  }
  return area;
};

test("ống kín thành bên → một vòng; nắp hướng +y, diện tích đúng đa giác", () => {
  const { pos, idx } = tube(12, 1);
  assert.equal(sectionLoops(pos, idx, 0.5).length, 1);
  const cap = sectionCap(pos, idx, 0.5)!;
  const polygon = (12 / 2) * Math.sin((2 * Math.PI) / 12); // diện tích 12 giác đều nội tiếp r = 1
  assert.ok(Math.abs(capArea(cap) - polygon) < 1e-6, `area ${capArea(cap)}`);
  assert.ok(cap.positions.every((v, i) => i % 3 !== 1 || v === 0.5));
});

test("vòng trong vòng là lỗ (chất trắng quanh chất xám)", () => {
  const outer = tube(16, 2);
  const inner = tube(16, 1, true);
  const off = outer.pos.length / 3;
  const pos = [...outer.pos, ...inner.pos];
  const idx = [...outer.idx, ...inner.idx.map((i) => i + off)];
  const cap = sectionCap(pos, idx, 0.5)!;
  const ring = 8 * Math.sin((2 * Math.PI) / 16) * (4 - 1);
  assert.ok(Math.abs(capArea(cap) - ring) < 1e-6, `area ${capArea(cap)}`);
});

test("mặt cắt ngoài tầm lưới, hoặc lưới hở thành bên → không có nắp", () => {
  const { pos, idx } = tube(8, 1);
  assert.equal(sectionCap(pos, idx, 2), null);
  // Bỏ một mặt bên: vòng không khép → bỏ, không tô tràn.
  assert.equal(sectionCap(pos, idx.slice(6), 0.5), null);
});
