import type { AtlasViewDef, PartRule } from "./views";
import { CAROTID_VERTEBRAL, CEREBRAL } from "./views-arterial";
import { INTERCOSTAL_NERVES, VAGUS } from "./views-respiratory";
import { DURAL_SINUSES } from "./views-venous";

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
// Loại tiểu thuỳ TIỂU NÃO (Z-Anatomy, tên cũng tận cùng "lobule").
const CORTEX = n(/gyrus$|lobule$|occipital lobe$|^(left|right) insula$/i, /quadrangular|semilunar|gracile lobule|biventral|central lobule/i);
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
/*
 * Tiểu não = tiểu thuỳ Z-Anatomy (2026-10-19), THAY hai nửa tiểu não BodyParts3D (manifest `replaces`).
 * Mỗi tiểu thuỳ là KHỐI ĐẶC (đo: lấp 81% lòng tiểu não BP3D, phần hụt là khe sát mặt; 15% thể tích hai
 * tiểu thuỳ chồng nhau) — không tách vỏ / chất trắng, nên nhân sâu Allen nằm "trong" tiểu thuỳ như từng
 * nằm trong khối BP3D. Chia ba thuỳ → tiểu thuỳ; thuỳ nhộng / bán cầu là nhóm = hợp tiểu thuỳ.
 */
const CB_CEREBELLAR_LINGULA = n(/^lingula of cerebellum$/i);
const CB_CEREBELLAR_CENTRAL_LOBULE = n(/^central lobule$/i);
const CB_CEREBELLAR_CENTRAL_LOBULE_WING = n(/^(left |right )?wing of central lobule$/i);
const CB_CEREBELLAR_CULMEN = n(/^culmen$/i);
const CB_ANTERIOR_QUADRANGULAR_LOBULE = n(/^(left |right )?anterior quadrangular lobule$/i);
const CB_CEREBELLAR_DECLIVE = n(/^declive$/i);
const CB_POSTERIOR_QUADRANGULAR_LOBULE = n(/^(left |right )?posterior quadrangular lobule$/i);
const CB_CEREBELLAR_FOLIUM = n(/^folium of vermis$/i);
const CB_SUPERIOR_SEMILUNAR_LOBULE = n(/^(left |right )?superior semilunar lobule$/i);
const CB_CEREBELLAR_TUBER = n(/^tuber of vermis$/i);
const CB_INFERIOR_SEMILUNAR_LOBULE = n(/^(left |right )?inferior semilunar lobule$/i);
const CB_GRACILE_LOBULE = n(/^(left |right )?gracile lobule$/i);
const CB_CEREBELLAR_PYRAMIS = n(/^pyramis of vermis$/i);
const CB_BIVENTRAL_LOBULE = n(/^(left |right )?biventral lobule$/i);
const CB_CEREBELLAR_UVULA = n(/^uvula of vermis$/i);
const CB_CEREBELLAR_TONSIL = n(/^(left |right )?tonsil of cerebellum$/i);
const CB_CEREBELLAR_NODULE = n(/^nodule of vermis$/i);
const CB_FLOCCULUS = n(/^(left |right )?(flocculus|peduncle of flocculus)$/i);
const CB_ANTERIOR_LOBE = [CB_CEREBELLAR_LINGULA, CB_CEREBELLAR_CENTRAL_LOBULE, CB_CEREBELLAR_CENTRAL_LOBULE_WING, CB_CEREBELLAR_CULMEN, CB_ANTERIOR_QUADRANGULAR_LOBULE];
const CB_POSTERIOR_LOBE = [CB_CEREBELLAR_DECLIVE, CB_POSTERIOR_QUADRANGULAR_LOBULE, CB_CEREBELLAR_FOLIUM, CB_SUPERIOR_SEMILUNAR_LOBULE, CB_CEREBELLAR_TUBER, CB_INFERIOR_SEMILUNAR_LOBULE, CB_GRACILE_LOBULE, CB_CEREBELLAR_PYRAMIS, CB_BIVENTRAL_LOBULE, CB_CEREBELLAR_UVULA, CB_CEREBELLAR_TONSIL];
const CB_FLOCCULONODULAR = [CB_CEREBELLAR_NODULE, CB_FLOCCULUS];
const CEREBELLUM = n(/^(lingula of cerebellum|central lobule|(left |right )?wing of central lobule|culmen|(left |right )?anterior quadrangular lobule|declive|(left |right )?posterior quadrangular lobule|folium of vermis|(left |right )?superior semilunar lobule|tuber of vermis|(left |right )?inferior semilunar lobule|(left |right )?gracile lobule|pyramis of vermis|(left |right )?biventral lobule|uvula of vermis|(left |right )?tonsil of cerebellum|nodule of vermis|(left |right )?(flocculus|peduncle of flocculus))$/i);
const PYRAMID_OLIVE = n(/pyramid of medulla oblongata$|^(left |right )?olive$/i);
const SUPERIOR_CEREBELLAR_PEDUNCLE = n(/superior cerebellar peduncle$/i);
const TENTORIUM = n(/^tentorium cerebelli$/i);
// Z-Anatomy (mốc M2, 2026-10-19): liềm đại não; nhân dây sọ và nhân đỏ nằm TRONG
// mảnh thân não BodyParts3D — cấu trúc riêng, không lồng vào `brainstem`.
const FALX = n(/^falx cerebri$/i);
/*
 * Nhân dây sọ chia ba cột theo chức năng, phủ kín CN_NUCLEI. Nhân đối giao cảm (Edinger–Westphal,
 * nước bọt trên/dưới, lưng dây X) là nhân nguồn của phân hệ đối giao cảm phần sọ.
 */
const CN_MOTOR_NUCLEI = n(/^(left |right )?nucleus of (oculomotor|trochlear|abducens|hypoglossal|accessory) nerve$|motor nucleus of facial nerve$|nucleus ambiguus$/i);
const CN_PARASYMPATHETIC_NUCLEI = n(/accessory nucleus of oculomotor nerve$|salivatory nucleus$|posterior nucleus of vagus nerve$/i);
const CN_SENSORY_NUCLEI = n(/nucleus of solitary tract$|vestibular nuclei$|cochlear nucleus$/i);
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
/** Z-Anatomy: hồi Heschl + mặt phẳng thái dương, nằm trong rãnh bên, dưới mảnh hồi thái dương trên BodyParts3D. */
const TRANSVERSE_TEMPORAL = n(/transverse temporal gyri$|temporal plane$/i);
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
// V1 chia con phủ kín OPHTHALMIC. Hạch mi + thần kinh mi ngắn: chặng hậu hạch đối giao cảm của dây III.
const OPHTHALMIC_TRUNK = n(/^(left |right )?ophthalmic nerve$/i);
const FRONTAL_NERVE = n(/frontal nerve$|supra-orbital nerve$|supratrochlear nerve$/i);
const LACRIMAL_NERVE = n(/lacrimal nerve$/i);
const NASOCILIARY = n(/^(left |right )?nasociliary nerve$|nasociliary nerve with (left|right) ciliary ganglion$|ethmoidal nerve$|infratrochlear nerve$|long ciliary nerve$/i);
const CILIARY_GANGLION = n(/ciliary ganglion$|short ciliary nerve$/i, /nasociliary/i);
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
const SPINAL_CORD = n(/horn of spinal cord$|white matter of spinal cord$|^central canal( of spinal cord)?$|^lateral intermediate substance$/i);
/** Chất xám (sừng + chất trung gian) + ống trung tâm — bối cảnh cho bó tuỷ; KHÔNG gồm chất trắng (lưới đặc, mặt ngoài trùng bó). */
const SPINAL_GREY = n(/horn of spinal cord$|^central canal( of spinal cord)?$|^lateral intermediate substance$/i);
const TRACTS_ASCENDING = n(/^((anterior|lateral) spinothalamic tract|(anterior|posterior) spinocerebellar tract|(gracile|cuneate) fasciculus|spinotectal tract)$/i);
const TRACTS_DESCENDING = n(/^((anterior|lateral) corticospinal|rubrospinal|tectospinal|(lateral|medial) vestibulospinal|(lateral|medial) reticulospinal) tract$/i);
const FASCICULI_PROPRII = n(/^((anterior|lateral|posterior) fasciculus proprius|posterolateral tract)$/i);
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

/*
 * Tách đám rối và từng dây thành cấu trúc con phủ KÍN cha (test lồng nhau): mở dây giữa ra đúng
 * các nhánh, không có hàng "Phần còn lại". Z-Anatomy chỉ có bó SAU riêng — bó ngoài/trong nằm
 * trong lưới dây giữa/trụ (ngành trước dừng ở z 1,40 m, đúng chỗ hai dây ấy bắt đầu) — nên cấu
 * trúc mang tên bó sau, không gọi chung "các bó". Nhánh cơ và gian cốt trước của dây giữa nằm ở
 * cẳng tay (đo hộp bao), nên không gom chung với nhánh ở bàn tay.
 * Thân (`trunk`) phải neo đầu: "anterior division of superior trunk of brachial plexus" cũng kết
 * thúc bằng "trunk of brachial plexus".
 */
const BP_ROOTS = n(/roots of brachial plexus$/i);
const BP_TRUNKS = n(/^(left |right )?(superior|middle|inferior) trunk of brachial plexus$/i);
const BP_DIVISIONS = n(/(anterior|posterior) division of (superior|middle|inferior) trunk of brachial plexus$/i);
const BP_POSTERIOR_CORD = n(/posterior cord of brachial plexus$/i);
const MEDIAN_TRUNK = n(/^(left |right )?median nerve$/i);
const MEDIAN_AIN = n(/anterior interosseous nerve of forearm$/i);
const MEDIAN_MUSCULAR = n(/muscular branches of median nerve$/i);
const MEDIAN_PALMAR = n(/palmar branch of median nerve$/i);
const MEDIAN_DIGITAL = n(/(common|proper) palmar digital branches of median nerve$/i);
const MEDIAN_COMMUNICATING = n(/communicating branch of median nerve with ulnar nerve$/i);
const ULNAR_TRUNK = n(/^(left |right )?ulnar nerve$/i);
const ULNAR_MUSCULAR = n(/muscular branches of ulnar nerve$/i);
const ULNAR_PALMAR = n(/palmar branch of ulnar nerve$/i);
const ULNAR_DORSAL = n(/dorsal branch of ulnar nerve$/i);
const ULNAR_SUPERFICIAL = n(/superficial branch of ulnar nerve$/i);
const ULNAR_DEEP = n(/deep branch of ulnar nerve$/i);
const ULNAR_PALMAR_DIGITAL = n(/(common|proper) palmar digital branches of ulnar nerve$/i);
const ULNAR_DORSAL_DIGITAL = n(/dorsal digital branches of ulnar nerve$/i);
const RADIAL_TRUNK = n(/^(left |right )?radial nerve$/i);
const RADIAL_MUSCULAR = n(/muscular branches of radial nerve$/i);
const RADIAL_CUTANEOUS = n(/posterior antebrachial cutaneous nerve$|inferior lateral brachial cutaneous nerve$/i);
const RADIAL_SUPERFICIAL = n(/superficial branch of radial nerve$/i);
const RADIAL_DEEP = n(/deep branch of radial nerve$/i);
const RADIAL_PIN = n(/posterior interosseous nerve of forearm$/i);
const RADIAL_DORSAL_DIGITAL = n(/dorsal digital branches of radial nerve$/i);

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
const TIBIAL_TRUNK = n(/^(left |right )?tibial nerve$/i);
/** Gồm nhánh gan ngón chung/riêng (tên kết thúc bằng "… plantar nerve"); một mảnh không ghi bên. */
const PLANTAR = n(/plantar nerve$/i);
const MEDIAL_PLANTAR = n(/medial plantar nerve$/i);
const LATERAL_PLANTAR = n(/lateral plantar nerve$/i);

// ------------------------------------------------------------------ thân mình
const SYMPATHETIC = n(/sympathetic (trunk|nerves)$/i);
/*
 * Z-Anatomy: thân giao cảm chạy từ cổ tới ngang đốt ngực XII (đo hộp bao: đáy y 1,140, T12 1,128–1,180) —
 * thiếu đoạn thắt lưng, đoạn cùng. Đỉnh 1,511 nằm trong đốt cổ III (1,495–1,524) → "đoạn cổ – ngực" đúng. "Sympathetic nerves" toả ra SAU tới ngang lỗ gian đốt (z −0,093),
 * nên là nhánh nối với dây sống, không phải dây tạng — tên giữ đúng nhãn nguồn, không gọi "dây tạng".
 */
const SYMPATHETIC_CHAIN = n(/^(left |right )?sympathetic trunk$/i);
const SYMPATHETIC_GANGLIA = n(/ganglia of sympathetic trunk$/i);
const SYMPATHETIC_NERVES = n(/sympathetic nerves$/i);

// Bối cảnh.
const SKULL: PartRule = { systems: ["skeletal"], name: /skull|cranium|frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|ethmoid$/i };
const SPINE: PartRule = { systems: ["skeletal"], name: /vertebra$|^atlas$|^axis$|^sacrum$|coccyx/i };
const UPPER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(humerus|scapula|clavicle|radius|ulna)$/i };
const LOWER_LIMB_BONES: PartRule = { systems: ["skeletal"], name: /(femur|tibia|fibula|patella|hip bone)$|^sacrum$/i };
const RIBS: PartRule = { systems: ["skeletal"], name: /\brib\b|thoracic vertebra$/i };
const LUMBAR_SACRAL_SPINE: PartRule = { systems: ["skeletal"], name: /lumbar vertebra$|^sacrum$/i };
const HIP_BONE: PartRule = { systems: ["skeletal"], name: /hip bone$/i };
/** Đám rối thắt lưng nằm trong cơ thắt lưng lớn, đám rối cùng trên mặt trước cơ hình lê. */
const PSOAS: PartRule = { systems: ["muscular"], name: /psoas major$/i };
const PIRIFORMIS: PartRule = { systems: ["muscular"], name: /piriformis$/i };
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

/*
 * ## Đoạn tuỷ: lát ngang theo mốc đốt sống (2026-10-20)
 *
 * Lưới tuỷ Z-Anatomy là MỘT khối liền, không chia đoạn → mỗi đoạn là một lát
 * (`band`) của cùng khối ấy. Ranh giới = vị trí TRUNG BÌNH ở người lớn, tính từ
 * Frostell et al. 2016 (Front Neurol 7:238, Bảng 3 + 4, hệ số căn 100/77,3): cuối
 * đoạn C8 ở 0,48 đoạn đốt C7, cuối T12 ở 0,22 đoạn đốt T11, cuối L5 ở 0,08 đoạn
 * đốt L1 — "đoạn đốt" = đốt + nửa hai đĩa kề, nên mốc là TÂM hai đĩa. Canbay et al.
 * 2014 (Clin Anat 27:227, 16 tử thi) khớp: đoạn thắt lưng bắt đầu ⅓ trên thân
 * T11, đoạn cùng ⅓ trên thân L1.
 *
 * KHÔNG suy ranh giới từ rễ Z-Anatomy: 21 rễ là sơ đồ, nằm gần ngang ngay ở lỗ
 * gian đốt (đầu trong cao gần bằng đầu ngoài), tức là theo ĐỐT SỐNG — chính thứ
 * mà đoạn tuỷ lệch khỏi. Vì thế lát cũng không hiện rễ.
 *
 * "Disk of <đốt>" của BodyParts3D là đĩa DƯỚI đốt đó; đĩa T12–L1 không mang tên
 * (khớp đúng một mảnh — bộ sinh dừng nếu khớp nhiều hơn).
 *
 * Ranh giới tính theo chiều dài tuỷ THẬT (hết ở cuối đoạn đốt L1); lưới dài tới
 * đầu L3, nên phần lưới dưới S5 là phần dư của mô hình — lát cùng nói rõ. Chỗ
 * phình rộng nhất của lưới (ngang T9–T11) rơi phần lớn vào lát ngực: sai hình
 * dạng của lưới, không phải lỗi ranh giới. Các hệ số 0,48/0,22/0,08 là trung
 * bình suy từ một bài tổng quan — chỉ dùng trong code, không hiện ra giao diện.
 * Tên, câu báo thiếu, cách suy: science-editor (REWORK tên → "đoạn …", rồi PASS).
 */
const disc = (vertebra: string) => new RegExp(`^intervertebral disk of ${vertebra} vertebra$`, "i");
// Đỉnh lưới tuỷ, không để trống: ống trung tâm của BodyParts3D chạy tiếp lên trong hành não.
const CORD_TOP = { edge: "top", of: /^white matter of spinal cord$/i } as const;
const C8_T1 = { from: disc("sixth cervical"), to: disc("seventh cervical"), at: 0.48 };
const T12_L1 = { from: disc("tenth thoracic"), to: disc("eleventh thoracic"), at: 0.22 };
const L5_S1 = { from: /^intervertebral disk$/i, to: disc("first lumbar"), at: 0.08 };
const SEGMENT_PARTIAL = {
  vi: "Ranh giới giữa các đoạn là vị trí trung bình ở người lớn (theo tổng hợp của Frostell và cộng sự, 2016); ở từng người có thể lệch một đốt sống hoặc hơn. Lưới tuỷ là mô hình sơ đồ: không có phình cổ, tuỷ dày hơn thực tế (rõ nhất ở đoạn ngực), và chóp nón tuỷ nằm ngang bờ trên đốt L3, trong khi ở người lớn thường ngang L1–L2. Không hiện rễ thần kinh.",
  en: "Segment boundaries are adult averages (as compiled by Frostell et al. 2016); in an individual they can sit one vertebra or more higher or lower. The cord mesh is schematic: it has no cervical enlargement, it is thicker than a real cord (most of all in the thoracic region), and its conus tip lies at the top of L3, whereas in adults the cord usually ends at L1–L2. Nerve roots are not shown.",
};
// Không ghép câu chung: vế chóp nón ở đó lặp câu đầu (science-editor PASS bản khử lặp).
const SACRAL_PARTIAL = {
  vi: "Ở mô hình này, đoạn cùng và nón tuỷ trải từ ngang đốt L1 xuống tới ngang bờ trên đốt L3, dài hơn thực tế; ở người lớn, tuỷ thường kết thúc ngang L1–L2. Ranh giới giữa các đoạn là vị trí trung bình ở người lớn (theo tổng hợp của Frostell và cộng sự, 2016); ở từng người có thể lệch một đốt sống hoặc hơn. Lưới tuỷ là mô hình sơ đồ: không có phình cổ và tuỷ dày hơn thực tế (rõ nhất ở đoạn ngực). Không hiện rễ thần kinh.",
  en: "In this model the sacral segments and conus stretch from L1 down to the top of L3, longer than in reality; in adults the cord usually ends at L1–L2. Segment boundaries are adult averages (as compiled by Frostell et al. 2016); in an individual they can sit one vertebra or more higher or lower. The cord mesh is schematic: it has no cervical enlargement and it is thicker than a real cord (most of all in the thoracic region). Nerve roots are not shown.",
};
/** Lát ngắn (thắt lưng, cùng ~5 cm) khung nhỏ lại: phải thấy vài đốt quanh nó mới định vị được. */
const SHORT_BAND = { fill: 0.45, thumbnailFill: 0.5 };
const segment = (id: string, vi: string, en: string, band: AtlasViewDef["band"], terms: string[], partial = SEGMENT_PARTIAL, camera?: AtlasViewDef["camera"]): AtlasViewDef =>
  group(id, vi, en, "side", [SPINAL_CORD], [SPINE], terms, { band, partial, ...(camera ? { camera } : {}) });
const SPINAL_SEGMENT_VIEWS: readonly AtlasViewDef[] = [
  segment("spinal-cord-cervical", "Tuỷ cổ (đoạn C1–C8)", "Cervical spinal cord (segments C1–C8)", { top: CORD_TOP, bottom: C8_T1 }, ["tuỷ cổ", "cervical spinal cord", "đoạn tuỷ"]),
  segment("spinal-cord-thoracic", "Tuỷ ngực (đoạn T1–T12)", "Thoracic spinal cord (segments T1–T12)", { top: C8_T1, bottom: T12_L1 }, ["tuỷ ngực", "thoracic spinal cord", "đoạn tuỷ"]),
  segment("spinal-cord-lumbar", "Tuỷ thắt lưng (đoạn L1–L5)", "Lumbar spinal cord (segments L1–L5)", { top: T12_L1, bottom: L5_S1 }, ["tuỷ thắt lưng", "lumbar spinal cord", "đoạn tuỷ"], SEGMENT_PARTIAL, SHORT_BAND),
  segment("spinal-cord-sacral", "Tuỷ cùng (đoạn S1–S5) và nón tuỷ", "Sacral spinal cord (segments S1–S5) and conus medullaris", { top: L5_S1 }, ["tuỷ cùng", "nón tuỷ", "conus medullaris", "đoạn tuỷ"], SACRAL_PARTIAL, SHORT_BAND),
];

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
  // Xoang màng cứng MƯỢN hệ tĩnh mạch (cấu trúc "dural-sinuses"): xoang nằm giữa hai lá màng cứng, đi theo bờ các nếp.
  group("nervous-meninges", "Nếp màng cứng và xoang tĩnh mạch màng cứng", "Dural folds and dural venous sinuses", "three-quarter", [FALX, TENTORIUM, DURAL_SINUSES], [BRAINSTEM, CEREBELLUM],
    ["màng não", "meninges", "màng cứng", "dura mater", "liềm đại não", "lều tiểu não", "xoang tĩnh mạch"], {
      partial: {
        vi: "Về màng cứng, chỉ có liềm đại não và lều tiểu não; thiếu phần màng cứng lót vòm và nền sọ, liềm tiểu não, hoành yên, cùng màng nhện và màng mềm; thiếu xoang bướm – đỉnh và xoang bờ",
        en: "Of the dura, only the falx cerebri and tentorium cerebelli are shown; the dura lining the vault and base of the skull, the falx cerebelli, the diaphragma sellae, and the arachnoid and pia mater are missing; the sphenoparietal and marginal sinuses are missing",
      },
    }),
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
  group("cerebellar-vermis", "Nhộng tiểu não", "Cerebellar vermis", "back", [CB_CEREBELLAR_LINGULA, CB_CEREBELLAR_CENTRAL_LOBULE, CB_CEREBELLAR_CULMEN, CB_CEREBELLAR_DECLIVE, CB_CEREBELLAR_FOLIUM, CB_CEREBELLAR_TUBER, CB_CEREBELLAR_PYRAMIS, CB_CEREBELLAR_UVULA, CB_CEREBELLAR_NODULE], [CEREBELLUM, BRAINSTEM], ["nhộng", "thuỳ nhộng", "vermis"], {
    partial: {
      vi: "Các phần nhộng là khối đặc, bề mặt trơn: không thể hiện các lá tiểu não, không tách vỏ tiểu não với chất trắng. Ranh giới giữa các phần chỉ gần đúng.",
      en: "The parts of the vermis are modelled as solid blocks with a smooth surface: the folia are not shown and the cortex is not separated from the white matter. Boundaries between the parts are approximate.",
    },
  }),
  group("cerebellar-hemisphere-lobules", "Các tiểu thuỳ bán cầu tiểu não", "Lobules of the cerebellar hemispheres", "back", [CB_CEREBELLAR_CENTRAL_LOBULE_WING, CB_ANTERIOR_QUADRANGULAR_LOBULE, CB_POSTERIOR_QUADRANGULAR_LOBULE, CB_SUPERIOR_SEMILUNAR_LOBULE, CB_INFERIOR_SEMILUNAR_LOBULE, CB_GRACILE_LOBULE, CB_BIVENTRAL_LOBULE, CB_CEREBELLAR_TONSIL], [CEREBELLUM, BRAINSTEM], ["bán cầu tiểu não", "cerebellar hemisphere", "hạnh nhân tiểu não", "tonsil"], {
    partial: {
      vi: "Các tiểu thuỳ là khối đặc, bề mặt trơn: không thể hiện các lá tiểu não, không tách vỏ tiểu não với chất trắng. Ranh giới giữa các tiểu thuỳ chỉ gần đúng. Nhung được xếp vào thuỳ nhung – cục.",
      en: "The lobules are modelled as solid blocks with a smooth surface: the folia are not shown and the cortex is not separated from the white matter. Boundaries between lobules are approximate. The flocculus is listed under the flocculonodular lobe.",
    },
  }),
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
  ...SPINAL_SEGMENT_VIEWS,
  group("nervous-upper-limb", "Đám rối cánh tay và thần kinh chi trên", "Brachial plexus and nerves of the upper limb", "front", UPPER_LIMB, [UPPER_LIMB_BONES], ["đám rối cánh tay", "brachial plexus", "thần kinh giữa", "median nerve"]),
  // Có thần kinh thẹn (đáy chậu), chậu hạ vị/chậu bẹn (thành bụng) — không chỉ chi dưới.
  group("nervous-lower-limb", "Đám rối thắt lưng – cùng và thần kinh chi dưới", "Lumbosacral plexus branches and nerves of the lower limb", "front", LOWER_LIMB, [LOWER_LIMB_BONES], ["đám rối thắt lưng", "lumbosacral plexus", "thần kinh đùi", "femoral nerve"]),
  group("lumbar-plexus", "Các nhánh của đám rối thắt lưng", "Branches of the lumbar plexus", "front", [LUMBAR_PLEXUS_OTHER, FEMORAL, OBTURATOR], [LUMBAR_SACRAL_SPINE, HIP_BONE, PSOAS],
    ["đám rối thắt lưng", "lumbar plexus"], {
      partial: {
        vi: "Thiếu phần đám rối nằm trong cơ thắt lưng lớn, nơi các nhánh trước của thần kinh sống L1–L4 hợp lại; chỉ có các nhánh",
        en: "The part of the plexus within the psoas major, where the anterior rami of L1–L4 join, is missing; only the branches are shown",
      },
    }),
  group("sacral-plexus", "Các nhánh của đám rối cùng", "Branches of the sacral plexus", "back", [SACRAL_PLEXUS_OTHER, SCIATIC], [LUMBAR_SACRAL_SPINE, HIP_BONE, PIRIFORMIS],
    ["đám rối cùng", "sacral plexus"], {
      partial: {
        vi: "Thiếu phần đám rối nằm trên mặt trước cơ hình lê, nơi thân thắt lưng – cùng và các nhánh trước của các thần kinh sống cùng hợp lại; chỉ có các nhánh",
        en: "The part of the plexus on the anterior surface of the piriformis, where the lumbosacral trunk and the sacral anterior rami join, is missing; only the branches are shown",
      },
    }),
  group("nervous-sciatic", "Thần kinh ngồi và các nhánh", "Sciatic nerve and its branches", "back", [SCIATIC, TIBIAL, FIBULAR, SURAL], [LOWER_LIMB_BONES],
    ["thần kinh ngồi", "thần kinh toạ", "sciatic nerve", "thần kinh chày", "tibial nerve", "thần kinh mác", "fibular nerve"]),
  // Id cũ (trước gồm cả thân giao cảm) — thân giao cảm nay ở "Thần kinh tự chủ".
  group("nervous-trunk", "Thần kinh gian sườn", "Intercostal nerves", "anterolateral", [INTERCOSTAL_NERVES], [RIBS], ["gian sườn", "intercostal"]),
  group("sympathetic", "Phân hệ giao cảm: thân giao cảm đoạn cổ – ngực", "Sympathetic division: cervical and thoracic sympathetic trunk", "front", [SYMPATHETIC], [SPINE],
    ["giao cảm", "sympathetic", "chuỗi hạch giao cảm", "sympathetic chain"], {
      partial: {
        vi: "Thân giao cảm chỉ có đoạn cổ và ngực, dừng ngang đốt sống ngực XII; thiếu đoạn thắt lưng, đoạn cùng, các thần kinh tạng và các hạch trước cột sống",
        en: "Only the cervical and thoracic sympathetic trunk is shown, ending at the level of the twelfth thoracic vertebra; the lumbar and sacral parts, the splanchnic nerves and the prevertebral ganglia are missing",
      },
    }),
  group("parasympathetic", "Phân hệ đối giao cảm: phần sọ", "Parasympathetic division: cranial part", "anterolateral",
    [CN_PARASYMPATHETIC_NUCLEI, CILIARY_GANGLION, OCULOMOTOR, FACIAL, GLOSSOPHARYNGEAL, VAGUS], [BRAINSTEM, HEART],
    ["đối giao cảm", "parasympathetic", "Edinger–Westphal", "hạch mi", "ciliary ganglion"], {
      partial: {
        vi: "Dây VII, IX, X hiện nguyên dây, gồm cả các sợi không phải đối giao cảm; dây III chỉ có nhánh trên và nhánh dưới, không có thân dây. Thiếu hạch chân bướm – khẩu cái, hạch tai, hạch dưới hàm, thần kinh đá lớn, thần kinh đá bé và phần đối giao cảm cùng (các thần kinh tạng chậu)",
        en: "Cranial nerves VII, IX and X are shown whole, including their non-parasympathetic fibres; for the oculomotor nerve only its superior and inferior branches are shown, without the nerve trunk. The pterygopalatine, otic and submandibular ganglia, the greater and lesser petrosal nerves and the sacral parasympathetic outflow (pelvic splanchnic nerves) are missing",
      },
    }),
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
  {
    ...structure("cerebellum", "Tiểu não", "Cerebellum", "side", CEREBELLUM),
    partial: {
      vi: "Tiểu não ở đây ghép từ các tiểu thuỳ dạng khối đặc, bề mặt trơn: không thể hiện các lá tiểu não, không tách vỏ tiểu não với chất trắng (cây đời), và chưa có cuống tiểu não giữa và cuống tiểu não dưới. Ranh giới giữa các tiểu thuỳ chỉ gần đúng.",
      en: "This cerebellum is assembled from lobules modelled as solid blocks with a smooth surface: the folia are not shown, the cerebellar cortex is not separated from the white matter (arbor vitae), and the middle and inferior cerebellar peduncles are missing. Boundaries between lobules are approximate.",
    },
  },
  { ...structure("cerebellum-anterior-lobe", "Thuỳ trước tiểu não", "Anterior lobe of cerebellum", "superior", CEREBELLUM), focus: CB_ANTERIOR_LOBE },
  { ...structure("cerebellum-posterior-lobe", "Thuỳ sau tiểu não", "Posterior lobe of cerebellum", "back", CEREBELLUM), focus: CB_POSTERIOR_LOBE },
  { ...structure("flocculonodular-lobe", "Thuỳ nhung – cục", "Flocculonodular lobe", "front", CEREBELLUM), focus: CB_FLOCCULONODULAR },
  { ...structure("cerebellar-lingula", "Lưỡi tiểu não", "Lingula of cerebellum", "back", CB_CEREBELLAR_LINGULA), context: [CEREBELLUM] },
  { ...structure("cerebellar-central-lobule", "Tiểu thuỳ trung tâm", "Central lobule", "back", CB_CEREBELLAR_CENTRAL_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-central-lobule-wing", "Cánh tiểu thuỳ trung tâm", "Wing of central lobule", "superior", CB_CEREBELLAR_CENTRAL_LOBULE_WING), context: [CEREBELLUM] },
  { ...structure("cerebellar-culmen", "Đỉnh nhộng", "Culmen", "superior", CB_CEREBELLAR_CULMEN), context: [CEREBELLUM] },
  { ...structure("anterior-quadrangular-lobule", "Tiểu thuỳ bốn cạnh trước", "Anterior quadrangular lobule", "superior", CB_ANTERIOR_QUADRANGULAR_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-declive", "Dốc nhộng", "Declive", "back", CB_CEREBELLAR_DECLIVE), context: [CEREBELLUM] },
  { ...structure("posterior-quadrangular-lobule", "Tiểu thuỳ bốn cạnh sau", "Posterior quadrangular lobule", "superior", CB_POSTERIOR_QUADRANGULAR_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-folium", "Lá nhộng", "Folium of vermis", "back", CB_CEREBELLAR_FOLIUM), context: [CEREBELLUM] },
  { ...structure("superior-semilunar-lobule", "Tiểu thuỳ bán nguyệt trên", "Superior semilunar lobule", "back", CB_SUPERIOR_SEMILUNAR_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-tuber", "Củ nhộng", "Tuber of vermis", "back", CB_CEREBELLAR_TUBER), context: [CEREBELLUM] },
  { ...structure("inferior-semilunar-lobule", "Tiểu thuỳ bán nguyệt dưới", "Inferior semilunar lobule", "back", CB_INFERIOR_SEMILUNAR_LOBULE), context: [CEREBELLUM] },
  { ...structure("gracile-lobule", "Tiểu thuỳ thon", "Gracile lobule", "back", CB_GRACILE_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-pyramis", "Tháp nhộng", "Pyramis of vermis", "back", CB_CEREBELLAR_PYRAMIS), context: [CEREBELLUM] },
  { ...structure("biventral-lobule", "Tiểu thuỳ hai bụng", "Biventral lobule", "back", CB_BIVENTRAL_LOBULE), context: [CEREBELLUM] },
  { ...structure("cerebellar-uvula", "Lưỡi gà nhộng", "Uvula of vermis", "back", CB_CEREBELLAR_UVULA), context: [CEREBELLUM] },
  { ...structure("cerebellar-tonsil", "Hạnh nhân tiểu não", "Tonsil of cerebellum", "back", CB_CEREBELLAR_TONSIL), context: [CEREBELLUM] },
  { ...structure("cerebellar-nodule", "Cục nhộng", "Nodule of vermis", "front", CB_CEREBELLAR_NODULE), context: [CEREBELLUM] },
  { ...structure("flocculus", "Nhung và cuống nhung", "Flocculus and its peduncle", "front", CB_FLOCCULUS), context: [CEREBELLUM] },
  { ...structure("medulla-pyramid-olive", "Tháp hành và trám hành", "Pyramids and olives of the medulla oblongata", "front", PYRAMID_OLIVE, ["tháp hành", "trám hành", "pyramid", "olive"]), context: [MEDULLA] },
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
  { ...structure("cranial-nerve-motor-nuclei", "Nhân vận động các dây thần kinh sọ (chưa gồm nhân vận động dây sinh ba)", "Motor nuclei of the cranial nerves (excluding the trigeminal motor nucleus)", "back", CN_MOTOR_NUCLEI), context: [BRAINSTEM] },
  { ...structure("cranial-parasympathetic-nuclei", "Nhân đối giao cảm các dây thần kinh sọ", "Parasympathetic nuclei of the cranial nerves", "back", CN_PARASYMPATHETIC_NUCLEI, ["Edinger–Westphal", "nhân nước bọt", "salivatory nucleus"]), context: [BRAINSTEM] },
  { ...structure("cranial-nerve-sensory-nuclei", "Nhân cảm giác các dây thần kinh sọ (chưa gồm các nhân dây sinh ba)", "Sensory nuclei of the cranial nerves (excluding the trigeminal nuclei)", "back", CN_SENSORY_NUCLEI), context: [BRAINSTEM] },
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
  structure("ophthalmic-nerve-trunk", "Thân dây thần kinh mắt (V1)", "Ophthalmic nerve (V1) trunk", [-0.8, 0.35, 0.5], OPHTHALMIC_TRUNK),
  structure("frontal-nerve", "Thần kinh trán, trên ổ mắt và trên ròng rọc", "Frontal, supra-orbital and supratrochlear nerves", [-0.8, 0.35, 0.5], FRONTAL_NERVE),
  structure("lacrimal-nerve", "Thần kinh lệ", "Lacrimal nerve", [-0.8, 0.35, 0.5], LACRIMAL_NERVE),
  structure("nasociliary-nerve", "Thần kinh mũi mi và các nhánh", "Nasociliary nerve and its branches", [-0.8, 0.35, 0.5], NASOCILIARY),
  structure("ciliary-ganglion", "Hạch mi và các thần kinh mi ngắn", "Ciliary ganglion and short ciliary nerves", [-0.8, 0.35, 0.5], CILIARY_GANGLION, ["hạch mi", "ciliary ganglion"]),
  structure("maxillary-nerve", "Dây thần kinh hàm trên (V2)", "Maxillary nerve (V2)", "anterolateral", MAXILLARY),
  structure("mandibular-nerve", "Dây thần kinh hàm dưới (V3) và nhánh", "Mandibular nerve (V3) and branches", "anterolateral", MANDIBULAR),
  structure("facial-nerve", "Dây mặt (VII) và thừng nhĩ", "Facial nerve (VII) and chorda tympani", "side", FACIAL),
  structure("vestibulocochlear-nerve", "Dây tiền đình – ốc tai (VIII)", "Vestibulocochlear nerve (VIII)", "side", VESTIBULOCOCHLEAR),
  structure("glossopharyngeal-nerve", "Dây thiệt hầu (IX)", "Glossopharyngeal nerve (IX)", "side", GLOSSOPHARYNGEAL),
  structure("accessory-nerve", "Dây phụ (XI)", "Accessory nerve (XI)", "side", ACCESSORY),
  structure("hypoglossal-nerve", "Dây hạ thiệt (XII)", "Hypoglossal nerve (XII)", "side", HYPOGLOSSAL),
  structure("spinal-cord", "Tuỷ sống (chất xám, chất trắng)", "Spinal cord (grey and white matter)", "back", SPINAL_CORD),
  { ...structure("spinal-tracts", "Các bó chất trắng tuỷ sống", "White matter tracts of the spinal cord", "superior", n(/tract$|fasciculus( proprius)?$/i, /solitary|optic|iliotibial|olfactory/i), ["bó tuỷ", "spinal tracts", "bó vỏ – tuỷ", "corticospinal", "bó tháp", "bó gai – đồi thị", "bó gai – tiểu não"]),
    context: [SPINAL_GREY],
    partial: {
      vi: "Mô hình vẽ các bó theo sơ đồ: hầu hết được kéo suốt chiều dài tuỷ sống, trong khi trên thực tế một số bó chỉ có ở một đoạn tuỷ (ví dụ bó chêm chỉ có ở phần trên). Vị trí tương đối của các bó trên mặt cắt là gần đúng.",
      en: "The tracts are drawn schematically: most are shown running the full length of the spinal cord, although in reality some are present only in certain segments (for example, the cuneate fasciculus exists only in the upper cord). Their relative positions in cross-section are approximate.",
    },
  },
  { ...structure("spinal-tracts-ascending", "Các bó lên", "Ascending tracts", "superior", TRACTS_ASCENDING), context: [SPINAL_GREY] },
  { ...structure("spinal-tracts-descending", "Các bó xuống", "Descending tracts", "superior", TRACTS_DESCENDING), context: [SPINAL_GREY] },
  { ...structure("spinal-fasciculi-proprii", "Các bó riêng và bó sau bên", "Fasciculi proprii and posterolateral tract", "superior", FASCICULI_PROPRII), context: [SPINAL_GREY] },
  { ...structure("superior-cerebellar-peduncle", "Cuống tiểu não trên", "Superior cerebellar peduncle", "back", SUPERIOR_CEREBELLAR_PEDUNCLE), context: [CEREBELLUM, BRAINSTEM] },
  { ...structure("transverse-temporal-gyri", "Hồi thái dương ngang và mặt phẳng thái dương", "Transverse temporal gyri and temporal plane", "superior", TRANSVERSE_TEMPORAL, ["hồi Heschl", "Heschl's gyri", "vỏ thính giác", "auditory cortex"]), context: [SUPERIOR_TEMPORAL] },
  structure("spinal-dura", "Màng cứng tuỷ", "Spinal dura mater", "back", SPINAL_DURA),
  structure("spinal-roots", "Rễ và hạch gai", "Spinal roots and ganglia", "back", SPINAL_ROOTS),
  structure("cauda-equina", "Chùm đuôi ngựa", "Cauda equina", "back", CAUDA_EQUINA),
  {
    ...structure("brachial-plexus", "Đám rối cánh tay (rễ, thân, ngành, bó sau)", "Brachial plexus (roots, trunks, divisions, posterior cord)", "front", BRACHIAL_PLEXUS),
    partial: { vi: "Bó ngoài và bó trong không có lưới riêng", en: "The lateral and medial cords have no separate mesh" },
  },
  structure("brachial-plexus-collaterals", "Nhánh bên của đám rối cánh tay", "Collateral branches of the brachial plexus", "front", PLEXUS_COLLATERAL),
  structure("musculocutaneous-nerve", "Thần kinh cơ bì", "Musculocutaneous nerve", "front", MUSCULOCUTANEOUS),
  structure("axillary-nerve", "Thần kinh nách", "Axillary nerve", "back", AXILLARY_NERVE),
  structure("median-nerve", "Thần kinh giữa", "Median nerve", "front", MEDIAN),
  structure("ulnar-nerve", "Thần kinh trụ", "Ulnar nerve", "front", ULNAR),
  structure("radial-nerve", "Thần kinh quay", "Radial nerve", "back", RADIAL),
  structure("medial-cutaneous-nerves-arm", "Thần kinh bì cánh tay trong và bì cẳng tay trong", "Medial brachial and antebrachial cutaneous nerves", "front", MEDIAL_CUTANEOUS),
  structure("brachial-plexus-roots", "Rễ đám rối cánh tay", "Roots of the brachial plexus", "front", BP_ROOTS),
  structure("brachial-plexus-trunks", "Thân trên, giữa và dưới của đám rối cánh tay", "Superior, middle and inferior trunks of the brachial plexus", "front", BP_TRUNKS),
  structure("brachial-plexus-divisions", "Ngành trước và ngành sau của đám rối cánh tay", "Anterior and posterior divisions of the brachial plexus", "front", BP_DIVISIONS),
  structure("brachial-plexus-posterior-cord", "Bó sau đám rối cánh tay", "Posterior cord of the brachial plexus", "front", BP_POSTERIOR_CORD),
  structure("median-nerve-trunk", "Thân thần kinh giữa", "Median nerve trunk", "front", MEDIAN_TRUNK),
  structure("anterior-interosseous-nerve", "Thần kinh gian cốt trước", "Anterior interosseous nerve", "front", MEDIAN_AIN),
  structure("median-nerve-muscular-branches", "Các nhánh cơ của thần kinh giữa", "Muscular branches of the median nerve", "front", MEDIAN_MUSCULAR),
  structure("median-nerve-palmar-branch", "Nhánh gan tay của thần kinh giữa", "Palmar branch of the median nerve", "front", MEDIAN_PALMAR),
  structure("median-nerve-digital-branches", "Các nhánh gan ngón tay chung và riêng của thần kinh giữa", "Common and proper palmar digital branches of the median nerve", "front", MEDIAN_DIGITAL),
  structure("median-ulnar-communicating-branch", "Nhánh nối thần kinh giữa với thần kinh trụ", "Communicating branch of the median nerve with the ulnar nerve", "front", MEDIAN_COMMUNICATING),
  structure("ulnar-nerve-trunk", "Thân thần kinh trụ", "Ulnar nerve trunk", "front", ULNAR_TRUNK),
  structure("ulnar-nerve-muscular-branches", "Các nhánh cơ của thần kinh trụ", "Muscular branches of the ulnar nerve", "front", ULNAR_MUSCULAR),
  structure("ulnar-nerve-palmar-branch", "Nhánh gan tay của thần kinh trụ", "Palmar branch of the ulnar nerve", "front", ULNAR_PALMAR),
  structure("ulnar-nerve-dorsal-branch", "Nhánh mu tay của thần kinh trụ", "Dorsal branch of the ulnar nerve", "back", ULNAR_DORSAL),
  structure("ulnar-nerve-superficial-branch", "Nhánh nông của thần kinh trụ", "Superficial branch of the ulnar nerve", "front", ULNAR_SUPERFICIAL),
  structure("ulnar-nerve-deep-branch", "Nhánh sâu của thần kinh trụ", "Deep branch of the ulnar nerve", "front", ULNAR_DEEP),
  structure("ulnar-nerve-palmar-digital-branches", "Các nhánh gan ngón tay chung và riêng của thần kinh trụ", "Common and proper palmar digital branches of the ulnar nerve", "front", ULNAR_PALMAR_DIGITAL),
  structure("ulnar-nerve-dorsal-digital-branches", "Các nhánh mu ngón tay của thần kinh trụ", "Dorsal digital branches of the ulnar nerve", "back", ULNAR_DORSAL_DIGITAL),
  structure("radial-nerve-trunk", "Thân thần kinh quay", "Radial nerve trunk", "back", RADIAL_TRUNK),
  structure("radial-nerve-muscular-branches", "Các nhánh cơ của thần kinh quay", "Muscular branches of the radial nerve", "back", RADIAL_MUSCULAR),
  structure("radial-nerve-cutaneous-branches", "Thần kinh bì cánh tay ngoài dưới và bì cẳng tay sau", "Inferior lateral brachial and posterior antebrachial cutaneous nerves", "back", RADIAL_CUTANEOUS),
  structure("radial-nerve-superficial-branch", "Nhánh nông của thần kinh quay", "Superficial branch of the radial nerve", "back", RADIAL_SUPERFICIAL),
  structure("radial-nerve-deep-branch", "Nhánh sâu của thần kinh quay", "Deep branch of the radial nerve", "back", RADIAL_DEEP),
  structure("posterior-interosseous-nerve", "Thần kinh gian cốt sau", "Posterior interosseous nerve", "back", RADIAL_PIN),
  structure("radial-nerve-dorsal-digital-branches", "Các nhánh mu ngón tay của thần kinh quay", "Dorsal digital branches of the radial nerve", "back", RADIAL_DORSAL_DIGITAL),
  structure("lumbar-plexus-branches", "Thần kinh chậu hạ vị, chậu bẹn, sinh dục đùi và bì đùi ngoài", "Iliohypogastric, ilio-inguinal, genitofemoral and lateral femoral cutaneous nerves", "front", LUMBAR_PLEXUS_OTHER),
  structure("femoral-nerve", "Thần kinh đùi và thần kinh hiển", "Femoral and saphenous nerves", "front", FEMORAL),
  structure("obturator-nerve", "Thần kinh bịt", "Obturator nerve", "front", OBTURATOR),
  structure("sacral-plexus-branches", "Thần kinh mông, thẹn, bì đùi sau và các nhánh cơ", "Gluteal, pudendal, posterior femoral cutaneous and muscular branches", "back", SACRAL_PLEXUS_OTHER),
  structure("sciatic-nerve", "Thần kinh ngồi", "Sciatic nerve", "back", SCIATIC),
  structure("tibial-nerve", "Thần kinh chày và thần kinh gan chân", "Tibial and plantar nerves", "back", TIBIAL),
  structure("tibial-nerve-trunk", "Thân thần kinh chày", "Tibial nerve trunk", "back", TIBIAL_TRUNK),
  structure("plantar-nerves", "Thần kinh gan chân trong và ngoài", "Medial and lateral plantar nerves", [0, -1, 0.3], PLANTAR, ["thần kinh gan chân", "plantar nerve"]),
  structure("medial-plantar-nerve", "Thần kinh gan chân trong và các nhánh gan ngón chân", "Medial plantar nerve and its plantar digital branches", [0, -1, 0.3], MEDIAL_PLANTAR),
  structure("lateral-plantar-nerve", "Thần kinh gan chân ngoài và các nhánh gan ngón chân", "Lateral plantar nerve and its plantar digital branches", [0, -1, 0.3], LATERAL_PLANTAR),
  structure("fibular-nerves", "Thần kinh mác chung, nông và sâu", "Common, superficial and deep fibular nerves", "front", FIBULAR),
  structure("sural-nerve", "Thần kinh bắp chân", "Sural nerve", "back", SURAL),
  structure("sympathetic-trunk", "Thân giao cảm đoạn cổ – ngực: dải thân, các hạch và các nhánh", "Cervical and thoracic sympathetic trunk: cord, ganglia and branches", "anterolateral", SYMPATHETIC),
  structure("sympathetic-chain", "Dải thân giao cảm (không gồm hạch)", "Sympathetic trunk cord (without ganglia)", "anterolateral", SYMPATHETIC_CHAIN),
  structure("sympathetic-ganglia", "Các hạch thân giao cảm", "Ganglia of the sympathetic trunk", "anterolateral", SYMPATHETIC_GANGLIA),
  structure("sympathetic-nerves", "Các nhánh giao cảm", "Sympathetic nerves", "anterolateral", SYMPATHETIC_NERVES),
];
