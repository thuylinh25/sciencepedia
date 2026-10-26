import { runCorrections } from "./lib/corrections";
import { NHAN_ROI } from "./data/corrections-1026c/khi-bo-nao-ranh-roi";

/**
 * Đính chính 'Khi bộ não "rảnh rỗi"…' theo phiếu
 * docs/content/checks/2026-10-26/khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi.md.
 * SỬA, giữ PUBLISHED. factCheck + byline giữ nguyên — người duyệt ký sau khi đọc bản đã sửa.
 *
 *   npm run corrections:1026c              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1026c -- --write   # thực thi
 */
runCorrections([NHAN_ROI]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
