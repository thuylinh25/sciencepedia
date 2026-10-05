import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

import { Editorial, Topic } from "../src/lib/spine/schema";

/**
 * Bước 10 cho các bài "Tác động cột sống": topic + bản nháp → bảng Article, ở
 * trạng thái DRAFT.
 *
 *   npm run spine:import              # in kế hoạch, không ghi
 *   npm run spine:import -- --write   # ghi (upsert, chạy lại được)
 *
 * KHÔNG đặt PUBLISHED, KHÔNG đặt factCheck = PASSED, KHÔNG ghi reviewedById:
 * xuất bản chỉ qua `npm run publish` (gate trong scripts/publish.ts), và byline
 * duyệt do người ghi — agent không tự ký (CLAUDE.md, docs/content-rules.md).
 *
 * Từ chối bài có review.transcription / mapping / editor chưa `passed`.
 */

const prisma = new PrismaClient();
const ADMIN_ID = "cmti8v05z0000k5ccfg55mget"; // Ban biên tập Sciencepedia
const ROOT = path.join(process.cwd(), "content/tac-dong-cot-song");
const DRAFTS = path.join(process.cwd(), "../docs/content/drafts");

const CATEGORY = {
  slug: "tac-dong-cot-song",
  name: "Tác động cột sống",
  nameEn: "Spinal Impact method",
  description:
    "Tư liệu lưu trữ tài liệu Phương pháp Tác động Cột sống Việt Nam, trích nguyên văn có trang, đặt cạnh kiến thức y khoa có nguồn. Không thay thế chẩn đoán hay điều trị.",
  descriptionEn:
    "Archive of the Vietnamese Spinal Impact method document, quoted with page numbers alongside sourced medical information. Not a substitute for diagnosis or treatment.",
  parentSlug: "suc-khoe",
};

/* Tài liệu là tư liệu, không phải bằng chứng: bậc 4 để gate (≥3 nguồn bậc 1–2)
   không bao giờ đếm nó — chủ sản phẩm chốt 2026-10-05, phương án (a). */
const DOC_SOURCE = {
  title: "Phương pháp Tác động Cột sống Việt Nam — Một số bệnh thường gặp và hướng điều trị",
  publisher: "Chi hội Tác động cột sống Hà Nội — Hội Đông y thành phố Hà Nội",
  url: "https://tacdongcotsong.org",
  tier: 4,
};

/* Một entity cho cả loạt: bài nói về TÀI LIỆU, không phải bài chính về bệnh. Gắn
   vào entity "đau nửa đầu" thì JSON-LD `about` tuyên bố bài tư liệu này là bài
   Sciencepedia về migraine — đúng điều slug "-theo-tac-dong-cot-song" tránh. */
const ENTITY = {
  slug: "phuong-phap-tac-dong-cot-song-viet-nam",
  canonicalName: "Phương pháp Tác động Cột sống Việt Nam",
  canonicalNameEn: "Vietnamese Spinal Impact method",
  entityType: "METHOD" as const,
  aliases: ["tác động cột sống", "tdcs", "spinal impact method"],
  description:
    "Phương pháp do Chi hội Tác động cột sống Hà Nội (Hội Đông y TP Hà Nội) mô tả trong tài liệu cùng tên; Sciencepedia lưu trữ tài liệu dưới dạng trích dẫn có trang.",
};

const readingTime = (md: string) => Math.max(1, Math.round(md.split(/\s+/).length / 200));

async function main() {
  const write = process.argv.includes("--write");
  const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, "topics", p), "utf8"));

  const files = readdirSync(path.join(ROOT, "topics")).filter((f) => f.endsWith(".editorial.json")).sort();
  const plan = files.map((file) => {
    const editorial = Editorial.parse(read(file));
    const topic = Topic.parse(read(`${editorial.slug}.json`));
    const pending = Object.entries(editorial.review).filter(([, v]) => v !== "passed").map(([k]) => k);
    if (pending.length) throw new Error(`${editorial.slug}: review chưa passed — ${pending.join(", ")}`);
    const vi = readFileSync(path.join(DRAFTS, `${editorial.slug}.md`), "utf8").trim();
    const en = readFileSync(path.join(DRAFTS, `${editorial.slug}.en.md`), "utf8").trim();
    return { editorial, topic, vi, en };
  });

  for (const { editorial, vi } of plan) {
    console.log(`${write ? "ghi " : "kế hoạch"}  ${editorial.slug}  (${readingTime(vi)} phút, ${editorial.sources.length} nguồn bậc 1–2 + tài liệu bậc 4)`);
  }
  if (!write) {
    console.log("\nChạy khô — thêm --write để ghi DRAFT vào CSDL.");
    return;
  }

  const parent = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY.parentSlug }, select: { id: true } });
  const category = await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    update: {},
    create: {
      slug: CATEGORY.slug,
      name: CATEGORY.name,
      nameEn: CATEGORY.nameEn,
      description: CATEGORY.description,
      descriptionEn: CATEGORY.descriptionEn,
      icon: "Activity",
      parentId: parent.id,
    },
  });

  const entity = await prisma.entity.upsert({
    where: { slug: ENTITY.slug },
    update: {},
    create: ENTITY,
  });

  for (const { editorial, topic, vi, en } of plan) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.article.findUnique({
        where: { slug: editorial.slug },
        select: { status: true, coverImage: true },
      });
      if (existing && existing.status !== "DRAFT") {
        throw new Error(`${editorial.slug} đang ${existing.status} — script này chỉ ghi bài nháp; sửa bài đã xuất bản là đính chính, đi đường khác.`);
      }
      const data = {
        title: editorial.title.vi,
        titleEn: editorial.title.en,
        summary: editorial.summary.vi,
        summaryEn: editorial.summary.en,
        content: vi,
        contentEn: en,
        seoTitle: editorial.title.vi,
        seoDescription: editorial.seoDescription.vi,
        seoKeywords: editorial.keywords,
        readingTime: readingTime(vi),
        status: "DRAFT" as const,
        categoryId: category.id,
        authorId: ADMIN_ID,
        entityId: entity.id,
        // Bìa chỉ ghi lần đầu: sau `covers:mirror` nó là URL R2, ghi đè là kéo ngược về Commons.
        ...(existing?.coverImage ? {} : { coverImage: editorial.cover.url }),
      };
      const article = await tx.article.upsert({
        where: { slug: editorial.slug },
        update: data,
        create: { slug: editorial.slug, ...data },
      });
      await tx.source.deleteMany({ where: { articleId: article.id } });
      const accessed = new Date("2026-10-05T00:00:00Z");
      await tx.source.createMany({
        data: [
          ...editorial.sources.map((s) => ({
            articleId: article.id,
            title: s.title,
            publisher: s.publisher,
            url: s.url,
            doi: s.doi ?? null,
            tier: s.tier,
            accessedAt: accessed,
          })),
          {
            articleId: article.id,
            ...DOC_SOURCE,
            title: `${DOC_SOURCE.title} — ${topic.source.heading}, tr. ${topic.source.pdfPages[0] - 1}–${topic.source.pdfPages[1] - 1}`,
            accessedAt: accessed,
          },
        ],
      });
      if ((await tx.revision.count({ where: { articleId: article.id } })) === 0) {
        await tx.revision.create({
          data: {
            articleId: article.id,
            title: data.title,
            content: vi,
            editorId: ADMIN_ID,
            note: "Bản đầu từ npm run spine:build — science-editor duyệt 2/2 vòng, bản chép 2 lượt.",
          },
        });
      }
    });
    console.log(`  ✔ ${editorial.slug} — DRAFT`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Prisma.PrismaClientKnownRequestError ? `${e.code}: ${e.message}` : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
