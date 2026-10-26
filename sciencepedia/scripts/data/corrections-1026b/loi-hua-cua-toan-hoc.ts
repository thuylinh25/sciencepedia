import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-26/loi-hua-cua-toan-hoc-va-su-im-lang-cua-vu-tru.md
 * SỬA, giữ PUBLISHED. Bù đoạn Kết luận bị cắt cụt (A1), đưa blockquote Fermi về đúng lời ghi được
 * (A3), thêm nguồn + link nội bộ + "Đọc thêm", viết hoa kiểu câu, và điền bản EN (dịch từ bản VI
 * SAU đính chính). Văn thay lấy NGUYÊN VĂN mục D của phiếu qua extractD.
 * factCheck + byline GIỮ NGUYÊN — người duyệt ký sau khi đọc bản đã sửa (scripts/pass-factcheck-*).
 */

const SLUG = "loi-hua-cua-toan-hoc-va-su-im-lang-cua-vu-tru";
const D = extractD(
  readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-26", `${SLUG}.md`), "utf8"),
);

export const LOI_HUA: Plan = {
  slug: SLUG,
  note: "Trước đính chính 26/10: thân bài cắt cụt ở Kết luận, 0 nguồn, blockquote Fermi là diễn giải, chưa có EN (phiếu 2026-10-26)",
  fixes: [
    // Tiêu đề bài + tóm tắt
    {
      field: "title",
      find: "Lời Hứa Của Toán Học Và Sự Im Lặng Của Vũ Trụ",
      replace: "Lời hứa của toán học và sự im lặng của vũ trụ",
      why: "B1 — viết hoa kiểu câu",
    },
    {
      field: "summary",
      find: "sự sống ngoài Trái Đất dường như là điều gần như tất yếu. Vũ trụ có hàng tỷ ngôi sao, vô số hành tinh khiến ý tưởng về các nền văn minh ngoài Trái Đất trở nên gần như tất yếu.",
      replace: "sự sống ngoài Trái Đất dường như gần như tất yếu: vũ trụ có hàng tỷ ngôi sao và vô số hành tinh.",
      why: "B4 — bỏ lặp 'gần như tất yếu' và 'ngoài Trái Đất'",
    },
    // Thay toàn mục (gồm viết hoa kiểu câu trong tiêu đề mục)
    {
      field: "content",
      section: '## Nghịch Lý Fermi: "Mọi Người Đâu Hết Rồi?"',
      replace: D.D1,
      why: "A3 — blockquote về đúng lời Fermi ghi được; phần mở rộng thành văn xuôi",
    },
    {
      field: "content",
      section: '## Giả Thuyết "Bộ Lọc Vĩ Đại"',
      replace: D.D2,
      why: "B3 — xuất xứ Robin Hanson 1998",
    },
    {
      field: "content",
      section: '## Giả Thuyết "Khu Rừng Tăm Tối"',
      replace: D.D3,
      why: "B2 — xuất xứ tiểu thuyết Lưu Từ Hân",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D.D4,
      why: "A1 — bù câu kết bị cắt cụt",
    },
    // Viết hoa kiểu câu cho các mục không thay toàn khối
    {
      field: "content",
      find: "## Lời Hứa Của Toán Học",
      replace: "## Lời hứa của toán học",
      why: "B1 — viết hoa kiểu câu",
    },
    {
      field: "content",
      find: "## Có Thể Chúng Ta Đang Đánh Giá Quá Cao Xác Suất Sự Sống?",
      replace: "## Có thể chúng ta đang đánh giá quá cao xác suất sự sống?",
      why: "B1 — viết hoa kiểu câu",
    },
    {
      field: "content",
      find: "## Có Thể Chúng Ta Đến Quá Sớm?",
      replace: "## Có thể chúng ta đến quá sớm?",
      why: "B1 — viết hoa kiểu câu",
    },
    {
      field: "content",
      find: "## Nếu Chúng Ta Thật Sự Cô Đơn Thì Sao?",
      replace: "## Nếu chúng ta thật sự cô đơn thì sao?",
      why: "B1 — viết hoa kiểu câu",
    },
    // Link nội bộ giữa câu
    {
      field: "content",
      find: "số nền văn minh có khả năng liên lạc trong Dải Ngân Hà.",
      replace: "số nền văn minh có khả năng liên lạc trong [Dải Ngân Hà](/articles/thien-ha-dinh-nghia-va-cach-phan-loai).",
      why: "B5 — link nội bộ 'Dải Ngân Hà'",
    },
    {
      field: "content",
      find: "một hành tinh duy nhất có sự sống: Trái Đất.",
      replace: "một hành tinh duy nhất có sự sống: [Trái Đất](/articles/trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song).",
      why: "B5 — link nội bộ 'Trái Đất'",
    },
    {
      field: "content",
      find: "như sao lùn đỏ có thể tồn tại lâu hơn Mặt Trời",
      replace: "như [sao lùn đỏ](/articles/ngoi-sao-cau-tao-va-vong-doi) có thể tồn tại lâu hơn Mặt Trời",
      why: "B5 — link nội bộ 'sao lùn đỏ'",
    },
    // Bản EN (điền trường trống), dịch từ bản VI sau đính chính
    { field: "titleEn", fill: D.D5, why: "B7 — bản EN, tiêu đề" },
    { field: "summaryEn", fill: D.D6, why: "B7 — bản EN, tóm tắt" },
    { field: "contentEn", fill: D.D7, why: "B7 — bản EN, toàn bài (gồm 'Further reading')" },
  ],
  reading: [
    ["Trái Đất — hành tinh duy nhất ta biết có sự sống", "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song"],
    ["Khủng hoảng hiện sinh của vũ trụ", "khung-hoang-hien-sinh-cua-vu-tru-lieu-chung-ta-co-the-hieu-toan-bo-vu-tru"],
    ["Lòng dũng cảm và sự tò mò: điều gì đưa loài người đến các vì sao", "long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao"],
    ["Ngôi sao: cấu tạo và vòng đời", "ngoi-sao-cau-tao-va-vong-doi"],
  ],
  sources: [
    { title: "The Drake Equation", publisher: "SETI Institute", url: "https://www.seti.org/drake-equation-index", year: 2025, tier: 1 },
    { title: "The Fermi Paradox", publisher: "SETI Institute", url: "https://www.seti.org/fermi-paradox-0", year: 2025, tier: 1 },
    { title: "Dissolving the Fermi Paradox", publisher: "Sandberg, Drexler & Ord (arXiv:1806.02404)", url: "https://arxiv.org/abs/1806.02404", year: 2018, tier: 2 },
    { title: "Types of Stars", publisher: "NASA Science", url: "https://science.nasa.gov/universe/stars/types/", year: 2025, tier: 1 },
    {
      title: "A dying universe: the long-term fate and evolution of astrophysical objects",
      publisher: "Reviews of Modern Physics (APS)",
      doi: "10.1103/RevModPhys.69.337",
      year: 1997,
      tier: 1,
    },
    {
      title: "Eternity in six hours: Intergalactic spreading of intelligent life and sharpening the Fermi paradox",
      publisher: "Acta Astronautica",
      doi: "10.1016/j.actaastro.2013.04.002",
      year: 2013,
      tier: 2,
    },
    {
      title: "The Great Filter — Are We Almost Past It?",
      publisher: "Robin Hanson",
      url: "https://mason.gmu.edu/~rhanson/greatfilter.html",
      year: 1998,
      tier: 3,
    },
  ],
  forbid: [
    "tiếng trả lời từ màn ",
    "Nếu sự sống thông minh phổ biến như vậy, tại sao chúng ta chưa thấy ai",
  ],
};
