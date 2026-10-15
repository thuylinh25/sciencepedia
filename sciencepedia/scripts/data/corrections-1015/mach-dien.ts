import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-15/tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao.md
 * Bài "Từ Dòng Điện Đến Phép Tính" đăng qua /admin, 0 nguồn, factCheck PENDING, không SEO, 0 link.
 * Nội dung chính xác (không lỗi chặn khoa học) → phán quyết SỬA, GIỮ PUBLISHED. Đính chính chỉ bổ
 * khuyết: gắn 5 nguồn (D không đổi claim), thêm 3 link nội bộ giữa câu (D5–D7), sửa nhẹ câu Op-Amp
 * (D4), đặt SEO (D1–D3), đổi title + 10 tiêu đề mục về viết hoa kiểu câu (D0 + bảng inline B5).
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; chuỗi TÌM là văn bản hiện tại của bài.
 * entity, byline, factCheck PASSED, link vào, giấy phép ảnh Getty: phiếu mục E (cần người/đăng lại).
 */

const SLUG = "tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao";
const D = extractD(
  readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-15", `${SLUG}.md`), "utf8"),
);

export const MACH_DIEN: Plan = {
  slug: SLUG,
  note: "Trước đính chính 15/10: phiếu thẩm định 2026-10-15 (A1: 0 nguồn → 5 nguồn bậc 1–2; B1: câu dẫn Op-Amp bỏ 'mạch chuyên dụng' khiến 'Nhân' quá mức; B2: 0 link nội bộ → 3 link giữa câu; B3: thêm Đọc thêm; B4: SEO trống; B5: title + 10 tiêu đề mục viết hoa kiểu tiêu đề)",
  reverifyMonths: 36,
  forbid: [
    "Từ Dòng Điện Đến Phép Tính",
    "## Máy Tính Kỹ Thuật Số",
    "## Kết Luận",
    "điện trở và tụ điện, Op-Amp",
  ],
  fixes: [
    { field: "title", find: "Từ Dòng Điện Đến Phép Tính: Mạch Điện Làm Toán Như Thế Nào?", replace: D.D0, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    // SEO (D1–D3) KHÔNG đặt ở đây: engine fix find/replace không điền được trường rỗng (null)
    //   — "".split("") = -1 chỗ → ném lỗi. seoTitle/seoDescription/seoKeywords đang null → người đặt
    //   qua form /admin bằng văn bản D1–D3 trong phiếu (mục E).
    { field: "content", find: "Khi kết hợp với điện trở và tụ điện, Op-Amp có thể thực hiện:", replace: D.D4, why: "B1 (D4): nhân hai tín hiệu cần mạch chuyên dụng, không chỉ R+C." },
    { field: "content", find: "điều khiển dòng điện để biểu diễn và xử lý thông tin", replace: D.D5, why: "B2 (D5): link 'dòng điện' → bài nguồn gốc điện năng." },
    { field: "content", find: "các khớp thần kinh trong não vừa lưu trữ vừa xử lý thông tin", replace: D.D6, why: "B2 (D6): link 'khớp thần kinh' → bài sứ giả hóa học." },
    { field: "content", find: "giảm đáng kể mức tiêu thụ năng lượng của các hệ thống AI trong tương lai", replace: D.D7, why: "B2 (D7): link 'năng lượng' → bài Năng lượng là gì." },
    // B5 — đổi viết hoa tiêu đề mục (inline, cơ học), find kèm \n để khớp nguyên dòng.
    { field: "content", find: "## Máy Tính Kỹ Thuật Số: Toán Học Bằng Các Trạng Thái Điện\n", replace: "## Máy tính kỹ thuật số: toán học bằng các trạng thái điện\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Transistor: Công Tắc Của Thế Giới Số\n", replace: "## Transistor: công tắc của thế giới số\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Cổng Logic: Nền Tảng Của Mọi Phép Tính\n", replace: "## Cổng logic: nền tảng của mọi phép tính\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Máy Tính Cộng Số Như Thế Nào?\n", replace: "## Máy tính cộng số như thế nào?\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Máy Tính Tương Tự: Khi Vật Lý Trực Tiếp Giải Toán\n", replace: "## Máy tính tương tự: khi vật lý trực tiếp giải toán\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "### Định Luật Ohm\n", replace: "### Định luật Ohm\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "### Định Luật Kirchhoff\n", replace: "### Định luật Kirchhoff\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Op-Amp Và Những Phép Toán Cao Cấp\n", replace: "## Op-Amp và những phép toán cao cấp\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Tương Lai: Mạch Điện Mô Phỏng Não Bộ\n", replace: "## Tương lai: mạch điện mô phỏng não bộ\n", why: "B5: viết hoa kiểu câu." },
    { field: "content", find: "## Kết Luận\n", replace: "## Kết luận\n", why: "B5: viết hoa kiểu câu." },
  ],
  reading: [
    ["Từ electron đến dòng điện: Nguồn gốc của điện năng", "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang"],
    ["Ứng dụng cơ học lượng tử: Từ nền tảng công nghệ hiện tại đến đột phá tương lai", "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai"],
    ["Cơ học lượng tử: Thế giới kỳ lạ phía sau vật chất", "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat"],
    ["Năng lượng là gì", "nang-luong-la-gi"],
  ],
  sources: [
    { title: "The missing memristor found", publisher: "Nature", doi: "10.1038/nature06932", year: 2008, tier: 1 },
    { title: "Neuromorphic electronic systems", publisher: "Proceedings of the IEEE", doi: "10.1109/5.58356", year: 1990, tier: 1 },
    { title: "Physics for neuromorphic computing", publisher: "Nature Reviews Physics", doi: "10.1038/s42254-020-0208-2", year: 2020, tier: 1 },
    { title: "Cramming More Components onto Integrated Circuits", publisher: "Proceedings of the IEEE (bản in lại 1998)", doi: "10.1109/JPROC.1998.658762", year: 1965, tier: 1 },
    { title: "Digital Logic (triển lãm Revolution)", publisher: "Computer History Museum", url: "https://www.computerhistory.org/revolution/digital-logic/12", year: 2015, tier: 2 },
  ],
};
