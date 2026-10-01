import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Động mạch (2026-10-01)
 *
 * Audit dữ liệu: 636 mảnh, ~270 khái niệm. Grep bảng mảnh gộp: KHÔNG có động mạch cảnh
 * ngoài và nhánh (mặt, lưỡi, hàm trên, thái dương nông, chẩm), động mạch mông, bịt, thẹn
 * trong, mác, trực tràng giữa/dưới, bàng quang, rốn. Có: động mạch chủ đủ đoạn, cảnh
 * chung/trong, đốt sống, nền và cây động mạch não, dưới đòn và nhánh, thành ngực,
 * phổi, vành, tạng bụng, thận, chậu, chi trên/dưới đến ngón.
 *
 * Hai chỗ dữ liệu không tách được theo tên:
 * - "Right anterior segmental artery" (FMA8620, phân thuỳ PHỔI) — 2 mảnh nằm y 1,09–1,13 m,
 *   ngang thận phải: lỗi vị trí/mã của BodyParts3D (xem views-overviews.ts). Loại khỏi tổng
 *   quan và mọi nhóm — để lại là một đoạn mạch lơ lửng.
 * - "Set of dorsal digital arteries": cùng tên cho mu ngón TAY (y 0,73–0,85) và mu ngón CHÂN
 *   (y 0,04–0,37). Một cấu trúc riêng, không vào nhóm chi trên/dưới (khung sẽ kéo từ tay
 *   xuống chân).
 *
 * Cấu trúc đã có ở hệ khác dùng lại — khai báo trùng tập mảnh là hai hàng chồng nhau:
 * `ascending-aorta-arch`, `coronary-arteries` (tim — gồm cả ĐM nón và nhánh vách liên thất), `pulmonary-trunk`, `pulmonary-arteries`
 * (hô hấp), `celiac-branches`, `mesenteric-arteries` (tiêu hoá), `renal-arteries` (tiết niệu).
 */

const a = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["arterial"], name, ...(exclude ? { exclude } : {}) });
const MISPLACED = /^right anterior segmental artery$/i;

// Động mạch chủ và nhánh lớn.
const AORTA = a(/^(descending aorta|descending thoracic aorta|abdominal aorta)$/i);
const ARCH_BRANCHES = a(/brachiocephalic artery$|common carotid artery$|^(left |right )?subclavian artery$/i);
const ASC_ARCH: PartRule = { systems: ["arterial"], name: /^(ascending aorta|arch of aorta)$/i };
// Đầu – cổ – não.
const CAROTID_VERTEBRAL = a(/internal carotid artery$|vertebral artery$|ophthalmic artery$|^basilar artery$/i);
const CEREBRAL = a(
  /cerebral artery|cerebellar artery|communicating artery|choroidal artery|pontine artery|callosomarginal|pericallosal|frontobasal artery$|parietal artery$|temporal artery$|occipital artery$|thalamo|prefrontal artery$|sulcus$|splenial artery$|precuneal branch|hypothalamic branch|anterior spinal artery$|angular gyrus$|internal capsule$|vermian branch|temporal branch|temporal branches/i,
);
const NECK_BRANCHES = a(
  /thyrocervical trunk$|inferior thyroid artery$|transverse cervical artery$|superficial cervical artery$|suprascapular artery$|costocervical trunk$|deep cervical artery$|superior intercostal artery$|dorsal scapular artery$/i,
);
// Ngực.
const THORACIC_WALL = a(
  /internal thoracic artery$|posterior intercostal arter(y|ies)$|musculophrenic artery$|superior epigastric artery$|subcostal artery$|bronchial artery$|bronchial branch of arch of aorta$|esophageal artery$|oesophageal branches of thoracic aorta$/i,
);
const LINGULAR = a(/lingular artery$/i);
const PULMONARY_TREE = a(/pulmonary trunk$|pulmonary artery$|segmental artery|lobar artery|lingular artery$/i, MISPLACED);
const CORONARY = a(
  /coronary artery$|interventricular branch|marginal branch of right|ventricular branch of right|conus branch|diagonal branch|circumflex branch of left|conus artery$|septal branch of ((left|right) )?(anterior|posterior) interventricular artery$/i,
);
// Bụng – chậu.
/** Nhánh thành (hoành dưới, thắt lưng) và nhánh tạng cặp (thượng thận, tinh hoàn) của ĐM chủ bụng. */
const ABDOMINAL_OTHER = a(/suprarenal artery$|inferior phrenic artery$|lumbar artery$|testicular artery$/i);
const VISCERAL: PartRule = {
  systems: ["arterial"],
  name: /^celiac (trunk|artery)$|gastric artery$|hepatic artery|^splenic artery$|gastroduodenal|pancreaticoduodenal artery$|mesenteric artery$|^ileal artery$|colic artery|ileocolic artery$|of (inferior branch of )?ileocolic artery$|of left colic artery$|^superior rectal artery$|cecal artery$|appendicular artery$|marginal artery of colon$|sigmoid artery$|gastro-epiploic artery$|\bpancreatic artery$|renal artery$/i,
  exclude: /suprarenal|epigastric/i,
};
const PELVIC = a(/common iliac artery$|internal iliac artery$|external iliac artery$|inferior epigastric artery$|superficial epigastric artery$|dorsal artery of penis$/i);
// Chi trên.
const AXILLARY_BRANCHES = a(/axillary artery$|thoraco-acromial artery$|lateral thoracic artery$|^(left |right )?subscapular artery$|circumflex scapular artery$|thoracodorsal artery$|circumflex humeral artery$/i);
const BRACHIAL = a(/brachial artery$|collateral (branch of|artery)/i);
const FOREARM = a(/^(left |right )?(radial|ulnar) artery$|(radial|ulnar) recurrent artery$|interosseous artery$/i);
const HAND = a(/palmar|metacarpal arter|princeps pollicis|radialis indicis|carpal branch/i);
const UPPER_LIMB = [AXILLARY_BRANCHES, BRACHIAL, FOREARM, HAND];
// Chi dưới.
// `\b`: "thalamoperforating artery" (não) cũng chứa "perforating arter".
const FEMORAL = a(/femoral artery$|\bperforating arter/i);
const POPLITEAL = a(/popliteal artery$|genicular artery$/i);
const LEG = a(/tibial artery$|tibial recurrent artery$|calcaneal branches/i);
const FOOT = a(/dorsalis pedis artery$|arcuate artery$|tarsal artery$|deep plantar artery$|plantar|metatarsal artery$|digital artery of (left |right )?foot$/i);
const LOWER_LIMB = [FEMORAL, POPLITEAL, LEG, FOOT];
const DORSAL_DIGITAL = a(/^set of dorsal digital arteries$/i);

// Bối cảnh.
const sk = (name: RegExp): PartRule => ({ systems: ["skeletal"], name });
const SKULL_SPINE = sk(/skull|frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|cervical vertebra$|^atlas$|^axis$|clavicle$/i);
const THORAX_BONES = sk(/\brib$|costal cartilage|^manubrium$|^body of sternum$|thoracic vertebra$/i);
const PELVIS_BONES = sk(/hip bone$|^sacrum$|lumbar vertebra$/i);
const UPPER_LIMB_BONES = sk(/(humerus|scapula|clavicle|radius|ulna)$/i);
const LOWER_LIMB_BONES = sk(/(femur|tibia|fibula|patella|hip bone)$/i);
const HEART: PartRule = { systems: ["cardiac"] };

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
  extra: Partial<AtlasViewDef> = {},
): AtlasViewDef => ({ id, systemId: "arterial", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable", ...extra });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule, terms?: string[]): AtlasViewDef => ({
  id,
  systemId: "arterial",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
  ...(terms ? { terms } : {}),
});

export const ARTERIAL_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "arterial-overview",
    systemId: "arterial",
    kind: "overview",
    name: { vi: "Toàn bộ hệ động mạch", en: "Whole arterial system" },
    direction: "front",
    focus: [{ systems: ["arterial"], exclude: MISPLACED }],
    partial: {
      vi: "Thiếu động mạch cảnh ngoài và các nhánh, phần lớn nhánh của động mạch chậu trong, động mạch cùng giữa và động mạch mác",
      en: "The external carotid artery and its branches, most branches of the internal iliac artery, the median sacral artery and the fibular artery are missing",
    },
    terms: ["động mạch", "artery", "arterial", "tuần hoàn", "circulation"],
    quality: "acceptable",
  },
  group("arterial-aorta", "Động mạch chủ và các nhánh lớn", "Aorta and its major branches", "front", [ASC_ARCH, AORTA, ARCH_BRANCHES], [HEART],
    ["động mạch chủ", "aorta", "cảnh chung", "common carotid", "dưới đòn", "subclavian"]),
  group("arterial-head-neck", "Động mạch đầu – cổ", "Arteries of the head and neck", "anterolateral", [ARCH_BRANCHES, CAROTID_VERTEBRAL, NECK_BRANCHES], [SKULL_SPINE],
    ["động mạch cảnh", "carotid", "đốt sống", "vertebral"], {
      partial: { vi: "Thiếu động mạch cảnh ngoài và các nhánh", en: "The external carotid artery and its branches are missing" },
    }),
  group("arterial-brain", "Động mạch não", "Arteries of the brain", "superior", [CAROTID_VERTEBRAL, CEREBRAL], [],
    ["vòng Willis", "circle of Willis", "động mạch não giữa", "middle cerebral"]),
  group("arterial-thorax", "Động mạch ngực, phổi và vành", "Thoracic, pulmonary and coronary arteries", "front", [THORACIC_WALL, PULMONARY_TREE, CORONARY], [HEART, THORAX_BONES],
    ["động mạch ngực trong", "động mạch vú trong", "internal thoracic", "gian sườn", "intercostal", "động mạch phổi", "vành"]),
  group("arterial-abdomen-pelvis", "Động mạch bụng và chậu", "Arteries of the abdomen and pelvis", "front", [AORTA, VISCERAL, ABDOMINAL_OTHER, PELVIC], [PELVIS_BONES],
    ["thân tạng", "celiac", "mạc treo", "mesenteric", "chậu", "iliac", "thận", "renal"], {
      partial: {
        vi: "Thiếu động mạch cùng giữa và phần lớn nhánh của động mạch chậu trong (mông, bịt, thẹn trong, rốn, bàng quang, trực tràng giữa và dưới)",
        en: "The median sacral artery and most branches of the internal iliac artery (gluteal, obturator, internal pudendal, umbilical, vesical, middle and inferior rectal) are missing",
      },
    }),
  group("arterial-upper-limb", "Động mạch chi trên", "Arteries of the upper limb", "front", UPPER_LIMB, [UPPER_LIMB_BONES],
    ["động mạch nách", "axillary", "cánh tay", "brachial", "quay", "radial", "trụ", "ulnar", "cung gan tay", "palmar arch"]),
  group("arterial-lower-limb", "Động mạch chi dưới", "Arteries of the lower limb", "front", LOWER_LIMB, [LOWER_LIMB_BONES],
    ["động mạch đùi", "femoral", "khoeo", "popliteal", "chày", "tibial", "mu chân", "dorsalis pedis"], {
      partial: { vi: "Thiếu động mạch mác", en: "The fibular (peroneal) artery is missing" },
    }),

  structure("aorta-descending", "Động mạch chủ xuống (ngực, bụng)", "Descending aorta (thoracic, abdominal)", "front", AORTA),
  structure("aortic-arch-branches", "Thân cánh tay đầu, cảnh chung, dưới đòn", "Brachiocephalic, common carotid and subclavian arteries", "front", ARCH_BRANCHES, ["thân tay đầu"]),
  structure("carotid-vertebral", "Cảnh trong, đốt sống, nền và mắt", "Internal carotid, vertebral, basilar and ophthalmic arteries", "anterolateral", CAROTID_VERTEBRAL),
  structure("cerebral-arteries", "Các động mạch não và tiểu não", "Cerebral and cerebellar arteries", "superior", CEREBRAL),
  structure("subclavian-branches", "Nhánh thân giáp cổ và sườn cổ", "Thyrocervical and costocervical branches", "anterolateral", NECK_BRANCHES),
  structure("thoracic-wall-arteries", "Động mạch thành ngực, phế quản và thực quản", "Thoracic wall, bronchial and esophageal arteries", "front", THORACIC_WALL),
  structure("lingular-arteries", "Động mạch lưỡi phổi trái", "Lingular arteries", "left", LINGULAR),
  structure("abdominal-other-arteries", "Động mạch hoành dưới, thắt lưng, thượng thận và tinh hoàn", "Inferior phrenic, lumbar, suprarenal and testicular arteries", "front", ABDOMINAL_OTHER),
  structure("pelvic-arteries", "Động mạch chậu, thượng vị và động mạch lưng dương vật", "Iliac and epigastric arteries and dorsal artery of the penis", "front", PELVIC),
  structure("axillary-arteries", "Động mạch nách và các nhánh", "Axillary artery and branches", "front", AXILLARY_BRANCHES),
  structure("brachial-arteries", "Động mạch cánh tay và các nhánh bên", "Brachial artery and collateral branches", "front", BRACHIAL),
  structure("forearm-arteries", "Động mạch quay, trụ và gian cốt", "Radial, ulnar and interosseous arteries", "front", FOREARM),
  structure("hand-arteries", "Động mạch bàn tay (cung gan tay, đốt bàn, ngón)", "Arteries of the hand (palmar arches, metacarpal, digital)", "front", HAND),
  structure("femoral-arteries", "Động mạch đùi và các nhánh", "Femoral artery and branches", "front", FEMORAL),
  structure("popliteal-arteries", "Động mạch khoeo và các động mạch gối", "Popliteal and genicular arteries", "back", POPLITEAL),
  structure("leg-arteries", "Động mạch chày trước và chày sau", "Anterior and posterior tibial arteries", "front", LEG),
  structure("foot-arteries", "Động mạch bàn chân", "Arteries of the foot", "superior", FOOT),
  structure("dorsal-digital-arteries", "Động mạch mu ngón (tay và chân)", "Dorsal digital arteries (hands and feet)", "front", DORSAL_DIGITAL),
];
