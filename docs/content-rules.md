# Quy tắc nội dung

Phán quyết biên tập đã chốt. Chủ sở hữu: `science-editor` (quyền phủ quyết tuyệt đối
ở gate accuracy).

Đây là những quyết định mà **đọc code không suy ra được** — nếu không ghi lại, lần
sau sẽ có người "sửa cho hay hơn" đúng chỗ vừa được cân nhắc.

Cập nhật: 2026-09-03

---

## Nguyên tắc gốc

Một bách khoa toàn thư khoa học bán đúng một thứ: **số trên trang bằng số trong
thực tế**. Làm tròn con số của chính mình — thứ dễ kiểm chứng nhất — là dạy người
đọc rằng các số khác trong bài cũng có thể đã được làm cho đẹp.

---

## Số liệu trên trang

**Cấm "35+" khi con số thật là 35.** Cấm luôn các biến thể: "gần 40 bài", "hàng
trăm bài sắp ra mắt", "kho đang lớn nhanh", "cập nhật mỗi ngày". Không hứa nhịp độ
mà ta không kiểm soát được.

**Cách xử lý cảm giác "kho còn nhỏ"**: thừa nhận, rồi đưa lý do khiến sự nhỏ đó là
điểm mạnh. Câu đã duyệt:

> Thư viện đang trong giai đoạn mở rộng. Chúng tôi thêm bài theo tốc độ mà khâu
> kiểm chứng nguồn cho phép.

Câu này không hứa nhịp độ, không có con số mục tiêu — ba tháng nữa không có bài mới
thì nó vẫn đúng.

### "Lĩnh vực" ≠ "Chuyên mục"

| Từ | Con số | Truy vấn |
|---|---|---|
| Lĩnh vực | root category | `category.count({ where: { parentId: null } })` |
| Chuyên mục | toàn cây | `category.count()` |

Hai từ, hai con số, **không hoán đổi**. Lỗi đã xảy ra trên production: StatsBand
hiển thị "14 Lĩnh vực" trong khi mục "Duyệt theo lĩnh vực" ngay bên dưới render 5
thẻ — cùng một màn hình tự mâu thuẫn.

**Chủ đề (tag) chỉ đếm tag có bài đã xuất bản.** Đếm cả tag rỗng là hứa N trang chủ
đề rồi click vào ra trang trống.

### Bảng xếp hạng phải có tie-break

```ts
orderBy: [{ views: "desc" }, { publishedAt: "desc" }]
```

`orderBy` đơn trên cột mà nhiều giá trị bằng nhau trả về thứ tự vật lý trong heap
Postgres — đổi sau mỗi `UPDATE`, hôm nay xếp thế này mai xếp khác, không lý do.
Loại sai này nguy hiểm vì trông hoàn toàn bình thường, không ai phát hiện được.

**Áp dụng cho mọi thứ tự hiển thị**, không riêng lượt đọc.

### Nhãn có tính thời điểm phải nói rõ cửa sổ thời gian

"Được đọc nhiều nhất" không giới hạn thời gian là một claim date-bound không có ngày.
Khi dữ liệu đủ chín, nhãn đúng là "Được đọc nhiều nhất 30 ngày qua" /
"Most read in the last 30 days".

---

## Trích nội dung

**Không cắt chuỗi đã duyệt.** Không `line-clamp`, không "…" trên `summary` hay bất
kỳ trường nào đã qua gate accuracy. Một tóm tắt bị cắt có thể mất chính mệnh đề dè
dặt ở cuối ("…trong điều kiện phòng thí nghiệm", "…theo mô hình hiện tại"). Cắt câu
đã duyệt = nâng mức độ chắc chắn = lỗi cấp từ chối.

Nếu đoạn trích dài quá khung: **đổi bài khác**, không cắt.

**Không để LLM viết lại, rút gọn, hay "làm cho hấp dẫn hơn"** nội dung đã duyệt.
Hiển thị nguyên văn.

**Chỉ trích từ bài `status = PUBLISHED`.** Bài draft chưa qua gate.

**Song ngữ phải thật.** Locale `en` chỉ được chọn bài có `summaryEn != null`. Cấm
fallback hiển thị tiếng Việt trong trang tiếng Anh, cấm dịch máy tại runtime.

**Provenance thừa một chút thì không sao; provenance mơ hồ thì có sao.** Dòng quy
nguồn phải đặt ngay dưới đoạn trích, có link resolve được — không nhét vào tooltip
hay thẻ mờ ở góc. Dùng "Tóm tắt bài: {title}" chứ không phải "Trích từ" — "trích từ"
cho phép người đọc tưởng đây là một câu đắt được chọn ra từ giữa bài.

---

## Nhãn phải khớp bản chất nội dung

Khối trích tóm tắt **không được** mang tên "Bạn có biết?". Nhãn đó báo hiệu một thể
loại cụ thể: sự thật gây bất ngờ, được tuyển chọn vì nó lạ. `summary` là câu dẫn mô
tả — dán nhãn trivia lên nó là nói sai về bản chất nội dung, và ngầm hứa một luồng
trivia được tuyển chọn mà sản phẩm không có.

Tên đã duyệt: **"Trích từ kho tri thức"** / "From the library".

**Điều kiện lấy lại tên "Bạn có biết?"**: thêm trường `Article.factoid` /
`factoidEn` (nullable) đi qua đúng pipeline 11 bước như thân bài. Lúc đó, và chỉ
lúc đó.

**Không tự sinh trivia bằng LLM.** Vi phạm gate accuracy.

---

## Trang ISR không được hứa nội dung xoay vòng

Trang chủ là static/ISR — nội dung đứng yên giữa các lần revalidate. Cấm mọi chữ
kiểu "mỗi lần ghé một điều mới".

**Ngẫu nhiên thật không khả thi trên trang tĩnh**: mọi người sẽ thấy cùng một "ngẫu
nhiên" cho tới lần revalidate. Hai cách đúng:

- Chọn theo ngày (đổi mỗi ngày, ổn định trong ngày) — kiểu Wikipedia, hợp ISR.
- Route `/random` dynamic chỉ làm nhiệm vụ redirect, trang chủ đặt nút trỏ tới.
  Route này phải `noindex`.

---

## Quyết định của chủ sản phẩm ghi đè phán quyết biên tập

Đã xảy ra 2026-09-02: `science-editor` phủ quyết ô "Lượt đọc" và khối "Được đọc
nhiều nhất" với lý do "hệ thống không đo". Kiểm chứng cho thấy **tiền đề sai** —
cơ chế đếm hoạt động đầy đủ (xem `docs/architecture.md`), `views` = 0 chỉ vì site
mới chạy ~24 giờ, chưa có lưu lượng.

Bài học: **kiểm chứng tiền đề trước khi thi hành một phủ quyết.** Một phán quyết
đúng logic nhưng sai dữ kiện vẫn là phán quyết sai.

Chủ sản phẩm đã quyết giữ cả hai. Riêng phần tie-break thì vẫn phải sửa — đó là
điểm duy nhất trong phủ quyết đứng vững độc lập với chuyện có lưu lượng hay không.
