import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho 3 bài đã đính chính 09/10
 * (`scripts/apply-corrections-2026-10-09-b.ts`, phiếu docs/content/checks/2026-10-08/).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Idempotent. Sau khi chạy: báo agent, agent thêm link vào rồi `npm run publish`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-09.ts
 */
const prisma = new PrismaClient();

const SLUGS = [
  "bi-an-giai-phau-vi-sao-bo-nao-khong-the-cam-nhan-dau",
  "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the",
  "chung-teo-co-do-tuoi-tac-sarcopenia-ke-thu-tham-lang-cua-tuoi-gia",
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
