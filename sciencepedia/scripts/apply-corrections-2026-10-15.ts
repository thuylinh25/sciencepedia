import { runCorrections } from "./lib/corrections";
import { SAO_LAP_LANH } from "./data/corrections-1015/sao-lap-lanh";

/**
 * Đính chính bài "Vì sao ngôi sao lấp lánh còn hành tinh thì không?" — cả VI và EN, theo phiếu
 * docs/content/checks/2026-10-15/<slug>.md. Bài giữ PUBLISHED; đổi claim nên gỡ byline (người ký lại).
 *
 *   npm run corrections:1015              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1015 -- --write   # thực thi
 */
runCorrections([SAO_LAP_LANH]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
