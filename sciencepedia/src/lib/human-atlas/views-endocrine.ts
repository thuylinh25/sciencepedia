import type { AtlasViewDef, PartRule } from "./views";
import { ARCH_BRANCHES, ASC_ARCH } from "./views-arterial";
import { VENAE_CAVAE } from "./views-venous";
import { DEFERENT_DUCTS, PENIS, TESTES } from "./views-reproductive";

/*
 * ## Góc nhìn theo hệ — Hệ nội tiết (2026-09-30)
 *
 * Tổng quan ở `views-overviews.ts`. Audit: tuyến yên, tuyến tùng, 2 thượng thận
 * (BodyParts3D) + tuyến giáp, 4 tuyến cận giáp (Z-Anatomy, mã `ZA-…` nên khớp
 * bằng tên). Tuỵ nội tiết (đảo tuỵ) và tinh hoàn có nội tiết nhưng không tách
 * riêng phần nội tiết — không đưa vào đây.
 *
 * ## Xếp theo atlas tham chiếu (chủ sản phẩm, 2026-10-27)
 *
 * Lưới xếp theo "Endocrine System Views" của Human Anatomy Atlas (chỉ tham
 * chiếu danh mục — không lấy hình của nó): cơ quan nội tiết (tổng quan), tuyến
 * yên, tuyến tùng, tuyến giáp, tuyến cận giáp, mạch máu tuyến giáp, tuyến ức,
 * tuyến thượng thận, tuỵ và gan, tuyến sinh dục, cơ quan nội tiết thứ phát —
 * rồi ba nhóm cũ giữ cho deep link. Năm góc nhóm đầu là mới:
 *
 * - Mạch máu tuyến giáp: dữ liệu chỉ có động mạch giáp DƯỚI và tĩnh mạch giáp
 *   TRÊN — động mạch giáp trên là nhánh của động mạch cảnh ngoài (cả cây đó
 *   chưa có, xem `cardiac-carotid-jugular`), tĩnh mạch giáp dưới cũng chưa có.
 * - Tuyến ức: hai thuỳ mang hệ bạch huyết trong dữ liệu (cơ quan lympho), atlas
 *   tham chiếu xếp nó ở cả hai hệ; quy tắc đồng bộ `views-lymphatic.ts`.
 * - Tuỵ và gan: tuỵ không tách đảo tuỵ khỏi tuỵ ngoại tiết (ghi chú audit ở
 *   trên), nên góc này là cả tuỵ như atlas tham chiếu.
 * - Tuyến sinh dục: bộ dữ liệu là cơ thể NAM — chỉ có tinh hoàn. Buồng trứng
 *   không có trong dữ liệu, đừng ghi như thể có cả hai.
 * - Cơ quan nội tiết thứ phát: tim (ANP), thận (erythropoietin, renin) và ống
 *   tiêu hoá (gastrin, secretin…) — các cơ quan có chức năng nội tiết thứ phát
 *   mà bộ dữ liệu dựng được, đúng hình ở ảnh tham chiếu (ống tiêu hoá giữa thân).
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const THYROID: PartRule = { systems: ["endocrine"], name: /^thyroid gland$/i };
const PARATHYROIDS: PartRule = { systems: ["endocrine"], name: /parathyroid gland$/i };
const ADRENALS = rule("FMA15629", "FMA15630");
const PITUITARY = rule("FMA13889");
const PINEAL = rule("FMA62033");
const LARYNX_TRACHEA = rule("FMA55099", "FMA9615", "FMA7394");
const KIDNEYS = rule("FMA7204", "FMA7205");
const SKULL_BASE = rule("FMA52736", "FMA52735");

// Mạch quanh tuyến giáp. Đồng bộ `CAROTIDS`/`JUGULARS` của views-cardiac.ts.
const THYROID_ARTERIES: PartRule = { systems: ["arterial"], name: /inferior thyroid artery$/i };
const THYROID_VEINS: PartRule = { systems: ["venous"], name: /superior thyroid vein$/i };
const CAROTIDS: PartRule = { systems: ["arterial"], name: /(common|internal) carotid artery$/i };
const JUGULARS: PartRule = { systems: ["venous"], name: /internal jugular vein$/i };

// Tuyến ức và bối cảnh ngực — đồng bộ bối cảnh của `lymphatic-thymus`
// (views-lymphatic.ts): không xương ức/sụn sườn vì tuyến ức nằm ngay sau
// xương ức, vẽ mờ vẫn che kín nó.
const THYMUS: PartRule = { systems: ["lymphatic"], name: /lobe of thymus$/i };
const HEART: PartRule = { systems: ["cardiac"] };
const RIBS: PartRule = { systems: ["skeletal"], name: /\brib\b|thoracic vertebra$/i };

// Bụng — đồng bộ views-digestive.ts (gan: 8 phân thuỳ + thuỳ đuôi).
const LIVER = rule(
  "FMA15739", "FMA15741", "FMA15742", "FMA15743", "FMA15744", "FMA15745", "FMA15746", "FMA15747",
  "FMA13365",
);
const PANCREAS = rule("FMA7198", "FMA63120", "FMA10419", "FMA63103");
const GALLBLADDER = rule("FMA7202");
const ESOPHAGUS = rule("FMA7131");
const STOMACH = rule("FMA7148");
const DUODENUM = rule("FMA7206");
const JEJUNUM = rule("FMA16981", "FMA16982", "FMA16983");
const ILEUM = rule("FMA14964", "FMA14965", "FMA14966");
const COLON = rule("FMA14545", "FMA14546", "FMA14547");
const RECTUM = rule("FMA14544");

// Mào tinh — đồng bộ `EPIDIDYMIS` của views-reproductive.ts.
const EPIDIDYMIS = rule("FMA18256", "FMA18257");

export const ENDOCRINE_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ nhóm theo atlas tham chiếu
  {
    id: "endocrine-thyroid-vasculature",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Mạch máu tuyến giáp", en: "Thyroid vasculature" },
    direction: "anterolateral",
    focus: [THYROID, THYROID_ARTERIES, THYROID_VEINS],
    context: [CAROTIDS, JUGULARS, LARYNX_TRACHEA],
    partial: {
      vi: "Thiếu động mạch giáp trên (nhánh của động mạch cảnh ngoài) và các tĩnh mạch giáp dưới",
      en: "The superior thyroid artery (a branch of the external carotid) and the inferior thyroid veins are missing",
    },
    terms: ["mạch máu tuyến giáp", "thyroid vasculature", "động mạch giáp", "tĩnh mạch giáp", "thyroid artery", "thyroid vein"],
    quality: "acceptable",
  },
  {
    id: "endocrine-thymus",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuyến ức", en: "Thymus" },
    direction: "front",
    focus: [THYMUS],
    context: [HEART, ASC_ARCH, ARCH_BRANCHES, VENAE_CAVAE, RIBS],
    // Như `lymphatic-thymus`: riêng tuyến ức thì phóng sát, mất chỗ của nó trên tim; khung cả tim.
    camera: { frame: [HEART] },
    terms: ["tuyến ức", "thymus"],
    quality: "acceptable",
  },
  {
    id: "endocrine-pancreas-liver",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuỵ và gan", en: "Pancreas and liver" },
    direction: "front",
    focus: [PANCREAS, LIVER],
    context: [GALLBLADDER, DUODENUM, STOMACH],
    terms: ["tuỵ", "pancreas", "gan", "liver", "đảo tuỵ", "islets of langerhans"],
    quality: "good",
  },
  {
    id: "endocrine-gonads",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuyến sinh dục", en: "Gonads" },
    direction: "anterolateral",
    focus: [TESTES, EPIDIDYMIS],
    context: [DEFERENT_DUCTS, PENIS],
    // Khung như `reproductive-testis`: riêng hai tinh hoàn thì phóng to lấp khung.
    camera: { frame: [PENIS], fill: 0.55, thumbnailFill: 0.7 },
    partial: {
      vi: "Bộ dữ liệu là cơ thể nam — chỉ có tinh hoàn; buồng trứng không có trong dữ liệu",
      en: "The dataset is a male body — it holds the testes only; the ovaries are not in the data",
    },
    terms: ["tuyến sinh dục", "gonads", "tinh hoàn", "testis", "testosterone"],
    quality: "acceptable",
  },
  {
    id: "endocrine-secondary-organs",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Cơ quan nội tiết thứ phát", en: "Secondary endocrine organs" },
    direction: "front",
    focus: [HEART, KIDNEYS, LIVER, ESOPHAGUS, STOMACH, DUODENUM, JEJUNUM, ILEUM, COLON, RECTUM],
    terms: ["nội tiết thứ phát", "secondary endocrine", "cơ quan thứ phát", "secondary organs"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm cũ, giữ cho deep link
  {
    id: "endocrine-thyroid-parathyroid",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuyến giáp và cận giáp", en: "Thyroid and parathyroid glands" },
    direction: "anterolateral",
    focus: [THYROID, PARATHYROIDS],
    context: [LARYNX_TRACHEA],
    terms: ["thyroid", "parathyroid", "bướu cổ"],
    quality: "good",
  },
  {
    id: "endocrine-adrenals",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuyến thượng thận", en: "Adrenal glands" },
    direction: "front",
    focus: [ADRENALS],
    context: [KIDNEYS],
    terms: ["adrenal", "suprarenal", "thượng thận"],
    quality: "good",
  },
  {
    id: "endocrine-pituitary-pineal",
    systemId: "endocrine",
    kind: "group",
    name: { vi: "Tuyến yên và tuyến tùng", en: "Pituitary and pineal glands" },
    direction: "side",
    focus: [PITUITARY, PINEAL],
    context: [SKULL_BASE],
    terms: ["pituitary", "hypophysis", "pineal", "mấu não"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ cấu trúc, theo thứ tự atlas tham chiếu
  { id: "pituitary-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến yên", en: "Pituitary gland" }, direction: "side", focus: [PITUITARY], context: [SKULL_BASE] },
  { id: "pineal-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến tùng", en: "Pineal gland" }, direction: "side", focus: [PINEAL], context: [SKULL_BASE] },
  { id: "thyroid-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến giáp", en: "Thyroid gland" }, direction: "front", focus: [THYROID], context: [LARYNX_TRACHEA] },
  { id: "parathyroid-glands", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến cận giáp", en: "Parathyroid glands" }, direction: "back", focus: [PARATHYROIDS], context: [THYROID] },
  { id: "adrenal-glands", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến thượng thận", en: "Adrenal glands" }, direction: "front", focus: [ADRENALS], context: [KIDNEYS] },
  // Cặp mạch của góc "Mạch máu tuyến giáp": bảng cấu trúc của một góc nhóm phải
  // phủ đúng tập nổi bật (test ở atlas-model.test.ts), nên mạch giáp có cấu
  // trúc riêng ở đây — như cặp cảnh trong/cảnh chung ở hệ tim.
  { id: "inferior-thyroid-arteries", systemId: "endocrine", kind: "structure", name: { vi: "Động mạch giáp dưới", en: "Inferior thyroid arteries" }, direction: "front", focus: [THYROID_ARTERIES], context: [THYROID] },
  { id: "superior-thyroid-veins", systemId: "endocrine", kind: "structure", name: { vi: "Tĩnh mạch giáp trên", en: "Superior thyroid veins" }, direction: "front", focus: [THYROID_VEINS], context: [THYROID] },
];
