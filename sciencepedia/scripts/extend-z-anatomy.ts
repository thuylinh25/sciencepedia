/**
 * Nối thêm mảnh vào supplement Z-Anatomy MÀ KHÔNG tạo lại các mảnh cũ.
 *
 * Vì sao nối thêm thay vì chạy lại import-z-anatomy.ts:
 *  - Manifest hiện hành không tái lập được bằng import script hiện tại (chạy thử
 *    trên một dump đầy đủ cho 600 mảnh thay vì 605: thiếu lacunar/sacral nodes,
 *    thừa prepericardial/splenic nodes) — tạo lại toàn bộ sẽ âm thầm thay dữ
 *    liệu đang chạy trên production.
 *  - Bản dump append ít RAM đặt sai vị trí các đối tượng có transform ở cha.
 * Nên: giữ nguyên từng byte hình học của 605 mảnh cũ trong chunk, chỉ nối 6
 * mảnh mới ở cuối chunk và cộng 3 khái niệm + 6 mảnh vào manifest. Hình học mới
 * lấy từ scripts/blender/za-extract.py (đánh giá KÈM chuỗi cha). Định dạng ghi
 * (float32 vị trí, int16 pháp tuyến lượng tử hoá, uint32 chỉ số, đệm 4 byte,
 * băm sha256) chép đúng import-z-anatomy.ts.
 *
 * Bổ sung đợt này (2026-10-27): cơ vuông thắt lưng + cơ ngang bụng (hệ cơ —
 * Z-Anatomy có lưới sẵn, BodyParts3D không có khái niệm nào cho chúng; các view
 * cơ lưng/bụng của atlas đang ghi "thiếu" hai cơ này) và hạnh nhân khẩu cái
 * (hệ bạch huyết — view hạnh nhân đang là placeholder "missing").
 * pick() của import-z-anatomy.ts cũng đã mở cho ba cấu trúc này để lần tạo lại
 * toàn bộ trong tương lai cho cùng tập mảnh.
 *
 * Chạy:  npx tsx --env-file-if-exists=.env scripts/extend-z-anatomy.ts [--write] [--upload]
 * Cần trước: blender … --python scripts/blender/za-extract.py -- <6 tên đối tượng>
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import * as THREE from "three";
import { BUCKET, missingEnv, put } from "./r2-client";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/z-anatomy.json");
const EXTRACT = path.join(ROOT, ".cache/z-anatomy/extract");
const OUT_DIR = path.join(ROOT, ".cache/z-anatomy/out");

// ── Khớp import-z-anatomy.ts: phép biến đổi ZA → không gian BodyParts3D ──────
const OFFSET: [number, number, number] = [-0.0005, 0.0072, -0.0016];
const HEAD_FIX: [number, number, number] = [0, -0.0024, -0.0105];
function toAtlas(x: number, y: number, z: number): [number, number, number] {
  const p: [number, number, number] = [x + OFFSET[0], z + OFFSET[1], -y + OFFSET[2]];
  const t = Math.min(1, Math.max(0, (p[1] - 1.4) / 0.15));
  return [p[0], p[1] + t * HEAD_FIX[1], p[2] + t * HEAD_FIX[2]];
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Khớp naming() của import-z-anatomy.ts cho tên dạng "X.l"/"X.r". */
function naming(raw: string): { full: string; base: string } {
  const side = raw.match(/\.([lr])$/)?.[1];
  const n = raw.replace(/\.[lr]$/, "").trim();
  const base = n.charAt(0).toUpperCase() + n.slice(1);
  const full = side ? `${side === "l" ? "Left" : "Right"} ${n.charAt(0).toLowerCase()}${n.slice(1)}` : base;
  return { full, base };
}

// Phải khớp từng chữ với LICENSE của import-z-anatomy.ts (cùng một tệp LICENSE.txt).
const LICENSE = `Derived from Z-Anatomy - The libre 3D atlas of anatomy (CC BY-SA 4.0)
https://github.com/Z-Anatomy/Models-of-human-anatomy
which is based on BodyParts3D, The Database Center for Life Science
(https://dbarchive.biosciencedbc.jp/en/bodyparts3d/).

Changes by Sciencepedia: selected peripheral nerves, spinal cord, veins, lymph nodes,
lung lobes, thyroid and parathyroid glands, quadratus lumborum and transversus
abdominis muscles, palatine tonsils, cranial nerves I/V/VI, brainstem nuclei,
falx cerebri, sympathetic trunk ganglia, middle and inner ear structures and auditory
ossicles absent from BodyParts3D 4.0; curves evaluated to meshes in Blender; registered to the
BodyParts3D 4.0 frame (axes x,z,-y; offset -0.5/7.2/-1.6 mm, median residual ~4.7 mm;
head region additionally shifted 0/-2.4/-10.5 mm, ramped linearly over y 1.40-1.55 m).
Distributed under the same licence, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
`;

type Addition = {
  object: string;
  system: string;
  group?: string;
  partOf?: string;
  /** Cửa sổ bounds kỳ vọng trong không gian atlas — ngoài cửa sổ là dừng (QA). */
  qa: { y: [number, number]; absX: [number, number]; z: [number, number] };
};
const ADDITIONS: Addition[] = [
  { object: "Quadratus lumborum muscle.l", system: "muscular", partOf: "FMA14628", qa: { y: [0.9, 1.2], absX: [0.005, 0.085], z: [-0.1, 0.0] } },
  { object: "Quadratus lumborum muscle.r", system: "muscular", partOf: "FMA14628", qa: { y: [0.9, 1.2], absX: [0.005, 0.085], z: [-0.1, 0.0] } },
  { object: "Transversus abdominis muscle.l", system: "muscular", partOf: "FMA20278", qa: { y: [0.8, 1.3], absX: [0.002, 0.15], z: [-0.08, 0.12] } },
  { object: "Transversus abdominis muscle.r", system: "muscular", partOf: "FMA20278", qa: { y: [0.8, 1.3], absX: [0.002, 0.15], z: [-0.08, 0.12] } },
  { object: "Palatine tonsil.l", system: "lymphatic", group: "lymphatic.tonsil", qa: { y: [1.5, 1.6], absX: [0.01, 0.04], z: [0.0, 0.04] } },
  { object: "Palatine tonsil.r", system: "lymphatic", group: "lymphatic.tonsil", qa: { y: [1.5, 1.6], absX: [0.01, 0.04], z: [0.0, 0.04] } },
];

type Part = {
  id: string; name: string; conceptId: string; system: string; group?: string;
  positions: number; normals: number; indices: number;
  vertexCount: number; indexCount: number;
  bounds: [[number, number, number], [number, number, number]];
};
type Manifest = {
  source: string; license: string; replaces: string[];
  chunk: { url: string; bytes: number; gzip: string; gzipBytes: number };
  parts: Part[];
  concepts: { id: string; name: string; partOf?: string; elements: string[] }[];
};

async function main() {
  const write = process.argv.includes("--write");
  const upload = process.argv.includes("--upload");
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  const extractIndex = JSON.parse(readFileSync(path.join(EXTRACT, "index.json"), "utf8")) as { name: string; file: string; verts: number }[];
  const byName = new Map(extractIndex.map((e) => [e.name, e]));

  // Chuẩn bị hình học (đã biến đổi sang không gian atlas) + QA căn chỉnh.
  const prepared = ADDITIONS.map((a) => {
    const entry = byName.get(a.object);
    if (!entry) throw new Error(`Thiếu trích xuất cho ${a.object} — chạy za-extract.py trước`);
    const { full, base } = naming(a.object);
    const id = `ZA-${slug(full)}`;
    const conceptId = `ZA-${slug(base)}`;
    if (manifest.parts.some((p) => p.id === id)) throw new Error(`Mảnh ${id} đã có trong manifest — đã nối rồi?`);
    const bin = readFileSync(path.join(EXTRACT, entry.file));
    const raw = new Float32Array(bin.buffer, bin.byteOffset, entry.verts * 3);
    const idx = new Uint32Array(bin.buffer, bin.byteOffset + entry.verts * 12, bin.length / 4 - entry.verts * 3);
    const pos = new Float32Array(entry.verts * 3);
    let cx = 0;
    for (let i = 0; i < entry.verts; i++) {
      const p = toAtlas(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]);
      pos.set(p, i * 3);
      cx += p[0];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const min = box.min.toArray() as [number, number, number];
    const max = box.max.toArray() as [number, number, number];
    const { qa } = a;
    const okY = min[1] >= qa.y[0] && max[1] <= qa.y[1];
    const okX = Math.max(Math.abs(min[0]), Math.abs(max[0])) <= qa.absX[1] && Math.min(Math.abs(min[0]), Math.abs(max[0])) >= qa.absX[0] - 0.004;
    const okZ = min[2] >= qa.z[0] && max[2] <= qa.z[1];
    const centroidX = cx / entry.verts;
    const okSide = a.object.endsWith(".l") ? centroidX > 0.003 : centroidX < -0.003;
    console.log(`${id}: x[${min[0].toFixed(3)},${max[0].toFixed(3)}] y[${min[1].toFixed(3)},${max[1].toFixed(3)}] z[${min[2].toFixed(3)},${max[2].toFixed(3)}] centroidX=${centroidX.toFixed(3)} QA y:${okY} x:${okX} z:${okZ} side:${okSide}`);
    if (!okY || !okX || !okZ || !okSide) throw new Error(`QA căn chỉnh KHÔNG đạt cho ${a.object} — dừng, không ghi gì`);
    const nrm = geo.attributes.normal.array as Float32Array;
    const nrm16 = Int16Array.from(nrm, (v) => Math.round(Math.max(-1, Math.min(1, v || 0)) * 32767));
    return { a, id, conceptId, full, base, pos, nrm16, idx, min, max };
  });

  // Tải chunk hiện tại và kiểm đúng kích thước manifest khai.
  const res = await fetch(manifest.chunk.url);
  if (!res.ok) throw new Error(`Tải chunk hiện tại lỗi: HTTP ${res.status}`);
  const oldBlob = Buffer.from(await res.arrayBuffer());
  if (oldBlob.length !== manifest.chunk.bytes) throw new Error(`Chunk tải về ${oldBlob.length} byte ≠ manifest ${manifest.chunk.bytes} — dừng`);
  if (oldBlob.length % 4 !== 0) throw new Error("Chunk cũ không chẵn 4 byte — lệch giả định đệm");

  // Nối hình học mới vào cuối (mọi byte cũ giữ nguyên).
  const blobs: Buffer[] = [oldBlob];
  let offset = oldBlob.length;
  const push = (b: Buffer) => {
    const at = offset;
    blobs.push(b);
    offset += b.byteLength;
    const pad = (4 - (offset % 4)) % 4;
    if (pad) { blobs.push(Buffer.alloc(pad)); offset += pad; }
    return at;
  };
  const newParts: Part[] = prepared.map((pr) => ({
    id: pr.id,
    name: pr.full,
    conceptId: pr.conceptId,
    system: pr.a.system,
    ...(pr.a.group ? { group: pr.a.group } : {}),
    positions: push(Buffer.from(pr.pos.buffer, pr.pos.byteOffset, pr.pos.byteLength)),
    normals: push(Buffer.from(pr.nrm16.buffer, pr.nrm16.byteOffset, pr.nrm16.byteLength)),
    indices: push(Buffer.from(pr.idx.buffer, pr.idx.byteOffset, pr.idx.byteLength)),
    vertexCount: pr.pos.length / 3,
    indexCount: pr.idx.length,
    bounds: [pr.min.map((v) => +v.toFixed(5)) as [number, number, number], pr.max.map((v) => +v.toFixed(5)) as [number, number, number]],
  }));
  const blob = Buffer.concat(blobs);
  // Tự kiểm: giải mã lại từng mảnh mới TỪ CHÍNH blob cuối — bounds phải khớp
  // và chỉ số không vượt số đỉnh. (QA ở bước chuẩn bị chỉ thấy hình học trong
  // bộ nhớ; lỗi đóng gói buffer chỉ lộ ở bước này.)
  for (const part of newParts) {
    const pos = new Float32Array(blob.buffer, blob.byteOffset + part.positions, part.vertexCount * 3);
    const idx = new Uint32Array(blob.buffer, blob.byteOffset + part.indices, part.indexCount);
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    let maxIdx = 0;
    for (let i = 0; i < pos.length; i++) { const k = i % 3; min[k] = Math.min(min[k], pos[i]); max[k] = Math.max(max[k], pos[i]); }
    for (let i = 0; i < idx.length; i++) maxIdx = Math.max(maxIdx, idx[i]);
    const dMin = Math.max(...min.map((v, k) => Math.abs(v - part.bounds[0][k])));
    const dMax = Math.max(...max.map((v, k) => Math.abs(v - part.bounds[1][k])));
    if (dMin > 1e-4 || dMax > 1e-4 || maxIdx >= part.vertexCount) throw new Error(`Tự kiểm blob THẤT BẠI cho ${part.id} (lệch bounds ${dMin}/${dMax}, maxIdx ${maxIdx})`);
    console.log(`tự kiểm ${part.id}: bounds khớp, maxIdx ${maxIdx} < ${part.vertexCount} đỉnh ✓`);
  }
  const gz = gzipSync(blob, { level: 9 });

  const newConcepts = new Map<string, { id: string; name: string; partOf?: string; elements: string[] }>();
  for (const pr of prepared) {
    const c = newConcepts.get(pr.conceptId) ?? { id: pr.conceptId, name: pr.base, ...(pr.a.partOf ? { partOf: pr.a.partOf } : {}), elements: [] };
    c.elements.push(pr.id);
    newConcepts.set(pr.conceptId, c);
  }
  for (const c of newConcepts.values()) if (manifest.concepts.some((m) => m.id === c.id)) throw new Error(`Khái niệm ${c.id} đã tồn tại`);

  const hash = createHash("sha256").update(blob).digest("hex").slice(0, 10);
  const PUBLIC = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
    `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");
  const prefix = `human-atlas/supplements/z-anatomy-${hash}`;
  const next: Manifest = {
    ...manifest,
    chunk: {
      url: `${PUBLIC}/supplements/z-anatomy-${hash}/z-anatomy.bin`,
      bytes: blob.byteLength,
      gzip: `${PUBLIC}/supplements/z-anatomy-${hash}/z-anatomy.bin.gz`,
      gzipBytes: gz.byteLength,
    },
    parts: [...manifest.parts, ...newParts],
    concepts: [...manifest.concepts, ...newConcepts.values()],
  };
  console.log(`mảnh ${manifest.parts.length} → ${next.parts.length}; khái niệm ${manifest.concepts.length} → ${next.concepts.length}; chunk ${(oldBlob.length / 1e6).toFixed(1)} → ${(blob.length / 1e6).toFixed(1)} MB (gzip ${(gz.byteLength / 1e6).toFixed(1)} MB); tiền tố ${prefix}`);
  if (!write) return console.log("(chạy khô — thêm --write)");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "z-anatomy.bin"), blob);
  writeFileSync(MANIFEST, `${JSON.stringify(next)}\n`);
  console.log(`Đã ghi ${path.relative(ROOT, MANIFEST)}`);
  if (!upload) return console.log("(chưa đẩy R2 — thêm --upload)");
  const missing = missingEnv();
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  const headers = (type: string) => ({ "content-type": type, "cache-control": "public, max-age=31536000, immutable" });
  await put(`${prefix}/z-anatomy.bin`, blob, headers("application/octet-stream"));
  await put(`${prefix}/z-anatomy.bin.gz`, gz, headers("application/gzip"));
  await put(`${prefix}/LICENSE.txt`, Buffer.from(LICENSE), headers("text/plain; charset=utf-8"));
  for (const [url, size] of [[next.chunk.url, blob.byteLength], [next.chunk.gzip, gz.byteLength]] as const) {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${head.ok && Number(head.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
    if (!(head.ok && Number(head.headers.get("content-length")) === size)) throw new Error(`Lệch kích thước sau tải lên: ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

void main();
