import type { SystemId } from "./anatomy";
import { SYSTEM_VIEWS, isSystemView, isUsableView, viewById, viewKind, viewParts, type AtlasViewDef } from "./views";

/*
 * ## Hệ → Góc nhìn giải phẫu → Cấu trúc (2026-09-30)
 *
 * Lớp đọc (adapter) trên registry `views.ts`, không phải dữ liệu thứ hai. Registry
 * giữ nguyên ba `kind` cũ để mọi `?view=` đã phát hành vẫn chạy; ở đây chúng được
 * đọc lại thành mô hình người học dùng:
 *
 *   AnatomicalSystem  = các góc nhìn cùng `systemId`
 *   AnatomicalView    = `kind` overview (thẻ lớn) hoặc group (lưới)
 *   AnatomicalStructure = `kind` structure — một tập mảnh có tên
 *   mảnh              = mã trong atlas.json / bản bổ sung (không GLB riêng)
 *
 * **Cấu trúc của một góc nhìn không khai báo tay** — rút từ tập mảnh: mọi cấu trúc
 * mà mảnh của nó nằm trọn trong tập nổi bật của góc nhìn, giữ cấu trúc LỚN nhất
 * (phổi phải thắng ba thuỳ của nó). Một cấu trúc vì vậy dùng lại ở mọi góc nhìn
 * chứa nó mà không phải chép danh sách. Mảnh nổi bật không thuộc cấu trúc nào gom
 * vào hàng "Phần còn lại" — ẩn/hiện luôn phủ đủ những gì đang vẽ. Góc nhìn không
 * có cấu trúc nào khớp (tổng quan tim, nội tiết) thì không có bảng.
 */

export type LocalizedName = { vi: string; en: string };

export type AnatomicalStructure = {
  /** Id góc nhìn cấp cấu trúc; hàng "Phần còn lại" là `<view id>:rest`. */
  id: string;
  name: LocalizedName | null;
  /** Mã mảnh — chỉ phần nằm trong tập nổi bật của góc nhìn đang mở. */
  parts: readonly string[];
  rest?: boolean;
};

export type AnatomicalView = {
  def: AtlasViewDef;
  usable: boolean;
};

export type AnatomicalSystem = {
  systemId: SystemId;
  overview: AnatomicalView | null;
  views: AnatomicalView[];
};

const asView = (def: AtlasViewDef): AnatomicalView => ({ def, usable: isUsableView(def.id) });

/** Hệ có góc nhìn giải phẫu (theo thứ tự registry), dạng đã chuẩn hoá. */
export function anatomicalSystem(systemId: SystemId): AnatomicalSystem | null {
  const defs = SYSTEM_VIEWS.filter((v) => v.systemId === systemId);
  if (defs.length === 0) return null;
  const overview = defs.find((v) => viewKind(v) === "overview");
  return {
    systemId,
    overview: overview ? asView(overview) : null,
    views: defs.filter((v) => viewKind(v) === "group").map(asView),
  };
}

const STRUCTURES = SYSTEM_VIEWS.filter((v) => viewKind(v) === "structure" && isUsableView(v.id));
const cache = new Map<string, readonly AnatomicalStructure[]>();

/** Cấu trúc của một góc nhìn theo hệ (bảng "Cấu trúc"); rỗng = không có bảng. */
export function viewStructures(viewId: string | null | undefined): readonly AnatomicalStructure[] {
  if (!viewId) return [];
  const hit = cache.get(viewId);
  if (hit) return hit;
  const def = viewById(viewId);
  const parts = viewParts(viewId);
  let out: AnatomicalStructure[] = [];
  if (def && parts && isSystemView(def)) {
    const focus = new Set(parts.focus);
    const candidates = STRUCTURES.filter((s) => s.id !== viewId)
      .map((s) => ({ def: s, parts: viewParts(s.id)?.focus ?? [] }))
      .filter((c) => c.parts.length > 0 && c.parts.every((id) => focus.has(id)));
    // Lớn trước: cấu trúc nằm trọn trong một cấu trúc đã giữ thì bỏ (kể cả trùng hẳn).
    const kept: typeof candidates = [];
    for (const c of [...candidates].sort((a, b) => b.parts.length - a.parts.length)) {
      if (!kept.some((k) => c.parts.every((id) => k.parts.includes(id)))) kept.push(c);
    }
    // Hiện theo thứ tự registry (tác giả xếp từ trên xuống), không theo cỡ.
    out = candidates
      .filter((c) => kept.includes(c))
      .map((c) => ({ id: c.def.id, name: c.def.name, parts: c.parts }));
    // Chính góc nhìn cấp cấu trúc mà không chia nhỏ được: một hàng là nó.
    if (out.length === 0 && viewKind(def) === "structure") {
      out = [{ id: def.id, name: def.name, parts: parts.focus }];
    }
    if (out.length > 0) {
      const covered = new Set(out.flatMap((s) => s.parts));
      const rest = parts.focus.filter((id) => !covered.has(id));
      if (rest.length > 0) out.push({ id: `${viewId}:rest`, name: null, parts: rest, rest: true });
    }
  }
  cache.set(viewId, out);
  return out;
}
