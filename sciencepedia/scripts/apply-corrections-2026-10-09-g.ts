import { runCorrections } from "./lib/corrections";
import { DI_TRUYEN } from "./data/corrections-1009g/di-truyen";
import { LINK_DI_TRUYEN, LINK_THIET_KE } from "./data/corrections-1009g/lien-quan";
import { THIET_KE } from "./data/corrections-1009g/thiet-ke";

/**
 * Đính chính hai bài đăng qua /admin 2026-10-09 với 0 nguồn: "Bí ẩn di truyền" và "Bản thiết kế
 * chung của sự sống", theo phiếu docs/content/checks/2026-10-09/<slug>.md, kèm link vào cho cả hai.
 *
 *   npm run corrections:1009g              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009g -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED trong lúc sửa; byline duyệt do người ký.
 */
runCorrections([DI_TRUYEN, THIET_KE, LINK_DI_TRUYEN, LINK_THIET_KE]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
