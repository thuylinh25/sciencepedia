import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ các mục CHẶN do máy làm được cho bài "Ngồi thẳng lưng" (về DRAFT sau đính chính 08/10),
 * để đăng lại qua `npm run publish`. Cùng khung với `republish-prep-2026-10-09.ts` (lý do từng bước ở đó).
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09-b.ts                   # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09-b.ts --write           # entity + readingTime
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09-b.ts --write --links   # + link vào (chỉ khi bài đã có byline)
 *
 * Wikidata tra wbsearchentities 2026-10-09: Q1144593 "sitting". Link vào chỉ ghi khi bài đích đã
 * PASSED + byline duyệt — ghi sớm hơn thì người đọc bài stress bấm vào gặp 404.
 *
 * Script KHÔNG đổi factCheck, byline duyệt hay status.
 */
const prisma = new PrismaClient();

type Job = {
  slug: string;
  entity: {
    slug: string;
    canonicalName: string;
    canonicalNameEn: string;
    entityType: EntityType;
    aliases: string[];
    wikidataQid: string;
    description: string;
  };
  backlink: { from: string; find: string; replace: string; why: string };
};

const NGOI = "cuoc-chien-chong-lai-trong-luc-vi-sao-ngoi-thang-lung-lai-kho-den-the";

const JOBS: Job[] = [
  {
    slug: NGOI,
    entity: {
      slug: "tu-the-ngoi",
      canonicalName: "Tư thế ngồi",
      canonicalNameEn: "Sitting",
      entityType: "CONCEPT",
      aliases: ["ngồi", "sitting"],
      wikidataQid: "Q1144593",
      description: "Tư thế nghỉ của người, trọng lượng cơ thể đỡ chủ yếu bằng mông trên mặt đất hoặc trên ghế.",
    },
    backlink: {
      from: "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa",
      find: "Sau buổi tập phù hợp, cảm giác căng cơ do ngồi lâu hoặc stress có thể giảm.",
      replace: `Sau buổi tập phù hợp, cảm giác căng cơ do [ngồi lâu](/articles/${NGOI}) hoặc stress có thể giảm.`,
      why: "Bài đích giải thích khi ngồi cơ nào làm việc và mô thụ động gánh tải ra sao; bài đích đã trỏ ngược lại bài stress.",
    },
  },
];

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
const readingTimeOf = (content: string) => Math.max(1, Math.round(prose(content).trim().split(/\s+/).length / 200));

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const links = argv.includes("--links");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const touched = new Set<string>();
  for (const job of JOBS) {
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: job.slug },
      select: { id: true, status: true, content: true, readingTime: true, entityId: true, factCheck: true, reviewedById: true, reviewedAt: true },
    });
    console.log(`\n══════ ${job.slug} (${a.status}, factCheck ${a.factCheck})`);

    const rt = readingTimeOf(a.content);
    const existing = await prisma.entity.findUnique({ where: { slug: job.entity.slug }, select: { id: true } });
    console.log(`readingTime ${a.readingTime} → ${rt} · entity ${job.entity.slug} (${existing ? "đã có" : "tạo mới"}, ${job.entity.wikidataQid})${a.entityId ? " — bài đã gắn entity khác, giữ" : ""}`);
    if (write) {
      const entityId = a.entityId ?? (existing ? existing.id : (await prisma.entity.create({ data: job.entity, select: { id: true } })).id);
      await prisma.article.update({ where: { id: a.id }, data: { readingTime: rt, entityId } });
      touched.add(job.slug);
    }

    const b = job.backlink;
    const src = await prisma.article.findUniqueOrThrow({ where: { slug: b.from }, select: { id: true, status: true, content: true } });
    if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${b.from} không PUBLISHED`);
    if (src.content.includes(`/articles/${job.slug}`)) {
      console.log(`link vào: đã có từ ${b.from}`);
      continue;
    }
    const n = src.content.split(b.find).length - 1;
    if (n !== 1) throw new Error(`[${b.from}] cụm neo khớp ${n} chỗ, cần đúng 1`);
    const ready = a.factCheck === "PASSED" && a.reviewedById && a.reviewedAt;
    console.log(`link vào từ ${b.from}${ready ? "" : " — CHỜ: bài đích chưa có factCheck PASSED + byline duyệt"}`);
    console.log(`   vì: ${b.why}`);
    if (write && links && ready) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(b.find, () => b.replace) } });
      touched.add(b.from);
      console.log("   ĐÃ GHI link vào");
    }
  }

  if (write && touched.size) await revalidateSite([...touched]);
  if (!write) console.log("\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
