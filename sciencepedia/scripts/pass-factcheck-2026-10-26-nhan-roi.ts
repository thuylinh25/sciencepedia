import { PrismaClient } from "@prisma/client";

/**
 * Ký byline duyệt + đưa factCheck=PASSED cho bài 'Khi bộ não "rảnh rỗi"…'.
 *
 * Chạy TAY, do CON NGƯỜI thực hiện, SAU khi đã đọc bản đã đính chính (npm run corrections:1026c
 * -- --write) — cả bản VI lẫn bản EN — và đồng ý. Agent KHÔNG chạy script này: byline nói một
 * người/tổ chức đã soi bài, agent ký lên bài chính agent thẩm định là mạo danh (skill
 * tham-dinh-bai-da-dang, mục Ranh giới).
 *
 * Bài đã được thẩm định theo phiếu docs/content/checks/2026-10-26/<slug>.md:
 *  - 7 nguồn bậc 1–2: Raichle 2015 (Annu Rev Neurosci), Zhou 2020 (NeuroImage), Killingsworth &
 *    Gilbert 2010 (Science), Kleim & Jones 2008 (JSLHR), Sharif 2021 (JPSP) — DOI tra Crossref,
 *    abstract Raichle/Zhou đọc qua Europe PMC; WHO (physical activity) + NHS (GAD) cho lời khuyên.
 *  - Đã gỡ hai sơ đồ nhân quả không nguồn + câu mục đích luận; hạ DMN→rumination về mức "liên hệ"
 *    (Zhou 2020 chỉ khẳng định association); thêm mục "Khi nào nên đi khám" (NHS); 3 link nội bộ +
 *    Đọc thêm; viết hoa kiểu câu; bản EN dịch từ bản VI sau đính chính.
 * Còn lại cho người (phiếu mục E): gắn entity, ≥1 link vào (nếu đăng lại chính thức qua gate);
 * tuỳ chọn thêm 3 mục từ glossary (DMN, neuroplasticity, rumination).
 * factCheck=PASSED không tự qua các điều kiện gate publish khác — bài vốn đã PUBLISHED, đây chỉ là
 * dấu duyệt accuracy.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-10-26-nhan-roi.ts
 */
const prisma = new PrismaClient();

const SLUG = "khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi";
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
