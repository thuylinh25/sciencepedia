import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import * as THREE from "three";

import { atlasSchema, correctSystems, type Atlas } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import { withSupplements } from "../src/lib/human-atlas/supplements";
import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Allen Human Reference Atlas – 3D, 2020 → phần bổ sung của Bản đồ cơ thể người:
 * các nhân sâu BodyParts3D 4.0 không có (nhân đồi thị, chất đen, nhân dưới đồi
 * thị, vùng bất định, nhân sâu tiểu não).
 *
 *   # 1. Xuất lưới BodyParts3D làm mốc căn toạ độ
 *   npx tsx scripts/import-allen-hra.ts --export-bp3d
 *   # 2. Thể tích → lưới, fit MNI → BodyParts3D, kiểm (Python: nibabel, scikit-image, scipy)
 *   <python> scripts/allen-hra.py
 *   # 3. Đóng gói
 *   npx tsx --env-file-if-exists=.env scripts/import-allen-hra.ts [--write [--upload]]
 *
 * ## Nguồn và giấy phép
 *
 * https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/
 * — `annotation.nii.gz` (0,5 mm, ICBM 2009b Nonlinear Symmetric, RAS). README: CC BY 4.0 từ
 * 2022-09-01; trích dẫn theo Citation Policy của Allen (câu nguyên văn trong LICENSE dưới đây).
 * Khối riêng, giấy phép riêng — không gộp với khối CC BY-SA của Z-Anatomy.
 *
 * ## Căn toạ độ
 *
 * Atlas ở không gian MẪU (trung bình 152 người), BodyParts3D là MỘT người: không có phép
 * dời cứng nào khớp. Affine 12 tham số fit từ tâm bề mặt (theo diện tích) của các cặp cấu
 * trúc có ở cả hai bộ — nhân sâu và hồi/thân não/tiểu não để mốc trải rộng — rồi kiểm bằng
 * cấu trúc giữ ngoài và tỉ lệ đỉnh nhân đồi thị nằm trong đồi thị BodyParts3D. Chi tiết và
 * số đo: `data/anatomy/registration-allen-hra.json` (sinh bởi allen-hra.py).
 */

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/allen-hra");
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/allen-hra.json");

/** Mảnh làm mốc (tên đúng như trong danh mục, đã gộp bản bổ sung). */
const LANDMARK_PARTS =
  /^(left|right) (thalamus|lateral geniculate body|medial geniculate body|caudate nucleus|putamen|globus pallidus|hippocampus|amygdala|superior colliculus|inferior colliculus|lateral ventricle|insula|precentral gyrus|superior frontal gyrus|middle frontal gyrus|postcentral gyrus|supramarginal gyrus|angular gyrus|middle temporal gyrus|inferior temporal gyrus|superior parietal lobule|cingulate gyrus|parahippocampal gyrus|fusiform gyrus|occipital lobe|red nucleus|olfactory nerve \(i\))$|^(third ventricle|fourth ventricle|cerebral aqueduct|pons|medulla oblongata|cerebellum|corpus callosum|midbrain|peduncle of midbrain|interpeduncular fossa)$/i;

async function fetchBuf(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function exportBp3d() {
  const raw = JSON.parse(gunzipSync(await fetchBuf(atlasDataUrl("atlas.json.gz"))).toString());
  const atlas: Atlas = withSupplements(correctSystems(atlasSchema.parse(raw)));
  const chunkUrl = (c: Atlas["chunks"][number]) => (c.gzip!.startsWith("http") ? c.gzip! : atlasDataUrl(c.gzip!));
  const wanted = atlas.parts.filter((p) => LANDMARK_PARTS.test(p.name));
  const chunks = new Map<number, Buffer>();
  for (const i of new Set(wanted.map((p) => p.chunk))) chunks.set(i, gunzipSync(await fetchBuf(chunkUrl(atlas.chunks[i]))));
  const out = wanted.map((p) => {
    const b = chunks.get(p.chunk)!;
    const pos = new Float32Array(b.buffer, b.byteOffset + p.positions, p.vertexCount * 3);
    const idx = new Uint32Array(b.buffer, b.byteOffset + p.indices, p.indexCount);
    return { id: p.id, name: p.name, positions: Array.from(pos, (v) => +v.toFixed(6)), indices: Array.from(idx) };
  });
  writeFileSync(path.join(CACHE, "bp3d-landmarks.json"), JSON.stringify(out));
  console.log(`Đã xuất ${out.length} mảnh mốc:`, [...new Set(out.map((p) => p.name.replace(/^(Left|Right) /, "")))].join(", "));
}

/**
 * Nhóm màu theo nhóm nhân chuẩn (trước, lưng giữa, tầng lưng bên, tầng bụng, bụng sau, gối sau, trong
 * mảnh tuỷ): cùng một màu thì 11 nhân thành một khối, không đọc được ranh giới.
 */
const GROUP: Record<string, string> = {
  "anterior-thalamic-nuclei": "nervous.thalamus_anterior",
  "mediodorsal-nucleus": "nervous.thalamus_medial",
  "lateral-dorsal-nucleus": "nervous.thalamus_dorsal",
  "lateral-posterior-nucleus": "nervous.thalamus_dorsal",
  "ventral-anterior-nucleus": "nervous.thalamus_ventral",
  "ventral-lateral-nucleus": "nervous.thalamus_ventral",
  "ventral-posterior-lateral-nucleus": "nervous.thalamus_ventral_posterior",
  "ventral-posterior-medial-nucleus": "nervous.thalamus_ventral_posterior",
  pulvinar: "nervous.thalamus_pulvinar",
  "centromedian-nucleus": "nervous.thalamus_intralaminar",
  "parafascicular-nucleus": "nervous.thalamus_intralaminar",
  "substantia-nigra": "nervous.substantia_nigra",
  "subthalamic-nucleus": "nervous.subthalamic",
  "zona-incerta": "nervous.zona_incerta",
  "cerebellar-deep-nuclei": "nervous.cerebellar_nuclei",
};

type OutPart = { key: string; name: string; side: "left" | "right" | null; positions: number[]; indices: number[] };

const LICENSE = `Allen Human Reference Atlas - 3D, 2020 (version 1.0.0), RRID:SCR_017764
(c) 2019 Allen Institute for Brain Science. Licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/).
Dataset citation: Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A.C. Facer,
Phil Lesnar, Amy Bernard, Lydia Ng, Ed S. Lein (2020). "Allen Human Reference Atlas - 3D, 2020,"
RRID:SCR_017764, version 1.0.0. Available from:
http://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/
Structure ontology: Ding, S.L., Royall, J.J., [...], Lein, E.S. Comprehensive cellular-resolution
atlas of the adult human brain. Journal of Comparative Neurology 524:16, 3127-3481 (2016),
DOI 10.1002/cne.24080.

Changes by Sciencepedia: selected labels converted to surface meshes (marching cubes, Taubin
smoothing), split into left/right at the midline, and registered from ICBM 2009b (MNI) space to
the BodyParts3D 4.0 frame by a landmark-fitted affine transform (see registration-allen-hra.json).
`;

async function pack(write: boolean, upload: boolean) {
  const src = JSON.parse(readFileSync(path.join(CACHE, "out.json"), "utf8")) as { parts: OutPart[] };
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
  for (const p of src.parts) {
    const pos = Float32Array.from(p.positions);
    const idx = Uint32Array.from(p.indices);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const nrm = geo.attributes.normal.array as Float32Array;
    const nrm16 = Int16Array.from(nrm, (v) => Math.round(Math.max(-1, Math.min(1, v || 0)) * 32767));
    const full = p.side ? `${p.side === "left" ? "Left" : "Right"} ${p.name}` : p.name.charAt(0).toUpperCase() + p.name.slice(1);
    const id = `AHRA-${full.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const conceptId = `AHRA-${p.key}`;
    const box = geo.boundingBox!;
    parts.push({
      id,
      name: full,
      conceptId,
      system: "nervous",
      group: GROUP[p.key] ?? "nervous.brain",
      positions: push(Buffer.from(pos.buffer)),
      normals: push(Buffer.from(nrm16.buffer)),
      indices: push(Buffer.from(idx.buffer)),
      vertexCount: pos.length / 3,
      indexCount: idx.length,
      bounds: [box.min.toArray().map((v) => +v.toFixed(5)), box.max.toArray().map((v) => +v.toFixed(5))],
    });
    const c = concepts.get(conceptId) ?? { id: conceptId, name: p.name.charAt(0).toUpperCase() + p.name.slice(1), elements: [] };
    c.elements.push(id);
    concepts.set(conceptId, c);
  }
  const blob = Buffer.concat(blobs);
  const gz = gzipSync(blob, { level: 9 });
  const hash = createHash("sha256").update(blob).digest("hex").slice(0, 10);
  const prefix = `human-atlas/supplements/allen-hra-${hash}`;
  const PUBLIC = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
    `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");
  console.log(`${parts.length} mảnh, ${concepts.size} khái niệm; khối ${(blob.byteLength / 1e6).toFixed(2)} MB (gzip ${(gz.byteLength / 1e6).toFixed(2)} MB)`);
  if (!write) return console.log("(chạy khô — thêm --write)");
  const manifest = {
    source: "allen-hra",
    license: "CC BY 4.0",
    chunk: {
      url: `${PUBLIC}/supplements/allen-hra-${hash}/allen-hra.bin`,
      bytes: blob.byteLength,
      gzip: `${PUBLIC}/supplements/allen-hra-${hash}/allen-hra.bin.gz`,
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
  await put(`${prefix}/allen-hra.bin`, blob, headers("application/octet-stream"));
  await put(`${prefix}/allen-hra.bin.gz`, gz, headers("application/gzip"));
  await put(`${prefix}/LICENSE.txt`, Buffer.from(LICENSE), headers("text/plain; charset=utf-8"));
  for (const [url, size] of [[manifest.chunk.url, blob.byteLength], [manifest.chunk.gzip, gz.byteLength]] as const) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${res.ok && Number(res.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

const args = process.argv.slice(2);
void (args.includes("--export-bp3d") ? exportBp3d() : pack(args.includes("--write"), args.includes("--upload")));
