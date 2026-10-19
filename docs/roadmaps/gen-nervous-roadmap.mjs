// Sinh docs/roadmaps/human-atlas-nervous-system.json. Chạy từ gốc repo: node docs/roadmaps/gen-nervous-roadmap.mjs .
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const out = path.join(root, "docs/roadmaps/human-atlas-nervous-system.json");

// ---------------------------------------------------------------- quy ước
const ZOOM = { body: 0.74, region: 0.78, organ: 0.82, structure: 0.86, detail: 0.9 };
const PHASE = { A: 1, B: 2, C: 2, D: 2, E: 2, F: 3, G: 4, H: 5, I: 6, J: 7, K: 8 };
const STATUS = {
  live: "Đã có trên main — chỉ chỉnh/tách",
  buildable: "Mảnh đã có trên R2 — chỉ cần khai báo góc nhìn",
  "import-za": "Có trong Z-Anatomy (CC BY-SA, đã vet) nhưng bộ lọc import-z-anatomy.ts loại — nới lọc + khử trùng",
  "needs-schema": "Không có mảnh riêng — cần kiểu nút mới (vùng/nhãn phủ lên mảnh cha)",
  "needs-clipping": "Cần mặt cắt theo cao độ — trình xem chưa hỗ trợ",
  missing: "Không nguồn đã vet nào có — tìm asset (giấy phép trước) hoặc dựng sơ đồ 2D",
};
function priority(status, phase) {
  if (status === "live") return "done";
  if (status === "buildable") return phase <= 3 ? "P1" : "P2";
  if (status === "import-za") return phase <= 3 ? "P2" : "P3";
  if (status === "needs-schema" || status === "needs-clipping") return "P3";
  return "P4";
}

const nodes = [];
/**
 * kind: overview | section | group | structure | region
 *  - section: nút điều hướng, không dựng 3D riêng (gom con)
 *  - region:  cấp 4–5 không có mesh riêng (vùng chức năng trên hồi) → needs-schema
 */
function N(id, parent, sec, kind, vi, en, o = {}) {
  nodes.push({ id, parent, sec, kind, vi, en, ...o });
}

// Bối cảnh dùng lại (tên rule trên main hoặc mô tả)
const SKULL = "SKULL (xương sọ, ghost)";
const BRAINCTX = "BRAIN (não, ghost)";

// ================================================================ A. Tổng quan
N("nervous-overview", null, "A", "overview", "Toàn bộ hệ thần kinh", "Whole nervous system", {
  status: "live", existing: "nervous-overview", partial: true, dir: "front", zoom: "body", mode: "isolated",
  focus: ["mọi mảnh hệ nervous (BP3D + ZA-)"],
  obj: ["Phân biệt hệ thần kinh trung ương (não, tuỷ sống) với hệ thần kinh ngoại biên", "Nhận ra đường đi chung của dây thần kinh từ trục thần kinh ra chi và thân"],
  note: "Thiếu dây I, VI, rễ/hạch V, dây hoành, đám rối cổ (câu partial đã có trên main).",
});
N("sec-cns", "nervous-overview", "A", "section", "Hệ thần kinh trung ương", "Central nervous system", {
  status: "live", obj: ["Xác định hai thành phần của hệ thần kinh trung ương và lớp bảo vệ quanh chúng"],
});
N("sec-pns", "nervous-overview", "A", "section", "Hệ thần kinh ngoại biên", "Peripheral nervous system", {
  status: "live", obj: ["Phân biệt dây sọ, dây gai sống, đám rối và thần kinh tận"],
});

// ================================================================ B. Não
N("nervous-brain", "sec-cns", "B", "group", "Não", "Brain", {
  status: "live", existing: "nervous-brain", dir: "side", zoom: "organ", mode: "layered", context: [SKULL, "TENTORIUM"],
  obj: ["Kể tên năm phần lớn của não: đại não, gian não, thân não, tiểu não, hệ não thất", "Định hướng não trong hộp sọ"],
});
N("nervous-cerebrum", "nervous-brain", "B", "group", "Đại não: vỏ và chất trắng", "Cerebrum: cortex and white matter", {
  status: "live", existing: "nervous-cerebrum", dir: "side", zoom: "organ", mode: "layered", context: ["CEREBELLUM", "BRAINSTEM"],
  obj: ["Xác định hai bán cầu, rãnh và thuỳ chính", "Phân biệt vỏ (chất xám) với chất trắng bên dưới"],
});
N("cerebral-white-matter", "nervous-cerebrum", "B", "structure", "Chất trắng, thể chai và các mép", "White matter, corpus callosum and commissures", {
  status: "live", existing: "cerebral-white-matter", dir: "side", zoom: "structure", mode: "layered", context: ["CORTEX"],
  obj: ["Nhận ra thể chai là mép nối hai bán cầu", "Xác định bao trong giữa nhân nền và đồi thị"],
});
N("basal-nuclei", "nervous-cerebrum", "B", "structure", "Nhân đuôi, bèo sẫm và cầu nhạt", "Caudate nucleus, putamen and globus pallidus", {
  status: "live", existing: "basal-nuclei", dir: "three-quarter", zoom: "structure", mode: "layered", context: ["CEREBRAL_WHITE", "VENTRICLES"],
  obj: ["Xác định vị trí nhân nền sâu trong bán cầu", "Nhận ra nhân đuôi ôm theo não thất bên"],
});
N("nervous-cerebellum", "nervous-brain", "B", "group", "Tiểu não", "Cerebellum", {
  status: "live", existing: "cerebellum", dir: "back", zoom: "organ", mode: "layered", context: ["BRAINSTEM", "TENTORIUM"],
  obj: ["Xác định tiểu não sau thân não, dưới lều tiểu não", "Phân biệt thuỳ nhộng với hai bán cầu tiểu não"],
  note: "Hiện là 1 mảnh BP3D (structure `cerebellum`). Tách tiểu thuỳ cần nhập ZA; khi đó id `cerebellum` chuyển thành group, giữ deep link.",
});
N("cerebellar-vermis", "nervous-cerebellum", "B", "structure", "Thuỳ nhộng tiểu não", "Cerebellar vermis", {
  status: "import-za", dir: "back", zoom: "structure", mode: "layered", context: ["CEREBELLUM hemispheres"],
  focus: ["Lingula of cerebellum", "Central lobule", "Culmen", "Declive", "Folium of vermis", "Tuber of vermis", "Pyramis of vermis", "Uvula of vermis", "Nodule of vermis"],
  obj: ["Xác định thuỳ nhộng ở đường giữa tiểu não"],
});
N("cerebellar-hemisphere-lobules", "nervous-cerebellum", "B", "structure", "Các tiểu thuỳ bán cầu tiểu não", "Lobules of the cerebellar hemisphere", {
  status: "import-za", dir: "back", zoom: "structure", mode: "layered", context: ["vermis"],
  focus: ["Anterior/Posterior quadrangular lobule", "Superior/Inferior semilunar lobule", "Gracile lobule", "Biventral lobule", "Tonsil of cerebellum", "Wing of central lobule"],
  obj: ["Nhận ra các tiểu thuỳ chính của bán cầu tiểu não", "Xác định hạnh nhân tiểu não gần lỗ lớn xương chẩm"],
});
N("flocculonodular-lobe", "nervous-cerebellum", "B", "structure", "Thuỳ nhung – nhộng (thể nhung, nhân nhộng)", "Flocculonodular lobe", {
  status: "import-za", dir: [0, -0.4, -1], zoom: "detail", mode: "layered", context: ["CEREBELLUM", "BRAINSTEM"],
  focus: ["Flocculus", "Peduncle of flocculus", "Nodule of vermis"],
  obj: ["Xác định thuỳ nhung – nhộng ở mặt trước dưới tiểu não"],
});
N("cerebellar-peduncles", "nervous-cerebellum", "B", "structure", "Cuống tiểu não", "Cerebellar peduncles", {
  status: "import-za", partial: true, dir: "three-quarter", zoom: "detail", mode: "layered", context: ["BRAINSTEM"],
  focus: ["Superior cerebellar peduncle"], note: "ZA chỉ có cuống trên; cuống giữa/dưới chưa có — partial.",
  obj: ["Nhận ra cuống tiểu não là đường nối tiểu não với thân não"],
});
N("cerebellar-nuclei", "nervous-cerebellum", "B", "structure", "Nhân tiểu não (nhân răng…)", "Cerebellar nuclei (dentate…)", {
  status: "missing", obj: ["Xác định nhân răng sâu trong bán cầu tiểu não"],
});
N("nervous-brainstem", "nervous-brain", "B", "group", "Thân não", "Brainstem", {
  status: "live", existing: "brainstem", dir: "side", zoom: "organ", mode: "layered", context: ["DIENCEPHALON", "CEREBELLUM", "SPINAL_CORD"],
  obj: ["Kể ba phần thân não từ trên xuống: trung não, cầu não, hành não", "Nhận ra thân não là nơi xuất phát của phần lớn dây sọ"],
  note: "Đang là structure `brainstem` + group `nervous-brainstem-cerebellum`. Tách 3 phần = đổi `brainstem` thành group.",
});
N("midbrain", "nervous-brainstem", "B", "structure", "Trung não", "Midbrain", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["PONS", "DIENCEPHALON"],
  focus: ["Midbrain", "Peduncle of midbrain", "Superior/Inferior colliculus", "Brachium of colliculi", "Interpeduncular fossa", "Cerebral aqueduct (context)"],
  obj: ["Xác định cuống đại não và mái trung não (gò trên, gò dưới)"],
});
N("red-nucleus", "midbrain", "B", "region", "Nhân đỏ", "Red nucleus", {
  status: "import-za", dir: "three-quarter", zoom: "detail", mode: "layered", context: ["MIDBRAIN ghost"], focus: ["Red nucleus"],
  obj: ["Định vị nhân đỏ trong trần cuống đại não"],
});
N("pons", "nervous-brainstem", "B", "structure", "Cầu não", "Pons", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["MIDBRAIN", "MEDULLA", "CEREBELLUM"], focus: ["Pons"],
  obj: ["Xác định cầu não giữa trung não và hành não, trước tiểu não"],
});
N("medulla-oblongata", "nervous-brainstem", "B", "structure", "Hành não", "Medulla oblongata", {
  status: "buildable", dir: "front", zoom: "structure", mode: "layered", context: ["PONS", "SPINAL_CORD"], focus: ["Medulla oblongata"],
  obj: ["Xác định hành não nối tiếp tuỷ sống qua lỗ lớn xương chẩm"],
});
N("medulla-pyramid-olive", "medulla-oblongata", "B", "region", "Tháp hành và trám hành", "Pyramid and olive of medulla", {
  status: "import-za", dir: "front", zoom: "detail", mode: "layered", context: ["MEDULLA ghost"], focus: ["Pyramid of medulla oblongata", "Olive"],
  obj: ["Nhận ra tháp hành và trám hành ở mặt trước hành não"],
});
N("cranial-nerve-nuclei", "nervous-brainstem", "B", "structure", "Nhân dây thần kinh sọ", "Cranial nerve nuclei", {
  status: "import-za", partial: true, dir: "back", zoom: "detail", mode: "layered", context: ["BRAINSTEM ghost 20%"],
  focus: ["Nucleus of oculomotor/trochlear/abducens/hypoglossal/accessory nerve", "Accessory nucleus of oculomotor nerve", "Motor nucleus of facial nerve", "Nucleus ambiguus", "Nucleus of solitary tract", "Posterior nucleus of vagus nerve", "Superior/Inferior salivatory nucleus", "Vestibular nuclei", "Anterior/Posterior cochlear nucleus"],
  note: "Thiếu nhân dây V (cảm giác, vận động). Nối chéo sang từng dây sọ ở mục F.",
  obj: ["Định vị cột nhân vận động và cảm giác của dây sọ trong thân não", "Liên hệ từng dây sọ với nhân của nó"],
});
N("nervous-ventricles", "nervous-brain", "B", "group", "Hệ não thất", "Ventricular system", {
  status: "live", existing: "nervous-ventricles", dir: "three-quarter", zoom: "organ", mode: "layered", context: ["CEREBRAL_WHITE", "BRAINSTEM", "CEREBELLUM"],
  obj: ["Kể tên bốn não thất và đường thông giữa chúng", "Xác định đám rối mạch mạc"],
});
N("lateral-ventricles", "nervous-ventricles", "B", "structure", "Não thất bên", "Lateral ventricles", {
  status: "buildable", dir: "three-quarter", zoom: "structure", mode: "layered", context: [BRAINCTX], focus: ["Lateral ventricle", "Interventricular foramen"],
  obj: ["Nhận ra sừng trán, thân, sừng chẩm, sừng thái dương của não thất bên"],
  note: "Tách `brain-ventricles` thành 4 structure — đổi id cũ thành group, giữ deep link.",
});
N("third-ventricle", "nervous-ventricles", "B", "structure", "Não thất ba", "Third ventricle", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["DIENCEPHALON"], focus: ["Third ventricle"],
  obj: ["Xác định não thất ba giữa hai đồi thị"],
});
N("cerebral-aqueduct", "nervous-ventricles", "B", "structure", "Cống não", "Cerebral aqueduct", {
  status: "buildable", dir: "side", zoom: "detail", mode: "layered", context: ["MIDBRAIN"], focus: ["Cerebral aqueduct"],
  obj: ["Nhận ra cống não nối não thất ba với não thất bốn qua trung não"],
});
N("fourth-ventricle", "nervous-ventricles", "B", "structure", "Não thất bốn", "Fourth ventricle", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["PONS", "MEDULLA", "CEREBELLUM"], focus: ["Fourth ventricle"],
  obj: ["Xác định não thất bốn giữa thân não và tiểu não"],
});
N("choroid-plexus", "nervous-ventricles", "B", "structure", "Đám rối mạch mạc", "Choroid plexus", {
  status: "buildable", dir: "three-quarter", zoom: "detail", mode: "layered", context: ["LATERAL_VENTRICLES"], focus: ["Choroid plexus of cerebral hemisphere (hệ sensory trong dữ liệu — mượn)"],
  obj: ["Nhận ra đám rối mạch mạc nằm trong não thất"],
  note: "Mảnh BP3D đang bị xếp hệ sensory — kiểm SYSTEM_CORRECTIONS trước khi dựng.",
});
N("nervous-meninges", "nervous-brain", "B", "group", "Màng não và xoang tĩnh mạch màng cứng", "Meninges and dural venous sinuses", {
  status: "import-za", partial: true, dir: "side", zoom: "organ", mode: "layered", context: [BRAINCTX, SKULL],
  focus: ["Tentorium cerebelli (BP3D)", "Falx cerebri (ZA)", "dural-sinuses (mượn hệ venous)", "Spinal dura (ZA)"],
  note: "Không nguồn nào có màng nhện, màng mềm, liềm tiểu não.",
  obj: ["Xác định liềm đại não và lều tiểu não chia khoang sọ", "Liên hệ xoang tĩnh mạch màng cứng với các nếp màng cứng"],
});
N("tentorium-cerebelli", "nervous-meninges", "B", "structure", "Lều tiểu não", "Tentorium cerebelli", {
  status: "live", existing: "tentorium-cerebelli", dir: "side", zoom: "structure", mode: "layered", context: [BRAINCTX],
  obj: ["Xác định lều tiểu não ngăn đại não với tiểu não"],
});
N("falx-cerebri", "nervous-meninges", "B", "structure", "Liềm đại não", "Falx cerebri", {
  status: "import-za", dir: "side", zoom: "structure", mode: "layered", context: [BRAINCTX], focus: ["Falx cerebri"],
  obj: ["Xác định liềm đại não trong khe gian bán cầu"],
});
N("nervous-brain-blood-supply", "nervous-brain", "B", "group", "Cấp máu cho não", "Blood supply of the brain", {
  status: "live", existing: "nervous-brain-blood-supply", dir: "side", zoom: "organ", mode: "layered", context: ["BRAIN"],
  obj: ["Phân biệt hệ cảnh trong với hệ đốt sống – nền", "Xác định vòng động mạch não"],
});

// ================================================================ C. Vùng não (thuỳ → hồi → vùng chức năng)
const lobeNote = "Mảnh hồi BP3D đều nằm trong rule CORTEX → cấu trúc `cerebral-cortex`. Tách thuỳ = thay `cerebral-cortex` bằng 5 structure thuỳ (test \"phủ đủ, không chồng\").";
N("frontal-lobe", "nervous-cerebrum", "C", "structure", "Thuỳ trán", "Frontal lobe", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["CORTEX còn lại ghost"],
  focus: ["Superior/Middle/Inferior frontal gyrus", "Precentral gyrus", "Orbital gyrus"], note: lobeNote,
  obj: ["Xác định ranh giới thuỳ trán: rãnh trung tâm phía sau, rãnh bên phía dưới", "Kể tên các hồi chính của thuỳ trán"],
});
N("precentral-gyrus", "frontal-lobe", "C", "structure", "Hồi trước trung tâm", "Precentral gyrus", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["FRONTAL_LOBE ghost", "Central sulcus (ZA)"], focus: ["Precentral gyrus"],
  obj: ["Xác định hồi trước trung tâm ngay trước rãnh trung tâm"],
});
N("primary-motor-cortex", "precentral-gyrus", "C", "region", "Vỏ vận động nguyên phát", "Primary motor cortex", {
  status: "needs-schema", dir: "side", zoom: "detail", mode: "layered", focus: ["nhãn vùng trên mảnh Precentral gyrus"],
  note: "Không có mesh riêng; vỏ vận động nguyên phát nằm chủ yếu ở hồi trước trung tâm nhưng ranh giới không trùng khít mép hồi → hiển thị là NHÃN VÙNG trên hồi, ghi rõ \"xấp xỉ\". Câu chữ qua science-editor.",
  obj: ["Liên hệ hồi trước trung tâm với vận động có chủ ý", "Hiểu rằng vùng chức năng không trùng khít ranh giới hồi"],
});
N("premotor-sma", "frontal-lobe", "C", "region", "Vỏ tiền vận động và vùng vận động bổ sung", "Premotor cortex and supplementary motor area", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn vùng trên phần sau hồi trán trên/giữa"],
  note: "Không mesh; ranh giới chức năng — chỉ nhãn xấp xỉ, cần science-editor duyệt.",
  obj: ["Định vị vùng tiền vận động trước vỏ vận động nguyên phát"],
});
N("inferior-frontal-gyrus", "frontal-lobe", "C", "structure", "Hồi trán dưới (phần nắp, tam giác, ổ mắt)", "Inferior frontal gyrus (opercular, triangular, orbital parts)", {
  status: "import-za", dir: "side", zoom: "structure", mode: "layered", context: ["FRONTAL_LOBE ghost"],
  focus: ["Opercular part of inferior frontal gyrus", "Triangular part of inferior frontal gyrus", "Orbital part of inferior frontal gyrus"],
  note: "BP3D có hồi trán dưới nguyên khối; ZA chia 3 phần → khử trùng theo không gian, giữ bản ZA khi xem cấp 4.",
  obj: ["Phân biệt ba phần của hồi trán dưới"],
});
N("broca-area", "inferior-frontal-gyrus", "C", "region", "Vùng Broca", "Broca's area", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn trên phần nắp + phần tam giác (ZA)"],
  note: "Thường mô tả ở phần nắp và tam giác của hồi trán dưới, ưu thế bán cầu trái ở đa số người; ranh giới chức năng thay đổi giữa cá thể → nhãn xấp xỉ, science-editor duyệt.",
  obj: ["Liên hệ phần nắp và tam giác hồi trán dưới với sản xuất ngôn ngữ"],
});
N("frontal-gyri-other", "frontal-lobe", "C", "structure", "Hồi trán trên, giữa và các hồi ổ mắt", "Superior and middle frontal gyri, orbital gyri", {
  status: "buildable", dir: "three-quarter", zoom: "structure", mode: "layered", focus: ["Superior frontal gyrus", "Middle frontal gyrus", "Orbital gyrus"],
  obj: ["Kể tên các hồi trán xếp từ trên xuống"],
});
N("prefrontal-cortex", "frontal-lobe", "C", "region", "Vỏ trước trán", "Prefrontal cortex", {
  status: "needs-schema", zoom: "structure", mode: "layered", focus: ["nhãn vùng phía trước vùng vận động"],
  obj: ["Định vị vỏ trước trán ở phần trước thuỳ trán"],
});
N("parietal-lobe", "nervous-cerebrum", "C", "structure", "Thuỳ đỉnh", "Parietal lobe", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["CORTEX còn lại ghost"],
  focus: ["Postcentral gyrus", "Superior parietal lobule", "Supramarginal gyrus", "Angular gyrus"], note: lobeNote,
  obj: ["Xác định thuỳ đỉnh giữa rãnh trung tâm và rãnh đỉnh – chẩm", "Kể tên hồi sau trung tâm và hai tiểu thuỳ đỉnh"],
});
N("postcentral-gyrus", "parietal-lobe", "C", "structure", "Hồi sau trung tâm", "Postcentral gyrus", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["PARIETAL_LOBE ghost"], focus: ["Postcentral gyrus"],
  obj: ["Xác định hồi sau trung tâm ngay sau rãnh trung tâm"],
});
N("primary-somatosensory-cortex", "postcentral-gyrus", "C", "region", "Vỏ cảm giác thân thể nguyên phát", "Primary somatosensory cortex", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn vùng trên Postcentral gyrus"],
  obj: ["Liên hệ hồi sau trung tâm với cảm giác thân thể"],
});
N("inferior-parietal-lobule", "parietal-lobe", "C", "structure", "Tiểu thuỳ đỉnh dưới (hồi trên viền, hồi góc)", "Inferior parietal lobule (supramarginal, angular gyri)", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", focus: ["Supramarginal gyrus", "Angular gyrus"],
  obj: ["Xác định hồi trên viền và hồi góc quanh đầu sau rãnh bên"],
});
N("superior-parietal-lobule", "parietal-lobe", "C", "structure", "Tiểu thuỳ đỉnh trên", "Superior parietal lobule", {
  status: "buildable", dir: "superior", zoom: "structure", mode: "layered", focus: ["Superior parietal lobule"],
  obj: ["Xác định tiểu thuỳ đỉnh trên phía trên rãnh nội đỉnh"],
});
N("temporal-lobe", "nervous-cerebrum", "C", "structure", "Thuỳ thái dương", "Temporal lobe", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["CORTEX còn lại ghost"],
  focus: ["Superior temporal gyrus (anterior + posterior part)", "Middle/Inferior temporal gyrus", "Fusiform gyrus"], note: lobeNote + " Hồi cạnh hải mã thuộc hệ viền (LIMBIC_GYRI), không tính vào đây.",
  obj: ["Xác định thuỳ thái dương dưới rãnh bên", "Kể tên ba hồi thái dương mặt ngoài"],
});
N("superior-temporal-gyrus", "temporal-lobe", "C", "structure", "Hồi thái dương trên", "Superior temporal gyrus", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", focus: ["Anterior/Posterior part of superior temporal gyrus"],
  obj: ["Xác định hồi thái dương trên ngay dưới rãnh bên"],
});
N("transverse-temporal-gyri", "superior-temporal-gyrus", "C", "structure", "Hồi ngang thái dương (Heschl)", "Transverse temporal gyri (Heschl)", {
  status: "import-za", dir: "superior", zoom: "detail", mode: "layered", context: ["TEMPORAL_LOBE ghost", "ẩn thuỳ đỉnh/trán (mở rãnh bên)"], focus: ["Transverse temporal gyri", "Temporal plane"],
  obj: ["Định vị hồi ngang thái dương ở sàn rãnh bên"],
});
N("primary-auditory-cortex", "transverse-temporal-gyri", "C", "region", "Vỏ thính giác nguyên phát", "Primary auditory cortex", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn trên Transverse temporal gyri"],
  obj: ["Liên hệ hồi ngang thái dương với xử lý âm thanh"],
});
N("wernicke-area", "superior-temporal-gyrus", "C", "region", "Vùng Wernicke", "Wernicke's area", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn trên phần sau hồi thái dương trên"],
  note: "Ranh giới vùng Wernicke không thống nhất giữa các tài liệu → nhãn xấp xỉ, câu chữ bắt buộc qua science-editor (open question).",
  obj: ["Định vị vùng Wernicke ở phần sau hồi thái dương trên"],
});
N("temporal-gyri-other", "temporal-lobe", "C", "structure", "Hồi thái dương giữa, dưới và hồi chẩm – thái dương ngoài", "Middle and inferior temporal gyri, fusiform gyrus", {
  status: "buildable", dir: [0.6, -0.5, 0.6], zoom: "structure", mode: "layered", focus: ["Middle temporal gyrus", "Inferior temporal gyrus", "Fusiform gyrus"],
  obj: ["Xác định hồi thái dương giữa, dưới và hồi hình thoi ở mặt dưới"],
});
N("occipital-lobe", "nervous-cerebrum", "C", "structure", "Thuỳ chẩm", "Occipital lobe", {
  status: "buildable", dir: "back", zoom: "structure", mode: "layered", context: ["CORTEX còn lại ghost"], focus: ["Occipital lobe (BP3D, 1 mảnh mỗi bên)"], note: lobeNote,
  obj: ["Xác định thuỳ chẩm ở cực sau bán cầu"],
});
N("occipital-gyri", "occipital-lobe", "C", "structure", "Chêm, hồi lưỡi và rãnh cựa", "Cuneus, lingual gyrus and calcarine sulcus", {
  status: "import-za", dir: [-1, 0, -0.2], zoom: "structure", mode: "layered", context: ["ẩn bán cầu đối diện (mặt trong)"],
  focus: ["Cuneus", "Lingual gyrus", "Calcarine sulcus", "Superior occipital gyri", "Lateral occipital gyrus", "Occipital pole"],
  note: "BP3D chỉ có thuỳ chẩm nguyên khối; ZA chia hồi → khử trùng.",
  obj: ["Xác định rãnh cựa giữa chêm và hồi lưỡi ở mặt trong thuỳ chẩm"],
});
N("primary-visual-cortex", "occipital-gyri", "C", "region", "Vỏ thị giác nguyên phát", "Primary visual cortex", {
  status: "needs-schema", zoom: "detail", mode: "layered", focus: ["nhãn hai bờ rãnh cựa"],
  obj: ["Liên hệ vùng quanh rãnh cựa với thị giác", "Nối với đường thị giác (dây II → dải thị → thể gối ngoài)"],
});
N("insula", "nervous-cerebrum", "C", "structure", "Thuỳ đảo", "Insula", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["ẩn nắp trán/đỉnh/thái dương để lộ đảo"], focus: ["Insula (BP3D)", "Circular sulcus of insula (ZA, tuỳ chọn)"],
  obj: ["Xác định thuỳ đảo nằm sâu trong rãnh bên, bị các nắp che"],
});
N("medial-surface-hemisphere", "nervous-cerebrum", "C", "group", "Mặt trong bán cầu", "Medial surface of the hemisphere", {
  status: "import-za", dir: [-1, 0, 0], zoom: "organ", mode: "layered", context: ["chỉ lấy mảnh bên trái"],
  focus: ["Cingulate gyrus", "Precuneus", "Paracentral gyrus", "Cuneus", "Lingual gyrus", "Straight gyrus", "Corpus callosum"],
  note: "Dựng được bằng rule chỉ khớp mảnh `left …` + camera từ phía phải; không cần clipping.",
  obj: ["Đọc mặt trong bán cầu: hồi đai, tiểu thuỳ cạnh trung tâm, trước chêm, chêm"],
});

// ================================================================ D. Hệ viền
N("nervous-limbic", "nervous-brain", "D", "group", "Hệ viền", "Limbic system", {
  status: "live", existing: "nervous-limbic", dir: "side", zoom: "organ", mode: "layered", context: ["CEREBRAL_WHITE", "DIENCEPHALON", "BRAINSTEM"],
  obj: ["Kể tên các cấu trúc chính của hệ viền", "Theo vòng hải mã → vòm não → thể vú"],
});
N("hippocampus", "nervous-limbic", "D", "structure", "Hải mã", "Hippocampus", {
  status: "buildable", dir: "three-quarter", zoom: "structure", mode: "layered", context: ["LATERAL_VENTRICLES", "FORNIX"], focus: ["Hippocampus"],
  note: "Đang gộp trong structure `hippocampus-amygdala` → tách thành hippocampus, amygdala, septum; đổi id cũ thành group.",
  obj: ["Định vị hải mã ở sàn sừng thái dương não thất bên"],
});
N("amygdala", "nervous-limbic", "D", "structure", "Thể hạnh nhân", "Amygdala", {
  status: "buildable", dir: "three-quarter", zoom: "structure", mode: "layered", context: ["HIPPOCAMPUS", "TEMPORAL_LOBE ghost"], focus: ["Amygdala"],
  obj: ["Định vị thể hạnh nhân trước hải mã, trong thuỳ thái dương"],
});
N("fornix", "nervous-limbic", "D", "structure", "Vòm não", "Fornix", {
  status: "live", existing: "fornix", dir: "three-quarter", zoom: "structure", mode: "layered", context: ["HIPPOCAMPUS", "MAMMILLARY"],
  obj: ["Theo đường vòm não từ hải mã tới thể vú"],
});
N("mammillary-body", "nervous-limbic", "D", "structure", "Thể vú", "Mammillary bodies", {
  status: "live", existing: "mammillary-body", dir: "three-quarter", zoom: "detail", mode: "layered", context: ["HYPOTHALAMUS"],
  obj: ["Định vị thể vú ở mặt dưới vùng dưới đồi"],
});
N("limbic-gyri", "nervous-limbic", "D", "structure", "Hồi đai và hồi cạnh hải mã", "Cingulate and parahippocampal gyri", {
  status: "live", existing: "limbic-gyri", dir: "three-quarter", zoom: "structure", mode: "layered",
  obj: ["Xác định hồi đai bao quanh thể chai"],
});
N("septal-area", "nervous-limbic", "D", "structure", "Vách trong suốt và nhân vách", "Septum pellucidum and septal nuclei", {
  status: "buildable", partial: true, dir: "side", zoom: "detail", mode: "layered", focus: ["Septum of telencephalon (BP3D)", "Septal nuclei + Septum pellucidum (ZA, tuỳ chọn)"],
  obj: ["Định vị vách trong suốt giữa hai não thất bên"],
});

// ================================================================ E. Gian não
N("nervous-deep-brain", "nervous-brain", "E", "group", "Gian não và nhân nền", "Diencephalon and basal nuclei", {
  status: "live", existing: "nervous-deep-brain", dir: "three-quarter", zoom: "organ", mode: "layered", context: ["CEREBRAL_WHITE", "BRAINSTEM"],
  obj: ["Kể tên ba phần gian não: đồi thị, vùng dưới đồi, vùng trên đồi"],
});
N("thalamus", "nervous-deep-brain", "E", "structure", "Đồi thị", "Thalamus", {
  status: "buildable", dir: "three-quarter", zoom: "structure", mode: "layered", context: ["THIRD_VENTRICLE", "INTERNAL_CAPSULE"], focus: ["Thalamus"],
  note: "Đang gộp trong `diencephalon`. Tách → `diencephalon` thành group.",
  obj: ["Định vị đồi thị hai bên não thất ba", "Hiểu đồi thị là trạm chuyển tiếp lên vỏ não"],
});
N("thalamic-nuclei", "thalamus", "E", "region", "Các nhân đồi thị", "Thalamic nuclei", {
  status: "missing", obj: ["Phân biệt nhóm nhân trước, trong, ngoài của đồi thị"],
  note: "Không nguồn đã vet có nhân đồi thị. Ứng viên tương lai: atlas não mã nguồn mở (cần kiểm giấy phép trước).",
});
N("geniculate-bodies", "thalamus", "E", "structure", "Thể gối ngoài và thể gối trong", "Lateral and medial geniculate bodies", {
  status: "buildable", dir: [-0.5, -0.3, -0.8], zoom: "detail", mode: "layered", context: ["THALAMUS ghost", "OPTIC tract"], focus: ["Lateral geniculate body", "Medial geniculate body"],
  obj: ["Liên hệ thể gối ngoài với thị giác, thể gối trong với thính giác"],
});
N("hypothalamus", "nervous-deep-brain", "E", "structure", "Vùng dưới đồi", "Hypothalamus", {
  status: "buildable", dir: "side", zoom: "structure", mode: "layered", context: ["THALAMUS", "pituitary (mượn endocrine)"], focus: ["Hypothalamus", "Tuber cinereum"],
  obj: ["Định vị vùng dưới đồi dưới đồi thị, trên tuyến yên"],
});
N("hypothalamic-nuclei", "hypothalamus", "E", "region", "Các nhân vùng dưới đồi", "Hypothalamic nuclei", {
  status: "missing", obj: ["Nhận ra vùng dưới đồi gồm nhiều nhóm nhân"],
});
N("epithalamus", "nervous-deep-brain", "E", "structure", "Vùng trên đồi", "Epithalamus", {
  status: "buildable", dir: [0, 0.3, -1], zoom: "detail", mode: "layered", context: ["THALAMUS"],
  focus: ["Habenula", "Stria medullaris of thalamus", "Posterior commissure", "pineal-gland (mượn endocrine qua export)"],
  obj: ["Kể tên thành phần vùng trên đồi: củ cương, vân tuỷ, tuyến tùng"],
});

// ================================================================ F. Dây sọ
N("nervous-cranial-nerves", "sec-pns", "F", "group", "Dây thần kinh sọ", "Cranial nerves", {
  status: "live", existing: "nervous-cranial-nerves", partial: true, dir: "three-quarter", zoom: "region", mode: "layered", context: ["BRAINSTEM", SKULL],
  obj: ["Kể tên và số thứ tự 12 đôi dây sọ", "Xác định nơi mỗi dây rời não"],
});
const CN = [
  ["cn-i-olfactory", "Dây khứu giác (I)", "Olfactory nerve (I)", "import-za", null, "superior", ["Olfactory nerve (I) — curve ZA"], "Hành khứu, dải khứu không có trong nguồn nào."],
  ["optic-pathway", "Dây, giao thoa và dải thị giác (II)", "Optic nerve, chiasm and tract (II)", "live", "optic-pathway", "superior"],
  ["oculomotor-nerve", "Dây vận nhãn (III)", "Oculomotor nerve (III)", "live", "oculomotor-nerve", [-0.8, 0.35, 0.5]],
  ["trochlear-nerve", "Dây ròng rọc (IV)", "Trochlear nerve (IV)", "live", "trochlear-nerve", "superior"],
  ["cn-v-trigeminal", "Dây sinh ba (V)", "Trigeminal nerve (V)", "live", null, "anterolateral", ["ophthalmic-nerve", "maxillary-nerve", "mandibular-nerve", "Motor/Sensory root of trigeminal nerve (ZA)"], "Group mới gom V1–V3 sẵn có; rễ nhập ZA; hạch sinh ba thiếu → partial."],
  ["cn-vi-abducens", "Dây vận nhãn ngoài (VI)", "Abducens nerve (VI)", "import-za", null, [-0.8, 0.35, 0.5], ["Abducens nerve (VI) — curve ZA"]],
  ["facial-nerve", "Dây mặt (VII) và thừng nhĩ", "Facial nerve (VII) and chorda tympani", "live", "facial-nerve", "side"],
  ["vestibulocochlear-nerve", "Dây tiền đình – ốc tai (VIII)", "Vestibulocochlear nerve (VIII)", "live", "vestibulocochlear-nerve", "side"],
  ["glossopharyngeal-nerve", "Dây thiệt hầu (IX)", "Glossopharyngeal nerve (IX)", "live", "glossopharyngeal-nerve", "side"],
  ["nervous-vagus", "Dây phế vị (X)", "Vagus nerve (X)", "live", "nervous-vagus", "anterolateral"],
  ["accessory-nerve", "Dây phụ (XI)", "Accessory nerve (XI)", "live", "accessory-nerve", "side"],
  ["hypoglossal-nerve", "Dây hạ thiệt (XII)", "Hypoglossal nerve (XII)", "live", "hypoglossal-nerve", "side"],
];
for (const [id, vi, en, status, existing, dir, focus, note] of CN) {
  N(id, "nervous-cranial-nerves", "F", id === "cn-v-trigeminal" || id === "nervous-vagus" ? "group" : "structure", vi, en, {
    status, existing: existing ?? undefined, dir, zoom: "structure", mode: "layered", context: ["BRAINSTEM", SKULL, "cranial-nerve-nuclei (khi có)"],
    focus, note, partial: id === "cn-v-trigeminal" || id === "cn-i-olfactory",
    obj: [`Theo đường đi của ${vi.split(" (")[0].toLowerCase()} từ não tới vùng chi phối`, "Phân loại dây: cảm giác, vận động hay hỗn hợp"],
  });
}
for (const [id, vi, en, ex, dir] of [
  ["ophthalmic-nerve", "Dây thần kinh mắt (V1) và hạch mi", "Ophthalmic nerve (V1) and ciliary ganglion", "ophthalmic-nerve", [-0.8, 0.35, 0.5]],
  ["maxillary-nerve", "Dây thần kinh hàm trên (V2)", "Maxillary nerve (V2)", "maxillary-nerve", "anterolateral"],
  ["mandibular-nerve", "Dây thần kinh hàm dưới (V3) và nhánh", "Mandibular nerve (V3) and branches", "mandibular-nerve", "anterolateral"],
]) {
  N(id, "cn-v-trigeminal", "F", "structure", vi, en, { status: "live", existing: ex, dir, zoom: "structure", mode: "layered", context: [SKULL], obj: [`Xác định vùng da và cơ do ${vi.split(" (")[0].toLowerCase()} chi phối`] });
}
N("trigeminal-roots", "cn-v-trigeminal", "F", "structure", "Rễ cảm giác và rễ vận động dây V", "Sensory and motor roots of the trigeminal nerve", {
  status: "import-za", dir: "side", zoom: "detail", mode: "layered", context: ["PONS"], focus: ["Sensory root of trigeminal nerve", "Motor root of trigeminal nerve"],
  obj: ["Định vị nơi dây V rời mặt bên cầu não"],
});
N("trigeminal-ganglion", "cn-v-trigeminal", "F", "structure", "Hạch sinh ba", "Trigeminal ganglion", { status: "missing", obj: ["Định vị hạch sinh ba ở đỉnh xương đá"] });
N("vagus-nerves", "nervous-vagus", "F", "structure", "Dây phế vị hai bên", "Vagus nerves", {
  status: "live", existing: "vagus-nerves", note: "Structure khai ở views-respiratory.ts — dùng lại, không khai trùng.", dir: "anterolateral", zoom: "structure", mode: "layered",
  obj: ["Theo dây phế vị từ cổ xuống ngực và bụng"],
});

// ================================================================ G. Tự chủ
N("nervous-autonomic", "sec-pns", "G", "group", "Hệ thần kinh tự chủ", "Autonomic nervous system", {
  status: "live", existing: "nervous-autonomic", partial: true, dir: "front", zoom: "region", mode: "layered", context: ["HEART", "ABDOMINAL_VISCERA", "SPINE"],
  obj: ["Phân biệt ba phân hệ: giao cảm, đối giao cảm, ruột", "Nhận ra chuỗi hai neuron (trước hạch – sau hạch)"],
});
N("sympathetic", "nervous-autonomic", "G", "group", "Phân hệ giao cảm", "Sympathetic division", {
  status: "live", existing: "sympathetic-trunk", partial: true, dir: "anterolateral", zoom: "region", mode: "layered", context: ["SPINE", "RIBS"],
  obj: ["Xác định thân giao cảm hai bên cột sống", "Hiểu nguồn gốc ngực – thắt lưng của sợi giao cảm"],
  note: "Thiếu hạch trước sống (tạng, mạc treo), dây tạng — không nguồn nào có.",
});
N("sympathetic-ganglia", "sympathetic", "G", "structure", "Hạch thân giao cảm", "Sympathetic trunk ganglia", {
  status: "import-za", dir: "anterolateral", zoom: "structure", mode: "layered", context: ["sympathetic-trunk"], focus: ["Ganglia of sympathetic trunk"],
  obj: ["Nhận ra chuỗi hạch cạnh sống dọc thân giao cảm"],
});
N("intermediolateral-column", "sympathetic", "G", "region", "Cột trung gian ngoài tuỷ sống", "Intermediolateral cell column", {
  status: "import-za", zoom: "detail", mode: "layered", context: ["SPINAL_CORD ghost"], focus: ["Intermediolateral nucleus", "Lateral intermediate substance"],
  obj: ["Định vị neuron trước hạch giao cảm ở sừng bên tuỷ sống"],
});
N("prevertebral-ganglia", "sympathetic", "G", "structure", "Hạch trước sống và dây tạng", "Prevertebral ganglia and splanchnic nerves", { status: "missing", obj: ["Định vị hạch tạng quanh động mạch chủ bụng"] });
N("parasympathetic", "nervous-autonomic", "G", "group", "Phân hệ đối giao cảm", "Parasympathetic division", {
  status: "buildable", partial: true, dir: "front", zoom: "region", mode: "layered", context: [SKULL, "HEART", "ABDOMINAL_VISCERA"],
  focus: ["VAGUS (mượn views-respiratory)", "ciliary ganglion (trong OPHTHALMIC)", "chorda tympani (trong FACIAL)", "nhân Edinger-Westphal, nhân nước bọt (ZA)"],
  note: "Thiếu hạch chân bướm – khẩu cái, hạch tai, hạch dưới hàm, dây tạng chậu (đối giao cảm cùng). Group mới chỉ được nổi bật đúng HỢP các structure sẵn có (test phủ đủ).",
  obj: ["Nhận ra nguồn gốc sọ – cùng của sợi đối giao cảm", "Kể bốn dây sọ mang sợi đối giao cảm"],
});
N("parasympathetic-cranial", "parasympathetic", "G", "structure", "Đối giao cảm phần sọ", "Cranial parasympathetic outflow", {
  status: "buildable", partial: true, zoom: "structure", mode: "layered", focus: ["vagus-nerves", "ciliary ganglion", "chorda tympani", "Accessory nucleus of oculomotor nerve, Superior/Inferior salivatory nucleus, Posterior nucleus of vagus (ZA)"],
  obj: ["Liên hệ dây III, VII, IX, X với hạch đối giao cảm tương ứng"],
});
N("parasympathetic-sacral", "parasympathetic", "G", "structure", "Đối giao cảm phần cùng (dây tạng chậu)", "Sacral parasympathetic outflow (pelvic splanchnic nerves)", { status: "missing", obj: ["Định vị dây tạng chậu từ đoạn tuỷ cùng"] });
N("enteric", "nervous-autonomic", "G", "group", "Hệ thần kinh ruột", "Enteric nervous system", {
  status: "missing", obj: ["Phân biệt đám rối cơ ruột với đám rối dưới niêm mạc"],
  note: "Cấu trúc vi thể trong thành ống tiêu hoá — không hợp mesh toàn thân. Đề xuất: sơ đồ lát cắt thành ruột 2D/3D tự dựng, qua science-editor.",
});

// ================================================================ H. Tuỷ sống
N("nervous-spinal-cord", "sec-cns", "H", "group", "Tuỷ sống và rễ thần kinh", "Spinal cord and nerve roots", {
  status: "live", existing: "nervous-spinal-cord", dir: "back", zoom: "region", mode: "layered", context: ["SPINE"],
  obj: ["Xác định tuỷ sống trong ống sống và nơi tuỷ kết thúc", "Phân biệt rễ trước (vận động) với rễ sau (cảm giác)"],
});
const segNote = "Tuỷ là một khối liền, không có mảnh theo đoạn → cần mặt cắt theo cao độ. Lưu ý giải phẫu: đoạn tuỷ nằm CAO hơn đốt sống cùng số, không cắt theo đốt sống.";
for (const [id, vi, en] of [
  ["spinal-cord-cervical", "Tuỷ cổ (C1–C8)", "Cervical spinal cord (C1–C8)"],
  ["spinal-cord-thoracic", "Tuỷ ngực (T1–T12)", "Thoracic spinal cord (T1–T12)"],
  ["spinal-cord-lumbar", "Tuỷ thắt lưng (L1–L5)", "Lumbar spinal cord (L1–L5)"],
  ["spinal-cord-sacral", "Tuỷ cùng và nón tuỷ", "Sacral spinal cord and conus medullaris"],
]) {
  N(id, "nervous-spinal-cord", "H", "region", vi, en, {
    status: "needs-clipping", dir: "back", zoom: "structure", mode: "layered", context: ["SPINE", "đoạn tuỷ khác ghost"], note: segNote,
    obj: [`Định vị ${vi.split(" (")[0].toLowerCase()} so với đốt sống`, "Liên hệ đoạn tuỷ với đám rối và vùng chi phối"],
  });
}
N("spinal-cord", "nervous-spinal-cord", "H", "structure", "Tuỷ sống (chất xám, chất trắng)", "Spinal cord (grey and white matter)", {
  status: "live", existing: "spinal-cord", dir: "back", zoom: "structure", mode: "layered", obj: ["Phân biệt sừng trước, sừng sau và chất trắng"],
});
N("spinal-tracts", "spinal-cord", "H", "region", "Các bó chất trắng tuỷ sống", "Spinal cord tracts", {
  status: "import-za", dir: "superior", zoom: "detail", mode: "layered", context: ["SPINAL_CORD ghost"],
  focus: ["Lateral/Anterior corticospinal tract", "Lateral/Anterior spinothalamic tract", "Gracile/Cuneate fasciculus", "Anterior/Posterior spinocerebellar tract", "Rubrospinal, Tectospinal, Vestibulospinal, Reticulospinal tracts", "Fasciculi proprii"],
  note: "Thấy rõ nhất trên lát cắt ngang → kết hợp needs-clipping.",
  obj: ["Phân biệt bó đi lên (cảm giác) với bó đi xuống (vận động)", "Định vị bó vỏ – tuỷ bên và cột sau"],
});
N("spinal-roots", "nervous-spinal-cord", "H", "structure", "Rễ và hạch gai", "Spinal roots and ganglia", { status: "live", existing: "spinal-roots", dir: "back", zoom: "structure", mode: "layered", obj: ["Định vị hạch gai trên rễ sau"] });
N("cauda-equina", "nervous-spinal-cord", "H", "structure", "Chùm đuôi ngựa", "Cauda equina", { status: "live", existing: "cauda-equina", dir: "back", zoom: "structure", mode: "layered", obj: ["Hiểu vì sao rễ thắt lưng – cùng chạy dài xuống dưới nón tuỷ"] });
N("spinal-dura", "nervous-spinal-cord", "H", "structure", "Màng cứng tuỷ", "Spinal dura mater", { status: "live", existing: "spinal-dura", dir: "back", zoom: "structure", mode: "layered", obj: ["Xác định bao màng cứng quanh tuỷ và rễ"] });

// ================================================================ I. Đám rối
N("sec-plexuses", "sec-pns", "I", "section", "Đám rối thần kinh", "Nerve plexuses", {
  status: "live", obj: ["Hiểu đám rối là nơi nhánh trước dây gai sống đan nối", "Kể tên bốn đám rối gai sống chính"],
});
N("cervical-plexus", "sec-plexuses", "I", "group", "Đám rối cổ", "Cervical plexus", {
  status: "missing", obj: ["Định vị đám rối cổ (C1–C4)", "Nhận ra dây hoành là nhánh quan trọng của đám rối cổ"],
  note: "Không nguồn đã vet có đám rối cổ. HAA tile 8 (Phrenic) cũng thiếu → `nervous-phrenic` đang mang `missing` trên main.",
});
N("nervous-phrenic", "cervical-plexus", "I", "structure", "Dây thần kinh hoành", "Phrenic nerves", { status: "missing", existing: "nervous-phrenic", obj: ["Theo dây hoành từ cổ xuống cơ hoành"] });
N("brachial-plexus-group", "sec-plexuses", "I", "group", "Đám rối cánh tay", "Brachial plexus", {
  status: "live", existing: "nervous-upper-limb", dir: "front", zoom: "region", mode: "layered", context: ["UPPER_LIMB_BONES", "CLAVICLE"],
  obj: ["Đọc sơ đồ rễ → thân → ngành → bó → nhánh tận", "Kể năm nhánh tận của đám rối cánh tay"],
});
N("brachial-plexus", "brachial-plexus-group", "I", "structure", "Đám rối cánh tay (rễ, thân, ngành, bó)", "Brachial plexus (roots, trunks, divisions, cords)", {
  status: "live", existing: "brachial-plexus", dir: "front", zoom: "structure", mode: "layered",
  obj: ["Phân biệt thân trên, giữa, dưới và bó ngoài, trong, sau"],
});
for (const [id, vi, en, f] of [
  ["brachial-plexus-roots", "Rễ đám rối cánh tay", "Roots of the brachial plexus", "roots of brachial plexus"],
  ["brachial-plexus-trunks", "Thân đám rối cánh tay", "Trunks of the brachial plexus", "superior/middle/inferior trunk"],
  ["brachial-plexus-divisions", "Ngành trước và sau", "Anterior and posterior divisions", "anterior/posterior division of … trunk"],
  ["brachial-plexus-cords", "Bó đám rối cánh tay", "Cords of the brachial plexus", "posterior cord (ZA chỉ có bó sau riêng)"],
]) {
  N(id, "brachial-plexus", "I", "region", vi, en, {
    status: "buildable", partial: id === "brachial-plexus-cords", dir: "front", zoom: "detail", mode: "layered", context: ["phần đám rối còn lại ghost"], focus: [f],
    note: id === "brachial-plexus-cords" ? "ZA chỉ tách riêng bó sau; bó ngoài/trong không có mảnh riêng → partial." : undefined,
    obj: [`Xác định ${vi.toLowerCase()} trong sơ đồ đám rối`],
  });
}
N("brachial-plexus-collaterals", "brachial-plexus-group", "I", "structure", "Nhánh bên của đám rối cánh tay", "Collateral branches of the brachial plexus", {
  status: "live", existing: "brachial-plexus-collaterals", dir: "front", zoom: "structure", mode: "layered", obj: ["Kể nhánh bên: vai sau, ngực dài, trên vai, ngực ngoài/trong, dưới vai, ngực lưng"],
});
N("lumbar-plexus", "sec-plexuses", "I", "group", "Đám rối thắt lưng", "Lumbar plexus", {
  status: "buildable", partial: true, dir: "front", zoom: "region", mode: "layered", context: ["LUMBAR_SPINE", "HIP_BONE", "psoas major (mượn muscular)"],
  focus: ["lumbar-plexus-branches", "femoral-nerve", "obturator-nerve"],
  note: "Chỉ có nhánh, không có thân đám rối trong cơ thắt lưng lớn → partial. Hiện gộp trong `nervous-lower-limb`.",
  obj: ["Định vị đám rối thắt lưng (L1–L4) trong cơ thắt lưng lớn", "Kể nhánh: chậu hạ vị, chậu bẹn, sinh dục đùi, bì đùi ngoài, đùi, bịt"],
});
N("lumbar-plexus-branches", "lumbar-plexus", "I", "structure", "Thần kinh chậu hạ vị, chậu bẹn, sinh dục đùi và bì đùi ngoài", "Iliohypogastric, ilio-inguinal, genitofemoral and lateral femoral cutaneous nerves", {
  status: "live", existing: "lumbar-plexus-branches", dir: "front", zoom: "structure", mode: "layered", obj: ["Xác định nhánh đám rối thắt lưng ở thành bụng và đùi"],
});
N("obturator-nerve", "lumbar-plexus", "I", "structure", "Thần kinh bịt", "Obturator nerve", { status: "live", existing: "obturator-nerve", dir: "front", zoom: "structure", mode: "layered", obj: ["Theo thần kinh bịt qua lỗ bịt tới vùng đùi trong"] });
N("sacral-plexus", "sec-plexuses", "I", "group", "Đám rối cùng", "Sacral plexus", {
  status: "buildable", partial: true, dir: "back", zoom: "region", mode: "layered", context: ["SACRUM", "HIP_BONE", "piriformis (mượn muscular)"],
  focus: ["sacral-plexus-branches", "nervous-sciatic"], note: "Chỉ có nhánh, không có thân đám rối trên cơ hình lê → partial.",
  obj: ["Định vị đám rối cùng (L4–S4) trước cơ hình lê", "Kể nhánh: ngồi, mông trên/dưới, thẹn, bì đùi sau"],
});
N("sacral-plexus-branches", "sacral-plexus", "I", "structure", "Thần kinh mông, thẹn, bì đùi sau và các nhánh cơ", "Gluteal, pudendal, posterior femoral cutaneous and muscular branches", {
  status: "live", existing: "sacral-plexus-branches", dir: "back", zoom: "structure", mode: "layered", obj: ["Theo thần kinh thẹn tới đáy chậu"],
});

// ================================================================ J. Thần kinh ngoại biên chính
N("sec-peripheral-nerves", "sec-pns", "J", "section", "Thần kinh ngoại biên chính", "Major peripheral nerves", {
  status: "live", obj: ["Theo đường đi của từng thần kinh chính từ đám rối tới cơ và da", "Liên hệ vị trí thần kinh với điểm dễ tổn thương"],
});
const PN = [
  ["nervous-sciatic", "sacral-plexus", "Thần kinh ngồi và các nhánh", "Sciatic nerve and its branches", "back", "nervous-sciatic", ["Theo thần kinh ngồi từ dưới cơ hình lê xuống hố khoeo", "Xác định nơi chia thành thần kinh chày và mác chung"]],
  ["femoral-nerve", "lumbar-plexus", "Thần kinh đùi và thần kinh hiển", "Femoral and saphenous nerves", "front", null, ["Theo thần kinh đùi dưới dây chằng bẹn", "Nhận ra thần kinh hiển là nhánh cảm giác dài nhất"]],
  ["radial-nerve", "brachial-plexus", "Thần kinh quay", "Radial nerve", "back", null, ["Theo thần kinh quay quanh mặt sau xương cánh tay", "Phân biệt nhánh nông và nhánh sâu (gian cốt sau)"]],
  ["ulnar-nerve", "brachial-plexus", "Thần kinh trụ", "Ulnar nerve", "front", null, ["Theo thần kinh trụ sau mỏm trên lồi cầu trong", "Phân biệt nhánh nông, sâu và nhánh mu tay"]],
  ["median-nerve", "brachial-plexus", "Thần kinh giữa", "Median nerve", "front", null, ["Theo thần kinh giữa qua ống cổ tay", "Nhận ra nhánh gian cốt trước"]],
  ["tibial-nerve", "nervous-sciatic", "Thần kinh chày và thần kinh gan chân", "Tibial and plantar nerves", "back", null, ["Theo thần kinh chày qua hố khoeo xuống sau mắt cá trong", "Phân biệt thần kinh gan chân trong và ngoài"]],
];
for (const [id, parent, vi, en, dir, groupId, obj] of PN) {
  N(id, parent, "J", groupId ? "group" : "structure", vi, en, {
    status: "live", existing: groupId ?? id, dir, zoom: "structure", mode: "layered", context: ["xương chi ghost", "cơ chi ghost (đề xuất)"], obj, featured: true,
  });
}
N("sciatic-nerve", "nervous-sciatic", "J", "structure", "Thân thần kinh ngồi", "Sciatic nerve trunk", { status: "live", existing: "sciatic-nerve", dir: "back", zoom: "structure", mode: "layered", obj: ["Xác định thân thần kinh ngồi ở mặt sau đùi"] });
N("fibular-nerves", "nervous-sciatic", "J", "structure", "Thần kinh mác chung, nông và sâu", "Common, superficial and deep fibular nerves", { status: "live", existing: "fibular-nerves", dir: "front", zoom: "structure", mode: "layered", obj: ["Theo thần kinh mác chung vòng quanh cổ xương mác"] });
N("sural-nerve", "nervous-sciatic", "J", "structure", "Thần kinh bắp chân", "Sural nerve", { status: "live", existing: "sural-nerve", dir: "back", zoom: "structure", mode: "layered", obj: ["Xác định thần kinh bắp chân sau mắt cá ngoài"] });
for (const [id, vi, en] of [
  ["musculocutaneous-nerve", "Thần kinh cơ bì", "Musculocutaneous nerve"],
  ["axillary-nerve", "Thần kinh nách", "Axillary nerve"],
  ["medial-cutaneous-nerves-arm", "Thần kinh bì cánh tay trong và bì cẳng tay trong", "Medial brachial and antebrachial cutaneous nerves"],
]) N(id, "brachial-plexus", "J", "structure", vi, en, { status: "live", existing: id, dir: id === "axillary-nerve" ? "back" : "front", zoom: "structure", mode: "layered", obj: [`Theo đường đi của ${vi.toLowerCase()}`] });
// Cấp 4: nhánh — mảnh ZA đã có, chỉ cần tách
for (const [id, parent, vi, en, f] of [
  ["median-nerve-branches", "median-nerve", "Nhánh thần kinh giữa ở bàn tay", "Branches of the median nerve in the hand", "palmar branch, common/proper palmar digital branches, muscular branches of median nerve"],
  ["ulnar-nerve-branches", "ulnar-nerve", "Nhánh nông, sâu và mu tay của thần kinh trụ", "Superficial, deep and dorsal branches of the ulnar nerve", "superficial/deep/dorsal/palmar branch, digital branches of ulnar nerve"],
  ["radial-nerve-branches", "radial-nerve", "Nhánh nông, nhánh sâu và gian cốt sau", "Superficial, deep and posterior interosseous branches", "superficial/deep branch of radial nerve, posterior interosseous nerve, dorsal digital branches"],
  ["plantar-nerves", "tibial-nerve", "Thần kinh gan chân trong và ngoài", "Medial and lateral plantar nerves", "medial/lateral plantar nerve + digital branches"],
]) {
  N(id, parent, "J", "region", vi, en, { status: "buildable", dir: id === "plantar-nerves" ? [0, -1, 0.2] : "front", zoom: "detail", mode: "layered", context: ["xương bàn tay/chân ghost"], focus: [f], obj: [`Phân biệt các nhánh: ${vi.toLowerCase()}`] });
}

// ================================================================ K. Cơ quan cảm giác (mượn hệ sensory/digestive — không nhân bản)
N("sec-sensory-organs", "nervous-overview", "K", "section", "Cơ quan cảm giác liên quan thần kinh", "Sense organs and their nerves", {
  status: "live", note: "Mượn góc nhìn hệ giác quan/tiêu hoá/da bằng id sẵn có — không khai lại trong views-nervous.ts (quy ước trên main).",
  obj: ["Nối mỗi cơ quan cảm giác với dây thần kinh và vùng vỏ não của nó"],
});
N("sensory-eyeball", "sec-sensory-organs", "K", "group", "Mắt", "Eye", { status: "live", existing: "sensory-eyeball", borrowed: "sensory", dir: [-0.6, 0.2, 0.8], zoom: "organ", mode: "layered", obj: ["Kể ba lớp vỏ nhãn cầu", "Theo đường ánh sáng qua giác mạc, thể thuỷ tinh tới võng mạc"] });
N("retina", "sensory-eyeball", "K", "structure", "Võng mạc", "Retina", {
  status: "live", existing: "retina", borrowed: "sensory", partial: true, dir: [-0.6, 0.2, 0.8], zoom: "structure", mode: "layered",
  note: "Chỉ phần thị giác của võng mạc (1 lớp mesh); hoàng điểm, đĩa thị, các lớp tế bào không có → cần sơ đồ lát cắt riêng.",
  obj: ["Định vị võng mạc ở lớp trong cùng nhãn cầu", "Nối võng mạc với dây thị giác (II)"],
});
N("lens", "sensory-eyeball", "K", "structure", "Thể thuỷ tinh và dây chằng treo", "Lens and zonular fibres", { status: "live", existing: "lens", borrowed: "sensory", zoom: "structure", mode: "layered", obj: ["Xác định thể thuỷ tinh treo bằng dây chằng mi"] });
N("sensory-lacrimal", "sensory-eyeball", "K", "group", "Bộ lệ", "Lacrimal apparatus", { status: "live", existing: "sensory-lacrimal", borrowed: "sensory", zoom: "structure", mode: "layered", obj: ["Theo đường nước mắt từ tuyến lệ xuống ống lệ mũi"] });
N("sensory-ear", "sec-sensory-organs", "K", "group", "Tai", "Ear", {
  status: "live", existing: "sensory-ear", borrowed: "sensory", partial: true, dir: "side", zoom: "organ", mode: "layered",
  note: "Hiện chỉ có tai ngoài + dây VIII. Thêm tai giữa/trong bằng ZA.", obj: ["Phân biệt tai ngoài, tai giữa, tai trong"],
});
N("middle-ear", "sensory-ear", "K", "structure", "Tai giữa: màng nhĩ, chuỗi xương con, vòi tai", "Middle ear: tympanic membrane, ossicles, auditory tube", {
  status: "import-za", dir: [0.3, 0.2, 1], zoom: "detail", mode: "layered", context: ["TEMPORAL_BONE ghost 15%"], focus: ["Tympanic membrane", "Malleus", "Incus", "Stapes", "Auditory tube"],
  obj: ["Kể ba xương con theo thứ tự truyền âm", "Định vị vòi tai nối tai giữa với hầu"],
});
N("inner-ear", "sensory-ear", "K", "group", "Tai trong", "Inner ear", {
  status: "import-za", partial: true, dir: [0.3, 0.2, 1], zoom: "detail", mode: "layered", context: ["TEMPORAL_BONE ghost", "middle-ear"], focus: ["Cochlea", "Vestibule", "cochlear/vestibular nerve"],
  note: "ZA có ốc tai + tiền đình nhưng KHÔNG thấy ống bán khuyên (cần kiểm lại khối Vestibule có kèm không trước khi viết câu thiếu).",
  obj: ["Phân biệt phần thính giác (ốc tai) với phần thăng bằng (tiền đình, ống bán khuyên)"],
});
N("cochlea", "inner-ear", "K", "structure", "Ốc tai", "Cochlea", {
  status: "import-za", partial: true, zoom: "detail", mode: "isolated", focus: ["Cochlea", "Cochlear nerve"],
  note: "Chỉ khối ngoài; ống ốc tai, cơ quan Corti, màng nền không có → cần sơ đồ lát cắt.",
  obj: ["Nhận ra hình xoắn của ốc tai", "Nối ốc tai với dây ốc tai"],
});
N("vestibular-system", "inner-ear", "K", "structure", "Hệ tiền đình", "Vestibular system", {
  status: "import-za", partial: true, zoom: "detail", mode: "isolated", focus: ["Vestibule", "Vestibular nerve", "Vestibular nuclei (thân não)"],
  note: "Soan nang, cầu nang, bóng ống bán khuyên không có.",
  obj: ["Định vị tiền đình giữa ốc tai và ống bán khuyên", "Nối tiền đình với nhân tiền đình ở thân não"],
});
N("tongue", "sec-sensory-organs", "K", "structure", "Lưỡi (vị giác)", "Tongue (taste)", {
  status: "live", existing: "tongue", borrowed: "digestive", partial: true, zoom: "organ", mode: "layered",
  note: "Lưỡi 1 mảnh; vùng lưỡi = needs-schema; nhú lưỡi/nụ vị giác = missing (HAA tile 20–21).",
  obj: ["Liên hệ vùng lưỡi với dây VII, IX (vị giác) và dây XII (vận động)"],
});
N("olfaction", "sec-sensory-organs", "K", "structure", "Khứu giác", "Olfaction", {
  status: "import-za", partial: true, zoom: "detail", mode: "layered", focus: ["cn-i-olfactory", "Olfactory sulcus"], note: "Biểu mô khứu, hành khứu không có.",
  obj: ["Theo đường khứu giác từ trần hốc mũi lên não"],
});
N("touch-receptors", "sec-sensory-organs", "K", "structure", "Thụ thể xúc giác ở da", "Touch receptors of the skin", {
  status: "missing", obj: ["Phân biệt các loại thụ thể cơ học ở da theo độ sâu"],
  note: "Da là 1 mesh toàn thân. HAA tile 22–24 là khối da cắt — cần model tự dựng (vi thể), qua science-editor.",
});

// ================================================================ dẫn xuất
const byId = new Map();
for (const x of nodes) {
  if (byId.has(x.id)) throw new Error("trùng id " + x.id);
  byId.set(x.id, x);
}
for (const x of nodes) if (x.parent && !byId.has(x.parent)) throw new Error(`cha thiếu: ${x.id} → ${x.parent}`);

const depth = (x) => (x.parent ? depth(byId.get(x.parent)) + 1 : 0);
const out3d = (x) => !["section"].includes(x.kind) && x.status !== "missing";

const list = nodes.map((x) => {
  const phase = PHASE[x.sec];
  const viewId = x.existing ?? x.id;
  const has3d = out3d(x);
  return {
    id: x.id,
    viewId: x.kind === "section" ? null : viewId,
    section: x.sec,
    kind: x.kind,
    level: depth(x),
    name: { vi: x.vi, en: x.en, reviewed: x.status === "live" },
    parent: x.parent,
    children: nodes.filter((c) => c.parent === x.id).map((c) => c.id),
    learningObjectives: { vi: x.obj ?? [], reviewed: false },
    structures3d: x.focus ?? (x.existing ? [`rule hiện có của \`${x.existing}\``] : []),
    view: has3d
      ? {
          direction: x.dir ?? "three-quarter",
          zoom: { level: x.zoom ?? "structure", cameraFill: ZOOM[x.zoom ?? "structure"], thumbnailFill: 0.86 },
          display: x.mode === "isolated" ? "isolated" : "layered",
          context: x.context ?? [],
        }
      : null,
    url: x.kind === "section" ? null : { vi: `/vi/human-atlas?view=${viewId}`, en: `/en/human-atlas?view=${viewId}` },
    thumbnail: has3d && !["needs-schema", "needs-clipping"].includes(x.status) ? { source: "auto-capture", from: "model", direction: x.dir ?? "three-quarter" } : null,
    data: {
      status: x.status,
      partial: !!x.partial,
      existingViewId: x.existing ?? null,
      borrowedFromSystem: x.borrowed ?? null,
      note: x.note ?? null,
    },
    phase,
    priority: priority(x.status, phase),
    ...(x.featured ? { featured: true } : {}),
  };
});

// HAA "Nervous System Views" (ảnh chủ sản phẩm 2026-10-15) → trạng thái
const HAA = [
  [1, "Nervous System", "nervous-overview", "live-partial"],
  [2, "Brain", "nervous-brain", "live"],
  [3, "Brain Blood Supply", "nervous-brain-blood-supply", "live"],
  [4, "Limbic System", "nervous-limbic", "live"],
  [5, "Thalamus", "nervous-deep-brain", "live-partial"],
  [6, "Cranial Nerves", "nervous-cranial-nerves", "live-partial"],
  [7, "Vagus Nerve (X)", "nervous-vagus", "live"],
  [8, "Phrenic Nerves", "nervous-phrenic", "missing"],
  [9, "Brachial Plexus", "brachial-plexus-group", "live"],
  [10, "Lumbosacral Plexus", "nervous-lower-limb", "live-partial"],
  [11, "Sciatic Nerve", "nervous-sciatic", "live"],
  [12, "Autonomic Nerves", "nervous-autonomic", "live-partial"],
  [13, "Ear", "sensory-ear", "live-partial"],
  [14, "Middle Ear", "middle-ear", "import-za"],
  [15, "Inner Ear", "inner-ear", "import-za"],
  [16, "Cochlea", "cochlea", "import-za"],
  [17, "Eye", "sensory-eyeball", "live"],
  [18, "Lacrimal Apparatus", "sensory-lacrimal", "live"],
  [19, "Lens and Zonular Fibers", "lens", "live"],
  [20, "Tongue Regions", "tongue", "live-partial"],
  [21, "Tongue Section", null, "missing"],
  [22, "Skin", null, "missing"],
  [23, "Touch Receptors", "touch-receptors", "missing"],
  [24, "Hair Follicle", null, "missing"],
].map(([n, haa, ourId, status]) => ({ haa: `${n}. ${haa}`, ourId, status }));
const tiles = (pred) => HAA.filter(pred).length;
const nowCard = tiles((t) => t.status.startsWith("live"));
const afterZa = nowCard + tiles((t) => t.status === "import-za");

const count = (pred) => list.filter(pred).length;
const views3d = list.filter((x) => x.kind !== "section");
const byStatus = Object.fromEntries(Object.keys(STATUS).map((s) => [s, count((x) => x.kind !== "section" && x.data.status === s)]));
const ready = (s) => ["live", "buildable"].includes(s);
const pct = (a, b) => `${Math.round((100 * a) / b)}%`;

const doc = {
  $schema: "sciencepedia/roadmap-nervous@1",
  title: { vi: "Lộ trình module Hệ thần kinh — Bản đồ cơ thể người", en: "Nervous system module roadmap — Human Atlas" },
  generated: "2026-10-19",
  baseline: "origin/main — views-nervous.ts sau #69 (lưới kiểu HAA)",
  status: "KẾ HOẠCH. Tên mới và mục tiêu học tập CHƯA qua science-editor — không đưa lên giao diện trước khi duyệt (CLAUDE.md, gate Accuracy).",
  conventions: {
    url: "Deep link hiện có `/{locale}/human-atlas?view=<viewId>` — không đề xuất route mới (đổi rendering).",
    thumbnail: "Chụp tự động từ mô hình theo `direction` (thumbnailFill 0,86). Nút needs-schema/needs-clipping/missing chưa có ảnh: góc nhìn `missing` không có thẻ trên lưới.",
    zoom: { note: "zoom.cameraFill = AtlasViewDef.camera.fill (mặc định 0,74).", levels: ZOOM },
    display: { isolated: "chỉ focus", layered: "focus + context vẽ trong suốt (drawGhost)" },
    kinds: {
      overview: "kind overview", group: "kind group (lưới Theo hệ)", structure: "kind structure (bảng Cấu trúc)",
      section: "nút điều hướng, không dựng 3D riêng", region: "cấp 4–5; nếu không có mesh riêng → needs-schema",
    },
    status: STATUS,
    priority: { done: "đã live", P1: "dựng ngay, mảnh sẵn có, pha 1–3", P2: "mảnh sẵn có pha sau / nhập ZA pha 1–3", P3: "nhập ZA pha sau / cần tính năng mới", P4: "thiếu nguồn" },
    phaseOrder: ["1 Tổng quan", "2 Não (B–E)", "3 Dây sọ", "4 Tự chủ", "5 Tuỷ sống", "6 Đám rối", "7 Thần kinh ngoại biên", "8 Cơ quan cảm giác"],
    rules: [
      "Giữ id góc nhìn đang live (deep link). Tách một structure thành nhiều con = đổi id cũ thành group, không đổi tên.",
      "Mọi tách nhóm phải qua test \"phủ đủ, không chồng\" của atlas-model; nhóm mượn hệ khác dùng `export` rule, không gõ lại regex.",
      "Vùng chức năng (vỏ vận động, Broca, Wernicke…) KHÔNG có mesh — chỉ nhãn xấp xỉ trên hồi, ghi rõ \"xấp xỉ\" (trống hơn sai).",
      "Đoạn tuỷ C/T/L/S không cắt theo đốt sống cùng số.",
      "Nhập thêm Z-Anatomy: nới `pick()` trong scripts/import-z-anatomy.ts (hiện loại nucleus|tract|gyrus|lobe…), khử trùng không gian với mảnh BP3D cùng loại, chạy lại kiểm nội dung trước --write.",
    ],
  },
  coverage: {
    nodes: list.length,
    nodes3d: views3d.length,
    byStatus,
    readyNow: `${count((x) => x.kind !== "section" && ready(x.data.status))}/${views3d.length} (${pct(count((x) => x.kind !== "section" && ready(x.data.status)), views3d.length)}) nút 3D dựng được bằng dữ liệu đang có`,
    afterZaImport: `${count((x) => x.kind !== "section" && (ready(x.data.status) || x.data.status === "import-za"))}/${views3d.length} (${pct(count((x) => x.kind !== "section" && (ready(x.data.status) || x.data.status === "import-za")), views3d.length)})`,
    haaTiles: {
      note: "So với 24 ô \"Nervous System Views\" của HAA (ảnh tham chiếu, không dùng asset HAA).",
      withCardNow: `${nowCard}/24 (${pct(nowCard, 24)})`,
      fullNow: `${tiles((t) => t.status === "live")}/24 (${pct(tiles((t) => t.status === "live"), 24)})`,
      afterZaImport: `${afterZa}/24 (${pct(afterZa, 24)})`,
      remainingGap: "Dây hoành (8), lát cắt lưỡi (21), khối da (22), thụ thể xúc giác (23), nang lông (24): không nguồn 3D đã vet — 21–24 là vi thể, hợp sơ đồ/mô hình tự dựng hơn mesh toàn thân.",
      tiles: HAA,
    },
  },
  milestones: [
    { id: "M1", phase: "1–2", title: "Tách não theo thuỳ, hệ viền, gian não, thân não, não thất", status: "buildable", items: list.filter((x) => x.data.status === "buildable" && x.phase <= 2).map((x) => x.id) },
    { id: "M2", phase: "2–8", title: "Nhập mở rộng Z-Anatomy (một lượt): hồi/tiểu thuỳ, nhân dây sọ, bó tuỷ, dây I/VI, rễ V, hạch giao cảm, tai giữa/trong, liềm đại não", status: "import-za", items: list.filter((x) => x.data.status === "import-za").map((x) => x.id) },
    { id: "M3", phase: "4–7", title: "Tự chủ, đám rối, nhánh thần kinh từ mảnh sẵn có", status: "buildable", items: list.filter((x) => x.data.status === "buildable" && x.phase > 2).map((x) => x.id) },
    { id: "M4", phase: "2, 5", title: "Kiểu nút mới: nhãn vùng chức năng + mặt cắt theo cao độ", status: "needs-schema/needs-clipping", items: list.filter((x) => ["needs-schema", "needs-clipping"].includes(x.data.status)).map((x) => x.id) },
    { id: "M5", phase: "—", title: "Thiếu nguồn: tìm asset (giấy phép trước) hoặc sơ đồ tự dựng", status: "missing", items: list.filter((x) => x.data.status === "missing").map((x) => x.id) },
  ],
  nodes: list,
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
console.log(out, list.length, "nút");
console.log(JSON.stringify(doc.coverage, (k, v) => (k === "tiles" ? undefined : v), 2));
