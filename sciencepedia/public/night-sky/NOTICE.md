# VirtualSky — ghi công và giấy phép

Thư mục này chứa bản sao **tự host** của VirtualSky, planetarium chạy trên
trình duyệt, phục vụ trang `/night-sky` ("Mô phỏng bầu trời") của Sciencepedia.

- Tác giả: **Stuart Lowe**, khởi tạo tại **Las Cumbres Observatory (LCO)**
  — "(c) Stuart Lowe, Las Cumbres Observatory Global Telescope" (theo dòng
  bản quyền ở đầu tệp `virtualsky.js`).
- Mã nguồn gốc: https://github.com/slowe/VirtualSky
  Bản sao này lấy từ commit `271c801d6504d1c478bc0c64dce4938399749c69`
  (2023-10-31), phiên bản engine 0.7.7.
- Trang dự án: https://slowe.github.io/VirtualSky/ — dự án ghi rõ VirtualSky
  được cung cấp **miễn phí cho mục đích giáo dục và phi lợi nhuận** và được
  thiết kế để nhúng vào các website khác. Sciencepedia là nền tảng giáo dục
  phi lợi nhuận, dùng đúng phạm vi đó và ghi công tại chân trang công cụ.

## Vì sao chỉ gồm các tệp này

Chỉ các tệp *runtime* được đưa vào:

- `virtualsky.js`, `stuquery.min.js` (thư viện phụ trợ stuQuery),
  `virtualsky-planets.js` (plugin lịch thiên văn hành tinh);
- dữ liệu engine tự nạp theo đường dẫn tương đối với vị trí của
  `virtualsky.js`: `stars.json`, `lines_latin.json`, `boundaries.json`,
  `showers.json`, `galaxy.json`;
- `lang/en.json` (nguyên bản) và `lang/vi.json` (bản dịch tiếng Việt của
  Sciencepedia: tên 88 chòm sao, hành tinh và các chuỗi giao diện trong
  canvas — tên riêng của sao giữ nguyên như bản gốc).

Không đưa vào: thư mục `geo/` (~8,4 MB tệp tra cứu địa danh của tính năng
tìm nơi quan sát tích sẵn — Sciencepedia dùng danh mục thành phố riêng trong
`src/lib/night-sky/locations.ts`), các bản engine cũ trong `old/`, tệp kiểm
thử, trang ví dụ và `excanvas.min.js` (chỉ cho Internet Explorer).

## Sửa đổi so với bản gốc

- `lang/vi.json` là tệp mới do Sciencepedia viết.
- **Phase 2 (2026-10-28):** `VirtualSky.prototype.toggleInfoBox` trong
  `virtualsky.js` được thêm một dòng `return this;` ở đầu hàm (có chú thích
  tại chỗ) để vô hiệu hoá hộp thông tin tích sẵn của engine — thông tin
  thiên thể do panel của Sciencepedia hiển thị. Đây là sửa đổi mã engine
  duy nhất; cấu hình của Sciencepedia vốn không truyền tuỳ chọn `objects`
  nên hộp đó cũng không bao giờ có nội dung, dòng `return` chỉ chốt chặn
  để bản nâng cấp engine sau này không vô tình bật lại nó (kèm theo các
  request tra cứu ra ngoài mà Sciencepedia không cho phép).
- **2026-10-29 (PATCH-SCIENCEPEDIA-2):** phép chiếu `stereo` trong
  `virtualsky.js` vốn vẽ theo phương vị/độ cao với hệ số cố định
  `f = 0.42` và *không hề đọc `fov`* — gọi `setFOV` chỉ đổi con số, hình
  không đổi (đây là lý do tính năng thu phóng của trang từng "đổi số mà
  không zoom"). Hai chỗ `var f = 0.42;` trong khối `'stereo'` (ở
  `azel2xy` và hàm ngược `xy2azel`) được đổi thành hệ số suy ra từ
  `this.fov`: `0.42 * 30 / this.fov` (kèm fallback 0.42 khi `fov` không
  hợp lệ). Ở `fov = 30` (mặc định) hình vẽ y hệt bản gốc; `fov` nhỏ/lớn
  hơn cho thu/phóng thật, và vì hàm ngược dùng cùng hệ số nên kéo, click
  chọn và toạ độ con trỏ vẫn nhất quán. Ngoài khối `'stereo'` không chỗ
  nào bị đụng.

- **2026-10-29 (PATCH-SCIENCEPEDIA-3):** `VirtualSky.prototype.setWH`
  gán buffer canvas theo `devicePixelRatio` (tối đa 2) và đặt
  `ctx.setTransform(dpr, …)` ngay trong `setWH` (sau khi gán width,
  vì gán width reset trạng thái ngữ cảnh). Bản gốc gán buffer bằng
  điểm CSS nên trên màn hình retina/điện thoại hình bị phóng mờ.
  Toạ độ vẽ vẫn là điểm CSS (`wide`/`tall` không đổi), toạ độ chuột
  của engine vốn tính theo `pageX` nên không lệch; ảnh chụp của trang
  dùng đúng buffer nên nét theo.
  *Sửa tiếp cùng ngày:* bản vá đầu đặt hệ số qua `this.ctx`, nhưng lần
  gọi `setWH` đầu tiên chạy trong constructor *trước* khi `this.ctx`
  được gán nên hệ số bị bỏ qua — trên điện thoại bầu trời chỉ vẽ vào
  một góc bộ đệm và kéo là chồng hình (Linh báo 2026-10-29; máy tính
  kiểm tra có DPR 1 nên không lộ). Nay `setWH` lấy ngữ cảnh thẳng từ
  canvas (`this.c.getContext('2d')`, cùng một đối tượng) nên hệ số
  được áp ngay từ lần dựng đầu tiên.
- **2026-10-29 (PATCH-SCIENCEPEDIA-4):** khối tạo nút trợ giúp `?`
  (`_btn_help`) trong `draw()` vốn chạy vô điều kiện ở góc trên-phải
  canvas, đè lên nút toàn màn hình của trang. Nay khối đó chỉ chạy
  khi tuỳ chọn `showhelp` bật — Sciencepedia không bật `showhelp`
  (trang đã có dòng hướng dẫn riêng), nên nút không còn xuất hiện.
- **2026-10-29 (PATCH-SCIENCEPEDIA-5):** `VirtualSky.prototype.fontsize`
  hạ một bậc cỡ chữ cho khung hẹp: cạnh nhỏ nhất của khung < 500 px
  dùng 11 px (bản gốc 12 px), < 600 px dùng 13 px (bản gốc 14 px);
  từ 600 px trở lên giữ nguyên như gốc. Trên điện thoại (~360 px),
  nhãn 12 px quá to so với khoảng cách giữa các điểm neo chòm sao ở
  vùng dày như Nhân Mã – Thiên Yết nên đè lên nhau (Linh báo
  2026-10-29). `fontsize()` là điểm nghẽn duy nhất của mọi chữ
  engine vẽ (nhãn chòm sao, hành tinh, điểm phương hướng, ghi công)
  nên sửa ở đây là đồng đều, và vì nó đọc kích thước sống nên tự
  đúng lại khi xoay máy hay vào toàn màn hình.

- **2026-10-29 (PATCH-SCIENCEPEDIA-6):** `VirtualSky.prototype.drawPlanet`
  vẽ lại các thiên thể có bề mặt: bản gốc vẽ Mặt Trời, Mặt Trăng và
  mọi hành tinh cùng một kiểu chấm tròn đặc vài pixel — Mặt Trời
  trông như một ngôi sao, Sao Thổ không có vành (Linh báo kèm ảnh
  tham chiếu TheSkyLive 2026-10-29). Bản vá: Mặt Trời là đĩa sáng
  có quầng; Mặt Trăng có pha thật (hình học từ kinh độ hoàng đạo
  của Mặt Trời/Mặt Trăng của chính engine + vị trí Mặt Trời chiếu
  lên màn hình, qua helper mới `drawMoonPhase`); Sao Thổ có vành
  elip nghiêng cố định vẽ hai nửa trước/sau đĩa (helper
  `drawSaturnRing` — góc nghiêng là quy ước trình bày, vành chỉ là
  ký hiệu nhận diện, không phải dữ kiện đo); Sao Mộc có hai dải
  ngang; Sao Kim có quầng mờ; mọi hành tinh có bán kính tối thiểu
  lớn dần theo mức phóng to. Kích thước đĩa là phóng đại trình bày
  (đĩa thật chỉ vài giây cung) nhưng vị trí, màu và pha Mặt Trăng
  lấy từ dữ kiện của engine. Chế độ âm bản (in ấn) và chế độ chỉ
  hiện nhãn giữ nguyên cách vẽ gốc.

## astronomy-engine — thư viện tính toán thiên văn (Phase 2)

Cùng thư mục này chứa `astronomy.browser.js`: bản dựng trình duyệt của
**astronomy-engine 2.1.19** (Don Cross — cosinekitty), thư viện tính vị
trí Mặt Trời, Mặt Trăng và các hành tinh, giờ mọc/lặn và pha trăng ngay
trong trình duyệt.

- Nguồn: gói npm chính thức `astronomy-engine@2.1.19`,
  https://registry.npmjs.org/astronomy-engine/-/astronomy-engine-2.1.19.tgz
  (dự án gốc: https://github.com/cosinekitty/astronomy).
- Giấy phép: **MIT** — bản đầy đủ ở `astronomy-engine.LICENSE.txt` cùng
  thư mục (gói npm không kèm tệp LICENSE riêng; văn bản giấy phép lấy từ
  phần đầu `@preserve` của mã nguồn, và cũng được giữ nguyên trong chính
  tệp `astronomy.browser.js`).
- Chỉ tệp bản dựng trình duyệt được vendor; mã nguồn còn lại của gói
  không đưa vào. Sciencepedia không sửa đổi tệp này — mọi lời gọi đi qua
  lớp bọc có kiểu trong `src/lib/night-sky/astro.ts`.
