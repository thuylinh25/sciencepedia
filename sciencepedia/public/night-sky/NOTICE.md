# VirtualSky — ghi công và giấy phép

Thư mục này chứa bản sao **tự host** của VirtualSky, planetarium chạy trên
trình duyệt, phục vụ trang `/night-sky` ("Bầu trời đêm nay") của Sciencepedia.

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

Không sửa đổi mã engine. `lang/vi.json` là tệp mới do Sciencepedia viết.
