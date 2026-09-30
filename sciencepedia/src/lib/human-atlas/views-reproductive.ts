import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ sinh dục (2026-09-30)
 *
 * BodyParts3D 4.0 dựng MỘT người nam: 12 mảnh — tinh hoàn, mào tinh, ống dẫn
 * tinh, túi tinh (mỗi thứ phải/trái), tuyến tiền liệt, vật hang, vật xốp, quy
 * đầu. Không có cơ quan sinh dục nữ — tên góc nhìn nói rõ "nam", đừng đặt tên
 * chung "hệ sinh dục" cho tập mảnh này.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const TESTES = rule("FMA7211", "FMA7212");
const EPIDIDYMIS = rule("FMA18256", "FMA18257");
const DEFERENT_DUCTS = rule("FMA19235", "FMA19236");
const SEMINAL_VESICLES = rule("FMA19387", "FMA19388");
const PROSTATE = rule("FMA9600");
const PENIS = rule("FMA18247", "FMA19617", "FMA19618");
const BLADDER_URETHRA = rule("FMA15900", "FMA19667");
const HIP_BONES: PartRule = { systems: ["skeletal"], name: /hip bone$|^sacrum$/i };

export const REPRODUCTIVE_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "reproductive-overview",
    systemId: "reproductive",
    kind: "overview",
    name: { vi: "Hệ sinh dục nam", en: "Male reproductive system" },
    direction: "anterolateral",
    focus: [{ systems: ["reproductive"] }],
    context: [BLADDER_URETHRA, HIP_BONES],
    // Đếm đủ 12 mảnh nên chắc chắn không có hai thứ này. Bìu/da dương vật KHÔNG ghi
    // thiếu: da là một mesh toàn thân, có thể đã gồm vùng đó.
    partial: {
      vi: "Thiếu tuyến hành niệu đạo và ống phóng tinh",
      en: "The bulbourethral glands and ejaculatory ducts are missing",
    },
    terms: ["sinh dục", "reproductive", "sinh sản", "genital"],
    quality: "acceptable",
  },
  {
    id: "reproductive-testis",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Tinh hoàn và mào tinh", en: "Testes and epididymides" },
    direction: "anterolateral",
    focus: [TESTES, EPIDIDYMIS],
    context: [DEFERENT_DUCTS, PENIS],
    terms: ["testis", "testicle", "epididymis"],
    quality: "good",
  },
  {
    id: "reproductive-ducts-glands",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Ống dẫn tinh và tuyến phụ", en: "Deferent ducts and accessory glands" },
    direction: "side",
    focus: [DEFERENT_DUCTS, SEMINAL_VESICLES, PROSTATE],
    context: [BLADDER_URETHRA, TESTES, EPIDIDYMIS, HIP_BONES],
    partial: {
      vi: "Thiếu tuyến hành niệu đạo và ống phóng tinh",
      en: "The bulbourethral glands and ejaculatory ducts are missing",
    },
    terms: ["ống dẫn tinh", "vas deferens", "túi tinh", "tiền liệt", "prostate"],
    quality: "acceptable",
  },
  {
    id: "reproductive-penis",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Dương vật", en: "Penis" },
    direction: "anterolateral",
    focus: [PENIS],
    context: [BLADDER_URETHRA, HIP_BONES],
    terms: ["penis", "vật hang", "vật xốp"],
    quality: "acceptable",
  },

  { id: "testes", systemId: "reproductive", kind: "structure", name: { vi: "Tinh hoàn", en: "Testes" }, direction: "front", focus: [TESTES], context: [EPIDIDYMIS] },
  { id: "epididymides", systemId: "reproductive", kind: "structure", name: { vi: "Mào tinh", en: "Epididymides" }, direction: "anterolateral", focus: [EPIDIDYMIS], context: [TESTES] },
  { id: "deferent-ducts", systemId: "reproductive", kind: "structure", name: { vi: "Ống dẫn tinh", en: "Deferent ducts" }, direction: "side", focus: [DEFERENT_DUCTS], context: [TESTES, PROSTATE], terms: ["vas deferens"] },
  { id: "seminal-vesicles", systemId: "reproductive", kind: "structure", name: { vi: "Túi tinh", en: "Seminal vesicles" }, direction: "back", focus: [SEMINAL_VESICLES], context: [PROSTATE, BLADDER_URETHRA] },
  { id: "prostate", systemId: "reproductive", kind: "structure", name: { vi: "Tuyến tiền liệt", en: "Prostate" }, direction: "anterolateral", focus: [PROSTATE], context: [BLADDER_URETHRA] },
  { id: "penis", systemId: "reproductive", kind: "structure", name: { vi: "Vật hang, vật xốp và quy đầu", en: "Corpora and glans of the penis" }, direction: "anterolateral", focus: [PENIS], context: [BLADDER_URETHRA], terms: ["dương vật"] },
];
