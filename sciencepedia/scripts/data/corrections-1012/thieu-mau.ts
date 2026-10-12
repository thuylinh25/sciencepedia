import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-12/hoi-chung-thieu-mau-khi-co-the-van-hanh-nhu-mot-cai-cay-thieu-nuoc.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; "Đọc thêm" (D10) do engine thêm từ `reading`.
 * Bài GIỮ PUBLISHED, chưa có byline → không clearReview. summary, seoTitle, seoDescription, seoKeywords giữ.
 */

const SLUG = "hoi-chung-thieu-mau-khi-co-the-van-hanh-nhu-mot-cai-cay-thieu-nuoc";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-12", `${SLUG}.md`), "utf8"));

export const THIEU_MAU: Plan = {
  slug: SLUG,
  note: "Trước đính chính 12/10: phiếu thẩm định 2026-10-12 (A1–A5: 0 nguồn; bỏ cơ chế tự thêm 'cơ chuyển kỵ khí → acid lactic → chuột rút → mệt', 'triệu chứng thần kinh sớm nhất', số não 2%/20% chưa kiểm; thêm cảnh báo sắt của NHLBI/NHS; thêm mục Khi nào nên đi khám; dấu hiệu riêng của thiếu sắt tách khỏi triệu chứng chung; B1–B5: nhóm bệnh mạn tính, suy tuỷ, bảng, viết hoa kiểu câu)",
  reverifyMonths: 24,
  forbid: ["acid lactic", "Chuột rút", "sớm nhất", "2% trọng lượng", "Phì đại cơ tim", "Tóc khô", "ty thể", "Kết Luận", "Tổn thương đa cơ quan", "🌿", "🩸"],
  fixes: [
    { field: "title", find: "Hội Chứng Thiếu Máu: Khi Cơ Thể Vận Hành Như Một \"Cái Cây Thiếu Nước\"", replace: D.D0, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "content", section: "## 1. Sự Tương Đồng Giữa Dòng Nước Và Dòng Máu", replace: D.D2, why: "B4 (D2): giữ phép so sánh ở mức hình ảnh; hemoglobin, hồng cầu, thiếu oxy → mệt theo NHLBI." },
    { field: "content", section: "## Bảng So Sánh: Cây Thiếu Nước Và Người Thiếu Máu", replace: D.D3, why: "B3, B5 (D3): bỏ 'tổn thương đa cơ quan', chi tiết thực vật không nguồn, emoji." },
    { field: "content", section: "## 2. Điều Gì Xảy Ra Khi Các Mô Thiếu Oxy?", replace: D.D4, why: "A2 (D4): bỏ cơ chế kỵ khí/acid lactic/chuột rút, 'sớm nhất', 'ưu tiên theo thứ tự', số 2%/20%; triệu chứng tim, não theo NHLBI và NHS." },
    { field: "content", section: "## 3. Các Dấu Hiệu Thường Gặp Của Thiếu Máu", replace: D.D5, why: "A5 (D5): triệu chứng chung theo NHLBI; dấu hiệu ít gặp của thiếu sắt theo NHS, tách riêng." },
    { field: "content", section: "## 4. Những Nguyên Nhân Chính Gây Thiếu Máu", replace: D.D6, why: "B1, B2 (D6): thêm nhóm bệnh mạn tính, hấp thu kém, NSAID; suy tuỷ ảnh hưởng cả ba dòng tế bào (NHLBI)." },
    { field: "content", section: "## Tại Sao Chỉ Bổ Sung Sắt Không Phải Lúc Nào Cũng Đúng?", replace: D.D7, why: "A3 (D7): thừa sắt hại cơ quan (NHLBI); quá liều sắt ở trẻ có thể tử vong (NHS); thiếu máu nhẹ có thể không cần điều trị." },
    { field: "content", before: "## Kết Luận", insert: D.D8, why: "A4 (D8): Khi nào nên đi khám theo NHS, NHLBI; dấu hiệu gọi cấp cứu khi đau ngực (NHS)." },
    { field: "content", section: "## Kết Luận", replace: D.D9, why: "B3 (D9): bỏ 'phản ánh khá chính xác', 'cuối cùng là tổn thương cơ quan'." },
  ],
  reading: [
    ["Khi tim ngừng đập: Điều gì thực sự xảy ra với cơ thể khi chúng ta chết?", "khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet"],
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    ["Biến động thời tiết và hệ tim mạch: vì sao thời tiết có thể ảnh hưởng đến huyết áp?", "bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap"],
  ],
  sources: [
    { title: "What Is Anemia?", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia", year: 2022, tier: 2 },
    { title: "Anemia — Causes and Risk Factors", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/causes", year: 2025, tier: 2 },
    { title: "Anemia — Symptoms", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/symptoms", year: 2022, tier: 2 },
    { title: "Anemia — Treatment and Management", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/treatment", year: 2026, tier: 2 },
    { title: "Iron-Deficiency Anemia", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia", year: 2026, tier: 2 },
    { title: "Hemolytic Anemia", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/hemolytic-anemia", year: 2026, tier: 2 },
    { title: "Aplastic Anemia", publisher: "National Heart, Lung, and Blood Institute (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia/aplastic-anemia", year: 2026, tier: 2 },
    { title: "Iron deficiency anaemia", publisher: "NHS", url: "https://www.nhs.uk/conditions/iron-deficiency-anaemia/", year: 2026, tier: 2 },
    { title: "Chest pain", publisher: "NHS", url: "https://www.nhs.uk/symptoms/chest-pain/", year: 2026, tier: 2 },
  ],
};
