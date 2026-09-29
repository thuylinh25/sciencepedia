import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { atlasSchema, correctSystems } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import { ANATOMY_SOURCES } from "../src/lib/human-atlas/structures";

/**
 * Bảng audit toàn bộ mảnh BodyParts3D — CHỈ ĐỌC, không sửa gì.
 *
 *   npx tsx scripts/anatomy-audit.ts [--atlas <atlas.json>] [--out <file.json>]
 *
 * Mỗi mảnh: mã, tên, mã FMA, hệ gốc của atlas.json, hệ sau `correctSystems`,
 * hộp bao, và TOÀN BỘ nhãn tổ tiên FMA (is-a + part-of, từ cache OLS của
 * `anatomy-enrich.ts`). Dùng khi nghi phân loại hệ sai: tìm theo tổ tiên
 * ontology, không theo chữ trong tên mảnh — "Hepatovenous segment" có chữ
 * "venous" mà là nhu mô gan.
 */

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/anatomy", `ols-fma-${ANATOMY_SOURCES.fma.version}`);

type Raw = {
  label?: string | string[];
  hierarchicalAncestor?: string[];
  linkedEntities?: Record<string, { label?: string | string[] }>;
} | null;

function ancestors(conceptId: string): string[] | null {
  const file = path.join(CACHE, `${conceptId}.json`);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, "utf8")) as Raw;
  if (!raw) return null;
  const labelOf = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";
  return (raw.hierarchicalAncestor ?? []).map((iri) => labelOf(raw.linkedEntities?.[iri]?.label)).filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const atlasPath = args.includes("--atlas") ? args[args.indexOf("--atlas") + 1] : null;
  const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : path.join(ROOT, ".cache/anatomy/audit.json");
  const raw = atlasPath ? JSON.parse(readFileSync(atlasPath, "utf8")) : await (await fetch(atlasDataUrl("atlas.json"))).json();
  const original = atlasSchema.parse(raw);
  const originalSystem = new Map(original.parts.map((p) => [p.id, p.system]));
  const atlas = correctSystems(atlasSchema.parse(raw));

  const rows = atlas.parts.map((p) => ({
    id: p.id,
    name: p.name,
    conceptId: p.conceptId,
    sourceSystem: originalSystem.get(p.id),
    system: p.system,
    bounds: p.bounds,
    vertexCount: p.vertexCount,
    ancestors: ancestors(p.conceptId),
  }));
  writeFileSync(out, JSON.stringify(rows));
  const noCache = rows.filter((r) => r.ancestors === null).length;
  console.log(`${rows.length} mảnh → ${path.relative(process.cwd(), out)} (${noCache} mảnh không có tổ tiên FMA trong cache)`);
}

void main();
