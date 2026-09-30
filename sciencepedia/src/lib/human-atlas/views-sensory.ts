import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Cơ quan giác quan (2026-09-30)
 *
 * Audit dữ liệu: hệ "sensory" của BodyParts3D 4.0 có mắt (củng mạc, giác mạc,
 * màng mạch, vành mi, mống mắt, thể thuỷ tinh + dây chằng treo, thể kính, võng
 * mạc, tiền phòng), bộ lệ, sụn mi và MỘT mảnh tai ngoài. KHÔNG có tai giữa, tai
 * trong, biểu mô khứu giác hay nụ vị giác.
 *
 * Hai thứ BodyParts3D xếp nhầm vào hệ này và KHÔNG thuộc góc nhìn nào ở đây:
 * mạc giữ gân gấp cổ tay (mô liên kết cổ tay) và xương lệ (xương — chỉ làm bối
 * cảnh cho bộ lệ). Chưa sửa SYSTEM_CORRECTIONS: chờ chủ sản phẩm như 16 cơ trước.
 * Cơ vận nhãn ở hệ cơ, ròng rọc và dây chằng hãm ở mô liên kết — lấy theo mã FMA.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

// Nhãn cầu — mỗi cặp phải/trái.
const SCLERA = rule("FMA58271", "FMA58272");
const CORNEA = rule("FMA58239", "FMA58240");
const CHOROID = rule("FMA58299", "FMA58300");
const CILIARY = rule("FMA58483", "FMA58484");
const IRIS = rule("FMA58236", "FMA58237");
const LENS = rule("FMA58242", "FMA58243", "FMA58839", "FMA58840");
const VITREOUS = rule("FMA58828", "FMA58829");
const RETINA = rule("FMA58607", "FMA58608");
const ANTERIOR_CHAMBER = rule("FMA58081", "FMA58082");
const EYEBALLS = [SCLERA, CORNEA, CHOROID, CILIARY, IRIS, LENS, VITREOUS, RETINA, ANTERIOR_CHAMBER];
/**
 * Nhãn cầu phải — khung các góc nhìn một mắt. Các lớp (hàng của bảng "Cấu trúc")
 * lấy theo mắt phải: góc nhìn "Nhãn cầu" chỉ dựng một mắt, cấu trúc gộp hai mắt
 * không nằm trọn trong nó. Hai mắt ở tổng quan chia thành "Nhãn cầu phải/trái".
 */
const R_SCLERA = rule("FMA58271");
const R_CORNEA = rule("FMA58239");
const R_CHOROID = rule("FMA58299");
const R_CILIARY = rule("FMA58483");
const R_IRIS = rule("FMA58236");
const R_LENS = rule("FMA58242", "FMA58839");
const R_VITREOUS = rule("FMA58828");
const R_RETINA = rule("FMA58607");
const R_ANTERIOR_CHAMBER = rule("FMA58081");
const RIGHT_EYEBALL = rule(
  "FMA58271", "FMA58239", "FMA58299", "FMA58483", "FMA58236", "FMA58242", "FMA58839", "FMA58828", "FMA58607", "FMA58081",
);
const LEFT_EYEBALL = rule(
  "FMA58272", "FMA58240", "FMA58300", "FMA58484", "FMA58237", "FMA58243", "FMA58840", "FMA58829", "FMA58608", "FMA58082",
);

// Cơ vận nhãn + nâng mi (hệ cơ), vòng gân chung, ròng rọc, dây chằng hãm (mô liên kết) — mắt phải.
const R_SUPERIOR_RECTUS = rule("FMA49044");
const R_INFERIOR_RECTUS = rule("FMA49046");
const R_MEDIAL_RECTUS = rule("FMA49056");
const R_LATERAL_RECTUS = rule("FMA49054");
const R_SUPERIOR_OBLIQUE = rule("FMA49052");
const R_INFERIOR_OBLIQUE = rule("FMA49050");
const R_LEVATOR = rule("FMA49048", "FMA54159");
const R_EXTRAOCULAR = [R_SUPERIOR_RECTUS, R_INFERIOR_RECTUS, R_MEDIAL_RECTUS, R_LATERAL_RECTUS, R_SUPERIOR_OBLIQUE, R_INFERIOR_OBLIQUE, R_LEVATOR];
const R_ORBIT_CONNECTIVE = rule("FMA49072", "FMA49067", "FMA49144", "FMA49147");
const OPTIC_NERVES = rule("FMA50875", "FMA50878");

// Bộ lệ và mi.
const LACRIMAL_GLAND = rule("FMA59102", "FMA59103");
const LACRIMAL_LAKE = rule("FMA59541", "FMA59542");
const CANALICULI = rule("FMA59582", "FMA59583");
const LACRIMAL_SAC = rule("FMA59545", "FMA59546");
const NASOLACRIMAL = rule("FMA59555", "FMA59556");
const LACRIMAL = [LACRIMAL_GLAND, LACRIMAL_LAKE, CANALICULI, LACRIMAL_SAC, NASOLACRIMAL];
const TARSAL_PLATES = rule("FMA59089", "FMA59090", "FMA59091", "FMA59092");
const LACRIMAL_BONES = rule("FMA53645", "FMA53646");

const EXTERNAL_EAR = rule("FMA52781");

export const SENSORY_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "sensory-overview",
    systemId: "sensory",
    kind: "overview",
    name: { vi: "Cơ quan giác quan", en: "Sense organs" },
    direction: "anterolateral",
    focus: [...EYEBALLS, ...LACRIMAL, TARSAL_PLATES, EXTERNAL_EAR],
    partial: {
      vi: "Chỉ có mắt và tai ngoài; thiếu tai giữa, tai trong, biểu mô khứu giác và nụ vị giác",
      en: "Eyes and external ear only; the middle and inner ear, olfactory epithelium and taste buds are missing",
    },
    terms: ["giác quan", "sense", "mắt", "eye", "tai", "ear"],
    quality: "needs-improvement",
  },
  {
    id: "sensory-eyeball",
    systemId: "sensory",
    kind: "group",
    name: { vi: "Nhãn cầu", en: "Eyeball" },
    direction: [-0.35, 0.1, 1],
    focus: [RIGHT_EYEBALL],
    context: [OPTIC_NERVES],
    terms: ["mắt", "eye", "eyeball", "giác mạc", "võng mạc", "thấu kính"],
    quality: "acceptable",
  },
  {
    id: "sensory-eye-muscles",
    systemId: "sensory",
    kind: "group",
    // "Cơ vận nhãn" tiếng Việt chỉ 6 cơ xoay nhãn cầu; cơ nâng mi trên nâng mi, không xoay mắt.
    name: { vi: "Cơ vận nhãn và cơ nâng mi trên", en: "Extraocular muscles" },
    direction: [-0.8, 0.35, 0.5],
    focus: [...R_EXTRAOCULAR, R_ORBIT_CONNECTIVE],
    context: [RIGHT_EYEBALL, OPTIC_NERVES],
    terms: ["cơ mắt", "eye muscles", "cơ thẳng", "rectus", "cơ chéo", "oblique"],
    quality: "acceptable",
  },
  {
    id: "sensory-optic-nerves",
    systemId: "sensory",
    kind: "group",
    name: { vi: "Nhãn cầu và thần kinh thị giác", en: "Eyeballs and optic nerves" },
    direction: "superior",
    focus: [...EYEBALLS, OPTIC_NERVES],
    terms: ["thị giác", "vision", "dây II", "cranial nerve II"],
    quality: "acceptable",
  },
  {
    id: "sensory-lacrimal",
    systemId: "sensory",
    kind: "group",
    name: { vi: "Bộ lệ", en: "Lacrimal apparatus" },
    direction: "front",
    focus: LACRIMAL,
    context: [SCLERA, CORNEA, LACRIMAL_BONES, TARSAL_PLATES],
    terms: ["nước mắt", "tears", "tuyến lệ", "lacrimal gland", "lệ đạo"],
    quality: "acceptable",
  },
  {
    id: "sensory-ear",
    systemId: "sensory",
    kind: "group",
    name: { vi: "Tai ngoài", en: "External ear" },
    direction: "side",
    focus: [EXTERNAL_EAR],
    partial: { vi: "Thiếu tai giữa và tai trong", en: "The middle and inner ear are missing" },
    terms: ["tai", "ear", "vành tai", "auricle"],
    quality: "needs-improvement",
  },

  { id: "right-eyeball", systemId: "sensory", kind: "structure", name: { vi: "Nhãn cầu phải", en: "Right eyeball" }, direction: [-0.35, 0.1, 1], focus: [RIGHT_EYEBALL], context: [OPTIC_NERVES], terms: ["mắt", "eye"] },
  { id: "left-eyeball", systemId: "sensory", kind: "structure", name: { vi: "Nhãn cầu trái", en: "Left eyeball" }, direction: [0.35, 0.1, 1], focus: [LEFT_EYEBALL], context: [OPTIC_NERVES], terms: ["mắt", "eye"] },
  { id: "sclera", systemId: "sensory", kind: "structure", name: { vi: "Củng mạc", en: "Sclera" }, direction: [-0.35, 0.1, 1], focus: [R_SCLERA], context: [R_CORNEA] },
  { id: "cornea", systemId: "sensory", kind: "structure", name: { vi: "Giác mạc", en: "Cornea" }, direction: [-0.35, 0.1, 1], focus: [R_CORNEA], context: [R_SCLERA] },
  { id: "choroid", systemId: "sensory", kind: "structure", name: { vi: "Màng mạch", en: "Choroid" }, direction: [-0.35, 0.1, 1], focus: [R_CHOROID], context: [R_SCLERA], terms: ["hắc mạc"] },
  { id: "ciliary-body", systemId: "sensory", kind: "structure", name: { vi: "Vành mi (thể mi)", en: "Pars plicata of the ciliary body" }, direction: [-0.35, 0.1, 1], focus: [R_CILIARY], context: [R_LENS], terms: ["thể mi", "ciliary body", "corona ciliaris"] },
  { id: "iris", systemId: "sensory", kind: "structure", name: { vi: "Mống mắt", en: "Iris" }, direction: [-0.35, 0.1, 1], focus: [R_IRIS], context: [R_CORNEA] },
  { id: "lens", systemId: "sensory", kind: "structure", name: { vi: "Thể thuỷ tinh và dây chằng treo", en: "Lens and suspensory ligament" }, direction: [-0.35, 0.1, 1], focus: [R_LENS], context: [R_CILIARY], terms: ["thấu kính", "thuỷ tinh thể", "crystalline lens", "zonule"] },
  { id: "vitreous-body", systemId: "sensory", kind: "structure", name: { vi: "Thể kính", en: "Vitreous body" }, direction: [-0.35, 0.1, 1], focus: [R_VITREOUS], context: [R_RETINA], terms: ["dịch kính", "vitreous humor"] },
  { id: "retina", systemId: "sensory", kind: "structure", name: { vi: "Võng mạc", en: "Retina" }, direction: [-0.35, 0.1, 1], focus: [R_RETINA], context: [R_CHOROID] },
  { id: "anterior-chamber", systemId: "sensory", kind: "structure", name: { vi: "Tiền phòng", en: "Anterior chamber" }, direction: [-0.35, 0.1, 1], focus: [R_ANTERIOR_CHAMBER], context: [R_CORNEA, R_IRIS], terms: ["thuỷ dịch", "aqueous humor"] },
  { id: "superior-rectus", systemId: "sensory", kind: "structure", name: { vi: "Cơ thẳng trên", en: "Superior rectus" }, direction: "superior", focus: [R_SUPERIOR_RECTUS], context: [RIGHT_EYEBALL] },
  { id: "inferior-rectus", systemId: "sensory", kind: "structure", name: { vi: "Cơ thẳng dưới", en: "Inferior rectus" }, direction: "inferior", focus: [R_INFERIOR_RECTUS], context: [RIGHT_EYEBALL] },
  { id: "medial-rectus", systemId: "sensory", kind: "structure", name: { vi: "Cơ thẳng trong", en: "Medial rectus" }, direction: "superior", focus: [R_MEDIAL_RECTUS], context: [RIGHT_EYEBALL] },
  { id: "lateral-rectus", systemId: "sensory", kind: "structure", name: { vi: "Cơ thẳng ngoài", en: "Lateral rectus" }, direction: "right", focus: [R_LATERAL_RECTUS], context: [RIGHT_EYEBALL] },
  { id: "superior-oblique", systemId: "sensory", kind: "structure", name: { vi: "Cơ chéo trên", en: "Superior oblique" }, direction: "superior", focus: [R_SUPERIOR_OBLIQUE], context: [RIGHT_EYEBALL] },
  { id: "inferior-oblique", systemId: "sensory", kind: "structure", name: { vi: "Cơ chéo dưới", en: "Inferior oblique" }, direction: "inferior", focus: [R_INFERIOR_OBLIQUE], context: [RIGHT_EYEBALL] },
  { id: "levator-palpebrae", systemId: "sensory", kind: "structure", name: { vi: "Cơ nâng mi trên", en: "Levator palpebrae superioris" }, direction: "superior", focus: [R_LEVATOR], context: [RIGHT_EYEBALL] },
  { id: "orbital-connective", systemId: "sensory", kind: "structure", name: { vi: "Vòng gân chung, ròng rọc và dây chằng hãm", en: "Common tendinous ring, trochlea and check ligaments" }, direction: [-0.8, 0.35, 0.5], focus: [R_ORBIT_CONNECTIVE], context: [RIGHT_EYEBALL] },
  { id: "optic-nerves", systemId: "sensory", kind: "structure", name: { vi: "Dây thần kinh thị giác (II)", en: "Optic nerves (II)" }, direction: "superior", focus: [OPTIC_NERVES], context: EYEBALLS },
  { id: "lacrimal-glands", systemId: "sensory", kind: "structure", name: { vi: "Tuyến lệ", en: "Lacrimal glands" }, direction: "front", focus: [LACRIMAL_GLAND], context: [SCLERA] },
  { id: "lacrimal-lakes", systemId: "sensory", kind: "structure", name: { vi: "Hồ lệ", en: "Lacrimal lakes" }, direction: "front", focus: [LACRIMAL_LAKE], context: [SCLERA] },
  { id: "lacrimal-canaliculi", systemId: "sensory", kind: "structure", name: { vi: "Tiểu quản lệ", en: "Lacrimal canaliculi" }, direction: "front", focus: [CANALICULI], context: [LACRIMAL_SAC] },
  { id: "lacrimal-sacs", systemId: "sensory", kind: "structure", name: { vi: "Túi lệ", en: "Lacrimal sacs" }, direction: "front", focus: [LACRIMAL_SAC], context: [NASOLACRIMAL, LACRIMAL_BONES] },
  { id: "nasolacrimal-ducts", systemId: "sensory", kind: "structure", name: { vi: "Ống lệ mũi", en: "Nasolacrimal ducts" }, direction: "front", focus: [NASOLACRIMAL], context: [LACRIMAL_SAC] },
  { id: "tarsal-plates", systemId: "sensory", kind: "structure", name: { vi: "Sụn mi", en: "Tarsal plates" }, direction: "front", focus: [TARSAL_PLATES], context: [SCLERA, CORNEA], terms: ["mi mắt", "eyelid"] },
  { id: "external-ear", systemId: "sensory", kind: "structure", name: { vi: "Tai ngoài", en: "External ear" }, direction: "side", focus: [EXTERNAL_EAR] },
];
