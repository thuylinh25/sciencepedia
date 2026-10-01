import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Tĩnh mạch (2026-10-01)
 *
 * Audit dữ liệu: 475 mảnh, ~180 khái niệm. Grep bảng mảnh gộp: KHÔNG có tĩnh mạch não
 * (não trong, não lớn, vỏ não, đáy, đồi thị vân), đám rối chân bướm, tĩnh mạch liên lạc,
 * tĩnh mạch xương sọ, đám rối tĩnh mạch đốt sống, tĩnh mạch giáp dưới, thực quản, phế quản,
 * tĩnh mạch cánh tay ngoài (chỉ có cánh tay trong), tĩnh mạch quay/trụ thứ hai (mỗi bên một),
 * trực tràng giữa/dưới, bàng quang, đám rối tiền liệt.
 * Có: tĩnh mạch chủ trên/dưới, cánh tay đầu, hệ đơn, xoang màng cứng, tĩnh mạch cảnh và
 * mặt, phổi, tim, cửa, gan, thận, chậu, chi trên (nông và sâu) và chi dưới đến ngón.
 *
 * Mảnh dễ nhầm vùng (đo hộp bao): "Set of perforating veins", "Set of dorsal digital veins",
 * "perforating veins" (Z-Anatomy) đều ở CHI DƯỚI (y 0,01–0,80 m); "marginal vein",
 * "posterior vein of left ventricle" là tĩnh mạch TIM (y ≈ 1,26 m).
 *
 * Cấu trúc đã có ở hệ khác dùng lại — khai báo trùng tập mảnh là hai hàng chồng nhau:
 * `superior-vena-cava`, `cardiac-veins`, `pulmonary-vein-trunks` (tim), `pulmonary-veins`,
 * `right-pulmonary-veins` (hô hấp), `portal-veins` (tiêu hoá), `renal-veins` (tiết niệu).
 */

const v = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["venous"], name, ...(exclude ? { exclude } : {}) });

// Thân mình.
const VENAE_CAVAE = v(/^(superior|inferior) vena cava$|brachiocephalic vein$/i);
const AZYGOS = v(/azygos vein$|hemiazygos vein$|ascending lumbar vein$|intercostal veins?$|subcostal vein$|^(left |right )?lumbar vein$/i);
const TRUNK_WALL = v(/internal thoracic vein$|musculophrenic vein$|epigastric veins?$|phrenic vein$/i);
const HEPATIC = v(/hepatic vein$|tributary of (middle )?hepatic vein$/i);
const PAIRED_VISCERAL = v(/suprarenal vein$|testicular vein$/i);
const PULMONARY = v(/pulmonary vein$|segmental vein$|lingular vein$/i);
const LINGULAR = v(/lingular vein$/i);
const CARDIAC = v(/cardiac vein$|^coronary sinus$|interventricular vein$|posterior vein of (left )?ventricle$|marginal vein$/i);
const PORTAL = v(
  /portal vein|mesenteric vein$|^splenic vein$|gastric vein$|gastroepiploic vein$|colic vein$|^ileal vein$|^pancreaticoduodenal vein$|^superior rectal vein$|sigmoid vein$/i,
  /epigastric/i,
);
const RENAL = v(/renal vein$/i, /suprarenal/i);
// Đầu – cổ.
const NECK_VEINS = v(/jugular vein$|subclavian vein$|vertebral vein$|suprascapular vein$|superior thyroid vein$/i);
const FACE_VEINS = v(
  /facial vein$|angular vein$|retromandibular vein$|maxillary veins$|superficial temporal veins$|posterior auricular vein$|occipital vein$|lingual vein$|submental vein$|labial veins?$|ophthalmic vein$/i,
);
const DURAL_SINUSES = v(/sinus$|basilar venous plexus$/i, /coronary sinus/i);
// Chậu.
const PELVIC = v(/iliac vein$|iliolumbar vein$|sacral veins?$|gluteal veins?$|obturator vein$|pudendal veins?$|dorsal vein of penis$/i);
// Chi trên.
const AXILLARY = v(/axillary vein$|subscapular vein$|circumflex scapular vein$|thoracodorsal vein$|lateral thoracic vein$|circumflex humeral vein$/i);
// `\b`: "brachiocephalic vein" cũng tận cùng bằng "cephalic vein".
const ARM_SUPERFICIAL = v(/\bcephalic vein$|basilic vein$|median cubital vein$|median antebrachial vein$/i);
const ARM_DEEP = v(/medial brachial vein$|^(left |right )?(radial|ulnar) vein$/i);
const HAND = v(/palmar|metacarpal vein$|dorsal venous network of (left |right )?hand$/i);
// Chi dưới.
const FEMORAL = v(/femoral vein$/i);
const SAPHENOUS = v(/saphenous vein$/i);
const POPLITEAL = v(/popliteal vein$|genicular vein$/i);
const LEG = v(/tibial veins?$|fibular veins?$|perforating veins$/i);
const FOOT = v(/venous arch of (left |right )?foot$|tributary of plantar venous arch$|plantar metatarsal vein$|plantar digital veins$|dorsal digital veins$/i);

// Bối cảnh.
const sk = (name: RegExp): PartRule => ({ systems: ["skeletal"], name });
const SKULL_NECK = sk(/frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|mandible|cervical vertebra$|^atlas$|^axis$|clavicle$/i);
const THORAX_SPINE = sk(/\brib$|^manubrium$|^body of sternum$|vertebra$|^sacrum$/i);
const PELVIS_BONES = sk(/hip bone$|^sacrum$|lumbar vertebra$/i);
const UPPER_LIMB_BONES = sk(/(humerus|scapula|clavicle|radius|ulna)$/i);
const LOWER_LIMB_BONES = sk(/(femur|tibia|fibula|patella|hip bone)$/i);
const HEART: PartRule = { systems: ["cardiac"] };
const LIVER: PartRule = { fma: ["FMA15739", "FMA15741", "FMA15742", "FMA15743", "FMA15744", "FMA15745", "FMA15746", "FMA15747", "FMA13365"] };

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
  extra: Partial<AtlasViewDef> = {},
): AtlasViewDef => ({ id, systemId: "venous", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable", ...extra });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule, terms?: string[]): AtlasViewDef => ({
  id,
  systemId: "venous",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
  ...(terms ? { terms } : {}),
});

export const VENOUS_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "venous-overview",
    systemId: "venous",
    kind: "overview",
    name: { vi: "Toàn bộ hệ tĩnh mạch", en: "Whole venous system" },
    direction: "front",
    focus: [{ systems: ["venous"] }],
    partial: {
      vi: "Thiếu các tĩnh mạch não, tĩnh mạch giáp dưới, đám rối tĩnh mạch chân bướm và đốt sống",
      en: "The cerebral veins, inferior thyroid veins, and the pterygoid and vertebral venous plexuses are missing",
    },
    terms: ["tĩnh mạch", "vein", "venous", "tuần hoàn", "circulation"],
    quality: "acceptable",
  },
  group("venous-trunk", "Tĩnh mạch chủ, hệ đơn và thành ngực – bụng", "Venae cavae, azygos system and thoracoabdominal wall veins", "front", [VENAE_CAVAE, AZYGOS, TRUNK_WALL], [HEART, THORAX_SPINE],
    ["tĩnh mạch chủ", "vena cava", "tĩnh mạch đơn", "azygos", "gian sườn", "intercostal"]),
  group("venous-head-neck", "Tĩnh mạch đầu – cổ và xoang màng cứng", "Veins of the head and neck and dural sinuses", "anterolateral", [NECK_VEINS, FACE_VEINS, DURAL_SINUSES], [SKULL_NECK],
    ["tĩnh mạch cảnh", "jugular", "xoang tĩnh mạch", "dural sinus", "tĩnh mạch mặt", "facial vein"], {
      partial: {
        vi: "Thiếu các tĩnh mạch não, đám rối tĩnh mạch chân bướm và tĩnh mạch giáp dưới",
        en: "The cerebral veins, the pterygoid venous plexus and the inferior thyroid veins are missing",
      },
    }),
  group("venous-thorax", "Tĩnh mạch phổi và tĩnh mạch tim", "Pulmonary and cardiac veins", "front", [PULMONARY, CARDIAC], [HEART],
    ["tĩnh mạch phổi", "pulmonary vein", "xoang vành", "coronary sinus"]),
  group("venous-abdomen-pelvis", "Tĩnh mạch bụng và chậu", "Veins of the abdomen and pelvis", "front", [PORTAL, HEPATIC, RENAL, PAIRED_VISCERAL, PELVIC], [PELVIS_BONES, LIVER],
    ["tĩnh mạch cửa", "portal vein", "tĩnh mạch gan", "hepatic vein", "tĩnh mạch chậu", "iliac vein"], {
      partial: {
        vi: "Thiếu tĩnh mạch trực tràng giữa và dưới, tĩnh mạch bàng quang và đám rối tĩnh mạch tiền liệt",
        en: "The middle and inferior rectal veins, vesical veins and prostatic venous plexus are missing",
      },
    }),
  group("venous-upper-limb", "Tĩnh mạch chi trên", "Veins of the upper limb", "front", [AXILLARY, ARM_SUPERFICIAL, ARM_DEEP, HAND], [UPPER_LIMB_BONES],
    ["tĩnh mạch đầu", "cephalic", "tĩnh mạch nền", "basilic", "tĩnh mạch giữa khuỷu", "median cubital", "lấy máu"], {
      partial: { vi: "Chỉ có tĩnh mạch cánh tay trong; thiếu tĩnh mạch cánh tay ngoài và một trong hai tĩnh mạch quay, trụ", en: "Only the medial brachial vein is present; the lateral brachial vein and one of each pair of radial and ulnar veins are missing" },
    }),
  group("venous-lower-limb", "Tĩnh mạch chi dưới", "Veins of the lower limb", "front", [FEMORAL, SAPHENOUS, POPLITEAL, LEG, FOOT], [LOWER_LIMB_BONES],
    ["tĩnh mạch hiển", "saphenous", "tĩnh mạch đùi", "femoral vein", "giãn tĩnh mạch", "varicose"]),

  structure("venae-cavae", "Tĩnh mạch chủ trên, chủ dưới và cánh tay đầu", "Venae cavae and brachiocephalic veins", "front", VENAE_CAVAE),
  structure("azygos-system", "Hệ tĩnh mạch đơn, gian sườn và thắt lưng", "Azygos system, intercostal and lumbar veins", "front", AZYGOS),
  structure("trunk-wall-veins", "Tĩnh mạch ngực trong, thượng vị và hoành", "Internal thoracic, epigastric and phrenic veins", "front", TRUNK_WALL),
  structure("hepatic-veins", "Tĩnh mạch gan", "Hepatic veins", "front", HEPATIC),
  structure("paired-visceral-veins", "Tĩnh mạch thượng thận và tinh hoàn", "Suprarenal and testicular veins", "front", PAIRED_VISCERAL),
  structure("lingular-veins", "Tĩnh mạch lưỡi phổi trái", "Lingular veins", "left", LINGULAR),
  structure("neck-veins", "Tĩnh mạch cảnh, dưới đòn và đốt sống", "Jugular, subclavian and vertebral veins", "anterolateral", NECK_VEINS),
  structure("face-veins", "Tĩnh mạch mặt, sau hàm và các tĩnh mạch khác của đầu", "Facial, retromandibular and other veins of the head", "anterolateral", FACE_VEINS),
  structure("dural-sinuses", "Xoang tĩnh mạch màng cứng", "Dural venous sinuses", "side", DURAL_SINUSES, ["xoang dọc trên", "superior sagittal sinus", "xoang hang", "cavernous sinus"]),
  structure("pelvic-veins", "Tĩnh mạch chậu và các nhánh vùng chậu", "Iliac and pelvic veins", "front", PELVIC),
  structure("axillary-veins", "Tĩnh mạch nách và các nhánh", "Axillary vein and tributaries", "front", AXILLARY),
  structure("arm-superficial-veins", "Tĩnh mạch nông chi trên (đầu, nền, giữa khuỷu)", "Superficial veins of the upper limb (cephalic, basilic, median cubital)", "front", ARM_SUPERFICIAL),
  {
    ...structure("arm-deep-veins", "Tĩnh mạch sâu chi trên (cánh tay, quay, trụ)", "Deep veins of the upper limb (brachial, radial, ulnar)", "front", ARM_DEEP),
    partial: { vi: "Chỉ có tĩnh mạch cánh tay trong; thiếu tĩnh mạch cánh tay ngoài và một trong hai tĩnh mạch quay, trụ", en: "Only the medial brachial vein is present; the lateral brachial vein and one of each pair of radial and ulnar veins are missing" },
  },
  structure("hand-veins", "Tĩnh mạch bàn tay", "Veins of the hand", "front", HAND),
  structure("femoral-veins", "Tĩnh mạch đùi và các nhánh", "Femoral vein and tributaries", "front", FEMORAL),
  structure("saphenous-veins", "Tĩnh mạch hiển lớn và hiển bé", "Great and small saphenous veins", "front", SAPHENOUS),
  structure("popliteal-veins", "Tĩnh mạch khoeo và tĩnh mạch gối", "Popliteal and genicular veins", "back", POPLITEAL),
  structure("leg-veins", "Tĩnh mạch chày, mác và tĩnh mạch xuyên", "Tibial, fibular and perforating veins", "front", LEG),
  structure("foot-veins", "Tĩnh mạch bàn chân", "Veins of the foot", "superior", FOOT),
];
