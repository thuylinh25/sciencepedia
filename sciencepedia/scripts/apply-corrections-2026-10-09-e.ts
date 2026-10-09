import { runCorrections } from "./lib/corrections";
import { KIM_CUONG } from "./data/corrections-1009e/kim-cuong";
import { LINK_VAO } from "./data/corrections-1009e/lien-quan";

/**
 * Đính chính bài "Từ nguyên tử đến kim cương" (đăng qua /admin 2026-10-09, 0 nguồn) theo phiếu
 * docs/content/checks/2026-10-09/tu-nguyen-tu-den-kim-cuong-…md, kèm link vào từ bài nguyên tử.
 *
 *   npm run corrections:1009e              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009e -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED; chính tả theo đa số kho ("hóa"); "than chì" giữ như
 * bài (1 bài PASSED khác dùng "graphit" — chưa chốt, ghi ở phiếu mục E).
 */
runCorrections([KIM_CUONG, LINK_VAO]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
