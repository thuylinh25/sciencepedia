/**
 * Vá pháp tuyến hỏng trong chunk Z-Anatomy ĐANG CHẠY, không đụng hình học.
 *
 * Vì sao: kiểm toán tài sản 2026-10-27 (`scripts/atlas-asset-audit.ts`) phát
 * hiện `ZA-spinal-dura` có 2.551/18.104 pháp tuyến đỉnh bằng 0 tuyệt đối (và
 * `ZA-falx-cerebri` có 4) — vùng đó đổ bóng đen/nan trong viewer. Số 0 này đến
 * từ đường dump Blender của đợt nhập đầu, không phải pipeline hiện hành:
 * `import-z-anatomy.ts` đã `computeVertexNormals()` (dòng 296) nên tạo lại
 * toàn bộ sẽ không tái hiện lỗi — nhưng tạo lại toàn bộ vẫn bị cấm vì manifest
 * hiện hành không tái lập được (xem đầu tệp extend-z-anatomy.ts).
 *
 * Cách vá (cùng kỷ luật với extend-z-anatomy.ts): tải chunk hiện tại, kiểm
 * đúng kích thước manifest khai, tính pháp tuyến mượt theo diện tích trên topo
 * đã hàn cho hai mảnh đích, CHỈ thay các pháp tuyến hỏng (độ dài < 0,5), giữ
 * nguyên từng byte còn lại. Cổng QA: với các đỉnh vốn tốt, góc giữa pháp tuyến
 * lưu sẵn và pháp tuyến tính lại phải nhỏ (trung vị < 8°) — lệch là dừng, vì
 * thế chứng tỏ quy ước hướng/winding khác với giả định. Tự kiểm trên blob cuối:
 * byte chỉ đổi trong hai dải pháp tuyến, và quét cả chunk không còn pháp tuyến
 * hỏng nào.
 *
 * Chạy:  npx tsx --env-file-if-exists=.env scripts/patch-z-anatomy-normals.ts [--write] [--upload]
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { BUCKET, missingEnv, put } from "./r2-client";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/z-anatomy.json");
const OUT_DIR = path.join(ROOT, ".cache/z-anatomy/out");
const TARGETS = ["ZA-spinal-dura", "ZA-falx-cerebri"];

// Khớp từng chữ với LICENSE trong extend-z-anatomy.ts (cùng tệp LICENSE.txt trên R2).
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

/** Pháp tuyến mượt theo diện tích trên topo đã hàn (khóa tọa độ 0,01 mm như bản kiểm toán). */
function smoothNormals(blob: Buffer, part: Part): Float32Array {
  const nv = part.vertexCount;
  const pos = new Float32Array(blob.buffer, blob.byteOffset + part.positions, nv * 3);
  const idx = new Uint32Array(blob.buffer, blob.byteOffset + part.indices, part.indexCount);
  const weld = new Map<string, number>();
  const wid = new Int32Array(nv);
  for (let i = 0; i < nv; i++) {
    const key = `${Math.round(pos[i * 3] * 1e5)},${Math.round(pos[i * 3 + 1] * 1e5)},${Math.round(pos[i * 3 + 2] * 1e5)}`;
    const w = weld.get(key);
    if (w === undefined) { weld.set(key, i); wid[i] = i; } else wid[i] = w;
  }
  const acc = new Float64Array(nv * 3);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [idx[t], idx[t + 1], idx[t + 2]]) {
      const w = wid[v] * 3;
      acc[w] += nx; acc[w + 1] += ny; acc[w + 2] += nz;
    }
  }
  const out = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    const w = wid[i] * 3;
    const len = Math.hypot(acc[w], acc[w + 1], acc[w + 2]);
    if (len > 0) { out[i * 3] = acc[w] / len; out[i * 3 + 1] = acc[w + 1] / len; out[i * 3 + 2] = acc[w + 2] / len; }
  }
  return out;
}

function badCount(blob: Buffer, part: Part): number {
  const n = new Int16Array(blob.buffer, blob.byteOffset + part.normals, part.vertexCount * 3);
  let bad = 0;
  for (let i = 0; i < part.vertexCount; i++) {
    const len = Math.hypot(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]) / 32767;
    if (!Number.isFinite(len) || len < 0.5) bad++;
  }
  return bad;
}

async function main() {
  const write = process.argv.includes("--write");
  const upload = process.argv.includes("--upload");
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  const res = await fetch(manifest.chunk.url);
  if (!res.ok) throw new Error(`Tải chunk hiện tại lỗi: HTTP ${res.status}`);
  const oldBlob = Buffer.from(await res.arrayBuffer());
  if (oldBlob.length !== manifest.chunk.bytes) throw new Error(`Chunk tải về ${oldBlob.length} byte ≠ manifest ${manifest.chunk.bytes} — dừng`);
  const blob = Buffer.from(oldBlob);

  const ranges: [number, number][] = [];
  for (const id of TARGETS) {
    const part = manifest.parts.find((p) => p.id === id);
    if (!part) throw new Error(`Không thấy mảnh ${id} trong manifest`);
    const before = badCount(oldBlob, part);
    const recomputed = smoothNormals(oldBlob, part);
    const stored = new Int16Array(oldBlob.buffer, oldBlob.byteOffset + part.normals, part.vertexCount * 3);
    // Cổng QA: đỉnh vốn tốt phải khớp pháp tuyến tính lại.
    const angles: number[] = [];
    for (let i = 0; i < part.vertexCount; i++) {
      const sl = Math.hypot(stored[i * 3], stored[i * 3 + 1], stored[i * 3 + 2]) / 32767;
      if (sl >= 0.5) {
        const dot = (stored[i * 3] / 32767) * recomputed[i * 3] + (stored[i * 3 + 1] / 32767) * recomputed[i * 3 + 1] + (stored[i * 3 + 2] / 32767) * recomputed[i * 3 + 2];
        angles.push(Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI);
      }
    }
    angles.sort((x, y) => x - y);
    const median = angles[Math.floor(angles.length / 2)];
    const p99 = angles[Math.floor(angles.length * 0.99)];
    console.log(`${id}: pháp tuyến hỏng ${before}/${part.vertexCount}; khớp với pháp tuyến tốt — trung vị ${median.toFixed(2)}°, p99 ${p99.toFixed(2)}°`);
    if (median > 8 || p99 > 35) throw new Error(`Cổng QA KHÔNG đạt cho ${id} — quy ước hướng khác giả định, dừng`);
    // Hướng dự phòng cho đỉnh mồ côi (không mặt nào dùng — không bao giờ được
    // vẽ, nhưng để dữ liệu sạch): hướng pháp tuyến tốt trung bình của mảnh.
    const mean = [0, 0, 0];
    for (let i = 0; i < part.vertexCount; i++) {
      const sl = Math.hypot(stored[i * 3], stored[i * 3 + 1], stored[i * 3 + 2]) / 32767;
      if (sl >= 0.5) { mean[0] += stored[i * 3]; mean[1] += stored[i * 3 + 1]; mean[2] += stored[i * 3 + 2]; }
    }
    const ml = Math.hypot(...mean) || 1;
    const fallback = mean.map((v) => v / ml);
    // Chỉ thay đỉnh hỏng.
    let replaced = 0, orphans = 0;
    for (let i = 0; i < part.vertexCount; i++) {
      const sl = Math.hypot(stored[i * 3], stored[i * 3 + 1], stored[i * 3 + 2]) / 32767;
      if (sl < 0.5) {
        const rl = Math.hypot(recomputed[i * 3], recomputed[i * 3 + 1], recomputed[i * 3 + 2]);
        const src = rl > 0 ? recomputed.subarray(i * 3, i * 3 + 3) : fallback;
        if (rl === 0) orphans++;
        for (let k = 0; k < 3; k++) {
          const v = Math.round(Math.max(-1, Math.min(1, src[k] || 0)) * 32767);
          blob.writeInt16LE(v, part.normals + (i * 3 + k) * 2);
        }
        replaced++;
      }
    }
    console.log(`  đã thay ${replaced} pháp tuyến (trong đó ${orphans} đỉnh mồ côi dùng hướng dự phòng); kiểm lại: hỏng = ${badCount(blob, part)}`);
    if (badCount(blob, part) !== 0) throw new Error(`Vẫn còn pháp tuyến hỏng ở ${id} sau vá`);
    ranges.push([part.normals, part.normals + part.vertexCount * 6]);
  }

  // Tự kiểm toàn cục: byte chỉ đổi trong các dải pháp tuyến đích; quét cả chunk sạch.
  let diffOutside = 0;
  for (let i = 0; i < blob.length; i++) {
    if (blob[i] !== oldBlob[i] && !ranges.some(([a, b]) => i >= a && i < b)) diffOutside++;
  }
  if (diffOutside) throw new Error(`Có ${diffOutside} byte đổi NGOÀI dải đích — dừng`);
  let totalBad = 0;
  for (const p of manifest.parts) totalBad += badCount(blob, p);
  console.log(`byte đổi ngoài dải đích: 0 ✓ · tổng pháp tuyến hỏng cả chunk sau vá: ${totalBad}`);
  if (totalBad !== 0) throw new Error("Chunk vẫn còn pháp tuyến hỏng ở mảnh khác");

  const gz = gzipSync(blob, { level: 9 });
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
  };
  console.log(`chunk ${oldBlob.length} byte (giữ nguyên kích thước); tiền tố mới ${prefix}`);
  if (!write) return console.log("(chạy khô — thêm --write)");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "z-anatomy.bin"), blob);
  writeFileSync(MANIFEST, `${JSON.stringify(next)}\n`);
  console.log("Đã cập nhật manifest (chỉ trường chunk)");
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
