import { runCorrections } from "./lib/corrections";
import { THUAT_NGU_KHUC_XA } from "./data/corrections-1012/thuat-ngu";

/**
 * Gắn mục từ "Khúc xạ" vào bài lấp lánh của sao (sửa chữ, không đổi claim).
 *
 *   npm run corrections:1012b              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012b -- --write   # thực thi
 */
runCorrections([THUAT_NGU_KHUC_XA]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
