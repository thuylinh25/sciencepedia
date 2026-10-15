import { runCorrections } from "./lib/corrections";
import { MACH_DIEN } from "./data/corrections-1015/mach-dien";

/**
 * Đính chính bài "Từ Dòng Điện Đến Phép Tính: Mạch Điện Làm Toán Như Thế Nào?" (đăng qua /admin,
 * 0 nguồn, factCheck PENDING), theo phiếu docs/content/checks/2026-10-15/<slug>.md. Nội dung chính
 * xác → SỬA, GIỮ PUBLISHED: gắn 5 nguồn, 3 link nội bộ, Đọc thêm, sửa câu Op-Amp, viết hoa kiểu câu.
 *
 *   npm run corrections:1015b              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1015b -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED trong lúc sửa; byline duyệt + factCheck PASSED do người ký
 * (scripts/pass-factcheck-2026-10-15.ts). SEO/entity/link vào: phiếu mục E.
 */
runCorrections([MACH_DIEN]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
