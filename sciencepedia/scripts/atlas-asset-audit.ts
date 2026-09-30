import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { atlasSchema, correctSystems, GROUP_COLORS, SYSTEM_COLORS, type Atlas } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import { withSupplements } from "../src/lib/human-atlas/supplements";
import { viewStructures } from "../src/lib/human-atlas/atlas-model";
import { SYSTEM_VIEWS, viewKind, viewParts } from "../src/lib/human-atlas/views";
import partGroups from "../src/lib/human-atlas/part-groups.generated.json";

/**
 * Audit hình học + vật liệu của mọi mảnh Atlas dùng — CHỈ ĐỌC.
 *
 *   npx tsx scripts/atlas-asset-audit.ts [--system respiratory]
 *
 * Tải đúng các khối viewer tải (BodyParts3D + phần bổ sung, cache ở
 * `.cache/anatomy/chunks/`), đo từng mảnh: tam giác, đỉnh, hộp bao, pháp tuyến
 * hỏng, tam giác suy biến, số mảnh rời (hàn đỉnh theo toạ độ), hình trùng. Rồi
 * gộp theo cấu trúc và góc nhìn theo hệ: nguồn, nhóm vật liệu, kích thước, mảnh
 * nằm lệch khỏi phần còn lại. Ghi `.cache/anatomy/asset-audit.json`.
 *
 * Không có GLB/GLTF nào: dữ liệu là khối nhị phân (float32 vị trí, int16 pháp
 * tuyến chuẩn hoá, uint32 chỉ số) + `atlas.json`. Không UV, không texture —
 * màu và độ nhám do viewer gán theo hệ/nhóm (`GROUP_COLORS`, `SYSTEM_COLORS`).
 */

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/anatomy/chunks");
const OUT = path.join(ROOT, ".cache/anatomy/asset-audit.json");

type PartStat = {
  id: string;
  name: string;
  system: string;
  source: string;
  group: string;
  triangles: number;
  vertices: number;
  size: [number, number, number];
  center: [number, number, number];
  badNormals: number;
  degenerate: number;
  islands: number;
};

async function chunkBuffer(url: string, gz: boolean): Promise<Buffer> {
  mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, url.split("/").slice(-2).join("__"));
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const raw = readFileSync(file);
  return gz ? gunzipSync(raw) : raw;
}

function sourceOf(atlas: Atlas, chunk: number) {
  const url = atlas.chunks[chunk].url;
  if (url.includes("z-anatomy")) return "z-anatomy";
  if (url.includes("umcg")) return "umcg";
  if (url.includes("smooth-skin")) return "bodyparts3d (da chia nhỏ)";
  return "bodyparts3d";
}

function measure(buf: Buffer, p: Atlas["parts"][number]) {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const pos = new Float32Array(ab, p.positions, p.vertexCount * 3);
  const nor = new Int16Array(ab, p.normals, p.vertexCount * 3);
  const idx = new Uint32Array(ab, p.indices, p.indexCount);
  let badNormals = 0;
  for (let i = 0; i < p.vertexCount; i++) {
    const x = nor[i * 3], y = nor[i * 3 + 1], z = nor[i * 3 + 2];
    const len = Math.hypot(x, y, z) / 32767;
    if (!Number.isFinite(len) || len < 0.5) badNormals++;
  }
  let degenerate = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const area = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    if (area < 1e-12) degenerate++;
  }
  // Mảnh rời: hàn đỉnh trùng toạ độ (0,01 mm) rồi union-find theo tam giác.
  const weld = new Map<string, number>();
  const root = new Int32Array(p.vertexCount);
  for (let i = 0; i < p.vertexCount; i++) {
    const key = `${Math.round(pos[i * 3] * 1e5)},${Math.round(pos[i * 3 + 1] * 1e5)},${Math.round(pos[i * 3 + 2] * 1e5)}`;
    const w = weld.get(key);
    if (w === undefined) weld.set(key, i);
    root[i] = w ?? i;
  }
  const parent = Int32Array.from(root);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const unite = (a: number, b: number) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let t = 0; t < idx.length; t += 3) {
    unite(root[idx[t]], root[idx[t + 1]]);
    unite(root[idx[t]], root[idx[t + 2]]);
  }
  const islands = new Set<number>();
  for (let i = 0; i < p.vertexCount; i++) if (root[i] === i) islands.add(find(i));
  return { badNormals, degenerate, islands: islands.size };
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes("--system") ? args[args.indexOf("--system") + 1] : null;
  const raw = await (await fetch(atlasDataUrl("atlas.json"))).json();
  const atlas = withSupplements(correctSystems(atlasSchema.parse(raw)));
  const groups = partGroups as Record<string, string>;

  // Mảnh cần đo: mọi mảnh của các góc nhìn theo hệ (hoặc của một hệ).
  const views = SYSTEM_VIEWS.filter((v) => !only || v.systemId === only);
  const wanted = new Set(views.flatMap((v) => [...(viewParts(v.id)?.focus ?? []), ...(viewParts(v.id)?.context ?? [])]));
  const stats = new Map<string, PartStat>();
  const chunks = [...new Set(atlas.parts.filter((p) => wanted.has(p.id)).map((p) => p.chunk))];
  for (const ci of chunks) {
    const c = atlas.chunks[ci];
    const buf = await chunkBuffer(atlasDataUrl(c.gzip ?? c.url), !!c.gzip);
    for (const p of atlas.parts) {
      if (p.chunk !== ci || !wanted.has(p.id)) continue;
      const [lo, hi] = p.bounds;
      const group = p.group ?? groups[p.id] ?? p.system;
      stats.set(p.id, {
        id: p.id,
        name: p.name,
        system: p.system,
        source: sourceOf(atlas, p.chunk),
        group,
        triangles: p.indexCount / 3,
        vertices: p.vertexCount,
        size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]],
        center: [(hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2, (hi[2] + lo[2]) / 2],
        ...measure(buf, p),
      });
    }
  }

  // Hình trùng: cùng số đỉnh + cùng hộp bao (tới 0,1 mm).
  const byShape = new Map<string, string[]>();
  for (const s of stats.values()) {
    const key = `${s.vertices}|${s.center.map((x) => x.toFixed(4)).join(",")}|${s.size.map((x) => x.toFixed(4)).join(",")}`;
    byShape.set(key, [...(byShape.get(key) ?? []), s.id]);
  }
  const duplicates = [...byShape.values()].filter((ids) => ids.length > 1);

  const summarize = (ids: readonly string[]) => {
    const list = ids.map((id) => stats.get(id)).filter((s): s is PartStat => !!s);
    const lo = [0, 1, 2].map((k) => Math.min(...list.map((s) => s.center[k] - s.size[k] / 2)));
    const hi = [0, 1, 2].map((k) => Math.max(...list.map((s) => s.center[k] + s.size[k] / 2)));
    const mid = [0, 1, 2].map((k) => {
      const xs = list.map((s) => s.center[k]).sort((a, b) => a - b);
      return xs[Math.floor(xs.length / 2)] ?? 0;
    });
    const extent = Math.max(...[0, 1, 2].map((k) => hi[k] - lo[k]));
    // Mảnh lệch: tâm cách trung vị > 0,6 × cỡ lớn nhất của cả tập — dấu hiệu sai vị trí.
    const outliers = list
      .filter((s) => list.length > 3 && Math.hypot(...s.center.map((c, k) => c - mid[k])) > 0.6 * extent)
      .map((s) => `${s.name} (${s.id})`);
    const count = (key: keyof PartStat) =>
      [...new Set(list.map((s) => String(s[key])))].map((v) => `${v}×${list.filter((s) => String(s[key]) === v).length}`);
    return {
      parts: list.length,
      triangles: list.reduce((n, s) => n + s.triangles, 0),
      sizeCm: [0, 1, 2].map((k) => +((hi[k] - lo[k]) * 100).toFixed(1)),
      sources: count("source"),
      materials: [...new Set(list.map((s) => s.group))].map((g) => `${g} ${GROUP_COLORS[g] ?? SYSTEM_COLORS[g as keyof typeof SYSTEM_COLORS] ?? "?"}`),
      islands: list.reduce((n, s) => n + s.islands, 0),
      badNormals: list.reduce((n, s) => n + s.badNormals, 0),
      degenerate: list.reduce((n, s) => n + s.degenerate, 0),
      outliers,
    };
  };

  const structures = SYSTEM_VIEWS.filter((v) => viewKind(v) === "structure" && (!only || v.systemId === only)).map((v) => ({
    id: v.id,
    name: v.name.vi,
    ...(viewParts(v.id) ? summarize(viewParts(v.id)!.focus) : { missing: true }),
  }));
  const viewReport = views
    .filter((v) => viewKind(v) !== "structure")
    .map((v) => ({
      id: v.id,
      kind: viewKind(v),
      name: v.name.vi,
      missing: v.missing?.vi,
      structures: viewStructures(v.id).map((s) => s.id),
      focus: viewParts(v.id) ? summarize(viewParts(v.id)!.focus) : null,
      context: viewParts(v.id)?.context ? summarize(viewParts(v.id)!.context!) : null,
    }));

  const all = [...stats.values()];
  const report = {
    generatedAt: new Date().toISOString(),
    scope: only ?? "all system views",
    atlasTriangles: atlas.parts.reduce((n, p) => n + p.indexCount / 3, 0),
    atlasParts: atlas.parts.length,
    chunks: atlas.chunks.map((c, i) => ({ i, file: c.url.split("/").pop(), mb: +(c.bytes / 1e6).toFixed(2), gzMb: c.gzipBytes ? +(c.gzipBytes / 1e6).toFixed(2) : null })),
    measured: all.length,
    worstNormals: all.filter((s) => s.badNormals > 0).sort((a, b) => b.badNormals - a.badNormals).slice(0, 15).map((s) => `${s.name} ${s.badNormals}/${s.vertices}`),
    mostIslands: all.sort((a, b) => b.islands - a.islands).slice(0, 15).map((s) => `${s.name} ${s.islands}`),
    duplicates: duplicates.map((ids) => ids.map((id) => `${stats.get(id)!.name} (${id})`)),
    structures,
    views: viewReport,
  };
  writeFileSync(OUT, JSON.stringify(report, null, 1));
  for (const v of viewReport) {
    const f = v.focus;
    console.log(
      `${v.id.padEnd(36)} ${v.missing ? "MISSING — " + v.missing : `${f!.parts} mảnh · ${f!.triangles.toLocaleString()} tam giác · ${f!.sizeCm.join("×")} cm · ${f!.sources.join(", ")} · rời ${f!.islands} · lệch ${f!.outliers.length}`}`,
    );
  }
  console.log(`\nHình trùng: ${duplicates.length} nhóm. Pháp tuyến hỏng ở ${all.filter((s) => s.badNormals).length} mảnh. Ghi ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
