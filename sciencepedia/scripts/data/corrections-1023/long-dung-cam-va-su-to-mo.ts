import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-23/long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao.md
 * Bài tiểu luận truyền cảm hứng đăng qua /admin: 0 nguồn, factCheck PENDING, không reviewer, 0 link,
 * chưa gắn entity, chưa có EN. Nội dung phần lớn đúng → phán quyết SỬA, GIỮ PUBLISHED. Đính chính:
 *   A1 — gắn 5 nguồn bậc 1 (NASA, ESA, NOAA; 3 cơ quan độc lập), không đổi chữ các câu đã đúng.
 *   A2 (D2) — viết lại mục "xa xỉ": bỏ 2 bullet khái quát không nguồn + GPS (không phải spin-off),
 *             giữ cảm biến ảnh CMOS (NASA Spinoff) và dự báo thời tiết (NOAA, dịch vụ dựa vào vệ tinh).
 *   A3 (D1) — viết lại câu nguyên tố: C/O là nguyên tố nhẹ, rèn trong lòng sao; phần lớn Ca/Fe từ
 *             vụ nổ sao (siêu tân tinh) — khớp NASA "Are We Really Made of Star Stuff?".
 *   B1 — title + 4 tiêu đề mục còn lại về viết hoa kiểu câu (2 mục kia đã đổi trong D1/D2).
 *   B2 — 5 link nội bộ giữa câu (2 trong D1; James Webb / tàu thăm dò / đo tuổi vũ trụ inline).
 *   B3 — "Đọc thêm" (engine tự chèn từ reading).
 * Văn bản D1/D2 lấy nguyên văn bằng extractD; fix ngắn inline, chuỗi TÌM là văn bản hiện tại của bài.
 * entity, byline, factCheck PASSED, link vào, EN, ghi công ảnh: phiếu mục E (cần người / đăng lại).
 */

const SLUG = "long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao";
const D = extractD(
  readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-23", `${SLUG}.md`), "utf8"),
);

export const LONG_DUNG_CAM: Plan = {
  slug: SLUG,
  note: "Trước đính chính 23/10: phiếu thẩm định 2026-10-23 (A1: 0 nguồn → 5 nguồn bậc 1; A2: mục 'xa xỉ' liệt kê 5 công nghệ, chỉ 1 có nguồn — viết lại còn cảm biến ảnh + dự báo thời tiết; A3: C/O gọi nhầm 'nặng' và gộp sao/siêu tân tinh — tách theo NASA; B1: title + 6 tiêu đề mục viết hoa kiểu câu; B2: 0 link nội bộ → 5 link giữa câu; B3: thêm Đọc thêm)",
  reverifyMonths: 36,
  forbid: [
    "Lòng Dũng Cảm Và Sự Tò Mò: Điều Gì Đưa Loài Người Đến Các Vì Sao?",
    "## Vũ Trụ Không Chỉ Là Đích Đến",
    "## Khám Phá Vũ Trụ Có Phải Là Sự Xa Xỉ?",
    "## Sự Tò Mò Là Động Cơ Của Nền Văn Minh",
    "## Kết Luận",
    "các nguyên tố nặng cấu tạo nên cơ thể",
    "Hệ thống định vị vệ tinh.",
  ],
  fixes: [
    { field: "title", find: "Lòng Dũng Cảm Và Sự Tò Mò: Điều Gì Đưa Loài Người Đến Các Vì Sao?", replace: "Lòng dũng cảm và sự tò mò: điều gì đưa loài người đến các vì sao?", why: "B1: viết hoa kiểu câu. Slug giữ nguyên." },
    // A3 + A2: thay cả mục (tiêu đề mới đã viết hoa kiểu câu, link nội bộ nhúng sẵn trong D1).
    { field: "content", section: "## Vũ Trụ Không Chỉ Là Đích Đến, Mà Là Nguồn Gốc Của Chúng Ta", replace: D.D1, why: "A3: C/O nhẹ, rèn trong lòng sao; phần lớn Ca/Fe từ siêu tân tinh (NASA). B2: link ngôi sao + bạn-là-một-phần." },
    { field: "content", section: "## Khám Phá Vũ Trụ Có Phải Là Sự Xa Xỉ?", replace: D.D2, why: "A2: bỏ 2 bullet khái quát + GPS không nguồn; giữ cảm biến ảnh (NASA Spinoff) + dự báo thời tiết (NOAA)." },
    // B1 — 4 tiêu đề mục còn lại, find kèm \n để khớp nguyên dòng.
    { field: "content", find: "## Sự Tò Mò Là Động Cơ Của Nền Văn Minh\n", replace: "## Sự tò mò là động cơ của nền văn minh\n", why: "B1: viết hoa kiểu câu." },
    { field: "content", find: "## Dũng Cảm Là Bước Tiếp Theo Sau Sự Tò Mò\n", replace: "## Dũng cảm là bước tiếp theo sau sự tò mò\n", why: "B1: viết hoa kiểu câu." },
    { field: "content", find: "## Điều Khiến Loài Người Đặc Biệt\n", replace: "## Điều khiến loài người đặc biệt\n", why: "B1: viết hoa kiểu câu." },
    { field: "content", find: "## Kết Luận\n", replace: "## Kết luận\n", why: "B1: viết hoa kiểu câu." },
    // B2 — link giữa câu (3 link inline; 2 link còn lại nằm trong D1).
    { field: "content", find: "Hubble hay James Webb", replace: "Hubble hay [James Webb](/articles/kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh)", why: "B2: neo 'James Webb' → bài kính James Webb." },
    { field: "content", find: "gửi tàu thăm dò tới những hành tinh cách xa hàng tỷ kilomet", replace: "gửi [tàu thăm dò tới những hành tinh cách xa hàng tỷ kilomet](/articles/tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu)", why: "B2: neo cụm tàu thăm dò → bài hỗ trợ hấp dẫn." },
    { field: "content", find: "đo tuổi của vũ trụ", replace: "[đo tuổi của vũ trụ](/articles/big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam)", why: "B2: neo 'đo tuổi của vũ trụ' → bài Big Bang." },
  ],
  reading: [
    ["Bạn không chỉ sống trong vũ trụ, bạn là một phần của nó", "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no"],
    ["Big Bang: vũ trụ đã diễn ra thế nào trong 13,8 tỉ năm", "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam"],
    ["Kính James Webb: nhìn ngược về thuở vũ trụ sơ sinh", "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh"],
  ],
  sources: [
    { title: "Are We Really Made of Star Stuff?", publisher: "NASA", url: "https://science.nasa.gov/astrobiology/learning-resources/alp/are-we-really-made-of-star-stuff/", year: 2023, tier: 1 },
    { title: "CMOS Sensors Enable Phone Cameras, HD Video", publisher: "NASA Spinoff", url: "https://spinoff.nasa.gov/Spinoff2017/cg_1.html", year: 2017, tier: 1 },
    { title: "Yuri Gagarin", publisher: "ESA", url: "https://www.esa.int/About_Us/50_years_of_ESA/50_years_of_humans_in_space/Yuri_Gagarin", year: 2011, tier: 1 },
    { title: "Apollo 11", publisher: "NASA", url: "https://www.nasa.gov/mission/apollo-11/", year: 2024, tier: 1 },
    { title: "History of NOAA Satellites", publisher: "NOAA", url: "https://www.nesdis.noaa.gov/our-satellites/related-information/history-of-noaa-satellites", year: 2023, tier: 1 },
  ],
};
