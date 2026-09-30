import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Hệ tiêu hoá (2026-09-30)
 *
 * Audit dữ liệu: 103 mảnh hệ tiêu hoá của BodyParts3D 4.0 (sau `correctSystems`):
 *   lưỡi · tuyến dưới hàm, dưới lưỡi (KHÔNG có tuyến mang tai)
 *   thực quản · dạ dày · tá tràng · hỗng tràng, hồi tràng (mỗi đoạn chia gần/giữa/xa)
 *   chỗ nối hồi manh tràng · ruột thừa · đại tràng lên/ngang/xuống + 3 dải cơ dọc
 *   · trực tràng (KHÔNG có manh tràng, đại tràng sigma, ống hậu môn)
 *   gan = 8 "Hepatovenous segment" + thuỳ đuôi (nhu mô, không phải tĩnh mạch —
 *   xem SYSTEM_CORRECTIONS) · cây đường mật · túi mật · tuỵ + ống tuỵ
 * Mạch nuôi (thân tạng, mạc treo tràng trên/dưới và nhánh) ở hệ động mạch; hệ
 * tĩnh mạch cửa ở hệ tĩnh mạch. Hầu là cơ ở góc nhìn hô hấp; răng ở hệ xương.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const TONGUE = rule("FMA54640");
const SUBMANDIBULAR = rule("FMA59802", "FMA59803");
const SUBLINGUAL = rule("FMA59804", "FMA59805");
const ESOPHAGUS = rule("FMA7131");
const STOMACH = rule("FMA7148");
const DUODENUM = rule("FMA7206");
const JEJUNUM = rule("FMA16981", "FMA16982", "FMA16983");
const ILEUM = rule("FMA14964", "FMA14965", "FMA14966");
const ILEOCECAL = rule("FMA11338");
const APPENDIX = rule("FMA14542");
const COLON = rule("FMA14545", "FMA14546", "FMA14547");
const TAENIAE = rule("FMA15042", "FMA15043", "FMA15044");
const RECTUM = rule("FMA14544");
const SMALL_INTESTINE = [DUODENUM, JEJUNUM, ILEUM];
const LARGE_INTESTINE = [ILEOCECAL, APPENDIX, COLON, TAENIAE, RECTUM];

/** Gan: 8 phân thuỳ (FMA "Hepatovenous segment II–IX") + thuỳ đuôi. */
const LIVER = rule(
  "FMA15739", "FMA15741", "FMA15742", "FMA15743", "FMA15744", "FMA15745", "FMA15746", "FMA15747",
  "FMA13365",
);
/** Cây đường mật trong và ngoài gan (không gồm ống tuỵ). */
const BILE_DUCTS = rule(
  "FMA14668", "FMA14669", "FMA14670", "FMA14539", "FMA76903",
  "FMA71867", "FMA71868", "FMA71869", "FMA71870",
  "FMA71885", "FMA71886", "FMA71887", "FMA71888", "FMA71889",
);
const GALLBLADDER = rule("FMA7202");
const PANCREAS = rule("FMA7198", "FMA63120", "FMA10419", "FMA63103");

// Mạch máu (hệ động/tĩnh mạch).
const CELIAC: PartRule = {
  systems: ["arterial"],
  name: /^celiac (trunk|artery)$|gastric artery$|hepatic artery|^splenic artery$|gastroduodenal|pancreaticoduodenal artery$/i,
};
const MESENTERIC_ARTERIES: PartRule = {
  systems: ["arterial"],
  name: /mesenteric artery$|^ileal artery$|colic artery|ileocolic artery$|of (inferior branch of )?ileocolic artery$|of left colic artery$|^superior rectal artery$/i,
};
const PORTAL_SYSTEM: PartRule = {
  systems: ["venous"],
  name: /portal vein|mesenteric vein$|^splenic vein$|gastric vein$|gastroepiploic vein$|colic vein$|^ileal vein$|^pancreaticoduodenal vein$|^superior rectal vein$/i,
};
const AORTA: PartRule = { systems: ["arterial"], name: /^abdominal aorta$/i };
const SPLEEN = rule("FMA7196");
const DIAPHRAGM = rule("FMA13295");
const MANDIBLE_HYOID = rule("FMA52748", "FMA52749");
/** Cơ hầu + đường đan hầu (cùng tập với góc nhìn hô hấp "Hầu"). */
const PHARYNX = rule(
  "FMA46631", "FMA46632", "FMA46633", "FMA46634", "FMA46635", "FMA46636",
  "FMA46667", "FMA46668", "FMA46669", "FMA46670", "FMA46671", "FMA46672",
  "FMA55077",
);

export const DIGESTIVE_VIEWS: readonly AtlasViewDef[] = [
  // ------------------------------------------------------------ tổng quan
  {
    id: "digestive-overview",
    systemId: "digestive",
    kind: "overview",
    name: { vi: "Toàn bộ hệ tiêu hoá", en: "Whole digestive system" },
    direction: "front",
    focus: [{ systems: ["digestive"] }],
    // Hầu thuộc cả đường ăn lẫn đường thở; dữ liệu xếp nó vào hô hấp — hiện mờ ở đây.
    context: [PHARYNX],
    partial: {
      vi: "Thiếu tuyến mang tai, manh tràng, đại tràng sigma và ống hậu môn",
      en: "Parotid glands, cecum, sigmoid colon and anal canal are missing",
    },
    terms: ["tiêu hoá", "tiêu hóa", "digestive", "ống tiêu hoá", "gastrointestinal"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm / vùng
  {
    id: "digestive-oral",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Lưỡi và tuyến nước bọt", en: "Tongue and salivary glands" },
    direction: "anterolateral",
    focus: [TONGUE, SUBMANDIBULAR, SUBLINGUAL],
    context: [MANDIBLE_HYOID],
    partial: { vi: "Thiếu tuyến mang tai", en: "The parotid glands are missing" },
    terms: ["miệng", "mouth", "nước bọt", "salivary"],
    quality: "needs-improvement",
  },
  {
    id: "digestive-esophagus-stomach",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Thực quản và dạ dày", en: "Esophagus and stomach" },
    direction: "front",
    focus: [ESOPHAGUS, STOMACH],
    context: [DIAPHRAGM, DUODENUM, LIVER],
    terms: ["esophagus", "oesophagus", "stomach", "tâm vị", "môn vị"],
    quality: "good",
  },
  {
    id: "digestive-small-intestine",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Ruột non", en: "Small intestine" },
    direction: "front",
    focus: SMALL_INTESTINE,
    context: [STOMACH, COLON],
    terms: ["small intestine", "tá tràng", "hỗng tràng", "hồi tràng"],
    quality: "good",
  },
  {
    id: "digestive-large-intestine",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Ruột già", en: "Large intestine" },
    direction: "front",
    focus: LARGE_INTESTINE,
    context: [JEJUNUM, ILEUM],
    partial: {
      vi: "Thiếu manh tràng, đại tràng sigma và ống hậu môn",
      en: "The cecum, sigmoid colon and anal canal are missing",
    },
    terms: ["large intestine", "đại tràng", "colon", "ruột thừa", "trực tràng"],
    quality: "needs-improvement",
  },
  {
    id: "digestive-liver",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Gan", en: "Liver" },
    direction: "front",
    focus: [LIVER],
    context: [GALLBLADDER, STOMACH, DIAPHRAGM],
    terms: ["liver", "hepatic", "phân thuỳ gan", "liver segment"],
    quality: "good",
  },
  {
    id: "digestive-biliary",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Đường mật và túi mật", en: "Biliary tree and gallbladder" },
    direction: "front",
    focus: [BILE_DUCTS, GALLBLADDER],
    context: [LIVER, DUODENUM, PANCREAS],
    terms: ["mật", "bile", "ống mật", "bile duct", "gallbladder"],
    quality: "acceptable",
  },
  {
    id: "digestive-pancreas",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Tuỵ", en: "Pancreas" },
    direction: "front",
    focus: [PANCREAS],
    context: [DUODENUM, SPLEEN, STOMACH],
    terms: ["pancreas", "tụy", "ống tuỵ", "pancreatic duct"],
    quality: "good",
  },
  {
    id: "digestive-arteries",
    systemId: "digestive",
    kind: "group",
    // Tên theo đúng tập mảnh: ống tiêu hoá còn nhận ĐM thực quản, trực tràng giữa/dưới
    // (không có ở đây), và tập này có cả ĐM gan, ĐM lách.
    name: { vi: "Thân tạng và động mạch mạc treo tràng", en: "Celiac and mesenteric arteries" },
    direction: "front",
    focus: [CELIAC, MESENTERIC_ARTERIES],
    context: [AORTA, STOMACH, LIVER, ...SMALL_INTESTINE, COLON],
    terms: ["thân tạng", "celiac trunk", "mạc treo tràng", "mesenteric artery"],
    quality: "acceptable",
  },
  {
    id: "digestive-portal-system",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Hệ tĩnh mạch cửa", en: "Hepatic portal system" },
    direction: "front",
    focus: [PORTAL_SYSTEM],
    context: [LIVER, STOMACH, SPLEEN, ...SMALL_INTESTINE, COLON],
    terms: ["tĩnh mạch cửa", "portal vein", "tuần hoàn cửa"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ cấu trúc
  { id: "tongue", systemId: "digestive", kind: "structure", name: { vi: "Lưỡi", en: "Tongue" }, direction: "anterolateral", focus: [TONGUE], context: [MANDIBLE_HYOID] },
  { id: "submandibular-glands", systemId: "digestive", kind: "structure", name: { vi: "Tuyến dưới hàm", en: "Submandibular glands" }, direction: "anterolateral", focus: [SUBMANDIBULAR], context: [MANDIBLE_HYOID], terms: ["tuyến nước bọt", "salivary gland"] },
  { id: "sublingual-glands", systemId: "digestive", kind: "structure", name: { vi: "Tuyến dưới lưỡi", en: "Sublingual glands" }, direction: "anterolateral", focus: [SUBLINGUAL], context: [TONGUE, MANDIBLE_HYOID], terms: ["tuyến nước bọt", "salivary gland"] },
  { id: "esophagus", systemId: "digestive", kind: "structure", name: { vi: "Thực quản", en: "Esophagus" }, direction: "front", focus: [ESOPHAGUS], context: [STOMACH] },
  { id: "stomach", systemId: "digestive", kind: "structure", name: { vi: "Dạ dày", en: "Stomach" }, direction: "front", focus: [STOMACH], context: [ESOPHAGUS, DUODENUM] },
  { id: "duodenum", systemId: "digestive", kind: "structure", name: { vi: "Tá tràng", en: "Duodenum" }, direction: "front", focus: [DUODENUM], context: [STOMACH, PANCREAS] },
  { id: "jejunum", systemId: "digestive", kind: "structure", name: { vi: "Hỗng tràng", en: "Jejunum" }, direction: "front", focus: [JEJUNUM], context: [DUODENUM, ILEUM] },
  { id: "ileum", systemId: "digestive", kind: "structure", name: { vi: "Hồi tràng", en: "Ileum" }, direction: "front", focus: [ILEUM], context: [JEJUNUM, ILEOCECAL] },
  { id: "ileocecal-junction", systemId: "digestive", kind: "structure", name: { vi: "Chỗ nối hồi manh tràng", en: "Ileocecal junction" }, direction: "front", focus: [ILEOCECAL], context: [ILEUM, APPENDIX, COLON] },
  { id: "appendix", systemId: "digestive", kind: "structure", name: { vi: "Ruột thừa", en: "Appendix" }, direction: "front", focus: [APPENDIX], context: [ILEOCECAL, COLON] },
  { id: "colon", systemId: "digestive", kind: "structure", name: { vi: "Đại tràng lên, ngang, xuống", en: "Ascending, transverse and descending colon" }, direction: "front", focus: [COLON], context: [RECTUM], terms: ["đại tràng", "colon"] },
  { id: "taeniae-coli", systemId: "digestive", kind: "structure", name: { vi: "Dải cơ dọc đại tràng", en: "Taeniae coli" }, direction: "front", focus: [TAENIAE], context: [COLON] },
  { id: "rectum", systemId: "digestive", kind: "structure", name: { vi: "Trực tràng", en: "Rectum" }, direction: "side", focus: [RECTUM], context: [COLON] },
  { id: "liver", systemId: "digestive", kind: "structure", name: { vi: "Gan", en: "Liver" }, direction: "front", focus: [LIVER], context: [GALLBLADDER] },
  { id: "gallbladder", systemId: "digestive", kind: "structure", name: { vi: "Túi mật", en: "Gallbladder" }, direction: "front", focus: [GALLBLADDER], context: [LIVER, BILE_DUCTS] },
  { id: "bile-ducts", systemId: "digestive", kind: "structure", name: { vi: "Cây đường mật", en: "Biliary tree" }, direction: "front", focus: [BILE_DUCTS], context: [LIVER, GALLBLADDER], terms: ["ống mật chủ", "ống gan chung", "common hepatic duct"] },
  { id: "pancreas", systemId: "digestive", kind: "structure", name: { vi: "Tuỵ", en: "Pancreas" }, direction: "front", focus: [PANCREAS], context: [DUODENUM] },
  { id: "celiac-branches", systemId: "digestive", kind: "structure", name: { vi: "Thân tạng và các nhánh", en: "Celiac trunk and branches" }, direction: "front", focus: [CELIAC], context: [AORTA, STOMACH] },
  { id: "mesenteric-arteries", systemId: "digestive", kind: "structure", name: { vi: "Động mạch mạc treo tràng và các nhánh", en: "Mesenteric arteries and branches" }, direction: "front", focus: [MESENTERIC_ARTERIES], context: [AORTA, ...SMALL_INTESTINE, COLON] },
  { id: "portal-veins", systemId: "digestive", kind: "structure", name: { vi: "Tĩnh mạch cửa và các nhánh", en: "Portal vein and tributaries" }, direction: "front", focus: [PORTAL_SYSTEM], context: [LIVER] },
];
