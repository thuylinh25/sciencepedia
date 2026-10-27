import type { AtlasViewDef, PartRule } from "./views";
import { ILEUM, RECTUM } from "./views-digestive";
import { PELVIC_FLOOR } from "./views-muscular";

/*
 * ## Góc nhìn theo hệ — Hệ sinh dục (2026-09-30)
 *
 * BodyParts3D 4.0 dựng MỘT người nam: 12 mảnh — tinh hoàn, mào tinh, ống dẫn
 * tinh, túi tinh (mỗi thứ phải/trái), tuyến tiền liệt, vật hang, vật xốp, quy
 * đầu. Không có cơ quan sinh dục nữ — tên góc nhìn nói rõ "nam", đừng đặt tên
 * chung "hệ sinh dục" cho tập mảnh này.
 */

/*
 * Lưới xếp theo "Reproductive System Views (Male)" của atlas tham chiếu (chủ sản phẩm,
 * 2026-10-23): tổng quan, vùng chậu, cơ quan sinh dục trong, tuyến tiền liệt, mặt cắt tuyến
 * tiền liệt, tinh hoàn, mặt cắt tinh hoàn, túi tinh, cơ quan sinh dục ngoài, đường dẫn tinh,
 * mạc dương vật, dương vật — rồi nhóm cũ giữ cho deep link. "Mặt cắt tinh hoàn" và "Mạc
 * dương vật": `missing` (tinh hoàn là một bề mặt kín đơn giản; dữ liệu không có mạc). "Trong/ngoài" theo
 * Terminologia Anatomica: tinh hoàn, mào tinh, ống dẫn tinh, túi tinh, tiền liệt là cơ quan
 * sinh dục TRONG; dương vật và bìu là NGOÀI.
 *
 * Mọi góc nhìn vùng chậu khung thêm xương chậu (`camera.frame`): tinh hoàn và dương vật nằm
 * thấp hơn chậu, khung theo riêng chúng thì xương chậu bị cắt ở trên (xem views-urinary.ts).
 */

const rule = (...fma: string[]): PartRule => ({ fma });

export const TESTES = rule("FMA7211", "FMA7212");
const EPIDIDYMIS = rule("FMA18256", "FMA18257");
export const DEFERENT_DUCTS = rule("FMA19235", "FMA19236");
export const SEMINAL_VESICLES = rule("FMA19387", "FMA19388");
export const PROSTATE = rule("FMA9600");
export const PENIS = rule("FMA18247", "FMA19617", "FMA19618");
const BLADDER_URETHRA = rule("FMA15900", "FMA19667");
const BLADDER = rule("FMA15900");
const URETHRA = rule("FMA19667");
const URETERS = rule("FMA15571", "FMA15572");
const HIP_BONES: PartRule = { systems: ["skeletal"], name: /hip bone$|^sacrum$/i };
const INTERNAL = [TESTES, EPIDIDYMIS, DEFERENT_DUCTS, SEMINAL_VESICLES, PROSTATE];
const TESTICULAR_VESSELS: PartRule = { systems: ["arterial", "venous"], name: /testicular (artery|vein)$/i };
const PENILE_VESSELS: PartRule = { systems: ["arterial", "venous"], name: /dorsal (artery|vein) of penis$/i };
const ILIAC_VESSELS: PartRule = { systems: ["arterial", "venous"], name: /(common|internal|external) iliac (artery|vein)$/i };
const PELVIC_NERVES: PartRule = { systems: ["nervous"], name: /pudendal nerve$|genitofemoral nerve$|genital branch of genitofemoral nerve$|ilio-inguinal nerve$/i };
const INGUINAL_NODES: PartRule = { systems: ["lymphatic"], name: /inguinal (node|nodes|region)$/i };
const MISSING_GLANDS = {
  vi: "Thiếu tuyến hành niệu đạo và ống phóng tinh",
  en: "The bulbourethral glands and ejaculatory ducts are missing",
};
/*
 * Góc nhìn theo hệ không hiện da, nên bìu không có trên màn — câu phải đúng cho THỨ ĐANG HIỂN
 * THỊ (science-editor, 2026-10-23). Không nói dữ liệu "không có" vùng bìu: da toàn thân có thể gồm nó.
 */
const MISSING_GLANDS_SCROTUM = {
  vi: "Thiếu tuyến hành niệu đạo và ống phóng tinh; bìu không hiện vì da là một lớp liền toàn thân",
  en: "The bulbourethral glands and ejaculatory ducts are missing; the scrotum is not shown because the skin is a single whole-body layer",
};

export const REPRODUCTIVE_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "reproductive-overview",
    systemId: "reproductive",
    kind: "overview",
    name: { vi: "Hệ sinh dục nam", en: "Male reproductive system" },
    direction: "anterolateral",
    focus: [{ systems: ["reproductive"] }],
    context: [BLADDER_URETHRA, HIP_BONES],
    camera: { frame: [HIP_BONES] },
    // Đếm đủ 12 mảnh nên chắc chắn thiếu tuyến hành niệu đạo và ống phóng tinh. Bìu ghi
    // "không hiện" (không phải "không có"): góc nhìn không hiện da, còn da toàn thân có thể gồm vùng đó.
    partial: MISSING_GLANDS_SCROTUM,
    terms: ["sinh dục", "reproductive", "sinh sản", "genital"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm theo atlas tham chiếu
  {
    id: "reproductive-pelvic-region",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Vùng chậu nam", en: "Male pelvic region" },
    direction: "front",
    focus: [{ systems: ["reproductive"] }],
    context: [BLADDER_URETHRA, URETERS, HIP_BONES, ILIAC_VESSELS, TESTICULAR_VESSELS, PENILE_VESSELS, PELVIC_NERVES, INGUINAL_NODES, RECTUM, ILEUM],
    camera: { frame: [HIP_BONES] },
    partial: MISSING_GLANDS_SCROTUM,
    terms: ["chậu hông", "pelvis", "vùng chậu", "pelvic region"],
    quality: "acceptable",
  },
  {
    id: "reproductive-internal",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Cơ quan sinh dục trong", en: "Internal genital organs" },
    direction: "anterolateral",
    focus: INTERNAL,
    context: [PENIS, BLADDER_URETHRA, URETERS, HIP_BONES, PELVIC_FLOOR],
    camera: { frame: [HIP_BONES] },
    partial: MISSING_GLANDS,
    terms: ["sinh dục trong", "internal genitalia", "internal genital organs"],
    quality: "acceptable",
  },
  {
    id: "reproductive-prostate",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Tuyến tiền liệt và bàng quang", en: "Prostate and bladder" },
    direction: "anterolateral",
    focus: [PROSTATE],
    context: [BLADDER, URETHRA, SEMINAL_VESICLES, DEFERENT_DUCTS, PELVIC_FLOOR, PENIS, HIP_BONES],
    // Khung theo tiền liệt + bàng quang thì sát quá, không thấy tuyến nằm ở đâu trong chậu.
    camera: { frame: [BLADDER, SEMINAL_VESICLES, HIP_BONES] },
    terms: ["tiền liệt", "prostate"],
    quality: "acceptable",
  },
  // Cắt dọc giữa (bỏ nửa trái) nhìn từ bên trái, như `urinary-bladder-section`.
  {
    id: "reproductive-prostate-section",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Mặt cắt dọc tuyến tiền liệt", en: "Sagittal section of the prostate" },
    direction: [1, 0.05, 0.12],
    focus: [PROSTATE, URETHRA],
    // Có dương vật để niệu đạo nằm trong vật xốp, không thõng giữa khoảng trống; không ống dẫn
    // tinh — cắt dọc giữa còn một ống chạy xuống tinh hoàn không có trong cảnh.
    context: [BLADDER, SEMINAL_VESICLES, PENIS, RECTUM, PELVIC_FLOOR, HIP_BONES],
    clip: { normal: [-1, 0, 0], constant: 0 },
    camera: { frame: [BLADDER, SEMINAL_VESICLES, HIP_BONES] },
    partial: {
      vi: "Tuyến tiền liệt dựng như một bề mặt — mặt cắt để hở, không có các vùng tuyến, ụ núi hay ống phóng tinh",
      en: "The prostate is modelled as a surface — the cut is left open, with no glandular zones, seminal colliculus or ejaculatory ducts",
    },
    terms: ["mặt cắt dọc giữa", "midsagittal section", "niệu đạo tiền liệt", "prostatic urethra"],
    quality: "acceptable",
  },
  {
    id: "reproductive-testis",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Tinh hoàn và mào tinh", en: "Testes and epididymides" },
    direction: "anterolateral",
    focus: [TESTES, EPIDIDYMIS],
    // Bối cảnh chỉ còn dương vật: mạch tinh hoàn và ống dẫn tinh là những ống dài
    // chạy ngược lên bụng — để trong bối cảnh thì chúng tràn quá khung, bị cắt ở
    // mép trên của thẻ và lấn át hai tinh hoàn ở đáy khung (quét khung hình
    // 2026-10-27, cùng lớp lỗi với PR #146). Cả hai đã có view riêng
    // reproductive-ducts lo phần đường đi lên.
    context: [PENIS],
    // Riêng hai tinh hoàn thì phóng to lấp khung; khung cả dương vật để thấy vị trí.
    camera: { frame: [PENIS], fill: 0.55, thumbnailFill: 0.7 },
    terms: ["tinh hoàn", "mào tinh", "testis", "testicle", "epididymis"],
    quality: "good",
  },
  {
    id: "reproductive-testis-section",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Mặt cắt tinh hoàn", en: "Section of the testis" },
    direction: "anterolateral",
    missing: {
      vi: "Tinh hoàn trong bộ dữ liệu chỉ là một bề mặt kín đơn giản, không có cấu trúc bên trong — không có bao trắng, tiểu thuỳ, ống sinh tinh hay lưới tinh để cắt",
      en: "The testis is a single simple closed surface in the dataset, with no internal structure — no tunica albuginea, lobules, seminiferous tubules or rete testis to section",
    },
    terms: ["ống sinh tinh", "seminiferous tubule", "bao trắng", "tunica albuginea", "lưới tinh", "rete testis"],
  },
  {
    id: "reproductive-seminal-vesicles",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Túi tinh và mặt sau bàng quang", en: "Seminal vesicles and the back of the bladder" },
    direction: "posterolateral",
    focus: [SEMINAL_VESICLES],
    // Không xương chậu: nhìn sau-bên thì xương chậu nằm sát camera, che mặt sau bàng quang.
    // Không niệu quản, không ống dẫn tinh (bỏ 2026-10-27): cả hai đều là ống dài chạy
    // khỏi vùng khung (niệu quản lên thận, ống dẫn tinh xuống tinh hoàn) — QA trên bản
    // xem trước cho thấy chúng tràn mép khung; view chỉ cần bàng quang + tiền liệt.
    context: [BLADDER, PROSTATE],
    camera: { frame: [BLADDER, PROSTATE], fill: 0.5, thumbnailFill: 0.65 },
    terms: ["túi tinh", "seminal vesicle", "bóng ống dẫn tinh", "ampulla of ductus deferens"],
    quality: "acceptable",
  },
  {
    id: "reproductive-external",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Cơ quan sinh dục ngoài", en: "External genital organs" },
    direction: "front",
    focus: [PENIS],
    context: [TESTES, EPIDIDYMIS, DEFERENT_DUCTS, PENILE_VESSELS, HIP_BONES],
    camera: { frame: [TESTES, HIP_BONES] },
    partial: {
      vi: "Bìu không hiện: da trong bộ dữ liệu là một lớp liền toàn thân, không tách riêng bìu",
      en: "The scrotum is not shown: the skin in the dataset is a single whole-body layer with no separate scrotum",
    },
    terms: ["sinh dục ngoài", "external genitalia", "dương vật", "penis"],
    quality: "acceptable",
  },
  {
    id: "reproductive-ducts",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Đường dẫn tinh", en: "Sperm pathway" },
    direction: "side",
    focus: [EPIDIDYMIS, DEFERENT_DUCTS],
    // Không niệu quản (bỏ 2026-10-27): chúng chạy từ thận xuống, chui vào từ mép trên
    // khung — thứ bị cắt trong QA là niệu quản, không phải ống dẫn tinh.
    context: [TESTES, SEMINAL_VESICLES, PROSTATE, BLADDER_URETHRA, PENIS, HIP_BONES],
    // Khung gồm cả ống dẫn tinh (2026-10-27): chỉ theo xương chậu thì đoạn ống đi lên
    // bị cắt ở mép trên khi mở view trên bản live.
    camera: { frame: [HIP_BONES, DEFERENT_DUCTS] },
    partial: {
      vi: "Thiếu ống phóng tinh — đường dẫn tinh trong dữ liệu dừng ở đáy tuyến tiền liệt, nơi ống dẫn tinh vốn kết thúc",
      en: "The ejaculatory ducts are missing — the pathway in the dataset ends at the base of the prostate, where the deferent ducts normally end",
    },
    // Không "thừng tinh": bó ấy gồm ba lớp bọc + mạch + thần kinh, dữ liệu không có lớp bọc nào.
    terms: ["ống dẫn tinh", "vas deferens", "ductus deferens"],
    quality: "acceptable",
  },
  {
    id: "reproductive-penile-fasciae",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Mạc dương vật", en: "Fasciae of the penis" },
    direction: "front",
    missing: {
      vi: "Bộ dữ liệu chưa có mạc nông, mạc sâu (mạc Buck) và dây chằng treo dương vật",
      en: "The superficial and deep (Buck's) fasciae and the suspensory ligament of the penis are not in the dataset",
    },
    terms: ["mạc buck", "buck's fascia", "dây chằng treo dương vật", "suspensory ligament of penis"],
  },
  {
    id: "reproductive-penis",
    systemId: "reproductive",
    kind: "group",
    name: { vi: "Dương vật", en: "Penis" },
    direction: "anterolateral",
    focus: [PENIS],
    context: [BLADDER_URETHRA, PENILE_VESSELS, HIP_BONES],
    camera: { frame: [HIP_BONES] },
    partial: {
      vi: "Thiếu cơ hành xốp, cơ ngồi hang và các mạc dương vật",
      en: "The bulbospongiosus and ischiocavernosus muscles and the penile fasciae are missing",
    },
    terms: ["penis", "vật hang", "vật xốp"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm cũ (deep link)
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

  { id: "testes", systemId: "reproductive", kind: "structure", name: { vi: "Tinh hoàn", en: "Testes" }, direction: "front", focus: [TESTES], context: [EPIDIDYMIS] },
  { id: "epididymides", systemId: "reproductive", kind: "structure", name: { vi: "Mào tinh", en: "Epididymides" }, direction: "anterolateral", focus: [EPIDIDYMIS], context: [TESTES] },
  { id: "deferent-ducts", systemId: "reproductive", kind: "structure", name: { vi: "Ống dẫn tinh", en: "Deferent ducts" }, direction: "side", focus: [DEFERENT_DUCTS], context: [TESTES, PROSTATE], terms: ["vas deferens"] },
  { id: "seminal-vesicles", systemId: "reproductive", kind: "structure", name: { vi: "Túi tinh", en: "Seminal vesicles" }, direction: "back", focus: [SEMINAL_VESICLES], context: [PROSTATE, BLADDER_URETHRA] },
  { id: "prostate", systemId: "reproductive", kind: "structure", name: { vi: "Tuyến tiền liệt", en: "Prostate" }, direction: "anterolateral", focus: [PROSTATE], context: [BLADDER_URETHRA] },
  { id: "penis", systemId: "reproductive", kind: "structure", name: { vi: "Vật hang, vật xốp và quy đầu", en: "Corpora and glans of the penis" }, direction: "anterolateral", focus: [PENIS], context: [BLADDER_URETHRA], terms: ["dương vật"] },
];
