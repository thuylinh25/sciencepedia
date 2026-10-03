/**
 * Mô tả cấp NHÓM cho Bản đồ cơ thể người — mục 3 của độ phủ mô tả.
 *
 *   npx tsx scripts/atlas-group-descriptions.ts [--write]          tra Wikipedia, ghi data/anatomy/group-descriptions.json
 *   npx tsx scripts/atlas-group-descriptions.ts --emit-review <dir> TSV cho science-editor
 *   npx tsx scripts/atlas-group-descriptions.ts --merge <result.json> [--write]
 *   npx tsx scripts/atlas-group-descriptions.ts --merge-en <result.json> [--write]  bản en đã duyệt
 *   npx tsx scripts/atlas-group-descriptions.ts --emit-client       → src/lib/human-atlas/group-descriptions.generated.json
 *
 * ## Vì sao cấp nhóm
 *
 * ~2.000 mảnh (nhánh mạch, nhánh thần kinh, từng hạch, từng hồi não) không có bài
 * Wikipedia riêng và sẽ không bao giờ có. Nhưng mỗi mảnh thuộc một CẤU TRÚC của bảng
 * "Cấu trúc" (góc nhìn kind "structure": "Động mạch vành", "Các nhóm hạch nách") —
 * nhóm đó thường có bài. Bảng chi tiết hiện mô tả nhóm trong khung riêng, ghi rõ
 * "nói về nhóm", như khung mô tả hệ — không đặt thẳng dưới tên mảnh.
 *
 * ## Vì sao chỉ mục ĐÃ DUYỆT ra client
 *
 * Tên nhóm ghép ("Iliac and pelvic veins") map sang bài kém hơn tên cơ quan, và bài
 * có thể rộng hoặc hẹp hơn nhóm. science-editor duyệt cả MAPPING lẫn câu chữ; mục
 * chưa duyệt nằm trong tệp dữ liệu nhưng `--emit-client` bỏ qua.
 *
 * ## Vì sao có trường `en` riêng (2026-10-03)
 *
 * Lớp này ra đời trước Level 2 và chỉ lưu bản Việt, nên bản tiếng Anh của site
 * hiện câu tiếng Việt cho ~340 mảnh. `en` là câu NGUYÊN VĂN bài Wikipedia tiếng
 * Anh (đúng phần bản Việt đã dịch, hoặc câu mở đầu khi bản Việt lấy từ bài vi),
 * qua science-editor như bản Việt: đúng cho cả nhóm. Nhóm chưa có `en` thì bản
 * tiếng Anh lùi về mô tả hệ — không bao giờ hiện câu tiếng Việt cho người đọc
 * tiếng Anh.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ATLAS_VIEWS, viewKind, viewParts } from "../src/lib/human-atlas/views";
import { structureDescription } from "../src/lib/human-atlas/descriptions";
import { SUPPLEMENTS } from "../src/lib/human-atlas/supplements";
import { pool, viTitlesForQids, wikipediaSummary, type Summary } from "./wikipedia";

const ROOT = path.join(__dirname, "..");
const AUDIT = path.join(ROOT, ".cache/anatomy/audit.json");
const OUT = path.join(ROOT, "data/anatomy/group-descriptions.json");
const CLIENT_OUT = path.join(ROOT, "src/lib/human-atlas/group-descriptions.generated.json");

/**
 * Bài cho nhóm mà tên góc nhìn không tự map được (tên ghép, tên mô tả vùng).
 * `null` = nhóm không có bài phù hợp — đừng thử heuristic.
 */
const TITLES: Record<string, string | null> = {
  // Heuristic map sai: "Ascending", "Lumbar", "Gluteal muscles", "Ilium (bone)", "Facial",
  // "Thoracic wall", "Raphe", "Trung thất", "Thuật ngữ giải phẫu vị trí", "Bàn chân".
  colon: "Colon (anatomy)",
  lens: "Lens (anatomy)", // tên trần ra bài thấu kính quang học
  // Lưới mạch theo vùng: bài một cấu trúc (ống ngực, bể dưỡng chấp) hẹp hơn nhóm.
  "thorax-lymph-vessels": "Lymphatic vessel",
  "abdomen-lymph-vessels": "Lymphatic vessel",
  "lumbar-lymph-nodes": "Lumbar lymph nodes",
  "sacral-plexus-branches": "Sacral plexus",
  "pelvic-arteries": "Internal iliac artery",
  "pelvic-veins": "Internal iliac vein",
  "face-veins": "Facial vein",
  "thoracic-wall-arteries": "Intercostal arteries",
  "raphes-tendons": "Linea alba (abdomen)",
  "mediastinal-lymph-nodes": "Mediastinal lymph node",
  "leg-arteries": "Anterior tibial artery",
  "nasolacrimal-ducts": "Nasolacrimal duct",
  "foot-muscles": null, // chỉ ra bài "Foot" — quá rộng
  // Thùy phổi: chỉ có bài "Lung" — sai cấp.
  "right-upper-lobe": null,
  "right-middle-lobe": null,
  "right-lower-lobe": null,
  "left-upper-lobe": null,
  "left-lower-lobe": null,
  // Không tự map được.
  "right-main-bronchus": "Bronchus",
  "right-bronchial-tree": "Bronchus",
  "left-bronchial-tree": "Bronchus",
  cricothyroid: "Cricothyroid muscle",
  "ventricular-wall": "Ventricle (heart)",
  "right-atrium-cavity": "Atrium (heart)",
  "left-atrium-cavity": "Atrium (heart)",
  "right-ventricle-cavity": "Ventricle (heart)",
  "left-ventricle-cavity": "Ventricle (heart)",
  "cardiac-veins": "Coronary sinus",
  "deferent-ducts": "Vas deferens",
  penis: "Corpus cavernosum penis",
  "right-eyeball": "Human eye",
  "left-eyeball": "Human eye",
  "ciliary-body": "Ciliary body",
  iris: "Iris (anatomy)",
  "orbital-connective": "Common tendinous ring",
  "head-lymph-nodes": "Lymph node",
  "neck-lymph-nodes": "Cervical lymph nodes",
  "head-neck-lymph-vessels": "Lymphatic vessel",
  "arm-lymph-nodes": "Supratrochlear lymph nodes",
  "upper-limb-lymph-vessels": "Lymphatic vessel",
  "thoracic-wall-lymph-nodes": "Parasternal lymph nodes",
  "abdominal-visceral-lymph-nodes": "Superior mesenteric lymph nodes",
  "iliac-lymph-nodes": "External iliac lymph nodes",
  "pelvic-lymph-nodes": "Sacral lymph nodes",
  "pelvis-lymph-vessels": "Lymphatic vessel",
  "leg-lymph-nodes": "Popliteal lymph nodes",
  "lower-limb-lymph-vessels": "Lymphatic vessel",
  "basal-nuclei": "Basal ganglia",
  "brain-ventricles": "Ventricular system",
  "spinal-dura": "Dura mater",
  "spinal-roots": "Dorsal root of spinal nerve",
  "brachial-plexus-collaterals": "Brachial plexus",
  "medial-cutaneous-nerves-arm": "Medial cutaneous nerve of forearm",
  "lumbar-plexus-branches": "Lumbar plexus",
  "femoral-nerve": "Femoral nerve",
  "tibial-nerve": "Tibial nerve",
  "fibular-nerves": "Common fibular nerve",
  "deep-neck-muscles": "Scalene muscles",
  "deep-back-muscles": "Erector spinae muscles",
  "shoulder-muscles": "Rotator cuff",
  "aortic-arch-branches": "Aortic arch",
  "cerebral-arteries": "Cerebral arteries",
  "lingular-arteries": "Pulmonary artery",
  "abdominal-other-arteries": "Abdominal aorta",
  "forearm-arteries": "Radial artery",
  "hand-arteries": "Superficial palmar arch",
  "popliteal-arteries": "Popliteal artery",
  "foot-arteries": "Dorsalis pedis artery",
  "dorsal-digital-arteries": "Dorsal digital arteries of hand",
  "azygos-system": "Azygos vein",
  "paired-visceral-veins": "Testicular vein",
  "lingular-veins": "Pulmonary vein",
  "arm-superficial-veins": "Cephalic vein",
  "arm-deep-veins": "Brachial veins",
  "hand-veins": "Dorsal venous network of hand",
  "saphenous-veins": "Great saphenous vein",
  "popliteal-veins": "Popliteal vein",
  "leg-veins": "Anterior tibial vein",
  "foot-veins": "Dorsal venous arch of the foot",
  "laryngeal-ligaments": "Laryngeal cartilages",
  "sural-nerve": "Sural nerve",
};

type Entry = {
  viewId: string;
  systemId: string;
  nameVi: string;
  nameEn: string;
  parts: number;
  bare: number;
  enTitle: string | null;
  /** Câu bài en (2 câu) — để science-editor dịch khi câu vi hỏng hoặc không có. */
  enText: string | null;
  enUrl: string | null;
  description: { lang: "vi" | "en"; text: string; translated: boolean; reviewed: boolean } | null;
  source: { title: string; url: string; license: "CC BY-SA 4.0" } | null;
  /** Bản en đã duyệt: câu nguyên văn bài en (`enTitle`/`enUrl`). */
  en?: { text: string; reviewed: boolean };
  /** science-editor bỏ (sai nhóm, sai khoa học) — lý do. Chạy lại không tra lại; xoá trường này để tra lại sau khi đổi TITLES. */
  dropped?: string;
};
type Doc = { note: string; entries: Entry[] };

function groups() {
  const audit = JSON.parse(readFileSync(AUDIT, "utf8")) as { id: string; conceptId: string }[];
  const cid = new Map<string, string>([
    ...audit.map((p) => [p.id, p.conceptId] as const),
    ...SUPPLEMENTS.flatMap((s) => s.parts.map((p) => [p.id, p.conceptId] as const)),
  ]);
  return ATLAS_VIEWS.filter((v) => viewKind(v) === "structure").flatMap((v) => {
    const ps = viewParts(v.id)?.focus ?? [];
    const bare = ps.filter((p) => !structureDescription(cid.get(p), p)).length;
    return bare > 0 ? [{ view: v, parts: ps.length, bare }] : [];
  });
}

/** "Brachial plexus (roots, trunks…)" → ["Brachial plexus (roots…)", "Brachial plexus"]; "A and B" → thêm "A". */
function candidates(viewId: string, en: string): string[] {
  if (viewId in TITLES) return TITLES[viewId] ? [TITLES[viewId]!] : [];
  const bare = en.replace(/\s*\(.*\)\s*/g, " ").trim();
  const first = bare.split(/\s+and\s+|,\s*/i)[0].trim();
  return [...new Set([en, bare, first])];
}

async function lookup(write: boolean) {
  const gs = groups();
  const old = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as Doc) : null;
  const kept = new Map((old?.entries ?? []).filter((e) => e.description?.reviewed || e.dropped).map((e) => [e.viewId, e]));
  const todo = gs.filter((g) => !kept.has(g.view.id));
  console.log(`${gs.length} nhóm có mảnh thiếu mô tả; giữ ${kept.size} mục đã duyệt; tra ${todo.length}`);

  const en = await pool(todo, 4, async (g) => {
    let s: Summary | null = null;
    for (const t of candidates(g.view.id, g.view.name.en)) if ((s = await wikipediaSummary("en", t))) break;
    return { g, s };
  });
  const qidVi = await viTitlesForQids([...new Set(en.flatMap((x) => (x.s?.qid ? [x.s.qid] : [])))]);
  const vi = await pool(en, 4, async (x) => {
    const title = x.s?.qid ? qidVi.get(x.s.qid) : undefined;
    return title ? await wikipediaSummary("vi", title) : null;
  });

  const fresh: Entry[] = en.map(({ g, s }, i) => {
    const pick = vi[i] ?? s;
    return {
      viewId: g.view.id,
      systemId: g.view.systemId!,
      nameVi: g.view.name.vi,
      nameEn: g.view.name.en,
      parts: g.parts,
      bare: g.bare,
      enTitle: s ? s.title.replace(/_/g, " ") : null,
      enText: s?.extract ?? null,
      enUrl: s?.url ?? null,
      description: pick ? { lang: pick.lang, text: pick.extract, translated: false, reviewed: false } : null,
      source: pick ? { title: pick.title.replace(/_/g, " "), url: pick.url, license: "CC BY-SA 4.0" } : null,
    };
  });
  const byId = new Map([...fresh, ...kept.values()].map((e) => [e.viewId, e]));
  const entries = gs.map((g) => {
    const e = byId.get(g.view.id)!;
    return { ...e, parts: g.parts, bare: g.bare };
  });
  const c = { vi: 0, en: 0, none: 0 };
  for (const e of entries) c[!e.description ? "none" : e.description.lang]++;
  console.log(c);
  if (write) writeFileSync(OUT, JSON.stringify({ note: "Mô tả cấp nhóm (góc nhìn kind structure); nguồn Wikipedia CC BY-SA. Chỉ mục reviewed ra client.", entries } satisfies Doc, null, 1));
  else console.log("chạy khô — thêm --write để ghi");
}

function emitReview(dir: string) {
  const doc = JSON.parse(readFileSync(OUT, "utf8")) as Doc;
  const lines = ["viewId\tsystem\tgroup_vi\tgroup_en\tparts\tvi_source_title\tvi_text\ten_title\ten_text"];
  for (const e of doc.entries) {
    if (e.description?.reviewed || e.dropped) continue;
    const vi = e.description?.lang === "vi";
    lines.push([e.viewId, e.systemId, e.nameVi, e.nameEn, e.parts, vi ? e.source!.title : "", vi ? e.description!.text : "", e.enTitle ?? "", e.enText ?? ""].join("\t"));
  }
  writeFileSync(path.join(dir, "group-review.tsv"), lines.join("\n"));
  console.log(`${lines.length - 1} nhóm chờ duyệt → ${path.join(dir, "group-review.tsv")}`);
}

/** result = {rows:[{viewId, action:"KEEP"|"TRANSLATE"|"DROP", text?}]}: KEEP câu vi nguyên văn, TRANSLATE = bản vi đã dịch+thẩm từ en. */
function merge(resultPath: string, write: boolean) {
  const doc = JSON.parse(readFileSync(OUT, "utf8")) as Doc;
  const rows = (JSON.parse(readFileSync(resultPath, "utf8")) as { rows: { viewId: string; action: string; text?: string }[] }).rows;
  const byId = new Map(doc.entries.map((e) => [e.viewId, e]));
  const n = { KEEP: 0, TRANSLATE: 0, DROP: 0 };
  for (const r of rows) {
    const e = byId.get(r.viewId);
    if (!e) throw new Error(`${r.viewId} không có trong ${OUT}`);
    if (r.action === "DROP") {
      e.description = null;
      e.dropped = (r as { reason?: string }).reason ?? "science-editor DROP";
      e.source = null;
    } else if (r.action === "KEEP") {
      if (!e.description || e.description.lang !== "vi") throw new Error(`${r.viewId}: KEEP cần câu vi`);
      e.description.reviewed = true;
    } else if (r.action === "TRANSLATE") {
      // Dịch từ bài en — nguồn ghi công là bài en, kể cả khi trước đó đang trỏ bài vi.
      if (!e.enText || !e.enTitle || !e.enUrl || !r.text) throw new Error(`${r.viewId}: TRANSLATE cần câu en + text`);
      e.description = { lang: "vi", text: r.text.trim(), translated: true, reviewed: true };
      e.source = { title: e.enTitle, url: e.enUrl, license: "CC BY-SA 4.0" };
    } else throw new Error(`${r.viewId}: action ${r.action}`);
    n[r.action as keyof typeof n]++;
  }
  console.log(n);
  if (write) writeFileSync(OUT, JSON.stringify(doc, null, 1));
  else console.log("chạy khô — thêm --write để ghi");
}

/** result = {rows:[{viewId, action:"APPROVE"|"DROP", en?}]}: APPROVE ghi `en` (nguyên văn bài en). */
function mergeEn(resultPath: string, write: boolean) {
  const doc = JSON.parse(readFileSync(OUT, "utf8")) as Doc;
  const rows = (JSON.parse(readFileSync(resultPath, "utf8")) as { rows: { viewId: string; action: string; en?: string }[] }).rows;
  const byId = new Map(doc.entries.map((e) => [e.viewId, e]));
  const n = { APPROVE: 0, DROP: 0 };
  for (const r of rows) {
    const e = byId.get(r.viewId);
    if (!e) throw new Error(`${r.viewId} không có trong ${OUT}`);
    if (r.action === "DROP") {
      delete e.en;
    } else if (r.action === "APPROVE") {
      const text = r.en?.trim();
      if (!text || !e.enText || !e.enTitle || !e.enUrl) throw new Error(`${r.viewId}: APPROVE cần câu en + bài en`);
      // Nguyên văn: câu phải nằm trong đoạn bài en đã tải — không viết lại.
      if (!e.enText.replace(/\s+/g, " ").includes(text.replace(/\s+/g, " "))) throw new Error(`${r.viewId}: câu en không có nguyên văn trong bài`);
      e.en = { text, reviewed: true };
    } else throw new Error(`${r.viewId}: action ${r.action}`);
    n[r.action as keyof typeof n]++;
  }
  console.log(n);
  if (write) writeFileSync(OUT, JSON.stringify(doc, null, 1));
  else console.log("chạy khô — thêm --write để ghi");
}

function emitClient() {
  const doc = JSON.parse(readFileSync(OUT, "utf8")) as Doc;
  const map: Record<string, { text: string; title: string; url: string; en?: { text: string; title: string; url: string } }> = {};
  for (const e of doc.entries) {
    if (!e.description?.reviewed || !e.source || e.description.lang !== "vi") continue;
    map[e.viewId] = { text: e.description.text, title: e.source.title, url: e.source.url };
    if (e.en?.reviewed && e.enTitle && e.enUrl) map[e.viewId].en = { text: e.en.text, title: e.enTitle, url: e.enUrl };
  }
  writeFileSync(CLIENT_OUT, JSON.stringify(map, null, 1) + "\n");
  console.log(`Đã ghi ${path.relative(process.cwd(), CLIENT_OUT)}: ${Object.keys(map).length} nhóm.`);
}

const args = process.argv.slice(2);
const at = (flag: string) => args[args.indexOf(flag) + 1];
const run = args.includes("--emit-review")
  ? async () => emitReview(at("--emit-review"))
  : args.includes("--merge-en")
    ? async () => mergeEn(at("--merge-en"), args.includes("--write"))
  : args.includes("--merge")
    ? async () => merge(at("--merge"), args.includes("--write"))
    : args.includes("--emit-client")
      ? async () => emitClient()
      : () => lookup(args.includes("--write"));
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
