import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ tiết niệu (2026-09-30)
 *
 * Audit dữ liệu (BodyParts3D 4.0 + phần bổ sung): hệ tiết niệu chỉ có 6 mảnh —
 * thận phải/trái, niệu quản phải/trái, bàng quang, niệu đạo. Mạch thận nằm ở hệ
 * động/tĩnh mạch (động mạch thận + các nhánh phân thuỳ), tuyến thượng thận ở hệ
 * nội tiết. Không có bể thận, đài thận hay cấu trúc trong thận: thận là một
 * khối đặc — đừng dựng góc nhìn "cấu trúc trong thận".
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const RIGHT_KIDNEY = rule("FMA7204");
const LEFT_KIDNEY = rule("FMA7205");
const KIDNEYS = [RIGHT_KIDNEY, LEFT_KIDNEY];
const RIGHT_URETER = rule("FMA15571");
const LEFT_URETER = rule("FMA15572");
const URETERS = [RIGHT_URETER, LEFT_URETER];
const BLADDER = rule("FMA15900");
const URETHRA = rule("FMA19667");

const RENAL_ARTERIES: PartRule = {
  systems: ["arterial"],
  name: /renal artery$/i,
  // "…suprarenal artery" cũng tận cùng bằng "renal artery" — mạch của thượng thận.
  exclude: /suprarenal/i,
};
const RENAL_VEINS: PartRule = { systems: ["venous"], name: /renal vein$/i, exclude: /suprarenal/i };
const ADRENALS = rule("FMA15629", "FMA15630");
const AORTA_IVC: PartRule = { name: /^(abdominal aorta|inferior vena cava)$/i };
const LUMBAR_SPINE: PartRule = { systems: ["skeletal"], name: /lumbar vertebra$|^sacrum$/i };
const LOWER_RIBS: PartRule = { systems: ["skeletal"], name: /\b(eleventh|twelfth) rib$/i };
const HIP_BONES: PartRule = { systems: ["skeletal"], name: /hip bone$/i };
const PROSTATE = rule("FMA9600");

export const URINARY_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ tổng quan
  {
    id: "urinary-overview",
    systemId: "urinary",
    kind: "overview",
    name: { vi: "Toàn bộ hệ tiết niệu", en: "Whole urinary system" },
    direction: "front",
    focus: [{ systems: ["urinary"] }],
    terms: ["tiết niệu", "urinary", "thận", "kidney", "bàng quang", "bladder"],
    quality: "good",
  },

  // ------------------------------------------------------------ nhóm / vùng
  {
    id: "urinary-kidneys",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Thận", en: "Kidneys" },
    direction: "front",
    focus: KIDNEYS,
    context: [ADRENALS, RENAL_ARTERIES, RENAL_VEINS, AORTA_IVC],
    terms: ["kidney", "renal"],
    quality: "good",
  },
  {
    // Thận nằm sau phúc mạc, hai bên cột sống thắt lưng, cực trên ngang xương sườn XI–XII.
    id: "urinary-kidney-position",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Vị trí của thận", en: "Location of the kidneys" },
    direction: "back",
    focus: KIDNEYS,
    context: [LUMBAR_SPINE, LOWER_RIBS, HIP_BONES],
    terms: ["sau phúc mạc", "retroperitoneal", "thận", "kidney"],
    quality: "acceptable",
  },
  {
    id: "urinary-renal-vessels",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Mạch máu thận", en: "Renal vessels" },
    direction: "front",
    focus: [RENAL_ARTERIES, RENAL_VEINS],
    context: [...KIDNEYS, AORTA_IVC],
    terms: ["động mạch thận", "renal artery", "tĩnh mạch thận", "renal vein"],
    quality: "acceptable",
  },
  {
    id: "urinary-ureters",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Niệu quản", en: "Ureters" },
    direction: "front",
    focus: URETERS,
    context: [...KIDNEYS, BLADDER, HIP_BONES],
    terms: ["ureter"],
    quality: "good",
  },
  {
    id: "urinary-bladder-urethra",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Bàng quang và niệu đạo", en: "Bladder and urethra" },
    direction: "anterolateral",
    focus: [BLADDER, URETHRA],
    context: [HIP_BONES, PROSTATE, ...URETERS],
    terms: ["bladder", "urethra", "đường tiết niệu dưới", "lower urinary tract"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ cấu trúc
  {
    id: "right-kidney",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Thận phải", en: "Right kidney" },
    direction: "front",
    focus: [RIGHT_KIDNEY],
    context: [LEFT_KIDNEY, ADRENALS],
    terms: ["thận", "kidney"],
  },
  {
    id: "left-kidney",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Thận trái", en: "Left kidney" },
    direction: "front",
    focus: [LEFT_KIDNEY],
    context: [RIGHT_KIDNEY, ADRENALS],
    terms: ["thận", "kidney"],
  },
  {
    id: "right-ureter",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Niệu quản phải", en: "Right ureter" },
    direction: "front",
    focus: [RIGHT_URETER],
    context: [RIGHT_KIDNEY, BLADDER],
    terms: ["niệu quản", "ureter"],
  },
  {
    id: "left-ureter",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Niệu quản trái", en: "Left ureter" },
    direction: "front",
    focus: [LEFT_URETER],
    context: [LEFT_KIDNEY, BLADDER],
    terms: ["niệu quản", "ureter"],
  },
  {
    id: "urinary-bladder",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Bàng quang", en: "Urinary bladder" },
    direction: "anterolateral",
    focus: [BLADDER],
    context: [URETHRA, HIP_BONES],
  },
  {
    id: "urethra",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Niệu đạo", en: "Urethra" },
    direction: "side",
    focus: [URETHRA],
    context: [BLADDER, PROSTATE],
  },
  {
    id: "renal-arteries",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Động mạch thận", en: "Renal arteries" },
    direction: "front",
    focus: [RENAL_ARTERIES],
    context: KIDNEYS,
  },
  {
    id: "renal-veins",
    systemId: "urinary",
    kind: "structure",
    name: { vi: "Tĩnh mạch thận", en: "Renal veins" },
    direction: "front",
    focus: [RENAL_VEINS],
    context: KIDNEYS,
  },
];
