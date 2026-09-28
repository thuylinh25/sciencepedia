import { z } from "zod";

/**
 * Mô hình dữ liệu của Bản đồ cơ thể người — port từ Human Atlas
 * (https://github.com/ashemag/human-atlas, MIT, © 2026 ashemag).
 *
 * Tên hệ, mô tả hệ và lời giải thích cơ quan KHÔNG nằm ở đây mà nằm trong
 * `messages/*.json` (namespace `humanAtlas`): đó là chữ hiển thị, phải đi qua
 * next-intl như mọi chữ khác của site. Ở đây chỉ giữ thứ không phải chữ —
 * mã hệ, màu vật liệu, và thứ tự.
 *
 * Mã hệ (`skeletal`, `muscular`…) là mã của bộ dữ liệu gốc, có mặt trong
 * `atlas.json`. Đừng đổi chúng thành tiếng Việt hay đặt lại tên: shader chọn
 * vật liệu theo đúng chuỗi này.
 */

export const SYSTEM_IDS = [
  "skeletal",
  "muscular",
  "cardiac",
  "sensory",
  "arterial",
  "venous",
  "nervous",
  "respiratory",
  "digestive",
  "urinary",
  "lymphatic",
  "endocrine",
  "reproductive",
  "integumentary",
  "connective",
] as const;

export type SystemId = (typeof SYSTEM_IDS)[number];

/**
 * Số mảnh của bộ dữ liệu đang phát (`HUMAN_ATLAS_DATA_VERSION`), để chữ có
 * số ngay trong HTML đầu tiên — trước khi `atlas.json` tải về. Dựng lại dữ
 * liệu thì sửa cả con số này.
 */
export const PIECE_COUNT = 2234;

/**
 * Số khái niệm có tên (`concepts` của `atlas.json`) — lớn hơn số mảnh vì
 * BodyParts3D còn có khái niệm nhóm ("vascular tree") gom nhiều mảnh. Kiểm
 * 2026-09-28 trên tệp đang phát; dựng lại dữ liệu thì sửa cùng PIECE_COUNT.
 */
export const CONCEPT_COUNT = 3432;

/**
 * Màu vật liệu của từng hệ, giữ nguyên bảng màu của bản gốc.
 *
 * Đây là màu của MÔ HÌNH, không phải màu giao diện, nên không đi qua token
 * của design system: chúng đã được chỉnh để phân biệt các hệ dưới ánh sáng
 * của cảnh, và đổi theo theme thì cùng một cơ quan mang hai màu.
 */
export const SYSTEM_COLORS: Record<SystemId, string> = {
  skeletal: "#e2d9ba",
  muscular: "#a85b50",
  cardiac: "#b96760",
  sensory: "#b0c8ce",
  arterial: "#c05245",
  venous: "#527c9f",
  nervous: "#d8b565",
  respiratory: "#b98991",
  digestive: "#b8916b",
  urinary: "#b47961",
  lymphatic: "#879f7c",
  endocrine: "#c5a09a",
  reproductive: "#bda098",
  integumentary: "#ba9b7d",
  connective: "#aec3bb",
};

/** Bề mặt cơ thể là lớp kính mờ, mặc định tắt — bật lên là che hết bên trong. */
export const DEFAULT_VISIBLE: SystemId[] = SYSTEM_IDS.filter(
  (id) => id !== "integumentary",
);

export const ORGAN_PRESET: SystemId[] = [
  "cardiac",
  "respiratory",
  "digestive",
  "urinary",
  "endocrine",
  "reproductive",
];

/**
 * Cấu trúc có lời giải thích riêng (khoá `humanAtlas.explanations.<key>`).
 * Cấu trúc khác dùng mô tả của hệ mà nó thuộc về, dưới nhãn "tổng quan về hệ"
 * để người đọc không tưởng đó là mô tả của đúng cấu trúc đang chọn.
 *
 * Khoá là mã FMA, như `names-vi.ts` và `structure-links.ts` (đổi 2026-09-28;
 * trước đó khoá theo tên tiếng Anh viết thường — tên đổi khi bộ dữ liệu dựng
 * lại, mã thì không). Giá trị là khoá tin nhắn, không phải mã: next-intl không
 * nhận dấu cách trong khoá.
 */
export const EXPLAINED: Record<string, string> = {
  FMA7088: "heart",
  FMA7197: "liver",
  FMA50801: "brain",
  FMA7148: "stomach",
  FMA7196: "spleen",
  FMA7198: "pancreas",
  FMA15900: "urinaryBladder",
  FMA7394: "trachea",
  FMA13295: "diaphragm",
};

/** Gợi ý khi ô tìm kiếm còn trống — giữ đúng danh sách của bản gốc. */
export const SUGGESTED = [
  "heart",
  "brain",
  "liver",
  "stomach",
  "spleen",
  "pancreas",
  "urinary bladder",
  "trachea",
];

// ------------------------------------------------------------- atlas.json

/**
 * `atlas.json` là dữ liệu ngoài (tải từ R2 lúc chạy) nên parse bằng Zod, theo
 * quy tắc chung của repo. Schema chỉ kiểm những trường viewer thật sự đọc.
 */
const vec3 = z.array(z.number()).length(3);

export const atlasSchema = z.object({
  version: z.string(),
  parts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      conceptId: z.string(),
      system: z.enum(SYSTEM_IDS),
      chunk: z.number().int().nonnegative(),
      positions: z.number().int().nonnegative(),
      normals: z.number().int().nonnegative(),
      indices: z.number().int().nonnegative(),
      vertexCount: z.number().int().positive(),
      indexCount: z.number().int().positive(),
      bounds: z.tuple([vec3, vec3]),
    }),
  ),
  concepts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      elements: z.array(z.string()),
    }),
  ),
  chunks: z.array(
    z.object({
      url: z.string(),
      bytes: z.number().int().positive(),
      gzip: z.string().optional(),
      gzipBytes: z.number().int().positive().optional(),
    }),
  ),
  triangles: z.number(),
});

export type Atlas = z.infer<typeof atlasSchema>;
export type Part = Atlas["parts"][number];
export type Concept = Atlas["concepts"][number];

export type View = "three-quarter" | "front" | "side" | "back";

export interface SceneState {
  inspectorOpen?: boolean;
  explode: number;
  visible: SystemId[];
  selected: string[];
  isolate: boolean;
  view: View;
  rotate: boolean;
  reset: number;
  /** Tăng lên để camera bay tới cấu trúc đang chọn (deep link, chọn từ tìm kiếm). */
  focus: number;
}

/**
 * Mảnh bị bộ dữ liệu gốc xếp nhầm hệ, khoá theo mã FMA → hệ đúng.
 *
 * Năm khoang não thất nằm trong hệ "cardiac" của `atlas.json` — bộ phân loại
 * gốc khớp chữ "ventricle" mà không phân biệt não thất với tâm thất. Hậu quả
 * không chỉ là sai tên hệ: bật riêng "Tim" thì hiện thêm mấy mảnh lơ lửng
 * trong hộp sọ, và camera khung theo hộp bao từ ngực tới đỉnh đầu nên quả tim
 * còn bằng một góc nhỏ. Sửa ở đây (lúc nạp) chứ không sửa tệp trên R2: tệp đó
 * có dấu phiên bản, dựng lại là phải tải lại 33 MB cho mọi người.
 */
const SYSTEM_CORRECTIONS: Record<string, SystemId> = {
  FMA78454: "nervous", // Third ventricle
  FMA78469: "nervous", // Fourth ventricle
  FMA75351: "nervous", // Interventricular foramen
  FMA78450: "nervous", // Left lateral ventricle
  FMA78449: "nervous", // Right lateral ventricle
};

export function correctSystems(atlas: Atlas): Atlas {
  for (const part of atlas.parts) {
    const fixed = SYSTEM_CORRECTIONS[part.conceptId];
    if (fixed) part.system = fixed;
  }
  return atlas;
}
