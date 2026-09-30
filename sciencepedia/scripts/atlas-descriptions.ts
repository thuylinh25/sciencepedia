/**
 * Mô tả ngắn (gloss 1-2 câu) cho các CẤU TRÚC CHÍNH của Bản đồ cơ thể người.
 *
 *   npx tsx --env-file-if-exists=.env scripts/atlas-descriptions.ts [--write] [--limit N]
 *
 * ## Nguồn — vì sao Wikipedia chứ không UMLS
 *
 * Mô tả lấy từ Wikipedia, map bằng mã FMA → Wikidata (thuộc tính P1402) → bài
 * Wikipedia. Nguồn tự mang thẩm quyền + trích dẫn, nên phần DỮ KIỆN không cần
 * qua science-editor: câu mô tả hiện kèm liên kết nguồn (CC BY-SA), như khối
 * "Nguồn & ghi công" của bài. Có bài tiếng Việt thì lấy NGUYÊN VĂN câu mở đầu;
 * chỉ có tiếng Anh thì để đó cho bước dịch máy (gắn nhãn "do AI") sau — đúng
 * chính sách atlas đang áp cho TÊN máy dịch (`terms-vi.ts`).
 *
 * UMLS MRCONSO chỉ có tên, không có định nghĩa; MRDEF (bản Full 38GB) chỉ tiếng
 * Anh và rất thưa cho giải phẫu FMA — nên không dùng.
 *
 * ## Chọn "cấu trúc chính"
 *
 * ~440 nhóm: cơ quan / xương / cơ có tên (theo tổ tiên FMA) + các mạch/thần kinh
 * đã duyệt tay trong `VI_NAMES`. Bỏ tên nhánh/nhánh phụ/phân thùy (noise của cây
 * mạch). Trái/phải GỘP: một mô tả dùng cho cả hai bên (Wikipedia cũng một bài).
 *
 * Chạy khô (mặc định) in báo cáo coverage; `--write` ghi
 * `data/anatomy/descriptions.json`. Cần `.cache/anatomy/audit.json`
 * (chạy `npx tsx scripts/anatomy-audit.ts` trước).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { VI_NAMES } from "../src/lib/human-atlas/names-vi";

const AUDIT = path.join(__dirname, "..", ".cache/anatomy/audit.json");
const OUT = path.join(__dirname, "..", "data/anatomy/descriptions.json");
const UA = "SciencePedia/1.0 (https://sciencepedia; linhlt@newwave.com.vn)";

type AuditPart = {
  id: string;
  name: string;
  conceptId: string; // "FMA7088"
  system: string;
  ancestors: string[];
  vertexCount: number;
};

type Group = {
  key: string; // tên đã bỏ trái/phải, thường hoá
  rep: AuditPart; // đại diện (ưu tiên không mang trái/phải)
  fmaAll: string[]; // mọi mã FMA thành viên (để dò Wikidata dự phòng)
  system: string;
};

// Tên nhánh cây mạch: không phải "cấu trúc chính".
const NOISE = /\b(branch|tributar(y|ies)|segmental|segment|arborial)\b/i;

// Tổ tiên FMA đánh dấu một thực thể là cơ quan / cơ / xương có tên.
const ORGAN_ANCESTORS = [
  "Organ",
  "Muscle organ",
  "Bone organ",
  "Solid organ",
  "Cavitated organ",
];

function isMain(p: AuditPart): boolean {
  if (NOISE.test(p.name)) return VI_NAMES[p.conceptId] != null; // đã duyệt thì vẫn nhận
  if (VI_NAMES[p.conceptId] != null) return true; // mạch/thần kinh đã duyệt tay
  return ORGAN_ANCESTORS.some((a) => (p.ancestors ?? []).includes(a));
}

const stripSideRaw = (n: string) =>
  n
    .replace(/^(left|right)\s+/i, "")
    .replace(/\s+(left|right)$/i, "")
    .replace(/\b(left|right)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
const stripSide = (n: string) => stripSideRaw(n).toLowerCase();

function selectGroups(parts: AuditPart[]): Group[] {
  const byConcept = new Map<string, AuditPart>();
  for (const p of parts) if (!byConcept.has(p.conceptId)) byConcept.set(p.conceptId, p);
  const groups = new Map<string, AuditPart[]>();
  for (const c of byConcept.values()) {
    if (!isMain(c)) continue;
    const k = stripSide(c.name);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(c);
  }
  const out: Group[] = [];
  for (const [key, members] of groups) {
    // Đại diện: bài Wikipedia thường không gắn bên → ưu tiên tên KHÔNG có trái/phải,
    // rồi tới mảnh nhiều đỉnh nhất (nổi bật hơn).
    const rep =
      members.find((m) => !/\b(left|right)\b/i.test(m.name)) ??
      [...members].sort((a, b) => b.vertexCount - a.vertexCount)[0];
    out.push({ key, rep, fmaAll: members.map((m) => m.conceptId), system: rep.system });
  }
  // Ổn định: theo hệ rồi theo tên, để diff nhỏ giữa các lần chạy.
  return out.sort((a, b) => a.system.localeCompare(b.system) || a.key.localeCompare(b.key));
}

// ---------------------------------------------------------------- Wikidata

type SiteLinks = { item: string; vi?: string; en?: string };

/** P1402 (FMA ID) → item + bài vi/en, cho toàn bộ mã một lần bằng SPARQL POST. */
async function wikidataSitelinks(fmaNumeric: string[]): Promise<Map<string, SiteLinks>> {
  const values = fmaNumeric.map((c) => `"${c}"`).join(" ");
  const query = `
SELECT ?fma ?item ?vi ?en WHERE {
  VALUES ?fma { ${values} }
  ?item wdt:P1402 ?fma.
  OPTIONAL { ?vi schema:about ?item; schema:isPartOf <https://vi.wikipedia.org/> }
  OPTIONAL { ?en schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> }
}`;
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };
  const map = new Map<string, SiteLinks>();
  for (const b of json.results.bindings) {
    const fma = b.fma.value;
    const cur = map.get(fma) ?? { item: b.item?.value ?? "" };
    if (b.item) cur.item = b.item.value;
    if (b.vi) cur.vi = decodeURIComponent(b.vi.value.split("/wiki/")[1]);
    if (b.en) cur.en = decodeURIComponent(b.en.value.split("/wiki/")[1]);
    map.set(fma, cur);
  }
  return map;
}

// ---------------------------------------------------------------- Wikipedia

type Summary = { lang: "vi" | "en"; title: string; url: string; extract: string; qid?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch có thử lại: 429/5xx thì lùi dần; 404 trả null ngay (miss thật). */
async function fetchRetry(url: string, init?: RequestInit, tries = 4): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 400 * 2 ** i);
      continue;
    }
    return null; // 4xx khác: bỏ
  }
  return null;
}

/** REST summary của Wikipedia; bỏ trang định hướng. Kèm `wikibase_item` (Qid). */
async function wikipediaSummary(lang: "vi" | "en", title: string): Promise<Summary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetchRetry(url, { headers: { "User-Agent": UA } });
  if (!res) return null;
  const j = (await res.json()) as {
    type?: string;
    extract?: string;
    titles?: { canonical?: string };
    wikibase_item?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  if (j.type === "disambiguation") return null;
  const extract = (j.extract ?? "").trim();
  if (!extract || /\bmay refer to\b|\bcó thể (là|đề cập)\b/i.test(extract)) return null;
  const canonical = j.titles?.canonical ?? title;
  return {
    lang,
    title: canonical,
    url: j.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(canonical)}`,
    extract: firstSentences(extract, 2),
    qid: j.wikibase_item,
  };
}

/** Qid → tên bài tiếng Việt (nếu có), một SPARQL cho nhiều Qid. */
async function viTitlesForQids(qids: string[]): Promise<Map<string, string>> {
  if (qids.length === 0) return new Map();
  const values = qids.map((q) => `wd:${q}`).join(" ");
  const query = `
SELECT ?item ?vi WHERE {
  VALUES ?item { ${values} }
  ?vi schema:about ?item; schema:isPartOf <https://vi.wikipedia.org/> .
}`;
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata Qid→vi ${res.status}`);
  const json = (await res.json()) as { results: { bindings: Array<Record<string, { value: string }>> } };
  const map = new Map<string, string>();
  for (const b of json.results.bindings) {
    const qid = b.item.value.split("/entity/")[1];
    map.set(qid, decodeURIComponent(b.vi.value.split("/wiki/")[1]));
  }
  return map;
}

/** Cắt còn tối đa n câu; giữ dấu chấm. Đủ cho một gloss. */
function firstSentences(text: string, n: number): string {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, n).join("").trim();
}

// ---------------------------------------------------------------- pool

async function pool<T, R>(items: T[], size: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

// ---------------------------------------------------------------- main

type Entry = {
  fma: string;
  fmaAll: string[];
  viName: string | null;
  enName: string;
  system: string;
  status: "vi" | "en-untranslated" | "none";
  description: { lang: "vi" | "en"; text: string; translated: false } | null;
  source: { title: string; url: string; license: "CC BY-SA 4.0" } | null;
};

async function run() {
  const write = process.argv.includes("--write");
  const limArg = process.argv.indexOf("--limit");
  const limit = limArg >= 0 ? Number(process.argv[limArg + 1]) : Infinity;

  if (!existsSync(AUDIT)) {
    console.error(`Thiếu ${AUDIT}. Chạy: npx tsx scripts/anatomy-audit.ts`);
    process.exit(1);
  }
  const parts = JSON.parse(readFileSync(AUDIT, "utf8")) as AuditPart[];
  let groups = selectGroups(parts);
  if (Number.isFinite(limit)) groups = groups.slice(0, limit);
  console.log(`Cấu trúc chính (trái/phải gộp): ${groups.length}`);

  // 1) Wikidata P1402: bổ trợ (map thưa) — cho tên bài vi/en sẵn khi có.
  const allFma = [...new Set(groups.flatMap((g) => g.fmaAll))].map((c) => c.replace(/^FMA/, ""));
  console.log(`Dò Wikidata P1402 cho ${allFma.length} mã FMA…`);
  const links = await wikidataSitelinks(allFma);
  const linkOf = (g: Group) => {
    for (const fma of [g.rep.conceptId, ...g.fmaAll]) {
      const l = links.get(fma.replace(/^FMA/, ""));
      if (l && (l.vi || l.en)) return l;
    }
    return undefined;
  };

  // 2) Tra tiếng Anh trước bằng CHÍNH tên FMA (REST theo redirect) — độ phủ cao
  //    hơn P1402. Thử lần lượt: P1402.en → tên (bỏ bên) → tên bỏ luôn số thứ tự
  //    ("eleventh thoracic vertebra" → "thoracic vertebra", về bài chung).
  const stripOrdinal = (n: string) =>
    n.replace(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+/i, "").trim();
  const enTitlesOf = (g: Group) => {
    const base = stripSideRaw(g.rep.name);
    return [...new Set([linkOf(g)?.en, base, stripOrdinal(base)].filter(Boolean) as string[])];
  };
  console.log(`Tra Wikipedia (en) cho ${groups.length} nhóm…`);
  const enSummaries = await pool(groups, 4, async (g) => {
    let s: Summary | null = null;
    for (const t of enTitlesOf(g)) {
      s = await wikipediaSummary("en", t);
      if (s) break;
    }
    return { g, s };
  });

  // 3) vi: ưu tiên P1402.vi; nếu không, từ Qid của bài en → bài vi.
  const needVi = enSummaries.filter((x) => x.s?.qid && !linkOf(x.g)?.vi);
  const qidToVi = await viTitlesForQids([...new Set(needVi.map((x) => x.s!.qid!))]);
  const viTitleOf = (g: Group, qid?: string) => linkOf(g)?.vi ?? (qid ? qidToVi.get(qid) : undefined);

  const withViTitle = enSummaries
    .map((x) => ({ g: x.g, en: x.s, viTitle: viTitleOf(x.g, x.s?.qid) }))
    .filter((x) => x.viTitle) as Array<{ g: Group; en: Summary | null; viTitle: string }>;
  console.log(`Tra Wikipedia (vi) cho ${withViTitle.length} bài có bản tiếng Việt…`);
  const viSummaries = await pool(withViTitle, 4, async (x) => ({
    key: x.g.key,
    s: await wikipediaSummary("vi", x.viTitle),
  }));
  const viByKey = new Map(viSummaries.map((x) => [x.key, x.s]));

  // 4) Chọn: vi nếu có, else en.
  const byKey = new Map<string, Summary | null>();
  for (const x of enSummaries) byKey.set(x.g.key, viByKey.get(x.g.key) ?? x.s);

  // 4) Dựng entries.
  const entries: Entry[] = groups.map((g) => {
    const s = byKey.get(g.key) ?? null;
    const status: Entry["status"] = !s ? "none" : s.lang === "vi" ? "vi" : "en-untranslated";
    return {
      fma: g.rep.conceptId,
      fmaAll: g.fmaAll,
      viName: VI_NAMES[g.rep.conceptId] ?? null,
      enName: g.rep.name,
      system: g.system,
      status,
      description: s ? { lang: s.lang, text: s.extract, translated: false } : null,
      source: s ? { title: s.title.replace(/_/g, " "), url: s.url, license: "CC BY-SA 4.0" } : null,
    };
  });

  // Báo cáo.
  const by = (st: Entry["status"]) => entries.filter((e) => e.status === st).length;
  console.log(`\n=== Coverage ===`);
  console.log(`  vi (nguyên văn Wikipedia):   ${by("vi")}`);
  console.log(`  en (chờ dịch máy):           ${by("en-untranslated")}`);
  console.log(`  không có bài:                ${by("none")}`);
  const sysTally = new Map<string, [number, number, number]>();
  for (const e of entries) {
    const t = sysTally.get(e.system) ?? [0, 0, 0];
    t[e.status === "vi" ? 0 : e.status === "en-untranslated" ? 1 : 2]++;
    sysTally.set(e.system, t);
  }
  console.log(`\n=== Theo hệ (vi / en / trống) ===`);
  for (const [sys, t] of [...sysTally].sort((a, b) => b[1][0] + b[1][1] + b[1][2] - (a[1][0] + a[1][1] + a[1][2])))
    console.log(`  ${sys.padEnd(14)} ${t[0]} / ${t[1]} / ${t[2]}`);

  console.log(`\n=== 12 mẫu ===`);
  for (const e of entries.filter((e) => e.description).slice(0, 12))
    console.log(`  [${e.status}] ${e.enName} — ${e.description!.text.slice(0, 90)}…`);
  console.log(`\n=== 10 nhóm KHÔNG có bài ===`);
  for (const e of entries.filter((e) => e.status === "none").slice(0, 10))
    console.log(`  ${e.fma} ${e.enName}`);

  if (write) {
    const payload = {
      schema: 1,
      note: "Mô tả cấu trúc chính; nguồn Wikipedia (CC BY-SA) map qua FMA→Wikidata P1402. en = chờ dịch máy.",
      count: entries.length,
      entries,
    };
    writeFileSync(OUT, JSON.stringify(payload, null, 1));
    console.log(`\nĐã ghi ${OUT} (${entries.length} mục).`);
  } else {
    console.log(`\n(chạy khô — thêm --write để ghi ${path.relative(process.cwd(), OUT)})`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
