# Đính chính

Những claim đã xuất bản rồi bị sửa. Mỗi mục ghi: claim cũ, claim mới, căn cứ.

## Vì sao có file này

Sửa một bài chưa publish là biên tập. Sửa một bài **đã** publish là đính chính — người đọc có thể đã mang con số cũ đi rồi, và một lần sửa im lặng khiến họ không bao giờ biết. Kho chưa có cơ chế hiển thị đính chính trên trang, nên đây là chỗ tối thiểu để dấu vết đó tồn tại.

Bản nội dung trước mỗi lần sửa được chụp vào bảng `Revision` trong cùng transaction với lệnh sửa, nên lịch sử không thể lệch khỏi nội dung. Script: `scripts/apply-corrections.ts`.

---

## 2026-09-05 — lượt fact-check 32 bài tồn đọng

Bối cảnh: 32 bài đã ở trạng thái `PUBLISHED` nhưng `factCheck = PENDING`, tức lên trang mà chưa qua bước thẩm định. Lượt audit ghi kết quả từng bài ở `docs/content/checks/*.yaml`. Không có phát hiện S1 (bịa nguồn) nên không bài nào phải gỡ. Tám bài dưới đây có claim sai và đã được sửa; `science-editor` duyệt từng câu chữ thay thế trước khi áp.

### S2 — sai sự thật

**`sao-moc` · Vết Đỏ Lớn**
- Cũ: "được quan sát liên tục từ thế kỷ 17"
- Mới: theo dõi liên tục từ khoảng 1831; "Vết Vĩnh cửu" Cassini quan sát 1665–1713 là cấu trúc khác đã tan biến, không có chuỗi quan sát nối hai vết
- Căn cứ: Sánchez-Lavega et al. 2024, *Geophysical Research Letters*, [10.1029/2024GL108993](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2024GL108993)

**`sao-cau-tao-va-tien-hoa` · Sao loại M nhìn bằng mắt thường**
- Cũ: "Không một sao loại M nào nhìn được bằng mắt thường"
- Mới: không sao **lùn đỏ** (M trên dãy chính) nào nhìn được; các sao M thấy được như Betelgeuse hay Antares đều là khổng lồ hoặc siêu khổng lồ đã rời dãy chính
- Căn cứ: câu cũ tự mâu thuẫn với **bảng quang phổ ngay phía trên nó**, vốn liệt kê Betelgeuse làm ví dụ lớp M, và với bài `20-ngoi-sao-sang-nhat-bau-troi-dem` (Betelgeuse #10, Antares #15). Lỗi gốc là dùng "loại M" cho hai thứ khác nhau: lớp quang phổ và lớp độ trưng.

**`big-bang` và `thien-ha-dinh-nghia-va-phan-loai` · Sáp nhập Ngân Hà–Andromeda**
- Cũ: sẽ sáp nhập sau khoảng 4,5 tỉ năm (nói như điều chắc chắn)
- Mới: khoảng 50% khả năng sáp nhập trong 10 tỉ năm tới; nếu xảy ra thì nhiều khả năng ở mốc 7–8 tỉ năm
- Căn cứ: Sawala et al. 2025, *Nature Astronomy*, "Apocalypse When? No Certainty of a Milky Way–Andromeda Collision", [10.1038/s41550-025-02563-1](https://doi.org/10.1038/s41550-025-02563-1) — dùng Gaia và Hubble, có tính thêm Đám mây Magellan Lớn và M33. Mốc 4,5 tỉ năm đến từ nghiên cứu 2012 đã bị xét lại.
- Ở `big-bang` sửa luôn thứ tự dòng trong bảng: mốc này vốn bị xếp sau dòng Mặt Trời (~8 tỉ năm) trong một bảng đọc theo thời gian tăng dần.

**`crispr-la-gi` · Phê duyệt Casgevy**
- Cũ: "Tháng 12/2023, các cơ quan quản lý Anh và Mỹ phê duyệt … cho bệnh hồng cầu hình liềm và beta-thalassemia"
- Mới: MHRA (Anh) phê duyệt tháng 11/2023 cho cả hai chỉ định; FDA (Mỹ) phê duyệt 08/12/2023 chỉ cho hồng cầu hình liềm, chỉ định beta-thalassemia bổ sung ngày 16/01/2024
- Căn cứ: [MHRA](https://www.gov.uk/government/news/mhra-authorises-world-first-gene-therapy-that-aims-to-cure-sickle-cell-disease-and-transfusion-dependent-thalassemia) · [FDA](https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapies-treat-patients-sickle-cell-disease)
- Bản sửa cố ý chỉ ghi **tháng** cho MHRA: nguồn chia hai giữa ngày cấp phép và ngày công bố, và ghi một ngày mình không phân giải được là làm con số trông chắc hơn bằng chứng.

### S3 — lỗi lặp lại trên nhiều bài

**`sao-kim` và `tam-hanh-tinh-he-mat-troi` · "Một ngày trên Sao Kim dài hơn một năm"**
- Cũ: một ngày dài 243 ngày Trái Đất, dài hơn năm 225 ngày
- Mới: 243 ngày là chu kỳ **tự quay sao**; vì Sao Kim quay ngược chiều, **ngày mặt trời** ở đó chỉ khoảng 117 ngày — tức **ngắn hơn** một năm
- Căn cứ: [NASA Venus Facts](https://science.nasa.gov/venus/venus-facts/) — "sunrise to sunset would take 117 Earth days"
- Đây là lỗi kho tự mâu thuẫn: bài `sao-thuy` đã viết đúng ("một ngày mặt trời trên Sao Thuỷ — từ trưa này tới trưa kế tiếp"). Cột "Chu kỳ tự quay" trong bảng của `tam-hanh-tinh-he-mat-troi` cũng vốn đã đúng; chỉ câu văn xuôi diễn giải nó sai.

**`he-vi-sinh-duong-ruot` · Số vi sinh vật trong ruột**
- Cũ: khoảng 10¹⁴ (tiêu đề: "100 nghìn tỉ cư dân")
- Mới: khoảng 4×10¹³, cỡ 40 nghìn tỉ; tiêu đề đổi thành "hàng chục nghìn tỉ cư dân"
- Căn cứ: Sender, Fuchs & Milo 2016, *PLOS Biology*, [10.1371/journal.pbio.1002533](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002533). Con số 10¹⁴ truy về Luckey 1972.
- Bài giữ lại con số cũ **có nêu tên** để người đọc đã gặp "100 nghìn tỉ" ở nơi khác biết mình vừa đọc gì.
- Trớ trêu đáng ghi: câu "tổng khối lượng khoảng 200 gram" ngay sau đó vốn đã lấy từ **chính** bài Sender 2016 — bài dùng số mới cho khối lượng nhưng giữ số cũ cho số lượng.

### Phán quyết kèm theo

**Không đặt ước lượng điểm vào tiêu đề bài.** `science-editor` bác đề xuất thay "100 nghìn tỉ" bằng "40 nghìn tỉ" trong tiêu đề: đó là lặp lại đúng sai lầm vừa sửa với một con số mới hơn. Tiêu đề không mang được mệnh đề dè dặt lẫn năm đo, mà chính việc một con số bị tách khỏi năm của nó là cách 10¹⁴ sống sót 50 năm. "Hàng chục nghìn tỉ" đúng dù ước lượng tới có là 3,8×10¹³ hay 10¹⁴, nên nó không phải sửa lại lần nữa.

### Còn nợ sau lượt này

- `factCheck` của cả tám bài **vẫn là PENDING**. Sửa chuỗi không phải là qua gate: cả tám vẫn thiếu `reviewedById`.
- 31/32 bài trong lượt audit dưới ngưỡng 3 nguồn bậc 1–2 (`crispr-la-gi` vừa đạt nhờ hai nguồn thêm ở trên).
- `he-vi-sinh-duong-ruot`: con số "70% mô lympho" vẫn chưa có nguồn. Theo quy tắc 6 của skill fact-check thì số không nguồn phải **gỡ**, không phải làm mềm.
- URL NSSDC (`nssdc.gsfc.nasa.gov/planetary/factsheet/`) trả 307 về trang chủ, ảnh hưởng 9 bài hành tinh. Đây là lỗi ở **gate** chứ không ở bài: `isAlive()` trong `scripts/check-publish.ts` dùng `redirect: "follow"` rồi xét `response.ok`, nên một URL chết chuyển hướng về trang chủ vẫn được tính là còn sống.
