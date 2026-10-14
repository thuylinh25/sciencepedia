import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-14/tu-big-bang-den-big-bounce-lieu-vu-tru-co-tai-sinh-theo-chu-ky.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; chuỗi TÌM là văn bản hiện tại của bài. Đổi tên
 * mục theo bảng D7. "Đọc thêm" (D9) do engine thêm. Bài GIỮ PUBLISHED, chưa có byline → không
 * clearReview. summary, seoTitle/seoDescription/seoKeywords giữ. Ảnh bìa (nguồn NASA/WMAP?), alt: mục E.
 * Hẹn thẩm định lại 6 tháng: kết quả DESI còn đang diễn ra.
 */

const SLUG = "tu-big-bang-den-big-bounce-lieu-vu-tru-co-tai-sinh-theo-chu-ky";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-14", `${SLUG}.md`), "utf8"));

const ARROW = '<div style="font-size:24px;color:#64748b">↓</div>';
const DIAGRAM_OLD = [
  '<div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;text-align:center">',
  "<strong>Giãn nở</strong>", ARROW,
  "<strong>Cực đại</strong>", ARROW,
  "<strong>Co lại</strong>", ARROW,
  "<strong>Big Bounce</strong>", ARROW,
  '<strong style="color:#2563eb">Chu kỳ mới bắt đầu</strong>',
  "</div>",
].join("\n\n");

export const BIG_BOUNCE: Plan = {
  slug: SLUG,
  note: "Trước đính chính 14/10: phiếu thẩm định 2026-10-14 (A1–A4: 0 nguồn; 'tăng tốc khiến Big Bounce khó xảy ra, thách thức lớn nhất với mô hình tuần hoàn' → tăng tốc nói về tương lai, mô hình Steinhardt–Turok cần pha tăng tốc, DESI 2025; sơ đồ + kết luận gộp Big Bounce với vũ trụ tuần hoàn; 'cơ học lượng tử vòng' → hấp dẫn / vũ trụ học lượng tử vòng; B1–B6: cú nảy theo mật độ không theo kích thước, ρ ≈ 0,41 ρ_Pl, lời giải entropy của các mô hình tuần hoàn, viết hoa kiểu câu)",
  reverifyMonths: 6,
  forbid: [
    "Cơ học lượng tử vòng", "trở nên khó xảy ra hơn", "co đến một giới hạn cực nhỏ", "Chu kỳ mới bắt đầu",
    "thách thức lớn nhất đối với các mô hình tuần hoàn", "Kết Luận",
  ],
  fixes: [
    { field: "title", find: "Từ Big Bang Đến Big Bounce: Liệu Vũ Trụ Có Tái Sinh Theo Chu Kỳ?", replace: D.D0, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "content", find: DIAGRAM_OLD, replace: D.D1, why: "A3 (D1): sơ đồ trình bày vòng tuần hoàn như định nghĩa của Big Bounce; thay bằng đoạn mở tách hai ý." },
    { field: "content", section: "## Big Bounce Là Gì?", replace: D.D2, why: "B1 (D2): cú nảy ở mật độ hữu hạn, không phải kích thước tối thiểu (Ashtekar 2009); link Big Bang, điểm kỳ dị." },
    { field: "content", section: "## Vai Trò Của Hấp Dẫn Lượng Tử", replace: D.D3, why: "A4, B2 (D3): hấp dẫn / vũ trụ học lượng tử vòng; Ashtekar, Pawlowski & Singh 2006; 0,01 và 0,41 ρ_Pl (Ashtekar 2009)." },
    { field: "content", section: "## Vũ Trụ Có Thực Sự Tuần Hoàn?", replace: D.D4, why: "A3, B4 (D4): cú nảy không nhất thiết thành chu kỳ; mô hình Steinhardt–Turok 2002 có pha tăng tốc." },
    { field: "content", section: "## Thách Thức Từ Các Quan Sát Hiện Nay", replace: D.D5, why: "A2 (D5): tăng tốc nói về tương lai; Steinhardt–Turok cần pha tăng tốc; DESI 2025 (Berkeley Lab); 68–70% (NASA)." },
    { field: "content", section: "## Vấn Đề Entropy", replace: D.D6, why: "B3 (D6): lời giải entropy của Steinhardt–Turok 2002 và Ijjas–Steinhardt 2019." },
    { field: "content", find: "## Big Bounce Có Được Chứng Minh Chưa?\n", replace: "## Big Bounce có được chứng minh chưa?\n", why: "B5 (D7): viết hoa kiểu câu." },
    { field: "content", section: "## Kết Luận", replace: D.D8, why: "A3 (D8): bỏ 'chuyển tiếp giữa các chu kỳ' như định nghĩa." },
  ],
  reading: [
    ["Vật chất tối và năng lượng tối: trận chiến \"Kéo co\" vĩ đại của Vũ trụ", "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru"],
    ["Thời gian dưới góc nhìn lượng tử: Vũ trụ có thực sự \"trôi\"?", "thoi-gian-duoi-goc-nhin-luong-tu-vu-tru-co-thuc-su-troi"],
    ["Đa vũ trụ: bốn cấp độ và một câu hỏi khó", "da-vu-tru-bon-cap-do-va-mot-cau-hoi-kho"],
    ["Hố đen: nơi hình học của không gian sụp đổ", "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do"],
  ],
  sources: [
    { title: "Quantum Nature of the Big Bang", publisher: "Physical Review Letters", doi: "10.1103/physrevlett.96.141301", year: 2006, tier: 1 },
    { title: "Loop quantum cosmology: an overview", publisher: "General Relativity and Gravitation", doi: "10.1007/s10714-009-0763-4", year: 2009, tier: 1 },
    { title: "Loop quantum cosmology: a status report", publisher: "Classical and Quantum Gravity", doi: "10.1088/0264-9381/28/21/213001", year: 2011, tier: 1 },
    { title: "Cosmic evolution in a cyclic universe", publisher: "Physical Review D", doi: "10.1103/physrevd.65.126003", year: 2002, tier: 1 },
    { title: "A new kind of cyclic universe", publisher: "Physics Letters B", doi: "10.1016/j.physletb.2019.06.056", year: 2019, tier: 1 },
    { title: "Dictionary: loop quantum gravity", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/loop-quantum-gravity/", year: 2026, tier: 2 },
    { title: "Dictionary: singularity", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/singularity/", year: 2026, tier: 2 },
    { title: "What is Dark Energy? Inside Our Accelerating, Expanding Universe", publisher: "NASA Science", url: "https://science.nasa.gov/dark-energy/", year: 2026, tier: 2 },
    { title: "New DESI Results Strengthen Hints That Dark Energy May Evolve", publisher: "Lawrence Berkeley National Laboratory", url: "https://newscenter.lbl.gov/2025/03/19/new-desi-results-strengthen-hints-that-dark-energy-may-evolve/", year: 2025, tier: 2 },
  ],
};
