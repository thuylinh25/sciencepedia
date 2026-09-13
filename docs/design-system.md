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

**Bố cục hero trang bài viết.** `-mt-28` kéo khối tiêu đề đè lên ảnh bìa `58vh`.
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

## Bốn cái bẫy CSS đã cắn thật

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

**4. Lớp cascade đứng TRÊN độ ưu tiên — utility Tailwind thua CSS không layer.**
Ô đầu và ô cuối của bảng trong bài dính sát viền khung. Sửa hai lần bằng utility
trên thẻ bọc — `[&_td]:px-4` rồi `[&_td:first-child]:pl-4` — cả hai đều không
đổi được gì, dù bản sau có độ ưu tiên (0,2,1) so với (0,1,0) của typography.

Lý do: utility của Tailwind v4 nằm trong `@layer utilities`, còn `.article-prose`
trong `globals.css` **không nằm trong layer nào**. CSS so lớp cascade TRƯỚC, so
specificity SAU, và luật không layer luôn thắng luật có layer — chênh bao nhiêu
bậc specificity cũng vô nghĩa.

Dấu hiệu nhận ra: thêm class mà DevTools không hề gạch ngang luật cũ, hoặc tăng
specificity mấy lần vẫn không nhúc nhích. Lúc đó dừng tính specificity lại và đi
xem luật kia nằm trong layer nào.

Cách sửa: viết luật ở cùng chỗ không-layer với thứ đang cần đè, và cho nó
specificity cao hơn — `.article-prose td` là (0,1,1), hơn (0,1,0) của
`:where()`. Nói chung: **muốn đè kiểu của `prose` thì viết CSS trong
`globals.css`, đừng dán utility lên thẻ.**

Cách kiểm, không phải đoán: dựng xong thì tìm cả hai luật trong
`.next/static/css/*.css` và xem luật nào nằm trong `@layer`.

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


## Trang xác thực không mang khung của site

Chốt 2026-09-13.

`/login`, `/register`, `/forgot-password`, `/reset-password` dùng chung
`AuthShell` — khung hai cột cao bằng cửa sổ, tự có footer pháp lý tối giản.
Header đã rút gọn từ trước; nay footer đầy đủ cũng không render trên bốn route
này (`FooterSlot` + `src/lib/auth-routes.ts`).

Vì sao bỏ hẳn chứ không thu nhỏ: dải số liệu cộng bốn cột liên kết cao hơn cả
form đăng nhập, nên nó biến một trang đáng lẽ gọn trong một màn hình thành trang
phải cuộn — và thứ người ta cuộn tới là hai mươi lối đi khác, đặt ngay dưới ô
mật khẩu đang gõ dở. Cùng lập luận đã dùng khi rút gọn header.

Ba cái bẫy nhỏ ở cột phải, cả ba đều đã cắn thật:

- **Hình minh hoạ tràn qua mép** đọc ra là "ảnh tải thiếu", không phải "hình lớn
  hơn khung". Thủ pháp tràn mép chỉ hợp với thứ không có đường viền rõ (vệt sáng,
  thiên hà); một quyển sách mở thì không. Nay hình nằm trọn trong khung.
- **Dấu ngoặc kép ghim bằng `absolute`** trườn lên đè dòng đầu của câu trích
  ngay khi câu dài thêm một dòng. Toạ độ tuyệt đối chỉ đúng với đúng một cỡ chữ.
  Nay nó là khối trong luồng.
- **Dấu mở không có dấu đóng** không đọc ra là ngoặc kép, chỉ ra một hình trang
  trí đặt cạnh câu.

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

## Nhãn trong cảnh 3D: một lượt tránh đè cho tất cả

Chốt 2026-09-06, sau khi nhãn ở trang Vũ trụ đè lên nhau ở mức thu nhỏ mặc định.

Ba lỗi độc lập, và cả ba đều dễ lặp lại ở bất kỳ cảnh 3D nào có nhãn:

**1. Mỗi nhóm nhãn tự lo lấy mình.** `Landmarks` có logic tránh đè, `ScaleShells`
không có gì cả, và chúng render trong hai `<group>` tách biệt nên không nhóm nào
biết nhóm kia chiếm chỗ nào. **Một cơ chế tránh đè chỉ nhìn thấy một nửa số nhãn
thì không phải cơ chế tránh đè.** Gom mọi ứng viên vào một danh sách có thứ tự ưu
tiên, chạy một lượt, phát tập kết quả xuống.

**2. Chiếu tâm vật thể thay vì điểm neo của nhãn.** `<Html>` thường được đặt lệch
lên trên vật thể, và độ lệch đó khác nhau giữa các loại mốc. Chiếu sai điểm thì
phép kiểm đúng trên giấy mà sai trên màn hình — ở đây chênh 8 px là đủ lật ngược
quyết định.

**3. Ngưỡng pixel cứng, trong khi drei co giãn nhãn theo khoảng cách camera.**
Cùng một cặp nhãn, lúc thu nhỏ cách nhau 30 px, lúc phóng to cách nhau 300 px.
Phải chép đúng công thức của thư viện — `objectScale()` của drei là
`distanceFactor / (2·tan(fov/2)·khoảng cách)` — rồi nhân với bề rộng ước lượng
theo số ký tự thật của từng nhãn. Một hằng số chung cho mọi nhãn bỏ qua việc
"Ngân Hà — bạn đang ở đây" rộng gấp đôi "Đám Virgo".

Thứ tự ưu tiên nên theo *mất nhãn thì mất bao nhiêu*: mốc mất nhãn chỉ còn là một
chấm vô danh, còn vỏ tỉ lệ mất nhãn thì vòng tròn vẫn nhìn thấy — nên mốc thắng.

## Dấu vị trí phải khác HÌNH DẠNG, và phải tĩnh

Chốt 2026-09-06.

Mốc "bạn đang ở đây" từng là một sprite sáng hơn giữa hàng nghìn sprite sáng, cộng
một quầng **đập nhịp**. Người dùng báo không tìm ra nó.

Hai điều rút ra:

- **Sáng hơn không phải là khác.** Trong một cảnh đầy chấm sáng, mắt không so độ
  sáng được. Vòng tròn có bốn vạch chỉ vào tâm thì tìm ra ngay, vì nó là hình
  dạng duy nhất thuộc loại đó trong khung.
- **Cái gì nhấp nháy thì một nửa thời gian nó vắng mặt.** Quầng đập nhịp có pha
  mờ gần hết, và ảnh chụp lỗi của người dùng bắt đúng pha đó. Chỉ báo *vị trí*
  phải tĩnh; chuyển động chỉ để thu hút chú ý, không để mang thông tin.

Dấu vị trí cũng nên vẽ với `depthTest` tắt: bị một vật thể phía trước che thì nó
không còn đánh dấu gì.

## Ảnh phải sống được ở MỌI khung nó bị cắt

Chốt 2026-09-06, sau khi bộ ảnh bìa tự vẽ bị báo "zoom out, hiển thị thiếu".

Cùng một `coverImage` được dùng ở ít nhất ba chỗ với ba tỉ lệ khác nhau:

| Chỗ dùng | Khung | Thấy được gì |
|---|---|---|
| Thẻ bài | `aspect-[16/10]` | trọn ảnh |
| Thẻ danh sách | ô vuông 64 px | vùng giữa, rất nhỏ |
| Hero trang bài | ~3,6:1, gradient và tiêu đề đè | **trọn ảnh** — xem mục dưới |

Ảnh chụp sống sót mọi phép cắt vì chúng là kết cấu kín khung. Hình vẽ có chủ thể
ở giữa nhiều khoảng trống thì không: ở hero nó thành một vệt mờ trong nền tối, và
người xem đọc ra là "ảnh hỏng".

**Quy tắc: chủ thể phải nằm trong dải 30–50% chiều cao và trải theo chiều ngang.**
Chi tiết phụ đặt ở đáy khung là chấp nhận được — nó là phần thưởng cho ai xem thẻ,
không phải phần bắt buộc.

**Đảo lại phần hero, cùng ngày.** Quy tắc "chủ thể nằm trong dải 30–50%" chỉ
là cách sống chung với phép cắt, không phải cách chữa. Sau ba lượt sửa — nới
khung 52vh→58vh, rồi nắn ba bản vẽ cho vừa dải lộ ra — lỗi vẫn được báo lần thứ
tư, vì cover không cắt được: thang khoảng cách có bốn nấc trải 240→836 px, ép
vào dải 260 px là bỏ mất nấc trên và cả trục hoành.

Hero giờ dùng `object-contain`, không `object-cover`. Ảnh không phủ kín bề
ngang nữa; chỗ hụt lấp bằng chính ảnh đó phóng to và làm mờ ở lớp dưới, nên
không lộ mép và nền vẫn là nền vũ trụ của bản vẽ. Lớp ảnh thật dừng trên đáy
khung đúng 7rem — bằng `-mt-28` mà khối tiêu đề đè lên — nên không nét nào
nằm dưới chữ.

Đánh đổi: trên cửa sổ thấp hình chỉ còn ~435 px ngang thay vì tràn khung. Chấp
nhận, vì 12/12 ảnh bìa hiện nay là hình tự vẽ, mà hình vẽ mất nét là mất nghĩa
— nhỏ mà đủ hơn to mà cụt. Nếu sau này có ảnh CHỤP làm cover, ảnh chụp vốn kín
khung nên `object-cover` mới là lựa chọn đúng cho riêng nó; lúc đó rẽ nhánh
theo loại ảnh, đừng đổi lại quy tắc chung.

Quy tắc "dải 30–50%" vẫn còn hiệu lực cho **thẻ danh sách ô vuông 64 px** — chỗ
đó vẫn cắt.


**Thẻ bài đổi sang `object-cover`, chốt 2026-09-13.** Mục trên nói thẻ bài cho
thấy "trọn ảnh"; không còn đúng nữa, và lý do nằm ở chỗ kho ảnh đã đổi.

Khi quy tắc cũ được chốt, 12/12 ảnh bìa là hình tự vẽ. Nay phần lớn bài mới
dùng ảnh CHỤP (NASA, ESO, ảnh y khoa), và ảnh chụp không cùng một tỉ lệ nào cả.
`contain` vì thế sinh ra hai vành đen rộng hẹp khác nhau tuỳ từng ảnh, và trong
một lưới bốn thẻ thì các vành ấy đọc ra là bố cục vỡ chứ không phải một lựa
chọn — đúng cái đã bị báo.

Phép rẽ nhánh theo loại ảnh mà mục trên đề nghị hoá ra KHÔNG cần: 12 ảnh vẽ đều
được dựng sẵn ở 3200×2000, tức đúng `aspect-[16/10]` của khung thẻ, nên
`cover` không cắt của chúng một pixel nào. Chỉ ảnh chụp bị cắt, mà ảnh chụp vốn
là kết cấu kín khung — cắt được.

Hai chỗ khác GIỮ NGUYÊN `object-contain`: hero trang bài (lý do ở ngay trên) và
thư viện ảnh hành tinh (đĩa hình cầu, cắt là cụt hai cực). Muốn một bài cụ thể
hiện trọn hình cầu trên thẻ thì cắt sẵn ảnh bìa của bài đó về 16/10, đừng đổi
lại `object-fit` cho cả lưới.

**Không đặt chữ vào ảnh.** Site song ngữ dùng chung một `coverImage`, nên chữ chỉ
đúng một thứ tiếng và không có đường nào dịch. Dùng hình học thay chữ: mũi tên hai
đầu đo biên độ, cung quét đo diện tích. Tiêu đề và tóm tắt nằm ngay dưới đã nói
phần chữ rồi.
