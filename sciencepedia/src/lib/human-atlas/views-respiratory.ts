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

// Từng cơ nội thanh quản (cặp phải/trái cùng một cấu trúc) — hàng của bảng "Cấu trúc".
const POST_CRICOARYTENOID = rule("FMA46577", "FMA46578");
const LAT_CRICOARYTENOID = rule("FMA46580", "FMA46581");
const ARYTENOID = rule("FMA46582", "FMA46584", "FMA46585");
const THYROARYTENOID = rule("FMA46589", "FMA46590");
const VOCALIS = rule("FMA46592", "FMA46593");
const ARYEPIGLOTTIC = rule("FMA46604", "FMA46605");
const CRICOTHYROID = rule("FMA46611", "FMA46612", "FMA46613", "FMA46614");

// Thành ngực và cơ hô hấp (hệ xương/cơ của BodyParts3D).
const RIBS_STERNUM: PartRule = {
  systems: ["skeletal"],
  name: /\brib\b|costal cartilage|^manubrium$|^body of sternum$|^xiphoid process$/i,
};
const THORACIC_SPINE: PartRule = { systems: ["skeletal"], name: /thoracic vertebra$/i };
const CLAVICLES = rule("FMA13322", "FMA13323");
const DIAPHRAGM = rule("FMA13295");
const EXTERNAL_INTERCOSTAL = rule("FMA9756");
const STERNOCLEIDOMASTOID = rule("FMA13408", "FMA13409");
const SCALENES = rule("FMA13388", "FMA13389", "FMA13390", "FMA13391", "FMA13392", "FMA13393");
const PECTORALIS_MINOR = rule("FMA13375", "FMA13376");

// Mạch phổi. "Right anterior segmental artery" (FMA8620) bị loại như ở tổng quan
// tim: hai mảnh nằm ngang thận — lỗi vị trí của BodyParts3D (views-overviews.ts).
const PULMONARY_TRUNK = rule("FMA8612");
const RIGHT_PA = rule("FMA50872");
const PULMONARY_ARTERIES: PartRule = {
  systems: ["arterial"],
  name: /^(right|left) pulmonary artery$|segmental artery|lobar artery/i,
  exclude: /^right anterior segmental artery$/i,
};
const RIGHT_PV = rule("FMA49911", "FMA49914");
const PULMONARY_VEINS: PartRule = { systems: ["venous"], name: /pulmonary vein$|segmental vein$/i };
const HEART: PartRule = { systems: ["cardiac"] };

export const RESPIRATORY_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ tổng quan
  {
    id: "respiratory-overview",
    systemId: "respiratory",
    kind: "overview",
    name: { vi: "Toàn bộ hệ hô hấp", en: "Whole respiratory system" },
    direction: "front",
    // Sụn cánh mũi lớn và đường đan hầu nằm ở hệ khác của BodyParts3D; thêm vào để
    // bảng "Cấu trúc" có đủ hàng "Sụn mũi" và "Hầu" thay vì "Phần còn lại".
    focus: [{ systems: ["respiratory"] }, NASAL_CARTILAGES, PHARYNX, ...LARYNX],
    terms: ["hệ hô hấp", "respiratory system", "phổi", "lungs", "đường thở", "airway"],
  },

  // ------------------------------------------------------------ nhóm / vùng
  {
    id: "respiratory-upper-airway",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Đường hô hấp trên", en: "Upper respiratory tract" },
    direction: "left",
    focus: [NASAL_CARTILAGES, CONCHAE, PHARYNX, ...LARYNX],
    context: [NASAL_BONES, HYOID, TRACHEA],
    terms: ["upper airway", "mũi", "hầu", "thanh quản"],
  },
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
    id: "respiratory-laryngeal-muscles",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Cơ thanh quản", en: "Laryngeal muscles" },
    direction: "posterolateral",
    focus: [LARYNX_MUSCLES],
    context: [LARYNX_CARTILAGES, EPIGLOTTIS, HYOID],
    terms: ["cơ nội thanh quản", "intrinsic muscles of larynx", "dây thanh", "vocal"],
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
  {
    // Phổi trong khung xương: xương sườn, xương ức và cơ hoành hiện đặc như ảnh atlas;
    // cột sống ngực và xương đòn chỉ làm bối cảnh.
    id: "respiratory-lung-position",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Vị trí của phổi", en: "Location of the lungs" },
    direction: "front",
    focus: [...RIGHT_LUNG, ...LEFT_LUNG, TRACHEA, RIGHT_MAIN, LEFT_MAIN, RIBS_STERNUM, DIAPHRAGM],
    context: [THORACIC_SPINE, CLAVICLES],
    terms: ["lồng ngực", "thoracic cage", "cơ hoành", "diaphragm", "phổi", "lung"],
  },
  {
    // Mặt trong (trung thất) của phổi phải: camera đặt ở phía trái người mẫu (+x)
    // nhìn sang. Chỉ phổi phải được vẽ nên phổi trái không che.
    id: "respiratory-right-hilum",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Rốn phổi phải", en: "Hilum of the right lung" },
    direction: [1, 0.05, -0.1],
    focus: [...RIGHT_LUNG, RIGHT_MAIN, ...RIGHT_TREE, RIGHT_PA, RIGHT_PV],
    context: [TRACHEA],
    terms: ["rốn phổi", "hilum", "cuống phổi", "lung root", "mặt trung thất"],
  },
  {
    // Cơ chính (cơ hoành, gian sườn ngoài) + cơ phụ khi hít vào gắng sức (bậc thang: OpenStax
    // 22.3; ức đòn chũm, ngực bé: StatPearls "Anatomy, Thorax, Muscles", NBK538321).
    id: "respiratory-inspiration-muscles",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Cơ hít vào", en: "Muscles of inspiration" },
    direction: "front",
    focus: [DIAPHRAGM, EXTERNAL_INTERCOSTAL, STERNOCLEIDOMASTOID, SCALENES, PECTORALIS_MINOR],
    context: [RIBS_STERNUM, CLAVICLES, THORACIC_SPINE],
    terms: ["cơ hô hấp", "respiratory muscles", "hít vào", "inhalation", "cơ hoành", "diaphragm"],
  },
  {
    // Thở ra yên tĩnh là thụ động; thở ra gắng sức dùng cơ gian sườn trong và cơ thành bụng
    // (OpenStax A&P 2e 22.3, 11.4). BodyParts3D 4.0 chỉ có cơ chéo bụng ngoài trong nhóm cơ thành bụng.
    id: "respiratory-expiration-muscles",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Cơ thở ra", en: "Muscles of expiration" },
    direction: "front",
    missing: {
      vi: "Bộ dữ liệu thiếu cơ thẳng bụng, cơ chéo bụng trong và cơ ngang bụng",
      en: "The dataset lacks rectus abdominis, internal oblique and transversus abdominis",
    },
    terms: ["thở ra", "exhalation", "cơ hô hấp", "respiratory muscles"],
  },
  {
    id: "respiratory-innervation",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Thần kinh hệ hô hấp", en: "Respiratory innervation" },
    direction: "front",
    missing: {
      vi: "Bộ dữ liệu không có dây thần kinh hoành",
      en: "The dataset has no phrenic nerve",
    },
    terms: ["thần kinh", "nerve", "phế vị", "vagus", "thần kinh hoành", "phrenic"],
  },
  {
    // Tim và phổi làm bối cảnh: máu đi từ thất phải qua phổi về nhĩ trái.
    id: "respiratory-pulmonary-circulation",
    systemId: "respiratory",
    kind: "group",
    name: { vi: "Tuần hoàn phổi", en: "Pulmonary circulation" },
    direction: "front",
    focus: [PULMONARY_TRUNK, PULMONARY_ARTERIES, PULMONARY_VEINS],
    context: [HEART, ...RIGHT_LUNG, ...LEFT_LUNG],
    terms: ["động mạch phổi", "pulmonary artery", "tĩnh mạch phổi", "pulmonary vein", "tiểu tuần hoàn"],
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

  // ---------------------------------------------- cấu trúc của các góc nhìn mới
  // Cơ thanh quản, thành ngực, cơ hô hấp, mạch phổi. Mỗi cấu trúc dùng lại được ở
  // nhiều góc nhìn (bảng "Cấu trúc" rút theo tập mảnh — xem atlas-model.ts).
  {
    id: "posterior-cricoarytenoid",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ nhẫn phễu sau", en: "Posterior cricoarytenoid" },
    direction: "back",
    focus: [POST_CRICOARYTENOID],
    context: [LARYNX_CARTILAGES],
  },
  {
    id: "lateral-cricoarytenoid",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ nhẫn phễu bên", en: "Lateral cricoarytenoid" },
    direction: "posterolateral",
    focus: [LAT_CRICOARYTENOID],
    context: [LARYNX_CARTILAGES],
  },
  {
    id: "arytenoid-muscle",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ liên phễu", en: "Arytenoid muscle" },
    direction: "back",
    focus: [ARYTENOID],
    context: [LARYNX_CARTILAGES],
    terms: ["cơ phễu ngang", "cơ phễu chéo", "transverse arytenoid", "oblique arytenoid"],
  },
  {
    id: "thyroarytenoid",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ giáp phễu", en: "Thyroarytenoid" },
    direction: "posterolateral",
    focus: [THYROARYTENOID],
    context: [LARYNX_CARTILAGES],
  },
  {
    id: "vocalis",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ thanh âm", en: "Vocalis" },
    direction: "posterolateral",
    focus: [VOCALIS],
    context: [LARYNX_CARTILAGES],
    terms: ["dây thanh", "vocal"],
  },
  {
    id: "aryepiglottic-muscle",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ phễu nắp thanh môn", en: "Aryepiglottic muscle" },
    direction: "back",
    focus: [ARYEPIGLOTTIC],
    context: [LARYNX_CARTILAGES, EPIGLOTTIS],
  },
  {
    id: "cricothyroid",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ nhẫn giáp", en: "Cricothyroid" },
    direction: "anterolateral",
    focus: [CRICOTHYROID],
    context: [LARYNX_CARTILAGES],
  },
  {
    id: "ribs-sternum",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Xương sườn, sụn sườn và xương ức", en: "Ribs, costal cartilages and sternum" },
    direction: "front",
    focus: [RIBS_STERNUM],
    terms: ["lồng ngực", "thoracic cage", "sụn sườn", "costal cartilage"],
  },
  {
    id: "diaphragm",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ hoành", en: "Diaphragm" },
    direction: "front",
    focus: [DIAPHRAGM],
    context: [RIBS_STERNUM],
  },
  {
    id: "external-intercostals",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ gian sườn ngoài", en: "External intercostal muscles" },
    direction: "front",
    focus: [EXTERNAL_INTERCOSTAL],
    context: [RIBS_STERNUM],
  },
  {
    id: "sternocleidomastoid",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ ức đòn chũm", en: "Sternocleidomastoid" },
    direction: "anterolateral",
    focus: [STERNOCLEIDOMASTOID],
    context: [CLAVICLES],
  },
  {
    id: "scalenes",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ bậc thang", en: "Scalene muscles" },
    direction: "anterolateral",
    focus: [SCALENES],
    terms: ["scalenus"],
  },
  {
    id: "pectoralis-minor",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Cơ ngực bé", en: "Pectoralis minor" },
    direction: "front",
    focus: [PECTORALIS_MINOR],
    context: [RIBS_STERNUM],
  },
  {
    id: "pulmonary-trunk",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Thân động mạch phổi", en: "Pulmonary trunk" },
    direction: "front",
    focus: [PULMONARY_TRUNK],
    context: [HEART],
  },
  {
    id: "pulmonary-arteries",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Động mạch phổi", en: "Pulmonary arteries" },
    direction: "front",
    focus: [PULMONARY_ARTERIES],
    context: [PULMONARY_TRUNK],
  },
  {
    id: "right-pulmonary-artery",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Động mạch phổi phải", en: "Right pulmonary artery" },
    direction: "front",
    focus: [RIGHT_PA],
    context: [PULMONARY_TRUNK],
  },
  {
    id: "pulmonary-veins",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Tĩnh mạch phổi", en: "Pulmonary veins" },
    direction: "front",
    focus: [PULMONARY_VEINS],
    context: [HEART],
  },
  {
    id: "right-pulmonary-veins",
    systemId: "respiratory",
    kind: "structure",
    name: { vi: "Tĩnh mạch phổi phải", en: "Right pulmonary veins" },
    direction: "front",
    focus: [RIGHT_PV],
    context: [HEART],
  },
];
