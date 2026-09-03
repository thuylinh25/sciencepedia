# Chẩn đoán

Quy tắc rút từ những lần **sửa nhầm chỗ**. Đây không phải mẹo kỹ thuật — mẹo kỹ
thuật nằm ở `docs/design-system.md`. Đây là cách quyết định *sửa cái gì*.

Cập nhật: 2026-09-03

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
