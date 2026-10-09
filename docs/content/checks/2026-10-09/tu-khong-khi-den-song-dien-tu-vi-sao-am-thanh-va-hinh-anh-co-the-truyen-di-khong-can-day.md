# Thẩm định — Từ Không Khí Đến Sóng Điện Từ: Vì Sao Âm Thanh Và Hình Ảnh Có Thể Truyền Đi Không Cần Dây?

- Slug: `tu-khong-khi-den-song-dien-tu-vi-sao-am-thanh-va-hinh-anh-co-the-truyen-di-khong-can-day`
- Trạng thái lúc thẩm định (2026-10-09): PUBLISHED qua form /admin (publishedAt 2026-10-09T02:30Z) · `factCheck = PENDING` · 0 nguồn · không `reviewedById` · chưa có bản EN (`titleEn`, `summaryEn`, `contentEn` trống) · `entityId` trống · `readingTime = 3` · danh mục `dien-tu-va-anh-sang` · ảnh bìa là sơ đồ phổ điện từ của NASA, có alt (đã xem ảnh: alt đúng), ghi công viết "Nasa" · không có mục "Đọc thêm", không có link nội bộ.
- **Phán quyết: SỬA (REVISE).** Không gỡ: khung bài đúng (biến thành tín hiệu điện → điều chế lên sóng mang → ăng-ten phát → ăng-ten thu → giải điều chế), định nghĩa sóng mang và điều chế đúng, âm thanh không truyền trong chân không là đúng. Nhưng bài vi phạm gate accuracy (0 nguồn) và có bốn chỗ để lại mô hình sai: (1) sóng điện từ đi qua không khí, *nước* và chân không "với tốc độ ánh sáng, khoảng 300.000 km/s", rồi kết luận lại nói sóng đi "gần bằng tốc độ ánh sáng" — tự mâu thuẫn, mâu thuẫn bài đã PASSED trong kho, và bỏ qua việc sóng vô tuyến gần như không đi được trong nước; (2) "mỗi hệ thống dùng băng tần riêng… nhờ vậy không nghe nhầm" ngay trên một danh sách cho thấy Wi-Fi và Bluetooth cùng ở 2,4 GHz; (3) sơ đồ và kết luận nói mọi âm thanh, hình ảnh đều được số hoá, trong khi phát thanh AM/FM (bài liệt kê "Radio" đầu tiên) là tín hiệu tương tự; (4) Wi-Fi phủ gần hơn radio được giải thích chỉ bằng tần số, bỏ công suất và ăng-ten — yếu tố chênh nhau cỡ trăm nghìn lần. Thêm một con số không nguồn (độ trễ "phần nghìn hoặc phần triệu giây"). Sáu mục chặn, bảy mục nên sửa. Mọi chỗ sửa nằm trong phạm vi các mục hiện có; D viết sẵn thay toàn bộ thân bài.

## A. Chặn (phải sửa)

| # | Vị trí | Loại | Vấn đề | Câu thay thế (nguyên văn) |
|---|---|---|---|---|
| A1 | Toàn bài | Gate | 0 nguồn. Gate cần ≥3 nguồn độc lập bậc 1–2. | Thêm nguồn ở mục C. |
| A2 | Mục "Sóng Điện Từ: Phương Tiện Vận Chuyển Thông Tin" ("sóng điện từ có thể lan truyền qua không khí, nước và cả không gian vũ trụ với tốc độ ánh sáng, khoảng 300.000 km mỗi giây"); mục "Kết Luận" ("truyền đi với tốc độ gần bằng tốc độ ánh sáng") | **Mô hình sai + tự mâu thuẫn + kho mâu thuẫn** (quy tắc 4; `content-rules.md` "Kho tự mâu thuẫn là máy dò lỗi rẻ nhất"; quy tắc 18 chủ thể bị nới rộng) | (1) 299.792.458 m/s là tốc độ **trong chân không** (NIST CODATA). NASA: ánh sáng "travels slower in air than in a vacuum, and even slower in water". Câu của bài gán tốc độ chân không cho cả không khí và nước. (2) Câu kết luận "gần bằng tốc độ ánh sáng" lại gợi ý sóng vô tuyến chậm hơn ánh sáng — sai: sóng vô tuyến *là* sóng điện từ như ánh sáng, cùng tốc độ trong cùng môi trường. Hai câu của cùng bài nói hai điều khác nhau. Bài đã PASSED `buc-xa-dien-tu-tu-song-radio-den-tia-gamma` viết đúng: "Trong chân không, mọi loại bức xạ điện từ đều truyền với tốc độ c… đúng với cả ánh sáng nhìn thấy, sóng radio…". (3) Đặt "nước" trong câu mở đầu một bài về truyền thông không dây là dạy người đọc rằng sóng vô tuyến đi được trong nước. NOAA: "Radio waves do not travel very far through water" — robot lặn liên lạc bằng sóng âm. | D3 (thay toàn mục), D9 (kết luận). |
| A3 | Mục "Vì Sao Nhiều Thiết Bị Có Thể Hoạt Động Cùng Lúc?" ("Để tránh nhiễu lẫn nhau, mỗi hệ thống sử dụng những băng tần riêng… Wi-Fi: thường ở 2,4 GHz hoặc 5 GHz. Bluetooth: khoảng 2,4 GHz… Nhờ vậy, điện thoại, router Wi-Fi và tai nghe Bluetooth có thể hoạt động đồng thời mà không 'nghe nhầm' tín hiệu của nhau.") | **Hệ quả tự mâu thuẫn + cơ chế sai** (`content-rules.md`, "hệ quả tự mâu thuẫn") | Danh sách ngay trong mục cho thấy Wi-Fi và Bluetooth cùng ở 2,4 GHz, nên "băng tần riêng" không thể là lý do chúng cùng chạy được. Bluetooth SIG (tổ chức sở hữu chuẩn): "Bluetooth technology operates in the same 2.4 GHz ISM frequency band as Wi-Fi", gói tin có thể "corrupted or lost if it collides with a packet being transmitted at the exact same time and frequency channel"; Bluetooth dùng nhiều kỹ thuật "to lower the probability of collisions and offset inevitable packet loss" — trong đó có trải phổ nhảy tần (FHSS) trên 79 kênh 1 MHz (Classic) hoặc 40 kênh 2 MHz (LE). Câu "không nghe nhầm" cũng hứa quá: nguồn nói mất gói là "inevitable", kỹ thuật chỉ giảm và bù. | D7 (thay toàn mục). |
| A4 | Khối sơ đồ ```` ```text ```` đầu bài ("Âm thanh / Hình ảnh → Chuyển thành tín hiệu số → …"); mục "Kết Luận" ("Âm thanh và hình ảnh không thực sự di chuyển trực tiếp qua không khí. Thay vào đó, chúng được chuyển thành dữ liệu số…") | **Chọn một kể như tất cả** (quy tắc 15) + **câu sai nghĩa đen** | (1) Bài liệt kê "Radio" là công nghệ đầu tiên, nhưng phát thanh AM/FM truyền thống không số hoá: quy định FCC định nghĩa FM là điều chế trong đó tần số tức thời "varies in proportion to the instantaneous amplitude of the modulating signal" (47 CFR 73.310), và phân biệt tín hiệu số của đài phát thanh số với "its analog signal" trên cùng kênh (47 CFR 73.402). Sơ đồ và kết luận biến "điện thoại, Wi-Fi, Bluetooth số hoá" thành "mọi âm thanh, hình ảnh truyền không dây đều số hoá". (2) "Âm thanh… không thực sự di chuyển… qua không khí" — sai nghĩa đen: âm thanh chính là dao động lan qua không khí (NASA: "sound waves are formed by vibrations in a gas (air)"); chính mục đầu bài cũng nói vậy. Ý bài muốn nói là âm thanh không tự đi từ máy này tới máy kia; câu phải nói đúng điều ấy. | D2 (thay sơ đồ), D4, D9. |
| A5 | Mục "Bước 3: Nhận Và Giải Mã", câu cuối: "Toàn bộ quá trình này thường diễn ra chỉ trong vài phần nghìn hoặc phần triệu giây." | **Con số không nguồn** (quy tắc 6; `content-rules.md` "Bài dán từ công cụ AI: chỗ bịa nằm ở con số cụ thể nhất") | Không nguồn nào đã đọc cho con số này. "Phần triệu giây" cho cả chuỗi micro → số hoá → mã hoá → phát → thu → giải mã → loa/màn hình của một cuộc gọi hay video trực tuyến là mệnh đề cụ thể, đọc rất xuôi, và không có căn cứ. Xoá, không làm mềm. | Xoá câu (D6 không có câu tương ứng). |
| A6 | Mục "Tại Sao Wi-Fi Nhanh Nhưng Truyền Không Xa Bằng Radio?" (toàn mục) | **Chọn một kể như tất cả** (quy tắc 15) + **nhân quả tự thêm** + **số không nguồn** | (1) "Đó là lý do" gán chênh lệch phạm vi giữa đài phát thanh và Wi-Fi cho riêng tần số. Chính Bluetooth SIG, khi giải thích phạm vi, liệt kê tần số, lớp vật lý (cách điều chế, sửa lỗi), độ nhạy máy thu, **công suất phát**, **ăng-ten** và suy hao đường truyền. Chênh lệch lớn nhất giữa Wi-Fi và đài FM là công suất và độ cao ăng-ten: ở Mỹ, thiết bị dùng điều chế số trong băng 2,4 GHz bị giới hạn công suất phát 1 W (47 CFR 15.247(b)(3)); đài FM hạng C phát công suất bức xạ hiệu dụng tới 100 kW, ăng-ten cao tối thiểu 451 m so với địa hình trung bình (47 CFR 73.211). (2) "Tần số cao mang được nhiều dữ liệu hơn" là ý lỏng: thứ quyết định là độ rộng kênh — FCC: kênh "160 MHz or wider… will allow more data to be transmitted in a shorter period of time" (FCC 20-51, đoạn tr. 45). Một kênh FM ở Mỹ rộng 200 kHz (47 CFR 73.201). (3) "Hàng chục hoặc hàng trăm kilomet", "vài chục mét" — không nguồn. Thay bằng số có nguồn: bán kính đường bao vùng phục vụ của đài FM Mỹ theo hạng, từ 28 km (hạng A) đến 92 km (hạng C) (47 CFR 73.211(b)). | D8 (thay toàn mục). |

## B. Nên sửa

| # | Vị trí | Loại | Vấn đề | Câu thay thế |
|---|---|---|---|---|
| B1 | Mục "Vì Sao Nhiều Thiết Bị…", "Radio FM: khoảng hàng chục đến hàng trăm MHz." | Số mơ hồ, lệch | Băng FM là một dải hẹp quanh 100 MHz: ở Mỹ 88–108 MHz, 100 kênh rộng 200 kHz (47 CFR 73.201). "Hàng chục MHz" không đúng với băng FM mà người đọc nghe hằng ngày. Dải cụ thể khác nhau giữa các nước; chưa đọc được nguồn quy hoạch tần số của Việt Nam → D7 ghi rõ "ở Mỹ". | D7. |
| B2 | Cùng mục, "Wi-Fi: thường ở 2,4 GHz hoặc 5 GHz." | Mệnh đề theo thời điểm, thiếu (quy tắc 5) | Thiếu băng 6 GHz. Wi-Fi Alliance: Wi-Fi 7 (ra đời 2024) "enhances performance across the 2.4 GHz, 5 GHz, and 6 GHz bands"; FCC mở 1.200 MHz ở băng 6 GHz (5,925–7,125 GHz) cho thiết bị không cần giấy phép năm 2020 (FCC 20-51). | D7 ghi "tính đến năm 2026"; đặt `reverifyDueAt` 24 tháng. |
| B3 | Mục "Bước 1", "Camera biến ánh sáng thành tín hiệu điện tương ứng với màu sắc và độ sáng."; "bộ xử lý chuyển những tín hiệu này thành dữ liệu số" | Chi tiết không nguồn | Nguồn đã đọc (NASA Spinoff 2017) mô tả cảm biến ảnh là mạng điểm ảnh "collect charges when exposed to light"; cơ chế ghi màu (lớp lọc màu) không có trong nguồn đã đọc → bỏ vế "màu sắc". "Bộ xử lý" số hoá là cách gọi lỏng; D4 viết "được số hoá" và thêm điều bài bỏ: mã hoá gồm cả thêm bit để sửa lỗi (NASA, Basics of Space Flight ch. 10). | D4. |
| B4 | Tên mục "Tại Sao Wi-Fi Nhanh Nhưng Truyền Không Xa Bằng **Radio**?" | Ranh giới tự dựng | Tên mục đặt Wi-Fi đối lập với "radio", như thể Wi-Fi không phải sóng vô tuyến. Bluetooth SIG: "Radio spectrum stretches from 30 Hz to 300 GHz" — Wi-Fi ở 2,4–7 GHz nằm trong đó. Bài `buc-xa-dien-tu-…` (PASSED) xếp Wi-Fi vào "vi sóng" — không mâu thuẫn (vi sóng là phần tần số cao của dải vô tuyến), nhưng hai bài nên cùng một cách gọi: so Wi-Fi với **đài phát thanh**, không với "radio". | Tên mục mới: "Vì sao Wi-Fi nhanh nhưng phủ sóng gần hơn đài phát thanh?" (D8). |
| B5 | Tiêu đề và tên mục | Văn phong | Viết hoa từng chữ ("Từ Không Khí Đến Sóng Điện Từ", "Kết Luận") không theo cách viết tiếng Việt. | Tiêu đề: "Từ không khí đến sóng điện từ: vì sao âm thanh và hình ảnh truyền đi được mà không cần dây?" (giữ slug). Tên mục viết hoa chữ đầu như trong D. |
| B6 | `coverImageCredit` / `coverImageCreditEn` | Ghi công | "Ảnh: Nasa" — tên cơ quan viết sai hoa thường, không trỏ về trang gốc. Ảnh là "Diagram of the Electromagnetic Spectrum" (tệp `EMS_Diagram_09172025.jpg`) trên các trang NASA Science "Tour of the Electromagnetic Spectrum". Alt: **đã xem ảnh** — mô tả đúng (dải từ sóng vô tuyến tới tia gamma, thang tần số và bước sóng, các vùng khí quyển chắn/cho qua, biểu tượng ứng dụng); giữ nguyên. | `coverImageCredit`: `Ảnh: NASA — [Diagram of the Electromagnetic Spectrum](https://science.nasa.gov/ems/)`; `coverImageCreditEn`: `Credit: NASA — [Diagram of the Electromagnetic Spectrum](https://science.nasa.gov/ems/)`. |
| B7 | Liên kết | SEO | 0 link nội bộ (gate SEO ≥3). | D10: mục "Đọc thêm" gồm 4 bài PUBLISHED + `factCheck = PASSED` (truy vấn CSDL 2026-10-09). Trong thân bài, `[[Sóng điện từ]]` đã được dùng ở `song-truyen-nang-luong-nhu-the-nao` — có thể dùng ở D3 nếu mục từ có dấu duyệt (chưa kiểm dấu duyệt, nên D không chèn). |

## C. Nguồn đề xuất (đã kiểm tồn tại)

Không nguồn nào dưới đây có DOI, nên không có tra Crossref. Mọi trang đọc ngày 2026-10-09 bằng curl (nội dung HTML → văn bản) hoặc pypdf; eCFR qua API `ecfr.gov/api/versioner/v1/full/2026-09-01/title-47.xml`. Các trang fcc.gov (HTML) trả HTTP 403 với cả curl lẫn WebFetch nên **không dùng**; văn bản quy định FCC lấy từ eCFR, văn bản quyết định 20-51 từ docs.fcc.gov (PDF, trả 200).

| Bậc | Nguồn | Đã đọc để kiểm | Dùng cho |
|---|---|---|---|
| 2 | NASA Science — Anatomy of an Electromagnetic Wave. https://science.nasa.gov/ems/02_anatomy/ | Trang: "sound waves are formed by vibrations in a gas (air)… Sound waves cannot travel in the vacuum of space because there is no medium"; sóng điện từ "do not require a medium to propagate… can travel not only through air and solid materials, but also through the vacuum of space". | A2, A4, D3 |
| 2 | NASA Science — Wave Behaviors. https://science.nasa.gov/ems/03_behaviors/ | Trang, mục Refraction: "Light travels slower in air than in a vacuum, and even slower in water." | A2, D3 |
| 2 | NIST — CODATA Value: speed of light in vacuum. https://physics.nist.gov/cgi-bin/cuu/Value?c | 299 792 458 m s⁻¹, exact (CODATA 2022). | A2, D3 |
| 2 | NOAA Ocean Exploration — Ocean Exploration Technology: How Robots Are Uncovering the Mysteries of the Deep (OYLA #21, 2022). https://oceanexplorer.noaa.gov/explainers/technology/ | Mục Communication: "Radio waves do not travel very far through water. Underwater robot platforms like AUVs can use acoustic communication…". | A2, D3 |
| 2 | NOAA Ocean Exploration — Technologies for Ocean Acoustic Monitoring. https://oceanexplorer.noaa.gov/technology/acoustics/ | "Just as microphones collect sound in the air, underwater hydrophones detect acoustic signals in the ocean"; hydrophone tạo tín hiệu điện khi áp suất thay đổi. Chỉ dùng cho phép so sánh micro ↔ hydrophone, **không** dùng làm cơ chế của micro điện thoại. | D4 |
| 2 | NASA Science — Radio Waves. https://science.nasa.gov/ems/05_radiowaves/ | "You can tune a radio to a specific wavelength—or frequency… The radio 'receives' these electromagnetic radio waves and converts them to mechanical vibrations in the speaker to create the sound waves you can hear." | D6, D7 |
| 2 | NASA Science — Basics of Space Flight, Chapter 10: Telecommunications. https://science.nasa.gov/learn/basics-of-space-flight/chapter10-1/ | Mục "Modulation and Demodulation, Carrier and Subcarrier": sóng mang ("pure RF tone, called a carrier"), "carriers may be modulated to carry information", điều chế pha; "Demodulation is the reverse… capturing data symbols from the carrier"; mục "Symbols and Bits and Coding": mã hoá "to help ensure error-free" truyền, Reed-Solomon "adds bits". | D2, D4, D5, D6 |
| 2 | NASA Spinoff 2017 — CMOS Sensors Enable Phone Cameras, HD Video. https://spinoff.nasa.gov/Spinoff2017/cg_1.html | Cảm biến ảnh là mạng điểm ảnh "collect charges when exposed to light"; điểm ảnh CMOS tự khuếch đại và đọc tín hiệu riêng; Fossum được JPL tuyển năm 1990 và phát triển cảm biến điểm ảnh chủ động CMOS ở đó. | B3, D4 |
| 2 | eCFR — 47 CFR § 73.201 (FM broadcast channels). | "The FM broadcast band consists of… between 88 MHz and 108 MHz. It is divided into 100 channels of 200 kHz each." | B1, A6, D7, D8 |
| 2 | eCFR — 47 CFR § 73.211 (FM power and antenna height). | Bảng (b)(1): hạng A 6 kW, HAAT 100 m, 28 km … hạng C 100 kW, HAAT 600 m, 92 km; (a)(1)(vii) ERP tối thiểu hạng C là 100 kW; (a)(2) HAAT hạng C ≥ 451 m; (b)(1)(i) "reference distance" = khoảng cách tới đường bao 1 mV/m. | A6, D8 |
| 2 | eCFR — 47 CFR § 73.310 (FM definitions) và § 73.402 (Digital audio broadcasting definitions). | 73.310(17): FM là điều chế mà tần số tức thời "varies in proportion to the instantaneous amplitude of the modulating signal"; 73.402(b): hệ IBOC phát tín hiệu số "in the same spectrum and on the same channel as its analog signal". | A4, D4, D5 |
| 2 | eCFR — 47 CFR § 15.247(b)(3). | "For systems using digital modulation in the 902-928 MHz, 2400-2483.5 MHz, and 5725-5850 MHz bands: 1 Watt." | A6, D8 |
| 2 | FCC 20-51, Report and Order — Unlicensed Use of the 6 GHz Band (thông qua 23/4/2020). https://docs.fcc.gov/public/attachments/FCC-20-51A1.pdf | Đoạn mở đầu: mở "1200 megahertz of spectrum… in the 6 gigahertz (GHz) band (5.925-7.125 GHz)" cho thiết bị không cần giấy phép, dùng qua "Wi-Fi, Bluetooth and similar protocols"; 802.11ax "features channels as large as 160 megahertz"; tr. 45: "160 MHz or wider channels which will allow more data to be transmitted in a shorter period of time". | A6, B2, D7, D8 |
| 2–3 | Bluetooth SIG — Tech overview; Key attributes: Reliability; Key attributes: Range. https://www.bluetooth.com/learn-about-bluetooth/tech-overview/ · …/key-attributes/reliability/ · …/key-attributes/range/ | Tổ chức sở hữu chuẩn — nguồn sơ cấp cho **thông số của chính chuẩn**. Tech overview: 2,4 GHz ISM (2,402–2,480 GHz dùng), Classic 79 kênh 1 MHz, LE 40 kênh 2 MHz, FHSS, điều chế GFSK/π/4 DQPSK/8DPSK, công suất ≤ 100 mW. Reliability: cùng băng 2,4 GHz với Wi-Fi; va chạm gói; kỹ thuật giảm va chạm và bù mất gói. Range: "Radio spectrum stretches from 30 Hz to 300 GHz. The lower the frequency the longer the range. However, the lower the frequency the lower the data rate"; các yếu tố tần số, PHY, độ nhạy máy thu, công suất phát, ăng-ten ("converts electrical energy… into electromagnetic energy (or radio waves) and vice-versa"), suy hao đường truyền. | A3, A6, B4, D5, D7, D8 |
| 3 | Wi-Fi Alliance — Wi-Fi (MAC/PHY). https://www.wi-fi.org/discover-wi-fi/wi-fi-certified-6 | "Introduced in 2024, Wi-Fi 7 enhances performance across the 2.4 GHz, 5 GHz, and 6 GHz bands". Chỉ dùng cho tên băng tần (đối chiếu chéo được với FCC 20-51 về 6 GHz). | B2, D7 |

Bậc 1–2 độc lập: NASA (4 trang), NIST, NOAA (2 trang), eCFR/FCC — đủ ≥3 nguồn độc lập. Không có nguồn bậc 1 (bài báo) vì mọi mệnh đề trong D là kiến thức chuẩn hoá hoặc thông số quy định; không đề xuất trích bài gốc của Shannon hay Hertz khi chưa đọc.

## D. Đoạn thay thế

### D1 — thay trường `summary`

```markdown
Mỗi ngày chúng ta gọi điện, xem video hay nghe nhạc qua tai nghe Bluetooth mà không cần dây nối. Âm thanh và hình ảnh không tự bay từ máy này sang máy kia: thứ được gửi đi là thông tin, được biến thành tín hiệu điện, gắn lên một sóng mang rồi phát đi bằng sóng vô tuyến, một loại sóng điện từ. Bài viết đi qua từng bước của quá trình ấy, và giải thích vì sao Wi-Fi nhanh nhưng phủ sóng gần, còn đài phát thanh thì ngược lại.
```

### D2 — thay toàn bộ khối sơ đồ ```` ```text ```` đầu thân bài (từ dòng ```` ```text ```` đầu tiên đến dòng ```` ``` ```` đóng khối, trước "## Sóng Điện Từ: Phương Tiện Vận Chuyển Thông Tin")

````markdown
```text
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
```
````

### D3 — thay toàn mục "## Sóng Điện Từ: Phương Tiện Vận Chuyển Thông Tin"

```markdown
## Sóng điện từ: phương tiện chở thông tin

Âm thanh là sóng cơ học: nó lan đi nhờ các phân tử không khí va chạm và truyền dao động cho nhau, nên không truyền được trong chân không. Sóng điện từ thì không cần môi trường: nó đi được qua không khí, qua nhiều loại vật liệu và cả khoảng chân không của vũ trụ.

Trong chân không, mọi sóng điện từ, từ sóng vô tuyến tới ánh sáng, đều đi với tốc độ ánh sáng: đúng 299.792.458 mét mỗi giây, tức khoảng 300.000 km/s. Khi đi qua vật chất, sóng chậm lại: ánh sáng đi trong không khí chậm hơn trong chân không, và trong nước còn chậm hơn nữa. Nước còn cản sóng vô tuyến rất mạnh. Sóng vô tuyến không đi được xa trong nước, nên các robot lặn dưới biển dùng chính sóng âm để liên lạc với tàu.

Phát thanh, truyền hình, Wi-Fi, Bluetooth và mạng di động 4G, 5G đều dùng sóng vô tuyến, phần có tần số thấp nhất của phổ điện từ.
```

### D4 — thay toàn mục "## Bước 1: Chuyển Âm Thanh Và Hình Ảnh Thành Dữ Liệu"

```markdown
## Bước 1: biến âm thanh và hình ảnh thành tín hiệu điện

Micro biến dao động của sóng âm thành tín hiệu điện. (Dưới nước, việc này do ống nghe thuỷ âm, hay hydrophone, đảm nhận.) Cảm biến ảnh trong camera là một mạng lưới điểm ảnh; mỗi điểm ảnh tích điện khi có ánh sáng chiếu vào, và lượng điện ấy được đọc ra thành tín hiệu. Loại cảm biến CMOS dùng trong camera điện thoại được phát triển tại Phòng thí nghiệm Sức đẩy Phản lực (JPL) của NASA vào thập niên 1990.

Với điện thoại di động, Wi-Fi và Bluetooth, tín hiệu điện ấy được số hoá thành dãy bit 0 và 1, rồi được mã hoá. Mã hoá ở đây gồm cả việc thêm những bit dư theo quy tắc toán học, để bên nhận phát hiện và sửa được lỗi xảy ra trên đường truyền.

Không phải hệ thống nào cũng số hoá. Phát thanh AM và FM truyền thống gửi thẳng tín hiệu tương tự (analog) của âm thanh, không qua bước biến thành bit.
```

### D5 — thay toàn mục "## Bước 2: Gắn Dữ Liệu Lên Sóng Điện Từ"

```markdown
## Bước 2: gắn thông tin lên sóng mang

Tín hiệu âm thanh hay dãy bit không được phát thẳng ra không trung. Máy phát tạo ra một sóng vô tuyến có tần số ổn định, gọi là **sóng mang** (*carrier wave*), rồi làm sóng ấy biến đổi theo thông tin cần gửi. Quá trình này gọi là **điều chế** (*modulation*).

- **Phát thanh FM:** tần số tức thời của sóng mang thay đổi tỉ lệ với biên độ của tín hiệu âm thanh.
- **Truyền dữ liệu số:** các bit được thể hiện bằng những thay đổi nhỏ của sóng mang, chẳng hạn dịch pha hoặc dịch tần số của nó. Tàu vũ trụ của NASA lẫn tai nghe Bluetooth đều dùng những cách điều chế như vậy.

Ăng-ten của máy phát biến năng lượng điện thành sóng vô tuyến và phát ra môi trường xung quanh.
```

### D6 — thay toàn mục "## Bước 3: Nhận Và Giải Mã"

```markdown
## Bước 3: nhận và giải mã

Ở máy thu, quá trình diễn ra theo chiều ngược lại:

- Ăng-ten thu sóng vô tuyến và biến nó trở lại thành tín hiệu điện.
- Máy thu **giải điều chế**: tách thông tin khỏi sóng mang.
- Với hệ thống số, dãy bit được giải mã và sửa lỗi, rồi dựng lại thành âm thanh hoặc hình ảnh.

Cuối cùng, loa biến tín hiệu điện thành dao động cơ học để tạo ra sóng âm mà tai nghe được, còn màn hình hiển thị dữ liệu thành các điểm ảnh.
```

### D7 — thay toàn mục "## Vì Sao Nhiều Thiết Bị Có Thể Hoạt Động Cùng Lúc?"

```markdown
## Vì sao nhiều thiết bị hoạt động cùng lúc được?

Phổ vô tuyến được chia thành nhiều dải tần, và mỗi dịch vụ được phân một phần. Ở Mỹ chẳng hạn, phát thanh FM dùng dải 88–108 MHz, chia thành 100 kênh rộng 200 kHz; mỗi đài phát trên một kênh, và người nghe chỉnh máy thu đúng tần số của đài mình muốn nghe. Tính đến năm 2026, Wi-Fi dùng các băng 2,4 GHz, 5 GHz và 6 GHz. Mạng di động dùng nhiều băng khác nhau tuỳ công nghệ và quốc gia.

Nhưng chia băng tần không giải quyết hết, vì Wi-Fi và Bluetooth dùng chung băng 2,4 GHz. Theo Bluetooth SIG, tổ chức quản lý chuẩn Bluetooth, hai gói tin có thể va nhau và hỏng nếu được phát cùng lúc trên cùng một kênh. Để giảm va chạm, Bluetooth chia băng thành nhiều kênh hẹp (79 kênh rộng 1 MHz với Bluetooth Classic, 40 kênh rộng 2 MHz với Bluetooth năng lượng thấp) và liên tục nhảy từ kênh này sang kênh khác, kỹ thuật gọi là trải phổ nhảy tần. Cùng với một số kỹ thuật khác để bù những gói tin bị mất, điều đó cho phép điện thoại, bộ phát Wi-Fi và tai nghe Bluetooth hoạt động cùng lúc, dù không loại bỏ hoàn toàn nhiễu.
```

### D8 — thay toàn mục "## Tại Sao Wi-Fi Nhanh Nhưng Truyền Không Xa Bằng Radio?"

```markdown
## Vì sao Wi-Fi nhanh nhưng phủ sóng gần hơn đài phát thanh?

Đây là hai câu hỏi, với hai câu trả lời khác nhau.

**Nhanh vì kênh rộng.** Kênh càng rộng thì càng truyền được nhiều dữ liệu trong cùng một khoảng thời gian. Chuẩn Wi-Fi 802.11ax cho phép kênh rộng tới 160 MHz, trong khi một kênh FM ở Mỹ chỉ rộng 200 kHz: kênh Wi-Fi rộng nhất gấp 800 lần. Năm 2020, Ủy ban Truyền thông Liên bang Mỹ (FCC) mở thêm 1.200 MHz ở băng 6 GHz cho các thiết bị không cần giấy phép như Wi-Fi, gấp 60 lần toàn bộ băng FM.

**Gần vì công suất nhỏ và ăng-ten thấp, không chỉ vì tần số.** Phạm vi phủ sóng phụ thuộc vào nhiều yếu tố: tần số, cách điều chế và sửa lỗi, độ nhạy của máy thu, công suất phát, ăng-ten và mức suy hao trên đường truyền. Thông thường, tần số càng thấp thì sóng đi càng xa, nhưng tốc độ dữ liệu cũng càng thấp. Chênh lệch giữa Wi-Fi và đài FM còn đến từ công suất. Ở Mỹ, thiết bị không cần giấy phép dùng điều chế số trong băng 2,4 GHz, nhóm có Wi-Fi, bị giới hạn công suất phát tối đa 1 W; một thiết bị Bluetooth phát tối đa 100 mW. Còn một đài FM hạng lớn nhất phát với công suất bức xạ hiệu dụng tới 100 kW, từ ăng-ten đặt cao hàng trăm mét so với địa hình xung quanh. Theo quy định của FCC, bán kính vùng phục vụ chuẩn của đài FM từ 28 km với hạng nhỏ nhất đến 92 km với hạng lớn nhất.
```

### D9 — thay toàn mục "## Kết Luận"

```markdown
## Kết luận

Âm thanh và hình ảnh không tự bay từ máy này sang máy kia. Micro và cảm biến ảnh biến chúng thành tín hiệu điện. Tín hiệu ấy được số hoá (với điện thoại, Wi-Fi, Bluetooth) hoặc giữ nguyên dạng tương tự (với phát thanh AM, FM truyền thống), rồi được điều chế lên một sóng mang và phát đi bằng sóng vô tuyến, loại sóng điện từ đi được cả trong chân không với tốc độ ánh sáng. Ở đầu kia, mọi bước diễn ra theo chiều ngược lại.

Wi-Fi nhanh vì có kênh rộng; đài phát thanh phủ xa vì phát ở tần số thấp hơn, với công suất lớn hơn rất nhiều và từ ăng-ten đặt cao. Còn nhiều thiết bị hoạt động cùng lúc được là nhờ phổ vô tuyến được chia thành nhiều dải tần, và nhờ những kỹ thuật tránh va chạm khi các thiết bị phải dùng chung một băng.
```

### D10 — thêm mục mới ở cuối thân bài, sau "## Kết luận"

```markdown
## Đọc thêm

- [Bức xạ điện từ: Từ sóng radio đến tia gamma](/articles/buc-xa-dien-tu-tu-song-radio-den-tia-gamma)
- [Sóng truyền năng lượng như thế nào?](/articles/song-truyen-nang-luong-nhu-the-nao)
- [Photon: "Hạt ánh sáng" thực sự là gì?](/articles/photon-hat-anh-sang-thuc-su-la-gi)
- [Từ electron đến dòng điện: Nguồn gốc của điện năng](/articles/tu-electron-den-dong-dien-nguon-goc-cua-dien-nang)
```

Bốn bài đều PUBLISHED + `factCheck = PASSED` (truy vấn 2026-10-09); tiêu đề chép nguyên văn từ CSDL. Hai bài đầu cùng chủ đề sóng/phổ điện từ; bài cuối cùng danh mục `dien-tu-va-anh-sang`.

### D11 — thay `title`, `seoDescription`, ghi công ảnh

- `title`: `Từ không khí đến sóng điện từ: vì sao âm thanh và hình ảnh truyền đi được mà không cần dây?` (giữ slug)
- `seoTitle`: giữ nguyên (`Vì sao âm thanh và hình ảnh truyền được qua sóng điện từ?` — đúng, không mang claim sai).
- `seoDescription`: `Âm thanh và hình ảnh được biến thành tín hiệu điện, điều chế lên sóng mang và phát đi bằng sóng vô tuyến. Vì sao Wi-Fi nhanh mà phủ sóng gần hơn đài FM?`
- `coverImageCredit` / `coverImageCreditEn`: như B6. `coverImageAlt` / `coverImageAltEn`: giữ nguyên.

**Thứ tự thân bài sau khi sửa:** sơ đồ (D2) → Sóng điện từ: phương tiện chở thông tin (D3) → Bước 1 (D4) → Bước 2 (D5) → Bước 3 (D6) → Vì sao nhiều thiết bị hoạt động cùng lúc được? (D7) → Vì sao Wi-Fi nhanh nhưng phủ sóng gần hơn đài phát thanh? (D8) → Kết luận (D9) → Đọc thêm (D10).

## E. Việc chưa làm / cần người

- **Đây là bài đã xuất bản → sửa là đính chính** (`content-rules.md`): một dòng trong `docs/content/corrections.md` cho các claim đổi — A2 (tốc độ "qua không khí, nước… với tốc độ ánh sáng" và "gần bằng tốc độ ánh sáng" → tốc độ c trong chân không, chậm hơn trong vật chất; sóng vô tuyến không đi xa trong nước), A3 (băng tần riêng → Wi-Fi và Bluetooth dùng chung 2,4 GHz, nhảy tần), A4 (mọi tín hiệu số hoá → AM/FM truyền thống là tương tự), A5 (gỡ con số độ trễ), A6 (phạm vi chỉ do tần số → công suất, ăng-ten, độ rộng kênh). `Revision` chụp bản trước trong cùng transaction; cập nhật `lastVerifiedAt`; nhập bảng nguồn mục C cùng lượt. Chưa có bản EN nên chưa có `enEdits`; khi dịch (bước 9) dịch từ bản ĐÃ sửa.
- **`reverifyDueAt`:** đề xuất 24 tháng — băng tần Wi-Fi và thông số Bluetooth là mệnh đề theo thời điểm (D7 ghi "tính đến năm 2026").
- **`readingTime`** sẽ đổi sau khi thay thân bài (bài dài lên) — tính lại khi áp D. **`entityId`** đang trống — knowledge-architect gán entity (bước 5) sau khi qua gate accuracy.
- **Bối cảnh Việt Nam:** mọi số về băng FM, công suất và vùng phủ trong D là của Mỹ (quy định FCC) và D ghi rõ "ở Mỹ". Chưa đọc được Quy hoạch phổ tần số vô tuyến điện quốc gia hay quy định công suất của Việt Nam. Nếu chủ sản phẩm muốn số của Việt Nam, người phải tìm văn bản gốc (Bộ Khoa học và Công nghệ / Cục Tần số vô tuyến điện) rồi thay — không đoán.
- **Giữ PUBLISHED hay về DRAFT trong lúc sửa:** chủ sản phẩm quyết. Phiếu này nghiêng về **sửa sớm, giữ PUBLISHED**: không có lỗi an toàn hay sức khoẻ, khung giải thích đúng, các lỗi là mô hình vật lý sai ở từng mục; nhưng A2 đang mâu thuẫn trực tiếp với bài `buc-xa-dien-tu-…` đã PASSED — nếu không sửa được trong 48 giờ thì nên đưa về DRAFT.
- Sửa CSDL production là việc của người (form `/admin` hoặc script người chạy). Agent không tự ghi, không đặt `reviewedById`, không đổi `factCheck`. Khi đã sửa theo D và gắn nguồn mục C, cần một lượt duyệt lại để chuyển `factCheck`.

## F. Ghi chú thẩm định

- **Cách đọc bài:** script tạm chỉ đọc (Prisma `findUnique`/`findMany`) trong `sciencepedia/scripts/tmp-sw-read*.ts`, đã xoá ngay sau khi chạy. Không ghi CSDL.
- **Đối chiếu kho:** grep CSDL toàn bộ bài PUBLISHED theo các từ khoá sóng điện từ / âm thanh / chân không / GHz / MHz / Bluetooth / Wi-Fi / sóng mang / điều chế. Mâu thuẫn duy nhất: tốc độ (A2) với `buc-xa-dien-tu-tu-song-radio-den-tia-gamma` (PASSED). Phân loại Wi-Fi là "vi sóng" ở bài ấy không mâu thuẫn với D (B4). `song-truyen-nang-luong-nhu-the-nao` (PASSED) nói đúng về âm thanh trong chân không — khớp với D3. `photon-hat-anh-sang-thuc-su-la-gi` ghi "c ≈ 300.000 km/s" trong chân không — khớp. Không bài nào khác trong kho nói về băng tần Wi-Fi/Bluetooth hay điều chế.
- **Micro:** không nguồn đã đọc nêu trực tiếp cơ chế micro của điện thoại (phần lớn không phải gốm áp điện như hydrophone). D4 giữ ở mức "biến dao động của sóng âm thành tín hiệu điện" và chỉ nêu hydrophone như phép so sánh của NOAA, không nói "cùng nguyên lý". Nếu người duyệt muốn chặt hơn, có thể bỏ câu trong ngoặc.
- **Wi-Fi và 47 CFR 15.247:** quy định nói "systems using digital modulation in the… 2400-2483.5 MHz… bands: 1 Watt", không gọi tên Wi-Fi. Việc Wi-Fi ở 2,4 GHz thuộc nhóm này là suy ra từ Wi-Fi Alliance (Wi-Fi dùng 2,4 GHz) + FCC 20-51 (Wi-Fi là thiết bị không cần giấy phép). D8 vì vậy viết "thiết bị không cần giấy phép dùng điều chế số trong băng 2,4 GHz, nhóm có Wi-Fi", không viết "Wi-Fi bị giới hạn 1 W" như một trích dẫn trực tiếp. Giới hạn 1 W là công suất dẫn ra ăng-ten, còn 100 kW của đài FM là công suất bức xạ hiệu dụng — hai đại lượng không so trực tiếp được, nên D8 không nêu tỉ số.
- **Phép tính trong D8:** 160 MHz ÷ 200 kHz = 800; 1.200 MHz ÷ (108 − 88) MHz = 60. Cả bốn số lấy từ nguồn (FCC 20-51; 47 CFR 73.201).
- **"Tần số càng thấp thì càng xa":** chỉ đọc được ở Bluetooth SIG (bậc 2–3, nguồn công nghiệp), với chữ hàm ý quy luật chung. D8 giữ chữ "thông thường" như bài gốc và đặt nó cạnh danh sách đủ các yếu tố — không nâng thành nguyên nhân duy nhất.
- **Độ trễ (A5):** chủ ý không thay bằng số khác. Có khuyến nghị ITU-T G.114 về độ trễ một chiều của thoại, nhưng chưa đọc → không dùng.
- **Ảnh bìa:** đã tải bản R2 (1920×1078) và xem: sơ đồ NASA "The Electromagnetic Spectrum", có các vùng "Atmosphere Opaque to Wavelengths", "Radio Window", "Optical Window", biểu tượng AM radio, FM Radio, Cell Phone and Wi-Fi… Alt hiện tại mô tả đúng. Tệp gốc trên NASA: `assets.science.nasa.gov/…/ems/EMS_Diagram_09172025.jpg`, liên kết từ các trang Tour of the EM Spectrum.
- **Lỗi mẫu cho prompt `article-generator`:** bài lặp ba hình dạng đã có quy tắc — **chọn một kể như tất cả** (quy tắc 15: số hoá kể như mọi hệ thống; tần số kể như nguyên nhân duy nhất của phạm vi), **chủ thể bị nới rộng** (quy tắc 18: tốc độ trong chân không gán cho không khí và nước), **hệ quả tự mâu thuẫn** (quy tắc 14: "băng tần riêng" đặt trên danh sách hai hệ cùng băng). Thêm một **con số cụ thể không nguồn** (độ trễ) đúng dạng của mục "Bài dán từ công cụ AI".
