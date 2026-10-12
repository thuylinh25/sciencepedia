import { runCorrections } from "./lib/corrections";
import { KHAN_CAP } from "./data/corrections-1012/khan-cap";

/**
 * Đính chính bài đăng qua /admin 2026-10-12 với 0 nguồn: "Chế độ khẩn cấp mạn tính", theo phiếu docs/content/checks/2026-10-12/<slug>.md. Bài giữ PUBLISHED; byline do người ký.
 *
 *   npm run corrections:1012e              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012e -- --write   # thực thi
 */
runCorrections([KHAN_CAP]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
