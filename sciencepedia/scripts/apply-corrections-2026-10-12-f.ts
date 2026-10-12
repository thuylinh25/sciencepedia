import { runCorrections } from "./lib/corrections";
import { THUAT_NGU_KHAN_CAP } from "./data/corrections-1012/thuat-ngu-khan-cap";

/**
 * Gắn mục từ "Hạch hạnh nhân", "Hệ thần kinh tự chủ" vào bài chế độ khẩn cấp mạn tính (sửa chữ, không đổi claim).
 *
 *   npm run corrections:1012f              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012f -- --write   # thực thi
 */
runCorrections([THUAT_NGU_KHAN_CAP]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
