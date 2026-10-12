import { runCorrections } from "./lib/corrections";
import { LAP_LANH } from "./data/corrections-1012/lap-lanh";

/**
 * Đính chính bài đăng qua /admin 2026-10-12 với 0 nguồn: "Bí ẩn bầu trời đêm: vì sao ngôi sao lấp
 * lánh còn hành tinh thì không?", theo phiếu docs/content/checks/2026-10-12/<slug>.md.
 *
 *   npm run corrections:1012              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012 -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED trong lúc sửa; byline duyệt do người ký.
 */
runCorrections([LAP_LANH]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
