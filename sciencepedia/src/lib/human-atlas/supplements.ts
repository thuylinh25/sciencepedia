import type { Atlas } from "./anatomy";
import umcgLymphatic from "./supplements/umcg-lymphatic.json";
import smoothSkin from "./supplements/smooth-skin.json";
import smoothSphenoid from "./supplements/smooth-sphenoid.json";
import zAnatomy from "./supplements/z-anatomy.json";
import allenHra from "./supplements/allen-hra.json";
import cit168 from "./supplements/cit168.json";
import neudorfer from "./supplements/neudorfer.json";

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
  /** Mảnh BodyParts3D mà khối này THAY bằng mảnh mang mã khác (tiểu não → các tiểu thuỳ Z-Anatomy). */
  replaces?: string[];
  chunk: Atlas["chunks"][number];
  parts: (Omit<Atlas["parts"][number], "chunk"> & { nameVi?: string })[];
  /** `partOf`: mã FMA của cha, cho khái niệm ngoài FMA (`ZA-…`) kế thừa nội dung Level 2. */
  concepts: (Atlas["concepts"][number] & { partOf?: string })[];
};

/*
 * Z-Anatomy (CC BY-SA 4.0, `scripts/import-z-anatomy.ts`): dây thần kinh ngoại
 * biên, tuỷ sống, tĩnh mạch BodyParts3D không có, hạch bạch huyết CÓ TÊN.
 * Hạch của UMCG là cụm không tên suy từ hình dạng — có hạch Z-Anatomy thì bỏ,
 * không để hai bộ hạch chồng nhau. Mạch bạch huyết UMCG giữ (Z-Anatomy không có).
 */
const umcg = umcgLymphatic as unknown as Supplement;
const umcgNodes = new Set(umcg.parts.filter((p) => p.group === "lymphatic.node").map((p) => p.id));
const umcgVessels: Supplement = {
  ...umcg,
  parts: umcg.parts.filter((p) => !umcgNodes.has(p.id)),
  concepts: umcg.concepts
    .map((c) => ({ ...c, elements: c.elements.filter((id) => !umcgNodes.has(id)) }))
    .filter((c) => c.elements.length > 0),
};

// Da chia nhỏ (`scripts/smooth-skin.py`) mang CÙNG mã FJ2810 — thay da gốc.
// Xương bướm khử nhiễu + chia nhỏ (`scripts/smooth-sphenoid.py`) mang CÙNG mã FJ3394 — thay xương gốc (bản thử 2026-10-27).
// Atlas MNI (CC BY 4.0, `scripts/import-mni-atlases.ts`): nhân sâu của não. Mỗi nguồn một khối vì ghi công riêng.
export const SUPPLEMENTS = [umcgVessels, zAnatomy as unknown as Supplement, smoothSkin as unknown as Supplement, smoothSphenoid as unknown as Supplement, allenHra as unknown as Supplement, cit168 as unknown as Supplement, neudorfer as unknown as Supplement];

/** Tên tiếng Việt của mảnh bổ sung, tra theo tên tiếng Anh (tên nhóm, không phải tên khái niệm). */
export const SUPPLEMENT_NAMES_VI: Record<string, string> = Object.fromEntries(
  SUPPLEMENTS.flatMap((s) => s.parts.flatMap((p) => (p.nameVi ? [[p.name, p.nameVi]] : []))),
);

/** Mảnh không phải BodyParts3D → nguồn của nó (để bảng chi tiết dẫn đúng nơi). */
export const SUPPLEMENT_SOURCE: Record<string, string> = Object.fromEntries(
  // Da chia nhỏ và xương bướm đã xử lý vẫn là hình của BodyParts3D — nguồn giữ là mô hình gốc.
  SUPPLEMENTS.filter((s) => s.source !== "smooth-skin" && s.source !== "smooth-sphenoid").flatMap((s) => s.parts.map((p) => [p.id, s.source])),
);

/** Khái niệm bổ sung (`ZA-…`) → mã FMA của cha, để bảng chi tiết kế thừa nội dung của cha. */
export const SUPPLEMENT_PART_OF: Record<string, string> = Object.fromEntries(
  SUPPLEMENTS.flatMap((s) => s.concepts.flatMap((c) => (c.partOf ? [[c.id, c.partOf]] : []))),
);

/**
 * Nối phần bổ sung vào danh mục đã sửa phân loại. Mảnh gốc chỉ bị bỏ khi có bản thay: cùng mã (da
 * chia nhỏ) hoặc nêu trong `replaces`. `keepReplaced`: giữ mảnh gốc bị `replaces` — cho việc dựng mốc
 * căn atlas MNI (`import-mni-atlases.ts --export-bp3d` cần vỏ tiểu não BodyParts3D mà phép căn đã fit).
 */
export function withSupplements(atlas: Atlas, { keepReplaced = false }: { keepReplaced?: boolean } = {}): Atlas {
  const chunks = [...atlas.chunks];
  const replaced = new Set(SUPPLEMENTS.flatMap((s) => s.parts.map((p) => p.id)));
  const removed = new Set(keepReplaced ? [] : SUPPLEMENTS.flatMap((s) => s.replaces ?? []));
  const parts = atlas.parts.filter((p) => !replaced.has(p.id) && !removed.has(p.id));
  const concepts = atlas.concepts
    .map((c) => ({ ...c, elements: c.elements.filter((id) => !removed.has(id)) }))
    .filter((c) => c.elements.length > 0);
  for (const s of SUPPLEMENTS) {
    const chunk = chunks.length;
    chunks.push(s.chunk);
    for (const { nameVi: _vi, ...p } of s.parts) parts.push({ ...p, chunk });
    for (const { partOf: _p, ...c } of s.concepts) {
      const existing = concepts.find((x) => x.id === c.id);
      if (existing) existing.elements.push(...c.elements);
      else concepts.push({ ...c, elements: [...c.elements] });
    }
  }
  return { ...atlas, chunks, parts, concepts };
}
