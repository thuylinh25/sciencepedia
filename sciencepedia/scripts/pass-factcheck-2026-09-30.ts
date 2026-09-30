import { PrismaClient } from "@prisma/client";

/**
 * Đưa 56 bài đã qua fact-check về factCheck=PASSED và ký byline duyệt.
 *
 * Chạy TAY, do con người thực hiện — 2026-09-30. Gộp và thay cho
 * pass-revise-2026-09-30.ts (chỉ có 25 bài REVISE). Idempotent: chạy lại
 * không hại gì. Sau khi chạy: cả 96 bài trong kho đều PASSED.
 *
 * Agent đã fact-check lại toàn bộ 56 bài (25 REVISE + 31 PENDING):
 *  - Kiểm mọi DOI trên Crossref: tất cả có thật, không trích dẫn bịa (không S1).
 *  - Đối chiếu số liệu hành tinh với NASA Planetary Fact Sheet, số liệu khí hậu
 *    với IPCC SR1.5, và các claim với nguồn được trích: không lỗi sự kiện (không S2).
 *  - Đã sửa 2 nguồn không định danh của bài hệ vi sinh (thêm DOI Cell 2021 +
 *    Nature Reviews Microbiology 2013).
 *  - 2 bài PENDING vốn có 0 nguồn (khi-tim-ngung, stress-tac-dong) đã được
 *    content-research bổ sung 6 và 5 nguồn bậc 1, và gắn entity (cai-chet, cang-thang).
 *
 * Byline duyệt trỏ tài khoản tổ chức "Ban biên tập Sciencepedia" — cùng tài
 * khoản mọi bài PASSED khác dùng (docs/content-rules.md, "Byline người duyệt").
 * Gán byline là quyết định của con người khi chạy script này.
 *
 *   npx tsx --env-file-if-exists=.env scripts/pass-factcheck-2026-09-30.ts
 */
const prisma = new PrismaClient();

const SLUGS = [
  // --- 25 bài REVISE ---
  "20-ngoi-sao-sang-nhat-bau-troi-dem",
  "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no",
  "bi-mat-dang-sau-cam-giac-hut-hang-khi-van-toc-thay-doi",
  "cac-chom-sao-hoang-dao",
  "chung-ta-dang-song-trong-mot-bong-bong-giac-quan-nho-be-cua-thuc-tai",
  "da-vu-tru-bon-cap-do-va-mot-cau-hoi-kho",
  "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
  "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
  "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung",
  "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do",
  "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
  "ngoi-sao-cau-tao-va-vong-doi",
  "sao-hai-vuong-hanh-tinh-tim-ra-bang-toan-hoc",
  "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
  "sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he",
  "sao-thien-vuong-hanh-tinh-lan-nghieng-tren-quy-dao",
  "sao-tho-vanh-dai-mong-manh-va-ve-tinh-co-dai-duong",
  "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
  "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
  "tu-truong-va-luc-hap-dan-hai-luc-vo-hinh-hai-co-che-khac-nhau",
  "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
  "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
  "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
  "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
  "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
  // --- 29 bài PENDING (có nguồn) ---
  "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
  "ca-phe-va-tra-danh-thuc-nao-bo-nhu-the-nao",
  "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
  "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
  "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
  "dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi",
  "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
  "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
  "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
  "hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau",
  "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai",
  "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
  "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
  "nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh",
  "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
  "photon-hat-anh-sang-thuc-su-la-gi",
  "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
  "runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan",
  "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
  "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
  "thoi-gian-duoi-goc-nhin-luong-tu-vu-tru-co-thuc-su-troi",
  "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
  "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
  "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
  "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
  "vi-sao-cang-gan-toc-do-anh-sang-thoi-gian-troi-cang-cham",
  "vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi",
  "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
  "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
  // --- 2 bài PENDING vừa được bổ sung nguồn (content-research) ---
  "khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet",
  "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa",
];

// Tài khoản tổ chức "Ban biên tập Sciencepedia" (ADMIN).
const REVIEWER_ID = "cmti8v05z0000k5ccfg55mget";

async function main() {
  const now = new Date();
  let n = 0;
  for (const slug of SLUGS) {
    const found = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!found) {
      console.warn(`BỎ QUA: không có bài "${slug}"`);
      continue;
    }
    await prisma.article.update({
      where: { slug },
      data: { factCheck: "PASSED", reviewedById: REVIEWER_ID, reviewedAt: now },
    });
    n++;
    console.log(`PASSED + reviewer: ${slug}`);
  }
  const left = await prisma.article.count({
    where: { factCheck: { not: "PASSED" } },
  });
  console.log(`\nĐã cập nhật ${n} bài. Còn factCheck != PASSED: ${left} (kỳ vọng 0).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
