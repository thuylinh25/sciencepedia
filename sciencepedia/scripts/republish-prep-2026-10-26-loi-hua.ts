import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ hai mục CHẶN còn lại cho bài "Lời hứa của toán học và sự im lặng của vũ trụ" sau đính chính
 * 26/10 (`scripts/apply-corrections-2026-10-26-b.ts`), theo phiếu mục E: gắn entity + ≥1 link vào.
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-26-loi-hua.ts          # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-26-loi-hua.ts --write  # entity + readingTime + link vào
 *
 * Chạy TAY, do CON NGƯỜI, SAU khi đã chạy pass-factcheck-2026-10-26-loi-hua.ts (byline + PASSED):
 * link vào chỉ nên ghi khi bài đích đã có byline (skill tham-dinh-bai-da-dang, mục Ranh giới) —
 * không trỏ người đọc từ bài đã duyệt sang bài chưa ai soi.
 *
 * - entity: tạo "Nghịch lý Fermi" (Wikidata Q33580, tra wbsearchentities 2026-10-26) rồi gắn vào bài.
 * - readingTime: tính lại theo nội dung đã sửa — cùng công thức với `check-publish.ts` (đã là 6 sau
 *   đính chính; để đây cho idempotent và phòng khi nội dung đổi).
 * - link vào: từ bài "Nếu phải rời Trái Đất…" (PUBLISHED+PASSED) — mục Europa/Titan/Enceladus nói về
 *   "cuộc tìm kiếm sự sống ngoài Trái Đất"; bài đích đặt đúng câu hỏi lớn của cuộc tìm kiếm ấy.
 *
 * KHÔNG đổi factCheck/byline/status của bài đích — đó là việc của pass-factcheck. SEO đã có sẵn
 * (seoTitle/seoDescription/seoKeywords khớp nội dung), không đụng. Idempotent.
 */
const prisma = new PrismaClient();

const SLUG = "loi-hua-cua-toan-hoc-va-su-im-lang-cua-vu-tru";

const ENTITY = {
  slug: "nghich-ly-fermi",
  canonicalName: "Nghịch lý Fermi",
  canonicalNameEn: "Fermi paradox",
  entityType: "CONCEPT" as EntityType,
  aliases: ["Fermi paradox", "sự im lặng vĩ đại", "Great Silence"],
  wikidataQid: "Q33580",
  description:
    "Mâu thuẫn giữa ước tính xác suất cao về sự tồn tại của các nền văn minh ngoài Trái Đất và việc đến nay chưa có bằng chứng quan sát nào về chúng.",
};

const BACKLINK = {
  from: "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
  find: "cuộc tìm kiếm sự sống ngoài Trái Đất",
  replace: `[cuộc tìm kiếm sự sống ngoài Trái Đất](/articles/${SLUG})`,
  why: "Bài nguồn (mục Titan/Europa/Enceladus) nói về cuộc tìm kiếm sự sống ngoài Trái Đất; bài đích đặt đúng câu hỏi lớn của cuộc tìm kiếm ấy — vì sao vẫn chưa thấy nền văn minh nào (Nghịch lý Fermi).",
};

// Cùng công thức readingTime với scripts/check-publish.ts.
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
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  const touched = new Set<string>();

  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, status: true, content: true, readingTime: true, entityId: true },
  });
  const rt = readingTimeOf(a.content);
  const existing = await prisma.entity.findUnique({ where: { slug: ENTITY.slug }, select: { id: true } });
  console.log(`\n══════ ${SLUG} (${a.status})`);
  console.log(`entity ${ENTITY.slug} (${existing ? "đã có" : "tạo mới"}, ${ENTITY.wikidataQid})${a.entityId ? " — bài đã gắn entity khác, giữ" : ""}`);
  console.log(`readingTime ${a.readingTime} → ${rt}`);

  if (write) {
    const entityId = a.entityId ?? (existing ? existing.id : (await prisma.entity.create({ data: ENTITY, select: { id: true } })).id);
    await prisma.article.update({ where: { id: a.id }, data: { entityId, readingTime: rt } });
    touched.add(SLUG);
    console.log("ĐÃ GHI entity + readingTime");
  }

  const src = await prisma.article.findUniqueOrThrow({ where: { slug: BACKLINK.from }, select: { id: true, status: true, factCheck: true, content: true } });
  if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${BACKLINK.from} không PUBLISHED`);
  if (src.content.includes(`/articles/${SLUG}`)) {
    console.log(`link vào: đã có từ ${BACKLINK.from}`);
  } else {
    const n = src.content.split(BACKLINK.find).length - 1;
    if (n !== 1) throw new Error(`[${BACKLINK.from}] cụm neo khớp ${n} chỗ, cần đúng 1`);
    console.log(`link vào từ ${BACKLINK.from} (bài đích đang PUBLISHED → an toàn)`);
    console.log(`   vì: ${BACKLINK.why}`);
    if (write) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(BACKLINK.find, () => BACKLINK.replace) } });
      touched.add(BACKLINK.from);
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
