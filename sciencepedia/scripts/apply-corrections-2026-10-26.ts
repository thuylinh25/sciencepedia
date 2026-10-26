import { runCorrections } from "./lib/corrections";
import { LONG_DUNG_CAM_EN } from "./data/corrections-1026/long-dung-cam-va-su-to-mo-en";

/**
 * Thêm bản EN cho "Lòng dũng cảm và sự tò mò" theo phiếu docs/content/checks/2026-10-26/<slug>.md.
 * Chủ sản phẩm chốt 2026-10-26: thẩm định luôn gọi skill translation — bài này thẩm định 23/10 khi
 * quy tắc chưa có, nên bù riêng. Bài giữ PUBLISHED, bản VI và byline không đổi.
 *
 *   npm run corrections:1026              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1026 -- --write   # thực thi
 */
runCorrections([LONG_DUNG_CAM_EN]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
