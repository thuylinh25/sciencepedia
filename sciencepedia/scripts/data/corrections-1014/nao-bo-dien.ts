import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-14/vi-sao-nao-bo-tao-ra-dien.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; chuỗi TÌM là văn bản hiện tại của bài. Đổi tên
 * mục theo bảng D8. "Đọc thêm" (D10) do engine thêm. Bài GIỮ PUBLISHED, chưa có byline → không
 * clearReview. seoTitle/seoDescription/seoKeywords giữ. Ghi công (trường vi đang rỗng — engine không
 * điền được) và alt ảnh bìa: phiếu mục E, sửa qua form /admin.
 */

const SLUG = "vi-sao-nao-bo-tao-ra-dien";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-14", `${SLUG}.md`), "utf8"));

const ARROW = '<div style="font-size:24px;color:#64748b">↓</div>';
const DIAGRAM_OLD = [
  '<div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;text-align:center">',
  "<strong>Ion tích điện</strong>", ARROW,
  "<strong>Chênh lệch điện thế</strong>", ARROW,
  "<strong>Xung thần kinh</strong>", ARROW,
  "<strong>Trao đổi thông tin giữa các nơron</strong>",
  "</div>",
].join("\n\n");

export const NAO_BO_DIEN: Plan = {
  slug: SLUG,
  note: "Trước đính chính 14/10: phiếu thẩm định 2026-10-14 (A1–A3: 0 nguồn; bài cụt ở câu cuối; mô hình 'nơron giao tiếp bằng điện' bỏ bước hóa học ở synapse; B1–B6: bơm natri–kali, ngưỡng -50 mV + pha hồi cực, bỏ tốc độ dẫn truyền không nguồn, 86 tỷ nơron, năng lượng cho truyền tin không phải 'không dùng để suy nghĩ', EEG cộng gộp dòng synapse + bỏ danh sách 5 dải sóng không nguồn, viết hoa kiểu câu)",
  reverifyMonths: 36,
  forbid: [
    "bên trong não bộ của", "cộng hưởng", "không dùng để \"suy nghĩ\"", "vài mét mỗi giây", "Sóng Gamma",
    "```text", "Mỗi giây, hàng tỷ nơron", "Kết Luận",
  ],
  fixes: [
    { field: "title", find: "Vì Sao Não Bộ Tạo Ra Điện?", replace: D.D0, why: "B6 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    {
      field: "summary",
      find: "Mỗi suy nghĩ, ký ức, cảm xúc hay chuyển động của cơ thể đều bắt nguồn từ các tín hiệu điện bên trong não. Trên thực tế, bộ não không chỉ xử lý thông tin bằng hóa chất mà còn hoạt động như một mạng lưới điện sinh học cực kỳ phức tạp.",
      replace: D.D1,
      why: "A3 (D1): nơron dùng cả tín hiệu điện lẫn hóa học (NINDS).",
    },
    { field: "content", find: DIAGRAM_OLD, replace: D.D2, why: "A3 (D2): sơ đồ nối thẳng xung thần kinh sang giao tiếp giữa nơron, bỏ synapse hóa học." },
    {
      field: "content",
      find: "Tế bào duy trì trạng thái này nhờ các \"máy bơm ion\" liên tục vận chuyển natri và kali qua màng tế bào, giống như sạc một cục pin nhỏ.",
      replace: D.D3,
      why: "B1 (D3): điện thế nghỉ từ ion qua kênh và bơm; bơm giữ chênh lệch nồng độ (StatPearls).",
    },
    { field: "content", section: "## Xung Thần Kinh Được Tạo Ra Như Thế Nào?", replace: D.D4, why: "A3, B2 (D4): ngưỡng -50 mV (QBI), hồi cực bằng kali (StatPearls), chất dẫn truyền ở synapse; bỏ tốc độ không nguồn." },
    { field: "content", section: "## Vì Sao Não Cần Điện?", replace: D.D5, why: "B3 (D5): bỏ văn mục đích luận và 'hàng tỷ nơron mỗi giây'; 86 tỷ nơron (Azevedo 2009)." },
    { field: "content", section: "## Não Bộ Tiêu Thụ Bao Nhiêu Năng Lượng?", replace: D.D6, why: "B4 (D6): 2%/20% (Herculano-Houzel 2011); 47/34/13% (Attwell & Laughlin 2001)." },
    { field: "content", section: "## Tại Sao Có Thể Đo Được Điện Não?", replace: D.D7, why: "B5 (D7): cộng gộp, dòng synapse là đóng góp chính (Buzsáki 2012); EEG cho động kinh, rối loạn giấc ngủ, viêm não (NHS)." },
    { field: "content", find: "## Não Bộ Không Tạo Điện Theo Cách Chúng Ta Vẫn Nghĩ\n", replace: "## Não bộ không tạo điện theo cách chúng ta vẫn nghĩ\n", why: "B6 (D8): viết hoa kiểu câu." },
    { field: "content", find: "## Điện Thế Nghỉ: Pin Sinh Học Của Tế Bào Thần Kinh\n", replace: "## Điện thế nghỉ: pin sinh học của tế bào thần kinh\n", why: "B6 (D8): viết hoa kiểu câu." },
    { field: "content", find: "## Não Bộ Có Thể Hoạt Động Nếu Không Có Điện Không?\n", replace: "## Não bộ có thể hoạt động nếu không có điện không?\n", why: "B6 (D8): viết hoa kiểu câu." },
    { field: "content", section: "## Kết Luận", replace: D.D9, why: "A2, A3 (D9): bài cụt ở câu cuối; thêm bước hóa học ở synapse." },
  ],
  reading: [
    ["GABA: \"Bộ phanh\" của não có khiến bạn lờ đờ, uể oải?", "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai"],
    ["Thuốc gây mê đã \"tắt\" ý thức của bạn như thế nào?", "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao"],
    ["Khi tim ngừng đập: Điều gì thực sự xảy ra với cơ thể khi chúng ta chết?", "khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet"],
    ["Vì sao chúng ta không thể nhớ những năm tháng đầu đời?", "vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi"],
  ],
  sources: [
    { title: "Brain Basics: The Life and Death of a Neuron", publisher: "NINDS — National Institutes of Health", url: "https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-life-and-death-neuron", year: 2026, tier: 2 },
    { title: "Action potentials and synapses", publisher: "Queensland Brain Institute — University of Queensland", url: "https://qbi.uq.edu.au/brain-basics/brain/brain-physiology/action-potentials-and-synapses", year: 2026, tier: 2 },
    { title: "Physiology, Resting Potential", publisher: "StatPearls Publishing", url: "https://europepmc.org/article/MED/30855922", year: 2023, tier: 2 },
    { title: "Physiology, Action Potential", publisher: "StatPearls Publishing", url: "https://europepmc.org/article/MED/30844170", year: 2023, tier: 2 },
    { title: "Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain", publisher: "Journal of Comparative Neurology", doi: "10.1002/cne.21974", year: 2009, tier: 1 },
    { title: "Scaling of Brain Metabolism with a Fixed Energy Budget per Neuron", publisher: "PLoS ONE", doi: "10.1371/journal.pone.0017514", year: 2011, tier: 1 },
    { title: "An Energy Budget for Signaling in the Grey Matter of the Brain", publisher: "Journal of Cerebral Blood Flow & Metabolism", doi: "10.1097/00004647-200110000-00001", year: 2001, tier: 1 },
    { title: "The origin of extracellular fields and currents — EEG, ECoG, LFP and spikes", publisher: "Nature Reviews Neuroscience", doi: "10.1038/nrn3241", year: 2012, tier: 1 },
    { title: "EEG (electroencephalogram)", publisher: "NHS", url: "https://www.nhs.uk/tests-and-treatments/electroencephalogram/", year: 2026, tier: 2 },
  ],
};
