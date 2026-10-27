import type { AtlasViewDef, PartRule } from "./views";
import { AXILLARY_BRANCHES } from "./views-arterial";
import { AXILLARY_NODES } from "./views-lymphatic";
import { DEEP_BACK_INTRINSIC, ERECTOR_SPINAE, SUBOCCIPITAL } from "./views-muscular";
import { BRACHIAL_PLEXUS } from "./views-nervous";
import { AXILLARY } from "./views-venous";

/*
 * ## Góc nhìn theo hệ — Hệ xương (2026-09-30)
 *
 * Audit dữ liệu: 278 mảnh hệ xương (sau `correctSystems`): 13 xương sọ/mặt + xương
 * móng, 28 răng vĩnh viễn (không có răng khôn) + lợi hai hàm, cột sống C1–L5 + xương
 * cùng + 23 đĩa gian đốt, 24 xương sườn, sụn sườn I–VII, xương ức 3 phần, xương chi,
 * 4 xương vừng bàn chân, sụn thanh quản và sụn cánh mũi lớn (FMA xếp là sụn —
 * `skeletal.cartilage`).
 * KHÔNG có xương cụt (chỉ có cơ cụt/chậu cụt/mu cụt), xương vừng bàn tay. Xương con tai giữa có từ Z-Anatomy (2026-10-19). Sụn sườn VIII–X không có mảnh
 * riêng: chúng nằm trong mảnh sụn sườn VII (y tới 1,18 m, x ±0,11 m). Đã xem bằng mắt
 * (2026-10-01, trước/chéo/bên): bờ sườn là một cung liền từ mũi ức xuống đầu trước sườn
 * VIII–X, không hở — nên không ghi "thiếu", và đừng tách "sụn sườn VIII–X". Xương lệ (hệ giác quan) và xoăn mũi dưới (hệ hô hấp của dữ liệu) là
 * xương mặt: thêm thẳng vào tổng quan và nhóm sọ theo mã FMA, như hầu ở tổng quan tiêu hoá.
 *
 * Id có tiền tố `bone-`: `skull`, `cervical-spine`, `thoracic-cage`… đã là góc nhìn
 * THEO VÙNG (views.ts) — id phải duy nhất.
 *
 * Lưới xếp theo "Skeletal System Views" của atlas tham chiếu (chủ sản phẩm, 2026-10-20):
 * toàn bộ, sọ, hố sọ, răng, lồng ngực, khoang ngực, đai chậu, mặt cắt chậu, cột sống
 * nhìn bên, cột sống và cơ, đai vai, vùng nách — rồi ba nhóm cũ (chi trên, chi dưới, sụn)
 * giữ cho deep link. Ô "Teeth Blood Supply" của atlas: dữ liệu không có động mạch hàm
 * trên, huyệt răng (chỉ có thần kinh huyệt răng dưới) → ô 4 là "Răng và lợi", không hứa
 * mạch. Đai vai, nách hai bên: cấu trúc (động mạch nách, đám rối…) gộp trái/phải, khung
 * một bên thì bảng "Cấu trúc" còn mảnh lẻ.
 */

const b = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["skeletal"], name, ...(exclude ? { exclude } : {}) });
// Đĩa gian đốt tên "Intervertebral disk of first thoracic vertebra" — cùng đuôi "vertebra" với đốt sống.
const NOT_DISK = /intervertebral/i;

// Sọ và mặt.
const FRONTAL = b(/^frontal bone$/i);
const PARIETAL = b(/parietal bone$/i);
const OCCIPITAL = b(/^occipital bone$/i);
const TEMPORAL = b(/temporal bone$/i);
const SPHENOID = b(/^sphenoid bone$/i);
const ETHMOID = b(/^ethmoid$/i);
const NASAL = b(/nasal bone$/i);
export const MAXILLA = b(/maxilla$/i);
const ZYGOMATIC = b(/zygomatic bone$/i);
const PALATINE = b(/palatine bone$/i);
const VOMER = b(/^vomer$/i);
export const MANDIBLE = b(/^mandible$/i);
const HYOID = b(/^hyoid bone$/i);
// Z-Anatomy (2026-10-19) — BodyParts3D không có xương con; chi tiết ở góc nhìn tai giữa.
const OSSICLES = b(/^(left|right) (malleus|incus|stapes)$/i);
// Xương mặt mà dữ liệu xếp hệ khác: xương lệ (giác quan), xoăn mũi dưới (hô hấp) — lấy theo mã FMA.
const LACRIMAL: PartRule = { fma: ["FMA53645", "FMA53646"] };
const CONCHAE: PartRule = { fma: ["FMA54737", "FMA54738"] };
export const SKULL = [FRONTAL, PARIETAL, OCCIPITAL, TEMPORAL, SPHENOID, ETHMOID, NASAL, LACRIMAL, CONCHAE, MAXILLA, ZYGOMATIC, PALATINE, VOMER, MANDIBLE];
// Răng và lợi.
const INCISORS = b(/incisor tooth$/i);
const CANINES = b(/canine tooth$/i);
const PREMOLARS = b(/premolar tooth$/i);
const MOLARS = b(/secondary molar tooth$/i);
const GINGIVA = b(/^gingiva of (upper|lower) jaw$/i);
export const TEETH = [INCISORS, CANINES, PREMOLARS, MOLARS, GINGIVA];
// Cột sống.
export const CERVICAL = b(/cervical vertebra$|^atlas$|^axis$/i, NOT_DISK);
export const THORACIC = b(/thoracic vertebra$/i, NOT_DISK);
export const LUMBAR = b(/lumbar vertebra$/i, NOT_DISK);
export const SACRUM = b(/^sacrum$/i);
const DISKS = b(/^intervertebral disk/i);
const SPINE = [CERVICAL, THORACIC, LUMBAR, SACRUM, DISKS];
// Lồng ngực.
export const RIBS = b(/\brib$/i);
const COSTAL_CARTILAGES = b(/costal cartilage$/i);
const STERNUM = b(/^(manubrium|body of sternum|xiphoid process)$/i);
// Chi trên.
const CLAVICLE = b(/clavicle$/i);
const SCAPULA = b(/scapula$/i);
const HUMERUS = b(/humerus$/i);
const RADIUS = b(/radius$/i);
const ULNA = b(/ulna$/i);
const CARPALS = b(/(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$/i);
const METACARPALS = b(/metacarpal bone$/i);
const FINGER_PHALANGES = b(/phalanx of (left |right )?(thumb|index finger|middle finger|ring finger|little finger)$/i);
const UPPER_LIMB = [CLAVICLE, SCAPULA, HUMERUS, RADIUS, ULNA, CARPALS, METACARPALS, FINGER_PHALANGES];
// Chậu và chi dưới.
export const HIP_BONE = b(/hip bone$/i);
const FEMUR = b(/femur$/i);
const PATELLA = b(/patella$/i);
const TIBIA = b(/tibia$/i);
const FIBULA = b(/fibula$/i);
const TARSALS = b(/(talus|calcaneus|navicular bone of (left |right )?foot|cuboid bone|cuneiform bone)$/i);
const METATARSALS = b(/metatarsal bone$/i);
const TOE_PHALANGES = b(/phalanx of (left |right )?(big toe|second toe|third toe|fourth toe|little toe)$/i);
const FOOT_SESAMOIDS = b(/sesamoid bone of (left |right )?foot$/i);
const LOWER_LIMB = [HIP_BONE, FEMUR, PATELLA, TIBIA, FIBULA, TARSALS, METATARSALS, TOE_PHALANGES, FOOT_SESAMOIDS];
// Sụn (FMA: sụn thanh quản, sụn cánh mũi lớn — BodyParts3D xếp hệ xương).
const LARYNGEAL_CARTILAGES = b(/^(thyroid|cricoid) cartilage$|(arytenoid|corniculate|cuneiform) cartilage$/i);
const ALAR_CARTILAGES = b(/major alar cartilage$/i);
// Tạng cho khoang ngực, mặt cắt chậu. Phổi: nhu mô thuỳ Z-Anatomy (như views-cardiac.ts).
const LUNGS: PartRule = { systems: ["respiratory"], name: /^(superior|middle|inferior) lobe of (left|right) lung$/i };
const HEART: PartRule = { systems: ["cardiac"] };
// Trung thất: khí quản, phế quản gốc, thực quản, mạch lớn — "khoang ngực" không chỉ tim và phổi.
const MEDIASTINUM: PartRule = { name: /^trachea$|main bronchus( proper)?$|^esophagus$|^(ascending aorta|arch of aorta|descending thoracic aorta|superior vena cava|pulmonary trunk)$/i };
const DIAPHRAGM: PartRule = { fma: ["FMA13295"] };
const PELVIC_ORGANS: PartRule = { name: /^urinary bladder$|^rectum$|^prostate$|seminal vesicle$/i };

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  terms: string[],
  extra: Partial<AtlasViewDef> = {},
): AtlasViewDef => ({ id, systemId: "skeletal", kind: "group", name: { vi, en }, direction, focus, terms, quality: "good", ...extra });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule, terms?: string[]): AtlasViewDef => ({
  id,
  systemId: "skeletal",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
  ...(terms ? { terms } : {}),
});

export const SKELETAL_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "skeletal-overview",
    systemId: "skeletal",
    kind: "overview",
    name: { vi: "Toàn bộ hệ xương", en: "Whole skeletal system" },
    direction: "front",
    focus: [{ systems: ["skeletal"] }, LACRIMAL, CONCHAE],
    partial: {
      vi: "Thiếu xương cụt và xương vừng bàn tay",
      en: "The coccyx and the sesamoid bones of the hand are missing",
    },
    terms: ["bộ xương", "skeleton", "xương", "bone"],
    quality: "good",
  },
  group("bone-skull", "Xương sọ, xương mặt và răng", "Bones of the skull and face, with teeth", "three-quarter", [...SKULL, INCISORS, CANINES, PREMOLARS, MOLARS], ["hộp sọ", "skull", "sọ não", "sọ mặt"]),
  // Bỏ vòm sọ bằng mặt phẳng ngang y = 1,645 m (đo atlas.json: trần ổ mắt ~1,63, đỉnh
  // sọ 1,71) để nhìn từ trên xuống sàn sọ — hố sọ trước, giữa, sau.
  group("bone-cranial-fossae", "Các hố sọ", "Cranial fossae", [0, 1, 0.35], [FRONTAL, PARIETAL, OCCIPITAL, TEMPORAL, SPHENOID, ETHMOID], ["hố sọ", "cranial fossa", "nền sọ", "cranial base"], {
    clip: { normal: [0, -1, 0], constant: 1.645 },
  }),
  group("bone-teeth", "Răng và lợi", "Teeth and gums", [0.45, 0.05, 1], TEETH, ["răng", "teeth", "lợi", "nướu", "gum"], {
    context: [MAXILLA, MANDIBLE],
    partial: { vi: "Không có răng khôn (răng hàm lớn thứ ba)", en: "Third molars (wisdom teeth) are not included" },
  }),
  group("bone-thorax", "Lồng ngực", "Thoracic cage", "front", [RIBS, COSTAL_CARTILAGES, STERNUM], ["xương sườn", "rib", "xương ức", "sternum"], { context: [THORACIC] }),
  // Xương ức + sụn sườn làm bối cảnh mờ: mặt trước "mở" thấy phổi, tim bên trong.
  group("bone-thoracic-cavity", "Khoang ngực", "Thoracic cavity", "front", [RIBS, THORACIC, LUNGS, HEART, MEDIASTINUM], ["khoang ngực", "thoracic cavity", "phổi", "tim", "trung thất", "mediastinum"], {
    context: [STERNUM, COSTAL_CARTILAGES, DIAPHRAGM],
  }),
  group("bone-pelvic-girdle", "Đai chậu", "Pelvic girdle", "front", [HIP_BONE, SACRUM], ["đai chậu", "pelvic girdle", "khung chậu", "pelvis"], {
    context: [LUMBAR, FEMUR],
    partial: { vi: "Thiếu xương cụt và các dây chằng vùng chậu", en: "The coccyx and the pelvic ligaments are missing" },
  }),
  // Mặt cắt dọc giữa như góc nhìn theo vùng `pelvis-section`: bỏ nửa trái (x > 0), nhìn
  // từ bên trái vào mặt cắt. Tạng chậu nổi bật: làm bối cảnh mờ thì lát cắt gần như không thấy (chụp thử).
  group("bone-pelvic-section", "Mặt cắt vùng chậu", "Pelvic section", [1, 0.05, 0.12], [HIP_BONE, SACRUM, PELVIC_ORGANS], ["mặt cắt dọc giữa", "midsagittal section", "chậu", "pelvis"], {
    clip: { normal: [-1, 0, 0], constant: 0 },
    context: [LUMBAR],
    partial: { vi: "Thiếu xương cụt và các dây chằng vùng chậu", en: "The coccyx and the pelvic ligaments are missing" },
  }),
  group("bone-spine", "Cột sống nhìn bên", "Vertebral column, lateral view", "side", SPINE, ["cột sống", "spine", "đốt sống", "vertebra"], {
    partial: { vi: "Thiếu xương cụt", en: "The coccyx is missing" },
  }),
  group("bone-spine-muscles", "Cột sống và cơ lưng sâu", "Vertebral column and deep back muscles", "back", [...SPINE, ERECTOR_SPINAE, DEEP_BACK_INTRINSIC, SUBOCCIPITAL], ["cơ dựng sống", "erector spinae", "cơ lưng", "back muscles"], {
    context: [OCCIPITAL, RIBS, HIP_BONE],
    partial: { vi: "Thiếu xương cụt và cơ nhiều chân", en: "The coccyx and multifidus are missing" },
  }),
  group("bone-shoulder-girdle", "Đai vai", "Shoulder girdle", "three-quarter", [CLAVICLE, SCAPULA], ["đai vai", "shoulder girdle", "xương đòn", "xương vai"], {
    context: [HUMERUS, RIBS, STERNUM],
    camera: { fill: 0.55, thumbnailFill: 0.7 },
  }),
  group("bone-axillary-region", "Vùng nách", "Axillary region", "front", [AXILLARY_BRANCHES, AXILLARY, BRACHIAL_PLEXUS, AXILLARY_NODES], ["nách", "axilla", "động mạch nách", "đám rối cánh tay"], {
    context: [CLAVICLE, SCAPULA, HUMERUS, RIBS],
    partial: {
      vi: "Thiếu động mạch ngực trên; đám rối cánh tay thiếu bó ngoài và bó trong",
      en: "The superior thoracic artery is missing, as are the lateral and medial cords of the brachial plexus",
    },
  }),
  group("bone-upper-limb", "Xương chi trên", "Bones of the upper limb", "front", UPPER_LIMB, ["xương tay", "arm bones", "bàn tay", "hand"], {
    partial: { vi: "Thiếu xương vừng bàn tay", en: "The sesamoid bones of the hand are missing" },
  }),
  group("bone-lower-limb", "Xương chậu và chi dưới", "Bones of the pelvis and lower limb", "front", LOWER_LIMB, ["xương chân", "leg bones", "bàn chân", "foot"], { context: [SACRUM] }),
  group("bone-cartilage", "Sụn và đĩa gian đốt sống", "Cartilage and intervertebral discs", "front", [COSTAL_CARTILAGES, DISKS, LARYNGEAL_CARTILAGES, ALAR_CARTILAGES], ["sụn", "cartilage", "đĩa đệm", "intervertebral disc"], {
    quality: "acceptable",
  }),

  structure("bone-frontal", "Xương trán", "Frontal bone", "front", FRONTAL),
  structure("bone-parietal", "Xương đỉnh", "Parietal bones", "side", PARIETAL),
  structure("bone-occipital", "Xương chẩm", "Occipital bone", "back", OCCIPITAL),
  structure("bone-temporal", "Xương thái dương", "Temporal bones", "side", TEMPORAL),
  // Xương bướm: atlas tham chiếu (Human Anatomy Atlas) trình bày thẳng từ trước
  // và hơi từ trên xuống — thấy yên bướm và mặt trên của cánh lớn. "three-quarter"
  // (vector dự phòng [0.35, 0.06, 1], gần như ngang tầm mắt) làm hai cánh đọc thành
  // hai vách dựng đứng và giấu yên bướm; hình chiếu từ dữ liệu thật xác nhận lưới
  // đúng hình bướm khi nhìn từ trước. Vector riêng như các cấu trúc ở views-sensory.ts.
  structure("bone-sphenoid", "Xương bướm", "Sphenoid bone", [0, 0.3, 1], SPHENOID),
  structure("bone-ethmoid", "Xương sàng", "Ethmoid bone", "three-quarter", ETHMOID),
  structure("bone-nasal", "Xương mũi", "Nasal bones", "front", NASAL),
  // Xoăn mũi dưới: dùng lại cấu trúc `inferior-nasal-conchae` (views-respiratory.ts) — khai báo trùng là hai hàng chồng nhau.
  structure("bone-lacrimal", "Xương lệ", "Lacrimal bones", "front", LACRIMAL),
  structure("bone-maxilla", "Xương hàm trên", "Maxillae", "front", MAXILLA),
  structure("bone-zygomatic", "Xương gò má", "Zygomatic bones", "front", ZYGOMATIC),
  structure("bone-palatine", "Xương khẩu cái", "Palatine bones", "inferior", PALATINE),
  structure("bone-vomer", "Xương lá mía", "Vomer", "side", VOMER),
  structure("bone-mandible", "Xương hàm dưới", "Mandible", "three-quarter", MANDIBLE),
  structure("bone-hyoid", "Xương móng", "Hyoid bone", "front", HYOID),
  structure("bone-ossicles", "Xương con của tai", "Auditory ossicles", "side", OSSICLES, ["xương búa", "xương đe", "xương bàn đạp"]),
  structure("teeth-incisors", "Răng cửa", "Incisors", "front", INCISORS),
  structure("teeth-canines", "Răng nanh", "Canines", "front", CANINES),
  structure("teeth-premolars", "Răng hàm nhỏ", "Premolars", "three-quarter", PREMOLARS, ["răng tiền hàm"]),
  structure("teeth-molars", "Răng hàm lớn", "Molars", "three-quarter", MOLARS),
  structure("gingiva", "Lợi", "Gums (gingiva)", "front", GINGIVA, ["nướu"]),
  structure("bone-cervical-vertebrae", "Đốt sống cổ", "Cervical vertebrae", "side", CERVICAL),
  structure("bone-thoracic-vertebrae", "Đốt sống ngực", "Thoracic vertebrae", "side", THORACIC),
  structure("bone-lumbar-vertebrae", "Đốt sống thắt lưng", "Lumbar vertebrae", "side", LUMBAR),
  structure("bone-sacrum", "Xương cùng", "Sacrum", "back", SACRUM),
  structure("intervertebral-disks", "Đĩa gian đốt sống", "Intervertebral discs", "side", DISKS, ["đĩa đệm"]),
  structure("bone-ribs", "Xương sườn", "Ribs", "front", RIBS),
  structure("costal-cartilages", "Sụn sườn", "Costal cartilages", "front", COSTAL_CARTILAGES),
  structure("bone-sternum", "Xương ức", "Sternum", "front", STERNUM),
  structure("bone-clavicle", "Xương đòn", "Clavicles", "front", CLAVICLE),
  structure("bone-scapula", "Xương vai", "Scapulae", "back", SCAPULA, ["xương bả vai"]),
  structure("bone-humerus", "Xương cánh tay", "Humeri", "front", HUMERUS),
  structure("bone-radius", "Xương quay", "Radii", "front", RADIUS),
  structure("bone-ulna", "Xương trụ", "Ulnae", "front", ULNA),
  structure("bone-carpals", "Xương cổ tay", "Carpal bones", "front", CARPALS),
  structure("bone-metacarpals", "Xương đốt bàn tay", "Metacarpal bones", "front", METACARPALS, ["xương bàn tay"]),
  structure("bone-finger-phalanges", "Xương đốt ngón tay", "Phalanges of the hand", "front", FINGER_PHALANGES),
  structure("bone-hip", "Xương chậu (xương hông)", "Hip bones", "front", HIP_BONE, ["xương hông", "coxal bone"]),
  structure("bone-femur", "Xương đùi", "Femora", "front", FEMUR),
  structure("bone-patella", "Xương bánh chè", "Patellae", "front", PATELLA),
  structure("bone-tibia", "Xương chày", "Tibiae", "front", TIBIA),
  structure("bone-fibula", "Xương mác", "Fibulae", "side", FIBULA),
  structure("bone-tarsals", "Xương cổ chân", "Tarsal bones", "superior", TARSALS),
  structure("bone-metatarsals", "Xương đốt bàn chân", "Metatarsal bones", "superior", METATARSALS, ["xương bàn chân"]),
  structure("bone-toe-phalanges", "Xương đốt ngón chân", "Phalanges of the foot", "superior", TOE_PHALANGES),
  structure("bone-foot-sesamoids", "Xương vừng bàn chân", "Sesamoid bones of the foot", "inferior", FOOT_SESAMOIDS),
  structure("laryngeal-cartilages", "Sụn thanh quản", "Laryngeal cartilages", "anterolateral", LARYNGEAL_CARTILAGES),
  structure("major-alar-cartilages", "Sụn cánh mũi lớn", "Major alar cartilages", "anterolateral", ALAR_CARTILAGES),
];
