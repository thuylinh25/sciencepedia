import { ShapeUtils, Vector2 } from "three";

/*
 * ## Mặt cắt ngang lấp kín (2026-10-20)
 *
 * Mảnh giải phẫu là BỀ MẶT: mặt phẳng cắt chỉ để lại một viền 1 px, bó tuỷ trông
 * như vòng rỗng và lát mỏng không đọc được (chụp thử ngang C5). Hàm này tính giao
 * của lưới với mặt y = const thành các vòng kín rồi tam giác hoá — nắp tô bằng
 * màu của chính mảnh.
 *
 * Nối đoạn theo CẠNH của lưới (khoá = hai đầu cạnh, lượng tử hoá), không theo
 * toạ độ điểm cắt: đỉnh trùng vị trí nhưng khác chỉ số (đường may pháp tuyến) vẫn
 * nối được. Vòng không khép (lưới hở, cạnh không đa tạp) bị bỏ — thà thiếu nắp
 * còn hơn tô tràn. Vòng nằm trong số lẻ vòng khác là LỖ (chất trắng quanh chất xám).
 */

/** Một vòng kín trên mặt cắt, toạ độ (x, z). */
export type SectionLoop = Vector2[];

export type SectionCap = {
  /** x, y, z liên tiếp — mọi đỉnh ở cao độ `y`. */
  positions: Float32Array;
  indices: Uint32Array;
  loops: number;
};

const Q = 1e6;
const vkey = (p: ArrayLike<number>, i: number) =>
  `${Math.round(p[i * 3] * Q)},${Math.round(p[i * 3 + 1] * Q)},${Math.round(p[i * 3 + 2] * Q)}`;

/** Các vòng giao của lưới với mặt y = `y`. */
export function sectionLoops(positions: ArrayLike<number>, index: ArrayLike<number>, y: number): SectionLoop[] {
  const point = new Map<string, Vector2>();
  const links = new Map<string, string[]>();
  const edgeAt = (a: number, b: number) => {
    const ka = vkey(positions, a);
    const kb = vkey(positions, b);
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (!point.has(key)) {
      const ya = positions[a * 3 + 1];
      const t = (y - ya) / (positions[b * 3 + 1] - ya);
      point.set(
        key,
        new Vector2(
          positions[a * 3] + t * (positions[b * 3] - positions[a * 3]),
          positions[a * 3 + 2] + t * (positions[b * 3 + 2] - positions[a * 3 + 2]),
        ),
      );
    }
    return key;
  };
  const link = (a: string, b: string) => {
    if (a === b) return;
    (links.get(a) ?? links.set(a, []).get(a)!).push(b);
    (links.get(b) ?? links.set(b, []).get(b)!).push(a);
  };
  for (let t = 0; t + 2 < index.length; t += 3) {
    const cross: string[] = [];
    for (let e = 0; e < 3; e++) {
      const a = index[t + e];
      const b = index[t + ((e + 1) % 3)];
      // Nửa mở [y, ∞): đỉnh nằm đúng trên mặt chỉ thuộc một phía, không sinh đoạn suy biến.
      if (positions[a * 3 + 1] >= y !== positions[b * 3 + 1] >= y) cross.push(edgeAt(a, b));
    }
    if (cross.length === 2) link(cross[0], cross[1]);
  }

  const loops: SectionLoop[] = [];
  const used = new Set<string>();
  for (const start of links.keys()) {
    if (used.has(start)) continue;
    const loop = [start];
    used.add(start);
    let prev = "";
    let cur = start;
    let closed = false;
    for (;;) {
      const nb = links.get(cur)!;
      // Không đa tạp (lưới chất trắng ZA có chỗ chữ T): bỏ cả vòng. Thử đi tiếp nhánh chưa
      // dùng thì ra vòng 16/154 điểm — nắp sai hình, tệ hơn không có nắp.
      if (nb.length !== 2) break;
      const next = nb[0] === prev ? nb[1] : nb[0];
      if (next === start) {
        closed = true;
        break;
      }
      if (used.has(next)) break;
      used.add(next);
      loop.push(next);
      prev = cur;
      cur = next;
    }
    if (closed && loop.length >= 3) loops.push(loop.map((k) => point.get(k)!));
  }
  return loops;
}

const inside = (p: Vector2, poly: SectionLoop) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};

/** Nắp tam giác hoá ở cao độ `y`, hoặc null nếu lưới không cắt thành vòng kín nào. */
export function sectionCap(positions: ArrayLike<number>, index: ArrayLike<number>, y: number): SectionCap | null {
  const loops = sectionLoops(positions, index, y);
  if (!loops.length) return null;
  const area = loops.map((l) => Math.abs(ShapeUtils.area(l)));
  const depth = loops.map((l, i) => loops.reduce((n, o, j) => (j !== i && inside(l[0], o) ? n + 1 : n), 0));
  const pos: number[] = [];
  const idx: number[] = [];
  loops.forEach((outer, i) => {
    if (depth[i] % 2) return;
    // Lỗ của vòng này: sâu hơn đúng một bậc, nằm trong nó.
    const holes = loops.filter((h, j) => depth[j] === depth[i] + 1 && area[j] < area[i] && inside(h[0], outer));
    const contour = ShapeUtils.isClockWise(outer) ? [...outer].reverse() : outer;
    const hs = holes.map((h) => (ShapeUtils.isClockWise(h) ? h : [...h].reverse()));
    const base = pos.length / 3;
    for (const p of [contour, ...hs].flat()) pos.push(p.x, y, p.y);
    // Ngược chiều tam giác của ShapeUtils: vòng CCW trên (x, z) cho pháp tuyến hướng −y; nắp
    // nhìn từ trên phải hướng +y, không thì lượt bối cảnh (FrontSide) cull mất nó.
    for (const tri of ShapeUtils.triangulateShape(contour, hs)) idx.push(base + tri[0], base + tri[2], base + tri[1]);
  });
  if (!idx.length) return null;
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx), loops: loops.length };
}
