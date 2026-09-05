# Chẩn đoán

Quy tắc rút từ những lần **sửa nhầm chỗ**. Đây không phải mẹo kỹ thuật — mẹo kỹ
thuật nằm ở `docs/design-system.md`. Đây là cách quyết định *sửa cái gì*.

Cập nhật: 2026-09-05

---

## Sửa hai lần không ăn thì chẩn đoán sai, không phải liều lượng sai

Thanh thống kê ở trang chủ bị báo "nội dung dồn lên đầu". Hai lần chữa:

1. Thêm `justify-center` — hợp lý, vì ô lưới bị kéo cao bằng ô cao nhất.
2. Đổi `leading-none` sang `leading-tight` — cũng hợp lý, vì chữ số không có nét
   thò xuống nên hộp dòng lệch tâm thị giác.

Cả hai đều là cải thiện thật. **Cả hai đều không phải nguyên nhân.** Nguyên nhân
là hero `position: relative` vẽ đè lên thanh số tĩnh và dải gradient đáy hero cắt
mất phần đầu các icon.

Tới lần thứ ba mới đọc HTML đã dựng (`grep` trong `.next/server/app/vi.html`) và
thấy `justify-center` vốn đã có mặt — tức triệu chứng không thể là lỗi căn giữa.
**Lẽ ra phải làm việc đó ngay từ lần đầu.**

Quy tắc: khi bản sửa thứ nhất không ăn, đừng tăng liều. Đi tìm bằng chứng trực
tiếp về trạng thái thật — HTML đã dựng, giá trị thật trong CSDL, output thật của
lệnh.

---

## Kiểm tiền đề trước khi thi hành một phán quyết

`science-editor` phủ quyết ô "Lượt đọc" và khối "Được đọc nhiều nhất" với lập luận:
cột `views` toàn số 0, nhãn "Lượt đọc" là tuyên bố sai về hệ thống của chính mình.

Lập luận đúng. **Tiền đề sai.** Cơ chế đếm hoạt động đầy đủ — `ViewCounter` →
`POST /api/articles/[id]/view` → `incrementViews`, có chốt `sessionStorage` và
rate limit. `views` = 0 chỉ vì project mới chạy 24 giờ, chưa có lưu lượng.

Một phán quyết đúng logic nhưng sai dữ kiện vẫn là phán quyết sai. Trước khi thi
hành một phủ quyết, kiểm cái nó dựa vào.

Phần duy nhất trong phủ quyết đó đứng vững độc lập với lưu lượng — `orderBy` đơn
trên cột đồng hạng trả về thứ tự vật lý trong heap Postgres — vẫn được sửa.

---

## Ảnh chụp màn hình là bằng chứng, không chỉ là lời than

Chủ sản phẩm báo ba lần "mô hình 3D không chuyển động". Hai lần đầu tôi đoán sai
(tốc độ quá chậm, rồi điều kiện mount). Lần thứ ba, đọc lại một ảnh cũ:

> Bốn chấm trắng của minh hoạ CSS xếp thành **một cột dọc hoàn hảo** — cả bốn ở
> vị trí 12 giờ trên quỹ đạo của chúng.

Đó là trạng thái ban đầu khi animation chưa từng chạy. Minh hoạ đó dùng
`motion-safe:`, tức chỉ chạy khi hệ điều hành không xin giảm chuyển động. Ảnh
chụp **chứng minh** `prefers-reduced-motion` đang bật, và giải thích luôn cả ba
lần báo lỗi.

Xác nhận lại bằng một phép kiểm dứt điểm chạy trên máy người báo:
`matchMedia('(prefers-reduced-motion: reduce)').matches`.

Quy tắc: đọc ảnh chụp như đọc log. Cái *không* chuyển động, cái nằm sai chỗ, cái
xếp quá đều — đều là dữ kiện.

---

## Đưa người báo lỗi một phép kiểm cho ra `true`/`false`

Khi giả thuyết nằm ngoài tầm với — thiết lập hệ điều hành, trạng thái trình duyệt,
dữ liệu trên máy khác — đừng mô tả triệu chứng rồi chờ. Đưa một lệnh dán vào
console trả về đúng một giá trị, kèm ý nghĩa của cả hai kết quả:

> Ra `true` → đúng như tôi đoán, sửa ở chỗ này.
> Ra `false` → giả thuyết của tôi sai, tôi đào hướng khác.

Nó chấm dứt vòng đoán trong một lượt.

---

## Phân biệt "lỗi hiển thị" với "thiếu dữ liệu"

Nhiều yêu cầu giao diện thực ra là yêu cầu dữ liệu, và làm bằng CSS sẽ ra một lời
nói dối:

- "Card lĩnh vực nên có ảnh" → cả 14 danh mục có `coverImage = null`. Không phải
  việc của CSS.
- "Thêm badge *Đã kiểm chứng nguồn*" → phải có `reviewedAt` thật. In badge lên
  bài chưa ai kiểm là đúng thứ `docs/content-rules.md` cấm.
- "Thêm *Dòng thời gian* vào navbar" → không có route nào như vậy. Navbar mỏng
  còn hơn navbar có link 404.

Trước khi dựng, hỏi: **thứ này lấy số liệu ở đâu?** Nếu câu trả lời là "chưa có
đâu cả" thì đó là việc dữ liệu, không phải việc giao diện.

---

## Rác cũng phải kiểm: link và nhãn đang chạy

Rà qua footer tìm ra hai link hỏng đã sống trên production:

- Icon RSS trỏ `/rss.xml` — **không có route nào** trong `src/app/`.
- Icon GitHub trỏ `https://github.com` — trang chủ GitHub, không phải repo nào.

Không ai báo, vì không ai bấm. Khi chạm vào một khối, kiểm luôn các link trong đó
có resolve không.

---

## Thứ quyết định thường nằm cao hơn một tầng

Ba lỗi riêng biệt trong dự án này có cùng một hình dạng: chỗ tôi đang sửa không
phải chỗ quyết định kết quả.

| Triệu chứng | Tôi sửa ở | Thứ thật sự quyết định |
|---|---|---|
| Icon thanh số bị cắt cụt | căn lề của chính thanh số | `position` của **hero bao ngoài** |
| Ô bảng dính sát viền | selector trên thẻ bọc bảng | **cascade layer** của cả stylesheet |
| Thiên hà không hiện trên điện thoại | điều kiện mount trong component | `hidden lg:block` ở **thẻ cha** |

Lần thứ ba đặc biệt dễ mắc: tôi đã thêm `lowPower` vào `HeroGalaxy`, chạy
typecheck xanh, và suýt báo xong — trong khi component đó dưới `lg` không hề
được dựng, vì một class ở thẻ bao ngoài đã quyết định điều đó từ trước.

Quy tắc: khi bản sửa **chắc chắn đã được áp dụng** mà không đổi gì, đừng sửa
tiếp ở cùng tầng. Đi lên một tầng và hỏi ba câu:

1. Thẻ cha có đang định vị, cắt, hoặc ẩn thứ này không?
2. Luật CSS kia nằm trong `@layer` nào? (layer đứng trên specificity)
3. Có điều kiện nào ở trên quyết định thứ này có tồn tại hay không?

---

## Phép đo mâu thuẫn với mắt người dùng thì phép đo thiếu, không phải người dùng sai

Chủ sản phẩm báo bảng vẫn dính sát viền. Tôi mở CSS đã dựng, lấy ra hai con số
độ ưu tiên — (0,1,0) của typography so với (0,1,1) của bản vá — rồi kết luận
**"bản vá đáng lẽ thắng"**, và dùng kết luận đó để chuyển nghi ngờ sang một khối
khác. Tôi còn nhờ chủ sản phẩm xác nhận giả thuyết mới đó.

Ảnh chụp gửi về cho thấy đúng cái bảng. Bản vá không thắng, và lý do là thứ tôi
chưa đo: cả hai luật nằm ở hai cascade layer khác nhau, mà layer đứng trên
specificity.

Sai lầm không phải đo sai. Là **đo thiếu rồi coi kết quả là đầy đủ** — và lấy
một phép đo thiếu để lật lại một quan sát trực tiếp.

Quy tắc: người báo lỗi đang nhìn trang thật; tôi chỉ đang nhìn một lát cắt của
nó. Khi hai bên chỏi nhau, mặc định là lát cắt của tôi hụt một biến. Đi tìm biến
đó trước, đừng viết lại chẩn đoán. Và nếu vẫn phải đoán tiếp thì xin ảnh chụp
**trước**, đừng đề xuất thủ phạm mới rồi nhờ xác nhận — ảnh chụp tốn của người
kia năm giây và chấm dứt thứ mà hai mươi phút suy luận không chấm dứt được.

---

## "Cái này thừa, bỏ đi" — đếm xem có bao nhiêu chỗ thật sự thừa

Chủ sản phẩm chỉ vào một bài có ghi công ảnh hiện hai lần và bảo bỏ cái trên ảnh
đi. Đúng với bài đó. Nhưng dòng ghi công trong thân bài chỉ có ở **6 trên 41
bài** — 35 bài còn lại chỉ có duy nhất cái lớp phủ. Bỏ thẳng theo lời là xoá ghi
công của 35 bài, tức vi phạm CC BY trên phần lớn thư viện.

Người báo mô tả **trang họ đang mở**, không mô tả tập dữ liệu. Họ không có nghĩa
vụ biết 35 bài kia trông thế nào — đó là việc của tôi.

Quy tắc: trước khi xoá thứ gì vì "đã có ở chỗ khác", chạy một câu đếm xem "chỗ
khác" đó phủ được bao nhiêu phần trăm. Nếu không phủ hết, việc phải làm không
phải là xoá mà là **gộp về một chỗ** — rồi nói rõ đã gộp về đâu và mất gì.

---

## Agent chết thì chỉ file sống sót

Trong một phiên, agent chết bốn lần vì lỗi máy chủ và hạn mức. Mỗi lần mất toàn bộ
ngữ cảnh và phải làm lại từ đầu.

Rút ra:

- **Đưa dữ kiện đã dò được vào brief.** Lần khởi động lại thứ hai của
  `content-curator` gồm sẵn: sitemap escape ampersand hai lần, `server-only` chặn
  import từ script tsx, cách lọc `npm notice` khỏi output, và 6 ứng viên đã sàng
  từ 137 bài. Nó không phải dò lại.
- **Kiểm working tree sau mỗi lần agent chết** trước khi kết luận mất gì.
- Agent báo "xong" mà thực ra dừng chờ một tín hiệu không bao giờ đến là chuyện có
  thật. Trong kiến trúc này không có vòng lặp nào đánh thức agent ở giữa pipeline
  — brief phải nói rõ "chạy tới hết, không dừng chờ".

---

## Đo kích thước không phải là đo nội dung

Token OAuth bị máy chủ trả 401. Tôi đo và thấy 109 ký tự, thấy tiền tố
`sk-ant-oat01-` đúng dạng, rồi kết luận: **bị cắt cụt lúc copy**. Đề nghị người
dùng copy lại. Họ copy lại và khẳng định đã lấy trọn.

Họ đúng. Token không thiếu ký tự nào — nó **thừa** một: một dấu cách (U+0020) ở
vị trí 99, do PowerShell chèn vào điểm ngắt dòng khi hiển thị.

Phép đo đúng mất một dòng:

```ts
/\s/.test(token)   // base64url không bao giờ chứa khoảng trắng
```

Sai lầm không phải đo sai. Là **đo một chiều rồi kết luận về chiều khác** — lấy
độ dài để suy ra tính toàn vẹn. Với chuỗi có bảng chữ cái xác định (token, hash,
slug, mã màu), câu hỏi đầu tiên không phải "dài bao nhiêu" mà **"có ký tự nào
không thuộc bảng chữ cái của nó không"**. Câu đó chỉ ra ngay chỗ hỏng, còn độ
dài thì chỉ nói được là "trông hơi ngắn".

Hệ quả thứ hai: đừng đẩy người báo lỗi đi làm lại một việc họ đã làm đúng. Khi
họ nói "tôi đã làm rồi", mặc định là họ làm rồi.

---

## Brief phải nói vào tham số, không nói vào ý định

Lần chạy pipeline tự động đầu tiên: agent giao việc cho `content-curator` rồi
kết thúc lượt, kèm câu "sẽ báo lại khi agent hoàn tất — tôi sẽ được thông báo
tự động". Không có thông báo nào tới. Tiến trình thoát, subagent bị giết theo,
báo cáo mô tả một kết quả không tồn tại.

Brief đã có sẵn dòng **"chạy tới hết, không dừng chờ"** — chính dòng rút ra từ
mục "Agent chết thì chỉ file sống sót" phía trên. Nó không cứu được, vì agent
không cho là mình đang chờ: subagent trong Agent SDK **mặc định chạy nền**, nên
dưới góc nhìn của nó, việc đã được giao xong và lượt đã trọn vẹn.

Câu có tác dụng là câu nói vào đúng tham số:

> Mọi lần gọi công cụ Agent PHẢI đặt `run_in_background: false`.

Quy tắc: khi hành vi hỏng do một **mặc định của công cụ**, đừng mô tả kết quả
mong muốn ("chạy tới hết") — nêu tên tham số và giá trị phải đặt. Mô tả ý định
chỉ sửa được lỗi do agent chọn sai; nó không sửa được lỗi do agent không biết
có một lựa chọn ở đó.
