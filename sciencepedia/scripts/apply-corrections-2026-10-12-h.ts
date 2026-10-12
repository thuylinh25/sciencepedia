import { runCorrections } from "./lib/corrections";
import { THUAT_NGU_THIEU_MAU } from "./data/corrections-1012/thuat-ngu-thieu-mau";

/**
 * Gắn mục từ "Hồng cầu", "Hemoglobin" vào bài hội chứng thiếu máu (sửa chữ, không đổi claim).
 *
 *   npm run corrections:1012h              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012h -- --write   # thực thi
 */
runCorrections([THUAT_NGU_THIEU_MAU]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
