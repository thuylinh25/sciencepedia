import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Tim (2026-09-30)
 *
 * Tổng quan ("Tim và mạch lớn") ở `views-overviews.ts`. Audit: hệ Tim của
 * BodyParts3D có 18 mảnh — thành nhĩ phải/trái, MỘT mảnh "Wall of ventricle"
 * cho cả hai thất, khoang 4 buồng, 11 lá van (ba lá 3, hai lá 2, ĐM chủ 3, ĐM phổi 3). Không có vách liên nhĩ/liên thất
 * riêng, cơ nhú, dây chằng: đừng dựng góc nhìn cho chúng. Mạch vành và mạch lớn
 * ở hệ động/tĩnh mạch.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const RA = rule("FMA9457", "FMA11359");
const LA = rule("FMA9531", "FMA9465");
const RA_WALL = rule("FMA9457");
const LA_WALL = rule("FMA9531");
const RA_CAVITY = rule("FMA11359");
const LA_CAVITY = rule("FMA9465");
const VENTRICLE_WALL = rule("FMA13884");
const RV_CAVITY = rule("FMA9291");
const LV_CAVITY = rule("FMA9466");
const WALLS = rule("FMA9457", "FMA9531", "FMA13884");
const CAVITIES = rule("FMA11359", "FMA9465", "FMA9291", "FMA9466");
const TRICUSPID = rule("FMA7238", "FMA7239", "FMA7240");
const MITRAL = rule("FMA7242", "FMA7243");
const AORTIC_VALVE = rule("FMA7252", "FMA7253", "FMA7254");
const PULMONARY_VALVE = rule("FMA7247", "FMA7249", "FMA7250");
const VALVES = [TRICUSPID, MITRAL, AORTIC_VALVE, PULMONARY_VALVE];

const CORONARY_ARTERIES: PartRule = {
  systems: ["arterial"],
  name: /coronary artery$|interventricular branch|marginal branch of right|ventricular branch of right|conus branch|diagonal branch|circumflex branch of left|^(left |right )?conus artery$|septal branch of ((left|right) )?(anterior|posterior) interventricular artery$/i,
};
// Tĩnh mạch liên thất trước, sau thất trái, bờ: cũng đổ về xoang vành (đo: y ≈ 1,26 m, trên tim).
const CARDIAC_VEINS: PartRule = {
  systems: ["venous"],
  name: /cardiac vein$|^coronary sinus$|interventricular vein$|posterior vein of (left )?ventricle$|marginal vein$/i,
};
const AORTA: PartRule = { systems: ["arterial"], name: /^(ascending aorta|arch of aorta)$/i };
const PULMONARY_TRUNK = rule("FMA8612");
const VENAE_CAVAE: PartRule = { systems: ["venous"], name: /^superior vena cava$/i };
const IVC: PartRule = { systems: ["venous"], name: /^inferior vena cava$/i };
const PULMONARY_VEINS: PartRule = { systems: ["venous"], name: /^(right|left) (superior|inferior) pulmonary vein$/i };
const HEART: PartRule = { systems: ["cardiac"] };

/*
 * ## Góc nhìn tuần hoàn (2026-10-02)
 *
 * Theo lưới "Circulatory System Views" của atlas tham chiếu: tim đặt trong cơ thể
 * (lồng ngực, phổi), mặt cắt, rồi từng vùng tuần hoàn (cảnh – não, hệ đơn, gan,
 * ruột, chậu) với cơ quan nó nuôi làm bối cảnh. Mạch ở đây là mảnh của hệ động/
 * tĩnh mạch — chỉ khung lại theo câu hỏi "máu đi đâu quanh tim", không khai báo
 * cấu trúc mới (bảng "Cấu trúc" lấy từ góc nhìn cấu trúc của hệ đó).
 */
const art = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["arterial"], name, ...(exclude ? { exclude } : {}) });
const ven = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["venous"], name, ...(exclude ? { exclude } : {}) });
// "Right anterior segmental artery" (FMA8620): hai mảnh nằm ngang thận — lỗi vị trí của
// BodyParts3D, loại như ở tổng quan động mạch (views-arterial.ts, MISPLACED).
const MISPLACED = /^right anterior segmental artery$/i;
const ALL_ARTERIES: PartRule = { systems: ["arterial"], exclude: MISPLACED };
const ALL_VEINS: PartRule = { systems: ["venous"] };
const SKELETON: PartRule = { systems: ["skeletal"] };
const SVC = ven(/^superior vena cava$/i);
// Phổi: nhu mô thuỳ của Z-Anatomy (như views-respiratory.ts).
const LUNGS: PartRule = { systems: ["respiratory"], name: /^(superior|middle|inferior) lobe of (left|right) lung$/i };
const TRACHEA = rule("FMA7394");
const RIBS_STERNUM: PartRule = {
  systems: ["skeletal"],
  name: /\brib\b|costal cartilage|^manubrium$|^body of sternum$|^xiphoid process$/i,
};
const DIAPHRAGM = rule("FMA13295");
const PULMONARY_ARTERIES = art(/^(right|left) pulmonary artery$|segmental artery|lobar artery/i, MISPLACED);
const ALL_PULMONARY_VEINS = ven(/pulmonary vein$|segmental vein$/i);
// Cảnh – não.
const CAROTIDS = art(/(common|internal) carotid artery$/i);
const JUGULARS = ven(/internal jugular vein$/i);
const SKULL_NECK: PartRule = {
  systems: ["skeletal"],
  name: /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|mandible|maxilla|zygomatic bone|cervical vertebra$|^atlas$|^axis$|clavicle$|^manubrium$/i,
};
/**
 * Vòng động mạch não: não trước, thông trước/sau, đoạn trước thông của não sau, thân nền
 * (nguồn phía sau). Cảnh trong là MỘT mảnh dài từ cổ (~10 cm): để nổi bật thì khung kéo
 * xuống cổ, nên nó làm bối cảnh — vẫn thấy chỗ nó nhập vòng.
 */
const INTERNAL_CAROTIDS = art(/internal carotid artery$/i);
const CIRCLE_OF_WILLIS = art(
  /^(left|right) anterior cerebral artery$|^anterior communicating artery$|^(left|right) posterior communicating artery$|^precommunicating part of (left|right) posterior cerebral artery$|^basilar artery$/i,
);
const BRAIN: PartRule = {
  systems: ["nervous"],
  name: /white matter of (left|right) cerebral hemisphere$|^pons$|^medulla oblongata$|^midbrain$|^cerebellum$/i,
};
// Thân mình.
// TM gian sườn TRƯỚC đổ về TM ngực trong, không về hệ đơn — loại.
const AZYGOS = ven(/azygos vein$|hemiazygos vein$|intercostal veins?$|subcostal vein$|ascending lumbar vein$/i, /anterior intercostal/i);
const SPINE: PartRule = { systems: ["skeletal"], name: /vertebra$|^sacrum$/i };
const VAGUS: PartRule = { systems: ["nervous"], name: /^(left|right) vagus nerve \(x\)$/i };
const AORTA_ALL = art(/^(ascending aorta|arch of aorta|descending aorta|descending thoracic aorta|abdominal aorta)$/i);
// Gan.
const HEPATIC_ARTERIES = art(/^celiac (trunk|artery)$|hepatic artery/i);
// Như PORTAL của views-venous.ts: cả TM vị, vị mạc nối, tá tuỵ đổ thẳng về TM cửa.
const PORTAL_VEINS = ven(
  /portal vein|mesenteric vein$|^splenic vein$|gastric vein$|gastroepiploic vein$|colic vein$|^ileal vein$|^pancreaticoduodenal vein$|^superior rectal vein$|sigmoid vein$/i,
  /epigastric/i,
);
const HEPATIC_VEINS = ven(/hepatic vein$|tributary of (middle )?hepatic vein$/i);
const LIVER: PartRule = { fma: ["FMA15739", "FMA15741", "FMA15742", "FMA15743", "FMA15744", "FMA15745", "FMA15746", "FMA15747", "FMA13365"] };
// Ruột.
const GUT_ARTERIES = art(
  /mesenteric artery$|colic|ileocolic|^sigmoid artery$|^superior rectal artery$|^ileal artery$|appendicular|cecal artery$|marginal artery of colon$|pancreaticoduodenal artery$/i,
);
const GUT_VEINS = ven(/mesenteric vein$|colic vein$|^ileocolic vein$|^sigmoid vein$|^superior rectal vein$|^ileal vein$|^pancreaticoduodenal vein$/i);
const INTESTINES: PartRule = {
  systems: ["digestive"],
  name: /colon$|jejunum$|ileum$|^cecum$|^rectum$|^duodenum$|^appendix$|^stomach$/i,
};
// Chậu.
// Không gồm ĐM thượng vị nông: nhánh ĐM đùi ở thành bụng trước, không phải mạch chậu.
const PELVIC_ARTERIES = art(/iliac artery$|inferior epigastric artery$|dorsal artery of penis$/i);
const PELVIC_VEINS = ven(/iliac vein$|iliolumbar vein$|sacral veins?$|gluteal veins?$|obturator vein$|pudendal veins?$|dorsal vein of penis$/i);
const PELVIS: PartRule = { systems: ["skeletal"], name: /hip bone$|^sacrum$|fifth lumbar vertebra$/i };
const PELVIC_ORGANS: PartRule = { name: /^urinary bladder$|^prostate$|^rectum$/i };

export const CARDIAC_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "cardiac-circulatory-system",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Hệ tuần hoàn", en: "Circulatory system" },
    direction: "front",
    focus: [HEART, ALL_ARTERIES, ALL_VEINS],
    context: [SKELETON],
    partial: {
      vi: "Thiếu động mạch cảnh ngoài và các nhánh, phần lớn nhánh của động mạch chậu trong, động mạch cùng giữa, động mạch mác, các tĩnh mạch não và đám rối tĩnh mạch chân bướm, đốt sống",
      en: "The external carotid artery and its branches, most branches of the internal iliac artery, the median sacral and fibular arteries, the cerebral veins and the pterygoid and vertebral venous plexuses are missing",
    },
    terms: ["hệ tuần hoàn", "circulatory system", "mạch máu", "blood vessels"],
    quality: "acceptable",
  },
  {
    id: "cardiac-location",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Vị trí của tim", en: "Location of the heart" },
    direction: "front",
    focus: [HEART, AORTA, PULMONARY_TRUNK, SVC],
    context: [LUNGS, RIBS_STERNUM, DIAPHRAGM],
    // Lùi xa hơn mặc định: góc nhìn này là để thấy lồng ngực quanh tim.
    camera: { fill: 0.42, thumbnailFill: 0.5 },
    terms: ["trung thất", "mediastinum", "lồng ngực", "thoracic cage"],
    quality: "acceptable",
  },
  {
    id: "cardiac-chambers",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Các buồng tim", en: "Chambers of the heart" },
    direction: "front",
    focus: [CAVITIES],
    context: [WALLS],
    terms: ["tâm nhĩ", "atrium", "tâm thất", "ventricle", "buồng tim"],
    quality: "acceptable",
  },
  {
    // Mặt cắt đứng ngang (coronal) qua giữa tim: bỏ nửa trước (z > 0,03 m — tâm hộp
    // bao thành thất, đo trên atlas.json), nhìn từ trước vào mặt cắt bốn buồng.
    // Khoang buồng (khối máu) không vẽ: cắt khối đặc chỉ ra vỏ rỗng che mất thành.
    id: "cardiac-section",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Mặt cắt tim", en: "Heart section" },
    direction: "front",
    clip: { normal: [0, 0, -1], constant: 0.03 },
    focus: [WALLS, ...VALVES],
    terms: ["mặt cắt đứng ngang", "coronal section", "cơ tim", "myocardium"],
    quality: "acceptable",
  },
  {
    id: "cardiac-valves",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Van tim", en: "Heart valves" },
    direction: "superior",
    focus: VALVES,
    context: [WALLS],
    terms: ["valve", "van hai lá", "van ba lá", "mitral", "tricuspid"],
    quality: "acceptable",
  },
  {
    id: "cardiac-coronary",
    systemId: "cardiac",
    kind: "group",
    // "Mạch vành" thường chỉ hiểu là động mạch vành; góc nhìn có cả tĩnh mạch tim.
    name: { vi: "Tuần hoàn vành", en: "Coronary circulation" },
    direction: "front",
    focus: [CORONARY_ARTERIES, CARDIAC_VEINS],
    context: [HEART, AORTA],
    terms: ["động mạch vành", "coronary artery", "tĩnh mạch tim", "cardiac vein"],
    quality: "good",
  },
  {
    id: "cardiac-great-vessels",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Mạch máu lớn của tim", en: "Great vessels" },
    direction: "front",
    // Mạch lớn gồm cả tĩnh mạch phổi và tĩnh mạch chủ dưới. TM chủ dưới là MỘT mảnh dài
    // tới chậu: để nổi bật thì khung kéo xuống bụng (xem views-overviews.ts) — nên nó
    // hiện mờ làm bối cảnh, vẫn thấy chỗ đổ vào nhĩ phải.
    focus: [AORTA, PULMONARY_TRUNK, VENAE_CAVAE, PULMONARY_VEINS],
    context: [HEART, IVC],
    terms: ["động mạch chủ", "aorta", "tĩnh mạch chủ", "vena cava", "thân động mạch phổi"],
    quality: "acceptable",
  },
  {
    id: "cardiac-pulmonary",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Tim và mạch phổi", en: "Heart and pulmonary vessels" },
    direction: "front",
    focus: [HEART, PULMONARY_TRUNK, PULMONARY_ARTERIES, ALL_PULMONARY_VEINS],
    context: [LUNGS],
    terms: ["tuần hoàn phổi", "pulmonary circulation", "tiểu tuần hoàn"],
    quality: "acceptable",
  },
  {
    id: "cardiac-carotid-jugular",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Động mạch cảnh và tĩnh mạch cảnh trong", en: "Carotid arteries and internal jugular veins" },
    direction: "anterolateral",
    focus: [CAROTIDS, JUGULARS],
    context: [SKULL_NECK],
    partial: {
      vi: "Thiếu động mạch cảnh ngoài, tĩnh mạch cảnh ngoài và các nhánh",
      en: "The external carotid artery, the external jugular vein and their branches are missing",
    },
    terms: ["động mạch cảnh", "carotid", "tĩnh mạch cảnh", "jugular", "cổ", "neck"],
    quality: "acceptable",
  },
  {
    id: "cardiac-circle-of-willis",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Vòng động mạch não (đa giác Willis)", en: "Circle of Willis" },
    direction: "inferior",
    focus: [CIRCLE_OF_WILLIS],
    context: [INTERNAL_CAROTIDS, BRAIN],
    camera: { fill: 0.5, thumbnailFill: 0.6 },
    terms: ["đa giác willis", "vòng willis", "circle of willis", "cerebral arterial circle"],
    quality: "acceptable",
  },
  {
    id: "cardiac-azygos",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Hệ tĩnh mạch đơn", en: "Azygos system" },
    direction: "front",
    focus: [AZYGOS],
    // TM chủ trên mờ: thấy chỗ hệ đơn đổ về mà tên không phải hứa thêm.
    // Không có tim: hệ đơn nằm sau tim, nhìn từ trước tim che mất.
    context: [SVC, SPINE],
    partial: { vi: "Thiếu các tĩnh mạch gian sườn sau", en: "The posterior intercostal veins are missing" },
    terms: ["tĩnh mạch đơn", "azygos", "tĩnh mạch bán đơn", "hemiazygos"],
    quality: "acceptable",
  },
  {
    id: "cardiac-vagus",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Dây thần kinh phế vị (X)", en: "Vagus nerves" },
    direction: "front",
    focus: [VAGUS],
    context: [HEART, AORTA_ALL, TRACHEA],
    partial: {
      vi: "Chỉ có thân dây phế vị trái và phải; thiếu các nhánh tim, thần kinh thanh quản quặt ngược và đám rối tim",
      en: "Only the left and right vagal trunks are present; the cardiac branches, recurrent laryngeal nerves and cardiac plexus are missing",
    },
    terms: ["phế vị", "vagus", "thần kinh x", "cranial nerve x"],
    quality: "acceptable",
  },
  {
    id: "cardiac-liver",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Tuần hoàn gan", en: "Hepatic circulation" },
    direction: "front",
    focus: [HEPATIC_ARTERIES, PORTAL_VEINS, HEPATIC_VEINS],
    // TM chủ dưới: nơi máu rời gan qua các TM gan.
    context: [LIVER, IVC],
    terms: ["tĩnh mạch cửa", "portal vein", "hệ cửa", "hepatic portal system", "tĩnh mạch gan"],
    quality: "acceptable",
  },
  {
    id: "cardiac-intestines",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Mạch máu của ruột", en: "Intestinal blood vessels" },
    direction: "front",
    focus: [GUT_ARTERIES, GUT_VEINS],
    context: [INTESTINES],
    partial: { vi: "Thiếu các động mạch và tĩnh mạch hỗng tràng", en: "The jejunal arteries and veins are missing" },
    terms: ["mạc treo", "mesenteric", "động mạch mạc treo", "tĩnh mạch mạc treo"],
    quality: "acceptable",
  },
  {
    id: "cardiac-pelvis",
    systemId: "cardiac",
    kind: "group",
    name: { vi: "Tuần hoàn vùng chậu", en: "Pelvic circulation" },
    direction: "front",
    focus: [PELVIC_ARTERIES, PELVIC_VEINS],
    context: [PELVIS, PELVIC_ORGANS],
    partial: {
      vi: "Thiếu động mạch cùng giữa và phần lớn nhánh của động mạch chậu trong (mông, bịt, thẹn trong, rốn, bàng quang, trực tràng giữa và dưới)",
      en: "The median sacral artery and most branches of the internal iliac artery (gluteal, obturator, internal pudendal, umbilical, vesical, middle and inferior rectal) are missing",
    },
    terms: ["động mạch chậu", "iliac artery", "tĩnh mạch chậu", "iliac vein"],
    quality: "acceptable",
  },

  { id: "right-atrium", systemId: "cardiac", kind: "structure", name: { vi: "Tâm nhĩ phải", en: "Right atrium" }, direction: "right", focus: [RA], context: [VENTRICLE_WALL] },
  { id: "left-atrium", systemId: "cardiac", kind: "structure", name: { vi: "Tâm nhĩ trái", en: "Left atrium" }, direction: "back", focus: [LA], context: [VENTRICLE_WALL] },
  { id: "ventricular-wall", systemId: "cardiac", kind: "structure", name: { vi: "Thành tâm thất", en: "Ventricular wall" }, direction: "front", focus: [VENTRICLE_WALL], context: [RA, LA], terms: ["cơ tim", "myocardium"] },
  // Khoang nhĩ riêng: "Các buồng tim" chỉ hiện khoang, "Tâm nhĩ" (thành + khoang) không nằm trọn trong đó.
  { id: "right-atrium-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm nhĩ phải", en: "Right atrial cavity" }, direction: "right", focus: [RA_CAVITY], context: [RA] },
  { id: "left-atrium-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm nhĩ trái", en: "Left atrial cavity" }, direction: "back", focus: [LA_CAVITY], context: [LA] },
  // Thành nhĩ riêng, cùng lý do: "Mặt cắt tim" chỉ vẽ thành (không khoang), nên thiếu hai hàng này
  // thì thành nhĩ rơi vào "Phần còn lại".
  { id: "right-atrium-wall", systemId: "cardiac", kind: "structure", name: { vi: "Thành tâm nhĩ phải", en: "Wall of right atrium" }, direction: "right", focus: [RA_WALL], context: [RA_CAVITY] },
  { id: "left-atrium-wall", systemId: "cardiac", kind: "structure", name: { vi: "Thành tâm nhĩ trái", en: "Wall of left atrium" }, direction: "back", focus: [LA_WALL], context: [LA_CAVITY] },
  // Bảng cấu trúc cho các góc nhìn tuần hoàn: cấu trúc của hệ động/tĩnh mạch rộng hơn
  // tập nổi bật của các góc nhìn này (cảnh NGOÀI, nhánh tạng khác…), nên không nằm trọn
  // trong đó và mảnh rơi vào "Phần còn lại". Mỗi hàng dưới đây đúng bằng một quy tắc focus.
  // Tách đôi: cảnh chung nằm trong "nhánh cung ĐMC", cảnh trong trong "cảnh – đốt sống" — gộp làm
  // một thì ở góc nhìn lớn nó chồng mảnh lên cả hai.
  { id: "common-carotid-arteries", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch cảnh chung", en: "Common carotid arteries" }, direction: "anterolateral", focus: [art(/common carotid artery$/i)], context: [SKULL_NECK] },
  { id: "internal-carotid-arteries", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch cảnh trong", en: "Internal carotid arteries" }, direction: "anterolateral", focus: [art(/internal carotid artery$/i)], context: [SKULL_NECK] },
  { id: "internal-jugular-veins", systemId: "cardiac", kind: "structure", name: { vi: "Tĩnh mạch cảnh trong", en: "Internal jugular veins" }, direction: "anterolateral", focus: [JUGULARS], context: [SKULL_NECK] },
  { id: "hepatic-arterial-supply", systemId: "cardiac", kind: "structure", name: { vi: "Thân tạng và động mạch gan", en: "Celiac trunk and hepatic arteries" }, direction: "front", focus: [HEPATIC_ARTERIES], context: [LIVER] },
  { id: "intestinal-veins", systemId: "cardiac", kind: "structure", name: { vi: "Tĩnh mạch của ruột", en: "Intestinal veins" }, direction: "front", focus: [GUT_VEINS], context: [INTESTINES] },
  { id: "pancreaticoduodenal-arteries", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch tá tụy", en: "Pancreaticoduodenal arteries" }, direction: "front", focus: [art(/pancreaticoduodenal artery$/i)], context: [INTESTINES] },
  // Vòng Willis tách đôi cùng lý do với động mạch cảnh: động mạch nền nằm trong "cảnh – đốt sống",
  // các đoạn còn lại trong "động mạch não".
  { id: "circle-of-willis-segments", systemId: "cardiac", kind: "structure", name: { vi: "Các đoạn vòng Willis", en: "Circle of Willis segments" }, direction: "inferior", focus: [art(/^(left|right) anterior cerebral artery$|^anterior communicating artery$|^(left|right) posterior communicating artery$|^precommunicating part of (left|right) posterior cerebral artery$/i)], context: [INTERNAL_CAROTIDS] },
  { id: "basilar-artery", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch nền", en: "Basilar artery" }, direction: "inferior", focus: [art(/^basilar artery$/i)], context: [INTERNAL_CAROTIDS] },
  { id: "azygos-veins", systemId: "cardiac", kind: "structure", name: { vi: "Hệ tĩnh mạch đơn", en: "Azygos venous system" }, direction: "front", focus: [AZYGOS], context: [SVC] },
  { id: "iliac-arteries", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch chậu và nhánh", en: "Iliac arteries and branches" }, direction: "front", focus: [PELVIC_ARTERIES], context: [PELVIS] },
  { id: "right-ventricle-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm thất phải", en: "Right ventricular cavity" }, direction: "front", focus: [RV_CAVITY], context: [VENTRICLE_WALL] },
  { id: "left-ventricle-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm thất trái", en: "Left ventricular cavity" }, direction: "front", focus: [LV_CAVITY], context: [VENTRICLE_WALL] },
  { id: "tricuspid-valve", systemId: "cardiac", kind: "structure", name: { vi: "Van ba lá", en: "Tricuspid valve" }, direction: "superior", focus: [TRICUSPID], context: [WALLS] },
  { id: "mitral-valve", systemId: "cardiac", kind: "structure", name: { vi: "Van hai lá", en: "Mitral valve" }, direction: "superior", focus: [MITRAL], context: [WALLS] },
  { id: "aortic-valve", systemId: "cardiac", kind: "structure", name: { vi: "Van động mạch chủ", en: "Aortic valve" }, direction: "superior", focus: [AORTIC_VALVE], context: [WALLS] },
  { id: "pulmonary-valve", systemId: "cardiac", kind: "structure", name: { vi: "Van động mạch phổi", en: "Pulmonary valve" }, direction: "superior", focus: [PULMONARY_VALVE], context: [WALLS] },
  { id: "coronary-arteries", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch vành", en: "Coronary arteries" }, direction: "front", focus: [CORONARY_ARTERIES], context: [HEART] },
  { id: "cardiac-veins", systemId: "cardiac", kind: "structure", name: { vi: "Tĩnh mạch tim và xoang vành", en: "Cardiac veins and coronary sinus" }, direction: "back", focus: [CARDIAC_VEINS], context: [HEART] },
  { id: "ascending-aorta-arch", systemId: "cardiac", kind: "structure", name: { vi: "Động mạch chủ lên và cung động mạch chủ", en: "Ascending aorta and aortic arch" }, direction: "front", focus: [AORTA], context: [HEART] },
  { id: "pulmonary-vein-trunks", systemId: "cardiac", kind: "structure", name: { vi: "Các tĩnh mạch phổi", en: "Pulmonary veins" }, direction: "back", focus: [PULMONARY_VEINS], context: [HEART] },
  { id: "superior-vena-cava", systemId: "cardiac", kind: "structure", name: { vi: "Tĩnh mạch chủ trên", en: "Superior vena cava" }, direction: "front", focus: [VENAE_CAVAE], context: [HEART] },
];
