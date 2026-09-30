import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ bạch huyết (2026-09-30)
 *
 * Audit dữ liệu: 169 mảnh — 13 mang mã FMA (lách, 2 thuỳ tuyến ức, 10 lưới
 * "Lymphatic vessels of <vùng>") và 156 hạch của UMCG (CC BY-NC-SA,
 * `scripts/import-umcg-lymphatic.ts`, mã `ZA-…`, ~110 nhóm có tên). Mạch bạch huyết
 * là LƯỚI theo vùng, không tách ống ngực/bể dưỡng chấp — lưới ngực trải y 0,98–1,58 m,
 * có thể đã chứa ống ngực; chưa kiểm bằng mắt nên KHÔNG ghi "thiếu ống ngực", và
 * đừng dựng góc nhìn "ống ngực". Không có hạnh nhân (amiđan).
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
const AXILLARY_NODES = lymph(/\b(axillary|infraclavicular|interpectoral) nodes?$/i);
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
  group("lymphatic-head-neck", "Bạch huyết đầu – cổ", "Lymphatics of the head and neck", [HEAD_NODES, NECK_NODES, HEAD_NECK_VESSELS], [SKULL_NECK], ["hạch cổ", "cervical nodes", "hạch dưới hàm"], "anterolateral"),
  group("lymphatic-upper-limb", "Bạch huyết chi trên và nách", "Lymphatics of the upper limb and axilla", [AXILLARY_NODES, ARM_NODES, UPPER_LIMB_VESSELS], [UPPER_LIMB_BONES], ["hạch nách", "axillary nodes"]),
  group("lymphatic-thorax", "Bạch huyết ngực", "Lymphatics of the thorax", [THORACIC_WALL_NODES, MEDIASTINAL_NODES, THORAX_VESSELS], [THORAX_BONES], ["hạch trung thất", "mediastinal nodes", "hạch phế quản"]),
  group("lymphatic-abdomen", "Bạch huyết bụng", "Lymphatics of the abdomen", [ABDOMINAL_VISCERAL_NODES, LUMBAR_NODES, ABDOMEN_VESSELS], [PELVIS_BONES], ["hạch mạc treo", "mesenteric nodes", "hạch thắt lưng"]),
  group("lymphatic-pelvis", "Bạch huyết chậu", "Lymphatics of the pelvis", [ILIAC_NODES, PELVIC_NODES, PELVIS_VESSELS], [PELVIS_BONES], ["hạch chậu", "iliac nodes"]),
  group("lymphatic-lower-limb", "Bạch huyết chi dưới", "Lymphatics of the lower limb", [INGUINAL_NODES, LEG_NODES, LOWER_LIMB_VESSELS], [LOWER_LIMB_BONES], ["hạch bẹn", "inguinal nodes", "hạch khoeo"]),
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
  structure("lower-limb-lymph-vessels", "Mạch bạch huyết chi dưới", "Lymphatic vessels of the lower limb", LOWER_LIMB_VESSELS),
  structure("spleen", "Lách", "Spleen", SPLEEN),
  structure("thymus", "Tuyến ức", "Thymus", THYMUS),
];
