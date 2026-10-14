import { runCorrections } from "./lib/corrections";
import { THUAT_NGU } from "./data/corrections-1014/thuat-ngu";

/**
 * Thống nhất thuật ngữ toàn kho, chủ sản phẩm chốt 2026-10-14: nơron · hố đen · lý thuyết dây.
 * Sửa chữ, không đổi claim (`minor`) — byline duyệt và factCheck giữ nguyên.
 *
 *   npm run corrections:1014b              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1014b -- --write   # thực thi
 */
runCorrections(THUAT_NGU).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
