import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-12/bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong.md
 * Văn bản thay lấy nguyên văn mục D (D0–D9) bằng `extractD`; "Đọc thêm" (D10) do engine thêm từ `reading`.
 * Bài GIỮ PUBLISHED (quy tắc chủ sản phẩm 2026-10-09), chưa có byline → không clearReview.
 * seoTitle, seoDescription, seoKeywords giữ nguyên. Ảnh bìa (logo StarWalk, chưa rõ giấy phép) và alt:
 * phiếu mục E, cần người — engine không sửa ảnh/alt.
 */

const SLUG = "bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-12", `${SLUG}.md`), "utf8"));

const SUMMARY_OLD =
  "Khi ngước nhìn lên bầu trời đêm thanh vắng, bạn sẽ dễ dàng nhận ra một hiện tượng thú vị: có những đốm sáng nhấp nháy liên tục như những ngọn đèn xa xôi, nhưng cũng có những đốm sáng lại tỏa ra ánh sáng rất ổn định và phẳng lặng.\n\n" +
  "Khoa học đã chứng minh rằng những đốm sáng lấp lánh thường là các ngôi sao, còn những đốm sáng không nhấp nháy đa phần là các hành tinh như Sao Kim, Sao Hỏa hay Sao Mộc.";

export const LAP_LANH: Plan = {
  slug: SLUG,
  note: "Trước đính chính 12/10: phiếu thẩm định 2026-10-12 (A1–A4: 0 nguồn; hành tinh 'hiện lên như đĩa sáng' → đĩa mắt thường không nhận ra; lấp lánh ≠ nhoè, Webb lên vũ trụ vì hồng ngoại; sao gần nhất hơn 4 năm ánh sáng, không 'hàng chục'; B1–B5: tóm tắt, cơ chế hội tụ/phân kỳ, hoàng đạo, đổi màu ở sao thấp, viết hoa kiểu câu)",
  reverifyMonths: 36,
  forbid: [
    "Khoa học đã chứng minh", "hàng chục, hàng trăm", "gồm rất nhiều điểm sáng", "gồm nhiều điểm sáng",
    "Chính vì vậy, các kính thiên văn", "nhỏ hơn nhiều so với các ngôi sao", "🌟", "🪐", "Kết Luận",
  ],
  fixes: [
    { field: "title", find: "Bí Ẩn Bầu Trời Đêm: Tại Sao Ngôi Sao Lấp Lánh Còn Hành Tinh Thì Không?", replace: D.D0, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "summary", find: SUMMARY_OLD, replace: D.D1, why: "B1 (D1): bỏ 'Khoa học đã chứng minh' cho một quy tắc có ngoại lệ; nêu lý do (điểm so với đĩa)." },
    { field: "content", section: "## 1. Thủ phạm chính: Tầng khí quyển hỗn loạn của Trái Đất", replace: D.D2, why: "B2 (D2): chiết suất theo mật độ do trộn các lớp khác nhiệt độ; mặt sóng phẳng ở đỉnh khí quyển (Osborn 2015)." },
    { field: "content", section: "## 2. Tại sao ngôi sao lấp lánh?", replace: D.D3, why: "A4, B2 (D3): sao gần nhất hơn 4 năm ánh sáng (NASA Imagine); lấp lánh là dao động độ sáng do hội tụ/phân kỳ, chủ yếu do nhiễu động trên cao (Osborn 2015; Dravins 1997)." },
    { field: "content", section: "## 3. Tại sao hành tinh lại không lấp lánh?", replace: D.D4, why: "A2 (D4): đĩa hành tinh mắt thường không nhận ra nhưng đủ lớn để dập lấp lánh (Lazio 2004; HKO); bỏ 'kích thước thực tế nhỏ hơn nhiều so với các ngôi sao' (không nguồn)." },
    { field: "content", section: "## Bảng So Sánh Nhanh Giữa Ngôi Sao Và Hành Tinh", replace: D.D5, why: "A2, A4, B5 (D5): 'đĩa nhỏ gồm nhiều điểm sáng' → mắt thường chưa nhận ra; khoảng cách tối thiểu; bỏ emoji." },
    { field: "content", section: "## Mẹo Nhỏ Để Phân Biệt Sao Và Hành Tinh", replace: D.D6, why: "B3 (D6): hoàng đạo là đường biểu kiến của Mặt Trời, trong mặt phẳng quỹ đạo Trái Đất; hành tinh ở gần vì hình thành từ cùng một đĩa (NASA)." },
    { field: "content", section: "## Một Ngoại Lệ Thú Vị", replace: D.D7, why: "B4 (D7): lấp lánh tăng mạnh khi hạ thấp (Young, trong Osborn 2015); đổi màu có căn cứ cho ngôi sao (Dravins 1997 II), không cho hành tinh." },
    { field: "content", section: "## Tại Sao Kính Thiên Văn Không Gian Lại Quan Trọng?", replace: D.D8, why: "A3 (D8): lấp lánh khác nhoè (Osborn 2015); Hubble tránh méo khí quyển; Webb vì khí quyển chắn và tự phát sáng ở hồng ngoại (NASA)." },
    { field: "content", section: "## Kết Luận", replace: D.D9, why: "A2 (D9): bỏ 'đĩa sáng nhỏ gồm rất nhiều điểm sáng'; viết hoa kiểu câu." },
  ],
  reading: [
    ["20 ngôi sao sáng nhất bầu trời đêm", "20-ngoi-sao-sang-nhat-bau-troi-dem"],
    ["Vì sao bầu trời xanh, hoàng hôn đỏ và mây lại trắng?", "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang"],
    ["Toàn cảnh về cấu trúc và đặc điểm của 8 hành tinh trong Hệ Mặt Trời", "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi"],
    ["Thang khoảng cách vũ trụ: đo tới sao và thiên hà bằng cách nào", "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao"],
  ],
  sources: [
    { title: "Atmospheric scintillation in astronomical photometry", publisher: "Monthly Notices of the Royal Astronomical Society 452:1707–1716 (Osborn J, Föhring D, Dhillon VS, Wilson RW)", doi: "10.1093/mnras/stv1400", year: 2015, tier: 1 },
    { title: "Atmospheric Intensity Scintillation of Stars. II. Dependence on Optical Wavelength", publisher: "Publications of the Astronomical Society of the Pacific 109:725–737 (Dravins D, Lindegren L, Mezey E, Young AT)", doi: "10.1086/133937", year: 1997, tier: 1 },
    { title: "The microarcsecond sky and cosmic turbulence", publisher: "New Astronomy Reviews 48:1439–1457 (Lazio TJW, Cordes JM, de Bruyn AG, Macquart J-P)", doi: "10.1016/j.newar.2004.09.039", year: 2004, tier: 1 },
    { title: "James Webb Space Telescope — Frequently Asked Questions (Full)", publisher: "NASA Science", url: "https://science.nasa.gov/mission/webb/faqs-full/", year: 2026, tier: 2 },
    { title: "About Hubble", publisher: "NASA Science", url: "https://science.nasa.gov/mission/hubble/overview/about-hubble/", year: 2026, tier: 2 },
    { title: "What Is the Plane of the Ecliptic?", publisher: "NASA", url: "https://www.nasa.gov/image-article/plane-of-ecliptic/", year: 2008, tier: 2 },
    { title: "The Nearest Neighbor Star", publisher: "NASA Goddard — Imagine the Universe", url: "https://imagine.gsfc.nasa.gov/features/cosmic/nearest_star_info.html", year: 2026, tier: 2 },
    { title: "Why do stars twinkle?", publisher: "Hong Kong Observatory", url: "https://www.hko.gov.hk/en/education/earth-science/optical-phenomena/00356-why-do-stars-twinkle.html", year: 2026, tier: 2 },
  ],
};
