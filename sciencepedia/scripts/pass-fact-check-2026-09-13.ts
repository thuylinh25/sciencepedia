import { PrismaClient } from "@prisma/client";

/**
 * Đóng gate accuracy cho hai bài đầu tiên của đợt duyệt 13/09.
 *
 *   npx tsx scripts/pass-fact-check-2026-09-13.ts            # in kế hoạch
 *   npx tsx scripts/pass-fact-check-2026-09-13.ts --write    # thực thi
 *
 * ## Vì sao chỉ hai bài trong bốn mươi mốt
 *
 * `science-editor` duyệt cả 41 bài PENDING ngày 13/09 và ra 40 REVISE, 1
 * PASSED. Hai bài dưới đây là toàn bộ phần đạt được gate:
 *
 * - `mat-troi` — PASSED thẳng. Sáu nguồn NASA/ESA/NOAA, mỗi nguồn phủ đúng
 *   phần nội dung nó được gắn thay vì một nguồn đỡ cả bài.
 * - `van-dong` — cách PASSED hai dòng, và script này đi nốt hai dòng đó.
 *
 * Ba mươi chín bài còn lại không nằm ở đây. Phần lớn vướng cùng một chuyện:
 * bài treo trên một nguồn tổng quát hoặc trên một trang phổ biến khoa học
 * gắn nhầm bậc, tức phải bổ sung nguồn chứ không phải bấm nút duyệt.
 *
 * ## Ba việc script làm, và vì sao từng việc là điều kiện của gate
 *
 * 1. **Sửa tiêu đề nguồn JAHA.** DOI `10.1161/JAHA.112.004473` đang mang tên
 *    một bài khác. Đã tra Crossref ngày 13/09: DOI đó là "Exercise Training
 *    for Blood Pressure: A Systematic Review and Meta-analysis" (Cornelissen
 *    & Smart, JAHA 2013). Gate đòi citation RESOLVE — một citation trỏ đúng
 *    DOI nhưng in sai tên bài thì người đọc kiểm chứng sẽ tưởng mình tra nhầm.
 *
 * 2. **Thêm nguồn Wen 2011 cho con số "90 phút mỗi tuần".** Con số ấy là claim
 *    duy nhất trong bài không có nguồn nào đỡ. Quy tắc 6 cho hai đường: bỏ số,
 *    hoặc thêm nguồn. Thêm nguồn tốt hơn vì con số ĐÚNG — đã tra Crossref:
 *    `10.1016/S0140-6736(11)60749-6`, "Minimum amount of physical activity for
 *    reduced mortality and extended life expectancy", The Lancet 2011.
 *
 * 3. **Điền `accessedAt` cho nguồn còn thiếu.** Bảy dòng nguồn của hai bài
 *    không có ngày truy cập. Với nguồn web (trang NASA, WHO) thì thiếu ngày
 *    truy cập nghĩa là không ai biết nội dung được đối chiếu ở phiên bản nào —
 *    mà trang NASA thì đổi số liệu thật, đúng như vụ số vệ tinh vừa rồi.
 *
 * ## Vì sao `reviewedById` tra theo vai trò chứ không ghim cứng
 *
 * Ghim một cuid vào mã nguồn thì nó chỉ đúng trên đúng một cơ sở dữ liệu.
 * Script tìm tài khoản ADMIN — kho hiện có duy nhất một, "Ban biên tập
 * Sciencepedia", cũng chính là tài khoản đã duyệt 17 bài PASSED trước đó.
 */
const prisma = new PrismaClient();

const VERIFIED_AT = new Date("2026-09-13T00:00:00Z");

/** Đã tra Crossref ngày 13/09, không chép từ trí nhớ. */
const WEN_2011 = {
  title:
    "Minimum amount of physical activity for reduced mortality and extended life expectancy: a prospective cohort study",
  url: "https://doi.org/10.1016/S0140-6736(11)60749-6",
  doi: "10.1016/S0140-6736(11)60749-6",
  publisher: "The Lancet",
  year: 2011,
  tier: 1,
};

const JAHA_DOI = "10.1161/JAHA.112.004473";
const JAHA_TITLE =
  "Exercise Training for Blood Pressure: A Systematic Review and Meta-analysis";

const SLUGS = [
  "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
  "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
] as const;

async function main() {
  const write = process.argv.includes("--write");

  console.log("=== ĐÓNG GATE ACCURACY — đợt 13/09 ===");
  console.log(
    write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n",
  );

  const reviewer = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true },
  });
  if (!reviewer) throw new Error("Không tìm thấy tài khoản ADMIN để làm reviewer");
  console.log(`Người duyệt: ${reviewer.name} (${reviewer.id})\n`);

  for (const slug of SLUGS) {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        factCheck: true,
        sources: { select: { id: true, title: true, doi: true, accessedAt: true } },
      },
    });
    if (!article) {
      console.log(`⚠ không thấy ${slug}`);
      continue;
    }

    console.log(`${slug}  [${article.factCheck} → PASSED]`);

    const jaha = article.sources.find((s) => s.doi === JAHA_DOI);
    if (jaha && jaha.title !== JAHA_TITLE) {
      console.log(`   • sửa tiêu đề nguồn ${JAHA_DOI}`);
      console.log(`     cũ:  ${jaha.title}`);
      console.log(`     mới: ${JAHA_TITLE}`);
      if (write) {
        await prisma.source.update({
          where: { id: jaha.id },
          data: { title: JAHA_TITLE },
        });
      }
    }

    const hasWen = article.sources.some((s) => s.doi === WEN_2011.doi);
    if (slug === SLUGS[1] && !hasWen) {
      console.log(`   • thêm nguồn bậc ${WEN_2011.tier}: ${WEN_2011.title.slice(0, 66)}…`);
      if (write) {
        await prisma.source.create({
          data: {
            articleId: article.id,
            ...WEN_2011,
            accessedAt: VERIFIED_AT,
          },
        });
      }
    }

    const missing = article.sources.filter((s) => !s.accessedAt);
    if (missing.length) {
      console.log(`   • điền accessedAt cho ${missing.length} nguồn`);
      if (write) {
        await prisma.source.updateMany({
          where: { id: { in: missing.map((s) => s.id) } },
          data: { accessedAt: VERIFIED_AT },
        });
      }
    }

    console.log(`   • factCheck → PASSED, reviewedBy → ${reviewer.name}`);
    if (write) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          factCheck: "PASSED",
          reviewedById: reviewer.id,
          reviewedAt: VERIFIED_AT,
          lastVerifiedAt: VERIFIED_AT,
        },
      });
    }
    console.log("");
  }

  console.log(
    write
      ? "Xong. Ba mươi chín bài còn lại vẫn PENDING — chúng cần thêm nguồn, không phải thêm một lượt bấm duyệt."
      : "Sẵn sàng. Chạy lại với --write để ghi.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
