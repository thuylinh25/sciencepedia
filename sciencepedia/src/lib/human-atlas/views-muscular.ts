import type { AtlasViewDef, PartRule } from "./views";
import { RESPIRATORY_VIEWS, SCALENES, STERNOCLEIDOMASTOID } from "./views-respiratory";

/*
 * ## Góc nhìn theo hệ — Hệ cơ (2026-10-01)
 *
 * Audit dữ liệu: 416 mảnh hệ cơ (sau `correctSystems`). Grep trên bảng mảnh gộp mọi
 * nguồn: KHÔNG có cơ nhai (cắn, thái dương, chân bướm), cơ bám da mặt (vòng mắt, vòng
 * miệng, mút, trán…), cơ lưng rộng, cơ thẳng bụng, chéo bụng trong, ngang bụng, vuông
 * thắt lưng. Có: cơ cổ, lưỡi/khẩu cái, thanh quản, vận nhãn, lưng sâu, ngực, cơ hoành,
 * chéo bụng ngoài, thắt lưng chậu, đáy chậu, chi trên/dưới đủ khu, và cơ nhú của tim.
 * Cơ căng mạc đùi bị BodyParts3D xếp mô liên kết — lấy thẳng theo tên vào nhóm mông.
 * Cũng không có: cơ nhiều chân, cơ trâm lưỡi, khẩu cái lưỡi, cơ nội tại lưỡi, cơ hành
 * xốp, ngồi hang, ngang đáy chậu, thắt niệu đạo. Mảnh "superficial perineal muscle"
 * (FMA19728) là bản chép của nửa phải cơ thắt ngoài hậu môn — đã bỏ ở `correctSystems`.
 *
 * Bảng "Cấu trúc" theo KHU cơ (cơ trên móng, khu trước cẳng tay…), không một hàng mỗi
 * cơ: ~200 cơ hai bên là thư viện, không phải bảng để học. Cấu trúc đã có ở hô hấp
 * (cơ hoành, chéo bụng ngoài, ức đòn chũm, cơ gian sườn, cơ thanh quản) và giác quan
 * dùng lại — khai báo trùng tập mảnh là hai hàng chồng nhau. Khớp bằng tên.
 *
 * Lưới xếp theo "Muscular System Views" của atlas (chủ sản phẩm, 2026-10-15): nhóm
 * theo ĐỘNG TÁC (nghiêng/xoay/duỗi/gập đầu cổ, hạ hàm) rồi theo khớp (vai, khuỷu,
 * cổ tay…). Một cơ thuộc nhiều động tác, nên cần cấu trúc từng cơ — mỗi cấu trúc
 * mới nằm trọn trong MỘT khu cơ cũ (thang ⊂ cơ lưng nông, gối ⊂ lưng sâu…) để test
 * "phủ đủ, không chồng" vẫn qua ở các góc nhìn khác. Id cũ giữ cho deep link, đổi
 * phạm vi: muscle-thorax → cơ hít vào, muscle-back → lưng trên, muscle-shoulder-arm
 * → vai, muscle-forearm-hand → cổ tay và bàn tay, muscle-hip-thigh → hông,
 * muscle-leg-foot → cổ chân và bàn chân. Biểu cảm, nhai: không có dữ liệu.
 */

const m = (name: RegExp): PartRule => ({ systems: ["muscular"], name });

// Đầu – cổ.
const NECK_SUPERFICIAL = m(/platysma$|sternocleidomastoid$/i);
const SUPRAHYOID = m(/digastric$|stylohyoid$|mylohyoid$|geniohyoid$/i);
const INFRAHYOID = m(/sternohyoid$|sternothyroid$|thyrohyoid$|omohyoid$/i);
const DEEP_NECK = m(/scalenus (anterior|medius|posterior)$|longus colli$|longus capitis$|rectus capitis (anterior|lateralis)$/i);
const TONGUE_PALATE = m(/genioglossus$|hyoglossus$|veli palatini$|uvular muscle$/i);
const EXTRAOCULAR = m(/(superior|inferior|medial|lateral) rectus$|(superior|inferior) oblique$|levator palpebrae superioris$/i);
// Lưng.
const BACK_SUPERFICIAL = m(/trapezius$|rhomboid (major|minor)$|levator scapulae$/i);
export const ERECTOR_SPINAE = m(/iliocostalis (cervicis|thoracis|lumborum)$|longissimus (capitis|cervicis|thoracis)$|\bspinalis( thoracis)?$/i);
const DEEP_BACK = m(
  /semispinalis (capitis|cervicis|thoracis)$|rotator$|interspinal(is|es)|intertransversari|splenius (capitis|cervicis)$|levatores costarum|serratus posterior (superior|inferior)$/i,
);
export const SUBOCCIPITAL = m(/rectus capitis posterior (major|minor)$|obliquus capitis (superior|inferior)$/i);
// Ngực – bụng – chậu.
const PECTORAL = m(/pectoralis (major|minor)$|subclavius$|serratus anterior$/i);
const THORACIC_WALL = m(/intercostal muscle$|transversus thoracis$/i);
const EXTERNAL_OBLIQUE = m(/^(left|right) external oblique$/i);
// Hai cơ Z-Anatomy bổ sung (2026-10-27) — BodyParts3D không có khái niệm cho chúng.
const TRANSVERSUS_ABDOMINIS = m(/transversus abdominis muscle$/i);
const QUADRATUS_LUMBORUM = m(/quadratus lumborum muscle$/i);
const ILIOPSOAS = m(/psoas major$|iliacus$/i);
export const PELVIC_FLOOR = m(/coccygeus$|puborectalis$|external anal sphincter$/i);
// Chi trên.
const SHOULDER = m(/deltoid$|supraspinatus$|infraspinatus muscle$|teres (major|minor)$|subscapularis$/i);
const ARM_ANTERIOR = m(/biceps brachii$|\bbrachialis$|coracobrachialis$/i);
const ARM_POSTERIOR = m(/triceps brachii$|anconeus$/i);
const FOREARM_ANTERIOR = m(
  /pronator (teres|quadratus)$|flexor carpi (radialis|ulnaris)$|palmaris longus$|flexor digitorum (superficialis|profundus)$|flexor pollicis longus$/i,
);
const FOREARM_POSTERIOR = m(
  /brachioradialis$|extensor carpi (radialis longus|radialis brevis|ulnaris)$|extensor digitorum$|extensor digiti minimi$|supinator$|abductor pollicis longus$|extensor pollicis (longus|brevis)$|extensor indicis$/i,
);
const HAND = m(/abductor pollicis brevis$|flexor pollicis brevis$|opponens pollicis$|adductor pollicis$|of (left |right )?hand$/i);
// Chi dưới.
const GLUTEAL: PartRule = {
  systems: ["muscular", "connective"],
  name: /gluteus (maximus|medius|minimus)$|piriformis$|gemellus (superior|inferior)$|obturator internus$|quadratus femoris$|tensor fasciae latae$/i,
};
const THIGH_ANTERIOR = m(/sartorius$|rectus femoris$|vastus (lateralis|medialis|intermedius)$/i);
const THIGH_MEDIAL = m(/pectineus$|adductor (longus|brevis|magnus|minimus)$|gracilis$|obturator externus$/i);
const THIGH_POSTERIOR = m(/biceps femoris$|semitendinosus$|semimembranosus$/i);
const LEG_ANTERIOR = m(/tibialis anterior$|extensor digitorum longus$|extensor hallucis longus$|fibularis tertius$/i);
const LEG_LATERAL = m(/fibularis (longus|brevis)$/i);
const LEG_POSTERIOR = m(/gastrocnemius$|soleus$|plantaris$|popliteus$|tibialis posterior$|flexor digitorum longus$|flexor hallucis longus$/i);
const FOOT = m(/extensor hallucis brevis$|abductor hallucis$|flexor digitorum brevis$|flexor accessorius$|flexor hallucis brevis$|adductor hallucis$|of (left |right )?foot$/i);
// Tim.
const PAPILLARY = m(/papillary muscle of (left |right )?ventricle$/i);

// Từng cơ cho góc nhìn theo động tác — neo đầu/cuối tên: "Inferior oblique part of
// longus colli" không được khớp cơ chéo dưới của mắt.
const TRAPEZIUS = m(/part of (left|right) trapezius$/i);
const UPPER_TRAPEZIUS = m(/^descending part of (left|right) trapezius$/i);
const LEVATOR_SCAPULAE = m(/^(left|right) levator scapulae$/i);
const SPLENIUS = m(/^(left|right) splenius (capitis|cervicis)$/i);
const SEMISPINALIS_HEAD_NECK = m(/^(left|right) semispinalis (capitis|cervicis)$/i);
const LONGISSIMUS_CAPITIS = m(/^(left|right) longissimus capitis$/i);
const CERVICAL_INTERTRANSVERSARII = m(/cervical intertransversarii$/i);
const LUMBAR_DEEP = m(/lumbar intertransversarius$|interspinales lumborum$|^(left |right )?lumbar rotator$|serratus posterior inferior$/i);
const RECTUS_CAPITIS_LATERALIS = m(/^(left|right) rectus capitis lateralis$/i);
const PREVERTEBRAL = m(/longus colli$|^(left|right) longus capitis$|^(left|right) rectus capitis anterior$/i);
const RCP_MAJOR = m(/^(left|right) rectus capitis posterior major$/i);
const RCP_MINOR = m(/^(left|right) rectus capitis posterior minor$/i);
const OC_INFERIOR = m(/^(left|right) obliquus capitis inferior$/i);
const OC_SUPERIOR = m(/^(left|right) obliquus capitis superior$/i);
const MANDIBLE_DEPRESSORS = m(/^(left|right) (digastric|mylohyoid|geniohyoid)$/i);
const BRACHIORADIALIS = m(/^(left|right) brachioradialis$/i);
const POPLITEUS = m(/^(left|right) popliteus$/i);
const GASTROCNEMIUS = m(/head of (left|right) gastrocnemius$/i);
const BICEPS_BRACHIALIS = m(/biceps brachii$|\bbrachialis$/i);
const CORACOBRACHIALIS = m(/^(left|right) coracobrachialis$/i);
// Khu sau cẳng tay trừ cơ cánh tay quay (chỉ gập khuỷu); khu sau cẳng chân trừ cơ khoeo (chỉ tác động gối).
const FOREARM_POSTERIOR_DISTAL: PartRule = { ...FOREARM_POSTERIOR, exclude: /brachioradialis$/i };
const LEG_POSTERIOR_DISTAL: PartRule = { ...LEG_POSTERIOR, exclude: /popliteus$/i };
// Cơ lưng sâu nội tại: cơ răng sau là lớp giữa (thần kinh gian sườn) — góc nhìn "Cột sống và cơ lưng sâu" của hệ xương.
export const DEEP_BACK_INTRINSIC: PartRule = { ...DEEP_BACK, exclude: /serratus posterior/i };
// Khối dựng sống chia vùng: phần cổ thuộc gáy, phần ngực – thắt lưng thuộc lưng dưới.
const ERECTOR_CERVICAL = m(/^(left|right) (iliocostalis|longissimus) cervicis$/i);
const ERECTOR_THORACOLUMBAR = m(/iliocostalis (thoracis|lumborum)$|longissimus thoracis$|\bspinalis( thoracis)?$/i);

// Cơ hô hấp và thanh quản: đúng tập nổi bật của góc nhìn hô hấp (cấu trúc đã có ở đó).
const respiratory = (id: string): AtlasViewDef => {
  const view = RESPIRATORY_VIEWS.find((v) => v.id === id);
  if (!view?.focus) throw new Error(`views-muscular: thiếu góc nhìn ${id}`);
  return view;
};
const LARYNGEAL = respiratory("respiratory-laryngeal-muscles");
const INSPIRATION = respiratory("respiratory-inspiration-muscles");
const EXPIRATION = respiratory("respiratory-expiration-muscles");

// Bối cảnh xương theo vùng.
const sk = (name: RegExp): PartRule => ({ systems: ["skeletal"], name });
const SKULL_NECK = sk(/mandible|^hyoid bone$|cervical vertebra$|^atlas$|^axis$|clavicle$|^manubrium$/i);
const SPINE_THORAX = sk(/vertebra$|\brib$|^sacrum$|scapula$/i);
const SKULL = sk(/occipital bone|temporal bone|parietal bone|frontal bone|sphenoid bone|mandible|maxilla$/i);
const UPPER_LIMB_BONES = sk(/(humerus|scapula|clavicle|radius|ulna)$/i);
const HAND_BONES = sk(/(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$|metacarpal bone$|phalanx of (left |right )?(thumb|index finger|middle finger|ring finger|little finger)$/i);
const PELVIS_BONES = sk(/hip bone$|^sacrum$|lumbar vertebra$/i);
const LOWER_LIMB_BONES = sk(/(femur|tibia|fibula|patella|hip bone)$/i);

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
  extra: Partial<AtlasViewDef> = {},
): AtlasViewDef => ({ id, systemId: "muscular", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable", ...extra });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule, terms?: string[]): AtlasViewDef => ({
  id,
  systemId: "muscular",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
  ...(terms ? { terms } : {}),
});

export const MUSCULAR_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "muscular-overview",
    systemId: "muscular",
    kind: "overview",
    name: { vi: "Toàn bộ hệ cơ", en: "Whole muscular system" },
    direction: "front",
    focus: [{ systems: ["muscular"] }, GLUTEAL],
    partial: {
      vi: "Thiếu cơ bám da mặt, cơ nhai, cơ lưng rộng, cơ thẳng bụng, cơ chéo bụng trong, cơ ngang bụng, cơ vuông thắt lưng, cơ nhiều chân và các cơ đáy chậu (hành xốp, ngồi hang, ngang đáy chậu, thắt niệu đạo)",
      en: "The facial and masticatory muscles, latissimus dorsi, rectus abdominis, internal oblique, transversus abdominis, quadratus lumborum, multifidus and perineal muscles (bulbospongiosus, ischiocavernosus, transverse perineal, urethral sphincter) are missing",
    },
    terms: ["cơ", "muscle", "hệ cơ", "muscular system"],
    quality: "acceptable",
  },
  {
    id: "muscle-expression",
    systemId: "muscular",
    kind: "group",
    name: { vi: "Cơ biểu cảm", en: "Muscles of facial expression" },
    direction: "front",
    missing: {
      vi: "Bộ dữ liệu chưa có các cơ bám da mặt; chỉ có cơ bám da cổ, xem ở nhóm cơ cổ",
      en: "The facial muscles of expression are not in the dataset; only the platysma is, shown with the neck muscles",
    },
    terms: ["cơ mặt", "facial muscles", "biểu cảm", "expression"],
  },
  {
    id: "muscle-mastication",
    systemId: "muscular",
    kind: "group",
    name: { vi: "Cơ nhai", en: "Muscles of mastication" },
    direction: "side",
    missing: { vi: "Bộ dữ liệu chưa có cơ cắn, cơ thái dương và các cơ chân bướm", en: "Masseter, temporalis and the pterygoid muscles are not in the dataset" },
    terms: ["cơ nhai", "mastication", "cơ cắn", "masseter"],
  },
  group("muscle-laryngeal", "Cơ thanh quản", "Laryngeal muscles", LARYNGEAL.direction, [...LARYNGEAL.focus!], [...(LARYNGEAL.context ?? [])],
    ["cơ thanh quản", "laryngeal muscles", "dây thanh", "vocal cord"]),
  group("muscle-neck-lateral-flexion", "Nghiêng đầu và cổ", "Lateral flexion of the head and neck", "front",
    [STERNOCLEIDOMASTOID, SCALENES, UPPER_TRAPEZIUS, LEVATOR_SCAPULAE, SPLENIUS, LONGISSIMUS_CAPITIS, RECTUS_CAPITIS_LATERALIS, CERVICAL_INTERTRANSVERSARII], [SKULL_NECK, SKULL],
    ["nghiêng cổ", "nghiêng đầu", "lateral flexion"]),
  group("muscle-head-rotation", "Xoay đầu", "Rotation of the head", "posterolateral",
    [STERNOCLEIDOMASTOID, SPLENIUS, LONGISSIMUS_CAPITIS, OC_INFERIOR, RCP_MAJOR], [SKULL_NECK, SKULL],
    ["xoay đầu", "quay đầu", "head rotation"]),
  group("muscle-head-neck-extension", "Duỗi đầu và cổ", "Extension of the head and neck", "back",
    [UPPER_TRAPEZIUS, SPLENIUS, SEMISPINALIS_HEAD_NECK, LONGISSIMUS_CAPITIS, RCP_MAJOR, RCP_MINOR, OC_SUPERIOR], [SKULL_NECK, SKULL],
    ["duỗi cổ", "ngửa đầu", "extension"]),
  group("muscle-head-flexion", "Gập đầu và cổ", "Flexion of the head and neck", "anterolateral",
    [STERNOCLEIDOMASTOID, PREVERTEBRAL], [SKULL_NECK, SKULL],
    ["gập cổ", "cúi đầu", "flexion", "cơ trước cột sống", "prevertebral"]),
  group("muscle-mandible-depression", "Hạ hàm dưới", "Depression of the mandible", "anterolateral",
    // Cơ dưới móng chỉ cố định xương móng — bối cảnh, không nổi bật.
    [MANDIBLE_DEPRESSORS], [INFRAHYOID, SKULL_NECK, SKULL],
    ["há miệng", "hạ hàm", "mandible depression", "cơ hai bụng", "digastric"], {
      partial: { vi: "Thiếu cơ chân bướm ngoài", en: "The lateral pterygoid is missing" },
    }),
  group("muscle-head-neck", "Cơ cổ, lưỡi và khẩu cái", "Muscles of the neck, tongue and palate", "anterolateral",
    [NECK_SUPERFICIAL, SUPRAHYOID, INFRAHYOID, DEEP_NECK, TONGUE_PALATE], [SKULL_NECK], ["cơ cổ", "neck muscles", "cơ trên móng", "cơ dưới móng"], {
      partial: { vi: "Thiếu cơ trâm lưỡi, cơ khẩu cái lưỡi và cơ nội tại của lưỡi", en: "Styloglossus, palatoglossus and the intrinsic tongue muscles are missing" },
    }),
  // Id cũ (trước: cơ ngực và cơ hoành).
  group("muscle-thorax", "Cơ hít vào", "Muscles of inspiration", INSPIRATION.direction, [...INSPIRATION.focus!], [...(INSPIRATION.context ?? [])],
    ["hít vào", "inspiration", "inhalation", "cơ hoành", "diaphragm"]),
  group("muscle-exhalation", "Cơ thở ra", "Muscles of expiration", EXPIRATION.direction, [...EXPIRATION.focus!], [...(EXPIRATION.context ?? [])],
    ["thở ra", "expiration", "exhalation"], { partial: EXPIRATION.partial, quality: EXPIRATION.quality }),
  // Id cũ (trước: cơ vai và cánh tay).
  group("muscle-shoulder-arm", "Vai", "Shoulder", "anterolateral", [SHOULDER, CORACOBRACHIALIS, PECTORAL, BACK_SUPERFICIAL], [UPPER_LIMB_BONES, SPINE_THORAX],
    ["cơ vai", "shoulder", "cơ delta", "deltoid", "chóp xoay", "rotator cuff", "cơ ngực", "pectoral"], {
      partial: { vi: "Thiếu cơ lưng rộng", en: "Latissimus dorsi is missing" },
    }),
  group("muscle-elbow", "Khuỷu", "Elbow", "anterolateral", [BICEPS_BRACHIALIS, ARM_POSTERIOR, BRACHIORADIALIS], [UPPER_LIMB_BONES],
    ["khuỷu tay", "elbow", "cơ nhị đầu", "biceps", "cơ tam đầu", "triceps"]),
  // Id cũ (trước: cơ cẳng tay và bàn tay). Có cả cơ sấp/ngửa nên tên nói "cẳng tay".
  group("muscle-forearm-hand", "Cẳng tay, cổ tay và bàn tay", "Forearm, wrist and hand", "front", [FOREARM_ANTERIOR, FOREARM_POSTERIOR_DISTAL, HAND], [UPPER_LIMB_BONES, HAND_BONES],
    ["cổ tay", "wrist", "cơ cẳng tay", "forearm", "cơ bàn tay", "hand muscles", "cơ ô mô cái", "thenar"]),
  // Id cũ (trước: toàn bộ cơ lưng).
  group("muscle-back", "Gáy và lưng trên", "Upper back and nape", "back", [BACK_SUPERFICIAL, SPLENIUS, SEMISPINALIS_HEAD_NECK, ERECTOR_CERVICAL, LONGISSIMUS_CAPITIS, SUBOCCIPITAL], [SPINE_THORAX, SKULL],
    ["lưng trên", "upper back", "gáy", "nape", "cơ thang", "trapezius", "cơ trám", "rhomboid"], {
      partial: { vi: "Thiếu cơ lưng rộng", en: "Latissimus dorsi is missing" },
    }),
  group("muscle-lower-back", "Lưng dưới", "Lower back", "back", [ERECTOR_THORACOLUMBAR, LUMBAR_DEEP, QUADRATUS_LUMBORUM], [SPINE_THORAX, PELVIS_BONES],
    ["lưng dưới", "lower back", "thắt lưng", "cơ dựng sống", "erector spinae", "cơ dài nhất", "longissimus", "cơ vuông thắt lưng", "quadratus lumborum"], {
      partial: { vi: "Thiếu cơ nhiều chân và cơ lưng rộng", en: "Multifidus and latissimus dorsi are missing" },
    }),
  group("muscle-abdomen-pelvis", "Cơ bụng, thắt lưng chậu và đáy chậu", "Muscles of the abdomen, iliopsoas and pelvic floor", "front",
    [EXTERNAL_OBLIQUE, TRANSVERSUS_ABDOMINIS, QUADRATUS_LUMBORUM, ILIOPSOAS, PELVIC_FLOOR], [PELVIS_BONES], ["cơ bụng", "abdominal muscles", "đáy chậu", "pelvic floor", "cơ thắt lưng chậu", "cơ ngang bụng", "transversus abdominis"], {
      partial: {
        vi: "Thiếu cơ thẳng bụng, cơ chéo bụng trong, cơ hành xốp, cơ ngồi hang, cơ ngang đáy chậu và cơ thắt niệu đạo",
        en: "Rectus abdominis, internal oblique, bulbospongiosus, ischiocavernosus, the transverse perineal muscles and the urethral sphincter are missing",
      },
    }),
  // Id cũ (trước: cơ hông và đùi).
  group("muscle-hip-thigh", "Hông", "Hip", "posterolateral", [GLUTEAL, ILIOPSOAS, THIGH_MEDIAL], [PELVIS_BONES, LOWER_LIMB_BONES],
    ["hông", "hip", "cơ mông", "gluteal", "cơ khép", "adductor", "cơ thắt lưng chậu", "iliopsoas"]),
  group("muscle-knee", "Gối", "Knee", "anterolateral", [THIGH_ANTERIOR, THIGH_POSTERIOR, POPLITEUS, GASTROCNEMIUS], [LOWER_LIMB_BONES],
    ["đầu gối", "knee", "cơ tứ đầu đùi", "quadriceps", "hamstrings", "cơ khoeo", "popliteus"]),
  // Id cũ (trước: cơ cẳng chân và bàn chân), trừ cơ khoeo.
  group("muscle-leg-foot", "Cổ chân và bàn chân", "Ankle and foot", "anterolateral", [LEG_ANTERIOR, LEG_LATERAL, LEG_POSTERIOR_DISTAL, FOOT], [LOWER_LIMB_BONES],
    ["cổ chân", "ankle", "cơ cẳng chân", "leg muscles", "cơ bắp chân", "calf", "cơ bàn chân", "foot muscles"]),

  structure("neck-superficial-muscles", "Cơ bám da cổ và cơ ức đòn chũm", "Platysma and sternocleidomastoid", "anterolateral", NECK_SUPERFICIAL),
  structure("suprahyoid-muscles", "Các cơ trên móng", "Suprahyoid muscles", "anterolateral", SUPRAHYOID),
  structure("infrahyoid-muscles", "Các cơ dưới móng", "Infrahyoid muscles", "front", INFRAHYOID),
  structure("deep-neck-muscles", "Cơ bậc thang và cơ trước cột sống", "Scalene and prevertebral muscles", "anterolateral", DEEP_NECK),
  {
    ...structure("tongue-palate-muscles", "Cơ lưỡi và cơ khẩu cái", "Muscles of the tongue and palate", "side", TONGUE_PALATE),
    partial: {
      vi: "Thiếu cơ trâm lưỡi, cơ khẩu cái lưỡi và cơ nội tại của lưỡi",
      en: "Styloglossus, palatoglossus and the intrinsic tongue muscles are missing",
    },
  },
  structure("extraocular-muscles", "Cơ vận nhãn và cơ nâng mi trên (hai mắt)", "Extraocular muscles (both eyes)", "front", EXTRAOCULAR),
  structure("back-superficial-muscles", "Cơ thang, cơ trám và cơ nâng vai", "Trapezius, rhomboids and levator scapulae", "back", BACK_SUPERFICIAL),
  structure("erector-spinae", "Cơ dựng sống", "Erector spinae", "back", ERECTOR_SPINAE),
  structure("deep-back-muscles", "Cơ lưng sâu và cơ răng sau", "Deep back muscles and serratus posterior", "back", DEEP_BACK, ["ngang gai", "transversospinal", "cơ gối", "splenius"]),
  structure("suboccipital-muscles", "Các cơ dưới chẩm", "Suboccipital muscles", "back", SUBOCCIPITAL),
  structure("pectoral-muscles", "Cơ ngực lớn, ngực bé, dưới đòn và răng trước", "Pectoralis major and minor, subclavius and serratus anterior", "front", PECTORAL),
  structure("thoracic-wall-muscles", "Cơ gian sườn và cơ ngang ngực", "Intercostal muscles and transversus thoracis", "front", THORACIC_WALL),
  structure("transversus-abdominis", "Cơ ngang bụng", "Transversus abdominis", "front", TRANSVERSUS_ABDOMINIS, ["cơ ngang bụng", "transversus abdominis"]),
  structure("quadratus-lumborum", "Cơ vuông thắt lưng", "Quadratus lumborum", "back", QUADRATUS_LUMBORUM, ["cơ vuông thắt lưng", "quadratus lumborum"]),
  structure("iliopsoas", "Cơ thắt lưng lớn và cơ chậu", "Psoas major and iliacus", "front", ILIOPSOAS, ["cơ thắt lưng chậu", "iliopsoas"]),
  {
    ...structure("pelvic-floor-muscles", "Cơ hoành chậu và đáy chậu", "Pelvic diaphragm and perineal muscles", "inferior", PELVIC_FLOOR, ["cơ nâng hậu môn", "levator ani", "pelvic floor"]),
    partial: {
      vi: "Thiếu cơ hành xốp, cơ ngồi hang, cơ ngang đáy chậu và cơ thắt niệu đạo",
      en: "Bulbospongiosus, ischiocavernosus, the transverse perineal muscles and the urethral sphincter are missing",
    },
  },
  structure("shoulder-muscles", "Cơ delta, các cơ chóp xoay và cơ tròn lớn", "Deltoid, rotator cuff and teres major", "anterolateral", SHOULDER, ["chóp xoay", "rotator cuff"]),
  structure("arm-anterior-muscles", "Khu trước cánh tay", "Anterior compartment of the arm", "front", ARM_ANTERIOR),
  structure("arm-posterior-muscles", "Khu sau cánh tay", "Posterior compartment of the arm", "back", ARM_POSTERIOR),
  structure("forearm-anterior-muscles", "Khu trước cẳng tay", "Anterior compartment of the forearm", "front", FOREARM_ANTERIOR),
  structure("forearm-posterior-muscles", "Khu sau cẳng tay", "Posterior compartment of the forearm", "back", FOREARM_POSTERIOR),
  structure("hand-muscles", "Cơ bàn tay", "Intrinsic muscles of the hand", "front", HAND),
  structure("gluteal-muscles", "Cơ vùng mông và cơ căng mạc đùi", "Gluteal muscles and tensor fasciae latae", "back", GLUTEAL),
  structure("thigh-anterior-muscles", "Khu trước đùi", "Anterior compartment of the thigh", "front", THIGH_ANTERIOR, ["cơ tứ đầu đùi", "quadriceps"]),
  structure("thigh-medial-muscles", "Khu trong đùi", "Medial compartment of the thigh", "front", THIGH_MEDIAL, ["cơ khép", "adductor"]),
  structure("thigh-posterior-muscles", "Khu sau đùi", "Posterior compartment of the thigh", "back", THIGH_POSTERIOR, ["hamstrings"]),
  structure("leg-anterior-muscles", "Khu trước cẳng chân", "Anterior compartment of the leg", "front", LEG_ANTERIOR),
  structure("leg-lateral-muscles", "Khu ngoài cẳng chân", "Lateral compartment of the leg", "side", LEG_LATERAL),
  structure("leg-posterior-muscles", "Khu sau cẳng chân", "Posterior compartment of the leg", "back", LEG_POSTERIOR, ["cơ tam đầu cẳng chân", "triceps surae"]),
  structure("foot-muscles", "Cơ bàn chân", "Intrinsic muscles of the foot", "inferior", FOOT),
  structure("papillary-muscles", "Cơ nhú (tim)", "Papillary muscles (heart)", "front", PAPILLARY),

  // Từng cơ (góc nhìn theo động tác) — mỗi cái lồng trong một khu cơ ở trên.
  structure("trapezius", "Cơ thang", "Trapezius", "back", TRAPEZIUS),
  structure("upper-trapezius", "Phần xuống cơ thang", "Descending part of trapezius", "back", UPPER_TRAPEZIUS, ["bó trên cơ thang"]),
  structure("levator-scapulae", "Cơ nâng vai", "Levator scapulae", "posterolateral", LEVATOR_SCAPULAE),
  structure("splenius", "Cơ gối đầu và cơ gối cổ", "Splenius capitis and cervicis", "back", SPLENIUS),
  structure("semispinalis-head-neck", "Cơ bán gai đầu và bán gai cổ", "Semispinalis capitis and cervicis", "back", SEMISPINALIS_HEAD_NECK),
  structure("longissimus-capitis", "Cơ dài nhất đầu", "Longissimus capitis", "back", LONGISSIMUS_CAPITIS, ["cơ dài nhất", "longissimus"]),
  structure("erector-spinae-cervical", "Cơ chậu sườn cổ và cơ dài nhất cổ", "Iliocostalis cervicis and longissimus cervicis", "back", ERECTOR_CERVICAL),
  structure("erector-spinae-thoracolumbar", "Cơ chậu sườn, cơ dài nhất và cơ gai (ngực – thắt lưng)", "Iliocostalis, longissimus and spinalis (thoracolumbar)", "back", ERECTOR_THORACOLUMBAR, ["cơ dài nhất", "longissimus"]),
  structure("cervical-intertransversarii", "Các cơ gian ngang cổ", "Cervical intertransversarii", "anterolateral", CERVICAL_INTERTRANSVERSARII),
  structure("lumbar-deep-muscles", "Cơ lưng sâu vùng thắt lưng và cơ răng sau dưới", "Deep lumbar muscles and serratus posterior inferior", "back", LUMBAR_DEEP),
  structure("rectus-capitis-lateralis", "Cơ thẳng đầu ngoài", "Rectus capitis lateralis", "front", RECTUS_CAPITIS_LATERALIS),
  structure("prevertebral-muscles", "Cơ dài cổ, cơ dài đầu và cơ thẳng đầu trước", "Longus colli, longus capitis and rectus capitis anterior", "front", PREVERTEBRAL, ["cơ trước cột sống", "prevertebral"]),
  structure("rectus-capitis-posterior-major", "Cơ thẳng đầu sau lớn", "Rectus capitis posterior major", "back", RCP_MAJOR),
  structure("rectus-capitis-posterior-minor", "Cơ thẳng đầu sau bé", "Rectus capitis posterior minor", "back", RCP_MINOR),
  structure("obliquus-capitis-inferior", "Cơ chéo đầu dưới", "Obliquus capitis inferior", "back", OC_INFERIOR),
  structure("obliquus-capitis-superior", "Cơ chéo đầu trên", "Obliquus capitis superior", "back", OC_SUPERIOR),
  structure("mandible-depressors", "Cơ hai bụng, cơ hàm móng và cơ cằm móng", "Digastric, mylohyoid and geniohyoid", "anterolateral", MANDIBLE_DEPRESSORS),
  structure("brachioradialis", "Cơ cánh tay quay", "Brachioradialis", "anterolateral", BRACHIORADIALIS),
  structure("biceps-brachialis", "Cơ nhị đầu cánh tay và cơ cánh tay", "Biceps brachii and brachialis", "front", BICEPS_BRACHIALIS),
  structure("coracobrachialis", "Cơ quạ cánh tay", "Coracobrachialis", "front", CORACOBRACHIALIS),
  structure("forearm-posterior-distal", "Khu sau cẳng tay (trừ cơ cánh tay quay)", "Posterior forearm (excluding brachioradialis)", "back", FOREARM_POSTERIOR_DISTAL),
  structure("deep-back-intrinsic", "Cơ lưng sâu (cơ nội tại của lưng)", "Deep (intrinsic) back muscles", "back", DEEP_BACK_INTRINSIC),
  structure("leg-posterior-distal", "Khu sau cẳng chân (trừ cơ khoeo)", "Posterior leg (excluding popliteus)", "back", LEG_POSTERIOR_DISTAL),
  structure("popliteus", "Cơ khoeo", "Popliteus", "back", POPLITEUS),
  structure("gastrocnemius", "Cơ bụng chân", "Gastrocnemius", "back", GASTROCNEMIUS),
];
