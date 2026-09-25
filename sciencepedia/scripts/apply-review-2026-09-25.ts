import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

import { prose } from "./check-publish";

/**
 * Áp kết quả duyệt lại 6 bài factCheck = FAILED (đợt 25/09).
 *
 *   npx tsx --env-file-if-exists=.env scripts/apply-review-2026-09-25.ts          # in kế hoạch
 *   npx tsx --env-file-if-exists=.env scripts/apply-review-2026-09-25.ts --write  # thực thi
 *
 * Nguồn: `docs/content/checks/2026-09-25/<slug>.yaml` (verdict) và
 * `fixes/<slug>.json` (kế hoạch sửa), do `science-editor` soạn — mỗi claim có
 * evidence đã mở trong lượt. Script không tự nghĩ ra chữ nào.
 *
 * ## Khác gì `apply-fixes-2026-09-17.ts`
 *
 * 1. **Sửa cả `contentEn`/`summaryEn`.** Lượt 17/09 chỉ sửa bản vi, nên bản en
 *    vẫn mang claim đã bị bác. Hai bản song ngữ khẳng định hai điều khác nhau
 *    là lỗi accuracy, không phải lỗi dịch.
 * 2. **Đổi bậc nguồn** (`retierSources`) — bậc gắn sai là lý do hay gặp nhất
 *    khiến bài hụt ngưỡng ba nguồn bậc 1–2.
 * 3. **Đóng gate** khi verdict là `pass`: factCheck = PASSED, dấu duyệt của
 *    tài khoản tổ chức (docs/content-rules.md, "Byline người duyệt").
 *
 * ## Vì sao kiểm lại ngưỡng nguồn ngay trong script
 *
 * Verdict `pass` là phán quyết của editor; ngưỡng ≥3 nguồn bậc 1–2 là bất
 * biến của gate. Nếu sau khi áp kế hoạch bài vẫn hụt ngưỡng thì hai thứ đang
 * mâu thuẫn — đóng dấu lúc đó là để `publish:check` phát hiện ra sau, trên
 * một bài đã mang byline duyệt. Nên dừng cả lượt, như khi một neo không khớp.
 *
 * ## Revision cho bản en
 *
 * Bảng `Revision` chỉ có `title`/`content`. Thay vì thêm migration cho một
 * lượt sửa, bản en trước khi sửa được chụp thành một hàng Revision riêng,
 * phân biệt bằng `note`. Cả hai hàng ghi trong cùng transaction với lệnh sửa.
 *
 * ## Chỉ chạm bài đang FAILED
 *
 * Bài đã có người đổi trạng thái trong lúc duyệt thì quyết định của họ mới
 * hơn file YAML này.
 */
const prisma = new PrismaClient();

const VERIFIED_AT = new Date("2026-09-25T00:00:00Z");
const WORDS_PER_MINUTE = 200;
const MIN_STRONG_SOURCES = 3;
const STRONG_TIER = 2;

const DIR = join(__dirname, "..", "..", "docs", "content", "checks", "2026-09-25");
const FIXES = join(DIR, "fixes");
const CORRECTIONS = join(__dirname, "..", "..", "docs", "content", "corrections.md");

const TO_STATE = { pass: "PASSED", revise: "REVISE", reject: "FAILED" } as const;
type Verdict = keyof typeof TO_STATE;

type Edit = { claimId: string; severity: string; find: string; replace: string; why: string };
type NewSource = {
  title: string;
  url?: string;
  doi?: string;
  publisher?: string;
  year?: number;
  tier: number;
};
type Plan = {
  slug: string;
  edits?: Edit[];
  enEdits?: Edit[];
  summaryEdits?: Edit[];
  summaryEnEdits?: Edit[];
  /** seoDescription thường chép nguyên summary, nên mang cùng claim bị bác. */
  seoDescriptionEdits?: Edit[];
  /**
   * Tiêu đề khẳng định đúng điều nguồn bác thì là lỗi accuracy, không phải
   * chuyện câu chữ. Mỗi trường là một cặp find/replace, cùng luật neo.
   * Chỉ đổi chữ, KHÔNG đổi slug — đổi slug là quyết định riêng, cần 301.
   */
  titleEdits?: Partial<
    Record<"title" | "titleEn" | "seoTitle" | "seoDescription", { find: string; replace: string }>
  >;
  addSources?: NewSource[];
  dropSources?: { title: string; why: string }[];
  retierSources?: { title: string; tier: number; why: string }[];
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

function readingTimeOf(content: string): number {
  const words = prose(content).trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Chỉ cần khoá `verdict` cấp cao nhất — xem lý do không dùng js-yaml ở record-fact-check-2026-09-17.ts. */
function readVerdict(slug: string): Verdict | null {
  const file = join(DIR, `${slug}.yaml`);
  if (!existsSync(file)) return null;
  const verdict = /^verdict:\s*(\S+)\s*$/m.exec(readFileSync(file, "utf8"))?.[1];
  return verdict && verdict in TO_STATE ? (verdict as Verdict) : null;
}

async function main() {
  const write = process.argv.includes("--write");
  console.log("=== ÁP KẾT QUẢ DUYỆT LẠI — đợt 25/09 ===");
  console.log(write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  const reviewer = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true },
  });
  if (!reviewer) throw new Error("Không tìm thấy tài khoản ADMIN để làm reviewer");

  const plans = readdirSync(FIXES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(FIXES, f), "utf8")) as Plan);

  let failures = 0;
  const fail = (message: string) => {
    console.error(`   ✗ ${message}`);
    failures++;
  };
  const planned: {
    slug: string;
    verdict: Verdict;
    run: () => Promise<unknown>;
    plan: Plan;
  }[] = [];

  for (const plan of plans) {
    const verdict = readVerdict(plan.slug);
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: {
        id: true,
        title: true,
        titleEn: true,
        content: true,
        contentEn: true,
        summary: true,
        summaryEn: true,
        seoDescription: true,
        seoTitle: true,
        readingTime: true,
        factCheck: true,
        lastVerifiedAt: true,
        sources: { select: { id: true, title: true, tier: true, retractedAt: true } },
      },
    });
    console.log(`${plan.slug}  [${article?.factCheck} → ${verdict ? TO_STATE[verdict] : "?"}]`);
    if (!verdict) {
      fail("thiếu YAML hoặc verdict không hợp lệ");
      continue;
    }
    if (!article) {
      fail("không thấy bài");
      continue;
    }
    if (article.factCheck !== "FAILED") {
      // Script chạy theo đợt khi từng bài duyệt xong. Bài đã áp ở đợt trước
      // mang đúng trạng thái đích + ngày kiểm của lượt này: bỏ qua, không lỗi.
      if (
        article.factCheck === TO_STATE[verdict] &&
        article.lastVerifiedAt?.getTime() === VERIFIED_AT.getTime()
      ) {
        console.log("   = đã áp ở đợt trước, bỏ qua\n");
        if (write) logSection(plan.slug, verdict, plan);
        continue;
      }
      fail(`đang là ${article.factCheck}, không phải FAILED — có người đổi trong lúc duyệt`);
      continue;
    }

    const applyAll = (text: string | null, edits: Edit[] | undefined, label: string) => {
      if (!edits?.length) return text;
      if (text === null) {
        fail(`${label}: trường đang rỗng nhưng kế hoạch có ${edits.length} sửa`);
        return text;
      }
      let out = text;
      for (const edit of edits) {
        const hits = occurrences(out, edit.find);
        if (hits !== 1) {
          fail(`${label} ${edit.claimId}: neo khớp ${hits} lần, cần đúng 1`);
          continue;
        }
        out = out.replace(edit.find, edit.replace);
        console.log(`   • ${label} ${edit.claimId} [${edit.severity}]`);
      }
      return out;
    };

    const content = applyAll(article.content, plan.edits, "vi")!;
    const contentEn = applyAll(article.contentEn, plan.enEdits, "en");
    const summary = applyAll(article.summary, plan.summaryEdits, "summary");
    const summaryEn = applyAll(article.summaryEn, plan.summaryEnEdits, "summaryEn");
    const asEdit = (key: keyof NonNullable<Plan["titleEdits"]>): Edit[] | undefined => {
      const e = plan.titleEdits?.[key];
      return e ? [{ claimId: "tiêu đề", severity: "", why: "", ...e }] : undefined;
    };
    const title = applyAll(article.title, asEdit("title"), "title")!;
    const titleEn = applyAll(article.titleEn, asEdit("titleEn"), "titleEn");
    const seoTitle = applyAll(article.seoTitle, asEdit("seoTitle"), "seoTitle");
    const seoDescription = applyAll(
      applyAll(article.seoDescription, plan.seoDescriptionEdits, "seoDescription"),
      asEdit("seoDescription"),
      "seoDescription",
    );

    const dropIds: string[] = [];
    for (const drop of plan.dropSources ?? []) {
      const row = article.sources.find((s) => s.title === drop.title);
      if (!row) fail(`bỏ nguồn: không thấy "${drop.title}"`);
      else {
        dropIds.push(row.id);
        console.log(`   − nguồn: ${drop.title.slice(0, 70)}`);
      }
    }
    const retier: { id: string; tier: number }[] = [];
    for (const r of plan.retierSources ?? []) {
      const row = article.sources.find((s) => s.title === r.title);
      if (!row) fail(`đổi bậc: không thấy "${r.title}"`);
      else {
        retier.push({ id: row.id, tier: r.tier });
        console.log(`   ~ bậc ${row.tier}→${r.tier}: ${r.title.slice(0, 60)}`);
      }
    }
    for (const add of plan.addSources ?? []) {
      if (!add.url && !add.doi) fail(`nguồn thêm không có url lẫn doi: ${add.title}`);
      if (add.year != null && !Number.isInteger(add.year)) {
        console.log(`   ⚠ year "${add.year}" không phải số — ghi null: ${add.title.slice(0, 50)}`);
      }
      console.log(`   + nguồn bậc ${add.tier}: ${add.title.slice(0, 70)}`);
    }

    // Ngưỡng nguồn SAU khi áp kế hoạch — chỉ bắt buộc khi sắp đóng gate.
    const tierOf = new Map(retier.map((r) => [r.id, r.tier]));
    const strong =
      article.sources.filter(
        (s) => !dropIds.includes(s.id) && !s.retractedAt && (tierOf.get(s.id) ?? s.tier) <= STRONG_TIER,
      ).length + (plan.addSources ?? []).filter((s) => s.tier <= STRONG_TIER).length;
    console.log(`   nguồn bậc 1–2 sau sửa: ${strong}`);
    if (verdict === "pass" && strong < MIN_STRONG_SOURCES) {
      fail(`verdict pass nhưng chỉ ${strong}/${MIN_STRONG_SOURCES} nguồn bậc 1–2`);
    }

    const readingTime = readingTimeOf(content);
    const state = TO_STATE[verdict];
    const pass = verdict === "pass";
    console.log();

    planned.push({
      slug: plan.slug,
      verdict,
      plan,
      run: () =>
        prisma.$transaction([
          prisma.revision.create({
            data: {
              articleId: article.id,
              title: article.title,
              content: article.content,
              note: "Bản trước lượt duyệt lại 2026-09-25 — xem docs/content/corrections.md",
            },
          }),
          ...(contentEn !== article.contentEn && article.contentEn !== null
            ? [
                prisma.revision.create({
                  data: {
                    articleId: article.id,
                    title: article.titleEn ?? article.title,
                    content: article.contentEn,
                    note: "Bản EN (contentEn) trước lượt duyệt lại 2026-09-25",
                  },
                }),
              ]
            : []),
          prisma.article.update({
            where: { id: article.id },
            data: {
              title,
              titleEn,
              seoTitle,
              content,
              contentEn,
              summary: summary ?? article.summary,
              summaryEn,
              seoDescription,
              readingTime,
              factCheck: state,
              lastVerifiedAt: VERIFIED_AT,
              ...(pass ? { reviewedById: reviewer.id, reviewedAt: VERIFIED_AT } : {}),
            },
          }),
          ...(dropIds.length ? [prisma.source.deleteMany({ where: { id: { in: dropIds } } })] : []),
          ...retier.map((r) => prisma.source.update({ where: { id: r.id }, data: { tier: r.tier } })),
          ...(plan.addSources ?? []).map((s) =>
            prisma.source.create({
              data: {
                articleId: article.id,
                title: s.title,
                // Nguồn chỉ có doi thì dựng url doi.org: người đọc bấm được, isAlive() kiểm được.
                url: s.url || (s.doi ? `https://doi.org/${s.doi}` : null),
                doi: s.doi || null,
                publisher: s.publisher || null,
                // Trang web không có năm xuất bản thì để null — ngày truy cập đã ở accessedAt.
                year: Number.isInteger(s.year) ? s.year : null,
                tier: s.tier,
                accessedAt: VERIFIED_AT,
              },
            }),
          ),
        ]),
    });
  }

  if (failures > 0) {
    console.error(`✗ ${failures} chỗ không áp được. KHÔNG ghi gì cả.`);
    process.exitCode = 1;
    return;
  }
  if (planned.length === 0) {
    console.log("Không còn bài nào cần áp.");
    return;
  }
  if (!write) {
    console.log(`Sẵn sàng áp ${planned.length} bài. Người duyệt: ${reviewer.name}. Chạy lại với --write.`);
    return;
  }

  /* Nhật ký ghi SAU TỪNG transaction, không dồn cuối lượt: lượt chạy chết
     giữa chừng (đã xảy ra — một `year` kiểu chuỗi) thì bài đã ghi vẫn có
     dòng nhật ký, bài chưa ghi thì không. Nhật ký lệch khỏi CSDL là đúng
     loại lỗi mà lượt duyệt này đi dọn. */
  for (const p of planned) {
    await p.run();
    logSection(p.slug, p.verdict, p.plan);
    console.log(`✓ ${p.slug} → ${TO_STATE[p.verdict]}`);
  }
  console.log(`\nĐã ghi ${planned.length} bài, nhật ký ở docs/content/corrections.md.`);
}

const LOG_HEADER = "## 2026-09-25 — duyệt lại bài factCheck = FAILED";

function logged(slug: string): boolean {
  const text = readFileSync(CORRECTIONS, "utf8");
  const at = text.indexOf(LOG_HEADER);
  return at !== -1 && text.includes(`### ${slug} — `, at);
}

function logSection(slug: string, verdict: Verdict, plan: Plan) {
  if (logged(slug)) return;
  const head = readFileSync(CORRECTIONS, "utf8").includes(LOG_HEADER)
    ? []
    : [
        "",
        LOG_HEADER,
        "",
        "Thẩm định: `docs/content/checks/2026-09-25/`, kế hoạch sửa ở `fixes/` cùng thư mục.",
        "Script: `scripts/apply-review-2026-09-25.ts`. Sửa cả bản vi lẫn en; bản trước",
        "sửa của cả hai được chụp vào `Revision` trong cùng transaction.",
      ];
  appendFileSync(
    CORRECTIONS,
    [
      ...head,
      "",
      `### ${slug} — ${TO_STATE[verdict]}`,
      "",
      ...(plan.corrections ?? []).map((line) => `- ${line}`),
      ...(plan.openQuestions ?? []).map((q) => `- **Còn nợ:** ${q}`),
      "",
    ].join("\n"),
    "utf8",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
