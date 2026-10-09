import type { Plan } from "../../lib/corrections";

/**
 * Phiếu: docs/content/checks/2026-10-09/ban-thiet-ke-chung-cua-su-song-vi-sao-cac-loai-dong-vat-co-cau-tao-giong-nhau.md
 * Văn bản thay lấy nguyên văn mục D (D0–D6) bằng chương trình; "Đọc thêm" (D7) do engine thêm từ `reading`.
 * Bài GIỮ PUBLISHED. Sơ đồ HTML mở bài giữ dạng (rehypeArticleHtml), chỉ sửa chữ (A4).
 * summary, seoTitle, seoDescription, seoKeywords giữ nguyên. Ảnh bìa chưa ghi công — phiếu mục E, cần người.
 */

const TITLE = "Bản thiết kế chung của sự sống: vì sao các loài động vật có cấu tạo giống nhau?";

const DIAGRAM_OLD = "<div style=\"text-align:center\">\n  <div>🧬 Tổ tiên chung</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>🦴 Kế thừa cấu trúc cơ bản</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>🌍 Thích nghi với môi trường khác nhau</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>✨ Tạo ra các cơ quan có hình dạng và chức năng khác nhau</div>\n</div>";

const D1 = "<div style=\"text-align:center\">\n  <div>🧬 Tổ tiên chung có chi trước với một bộ xương nhất định</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>🦴 Các loài con cháu thừa hưởng bộ xương ấy</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>🔀 Qua rất nhiều thế hệ, biến dị di truyền và chọn lọc tự nhiên làm từng xương đổi hình dạng, kích thước ở mỗi nhánh</div>\n  <div style=\"font-size:24px\">↓</div>\n\n  <div>✨ Cùng một bộ xương, nhiều hình dạng và chức năng: tay người, chân mèo, cánh dơi, vây cá voi</div>\n</div>";

const D2 = "## Cơ quan đồng nguồn: dấu vết của tổ tiên chung\n\nTrong sinh học tiến hóa, những cấu trúc ở các loài khác nhau cùng được thừa hưởng từ một cấu trúc của tổ tiên chung được gọi là **cơ quan đồng nguồn** (*homologous structures*). Chúng có thể đảm nhiệm những chức năng rất khác nhau.\n\nVí dụ quen thuộc nhất là chi trước của các động vật bốn chi, như người, mèo, dơi và cá voi. Bên trong, chúng có chung một sơ đồ xương:\n\n- Một xương cánh tay.\n- Hai xương cẳng tay.\n- Nhóm xương cổ tay.\n- Các xương ngón.\n\nỞ mỗi nhánh, bộ xương ấy đã biến đổi theo lối sống:\n\n- Ở người, bàn tay dùng để cầm nắm.\n- Ở mèo, chi trước dùng để đi và chạy.\n- Ở dơi, ba ngón cuối dài ra rất nhiều, làm khung căng màng cánh.\n- Ở cá voi, chi trước thành vây.\n\nSự tương đồng này là một bằng chứng kinh điển cho nguồn gốc chung. Di truyền học phát triển và hóa thạch cho thấy chi của động vật bốn chi đã hình thành bằng cách biến đổi những gì tổ tiên đã có. Những biến đổi giúp sinh vật sống sót và sinh sản tốt hơn được giữ lại qua [chọn lọc tự nhiên](/articles/cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai).";

const D3 = "## Khi những nhánh rất xa nhau trở nên giống nhau\n\nKhông phải mọi sự giống nhau đều do thừa hưởng từ tổ tiên chung. Các loài thuộc những nhánh khác nhau có thể độc lập tiến hóa ra những đặc điểm tương tự khi sống theo cùng một kiểu. Hiện tượng này được gọi là **tiến hóa đồng quy** (*convergent evolution*).\n\nVí dụ, cá ngừ, cá mập họ cá mập trắng (Lamnidae), cá voi và ichthyosaur, một nhóm bò sát biển đã tuyệt chủng, đều có thân hình thoi và vây đuôi hình lưỡi liềm, đặc trưng của kiểu bơi bằng cách vẫy đuôi. Một nghiên cứu năm 2023 còn thấy bốn nhóm này có chung vài đặc điểm ở cột sống, đều liên quan đến cơ học của kiểu bơi ấy.\n\nCánh chim và cánh dơi là trường hợp vừa đồng nguồn vừa đồng quy, tùy cách nhìn:\n\n- **Là chi trước, chúng đồng nguồn:** cùng có xương cánh tay, cẳng tay, cổ tay và ngón như mọi động vật bốn chi.\n- **Là cánh, chúng đồng quy:** khả năng bay chủ động xuất hiện độc lập ở thằn lằn bay, chim và dơi, và mỗi nhóm dựng cánh theo cách riêng. Cánh dơi là màng da căng trên những xương ngón rất dài; cánh chim chỉ còn ba ngón, và đó là những ngón nào vẫn đang được tranh luận.";

const D4 = "## Gen Hox: định danh từng vùng của cơ thể\n\nỞ cấp độ di truyền, một nhóm [[gen]] quan trọng trong việc định hình cơ thể là **gen Hox**, được phát hiện đầu tiên ở ruồi giấm. Trong giai đoạn phôi, các gen Hox hoạt động theo từng vùng dọc trục đầu – đuôi và trao cho mỗi vùng \"danh tính\" riêng. Ở động vật có xương sống, chẳng hạn, chúng góp phần quyết định từng đoạn của cột sống mang hình thái nào.\n\nGen Hox không vạch ra đâu là đầu, đâu là đuôi; chúng định danh các vùng nằm dọc theo trục ấy. Khi một gen Hox hoạt động sai chỗ, vùng này có thể mang hình thái của vùng khác.\n\nĐiều đáng chú ý là gen Hox được bảo tồn qua những nhánh động vật rất xa nhau. Năm 1990, các nhà nghiên cứu cho một gen Hox của chuột hoạt động trong phôi ruồi giấm và thấy nó làm được một phần việc của gen tương ứng ở ruồi, gây ra cùng kiểu biến đổi: chân ngực mọc ở chỗ lẽ ra là râu. Côn trùng và động vật có vú vẫn dùng chung những \"công cụ di truyền\" thừa hưởng từ một tổ tiên rất xa.";

const D5 = "## Vì sao tiến hóa sửa cái có sẵn thay vì làm lại từ đầu?\n\nTiến hóa không vận hành như một kỹ sư vẽ bản thiết kế mới cho từng loài. Năm 1977, nhà sinh học François Jacob ví nó với một người thợ chắp vá, tận dụng những gì đã có trong tay.\n\nDi truyền học phát triển và cổ sinh vật học ủng hộ cách nhìn ấy. Nhiều cấu trúc mới, như mắt của động vật hay chi của động vật bốn chi, đã xuất hiện bằng cách biến đổi những mạch gen điều hòa có từ các động vật đa bào sơ khai, chứ không hình thành từ con số không.\n\nVì vậy, cơ thể động vật mang dấu vết của lịch sử tiến hóa, thay vì là những thiết kế tối ưu được làm từ đầu.";

const D6 = "## Kết luận\n\nSự giống nhau giữa các loài động vật có hai nguồn gốc khác nhau. Cơ quan đồng nguồn, như bộ xương chi trước của động vật bốn chi, giống nhau vì được thừa hưởng từ tổ tiên chung. Đặc điểm đồng quy, như thân hình thoi của cá mập và cá voi, giống nhau vì những nhánh xa nhau độc lập tiến hóa theo cùng một kiểu sống. Ở cấp độ gen, các gen Hox được bảo tồn từ côn trùng đến động vật có vú cho thấy những khác biệt ta thấy ngày nay là những biến thể trên một bộ công cụ di truyền chung.";

export const THIET_KE: Plan = {
  slug: "ban-thiet-ke-chung-cua-su-song-vi-sao-cac-loai-dong-vat-co-cau-tao-giong-nhau",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A4; B1–B5: gen Hox 'xác định đầu, đuôi' → định danh vùng dọc trục; cánh chim/dơi đồng nguồn là chi trước, đồng quy là cánh; sơ đồ bỏ 'thích nghi → tạo ra'; bỏ 'định luật vật lý giới hạn giải pháp', 'mạnh mẽ nhất'; tiêu đề viết hoa kiểu câu)",
  reverifyMonths: 36,
  forbid: ["Đâu là phần đầu", "để bay", "các định luật vật lý", "mạnh mẽ nhất", "Thích nghi với môi trường khác nhau", "Tự Nhiên Không Thiết Kế", "hàng trăm triệu năm"],
  fixes: [
    { field: "title", find: "Bản Thiết Kế Chung Của Sự Sống: Vì Sao Các Loài Động Vật Có Cấu Tạo Giống Nhau?", replace: TITLE, why: "B5 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "content", find: DIAGRAM_OLD, replace: D1, why: "A4 (D1): sơ đồ đọc như môi trường trực tiếp 'tạo ra' cơ quan → biến dị và chọn lọc qua nhiều thế hệ biến đổi bộ xương có sẵn (Shubin 2009; Stern 2013)." },
    { field: "content", section: "## Cơ Quan Đồng Nguồn: Dấu Vết Của Tổ Tiên Chung", replace: D2, why: "B1–B2 (D2): 'động vật có vú' → động vật bốn chi; bỏ 'mạnh mẽ nhất'; ngón dơi dài làm khung màng cánh (Sears 2006); chi hình thành bằng biến đổi cái có sẵn (Shubin 2009); link chọn lọc tự nhiên." },
    { field: "content", section: "## Khi Các Loài Khác Nhau Tìm Ra Cùng Một Giải Pháp", replace: D3, why: "A3, B3 (D3): cánh chim/dơi đồng nguồn là chi trước, đồng quy là cánh (Wang 2019; Tamura 2011; Sears 2006); ví dụ thân hình thoi theo Motani & Shimada 2023 thay 'cá heo và cá mập'; bỏ 'định luật vật lý giới hạn giải pháp'." },
    { field: "content", section: "## Gen Hox: Những Kiến Trúc Sư Của Cơ Thể", replace: D4, why: "A2 (D4): Hox định danh vùng dọc trục đầu – đuôi, không vạch ra đầu/đuôi (Mallo 2010); gen Hox chuột làm được việc của gen ruồi (Malicki 1990); bảo tồn (Pearson 2005)." },
    { field: "content", section: "## Vì Sao Tự Nhiên Không Thiết Kế Lại Từ Đầu?", replace: D5, why: "B4 (D5): tiêu đề bỏ 'tự nhiên thiết kế'; cấu trúc mới từ biến đổi mạch gen điều hòa có sẵn (Shubin 2009); ẩn dụ chắp vá của Jacob 1977." },
    { field: "content", section: "## Kết Luận", replace: D6, why: "B5 (D6): bỏ 'phần lớn sinh vật', 'hàng trăm triệu năm' (không nguồn); tóm hai nguồn gốc của sự giống nhau." },
  ],
  reading: [
    ["Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?", "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai"],
    ["Cái giá của sự bất tử: sống mãi có phải là lợi thế?", "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the"],
    ["Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?", "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa"],
  ],
  sources: [
    { title: "Hox genes and regional patterning of the vertebrate body plan", publisher: "Developmental Biology", doi: "10.1016/j.ydbio.2010.04.024", year: 2010, tier: 1 },
    { title: "Mouse Hox-2.2 specifies thoracic segmental identity in Drosophila embryos and larvae", publisher: "Cell", doi: "10.1016/0092-8674(90)90499-5", year: 1990, tier: 1 },
    { title: "Modulating Hox gene functions during animal body patterning", publisher: "Nature Reviews Genetics", doi: "10.1038/nrg1726", year: 2005, tier: 1 },
    { title: "Deep homology and the origins of evolutionary novelty", publisher: "Nature", doi: "10.1038/nature07891", year: 2009, tier: 1 },
    { title: "The developmental genetics of homology", publisher: "Nature Reviews Genetics", doi: "10.1038/nrg2099", year: 2007, tier: 1 },
    { title: "Development of bat flight: Morphologic and molecular evolution of bat wing digits", publisher: "Proceedings of the National Academy of Sciences", doi: "10.1073/pnas.0509716103", year: 2006, tier: 1 },
    { title: "Embryological Evidence Identifies Wing Digits in Birds as Digits 1, 2, and 3", publisher: "Science", doi: "10.1126/science.1198229", year: 2011, tier: 1 },
    { title: "A new Jurassic scansoriopterygid and the loss of membranous wings in theropod dinosaurs", publisher: "Nature", doi: "10.1038/s41586-019-1137-z", year: 2019, tier: 1 },
    { title: "Skeletal convergence in thunniform sharks, ichthyosaurs, whales, and tunas, and its possible ecological links through the marine ecosystem evolution", publisher: "Scientific Reports", doi: "10.1038/s41598-023-41812-z", year: 2023, tier: 1 },
    { title: "The genetic causes of convergent evolution", publisher: "Nature Reviews Genetics", doi: "10.1038/nrg3483", year: 2013, tier: 1 },
    // Phiếu: CHỈ xác minh tồn tại (Crossref) — dùng cho tên gọi ẩn dụ "chắp vá", không làm căn cứ cơ chế.
    { title: "Evolution and Tinkering", publisher: "Science", doi: "10.1126/science.860134", year: 1977, tier: 1 },
  ],
};
