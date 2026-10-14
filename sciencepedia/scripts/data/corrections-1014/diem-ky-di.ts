import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-14/diem-ky-di-cua-ho-den-noi-hai-tru-cot-vat-ly-va-cham.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; chuỗi TÌM là văn bản hiện tại của bài. Đổi tên
 * mục theo bảng D7. "Đọc thêm" (D9) do engine thêm. Bài GIỮ PUBLISHED, chưa có byline → không
 * clearReview. summary, seoTitle/seoDescription/seoKeywords giữ. Ảnh bìa (lớp phủ "12.8"), alt: mục E.
 */

const SLUG = "diem-ky-di-cua-ho-den-noi-hai-tru-cot-vat-ly-va-cham";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-14", `${SLUG}.md`), "utf8"));

const ARROW = (a: string) => `<div style="font-size:24px;color:#64748b">${a}</div>`;
const DIAGRAM_OLD = [
  '<div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;text-align:center">',
  "<strong>Thuyết Tương Đối Rộng</strong>",
  ARROW("↓"),
  "<strong>Mô tả hấp dẫn và không-thời gian</strong>",
  ARROW("↓"),
  "<strong>Điểm kỳ dị hố đen</strong>",
  ARROW("↑"),
  "<strong>Cơ Học Lượng Tử</strong>",
  ARROW("↑"),
  "<strong>Mô tả thế giới hạt vi mô</strong>",
  "</div>",
].join("\n\n");

export const DIEM_KY_DI: Plan = {
  slug: SLUG,
  note: "Trước đính chính 14/10: phiếu thẩm định 2026-10-14 (A1–A4: 0 nguồn; 'theo cơ học lượng tử, không-thời gian có thể không liên tục' → giả thuyết của hấp dẫn lượng tử; sơ đồ + kết luận 'hai lý thuyết cùng cho dự đoán' → chỉ thuyết tương đối rộng dự đoán điểm kỳ dị; 'cơ học lượng tử vòng' → hấp dẫn lượng tử vòng; B1–B6: Penrose 1965, điểm kỳ dị như điểm tận cùng của thời gian, fuzzball, cú nảy LQC chỉ mới cho Big Bang, viết hoa kiểu câu)",
  reverifyMonths: 36,
  forbid: [
    "Cơ Học Lượng Tử Vòng", "Không gian và thời gian có thể không còn liên tục như trong vật lý cổ điển",
    "cùng cho những dự đoán chưa thể dung hòa", "Mô tả thế giới hạt vi mô", "đối tượng thiên văn học kỳ lạ",
    "dây\" năng lượng", "Kết Luận",
  ],
  fixes: [
    { field: "title", find: "Điểm Kỳ Dị Của Hố Đen: Nơi Hai Trụ Cột Vật Lý Va Chạm", replace: D.D0, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "content", find: DIAGRAM_OLD, replace: D.D1, why: "A3 (D1): sơ đồ mũi tên không nguồn dựng sai quan hệ; thay bằng đoạn mở theo Nobel 2020." },
    { field: "content", section: "## Điểm Kỳ Dị Là Gì?", replace: D.D2, why: "B1 (D2): Penrose 1965 (Nobel 2020), điểm kỳ dị là ranh giới nơi không-thời gian kết thúc (Einstein Online)." },
    { field: "content", section: "## Góc Nhìn Của Thuyết Tương Đối Rộng", replace: D.D3, why: "B2 (D3): thuyết tương đối rộng chưa hoàn chỉnh (Einstein Online); link sóng hấp dẫn, hố đen." },
    { field: "content", section: "## Góc Nhìn Của Cơ Học Lượng Tử", replace: D.D4, why: "A2 (D4): không-thời gian rời rạc là giả thuyết hấp dẫn lượng tử (Rovelli & Smolin 1995), không phải cơ học lượng tử." },
    { field: "content", find: "Nhưng hai lý thuyết này được xây dựng trên những nguyên lý khác nhau và hiện chưa thể kết hợp hoàn chỉnh thành một khung lý thuyết thống nhất.", replace: D.D5, why: "D5: link bài thời gian lượng tử (PASSED)." },
    { field: "content", section: "## Cuộc Tìm Kiếm Hấp Dẫn Lượng Tử", replace: D.D6, why: "A4, B3, B4 (D6): hấp dẫn lượng tử vòng; fuzzball (Mathur 2005); cú nảy LQC mới cho Big Bang (Ashtekar và cộng sự 2006)." },
    { field: "content", find: "## Vì Sao Hai Lý Thuyết Xung Đột?\n", replace: "## Vì sao hai lý thuyết xung đột?\n", why: "B5 (D7): viết hoa kiểu câu." },
    { field: "content", find: "## Chúng Ta Có Biết Điều Gì Thực Sự Nằm Bên Trong Hố Đen Không?\n", replace: "## Chúng ta có biết điều gì thực sự nằm bên trong hố đen không?\n", why: "B5 (D7): viết hoa kiểu câu." },
    { field: "content", section: "## Kết Luận", replace: D.D8, why: "A3 (D8): bỏ 'hai lý thuyết cùng cho dự đoán', 'đối tượng thiên văn học'." },
  ],
  reading: [
    ["Lỗ trắng và lỗ sâu: hai nghiệm toán học chưa ai nhìn thấy", "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay"],
    ["Thuyết tương đối hẹp: khi thời gian không còn tuyệt đối", "thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi"],
    ["Big Bang: vũ trụ đã diễn ra thế nào trong 13,8 tỉ năm", "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam"],
    ["Chồng chập lượng tử: Khi một hạt có thể tồn tại trong nhiều trạng thái", "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai"],
  ],
  sources: [
    { title: "The Nobel Prize in Physics 2020 — Popular information", publisher: "Royal Swedish Academy of Sciences", url: "https://www.nobelprize.org/prizes/physics/2020/popular-information/", year: 2020, tier: 2 },
    { title: "The Nobel Prize in Physics 2020 — Press release", publisher: "Royal Swedish Academy of Sciences", url: "https://www.nobelprize.org/prizes/physics/2020/press-release/", year: 2020, tier: 2 },
    { title: "Dictionary: singularity", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/singularity/", year: 2026, tier: 2 },
    { title: "Dictionary: quantum gravity", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/quantum-gravity/", year: 2026, tier: 2 },
    { title: "Dictionary: loop quantum gravity", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/loop-quantum-gravity/", year: 2026, tier: 2 },
    { title: "CODATA Value: Planck length", publisher: "NIST", url: "https://physics.nist.gov/cgi-bin/cuu/Value?plkl", year: 2022, tier: 2 },
    { title: "Gravitational Collapse and Space-Time Singularities", publisher: "Physical Review Letters", doi: "10.1103/physrevlett.14.57", year: 1965, tier: 1 },
    { title: "Discreteness of area and volume in quantum gravity", publisher: "Nuclear Physics B", doi: "10.1016/0550-3213(95)00150-q", year: 1995, tier: 1 },
    { title: "The fuzzball proposal for black holes: an elementary review", publisher: "Fortschritte der Physik", doi: "10.1002/prop.200410203", year: 2005, tier: 1 },
    { title: "Quantum Nature of the Big Bang", publisher: "Physical Review Letters", doi: "10.1103/physrevlett.96.141301", year: 2006, tier: 1 },
  ],
};
