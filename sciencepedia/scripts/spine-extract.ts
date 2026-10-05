import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { extractSection, parsePage, reviewFlags, type SectionExtract } from "../src/lib/spine/extract";

/**
 * Bản chép trang → trường có nhãn của từng thể bệnh (bước máy của pipeline
 * "Tác động cột sống").
 *
 *   npx tsx scripts/spine-extract.ts                 # in tóm tắt + cờ review, không ghi
 *   npx tsx scripts/spine-extract.ts --write         # ghi extract.generated.json + review-flags.md
 *   npx tsx scripts/spine-extract.ts --section sot   # chỉ một mục
 *
 * Không đụng CSDL, không mạng. Đầu ra là đầu vào cho NGƯỜI duyệt — topic JSON
 * (`content/tac-dong-cot-song/topics/`) chỉ dựng sau khi người đối chiếu cờ
 * review với ảnh trang. Lý do: `docs/content-rules.md`, mục "Tác động cột sống".
 */

const ROOT = path.join(process.cwd(), "content/tac-dong-cot-song");
const SOURCE = path.join(ROOT, "source");

type Manifest = { sections: { id: string; pdfPages: [number, number] }[] };

function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const only = argv.includes("--section") ? argv[argv.indexOf("--section") + 1] : null;

  const manifest = JSON.parse(readFileSync(path.join(SOURCE, "manifest.json"), "utf8")) as Manifest;
  const pages = readdirSync(path.join(SOURCE, "pages"))
    .filter((f) => /^p\d+\.md$/.test(f))
    .sort()
    .map((f) => parsePage(readFileSync(path.join(SOURCE, "pages", f), "utf8")));

  const missing = Array.from({ length: 43 }, (_, i) => i + 1).filter((n) => !pages.some((p) => p.pdfPage === n));
  if (missing.length) throw new Error(`thiếu bản chép trang: ${missing.join(", ")}`);

  const sections: SectionExtract[] = manifest.sections
    .filter((s) => !only || s.id === only)
    .map((s) => extractSection(s.id, s.pdfPages, pages));
  if (only && sections.length === 0) throw new Error(`không có mục "${only}" trong manifest`);

  const report: string[] = [
    "# Cờ review — Tác động cột sống",
    "",
    "Sinh bởi `scripts/spine-extract.ts`. Mỗi dòng là một chỗ máy KHÔNG chắc hoặc",
    "không được phép quyết. Đối chiếu với ảnh trang, ghi quyết định vào topic JSON;",
    "đừng sửa tệp này bằng tay — chạy lại script.",
    "",
  ];
  let total = 0;
  for (const section of sections) {
    const flags = reviewFlags(section);
    const codes = section.variants.reduce(
      (n, v) => n + v.fields.reduce((m, f) => m + (f.kind !== "treatment" ? f.vertebrae?.codes.length ?? 0 : 0), 0),
      0,
    );
    total += flags.length;
    console.log(
      `${section.id.padEnd(28)} tr.${section.pdfPages.join("–").padEnd(6)} ` +
        `${String(section.variants.length).padStart(3)} thể · ${String(codes).padStart(3)} mã · ${String(flags.length).padStart(3)} cờ`,
    );
    report.push(`## ${section.id} (tr. ${section.pdfPages.join("–")})`, "");
    report.push(...(flags.length ? flags.map((f) => `- ${f}`) : ["- (không có cờ)"]), "");
  }
  console.log(`\nTổng: ${total} cờ review.`);

  if (!write) {
    console.log("Chạy khô — thêm --write để ghi extract.generated.json và review-flags.md.");
    return;
  }
  const out = path.join(ROOT, "extract");
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "extract.generated.json"), `${JSON.stringify({ sections }, null, 1)}\n`);
  writeFileSync(path.join(out, "review-flags.md"), `${report.join("\n")}\n`);
  console.log(`Đã ghi ${path.relative(process.cwd(), out)}/`);
}

main();
