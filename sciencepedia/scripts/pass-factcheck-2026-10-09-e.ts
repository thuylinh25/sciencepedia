import { PrismaClient } from "@prisma/client";

/**
 * Đặt factCheck = PASSED và ký byline duyệt cho 6 bài đã đính chính còn chưa ký: rìa Hệ Mặt Trời,
 * Vũ trụ quan sát được, Tế bào gốc, Ngồi thẳng lưng (đợt 08/10; phiếu docs/content/checks/2026-10-08/,
 * tế bào gốc: 2026-10-07/khi-te-bao-goc-quen-minh-la-ai.md) và Bí ẩn di truyền, Bản thiết kế chung của
 * sự sống (đợt 09/10, `apply-corrections-2026-10-09-g.ts`; phiếu docs/content/checks/2026-10-09/).
 *
 * Chạy TAY, do con người thực hiện, sau khi đã đọc bản đã sửa. Agent không chạy script
 * này: byline khẳng định một người/tổ chức đã soi bài — agent tự ký lên bài chính agent
 * thẩm định là mạo danh. Byline trỏ tài khoản tổ chức "Ban biên tập Sciencepedia", cùng
 * tài khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 *
 * Idempotent. Năm bài PUBLISHED không cần publish lại. Bài Ngồi thẳng lưng (DRAFT) đã có entity và
 * readingTime; sau khi ký, chạy tiếp:
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-09-e.ts
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09-b.ts --write --links
 *   npm run publish -- --slug cuoc-chien-chong-lai-trong-luc-vi-sao-ngoi-thang-lung-lai-kho-den-the
 */
const prisma = new PrismaClient();

const SLUGS = [
  "bi-an-ria-thai-duong-he-noi-anh-huong-cua-mat-troi-dan-ket-thuc",
  "khung-hoang-hien-sinh-cua-vu-tru-lieu-chung-ta-co-the-hieu-toan-bo-vu-tru",
  "khi-te-bao-goc-quen-minh-la-ai-khung-hoang-danh-tinh-o-cap-do-phan-tu",
  "cuoc-chien-chong-lai-trong-luc-vi-sao-ngoi-thang-lung-lai-kho-den-the",
  "bi-an-di-truyen-nhung-gi-con-trai-thua-huong-tu-me",
  "ban-thiet-ke-chung-cua-su-song-vi-sao-cac-loai-dong-vat-co-cau-tao-giong-nhau",
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
