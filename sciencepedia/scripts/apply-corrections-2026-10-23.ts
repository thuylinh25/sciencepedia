import { runCorrections } from "./lib/corrections";
import { LONG_DUNG_CAM } from "./data/corrections-1023/long-dung-cam-va-su-to-mo";

/**
 * Đính chính bài "Lòng dũng cảm và sự tò mò: điều gì đưa loài người đến các vì sao?" theo phiếu
 * docs/content/checks/2026-10-23/<slug>.md. Bài giữ PUBLISHED; không đổi luận điểm, chỉ sửa 2 câu
 * cho khớp nguồn + gắn 5 nguồn + 5 link nội bộ + Đọc thêm + viết hoa tiêu đề → byline GIỮ (vẫn chưa
 * có người duyệt; factCheck vẫn PENDING, người ký qua scripts/pass-factcheck-2026-10-23.ts).
 *
 *   npm run corrections:1023              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1023 -- --write   # thực thi
 */
runCorrections([LONG_DUNG_CAM]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
