import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho bài đã đính chính 12/10
 * (`scripts/apply-corrections-2026-10-12.ts`, phiếu docs/content/checks/2026-10-12/).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Ảnh bìa (logo StarWalk, chưa rõ giấy phép) là việc riêng ở phiếu mục E — ký byline không
 * thay cho việc thay ảnh.
 *
 * Idempotent. Sau khi chạy: báo agent, agent thêm link vào + entity rồi `npm run publish:check`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-12.ts
 */
const prisma = new PrismaClient();

const SLUGS = ["bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong"];

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
