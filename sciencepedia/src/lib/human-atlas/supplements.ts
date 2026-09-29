import type { Atlas } from "./anatomy";
import umcgLymphatic from "./supplements/umcg-lymphatic.json";

/*
 * ## Phần bổ sung ngoài BodyParts3D (2026-09-29)
 *
 * BodyParts3D 4.0 chỉ có 3 cấu trúc bạch huyết (lách, hai thuỳ tuyến ức).
 * Mạng mạch + hạch bạch huyết đến từ mô hình UMCG (CC BY-NC-SA 4.0), đã căn
 * về đúng hệ toạ độ BodyParts3D bằng đo đạc — xem `scripts/import-umcg-lymphatic.ts`.
 *
 * Nó đi vào CÙNG danh mục với BodyParts3D (thêm một khối hình học, thêm mảnh
 * và khái niệm), không thành một cảnh riêng: nhờ vậy tìm kiếm, chọn, ẩn, xem
 * riêng, góc nhìn và tách lớp đều chạy y như mảnh gốc. Manifest nhỏ (vài KB)
 * nằm trong bundle; khối hình học trên R2, tải song song với các khối khác.
 */

type Supplement = {
  source: string;
  license: string;
  chunk: Atlas["chunks"][number];
  parts: (Omit<Atlas["parts"][number], "chunk"> & { nameVi: string })[];
  concepts: Atlas["concepts"];
};

export const SUPPLEMENTS = [umcgLymphatic as unknown as Supplement];

/** Tên tiếng Việt của mảnh bổ sung, tra theo tên tiếng Anh (tên nhóm, không phải tên khái niệm). */
export const SUPPLEMENT_NAMES_VI: Record<string, string> = Object.fromEntries(
  SUPPLEMENTS.flatMap((s) => s.parts.map((p) => [p.name, p.nameVi])),
);

/** Mảnh không phải BodyParts3D → nguồn của nó (để bảng chi tiết dẫn đúng nơi). */
export const SUPPLEMENT_SOURCE: Record<string, string> = Object.fromEntries(
  SUPPLEMENTS.flatMap((s) => s.parts.map((p) => [p.id, s.source])),
);

/** Nối phần bổ sung vào danh mục đã sửa phân loại. Không đổi mảnh gốc. */
export function withSupplements(atlas: Atlas): Atlas {
  const chunks = [...atlas.chunks];
  const parts = [...atlas.parts];
  const concepts = atlas.concepts.map((c) => ({ ...c, elements: [...c.elements] }));
  for (const s of SUPPLEMENTS) {
    const chunk = chunks.length;
    chunks.push(s.chunk);
    for (const { nameVi: _vi, ...p } of s.parts) parts.push({ ...p, chunk });
    for (const c of s.concepts) {
      const existing = concepts.find((x) => x.id === c.id);
      if (existing) existing.elements.push(...c.elements);
      else concepts.push({ ...c, elements: [...c.elements] });
    }
  }
  return { ...atlas, chunks, parts, concepts };
}
