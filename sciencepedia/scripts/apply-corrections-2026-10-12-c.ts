import { runCorrections } from "./lib/corrections";
import { NON_ANH_SANG } from "./data/corrections-1012/non-anh-sang";

/**
 * Đính chính bài đăng qua /admin 2026-10-12 với 0 nguồn: "Nón ánh sáng quá khứ: bản chất vật lý
 * của việc quan sát vũ trụ", theo phiếu docs/content/checks/2026-10-12/<slug>.md.
 *
 *   npm run corrections:1012c              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1012c -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED trong lúc sửa; byline duyệt do người ký.
 */
runCorrections([NON_ANH_SANG]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
