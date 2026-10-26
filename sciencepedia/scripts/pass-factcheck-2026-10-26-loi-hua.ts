import { PrismaClient } from "@prisma/client";

/**
 * Ký byline duyệt + đưa factCheck=PASSED cho bài "Lời hứa của toán học và sự im lặng của vũ trụ".
 *
 * Chạy TAY, do CON NGƯỜI thực hiện, SAU khi đã đọc bản đã đính chính (npm run corrections:1026b
 * -- --write) — cả bản VI lẫn bản EN — và đồng ý. Agent KHÔNG chạy script này: byline nói một
 * người/tổ chức đã soi bài, agent ký lên bài chính agent thẩm định là mạo danh (skill
 * tham-dinh-bai-da-dang, mục Ranh giới).
 *
 * Bài đã được thẩm định theo phiếu docs/content/checks/2026-10-26/<slug>.md:
 *  - 6 nguồn bậc 1–2 (SETI x2, NASA, Rev. Mod. Phys./APS, Sandberg–Drexler–Ord, Armstrong–Sandberg)
 *    + Hanson 1998 (bậc 3, chỉ cho xuất xứ khái niệm) — ≥4 cơ quan độc lập; URL/DOI kiểm 2026-10-26.
 *  - Đoạn Kết luận bị cắt cụt đã bù; blockquote Fermi về đúng lời ghi được; xuất xứ Bộ lọc vĩ đại
 *    (Hanson 1998) và Khu rừng tăm tối (tiểu thuyết Lưu Từ Hân) đã ghi; 3 link nội bộ + Đọc thêm;
 *    viết hoa kiểu câu; bản EN dịch từ bản VI sau đính chính.
 * Còn lại cho người (phiếu mục E): gắn entity, ≥1 link vào (nếu đăng lại chính thức qua gate).
 * factCheck=PASSED không tự qua các điều kiện gate publish khác — bài vốn đã PUBLISHED, đây chỉ là
 * dấu duyệt accuracy.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-26-loi-hua.ts
 */
const prisma = new PrismaClient();

const SLUG = "loi-hua-cua-toan-hoc-va-su-im-lang-cua-vu-tru";
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
