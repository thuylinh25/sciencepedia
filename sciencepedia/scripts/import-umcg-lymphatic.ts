import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Mạng bạch huyết UMCG → phần bổ sung của Bản đồ cơ thể người.
 *
 *   npx tsx --env-file-if-exists=.env scripts/import-umcg-lymphatic.ts [--fbx <tệp>]            # chạy khô: báo cáo
 *   npx tsx --env-file-if-exists=.env scripts/import-umcg-lymphatic.ts --write                  # ghi manifest + khối cục bộ
 *   npx tsx --env-file-if-exists=.env scripts/import-umcg-lymphatic.ts --write --upload         # và đẩy khối lên R2
 *
 * ## Nguồn và giấy phép
 *
 * "Lymphatic System: an overview" — E-learning UMCG, sửa từ mô hình của Anna
 * Sieben (University of Dundee, CAHID); mạch và khí quản lấy từ BodyParts3D.
 * CC BY-NC-SA 4.0: ghi công, KHÔNG thương mại, bản sửa đổi cùng giấy phép. Chủ
 * sản phẩm xác nhận Sciencepedia phi thương mại (2026-09-29). Hình học chuyển
 * đổi ở đây là bản sửa đổi → phát hành theo CC BY-NC-SA 4.0, kèm LICENSE.txt
 * trong cùng thư mục R2. Tệp FBX tải từ Sketchfab (cần đăng nhập) để ở
 * `.cache/anatomy/umcg-lymphatic/` — không commit.
 *
 * ## Căn toạ độ — đo, không đặt bằng mắt
 *
 * Tệp có 5 khối không tên giải phẫu; nhận diện bằng hình chiếu: Extract5 tĩnh
 * mạch, Extract4 động mạch chủ, SubTool_0 khí quản, SubTool_3 MẠNG BẠCH HUYẾT,
 * SubTool_3_copy1 bộ xương. Ba khối không phải bạch huyết đến từ BodyParts3D,
 * nên là mốc tự nhiên: ICP bộ xương UMCG → bộ xương atlas (13.154 cặp điểm) hội
 * tụ về tỉ lệ 1/1000, (x, z, −y) + (0; 0,078; −0,100) m — sai số trung vị
 * 1,95 mm (p90 5,4 mm; bộ xương UMCG đã giảm lưới). Kiểm độc lập: khí quản
 * trung vị 0,93 mm, động mạch chủ 2,94 mm. Chỉ nhập khối bạch huyết.
 *
 * ## Phân nhóm — suy ra, không phải tên gốc
 *
 * Khối bạch huyết là MỘT lưới (511 thành phần liên thông); tệp không ghi hạch
 * nào tên gì. Thành phần gọn (dài/rộng < 2,2 và cạnh dài < 4 cm) xếp là HẠCH,
 * còn lại là MẠCH; vùng suy từ tâm hộp bao. Hạch dính liền vào mạch thì đi
 * theo mạch. Tên nhóm vì vậy là tên VÙNG ("hạch bạch huyết nách phải"), mã FMA
 * là khái niệm chung (FMA5034 Lymph node, FMA30315 Lymphatic vessel — tra OLS
 * 2026-09-29), không gán mã FMA của từng hạch cụ thể.
 */

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_FBX = path.join(ROOT, ".cache/anatomy/umcg-lymphatic/overview-lymphatic-system.fbx");
const OUT_DIR = path.join(ROOT, ".cache/anatomy/umcg-lymphatic/out");
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/umcg-lymphatic.json");
const LYMPH_MESH = "SubTool_3_8350512";
const PUBLIC_BASE = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
  `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");

/** Phép biến đổi đo được (xem đầu tệp): mm, z lên → m, y lên, mặt trước +z. */
const toAtlas = (x: number, y: number, z: number): [number, number, number] => [
  x / 1000 + 0.0001,
  z / 1000 + 0.078,
  -y / 1000 - 0.1,
];

const LICENSE = `This work is based on "Lymphatic System: an overview"
(https://sketchfab.com/3d-models/lymphatic-system-an-overview-00d877fa9fbc44218237dbc0a4cc96e1)
by E-learning UMCG (https://sketchfab.com/eLearningUMCG), a modification of a model by
Anna Sieben (University of Dundee, CAHID) with vascular structures from BodyParts3D
(The Database Center for Life Science), licensed under CC BY-NC-SA 4.0
(http://creativecommons.org/licenses/by-nc-sa/4.0/).

Changes by Sciencepedia: only the lymphatic mesh was kept; it was registered to the
BodyParts3D 4.0 coordinate frame (scale 1/1000, axes x,z,-y, offset 0/0.078/-0.100 m),
split into connected components and grouped by type (node/vessel) and body region.
These derived files are distributed under the same licence, CC BY-NC-SA 4.0.
Non-commercial use only.
`;

type Region = { key: string; en: string; vi: string };
const REGION: Record<string, Region> = {
  headNeck: { key: "head-neck", en: "head and neck", vi: "đầu và cổ" },
  thorax: { key: "thorax", en: "thorax", vi: "ngực" },
  abdomen: { key: "abdomen", en: "abdomen", vi: "bụng" },
  pelvis: { key: "pelvis", en: "pelvis", vi: "chậu" },
  axillaR: { key: "axilla-right", en: "right axilla", vi: "nách phải" },
  axillaL: { key: "axilla-left", en: "left axilla", vi: "nách trái" },
  inguinalR: { key: "inguinal-right", en: "right inguinal region", vi: "bẹn phải" },
  inguinalL: { key: "inguinal-left", en: "left inguinal region", vi: "bẹn trái" },
  upperR: { key: "upper-limb-right", en: "right upper limb", vi: "chi trên phải" },
  upperL: { key: "upper-limb-left", en: "left upper limb", vi: "chi trên trái" },
  lowerR: { key: "lower-limb-right", en: "right lower limb", vi: "chi dưới phải" },
  lowerL: { key: "lower-limb-left", en: "left lower limb", vi: "chi dưới trái" },
};

/** Vùng theo tâm hộp bao (m, toạ độ atlas; bên PHẢI cơ thể là x âm). */
function regionOf(c: [number, number, number], node: boolean): Region {
  const [x, y] = c;
  const right = x < 0;
  const ax = Math.abs(x);
  if (y > 0.78 && ax > 0.19) return right ? REGION.upperR : REGION.upperL;
  if (y >= 1.43) return REGION.headNeck;
  if (y >= 1.2 && ax >= 0.08) return right ? REGION.axillaR : REGION.axillaL;
  if (y >= 1.1) return REGION.thorax;
  if (y >= 0.93) return REGION.abdomen;
  if (y >= 0.78) {
    if (node && ax >= 0.05) return right ? REGION.inguinalR : REGION.inguinalL;
    return REGION.pelvis;
  }
  return right ? REGION.lowerR : REGION.lowerL;
}

function arg(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const write = process.argv.includes("--write");
  const upload = process.argv.includes("--upload");
  const fbxPath = arg("--fbx") ?? DEFAULT_FBX;

  // FBXLoader chạm tới TextureLoader/Image khi tệp có texture — chỉ cần hình học.
  THREE.TextureLoader.prototype.load = () => new THREE.Texture();
  const raw = readFileSync(fbxPath);
  const root = new FBXLoader().parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength), "");
  root.updateMatrixWorld(true);
  let lymph: THREE.Mesh | undefined;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name === LYMPH_MESH) lymph = o as THREE.Mesh;
  });
  if (!lymph) throw new Error(`Không thấy khối ${LYMPH_MESH} — tệp FBX khác bản đã đo?`);

  // Gộp đỉnh trùng TRƯỚC khi đổi toạ độ (dung sai 0,001 mm trong không gian gốc).
  let g = lymph.geometry.clone().applyMatrix4(lymph.matrixWorld);
  for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
  g = mergeVertices(g, 1e-3);
  const src = g.attributes.position;
  const index = g.index!.array;
  const n = src.count;
  const P = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) P.set(toAtlas(src.getX(i), src.getY(i), src.getZ(i)), i * 3);

  // Thành phần liên thông (union-find theo cạnh tam giác).
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (a: number) => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  for (let t = 0; t < index.length; t += 3) {
    for (const [a, b] of [[index[t], index[t + 1]], [index[t + 1], index[t + 2]]]) {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    }
  }
  const compOf = new Int32Array(n);
  const comps = new Map<number, { min: number[]; max: number[]; verts: number }>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    compOf[i] = r;
    const c = comps.get(r) ?? { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], verts: 0 };
    c.verts += 1;
    for (let k = 0; k < 3; k++) {
      c.min[k] = Math.min(c.min[k], P[i * 3 + k]);
      c.max[k] = Math.max(c.max[k], P[i * 3 + k]);
    }
    comps.set(r, c);
  }

  // Loại × vùng cho từng thành phần.
  const groupOfComp = new Map<number, string>();
  const groups = new Map<string, { node: boolean; region: Region; tris: number[] }>();
  // Mảnh vụn (vài tam giác rời, dư của lượt sculpt) không phải cấu trúc: bỏ, và đếm.
  const MIN_VERTS = 12;
  let dropped = 0;
  for (const [r, c] of comps) {
    if (c.verts < MIN_VERTS) {
      dropped += 1;
      continue;
    }
    const size = c.max.map((v, k) => v - c.min[k]).sort((a, b) => b - a);
    const node = size[0] < 0.04 && size[0] / Math.max(1e-4, size[1]) < 2.2;
    const center = c.min.map((v, k) => (v + c.max[k]) / 2) as [number, number, number];
    const region = regionOf(center, node);
    const key = `${node ? "node" : "vessel"}:${region.key}`;
    groupOfComp.set(r, key);
    if (!groups.has(key)) groups.set(key, { node, region, tris: [] });
  }
  for (let t = 0; t < index.length; t += 3) {
    const key = groupOfComp.get(compOf[index[t]]);
    if (key) groups.get(key)!.tris.push(t);
  }

  // Đóng gói theo định dạng khối của atlas: positions f32 · normals i16 chuẩn hoá · indices u32.
  const blobs: Buffer[] = [];
  let offset = 0;
  const push = (b: Buffer) => {
    blobs.push(b);
    const at = offset;
    offset += b.byteLength;
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      blobs.push(Buffer.alloc(pad));
      offset += pad;
    }
    return at;
  };
  const parts = [];
  const order = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [key, grp] of order) {
    const remap = new Map<number, number>();
    const local: number[] = [];
    for (const t of grp.tris) for (let k = 0; k < 3; k++) {
      const v = index[t + k];
      if (!remap.has(v)) remap.set(v, remap.size);
      local.push(remap.get(v)!);
    }
    const pos = new Float32Array(remap.size * 3);
    for (const [v, j] of remap) pos.set(P.subarray(v * 3, v * 3 + 3), j * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(local);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const nrm = geo.attributes.normal.array as Float32Array;
    const nrm16 = Int16Array.from(nrm, (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767));
    const positions = push(Buffer.from(pos.buffer));
    const normals = push(Buffer.from(nrm16.buffer));
    const indices = push(Buffer.from(Uint32Array.from(local).buffer));
    const box = geo.boundingBox!;
    const kind = grp.node ? "Lymph nodes" : "Lymphatic vessels";
    parts.push({
      id: `UMCG-LYM-${key.replace(":", "-")}`,
      name: `${kind} of ${grp.region.en}`,
      nameVi: `${grp.node ? "Hạch bạch huyết" : "Mạch bạch huyết"} vùng ${grp.region.vi}`,
      conceptId: grp.node ? "FMA5034" : "FMA30315",
      system: "lymphatic",
      group: grp.node ? "lymphatic.node" : "lymphatic.vessel",
      positions,
      normals,
      indices,
      vertexCount: remap.size,
      indexCount: local.length,
      bounds: [box.min.toArray().map((v) => +v.toFixed(5)), box.max.toArray().map((v) => +v.toFixed(5))],
    });
  }
  const bin = Buffer.concat(blobs);
  const gz = gzipSync(bin, { level: 9 });
  const hash = createHash("sha256").update(bin).digest("hex").slice(0, 10);
  const prefix = `human-atlas/supplements/umcg-lymphatic-${hash}`;

  console.log(`${n} đỉnh · ${index.length / 3} tam giác · ${comps.size} thành phần (bỏ ${dropped} mảnh vụn < ${MIN_VERTS} đỉnh) → ${parts.length} nhóm`);
  for (const p of parts) console.log(`  ${p.id.padEnd(44)} ${String(p.vertexCount).padStart(6)} đỉnh  ${p.nameVi}`);
  console.log(`khối ${bin.byteLength} B (gzip ${gz.byteLength} B) → ${prefix}/`);
  if (!write) return console.log("(chạy khô — thêm --write)");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "umcg-lymphatic.bin"), bin);
  writeFileSync(path.join(OUT_DIR, "umcg-lymphatic.bin.gz"), gz);
  writeFileSync(path.join(OUT_DIR, "LICENSE.txt"), LICENSE);
  const concepts = [
    { id: "FMA5034", name: "Lymph node", elements: parts.filter((p) => p.conceptId === "FMA5034").map((p) => p.id) },
    { id: "FMA30315", name: "Lymphatic vessel", elements: parts.filter((p) => p.conceptId === "FMA30315").map((p) => p.id) },
  ];
  const manifest = {
    source: "umcg-lymphatic",
    license: "CC BY-NC-SA 4.0",
    chunk: {
      url: `${PUBLIC_BASE}/supplements/umcg-lymphatic-${hash}/umcg-lymphatic.bin`,
      bytes: bin.byteLength,
      gzip: `${PUBLIC_BASE}/supplements/umcg-lymphatic-${hash}/umcg-lymphatic.bin.gz`,
      gzipBytes: gz.byteLength,
    },
    parts,
    concepts,
  };
  mkdirSync(path.dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`Đã ghi ${path.relative(ROOT, MANIFEST)} + ${path.relative(ROOT, OUT_DIR)}/`);

  if (!upload) return console.log("(chưa đẩy R2 — thêm --upload; đẩy TRƯỚC khi deploy manifest)");
  const missing = missingEnv();
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  const headers = (type: string) => ({ "content-type": type, "cache-control": "public, max-age=31536000, immutable" });
  await put(`${prefix}/umcg-lymphatic.bin`, bin, headers("application/octet-stream"));
  await put(`${prefix}/umcg-lymphatic.bin.gz`, gz, headers("application/gzip"));
  await put(`${prefix}/LICENSE.txt`, Buffer.from(LICENSE), headers("text/plain; charset=utf-8"));
  for (const [url, size] of [[manifest.chunk.url, bin.byteLength], [manifest.chunk.gzip, gz.byteLength]] as const) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${res.ok && Number(res.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

void main();
