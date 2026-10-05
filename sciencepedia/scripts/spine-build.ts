import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assembleTopic, verifyQuotes, type Decision, type SectionMeta } from "../src/lib/spine/assemble";
import { extractSection, parsePage } from "../src/lib/spine/extract";
import { renderArticle } from "../src/lib/spine/render";
import { Editorial } from "../src/lib/spine/schema";

/**
 * Tệp biên tập + bản chép trang + quyết định D-n → topic JSON + bản nháp bài.
 *
 *   npm run spine:build              # kiểm hết, in tóm tắt, không ghi
 *   npm run spine:build -- --write   # ghi topics/<slug>.json và docs/content/drafts/<slug>{,.en}.md
 *
 * Từ chối khi: tệp biên tập sai schema, một đoạn trích không khớp nguyên văn bản
 * chép, một thể có mapping mà biên tập bỏ quên, hoặc review.mapping = passed mà
 * còn mã chưa chắc. Không đụng CSDL — bản nháp phải qua science-editor trước.
 */

const ROOT = path.join(process.cwd(), "content/tac-dong-cot-song");
const DRAFTS = path.join(process.cwd(), "../docs/content/drafts");

function main() {
  const write = process.argv.includes("--write");
  const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

  const manifest = read(path.join(ROOT, "source/manifest.json")) as { sections: SectionMeta[] };
  const decisions = (read(path.join(ROOT, "source/decisions.json")) as { entries: Decision[] }).entries;
  const pages = readdirSync(path.join(ROOT, "source/pages"))
    .filter((f) => /^p\d+\.md$/.test(f))
    .sort()
    .map((f) => parsePage(readFileSync(path.join(ROOT, "source/pages", f), "utf8")));

  const topicsDir = path.join(ROOT, "topics");
  const files = readdirSync(topicsDir).filter((f) => f.endsWith(".editorial.json")).sort();
  let failed = 0;

  for (const file of files) {
    const parsed = Editorial.safeParse(read(path.join(topicsDir, file)));
    if (!parsed.success) {
      failed += 1;
      console.error(`✖ ${file}\n  ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ")}`);
      continue;
    }
    const editorial = parsed.data;
    const meta = manifest.sections.find((s) => s.id === editorial.section);
    if (!meta) {
      failed += 1;
      console.error(`✖ ${file}: mục "${editorial.section}" không có trong manifest`);
      continue;
    }

    const quoteErrors = verifyQuotes(
      [...editorial.symptoms, ...editorial.methodQuotes, ...editorial.variants.flatMap((v) => v.quotes), ...editorial.outOfScope],
      pages,
    );
    // Trích dẫn phải nằm trong phạm vi trang của chính mục — không mượn trang mục khác.
    for (const q of [...editorial.symptoms, ...editorial.methodQuotes, ...editorial.variants.flatMap((v) => v.quotes), ...editorial.outOfScope]) {
      if (q.pdfPage < meta.pdfPages[0] || q.pdfPage > meta.pdfPages[1]) quoteErrors.push(`tr.${q.pdfPage} nằm ngoài mục (${meta.pdfPages.join("–")})`);
    }
    if (quoteErrors.length) {
      failed += 1;
      console.error(`✖ ${file}: trích dẫn\n  ${quoteErrors.join("\n  ")}`);
      continue;
    }

    let topic;
    try {
      topic = assembleTopic(extractSection(meta.id, meta.pdfPages, pages), meta, decisions, editorial);
    } catch (error) {
      failed += 1;
      console.error(`✖ ${file}: ${(error as Error).message}`);
      continue;
    }

    const mappings = topic.variants.flatMap((v) => v.mappings);
    const uncertain = mappings.filter((m) => m.confidence === "uncertain").length;
    console.log(
      `✔ ${editorial.slug}\n    ${topic.variants.length} thể · ${mappings.length} mapping` +
        ` (${uncertain} chưa chắc) · ${topic.unassigned.length} mã không vai · ${editorial.sources.length} nguồn bậc 1–2`,
    );

    if (write) {
      mkdirSync(DRAFTS, { recursive: true });
      writeFileSync(path.join(topicsDir, `${editorial.slug}.json`), `${JSON.stringify(topic, null, 2)}\n`);
      writeFileSync(path.join(DRAFTS, `${editorial.slug}.md`), renderArticle(topic, editorial, "vi"));
      writeFileSync(path.join(DRAFTS, `${editorial.slug}.en.md`), renderArticle(topic, editorial, "en"));
    }
  }

  if (failed) {
    console.error(`\n${failed}/${files.length} chủ đề hỏng — không ghi gì cho các chủ đề đó.`);
    process.exitCode = 1;
  }
  if (!write) console.log("\nChạy khô — thêm --write để ghi topic JSON và bản nháp.");
}

main();
