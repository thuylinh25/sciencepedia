import type { AtlasViewDef, PartRule } from "./views";
import { ILEUM, RECTUM } from "./views-digestive";
import { PELVIC_FLOOR } from "./views-muscular";
import { DEFERENT_DUCTS, PENIS, PROSTATE, SEMINAL_VESICLES, TESTES } from "./views-reproductive";
import { HIP_BONE, LUMBAR, SACRUM } from "./views-skeletal";

/*
 * ## Góc nhìn theo hệ — Hệ tiết niệu (2026-09-30)
 *
 * Audit dữ liệu (BodyParts3D 4.0 + phần bổ sung): hệ tiết niệu chỉ có 6 mảnh —
 * thận phải/trái, niệu quản phải/trái, bàng quang, niệu đạo. Mạch thận nằm ở hệ
 * động/tĩnh mạch (động mạch thận + các nhánh phân thuỳ), tuyến thượng thận ở hệ
 * nội tiết. Không có bể thận, đài thận hay cấu trúc trong thận: thận là một
 * khối đặc — đừng dựng góc nhìn "cấu trúc trong thận".
 *
 * Lưới xếp theo "Urinary System Views (Male)" của atlas tham chiếu (chủ sản phẩm,
 * 2026-10-23): tổng quan, vùng chậu, thận, mặt cắt thận, mạch thận, niệu quản, bàng
 * quang, đáy chậu, mặt cắt bàng quang, bàng quang và dương vật, niệu đạo, cơ thắt niệu
 * đạo — rồi hai nhóm cũ giữ cho deep link. "Mặt cắt thận" và "Cơ thắt niệu đạo":
 * `missing` (thận đặc; dữ liệu không có cơ thắt niệu đạo). Dương vật, tuyến tiền liệt,
 * cơ hoành chậu mượn quy tắc hệ sinh dục/cơ — cùng tập mảnh với cấu trúc ở đó.
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
const ILIAC_VESSELS: PartRule = { systems: ["arterial", "venous"], name: /(common|internal|external) iliac (artery|vein)$/i };
const MISSING_SPHINCTER = {
  vi: "Thiếu cơ thắt niệu đạo, cơ ngang đáy chậu, cơ hành xốp và cơ ngồi hang",
  en: "The urethral sphincter, transverse perineal muscles, bulbospongiosus and ischiocavernosus are missing",
};

export const URINARY_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ tổng quan
  {
    id: "urinary-overview",
    systemId: "urinary",
    kind: "overview",
    name: { vi: "Toàn bộ hệ tiết niệu", en: "Whole urinary system" },
    direction: "front",
    focus: [{ systems: ["urinary"] }],
    context: [LUMBAR, SACRUM, HIP_BONE],
    terms: ["tiết niệu", "urinary", "thận", "kidney", "bàng quang", "bladder"],
    quality: "good",
  },

  // ------------------------------------------------------------ nhóm theo atlas tham chiếu
  {
    id: "urinary-pelvic-region",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Bàng quang trong chậu hông", en: "Bladder in the pelvis" },
    direction: "front",
    focus: [BLADDER, URETHRA],
    context: [...URETERS, ILIAC_VESSELS, HIP_BONE, SACRUM, RECTUM, ILEUM, PROSTATE],
    // Bối cảnh (xương chậu, mạch chậu, ruột) là điều góc nhìn muốn dạy.
    camera: { fill: 0.4, thumbnailFill: 0.5 },
    terms: ["chậu hông", "pelvis", "vùng chậu", "pelvic region"],
    quality: "acceptable",
  },
  {
    id: "urinary-kidneys",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Thận", en: "Kidneys" },
    direction: "front",
    focus: KIDNEYS,
    context: [ADRENALS, RENAL_ARTERIES, RENAL_VEINS, AORTA_IVC, LUMBAR],
    camera: { fill: 0.55, thumbnailFill: 0.7 },
    terms: ["kidney", "renal"],
    quality: "good",
  },
  {
    id: "urinary-kidney-section",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Mặt cắt thận", en: "Kidney section" },
    direction: "front",
    missing: {
      vi: "Thận trong bộ dữ liệu là một khối đặc — không có vỏ, tuỷ, tháp thận, đài thận hay bể thận để cắt",
      en: "The kidney is a solid mesh in the dataset, with no cortex, medulla, renal pyramids, calyces or renal pelvis to section",
    },
    terms: ["vỏ thận", "renal cortex", "tuỷ thận", "renal medulla", "bể thận", "renal pelvis", "đài thận", "calyx"],
  },
  {
    id: "urinary-renal-vessels",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Mạch máu thận", en: "Renal vessels" },
    direction: "front",
    focus: [RENAL_ARTERIES, RENAL_VEINS],
    context: [...KIDNEYS, AORTA_IVC, ADRENALS],
    partial: {
      vi: "Động mạch thận chỉ tới nhánh phân thuỳ, tĩnh mạch thận chỉ có thân chính; không có mạch trong thận",
      en: "Renal arteries stop at the segmental branches and the renal veins are main trunks only; there are no intrarenal vessels",
    },
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
    context: [...KIDNEYS, BLADDER, HIP_BONE, LUMBAR],
    terms: ["ureter"],
    quality: "good",
  },
  {
    id: "urinary-bladder-pelvis",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Bàng quang và tạng lân cận", en: "Bladder and neighbouring organs" },
    direction: "anterolateral",
    focus: [BLADDER],
    context: [...URETERS, URETHRA, PROSTATE, SEMINAL_VESICLES, DEFERENT_DUCTS, HIP_BONE],
    // Nhìn chếch, xương chậu mờ nằm sát camera — khung rộng mới thấy bàng quang trong chậu.
    camera: { fill: 0.25, thumbnailFill: 0.32 },
    terms: ["bladder", "bàng quang"],
    quality: "acceptable",
  },
  {
    id: "urinary-pelvic-floor",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Bàng quang và đáy chậu", en: "Bladder and pelvic floor" },
    direction: [0.35, 0.75, 0.55],
    focus: [BLADDER, URETHRA, PELVIC_FLOOR],
    context: [HIP_BONE, SACRUM, PROSTATE, RECTUM],
    partial: MISSING_SPHINCTER,
    terms: ["đáy chậu", "pelvic floor", "cơ nâng hậu môn", "levator ani", "hoành chậu", "pelvic diaphragm"],
    quality: "acceptable",
  },
  // Mặt cắt dọc giữa (bỏ nửa trái, x > 0) nhìn từ bên trái, như `bone-pelvic-section`.
  {
    id: "urinary-bladder-section",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Mặt cắt dọc bàng quang và niệu đạo", en: "Sagittal section of the bladder and urethra" },
    direction: [1, 0.05, 0.12],
    focus: [BLADDER, URETHRA, PROSTATE, PENIS],
    context: [HIP_BONE, SACRUM, RECTUM, SEMINAL_VESICLES, PELVIC_FLOOR],
    clip: { normal: [-1, 0, 0], constant: 0 },
    partial: {
      vi: "Bàng quang dựng như một bề mặt — mặt cắt để hở, không có lớp cơ, niêm mạc hay tam giác bàng quang; không có cơ thắt niệu đạo",
      en: "The bladder is modelled as a surface — the cut is left open, with no muscular wall, mucosa or trigone; the urethral sphincters are not in the dataset",
    },
    terms: ["mặt cắt dọc giữa", "midsagittal section", "bàng quang", "niệu đạo"],
    quality: "acceptable",
  },
  {
    id: "urinary-bladder-penis",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Bàng quang và dương vật", en: "Bladder and penis" },
    direction: "front",
    focus: [BLADDER, URETHRA, PENIS],
    context: [...URETERS, PROSTATE, TESTES, HIP_BONE],
    terms: ["dương vật", "penis", "bàng quang", "bladder"],
    quality: "acceptable",
  },
  // Cắt dọc giữa để thấy niệu đạo chạy trong tuyến tiền liệt và vật xốp tới lỗ ngoài ở quy đầu.
  {
    id: "urinary-urethra",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Niệu đạo nam", en: "Male urethra" },
    direction: [1, 0.05, 0.12],
    focus: [URETHRA],
    context: [BLADDER, PROSTATE, PENIS],
    clip: { normal: [-1, 0, 0], constant: 0 },
    terms: ["niệu đạo", "urethra", "lỗ niệu đạo ngoài", "external urethral orifice"],
    quality: "acceptable",
  },
  {
    id: "urinary-urethral-sphincter",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Cơ thắt niệu đạo", en: "Urethral sphincter" },
    direction: "side",
    missing: {
      vi: "Bộ dữ liệu chưa có cơ thắt niệu đạo trong và ngoài",
      en: "The internal and external urethral sphincters are not in the dataset",
    },
    terms: ["cơ thắt niệu đạo", "urethral sphincter", "tiểu tiện", "micturition"],
  },

  // ------------------------------------------------------------ nhóm cũ (deep link)
  {
    // Thận nằm sau phúc mạc, hai bên cột sống thắt lưng, cực trên ngang xương sườn XI–XII.
    id: "urinary-kidney-position",
    systemId: "urinary",
    kind: "group",
    name: { vi: "Vị trí của thận", en: "Location of the kidneys" },
    direction: "back",
    focus: KIDNEYS,
    context: [LUMBAR_SPINE, LOWER_RIBS, HIP_BONES],
    // Bối cảnh (sườn XI–XII, mào chậu) là điều góc nhìn muốn dạy — khung theo thận ở
    // mức mặc định thì cắt mất chúng.
    camera: { fill: 0.45, thumbnailFill: 0.55 },
    terms: ["sau phúc mạc", "retroperitoneal", "thận", "kidney"],
    quality: "acceptable",
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
