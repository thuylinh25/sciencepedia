import type { AtlasViewDef, PartRule } from "./views";
import { AORTA, ARCH_BRANCHES, ASC_ARCH, FEMORAL as FEMORAL_ARTERY, POPLITEAL as POPLITEAL_ARTERY, AXILLARY_BRANCHES } from "./views-arterial";
import { AXILLARY as AXILLARY_VEINS, FEMORAL as FEMORAL_VEIN, POPLITEAL as POPLITEAL_VEIN, SAPHENOUS, VENAE_CAVAE } from "./views-venous";

/*
 * ## Góc nhìn theo hệ — Hệ bạch huyết (2026-09-30)
 *
 * Audit dữ liệu: 169 mảnh — 13 mang mã FMA (lách, 2 thuỳ tuyến ức, 10 lưới
 * "Lymphatic vessels of <vùng>") và 156 hạch của UMCG (CC BY-NC-SA,
 * `scripts/import-umcg-lymphatic.ts`, mã `ZA-…`, ~110 nhóm có tên). Mạch bạch huyết
 * là LƯỚI theo vùng, không tách ống ngực/bể dưỡng chấp — lưới ngực trải y 0,98–1,58 m
 * và CÓ ống ngực: đã xem bằng mắt (2026-10-01) — thân liền dọc trước cột sống ngực, uốn
 * theo đường cong cột sống, cuối trên vòng sang trái lên cổ; xương bối cảnh vẽ mờ nên
 * không che. KHÔNG ghi "thiếu ống ngực"; nhưng ống nằm chung một mesh với các mạch
 * nhỏ, nên đừng dựng góc nhìn "ống ngực" riêng. Không có hạnh nhân (amiđan).
 *
 * "Subaortic nodes" (TA: nodi subaortici, nhóm hạch chậu chung dưới chỗ chia động
 * mạch chủ) nằm ở y ≈ 1,01 m, ngang L5 — thuộc chậu, không phải "trạm 5" trung thất
 * của phân chặng ung thư phổi. Hạch dưới hàm, dưới cằm xếp vào cổ theo phân nhóm cổ
 * lâm sàng (nhóm I); TA xếp chúng vào hạch đầu.
 *
 * Bảng "Cấu trúc" không một hàng mỗi nhóm hạch (~110 hàng, phần lớn 1–2 hạch):
 * mỗi vùng chia thành vài nhóm lớn theo cách sách giải phẫu gom (nông/sâu, thành/
 * tạng). Khớp bằng tên (mã `ZA-…`), trong hệ bạch huyết.
 */

/*
 * Lưới xếp theo "Lymphatic System Views" của atlas tham chiếu (chủ sản phẩm, 2026-10-23):
 * tổng quan, tuyến ức, hạnh nhân, ống ngực, bể dưỡng chấp, đầu – cổ, ngực, chậu, chi dưới,
 * hạch nách, hạch bẹn, hạch khoeo — rồi nhóm cũ giữ cho deep link. Hạnh nhân: `missing`
 * (Z-Anatomy CÓ hạnh nhân khẩu cái — nhập được qua import-z-anatomy.ts, chưa làm). Bể
 * dưỡng chấp: `missing` — đã xem bằng mắt, không chỗ phình nào tách được khỏi lưới mạch.
 * Ống ngực: dựng được nhưng tên phải gồm "mạch bạch huyết ngực" vì cùng một lưới.
 *
 * Hạch khoeo/bẹn rải theo bề NGANG (hai chân) nên `camera.fill` (chỉ tính chiều cao) không
 * lùi được khung — dùng `frame` theo mạch hoặc xương quanh đó.
 */

const lymph = (name: RegExp): PartRule => ({ systems: ["lymphatic"], name });

// Đầu – cổ.
// `\b`: tên hạch là đuôi của từ khác — "submandibular" chứa "mandibular", "epigastric"/"jugulodigastric"
// chứa "gastric", "subaortic" chứa "aortic". Thiếu nó hai nhóm cùng nhận một hạch.
const HEAD_NODES = lymph(/\b(occipital|mastoid|pre-auricular|infra-auricular|parotid|bucinator|nasolabial|mandibular) nodes?$/i);
const NECK_NODES = lymph(
  /\b(submental|submandibular|retropharyngeal|jugulodigastric|jugular|cervical|supraclavicular|pretracheal|thyroid) nodes?$/i,
);
const HEAD_NECK_VESSELS = lymph(/^lymphatic vessels of head and neck$/i);
// Chi trên – nách.
export const AXILLARY_NODES = lymph(/\b(axillary|infraclavicular|interpectoral) nodes?$/i);
const ARM_NODES = lymph(/\b(brachial|cubital|supratrochlear) nodes?$/i);
const UPPER_LIMB_VESSELS = lymph(/^lymphatic vessels of (left|right) (axilla|upper limb)$/i);
// Ngực.
const THORACIC_WALL_NODES = lymph(/\b(parasternal|intercostal|superior diaphragmatic|prevertebral) nodes?$/i);
const MEDIASTINAL_NODES = lymph(
  /\b(brachiocephalic|paratracheal thoracic|tracheobronchial|intrapulmonary|juxta-oesophageal|pericardial) nodes?$|^node of (arch of azygos vein|ligamentum arteriosum)$/i,
);
const THORAX_VESSELS = lymph(/^lymphatic vessels of thorax$/i);
// Bụng.
const ABDOMINAL_VISCERAL_NODES = lymph(
  /\b(coeliac|gastric|gastro-omental|(?:supra|sub|retro)pyloric|pancreatic|pancreaticoduodenal|cystic|mesenteric|ileocolic|colic|(?:pre|retro)caecal|appendicular|sigmoid) nodes?$/i,
);
const LUMBAR_NODES = lymph(/\b(lumbar|aortic|(?:pre|retro)?caval|inferior diaphragmatic) nodes?$/i);
const ABDOMEN_VESSELS = lymph(/^lymphatic vessels of abdomen$/i);
// Chậu.
const ILIAC_NODES = lymph(/\b(iliac|lacunar|obturator|subaortic|inferior epigastric) nodes?$/i);
const PELVIC_NODES = lymph(/\b(sacral|gluteal|(?:pre|post)?vesical|pararectal) nodes?$/i);
const PELVIS_VESSELS = lymph(/^lymphatic vessels of pelvis$/i);
// Chi dưới.
const INGUINAL_NODES = lymph(/inguinal nodes?$/i);
const LEG_NODES = lymph(/\b(popliteal|tibial|fibular) nodes?$/i);
const POPLITEAL_NODES = lymph(/\bpopliteal nodes?$/i);
const TIBIAL_FIBULAR_NODES = lymph(/\b(tibial|fibular) nodes?$/i);
const LOWER_LIMB_VESSELS = lymph(/^lymphatic vessels of (left|right) lower limb$/i);
// Cơ quan bạch huyết.
const SPLEEN = lymph(/^spleen$/i);
const THYMUS = lymph(/lobe of thymus$/i);

// Bối cảnh xương theo vùng.
const SKULL_NECK: PartRule = { systems: ["skeletal"], name: /mandible|^hyoid bone$|cervical vertebra$|^atlas$|^axis$|clavicle$/i };
const UPPER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(humerus|scapula|clavicle|radius|ulna)$/i };
const THORAX_BONES: PartRule = { systems: ["skeletal"], name: /\brib\b|costal cartilage|^manubrium$|^body of sternum$|thoracic vertebra$/i };
const PELVIS_BONES: PartRule = { systems: ["skeletal"], name: /hip bone$|^sacrum$|lumbar vertebra$/i };
const LOWER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(femur|tibia|fibula|patella|hip bone)$/i };
const HIP_BONES: PartRule = { systems: ["skeletal"], name: /hip bone$/i };
const KNEE_BONES: PartRule = { systems: ["skeletal"], name: /(femur|tibia|fibula|patella)$/i };
const SPINE: PartRule = { systems: ["skeletal"], name: /(thoracic|lumbar) vertebra$/i };
const HEART: PartRule = { systems: ["cardiac"] };
// Không xương ức, sụn sườn: tuyến ức nằm ngay sau xương ức — vẽ mờ vẫn che kín nó.
const RIBS: PartRule = { systems: ["skeletal"], name: /rib|thoracic vertebra$/i };
// Chỉ thân tĩnh mạch đơn: tĩnh mạch liên sườn chằng ngang, lẫn với mạch bạch huyết.
const AZYGOS_TRUNKS: PartRule = { systems: ["venous"], name: /^(azygos|hemiazygos|accessory hemiazygos) vein$/i };

const group = (
  id: string,
  vi: string,
  en: string,
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
  direction: AtlasViewDef["direction"] = "front",
): AtlasViewDef => ({ id, systemId: "lymphatic", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable" });
const structure = (id: string, vi: string, en: string, focus: PartRule, direction: AtlasViewDef["direction"] = "front"): AtlasViewDef => ({
  id,
  systemId: "lymphatic",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
});

export const LYMPHATIC_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "lymphatic-overview",
    systemId: "lymphatic",
    kind: "overview",
    name: { vi: "Toàn bộ hệ bạch huyết", en: "Whole lymphatic system" },
    direction: "front",
    focus: [{ systems: ["lymphatic"] }],
    partial: { vi: "Thiếu hạnh nhân (amiđan)", en: "The tonsils are missing" },
    terms: ["bạch huyết", "lymphatic", "hạch", "lymph node", "bạch mạch"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm theo atlas tham chiếu
  {
    id: "lymphatic-thymus",
    systemId: "lymphatic",
    kind: "group",
    name: { vi: "Tuyến ức", en: "Thymus" },
    direction: "front",
    focus: [THYMUS],
    context: [HEART, ASC_ARCH, ARCH_BRANCHES, VENAE_CAVAE, RIBS],
    // Riêng tuyến ức thì phóng sát, mất chỗ của nó trên tim; khung cả tim.
    camera: { frame: [HEART] },
    terms: ["tuyến ức", "thymus", "cơ quan lympho trung ương"],
    quality: "acceptable",
  },
  {
    id: "lymphatic-tonsils",
    systemId: "lymphatic",
    kind: "group",
    name: { vi: "Hạnh nhân (amiđan)", en: "Tonsils" },
    direction: "anterolateral",
    missing: {
      vi: "Bộ dữ liệu hiện chưa có hạnh nhân khẩu cái, hạnh nhân hầu hay hạnh nhân lưỡi",
      en: "The palatine, pharyngeal and lingual tonsils are not in the current dataset",
    },
    terms: ["amiđan", "amidan", "tonsil", "palatine tonsil", "vòng bạch huyết quanh họng"],
  },
  {
    id: "lymphatic-thoracic-duct",
    systemId: "lymphatic",
    kind: "group",
    name: { vi: "Ống ngực và mạch bạch huyết ngực", en: "Thoracic duct and thoracic lymphatic vessels" },
    direction: "left",
    focus: [THORAX_VESSELS],
    context: [SPINE, AORTA, ASC_ARCH, AZYGOS_TRUNKS, HEART],
    partial: {
      vi: "Ống ngực dựng chung một lưới với các mạch bạch huyết khác của ngực, không tách riêng",
      en: "The thoracic duct shares a single mesh with the other lymphatic vessels of the thorax and is not separated",
    },
    terms: ["ống ngực", "thoracic duct", "ống bạch huyết ngực"],
    quality: "acceptable",
  },
  {
    id: "lymphatic-cisterna-chyli",
    systemId: "lymphatic",
    kind: "group",
    name: { vi: "Bể dưỡng chấp", en: "Cisterna chyli" },
    direction: "front",
    // Đã xem bằng mắt (2026-10-23): vùng L1–L2 chỉ có lưới mạch mảnh và hạch thắt lưng,
    // không chỗ phình nào nhận ra được — đừng đặt tên bể cho tập hạch thắt lưng.
    missing: {
      vi: "Bộ dữ liệu không dựng bể dưỡng chấp thành một phần riêng — vùng ngang đốt sống L1–L2 chỉ có lưới mạch bạch huyết và các hạch thắt lưng",
      en: "The dataset does not model the cisterna chyli as a separate part — at the L1–L2 level it holds only lymphatic vessels and the lumbar lymph nodes",
    },
    terms: ["bể dưỡng chấp", "cisterna chyli", "bể pecquet"],
  },

  group("lymphatic-head-neck", "Bạch huyết đầu – cổ", "Lymphatics of the head and neck", [HEAD_NODES, NECK_NODES, HEAD_NECK_VESSELS], [SKULL_NECK], ["hạch cổ", "cervical nodes", "hạch dưới hàm"], "anterolateral"),
  group("lymphatic-thorax", "Bạch huyết ngực", "Lymphatics of the thorax", [THORACIC_WALL_NODES, MEDIASTINAL_NODES, THORAX_VESSELS], [THORAX_BONES], ["hạch trung thất", "mediastinal nodes", "hạch phế quản"]),
  group("lymphatic-pelvis", "Bạch huyết chậu", "Lymphatics of the pelvis", [ILIAC_NODES, PELVIC_NODES, PELVIS_VESSELS], [PELVIS_BONES], ["hạch chậu", "iliac nodes"]),
  group("lymphatic-lower-limb", "Bạch huyết chi dưới", "Lymphatics of the lower limb", [INGUINAL_NODES, LEG_NODES, LOWER_LIMB_VESSELS], [LOWER_LIMB_BONES], ["hạch bẹn", "inguinal nodes", "hạch khoeo"]),
  group("lymphatic-axillary-nodes", "Hạch nách", "Axillary lymph nodes", [AXILLARY_NODES], [UPPER_LIMB_VESSELS, AXILLARY_BRANCHES, AXILLARY_VEINS, UPPER_LIMB_BONES, THORAX_BONES], ["hạch nách", "axillary nodes", "hạch dưới đòn"]),
  { ...group("lymphatic-inguinal-nodes", "Hạch bẹn", "Inguinal lymph nodes", [INGUINAL_NODES], [LOWER_LIMB_VESSELS, PELVIS_VESSELS, FEMORAL_ARTERY, FEMORAL_VEIN, SAPHENOUS, LOWER_LIMB_BONES], ["hạch bẹn", "inguinal nodes", "hạch bẹn nông", "hạch bẹn sâu"]), camera: { frame: [HIP_BONES] } },
  { ...group("lymphatic-popliteal-nodes", "Hạch khoeo", "Popliteal lymph nodes", [POPLITEAL_NODES], [LOWER_LIMB_VESSELS, POPLITEAL_ARTERY, POPLITEAL_VEIN, SAPHENOUS, KNEE_BONES], ["hạch khoeo", "popliteal nodes", "hố khoeo"], "back"), camera: { frame: [POPLITEAL_ARTERY] } },

  // ------------------------------------------------------------ nhóm cũ (deep link)
  group("lymphatic-upper-limb", "Bạch huyết chi trên và nách", "Lymphatics of the upper limb and axilla", [AXILLARY_NODES, ARM_NODES, UPPER_LIMB_VESSELS], [UPPER_LIMB_BONES], ["hạch nách", "axillary nodes"]),
  group("lymphatic-abdomen", "Bạch huyết bụng", "Lymphatics of the abdomen", [ABDOMINAL_VISCERAL_NODES, LUMBAR_NODES, ABDOMEN_VESSELS], [PELVIS_BONES], ["hạch mạc treo", "mesenteric nodes", "hạch thắt lưng"]),
  group("lymphatic-organs", "Lách và tuyến ức", "Spleen and thymus", [SPLEEN, THYMUS], [THORAX_BONES], ["cơ quan lympho", "lymphoid organs", "spleen", "thymus"]),

  structure("head-lymph-nodes", "Các nhóm hạch đầu", "Lymph nodes of the head", HEAD_NODES, "anterolateral"),
  structure("neck-lymph-nodes", "Các nhóm hạch cổ", "Lymph nodes of the neck", NECK_NODES, "anterolateral"),
  structure("head-neck-lymph-vessels", "Mạch bạch huyết đầu – cổ", "Lymphatic vessels of the head and neck", HEAD_NECK_VESSELS, "anterolateral"),
  structure("axillary-lymph-nodes", "Các nhóm hạch nách", "Axillary lymph nodes", AXILLARY_NODES),
  structure("arm-lymph-nodes", "Hạch cánh tay và khuỷu", "Lymph nodes of the arm and elbow", ARM_NODES),
  structure("upper-limb-lymph-vessels", "Mạch bạch huyết chi trên và nách", "Lymphatic vessels of the upper limb and axilla", UPPER_LIMB_VESSELS),
  structure("thoracic-wall-lymph-nodes", "Hạch thành ngực", "Lymph nodes of the thoracic wall", THORACIC_WALL_NODES),
  structure("mediastinal-lymph-nodes", "Hạch trung thất và phổi", "Mediastinal and pulmonary lymph nodes", MEDIASTINAL_NODES),
  structure("thorax-lymph-vessels", "Mạch bạch huyết ngực", "Lymphatic vessels of the thorax", THORAX_VESSELS),
  structure("abdominal-visceral-lymph-nodes", "Hạch tạng bụng", "Visceral lymph nodes of the abdomen", ABDOMINAL_VISCERAL_NODES),
  structure("lumbar-lymph-nodes", "Hạch thắt lưng và hạch hoành dưới", "Lumbar and inferior diaphragmatic lymph nodes", LUMBAR_NODES),
  structure("abdomen-lymph-vessels", "Mạch bạch huyết bụng", "Lymphatic vessels of the abdomen", ABDOMEN_VESSELS),
  structure("iliac-lymph-nodes", "Hạch chậu", "Iliac lymph nodes", ILIAC_NODES),
  structure("pelvic-lymph-nodes", "Hạch cùng, mông và tạng chậu", "Sacral, gluteal and pelvic visceral lymph nodes", PELVIC_NODES),
  structure("pelvis-lymph-vessels", "Mạch bạch huyết chậu", "Lymphatic vessels of the pelvis", PELVIS_VESSELS),
  structure("inguinal-lymph-nodes", "Hạch bẹn", "Inguinal lymph nodes", INGUINAL_NODES),
  structure("leg-lymph-nodes", "Hạch khoeo và cẳng chân", "Popliteal and leg lymph nodes", LEG_NODES),
  structure("popliteal-lymph-nodes", "Hạch khoeo", "Popliteal lymph nodes", POPLITEAL_NODES, "back"),
  structure("tibial-fibular-lymph-nodes", "Hạch chày và hạch mác", "Tibial and fibular lymph nodes", TIBIAL_FIBULAR_NODES),
  structure("lower-limb-lymph-vessels", "Mạch bạch huyết chi dưới", "Lymphatic vessels of the lower limb", LOWER_LIMB_VESSELS),
  structure("spleen", "Lách", "Spleen", SPLEEN),
  structure("thymus", "Tuyến ức", "Thymus", THYMUS),
];
