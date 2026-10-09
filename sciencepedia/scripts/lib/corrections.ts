import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "../revalidate-site";

/**
 * Engine áp phiếu thẩm định (docs/content/checks/<ngày>/<slug>.md) lên bài đã đăng. Mỗi đợt
 * một script mỏng `scripts/apply-corrections-<ngày>.ts` gọi `runCorrections(PLANS)`; mỗi bài
 * một tệp kế hoạch trong `scripts/data/corrections-<đợt>/`, văn bản thay lấy NGUYÊN VĂN từ
 * mục D của phiếu. Quy trình: skill `.claude/skills/tham-dinh-bai-da-dang/`.
 *
 * Quy trình theo docs/content-rules.md, "Sửa bài đã publish là đính chính": Revision chụp bản
 * TRƯỚC (cả title) trong CÙNG transaction với lệnh sửa và lệnh thêm nguồn; lastVerifiedAt cập
 * nhật; readingTime tính lại theo nội dung mới. `factCheck` và byline duyệt GIỮ NGUYÊN — sửa
 * chuỗi không phải là qua gate, và agent không tự ký duyệt.
 *
 *   <lệnh>              # in kế hoạch, KHÔNG ghi gì
 *   <lệnh> --dump <dir> # in thêm bản sau sửa ra thư mục để đọc
 *   <lệnh> --write      # thực thi
 */
export type Field =
  | "title" | "summary" | "content" | "seoTitle" | "seoDescription" | "seoKeywords"
  | "titleEn" | "summaryEn" | "contentEn"
  | "coverImageCredit" | "coverImageCreditEn";

export type Fix =
  /** Thay đúng một chỗ khớp nguyên văn. */
  | { field: Field; find: string; replace: string; why: string }
  /**
   * Thay CẢ mục: từ dòng tiêu đề `section` (khớp nguyên dòng, đúng một lần) tới trước tiêu đề
   * cùng cấp hoặc cấp cao hơn kế tiếp (hoặc hết bài). Tiểu mục cấp sâu hơn nằm trong mục bị thay.
   * `replace: ""` là xoá mục.
   */
  | { field: "content" | "contentEn"; section: string; replace: string; why: string }
  /** Chèn một khối ngay TRƯỚC dòng tiêu đề `before` (khớp nguyên dòng, đúng một lần). */
  | { field: "content" | "contentEn"; before: string; insert: string; why: string };

export type SourceIn = {
  title: string;
  publisher: string;
  doi?: string;
  url?: string | null;
  year: number;
  tier: number;
};

export type Plan = {
  slug: string;
  /** Ghi chú Revision (bản TRƯỚC đính chính). */
  note: string;
  fixes: Fix[];
  /** Mục "Đọc thêm": [tiêu đề, slug] — bài phải đang PUBLISHED. */
  reading: readonly (readonly [string, string])[];
  sources: SourceIn[];
  /** Chuỗi không được còn ở bất kỳ trường nào sau khi sửa. */
  forbid?: string[];
  /** Mặc định KHÔNG: bài giữ PUBLISHED trong lúc sửa — chỉ đặt khi chủ sản phẩm bảo rõ. */
  toDraft?: boolean;
  /** Hẹn thẩm định lại sau N tháng (reverifyDueAt), nếu phiếu đề nghị. */
  reverifyMonths?: number;
  /**
   * Link nội bộ `/articles/<slug>` có trong bản cũ mà bản mới được phép bỏ. Mặc định mọi link
   * phải còn: viết lại cả mục dễ xoá mất link vào DUY NHẤT của một bài khác (gate publish đếm
   * link vào) — đã suýt xảy ra với bài bất tử 09/10.
   */
  dropLinks?: string[];
  /**
   * Gỡ byline duyệt và đưa factCheck về PENDING trong cùng transaction — dùng khi bài đang mang
   * byline cho bản CŨ mà đính chính đổi claim: byline không được đứng trên nội dung chưa ai đọc.
   * Gỡ không phải ký; ký lại vẫn do người chạy scripts/pass-factcheck-*.ts.
   */
  clearReview?: boolean;
  /**
   * Sửa đi kèm không đổi claim (link text, thống nhất thuật ngữ): không cập nhật lastVerifiedAt,
   * vì bài không được thẩm định lại — chỉ được sửa chữ.
   */
  minor?: boolean;
};

const FIELDS: Field[] = [
  "title", "summary", "content", "seoTitle", "seoDescription", "seoKeywords",
  "titleEn", "summaryEn", "contentEn", "coverImageCredit", "coverImageCreditEn",
];

const INTERNAL_LINK = /\/articles\/([a-z0-9-]+)/g;
const linksOf = (text: string) => new Set([...text.matchAll(INTERNAL_LINK)].map((m) => m[1]));

function sourceUrl(s: SourceIn): string | null {
  if (s.url !== undefined) return s.url;
  return s.doi ? `https://doi.org/${s.doi}` : null;
}

const level = (heading: string) => /^(#+) /.exec(heading)?.[1].length ?? 0;
const hasLine = (text: string, heading: string) => text.split("\n").some((l) => l.trimEnd() === heading);

/** Vị trí dòng tiêu đề khớp nguyên dòng; ném lỗi nếu không đúng một chỗ. */
function headingAt(text: string, heading: string, ctx: string): number {
  const hits: number[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    if (line.trimEnd() === heading) hits.push(offset);
    offset += line.length + 1;
  }
  if (hits.length !== 1) throw new Error(`[${ctx}] tiêu đề "${heading}" khớp ${hits.length} chỗ, cần đúng 1`);
  return hits[0];
}

/** Áp một fix; trả null nếu đã áp từ trước. */
export function applyFix(text: string, fix: Fix, ctx: string): string | null {
  if ("find" in fix) {
    if (!text.includes(fix.find) && text.includes(fix.replace)) return null;
    const count = text.split(fix.find).length - 1;
    if (count !== 1) throw new Error(`[${ctx}] cụm cần sửa khớp ${count} chỗ, cần đúng 1: ${fix.find.slice(0, 80)}`);
    return text.replace(fix.find, () => fix.replace);
  }
  if ("section" in fix) {
    if (!hasLine(text, fix.section) && (!fix.replace || text.includes(fix.replace.trim()))) return null;
    const start = headingAt(text, fix.section, ctx);
    const rest = text.slice(start + fix.section.length);
    const next = new RegExp(`\\n#{1,${level(fix.section)}} `).exec(rest);
    const end = next ? start + fix.section.length + next.index + 1 : text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    if (!fix.replace) return `${before.replace(/\n+$/, "\n\n")}${after}`.replace(/\n{3,}/g, "\n\n");
    return `${before}${fix.replace.trim()}\n\n${after}`.replace(/\n{3,}/g, "\n\n");
  }
  if (text.includes(fix.insert.trim())) return null;
  const at = headingAt(text, fix.before, ctx);
  return `${text.slice(0, at)}${fix.insert.trim()}\n\n${text.slice(at)}`;
}

function describe(fix: Fix): string {
  if ("find" in fix) return `thay: ${fix.find.slice(0, 100).replace(/\n/g, " ⏎ ")}`;
  if ("section" in fix) return fix.replace ? `thay mục: ${fix.section}` : `xoá mục: ${fix.section}`;
  return `chèn trước: ${fix.before}`;
}

// Cùng công thức với scripts/check-publish.ts (`prose`, `countWords`, WORDS_PER_MINUTE) — không
// import vì check-publish chạy main() khi được nạp.
const PROVENANCE = /\b(?:Nguồn|Source|Bản quyền|Trang chủ|viết lại từ)\b/i;
function prose(markdown: string): string {
  const cut = markdown.lastIndexOf("\n---");
  if (cut === -1) return markdown;
  const tail = markdown.slice(cut);
  if (!/^\n-{3,}[ \t]*\n/.test(tail)) return markdown;
  if (tail.length > 1_000) return markdown;
  return PROVENANCE.test(tail) ? markdown.slice(0, cut).trimEnd() : markdown;
}
export const readingTimeOf = (content: string) => Math.max(1, Math.round(prose(content).trim().split(/\s+/).length / 200));

export async function runCorrections(plans: Plan[]): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await run(prisma, plans);
  } finally {
    await prisma.$disconnect();
  }
}

async function run(prisma: PrismaClient, plans: Plan[]) {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const now = new Date();

  // Mọi bài trong "Đọc thêm" phải đang PUBLISHED — không link bài DRAFT, kể cả bài trong loạt này.
  const drafting = new Set(plans.filter((p) => p.toDraft).map((p) => p.slug));
  const readingSlugs = plans.flatMap((p) => p.reading.map(([, s]) => s));
  const self = readingSlugs.filter((s) => drafting.has(s));
  if (self.length) throw new Error(`"Đọc thêm" trỏ bài sắp về DRAFT trong chính loạt này: ${self.join(", ")}`);
  const live = new Set(
    (await prisma.article.findMany({ where: { slug: { in: readingSlugs }, status: "PUBLISHED" }, select: { slug: true } })).map((r) => r.slug),
  );
  const dead = readingSlugs.filter((s) => !live.has(s));
  if (dead.length) throw new Error(`"Đọc thêm" trỏ bài chưa PUBLISHED: ${dead.join(", ")}`);

  const jobs = [];
  for (const plan of plans) {
    console.log(`\n══════ ${plan.slug}`);
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: plan.slug },
      select: {
        id: true, title: true, summary: true, content: true, seoTitle: true, seoDescription: true,
        seoKeywords: true, titleEn: true, summaryEn: true, contentEn: true,
        coverImageCredit: true, coverImageCreditEn: true, readingTime: true, factCheck: true, status: true,
      },
    });
    const next: Record<Field, string> = {
      title: a.title,
      summary: a.summary,
      content: a.content.replace(/\r\n/g, "\n"),
      seoTitle: a.seoTitle ?? "",
      seoDescription: a.seoDescription ?? "",
      seoKeywords: a.seoKeywords ?? "",
      titleEn: a.titleEn ?? "",
      summaryEn: a.summaryEn ?? "",
      contentEn: (a.contentEn ?? "").replace(/\r\n/g, "\n"),
      coverImageCredit: a.coverImageCredit ?? "",
      coverImageCreditEn: a.coverImageCreditEn ?? "",
    };

    let applied = 0;
    for (const fix of plan.fixes) {
      const out = applyFix(next[fix.field], fix, `${plan.slug} · ${fix.field}`);
      if (out === null) {
        console.log(`· đã sửa từ trước: [${fix.field}] ${describe(fix)}`);
        continue;
      }
      next[fix.field] = out;
      applied++;
      console.log(`\n[${fix.field}] ${describe(fix)}`);
      console.log(`        vì : ${fix.why}`);
    }

    for (const word of plan.forbid ?? []) {
      const left = FIELDS.filter((f) => next[f].includes(word));
      if (left.length) throw new Error(`[${plan.slug}] vẫn còn "${word}" ở: ${left.join(", ")}`);
    }

    for (const f of ["content", "contentEn"] as const) {
      const lost = [...linksOf(f === "content" ? a.content : (a.contentEn ?? ""))].filter(
        (s) => !linksOf(next[f]).has(s) && !(plan.dropLinks ?? []).includes(s),
      );
      if (lost.length) throw new Error(`[${plan.slug}] ${f} mất link nội bộ: ${lost.join(", ")} — giữ lại, hoặc ghi vào dropLinks nếu cố ý`);
    }

    if (plan.reading.length && !/^## Đọc thêm/m.test(next.content)) {
      next.content = `${next.content.replace(/\s+$/, "")}\n\n## Đọc thêm\n\n${plan.reading.map(([t, s]) => `- [${t}](/articles/${s})`).join("\n")}\n`;
      console.log(`\n+ mục "Đọc thêm": ${plan.reading.map(([, s]) => s).join(", ")}`);
    }

    console.log(`\nMục sau khi sửa: ${next.content.split("\n").filter((l) => /^##+ /.test(l)).join(" · ")}`);

    const have = await prisma.source.findMany({ where: { articleId: a.id }, select: { url: true, title: true, tier: true, retractedAt: true } });
    const haveUrl = new Set(have.map((s) => s.url).filter(Boolean));
    const haveTitle = new Set(have.map((s) => s.title));
    const add = plan.sources.filter((s) => {
      const url = sourceUrl(s);
      return url ? !haveUrl.has(url) : !haveTitle.has(s.title);
    });
    // Đếm cả nguồn bậc 1–2 đã có (còn hiệu lực) — bài đã có nguồn chỉ cần sửa chữ thì không phải khai lại.
    const tier12 = have.filter((s) => s.tier <= 2 && !s.retractedAt).length + add.filter((s) => s.tier <= 2).length;
    if (tier12 < 3) throw new Error(`[${plan.slug}] chỉ ${tier12} nguồn bậc 1–2, cần ≥ 3`);
    const draft = plan.toDraft && a.status !== "DRAFT";
    const readingTime = readingTimeOf(next.content);
    console.log(
      `\nfix áp: ${applied}/${plan.fixes.length} · nguồn thêm: ${add.length}/${plan.sources.length} (bậc 1–2: ${tier12})` +
        ` · readingTime ${a.readingTime} → ${readingTime} · factCheck ${a.factCheck}${plan.clearReview ? " → PENDING, GỠ byline" : " — GIỮ NGUYÊN"} · status ${a.status}${draft ? " → DRAFT" : " — giữ"}`,
    );

    const orNull = (old: string | null, value: string) => (old === null && value === "" ? null : value);
    const data = {
      title: next.title,
      summary: next.summary,
      content: next.content,
      seoTitle: orNull(a.seoTitle, next.seoTitle),
      seoDescription: orNull(a.seoDescription, next.seoDescription),
      seoKeywords: orNull(a.seoKeywords, next.seoKeywords),
      titleEn: orNull(a.titleEn, next.titleEn),
      summaryEn: orNull(a.summaryEn, next.summaryEn),
      contentEn: orNull(a.contentEn, next.contentEn),
      coverImageCredit: orNull(a.coverImageCredit, next.coverImageCredit),
      coverImageCreditEn: orNull(a.coverImageCreditEn, next.coverImageCreditEn),
      readingTime,
      ...(plan.minor ? {} : { lastVerifiedAt: now }),
      ...(plan.reverifyMonths ? { reverifyDueAt: new Date(new Date(now).setMonth(now.getMonth() + plan.reverifyMonths)) } : {}),
      ...(draft ? { status: "DRAFT" as const } : {}),
      ...(plan.clearReview ? { factCheck: "PENDING" as const, reviewedById: null, reviewedAt: null } : {}),
    };
    jobs.push({ plan, a, data, add, draft });
  }

  if (argv.includes("--dump")) {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const dir = argv[argv.indexOf("--dump") + 1];
    mkdirSync(dir, { recursive: true });
    for (const { plan, data } of jobs) {
      writeFileSync(
        `${dir}/${plan.slug}.md`,
        `# ${data.title}\n\n> ${data.summary}\n\nseoTitle: ${data.seoTitle}\nseoDescription: ${data.seoDescription}\ncoverImageCredit: ${data.coverImageCredit}\n\n---\n\n${data.content}` +
          (data.contentEn ? `\n\n=== EN ===\n\n# ${data.titleEn}\n\n> ${data.summaryEn}\n\n${data.contentEn}` : ""),
      );
    }
    console.log(`\nĐã in bản sau sửa ra ${dir}`);
  }

  if (!write) {
    console.log(`\n══════ TỔNG: ${jobs.length} bài · ${jobs.reduce((n, j) => n + j.plan.fixes.length, 0)} fix · ${jobs.reduce((n, j) => n + j.add.length, 0)} nguồn thêm · về DRAFT: ${jobs.filter((j) => j.draft).map((j) => j.plan.slug).join(", ") || "không"}`);
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  // Mỗi bài một transaction: Revision (bản trước, cả title) + update + nguồn.
  for (const { plan, a, data, add, draft } of jobs) {
    await prisma.$transaction([
      prisma.revision.create({
        data: { articleId: a.id, title: a.title, content: a.content, note: draft ? `${plan.note}. Trạng thái trước: ${a.status} → DRAFT.` : plan.note },
      }),
      prisma.article.update({ where: { id: a.id }, data }),
      ...add.map((s) =>
        prisma.source.create({
          data: { articleId: a.id, title: s.title, publisher: s.publisher, url: sourceUrl(s), doi: s.doi ?? null, year: s.year, tier: s.tier, accessedAt: now },
        }),
      ),
    ]);
    console.log(`ĐÃ GHI ${plan.slug}${draft ? " (→ DRAFT)" : ""}`);
  }
  await revalidateSite(plans.map((p) => p.slug));
  console.log("\nĐÃ GHI (revision + nội dung + nguồn, mỗi bài một transaction). factCheck vẫn giữ — người duyệt đặt sau khi đọc bản đã sửa.");
  if (jobs.some((j) => j.draft)) console.log("Bài về DRAFT cần ra khỏi chỉ mục tìm kiếm: npm run search:reindex");
}
