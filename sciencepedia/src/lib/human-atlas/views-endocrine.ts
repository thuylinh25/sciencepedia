import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ nội tiết (2026-09-30)
 *
 * Tổng quan ở `views-overviews.ts`. Audit: tuyến yên, tuyến tùng, 2 thượng thận
 * (BodyParts3D) + tuyến giáp, 4 tuyến cận giáp (Z-Anatomy, mã `ZA-…` nên khớp
 * bằng tên). Tuỵ nội tiết (đảo tuỵ) và tinh hoàn có nội tiết nhưng không tách
 * riêng phần nội tiết — không đưa vào đây.
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

export const ENDOCRINE_VIEWS: readonly AtlasViewDef[] = [
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

  { id: "thyroid-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến giáp", en: "Thyroid gland" }, direction: "front", focus: [THYROID], context: [LARYNX_TRACHEA] },
  { id: "parathyroid-glands", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến cận giáp", en: "Parathyroid glands" }, direction: "back", focus: [PARATHYROIDS], context: [THYROID] },
  { id: "adrenal-glands", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến thượng thận", en: "Adrenal glands" }, direction: "front", focus: [ADRENALS], context: [KIDNEYS] },
  { id: "pituitary-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến yên", en: "Pituitary gland" }, direction: "side", focus: [PITUITARY], context: [SKULL_BASE] },
  { id: "pineal-gland", systemId: "endocrine", kind: "structure", name: { vi: "Tuyến tùng", en: "Pineal gland" }, direction: "side", focus: [PINEAL], context: [SKULL_BASE] },
];
