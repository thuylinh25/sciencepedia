# Hệ thiết kế

Token, quy tắc và những đánh đổi đã chốt. Giá trị cụ thể đọc trong
`sciencepedia/src/app/globals.css`; file này giữ **lý do**, để lần sau không ai
"sửa lại cho đẹp" đúng chỗ vừa được cân nhắc.

Cập nhật: 2026-09-03

---

## Nguyên tắc token: tách vai trò nền khỏi vai trò chữ

Một màu ngữ nghĩa cần **hai** token khi nó vừa làm nền vừa làm chữ. Cùng một giá
trị không thể đạt contrast ở cả hai vai trò.

Ví dụ đã xảy ra: `--destructive` dùng làm màu chữ chỉ đạt ~3.9:1 trên nền sáng.
Nên có thêm `--destructive-strong` — đỏ đậm hơn, chỉ dùng cho **chữ trên nền sáng**.
`--destructive` giữ vai trò nền.

**Áp dụng quy tắc này cho mọi màu ngữ nghĩa mới.** Nếu bạn định viết
`text-<màu>` mà màu đó cũng đang được dùng làm `bg-<màu>`, dừng lại và tạo token
`-strong`.

## Token đang có

| Nhóm | Token | Dùng cho |
|---|---|---|
| Ngữ nghĩa | `--success`, `--warning`, `--destructive`, `--destructive-strong` | Trạng thái. Có token rồi thì **không** gọi `emerald-600`/`amber-700` thô của Tailwind — palette thô nằm ngoài tầm kiểm soát dark mode và contrast. |
| Nhịp dọc | `--space-section` (5rem), `--space-page` (3.5rem) | Utility `.section-gap`, `.page-pad`. Trước đó mỗi trang tự chọn `mt-24`/`mt-28`/`py-14`/`py-16`, không trang nào giống trang nào. |
| Bề ngang chữ | `--measure-prose` (42rem) | `.article-prose`. Trước là `max-w-none` cho ra ~85 ký tự/dòng, vượt ngưỡng đọc lâu. Quy tắc này phải đứng **sau** `max-width:65ch` của plugin typography để thắng. |

---

## Focus ring

Có quy tắc `:focus-visible` cơ sở trong `globals.css` đặt cả **kiểu và độ dày**
(`outline: 2px solid var(--ring); outline-offset: 2px`), loại trừ các `data-slot`
đã tự vẽ ring (button/input/textarea/select-trigger) để không vẽ chồng hai lớp.

Vì sao cần: trước đó chỉ có `* { @apply outline-ring/50 }` — chỉ đặt **màu**, nên
focus phụ thuộc viền mặc định trình duyệt và **biến mất hoàn toàn** ở mọi chỗ có
`outline-none`.

**Cảnh báo:** utility `outline-none` nằm ở layer `utilities` nên thắng quy tắc base.
Component nào dùng `outline-none` phải tự thêm ring — sửa tại chỗ, không trông chờ
quy tắc cơ sở. Đã xảy ra ở `sheet.tsx` và hai `DropdownMenuTrigger` trong
`site-header.tsx`.

---

## Đánh đổi đã chốt

**Badge lĩnh vực bỏ mã màu theo category.** Trước đây badge dùng
`style={{ backgroundColor: category.color, color: "#fff" }}`. `color` do biên tập
viên nhập vào CSDL — không có gì bảo đảm cặp (màu đó, chữ trắng) đạt 4.5:1. Vàng
nhạt là giá trị hợp lệ ở ô chọn màu và không đọc nổi.

Nay: nền tối cố định (`bg-space-900/75 text-star`) + **chấm màu** lĩnh vực. Chấp
nhận mất mã màu theo lĩnh vực để đổi lấy contrast bảo đảm ở mọi giá trị trong CSDL.

Cùng lý do, breadcrumb dùng chấm màu thay vì lấy màu CSDL làm màu chữ.

Nếu muốn lấy lại mã màu theo lĩnh vực: phải kiểm contrast **ngay tại ô chọn màu
trong admin**, không phải ở chỗ hiển thị.

**Vùng chạm 40px trên header.** Chuẩn nội bộ là 44px (AAA) và pagination đã theo
chuẩn đó. Riêng nút icon trên header giữ 40px vì ngân sách bề ngang header đã căn
rất sát ở 390px — xem comment trong `site-header.tsx`. 40px vẫn vượt xa ngưỡng AA
(2.5.8 yêu cầu 24px). Đây là ngoại lệ có chủ ý, không phải sót.

---

## Quy tắc component

**Mục lục.** Bản desktop và bản di động dùng chung `HeadingList` + hook
`useActiveHeading`. Bản di động dựng bằng `<details>` — nằm sẵn trong HTML đầu
tiên, mở/đóng không cần JS. Trước đó TOC là `hidden lg:block`, nghĩa là bài dài ở
390px chỉ còn nước cuộn.

**Id heading.** Sinh bằng `nodeToText()` đệ quy, không phải `String(children)`.
`String()` cho ra `"[object Object]"` khi heading chứa định dạng nội tuyến
(**đậm**, `code`, link) — id rác, mọi link TOC trỏ vào hư không. `extractHeadings`
trong `lib/utils.ts` cũng gỡ cú pháp link để id hai bên khớp nhau.

**`EmptyState`.** Hai quy tắc gói trong component: trạng thái rỗng phải nói **đang
thiếu gì** (không nói chung chung), và **không bao giờ là ngõ cụt** — `children`
luôn là lối đi tiếp. Đừng viết khối rỗng tự chế; nếu lý do rỗng khác nhau thì
truyền prop `empty`, đừng mượn câu của nơi khác.

**Breadcrumb.** `<nav aria-label>` + `<ol>` + `aria-current="page"`. Phải khớp cấu
trúc `BreadcrumbList` trong JSON-LD.

**Bảng trong thân bài.** Vùng cuộn ngang phải có `tabIndex={0}`, nếu không người
dùng bàn phím không xem được phần ngoài khung (WCAG 2.1.1).

---

## Chưa làm — cần quyết

**`prefers-reduced-motion` cho các cảnh WebGL ở trang trong.** Hai khối ở trang
chủ (`hero-galaxy`, `solar-preview`) đã xử lý — xem mục riêng bên dưới. Nhưng
`universe-scene` và `globe-scene` ở các trang `/universe`, `/zoom`,
`/solar-system` vẫn chạy `useFrame` mà không đọc thiết lập này.

**Bố cục hero trang bài viết.** `-mt-40` kéo khối tiêu đề đè lên ảnh bìa `52vh`.
Gradient che được phần dưới, nhưng contrast ở phần trên vùng chồng không bảo đảm
được về mặt toán học. Sửa đúng nghĩa là thiết kế lại hero.

**Ảnh bìa không có chỗ ghi nguồn/giấy phép.** `Article.coverImage` là `String?`
trần. Đây là lỗ hổng mô hình dữ liệu, không sửa được bằng UI.

**Ảnh trong Markdown vẫn dùng `<img>`** thay `next/image` vì không biết trước kích
thước (có `eslint-disable` giải thích). Muốn theo đúng chuẩn thì phải lưu
width/height khi nhập ảnh.

---

## Trạng thái dự phòng không được trông giống trạng thái hỏng

Quy tắc rút từ một lỗi đã tốn ba vòng qua lại: khối 3D ở hero có ảnh chờ là một
quả cầu vẽ bằng gradient CSS. Khi điều kiện mount không thoả, người xem thấy quả
cầu phẳng lì đó — **y hệt một cảnh WebGL bị lỗi**. Không ai, kể cả người viết
code, phân biệt được "chưa dựng" với "dựng hỏng".

Hệ quả: mỗi khi thêm một fallback, hỏi *nếu thứ thật hỏng thì màn hình trông thế
nào?* Nếu câu trả lời trùng với fallback thì fallback đó sai. Cho nó một dấu hiệu
riêng, hoặc bỏ hẳn điều kiện chặn.

Trường hợp khối Hệ Mặt Trời còn thêm một biến thể: ảnh chờ CSS **không được tắt**
khi cảnh 3D lên, và vì canvas bật `alpha` nên các vòng tròn cùng chấm trắng của
nó hiện xuyên qua, chồng lên quỹ đạo thật thành hình đôi. **Quầng sáng mềm thì
chồng lên nhau được, đường kẻ cứng thì không.**

---

## Chuyển động: đo bằng độ trên giây, đừng cảm nhận

`galaxy-scene` quay ở `delta * 0.035 * settings.speed` rad/s. Đặt `speed: 0.3`
nghe như "chậm nhẹ"; thực tế là **0,6 độ/giây — một vòng mười phút**, tức mắt
người đọc ra là đứng yên.

Trước khi chốt một tốc độ, quy nó ra độ/giây và ra thời gian một vòng. Con số đó
mới là thứ người xem cảm nhận.

Cùng bài học ở `solar/scene`: `orbitSpeed` tỉ lệ với chu kỳ THẬT, dải từ 1.607
(Thuỷ) xuống 0.006 (Hải Vương) — chênh 270 lần. Một `speed` chung không thể vừa
cho Thuỷ Tinh chậm dễ nhìn vừa cho Hải Vương nhúc nhích. **Không nén dải đó lại:**
đây là bách khoa toàn thư khoa học, và việc hành tinh ngoài chậm hơn hàng trăm
lần là một sự thật của mô hình chứ không phải lỗi cần chữa.

---

## Khung phải theo hình dạng của thứ đang vẽ

Đĩa Hệ Mặt Trời nhìn nghiêng ~27° trải theo chiều ngang gấp đôi chiều dọc. Đặt nó
trong khung vuông thì hai bên tràn ra ngoài canvas và hành tinh ngoài bị **chặt
theo một đường thẳng đứng**.

Khoảng cách camera thì **tính từ dữ liệu, đừng đoán rồi thử**. Với camera ở
`[0, d/2, d]` nhìn về gốc và fov 45°, nửa bề ngang nhìn thấy ở mặt phẳng gốc xấp
xỉ `0,46 · d · (tỉ lệ khung)`. Quỹ đạo xa nhất là Sao Hải Vương ở 43 đơn vị, cộng
bán kính hành tinh và vành đai Sao Thổ thì cần chừng 47. Khung 16/9 với `d = 72`
cho ~59 — dư khoảng 25%.

---

## Ba cái bẫy CSS đã cắn thật

**1. Phần tử có `position` vẽ trên phần tử tĩnh, bất kể thứ tự DOM.**
Thanh thống kê thụt lên 40px để chờm vào đáy hero. Hero là `relative`, thanh số
tĩnh — nên dải gradient ở đáy hero phủ lên và **cắt cụt phần đầu các icon**. Triệu
chứng trông y như lỗi căn giữa, và đã bị chữa nhầm hai lần (`justify-center`, rồi
`leading-none` → `leading-tight`) trước khi tìm ra. Bất kỳ khối nào dùng margin âm
để chồng lên khối khác đều phải có `relative z-*`.

**2. Selector kiểu `[&_[data-slot=button]]` thắng utility class thường.**
`site-header` vá màu chữ cho mọi nút khi nằm trên nền tối. Nút "Đăng nhập" nền
vàng bị ép chữ trắng — khoảng 1,6:1. Một quy tắc quét `*` hay quét theo thuộc tính
sẽ trúng cả những thứ không định trúng; khi thêm loại nút mới, kiểm lại các quy
tắc quét đang có.

**3. `visible={false}` làm raycaster bỏ qua vật thể.**
Muốn một vùng chạm vô hình trong cảnh 3D thì dùng `opacity={0}` với
`depthWrite={false}`, không dùng `visible={false}` — ẩn đi là mất luôn vùng chạm.

Đi kèm: sprite cỡ 0,5 đơn vị cảnh chỉ là vài pixel trên màn hình, nên đặt sự kiện
lên chính sprite thì tia bấm gần như không trúng. Vật thể nhỏ trong cảnh 3D cần
hình bắt sự kiện lớn hơn phần nhìn thấy.

---

## `prefers-reduced-motion` và WebGL

Quy tắc CSS toàn cục **không chạm được** vòng lặp `useFrame`. Nó chỉ đặt
`animation-duration` cho animation CSS. Chuyển động trong cảnh 3D buộc phải điều
khiển bằng JS.

Và một bài học về mức độ: **nửa vời tệ hơn cả hai đầu.** Cho thiên hà quay
1 độ/giây khi người dùng xin giảm chuyển động thì không đủ chậm để gọi là tôn
trọng thiết lập, cũng không đủ nhanh để thấy — kết quả là khối bị báo hỏng thêm
một lần nữa. Hoặc dừng hẳn, hoặc chạy thật.

Trạng thái hiện tại: chủ sản phẩm chọn **chạy thật cho mọi người**. Hằng số
`NORMAL_SPEED` trong `hero-galaxy.tsx` và `solar-preview.tsx` là chỗ duy nhất cần
sửa nếu muốn khôi phục chế độ dịu. Ngoại lệ cho hai animation nền
(`.starfield::before`, `.animate-aurora`) nằm ngay dưới quy tắc chặn trong
`globals.css`.

---

## Icon mang theo tuyên bố

Chọn icon là một phát biểu, không phải trang trí:

- 🔥 hay 📈 cho bảng xếp hạng ngụ ý **"đang tăng nhanh"** — một tuyên bố về xu
  hướng. Dữ liệu chỉ là lượt đọc cộng dồn. Dùng số thứ hạng.
- `Languages` của lucide vẽ chữ **文** ghép với A. Trên site chỉ có tiếng Việt và
  tiếng Anh, nó khiến người dùng tưởng có ngôn ngữ khác. Dùng `Globe`.
- `⌘` là phím Command, chỉ có trên Mac. Nhãn phím tắt phải theo hệ điều hành —
  mặc định `Ctrl` ở HTML dựng sẵn, đổi sang `⌘` sau khi hydrate nếu là Mac.

## Cùng một sản phẩm trên mọi màn hình — hạ độ mịn, đừng đổi thứ đang xem

Mô hình 3D Hệ Mặt Trời ở trang chủ từng chỉ mount từ `lg` trở lên, lấy lý do
tiết kiệm pin; dưới ngưỡng đó là bốn vòng tròn CSS. Phản hồi nhận được: "trên
điện thoại mô hình 3D hỏng, không giống máy tính" — và đó là phản hồi đúng.

Đây là lần thứ hai vấp cùng một nguyên tắc đã ghi ở mục *Trạng thái dự phòng
không được trông giống trạng thái hỏng*, nhưng ở một dạng khác đáng tách riêng:
lần trước là **dự phòng trông như lỗi**, lần này là **dự phòng trông như một
thứ khác hẳn**. Người dùng so sánh giữa hai thiết bị của chính họ, và khi hai
bên hiện ra hai vật khác nhau thì kết luận tự nhiên là bên yếu hơn bị hỏng.

Quy tắc: chặn theo bề rộng màn hình thì chặn **mức chi tiết**, đừng chặn **có
hay không**. Với cảnh WebGL, hai chỗ đắt nhất và đáng hạ là `dpr` (điện thoại có
mật độ điểm ảnh cao nhất trên GPU yếu nhất — `dpr` 2 ở đó là dựng gấp bốn số
điểm ảnh trên phần cứng kém gấp mấy lần) và số hạt nền. Đừng bớt hành tinh, đừng
bỏ texture: hình dạng của thứ đang xem phải giữ nguyên.

Điều kiện để làm được: tài nguyên nặng phải nạp **không chặn**. `useProgressiveTexture`
vẽ cảnh ngay bằng màu phẳng rồi thay ảnh khi ảnh về, nên trường hợp xấu nhất
trên mạng yếu là tám quả cầu màu đang quay — vẫn là Hệ Mặt Trời, không phải
khung đen. Nếu tài nguyên còn nạp kiểu treo cả cảnh thì phải sửa chỗ đó trước,
chưa mở cho màn hình nhỏ được.
