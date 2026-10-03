import type { AtlasViewDef, PartRule } from "./views";

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
 */

const n = (name: RegExp, exclude?: RegExp): PartRule => ({ systems: ["nervous"], name, ...(exclude ? { exclude } : {}) });

// ------------------------------------------------------------------ não
const CORTEX = n(/gyrus$|lobule$|occipital lobe$|^(left|right) insula$/i);
const CEREBRAL_WHITE = n(
  /white matter of (left|right) cerebral hemisphere$|corpus callosum$|internal capsule$|(anterior|posterior) commissure$|fornix of forebrain$|stria terminalis$|lamina terminalis$/i,
);
const BASAL_NUCLEI = n(/caudate nucleus$|putamen$|globus pallidus$/i);
// Vách gian bán cầu (FMA61842) gồm cả vùng vách — chất xám, hệ viền — không để ở chất trắng.
const HIPPOCAMPUS_AMYGDALA = n(/hippocampus$|amygdala$|^septum of telencephalon$/i);
const DIENCEPHALON = n(
  /thalamus$|hypothalamus$|habenula$|mammillary body$|tuber cinereum$|geniculate body$|stria medullaris of thalamus$/i,
);
const BRAINSTEM = n(/^midbrain$|peduncle of midbrain$|colliculus$|brachium of (superior|inferior) colliculus$|^pons$|^medulla oblongata$|^interpeduncular fossa$/i);
const CEREBELLUM = n(/^cerebellum$/i);
const TENTORIUM = n(/^tentorium cerebelli$/i);
const VENTRICLES = n(/ventricle$|^cerebral aqueduct$|interventricular foramen$|choroid plexus of ((left|right) )?cerebral hemisphere$/i);
// Lều tiểu não là màng cứng, không phải mô não — bối cảnh, không nổi bật.
const BRAIN = [CORTEX, CEREBRAL_WHITE, BASAL_NUCLEI, HIPPOCAMPUS_AMYGDALA, DIENCEPHALON, BRAINSTEM, CEREBELLUM, VENTRICLES];

// ------------------------------------------------------------------ dây sọ
const OPTIC = n(/optic (nerve|chiasm|tract)$/i);
const OCULOMOTOR = n(/branch of (left|right) oculomotor nerve$/i);
const TROCHLEAR = n(/trochlear nerve$/i, /(supra|infra)trochlear/i);
/** V1 và nhánh trong ổ mắt, cả hạch mi (hạch đối giao cảm treo trên nhánh mũi mi). */
const OPHTHALMIC = n(
  /ophthalmic nerve$|frontal nerve$|supra-orbital nerve$|supratrochlear nerve$|lacrimal nerve$|nasociliary nerve$|ethmoidal nerve$|infratrochlear nerve$|ciliary nerve$|ciliary ganglion$|nasociliary nerve with (left|right) ciliary ganglion$/i,
);
const MAXILLARY = n(/maxillary nerve$/i);
const MANDIBULAR = n(/division of mandibular nerve$|buccal nerve$|lingual nerve$|inferior alveolar nerve$|mental nerve$|nerve to mylohyoid muscle$/i);
const FACIAL = n(/facial nerve \(vii\)$|chorda tympani$/i);
const VESTIBULOCOCHLEAR = n(/vestibulocochlear nerve \(viii\)$|cochlear nerve$|vestibular nerve$/i);
const GLOSSOPHARYNGEAL = n(/glossopharyngeal nerve \(ix\)$/i);
const VAGUS = n(/^(left|right) vagus nerve \(x\)$/i);
const ACCESSORY = n(/accessory nerve \(xi\)$/i);
const HYPOGLOSSAL = n(/hypoglossal nerve \(xii\)$/i);
const CRANIAL = [OPTIC, OCULOMOTOR, TROCHLEAR, OPHTHALMIC, MAXILLARY, MANDIBULAR, FACIAL, VESTIBULOCOCHLEAR, GLOSSOPHARYNGEAL, VAGUS, ACCESSORY, HYPOGLOSSAL];

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
const INTERCOSTAL = n(/^(left|right) intercostal nerves$/i);
const SYMPATHETIC = n(/sympathetic (trunk|nerves)$/i);

// Bối cảnh.
const SKULL: PartRule = { systems: ["skeletal"], name: /skull|cranium|frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|ethmoid$/i };
const SPINE: PartRule = { systems: ["skeletal"], name: /vertebra$|^atlas$|^axis$|^sacrum$|coccyx/i };
const UPPER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(humerus|scapula|clavicle|radius|ulna)$/i };
const LOWER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(femur|tibia|fibula|patella|hip bone)$|^sacrum$/i };
const RIBS: PartRule = { systems: ["skeletal"], name: /\brib\b|thoracic vertebra$/i };

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
      vi: "Thiếu dây thần kinh khứu giác (I), vận nhãn ngoài (VI), rễ và hạch dây sinh ba, dây hoành và đám rối cổ",
      en: "The olfactory (I) and abducens (VI) nerves, trigeminal roots and ganglion, phrenic nerves and cervical plexus are missing",
    },
    terms: ["thần kinh", "nervous system", "não", "brain", "tuỷ sống", "spinal cord"],
    quality: "acceptable",
  },
  group("nervous-brain", "Não", "Brain", "side", BRAIN, [SKULL, TENTORIUM], ["brain", "đại não", "cerebrum"]),
  group("nervous-cerebrum", "Đại não: vỏ và chất trắng", "Cerebrum: cortex and white matter", "side", [CORTEX, CEREBRAL_WHITE], [CEREBELLUM, BRAINSTEM], ["hồi não", "gyrus", "thuỳ não", "lobe", "thể chai", "corpus callosum"]),
  group("nervous-deep-brain", "Nhân nền, gian não và hệ viền", "Basal nuclei, diencephalon and limbic structures", "three-quarter", [BASAL_NUCLEI, HIPPOCAMPUS_AMYGDALA, DIENCEPHALON], [CEREBRAL_WHITE, BRAINSTEM], ["đồi thị", "thalamus", "hải mã", "hippocampus", "hạch nền", "basal ganglia"]),
  group("nervous-brainstem-cerebellum", "Thân não và tiểu não", "Brainstem and cerebellum", "side", [BRAINSTEM, CEREBELLUM], [DIENCEPHALON, SPINAL_CORD, TENTORIUM], ["hành não", "cầu não", "trung não", "cerebellum"]),
  group("nervous-ventricles", "Hệ não thất", "Ventricular system", "three-quarter", [VENTRICLES], [CEREBRAL_WHITE, BRAINSTEM, CEREBELLUM], ["não thất", "ventricle", "dịch não tuỷ", "cerebrospinal fluid"]),
  group("nervous-cranial-nerves", "Dây thần kinh sọ", "Cranial nerves", "three-quarter", CRANIAL, [BRAINSTEM, SKULL], ["dây sọ", "cranial nerve"], {
    partial: {
      vi: "Thiếu dây khứu giác (I), dây vận nhãn ngoài (VI), rễ và hạch dây sinh ba",
      en: "The olfactory (I) and abducens (VI) nerves and the trigeminal roots and ganglion are missing",
    },
  }),
  group("nervous-orbit", "Thần kinh ổ mắt", "Nerves of the orbit", [-0.8, 0.35, 0.5], [OPTIC, OCULOMOTOR, TROCHLEAR, OPHTHALMIC], [SKULL], ["ổ mắt", "orbit", "dây III", "dây IV", "V1"]),
  group("nervous-spinal-cord", "Tuỷ sống và rễ thần kinh", "Spinal cord and nerve roots", "back", [SPINAL_CORD, SPINAL_DURA, SPINAL_ROOTS, CAUDA_EQUINA], [SPINE], ["tuỷ sống", "spinal cord", "đuôi ngựa", "cauda equina", "rễ thần kinh"]),
  group("nervous-upper-limb", "Đám rối cánh tay và thần kinh chi trên", "Brachial plexus and nerves of the upper limb", "front", UPPER_LIMB, [UPPER_LIMB_BONES], ["đám rối cánh tay", "brachial plexus", "thần kinh giữa", "median nerve"]),
  // Có thần kinh thẹn (đáy chậu), chậu hạ vị/chậu bẹn (thành bụng) — không chỉ chi dưới.
  group("nervous-lower-limb", "Đám rối thắt lưng – cùng và thần kinh chi dưới", "Lumbosacral plexus branches and nerves of the lower limb", "front", LOWER_LIMB, [LOWER_LIMB_BONES], ["thần kinh ngồi", "sciatic nerve", "thần kinh đùi", "femoral nerve"]),
  group("nervous-trunk", "Thần kinh gian sườn và thân giao cảm", "Intercostal nerves and sympathetic trunk", "anterolateral", [INTERCOSTAL, SYMPATHETIC], [RIBS], ["giao cảm", "sympathetic", "gian sườn", "intercostal"]),

  structure("cerebral-cortex", "Các hồi và thuỳ đại não", "Cerebral gyri and lobes", "side", CORTEX, ["vỏ não", "cortex"]),
  structure("cerebral-white-matter", "Chất trắng, thể chai và các mép", "White matter, corpus callosum and commissures", "side", CEREBRAL_WHITE),
  structure("basal-nuclei", "Nhân đuôi, bèo sẫm và cầu nhạt", "Caudate nucleus, putamen and globus pallidus", "three-quarter", BASAL_NUCLEI, ["nhân nền", "basal nuclei", "nhân bèo", "lentiform nucleus"]),
  structure("hippocampus-amygdala", "Hồi hải mã, thể hạnh nhân và vách", "Hippocampus, amygdala and septum", "three-quarter", HIPPOCAMPUS_AMYGDALA),
  structure("diencephalon", "Gian não", "Diencephalon", "three-quarter", DIENCEPHALON, ["đồi thị", "thalamus", "vùng dưới đồi", "hypothalamus"]),
  structure("brainstem", "Thân não", "Brainstem", "side", BRAINSTEM),
  structure("cerebellum", "Tiểu não", "Cerebellum", "side", CEREBELLUM),
  structure("tentorium-cerebelli", "Lều tiểu não", "Tentorium cerebelli", "side", TENTORIUM),
  structure("brain-ventricles", "Não thất, cống não và đám rối mạch mạc", "Ventricles, cerebral aqueduct and choroid plexus", "three-quarter", VENTRICLES),
  structure("optic-pathway", "Dây, giao thoa và dải thị giác (II)", "Optic nerve, chiasm and tract (II)", "superior", OPTIC),
  structure("oculomotor-nerve", "Dây vận nhãn (III)", "Oculomotor nerve (III)", [-0.8, 0.35, 0.5], OCULOMOTOR),
  structure("trochlear-nerve", "Dây ròng rọc (IV)", "Trochlear nerve (IV)", "superior", TROCHLEAR),
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
