import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Đưa bản en về cùng claim với bản vi (đợt 25/09).
 *
 *   npx tsx --env-file-if-exists=.env scripts/apply-en-parity-2026-09-25.ts          # in kế hoạch
 *   npx tsx --env-file-if-exists=.env scripts/apply-en-parity-2026-09-25.ts --write  # thực thi
 *
 * Kế hoạch: `docs/content/checks/2026-09-25/en-parity/<slug>.json` (+ `<slug>.en.md`
 * khi dịch lại cả bài), do `science-editor` soạn khi đối chiếu song ngữ.
 *
 * ## Vì sao có lượt này
 *
 * Các lượt đính chính 11/09 và 17/09 chỉ sửa `content`. Duyệt lại 6 bài FAILED
 * hôm nay thấy bản en của 5 bài còn nguyên claim đã bị bác (docs/content-rules.md,
 * "Đính chính chỉ xong khi CẢ HAI bản ngôn ngữ đã đổi"). Lượt này rà các bài
 * còn lại mà phép so tập con số / độ dài vi–en cho thấy lệch.
 *
 * ## Chỉ chạm bản en
 *
 * Bản vi là bản đã được sửa, là chuẩn. Chỗ nào editor thấy vi sai thì nằm ở
 * `openQuestions`, đi qua lượt đính chính riêng — không sửa lén ở đây.
 *
 * ## Vì sao KHÔNG đụng factCheck / reviewedById
 *
 * Lượt này không phán lại bài; nó sửa bản dịch cho khớp bản đã phán. Dấu duyệt
 * của bài PASSED vẫn đúng về điều nó bảo chứng: các claim của bản vi. Trước
 * lượt này, chính dấu ấy đang nằm trên một bản en nói khác — tức sai hơn.
 *
 * ## Dịch lại cả bài thì link nội bộ phải trùng bản vi
 *
 * Link nội bộ là thứ gate SEO đếm và knowledge graph suy ra. Một bản dịch lại
 * làm rơi link là lỗi cấu trúc im lặng, nên tập slug được link ở bản en mới
 * phải bằng đúng tập ở bản vi — lệch thì dừng cả lượt.
 */
const prisma = new PrismaClient();

const DIR = join(__dirname, "..", "..", "docs", "content", "checks", "2026-09-25", "en-parity");
const CORRECTIONS = join(__dirname, "..", "..", "docs", "content", "corrections.md");
const LOG_HEADER = "## 2026-09-25 — đồng bộ bản en với bản vi đã đính chính";
const INTERNAL_LINK = /\]\(\/(?:[a-z]{2}\/)?articles\/([a-z0-9-]+)\)/gi;

type Edit = { id?: string; find: string; replace: string; why?: string };
type Plan = {
  slug: string;
  verdict: "in-sync" | "fix";
  enEdits?: Edit[];
  contentEnFile?: string;
  summaryEnEdits?: Edit[];
  titleEnEdit?: Edit;
  corrections?: string[];
  openQuestions?: string[];
};

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

const linksOf = (md: string) => new Set([...md.matchAll(INTERNAL_LINK)].map((m) => m[1]));

function logged(slug: string): boolean {
  const text = readFileSync(CORRECTIONS, "utf8");
  const at = text.indexOf(LOG_HEADER);
  return at !== -1 && text.includes(`### ${slug}`, at);
}

function logSection(plan: Plan) {
  const head = readFileSync(CORRECTIONS, "utf8").includes(LOG_HEADER)
    ? []
    : [
        "",
        LOG_HEADER,
        "",
        "Đối chiếu: `docs/content/checks/2026-09-25/en-parity/`. Script:",
        "`scripts/apply-en-parity-2026-09-25.ts` — chỉ sửa contentEn/summaryEn/titleEn;",
        "bản en trước khi sửa được chụp vào `Revision` trong cùng transaction.",
      ];
  appendFileSync(
    CORRECTIONS,
    [
      ...head,
      "",
      `### ${plan.slug}`,
      "",
      ...(plan.corrections ?? []).map((line) => `- ${line}`),
      ...(plan.openQuestions ?? []).map((q) => `- **Còn nợ:** ${q}`),
      "",
    ].join("\n"),
    "utf8",
  );
}

async function main() {
  const write = process.argv.includes("--write");
  console.log("=== ĐỒNG BỘ BẢN EN — đợt 25/09 ===");
  console.log(write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  const plans = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as Plan);

  let failures = 0;
  const fail = (m: string) => {
    console.error(`   ✗ ${m}`);
    failures++;
  };
  const planned: { plan: Plan; run: () => Promise<unknown> }[] = [];

  for (const plan of plans) {
    if (plan.verdict !== "fix") {
      console.log(`${plan.slug}  [in-sync]\n`);
      continue;
    }
    console.log(plan.slug);
    if (logged(plan.slug)) {
      console.log("   = đã áp ở đợt trước, bỏ qua\n");
      continue;
    }
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: { id: true, title: true, titleEn: true, content: true, contentEn: true, summaryEn: true },
    });
    if (!article) {
      fail("không thấy bài");
      continue;
    }
    if (article.contentEn === null) {
      fail("contentEn rỗng");
      continue;
    }

    const apply = (text: string | null, edits: Edit[] | undefined, label: string) => {
      if (!edits?.length) return text;
      if (text === null) {
        fail(`${label}: trường rỗng`);
        return text;
      }
      let out = text;
      for (const e of edits) {
        const hits = occurrences(out, e.find);
        if (hits !== 1) {
          fail(`${label} ${e.id ?? ""}: neo khớp ${hits} lần, cần đúng 1`);
          continue;
        }
        out = out.replace(e.find, e.replace);
        console.log(`   • ${label} ${e.id ?? ""}`);
      }
      return out;
    };

    let contentEn: string = article.contentEn;
    if (plan.contentEnFile) {
      if (plan.enEdits?.length) fail("có cả contentEnFile lẫn enEdits — chọn một");
      // Tên file tính theo thư mục kế hoạch — có kế hoạch ghi kèm đường dẫn repo.
      const file = join(DIR, basename(plan.contentEnFile));
      if (!existsSync(file)) {
        fail(`không thấy ${plan.contentEnFile}`);
        continue;
      }
      contentEn = readFileSync(file, "utf8").trim();
      console.log(`   • dịch lại cả bài (${article.contentEn.length} → ${contentEn.length} ký tự)`);
    } else {
      contentEn = apply(contentEn, plan.enEdits, "en")!;
    }

    const vi = linksOf(article.content);
    const en = linksOf(contentEn);
    const lost = [...vi].filter((s) => !en.has(s));
    const extra = [...en].filter((s) => !vi.has(s));
    if (plan.contentEnFile && (lost.length || extra.length)) {
      fail(`link nội bộ lệch bản vi — thiếu [${lost.join(", ")}], thừa [${extra.join(", ")}]`);
    } else if (lost.length || extra.length) {
      console.log(`   ⚠ link lệch bản vi (có từ trước): thiếu ${lost.length}, thừa ${extra.length}`);
    }

    const summaryEn = apply(article.summaryEn, plan.summaryEnEdits, "summaryEn");
    const titleEn = apply(article.titleEn, plan.titleEnEdit ? [plan.titleEnEdit] : undefined, "titleEn");
    console.log();

    planned.push({
      plan,
      run: () =>
        prisma.$transaction([
          prisma.revision.create({
            data: {
              articleId: article.id,
              title: article.titleEn ?? article.title,
              content: article.contentEn!,
              note: "Bản EN (contentEn) trước lượt đồng bộ song ngữ 2026-09-25",
            },
          }),
          prisma.article.update({
            where: { id: article.id },
            data: { contentEn, summaryEn, titleEn },
          }),
        ]),
    });
  }

  if (failures > 0) {
    console.error(`✗ ${failures} chỗ không áp được. KHÔNG ghi gì cả.`);
    process.exitCode = 1;
    return;
  }
  if (!write) {
    console.log(`Sẵn sàng áp ${planned.length} bài. Chạy lại với --write.`);
    return;
  }
  // Nhật ký sau từng transaction — cùng lý do như apply-review-2026-09-25.ts.
  for (const p of planned) {
    await p.run();
    logSection(p.plan);
    console.log(`✓ ${p.plan.slug}`);
  }
  console.log(`\nĐã ghi ${planned.length} bài.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
