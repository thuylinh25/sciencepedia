import type { SystemId } from "./anatomy";
import resolved from "./view-parts.generated.json";

/*
 * ## Góc nhìn (Views) — dữ liệu, không JSX riêng mỗi góc
 *
 * Thứ tự trong mảng = thứ tự và số thứ tự trên lưới: từ đầu xuống chân.
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
  /**
   * Mặt phẳng cắt (hệ toạ độ thế giới): giữ phần có `normal · p + constant ≥ 0`,
   * bỏ phần còn lại. Mặt cắt để hở — mảnh là bề mặt, không có ruột để lấp.
   */
  clip?: { normal: readonly [number, number, number]; constant: number };
  /** Có mặt = không dựng được với dữ liệu hiện có; nói thiếu gì. */
  missing?: { vi: string; en: string };
};

const SKELETAL = ["skeletal"] as const;
const VERTEBRAE = /vertebra|^atlas$|^axis$|intervertebral disk|^sacrum$/i;
const SKULL = /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|ethmoid|zygomatic|maxilla|nasal bone|palatine bone|vomer|mandible|tooth|gingiva/i;
const RIB_CAGE = /\brib\b|costal cartilage|manubrium|body of sternum|xiphoid|thoracic vertebra/i;
const MUSCLES: readonly PartRule[] = [{ systems: ["muscular"], name: /./ }];

export const ATLAS_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "skeleton-full",
    systemId: "skeletal",
    name: { vi: "Toàn bộ", en: "Full body" },
    direction: "front",
    focus: [{ systems: SKELETAL, name: /./ }],
  },
  {
    id: "head-neck",
    systemId: "muscular",
    name: { vi: "Đầu và cổ", en: "Head and neck" },
    direction: "three-quarter",
    focus: [{ systems: SKELETAL, name: /^atlas$|^axis$|cervical vertebra|hyoid/i }, { systems: SKELETAL, name: SKULL }],
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
    // Id giữ nguyên để link cũ còn chạy. Tên KHÔNG hứa "mạch máu": BodyParts3D 4.0
    // không có động mạch hàm trên, huyệt răng dưới hay động mạch mặt — mạch gần
    // nhất có trong dữ liệu là động mạch cảnh, vẫn hiện như mọi hệ khác.
    id: "teeth-vessels",
    systemId: "skeletal",
    name: { vi: "Răng và hàm", en: "Teeth and jaws" },
    direction: [0.45, 0.05, 1],
    focus: [{ systems: SKELETAL, name: /tooth|gingiva|maxilla|mandible/i }],
    hide: MUSCLES,
  },
  {
    id: "cervical-spine",
    systemId: "skeletal",
    name: { vi: "Cột sống cổ", en: "Cervical spine" },
    direction: "side",
    focus: [{ systems: SKELETAL, name: /^atlas$|^axis$|cervical vertebra/i }],
    hide: MUSCLES,
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
        systems: ["muscular"],
        name: /^right (pectoralis minor|subscapularis|serratus anterior|teres major|coracobrachialis)$/i,
      },
    ],
    // Cơ ngực lớn phủ kín hố nách từ phía trước.
    hide: [{ systems: ["muscular"], name: /pectoralis major/i }],
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
    id: "cubital-fossa",
    systemId: "arterial",
    name: { vi: "Hố khuỷu", en: "Cubital fossa" },
    // Khuỷu phải (x âm) ở tư thế giải phẫu: mặt trước quay ra trước.
    direction: [-0.25, 0.05, 1],
    focus: [
      { systems: ["muscular"], name: /head of right pronator teres/i },
      { systems: ["venous"], name: /^right median cubital vein$/i },
    ],
  },
  {
    id: "abdomen",
    systemId: "digestive",
    name: { vi: "Bụng", en: "Abdomen" },
    direction: "front",
    focus: [
      {
        systems: ["digestive"],
        name: /stomach|duodenum|jejunum|ileum|colon|caudate lobe of liver|hepatovenous segment|pancreas|gallbladder|appendix/i,
      },
      { systems: ["lymphatic"], name: /^spleen$/i },
      { systems: ["urinary"], name: /kidney/i },
    ],
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
    id: "lumbar-spine",
    systemId: "skeletal",
    name: { vi: "Cột sống thắt lưng", en: "Lumbar spine" },
    // Chếch sau-bên: tạng ở phía trước không che thân đốt sống.
    direction: [0.8, 0.1, -0.6],
    focus: [{ systems: SKELETAL, name: /lumbar vertebra|^sacrum$/i }],
    hide: MUSCLES,
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
    // Mặt cắt dọc giữa: bỏ nửa trái (x > 0), nhìn từ bên trái vào mặt cắt. Bộ dữ
    // liệu không có xương cụt — mặt cắt dừng ở đỉnh xương cùng.
    id: "pelvis-section",
    systemId: "skeletal",
    name: { vi: "Mặt cắt vùng chậu", en: "Pelvic section" },
    direction: [1, 0.05, 0.12],
    clip: { normal: [-1, 0, 0], constant: 0 },
    focus: [
      { systems: SKELETAL, name: /^right hip bone$|^sacrum$|fifth lumbar vertebra/i },
      { systems: ["urinary"], name: /urinary bladder|urethra/i },
      { systems: ["digestive"], name: /^rectum$/i },
      { systems: ["reproductive"], name: /prostate|seminal vesicle|corpus|glans/i },
    ],
  },
  {
    id: "hip",
    systemId: "skeletal",
    name: { vi: "Hông", en: "Hip" },
    // Hông phải (x âm), chếch trước-ngoài.
    direction: [-0.7, 0.1, 0.7],
    focus: [
      { systems: SKELETAL, name: /^right hip bone$/i },
      { systems: ["muscular"], name: /^right gluteus (medius|minimus)$/i },
    ],
  },
  {
    id: "knee",
    systemId: "skeletal",
    name: { vi: "Gối", en: "Knee" },
    // Bộ dữ liệu không có sụn chêm, dây chằng chéo: khung theo bánh chè và mạch khoeo.
    direction: [-0.35, 0.05, 1],
    focus: [
      { systems: SKELETAL, name: /^right patella$/i },
      { systems: ["arterial", "venous"], name: /^right popliteal (artery|vein)$/i },
    ],
  },
  {
    id: "foot",
    systemId: "skeletal",
    name: { vi: "Bàn chân", en: "Foot" },
    // Bàn chân phải, nhìn từ trên-trước-ngoài như ảnh mu bàn chân.
    direction: [-0.6, 0.55, 0.6],
    focus: [
      {
        systems: SKELETAL,
        name: /^right (talus|calcaneus|cuboid bone|(medial|intermediate|lateral) cuneiform bone|\w+ metatarsal bone)$|navicular bone of right foot|phalanx of right .* toe|sesamoid bone of right foot/i,
      },
    ],
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
