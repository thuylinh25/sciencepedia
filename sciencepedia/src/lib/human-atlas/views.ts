import type { SystemId } from "./anatomy";
import resolved from "./view-parts.generated.json";

/*
 * ## Góc nhìn (Views) — dữ liệu, không JSX riêng mỗi góc
 *
 * Góc nhìn theo vùng như "Regional Views" của các atlas giải phẫu: hiện MỌI
 * hệ trừ da (chủ sản phẩm chốt 2026-09-29 — góc nhìn là để thấy các hệ nằm
 * cạnh nhau ở một vùng), camera nhìn theo `direction` rồi tự khung theo hộp
 * bao của tập `focus` — không toạ độ camera viết tay. `hide` ẩn thêm những
 * gì che mất thứ góc nhìn muốn cho thấy (cơ phủ lồng ngực, vòm sọ và não
 * che nền sọ).
 *
 * Quy tắc chọn mảnh viết bằng tên (tiếng Anh của BodyParts3D) ở đây, nhưng
 * viewer KHÔNG chạy regex: `scripts/atlas-views.ts` đối chiếu quy tắc với
 * `atlas.json` thật và ghi mã mảnh ra `view-parts.generated.json`. Quy tắc nào
 * không khớp mảnh nào thì script báo lỗi — không có mã mảnh nào được bịa.
 * Sửa quy tắc là PHẢI chạy lại script (`--write`).
 *
 * Góc nhìn thiếu dữ liệu để dựng đúng thì mang `missing` (nói thiếu gì) và
 * không có quy tắc: thẻ hiện nhưng không bấm được. Không dựng bù bằng mảnh
 * gần giống.
 */

export type ViewDirection = "front" | "back" | "side" | "three-quarter" | readonly [number, number, number];

export type PartRule = {
  /** Giới hạn trong các hệ này (sau `correctSystems`). Bỏ trống = mọi hệ. */
  systems?: readonly SystemId[];
  name: RegExp;
  exclude?: RegExp;
};

export type AtlasViewDef = {
  id: string;
  systemId: SystemId;
  name: { vi: string; en: string };
  direction: ViewDirection;
  /** Mảnh camera khung vào. */
  focus?: readonly PartRule[];
  /** Mảnh ẩn thêm (ngoài da). */
  hide?: readonly PartRule[];
  /** Có mặt = không dựng được với dữ liệu hiện có; nói thiếu gì. */
  missing?: { vi: string; en: string };
};

/** Cơ BodyParts3D xếp nhầm vào hệ xương — không cho vào tập xương. */
const NOT_BONE = /tibialis|fibularis|iliotibial|subscapularis|levator scapulae/i;
const SKELETAL = ["skeletal"] as const;
const VERTEBRAE = /vertebra|^atlas$|^axis$|intervertebral disk|^sacrum$/i;
const SKULL = /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|ethmoid|zygomatic|maxilla|nasal bone|palatine bone|vomer|mandible|tooth|gingiva/i;
const RIB_CAGE = /\brib\b|costal cartilage|manubrium|body of sternum|xiphoid|thoracic vertebra/i;
/** Mọi cơ — kể cả mấy cơ bị xếp nhầm sang hệ xương. */
const MUSCLES: readonly PartRule[] = [
  { systems: ["muscular"], name: /./ },
  { systems: SKELETAL, name: NOT_BONE },
];

export const ATLAS_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "skeleton-full",
    systemId: "skeletal",
    name: { vi: "Toàn bộ", en: "Full body" },
    direction: "front",
    focus: [{ systems: SKELETAL, name: /./, exclude: NOT_BONE }],
  },
  {
    id: "skull",
    systemId: "skeletal",
    name: { vi: "Hộp sọ", en: "Skull" },
    direction: "three-quarter",
    focus: [{ systems: SKELETAL, name: SKULL }],
    hide: MUSCLES,
  },
  {
    id: "cranial-base",
    systemId: "skeletal",
    name: { vi: "Nền sọ", en: "Cranial base" },
    // Từ trên xuống, hơi từ trước: nhìn vào sàn hộp sọ khi vòm sọ và não đã bỏ.
    direction: [0, 1, 0.35],
    focus: [{ systems: SKELETAL, name: /occipital bone|sphenoid|temporal bone|ethmoid/i }],
    hide: [
      { systems: SKELETAL, name: /parietal bone|frontal bone/i },
      { systems: ["nervous"], name: /./ },
      ...MUSCLES,
    ],
  },
  {
    id: "teeth-vessels",
    systemId: "skeletal",
    name: { vi: "Răng và mạch máu", en: "Teeth and blood supply" },
    direction: "front",
    missing: {
      vi: "BodyParts3D 4.0 không có động mạch hàm trên, động mạch huyệt răng dưới hay động mạch mặt — chỉ có động mạch cảnh chung/trong.",
      en: "BodyParts3D 4.0 has no maxillary, inferior alveolar or facial arteries — only the common and internal carotids.",
    },
  },
  {
    id: "thoracic-cage",
    systemId: "skeletal",
    name: { vi: "Lồng ngực", en: "Thoracic cage" },
    direction: "three-quarter",
    focus: [{ systems: SKELETAL, name: RIB_CAGE }],
    hide: MUSCLES,
  },
  {
    id: "thoracic-cavity",
    systemId: "skeletal",
    name: { vi: "Khoang ngực", en: "Thoracic cavity" },
    direction: "front",
    // Phổi trong bộ dữ liệu chỉ có cây phế quản — không có nhu mô, màng phổi.
    focus: [
      { systems: ["cardiac"], name: /./ },
      { systems: ["respiratory"], name: /trachea|bronch/i },
      {
        systems: ["arterial", "venous"],
        name: /arch of aorta|ascending aorta|descending thoracic aorta|pulmonary trunk|pulmonary artery|pulmonary vein|superior vena cava|brachiocephalic/i,
      },
    ],
    // Mở mặt trước: bỏ cơ và xương ức + sụn sườn để thấy tim, phế quản bên trong.
    hide: [{ systems: SKELETAL, name: /costal cartilage|manubrium|body of sternum|xiphoid/i }, ...MUSCLES],
  },
  {
    id: "pelvic-girdle",
    systemId: "skeletal",
    name: { vi: "Đai chậu", en: "Pelvic girdle" },
    direction: "front",
    focus: [{ systems: SKELETAL, name: /hip bone|^sacrum$/i }],
    hide: MUSCLES,
  },
  {
    id: "pelvis-section",
    systemId: "skeletal",
    name: { vi: "Mặt cắt vùng chậu", en: "Pelvic section" },
    direction: "side",
    missing: {
      vi: "Cần mặt phẳng cắt (clipping) để bổ đôi xương chậu — trình xem chưa có. Bộ dữ liệu cũng thiếu xương cụt.",
      en: "Needs a clipping plane to section the pelvis — not in the viewer yet. The dataset also lacks the coccyx.",
    },
  },
  {
    id: "spine-lateral",
    systemId: "skeletal",
    name: { vi: "Cột sống nhìn bên", en: "Spine, lateral view" },
    direction: "side",
    focus: [{ systems: SKELETAL, name: VERTEBRAE }],
    hide: MUSCLES,
  },
  {
    id: "spine-muscles",
    systemId: "skeletal",
    name: { vi: "Cột sống và cơ", en: "Spine and muscles" },
    direction: "back",
    focus: [
      { systems: SKELETAL, name: VERTEBRAE },
      {
        systems: ["muscular"],
        name: /iliocostalis|longissimus|spinalis|semispinalis|splenius|interspinal|intertransversari/i,
      },
    ],
  },
  {
    id: "shoulder-girdle",
    systemId: "skeletal",
    name: { vi: "Đai vai", en: "Shoulder girdle" },
    direction: "three-quarter",
    focus: [{ systems: SKELETAL, name: /(clavicle|scapula)$/i }],
    hide: MUSCLES,
  },
  {
    id: "axilla",
    systemId: "skeletal",
    name: { vi: "Vùng nách", en: "Axilla" },
    // Nách phải (x âm), nhìn chếch từ trước-ngoài.
    direction: [-0.75, 0.12, 0.65],
    focus: [
      {
        systems: ["arterial", "venous"],
        name: /^right (axillary|subclavian|lateral thoracic|subscapular|circumflex scapular|(anterior|posterior) circumflex humeral) (artery|vein)$/i,
      },
      {
        systems: ["muscular", "skeletal"],
        name: /^right (pectoralis minor|subscapularis|serratus anterior|teres major|coracobrachialis)$/i,
      },
    ],
    // Cơ ngực lớn phủ kín hố nách từ phía trước.
    hide: [{ systems: ["muscular"], name: /pectoralis major/i }],
  },
];

export type ViewParts = { focus: string[]; hide: string[] };
const PARTS = resolved as Record<string, ViewParts>;

/** Mã mảnh của một góc nhìn dựng được, hoặc null. */
export function viewParts(id: string | null | undefined): ViewParts | null {
  if (!id) return null;
  return PARTS[id] ?? null;
}

export function viewById(id: string | null | undefined): AtlasViewDef | null {
  return ATLAS_VIEWS.find((v) => v.id === id) ?? null;
}

export function isUsableView(id: string | null | undefined): boolean {
  const view = viewById(id);
  return !!view && !view.missing && !!viewParts(id);
}
