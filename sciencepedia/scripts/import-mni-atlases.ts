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
 * Atlas thể tích ở không gian MNI → phần bổ sung của Bản đồ cơ thể người: nhân sâu BodyParts3D
 * 4.0 không có. Ba nguồn, ba khối riêng (giấy phép cùng CC BY 4.0 nhưng ghi công khác nhau):
 *
 *   allen-hra  Allen Human Reference Atlas – 3D 2020: nhân đồi thị, nhân dưới đồi thị, nhân sâu tiểu não
 *             (chất đen của Allen KHÔNG xuất — CIT168 thay)
 *   cit168     CIT168 Reinforcement Learning Atlas v1.1.0: chất đen phần đặc / phần lưới
 *   neudorfer  Neudorfer et al. 2020: các nhân vùng dưới đồi
 *
 *   # 1. Xuất lưới BodyParts3D làm mốc căn toạ độ
 *   npx tsx scripts/import-mni-atlases.ts --export-bp3d
 *   # 2. Thể tích → lưới (Python: nibabel, scikit-image, scipy)
 *   <python> scripts/allen-hra.py         # fit phép căn MNI → BodyParts3D, lưới Allen
 *   <python> scripts/mni-subcortical.py   # CIT168 + Neudorfer, DÙNG LẠI phép căn trên
 *   # 3. Đóng gói từng nguồn
 *   npx tsx --env-file-if-exists=.env scripts/import-mni-atlases.ts --source <nguồn> [--write [--upload]]
 *
 * ## Căn toạ độ
 *
 * Atlas ở không gian MẪU (trung bình nhiều người), BodyParts3D là MỘT người: không có phép dời
 * cứng nào khớp. Affine 12 tham số fit từ tâm bề mặt các cặp cấu trúc Allen ↔ BodyParts3D, rồi
 * ICP đồng dạng theo vùng chứa (đồi thị / trung não / tiểu não / vùng dưới đồi). Allen chỉ vẽ bán
 * cầu trái nên bán cầu phải là bản lật gương (mẫu đối xứng). CIT168 và Neudorfer dùng lại đúng phép
 * ấy sau khi đo được rằng cùng cấu trúc ở ba atlas lệch nhau ≤ 2,5 mm trong không gian MNI. Số đo:
 * `data/anatomy/registration-allen-hra.json`, `data/anatomy/registration-mni-subcortical.json`.
 */

const ROOT = path.resolve(__dirname, "..");

/** Mảnh làm mốc (tên đúng như trong danh mục, đã gộp bản bổ sung). */
const LANDMARK_PARTS =
  /^(left|right) (thalamus|lateral geniculate body|medial geniculate body|caudate nucleus|putamen|globus pallidus|hippocampus|amygdala|superior colliculus|inferior colliculus|lateral ventricle|insula|precentral gyrus|superior frontal gyrus|middle frontal gyrus|postcentral gyrus|supramarginal gyrus|angular gyrus|middle temporal gyrus|inferior temporal gyrus|superior parietal lobule|cingulate gyrus|parahippocampal gyrus|fusiform gyrus|occipital lobe|red nucleus|olfactory nerve \(i\))$|^(third ventricle|fourth ventricle|cerebral aqueduct|pons|medulla oblongata|cerebellum|corpus callosum|midbrain|peduncle of midbrain|interpeduncular fossa|hypothalamus|tuber cinereum|mammillary body)$/i;

type Source = {
  /** Thư mục trong .cache chứa out.json. */
  cache: string;
  /** Tiền tố mã mảnh/khái niệm (không phải FMA → bảng chi tiết ẩn link FMA). */
  prefix: string;
  /** Nhóm màu theo khoá; khoá không có → nhóm mặc định. */
  group: Record<string, string>;
  defaultGroup: string;
  license: string;
};

const ALLEN_CHANGES = `Changes by Sciencepedia: the atlas labels only the left hemisphere; the right hemisphere was
created by mirroring the left across the midline of the symmetric ICBM 2009b template. Selected
labels were converted to surface meshes (marching cubes, Taubin smoothing) and registered from
ICBM 2009b (MNI) space to the BodyParts3D 4.0 frame by a landmark-fitted affine transform followed
by a per-region similarity (ICP) refinement to the thalamus, midbrain, cerebellum and hypothalamus
of the model (transforms and measurements in registration-allen-hra.json). Positions are approximate.`;

/** Phép căn của CIT168/Neudorfer: dùng lại phép đã fit trên Allen. */
const REUSED_CHANGES = (region: string) => `Changes by Sciencepedia: selected labels converted to surface meshes (marching cubes, Taubin
smoothing) and registered from MNI space to the BodyParts3D 4.0 frame by reusing the transform
fitted for the Allen Human Reference Atlas - 3D 2020 (landmark affine + similarity refinement to
the ${region} of the model); see registration-mni-subcortical.json. Positions are approximate.`;

const SOURCES: Record<string, Source> = {
  "allen-hra": {
    cache: "allen-hra",
    prefix: "AHRA",
    // Mỗi nhóm nhân chuẩn một màu (trước, lưng giữa, tầng lưng bên, tầng bụng, bụng sau, gối sau, trong
    // mảnh tuỷ): cùng một màu thì 11 nhân thành một khối, không đọc được ranh giới.
    group: {
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
      "subthalamic-nucleus": "nervous.subthalamic",
      "cerebellar-deep-nuclei": "nervous.cerebellar_nuclei",
    },
    defaultGroup: "nervous.brain",
    license: `Allen Human Reference Atlas - 3D, 2020 (version 1.0.0), RRID:SCR_017764
(c) 2019 Allen Institute for Brain Science. Licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/).
Dataset citation: Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A.C. Facer,
Phil Lesnar, Amy Bernard, Lydia Ng, Ed S. Lein (2020). "Allen Human Reference Atlas - 3D, 2020,"
RRID:SCR_017764, version 1.0.0. Available from:
http://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/
Structure ontology: Ding, S.L., Royall, J.J., [...], Lein, E.S. Comprehensive cellular-resolution
atlas of the adult human brain. Journal of Comparative Neurology 524:16, 3127-3481 (2016),
DOI 10.1002/cne.24080.

${ALLEN_CHANGES}
`,
  },
  cit168: {
    cache: "cit168",
    prefix: "CIT168",
    // Phần đặc (neuron dopamine, sắc tố) sẫm; phần lưới nhạt hơn — đọc được hai phần xen nhau.
    group: { "substantia-nigra-compacta": "nervous.substantia_nigra", "substantia-nigra-reticulata": "nervous.substantia_nigra_reticulata" },
    defaultGroup: "nervous.brain",
    license: `CIT168 Reinforcement Learning Atlas, version 1.1.0 (MNI152 NLin 2009c Asym release)
https://osf.io/jkzwp/ — Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
Citation: Pauli WM, Nili AN, Tyszka JM (2018). A high-resolution probabilistic in vivo atlas of
human subcortical brain nuclei. Scientific Data 5, 180063. DOI 10.1038/sdata.2018.63.

${REUSED_CHANGES("midbrain")}
`,
  },
  neudorfer: {
    cache: "neudorfer",
    prefix: "NHTH",
    // Một màu mỗi MIỀN vùng dưới đồi (trước–thị, quanh não thất, củ, bên, sau): 13 nhân cùng màu thì
    // không đọc được ranh giới.
    group: {
      "medial-preoptic-nucleus": "nervous.hypothalamus_anterior",
      "anterior-hypothalamic-area": "nervous.hypothalamus_anterior",
      "suprachiasmatic-nucleus": "nervous.hypothalamus_anterior",
      "supraoptic-nucleus": "nervous.hypothalamus_anterior",
      "paraventricular-nucleus": "nervous.hypothalamus_periventricular",
      "periventricular-nucleus": "nervous.hypothalamus_periventricular",
      "dorsal-periventricular-nucleus": "nervous.hypothalamus_periventricular",
      "ventromedial-nucleus": "nervous.hypothalamus_tuberal",
      "dorsomedial-nucleus": "nervous.hypothalamus_tuberal",
      "arcuate-nucleus": "nervous.hypothalamus_tuberal",
      "lateral-hypothalamic-area": "nervous.hypothalamus_lateral",
      "posterior-hypothalamic-nucleus": "nervous.hypothalamus_posterior",
      "tuberomammillary-nucleus": "nervous.hypothalamus_posterior",
    },
    defaultGroup: "nervous.brain",
    license: `NSD atlas of hypothalamic region (MNI152 2009b labels)
https://doi.org/10.5281/zenodo.3942115 — Licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/).
Citation: Neudorfer C, Germann J, Elias GJB, Gramer R, Boutet A, Lozano AM (2020). A high-resolution
in vivo magnetic resonance imaging atlas of the human hypothalamic region. Scientific Data 7, 305.
DOI 10.1038/s41597-020-00644-6.

${REUSED_CHANGES("hypothalamus")}
`,
  },
};

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
  writeFileSync(path.join(ROOT, ".cache/allen-hra/bp3d-landmarks.json"), JSON.stringify(out));
  console.log(`Đã xuất ${out.length} mảnh mốc:`, [...new Set(out.map((p) => p.name.replace(/^(Left|Right) /, "")))].join(", "));
}

type OutPart = { key: string; name: string; side: "left" | "right" | null; positions: number[]; indices: number[] };

async function pack(name: string, write: boolean, upload: boolean) {
  const cfg = SOURCES[name];
  if (!cfg) throw new Error(`--source phải là một trong: ${Object.keys(SOURCES).join(", ")}`);
  const manifestPath = path.join(ROOT, `src/lib/human-atlas/supplements/${name}.json`);
  const src = JSON.parse(readFileSync(path.join(ROOT, ".cache", cfg.cache, "out.json"), "utf8")) as { parts: OutPart[] };
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
    const id = `${cfg.prefix}-${full.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const conceptId = `${cfg.prefix}-${p.key}`;
    const box = geo.boundingBox!;
    parts.push({
      id,
      name: full,
      conceptId,
      system: "nervous",
      group: cfg.group[p.key] ?? cfg.defaultGroup,
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
  const prefix = `human-atlas/supplements/${name}-${hash}`;
  const PUBLIC = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
    `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");
  console.log(`${name}: ${parts.length} mảnh, ${concepts.size} khái niệm; khối ${(blob.byteLength / 1e6).toFixed(2)} MB (gzip ${(gz.byteLength / 1e6).toFixed(2)} MB)`);
  if (!write) return console.log("(chạy khô — thêm --write)");
  const manifest = {
    source: name,
    license: "CC BY 4.0",
    chunk: {
      url: `${PUBLIC}/supplements/${name}-${hash}/${name}.bin`,
      bytes: blob.byteLength,
      gzip: `${PUBLIC}/supplements/${name}-${hash}/${name}.bin.gz`,
      gzipBytes: gz.byteLength,
    },
    parts,
    concepts: [...concepts.values()],
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
  console.log(`Đã ghi ${path.relative(ROOT, manifestPath)}`);
  if (!upload) return console.log("(chưa đẩy R2 — thêm --upload)");
  const missing = missingEnv();
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  const headers = (type: string) => ({ "content-type": type, "cache-control": "public, max-age=31536000, immutable" });
  await put(`${prefix}/${name}.bin`, blob, headers("application/octet-stream"));
  await put(`${prefix}/${name}.bin.gz`, gz, headers("application/gzip"));
  await put(`${prefix}/LICENSE.txt`, Buffer.from(cfg.license), headers("text/plain; charset=utf-8"));
  for (const [url, size] of [[manifest.chunk.url, blob.byteLength], [manifest.chunk.gzip, gz.byteLength]] as const) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${res.ok && Number(res.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

const args = process.argv.slice(2);
const source = args.includes("--source") ? args[args.indexOf("--source") + 1] : "allen-hra";
void (args.includes("--export-bp3d") ? exportBp3d() : pack(source, args.includes("--write"), args.includes("--upload")));
