/**
 * Mô tả cấp NHÓM: mảnh không có mô tả riêng (nhánh mạch, từng hạch, từng hồi não)
 * mượn mô tả của nhóm cấu trúc chứa nó — góc nhìn kind "structure" ("Động mạch vành").
 *
 * Bảng `group-descriptions.generated.json` do `scripts/atlas-group-descriptions.ts`
 * sinh và CHỈ chứa mục đã qua science-editor (đúng cho cả nhóm, không chỉ một thành
 * viên). Bảng chi tiết hiện nó trong khung riêng "Về nhóm", không đặt thẳng dưới tên
 * mảnh — cùng lý do với khung mô tả hệ.
 */
import GROUPS from "./group-descriptions.generated.json";
import { ATLAS_VIEWS, viewKind, viewParts } from "./views";

export type GroupDescription = {
  viewId: string;
  name: { vi: string; en: string };
  /** Bản Việt đã duyệt. */
  text: string;
  /** Bài nguồn để ghi công (CC BY-SA). */
  title: string;
  url: string;
  /**
   * Bản tiếng Anh đã duyệt (nguyên văn bài en). Không có thì bản tiếng Anh của
   * site KHÔNG dùng mô tả nhóm — lùi về mô tả hệ, không hiện câu tiếng Việt.
   */
  en?: { text: string; title: string; url: string };
};

const MAP = GROUPS as Record<string, { text: string; title: string; url: string; en?: { text: string; title: string; url: string } }>;

// Mảnh → nhóm có mô tả. Dựng một lần, chỉ cho nhóm có mục (vài trăm mảnh).
let index: Map<string, string> | null = null;
function partIndex(): Map<string, string> {
  if (index) return index;
  index = new Map();
  for (const v of ATLAS_VIEWS) {
    if (viewKind(v) !== "structure" || !MAP[v.id]) continue;
    for (const p of viewParts(v.id)?.focus ?? []) if (!index.has(p)) index.set(p, v.id);
  }
  return index;
}

/** Mô tả nhóm của mảnh đầu tiên thuộc một nhóm có mô tả. */
export function groupDescription(partIds: readonly string[]): GroupDescription | null {
  const idx = partIndex();
  for (const p of partIds) {
    const viewId = idx.get(p);
    if (!viewId) continue;
    const view = ATLAS_VIEWS.find((v) => v.id === viewId)!;
    return { viewId, name: view.name, ...MAP[viewId] };
  }
  return null;
}
