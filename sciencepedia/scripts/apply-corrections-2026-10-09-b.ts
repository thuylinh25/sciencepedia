import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";
import { BAT_TU } from "./data/corrections-1009b/bat-tu";
import { DAU_DAU } from "./data/corrections-1009b/dau-dau";
import { GROUNDING } from "./data/corrections-1009b/grounding";
import { SARCOPENIA } from "./data/corrections-1009b/sarcopenia";
import type { Field, Fix, Plan, SourceIn } from "./data/corrections-1009b/types";

/**
 * Đính chính 4 bài đăng qua form /admin ngày 2026-10-08 với 0 nguồn và factCheck PENDING, theo
 * phiếu thẩm định docs/content/checks/2026-10-08/<slug>.md (mục D, nguyên văn):
 *
 *   - bi-an-giai-phau-vi-sao-bo-nao-…   cơ chế migraine / đau đầu kiểu căng thẳng viết như đã
 *                                        rõ; mục tiến hoá không nguồn; thiếu "Khi nào nên đi khám".
 *   - cai-gia-cua-su-bat-tu-…            luận điểm "già và chết giúp loài tiến hoá" (Weismann) đã
 *                                        bị bác; bỏ bằng chứng Hydra không lão hoá.
 *   - chung-teo-co-do-tuoi-tac-…         khuyên tăng đạm mà bỏ ngoại lệ bệnh thận; gọi sarcopenia
 *                                        là lão hoá bình thường trong khi nó là bệnh có ngưỡng.
 *   - grounding-tiep-dia-…               bỏ xung đột lợi ích của nhóm tác giả; lời khuyên cho người
 *                                        đái tháo đường nhẹ hơn khuyến cáo CDC.
 *
 *   npm run corrections:1009b              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009b -- --write   # thực thi — NGƯỜI chạy
 *
 * Quyết định của chủ sản phẩm (2026-10-09):
 *   1. Đưa về DRAFT trong cùng transaction (`toDraft`) ba bài phiếu khuyến nghị: đau đầu, bất tử,
 *      sarcopenia. Bài grounding giữ PUBLISHED: phiếu chỉ đòi DRAFT nếu lời khuyên cho người đái
 *      tháo đường không sửa được trong 48 giờ, mà bản sửa đi cùng lượt ghi này.
 *   2. Grounding dùng "tiếp địa" làm tên gọi (như phiếu D giữ).
 *   3. Bài đau đầu giữ danh mục Sinh học (không có khung lưu ý y tế) — mục "Khi nào nên đi khám"
 *      trong thân bài là chỗ duy nhất có dấu hiệu cần đi khám.
 *   4. Ảnh bìa (giấy phép, alt grounding): chủ sản phẩm đã xác nhận — script không đụng ảnh.
 *
 * Chưa chốt, script KHÔNG đổi: tên Việt cho sarcopenia (tiêu đề giữ chữ "teo cơ" như cũ, chỉ
 * viết hoa kiểu câu) và tên Việt cho các thuyết lão hoá (giữ cách phiếu D viết: tên Việt tạm kèm
 * tên Anh in nghiêng lần đầu).
 *
 * Quy trình theo docs/content-rules.md, "Sửa bài đã publish là đính chính": mục trong
 * docs/content/corrections.md, Revision chụp bản TRƯỚC (cả title) trong CÙNG transaction với
 * lệnh sửa và lệnh thêm nguồn, lastVerifiedAt cập nhật. Bốn bài chưa có bản en nên chỉ sửa vi.
 *
 * `factCheck` GIỮ NGUYÊN: sửa chuỗi không phải là qua gate — người duyệt đặt sau khi đọc bản
 * đã sửa. Sau --write: bài về DRAFT phải ra khỏi chỉ mục tìm kiếm — `npm run search:reindex`.
 */
const prisma = new PrismaClient();

const PLANS: Plan[] = [DAU_DAU, BAT_TU, SARCOPENIA, GROUNDING];

const FIELDS: Field[] = ["title", "summary", "content", "seoTitle", "seoDescription"];

function sourceUrl(s: SourceIn): string | null {
  if (s.url !== undefined) return s.url;
  return s.doi ? `https://doi.org/${s.doi}` : null;
}

const level = (heading: string) => /^(#+) /.exec(heading)?.[1].length ?? 0;

/** Vị trí dòng tiêu đề khớp nguyên dòng; ném lỗi nếu không đúng một chỗ. */
function headingAt(text: string, heading: string, ctx: string): number {
  const lines = text.split("\n");
  const hits: number[] = [];
  let offset = 0;
  for (const line of lines) {
    if (line.trimEnd() === heading) hits.push(offset);
    offset += line.length + 1;
  }
  if (hits.length !== 1) throw new Error(`[${ctx}] tiêu đề "${heading}" khớp ${hits.length} chỗ, cần đúng 1`);
  return hits[0];
}

/** Áp một fix; trả null nếu đã áp từ trước. */
function apply(text: string, fix: Fix, ctx: string): string | null {
  if ("find" in fix) {
    if (!text.includes(fix.find) && text.includes(fix.replace)) return null;
    const count = text.split(fix.find).length - 1;
    if (count !== 1) throw new Error(`[${ctx}] cụm cần sửa khớp ${count} chỗ, cần đúng 1: ${fix.find.slice(0, 80)}`);
    return text.replace(fix.find, () => fix.replace);
  }
  if ("section" in fix) {
    if (!text.split("\n").some((l) => l.trimEnd() === fix.section) && fix.replace && text.includes(fix.replace)) return null;
    if (!fix.replace && !text.split("\n").some((l) => l.trimEnd() === fix.section)) return null;
    const start = headingAt(text, fix.section, ctx);
    const lv = level(fix.section);
    const rest = text.slice(start + fix.section.length);
    const next = new RegExp(`\\n#{1,${lv}} `).exec(rest);
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

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const now = new Date();

  // Mọi bài trong "Đọc thêm" phải đang PUBLISHED — không link bài DRAFT, kể cả bài trong loạt này.
  const own = new Set(PLANS.map((p) => p.slug));
  const readingSlugs = PLANS.flatMap((p) => p.reading.map(([, s]) => s));
  const self = readingSlugs.filter((s) => own.has(s));
  if (self.length) throw new Error(`"Đọc thêm" trỏ bài trong chính loạt đính chính: ${self.join(", ")}`);
  const live = new Set(
    (await prisma.article.findMany({ where: { slug: { in: readingSlugs }, status: "PUBLISHED" }, select: { slug: true } })).map((r) => r.slug),
  );
  const dead = readingSlugs.filter((s) => !live.has(s));
  if (dead.length) throw new Error(`"Đọc thêm" trỏ bài chưa PUBLISHED: ${dead.join(", ")}`);

  const jobs = [];
  for (const plan of PLANS) {
    console.log(`\n══════ ${plan.slug}`);
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: plan.slug },
      select: { id: true, title: true, summary: true, content: true, seoTitle: true, seoDescription: true, factCheck: true, status: true },
    });
    const next: Record<Field, string> = {
      title: a.title,
      summary: a.summary,
      content: a.content.replace(/\r\n/g, "\n"),
      seoTitle: a.seoTitle ?? "",
      seoDescription: a.seoDescription ?? "",
    };

    let applied = 0;
    for (const fix of plan.fixes) {
      const out = apply(next[fix.field], fix, `${plan.slug} · ${fix.field}`);
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

    if (!/^## Đọc thêm/m.test(next.content)) {
      next.content = `${next.content.replace(/\s+$/, "")}\n\n## Đọc thêm\n\n${plan.reading.map(([t, s]) => `- [${t}](/articles/${s})`).join("\n")}\n`;
      console.log(`\n+ mục "Đọc thêm": ${plan.reading.map(([, s]) => s).join(", ")}`);
    }

    console.log(`\nMục sau khi sửa: ${next.content.split("\n").filter((l) => /^##+ /.test(l)).join(" · ")}`);

    const have = await prisma.source.findMany({ where: { articleId: a.id }, select: { url: true, title: true } });
    const haveUrl = new Set(have.map((s) => s.url).filter(Boolean));
    const haveTitle = new Set(have.map((s) => s.title));
    const add = plan.sources.filter((s) => {
      const url = sourceUrl(s);
      return url ? !haveUrl.has(url) : !haveTitle.has(s.title);
    });
    const tier12 = plan.sources.filter((s) => s.tier <= 2).length;
    if (tier12 < 3) throw new Error(`[${plan.slug}] chỉ ${tier12} nguồn bậc 1–2, cần ≥ 3`);
    const draft = plan.toDraft && a.status !== "DRAFT";
    console.log(
      `\nfix áp: ${applied}/${plan.fixes.length} · nguồn thêm: ${add.length}/${plan.sources.length} (bậc 1–2: ${tier12})` +
        ` · factCheck ${a.factCheck} — GIỮ NGUYÊN · status ${a.status}${draft ? " → DRAFT" : " — giữ"}`,
    );

    const data = {
      title: next.title,
      summary: next.summary,
      content: next.content,
      seoTitle: a.seoTitle === null && next.seoTitle === "" ? null : next.seoTitle,
      seoDescription: a.seoDescription === null && next.seoDescription === "" ? null : next.seoDescription,
      lastVerifiedAt: now,
      ...(draft ? { status: "DRAFT" as const } : {}),
    };
    jobs.push({ plan, a, data, add, draft });
  }

  if (process.argv.includes("--dump")) {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const dir = process.argv[process.argv.indexOf("--dump") + 1];
    mkdirSync(dir, { recursive: true });
    for (const { plan, data } of jobs) {
      writeFileSync(`${dir}/${plan.slug}.md`, `# ${data.title}\n\n> ${data.summary}\n\nseoTitle: ${data.seoTitle}\nseoDescription: ${data.seoDescription}\n\n---\n\n${data.content}`);
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
  await revalidateSite(PLANS.map((p) => p.slug));
  console.log("\nĐÃ GHI (revision + nội dung + nguồn, mỗi bài một transaction). factCheck vẫn giữ — người duyệt đặt sau khi đọc bản đã sửa.");
  console.log("Bài về DRAFT cần ra khỏi chỉ mục tìm kiếm: npm run search:reindex");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
