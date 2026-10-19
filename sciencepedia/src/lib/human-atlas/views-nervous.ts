import type { AtlasViewDef, PartRule } from "./views";
import { CAROTID_VERTEBRAL, CEREBRAL } from "./views-arterial";
import { INTERCOSTAL_NERVES, VAGUS } from "./views-respiratory";

/** Tuyến yên (hệ nội tiết) — chỉ làm bối cảnh cho mặt dưới não. */
const PITUITARY: PartRule = { fma: ["FMA13889"] };

/*
 * ## Góc nhìn theo hệ — Hệ thần kinh (2026-09-30)
 *
 * Audit dữ liệu: 386 mảnh — 146 của BodyParts3D (não: hồi/thuỳ, chất trắng, nhân
 * nền, gian não, thân não, tiểu não, não thất; thần kinh ổ mắt) và 240 của
 * Z-Anatomy (CC BY-SA, mã `ZA-…`: tuỷ sống, dây sọ V2/V3, VII–XII, đám rối cánh
 * tay và thần kinh chi, thân giao cảm). KHÔNG có: dây khứu giác (I), dây vận
 * nhãn ngoài (VI), rễ và hạch dây sinh ba, dây hoành, đám rối cổ — đừng dựng
 * góc nhìn cho chúng.
 *
 * Dây phế vị và thần kinh gian sườn đã là cấu trúc ở `views-respiratory.ts`
 * (`vagus-nerves`, `intercostal-nerves`) — dùng lại, không khai báo trùng: hai
 * cấu trúc cùng tập mảnh sẽ cùng lên bảng và chồng nhau. Khớp bằng tên, trong hệ
 * thần kinh.
 *
 * Lưới góc nhìn xếp theo "Nervous System Views" của các atlas giải phẫu (chủ sản
 * phẩm, 2026-10-15): não → cấp máu → hệ viền → đồi thị → dây sọ → phế vị →
 * đám rối cánh tay → thắt lưng–cùng → thần kinh ngồi → tự chủ. Mắt, tai, lưỡi,
 * da của atlas nằm ở hệ giác quan / tiêu hoá / da của ta, không nhân bản ở đây.
 * Id cũ giữ nguyên cho deep link (`nervous-deep-brain`, `nervous-trunk` đổi
 * phạm vi, không đổi id). Nhóm được MƯỢN mảnh hệ khác làm nổi bật (cấp máu não
 * = động mạch) miễn tập nổi bật đúng bằng hợp các cấu trúc sẵn có — test "phủ
 * đủ, không chồng" của atlas-model.
 */

const n = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["nervous"], name, ...(exclude ? { exclude } : {}) });

// ------------------------------------------------------------------ não
const CORTEX = n(/gyrus$|lobule$|occipital lobe$|^(left|right) insula$/i);
const CEREBRAL_WHITE = n(
  /white matter of (left|right) cerebral hemisphere$|corpus callosum$|internal capsule$|(anterior|posterior) commissure$|fornix of forebrain$|stria terminalis$|lamina terminalis$/i,
);
const BASAL_NUCLEI = n(/caudate nucleus$|putamen$|globus pallidus$/i);
// Vách (FMA61842: vách trong suốt và vùng vách) gồm cả vùng vách — chất xám, hệ viền — không để ở chất trắng.
const HIPPOCAMPUS_AMYGDALA = n(/hippocampus$|amygdala$|^septum of telencephalon$/i);
const DIENCEPHALON = n(
  /thalamus$|hypothalamus$|habenula$|mammillary body$|tuber cinereum$|geniculate body$|stria medullaris of thalamus$/i,
  // Nhân đồi thị của Allen ("… nucleus of thalamus", "pulvinar of thalamus") — góc nhìn riêng.
  /nucle|pulvinar/i,
);
const BRAINSTEM = n(/^midbrain$|peduncle of midbrain$|colliculus$|brachium of (superior|inferior) colliculus$|^pons$|^medulla oblongata$|^interpeduncular fossa$/i);
const CEREBELLUM = n(/^cerebellum$/i);
const TENTORIUM = n(/^tentorium cerebelli$/i);
// Z-Anatomy (mốc M2, 2026-10-19): liềm đại não; nhân dây sọ và nhân đỏ nằm TRONG
// mảnh thân não BodyParts3D — cấu trúc riêng, không lồng vào `brainstem`.
const FALX = n(/^falx cerebri$/i);
const CN_NUCLEI = n(
  /nucleus of (oculomotor|trochlear|abducens|hypoglossal|accessory) nerve$|accessory nucleus of oculomotor nerve$|motor nucleus of facial nerve$|nucleus ambiguus$|nucleus of solitary tract$|posterior nucleus of vagus nerve$|salivatory nucleus$|vestibular nuclei$|cochlear nucleus$/i,
);
const RED_NUCLEUS = n(/red nucleus$/i);
const VENTRICLES = n(/ventricle$|^cerebral aqueduct$|interventricular foramen$|choroid plexus of ((left|right) )?cerebral hemisphere$/i);
// Lều tiểu não là màng cứng, không phải mô não — bối cảnh, không nổi bật.
const BRAIN = [CORTEX, CEREBRAL_WHITE, BASAL_NUCLEI, HIPPOCAMPUS_AMYGDALA, DIENCEPHALON, BRAINSTEM, CN_NUCLEI, RED_NUCLEUS, CEREBELLUM, VENTRICLES];
// Hệ viền: cấu trúc con lồng trong vỏ não / chất trắng / gian não — không khai một
// cấu trúc "hệ viền" chung, vì nó chồng một phần lên ba cấu trúc kia ở góc nhìn Não.
const LIMBIC_GYRI = n(/cingulate gyrus$|parahippocampal gyrus$/i);
const FORNIX = n(/fornix of forebrain$/i);
const MAMMILLARY = n(/^mammillary body$/i);
const LIMBIC = [LIMBIC_GYRI, HIPPOCAMPUS_AMYGDALA, FORNIX, MAMMILLARY];

// Cấp sâu hơn (lộ trình docs/roadmaps/human-atlas-nervous-system.json, mốc M1): mỗi
// cấp con chia HẾT cấp cha — thiếu một mảnh là bảng của cha hiện hàng "Phần còn
// lại". Hồi cạnh hải mã và hồi đai nằm trong CORTEX nhưng thuộc `limbic-gyri`,
// không xếp vào thuỳ nào ở đây.
const PRECENTRAL = n(/precentral gyrus$/i);
const SUPERIOR_FRONTAL = n(/superior frontal gyrus$/i);
const MIDDLE_FRONTAL = n(/middle frontal gyrus$/i);
const INFERIOR_FRONTAL = n(/inferior frontal gyrus$/i);
const ORBITAL_GYRI = n(/^orbital gyrus$/i);
const FRONTAL_LOBE = n(/precentral gyrus$|frontal gyrus$|^orbital gyrus$/i);
const POSTCENTRAL = n(/postcentral gyrus$/i);
const SUPERIOR_PARIETAL = n(/superior parietal lobule$/i);
const SUPRAMARGINAL = n(/supramarginal gyrus$/i);
const ANGULAR = n(/angular gyrus$/i);
const INFERIOR_PARIETAL = n(/supramarginal gyrus$|angular gyrus$/i);
const PARIETAL_LOBE = n(/postcentral gyrus$|superior parietal lobule$|supramarginal gyrus$|angular gyrus$/i);
const SUPERIOR_TEMPORAL = n(/superior temporal gyrus$/i);
const MIDDLE_TEMPORAL = n(/middle temporal gyrus$/i);
const INFERIOR_TEMPORAL = n(/inferior temporal gyrus$/i);
const FUSIFORM = n(/fusiform gyrus$/i);
const TEMPORAL_LOBE = n(/temporal gyrus$|fusiform gyrus$/i);
const OCCIPITAL_LOBE = n(/occipital lobe$/i);
const INSULA = n(/^(left|right) insula$/i);
const MIDBRAIN = n(/^midbrain$|peduncle of midbrain$|colliculus$|brachium of (superior|inferior) colliculus$|^interpeduncular fossa$/i);
const PONS = n(/^pons$/i);
const MEDULLA = n(/^medulla oblongata$/i);
const LATERAL_VENTRICLES = n(/lateral ventricle$|^interventricular foramen$/i);
const THIRD_VENTRICLE = n(/^third ventricle$/i);
const AQUEDUCT = n(/^cerebral aqueduct$/i);
const FOURTH_VENTRICLE = n(/^fourth ventricle$/i);
// Mảnh BodyParts3D xếp ở giác quan; correctSystems đưa về thần kinh.
const CHOROID_PLEXUS = n(/^choroid plexus of ((left|right) )?cerebral hemisphere$/i);
const HIPPOCAMPUS = n(/hippocampus$/i);
const AMYGDALA = n(/amygdala$/i);
const SEPTUM = n(/^septum of telencephalon$/i);
// Thể gối và thể vú đứng cạnh đồi thị / vùng dưới đồi trong bảng, không lồng vào:
// cấu trúc con chỉ phủ một phần cha thì mở cha ra hàng "Phần còn lại".
// Neo `^`: "thalamus$" trơn khớp cả hypothalamus và vân tuỷ đồi thị.
const THALAMUS = n(/^(left|right) thalamus$/i);
const GENICULATE = n(/geniculate body$/i);
const HYPOTHALAMUS = n(/^hypothalamus$|^tuber cinereum$/i);

// Allen Human Reference Atlas (CC BY 4.0, `scripts/allen-hra.py`, 2026-10-19): nhân sâu
// BodyParts3D không có. Nhân đồi thị nằm TRONG mảnh đồi thị đục — chỉ hiện ở góc nhìn riêng với
// đồi thị mờ làm nền, không thêm vào các góc nhìn não khác (vẽ chồng hai lần, không thấy gì).
const A_ANTERIOR_THALAMIC_NUCLEI = n(/^(left|right) anterior nuclear complex of thalamus$/i);
const A_LATERAL_DORSAL_NUCLEUS = n(/^(left|right) lateral dorsal nucleus of thalamus$/i);
const A_MEDIODORSAL_NUCLEUS = n(/^(left|right) mediodorsal nucleus of thalamus$/i);
const A_LATERAL_POSTERIOR_NUCLEUS = n(/^(left|right) lateral posterior nucleus of thalamus$/i);
const A_PULVINAR = n(/^(left|right) pulvinar of thalamus$/i);
const A_VENTRAL_ANTERIOR_NUCLEUS = n(/^(left|right) ventral anterior nucleus of thalamus$/i);
const A_VENTRAL_LATERAL_NUCLEUS = n(/^(left|right) ventral lateral nucleus of thalamus$/i);
const A_VENTRAL_POSTERIOR_LATERAL_NUCLEUS = n(/^(left|right) ventral posterior lateral nucleus of thalamus$/i);
const A_VENTRAL_POSTERIOR_MEDIAL_NUCLEUS = n(/^(left|right) ventral posterior medial nucleus of thalamus$/i);
const A_CENTROMEDIAN_NUCLEUS = n(/^(left|right) centromedian nucleus of thalamus$/i);
const A_PARAFASCICULAR_NUCLEUS = n(/^(left|right) parafascicular nucleus of thalamus$/i);

// CIT168 (CC BY 4.0, scripts/mni-subcortical.py): chất đen tách phần đặc / phần lưới — thay khối
// chất đen một mảnh của Allen.
const SN_COMPACTA = n(/^(left|right) pars compacta of substantia nigra$/i);
const SN_RETICULATA = n(/^(left|right) pars reticulata of substantia nigra$/i);
// Neudorfer 2020 (CC BY 4.0): nhân vùng dưới đồi — nằm TRONG mảnh vùng dưới đồi đục, chỉ hiện ở góc
// nhìn riêng với vùng dưới đồi mờ (như nhân đồi thị).
const H_MEDIAL_PREOPTIC_NUCLEUS = n(/^(left|right) medial preoptic nucleus$/i);
const H_ANTERIOR_HYPOTHALAMIC_AREA = n(/^(left|right) anterior hypothalamic area$/i);
const H_SUPRACHIASMATIC_NUCLEUS = n(/^(left|right) suprachiasmatic nucleus$/i);
const H_SUPRAOPTIC_NUCLEUS = n(/^(left|right) supraoptic nucleus$/i);
const H_PARAVENTRICULAR_NUCLEUS = n(/^(left|right) paraventricular nucleus of hypothalamus$/i);
const H_PERIVENTRICULAR_NUCLEUS = n(/^(left|right) periventricular nucleus of hypothalamus$/i);
const H_DORSAL_PERIVENTRICULAR_NUCLEUS = n(/^(left|right) dorsal periventricular nucleus of hypothalamus$/i);
const H_VENTROMEDIAL_NUCLEUS = n(/^(left|right) ventromedial nucleus of hypothalamus$/i);
const H_DORSOMEDIAL_NUCLEUS = n(/^(left|right) dorsomedial nucleus of hypothalamus$/i);
const H_ARCUATE_NUCLEUS = n(/^(left|right) arcuate nucleus of hypothalamus$/i);
const H_LATERAL_HYPOTHALAMIC_AREA = n(/^(left|right) lateral hypothalamic area$/i);
const H_POSTERIOR_HYPOTHALAMIC_NUCLEUS = n(/^(left|right) posterior nucleus of hypothalamus$/i);
const H_TUBEROMAMMILLARY_NUCLEUS = n(/^(left|right) tuberomammillary nucleus$/i);
// Mốc cho nhân trên giao thoa thị / trên thị — cả dây thị giác thì chiếm hết khung.
const OPTIC_CHIASM = n(/^optic chiasm$/i);
const HYPOTHALAMIC_NUCLEI = [H_MEDIAL_PREOPTIC_NUCLEUS, H_ANTERIOR_HYPOTHALAMIC_AREA, H_SUPRACHIASMATIC_NUCLEUS, H_SUPRAOPTIC_NUCLEUS, H_PARAVENTRICULAR_NUCLEUS, H_PERIVENTRICULAR_NUCLEUS, H_DORSAL_PERIVENTRICULAR_NUCLEUS, H_VENTROMEDIAL_NUCLEUS, H_DORSOMEDIAL_NUCLEUS, H_ARCUATE_NUCLEUS, H_LATERAL_HYPOTHALAMIC_AREA, H_POSTERIOR_HYPOTHALAMIC_NUCLEUS, H_TUBEROMAMMILLARY_NUCLEUS];
const A_SUBTHALAMIC_NUCLEUS = n(/^(left|right) subthalamic nucleus$/i);
const A_CEREBELLAR_DEEP_NUCLEI = n(/^(left|right) cerebellar deep nuclei$/i);
const THALAMIC_NUCLEI = [A_ANTERIOR_THALAMIC_NUCLEI, A_LATERAL_DORSAL_NUCLEUS, A_MEDIODORSAL_NUCLEUS, A_LATERAL_POSTERIOR_NUCLEUS, A_PULVINAR, A_VENTRAL_ANTERIOR_NUCLEUS, A_VENTRAL_LATERAL_NUCLEUS, A_VENTRAL_POSTERIOR_LATERAL_NUCLEUS, A_VENTRAL_POSTERIOR_MEDIAL_NUCLEUS, A_CENTROMEDIAN_NUCLEUS, A_PARAFASCICULAR_NUCLEUS];
const EPITHALAMUS = n(/^habenula$|stria medullaris of thalamus$/i);

// ------------------------------------------------------------------ dây sọ
const OPTIC = n(/optic (nerve|chiasm|tract)$/i);
const OCULOMOTOR = n(/branch of (left|right) oculomotor nerve$/i);
const TROCHLEAR = n(/trochlear nerve$/i, /(supra|infra)trochlear|nucleus/i);
/** V1 và nhánh trong ổ mắt, cả hạch mi (hạch đối giao cảm treo trên nhánh mũi mi). */
const OPHTHALMIC = n(
  /ophthalmic nerve$|frontal nerve$|supra-orbital nerve$|supratrochlear nerve$|lacrimal nerve$|nasociliary nerve$|ethmoidal nerve$|infratrochlear nerve$|ciliary nerve$|ciliary ganglion$|nasociliary nerve with (left|right) ciliary ganglion$/i,
);
const MAXILLARY = n(/maxillary nerve$/i);
const MANDIBULAR = n(/division of mandibular nerve$|buccal nerve$|lingual nerve$|inferior alveolar nerve$|mental nerve$|nerve to mylohyoid muscle$/i);
const FACIAL = n(/facial nerve \(vii\)$|chorda tympani$/i);
const VESTIBULOCOCHLEAR = n(/vestibulocochlear nerve \(viii\)$|cochlear nerve$|vestibular nerve$/i);
const GLOSSOPHARYNGEAL = n(/glossopharyngeal nerve \(ix\)$/i);
const ACCESSORY = n(/accessory nerve \(xi\)$/i);
const HYPOGLOSSAL = n(/hypoglossal nerve \(xii\)$/i);
const OLFACTORY = n(/olfactory nerve \(i\)$/i);
const ABDUCENS = n(/abducens nerve \(vi\)$/i);
/** Thân dây V và hai rễ (Z-Anatomy); hạch sinh ba không có ở nguồn nào. */
const TRIGEMINAL_ROOTS = n(/trigeminal nerve \(v\)$|root of trigeminal nerve$/i);
const CRANIAL = [OLFACTORY, OPTIC, OCULOMOTOR, TROCHLEAR, TRIGEMINAL_ROOTS, OPHTHALMIC, MAXILLARY, MANDIBULAR, ABDUCENS, FACIAL, VESTIBULOCOCHLEAR, GLOSSOPHARYNGEAL, VAGUS, ACCESSORY, HYPOGLOSSAL];

// ------------------------------------------------------------------ tuỷ sống
const SPINAL_CORD = n(/horn of spinal cord$|white matter of spinal cord$|^central canal( of spinal cord)?$/i);
const SPINAL_DURA = n(/^spinal dura$/i);
const SPINAL_ROOTS = n(/root of spinal nerve$|^(left|right) spinal ganglion$|spinal ganglion$/i);
const CAUDA_EQUINA = n(/cauda equina$/i);

// ------------------------------------------------------------------ chi trên
const BRACHIAL_PLEXUS = n(/brachial plexus$/i);
/** Nhánh bên của đám rối (tách từ rễ/thân/bó, không thuộc các nhánh tận). */
const PLEXUS_COLLATERAL = n(/dorsal scapular nerve$|long thoracic nerve$|suprascapular nerve$|subclavian nerve$|subscapular nerve$|thoracodorsal nerve$|pectoral nerve$/i);
const MUSCULOCUTANEOUS = n(/musculocutaneous nerve$|lateral antebrachial cutaneous nerve$/i);
// `\b`: thiếu nó, "axillary nerve$" khớp cả "maxillary nerve" (thần kinh hàm trên).
const AXILLARY_NERVE = n(/\baxillary nerve$|superior lateral brachial cutaneous nerve$/i);
/** Dây giữa + nhánh; thần kinh gian cốt trước là nhánh của dây giữa. */
const MEDIAN = n(/median nerve$|median nerve with ulnar nerve$|anterior interosseous nerve of forearm$/i, /of (left|right) ulnar nerve$/i);
const ULNAR = n(/ulnar nerve$/i, /median nerve with/i);
/** Dây quay + nhánh: gian cốt sau, bì cẳng tay sau, bì cánh tay ngoài dưới. */
const RADIAL = n(/radial nerve$|posterior interosseous nerve of forearm$|posterior antebrachial cutaneous nerve$|inferior lateral brachial cutaneous nerve$/i);
const MEDIAL_CUTANEOUS = n(/medial (brachial|antebrachial) cutaneous nerve$/i);
const UPPER_LIMB = [BRACHIAL_PLEXUS, PLEXUS_COLLATERAL, MUSCULOCUTANEOUS, AXILLARY_NERVE, MEDIAN, ULNAR, RADIAL, MEDIAL_CUTANEOUS];

// ------------------------------------------------------------------ chi dưới, chậu
const LUMBAR_PLEXUS_OTHER = n(/iliohypogastric nerve$|ilio-inguinal nerve$|genitofemoral nerve$|lateral femoral cutaneous nerve$/i);
const FEMORAL = n(/femoral nerve$|saphenous nerve$/i, /genitofemoral|lateral femoral cutaneous|posterior femoral cutaneous/i);
const OBTURATOR = n(/obturator nerve$/i);
const SACRAL_PLEXUS_OTHER = n(/gluteal nerve$|pudendal nerve$|posterior femoral cutaneous nerve$|nerve to (piriformis|quadratus femoris) muscle$/i);
const SCIATIC = n(/^(left|right) sciatic nerve$/i);
const TIBIAL = n(/tibial nerve$|plantar nerve$/i);
const FIBULAR = n(/fibular nerve$|dorsal cutaneous nerve of foot$/i, /sural communicating/i);
const SURAL = n(/sural nerve$|sural cutaneous nerve$|sural communicating branch of common fibular nerve$/i);
const LOWER_LIMB = [LUMBAR_PLEXUS_OTHER, FEMORAL, OBTURATOR, SACRAL_PLEXUS_OTHER, SCIATIC, TIBIAL, FIBULAR, SURAL];

// ------------------------------------------------------------------ thân mình
const SYMPATHETIC = n(/sympathetic (trunk|nerves)$/i);

// Bối cảnh.
const SKULL: PartRule = { systems: ["skeletal"], name: /skull|cranium|frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|ethmoid$/i };
const SPINE: PartRule = { systems: ["skeletal"], name: /vertebra$|^atlas$|^axis$|^sacrum$|coccyx/i };
const UPPER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(humerus|scapula|clavicle|radius|ulna)$/i };
const LOWER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(femur|tibia|fibula|patella|hip bone)$|^sacrum$/i };
const RIBS: PartRule = { systems: ["skeletal"], name: /\brib\b|thoracic vertebra$/i };
const HEART: PartRule = { systems: ["cardiac"] };
const NECK_THORAX_VISCERA: PartRule = { systems: ["respiratory", "digestive"], name: /^(trachea|esophagus|stomach)$/i };
const ABDOMINAL_VISCERA: PartRule = { systems: ["digestive", "urinary"], name: /^(esophagus|stomach|duodenum|(ascending|transverse|descending) colon|(left|right) kidney)$/i };

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
  extra: Partial<AtlasViewDef> = {},
): AtlasViewDef => ({ id, systemId: "nervous", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable", ...extra });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule, terms?: string[]): AtlasViewDef => ({
  id,
  systemId: "nervous",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
  ...(terms ? { terms } : {}),
});

export const NERVOUS_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "nervous-overview",
    systemId: "nervous",
    kind: "overview",
    name: { vi: "Toàn bộ hệ thần kinh", en: "Whole nervous system" },
    direction: "front",
    focus: [{ systems: ["nervous"] }],
    partial: {
      vi: "Thiếu các hạch của dây thần kinh sọ (trừ hạch mi), dây hoành và đám rối cổ",
      en: "The cranial nerve ganglia (except the ciliary ganglion), phrenic nerves and cervical plexus are missing",
    },
    terms: ["thần kinh", "nervous system", "não", "brain", "tuỷ sống", "spinal cord"],
    quality: "acceptable",
  },
  group("nervous-brain", "Não", "Brain", "side", BRAIN, [SKULL, TENTORIUM, FALX], ["brain", "đại não", "cerebrum"]),
  // Nhìn từ dưới lên: não + dây sọ I–VI ở nền sọ. Dây VII–XII chạy xuống mặt, cổ, thân —
  // đưa vào tập nổi bật thì khung bị kéo ra cả người. Vòng động mạch não + tuyến yên làm bối cảnh.
  group(
    "nervous-base-of-brain",
    "Mặt dưới não",
    "Base of the brain",
    "inferior",
    [...BRAIN, OLFACTORY, OPTIC, OCULOMOTOR, TROCHLEAR, TRIGEMINAL_ROOTS, ABDUCENS],
    [CAROTID_VERTEBRAL, CEREBRAL, PITUITARY],
    ["nền não", "mặt dưới não", "base of brain", "giao thoa thị giác", "thể vú"],
    {
      // Câu của science-editor (2026-10-19), nguyên văn.
      partial: {
        vi: "Góc nhìn này chỉ làm nổi bật dây thần kinh sọ I–VI. Các dây VII–XII cũng ló ra ở mặt dưới thân não — chỗ cầu não giáp hành não và ở hành não (dây XI còn có rễ từ tuỷ sống cổ) — nhưng không được làm nổi bật ở đây. Dây III chỉ có phần nhánh trong ổ mắt; đoạn ló ra từ não giữa không có trong dữ liệu.",
        en: "This view highlights only cranial nerves I–VI. Nerves VII–XII also emerge from the underside of the brainstem — where the pons meets the medulla, and from the medulla (nerve XI also has roots from the cervical spinal cord) — but are not highlighted here. Nerve III is shown only as its branches in the orbit; the segment where it leaves the midbrain is not in the data.",
      },
    },
  ),
  // Động mạch nổi bật, não mờ phía sau — tập nổi bật đúng bằng "Động mạch não" của hệ động mạch.
  group("nervous-brain-blood-supply", "Cấp máu cho não", "Blood supply of the brain", "side", [CAROTID_VERTEBRAL, CEREBRAL], BRAIN,
    ["động mạch não", "cerebral arteries", "vòng Willis", "circle of Willis", "cấp máu", "blood supply"]),
  group("nervous-limbic", "Hệ viền", "Limbic system", "side", LIMBIC, [CEREBRAL_WHITE, DIENCEPHALON, BRAINSTEM],
    ["hệ viền", "limbic", "hồi đai", "cingulate", "hải mã", "hippocampus", "hạnh nhân", "amygdala", "vòm não", "fornix"]),
  // Id cũ (trước gồm cả hệ viền) — hệ viền nay là góc nhìn riêng.
  group("nervous-deep-brain", "Gian não và nhân nền", "Diencephalon and basal nuclei", "three-quarter", [DIENCEPHALON, BASAL_NUCLEI], [CEREBRAL_WHITE, BRAINSTEM],
    ["đồi thị", "thalamus", "vùng dưới đồi", "hypothalamus", "hạch nền", "basal ganglia"]),
  group("nervous-cerebrum", "Đại não: vỏ và chất trắng", "Cerebrum: cortex and white matter", "side", [CORTEX, CEREBRAL_WHITE], [CEREBELLUM, BRAINSTEM], ["hồi não", "gyrus", "thuỳ não", "lobe", "thể chai", "corpus callosum"]),
  group("nervous-thalamic-nuclei", "Các nhân đồi thị", "Thalamic nuclei", "three-quarter", THALAMIC_NUCLEI, [THALAMUS, GENICULATE, BRAINSTEM], ["nhân đồi thị", "thalamic nuclei", "pulvinar", "VPL", "nhân lưng giữa"], {
    partial: {
      vi: "Vị trí gần đúng: nhân vẽ trên não mẫu trung bình rồi căn về não của mô hình. Chưa đủ mọi nhân, trong đó thiếu các nhân đường giữa (kể cả nhân reuniens), nhân lưới và phần lớn các nhân trong mảnh tuỷ",
      en: "Approximate positions: drawn on an average template brain and registered to the model's brain. Not every nucleus is included; missing are, among others, the midline nuclei (including the reuniens), the reticular nucleus and most intralaminar nuclei",
    },
  }),
  // Vùng bất định của Allen KHÔNG nhập: mọi phép căn đều để 67–78% đỉnh lọt vào đồi thị đục (đo
  // 2026-10-19, registration-allen-hra.json) — trống hơn sai.
  group("nervous-subthalamic-nigral", "Chất đen và nhân dưới đồi thị", "Substantia nigra and subthalamic nucleus", "front", [SN_COMPACTA, SN_RETICULATA, A_SUBTHALAMIC_NUCLEUS], [THALAMUS, BRAINSTEM, BASAL_NUCLEI], ["chất đen", "substantia nigra", "nhân dưới đồi thị", "hạch nền", "basal ganglia"], {
    partial: {
      vi: "Vị trí gần đúng: vẽ trên não mẫu trung bình rồi căn về não của mô hình; nhân dưới đồi thị lấn một phần vào trung não do sai số căn chỉnh, thật ra nó nằm ở gian não, ngay trên chất đen; thiếu vùng bất định",
      en: "Approximate positions: drawn on an average template brain and registered to the model's brain; the subthalamic nucleus partly overlaps the midbrain because of registration error (it actually lies in the diencephalon, just above the substantia nigra); the zona incerta is missing",
    },
  }),
  group("nervous-hypothalamic-nuclei", "Các nhân vùng dưới đồi", "Hypothalamic nuclei", "side", HYPOTHALAMIC_NUCLEI, [HYPOTHALAMUS, MAMMILLARY, THALAMUS, OPTIC_CHIASM], ["nhân vùng dưới đồi", "hypothalamic nuclei", "nhân trên giao thoa thị", "nhân cạnh não thất"], {
    partial: {
      vi: "Vị trí gần đúng: nhân vẽ trên não mẫu trung bình rồi căn về não của mô hình. Chưa có một số nhân nhỏ: vùng trước thị bên, nhân trước thị đường giữa, các nhân kẽ vùng dưới đồi trước, nhân củ bên và nhân trên vú; thể vú hiện thành một khối, không tách nhân.",
      en: "Approximate positions: drawn on an average template brain and registered to the model's brain. Some smaller nuclei are not included: the lateral preoptic area, median preoptic nucleus, interstitial nuclei of the anterior hypothalamus, lateral tuberal nucleus and supramammillary nucleus; the mammillary body is shown as a single block, not divided into nuclei.",
    },
  }),
  group("nervous-cerebellar-nuclei", "Các nhân sâu tiểu não", "Deep cerebellar nuclei", "back", [A_CEREBELLAR_DEEP_NUCLEI], [CEREBELLUM, BRAINSTEM], ["nhân răng", "dentate nucleus", "nhân nút", "nhân cầu", "nhân mái", "nhân sâu tiểu não"], {
    partial: {
      vi: "Bốn nhân (răng, nút, cầu, mái) được vẽ gộp làm một khối; vị trí gần đúng: vẽ trên não mẫu trung bình rồi căn về não của mô hình",
      en: "The four nuclei (dentate, emboliform, globose, fastigial) are shown merged into a single mass; approximate positions: drawn on an average template brain and registered to the model's brain",
    },
  }),
  group("nervous-brainstem-cerebellum", "Thân não và tiểu não", "Brainstem and cerebellum", "side", [BRAINSTEM, CN_NUCLEI, RED_NUCLEUS, CEREBELLUM], [DIENCEPHALON, SPINAL_CORD, TENTORIUM], ["hành não", "cầu não", "trung não", "cerebellum"]),
  group("nervous-ventricles", "Hệ não thất", "Ventricular system", "three-quarter", [VENTRICLES], [CEREBRAL_WHITE, BRAINSTEM, CEREBELLUM], ["não thất", "ventricle", "dịch não tuỷ", "cerebrospinal fluid"]),
  group("nervous-cranial-nerves", "Dây thần kinh sọ", "Cranial nerves", "three-quarter", CRANIAL, [BRAINSTEM, SKULL], ["dây sọ", "cranial nerve"], {
    partial: {
      vi: "Trong các hạch của dây thần kinh sọ chỉ có hạch mi; thiếu các sợi khứu qua mảnh sàng",
      en: "Of the cranial nerve ganglia only the ciliary ganglion is shown; the olfactory nerve fibres through the cribriform plate are missing",
    },
  }),
  group("nervous-orbit", "Thần kinh ổ mắt", "Nerves of the orbit", [-0.8, 0.35, 0.5], [OPTIC, OCULOMOTOR, TROCHLEAR, OPHTHALMIC, ABDUCENS], [SKULL], ["ổ mắt", "orbit", "dây III", "dây IV", "V1", "dây VI"]),
  group("nervous-vagus", "Dây phế vị (X)", "Vagus nerve (X)", "anterolateral", [VAGUS], [HEART, NECK_THORAX_VISCERA, SKULL],
    ["phế vị", "vagus", "dây X", "cranial nerve X"]),
  {
    id: "nervous-phrenic",
    systemId: "nervous",
    kind: "group",
    name: { vi: "Dây thần kinh hoành", en: "Phrenic nerves" },
    direction: "front",
    missing: { vi: "Bộ dữ liệu chưa có dây thần kinh hoành", en: "The phrenic nerves are not in the dataset" },
    terms: ["thần kinh hoành", "phrenic"],
  },
  group("nervous-spinal-cord", "Tuỷ sống và rễ thần kinh", "Spinal cord and nerve roots", "back", [SPINAL_CORD, SPINAL_DURA, SPINAL_ROOTS, CAUDA_EQUINA], [SPINE], ["tuỷ sống", "spinal cord", "đuôi ngựa", "cauda equina", "rễ thần kinh"]),
  group("nervous-upper-limb", "Đám rối cánh tay và thần kinh chi trên", "Brachial plexus and nerves of the upper limb", "front", UPPER_LIMB, [UPPER_LIMB_BONES], ["đám rối cánh tay", "brachial plexus", "thần kinh giữa", "median nerve"]),
  // Có thần kinh thẹn (đáy chậu), chậu hạ vị/chậu bẹn (thành bụng) — không chỉ chi dưới.
  group("nervous-lower-limb", "Đám rối thắt lưng – cùng và thần kinh chi dưới", "Lumbosacral plexus branches and nerves of the lower limb", "front", LOWER_LIMB, [LOWER_LIMB_BONES], ["đám rối thắt lưng", "lumbosacral plexus", "thần kinh đùi", "femoral nerve"]),
  group("nervous-sciatic", "Thần kinh ngồi và các nhánh", "Sciatic nerve and its branches", "back", [SCIATIC, TIBIAL, FIBULAR, SURAL], [LOWER_LIMB_BONES],
    ["thần kinh ngồi", "thần kinh toạ", "sciatic nerve", "thần kinh chày", "tibial nerve", "thần kinh mác", "fibular nerve"]),
  // Id cũ (trước gồm cả thân giao cảm) — thân giao cảm nay ở "Thần kinh tự chủ".
  group("nervous-trunk", "Thần kinh gian sườn", "Intercostal nerves", "anterolateral", [INTERCOSTAL_NERVES], [RIBS], ["gian sườn", "intercostal"]),
  group("nervous-autonomic", "Thần kinh tự chủ: thân giao cảm và dây phế vị", "Autonomic nerves: sympathetic trunk and vagus nerve", "front", [SYMPATHETIC, VAGUS], [HEART, ABDOMINAL_VISCERA, SPINE],
    ["tự chủ", "thực vật", "autonomic", "giao cảm", "sympathetic", "đối giao cảm", "parasympathetic"], {
      partial: {
        vi: "Thiếu các hạch trước cột sống, các đám rối tự chủ ở ngực, bụng và chậu, và thần kinh tạng chậu (đối giao cảm cùng)",
        en: "The prevertebral ganglia, the autonomic plexuses of the thorax, abdomen and pelvis, and the pelvic splanchnic nerves (sacral parasympathetic) are missing",
      },
    }),

  structure("cerebral-cortex", "Các hồi và thuỳ đại não", "Cerebral gyri and lobes", "side", CORTEX, ["vỏ não", "cortex"]),
  structure("frontal-lobe", "Thuỳ trán", "Frontal lobe", "side", FRONTAL_LOBE, ["thuỳ trán", "frontal lobe"]),
  structure("precentral-gyrus", "Hồi trước trung tâm", "Precentral gyrus", "side", PRECENTRAL, ["vỏ vận động", "motor cortex"]),
  structure("superior-frontal-gyrus", "Hồi trán trên", "Superior frontal gyrus", "superior", SUPERIOR_FRONTAL),
  structure("middle-frontal-gyrus", "Hồi trán giữa", "Middle frontal gyrus", "side", MIDDLE_FRONTAL),
  structure("inferior-frontal-gyrus", "Hồi trán dưới", "Inferior frontal gyrus", "side", INFERIOR_FRONTAL, ["vùng Broca", "Broca"]),
  structure("orbital-gyri", "Các hồi ổ mắt", "Orbital gyri", [0, -1, 0.3], ORBITAL_GYRI),
  structure("parietal-lobe", "Thuỳ đỉnh", "Parietal lobe", "side", PARIETAL_LOBE, ["thuỳ đỉnh", "parietal lobe"]),
  structure("postcentral-gyrus", "Hồi sau trung tâm", "Postcentral gyrus", "side", POSTCENTRAL, ["vỏ cảm giác", "somatosensory cortex"]),
  structure("superior-parietal-lobule", "Tiểu thuỳ đỉnh trên", "Superior parietal lobule", "superior", SUPERIOR_PARIETAL),
  structure("inferior-parietal-lobule", "Tiểu thuỳ đỉnh dưới", "Inferior parietal lobule", "side", INFERIOR_PARIETAL),
  structure("supramarginal-gyrus", "Hồi trên viền", "Supramarginal gyrus", "side", SUPRAMARGINAL),
  structure("angular-gyrus", "Hồi góc", "Angular gyrus", "side", ANGULAR),
  structure("temporal-lobe", "Thuỳ thái dương", "Temporal lobe", "side", TEMPORAL_LOBE, ["thuỳ thái dương", "temporal lobe"]),
  structure("superior-temporal-gyrus", "Hồi thái dương trên", "Superior temporal gyrus", "side", SUPERIOR_TEMPORAL, ["vùng Wernicke", "Wernicke"]),
  structure("middle-temporal-gyrus", "Hồi thái dương giữa", "Middle temporal gyrus", "side", MIDDLE_TEMPORAL),
  structure("inferior-temporal-gyrus", "Hồi thái dương dưới", "Inferior temporal gyrus", "side", INFERIOR_TEMPORAL),
  structure("fusiform-gyrus", "Hồi hình thoi", "Fusiform gyrus", [0, -1, 0.3], FUSIFORM),
  structure("occipital-lobe", "Thuỳ chẩm", "Occipital lobe", "back", OCCIPITAL_LOBE, ["thuỳ chẩm", "occipital lobe", "vỏ thị giác"]),
  structure("insula", "Thuỳ đảo", "Insula", "side", INSULA, ["thuỳ đảo", "insula"]),
  structure("cerebral-white-matter", "Chất trắng, thể chai và các mép", "White matter, corpus callosum and commissures", "side", CEREBRAL_WHITE),
  structure("basal-nuclei", "Nhân đuôi, bèo sẫm và cầu nhạt", "Caudate nucleus, putamen and globus pallidus", "three-quarter", BASAL_NUCLEI, ["nhân nền", "basal nuclei", "nhân bèo", "lentiform nucleus"]),
  structure("hippocampus-amygdala", "Hải mã, thể hạnh nhân và vách", "Hippocampus, amygdala and septum", "three-quarter", HIPPOCAMPUS_AMYGDALA),
  structure("hippocampus", "Hải mã", "Hippocampus", "three-quarter", HIPPOCAMPUS, ["hippocampus"]),
  structure("amygdala", "Thể hạnh nhân", "Amygdala", "three-quarter", AMYGDALA, ["amygdala", "hạnh nhân"]),
  structure("septum-telencephalon", "Vách trong suốt và vùng vách", "Septum pellucidum and septal area", "side", SEPTUM, ["vách", "septum", "vách đoan não"]),
  structure("limbic-gyri", "Hồi đai và hồi cạnh hải mã", "Cingulate and parahippocampal gyri", "three-quarter", LIMBIC_GYRI, ["hồi đai", "cingulate gyrus", "thuỳ viền", "limbic lobe"]),
  structure("fornix", "Vòm não", "Fornix", "three-quarter", FORNIX, ["fornix", "thể vòm", "thể tam giác"]),
  structure("diencephalon", "Gian não", "Diencephalon", "three-quarter", DIENCEPHALON, ["đồi thị", "thalamus", "vùng dưới đồi", "hypothalamus"]),
  structure("thalamus", "Đồi thị", "Thalamus", "three-quarter", THALAMUS, ["đồi thị", "thalamus"]),
  structure("geniculate-bodies", "Thể gối ngoài và thể gối trong", "Lateral and medial geniculate bodies", [-0.5, -0.3, -0.8], GENICULATE, ["thể gối", "geniculate"]),
  structure("hypothalamus", "Vùng dưới đồi (chưa gồm thể vú)", "Hypothalamus (excluding mammillary bodies)", "side", HYPOTHALAMUS, ["vùng dưới đồi", "hypothalamus"]),
  structure("mammillary-body", "Thể vú", "Mammillary body", "three-quarter", MAMMILLARY, ["mammillary body"]),
  structure("epithalamus", "Vùng trên đồi (chưa gồm tuyến tùng và mép sau)", "Epithalamus (excluding pineal gland and posterior commissure)", [0, 0.3, -1], EPITHALAMUS, ["củ cương", "habenula"]),
  structure("brainstem", "Thân não", "Brainstem", "side", BRAINSTEM),
  structure("midbrain", "Trung não", "Midbrain", "side", MIDBRAIN, ["trung não", "midbrain", "gò trên", "gò dưới"]),
  structure("pons", "Cầu não", "Pons", "side", PONS, ["cầu não", "pons"]),
  structure("medulla-oblongata", "Hành não", "Medulla oblongata", "front", MEDULLA, ["hành não", "medulla"]),
  structure("cerebellum", "Tiểu não", "Cerebellum", "side", CEREBELLUM),
  // Nhân sâu (Allen), từng nhân hai bên. KHÔNG có cấu trúc gộp "các nhân đồi thị": nó nuốt 11 nhân
  // (bảng chỉ còn một hàng) — bảng của góc nhìn liệt kê thẳng từng nhân.
  { ...structure("anterior-thalamic-nuclei", "Phức hợp nhân trước đồi thị", "Anterior nuclear complex of thalamus", "three-quarter", A_ANTERIOR_THALAMIC_NUCLEI), context: [THALAMUS] },
  { ...structure("lateral-dorsal-nucleus", "Nhân lưng bên đồi thị", "Lateral dorsal nucleus of thalamus", "three-quarter", A_LATERAL_DORSAL_NUCLEUS), context: [THALAMUS] },
  { ...structure("mediodorsal-nucleus", "Nhân lưng giữa đồi thị", "Mediodorsal nucleus of thalamus", "three-quarter", A_MEDIODORSAL_NUCLEUS), context: [THALAMUS] },
  { ...structure("lateral-posterior-nucleus", "Nhân sau bên đồi thị", "Lateral posterior nucleus of thalamus", "three-quarter", A_LATERAL_POSTERIOR_NUCLEUS), context: [THALAMUS] },
  { ...structure("pulvinar", "Gối sau đồi thị (pulvinar)", "Pulvinar of thalamus", "three-quarter", A_PULVINAR), context: [THALAMUS] },
  { ...structure("ventral-anterior-nucleus", "Nhân bụng trước đồi thị", "Ventral anterior nucleus of thalamus", "three-quarter", A_VENTRAL_ANTERIOR_NUCLEUS), context: [THALAMUS] },
  { ...structure("ventral-lateral-nucleus", "Nhân bụng bên đồi thị", "Ventral lateral nucleus of thalamus", "three-quarter", A_VENTRAL_LATERAL_NUCLEUS), context: [THALAMUS] },
  { ...structure("ventral-posterior-lateral-nucleus", "Nhân bụng sau bên đồi thị", "Ventral posterior lateral nucleus of thalamus", "three-quarter", A_VENTRAL_POSTERIOR_LATERAL_NUCLEUS), context: [THALAMUS] },
  { ...structure("ventral-posterior-medial-nucleus", "Nhân bụng sau giữa đồi thị", "Ventral posterior medial nucleus of thalamus", "three-quarter", A_VENTRAL_POSTERIOR_MEDIAL_NUCLEUS), context: [THALAMUS] },
  { ...structure("centromedian-nucleus", "Nhân trung tâm giữa đồi thị", "Centromedian nucleus of thalamus", "three-quarter", A_CENTROMEDIAN_NUCLEUS), context: [THALAMUS] },
  { ...structure("parafascicular-nucleus", "Nhân cạnh bó đồi thị", "Parafascicular nucleus of thalamus", "three-quarter", A_PARAFASCICULAR_NUCLEUS), context: [THALAMUS] },
  // Chất đen (CIT168): id `substantia-nigra` giữ nguyên cho deep link, nay gồm hai phần.
  { ...structure("substantia-nigra", "Chất đen", "Substantia nigra", "front", n(/^(left|right) pars (compacta|reticulata) of substantia nigra$/i), ["substantia nigra", "Parkinson"]), context: [BRAINSTEM] },
  { ...structure("substantia-nigra-compacta", "Phần đặc chất đen", "Substantia nigra, pars compacta", "superior", SN_COMPACTA, ["SNc", "pars compacta", "dopamine"]), context: [BRAINSTEM] },
  { ...structure("substantia-nigra-reticulata", "Phần lưới chất đen", "Substantia nigra, pars reticulata", "front", SN_RETICULATA, ["SNr", "pars reticulata"]), context: [BRAINSTEM, SN_COMPACTA] },
  // Nhân vùng dưới đồi (Neudorfer), từng nhân hai bên.
  { ...structure("medial-preoptic-nucleus", "Nhân trước thị giữa", "Medial preoptic nucleus", "side", H_MEDIAL_PREOPTIC_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("anterior-hypothalamic-area", "Vùng dưới đồi trước", "Anterior hypothalamic area", "side", H_ANTERIOR_HYPOTHALAMIC_AREA), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("suprachiasmatic-nucleus", "Nhân trên giao thoa thị", "Suprachiasmatic nucleus", "side", H_SUPRACHIASMATIC_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("supraoptic-nucleus", "Nhân trên thị", "Supraoptic nucleus", "side", H_SUPRAOPTIC_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("paraventricular-nucleus", "Nhân cạnh não thất vùng dưới đồi", "Paraventricular nucleus of hypothalamus", "side", H_PARAVENTRICULAR_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("periventricular-nucleus", "Nhân quanh não thất vùng dưới đồi", "Periventricular nucleus of hypothalamus", "side", H_PERIVENTRICULAR_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("dorsal-periventricular-nucleus", "Nhân quanh não thất lưng vùng dưới đồi", "Dorsal periventricular nucleus of hypothalamus", "side", H_DORSAL_PERIVENTRICULAR_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("ventromedial-nucleus", "Nhân bụng giữa vùng dưới đồi", "Ventromedial nucleus of hypothalamus", "side", H_VENTROMEDIAL_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("dorsomedial-nucleus", "Nhân lưng giữa vùng dưới đồi", "Dorsomedial nucleus of hypothalamus", "side", H_DORSOMEDIAL_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("arcuate-nucleus", "Nhân cung vùng dưới đồi", "Arcuate nucleus of hypothalamus", "side", H_ARCUATE_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("lateral-hypothalamic-area", "Vùng dưới đồi bên", "Lateral hypothalamic area", "side", H_LATERAL_HYPOTHALAMIC_AREA), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("posterior-hypothalamic-nucleus", "Nhân sau vùng dưới đồi", "Posterior nucleus of hypothalamus", "side", H_POSTERIOR_HYPOTHALAMIC_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("tuberomammillary-nucleus", "Nhân củ – vú", "Tuberomammillary nucleus", "side", H_TUBEROMAMMILLARY_NUCLEUS), context: [HYPOTHALAMUS, MAMMILLARY] },
  { ...structure("subthalamic-nucleus", "Nhân dưới đồi thị", "Subthalamic nucleus", "front", A_SUBTHALAMIC_NUCLEUS, ["subthalamic nucleus", "STN", "nhân Luys", "subthalamus"]), context: [THALAMUS, BRAINSTEM] },
  { ...structure("cerebellar-deep-nuclei", "Các nhân sâu tiểu não", "Deep cerebellar nuclei", "back", A_CEREBELLAR_DEEP_NUCLEI, ["nhân răng", "dentate nucleus", "nhân nút", "nhân cầu", "nhân mái", "nhân sâu tiểu não"]), context: [CEREBELLUM] },
  // Nhân nằm trong thân não: thân não mờ làm bối cảnh, không thì chỉ thấy các khối lơ lửng.
  { ...structure("cranial-nerve-nuclei", "Nhân các dây thần kinh sọ (chưa gồm nhân dây sinh ba)", "Cranial nerve nuclei (excluding trigeminal nuclei)", "back", CN_NUCLEI, ["nhân dây sọ", "cranial nerve nuclei", "Edinger–Westphal", "nhân mơ hồ"]), context: [BRAINSTEM] },
  { ...structure("red-nucleus", "Nhân đỏ", "Red nucleus", "three-quarter", RED_NUCLEUS, ["red nucleus"]), context: [BRAINSTEM] },
  structure("tentorium-cerebelli", "Lều tiểu não", "Tentorium cerebelli", "side", TENTORIUM),
  structure("falx-cerebri", "Liềm đại não", "Falx cerebri", "side", FALX, ["liềm não", "falx"]),
  structure("brain-ventricles", "Não thất, cống não và đám rối mạch mạc", "Ventricles, cerebral aqueduct and choroid plexus", "three-quarter", VENTRICLES),
  structure("lateral-ventricles", "Não thất bên và lỗ gian não thất", "Lateral ventricles and interventricular foramen", "three-quarter", LATERAL_VENTRICLES, ["não thất bên", "lateral ventricle"]),
  structure("third-ventricle", "Não thất ba", "Third ventricle", "side", THIRD_VENTRICLE),
  structure("cerebral-aqueduct", "Cống não", "Cerebral aqueduct", "side", AQUEDUCT, ["cống Sylvius"]),
  structure("fourth-ventricle", "Não thất bốn", "Fourth ventricle", "side", FOURTH_VENTRICLE),
  structure("choroid-plexus", "Đám rối mạch mạc não thất bên", "Choroid plexus of lateral ventricles", "three-quarter", CHOROID_PLEXUS, ["choroid plexus", "dịch não tuỷ"]),
  structure("optic-pathway", "Dây, giao thoa và dải thị giác (II)", "Optic nerve, chiasm and tract (II)", "superior", OPTIC),
  structure("oculomotor-nerve", "Dây vận nhãn (III)", "Oculomotor nerve (III)", [-0.8, 0.35, 0.5], OCULOMOTOR),
  // Đường cong Z-Anatomy dài ~51 mm dưới thuỳ trán — đi theo hành + dải khứu, không phải các sợi khứu
  // ngắn qua mảnh sàng; gọi đúng thứ đang vẽ (science-editor 2026-10-19).
  {
    ...structure("olfactory-nerve", "Đường khứu giác (I), nét sơ đồ", "Olfactory pathway (I), schematic line", [0, -0.6, 1], OLFACTORY, ["dây I", "dây khứu giác", "khứu giác", "hành khứu", "olfactory"]),
    partial: {
      vi: "Hành khứu và dải khứu chỉ vẽ bằng một nét; thiếu các sợi khứu qua mảnh sàng",
      en: "The olfactory bulb and tract are drawn only as a line; the olfactory nerve fibres through the cribriform plate are missing",
    },
  },
  structure("trochlear-nerve", "Dây ròng rọc (IV)", "Trochlear nerve (IV)", "superior", TROCHLEAR),
  structure("trigeminal-roots", "Thân và rễ dây sinh ba (V)", "Trigeminal nerve trunk and roots (V)", "side", TRIGEMINAL_ROOTS, ["dây V", "sinh ba", "trigeminal"]),
  structure("abducens-nerve", "Dây vận nhãn ngoài (VI)", "Abducens nerve (VI)", [-0.8, 0.35, 0.5], ABDUCENS, ["dây VI", "abducens"]),
  structure("ophthalmic-nerve", "Dây thần kinh mắt (V1) và hạch mi", "Ophthalmic nerve (V1) and ciliary ganglion", [-0.8, 0.35, 0.5], OPHTHALMIC),
  structure("maxillary-nerve", "Dây thần kinh hàm trên (V2)", "Maxillary nerve (V2)", "anterolateral", MAXILLARY),
  structure("mandibular-nerve", "Dây thần kinh hàm dưới (V3) và nhánh", "Mandibular nerve (V3) and branches", "anterolateral", MANDIBULAR),
  structure("facial-nerve", "Dây mặt (VII) và thừng nhĩ", "Facial nerve (VII) and chorda tympani", "side", FACIAL),
  structure("vestibulocochlear-nerve", "Dây tiền đình – ốc tai (VIII)", "Vestibulocochlear nerve (VIII)", "side", VESTIBULOCOCHLEAR),
  structure("glossopharyngeal-nerve", "Dây thiệt hầu (IX)", "Glossopharyngeal nerve (IX)", "side", GLOSSOPHARYNGEAL),
  structure("accessory-nerve", "Dây phụ (XI)", "Accessory nerve (XI)", "side", ACCESSORY),
  structure("hypoglossal-nerve", "Dây hạ thiệt (XII)", "Hypoglossal nerve (XII)", "side", HYPOGLOSSAL),
  structure("spinal-cord", "Tuỷ sống (chất xám, chất trắng)", "Spinal cord (grey and white matter)", "back", SPINAL_CORD),
  structure("spinal-dura", "Màng cứng tuỷ", "Spinal dura mater", "back", SPINAL_DURA),
  structure("spinal-roots", "Rễ và hạch gai", "Spinal roots and ganglia", "back", SPINAL_ROOTS),
  structure("cauda-equina", "Chùm đuôi ngựa", "Cauda equina", "back", CAUDA_EQUINA),
  structure("brachial-plexus", "Đám rối cánh tay (rễ, thân, ngành, bó)", "Brachial plexus (roots, trunks, divisions, cords)", "front", BRACHIAL_PLEXUS),
  structure("brachial-plexus-collaterals", "Nhánh bên của đám rối cánh tay", "Collateral branches of the brachial plexus", "front", PLEXUS_COLLATERAL),
  structure("musculocutaneous-nerve", "Thần kinh cơ bì", "Musculocutaneous nerve", "front", MUSCULOCUTANEOUS),
  structure("axillary-nerve", "Thần kinh nách", "Axillary nerve", "back", AXILLARY_NERVE),
  structure("median-nerve", "Thần kinh giữa", "Median nerve", "front", MEDIAN),
  structure("ulnar-nerve", "Thần kinh trụ", "Ulnar nerve", "front", ULNAR),
  structure("radial-nerve", "Thần kinh quay", "Radial nerve", "back", RADIAL),
  structure("medial-cutaneous-nerves-arm", "Thần kinh bì cánh tay trong và bì cẳng tay trong", "Medial brachial and antebrachial cutaneous nerves", "front", MEDIAL_CUTANEOUS),
  structure("lumbar-plexus-branches", "Thần kinh chậu hạ vị, chậu bẹn, sinh dục đùi và bì đùi ngoài", "Iliohypogastric, ilio-inguinal, genitofemoral and lateral femoral cutaneous nerves", "front", LUMBAR_PLEXUS_OTHER),
  structure("femoral-nerve", "Thần kinh đùi và thần kinh hiển", "Femoral and saphenous nerves", "front", FEMORAL),
  structure("obturator-nerve", "Thần kinh bịt", "Obturator nerve", "front", OBTURATOR),
  structure("sacral-plexus-branches", "Thần kinh mông, thẹn, bì đùi sau và các nhánh cơ", "Gluteal, pudendal, posterior femoral cutaneous and muscular branches", "back", SACRAL_PLEXUS_OTHER),
  structure("sciatic-nerve", "Thần kinh ngồi", "Sciatic nerve", "back", SCIATIC),
  structure("tibial-nerve", "Thần kinh chày và thần kinh gan chân", "Tibial and plantar nerves", "back", TIBIAL),
  structure("fibular-nerves", "Thần kinh mác chung, nông và sâu", "Common, superficial and deep fibular nerves", "front", FIBULAR),
  structure("sural-nerve", "Thần kinh bắp chân", "Sural nerve", "back", SURAL),
  structure("sympathetic-trunk", "Thân và các dây giao cảm", "Sympathetic trunk and nerves", "anterolateral", SYMPATHETIC),
];
