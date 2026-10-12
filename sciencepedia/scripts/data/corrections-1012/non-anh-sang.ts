import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Fix, Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-12/non-anh-sang-qua-khu-ban-chat-vat-ly-cua-viec-quan-sat-vu-tru.md
 * Văn bản thay lấy nguyên văn mục D bằng `extractD`; chuỗi TÌM là văn bản hiện tại của bài (phiếu nêu
 * nguyên văn ở tiêu đề từng khối D). Đổi tên mục theo bảng D10. "Đọc thêm" (D12) do engine thêm.
 * Bài GIỮ PUBLISHED, chưa có byline → không clearReview. seoTitle/seoDescription/seoKeywords, summary giữ.
 * Ảnh bìa (bị cắt, nền trong suốt) và alt: phiếu mục E, cần người.
 */

const SLUG = "non-anh-sang-qua-khu-ban-chat-vat-ly-cua-viec-quan-sat-vu-tru";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-12", `${SLUG}.md`), "utf8"));

const CREDIT_OLD =
  "By SVG version: K. Aainsqatsi at en.wikipediaOriginal PNG version: Stib at en.wikipedia - Transferred from en.wikipedia to Commons.(Original text: self-made), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=2210907";

/**
 * D10: đổi nguyên dòng tiêu đề. Tìm "<dòng>\n" (dòng đầu bài không có "\n" đứng trước); engine
 * đòi khớp đúng một chỗ, nên "### Mặt Trời\n" không thể lẫn vào "### Hệ Mặt Trời: …".
 */
const HEADINGS: [string, string][] = [
  ["## 1. Giới Hạn Cơ Bản: Vận Tốc Ánh Sáng", "## 1. Giới hạn cơ bản: vận tốc ánh sáng"],
  ['## 2. Thang Đo "Độ Lùi Thời Gian" Trong Vũ Trụ', '## 2. Thang đo "độ lùi thời gian" trong vũ trụ'],
  ["### Hệ Mặt Trời: Quá Khứ Tính Bằng Giây Và Phút", "### Hệ Mặt Trời: quá khứ tính bằng giây và phút"],
  ["### Mặt Trăng", "#### Mặt Trăng"],
  ["### Mặt Trời", "#### Mặt Trời"],
  ["### Sao Mộc", "#### Sao Mộc"],
  ["### Các Ngôi Sao Lân Cận: Quá Khứ Tính Bằng Năm", "### Các ngôi sao lân cận: quá khứ tính bằng năm"],
  ["### Hệ Sao Alpha Centauri", "#### Hệ sao Alpha Centauri"],
  ["### Sirius (Sao Thiên Lang)", "#### Sirius (sao Thiên Lang)"],
  ["### Vũ Trụ Sâu Thẳm: Quá Khứ Tính Bằng Triệu Và Tỷ Năm", "### Vũ trụ sâu thẳm: quá khứ tính bằng triệu và tỷ năm"],
  ["### Thiên Hà Andromeda", "#### Thiên hà Andromeda"],
  ["### Bức Xạ Nền Vi Sóng Vũ Trụ (CMB)", "#### Bức xạ nền vi sóng vũ trụ (CMB)"],
  ["## Bảng Tổng Hợp Khoảng Cách Và Độ Lùi Thời Gian", "## Bảng tổng hợp khoảng cách và độ lùi thời gian"],
  ["## Kết Luận", "## Kết luận"],
];

const headingFixes: Fix[] = HEADINGS.map(([from, to]) => ({
  field: "content",
  find: `${from}\n`,
  replace: `${to}\n`,
  why: "B6 (D10): viết hoa kiểu câu; tiểu mục thiên thể xuống ####, tiêu đề nhóm không còn rỗng.",
}));

export const NON_ANH_SANG: Plan = {
  slug: SLUG,
  note: "Trước đính chính 12/10: phiếu thẩm định 2026-10-12 (A1–A3: 0 nguồn; 'nằm trong nón ánh sáng quá khứ' → trên mặt nón, giải thích nón ánh sáng; 'tổ tiên loài người chưa xuất hiện' 2,5 triệu năm trước → Homo sapiens chưa, tổ tiên đã có; B1–B7: Alpha Centauri 4,35 + Proxima, Sao Mộc, mốc CMB, Euclid/Roman, viết hoa kiểu câu, ghi công ảnh)",
  reverifyMonths: 36,
  forbid: [
    "tổ tiên của loài người hiện đại còn chưa xuất hiện", "đều nằm trong **Nón Ánh Sáng Quá Khứ**", "4,37",
    "33 - 53 phút", "Euclid", "Roman Space Telescope", "By SVG version", "Kết Luận",
  ],
  fixes: [
    { field: "title", find: "Nón Ánh Sáng Quá Khứ: Bản Chất Vật Lý Của Việc Quan Sát Vũ Trụ", replace: D.D0, why: "B6 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "content", find: "đơn vị **năm ánh sáng** (*light-year*)", replace: D.D1, why: "Mục từ glossary đã có (`nam-anh-sang`)." },
    { field: "content", find: "Theo Thuyết tương đối hẹp của Albert Einstein, đây là tốc độ tối đa mà thông tin và năng lượng có thể truyền đi trong vũ trụ.", replace: D.D2, why: "B5 (D2): khớp Einstein Online; link bài thuyết tương đối hẹp." },
    { field: "content", find: "Tùy theo vị trí trên quỹ đạo, ánh sáng từ Sao Mộc cần khoảng:", replace: D.D3_0, why: "B2 (D3): Sao Mộc 5,2 AU (NASA); bỏ khoảng 33–53 phút không nguồn." },
    { field: "content", find: "\n33 - 53 phút\n", replace: `\n${D.D3_1}\n`, why: "B2 (D3)." },
    { field: "content", find: "Hệ sao gần Trái Đất nhất nằm cách chúng ta:", replace: D.D4_0, why: "B1 (D4): Alpha Centauri A, B (NASA Imagine)." },
    { field: "content", find: "\n4,37 năm ánh sáng\n", replace: `\n${D.D4_1}\n`, why: "B1 (D4): 4,35 năm ánh sáng (NASA Imagine)." },
    { field: "content", find: "Điều đó có nghĩa là ánh sáng chúng ta nhìn thấy ngày hôm nay đã rời khỏi hệ sao này từ hơn 4 năm trước.", replace: D.D4_2, why: "B1 (D4): thêm Proxima Centauri 4,25 năm ánh sáng, ngôi sao gần nhất; link." },
    { field: "content", find: "| Alpha Centauri | 4,37 năm ánh sáng | 4,37 năm |", replace: D.D11, why: "B1 (D11): bảng khớp D4." },
    { field: "content", find: "Khi đó, tổ tiên của loài người hiện đại còn chưa xuất hiện trên Trái Đất.", replace: D.D5, why: "A3 (D5): loài người sớm 6–2 triệu năm, Homo sapiens ~300.000 năm (Smithsonian); khớp bài dòng thời gian (PASSED)." },
    { field: "content", find: "trước và là \"ánh sáng hóa thạch\" còn sót lại từ thời kỳ sơ khai của vũ trụ sau Big Bang.", replace: D.D6, why: "B3 (D6): CMB phát ra ~380.000 năm sau Big Bang (NASA Webb; WMAP 375.000)." },
    { field: "content", section: "## 3. Nón Ánh Sáng Quá Khứ (Past Light Cone)", replace: D.D7, why: "A2 (D7): ánh sáng ta thấy đến từ sự kiện TRÊN MẶT nón quá khứ; giải thích nón ánh sáng (Einstein Online)." },
    { field: "content", section: "## Tại Sao Kính Viễn Vọng James Webb Giống Một Cỗ Máy Du Hành Thời Gian?", replace: D.D8, why: "B4 (D8): bỏ 'mục tiêu thực sự' của Euclid/Roman (không nguồn); Webb theo NASA." },
    ...headingFixes,
    { field: "coverImageCredit", find: CREDIT_OLD, replace: D.D9_0, why: "B7 (D9): ghi công CC BY-SA 3.0 đủ tác giả, link giấy phép, ghi đã cắt." },
    { field: "coverImageCreditEn", find: CREDIT_OLD, replace: D.D9_1, why: "B7 (D9)." },
  ],
  reading: [
    ["Vũ trụ quan sát được: vì sao ta không thể nhìn thấy toàn bộ Vũ Trụ", "khung-hoang-hien-sinh-cua-vu-tru-lieu-chung-ta-co-the-hieu-toan-bo-vu-tru"],
    ["Thang khoảng cách vũ trụ: đo tới sao và thiên hà bằng cách nào", "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao"],
    ["Hành Trình Của Photon: Hàng Chục Nghìn Năm Từ Lõi Mặt Trời Đến Trái Đất", "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat"],
    ["Vì sao bầu trời xanh, hoàng hôn đỏ và mây lại trắng?", "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang"],
  ],
  sources: [
    { title: "CODATA Value: speed of light in vacuum", publisher: "NIST", url: "https://physics.nist.gov/cgi-bin/cuu/Value?c", year: 2022, tier: 2 },
    { title: "Dictionary: light-cone", publisher: "Einstein Online — Max Planck Institute for Gravitational Physics", url: "https://www.einstein-online.info/en/explandict/light-cone/", year: 2026, tier: 2 },
    { title: "How Does Webb See Back in Time?", publisher: "NASA Science", url: "https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/", year: 2026, tier: 2 },
    { title: "Webb: Early Universe", publisher: "NASA Science", url: "https://science.nasa.gov/mission/webb/early-universe/", year: 2026, tier: 2 },
    { title: "Tests of Big Bang: The CMB", publisher: "NASA WMAP", url: "https://map.gsfc.nasa.gov/universe/bb_tests_cmb.html", year: 2026, tier: 2 },
    { title: "Moon Facts", publisher: "NASA Science", url: "https://science.nasa.gov/moon/facts/", year: 2026, tier: 2 },
    { title: "Earth Facts", publisher: "NASA Science", url: "https://science.nasa.gov/earth/facts/", year: 2026, tier: 2 },
    { title: "Jupiter Facts", publisher: "NASA Science", url: "https://science.nasa.gov/jupiter/jupiter-facts/", year: 2026, tier: 2 },
    { title: "The Nearest Neighbor Star", publisher: "NASA Goddard — Imagine the Universe", url: "https://imagine.gsfc.nasa.gov/features/cosmic/nearest_star_info.html", year: 2026, tier: 2 },
    { title: "Sirius A and B: A Double Star System In The Constellation Canis Major", publisher: "NASA/CXC — Chandra X-ray Observatory", url: "https://chandra.harvard.edu/photo/2000/0065/", year: 2000, tier: 2 },
    { title: "Messier 31", publisher: "NASA Hubble", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/", year: 2026, tier: 2 },
    { title: "Introduction to Human Evolution", publisher: "Smithsonian National Museum of Natural History — Human Origins", url: "https://humanorigins.si.edu/education/introduction-human-evolution", year: 2026, tier: 2 },
    { title: "Homo sapiens", publisher: "Smithsonian National Museum of Natural History — Human Origins", url: "https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens", year: 2026, tier: 2 },
  ],
};
