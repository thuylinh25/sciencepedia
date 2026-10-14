import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho ba bài đã đính chính 14/10 — "Điểm kỳ dị của hố đen",
 * "Từ Big Bang đến Big Bounce", "Vì sao não bộ tạo ra điện?" (`scripts/apply-corrections-2026-10-14.ts`,
 * phiếu docs/content/checks/2026-10-14/).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Idempotent. Sau khi chạy: báo agent, agent thêm link vào + entity.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-14.ts
 */
const prisma = new PrismaClient();

const SLUGS = [
  "diem-ky-di-cua-ho-den-noi-hai-tru-cot-vat-ly-va-cham",
  "tu-big-bang-den-big-bounce-lieu-vu-tru-co-tai-sinh-theo-chu-ky",
  "vi-sao-nao-bo-tao-ra-dien",
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
