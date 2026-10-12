import { runCorrections } from "./lib/corrections";
import { THUAT_NGU_VU_TRU } from "./data/corrections-1012/thuat-ngu-vu-tru";

/**
 * Gắn mục từ "Nón ánh sáng", "Bức xạ nền vi sóng vũ trụ" vào bài nón ánh sáng quá khứ (sửa chữ, không đổi claim).
 *
 *   npm run corrections:1012d              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012d -- --write   # thực thi
 */
runCorrections([THUAT_NGU_VU_TRU]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
