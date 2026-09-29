import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { atlasSchema, correctSystems } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import { withSupplements } from "../src/lib/human-atlas/supplements";
import { ANATOMY_SOURCES } from "../src/lib/human-atlas/structures";

/**
 * Nhóm cơ quan trong một hệ (gan / tuỵ / ruột non… ; não / thân não / dây
 * thần kinh…) → `src/lib/human-atlas/part-groups.generated.json`.
 *
 *   npx tsx scripts/anatomy-groups.ts [--atlas <atlas.json>] [--write]
 *
 * ## Vì sao cần
 *
 * Một vật liệu mỗi hệ làm cả hệ tiêu hoá một màu be — gan, tuỵ, ruột hoà vào
 * nhau. Màu theo nhóm cơ quan cho người đọc phân biệt bằng mắt.
 *
 * ## Vì sao tính ở đây chứ không lúc chạy
 *
 * Nhóm suy từ tên mảnh + nhãn khái niệm + TOÀN BỘ chuỗi tổ tiên is-a của FMA
 * (cache OLS thô của `anatomy-enrich.ts`), rồi ghi ra một bảng tĩnh. Viewer chỉ
 * tra bảng — không đọc tên mesh mỗi khung, không tải ontology.
 */

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/anatomy", `ols-fma-${ANATOMY_SOURCES.fma.version}`);
const OUT = path.join(ROOT, "src/lib/human-atlas/part-groups.generated.json");
/** Số mảnh mỗi hệ sau correctSystems — trang giới thiệu đọc nó, viewer tự đếm lại cùng dữ liệu. */
const COUNTS_OUT = path.join(ROOT, "src/lib/human-atlas/system-counts.generated.json");

/** Thứ tự là ưu tiên: luật đầu tiên khớp thắng (ống mật trước gan, v.v.). */
const RULES: Record<string, [string, RegExp][]> = {
  digestive: [
    ["biliary", /gallbladder|bile duct|biliary|hepatic duct|cystic duct/i],
    ["pancreas", /pancrea/i],
    ["liver", /\bliver\b|hepatovenous|lobe of liver/i],
    ["esophagus", /esophag/i],
    ["stomach", /stomach/i],
    ["small_intestine", /small intestine|jejun|\bileum\b|\bileal\b|duoden|ileocecal/i],
    ["large_intestine", /large intestine|colon|taenia|append|cecum|rectum/i],
    ["oral", /tongue|salivary|sublingual|submandibular|parotid/i],
  ],
  integumentary: [
    ["hair", /hair|eyebrow/i],
    ["lip", /^lip$/i],
    ["skin", /skin/i],
  ],
  lymphatic: [
    ["spleen", /spleen/i],
    ["thymus", /thymus/i],
  ],
  nervous: [
    ["nerve", /\bnerve\b|ganglion|optic chiasm|optic tract/i],
    ["ventricles", /ventricle|aqueduct|central canal|interventricular foramen|choroid plexus/i],
    ["meninges", /tentorium|dura mater|meninx/i],
    ["brainstem", /medulla oblongata|\bpons\b|midbrain|colliculus|interpeduncular/i],
    ["cerebellum", /cerebellum/i],
    ["brain", /./],
  ],
};

function ancestorLabels(conceptId: string): string[] {
  const file = path.join(CACHE, `${conceptId}.json`);
  if (!existsSync(file)) return [];
  const raw = JSON.parse(readFileSync(file, "utf8")) as {
    label?: string | string[];
    hierarchicalAncestor?: string[];
    linkedEntities?: Record<string, { label?: string | string[] }>;
  } | null;
  if (!raw) return [];
  const labelOf = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";
  return [labelOf(raw.label), ...(raw.hierarchicalAncestor ?? []).map((iri) => labelOf(raw.linkedEntities?.[iri]?.label))];
}

async function main() {
  const atlasPath = process.argv.includes("--atlas") ? process.argv[process.argv.indexOf("--atlas") + 1] : null;
  const raw = atlasPath ? JSON.parse(readFileSync(atlasPath, "utf8")) : await (await fetch(atlasDataUrl("atlas.json"))).json();
  const atlas = correctSystems(atlasSchema.parse(raw));

  const groups: Record<string, string> = {};
  const counts: Record<string, number> = {};
  for (const part of atlas.parts) {
    const rules = RULES[part.system];
    if (!rules) continue;
    // Tên mảnh trước, rồi nhãn khái niệm, rồi tổ tiên is-a từ gần tới xa.
    const texts = [part.name, ...ancestorLabels(part.conceptId)];
    const hit = texts.map((text) => rules.find(([, re]) => re.test(text))).find(Boolean);
    const group = hit ? `${part.system}.${hit[0]}` : null;
    if (!group) continue;
    groups[part.id] = group;
    counts[group] = (counts[group] ?? 0) + 1;
  }
  console.log(Object.entries(counts).sort().map(([g, n]) => `${g}: ${n}`).join("\n"));
  const systemCounts: Record<string, number> = {};
  // Đếm cả phần bổ sung (mạng bạch huyết UMCG): viewer đếm trên danh mục đã nối.
  for (const part of withSupplements(atlas).parts) systemCounts[part.system] = (systemCounts[part.system] ?? 0) + 1;
  console.log("hệ:", JSON.stringify(systemCounts));
  if (process.argv.includes("--write")) {
    writeFileSync(COUNTS_OUT, `${JSON.stringify(systemCounts, null, 1)}\n`);
    writeFileSync(OUT, `${JSON.stringify(groups, null, 1)}\n`);
    console.log(`Đã ghi ${path.relative(ROOT, OUT)} (${Object.keys(groups).length} mảnh)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
