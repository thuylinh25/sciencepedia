import type { AtlasViewDef, PartRule } from "./views";
import { EPIGLOTTIS, LARYNX_CARTILAGES, PHARYNX_LOWER, PHARYNX_UPPER } from "./views-respiratory";
import { CERVICAL, HIP_BONE, LUMBAR, MANDIBLE, MAXILLA, RIBS, SACRUM, SKULL, TEETH, THORACIC } from "./views-skeletal";

/*
 * ## Góc nhìn theo hệ — Hệ tiêu hoá (2026-09-30)
 *
 * Audit dữ liệu: 103 mảnh hệ tiêu hoá của BodyParts3D 4.0 (sau `correctSystems`):
 *   lưỡi · tuyến dưới hàm, dưới lưỡi (KHÔNG có tuyến mang tai)
 *   thực quản · dạ dày · tá tràng · hỗng tràng, hồi tràng (mỗi đoạn chia gần/giữa/xa)
 *   · chỗ nối hồi manh tràng · ruột thừa · đại tràng lên/ngang/xuống + 3 dải cơ dọc
 *   · trực tràng (KHÔNG có manh tràng, đại tràng sigma, ống hậu môn)
 *   gan = 8 "Hepatovenous segment" + thuỳ đuôi (nhu mô, không phải tĩnh mạch —
 *   xem SYSTEM_CORRECTIONS) · cây đường mật · túi mật · tuỵ + ống tuỵ
 * Mạch nuôi (thân tạng, mạc treo tràng trên/dưới và nhánh) ở hệ động mạch; hệ
 * tĩnh mạch cửa ở hệ tĩnh mạch. Hầu là cơ ở góc nhìn hô hấp; răng ở hệ xương.
 *
 * Lưới xếp theo "Digestive System Views" của atlas tham chiếu (chủ sản phẩm, 2026-10-21):
 * phần trên, phần dưới, tuyến nước bọt, răng, hầu thanh quản, ống tiêu hoá, mạch dạ dày,
 * cơ thắt, tạng phụ, mạch vùng, ruột, đại tràng — rồi các nhóm cũ giữ cho deep link. Ô
 * "Sphincters": dữ liệu không có cơ thắt thực quản dưới, môn vị, hậu môn trong (chỉ có cơ
 * thắt hậu môn ngoài ở hệ cơ) → `missing`, không dựng bù bằng dạ dày trơn. Răng, hầu
 * mượn quy tắc hệ xương/hô hấp — cùng tập mảnh với các cấu trúc ở đó, không khai báo lại.
 */

const rule = (...fma: string[]): PartRule => ({ fma });

const TONGUE = rule("FMA54640");
const SUBMANDIBULAR = rule("FMA59802", "FMA59803");
const SUBLINGUAL = rule("FMA59804", "FMA59805");
const ESOPHAGUS = rule("FMA7131");
const STOMACH = rule("FMA7148");
const DUODENUM = rule("FMA7206");
const JEJUNUM = rule("FMA16981", "FMA16982", "FMA16983");
export const ILEUM = rule("FMA14964", "FMA14965", "FMA14966");
const ILEOCECAL = rule("FMA11338");
const APPENDIX = rule("FMA14542");
const COLON = rule("FMA14545", "FMA14546", "FMA14547");
const TAENIAE = rule("FMA15042", "FMA15043", "FMA15044");
export const RECTUM = rule("FMA14544");
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

// Mạch máu (hệ động/tĩnh mạch). Thân tạng và hệ cửa chia thành phần mạch dạ dày + phần
// còn lại để ô "Mạch máu dạ dày" có cấu trúc riêng mà mở cấu trúc cha không ra "Phần còn lại".
const STOMACH_ARTERIES: PartRule = { systems: ["arterial"], name: /^(left|right) gastric artery$|^(left|right) gastro-epiploic artery$/i };
const CELIAC_OTHER: PartRule = {
  systems: ["arterial"],
  name: /^celiac (trunk|artery)$|hepatic artery|^splenic artery$|gastroduodenal|superior pancreaticoduodenal artery$|\bpancreatic artery$/i,
  exclude: /inferior pancreaticoduodenal/i,
};
const CELIAC: PartRule = {
  systems: ["arterial"],
  name: /^celiac (trunk|artery)$|gastric artery$|hepatic artery|^splenic artery$|gastroduodenal|superior pancreaticoduodenal artery$|gastro-epiploic artery$|\bpancreatic artery$/i,
  // "…epigastric artery" (thượng vị — thành bụng) cũng tận cùng bằng "gastric artery".
  // ĐM tá tuỵ dưới tách từ ĐM mạc treo tràng trên, không từ thân tạng.
  exclude: /epigastric|inferior pancreaticoduodenal/i,
};
const MESENTERIC_ARTERIES: PartRule = {
  systems: ["arterial"],
  name: /mesenteric artery$|^ileal artery$|colic artery|ileocolic artery$|of (inferior branch of )?ileocolic artery$|of left colic artery$|^superior rectal artery$|cecal artery$|appendicular artery$|marginal artery of colon$|sigmoid artery$|inferior pancreaticoduodenal artery$/i,
};
const STOMACH_VEINS: PartRule = { systems: ["venous"], name: /^(left|right) gastric vein$|^(left|right) gastroepiploic vein$/i };
const MESENTERIC_VEINS: PartRule = {
  systems: ["venous"],
  name: /mesenteric vein$|colic vein$|^ileal vein$|^pancreaticoduodenal vein$|^superior rectal vein$|sigmoid vein$/i,
};
const PORTAL_TRUNK: PartRule = { systems: ["venous"], name: /portal vein|^splenic vein$/i };
const PORTAL_SYSTEM: PartRule = {
  systems: ["venous"],
  name: /portal vein|mesenteric vein$|^splenic vein$|gastric vein$|gastroepiploic vein$|colic vein$|^ileal vein$|^pancreaticoduodenal vein$|^superior rectal vein$|sigmoid vein$/i,
  // "…epigastric vein" (thành bụng) cũng tận cùng bằng "gastric vein".
  exclude: /epigastric/i,
};
const AORTA: PartRule = { systems: ["arterial"], name: /^abdominal aorta$/i };
const SPLEEN = rule("FMA7196");
const DIAPHRAGM = rule("FMA13295");
const MESENTERY = rule("FMA14643");
const MANDIBLE_HYOID = rule("FMA52748", "FMA52749");
const HYOID = rule("FMA52749");
/** Cơ hầu + đường đan hầu (cùng tập với góc nhìn hô hấp "Hầu"). */
const PHARYNX = rule(
  "FMA46631", "FMA46632", "FMA46633", "FMA46634", "FMA46635", "FMA46636",
  "FMA46667", "FMA46668", "FMA46669", "FMA46670", "FMA46671", "FMA46672",
  "FMA55077",
);
/** Cơ khẩu cái mềm (nâng/căng màn hầu, cơ lưỡi gà) — hệ cơ của dữ liệu; bối cảnh của miệng và hầu. */
const SOFT_PALATE = rule("FMA46728", "FMA46729", "FMA46731", "FMA46732", "FMA46733");
const MISSING_CBD = {
  vi: "Thiếu ống mật chủ (đoạn từ chỗ hợp lưu ống túi mật tới bóng gan – tuỵ)",
  en: "The common bile duct is missing",
};
const MISSING_LOWER = {
  vi: "Thiếu manh tràng, đại tràng sigma và ống hậu môn",
  en: "The cecum, sigmoid colon and anal canal are missing",
};

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
      vi: "Thiếu tuyến mang tai, ống mật chủ, manh tràng, đại tràng sigma và ống hậu môn",
      en: "Parotid glands, common bile duct, cecum, sigmoid colon and anal canal are missing",
    },
    terms: ["tiêu hoá", "tiêu hóa", "digestive", "ống tiêu hoá", "gastrointestinal"],
    quality: "acceptable",
  },

  // ------------------------------------------------------------ nhóm theo atlas tham chiếu
  // Mặt cắt dọc giữa (bỏ nửa trái, x > 0) nhìn từ bên trái, như `bone-pelvic-section`:
  // lưỡi, hầu nằm sau xương hàm — nhìn ngoài sọ thì không thấy.
  {
    id: "digestive-upper",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Miệng và hầu", en: "Mouth and pharynx" },
    direction: [1, 0.05, 0.12],
    focus: [TONGUE, SUBMANDIBULAR, SUBLINGUAL, PHARYNX],
    context: [...SKULL, CERVICAL, ESOPHAGUS, MANDIBLE_HYOID, LARYNX_CARTILAGES, EPIGLOTTIS, SOFT_PALATE],
    clip: { normal: [-1, 0, 0], constant: 0 },
    partial: { vi: "Thiếu tuyến mang tai; hầu chỉ có lớp cơ", en: "The parotid glands are missing; the pharynx is shown as its muscular wall only" },
    terms: ["miệng", "mouth", "hầu", "pharynx", "khoang miệng", "oral cavity"],
    quality: "acceptable",
  },
  {
    id: "digestive-lower",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Tạng tiêu hoá ổ bụng và chậu hông", en: "Abdominal and pelvic digestive organs" },
    direction: "front",
    focus: [STOMACH, ...SMALL_INTESTINE, ...LARGE_INTESTINE, LIVER, GALLBLADDER, BILE_DUCTS, PANCREAS],
    context: [RIBS, THORACIC, LUMBAR, SACRUM, HIP_BONE, ESOPHAGUS, DIAPHRAGM],
    partial: MISSING_LOWER,
    terms: ["ổ bụng", "abdomen", "bụng", "abdominal organs", "chậu hông", "pelvis"],
    quality: "acceptable",
  },
  {
    id: "digestive-oral",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Tuyến nước bọt", en: "Salivary glands" },
    direction: "anterolateral",
    focus: [SUBMANDIBULAR, SUBLINGUAL],
    context: [TONGUE, MANDIBLE_HYOID],
    partial: { vi: "Thiếu tuyến mang tai", en: "The parotid glands are missing" },
    terms: ["miệng", "mouth", "nước bọt", "salivary", "tuyến dưới hàm", "tuyến dưới lưỡi"],
    quality: "needs-improvement",
  },
  {
    id: "digestive-teeth",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Răng và lợi", en: "Teeth and gums" },
    direction: "front",
    focus: TEETH,
    context: [MAXILLA, MANDIBLE, TONGUE],
    partial: { vi: "Không có răng khôn (răng hàm lớn thứ ba)", en: "Third molars (wisdom teeth) are not included" },
    terms: ["răng", "teeth", "lợi", "nướu", "gum", "nhai", "chewing"],
    quality: "good",
  },
  // Hầu thanh quản: từ bờ trên nắp thanh môn tới dưới sụn nhẫn (nơi thực quản bắt đầu) —
  // lát `band` cắt hầu và thực quản, thanh quản mờ còn nguyên. Nhìn chếch sau: hầu nằm sau thanh quản.
  {
    id: "digestive-laryngopharynx",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Hầu thanh quản và đầu thực quản", en: "Laryngopharynx and upper esophagus" },
    direction: "posterolateral",
    focus: [PHARYNX_LOWER, ESOPHAGUS],
    // Chỉ xương móng: xương hàm dưới mờ chiếm nửa trên khung (chụp thử).
    context: [PHARYNX_UPPER, LARYNX_CARTILAGES, EPIGLOTTIS, HYOID],
    band: {
      top: { edge: "top", of: /^epiglottis$/i },
      bottom: { between: [{ edge: "bottom", of: /^cricoid cartilage$/i }, { edge: "top", of: /^manubrium$/i }], at: 0.5 },
    },
    partial: { vi: "Hầu chỉ có lớp cơ, không có niêm mạc", en: "The pharynx is shown as its muscular wall only, without the mucosa" },
    terms: ["hầu thanh quản", "laryngopharynx", "hạ họng", "hypopharynx", "nuốt", "swallowing"],
    quality: "acceptable",
  },
  {
    id: "digestive-alimentary-canal",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Ống tiêu hoá", en: "Alimentary canal" },
    direction: "front",
    focus: [PHARYNX, ESOPHAGUS, STOMACH, ...SMALL_INTESTINE, ...LARGE_INTESTINE],
    context: [RIBS, CERVICAL, THORACIC, LUMBAR, SACRUM, HIP_BONE],
    partial: {
      vi: "Thiếu manh tràng, đại tràng sigma và ống hậu môn; không dựng khoang miệng; hầu chỉ có lớp cơ",
      en: "The cecum, sigmoid colon and anal canal are missing; the oral cavity is not modelled; the pharynx is shown as its muscular wall only",
    },
    terms: ["ống tiêu hoá", "alimentary canal", "đường tiêu hoá", "gastrointestinal tract"],
    quality: "acceptable",
  },
  {
    id: "digestive-stomach-vessels",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Mạch máu dạ dày", en: "Blood vessels of the stomach" },
    direction: "front",
    focus: [STOMACH, STOMACH_ARTERIES, STOMACH_VEINS],
    context: [LIVER, SPLEEN, DUODENUM, CELIAC_OTHER, PORTAL_TRUNK],
    partial: { vi: "Thiếu các động mạch và tĩnh mạch vị ngắn", en: "The short gastric arteries and veins are missing" },
    terms: ["động mạch vị", "gastric artery", "tĩnh mạch vị", "gastric vein", "vị mạc nối", "gastro-epiploic"],
    quality: "acceptable",
  },
  {
    id: "digestive-sphincters",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Các cơ thắt", en: "Sphincters" },
    direction: "front",
    missing: {
      vi: "Bộ dữ liệu chưa có cơ thắt thực quản dưới, cơ thắt môn vị và cơ thắt hậu môn trong; cơ thắt thực quản trên nằm lẫn trong cơ khít hầu dưới, chỉ có cơ thắt hậu môn ngoài (hệ cơ)",
      en: "The lower esophageal, pyloric and internal anal sphincters are not in the dataset; the upper esophageal sphincter is part of the inferior pharyngeal constrictor, and only the external anal sphincter (muscular system) is present",
    },
    terms: ["cơ thắt", "sphincter", "môn vị", "pylorus", "tâm vị"],
  },
  {
    id: "digestive-accessory-organs",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Gan, đường mật và tuỵ", en: "Liver, biliary tree and pancreas" },
    direction: "front",
    focus: [LIVER, GALLBLADDER, BILE_DUCTS, PANCREAS],
    context: [DUODENUM, STOMACH, SPLEEN],
    partial: MISSING_CBD,
    terms: ["tạng phụ", "accessory digestive organs", "gan", "túi mật", "tụy"],
    quality: "acceptable",
  },
  {
    id: "digestive-vasculature",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Mạch máu các tạng tiêu hoá", en: "Blood vessels of the digestive organs" },
    direction: "front",
    focus: [CELIAC, MESENTERIC_ARTERIES, PORTAL_SYSTEM],
    context: [AORTA, LIVER, STOMACH, SPLEEN, PANCREAS, ...SMALL_INTESTINE, COLON],
    partial: {
      vi: "Gồm thân tạng, động mạch mạc treo tràng và hệ tĩnh mạch cửa; không gồm tĩnh mạch gan, mạch thực quản, mạch trực tràng giữa và dưới",
      en: "Shows the celiac trunk, the mesenteric arteries and the hepatic portal system; the hepatic veins, esophageal vessels and middle and inferior rectal vessels are not included",
    },
    terms: ["mạch máu", "blood supply", "tuần hoàn cửa", "thân tạng", "mạc treo tràng"],
    quality: "acceptable",
  },
  {
    id: "digestive-intestines",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Ruột và mạch mạc treo", en: "Intestines and mesenteric vessels" },
    direction: "front",
    focus: [...SMALL_INTESTINE, ...LARGE_INTESTINE, MESENTERIC_ARTERIES, MESENTERIC_VEINS],
    context: [STOMACH, MESENTERY, HIP_BONE],
    partial: MISSING_LOWER,
    terms: ["ruột", "intestines", "mạc treo", "mesentery"],
    quality: "acceptable",
  },
  {
    id: "digestive-large-intestine",
    systemId: "digestive",
    kind: "group",
    name: { vi: "Ruột già", en: "Large intestine" },
    direction: "front",
    focus: LARGE_INTESTINE,
    context: [JEJUNUM, ILEUM, HIP_BONE],
    partial: MISSING_LOWER,
    terms: ["large intestine", "đại tràng", "colon", "ruột thừa", "trực tràng"],
    quality: "needs-improvement",
  },

  // ------------------------------------------------------------ nhóm cũ (deep link)
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
    partial: MISSING_CBD,
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
  { id: "bile-ducts", systemId: "digestive", kind: "structure", name: { vi: "Cây đường mật", en: "Biliary tree" }, direction: "front", focus: [BILE_DUCTS], context: [LIVER, GALLBLADDER], partial: MISSING_CBD, terms: ["ống gan chung", "common hepatic duct"] },
  { id: "pancreas", systemId: "digestive", kind: "structure", name: { vi: "Tuỵ", en: "Pancreas" }, direction: "front", focus: [PANCREAS], context: [DUODENUM] },
  { id: "celiac-branches", systemId: "digestive", kind: "structure", name: { vi: "Thân tạng và các nhánh", en: "Celiac trunk and branches" }, direction: "front", focus: [CELIAC], context: [AORTA, STOMACH] },
  // Hai con phủ kín thân tạng: mở `celiac-branches` ra đúng hai hàng.
  { id: "stomach-arteries", systemId: "digestive", kind: "structure", name: { vi: "Động mạch vị và vị mạc nối", en: "Gastric and gastro-omental arteries" }, direction: "front", focus: [STOMACH_ARTERIES], context: [STOMACH], terms: ["động mạch dạ dày", "gastric artery", "gastro-epiploic artery"] },
  { id: "celiac-trunk-hepatic-splenic", systemId: "digestive", kind: "structure", name: { vi: "Thân tạng, động mạch gan, động mạch lách và các nhánh cho tuỵ, tá tràng", en: "Celiac trunk, hepatic and splenic arteries, and their pancreatic and duodenal branches" }, direction: "front", focus: [CELIAC_OTHER], context: [AORTA, LIVER, SPLEEN, PANCREAS] },
  { id: "mesenteric-arteries", systemId: "digestive", kind: "structure", name: { vi: "Động mạch mạc treo tràng và các nhánh", en: "Mesenteric arteries and branches" }, direction: "front", focus: [MESENTERIC_ARTERIES], context: [AORTA, ...SMALL_INTESTINE, COLON] },
  { id: "portal-veins", systemId: "digestive", kind: "structure", name: { vi: "Tĩnh mạch cửa và các nhánh", en: "Portal vein and tributaries" }, direction: "front", focus: [PORTAL_SYSTEM], context: [LIVER] },
  // Ba con phủ kín hệ cửa (cùng `intestinal-veins`).
  { id: "portal-vein-splenic", systemId: "digestive", kind: "structure", name: { vi: "Tĩnh mạch cửa, các nhánh trong gan và tĩnh mạch lách", en: "Portal vein, its intrahepatic branches and the splenic vein" }, direction: "front", focus: [PORTAL_TRUNK], context: [LIVER, SPLEEN] },
  { id: "stomach-veins", systemId: "digestive", kind: "structure", name: { vi: "Tĩnh mạch vị và vị mạc nối", en: "Gastric and gastro-omental veins" }, direction: "front", focus: [STOMACH_VEINS], context: [STOMACH], terms: ["tĩnh mạch dạ dày", "gastric vein", "gastroepiploic vein"] },
  // Tĩnh mạch mạc treo: cùng tập với `intestinal-veins` (views-cardiac.ts) — khai báo lại là hai hàng trùng.
];
