import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

import { prose } from "./check-publish";

/**
 * Áp đính chính S1/S2 của đợt thẩm định 17/09 lên các bài ĐÃ XUẤT BẢN.
 *
 *   npx tsx scripts/apply-fixes-2026-09-17.ts            # in kế hoạch
 *   npx tsx scripts/apply-fixes-2026-09-17.ts --write    # thực thi
 *
 * Kế hoạch nằm ở `docs/content/checks/2026-09-17/fixes/<slug>.json`, do
 * `science-editor` soạn từ file thẩm định cùng thư mục. Script KHÔNG tự nghĩ
 * ra chữ nào: nó chỉ thay chuỗi, đổi bảng nguồn, và ghi lại lịch sử.
 *
 * ## Ba thứ mỗi lượt sửa bài đã publish phải để lại (docs/content-rules.md)
 *
 * 1. `Revision` chụp nội dung TRƯỚC khi sửa — ghi trong CÙNG transaction với
 *    lệnh sửa, để lịch sử không thể lệch khỏi nội dung.
 * 2. Một dòng trong `docs/content/corrections.md`: claim cũ, claim mới, căn cứ.
 * 3. `lastVerifiedAt` cập nhật.
 *
 * ## Vì sao dừng cả lượt khi một neo không khớp
 *
 * `find` là neo chuỗi thô. Bài đã đổi từ lúc soạn kế hoạch thì neo hoặc mất,
 * hoặc — tệ hơn — khớp ở chỗ khác. Nửa lô sửa được, nửa kia không, là trạng
 * thái không ai dựng lại được. Nên: đếm trước toàn bộ, chỉ ghi khi sạch.
 *
 * ## Vì sao KHÔNG đụng `factCheck`
 *
 * Lượt này chỉ đóng S1/S2. Mỗi bài còn nhiều phát hiện S3/S4, và bài vẫn dưới
 * ngưỡng ba nguồn bậc 1–2. `factCheck` giữ nguyên REVISE/FAILED cho tới khi
 * người duyệt xem lại — sửa chuỗi xong không phải là qua gate.
 */
const prisma = new PrismaClient();

const VERIFIED_AT = new Date("2026-09-17T00:00:00Z");

/** Cùng hằng số với check-publish.ts và src/lib/rewrite.ts */
const WORDS_PER_MINUTE = 200;

const FIXES = join(__dirname, "..", "..", "docs", "content", "checks", "2026-09-17", "fixes");
const CORRECTIONS = join(__dirname, "..", "..", "docs", "content", "corrections.md");

type Edit = {
  claimId: string;
  severity: string;
  find: string;
  replace: string;
  why: string;
  evidence?: string;
};

type NewSource = {
  title: string;
  url?: string;
  doi?: string;
  publisher?: string;
  year?: number;
  /** 1 = bình duyệt · 2 = cơ quan thẩm quyền · 3 = giáo dục · 4 = báo chí khoa học */
  tier: number;
  covers?: string;
};

type Plan = {
  slug: string;
  edits: Edit[];
  /**
   * Sửa trên trường `summary`, tách khỏi `edits` vì summary KHÔNG nằm trong
   * `content`. Bỏ qua chỗ này thì trang tự mâu thuẫn ngay đoạn mở đầu: thân
   * bài mang con số mới, còn tóm tắt ngay trên nó vẫn là con số vừa bị bác.
   */
  summaryEdits?: Edit[];
  addSources?: NewSource[];
  dropSources?: { title: string; why: string }[];
  corrections?: string[];
  openQuestions?: string[];
};

/** Đếm số lần `needle` xuất hiện — phải bằng 1 thì phép thay mới an toàn. */
function occurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/** readingTime đúng theo cùng công thức mà gate dùng để kiểm. */
function readingTimeOf(content: string): number {
  const words = prose(content).trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

type Planned = {
  id: string;
  slug: string;
  oldTitle: string;
  oldContent: string;
  newContent: string;
  newSummary: string | null;
  readingTime: number;
  plan: Plan;
  dropIds: string[];
};

async function main() {
  const write = process.argv.includes("--write");

  console.log("=== ÁP ĐÍNH CHÍNH S1/S2 — đợt 17/09 ===");
  console.log(
    write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n",
  );

  const plans = readdirSync(FIXES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(FIXES, f), "utf8")) as Plan);

  let failures = 0;
  const planned: Planned[] = [];

  for (const plan of plans) {
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        readingTime: true,
        factCheck: true,
        sources: { select: { id: true, title: true } },
      },
    });
    if (!article) {
      console.error(`✗ ${plan.slug}: không thấy bài`);
      failures++;
      continue;
    }

    console.log(`${plan.slug}  [factCheck=${article.factCheck}]`);

    let content = article.content;
    for (const edit of plan.edits) {
      const hits = occurrences(content, edit.find);
      if (hits !== 1) {
        console.error(`   ✗ ${edit.claimId}: neo khớp ${hits} lần, cần đúng 1`);
        failures++;
        continue;
      }
      content = content.replace(edit.find, edit.replace);
      console.log(`   • ${edit.claimId} [${edit.severity}] ${edit.why.split(". ")[0]}`);
    }

    let summary = article.summary;
    for (const edit of plan.summaryEdits ?? []) {
      const hits = occurrences(summary, edit.find);
      if (hits !== 1) {
        console.error(`   ✗ summary ${edit.claimId}: neo khớp ${hits} lần, cần đúng 1`);
        failures++;
        continue;
      }
      summary = summary.replace(edit.find, edit.replace);
      console.log(`   • summary ${edit.claimId} [${edit.severity}]`);
    }

    const dropIds: string[] = [];
    for (const drop of plan.dropSources ?? []) {
      const row = article.sources.find((s) => s.title === drop.title);
      if (!row) {
        console.error(`   ✗ bỏ nguồn: không thấy hàng "${drop.title}"`);
        failures++;
        continue;
      }
      dropIds.push(row.id);
      console.log(`   − nguồn: ${drop.title.slice(0, 60)}`);
    }
    for (const add of plan.addSources ?? []) {
      console.log(`   + nguồn bậc ${add.tier}: ${add.title.slice(0, 60)}`);
    }

    const readingTime = readingTimeOf(content);
    if (readingTime !== article.readingTime) {
      console.log(`   readingTime ${article.readingTime} → ${readingTime}`);
    }
    console.log();

    planned.push({
      id: article.id,
      slug: plan.slug,
      oldTitle: article.title,
      oldContent: article.content,
      newContent: content,
      newSummary: summary === article.summary ? null : summary,
      readingTime,
      plan,
      dropIds,
    });
  }

  if (failures > 0) {
    console.error(`✗ ${failures} chỗ không áp được. KHÔNG ghi gì cả.`);
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log(`Sẵn sàng áp ${planned.length} bài. Chạy lại với --write để ghi.`);
    return;
  }

  for (const p of planned) {
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: p.id,
          title: p.oldTitle,
          content: p.oldContent,
          note: "Bản trước đính chính S1/S2 đợt 2026-09-17 — xem docs/content/corrections.md",
        },
      }),
      prisma.article.update({
        where: { id: p.id },
        data: {
          content: p.newContent,
          ...(p.newSummary === null ? {} : { summary: p.newSummary }),
          readingTime: p.readingTime,
          lastVerifiedAt: VERIFIED_AT,
        },
      }),
      ...(p.dropIds.length
        ? [prisma.source.deleteMany({ where: { id: { in: p.dropIds } } })]
        : []),
      ...(p.plan.addSources ?? []).map((s) =>
        prisma.source.create({
          data: {
            articleId: p.id,
            title: s.title,
            url: s.url || null,
            doi: s.doi || null,
            publisher: s.publisher || null,
            year: s.year ?? null,
            tier: s.tier,
            accessedAt: VERIFIED_AT,
          },
        }),
      ),
    ]);
    console.log(`✓ ${p.slug}`);
  }

  const log = [
    "",
    "## 2026-09-17 — đính chính S1/S2 sau đợt thẩm định 42 bài PENDING",
    "",
    "Thẩm định: `docs/content/checks/2026-09-17/`. Kế hoạch sửa ở `fixes/` cùng thư mục.",
    "Script: `scripts/apply-fixes-2026-09-17.ts` — chạy khô trước, dừng cả lượt nếu một",
    "neo khớp khác đúng một lần.",
    "",
    ...planned.flatMap((p) => [
      `### ${p.slug}`,
      "",
      ...(p.plan.corrections ?? []).map((line) => `- ${line}`),
      ...(p.plan.openQuestions ?? []).map((q) => `- **Còn nợ:** ${q}`),
      "",
    ]),
    "### Ghi chung",
    "",
    "`factCheck` giữ nguyên REVISE/FAILED: lượt này chỉ đóng S1/S2, mỗi bài còn nhiều",
    "phát hiện S3/S4 và vẫn dưới ngưỡng ba nguồn bậc 1–2. Mỗi bài có một `Revision`",
    "chụp bản trước, ghi trong cùng transaction với lệnh sửa.",
    "",
  ].join("\n");
  appendFileSync(CORRECTIONS, log, "utf8");

  console.log(`\nĐã ghi ${planned.length} bài, nhật ký nối vào docs/content/corrections.md.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
