import { PrismaClient } from "@prisma/client";

/**
 * Ký byline duyệt + đưa factCheck=PASSED cho bài "Lòng dũng cảm và sự tò mò…".
 *
 * Chạy TAY, do CON NGƯỜI thực hiện, SAU khi đã đọc bản đã đính chính (npm run corrections:1023
 * -- --write) và đồng ý. Agent KHÔNG chạy script này: byline nói một người/tổ chức đã soi bài,
 * agent ký lên bài chính agent thẩm định là mạo danh (skill tham-dinh-bai-da-dang, mục Ranh giới).
 *
 * Bài đã được thẩm định theo phiếu docs/content/checks/2026-10-23/<slug>.md:
 *  - 5 nguồn bậc 1 (NASA x3, ESA, NOAA) — 3 cơ quan độc lập; mọi URL đã kiểm tồn tại 2026-10-23.
 *  - Hai câu lệch nguồn đã sửa (nguyên tố C/O vs siêu tân tinh; danh sách spin-off công nghệ).
 *  - 5 link nội bộ, mục Đọc thêm, viết hoa tiêu đề kiểu câu.
 * Còn lại cho người trước/ sau khi ký (phiếu mục E): gắn entity, ≥1 link vào, bản EN (không dịch
 * máy), ghi công ảnh bìa (npm run images:credit -- --write). factCheck=PASSED không tự qua các
 * điều kiện gate publish khác — bài vốn đã PUBLISHED, đây chỉ là dấu duyệt accuracy.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-23.ts
 */
const prisma = new PrismaClient();

const SLUG = "long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao";
// Tài khoản tổ chức "Ban biên tập Sciencepedia" (ADMIN) — cùng tài khoản mọi bài PASSED khác dùng.
const REVIEWER_ID = "cmti8v05z0000k5ccfg55mget";

async function main() {
  const a = await prisma.article.findUnique({ where: { slug: SLUG }, select: { id: true, factCheck: true } });
  if (!a) {
    console.error(`Không có bài "${SLUG}"`);
    process.exitCode = 1;
    return;
  }
  await prisma.article.update({
    where: { slug: SLUG },
    data: { factCheck: "PASSED", reviewedById: REVIEWER_ID, reviewedAt: new Date() },
  });
  console.log(`PASSED + byline duyệt: ${SLUG} (trước đó: ${a.factCheck})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
