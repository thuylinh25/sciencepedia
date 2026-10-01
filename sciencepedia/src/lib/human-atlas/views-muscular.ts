import type { AtlasViewDef, PartRule } from "./views";

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
const ERECTOR_SPINAE = m(/iliocostalis (cervicis|thoracis|lumborum)$|longissimus (capitis|cervicis|thoracis)$|\bspinalis( thoracis)?$/i);
const DEEP_BACK = m(
  /semispinalis (capitis|cervicis|thoracis)$|rotator$|interspinal(is|es)|intertransversari|splenius (capitis|cervicis)$|levatores costarum|serratus posterior (superior|inferior)$/i,
);
const SUBOCCIPITAL = m(/rectus capitis posterior (major|minor)$|obliquus capitis (superior|inferior)$/i);
// Ngực – bụng – chậu.
const PECTORAL = m(/pectoralis (major|minor)$|subclavius$|serratus anterior$/i);
const THORACIC_WALL = m(/intercostal muscle$|transversus thoracis$/i);
const DIAPHRAGM: PartRule = { fma: ["FMA13295"] };
const EXTERNAL_OBLIQUE = m(/^(left|right) external oblique$/i);
const ILIOPSOAS = m(/psoas major$|iliacus$/i);
const PELVIC_FLOOR = m(/coccygeus$|puborectalis$|external anal sphincter$/i);
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

// Bối cảnh xương theo vùng.
const sk = (name: RegExp): PartRule => ({ systems: ["skeletal"], name });
const SKULL_NECK = sk(/mandible|^hyoid bone$|cervical vertebra$|^atlas$|^axis$|clavicle$|^manubrium$/i);
const SPINE_THORAX = sk(/vertebra$|\brib$|^sacrum$|scapula$/i);
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
      vi: "Thiếu cơ bám da mặt, cơ nhai, cơ lưng rộng, cơ thẳng bụng, cơ chéo bụng trong, cơ ngang bụng, cơ vuông thắt lưng và các cơ đáy chậu (hành xốp, ngồi hang, ngang đáy chậu, thắt niệu đạo)",
      en: "The facial and masticatory muscles, latissimus dorsi, rectus abdominis, internal oblique, transversus abdominis, quadratus lumborum and perineal muscles (bulbospongiosus, ischiocavernosus, transverse perineal, urethral sphincter) are missing",
    },
    terms: ["cơ", "muscle", "hệ cơ", "muscular system"],
    quality: "acceptable",
  },
  group("muscle-head-neck", "Cơ cổ, lưỡi và khẩu cái", "Muscles of the neck, tongue and palate", "anterolateral",
    [NECK_SUPERFICIAL, SUPRAHYOID, INFRAHYOID, DEEP_NECK, TONGUE_PALATE], [SKULL_NECK], ["cơ cổ", "neck muscles", "cơ trên móng", "cơ dưới móng"], {
      partial: { vi: "Thiếu cơ bám da mặt và cơ nhai", en: "The facial and masticatory muscles are missing" },
    }),
  group("muscle-back", "Cơ lưng", "Muscles of the back", "back", [BACK_SUPERFICIAL, ERECTOR_SPINAE, DEEP_BACK, SUBOCCIPITAL], [SPINE_THORAX],
    ["cơ lưng", "back muscles", "cơ dựng sống", "erector spinae", "cơ thang", "trapezius"], {
      partial: { vi: "Thiếu cơ lưng rộng và cơ nhiều chân", en: "Latissimus dorsi and multifidus are missing" },
    }),
  group("muscle-thorax", "Cơ ngực và cơ hoành", "Muscles of the thorax and diaphragm", "front", [PECTORAL, THORACIC_WALL, DIAPHRAGM], [SPINE_THORAX],
    ["cơ ngực", "pectoral", "cơ răng trước", "serratus anterior"]),
  group("muscle-abdomen-pelvis", "Cơ bụng, thắt lưng chậu và đáy chậu", "Muscles of the abdomen, iliopsoas and pelvic floor", "front",
    [EXTERNAL_OBLIQUE, ILIOPSOAS, PELVIC_FLOOR], [PELVIS_BONES], ["cơ bụng", "abdominal muscles", "đáy chậu", "pelvic floor", "cơ thắt lưng chậu"], {
      partial: {
        vi: "Thiếu cơ thẳng bụng, cơ chéo bụng trong, cơ ngang bụng, cơ vuông thắt lưng, cơ hành xốp, cơ ngồi hang, cơ ngang đáy chậu và cơ thắt niệu đạo",
        en: "Rectus abdominis, internal oblique, transversus abdominis, quadratus lumborum, bulbospongiosus, ischiocavernosus, the transverse perineal muscles and the urethral sphincter are missing",
      },
    }),
  group("muscle-shoulder-arm", "Cơ vai và cánh tay", "Muscles of the shoulder and arm", "anterolateral", [SHOULDER, ARM_ANTERIOR, ARM_POSTERIOR], [UPPER_LIMB_BONES],
    ["cơ vai", "shoulder", "cơ nhị đầu", "biceps", "cơ tam đầu", "triceps", "chóp xoay", "rotator cuff"]),
  group("muscle-forearm-hand", "Cơ cẳng tay và bàn tay", "Muscles of the forearm and hand", "front", [FOREARM_ANTERIOR, FOREARM_POSTERIOR, HAND], [UPPER_LIMB_BONES, HAND_BONES],
    ["cơ cẳng tay", "forearm", "cơ bàn tay", "hand muscles", "cơ ô mô cái", "thenar"]),
  group("muscle-hip-thigh", "Cơ hông và đùi", "Muscles of the hip and thigh", "front", [GLUTEAL, ILIOPSOAS, THIGH_ANTERIOR, THIGH_MEDIAL, THIGH_POSTERIOR], [LOWER_LIMB_BONES],
    ["cơ mông", "gluteal", "cơ tứ đầu đùi", "quadriceps", "cơ khép", "adductor", "cơ ụ ngồi cẳng chân", "hamstrings"]),
  group("muscle-leg-foot", "Cơ cẳng chân và bàn chân", "Muscles of the leg and foot", "front", [LEG_ANTERIOR, LEG_LATERAL, LEG_POSTERIOR, FOOT], [LOWER_LIMB_BONES],
    ["cơ cẳng chân", "leg muscles", "cơ bắp chân", "calf", "cơ bàn chân", "foot muscles"]),

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
];
