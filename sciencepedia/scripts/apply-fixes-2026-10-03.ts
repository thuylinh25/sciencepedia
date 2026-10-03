import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Sửa các lỗi nội dung phát hiện khi bổ sung bản en (đợt 03/10).
 *
 *   npx tsx --env-file-if-exists=.env scripts/apply-fixes-2026-10-03.ts          # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/apply-fixes-2026-10-03.ts --write  # ghi
 *
 * Hai phần:
 *
 * 1. Sửa có neo (`docs/content/checks/2026-10-03/fixes.json`): mỗi `find` phải khớp
 *    ĐÚNG MỘT lần trong trường được nêu, lệch thì dừng cả lượt. Sửa loại `claim` ghi
 *    một dòng vào `docs/content/corrections.md` (sửa bài đã publish là đính chính).
 *
 * 2. Đồng bộ chữ link "Further reading" ở bản en về đúng `titleEn` hiện tại của bài
 *    đích. Chỉ chạm dòng danh sách CHỈ gồm một link nội bộ (`- [chữ](/articles/slug)`):
 *    link nằm giữa câu là một phần câu văn, đổi chữ của nó là biên tập câu, không phải
 *    đồng bộ tiêu đề. href không bao giờ đổi. Vì sao cần: ~110 link mang tiêu đề do
 *    từng lượt dịch tự đặt, và 4 bài còn để nguyên chữ tiếng Việt trong trang tiếng Anh
 *    — vi phạm "Song ngữ phải thật" (docs/content-rules.md).
 *
 * Mỗi bài thay đổi ghi trong một transaction kèm `Revision` chụp bản TRƯỚC khi sửa
 * (bản vi nếu bản vi đổi, ngược lại bản en) — vừa đúng quy tắc đính chính, vừa giữ
 * mốc cho `scripts/restore-updated-at.ts`.
 */
const prisma = new PrismaClient();

const ROOT = join(__dirname, "..", "..", "docs", "content");
const PLAN = join(ROOT, "checks", "2026-10-03", "fixes.json");
const CORRECTIONS = join(ROOT, "corrections.md");
const LOG_HEADER = "## 2026-10-03 — sửa lỗi phát hiện khi bổ sung bản en";
const READING_LINE = /^([-*]\s+)\[([^\]\n]+)\]\(\/(?:en\/)?articles\/([a-z0-9-]+)\)(\s*)$/gm;

type Field = "content" | "contentEn" | "summary" | "summaryEn";
type Edit = { slug: string; field: Field; kind: "claim" | "anchor" | "format"; find: string; replace: string; log?: string; basis?: string };

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) count++;
  return count;
}

async function main() {
  const write = process.argv.includes("--write");
  console.log("=== SỬA LỖI ĐỢT 03/10 ===");
  console.log(write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  const { edits } = JSON.parse(readFileSync(PLAN, "utf8")) as { edits: Edit[] };
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, titleEn: true, content: true, contentEn: true, summary: true, summaryEn: true },
  });
  const titleEnOf = new Map(articles.map((a) => [a.slug, a.titleEn]));

  let failures = 0;
  const fail = (m: string) => {
    console.error(`   ✗ ${m}`);
    failures++;
  };
  const planned: { slug: string; logs: Edit[]; run: () => Promise<unknown> }[] = [];

  for (const a of articles) {
    const next: Record<Field, string | null> = { content: a.content, contentEn: a.contentEn, summary: a.summary, summaryEn: a.summaryEn };
    const notes: string[] = [];

    for (const e of edits.filter((x) => x.slug === a.slug)) {
      const text = next[e.field];
      // Đã áp ở lần chạy trước — bỏ qua, để chạy lại không cộng dồn (vd. thêm `**` lần hai).
      if (text !== null && text.includes(e.replace)) continue;
      const hits = text === null ? 0 : occurrences(text, e.find);
      if (hits !== 1) {
        fail(`${a.slug} ${e.field}: neo khớp ${hits} lần, cần đúng 1 — "${e.find.slice(0, 60)}"`);
        continue;
      }
      next[e.field] = text!.replace(e.find, e.replace);
      notes.push(`${e.kind} ${e.field}`);
    }

    if (next.contentEn) {
      let synced = 0;
      next.contentEn = next.contentEn.replace(READING_LINE, (line, bullet: string, text: string, slug: string, tail: string) => {
        const target = titleEnOf.get(slug);
        if (!target || target === text || /[[\]]/.test(target)) return line;
        synced++;
        console.log(`   ${a.slug}: "${text}" → "${target}"`);
        return `${bullet}[${target}](/articles/${slug})${tail}`;
      });
      if (synced) notes.push(`đồng bộ ${synced} chữ link en`);
    }

    // Cảnh báo dòng "Đọc thêm" bản vi còn mang tiêu đề cũ đã bị đính chính.
    if (/100\.000 Năm/.test(next.content ?? "")) fail(`${a.slug}: bản vi còn chữ '100.000 Năm'`);

    const changed = (Object.keys(next) as Field[]).filter((f) => next[f] !== a[f]);
    if (!changed.length) continue;
    console.log(`${a.slug}: ${notes.join("; ")}\n`);

    const viChanged = changed.includes("content") || changed.includes("summary");
    const snapshot = viChanged
      ? { title: a.title, content: a.content }
      : { title: a.titleEn ?? a.title, content: a.contentEn! };
    const note = `${viChanged ? "Bản VI" : "Bản EN (contentEn)"} trước lượt sửa 2026-10-03: ${notes.join("; ")}`;
    const data = Object.fromEntries(changed.map((f) => [f, next[f]]));

    planned.push({
      slug: a.slug,
      logs: edits.filter((x) => x.slug === a.slug && x.kind === "claim" && x.log),
      run: () =>
        prisma.$transaction([
          prisma.revision.create({ data: { articleId: a.id, ...snapshot, note } }),
          prisma.article.update({ where: { id: a.id }, data: { ...data, lastVerifiedAt: notes.some((n) => n.startsWith("claim")) ? new Date() : undefined } }),
        ]),
    });
  }

  for (const e of edits) if (!articles.some((a) => a.slug === e.slug)) fail(`không thấy bài ${e.slug}`);

  if (failures > 0) {
    console.error(`✗ ${failures} chỗ không áp được. KHÔNG ghi gì cả.`);
    process.exitCode = 1;
    return;
  }
  if (!write) {
    console.log(`Sẵn sàng sửa ${planned.length} bài. Chạy lại với --write.`);
    return;
  }
  for (const p of planned) {
    await p.run();
    if (p.logs.length) {
      const head = readFileSync(CORRECTIONS, "utf8").includes(LOG_HEADER)
        ? []
        : ["", LOG_HEADER, "", "Kế hoạch: `docs/content/checks/2026-10-03/fixes.json`. Script: `scripts/apply-fixes-2026-10-03.ts`;", "bản trước khi sửa được chụp vào `Revision` trong cùng transaction."];
      appendFileSync(
        CORRECTIONS,
        [...head, "", `### ${p.slug}`, "", ...p.logs.map((e) => `- - 2026-10-03 | ${p.slug} | ${e.log} | ${e.basis}`), ""].join("\n"),
        "utf8",
      );
    }
    console.log(`✓ ${p.slug}`);
  }
  console.log(`\nĐã sửa ${planned.length} bài.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
