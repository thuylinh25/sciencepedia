import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import * as THREE from "three";

import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Da đã chia nhỏ (`scripts/smooth-skin.py`) → khối trên R2 + manifest
 * `supplements/smooth-skin.json`. Mảnh mang CÙNG mã FJ2810 / FMA7163 với da gốc:
 * `withSupplements()` thấy trùng mã thì thay mảnh gốc, nên nhóm màu, tìm kiếm,
 * bóc lớp giữ nguyên. Bản sửa đổi của BodyParts3D → CC BY 4.0, ghi công như gốc.
 *
 *   npx tsx --env-file-if-exists=.env scripts/import-smooth-skin.ts [--write [--upload]]
 */
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, ".cache/anatomy/smooth-skin");
const MANIFEST = path.join(ROOT, "src/lib/human-atlas/supplements/smooth-skin.json");

async function main() {
  const pos = new Float32Array(readFileSync(path.join(SRC, "positions.f32")).buffer.slice(0));
  const idx = new Uint32Array(readFileSync(path.join(SRC, "indices.u32")).buffer.slice(0));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const nrm = Int16Array.from(geo.attributes.normal.array as Float32Array, (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767));
  const posBuf = Buffer.from(pos.buffer);
  const nrmBuf = Buffer.concat([Buffer.from(nrm.buffer), Buffer.alloc((4 - (nrm.byteLength % 4)) % 4)]);
  const blob = Buffer.concat([posBuf, nrmBuf, Buffer.from(idx.buffer)]);
  const gz = gzipSync(blob, { level: 9 });
  const hash = createHash("sha256").update(blob).digest("hex").slice(0, 10);
  const PUBLIC = (process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ??
    `${process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"}/human-atlas`).replace(/\/+$/, "");
  const box = geo.boundingBox!;
  const manifest = {
    source: "smooth-skin",
    license: "CC BY 4.0",
    chunk: {
      url: `${PUBLIC}/supplements/smooth-skin-${hash}/skin.bin`,
      bytes: blob.byteLength,
      gzip: `${PUBLIC}/supplements/smooth-skin-${hash}/skin.bin.gz`,
      gzipBytes: gz.byteLength,
    },
    parts: [
      {
        id: "FJ2810",
        name: "Skin",
        conceptId: "FMA7163",
        system: "integumentary",
        positions: 0,
        normals: posBuf.byteLength,
        indices: posBuf.byteLength + nrmBuf.byteLength,
        vertexCount: pos.length / 3,
        indexCount: idx.length,
        bounds: [box.min.toArray().map((v) => +v.toFixed(5)), box.max.toArray().map((v) => +v.toFixed(5))],
      },
    ],
    concepts: [],
  };
  console.log(`${pos.length / 3} đỉnh, ${idx.length / 3} tam giác · ${(blob.byteLength / 1e6).toFixed(1)} MB (gzip ${(gz.byteLength / 1e6).toFixed(1)} MB)`);
  if (!process.argv.includes("--write")) return console.log("(chạy khô — thêm --write)");
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`Đã ghi ${path.relative(ROOT, MANIFEST)}`);
  if (!process.argv.includes("--upload")) return;
  const missing = missingEnv();
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  const headers = (type: string) => ({ "content-type": type, "cache-control": "public, max-age=31536000, immutable" });
  const prefix = `human-atlas/supplements/smooth-skin-${hash}`;
  await put(`${prefix}/skin.bin`, blob, headers("application/octet-stream"));
  await put(`${prefix}/skin.bin.gz`, gz, headers("application/gzip"));
  for (const [url, size] of [[manifest.chunk.url, blob.byteLength], [manifest.chunk.gzip, gz.byteLength]] as const) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`  ${res.ok && Number(res.headers.get("content-length")) === size ? "✓" : "✗"} ${url}`);
  }
  console.log(`Đã đẩy lên ${BUCKET}/${prefix}/`);
}

void main();
