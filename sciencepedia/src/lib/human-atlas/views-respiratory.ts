import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ hô hấp (pilot, 2026-09-29)
 *
 * Ba cấp: tổng quan → nhóm/vùng → cấu trúc. Mỗi cấp chỉ là một TẬP MẢNH có sẵn
 * (không GLB riêng, không dời mảnh) — `scripts/atlas-views.ts` đổi các mã FMA
 * dưới đây thành mã mảnh và báo lỗi nếu mã nào không khớp mảnh nào.
 *
 * Danh sách rút từ audit 119 mảnh hệ hô hấp của BodyParts3D 4.0 + quan hệ FMA
 * (is-a, regional_part_of) trong cache OLS, không từ danh mục của atlas khác:
 *
 *   98  cây phế quản phân thuỳ (22 khái niệm) — FMA xếp từng cây vào thuỳ qua
 *       regional_part_of "Upper/Middle/Lower lobe part of right|left bronchial tree"
 *    2  phế quản gốc phải/trái · 1 khí quản · 1 nắp thanh môn
 *    5  mũi: sụn vách mũi, 2 sụn mũi bên, 2 xương xoăn mũi dưới
 *   12  cơ hầu: 3 cặp cơ khít hầu + cơ trâm hầu, vòi hầu, khẩu cái hầu
 *
 * Nhu mô phổi (5 thuỳ) KHÔNG có trong BodyParts3D: nhập từ Z-Anatomy (CC BY-SA,
 * `scripts/import-z-anatomy.ts`), mã `ZA-…` nên khớp bằng tên thay vì mã FMA.
 * Vẫn không có màng phổi, niêm mạc khoang mũi hay lòng hầu — đừng dựng bù. Sụn, cơ và dây chằng thanh quản nằm ở hệ xương/cơ/mô liên kết
 * của BodyParts3D; FMA xếp chúng là "Laryngeal cartilage", "Intrinsic muscle of
 * larynx", "Ligament of larynx" nên thẻ "Thanh quản" lấy chúng theo mã FMA.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

// Thuỳ phổi — mỗi mã là một cây phế quản phân thuỳ (FMA682xx/683xx).
const RIGHT_UPPER = rule("FMA68211", "FMA68212", "FMA68213");
const RIGHT_MIDDLE = rule("FMA68215", "FMA68214");
const RIGHT_LOWER = rule("FMA68216", "FMA68218", "FMA68321", "FMA68220", "FMA68221");
const LEFT_UPPER = rule("FMA68223", "FMA68225", "FMA68222", "FMA68226", "FMA68227");
const LEFT_LOWER = rule("FMA68228", "FMA68230", "FMA68231", "FMA68232", "FMA68233");
const RIGHT_TREE = [RIGHT_UPPER, RIGHT_MIDDLE, RIGHT_LOWER];
const LEFT_TREE = [LEFT_UPPER, LEFT_LOWER];

// Nhu mô thuỳ phổi (Z-Anatomy).
const lobe = (which: string, side: "left" | "right"): PartRule => ({
  systems: ["respiratory"],
  name: new RegExp(`^${which} lobe of ${side} lung$`, "i"),
});
const R_UPPER_LOBE = lobe("superior", "right");
const R_MIDDLE_LOBE = lobe("middle", "right");
const R_LOWER_LOBE = lobe("inferior", "right");
const L_UPPER_LOBE = lobe("superior", "left");
const L_LOWER_LOBE = lobe("inferior", "left");
const RIGHT_LUNG = [R_UPPER_LOBE, R_MIDDLE_LOBE, R_LOWER_LOBE];
const LEFT_LUNG = [L_UPPER_LOBE, L_LOWER_LOBE];

const TRACHEA = rule("FMA7394");
const RIGHT_MAIN = rule("FMA68418");
const LEFT_MAIN = rule("FMA7396");

/** Sụn mũi: vách, sụn mũi bên (hệ hô hấp) + sụn cánh mũi lớn (BodyParts3D xếp hệ xương). */
const NASAL_CARTILAGES = rule("FMA59503", "FMA59512", "FMA59513", "FMA59505", "FMA59506");
const CONCHAE = rule("FMA54737", "FMA54738");
const NASAL_BONES = rule("FMA53647", "FMA53648");

/** Cơ hầu (FMA "Muscle of pharynx") + đường đan hầu nơi các cơ khít bám. */
const PHARYNX = rule(
  "FMA46631", "FMA46632", "FMA46633", "FMA46634", "FMA46635", "FMA46636",
  "FMA46667", "FMA46668", "FMA46669", "FMA46670", "FMA46671", "FMA46672",
  "FMA55077",
);

const EPIGLOTTIS = rule("FMA55130");
/** FMA "Laryngeal cartilage": giáp, nhẫn, phễu, sừng, chêm. */
const LARYNX_CARTILAGES = rule(
  "FMA55099", "FMA9615", "FMA55113", "FMA55114", "FMA55115", "FMA55116", "FMA55117", "FMA55118",
);
/** Cơ nội thanh quản (FMA "Intrinsic muscle of larynx") và cơ nhẫn giáp, phễu nắp. */
const LARYNX_MUSCLES = rule(
  "FMA46577", "FMA46578", "FMA46580", "FMA46581", "FMA46582", "FMA46584", "FMA46585",
  "FMA46589", "FMA46590", "FMA46592", "FMA46593", "FMA46604", "FMA46605",
  "FMA46611", "FMA46612", "FMA46613", "FMA46614",
);
/** Dây chằng/màng thanh quản: dây thanh âm, giáp móng, nhẫn giáp, giáp nắp, móng nắp. */
const LARYNX_LIGAMENTS = rule(
  "FMA55245", "FMA55246", "FMA55133", "FMA55134", "FMA55138", "FMA55140", "FMA55141",
  "FMA55237", "FMA55230", "FMA55227",
);
const LARYNX = [LARYNX_CARTILAGES, EPIGLOTTIS, LARYNX_LIGAMENTS, LARYNX_MUSCLES];
const HYOID = rule("FMA52749");

export const RESPIRATORY_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ tổng quan
  {
    id: "respiratory-overview",
    systemId: "respiratory",
    kind: "overview",
    name: { vi: "Toàn bộ hệ hô hấp", en: "Whole respiratory system" },
    direction: "front",
    focus: [{ systems: ["respiratory"] }, ...LARYNX],
    terms: ["hệ hô hấp", "respiratory system", "phổi", "lungs", "đường thở", "airway"],
  },

  // ------------------------------------------------------------ nhóm / vùng
  {
    id: "respiratory-nose",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Mũi", en: "Nose" },
    direction: "anterolateral",
    focus: [NASAL_CARTILAGES, CONCHAE],
    context: [NASAL_BONES],
    terms: ["nasal", "đường hô hấp trên", "upper airway"],
  },
  {
    id: "respiratory-pharynx-larynx",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Hầu & thanh quản", en: "Pharynx & larynx" },
    direction: "posterolateral",
    focus: [PHARYNX, ...LARYNX],
    context: [HYOID, TRACHEA],
    terms: ["đường hô hấp trên", "upper airway"],
  },
  {
    id: "respiratory-trachea-bronchi",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Khí quản & phế quản gốc", en: "Trachea & main bronchi" },
    direction: "front",
    focus: [TRACHEA, RIGHT_MAIN, LEFT_MAIN],
    context: [LARYNX_CARTILAGES, ...RIGHT_TREE, ...LEFT_TREE],
    terms: ["đường hô hấp dưới", "lower airway", "bronchus", "phế quản"],
  },
  {
    id: "respiratory-lungs",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Phổi", en: "Lungs" },
    direction: "front",
    focus: [...RIGHT_LUNG, ...LEFT_LUNG],
    context: [TRACHEA, RIGHT_MAIN, LEFT_MAIN],
    terms: ["lung", "thùy phổi", "lobe"],
  },
  {
    id: "respiratory-bronchial-tree",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Cây phế quản", en: "Bronchial tree" },
    direction: "front",
    focus: [...RIGHT_TREE, ...LEFT_TREE],
    context: [TRACHEA, RIGHT_MAIN, LEFT_MAIN],
    terms: ["phổi", "lung", "phế quản", "bronchi"],
  },

  // ------------------------------------------------------------ cấu trúc
  {
    id: "nasal-cartilages",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Sụn mũi", en: "Nasal cartilages" },
    direction: "anterolateral",
    focus: [NASAL_CARTILAGES],
    context: [NASAL_BONES, CONCHAE],
    terms: ["mũi", "nose", "vách mũi", "septum"],
  },
  {
    id: "inferior-nasal-conchae",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Xương xoăn mũi dưới", en: "Inferior nasal conchae" },
    direction: "anterolateral",
    focus: [CONCHAE],
    context: [NASAL_CARTILAGES, NASAL_BONES],
    terms: ["mũi", "nose", "cuốn mũi"],
  },
  {
    id: "pharynx",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Hầu (lớp cơ)", en: "Pharynx (muscular wall)" },
    direction: "posterolateral",
    focus: [PHARYNX],
    context: [LARYNX_CARTILAGES, EPIGLOTTIS, HYOID],
    terms: ["họng", "throat", "cơ khít hầu", "constrictor"],
  },
  {
    id: "larynx",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thanh quản", en: "Larynx" },
    direction: "anterolateral",
    focus: LARYNX,
    context: [HYOID, TRACHEA],
    terms: ["sụn giáp", "thyroid cartilage", "dây thanh", "vocal"],
  },
  {
    id: "epiglottis",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Nắp thanh môn", en: "Epiglottis" },
    direction: "posterolateral",
    focus: [EPIGLOTTIS],
    context: [LARYNX_CARTILAGES, HYOID],
    terms: ["thanh quản", "larynx"],
  },
  {
    id: "trachea",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Khí quản", en: "Trachea" },
    direction: "front",
    focus: [TRACHEA],
    context: [LARYNX_CARTILAGES, RIGHT_MAIN, LEFT_MAIN],
    terms: ["windpipe"],
  },
  {
    id: "right-main-bronchus",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Phế quản gốc phải", en: "Right main bronchus" },
    direction: "front",
    focus: [RIGHT_MAIN],
    context: [TRACHEA, LEFT_MAIN],
    terms: ["phế quản chính", "bronchus"],
  },
  {
    id: "left-main-bronchus",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Phế quản gốc trái", en: "Left main bronchus" },
    direction: "front",
    focus: [LEFT_MAIN],
    context: [TRACHEA, RIGHT_MAIN],
    terms: ["phế quản chính", "bronchus"],
  },
  {
    id: "right-lung",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Phổi phải", en: "Right lung" },
    direction: "right",
    focus: RIGHT_LUNG,
    context: [TRACHEA, RIGHT_MAIN],
    terms: ["phổi", "lung"],
  },
  {
    id: "left-lung",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Phổi trái", en: "Left lung" },
    direction: "left",
    focus: LEFT_LUNG,
    context: [TRACHEA, LEFT_MAIN],
    terms: ["phổi", "lung"],
  },
  {
    id: "right-upper-lobe",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thuỳ trên phổi phải", en: "Right upper lobe" },
    direction: "right",
    focus: [R_UPPER_LOBE],
    context: [R_MIDDLE_LOBE, R_LOWER_LOBE],
    terms: ["phổi phải", "right lung", "thùy"],
  },
  {
    id: "right-middle-lobe",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thuỳ giữa phổi phải", en: "Right middle lobe" },
    direction: "right",
    focus: [R_MIDDLE_LOBE],
    context: [R_UPPER_LOBE, R_LOWER_LOBE],
    terms: ["phổi phải", "right lung", "thùy"],
  },
  {
    id: "right-lower-lobe",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thuỳ dưới phổi phải", en: "Right lower lobe" },
    direction: "right",
    focus: [R_LOWER_LOBE],
    context: [R_UPPER_LOBE, R_MIDDLE_LOBE],
    terms: ["phổi phải", "right lung", "thùy"],
  },
  {
    id: "left-upper-lobe",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thuỳ trên phổi trái", en: "Left upper lobe" },
    direction: "left",
    focus: [L_UPPER_LOBE],
    context: [L_LOWER_LOBE],
    terms: ["phổi trái", "left lung", "thùy", "thùy lưỡi", "lingula"],
  },
  {
    id: "left-lower-lobe",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thuỳ dưới phổi trái", en: "Left lower lobe" },
    direction: "left",
    focus: [L_LOWER_LOBE],
    context: [L_UPPER_LOBE],
    terms: ["phổi trái", "left lung", "thùy"],
  },
  {
    id: "right-bronchial-tree",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cây phế quản phổi phải", en: "Right bronchial tree" },
    direction: "right",
    focus: RIGHT_TREE,
    context: [TRACHEA, RIGHT_MAIN],
    terms: ["phổi phải", "right lung", "phế quản phân thùy", "segmental bronchus"],
  },
  {
    id: "left-bronchial-tree",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cây phế quản phổi trái", en: "Left bronchial tree" },
    direction: "left",
    focus: LEFT_TREE,
    context: [TRACHEA, LEFT_MAIN],
    terms: ["phổi trái", "left lung", "phế quản phân thùy", "segmental bronchus"],
  },
];
