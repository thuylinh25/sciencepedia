import { runCorrections } from "./lib/corrections";
import { BIG_BOUNCE } from "./data/corrections-1014/big-bounce";
import { DIEM_KY_DI } from "./data/corrections-1014/diem-ky-di";
import { NAO_BO_DIEN } from "./data/corrections-1014/nao-bo-dien";

/**
 * Đính chính ba bài đăng qua /admin 2026-10-14 với 0 nguồn: "Điểm kỳ dị của hố đen", "Từ Big Bang
 * đến Big Bounce", "Vì sao não bộ tạo ra điện?", theo phiếu docs/content/checks/2026-10-14/<slug>.md.
 * Hai bài vật lý link sang nhau, nên mỗi bài có một link vào từ bài PUBLISHED sau đợt này.
 *
 *   npm run corrections:1014              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1014 -- --write   # thực thi
 *
 * Quy tắc chủ sản phẩm: bài giữ PUBLISHED trong lúc sửa; byline duyệt do người ký.
 */
runCorrections([DIEM_KY_DI, BIG_BOUNCE, NAO_BO_DIEN]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
