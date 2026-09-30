import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { atlasSchema, correctSystems, type Atlas } from "../src/lib/human-atlas/anatomy";
import { atlasDataUrl } from "../src/lib/human-atlas/assets";
import { withSupplements } from "../src/lib/human-atlas/supplements";
import { ATLAS_VIEWS, viewKind, type PartRule } from "../src/lib/human-atlas/views";

/**
 * Góc nhìn → mã mảnh thật → `src/lib/human-atlas/view-parts.generated.json`.
 *
 *   npx tsx scripts/atlas-views.ts [--atlas <atlas.json>] [--write]
 *
 * Chạy khô in báo cáo: mỗi góc nhìn khung theo bao nhiêu mảnh, ẩn thêm / làm mờ
 * bao nhiêu, và mảnh nào bị quy tắc bắt (`--verbose`). Góc nhìn theo hệ khớp
 * theo mã FMA (`fma`); `--audit <hệ>` in thêm mảnh nào của hệ đó KHÔNG nằm
 * trong góc nhìn cấu trúc nào — để thấy chỗ hở của phân nhóm. Quy tắc nào không khớp mảnh nào là LỖI (thoát 1) — đó
 * là dấu hiệu gõ sai tên hoặc bộ dữ liệu không có thứ góc nhìn cần, và phải
 * được xử lý (sửa quy tắc hoặc chuyển góc nhìn sang `missing`), không bỏ qua.
 */

const OUT = path.join(__dirname, "..", "src/lib/human-atlas/view-parts.generated.json");

function match(atlas: Atlas, rule: PartRule) {
  return atlas.parts.filter(
    (p) =>
      (!rule.systems || rule.systems.includes(p.system)) &&
      (!rule.name || rule.name.test(p.name)) &&
      (!rule.fma || rule.fma.includes(p.conceptId)) &&
      !rule.exclude?.test(p.name),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const atlasPath = args.includes("--atlas") ? args[args.indexOf("--atlas") + 1] : null;
  const raw = atlasPath
    ? JSON.parse(readFileSync(atlasPath, "utf8"))
    : await (await fetch(atlasDataUrl("atlas.json"))).json();
  // Cùng danh mục viewer dùng: có cả mảnh bổ sung (nhu mô phổi, tuyến giáp của Z-Anatomy).
  const atlas = withSupplements(correctSystems(atlasSchema.parse(raw)));

  const out: Record<string, { focus: string[]; hide: string[]; context?: string[] }> = {};
  let failed = false;
  for (const view of ATLAS_VIEWS) {
    if (view.missing) {
      console.log(`- ${view.id}: THIẾU DỮ LIỆU — ${view.missing.vi}`);
      continue;
    }
    const collect = (rules: readonly PartRule[] = []) => {
      const ids = new Set<string>();
      for (const rule of rules) {
        const hits = match(atlas, rule);
        if (hits.length === 0) {
          console.error(`  ✗ ${view.id}: quy tắc ${rule.name ?? ""} (${rule.systems?.join(",") ?? "mọi hệ"}) không khớp mảnh nào`);
          failed = true;
        }
        // Mỗi mã FMA phải có mảnh — một mã gõ sai trong danh sách dài không được lọt.
        for (const code of rule.fma ?? []) {
          if (!hits.some((p) => p.conceptId === code)) {
            console.error(`  ✗ ${view.id}: mã ${code} không khớp mảnh nào`);
            failed = true;
          }
        }
        hits.forEach((p) => ids.add(p.id));
      }
      return ids;
    };
    const focus = collect(view.focus);
    const hide = collect(view.hide);
    const context = collect(view.context);
    focus.forEach((id) => {
      hide.delete(id);
      context.delete(id);
    });
    out[view.id] = { focus: [...focus].sort(), hide: [...hide].sort() };
    if (context.size) out[view.id].context = [...context].sort();
    const names = (ids: Set<string>) =>
      [...new Set(atlas.parts.filter((p) => ids.has(p.id)).map((p) => p.name))].sort();
    console.log(
      `- ${view.id} [${viewKind(view)}]: khung theo ${focus.size} mảnh` +
        (hide.size ? `, ẩn thêm ${hide.size}` : "") +
        (context.size ? `, làm mờ ${context.size}` : ""),
    );
    if (args.includes("--verbose")) {
      console.log(`    khung: ${names(focus).join("; ")}`);
      if (hide.size) console.log(`    ẩn: ${names(hide).join("; ")}`);
      if (context.size) console.log(`    mờ: ${names(context).join("; ")}`);
    }
  }

  const auditSystem = args.includes("--audit") ? args[args.indexOf("--audit") + 1] : null;
  if (auditSystem) {
    const covered = new Set(
      ATLAS_VIEWS.filter((v) => v.systemId === auditSystem && viewKind(v) === "structure").flatMap(
        (v) => out[v.id]?.focus ?? [],
      ),
    );
    const own = atlas.parts.filter((p) => p.system === auditSystem);
    const loose = own.filter((p) => !covered.has(p.id));
    console.log(`\nAudit ${auditSystem}: ${own.length} mảnh, ${own.length - loose.length} nằm trong ít nhất một cấu trúc.`);
    for (const p of loose) console.log(`  chưa thuộc cấu trúc nào: ${p.id} ${p.name} (${p.conceptId})`);
  }

  if (failed) process.exit(1);
  if (args.includes("--write")) {
    writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
    console.log(`Đã ghi ${path.relative(process.cwd(), OUT)}`);
  } else {
    console.log("(chạy khô — thêm --write để ghi)");
  }
}

void main();
