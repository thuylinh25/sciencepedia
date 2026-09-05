# Hàng đợi 60 chủ đề đầu tiên

Chủ: `knowledge-architect`. Lập 2026-09-05. Đầu ra nuôi `content-curator` (bước 1 của pipeline 11 bước).

## Phương pháp chọn

1. Đọc toàn bộ 41 bài PUBLISHED qua `npm run publish:check -- --json` và một truy vấn Prisma chỉ-đọc (slug, danh mục, danh mục cha, độ dài `content`) — không suy từ knowledge graph vì graph đang rỗng (0 entity, 41/41 bài `entityId = null`).
2. Đọc cây danh mục thật trong CSDL: 5 lĩnh vực gốc, 14 danh mục toàn cây — cả 9 danh mục con đều nằm dưới `vu-tru` (6) và `suc-khoe` (3); `vat-ly`, `sinh-hoc`, `trai-dat-va-khi-hau` là gốc phẳng, không có con.
3. Đo phân bố: **Vũ trụ 31 · Sức khoẻ 4 · Trái Đất và Khí hậu 3 · Vật lý 2 · Sinh học 1**. Kho lệch 76% về thiên văn, và trong 31 bài đó có 13 bài là hồ sơ thiên thể lẻ (8 hành tinh, Mặt Trời, sao chổi…) — dấu vết của một feed tin tức, không phải của một mô hình tri thức.
4. Đọc `docs/content-rules.md` — chốt độ dài 3.000–5.000 ký tự (3–5 phút) và câu quyết định: *"Nếu 5 phút không đủ để trả lời tử tế thì chủ đề đó quá rộng cho một bài."*
5. **Bộ lọc loại chủ đề**, áp theo thứ tự: (a) trùng hoặc gần trùng một trong 41 slug đã có → loại; (b) không trả lời trọn trong 5.000 ký tự → tách hoặc loại; (c) không đạt ≥3 nguồn bậc 1–2 dễ tìm → loại; (d) là sự kiện/thời sự chứ không phải khái niệm nền → loại.
6. **Bộ lọc thứ tự**: mỗi chủ đề phải hoặc lấp một lỗ hổng đo được trong 41 bài, hoặc là điều kiện tiên quyết của một dòng đứng sau. Thứ tự bảng là thứ tự tô-pô của DAG tiên quyết — không dòng nào phụ thuộc vào dòng đứng sau nó.
7. Ưu tiên nền tảng hơn thời sự, vì kho đã thừa thời sự và thiếu nền: 41 bài mà không có bài nào về **tế bào**, **DNA**, **nguyên tử**, **năng lượng**, **kiến tạo mảng** hay **chọn lọc tự nhiên**.

## Chia tỷ lệ 60 bài

| Lĩnh vực | Đang có | Hàng đợi | Sau hàng đợi |
|---|---:|---:|---:|
| Vật lý | 2 | **18** | 20 |
| Sinh học | 1 | **14** | 15 |
| Trái Đất và Khí hậu | 3 | **12** | 15 |
| Sức khoẻ | 4 | **8** | 12 |
| Vũ trụ | 31 | **8** | 39 |
| **Tổng** | **41** | **60** | **101** |

**Vì sao tỷ lệ này.** Tỷ lệ nghịch với kho hiện có, có chủ ý. Chia đều 12/12/12/12/12 sẽ giữ nguyên độ lệch (Vũ trụ vẫn gấp hơn ba lần Sinh học sau 60 bài); chia theo lưu lượng tìm kiếm sẽ làm nó tệ hơn. Sau hàng đợi này Vũ trụ còn 39% thay vì 76% — vẫn là lĩnh vực lớn nhất, nhưng không còn là *toàn bộ* sản phẩm.

Vũ trụ chỉ nhận 8 vì cái nó thiếu không nằm trong Vũ trụ: 31 bài thiên văn đang đứng trên phổ điện từ, hấp dẫn và thuyết tương đối rộng mà chưa bài nào tồn tại — nền của chúng nằm trong Vật lý, nên 18 bài Vật lý chính là khoản đầu tư cho Vũ trụ. 8 slot còn lại dồn vào hai chỗ trống thật: `lich-su-thien-van` đang có **0 bài**, `kham-pha-khong-gian` có **1 bài**.

Sức khoẻ chỉ nhận 8 vì nó nằm cuối chuỗi tiên quyết: viết về nơron trước khi có bài về tế bào, hay về vaccine trước khi có bài về dịch mã, là đúng cái nợ cấu trúc mà hàng đợi này sinh ra để tránh.

## Chặn trước khi viết dòng #1

`vat-ly`, `sinh-hoc`, `trai-dat-va-khi-hau` hiện là **danh mục gốc phẳng, không có danh mục con**. Đổ 44 bài vào ba nhánh phẳng rồi mới chia lại là việc đắt nhất có thể làm — URL phụ thuộc taxonomy, và taxonomy đổi thì phải version rồi migrate, không sửa tại chỗ. Cần chốt tầng 2 trước:

- **Vật lý** → Cơ học · Nhiệt và Năng lượng · Vật chất và Nguyên tử · Điện từ và Ánh sáng · Vật lý hiện đại
- **Sinh học** → Tế bào và Phân tử · Di truyền · Tiến hoá · Sinh lý và Trao đổi chất
- **Trái Đất và Khí hậu** → Địa chất · Khí quyển và Thời tiết · Đại dương · Khí hậu và Biến đổi

Hai tầng, còn xa mức trần 5 tầng. Cho tới khi việc này xong, hàng đợi bị chặn ở mọi dòng không thuộc Vũ trụ.

---

## Hàng đợi

| # | Chủ đề (vi) | Lĩnh vực | Loại entity | Vì sao chọn | Phụ thuộc |
|---:|---|---|---|---|---|
| 1 | Năng lượng là gì | Vật lý | Quantity | 41 bài dùng chữ "năng lượng" — từ `mat-troi` tới `van-dong-va-tim-mach` — mà không bài nào định nghĩa nó | — |
| 2 | Ba định luật Newton | Vật lý | Law | `dinh-luat-kepler` mô tả hành tinh chuyển động thế nào nhưng không bài nào nói vì sao | — |
| 3 | Khối lượng, quán tính và trọng lượng | Vật lý | Quantity | Ba đại lượng bị dùng lẫn trong 8 bài hành tinh; đúng thể loại "hai thứ dễ nhầm" mà kho đã làm tốt | — |
| 4 | Nguyên tử: hạt nhân, electron, đồng vị | Vật lý | Object | Nền của hoá học, của định tuổi phóng xạ (#22) và của phản ứng nhiệt hạch mà `mat-troi` đã nhắc | — |
| 5 | Sóng: bước sóng, tần số, biên độ | Vật lý | Concept | `song-hap-dan-va-song-trong-luc` phân biệt hai loại sóng trong khi chưa có bài định nghĩa sóng | — |
| 6 | Điện tích và dòng điện | Vật lý | Quantity | Tiên quyết của trường điện từ (#14) và của xung thần kinh (#53) | — |
| 7 | Cấu trúc bên trong Trái Đất | Trái Đất và Khí hậu | Object | Nhánh `trai-dat-va-khi-hau` có 3 bài, không bài nào về địa chất; `trai-dat` hiện chỉ 1.322 ký tự | — |
| 8 | Khí quyển Trái Đất: thành phần và các tầng | Trái Đất và Khí hậu | Object | `cuc-quang` và `nguyen-nhan-cua-mua` đều giả định người đọc đã biết khí quyển có tầng | — |
| 9 | Tế bào: đơn vị của sự sống | Sinh học | Object | Lĩnh vực Sinh học có đúng 1 bài (`crispr-la-gi`, 1.589 ký tự) và không bài nào về tế bào | — |
| 10 | Định luật bảo toàn năng lượng | Vật lý | Law | Ràng buộc dùng để bác các tuyên bố giả khoa học mà `chiem-tinh-hoc-khong-phai-khoa-hoc` đang thiếu chỗ dẫn tới | 1 |
| 11 | Nhiệt và nhiệt độ: khác nhau chỗ nào | Vật lý | Quantity | `sao-thuy` nói "nung và đóng băng cùng lúc" mà kho không có bài giải thích vì sao chân không không dẫn nhiệt | 1 |
| 12 | Bảng tuần hoàn các nguyên tố | Vật lý | Concept | Tiên quyết của liên kết hoá học (#20) và của phân tử sinh học (#30) | 4 |
| 13 | Phổ điện từ | Vật lý | Concept | `kinh-james-webb` (1.684 ký tự) nói "hồng ngoại" mà kho không có bài nào giải thích hồng ngoại là gì | 5 |
| 14 | Trường điện từ và phương trình Maxwell | Vật lý | Theory | `tu-truong-va-luc-hap-dan` so sánh hai lực nhưng không bài nào mô tả lực điện từ | 6, 13 |
| 15 | Hấp dẫn: Newton và điều Newton không giải thích | Vật lý | Phenomenon | Nửa còn lại của `tu-truong-va-luc-hap-dan`, và là cửa vào thuyết tương đối rộng (#29) | 2, 3 |
| 16 | Kiến tạo mảng | Trái Đất và Khí hậu | Theory | Lý thuyết trung tâm của địa chất, chưa có bài; tiên quyết của #23 và #24 | 7 |
| 17 | Chu trình nước | Trái Đất và Khí hậu | Process | Không bài nào về thuỷ quyển dù `nguyen-nhan-cua-mua` đã bàn tới khí hậu theo mùa | 8 |
| 18 | Thời tiết và khí hậu: khác nhau chỗ nào | Trái Đất và Khí hậu | Concept | Phân biệt bắt buộc trước khi viết #47; hai chữ này bị dùng lẫn trong mọi tranh luận khí hậu | 8 |
| 19 | Ba định luật nhiệt động lực học | Vật lý | Law | Nền chung của tiến hoá sao, của chuyển hoá tế bào (#41) và của cân bằng năng lượng khí hậu (#25) | 10, 11 |
| 20 | Liên kết hoá học | Vật lý | Concept | Cầu duy nhất từ nguyên tử sang sinh học phân tử (#30); thiếu nó thì DNA chỉ là một hình vẽ | 4, 12 |
| 21 | Ánh sáng: sóng hay hạt | Vật lý | Concept | `20-ngoi-sao-sang-nhat-bau-troi-dem` và `thang-khoang-cach-vu-tru` đều đo ánh sáng mà kho không có bài về ánh sáng | 5, 13 |
| 22 | Thang thời gian địa chất và định tuổi bằng đồng vị | Trái Đất và Khí hậu | Method | `dai-tuyet-chung-permi` và `hinh-thanh-va-tien-hoa-su-song` nêu mốc "252 triệu năm", "4 tỉ năm" mà không bài nào nói ta biết bằng cách nào | 4, 7 |
| 23 | Núi lửa | Trái Đất và Khí hậu | Phenomenon | Cơ chế đứng sau nguyên nhân được ưa chuộng nhất trong `dai-tuyet-chung-permi` | 16 |
| 24 | Động đất và sóng địa chấn | Trái Đất và Khí hậu | Phenomenon | Sóng địa chấn là bằng chứng cho #7; hai bài này khoá lẫn nhau | 16 |
| 25 | Hiệu ứng nhà kính | Trái Đất và Khí hậu | Process | `sao-kim` (1.274 ký tự) tự nhận hiệu ứng nhà kính là bài học chính của nó mà kho không có bài giải thích cơ chế | 8, 13 |
| 26 | Hoàn lưu đại dương | Trái Đất và Khí hậu | Process | Đại dương chiếm 71% bề mặt và có 0 bài; là bộ điều nhiệt mà #47 phải dựa vào | 8, 17, 18 |
| 27 | Entropy | Vật lý | Quantity | Khái niệm bị hiểu sai nhiều nhất trong vật lý phổ thông; tiên quyết của mọi bài về mũi tên thời gian | 19 |
| 28 | Cơ học lượng tử: các định đề | Vật lý | Theory | Danh mục Vật lý tự mô tả là "từ cơ học lượng tử tới thuyết tương đối" nhưng không có bài nào về lượng tử | 4, 21 |
| 29 | Thuyết tương đối rộng | Vật lý | Theory | `ho-den` (2.351) và `song-hap-dan-va-song-trong-luc` (5.059) đều là hệ quả của một lý thuyết chưa có bài | 15 |
| 30 | Bốn nhóm phân tử sinh học | Sinh học | Substance | Cầu từ liên kết hoá học sang tế bào; tiên quyết của #35 và #41 | 9, 20 |
| 31 | Quang phổ học thiên văn | Vũ trụ | Method | `sao-cau-tao-va-tien-hoa` nêu thành phần các sao mà không bài nào nói ta đọc được điều đó từ đâu | 13, 21 |
| 32 | Dịch chuyển đỏ và định luật Hubble | Vũ trụ | Law | `big-bang` (6.179 ký tự) dựng trên bằng chứng giãn nở, mà bằng chứng đó chưa có bài riêng | 5, 31 |
| 33 | Bức xạ nền vi sóng vũ trụ | Vũ trụ | Phenomenon | Bằng chứng mạnh nhất cho `big-bang` và cho `vat-chat-toi-va-nang-luong-toi`, hiện chỉ được nhắc qua | 13, 32 |
| 34 | Quỹ đạo và tốc độ vũ trụ cấp 1, cấp 2 | Vũ trụ | Concept | Nhánh `kham-pha-khong-gian` có đúng 1 bài; không viết được gì về du hành vũ trụ trước bài này | 2, 15 |
| 35 | DNA: cấu trúc và chức năng | Sinh học | Substance | `crispr-la-gi` chỉnh sửa một phân tử mà kho chưa từng mô tả — lỗ hổng lớn nhất của toàn kho | 30 |
| 36 | Ngoại hành tinh: các phương pháp phát hiện | Vũ trụ | Method | Hơn 5.000 ngoại hành tinh đã biết và kho có 0 bài, trong khi có 8 bài cho 8 hành tinh nhà | 31, 34 |
| 37 | Tên lửa và phương trình Tsiolkovsky | Vũ trụ | Law | Lấp `kham-pha-khong-gian`: giải thích vì sao đưa khối lượng lên quỹ đạo lại đắt đến vậy | 34 |
| 38 | Từ Ptolemy tới Copernicus: mô hình nhật tâm | Vũ trụ | Theory | Danh mục `lich-su-thien-van` đang có **0 bài**; đây là bài mở nhánh | 2 |
| 39 | Galileo và chiếc kính thiên văn đầu tiên | Vũ trụ | Person | Bài thứ hai của `lich-su-thien-van`, và là gốc lịch sử của `kinh-james-webb` | 21, 38 |
| 40 | Quang hợp | Sinh học | Process | Quá trình đưa năng lượng vào sinh quyển; tiên quyết của chu trình carbon (#46) | 1, 9, 13 |
| 41 | Hô hấp tế bào và ATP | Sinh học | Process | `van-dong-va-tim-mach` (2.236) nói về nhu cầu năng lượng của cơ mà kho không có bài về ATP | 9, 10, 30 |
| 42 | Gene và bộ gene | Sinh học | Concept | Tách "gene" khỏi "DNA" — hai thực thể khác nhau đang bị dùng thay cho nhau khắp nơi | 35 |
| 43 | Nhân đôi DNA | Sinh học | Process | Tiên quyết của đột biến (#48) và của phân bào (#45) | 35 |
| 44 | Phiên mã và dịch mã | Sinh học | Process | Giáo lý trung tâm; tiên quyết bắt buộc của vaccine mRNA (#60) | 35, 42 |
| 45 | Nguyên phân và giảm phân | Sinh học | Process | Cầu từ tế bào sang di truyền Mendel (#49) | 9, 43 |
| 46 | Chu trình carbon | Trái Đất và Khí hậu | Process | Nối sinh quyển với khí hậu; thiếu nó thì #47 chỉ là một khẳng định | 25, 40 |
| 47 | Biến đổi khí hậu do con người | Trái Đất và Khí hậu | Phenomenon | Chủ đề khoa học được tra cứu nhiều nhất mà kho có 0 bài; chỉ viết được sau #18, #25, #46 | 18, 25, 46 |
| 48 | Đột biến | Sinh học | Process | Nguyên liệu thô của tiến hoá, và là thứ `crispr-la-gi` đang tạo ra có chủ đích | 43, 44 |
| 49 | Di truyền Mendel | Sinh học | Law | Tầng mô tả của di truyền, cần có trước khi giải thích cơ chế chọn lọc | 42, 45 |
| 50 | Chọn lọc tự nhiên | Sinh học | Process | `hinh-thanh-va-tien-hoa-su-song` kể 4 tỉ năm kết quả mà không bài nào nêu cơ chế | 48, 49 |
| 51 | Sự hình thành loài | Sinh học | Process | Bước từ "cá thể thay đổi" sang "loài mới"; tiên quyết của cây phân loại (#52) | 50 |
| 52 | Cây sự sống và phân loại sinh giới | Sinh học | Concept | Xương sống taxonomy cho mọi bài sinh vật tương lai — phải có trước khi sinh loạt bài về loài | 51 |
| 53 | Nơron và điện thế hoạt động | Sức khoẻ | Object | `giac-ngu-sau-va-tri-nho` (2.789) nói về củng cố trí nhớ mà kho không có bài về nơron | 6, 9 |
| 54 | Não bộ: các vùng và chức năng | Sức khoẻ | Object | Nhánh Sức khoẻ có tag `nao-bo` nhưng không bài nào về não | 53 |
| 55 | Nhịp sinh học | Sức khoẻ | Process | Nền sinh lý mà `giac-ngu-sau-va-tri-nho` giả định sẵn; lấp nhánh `giac-ngu` đang có 1 bài | 54 |
| 56 | Hệ tuần hoàn: tim và mạch máu | Sức khoẻ | Object | `van-dong-va-tim-mach` mô tả sự thay đổi của một hệ mà kho chưa mô tả hệ đó | 9, 41 |
| 57 | Hệ hô hấp và trao đổi khí | Sức khoẻ | Object | Nửa còn lại của chuỗi oxy: từ phổi tới ty thể (#41) | 41, 56 |
| 58 | Trao đổi chất và năng lượng ở người | Sức khoẻ | Process | Nhánh `dinh-duong` chỉ có `he-vi-sinh-duong-ruot` (2.443); calo cần một bài trước khi bàn tới ăn uống | 1, 41 |
| 59 | Vitamin và khoáng chất thiết yếu | Sức khoẻ | Substance | Chủ đề nhiều thông tin sai nhất trong dinh dưỡng, và kho chưa có chỗ đứng nào để phản bác | 58 |
| 60 | Vaccine hoạt động thế nào | Sức khoẻ | Method | `he-mien-dich-nhan-dien-virus` (2.496) dừng ở khâu nhận diện; ứng dụng lớn nhất của nó chưa có bài | 9, 44 |

---

## Cần viết lại (không đưa vào hàng đợi mới)

18 bài đã xuất bản nằm dưới ngưỡng 3.000 ký tự. Chúng **không** được viết lại thành bài mới trong hàng đợi — chủ đề đã có entity, viết bài thứ hai là tạo trùng lặp. Xử lý bằng một đợt mở rộng riêng, sau khi bài nền tương ứng đã xong, vì khi đó mới có link nội bộ để dựa vào.

| Slug | Ký tự | Mở rộng được sau dòng # |
|---|---:|---:|
| `sao-thuy` | 1.076 | 11 |
| `sao-hoa` | 1.114 | 36 |
| `sao-thien-vuong` | 1.219 | 2 |
| `sao-tho` | 1.273 | 2 |
| `sao-kim` | 1.274 | 25 |
| `trai-dat` | 1.322 | 7 |
| `sao-hai-vuong` | 1.362 | 2 |
| `sao-moc` | 1.397 | 15 |
| `thuyet-tuong-doi-hep` | 1.454 | 21 |
| `crispr-la-gi` | 1.589 | 48 |
| `kinh-james-webb` | 1.684 | 31 |
| `van-dong-va-tim-mach` | 2.236 | 56 |
| `mat-troi` | 2.314 | 19 |
| `ho-den` | 2.351 | 29 |
| `he-vi-sinh-duong-ruot` | 2.443 | 58 |
| `he-mien-dich-nhan-dien-virus` | 2.496 | 60 |
| `giac-ngu-sau-va-tri-nho` | 2.789 | 55 |
| `tu-truong-va-luc-hap-dan` | 2.873 | 14 |

Ở đầu kia của thang đo, bốn bài vượt trần đáng kể cần **rút gọn**, không mở rộng: `hinh-thanh-va-tien-hoa-su-song` (6.499), `big-bang` (6.179), `chiem-tinh-hoc-khong-phai-khoa-hoc` (6.170), `su-ra-doi-cua-he-mat-troi` (5.700). Mười bài trong khoảng 5.0–5.5k chỉ lệch biên, để đó.

## Đã loại, và vì sao

| Chủ đề | Lý do loại |
|---|---|
| "Tiến hoá" gộp thành một bài | Không trả lời trọn trong 5.000 ký tự → tách thành #48, #49, #50, #51, #52 |
| "Vũ trụ giãn nở" | Gần trùng `big-bang` cộng #32; sẽ là một mục trong bài đó, không phải entity riêng |
| "Hố đen", "Thiên hà" | Đã có bài (`ho-den`, `thien-ha-dinh-nghia-va-phan-loai`) — thuộc mục "Cần viết lại" |
| "Nguyên nhân của mùa", "Nhật thực và nguyệt thực" | Đã có bài, độ dài đạt chuẩn |
| "Sao Diêm Vương" | Gần trùng `tai-sao-pluto-khong-con-la-hanh-tinh` |
| "Máy tính lượng tử", "Trí tuệ nhân tạo" | Ứng dụng thời sự, không phải khái niệm nền; và không đứng vững nếu #28 chưa có |
| "Enzyme", "Chu trình đá" | Đủ tiêu chí nhưng thua slot cuối; giữ làm ứng viên đợt 61–120 |
| "Mô hình Chuẩn và hạt cơ bản" | Cần #28 làm nền và không có độc giả cho tới khi nhánh Vật lý đủ dày; hoãn sang đợt sau |

## Nợ taxonomy đã ghi nhận

Kho không có lĩnh vực gốc **Hoá học**. #4, #12 và #20 tạm đặt dưới Vật lý, nhánh con "Vật chất và Nguyên tử". Đây là quyết định có ý thức, không phải bỏ sót: mở một lĩnh vực gốc thứ sáu chỉ với 3 bài là tạo thêm một nhánh mỏng. Xem lại khi số bài hoá học vượt 8 — và khi đó phải version rồi migrate taxonomy, không sửa tại chỗ, vì URL phụ thuộc vào nó.
