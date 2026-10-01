/**
 * Duyệt tên tiếng Việt của CẤU TRÚC CHÍNH (cơ quan, xương, cơ) — mục 2 của độ phủ tên.
 *
 *   npx tsx scripts/atlas-names-review.ts --emit <dir>
 *       Ghi <dir>/names-review.tsv: mọi mã FMA của tập chính (`data/anatomy/descriptions.json`,
 *       gồm cả trái/phải) mà tên còn là bản ghép chưa duyệt. Cột: id, system, english,
 *       vi_hien_tai, wp_vi_title (tiêu đề Wikipedia tiếng Việt — chỉ để đối chiếu).
 *
 *   npx tsx scripts/atlas-names-review.ts --merge <tsv> <result.json> [--write]
 *       Gộp phán quyết science-editor vào `src/lib/human-atlas/names-vi.reviewed.json`.
 *       result.json = {"corrections":[{id,vi}], "hold":[{id}]}: id có trong `corrections`
 *       lấy tên sửa, id trong `hold` BỎ QUA (giữ nhãn "chưa duyệt"), id còn lại trong tsv
 *       là tên hiện tại được chấp nhận. Mục đã có trong tệp được giữ. Chạy khô nếu thiếu --write.
 *
 * Tên trong tệp hiện như thuật ngữ chuẩn, không nhãn — chỉ ghi tên đã qua science-editor.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { viName, viNameStatus } from "../src/lib/human-atlas/names-vi";

const ROOT = path.join(__dirname, "..");
const DESCRIPTIONS = path.join(ROOT, "data/anatomy/descriptions.json");
const AUDIT = path.join(ROOT, ".cache/anatomy/audit.json");
const REVIEWED = path.join(ROOT, "src/lib/human-atlas/names-vi.reviewed.json");

type Entry = { fmaAll: string[]; enName: string; system: string; source?: { title: string; url: string } };
type ReviewedFile = { note: string; names: Record<string, string> };

function emit(dir: string) {
  const { entries } = JSON.parse(readFileSync(DESCRIPTIONS, "utf8")) as { entries: Entry[] };
  const audit = JSON.parse(readFileSync(AUDIT, "utf8")) as { name: string; conceptId: string }[];
  const nameOf = new Map(audit.map((p) => [p.conceptId, p.name]));
  const lines = ["id\tsystem\tenglish\tvi_hien_tai\twp_vi_title"];
  for (const e of entries) {
    const wpVi = e.source?.url.includes("vi.wikipedia") ? e.source.title : "";
    for (const id of e.fmaAll) {
      const en = nameOf.get(id) ?? e.enName;
      if (viNameStatus(id, en) !== "machine-translated") continue;
      lines.push([id, e.system, en, viName(id, en), wpVi].join("\t"));
    }
  }
  const out = path.join(dir, "names-review.tsv");
  writeFileSync(out, lines.join("\n"));
  console.log(`${lines.length - 1} tên chờ duyệt → ${out}`);
}

function merge(tsvPath: string, resultPath: string, write: boolean) {
  const rows = readFileSync(tsvPath, "utf8").split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split("\t"));
  const result = JSON.parse(readFileSync(resultPath, "utf8")) as {
    corrections?: { id: string; vi: string }[];
    hold?: { id: string }[];
  };
  const fixed = new Map((result.corrections ?? []).map((c) => [c.id, c.vi.trim()]));
  const held = new Set((result.hold ?? []).map((h) => h.id));
  const known = new Set(rows.map((r) => r[0]));
  for (const id of [...fixed.keys(), ...held]) if (!known.has(id)) throw new Error(`${id} không có trong ${tsvPath}`);

  const file = JSON.parse(readFileSync(REVIEWED, "utf8")) as ReviewedFile;
  let added = 0, corrected = 0, skipped = 0;
  for (const [id, , , current] of rows) {
    if (held.has(id)) { skipped++; continue; }
    const vi = fixed.get(id) ?? current;
    if (!vi || vi === "null") throw new Error(`${id}: không có tên`);
    if (fixed.has(id)) corrected++;
    if (file.names[id] == null) added++;
    file.names[id] = vi;
  }
  file.names = Object.fromEntries(Object.entries(file.names).sort(([a], [b]) => a.localeCompare(b)));
  console.log({ rows: rows.length, added, corrected, hold: skipped, total: Object.keys(file.names).length });
  if (write) writeFileSync(REVIEWED, JSON.stringify(file, null, 2) + "\n");
  else console.log("chạy khô — thêm --write để ghi");
}

const [mode, a, b] = process.argv.slice(2);
if (mode === "--emit" && a) emit(a);
else if (mode === "--merge" && a && b) merge(a, b, process.argv.includes("--write"));
else {
  console.error("dùng: --emit <dir> | --merge <tsv> <result.json> [--write]");
  process.exit(1);
}
