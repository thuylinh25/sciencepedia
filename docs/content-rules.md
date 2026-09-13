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

## Độ dài bài: 2–3 phút đọc

Chốt 2026-09-06, thay cho trần 3–5 phút chốt ngày 2026-09-04. Quyết định của chủ
sản phẩm.

**400–600 từ văn xuôi**, tức khoảng 1.850–2.800 ký tự. `readingTime` phải khớp nội
dung thật, không đặt tay.

**Gate đếm TỪ, không đếm ký tự.** Trần cũ ghi "3.000–5.000 ký tự" và gọi đó là "3–5
phút". Hai con số ấy không khớp: đo 46 bài đã publish thì tiếng Việt ở kho này trung
bình 4,65 ký tự mỗi từ, tức **930 ký tự mỗi phút** — nên băng ký tự cũ thật ra là
3,2–5,4 phút. Quy tắc phát biểu bằng phút, mà `readingTime` thì tính từ số từ, nên
để gate cũng đếm từ: hai phép kiểm độ dài rút ra từ cùng một đại lượng và không thể
bất đồng. Ký tự chỉ còn là con số tham khảo lúc soạn bài.

**Áp cho bài xuất bản từ 2026-09-07. Bài cũ KHÔNG viết lại.**

Đo lúc đổi luật: chỉ **6/46 bài** đã publish lọt băng mới — 30 bài dài hơn 3 phút,
11 bài ngắn hơn 2 phút. Viết lại kho cũ cho vừa trần là viết lại gần như toàn bộ thư
viện, và chủ sản phẩm quyết định không làm.

Vì vậy `check-publish.ts` miễn trần độ dài cho bài có `publishedAt` trước mốc, và
gom nợ thành **một dòng tổng kết** thay vì một dòng CHẶN mỗi bài. Lý do là thứ đáng
giữ hơn con số: một gate kêu ở chỗ không ai định sửa là gate người ta học cách bỏ
qua, và lúc đó nó thôi chặn cả những chỗ cần chặn.

Miễn trừ neo vào `publishedAt`, **không** vào `updatedAt` — sửa một lỗi sự thật trên
bài cũ không được kéo theo yêu cầu cắt nửa bài, vì như thế là phạt đúng việc ta muốn
khuyến khích.

**Vì sao 2–3 phút.** Trần 3–5 phút đặt ngày 2026-09-04 dựa trên mức trung vị mà kho
tự hội tụ về, tức mô tả kho đang có chứ không phải kho muốn có. 2–3 phút là lựa chọn
về sản phẩm: một mục từ bách khoa được tra cứu chứ không được đọc từ đầu tới cuối,
nên nó phải trả lời xong câu hỏi ở tiêu đề rồi dừng.

**Rút gọn thì cắt gì.** Đoạn khai triển, ví dụ phụ, lịch sử phát triển dài dòng, câu
chuyển ý, đoạn nhắc lại điều đã nói, bảng chỉ minh hoạ thêm cho điều thân bài đã nói
rõ. Giữ mạch lập luận, cắt phần trang trí.

**Rút gọn KHÔNG được đụng vào:**

- **Nguồn tham khảo.** 7–21 nguồn mỗi bài là tài sản, không phải phần thừa. Bài
  ngắn đi thì mật độ nguồn dày lên — đó là điều tốt. Khối dẫn nguồn cũng không tính
  vào ngân sách độ dài; `prose()` cắt nó ra trước khi đo.
- **Con số đã đối chiếu** và mốc thời gian đi kèm.
- **Mức độ dè dặt.** Rút gọn mà biến "có thể" thành "là", hoặc bỏ mệnh đề điều
  kiện ở cuối câu, là lỗi cấp từ chối. Đây là cách hỏng phổ biến nhất khi cắt
  ngắn: câu ngắn hơn nghe chắc chắn hơn, và sự chắc chắn đó không có thật. Trần
  càng chặt thì áp lực này càng lớn — 2–3 phút làm nó nguy hiểm hơn 3–5 phút.
- **Dòng dẫn nguồn và ghi công ảnh** ở cuối bài.
- **Tối thiểu 3 link nội bộ** resolve được.

### Rút gọn là một lượt viết, nên nó phải qua gate accuracy lần nữa

Chốt 2026-09-12, sau khi mẫu lỗi này xảy ra **lần thứ hai**.

Cám dỗ tự nhiên là coi rút gọn như thao tác hình thức: chữ ít đi, nội dung giữ
nguyên, nên duyệt một lần trước khi rút là đủ. Hai lượt đo nói ngược lại.

- `dien-tich-va-dong-dien` — rút 1.016 → 588 từ. Bản nén **tự sinh ra** một lỗi
  S2 mà bản dài không có: nó viết hai dây dẫn song song "HÚT NHAU", một mệnh đề
  về chiều lực mà không nguồn nào phát biểu.
- `mat-trang` — rút 842 → 600 từ. Câu bản dài là "Ở đáy **vài** hố **gần cực** —
  nơi ánh nắng chưa bao giờ chạm tới — vẫn còn băng nước cổ." Lượt rút xoá cùng
  lúc lượng từ *vài* và vị trí *gần cực*, rồi để câu đứng ngay sau "bề mặt chi
  chít hố va chạm". Kết quả đọc ra thành: hố nào tối cũng có băng. Nguồn không
  nói thế — s1 gắn băng với **vùng cực**.

Hai lần, cùng một cơ chế: **xoá định ngữ hạn định để tiết kiệm vài chữ.** Định
ngữ là thứ trông giống chữ đệm nhất và chịu lực nhiều nhất, nên nó luôn là thứ
đầu tiên bị cắt và luôn là thứ đắt nhất khi mất.

Lần hai còn cho thêm một dữ kiện: câu ấy **không sai một mình**. Nó sai vì chỗ
nó đứng. Nên phép kiểm không thể là đọc từng câu — phải đọc câu trong ngữ cảnh
hai câu kề.

**Quy tắc:**

1. Rút gọn xong thì bài đi qua gate accuracy **một lần nữa**, trên đúng văn bản
   sau khi rút. Chữ ký approve không được nằm trên một văn bản đã bị thay.
2. Thứ tự bắt buộc là **rút trước, duyệt sau** — không phải duyệt bản dài rồi
   rút cho vừa trần.
3. Câu thay thế do `science-editor` viết nguyên văn, không phải bản diễn đạt
   lại. Cùng lý do đã chốt ở mục đính chính bên dưới.

**Vì sao không nới trần thay vì thêm một vòng duyệt.** Trần 2–3 phút là quyết
định về sản phẩm, còn đây là lỗi ở quy trình. Nới trần chữa triệu chứng và bỏ
lại nguyên cơ chế — mọi lượt sửa độ dài về sau vẫn sinh lỗi y như vậy.

**Ngắn nhưng không cụt.** Sau khi rút, bài vẫn phải trả lời trọn vẹn câu hỏi ở tiêu
đề. Nếu 3 phút không đủ để trả lời tử tế thì chủ đề đó quá rộng cho một bài — tách
thành hai bài, đừng viết một bài dài.

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

## Hình mang mệnh đề định lượng thì phải TÍNH, không chọn bằng mắt

Chốt 2026-09-06. Hai lỗi cùng đợt, cùng một gốc.

**Kepler.** Bìa bài `dinh-luat-kepler` vẽ hai quạt mà bán kính vector quét được
trong hai khoảng thời gian bằng nhau. Hai quạt ấy **phải bằng diện tích** — đó
không phải chi tiết trang trí, đó là toàn bộ nội dung định luật 2. Bản đầu chọn
góc bằng mắt: 0,28π ở cận nhật và 0,15π ở viễn nhật. Với `a = 560, b = 330` thì
tỉ số bán kính viễn/cận là 9,4, nên để bằng diện tích thì góc viễn nhật phải nhỏ
hơn **88 lần**, không phải 1,9 lần. Hình đang dạy ngược định luật nó minh hoạ.

Bản sửa tính diện tích thật bằng công thức shoelace rồi dò nhị phân góc viễn nhật
cho khớp. Hình bây giờ đúng theo nghĩa đo được, không theo nghĩa trông có vẻ đúng.

**Sóng hấp dẫn.** Bản đầu vẽ gợn thành ellipse **phẳng nổi bên trên** mặt lưới bị
võng. Kết quả đọc ra thành "hệ hành tinh có vành đai" — sai hẳn chủ đề. Gợn phải
được cộng vào cùng một hàm độ cao với giếng, tức nằm TRÊN mặt, thì mới thấy sóng
đang chạy ra.

Quy tắc chung: **nếu hình minh hoạ mang một mệnh đề kiểm chứng được thì tham số
của nó là dữ liệu, không phải lựa chọn thẩm mỹ.** Đặt cơ chế vào trong hình học,
đừng dán nó lên trên.

Và theo quy tắc 4 của skill `fact-check`: **sơ đồ sai là lỗi nội dung, không phải
lỗi thẩm mỹ.** Nó đi đường `science-editor`, không đi đường thiết kế.

### Tự nhìn sản phẩm trước khi giao

Cả hai lỗi trên đều tự phát hiện bằng cách kết xuất ảnh ra rồi **mở lên xem**,
không phải do người dùng báo. Bài sóng hấp dẫn phải vẽ lại ba lần: bản một đọc ra
thành hệ hành tinh, bản hai cắt lưới hình chữ nhật nên cụt hai đầu như tấm thảm
bay, bản ba mới đạt.

Với thứ có hình hài, "typecheck xanh" không phải bằng chứng nó đúng. Kết xuất ra,
xem ở **đúng kích thước sẽ dùng**, rồi mới giao.

## Tên thiên thể — từ loại tiếng Việt, tên riêng quốc tế

Nhãn hiển thị của một thiên thể ghép từ hai phần: từ chỉ loại bằng tiếng Việt,
rồi tên riêng giữ nguyên dạng quốc tế. "Thiên hà Andromeda", "Tinh vân Orion",
"Cụm sao Pleiades", "Sao Betelgeuse", "Lỗ đen Sagittarius A*".

Lý do là chuyện tra cứu chứ không phải thẩm mỹ. Tên Hán-Việt ("Tiên Nữ", "Lạp
Hộ", "Tua Rua") không dẫn tới đâu cả: gõ vào SIMBAD, Stellarium hay bất kỳ ứng
dụng bầu trời nào cũng không ra. Người đọc rời trang này để tìm tiếp thì phải
mang theo được cái tên vừa đọc. Từ chỉ loại thì ngược lại — nó là nghĩa, không
phải định danh, nên dịch.

Tên chòm sao dùng dạng Latin ("Orion", "Taurus", "Virgo"), vì đó là tên chính
thức của IAU và là thứ in trên mọi bản đồ sao.

Tên Hán-Việt vẫn nằm trong `aliases` của `SKY_TARGETS`, nên tìm kiếm bằng "Tua
Rua" hay "Lạp Hộ" vẫn ra. Bỏ khỏi nhãn không có nghĩa là bỏ khỏi dữ liệu.

Nhãn phải nói rõ nó là nhãn của cái gì. Một dòng chỉ ghi "Orion" dưới tên thẻ
là vô nghĩa — người đọc không biết đó là chòm sao hay một tên gọi khác của
chính thiên thể ấy, nên nhãn đứng trước: "Chòm sao Orion".

## Thẻ thiên thể trả lời bốn câu, theo thứ tự

Chốt 2026-09-12. Mô tả (`blurb` trong `src/lib/sky-data.ts`) đi theo khuôn:

> **là gì → ở đâu → cách bao xa → vì sao đáng xem**

Trước đó mỗi thẻ tự chọn kể cái gì, và đo ra thì **9 trong 11 thẻ thiếu ít nhất
một phần**: bảy thẻ không nói cách bao xa, sáu thẻ không nói nằm ở chòm nào.
Phần thiếu không lộ ra trên giao diện — thẻ vẫn đọc trôi chảy — nó chỉ khiến
người mở bản đồ lần đầu không quyết được có đáng bấm vào hay không.

**"Ở đâu" luôn là tên chòm sao dạng Latin**, theo mục "Tên thiên thể" ở trên.
Cùng lượt đã dọn hai chỗ sót của quy ước cũ: `galactic-centre` ghi "chòm Nhân
Mã", M87 ghi "cụm Xử Nữ".

**Khoảng cách là con số lên trang, nên nó có nguồn.** Cả chín lấy từ NASA, đọc
thật ngày 2026-09-12 — bảy từ Hubble Messier Catalog, Sgr A* từ trang riêng.
Nguồn ghi trong chú thích của trường `blurb`, không ghi ở đây, để nó nằm cạnh
chỗ người sau sẽ sửa.

**Hai chỗ phải giữ mệnh đề dè dặt:**

- **M45 = 445 năm ánh sáng**, kèm "chưa được thống nhất hoàn toàn" — chính
  trang NASA viết "not universally agreed upon". Con số cũ trong kho là 440 và
  không có nguồn. Mảng `facts` của thẻ đã đổi theo: để 440 ở đó trong khi blurb
  ghi 445 là một thẻ tự mâu thuẫn trong chính nó.
- **Betelgeuse = 500–700 năm ánh sáng**, không phải một con số. Bốn trang của
  **cùng một cơ quan** cho bốn giá trị: 548, 642, 650, 700. Chọn một rồi in ra
  như số đã chốt là dựng lên một độ chính xác không tồn tại — cùng họ với
  "ước lượng điểm không đặt vào tiêu đề" ở trên.

### Con số quảng cáo phải suy ra từ dữ liệu

Cùng lượt phát hiện thẻ "Bản đồ bầu trời" trên trang chủ ghi **"18 điểm đến
gợi ý"** trong khi trang thật mời 21 chỗ bấm (11 thiên thể sâu + Mặt Trời + 8
hành tinh + Mặt Trăng). Con số ấy đúng vào lúc viết rồi lạc hậu im lặng, vì nó
sống trong tệp ngôn ngữ còn danh mục sống trong tệp dữ liệu và không gì buộc
hai bên đi cùng nhau.

Nay nhãn nhận `{count}` và component tính `SKY_TARGETS.length + PLANETS.length + 2`.
**Quy tắc chung: một con số mô tả chính sản phẩm thì không được có bản sao thứ
hai.** Thêm một thiên thể là nhãn tự đúng, không cần ai nhớ.
