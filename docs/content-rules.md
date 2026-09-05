# Quy tắc nội dung

Phán quyết biên tập đã chốt. Chủ sở hữu: `science-editor` (quyền phủ quyết tuyệt đối
ở gate accuracy).

Đây là những quyết định mà **đọc code không suy ra được** — nếu không ghi lại, lần
sau sẽ có người "sửa cho hay hơn" đúng chỗ vừa được cân nhắc.

Cập nhật: 2026-09-05

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

---

## Độ dài bài: 3–5 phút đọc

Chốt 2026-09-04. Áp cho **mọi bài mới** và cho bài cũ khi có dịp chạm vào.

Khoảng 3.000–5.000 ký tự Markdown. `readingTime` phải khớp nội dung thật, không
đặt tay.

**Vì sao con số này.** Đo toàn kho 41 bài ngày 2026-09-04: trung vị **4 phút**,
35/41 bài ≤8 phút. Sáu bài dài (12–20 phút) đều sinh cùng một đợt, và chúng dài
gấp 2–5 lần phần còn lại — đứng cạnh nhau trong lưới thì lệch hẳn, và một kho có
hai lớp độ dài đọc ra như hai sản phẩm khác nhau. 3–5 phút là mức trung vị mà kho
tự nhiên hội tụ về.

**Rút gọn thì cắt gì.** Đoạn khai triển, ví dụ phụ, lịch sử phát triển dài dòng,
câu chuyển ý, đoạn nhắc lại điều đã nói, bảng chỉ minh hoạ thêm cho điều thân bài
đã nói rõ. Giữ mạch lập luận, cắt phần trang trí.

**Rút gọn KHÔNG được đụng vào:**

- **Nguồn tham khảo.** 7–21 nguồn mỗi bài là tài sản, không phải phần thừa. Bài
  ngắn đi thì mật độ nguồn dày lên — đó là điều tốt.
- **Con số đã đối chiếu** và mốc thời gian đi kèm.
- **Mức độ dè dặt.** Rút gọn mà biến "có thể" thành "là", hoặc bỏ mệnh đề điều
  kiện ở cuối câu, là lỗi cấp từ chối. Đây là cách hỏng phổ biến nhất khi cắt
  ngắn: câu ngắn hơn nghe chắc chắn hơn, và sự chắc chắn đó không có thật.
- **Dòng dẫn nguồn và ghi công ảnh** ở cuối bài.
- **Tối thiểu 3 link nội bộ** resolve được.

**Ngắn nhưng không cụt.** Sau khi rút, bài vẫn phải trả lời trọn vẹn câu hỏi ở
tiêu đề. Nếu 5 phút không đủ để trả lời tử tế thì chủ đề đó quá rộng cho một bài
— tách thành hai bài, đừng viết một bài dài.

## Ghi công ảnh: một chỗ duy nhất, ở cuối bài, lấy từ CSDL

Ghi công nằm ở trường `Article.coverImageCredit` và render một lần ở cuối bài,
cạnh mục nguồn tham khảo. **Không viết ghi công vào thân bài Markdown.**

Vì sao ở cuối chứ không đè lên ảnh: CC BY đòi ghi công "hợp lý theo phương
tiện", không đòi dán lên ảnh. Lớp phủ trên ảnh bìa thua hai lần — nó tranh chỗ
với tiêu đề trên màn hình hẹp (đã phải dời từ đáy ảnh lên đỉnh một lần rồi), và
nó là chữ đặt trên một tấm ảnh có độ sáng không đoán trước được nên buộc phải
kèm nền mờ riêng, tức một mảng xám nằm giữa tấm ảnh mở đầu bài.

Vì sao từ CSDL chứ không từ Markdown: `npm run images:credit` cập nhật trường
này thẳng từ Wikimedia Commons, nên thay ảnh là ghi công đổi theo. Ghi công chép
tay vào thân bài thì lần thay ảnh sau sẽ để lại ghi công của tấm cũ — **ghi công
sai người còn tệ hơn không ghi**. Đây là lý do sáu bài VACA bị gỡ dòng "Ảnh bìa:
…" viết tay, dù dòng đó có thêm phần mô tả nội dung ảnh mà trường trong CSDL
không mang được. Nếu sau này cần mô tả ảnh, thêm cột chứ đừng chép vào bài.

Đổi ảnh bìa thì đặt `coverImageCredit` và `coverImageCreditEn` về `null` rồi
chạy lại `images:credit -- --write`, đừng sửa tay.

## Byline người duyệt: một tài khoản tổ chức, không bịa tên người

Chốt 2026-09-05, khi duyệt `sao-moc-quay-nhanh-nhat`.

Mọi bài qua gate accuracy ghi `reviewedById` = tài khoản ADMIN **"Ban biên tập
Sciencepedia"**. Chuẩn của `science-editor` đòi "named reviewer", nhưng hiện không
có người thật đọc từng bài — gán một tên riêng vào ô đó là **quy công sai người**,
cùng loại lỗi với ghi công ảnh sai. Byline tổ chức nói đúng sự thật: có một quy
trình duyệt, không có một cá nhân bảo chứng.

**Phải nhất quán.** Lúc tổ chức lúc tên riêng thì người đọc suy ra rằng bài có tên
người được soi kỹ hơn — một hàm ý mà ta không có gì bảo đảm.

**Điều kiện đổi sang tên người**: khi có biên tập viên thật ký từng bài. Lúc đó, và
chỉ lúc đó.

## Trích dẫn resolve đúng bài KHÔNG có nghĩa là bài đó nói điều đang viết

Chốt 2026-09-05. Lỗi đã lọt tới `PUBLISHED` một lần.

`sao-moc-quay-nhanh-nhat` trích Pollack et al. 1996 — DOI đúng, Crossref xác nhận,
link 200. Nhưng cơ chế đặt cạnh trích dẫn ("dòng khí đập vào hành tinh theo hướng
lệch tâm, bơm thêm mô-men động lượng") **không có trong bài báo đó**: Pollack là mô
hình bồi tụ 1D chuẩn tĩnh, không hề bàn tới spin. Câu văn tự tin cộng citation hợp
lệ tạo ra thứ khó phát hiện nhất — một claim bịa mang dấu kiểm định.

**Kiểm link không bắt được loại lỗi này.** Chỉ đọc nguồn mới bắt được. Vì vậy gate
accuracy phải fetch nguồn gốc, không đối chiếu bản thảo với chính bản thảo.

**Lặp lần thứ hai trong một batch → dừng batch, sửa prompt `article-generator`.**

### Ba lỗi cùng đợt, ghi lại để nhận mặt

- **Tỉ số chưa từng được tính.** "gần 28 lần Trái Đất" — không nói 28 lần *cái gì*,
  và số thật là 27,0. Cụm tỉ số không nêu rõ tử/mẫu là dấu hiệu nó được đoán.
- **Làm tròn lên con số của chính mình.** Độ dẹt 0,06487 viết thành "gần 7%". Cùng
  họ với "35+" khi số thật là 35.
- **Lấy cơ chế hiện tại giải thích sự kiện lúc hình thành.** Dynamo hydro kim loại
  của Sao Mộc hôm nay bị gán làm cái phanh của 4,5 tỉ năm trước. Lệch mốc thời gian
  đọc rất trôi chảy nên khó thấy.

**Đoạn cảnh báo ở cuối bài không che được vật lý sai ở thân bài.** Nó hạ mức độ
chắc chắn, không biến phát biểu sai thành đúng.

## Ước lượng điểm không đặt vào tiêu đề

Chốt 2026-09-05, sau khi `he-vi-sinh-duong-ruot` mang con số sai trong tiêu đề
suốt thời gian đã publish: "100 nghìn tỉ cư dân", trong khi Sender/Fuchs/Milo 2016
đã hạ ước lượng xuống ~3,8×10¹³.

Đề xuất đầu tiên là thay bằng "40 nghìn tỉ". `science-editor` bác: đó là lặp lại
đúng sai lầm vừa sửa với một con số mới hơn.

**Tiêu đề không mang được mệnh đề dè dặt lẫn năm đo.** Mà chính việc một con số bị
tách khỏi năm của nó là cách 10¹⁴ sống sót được 50 năm — nó ra đời từ một ước lượng
1972, rồi được trích lại mãi mà không ai mang theo cái mốc ấy.

Tiêu đề dùng bậc độ lớn ("hàng chục nghìn tỉ"), thân bài mới dùng con số kèm nguồn
và năm. Bậc độ lớn đúng dù ước lượng tới có là 3,8×10¹³ hay 10¹⁴, nên nó không phải
sửa lại lần nữa.

Áp cho mọi trường tiêu đề: `title`, `titleEn`, `seoTitle`.

## Sửa bài đã publish là đính chính, không phải biên tập

Chốt 2026-09-05.

Sửa bài chưa publish là biên tập — không ai cần biết. Sửa bài **đã** publish thì
người đọc có thể đã mang con số cũ đi rồi, và một lần sửa im lặng khiến họ không
bao giờ biết mình cần cập nhật.

Mỗi lần sửa claim trên bài đã publish phải để lại ba thứ:

1. Một dòng trong `docs/content/corrections.md`: claim cũ, claim mới, căn cứ.
2. Một bản `Revision` chụp nội dung **trước** khi sửa, ghi trong **cùng transaction**
   với lệnh sửa — để lịch sử không thể lệch khỏi nội dung.
3. `lastVerifiedAt` cập nhật.

**Đổi claim thì phải đổi cả bảng nguồn.** Thay một con số cũ không nguồn bằng một
con số mới không nguồn không phải đính chính, chỉ là đổi phiên bản của cùng một vấn
đề. Đây là điều kiện `science-editor` đặt ra khi duyệt lượt sửa đầu tiên.

**Sửa chuỗi xong không có nghĩa là qua gate.** `factCheck` là việc của người duyệt,
không phải hệ quả của một phép thay chuỗi.

### Kho tự mâu thuẫn là máy dò lỗi rẻ nhất

Hai trong năm lỗi S2 của lượt audit 2026-09-05 lộ ra không nhờ tra nguồn ngoài, mà
nhờ đối chiếu kho với chính nó:

- `sao-cau-tao-va-tien-hoa` viết "không một sao loại M nào nhìn được bằng mắt
  thường" — trong khi **bảng ngay phía trên câu đó** liệt kê Betelgeuse làm ví dụ
  lớp M, và `20-ngoi-sao-sang-nhat-bau-troi-dem` xếp Betelgeuse #10, Antares #15.
- `sao-kim` và `tam-hanh-tinh-he-mat-troi` viết "một ngày dài hơn một năm", trong
  khi `sao-thuy` đã phân biệt đúng "ngày mặt trời" với chu kỳ tự quay.

Cả hai đều là một khái niệm được dùng hai nghĩa ở hai chỗ. Trước khi đi tra nguồn
ngoài, hãy hỏi kho đã nói gì về cùng khái niệm đó ở bài khác.
