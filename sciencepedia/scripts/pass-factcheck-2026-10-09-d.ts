import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho bài grounding và bài Từ nguyên tử đến kim cương (đính chính 09/10)
 * (`apply-corrections-2026-10-09-b.ts`, `-e.ts`; phiếu docs/content/checks/2026-10-08/grounding-…md, 2026-10-09/tu-nguyen-tu-…md). Thay pass-factcheck-2026-10-09-c.ts (chỉ có grounding).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Idempotent. Hai bài vẫn PUBLISHED — không cần publish lại.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-09-d.ts
 */
const prisma = new PrismaClient();

const SLUGS = [
  "grounding-tiep-dia-dieu-gi-thuc-su-xay-ra-khi-di-chan-tran-tren-dat",
  "tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat",
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
