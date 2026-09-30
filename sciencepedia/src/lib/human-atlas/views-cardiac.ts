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
  name: /coronary artery$|interventricular branch|marginal branch of right|ventricular branch of right|conus branch|diagonal branch|circumflex branch of left/i,
};
const CARDIAC_VEINS: PartRule = { systems: ["venous"], name: /cardiac vein$|^coronary sinus$/i };
const AORTA: PartRule = { systems: ["arterial"], name: /^(ascending aorta|arch of aorta)$/i };
const PULMONARY_TRUNK = rule("FMA8612");
const VENAE_CAVAE: PartRule = { systems: ["venous"], name: /^superior vena cava$/i };
const IVC: PartRule = { systems: ["venous"], name: /^inferior vena cava$/i };
const PULMONARY_VEINS: PartRule = { systems: ["venous"], name: /^(right|left) (superior|inferior) pulmonary vein$/i };
const HEART: PartRule = { systems: ["cardiac"] };

export const CARDIAC_VIEWS: readonly AtlasViewDef[] = [
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

  { id: "right-atrium", systemId: "cardiac", kind: "structure", name: { vi: "Tâm nhĩ phải", en: "Right atrium" }, direction: "right", focus: [RA], context: [VENTRICLE_WALL] },
  { id: "left-atrium", systemId: "cardiac", kind: "structure", name: { vi: "Tâm nhĩ trái", en: "Left atrium" }, direction: "back", focus: [LA], context: [VENTRICLE_WALL] },
  { id: "ventricular-wall", systemId: "cardiac", kind: "structure", name: { vi: "Thành tâm thất", en: "Ventricular wall" }, direction: "front", focus: [VENTRICLE_WALL], context: [RA, LA], terms: ["cơ tim", "myocardium"] },
  // Khoang nhĩ riêng: "Các buồng tim" chỉ hiện khoang, "Tâm nhĩ" (thành + khoang) không nằm trọn trong đó.
  { id: "right-atrium-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm nhĩ phải", en: "Right atrial cavity" }, direction: "right", focus: [RA_CAVITY], context: [RA] },
  { id: "left-atrium-cavity", systemId: "cardiac", kind: "structure", name: { vi: "Khoang tâm nhĩ trái", en: "Left atrial cavity" }, direction: "back", focus: [LA_CAVITY], context: [LA] },
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
