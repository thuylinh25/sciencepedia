import type { Plan } from "../../lib/corrections";

const FENCE = "```";

// Văn bản thay: nguyên văn mục D của docs/content/checks/2026-10-09/tu-khong-khi-den-song-dien-tu-vi-sao-am-thanh-va-hinh-anh-co-the-truyen-di-khong-can-day.md
const D1 = `Mỗi ngày chúng ta gọi điện, xem video hay nghe nhạc qua tai nghe Bluetooth mà không cần dây nối. Âm thanh và hình ảnh không tự bay từ máy này sang máy kia: thứ được gửi đi là thông tin, được biến thành tín hiệu điện, gắn lên một sóng mang rồi phát đi bằng sóng vô tuyến, một loại sóng điện từ. Bài viết đi qua từng bước của quá trình ấy, và giải thích vì sao Wi-Fi nhanh nhưng phủ sóng gần, còn đài phát thanh thì ngược lại.`;

const D2 = `${FENCE}text
Âm thanh / Hình ảnh
          ↓
 Micro, cảm biến ảnh: biến thành tín hiệu điện
          ↓
 (Điện thoại, Wi-Fi, Bluetooth: số hoá, mã hoá thành bit)
          ↓
 Điều chế lên sóng mang
          ↓
 Ăng-ten phát: biến thành sóng vô tuyến
          ↓
 Ăng-ten thu: biến lại thành tín hiệu điện
          ↓
 Giải điều chế, giải mã
          ↓
 Loa / màn hình: âm thanh, hình ảnh
${FENCE}`;

const D3 = `## Sóng điện từ: phương tiện chở thông tin

Âm thanh là sóng cơ học: nó lan đi nhờ các phân tử không khí va chạm và truyền dao động cho nhau, nên không truyền được trong chân không. Sóng điện từ thì không cần môi trường: nó đi được qua không khí, qua nhiều loại vật liệu và cả khoảng chân không của vũ trụ.

Trong chân không, mọi sóng điện từ, từ sóng vô tuyến tới ánh sáng, đều đi với tốc độ ánh sáng: đúng 299.792.458 mét mỗi giây, tức khoảng 300.000 km/s. Khi đi qua vật chất, sóng chậm lại: ánh sáng đi trong không khí chậm hơn trong chân không, và trong nước còn chậm hơn nữa. Nước còn cản sóng vô tuyến rất mạnh. Sóng vô tuyến không đi được xa trong nước, nên các robot lặn dưới biển dùng chính sóng âm để liên lạc với tàu.

Phát thanh, truyền hình, Wi-Fi, Bluetooth và mạng di động 4G, 5G đều dùng sóng vô tuyến, phần có tần số thấp nhất của phổ điện từ.`;

const D4 = `## Bước 1: biến âm thanh và hình ảnh thành tín hiệu điện

Micro biến dao động của sóng âm thành tín hiệu điện. (Dưới nước, việc này do ống nghe thuỷ âm, hay hydrophone, đảm nhận.) Cảm biến ảnh trong camera là một mạng lưới điểm ảnh; mỗi điểm ảnh tích điện khi có ánh sáng chiếu vào, và lượng điện ấy được đọc ra thành tín hiệu. Loại cảm biến CMOS dùng trong camera điện thoại được phát triển tại Phòng thí nghiệm Sức đẩy Phản lực (JPL) của NASA vào thập niên 1990.

Với điện thoại di động, Wi-Fi và Bluetooth, tín hiệu điện ấy được số hoá thành dãy bit 0 và 1, rồi được mã hoá. Mã hoá ở đây gồm cả việc thêm những bit dư theo quy tắc toán học, để bên nhận phát hiện và sửa được lỗi xảy ra trên đường truyền.

Không phải hệ thống nào cũng số hoá. Phát thanh AM và FM truyền thống gửi thẳng tín hiệu tương tự (analog) của âm thanh, không qua bước biến thành bit.`;

const D5 = `## Bước 2: gắn thông tin lên sóng mang

Tín hiệu âm thanh hay dãy bit không được phát thẳng ra không trung. Máy phát tạo ra một sóng vô tuyến có tần số ổn định, gọi là **sóng mang** (*carrier wave*), rồi làm sóng ấy biến đổi theo thông tin cần gửi. Quá trình này gọi là **điều chế** (*modulation*).

- **Phát thanh FM:** tần số tức thời của sóng mang thay đổi tỉ lệ với biên độ của tín hiệu âm thanh.
- **Truyền dữ liệu số:** các bit được thể hiện bằng những thay đổi nhỏ của sóng mang, chẳng hạn dịch pha hoặc dịch tần số của nó. Tàu vũ trụ của NASA lẫn tai nghe Bluetooth đều dùng những cách điều chế như vậy.

Ăng-ten của máy phát biến năng lượng điện thành sóng vô tuyến và phát ra môi trường xung quanh.`;

const D6 = `## Bước 3: nhận và giải mã

Ở máy thu, quá trình diễn ra theo chiều ngược lại:

- Ăng-ten thu sóng vô tuyến và biến nó trở lại thành tín hiệu điện.
- Máy thu **giải điều chế**: tách thông tin khỏi sóng mang.
- Với hệ thống số, dãy bit được giải mã và sửa lỗi, rồi dựng lại thành âm thanh hoặc hình ảnh.

Cuối cùng, loa biến tín hiệu điện thành dao động cơ học để tạo ra sóng âm mà tai nghe được, còn màn hình hiển thị dữ liệu thành các điểm ảnh.`;

const D7 = `## Vì sao nhiều thiết bị hoạt động cùng lúc được?

Phổ vô tuyến được chia thành nhiều dải tần, và mỗi dịch vụ được phân một phần. Ở Mỹ chẳng hạn, phát thanh FM dùng dải 88–108 MHz, chia thành 100 kênh rộng 200 kHz; mỗi đài phát trên một kênh, và người nghe chỉnh máy thu đúng tần số của đài mình muốn nghe. Tính đến năm 2026, Wi-Fi dùng các băng 2,4 GHz, 5 GHz và 6 GHz. Mạng di động dùng nhiều băng khác nhau tuỳ công nghệ và quốc gia.

Nhưng chia băng tần không giải quyết hết, vì Wi-Fi và Bluetooth dùng chung băng 2,4 GHz. Theo Bluetooth SIG, tổ chức quản lý chuẩn Bluetooth, hai gói tin có thể va nhau và hỏng nếu được phát cùng lúc trên cùng một kênh. Để giảm va chạm, Bluetooth chia băng thành nhiều kênh hẹp (79 kênh rộng 1 MHz với Bluetooth Classic, 40 kênh rộng 2 MHz với Bluetooth năng lượng thấp) và liên tục nhảy từ kênh này sang kênh khác, kỹ thuật gọi là trải phổ nhảy tần. Cùng với một số kỹ thuật khác để bù những gói tin bị mất, điều đó cho phép điện thoại, bộ phát Wi-Fi và tai nghe Bluetooth hoạt động cùng lúc, dù không loại bỏ hoàn toàn nhiễu.`;

const D8 = `## Vì sao Wi-Fi nhanh nhưng phủ sóng gần hơn đài phát thanh?

Đây là hai câu hỏi, với hai câu trả lời khác nhau.

**Nhanh vì kênh rộng.** Kênh càng rộng thì càng truyền được nhiều dữ liệu trong cùng một khoảng thời gian. Chuẩn Wi-Fi 802.11ax cho phép kênh rộng tới 160 MHz, trong khi một kênh FM ở Mỹ chỉ rộng 200 kHz: kênh Wi-Fi rộng nhất gấp 800 lần. Năm 2020, Ủy ban Truyền thông Liên bang Mỹ (FCC) mở thêm 1.200 MHz ở băng 6 GHz cho các thiết bị không cần giấy phép như Wi-Fi, gấp 60 lần toàn bộ băng FM.

**Gần vì công suất nhỏ và ăng-ten thấp, không chỉ vì tần số.** Phạm vi phủ sóng phụ thuộc vào nhiều yếu tố: tần số, cách điều chế và sửa lỗi, độ nhạy của máy thu, công suất phát, ăng-ten và mức suy hao trên đường truyền. Thông thường, tần số càng thấp thì sóng đi càng xa, nhưng tốc độ dữ liệu cũng càng thấp. Chênh lệch giữa Wi-Fi và đài FM còn đến từ công suất. Ở Mỹ, thiết bị không cần giấy phép dùng điều chế số trong băng 2,4 GHz, nhóm có Wi-Fi, bị giới hạn công suất phát tối đa 1 W; một thiết bị Bluetooth phát tối đa 100 mW. Còn một đài FM hạng lớn nhất phát với công suất bức xạ hiệu dụng tới 100 kW, từ ăng-ten đặt cao hàng trăm mét so với địa hình xung quanh. Theo quy định của FCC, bán kính vùng phục vụ chuẩn của đài FM từ 28 km với hạng nhỏ nhất đến 92 km với hạng lớn nhất.`;

const D9 = `## Kết luận

Âm thanh và hình ảnh không tự bay từ máy này sang máy kia. Micro và cảm biến ảnh biến chúng thành tín hiệu điện. Tín hiệu ấy được số hoá (với điện thoại, Wi-Fi, Bluetooth) hoặc giữ nguyên dạng tương tự (với phát thanh AM, FM truyền thống), rồi được điều chế lên một sóng mang và phát đi bằng sóng vô tuyến, loại sóng điện từ đi được cả trong chân không với tốc độ ánh sáng. Ở đầu kia, mọi bước diễn ra theo chiều ngược lại.

Wi-Fi nhanh vì có kênh rộng; đài phát thanh phủ xa vì phát ở tần số thấp hơn, với công suất lớn hơn rất nhiều và từ ăng-ten đặt cao. Còn nhiều thiết bị hoạt động cùng lúc được là nhờ phổ vô tuyến được chia thành nhiều dải tần, và nhờ những kỹ thuật tránh va chạm khi các thiết bị phải dùng chung một băng.`;

const OLD_DIAGRAM = `${FENCE}text
Âm thanh / Hình ảnh
          ↓
 Chuyển thành tín hiệu số
          ↓
   Mã hóa dữ liệu
          ↓
 Điều chế lên sóng điện từ
          ↓
 Truyền qua không gian
          ↓
      Thiết bị nhận
          ↓
 Giải mã và tái tạo lại
Âm thanh / Hình ảnh
${FENCE}`;

export const SONG_DIEN_TU: Plan = {
  slug: "tu-khong-khi-den-song-dien-tu-vi-sao-am-thanh-va-hinh-anh-co-the-truyen-di-khong-can-day",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A6; tốc độ ánh sáng gán cho không khí và nước, 'băng tần riêng' cho Wi-Fi/Bluetooth cùng 2,4 GHz, mọi tín hiệu số hoá, phạm vi chỉ do tần số, độ trễ không nguồn)",
  reverifyMonths: 24,
  fixes: [
    {
      field: "title",
      find: "Từ Không Khí Đến Sóng Điện Từ: Vì Sao Âm Thanh Và Hình Ảnh Có Thể Truyền Đi Không Cần Dây?",
      replace: "Từ không khí đến sóng điện từ: vì sao âm thanh và hình ảnh truyền đi được mà không cần dây?",
      why: "B5 (D11): viết hoa kiểu câu tiếng Việt. Slug giữ.",
    },
    {
      field: "summary",
      find: "Mỗi ngày, chúng ta gọi điện, xem video trực tuyến hay kết nối tai nghe Bluetooth mà gần như không nghĩ đến điều đang diễn ra phía sau. Thực tế, âm thanh và hình ảnh không tự \"bay\" qua không khí. Thứ được truyền đi là thông tin đã được chuyển đổi thành tín hiệu điện và mang theo bởi sóng điện từ.",
      replace: D1,
      why: "A4 (D1): 'âm thanh không tự bay qua không khí' sai nghĩa đen — âm thanh chính là dao động lan qua không khí.",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích cơ chế chuyển đổi tín hiệu, mã hóa và điều chế giúp truyền âm thanh, hình ảnh qua sóng điện từ mà không cần dây dẫn.",
      replace: "Âm thanh và hình ảnh được biến thành tín hiệu điện, điều chế lên sóng mang và phát đi bằng sóng vô tuyến. Vì sao Wi-Fi nhanh mà phủ sóng gần hơn đài FM?",
      why: "D11.",
    },
    {
      field: "coverImageCredit",
      find: "Ảnh: Nasa",
      replace: "Ảnh: NASA — [Diagram of the Electromagnetic Spectrum](https://science.nasa.gov/ems/)",
      why: "B6 (D11): tên cơ quan sai hoa thường, không trỏ về trang gốc.",
    },
    {
      field: "coverImageCreditEn",
      find: "Credit: Nasa",
      replace: "Credit: NASA — [Diagram of the Electromagnetic Spectrum](https://science.nasa.gov/ems/)",
      why: "B6: như bản vi.",
    },
    {
      field: "content",
      find: OLD_DIAGRAM,
      replace: D2,
      why: "A4 (D2): sơ đồ cho mọi âm thanh, hình ảnh đi qua bước số hoá — phát thanh AM/FM truyền thống là tín hiệu tương tự (47 CFR 73.310, 73.402).",
    },
    {
      field: "content",
      section: "## Sóng Điện Từ: Phương Tiện Vận Chuyển Thông Tin",
      replace: D3,
      why: "A2 (D3): tốc độ trong chân không gán cho không khí và nước (NIST CODATA; NASA Wave Behaviors); sóng vô tuyến không đi xa trong nước (NOAA).",
    },
    {
      field: "content",
      section: "## Bước 1: Chuyển Âm Thanh Và Hình Ảnh Thành Dữ Liệu",
      replace: D4,
      why: "A4, B3 (D4): không phải hệ thống nào cũng số hoá; cảm biến ảnh theo NASA Spinoff 2017, bỏ vế 'màu sắc' không nguồn; mã hoá gồm bit sửa lỗi.",
    },
    {
      field: "content",
      section: "## Bước 2: Gắn Dữ Liệu Lên Sóng Điện Từ",
      replace: D5,
      why: "A4 (D5): 'dữ liệu số' kể như mọi tín hiệu; thêm điều chế FM tương tự bên cạnh điều chế số.",
    },
    {
      field: "content",
      section: "## Bước 3: Nhận Và Giải Mã",
      replace: D6,
      why: "A5 (D6): xoá con số độ trễ 'phần nghìn hoặc phần triệu giây' không nguồn.",
    },
    {
      field: "content",
      section: "## Vì Sao Nhiều Thiết Bị Có Thể Hoạt Động Cùng Lúc?",
      replace: D7,
      why: "A3, B1, B2 (D7): Wi-Fi và Bluetooth cùng băng 2,4 GHz — tránh va chạm bằng nhảy tần, không bằng 'băng tần riêng' (Bluetooth SIG); băng FM 88–108 MHz (47 CFR 73.201); Wi-Fi thêm 6 GHz (FCC 20-51; Wi-Fi Alliance).",
    },
    {
      field: "content",
      section: "## Tại Sao Wi-Fi Nhanh Nhưng Truyền Không Xa Bằng Radio?",
      replace: D8,
      why: "A6, B4 (D8): phạm vi gán riêng cho tần số, bỏ công suất và ăng-ten (47 CFR 15.247, 73.211); tốc độ do độ rộng kênh (FCC 20-51); số km không nguồn; Wi-Fi không đối lập với 'radio'.",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D9,
      why: "A2, A4 (D9): 'gần bằng tốc độ ánh sáng' tự mâu thuẫn; 'không thực sự di chuyển qua không khí' và 'chuyển thành dữ liệu số' kể như mọi hệ thống.",
    },
  ],
  // B7 (D10): engine thêm mục "Đọc thêm" từ danh sách này.
  reading: [
    ["Bức xạ điện từ: Từ sóng radio đến tia gamma", "buc-xa-dien-tu-tu-song-radio-den-tia-gamma"],
    ["Sóng truyền năng lượng như thế nào?", "song-truyen-nang-luong-nhu-the-nao"],
    ["Photon: \"Hạt ánh sáng\" thực sự là gì?", "photon-hat-anh-sang-thuc-su-la-gi"],
    ["Từ electron đến dòng điện: Nguồn gốc của điện năng", "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang"],
  ],
  sources: [
    { title: "Anatomy of an Electromagnetic Wave", publisher: "NASA Science", url: "https://science.nasa.gov/ems/02_anatomy/", year: 2026, tier: 2 },
    { title: "Wave Behaviors", publisher: "NASA Science", url: "https://science.nasa.gov/ems/03_behaviors/", year: 2026, tier: 2 },
    { title: "Radio Waves", publisher: "NASA Science", url: "https://science.nasa.gov/ems/05_radiowaves/", year: 2026, tier: 2 },
    { title: "Basics of Space Flight, Chapter 10: Telecommunications", publisher: "NASA Science", url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter10-1/", year: 2026, tier: 2 },
    { title: "CMOS Sensors Enable Phone Cameras, HD Video", publisher: "NASA Spinoff", url: "https://spinoff.nasa.gov/Spinoff2017/cg_1.html", year: 2017, tier: 2 },
    { title: "CODATA Value: speed of light in vacuum", publisher: "NIST", url: "https://physics.nist.gov/cgi-bin/cuu/Value?c", year: 2022, tier: 2 },
    { title: "Ocean Exploration Technology: How Robots Are Uncovering the Mysteries of the Deep", publisher: "NOAA Ocean Exploration", url: "https://oceanexplorer.noaa.gov/explainers/technology/", year: 2022, tier: 2 },
    { title: "Technologies for Ocean Acoustic Monitoring", publisher: "NOAA Ocean Exploration", url: "https://oceanexplorer.noaa.gov/technology/acoustics/", year: 2026, tier: 2 },
    // Phiếu đọc eCFR qua API (bản 2026-09-01), không ghi URL trang; URL dưới là dạng rút gọn của ecfr.gov.
    { title: "47 CFR § 73.201 — Numerical designation of FM broadcast channels", publisher: "eCFR (FCC)", url: "https://www.ecfr.gov/current/title-47/section-73.201", year: 2026, tier: 2 },
    { title: "47 CFR § 73.211 — Power and antenna height requirements", publisher: "eCFR (FCC)", url: "https://www.ecfr.gov/current/title-47/section-73.211", year: 2026, tier: 2 },
    { title: "47 CFR § 73.310 — FM technical definitions", publisher: "eCFR (FCC)", url: "https://www.ecfr.gov/current/title-47/section-73.310", year: 2026, tier: 2 },
    { title: "47 CFR § 73.402 — Definitions (digital audio broadcasting)", publisher: "eCFR (FCC)", url: "https://www.ecfr.gov/current/title-47/section-73.402", year: 2026, tier: 2 },
    { title: "47 CFR § 15.247 — Operation within the bands 902–928 MHz, 2400–2483.5 MHz, and 5725–5850 MHz", publisher: "eCFR (FCC)", url: "https://www.ecfr.gov/current/title-47/section-15.247", year: 2026, tier: 2 },
    { title: "Unlicensed Use of the 6 GHz Band, Report and Order (FCC 20-51)", publisher: "FCC", url: "https://docs.fcc.gov/public/attachments/FCC-20-51A1.pdf", year: 2020, tier: 2 },
    // Phiếu xếp bậc 2–3 (tổ chức sở hữu chuẩn); ghi 3 cho chắc.
    { title: "Bluetooth Technology Overview", publisher: "Bluetooth SIG", url: "https://www.bluetooth.com/learn-about-bluetooth/tech-overview/", year: 2026, tier: 3 },
    { title: "Key attributes: Reliability", publisher: "Bluetooth SIG", url: "https://www.bluetooth.com/learn-about-bluetooth/key-attributes/reliability/", year: 2026, tier: 3 },
    { title: "Key attributes: Range", publisher: "Bluetooth SIG", url: "https://www.bluetooth.com/learn-about-bluetooth/key-attributes/range/", year: 2026, tier: 3 },
    { title: "Wi-Fi CERTIFIED 6 (MAC/PHY)", publisher: "Wi-Fi Alliance", url: "https://www.wi-fi.org/discover-wi-fi/wi-fi-certified-6", year: 2026, tier: 3 },
  ],
  forbid: [
    "300.000 km mỗi giây",
    "gần bằng tốc độ ánh sáng",
    "phần triệu giây",
    "băng tần riêng",
    "nghe nhầm",
    "hàng chục hoặc hàng trăm kilomet",
    "Ảnh: Nasa",
  ],
};
