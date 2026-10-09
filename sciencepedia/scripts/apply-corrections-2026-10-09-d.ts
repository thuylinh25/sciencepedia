import { runCorrections } from "./lib/corrections";
import { CAI_CHET } from "./data/corrections-1009d/cai-chet";
import { BAT_TU_THUAT_NGU, LINK_TEXT } from "./data/corrections-1009d/lien-quan";

/**
 * Đính chính bài "Cái chết dưới góc nhìn tiến hóa" theo phiếu
 * docs/content/checks/2026-10-09/cai-chet-duoi-goc-nhin-tien-hoa-…md (bản vi + en), cùng các sửa đi kèm.
 *
 *   npm run corrections:1009d              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009d -- --write   # thực thi
 *
 * Quyết định của chủ sản phẩm (2026-10-09):
 *   1. Gỡ byline duyệt + factCheck về PENDING (`clearReview`): byline cũ ký cho bản có lỗi A1.
 *      Bài giữ PUBLISHED. Ký lại do người chạy scripts/pass-factcheck-*.ts sau khi đọc bản mới.
 *   2. Thuật ngữ cho cả kho: "tích lũy đột biến", "đa hiệu đối kháng" — áp cho bài này và bài bất tử.
 *   3. Đổi tiêu đề (slug giữ): "Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?";
 *      link text ở 4 bài trỏ vào đổi theo.
 */
runCorrections([CAI_CHET, BAT_TU_THUAT_NGU, ...LINK_TEXT]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
