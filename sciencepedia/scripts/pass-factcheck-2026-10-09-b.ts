import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho 3 bài đính chính 09/10 đợt c, d
 * (`scripts/apply-corrections-2026-10-09-c.ts`, `-d.ts`; phiếu docs/content/checks/2026-10-09/).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Idempotent. Ba bài vẫn PUBLISHED — không cần publish lại.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-09-b.ts
 */
const prisma = new PrismaClient();

const SLUGS = [
  "tu-khong-khi-den-song-dien-tu-vi-sao-am-thanh-va-hinh-anh-co-the-truyen-di-khong-can-day",
  "bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap",
  "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
];

// Tài khoản tổ chức "Ban biên tập Sciencepedia" (ADMIN).
const REVIEWER_ID = "cmti8v05z0000k5ccfg55mget";

async function main() {
  const now = new Date();
  for (const slug of SLUGS) {
    const a = await prisma.article.update({
      where: { slug },
      data: { factCheck: "PASSED", reviewedById: REVIEWER_ID, reviewedAt: now },
      select: { slug: true, status: true },
    });
    console.log(`PASSED + byline duyệt: ${a.slug} (${a.status})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
