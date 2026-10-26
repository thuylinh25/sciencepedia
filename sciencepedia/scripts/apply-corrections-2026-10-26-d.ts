import { runCorrections } from "./lib/corrections";
import { NHAN_ROI_D } from "./data/corrections-1026d/khi-bo-nao-ranh-roi";

/**
 * Touch-up 1026d cho 'Khi bộ não "rảnh rỗi"…' sau 1026c (phiếu mục F).
 * SỬA, giữ PUBLISHED. factCheck + byline giữ nguyên.
 *
 *   npm run corrections:1026d              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1026d -- --write   # thực thi
 */
runCorrections([NHAN_ROI_D]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
