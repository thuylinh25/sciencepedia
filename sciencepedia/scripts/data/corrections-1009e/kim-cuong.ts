import type { Plan } from "../../lib/corrections";

/**
 * Phiếu: docs/content/checks/2026-10-09/tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat.md
 * Văn bản thay lấy nguyên văn mục D (D1–D7, D9) bằng chương trình; "Đọc thêm" (D8) do engine thêm từ `reading`.
 * Chủ sản phẩm chốt: bài GIỮ PUBLISHED (không toDraft); chính tả "hóa" theo đa số; giữ "than chì" như D.
 * Bài chưa có byline duyệt → không clearReview. seoTitle, seoKeywords giữ nguyên (D9).
 * B1–B5, B7 nằm trong D2–D5; B6 (tiêu đề kiểu câu) ở title + tên mục; B8 ở seoDescription.
 */

const D1 = `Kim cương và than chì đều chỉ gồm nguyên tử carbon, vậy mà một thứ là vật liệu tự nhiên cứng nhất, còn thứ kia mềm đến mức dùng làm ruột bút chì. Câu trả lời nằm ở nhiều cấp độ: các electron lớp ngoài cùng của nguyên tử, cách các nguyên tử liên kết và sắp xếp với nhau, và điều kiện nhiệt độ, áp suất. Bài viết đi qua từng cấp độ ấy, rồi tới hai trạng thái đặc biệt của vật chất: plasma và siêu dẫn.`;

const D2 = `## Electron quyết định tính chất hóa học

Mỗi nguyên tử gồm hạt nhân và các electron ở xung quanh hạt nhân; [cấu tạo của nguyên tử](/articles/nguyen-tu-cau-tao-nen-van-vat) được giải thích kỹ ở một bài riêng.

Trong phản ứng hóa học, vai trò chính thuộc về các electron ở lớp ngoài cùng, gọi là **electron hóa trị**. Các nguyên tố cùng một nhóm (cùng một cột) của bảng tuần hoàn thường có cấu hình electron lớp ngoài giống nhau, và cũng có tính chất giống nhau. Electron hóa trị chi phối việc một nguyên tử dễ hay khó phản ứng, và nó tạo liên kết với nguyên tử khác ra sao.

Ví dụ:

- **Natri** chỉ có một electron ở lớp ngoài cùng. Tách electron này ra cần khoảng 496 kJ/mol, trong khi tách electron thứ hai cần khoảng 4.562 kJ/mol, gấp hơn chín lần. Natri phản ứng mạnh, kể cả với nước.
- **Clo** có bảy electron ở lớp ngoài cùng và dễ nhận thêm một electron: việc nhận ấy giải phóng năng lượng, khoảng 349 kJ/mol. Clo cũng là một nguyên tố phản ứng mạnh.
- **Khí hiếm** như neon và argon có lớp electron ngoài cùng đầy đủ và gần như không phản ứng. Argon trơ đến mức được dùng làm khí che chắn khi hàn, để kim loại nóng không bị oxy hóa. Chữ "gần như" là cần thiết: năm 1962, Neil Bartlett tạo được hợp chất đầu tiên của xenon, một khí hiếm khác, và đến nay đã có hơn 100 hợp chất xenon.`;

const D3 = `## Cách các nguyên tử liên kết quyết định tính chất vật lý

Hai vật liệu có thể được tạo từ cùng một nguyên tố mà vẫn có tính chất hoàn toàn khác nhau. Ví dụ điển hình là **kim cương** và **than chì**, đều chỉ gồm nguyên tử carbon.

### Kim cương

Trong kim cương, mỗi nguyên tử carbon liên kết cộng hóa trị với 4 nguyên tử carbon khác, tạo thành một mạng lưới ba chiều liên tục. Nhờ các liên kết bền chặt ấy, kim cương:

- Là vật liệu tự nhiên cứng nhất.
- Rất khó biến dạng.
- Có nhiệt độ nóng chảy rất cao.
- Cách điện tốt ở nhiệt độ phòng.

### Than chì

Trong than chì, mỗi nguyên tử carbon liên kết với 3 nguyên tử khác, tạo thành những lớp phẳng hình tổ ong. Liên kết trong mỗi lớp rất bền, nhưng các lớp chỉ bám vào nhau rất lỏng lẻo. Một milimét than chì gồm khoảng ba triệu lớp như vậy chồng lên nhau, và chúng khá dễ tách ra. Vì thế than chì:

- Mềm hơn kim cương rất nhiều.
- Dễ tách lớp.
- Được dùng làm ruột bút chì: khi viết, các lớp than chì bong ra và bám lại trên giấy.

Cặp ví dụ này cho thấy cách các nguyên tử liên kết và sắp xếp quan trọng không kém việc chúng là nguyên tố gì.`;

const D4 = `## Nhiệt độ và áp suất thay đổi trạng thái vật chất

Tính chất của một chất không cố định mà còn phụ thuộc vào điều kiện môi trường.

Khi nhiệt độ tăng, các hạt chuyển động mạnh hơn. Chất rắn có thể nóng chảy thành chất lỏng, chất lỏng có thể hóa hơi thành chất khí; khi nhiệt độ giảm, các quá trình ấy diễn ra theo chiều ngược lại. Ở áp suất khí quyển tiêu chuẩn, nước sôi ở khoảng 100 °C, còn oxy, chất khí ta hít thở, chỉ hóa lỏng khi được làm lạnh xuống khoảng −183 °C.

Áp suất cũng ảnh hưởng đến nhiệt độ nóng chảy, nhiệt độ sôi và cả cấu trúc của vật chất. Chính kim cương là một ví dụ: than chì là dạng phổ biến nhất của carbon, còn kim cương hình thành ở áp suất cao. Ở áp suất thường, kim cương là một dạng giả bền của carbon; nó vẫn tồn tại được vì giữa kim cương và than chì có một rào năng lượng lớn.`;

const D5 = `## Plasma: trạng thái thứ tư của vật chất

Plasma là một trong bốn trạng thái của vật chất, cùng với rắn, lỏng và khí. Khi các nguyên tử nhận đủ năng lượng, chẳng hạn bị nung tới nhiệt độ rất cao, bị phóng điện cao áp hay bị chiếu tia laser, một số electron tách khỏi nguyên tử. Nguyên tử mất electron trở thành ion mang điện dương. Plasma vì thế gồm các ion dương và electron tự do. Trong plasma nhiệt độ cao, mọi nguyên tử có thể bị ion hóa hoàn toàn; trong plasma nhiệt độ thấp, chỉ một phần nguyên tử bị ion hóa, và loại plasma này có thể nguội tới cỡ nhiệt độ phòng.

Khác với chất khí, plasma dẫn được điện, và các electron, ion trong đó tương tác với nhau theo những cách rất phức tạp.

Ví dụ về plasma:

- Mặt Trời và các ngôi sao khác.
- Các tinh vân trong không gian.

Cực quang cũng do plasma gây ra: electron được gia tốc trong từ quyển của Trái Đất lao dọc theo từ trường xuống vùng cực, va vào nguyên tử và phân tử oxy, nitơ ở tầng khí quyển trên cao và làm chúng phát sáng.

Theo Bộ Năng lượng Mỹ (DOE), plasma chiếm khoảng 99% [vật chất nhìn thấy](/articles/vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru) trong vũ trụ.`;

const D6 = `## Khi vật chất được làm lạnh cực độ

Ở nhiệt độ bình thường, mọi vật liệu đều có điện trở: một phần năng lượng của dòng điện luôn biến thành nhiệt. Với hầu hết vật liệu, điện trở vẫn còn kể cả khi được làm lạnh rất sâu. Ngoại lệ là các vật liệu **siêu dẫn**. Khi được làm lạnh dưới một nhiệt độ gọi là nhiệt độ tới hạn, chúng:

- Dẫn dòng điện một chiều mà không mất năng lượng: điện trở bằng 0, không chỉ gần bằng 0.
- Đẩy từ trường ra khỏi lòng vật liệu khi chuyển sang trạng thái siêu dẫn (hiệu ứng Meissner).

Siêu dẫn là một hiện tượng lượng tử. Nó được phát hiện năm 1911 ở thủy ngân được làm lạnh tới nhiệt độ của heli lỏng, chỉ cao hơn độ không tuyệt đối vài độ. Năm 1957, ba nhà vật lý giải thích được cơ chế: các electron, vốn đẩy nhau, kết thành từng cặp nhờ dao động của mạng tinh thể, và các cặp ấy di chuyển qua vật liệu mà không gặp điện trở. Năm 1986, người ta tìm ra một nhóm vật liệu gốc đồng oxit siêu dẫn ở nhiệt độ cao hơn nhiều. Tính đến năm 2026, cơ chế siêu dẫn ở những vật liệu nhiệt độ cao này vẫn chưa được hiểu đầy đủ.

Cuộn dây siêu dẫn tạo ra được những nam châm rất mạnh. Từ thập niên 1970, nam châm siêu dẫn đã được dùng để tạo từ trường mạnh cần cho máy chụp cộng hưởng từ (MRI); máy MRI dùng hợp kim niobi–titan. Ở Máy Gia tốc Hạt Lớn (LHC) của CERN, các nam châm lưỡng cực chính tạo từ trường 8,3 tesla, mạnh hơn từ trường Trái Đất hơn 100.000 lần, nhờ cuộn dây siêu dẫn cho dòng điện 11.080 ampe chạy qua mà không mất năng lượng vì điện trở.`;

const D7 = `## Kết luận

Tính chất của vật chất không do một yếu tố duy nhất quyết định mà là kết quả của nhiều cấp độ. Electron lớp ngoài cùng quyết định nguyên tử phản ứng và liên kết ra sao. Cách các nguyên tử liên kết và sắp xếp quyết định vật liệu cứng hay mềm. Nhiệt độ và áp suất quyết định chất ấy ở trạng thái nào, và có khi cả cấu trúc của nó.

Chính vì vậy, cùng là carbon, than chì mềm đến mức dùng làm ruột bút chì, còn kim cương là vật liệu tự nhiên cứng nhất.`;

const TITLE = `Từ nguyên tử đến kim cương: điều gì thực sự quyết định tính chất của vật chất?`;

const SEO_DESCRIPTION = `Vì sao kim cương và than chì cùng là carbon mà khác hẳn nhau? Electron hóa trị, cách nguyên tử liên kết, nhiệt độ và áp suất cùng quyết định tính chất vật chất.`;

export const KIM_CUONG: Plan = {
  slug: "tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A4; B1–B8: tóm tắt bỏ câu hỏi oxy/nước/sắt và 'phản ứng với môi trường'; bỏ 'sấm sét' là plasma, 'dẫn điện rất tốt' → dẫn được điện, cực quang do plasma gây ra; siêu dẫn điện trở bằng 0, bỏ tàu đệm từ; bỏ 'electron hóa trị quyết định tính axit, bazơ, khả năng cháy'; tiêu đề viết hoa kiểu câu)",
  // Phiếu E: mệnh đề theo thời điểm duy nhất là "tính đến năm 2026, cơ chế siêu dẫn nhiệt độ cao chưa được hiểu đầy đủ" (D6).
  reverifyMonths: 36,
  forbid: [
    "phản ứng với môi trường xung quanh",
    "chuyển động xung quanh",
    "khả năng cháy",
    "vai trò quan trọng nhất",
    "Liên kết giữa các lớp",
    "Sấm sét",
    "Dẫn điện rất tốt",
    "Phản ứng mạnh với từ trường",
    "Phát sáng khi bị kích thích",
    "hiệu ứng lượng tử bắt đầu chi phối",
    "gần như bằng 0",
    "hầu như không hao phí",
    "tàu đệm từ",
    "Bài viết giải thích",
    "Từ Nguyên Tử Đến Kim Cương",
  ],
  fixes: [
    {
      field: "title",
      find: "Từ Nguyên Tử Đến Kim Cương: Điều Gì Thực Sự Quyết Định Tính Chất Của Vật Chất?",
      replace: TITLE,
      why: "B6 (D9): viết hoa kiểu câu tiếng Việt. Slug và seoTitle giữ nguyên.",
    },
    {
      field: "summary",
      find: `Tại sao oxy là chất khí, nước là chất lỏng còn sắt lại là chất rắn ở nhiệt độ phòng? Vì sao kim cương và than chì đều được tạo thành từ carbon nhưng lại có tính chất hoàn toàn khác nhau?

Câu trả lời nằm ở cách các nguyên tử được cấu tạo, liên kết với nhau và phản ứng với môi trường xung quanh.`,
      replace: D1,
      why: "A2 (D1): tóm tắt hứa giải thích vì sao oxy/nước/sắt ở ba trạng thái mà thân bài không trả lời; 'phản ứng với môi trường xung quanh' là nhân quả sai — viết lại khớp điều thân bài trả lời (KVA 2010, J Adv Res 2025).",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích cách cấu hình electron, liên kết hóa học, nhiệt độ và áp suất quyết định tính chất vật lý và hóa học của các dạng vật chất.",
      replace: SEO_DESCRIPTION,
      why: "B8 (D9): bỏ mở đầu 'Bài viết giải thích…', nêu cặp kim cương/than chì — đúng điều bài trả lời.",
    },
    {
      field: "content",
      section: "## Electron Quyết Định Tính Chất Hóa Học",
      replace: D2,
      why: "B1–B3, B7 (D2): bỏ 'chuyển động xung quanh' (mô hình hành tinh), link giữa câu sang bài nguyên tử; bỏ 'quyết định tính axit, bazơ, khả năng cháy' (không nguồn); natri, clo, khí hiếm gắn số liệu RSC, giữ 'gần như' (xenon, Bartlett 1962).",
    },
    {
      field: "content",
      section: "## Cách Các Nguyên Tử Liên Kết Quyết Định Tính Chất Vật Lý",
      replace: D3,
      why: "B4 (D3): 'liên kết giữa các lớp' → các lớp bám lỏng lẻo (KVA 2010); carbon trong than chì liên kết với 3 nguyên tử (Nat Commun 2025); kim cương cách điện ở nhiệt độ phòng (Nanomaterials 2024), cứng nhất trong tự nhiên (J Adv Res 2025).",
    },
    {
      field: "content",
      section: "## Nhiệt Độ Và Áp Suất Thay Đổi Trạng Thái Vật Chất",
      replace: D4,
      why: "B5 (D4): sơ đồ một chiều không nêu áp suất → có chiều ngược lại, nước sôi ~100 °C ở áp suất tiêu chuẩn, oxy hóa lỏng ~−183 °C (NIST); kim cương là ví dụ áp suất: hình thành ở áp suất cao, giả bền ở áp suất thường (KVA 2010, Nat Commun 2025).",
    },
    {
      field: "content",
      section: "## Plasma: Trạng Thái Thứ Tư Của Vật Chất",
      replace: D5,
      why: "A3 (D5): 'sấm sét' là âm thanh, không phải plasma (NOAA NWS); 'dẫn điện rất tốt' → dẫn được điện (DOE); bỏ 'phản ứng mạnh với từ trường', 'phát sáng khi bị kích thích' (không nguồn); cực quang do plasma gây ra (DOE, NOAA SWPC); plasma nhiệt độ thấp chỉ ion hóa một phần (DOE). B7: link giữa câu sang bài vật chất tối.",
    },
    {
      field: "content",
      section: "## Khi Vật Chất Được Làm Lạnh Cực Độ",
      replace: D6,
      why: "A4 (D6): 'điện trở gần như bằng 0' → không mất năng lượng với dòng một chiều (DOE, CERN); bỏ 'tàu đệm từ' (không nguồn); khái quát 'hiệu ứng lượng tử chi phối' → siêu dẫn là hiện tượng lượng tử (DOE); thêm cơ chế nhiệt độ cao chưa hiểu đầy đủ (DOE); số LHC (CERN).",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D7,
      why: "D7: kết luận khớp ba cấp độ của thân bài đã sửa; 'kim cương siêu cứng' → vật liệu tự nhiên cứng nhất (J Adv Res 2025). Tên mục kiểu câu (B6).",
    },
  ],
  // D8: bốn bài PUBLISHED + PASSED; tiêu đề chép từ CSDL (truy vấn 2026-10-09).
  reading: [
    ['Nguyên tử: Khám phá những "hạt vô hình" kiến tạo nên vạn vật', "nguyen-tu-cau-tao-nen-van-vat"],
    ["Cơ học lượng tử: Thế giới kỳ lạ phía sau vật chất", "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat"],
    ["Từ electron đến dòng điện: Nguồn gốc của điện năng", "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang"],
    ["Sao Mộc: hành tinh quay nhanh nhất và chiếc phanh vô hình", "sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh"],
  ],
  // Mục C: 4 bậc 1 (DOI đã tra Crossref) + 9 trang bậc 2 + 4 trang RSC (phiếu ghi bậc "2–3" → ghi 3 cho chắc).
  // Trang không ghi ngày duyệt → năm truy cập (2026), như tiền lệ các đợt trước.
  // Không dùng (403/404/405 theo phiếu): IUPAC Gold Book, PPPL, AMNH, Smithsonian NMNH, USGS, trang CERN "Superconductivity".
  sources: [
    { title: "Metastability and Ostwald step rule in the crystallisation of diamond and graphite from molten carbon", publisher: "Nature Communications", doi: "10.1038/s41467-025-61674-5", year: 2025, tier: 1 },
    { title: "Diamond for High-Power, High-Frequency, and Terahertz Plasma Wave Electronics", publisher: "Nanomaterials", doi: "10.3390/nano14050460", year: 2024, tier: 1 },
    { title: "CVD diamond processing tools: A review", publisher: "Journal of Advanced Research", doi: "10.1016/j.jare.2024.09.013", year: 2025, tier: 1 },
    // Phiếu: CHỈ xác minh tồn tại (Crossref) — dùng cho tên gọi hiệu ứng Meissner; nội dung hiệu ứng lấy từ DOE.
    { title: "Ein neuer Effekt bei Eintritt der Supraleitfähigkeit", publisher: "Die Naturwissenschaften", doi: "10.1007/BF01504252", year: 1933, tier: 1 },
    { title: "DOE Explains... Plasma", publisher: "U.S. Department of Energy, Office of Science", url: "https://www.energy.gov/science/doe-explainsplasma", year: 2026, tier: 2 },
    { title: "DOE Explains... Superconductivity", publisher: "U.S. Department of Energy, Office of Science", url: "https://www.energy.gov/science/doe-explainssuperconductivity", year: 2026, tier: 2 },
    { title: "Pulling together: superconducting electromagnets", publisher: "CERN", url: "https://home.cern/science/engineering/pulling-together-superconducting-electromagnets", year: 2026, tier: 2 },
    { title: "Understanding Lightning: Thunder", publisher: "NOAA National Weather Service", url: "https://www.weather.gov/safety/lightning-science-thunder", year: 2026, tier: 2 },
    { title: "Aurora", publisher: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov/phenomena/aurora", year: 2026, tier: 2 },
    { title: "The Nobel Prize in Physics 2010 — Popular information: Graphene", publisher: "Royal Swedish Academy of Sciences", url: "https://www.nobelprize.org/uploads/2018/06/popular-physicsprize2010.pdf", year: 2010, tier: 2 },
    { title: "The Nobel Prize in Physics 2010 — Scientific background: Graphene", publisher: "Royal Swedish Academy of Sciences", url: "https://www.nobelprize.org/uploads/2018/06/advanced-physicsprize2010.pdf", year: 2010, tier: 2 },
    { title: "NIST Chemistry WebBook (SRD 69): Oxygen — Phase change data", publisher: "NIST", url: "https://webbook.nist.gov/cgi/cbook.cgi?ID=C7782447&Mask=4", year: 2026, tier: 2 },
    { title: "NIST Chemistry WebBook (SRD 69): Water — Phase change data", publisher: "NIST", url: "https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4", year: 2026, tier: 2 },
    { title: "Periodic Table: Sodium", publisher: "Royal Society of Chemistry", url: "https://periodic-table.rsc.org/element/11/sodium", year: 2026, tier: 3 },
    { title: "Periodic Table: Chlorine", publisher: "Royal Society of Chemistry", url: "https://periodic-table.rsc.org/element/17/chlorine", year: 2026, tier: 3 },
    { title: "Periodic Table: Argon", publisher: "Royal Society of Chemistry", url: "https://periodic-table.rsc.org/element/18/argon", year: 2026, tier: 3 },
    { title: "Periodic Table: Xenon", publisher: "Royal Society of Chemistry", url: "https://periodic-table.rsc.org/element/54/xenon", year: 2026, tier: 3 },
  ],
};
