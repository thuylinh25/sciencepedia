import { runCorrections } from "./lib/corrections";
import { SONG_DIEN_TU } from "./data/corrections-1009c/song-dien-tu";
import { THOI_TIET } from "./data/corrections-1009c/thoi-tiet";

/**
 * Đính chính 2 bài đăng qua form /admin ngày 2026-10-09 với 0 nguồn, theo phiếu
 * docs/content/checks/2026-10-09/<slug>.md (mục D, nguyên văn).
 *
 *   npm run corrections:1009c              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009c -- --write   # thực thi
 *
 * Quyết định của chủ sản phẩm (2026-10-09): cả hai bài GIỮ PUBLISHED trong lúc sửa (quy tắc
 * chung, dù phiếu thời tiết khuyến nghị DRAFT). Bài thời tiết giữ danh mục Sinh học, lưu ý y tế
 * đặt trong thân bài (phương án a của phiếu). Số liệu tần số/công suất trong bài sóng điện từ
 * là số của Mỹ, ghi rõ "ở Mỹ".
 */
runCorrections([SONG_DIEN_TU, THOI_TIET]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
