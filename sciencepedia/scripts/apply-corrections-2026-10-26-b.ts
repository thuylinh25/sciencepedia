import { runCorrections } from "./lib/corrections";
import { LOI_HUA } from "./data/corrections-1026b/loi-hua-cua-toan-hoc";

/**
 * Đính chính "Lời hứa của toán học và sự im lặng của vũ trụ" theo phiếu
 * docs/content/checks/2026-10-26/loi-hua-cua-toan-hoc-va-su-im-lang-cua-vu-tru.md.
 * SỬA, giữ PUBLISHED. factCheck + byline giữ nguyên — người duyệt ký sau khi đọc bản đã sửa.
 *
 *   npm run corrections:1026b              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1026b -- --write   # thực thi
 */
runCorrections([LOI_HUA]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
