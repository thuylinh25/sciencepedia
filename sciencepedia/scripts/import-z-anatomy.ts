import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import * as THREE from "three";

import { atlasSchema, correctSystems, type SystemId } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import partGroups from "../src/lib/human-atlas/part-groups.generated.json";
import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Z-Anatomy → phần bổ sung của Bản đồ cơ thể người: dây thần kinh ngoại biên,
 * tuỷ sống, tĩnh mạch vùng đầu–cổ và các tĩnh mạch BodyParts3D không có, hạch
 * bạch huyết có tên, nhu mô 5 thuỳ phổi, tuyến giáp và tuyến cận giáp.
 *
 *   # 1. Blender (gói `bpy` trên PyPI) xuất hình học đã đánh giá ra .cache/z-anatomy/dump/
 *   <python có bpy> scripts/blender/z-anatomy-dump.py
 *   # 2. Chọn, lọc trùng, căn toạ độ, đóng gói
 *   npx tsx --env-file-if-exists=.env scripts/import-z-anatomy.ts [--write [--upload]]
 *
 * ## Nguồn và giấy phép
 *
 * Z-Anatomy (https://github.com/Z-Anatomy/Models-of-human-anatomy), CC BY-SA
 * 4.0, dựng từ BodyParts3D. Bản chuyển đổi phát hành cùng giấy phép, có
 * LICENSE.txt cạnh khối trên R2. `Startup.blend` (306 MB) để trong `.cache`.
 *
 * ## Căn toạ độ — đo được, và giới hạn của nó
 *
 * Blender z-up → atlas y-up: (x, z, −y), cùng đơn vị mét. ICP bộ xương Z-Anatomy
 * ↔ bộ xương BodyParts3D cho độ dời (−0,5; 7,2; −1,6) mm. Sai số còn lại trung
 * vị ~4,7 mm (mức nền của phép đo 1 mm): Z-Anatomy đã dựng lại lưới xương, nên
 * không phép dời cứng nào khử hết; căn theo từng vùng cũng không giảm. Chấp
 * nhận ~5 mm — thấy được khi phóng sát, không thấy ở toàn thân.
 *
 * ## Không nhập thứ BodyParts3D đã có
 *
 * Mạch và dây thần kinh của Z-Anatomy là đường cong VẼ LẠI, không trùng hình
 * học BodyParts3D (chỉ 60% điểm động mạch nằm trong 2 cm động mạch gốc). Nên:
 * không lấy động mạch, không lấy não; và mỗi ứng viên bị loại nếu phần lớn điểm
 * nằm sát hình học BodyParts3D cùng hệ — lọc theo KHÔNG GIAN, vì cùng một tĩnh
 * mạch hai bộ gọi hai tên ("anterior vein of left lung" ~ "left anterior
 * segmental vein").
 */

const ROOT = path.resolve(__dirname, "..");
const DUMP = path.join(ROOT, ".cache/z-anatomy/dump");
const OUT_DIR = path.join(ROOT, ".cache/z-anatomy/out");
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/z-anatomy.json");
const OFFSET = [-0.0005, 0.0072, -0.0016];
const toAtlas = (x: number, y: number, z: number) => [x + OFFSET[0], z + OFFSET[1], -y + OFFSET[2]];
/** Điểm cách hình học gốc cùng hệ dưới ngưỡng này thì coi là "đã có". */
const DUP_DIST = 0.007;
const DUP_FRACTION = 0.5;

const LICENSE = `Derived from Z-Anatomy - The libre 3D atlas of anatomy (CC BY-SA 4.0)
https://github.com/Z-Anatomy/Models-of-human-anatomy
which is based on BodyParts3D, The Database Center for Life Science
(https://dbarchive.biosciencedbc.jp/en/bodyparts3d/).

Changes by Sciencepedia: selected peripheral nerves, spinal cord, veins, lymph nodes,
lung lobes, thyroid and parathyroid glands absent from BodyParts3D 4.0; curves evaluated to meshes in Blender; registered to the
BodyParts3D 4.0 frame (axes x,z,-y; offset -0.5/7.2/-1.6 mm, median residual ~4.7 mm).
Distributed under the same licence, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
`;

type Row = {
  name: string;
  type: "MESH" | "CURVE";
  trail: string[];
  verts: number;
  tris: number;
  pos: number;
  idx: number;
};

type Pick = { system: SystemId; group?: string };

/** Ứng viên theo collection gốc + tên. Không lấy động mạch, não, nhân, bó. */
function pick(r: Row): Pick | null {
  const top = r.trail[0] ?? "";
  const n = r.name.toLowerCase();
  if (top.startsWith("7:")) {
    if (/nucleus|tract|fasciculus|lemniscus|commissure|gyrus|lobe|ventricle|choroid/.test(n)) return null;
    if (/spinal cord|horn of spinal|spinal dura|spinal ganglion|conus|filum/.test(n)) return { system: "nervous", group: "nervous.spinal_cord" };
    if (r.type === "CURVE" || /\bnerve|plexus|cauda equina|ganglion|ramus|root of/.test(n)) return { system: "nervous", group: "nervous.nerve" };
    return null;
  }
  if (top.startsWith("5:")) {
    if (/arter|aorta|trunk of|arch\b/.test(n)) return null;
    if (/vein|sinus|venous|plexus/.test(n)) return { system: "venous" };
    return null;
  }
  if (top.startsWith("6:")) {
    if (/\bnodes?\b/.test(n)) return { system: "lymphatic", group: "lymphatic.node" };
    return null;
  }
  // Tạng (2026-09-29): nhu mô phổi theo thuỳ, tuyến giáp, tuyến cận giáp — ba thứ
  // BodyParts3D 4.0 không có (phổi chỉ có cây phế quản; hệ nội tiết không có tuyến
  // giáp). Không lấy màng phổi: một khối 56k đỉnh bọc kín phổi và cây phế quản.
  if (top.startsWith("8:")) {
    if (/^(superior|middle|inferior) lobe of (left|right) lung$/.test(n)) return { system: "respiratory", group: "respiratory.lung" };
    if (/^thyroid gland$/.test(n)) return { system: "endocrine", group: "endocrine.thyroid" };
    if (/parathyroid gland/.test(n)) return { system: "endocrine", group: "endocrine.parathyroid" };
    return null;
  }
  return null;
}

/** "(Femoral nerve).l" → { full: "Left femoral nerve", base: "Femoral nerve" } */
function naming(raw: string) {
  let n = raw.trim().replace(/^\((.*)\)(\.[lrj])?$/, "$1$2").replace(/\.\d+$/, "").replace(/'+$/, "");
  const side = n.match(/\.([lr])$/)?.[1];
  n = n.replace(/\.[lrj]$/, "").trim();
  const base = n.charAt(0).toUpperCase() + n.slice(1);
  const full = side ? `${side === "l" ? "Left" : "Right"} ${n.charAt(0).toLowerCase()}${n.slice(1)}` : base;
  return { full, base };
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function loadBp3dGrids() {
  const get = async (file: string) => Buffer.from(await (await fetch(atlasDataUrl(file))).arrayBuffer());
  const atlas = correctSystems(atlasSchema.parse(JSON.parse(gunzipSync(await get("atlas.json.gz")).toString())));
  const chunks = await Promise.all(atlas.chunks.map(async (c) => gunzipSync(await get(c.gzip!))));
  const cell = DUP_DIST;
  // Thần kinh tách hai lưới: dây thần kinh gốc (ổ mắt) và thần kinh trung ương.
  // So một dây thần kinh mới với thân não là loại nhầm dây VI chạy sát cầu não.
  const groups = partGroups as Record<string, string>;
  const grids = new Map<string, Set<string>>();
  for (const p of atlas.parts) {
    const key = p.system === "nervous" ? (groups[p.id] === "nervous.nerve" ? "nerve" : "cns") : p.system;
    const g = grids.get(key) ?? new Set<string>();
    grids.set(key, g);
    const b = chunks[p.chunk];
    const f = new Float32Array(b.buffer, b.byteOffset + p.positions, p.vertexCount * 3);
    for (let i = 0; i < p.vertexCount; i++) {
      g.add(`${Math.floor(f[i * 3] / cell)},${Math.floor(f[i * 3 + 1] / cell)},${Math.floor(f[i * 3 + 2] / cell)}`);
    }
  }
  // Ô lưới có đỉnh gốc, hoặc kề ô có đỉnh gốc, là "gần" (≤ ~2 ô).
  return (key: string, x: number, y: number, z: number) => {
    const g = grids.get(key);
    if (!g) return false;
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      if (g.has(`${cx + dx},${cy + dy},${cz + dz}`)) return true;
    }
    return false;
  };
}

async function main() {
  const write = process.argv.includes("--write");
  const upload = process.argv.includes("--upload");
  const index = JSON.parse(readFileSync(path.join(DUMP, "index.json"), "utf8")) as Row[];
  const bin = readFileSync(path.join(DUMP, "geometry.bin"));
  const near = await loadBp3dGrids();

  const blobs: Buffer[] = [];
  let offset = 0;
  const push = (b: Buffer) => {
    const at = offset;
    blobs.push(b);
    offset += b.byteLength;
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      blobs.push(Buffer.alloc(pad));
      offset += pad;
    }
    return at;
  };

  const parts = [];
  const concepts = new Map<string, { id: string; name: string; elements: string[] }>();
  const skipped = { dup: [] as string[], seen: new Set<string>() };
  const stats: Record<string, number> = {};
  for (const r of index) {
    const chosen = pick(r);
    if (!chosen) continue;
    const { full, base } = naming(r.name);
    const id = `ZA-${slug(full)}`;
    if (skipped.seen.has(id)) continue; // tên lặp trong tệp gốc (bản sao ẩn)
    skipped.seen.add(id);
    const gridKey =
      chosen.system === "nervous" ? (chosen.group === "nervous.nerve" ? "nerve" : "cns") : chosen.system;
    const raw = new Float32Array(bin.buffer.slice(bin.byteOffset + r.pos, bin.byteOffset + r.pos + r.verts * 12));
    const pos = new Float32Array(r.verts * 3);
    let close = 0;
    for (let i = 0; i < r.verts; i++) {
      const p = toAtlas(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]);
      pos.set(p, i * 3);
      if (i % 3 === 0 && near(gridKey, p[0], p[1], p[2])) close += 1;
    }
    if (close / Math.ceil(r.verts / 3) > DUP_FRACTION) {
      skipped.dup.push(full);
      continue;
    }
    const idx = new Uint32Array(bin.buffer.slice(bin.byteOffset + r.idx, bin.byteOffset + r.idx + r.tris * 12));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const nrm = geo.attributes.normal.array as Float32Array;
    const nrm16 = Int16Array.from(nrm, (v) => Math.round(Math.max(-1, Math.min(1, v || 0)) * 32767));
    const conceptId = `ZA-${slug(base)}`;
    const box = geo.boundingBox!;
    parts.push({
      id,
      name: full,
      conceptId,
      system: chosen.system,
      ...(chosen.group ? { group: chosen.group } : {}),
      positions: push(Buffer.from(pos.buffer)),
      normals: push(Buffer.from(nrm16.buffer)),
      indices: push(Buffer.from(idx.buffer)),
      vertexCount: r.verts,
      indexCount: idx.length,
      bounds: [box.min.toArray().map((v) => +v.toFixed(5)), box.max.toArray().map((v) => +v.toFixed(5))],
    });
    const c = concepts.get(conceptId) ?? { id: conceptId, name: base, elements: [] };
    c.elements.push(id);
    concepts.set(conceptId, c);
    const key = chosen.group ?? chosen.system;
    stats[key] = (stats[key] ?? 0) + 1;
  }

  const blob = Buffer.concat(blobs);
  const gz = gzipSync(blob, { level: 9 });
  const hash = createHash("sha256").update(blob).digest("hex").slice(0, 10);
  const prefix = `human-atlas/supplements/z-anatomy-${hash}`;
  const PUBLIC = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
    `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");
  console.log("nhập:", stats, `| ${parts.length} mảnh, ${concepts.size} khái niệm`);
  console.log(`bỏ vì trùng hình học BodyParts3D: ${skipped.dup.length}`, skipped.dup.slice(0, 25).join("; "));
  const verts: Record<string, number> = {};
  for (const p of parts) verts[p.group ?? p.system] = (verts[p.group ?? p.system] ?? 0) + p.vertexCount;
  console.log("đỉnh theo nhóm:", verts);
  console.log(`khối ${(blob.byteLength / 1e6).toFixed(1)} MB (gzip ${(gz.byteLength / 1e6).toFixed(1)} MB)`);
  if (!write) return console.log("(chạy khô — thêm --write)");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "z-anatomy.bin"), blob);
  writeFileSync(path.join(OUT_DIR, "z-anatomy.bin.gz"), gz);
  const manifest = {
    source: "z-anatomy",
    license: "CC BY-SA 4.0",
    chunk: {
      url: `${PUBLIC}/supplements/z-anatomy-${hash}/z-anatomy.bin`,
      bytes: blob.byteLength,
      gzip: `${PUBLIC}/supplements/z-anatomy-${hash}/z-anatomy.bin.gz`,
      gzipBytes: gz.byteLength,
    },
    parts,
    concepts: [...concepts.values()],
  };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest)}\n`);
  console.log(`Đã ghi ${path.relative(ROOT, MANIFEST)}`);
  if (!upload) return console.log("(chưa đẩy R2 — thêm --upload)");
  const missing = missingEnv();
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  const headers = (type: string) => ({ "content-type": type, "cache-control": "public, max-age=31536000, immutable" });
  await put(`${prefix}/z-anatomy.bin`, blob, headers("application/octet-stream"));
  await put(`${prefix}/z-anatomy.bin.gz`, gz, headers("application/gzip"));
  await put(`${prefix}/LICENSE.txt`, Buffer.from(LICENSE), headers("text/plain; charset=utf-8"));
  for (const [url, size] of [[manifest.chunk.url, blob.byteLength], [manifest.chunk.gzip, gz.byteLength]] as const) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${res.ok && Number(res.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

void main();
