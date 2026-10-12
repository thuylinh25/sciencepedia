import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-12/che-do-khan-cap-man-tinh-co-che-sinh-hoc-tu-cang-thang-den-benh-tat.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; "Đọc thêm" (D13) do engine thêm từ `reading`.
 * Bài GIỮ PUBLISHED, chưa có byline → không clearReview. seoTitle giữ.
 * Ảnh bìa (giấy phép iStock) và alt: phiếu mục E, cần người.
 */

const SLUG = "che-do-khan-cap-man-tinh-co-che-sinh-hoc-tu-cang-thang-den-benh-tat";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-12", `${SLUG}.md`), "utf8"));

const SUMMARY_OLD =
  "Trong sinh học tiến hóa, phản ứng căng thẳng (stress response) hay \"chiến đấu hoặc bỏ chạy\" (fight-or-flight) là cơ chế giúp cơ thể đối phó nhanh với các mối đe dọa và tăng khả năng sống sót.\n\n" +
  "Tuy nhiên, khi bị kích hoạt liên tục trong thời gian dài, cơ chế này có thể trở thành nguyên nhân dẫn đến nhiều bệnh lý mãn tính.";

export const KHAN_CAP: Plan = {
  slug: SLUG,
  note: "Trước đính chính 12/10: phiếu thẩm định 2026-10-12 (A1–A6: 0 nguồn; adrenaline gán cho trục HPA → nhánh giao cảm, HPA là nhánh thứ hai; chuỗi cortisol→kháng insulin→tiểu đường và adrenaline→xơ vữa viết như đã biết → 'góp phần', theo tổng quan; kết quả trên chuột kể như ở người; 'cơ thể được thiết kế'; thêm mục Khi nào nên đi khám theo NIMH; B1–B6: cortisol, số thời gian không nguồn, đề kháng thụ thể glucocorticoid, Selye trên chuột + gánh nặng thích nghi, 'mạn tính', alt)",
  reverifyMonths: 24,
  forbid: [
    "mãn tính", "Mãn Tính", "được thiết kế", "thành công nhất", "Kết quả cuối cùng", "tổn thương vi thể",
    "Vài phút đến vài giờ", "tiểu đường tuýp", "Tiểu đường tuýp", "kháng Cortisol", "Noradrenaline",
  ],
  fixes: [
    { field: "title", find: "Chế Độ Khẩn Cấp Mãn Tính: Cơ Chế Sinh Học Từ Căng Thẳng Đến Bệnh Tật", replace: D.D0, why: "B5 (D0): 'mạn tính' theo đa số kho; viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "summary", find: SUMMARY_OLD, replace: D.D1, why: "A3 (D1): 'trở thành nguyên nhân' → 'góp phần làm tăng nguy cơ'." },
    { field: "content", section: "## 1. Hệ Thống Báo Động Sinh Học Của Cơ Thể", replace: D.D2, why: "A2, B1 (D2): hạch hạnh nhân → vùng dưới đồi; adrenaline qua giao cảm; HPA là nhánh thứ hai, CRH → ACTH → cortisol (Harvard Health); khớp bài stress PASSED." },
    { field: "content", section: "## 2. Tại Sao Căng Thẳng Ngắn Hạn Có Lợi?", replace: D.D3, why: "A5, B2 (D3): bỏ 'cơ thể được thiết kế' và số 'vài phút đến vài giờ'; tiến hóa như cơ chế sinh tồn, đối giao cảm là 'chân phanh' (Harvard)." },
    { field: "content", section: "## 3. Điều Gì Xảy Ra Khi Cơ Thể Không Thể \"Tắt Báo Động\"?", replace: D.D4, why: "D4: phản ứng quá mức với tác nhân không đe dọa tính mạng (Harvard, NIMH); allostasis và gánh nặng thích nghi (McEwen 2017)." },
    { field: "content", section: "## Suy Giảm Hệ Miễn Dịch Và Viêm Mãn Tính", replace: D.D5, why: "B3 (D5): đề kháng thụ thể glucocorticoid theo Cohen 2012; danh sách bệnh theo Furman 2019; bỏ 'tổn thương vi thể'." },
    { field: "content", section: "## Rối Loạn Tim Mạch Và Chuyển Hóa", replace: D.D6, why: "A3 (D6): Harvard cho adrenaline/cortisol; Kivimäki & Steptoe 2018 (tác hại ở người lớn ít rõ hơn, vai trò châm ngòi); Hackett & Steptoe 2017 (đái tháo đường: bằng chứng đang tích lũy)." },
    { field: "content", section: "## Tổn Thương Não Bộ", replace: D.D7, why: "A4 (D7): kết quả hồi hải mã/hạch hạnh nhân là trên chuột, tùy kiểu căng thẳng (Vyas 2002); ở người tùy thời điểm và thời gian (Lupien 2009; McEwen 2016, 2017)." },
    { field: "content", section: "## Bảng So Sánh Căng Thẳng Cấp Tính Và Căng Thẳng Mãn Tính", replace: D.D8, why: "A3, A4, B2 (D8): bỏ số thời gian và 'kết quả cuối cùng: bệnh tật và suy kiệt'." },
    { field: "content", section: "## 4. Từ Thích Nghi Đến Kiệt Quệ: Mô Hình Của Hans Selye", replace: D.D9, why: "B4 (D9): ba giai đoạn theo Rochette 2023, rút từ thí nghiệm trên chuột; bỏ phần 'con người cảm nhận…' tự thêm; cách nhìn hiện nay (McEwen 2017)." },
    { field: "content", section: "## Cơ Thể Cần Điều Gì Để Phục Hồi?", replace: D.D10, why: "A6 (D10): danh sách theo NIMH; bỏ 'tác động trực tiếp đến hệ thần kinh, nội tiết và miễn dịch' (không nguồn)." },
    { field: "content", before: "## Kết Luận", insert: D.D11, why: "A6 (D11): mục Khi nào nên đi khám theo NIMH — bắt buộc với bài có lời khuyên tự làm." },
    { field: "content", section: "## Kết Luận", replace: D.D12, why: "A3, A5 (D12): bỏ 'không được thiết kế', 'thành công nhất'; 'góp phần làm tăng nguy cơ'." },
    {
      field: "seoDescription",
      find: "Bài viết giải thích cơ chế sinh học của phản ứng căng thẳng, tác động của cortisol kéo dài và lý do căng thẳng mãn tính có thể dẫn đến nhiều bệnh lý.",
      replace: D.D14,
      why: "A3, B5 (D14).",
    },
    {
      field: "seoKeywords",
      find: "căng thẳng mãn tính, cortisol, trục HPA, phản ứng stress, sinh lý căng thẳng, hệ miễn dịch, tác hại của stress",
      replace: D.D15,
      why: "B5 (D15): 'mạn tính'; khớp nội dung mới.",
    },
  ],
  reading: [
    ["Những \"sứ giả hóa học\" điều khiển hoạt động của não bộ", "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo"],
    ["Thiếu ngủ: Khoản nợ thế chấp bằng sức khỏe và tương lai", "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai"],
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    ["Ruột, hệ vi sinh vật và quyền lực của bộ não thứ hai", "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai"],
  ],
  sources: [
    { title: "Chronic stress, glucocorticoid receptor resistance, inflammation, and disease risk", publisher: "Proceedings of the National Academy of Sciences 109:5995–5999 (Cohen S, Janicki-Deverts D, Doyle WJ et al.)", doi: "10.1073/pnas.1118355109", year: 2012, tier: 1 },
    { title: "Chronic inflammation in the etiology of disease across the life span", publisher: "Nature Medicine 25:1822–1832 (Furman D, Campisi J, Verdin E et al.)", doi: "10.1038/s41591-019-0675-0", year: 2019, tier: 1 },
    { title: "Type 2 diabetes mellitus and psychological stress — a modifiable risk factor", publisher: "Nature Reviews Endocrinology 13:547–560 (Hackett RA, Steptoe A)", doi: "10.1038/nrendo.2017.64", year: 2017, tier: 1 },
    { title: "Effects of stress on the development and progression of cardiovascular disease", publisher: "Nature Reviews Cardiology 15:215–229 (Kivimäki M, Steptoe A)", doi: "10.1038/nrcardio.2017.189", year: 2018, tier: 1 },
    { title: "Chronic Stress Induces Contrasting Patterns of Dendritic Remodeling in Hippocampal and Amygdaloid Neurons", publisher: "The Journal of Neuroscience 22:6810–6818 (Vyas A, Mitra R, Shankaranarayana Rao BS, Chattarji S)", doi: "10.1523/jneurosci.22-15-06810.2002", year: 2002, tier: 1 },
    { title: "Stress Effects on Neuronal Structure: Hippocampus, Amygdala, and Prefrontal Cortex", publisher: "Neuropsychopharmacology 41:3–23 (McEwen BS, Nasca C, Gray JD)", doi: "10.1038/npp.2015.171", year: 2016, tier: 1 },
    { title: "Effects of stress throughout the lifespan on the brain, behaviour and cognition", publisher: "Nature Reviews Neuroscience 10:434–445 (Lupien SJ, McEwen BS, Gunnar MR, Heim C)", doi: "10.1038/nrn2639", year: 2009, tier: 1 },
    { title: "Neurobiological and Systemic Effects of Chronic Stress", publisher: "Chronic Stress 1 (McEwen BS)", doi: "10.1177/2470547017692328", year: 2017, tier: 1 },
    { title: "Stress: Eight Decades after Its Definition by Hans Selye: \"Stress Is the Spice of Life\"", publisher: "Brain Sciences 13:310 (Rochette L, Dogon G, Vergely C)", doi: "10.3390/brainsci13020310", year: 2023, tier: 1 },
    { title: "Understanding the stress response", publisher: "Harvard Health Publishing — Harvard Medical School", url: "https://www.health.harvard.edu/staying-healthy/understanding-the-stress-response", year: 2026, tier: 2 },
    { title: "I'm So Stressed Out! Fact Sheet", publisher: "National Institute of Mental Health (NIMH)", url: "https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet", year: 2026, tier: 2 },
  ],
};
