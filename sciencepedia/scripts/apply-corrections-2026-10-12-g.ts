import { runCorrections } from "./lib/corrections";
import { THIEU_MAU } from "./data/corrections-1012/thieu-mau";

/**
 * Đính chính bài đăng qua /admin 2026-10-12 với 0 nguồn: "Hội chứng thiếu máu", theo phiếu docs/content/checks/2026-10-12/<slug>.md. Bài giữ PUBLISHED; byline do người ký.
 *
 *   npm run corrections:1012g              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012g -- --write   # thực thi
 */
runCorrections([THIEU_MAU]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
