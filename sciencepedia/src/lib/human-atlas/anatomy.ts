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
  // Xanh rõ hơn trên nền gần đen (#527c9f cũ chìm thành xám); vẫn trầm, không cyan.
  // Xanh bão hoà hơn bản cũ (#4a86c5): qua ACES trên nền gần đen, bản cũ ngả xám.
  venous: "#3c83d6",
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

/**
 * Mọi hệ bật khi mở trang — KỂ CẢ bề mặt cơ thể (đổi 2026-09-29).
 *
 * Bản gốc tắt da và vẽ nó như kính mờ 10%, nên slider ở 0% ("Nguyên khối")
 * lại cho thấy thẳng cơ và xương. Nay da là lớp ngoài cùng, đục: mở trang là
 * một cơ thể nguyên vẹn; kéo slider mới bóc dần vào trong (`layerOpacity`).
 */
export const DEFAULT_VISIBLE: SystemId[] = [...SYSTEM_IDS];

// ---------------------------------------------------------------- các lớp

/**
 * Lớp giải phẫu, từ ngoài vào trong. Slider "Tách các lớp" bóc theo thứ tự
 * này; bật/tắt từng HỆ vẫn độc lập với nó (tắt một hệ là ẩn hẳn, slider chỉ
 * điều chỉnh độ đậm của những hệ đang bật).
 */
export const LAYERS = ["surface", "muscle", "skeleton", "organs", "vascular", "nervous"] as const;
export type AnatomyLayer = (typeof LAYERS)[number];

export const SYSTEM_LAYER: Record<SystemId, AnatomyLayer> = {
  integumentary: "surface",
  muscular: "muscle",
  // Gân, dây chằng, màng đi cùng cơ — bóc cùng lượt với cơ.
  connective: "muscle",
  skeletal: "skeleton",
  cardiac: "organs",
  sensory: "organs",
  respiratory: "organs",
  digestive: "organs",
  urinary: "organs",
  lymphatic: "organs",
  endocrine: "organs",
  reproductive: "organs",
  arterial: "vascular",
  venous: "vascular",
  nervous: "nervous",
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Độ đậm của một lớp theo vị trí slider `s` (0–1):
 *
 *   0–20%   bề mặt cơ thể mờ dần
 *   20–45%  lộ hệ cơ
 *   45–65%  cơ mờ dần, lộ xương và các cấu trúc sâu
 *   65–85%  nội tạng, mạch, thần kinh tách nhẹ ra khỏi nhau (`peelToExplode`)
 *   85–100% tách hẳn thành lưới; cơ hiện lại để lưới đủ mọi hệ đang bật
 *
 * Mượt, không bật/tắt: mọi mốc đi qua smoothstep.
 */
export function layerOpacity(layer: AnatomyLayer, s: number): number {
  if (layer === "surface") return 1 - smooth(0, 0.2, s);
  if (layer === "muscle") return Math.max(1 - smooth(0.45, 0.65, s), smooth(0.85, 0.92, s));
  return 1;
}

/**
 * Slider → độ tách KHÔNG GIAN mà cảnh vẫn dùng (0 nguyên khối … 0,45 toả ra …
 * 1 lưới). Nguyên khối suốt nửa đầu slider — phần đó là bóc lớp, không tách.
 * Mọi ngưỡng cũ của giao diện (khoá góc nhìn, tắt tự xoay) đọc qua hàm này.
 */
export function peelToExplode(s: number): number {
  if (s <= 0.65) return 0;
  if (s <= 0.85) return ((s - 0.65) / 0.2) * 0.45;
  return 0.45 + ((s - 0.85) / 0.15) * 0.55;
}

/**
 * Vị trí slider người đọc kéo → vị trí trên thang bóc lớp ở trên, theo các lớp
 * ĐANG BẬT. Thang đầy đủ dành 65% đầu cho da và cơ; chỉ bật hệ xương mà dùng
 * thang ấy thì kéo tới 64% không có gì xảy ra (báo lỗi 2026-09-29). Nên:
 *   có cơ (hoặc mô liên kết)  → thang đầy đủ
 *   chỉ có da, không có cơ    → 0–20% bóc da, 20–100% tách
 *   không da, không cơ        → cả slider là tách
 * Mọi chỗ đọc thang (độ đậm, độ tách, ngưỡng giao diện) phải đi qua hàm này.
 */
export function effectivePeel(s: number, visible: readonly SystemId[]): number {
  const muscle = visible.some((id) => SYSTEM_LAYER[id] === "muscle");
  if (muscle) return s;
  const surface = visible.includes("integumentary");
  if (surface) return s <= 0.2 ? s : 0.65 + ((s - 0.2) / 0.8) * 0.35;
  return 0.65 + s * 0.35;
}

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
      /** Nhóm màu định sẵn (mảnh bổ sung); mảnh BodyParts3D tra `part-groups.generated.json`. */
      group: z.string().optional(),
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
  /** Bộ đếm nút phóng to / thu nhỏ / vừa khung — cảnh so với lần trước để biết bấm nút nào. */
  zoomIn?: number;
  zoomOut?: number;
  fitFrame?: number;
  /** Góc nhìn đang áp (`views.ts`) — thay tập hệ bằng tập mảnh của góc nhìn. */
  viewId?: string | null;
  /**
   * Mảnh người đọc ẩn bằng bảng "Cấu trúc" của góc nhìn `viewId`. Gắn với góc
   * nhìn chứ không đứng riêng: rời hay đổi góc nhìn là tự hết hiệu lực, không
   * phải nhớ xoá ở từng lối ra.
   */
  hiddenIn?: { viewId: string; parts: readonly string[] } | null;
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
  /*
   * Audit 2026-09-29 (chuỗi is-a FMA, không theo tên): chín "Hepatovenous
   * segment II–IX" là PHÂN THUỲ NHU MÔ GAN (FMA: Organ segment), tám trong số
   * đó nằm trong chính khái niệm Gan FMA7197 của BodyParts3D — bộ phân loại gốc
   * khớp chữ "venous". Hậu quả kép: "chỉ tĩnh mạch" hiện một khối gan xanh ở bụng
   * trên, còn "chỉ tiêu hoá" thì gan gần như không có nhu mô.
   */
  FMA15739: "digestive", // Hepatovenous segment II
  FMA15741: "digestive", // III
  FMA15742: "digestive", // IV
  FMA15743: "digestive", // V
  FMA15744: "digestive", // VI
  FMA15745: "digestive", // VII
  FMA15746: "digestive", // VIII
  FMA15747: "digestive", // IX
  /*
   * Mạc treo là PHÚC MẠC (FMA: Region of peritoneum), không phải ống tiêu hoá.
   * Mạc treo ruột non (45.140 đỉnh — mảnh lớn nhất hệ) phủ kín ~55 quai hỗng
   * tràng/hồi tràng có sẵn, thành "một mảng lớn" giữa khung đại tràng. Chuyển
   * sang nhóm mô liên kết (màng) — vẫn bật được, chỉ không che ruột khi xem
   * riêng hệ tiêu hoá.
   */
  FMA14643: "connective", // Mesentery of small intestine
  FMA14647: "connective", // Transverse mesocolon
  FMA16549: "connective", // Mesoappendix
  /*
   * Audit 2026-09-29: 14 CƠ nằm trong hệ xương của atlas.json — bật riêng "Hệ
   * xương" là hiện cơ chày trước/sau, ba cơ mác ở cẳng chân, cơ dưới vai và cơ
   * nâng vai ở vai.
   */
  FMA22554: "muscular", // Right fibularis brevis
  FMA22555: "muscular", // Left fibularis brevis
  FMA22552: "muscular", // Right fibularis longus
  FMA22553: "muscular", // Left fibularis longus
  FMA22550: "muscular", // Right fibularis tertius
  FMA22551: "muscular", // Left fibularis tertius
  FMA22544: "muscular", // Right tibialis anterior
  FMA22545: "muscular", // Left tibialis anterior
  FMA65018: "muscular", // Right tibialis posterior
  FMA65019: "muscular", // Left tibialis posterior
  FMA13414: "muscular", // Right subscapularis
  FMA13415: "muscular", // Left subscapularis
  FMA32540: "muscular", // Right levator scapulae
  FMA32541: "muscular", // Left levator scapulae
  // Dải chậu chày là MẠC (chỗ dày lên của mạc đùi), không phải cơ — cùng nhóm
  // màng với mạc treo ở trên.
  FMA58776: "connective", // Right iliotibial tract
  FMA58777: "connective", // Left iliotibial tract
  // Đám rối mạch mạc: tổ tiên FMA "Region of wall of ventricular system of
  // neuraxis" — thành não thất, thuộc thần kinh trung ương, không phải giác quan.
  FMA61934: "nervous", // Choroid plexus of cerebral hemisphere (2 mảnh)
};

// ------------------------------------------------------------ nhóm cơ quan

/**
 * Màu theo NHÓM cơ quan trong một hệ (`part-groups.generated.json`, sinh bởi
 * `scripts/anatomy-groups.ts` từ chuỗi is-a FMA). Hệ không có nhóm dùng màu
 * hệ. Bảng màu y khoa trầm, không neon: đủ để tách gan khỏi ruột, não khỏi
 * dây thần kinh, trên nền gần đen.
 */
export const GROUP_COLORS: Record<string, string> = {
  "digestive.esophagus": "#b9726c",
  "digestive.stomach": "#cc8b86",
  "digestive.small_intestine": "#dca596",
  "digestive.large_intestine": "#b77f78",
  "digestive.liver": "#7c3b33",
  "digestive.biliary": "#7f8b4b",
  "digestive.pancreas": "#c9a86a",
  "digestive.oral": "#c7867e",
  "nervous.brain": "#caa1a9",
  "nervous.brainstem": "#d6b3ad",
  "nervous.cerebellum": "#bf98a3",
  "nervous.ventricles": "#8fa9bd",
  "nervous.meninges": "#b5acae",
  "nervous.nerve": "#d9b25c",
  // Tuỷ sống (Z-Anatomy): hồng nhạt cùng họ với não — trung ương khác ngoại biên.
  "nervous.spinal_cord": "#d8aeb0",
  // Bạch huyết: cơ quan dạng lympho mỗi thứ một màu, không cùng một màu hệ.
  // Bề mặt: da ấm, tóc/lông nâu sẫm, môi hồng trầm — trước đây cả năm mảnh
  // cùng một màu, tóc trông như da đầu trọc.
  // Hồng ấm theo ảnh atlas tham chiếu (bản trước #c49a80 qua ACES ngả vàng nhạt).
  "integumentary.skin": "#c08672",
  "integumentary.hair": "#3f2c20",
  "integumentary.lip": "#a86d62",
  // Tai ngoài là da + sụn: cùng tông da, không lấy màu xanh xám của hệ giác quan.
  "sensory.ear": "#c49a80",
  "sensory.sclera": "#e6e0d6",
  "sensory.iris": "#5b3e2b",
  // Hô hấp: nhu mô phổi hồng tím, sụn khí–phế quản trắng ngà như ảnh atlas; hầu là cơ.
  "respiratory.lung": "#b98b93",
  "respiratory.airway": "#dcd8d2",
  "respiratory.larynx": "#c98a80",
  "respiratory.nose": "#cfb2a8",
  "respiratory.pharynx": "#a85b50",
  // Tiết niệu: thận đỏ nâu, niệu quản vàng nhạt, bàng quang hồng.
  "urinary.kidney": "#8f3f36",
  "urinary.ureter": "#d8c79c",
  "urinary.bladder": "#c98d85",
  "urinary.urethra": "#b86d63",
  // Nội tiết: giáp đỏ sẫm, thượng thận và cận giáp vàng, tuyến yên/tùng hồng nhạt.
  "endocrine.thyroid": "#a3483f",
  "endocrine.parathyroid": "#cfa75a",
  "endocrine.adrenal": "#cfa65c",
  "endocrine.pituitary": "#c99a92",
  "endocrine.pineal": "#bb9a8a",
  "lymphatic.spleen": "#8a4d5c",
  "lymphatic.thymus": "#c8a88f",
  // Mạng UMCG: mạch xanh lục vừa, hạch sáng hơn một bậc — đọc được trên nền gần
  // đen mà không neon, và tách hạch khỏi mạch bằng độ sáng lẫn hình dạng.
  "lymphatic.vessel": "#5f9440",
  "lymphatic.node": "#8cc163",
};

/**
 * Mảnh không đưa lên trình xem. Lông mu (FMA54319): khối lởm chởm của lượt dựng
 * gốc, không mang thông tin giải phẫu gì cho người học — chủ sản phẩm yêu cầu bỏ
 * (2026-09-29). Bỏ khỏi cả danh mục lẫn khái niệm, nên không tìm ra, không đếm.
 */
const DROPPED_CONCEPTS = new Set(["FMA54319"]);

export function correctSystems(atlas: Atlas): Atlas {
  const dropped = new Set(atlas.parts.filter((p) => DROPPED_CONCEPTS.has(p.conceptId)).map((p) => p.id));
  if (dropped.size) {
    atlas.parts = atlas.parts.filter((p) => !dropped.has(p.id));
    atlas.concepts = atlas.concepts
      .map((c) => ({ ...c, elements: c.elements.filter((id) => !dropped.has(id)) }))
      .filter((c) => c.elements.length > 0);
  }
  for (const part of atlas.parts) {
    const fixed = SYSTEM_CORRECTIONS[part.conceptId];
    if (fixed) part.system = fixed;
  }
  return atlas;
}
