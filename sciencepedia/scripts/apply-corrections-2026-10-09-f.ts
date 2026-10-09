import { runCorrections } from "./lib/corrections";
import { THAN_CHI } from "./data/corrections-1009f/than-chi";

/**
 * Thống nhất thuật ngữ "than chì" (chủ sản phẩm chốt 2026-10-09).
 *
 *   npm run corrections:1009f              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009f -- --write   # thực thi
 */
runCorrections([THAN_CHI]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
