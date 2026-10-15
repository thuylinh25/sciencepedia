import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho bài "Từ dòng điện đến phép tính: mạch điện làm toán
 * như thế nào?" sau đính chính 15/10 (`scripts/apply-corrections-2026-10-15-b.ts`, phiếu
 * docs/content/checks/2026-10-15/tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao.md).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script này: byline
 * khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent thẩm định là mạo danh.
 * Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia" (docs/content-rules.md, "Byline người duyệt").
 *
 * Còn lại để qua gate đầy đủ (phiếu mục E, không chặn hiển thị vì bài đang PUBLISHED):
 *   - entity: knowledge-graph-manager gắn entityId.
 *   - link vào: thêm backlink từ một bài PUBLISHED (vd. "Từ electron đến dòng điện").
 *   - SEO: đặt seoTitle/seoDescription/seoKeywords (D1–D3) qua form /admin.
 *
 * Idempotent.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-15-b.ts
 */
const prisma = new PrismaClient();

const SLUGS = ["tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao"];

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
