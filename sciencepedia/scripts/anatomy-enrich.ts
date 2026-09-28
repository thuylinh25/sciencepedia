import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import pLimit from "p-limit";

import { atlasSchema } from "../src/lib/human-atlas/anatomy";
import { anatomyDataUrl, atlasDataUrl } from "../src/lib/human-atlas/assets";
import { buildContent } from "./anatomy-content";
import {
  ANATOMY_SOURCES,
  anatomyDataSchema,
  type AnatomyData,
  type AnatomyStructure,
  type PartOfRelation,
} from "../src/lib/human-atlas/structures";

/**
 * Làm giàu dữ liệu giải phẫu: mã FMA của BodyParts3D → Sciencepedia anatomy data.
 *
 *   npx tsx --env-file-if-exists=.env scripts/anatomy-enrich.ts            # chạy khô: tải/cache, kiểm, in thống kê
 *   npx tsx --env-file-if-exists=.env scripts/anatomy-enrich.ts --write    # ghi data/anatomy/fma-structures.json
 *   … --upload                                                             # đẩy bản đã ghi lên R2 (cần --write cùng lượt hoặc trước đó)
 *   … --atlas <atlas.json>                                                 # đọc atlas cục bộ thay vì R2
 *
 * ## Pipeline
 *
 *   atlas.json (BodyParts3D) → mã FMA duy nhất → FMA 5.1.0 (qua EBI OLS)
 *     → tên Anh / Latin / đồng nghĩa / is-a / part-of / TA98 → Zod → JSON
 *
 * Chỉ Level 0–1 (docs/content-rules.md, mục "Bản đồ cơ thể người: mỗi cấu trúc chỉ nói điều nguồn nói"). Không
 * một chữ nào ở đây do AI viết: mọi trường chép từ FMA, trường nào FMA không
 * có thì `null`/mảng rỗng. Nội dung giải thích (Level 2+) sẽ có pipeline
 * riêng với cổng science-editor, không lẻn vào qua script này.
 *
 * ## Vì sao OLS chứ không tải `fma.owl`
 *
 * `fma.owl` 198 MB RDF/XML; OLS phục vụ ĐÚNG bản 5.1.0 ấy dưới dạng JSON,
 * mỗi lớp kèm nhãn của mọi lớp nó trỏ tới (`linkedEntities`) — nên một lượt
 * gọi cho một khái niệm là đủ, không cần dựng lại cả đồ thị. Script kiểm
 * phiên bản OLS đang phục vụ và DỪNG nếu nó không khớp `ANATOMY_SOURCES.fma`.
 *
 * ## Vì sao khoá theo mã FMA, không theo tên
 *
 * 2.234 mảnh ≠ 2.234 khái niệm: một khái niệm (`FMA7088` tim) gom nhiều
 * mảnh, và BodyParts3D còn có khái niệm nhóm không có mảnh riêng. Tên tiếng
 * Anh khác hoa thường giữa `parts` và `concepts`, và đổi khi bộ dữ liệu dựng
 * lại. Mã FMA thì không.
 *
 * ## Cache
 *
 * Phản hồi thô của OLS nằm ở `.cache/anatomy/<nguồn>/` (gitignored): chạy lại
 * không gọi mạng, và khi cần Level 3 (cấp máu, thần kinh chi phối — đã có sẵn
 * trong phản hồi thô) thì đọc lại cache chứ không tải lại.
 */

const FMA = "http://purl.org/sig/ont/fma/";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const RDFS_SUBCLASS = "http://www.w3.org/2000/01/rdf-schema#subClassOf";
const OWL_ON_PROPERTY = "http://www.w3.org/2002/07/owl#onProperty";
const OWL_SOME_VALUES = "http://www.w3.org/2002/07/owl#someValuesFrom";

/** Quan hệ "là bộ phận của" mà FMA dùng; thứ tự = thứ tự ưu tiên khi hiển thị một cha. */
const PART_OF_PROPERTIES: PartOfRelation["rel"][] = [
  "regional_part_of",
  "constitutional_part_of",
  "systemic_part_of",
  "member_of",
];

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data/anatomy/fma-structures.json");
const CACHE = path.join(ROOT, ".cache/anatomy", `ols-fma-${ANATOMY_SOURCES.fma.version}`);

function arg(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

// ------------------------------------------------------------------ OLS

type Json = Record<string, unknown>;

/** Giá trị OLS có thể là chuỗi, mảng, hoặc nút "reification" `{ value, axioms }`. */
function list(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object" && "value" in value) return text((value as Json).value);
  return null;
}

/** Thuộc tính trên axiom của một nút reification (`language`, `TA_ID`…). */
function axiom(value: unknown, property: string): string[] {
  if (!value || typeof value !== "object") return [];
  return list((value as Json).axioms).flatMap((a) =>
    a && typeof a === "object" ? list((a as Json)[FMA + property]).map(text).filter((x): x is string => !!x) : [],
  );
}

function fmaId(iri: string): string | null {
  const match = /\/fma(\d+)$/i.exec(iri);
  return match ? `FMA${match[1]}` : null;
}

function iriOf(id: string): string {
  return `${FMA}fma${id.replace(/^FMA/, "")}`;
}

async function olsVersion(): Promise<string> {
  const response = await fetch("https://www.ebi.ac.uk/ols4/api/ontologies/fma");
  if (!response.ok) throw new Error(`OLS ontology: HTTP ${response.status}`);
  const body = (await response.json()) as { config?: { versionIri?: string } };
  const match = /fma_(\d+\.\d+\.\d+)\.owl/.exec(body.config?.versionIri ?? "");
  if (!match) throw new Error(`OLS không báo versionIri: ${JSON.stringify(body.config)}`);
  return match[1];
}

async function fetchClass(id: string): Promise<Json | null> {
  const file = path.join(CACHE, `${id}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as Json;

  const iri = encodeURIComponent(encodeURIComponent(iriOf(id)));
  const url = `https://www.ebi.ac.uk/ols4/api/v2/ontologies/fma/classes/${iri}`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    if (response.status === 404) {
      writeFileSync(file, "null");
      return null;
    }
    if (response.ok) {
      const body = (await response.json()) as Json;
      writeFileSync(file, JSON.stringify(body));
      return body;
    }
    if (attempt >= 4) throw new Error(`${id}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt ** 2));
  }
}

// ------------------------------------------------------------- chuẩn hoá

function normalize(
  id: string,
  raw: Json,
  labels: Map<string, string>,
): AnatomyStructure {
  for (const [iri, entity] of Object.entries((raw.linkedEntities ?? {}) as Record<string, Json>)) {
    const linked = fmaId(iri);
    const label = text(list(entity.label)[0]);
    if (linked && label) labels.set(linked, label);
  }

  const preferred = list(raw[FMA + "preferred_name"]);
  const en = text(preferred[0]) ?? text(list(raw[RDFS_LABEL])[0]) ?? text(list(raw.label)[0]);
  if (!en) throw new Error(`${id}: FMA không có tên`);

  // Chỉ nhận đúng giá trị FMA gắn nhãn ngôn ngữ "Latin" — danh sách
  // non-English equivalent trộn cả Pháp, Đức, Tây Ban Nha; đoán ngôn ngữ theo
  // mặt chữ ("Cor" hay "Coeur"?) là bịa.
  const latin = list(raw[FMA + "non-English_equivalent"])
    .filter((value) => axiom(value, "language").includes("Latin"))
    .map(text)
    .filter((x): x is string => !!x);

  const synonymsEn = list(raw[FMA + "synonym"])
    .filter((value) => {
      const language = axiom(value, "language");
      return language.length === 0 || language.includes("English");
    })
    .map(text)
    .filter((x): x is string => !!x && x !== en);

  // TA_ID của FMA là mã Terminologia Anatomica 1998 (TA98) — ghi trên axiom
  // của preferred name, kèm authority "Terminologia Anatomica 1998". KHÔNG
  // phải TA2; mã TA2 để `null` cho tới khi có nguồn ánh xạ thật.
  const ta98 = preferred.flatMap((value) => axiom(value, "TA_ID"))[0] ?? null;

  const isA = list(raw.directParent)
    .map((iri) => (typeof iri === "string" ? fmaId(iri) : null))
    .filter((x): x is string => !!x);

  const partOf: PartOfRelation[] = [];
  for (const restriction of list(raw[RDFS_SUBCLASS])) {
    if (!restriction || typeof restriction !== "object") continue;
    const property = String((restriction as Json)[OWL_ON_PROPERTY] ?? "").replace(FMA, "");
    const target = (restriction as Json)[OWL_SOME_VALUES];
    const rel = PART_OF_PROPERTIES.find((p) => p === property);
    const targetId = typeof target === "string" ? fmaId(target) : null;
    if (rel && targetId) partOf.push({ rel, id: targetId });
  }
  partOf.sort((a, b) => PART_OF_PROPERTIES.indexOf(a.rel) - PART_OF_PROPERTIES.indexOf(b.rel));

  return {
    id,
    names: { en, la: latin[0] ?? null },
    synonyms: { en: [...new Set(synonymsEn)], la: latin.slice(1) },
    classification: { isA, partOf },
    identifiers: { fma: id, ta98, ta2: null, umls: null },
    level: latin.length > 0 || synonymsEn.length > 0 || isA.length > 0 || partOf.length > 0 ? 1 : 0,
    sources: [
      {
        ref: "fma",
        supports: ["names.en", "names.la", "synonyms", "classification", "identifiers.ta98"],
      },
    ],
  };
}

// ----------------------------------------------------------------- main

async function main() {
  const write = process.argv.includes("--write");
  const upload = process.argv.includes("--upload");
  mkdirSync(CACHE, { recursive: true });

  // 1. Đọc metadata BodyParts3D đang phát.
  const atlasPath = arg("--atlas");
  const atlasRaw = atlasPath
    ? JSON.parse(readFileSync(atlasPath, "utf8"))
    : await (await fetch(atlasDataUrl("atlas.json"))).json();
  const atlas = atlasSchema.parse(atlasRaw);

  // 2–4. Mã FMA duy nhất, chuẩn hoá, bỏ trùng. Mọi khái niệm — kể cả nhóm
  // không có mảnh riêng — vì viewer chọn và tìm được cả chúng.
  const ids = new Set<string>();
  const rejected: string[] = [];
  for (const id of [...atlas.concepts.map((c) => c.id), ...atlas.parts.map((p) => p.conceptId)]) {
    const normalized = /^FMA\d+$/i.test(id.trim()) ? id.trim().toUpperCase() : null;
    if (normalized) ids.add(normalized);
    else rejected.push(id);
  }
  console.log(
    `${atlas.parts.length} mảnh · ${atlas.concepts.length} khái niệm · ${ids.size} mã FMA duy nhất` +
      (rejected.length ? ` · ${rejected.length} mã không phải FMA: ${rejected.slice(0, 5).join(", ")}` : ""),
  );

  // 5. Nguồn đúng phiên bản chưa?
  const version = await olsVersion();
  if (version !== ANATOMY_SOURCES.fma.version) {
    throw new Error(
      `OLS đang phục vụ FMA ${version}, dữ liệu khai báo ${ANATOMY_SOURCES.fma.version}. ` +
        "Kiểm giấy phép bản mới rồi sửa ANATOMY_SOURCES trước khi chạy.",
    );
  }

  const limit = pLimit(4);
  let done = 0;
  const raws = new Map<string, Json | null>();
  await Promise.all(
    [...ids].map((id) =>
      limit(async () => {
        raws.set(id, await fetchClass(id));
        if (++done % 250 === 0) console.log(`  … ${done}/${ids.size}`);
      }),
    ),
  );

  // 6–9. Ánh xạ, thuật ngữ, mã chéo, nguồn.
  const labels = new Map<string, string>();
  const structures: Record<string, AnatomyStructure> = {};
  const missing: string[] = [];
  for (const id of [...ids].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))) {
    const raw = raws.get(id);
    if (!raw || raw.isObsolete === true) {
      missing.push(id);
      continue;
    }
    structures[id] = normalize(id, raw, labels);
  }

  // Tên của mọi mã được trỏ tới (cha is-a, cha part-of) mà không có mảnh
  // trong atlas — để bảng chi tiết ghi được "thuộc <tên>" không cần gọi mạng.
  const referenced = new Set(
    Object.values(structures).flatMap((s) => [
      ...s.classification.isA,
      ...s.classification.partOf.map((p) => p.id),
    ]),
  );
  const terms: Record<string, string> = {};
  for (const id of [...referenced].sort()) {
    if (structures[id]) continue;
    const label = labels.get(id);
    if (label) terms[id] = label;
  }

  const base: AnatomyData = anatomyDataSchema.parse({
    schema: 1,
    atlas: atlas.version,
    sources: Object.values(ANATOMY_SOURCES),
    structures,
    terms,
    unresolved: missing,
  });

  // Level 2: nội dung viết tay, kiểm từng mục (scripts/anatomy-content.ts).
  const level2 = await buildContent(base);
  const data: AnatomyData = anatomyDataSchema.parse({ ...base, content: level2.content });
  console.log(
    `\nLevel 2: ${Object.keys(level2.content).length} mục phát hành · ${level2.drafts.length} bản nháp chờ duyệt` +
      (level2.drafts.length ? ` (${level2.drafts.join(", ")})` : "") +
      ` · ${level2.errors.length} lỗi`,
  );
  for (const error of level2.errors) console.log(`  ✗ ${error}`);
  for (const warning of level2.warnings) console.log(`  ! ${warning}`);
  if (level2.errors.length > 0) process.exitCode = 1;

  // 10. Kiểm.
  const values = Object.values(data.structures);
  const count = (predicate: (s: AnatomyStructure) => boolean) => values.filter(predicate).length;
  const danglingParents = values.filter((s) =>
    [...s.classification.isA, ...s.classification.partOf.map((p) => p.id)].some(
      (p) => !data.structures[p] && !data.terms[p],
    ),
  );
  console.log(`
Khái niệm có dữ liệu FMA: ${values.length}/${ids.size}${missing.length ? ` (thiếu/lỗi thời: ${missing.join(", ")})` : ""}
  tên Latin:          ${count((s) => !!s.names.la)}
  đồng nghĩa Anh:     ${count((s) => s.synonyms.en.length > 0)}
  mã TA98:            ${count((s) => !!s.identifiers.ta98)}
  cha is-a:           ${count((s) => s.classification.isA.length > 0)}
  cha part-of:        ${count((s) => s.classification.partOf.length > 0)}
  Level 1 / Level 0:  ${count((s) => s.level === 1)} / ${count((s) => s.level === 0)}
  cha không tra tên:  ${danglingParents.length}`);
  if (danglingParents.length > 0) process.exitCode = 1;

  // 11. Ghi.
  const json = `${JSON.stringify(data, null, 1)}\n`;
  if (write) {
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, json);
    console.log(`\nĐã ghi ${path.relative(ROOT, OUT)} (${(json.length / 1024).toFixed(0)} KB)`);
  } else {
    console.log(`\nChạy khô: ${(json.length / 1024).toFixed(0)} KB. Thêm --write để ghi.`);
  }

  if (upload) {
    const { gzipSync } = await import("node:zlib");
    const { BUCKET, missingEnv, put } = await import("./r2-client");
    const missingVars = missingEnv();
    if (missingVars.length) throw new Error(`Thiếu trong .env: ${missingVars.join(", ")}`);
    // Bản phát hành gọn (không thụt lề); dấu vân từ chính byte ấy.
    const body = Buffer.from(JSON.stringify(anatomyDataSchema.parse(JSON.parse(readFileSync(OUT, "utf8")))));
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 10);
    const file = `fma-structures.${hash}.json`;
    // Hai bản như `atlas.json`: `.gz` (~12 lần nhẹ hơn) cho trình duyệt có
    // DecompressionStream, bản thô cho phần còn lại. R2 phát `.gz` như một
    // tệp nhị phân chứ không nén truyền tải — viewer tự giải.
    const gz = gzipSync(body, { level: 9 });
    for (const [name, bytes, type] of [
      [file, body, "application/json"],
      [`${file}.gz`, gz, "application/gzip"],
    ] as const) {
      await put(`human-atlas/anatomy/${name}`, bytes, {
        "content-type": type,
        "cache-control": "public, max-age=31536000, immutable",
      });
      const check = await fetch(anatomyDataUrl(name), { method: "HEAD", cache: "no-store" });
      if (!check.ok) throw new Error(`Đã đẩy ${name} nhưng URL công khai trả HTTP ${check.status}`);
      console.log(`Đã đẩy ${BUCKET}/human-atlas/anatomy/${name} (${(bytes.length / 1024).toFixed(0)} KB) ✓`);
    }
    console.log(`→ sửa ANATOMY_DATA_FILE trong src/lib/human-atlas/assets.ts thành "${file}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
