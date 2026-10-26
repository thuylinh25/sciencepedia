import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-26/khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi.md
 * SỬA, giữ PUBLISHED. Bài đăng thẳng qua form: 0 nguồn, factCheck PENDING, chưa có EN.
 * Gỡ sơ đồ nhân quả không nguồn (khối <div> lead A3 + khối ```text A4), bỏ câu mục đích luận (A2),
 * hạ mức chắc chắn DMN→rumination về "liên hệ" (A5, Zhou 2020 chỉ khẳng định association), thêm mục
 * "Khi nào nên đi khám" (A6, NHS), gắn 7 nguồn bậc 1–2 + 3 link nội bộ + "Đọc thêm", viết hoa kiểu
 * câu, và điền bản EN (dịch từ bản VI SAU đính chính). Văn thay lấy NGUYÊN VĂN mục D của phiếu.
 * factCheck + byline GIỮ NGUYÊN — người duyệt ký sau khi đọc bản đã sửa (scripts/pass-factcheck-*).
 */

const SLUG = "khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi";
const D = extractD(
  readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-26", `${SLUG}.md`), "utf8"),
);

const LEAD_DIV =
  '<div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;text-align:center">\n\n' +
  "<strong>Tập trung vào công việc</strong>\n\n" +
  '<div style="font-size:24px;color:#64748b">↓</div>\n\n' +
  "<strong>Xử lý thông tin từ môi trường</strong>\n\n" +
  '<div style="font-size:24px;color:#64748b">↓</div>\n\n' +
  "<strong>Hướng sự chú ý ra bên ngoài</strong>\n\n" +
  '<hr style="margin:15px 0">\n\n' +
  "<strong>Không có nhiệm vụ cụ thể</strong>\n\n" +
  '<div style="font-size:24px;color:#64748b">↓</div>\n\n' +
  "<strong>Mạng lưới mặc định hoạt động</strong>\n\n" +
  '<div style="font-size:24px;color:#64748b">↓</div>\n\n' +
  "<strong>Suy nghĩ hướng nội và hồi tưởng</strong>\n\n" +
  "</div>";

export const NHAN_ROI: Plan = {
  slug: SLUG,
  note: "Trước đính chính 26/10: 0 nguồn, factCheck PENDING; hai sơ đồ nhân quả không nguồn, câu mục đích luận, DMN→rumination áp mức gần nhân quả, thiếu mục 'Khi nào nên đi khám', chưa có EN (phiếu 2026-10-26)",
  fixes: [
    // Tiêu đề bài — viết hoa kiểu câu
    {
      field: "title",
      find: 'Khi Bộ Não "Rảnh Rỗi": Khoa Học Nói Gì Về Mặt Trái Của Sự Nhàn Rỗi?',
      replace: 'Khi bộ não "rảnh rỗi": khoa học nói gì về mặt trái của sự nhàn rỗi?',
      why: "B1 — viết hoa kiểu câu",
    },
    // seoDescription — về mức liên hệ, bỏ "gây ra"
    {
      field: "seoDescription",
      find: "Bài viết giải thích cơ chế thần kinh khi bộ não rảnh rỗi và cách sự nhàn rỗi kéo dài có thể gây ra lo âu hay ảnh hưởng tiêu cực đến sức khỏe tinh thần.",
      replace: "Bài viết giải thích hoạt động của não khi rảnh rỗi và vì sao sự nhàn rỗi kéo dài có thể đi kèm lo âu hoặc ảnh hưởng đến sức khỏe tinh thần ở một số người.",
      why: "B3 — bỏ nhân quả 'gây ra', về mức liên hệ cho khớp thân bài",
    },
    // Lead: thay khối <div> sơ đồ nhân quả không nguồn bằng dẫn nhập văn xuôi
    {
      field: "content",
      find: LEAD_DIV,
      replace: D.D1,
      why: "A3 — gỡ sơ đồ mũi tên trang trí không nguồn ở lead",
    },
    // Thay toàn mục (gồm viết hoa kiểu câu tiêu đề mục)
    {
      field: "content",
      section: "## Mạng Lưới Mặc Định Của Não Bộ",
      replace: D.D2,
      why: "A5 — gắn Raichle 2015; DMN↔rumination viết ở mức 'liên hệ'",
    },
    {
      field: "content",
      section: "## Vì Sao Nhàn Rỗi Có Thể Khiến Chúng Ta Lo Âu?",
      replace: D.D3,
      why: "A2+A5 — bỏ câu mục đích luận; gắn Killingsworth 2010, Zhou 2020 (association)",
    },
    {
      field: "content",
      section: '## Não Bộ Hoạt Động Theo Nguyên Tắc "Dùng Hay Mất"',
      replace: D.D4,
      why: "B2 — gắn nguyên lý tính dẻo phụ thuộc trải nghiệm (Kleim & Jones 2008)",
    },
    {
      field: "content",
      section: "## Tác Động Của Lối Sống Tĩnh Tại",
      replace: D.D5,
      why: "A1 — gắn WHO; thêm link nội bộ vận động + stress",
    },
    {
      field: "content",
      section: "## Quá Nhiều Thời Gian Rảnh Có Đồng Nghĩa Với Hạnh Phúc?",
      replace: D.D6,
      why: "A4 — gỡ khối ```text không nguồn; gắn Sharif 2021",
    },
    {
      field: "content",
      section: "## Làm Gì Để Bộ Não Nghỉ Ngơi Một Cách Lành Mạnh?",
      replace: D.D7,
      why: "B1 — viết hoa kiểu câu; thêm link nội bộ giấc ngủ",
    },
    // Mục mới "Khi nào nên đi khám" trước Kết luận
    {
      field: "content",
      before: "## Kết Luận",
      insert: D.D8,
      why: "A6 — bài sức khoẻ có lời khuyên: bổ sung dấu hiệu khám + khẩn cấp (NHS)",
    },
    // Viết hoa kiểu câu cho tiêu đề mục Kết luận (giữ nguyên thân)
    {
      field: "content",
      find: "## Kết Luận",
      replace: "## Kết luận",
      why: "B1 — viết hoa kiểu câu",
    },
    // Bản EN (điền trường trống), dịch từ bản VI sau đính chính
    { field: "titleEn", fill: D.D9, why: "B4 — bản EN, tiêu đề" },
    { field: "summaryEn", fill: D.D10, why: "B4 — bản EN, tóm tắt" },
    { field: "contentEn", fill: D.D11, why: "B4 — bản EN, toàn bài (gồm 'Further reading')" },
  ],
  reading: [
    ["Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?", "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa"],
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    ["Giấc ngủ sâu làm gì với trí nhớ của bạn", "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban"],
    ["Chế độ khẩn cấp mạn tính: cơ chế sinh học từ căng thẳng đến bệnh tật", "che-do-khan-cap-man-tinh-co-che-sinh-hoc-tu-cang-thang-den-benh-tat"],
  ],
  sources: [
    {
      title: "The Brain's Default Mode Network",
      publisher: "Annual Review of Neuroscience",
      doi: "10.1146/annurev-neuro-071013-014030",
      year: 2015,
      tier: 1,
    },
    {
      title: "Rumination and the default mode network: Meta-analysis of brain imaging studies and implications for depression",
      publisher: "NeuroImage (Elsevier)",
      doi: "10.1016/j.neuroimage.2019.116287",
      year: 2020,
      tier: 1,
    },
    {
      title: "A Wandering Mind Is an Unhappy Mind",
      publisher: "Science (AAAS)",
      doi: "10.1126/science.1192439",
      year: 2010,
      tier: 1,
    },
    {
      title: "Principles of Experience-Dependent Neural Plasticity: Implications for Rehabilitation After Brain Damage",
      publisher: "Journal of Speech, Language, and Hearing Research",
      doi: "10.1044/1092-4388(2008/018)",
      year: 2008,
      tier: 2,
    },
    {
      title: "Having too little or too much time is linked to lower subjective well-being",
      publisher: "Journal of Personality and Social Psychology (APA)",
      doi: "10.1037/pspp0000391",
      year: 2021,
      tier: 1,
    },
    {
      title: "Physical activity (fact sheet) & WHO 2020 Guidelines on physical activity and sedentary behaviour",
      publisher: "World Health Organization",
      url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
      year: 2024,
      tier: 1,
    },
    {
      title: "Generalised anxiety disorder in adults",
      publisher: "NHS",
      url: "https://www.nhs.uk/conditions/generalised-anxiety-disorder/",
      year: 2025,
      tier: 1,
    },
  ],
  forbid: [
    "max-width:500px",
    "Về mặt tiến hóa",
    "```text",
  ],
};
