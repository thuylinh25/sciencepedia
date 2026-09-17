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

---

## 2026-09-10 — `cau-truc-ben-trong-trai-dat`: hoàn tác một lượt sửa tay không qua gate

Ngày 2026-09-08, bài đã publish bị sửa tay hai lần qua giao diện admin, không ghi chú, không qua gate accuracy. Lượt sửa đó **hoàn tác cả hai lỗi S2 mà `science-editor` đã bắt và sửa ngày 2026-09-06**. Dưới đây là từng claim, ở dạng bạn đọc có thể đã mang đi trong khoảng 2026-09-08 → 2026-09-10.

Bài cũng đổi slug trong cùng lượt: `hanh-trinh-vao-tam-trai-dat` → `cau-truc-ben-trong-trai-dat`, URL cũ 301 sang URL mới.

### S2 — sai sự thật

**Nhiệt độ lõi trong**
- Cũ: "Nhiệt độ tại lõi trong được ước tính khoảng 5.000 - 6.000°C, tương đương hoặc cao hơn bề mặt Mặt Trời."
- Mới: nhiệt độ ở **ranh giới** lõi trong chỉ được *kỳ vọng* gần điểm nóng chảy của sắt ở 330 GPa; con số **6.230 ± 500 K** là điểm nóng chảy của **sắt nguyên chất**, ngoại suy từ thí nghiệm chỉ tới 200 GPa, không phải nhiệt độ đo được của lõi
- Căn cứ: Anzellini et al. 2013, *Science* 340(6131), 464–466, [10.1126/science.1233514](https://doi.org/10.1126/science.1233514) — "is expected to be close to", "When extrapolating", "there is little consensus"
- Khoảng "5.000 - 6.000°C" không xuất hiện trong bất kỳ nguồn nào gắn với bài. Phép ví Mặt Trời là của NASA và có thật, nhưng NASA không kèm con số nào vào đó; ghép số vào phép ví là điều đã bị bác từ 2026-09-06.

**Khoảng cách từ bề mặt xuống tâm**
- Cũ: "khoảng 6.371 km" · tỉ số hố khoan Kola "khoảng 0,2%"
- Mới: "chừng **6.375 km** (nửa đường kính 12.750 km mà USGS nêu)" · "**0,19%**"
- Căn cứ: [USGS, Inside the Earth](https://pubs.usgs.gov/gip/dynamic/inside.html) — "about 12,750 kilometers (km) in diameter"
- 6.371 không nguồn nào phát biểu; nó là tổng ba con số NASA và trúng đích do làm tròn. Bản tiếng Anh của **cùng một bài** vẫn luôn ghi 6,375 km — hai locale in hai con số cho cùng một đại lượng suốt hai ngày.

**Trạng thái lõi ngoài và lõi trong**
- Cũ: "Tồn tại ở trạng thái lỏng." · "Tồn tại ở trạng thái rắn do áp suất cực lớn."
- Mới: USGS *cho rằng* lõi ngoài ở trạng thái lỏng (vì không truyền sóng S và vì vận tốc sóng P giảm mạnh); USGS *cho rằng* lõi trong ở trạng thái đặc (căn cứ hành vi của cả sóng P lẫn sóng S)
- Căn cứ: [USGS, The Interior of the Earth](https://pubs.usgs.gov/gip/interior/index.html) — "The outer core is **presumed** to be liquid…"; "The inner core is **considered** to be solid…"
- Đây là suy luận từ sóng địa chấn, không phải quan sát trực tiếp, và nguồn nói đúng như vậy. Cụm "do áp suất cực lớn" bị gỡ: nguồn cho *bằng chứng* địa chấn chứ không cho *nguyên nhân*, và "bị nén thành rắn" để lại mô hình sai — áp suất đẩy điểm nóng chảy lên trên nhiệt độ tại chỗ, không ép chất lỏng thành chất rắn.

### S3 — số và cách diễn đạt

**Độ dày vỏ**
- Cũ: "30-35 km dưới lục địa" · "5-10 km dưới đáy đại dương"
- Mới: "Theo NASA, dày trung bình chừng **31 km** trên đất liền" · "chừng **5 km** ở đáy đại dương"
- Căn cứ: [NASA, Earth's Magnetosphere](https://science.nasa.gov/science-research/earth-science/earths-magnetosphere-protecting-our-planet-from-harmful-space-energy/) — "about 19 miles (31 kilometers) deep on average on land and about 3 miles (5 kilometers) deep at the ocean bottom". Các giá trị 35 và 10 không có trong nguồn nào gắn với bài.

**Bán kính lõi trong**
- Cũ: 1.220 km · Mới: **1.221 km** (theo NASA)
- Căn cứ: NASA, cùng trang trên. 1.220 là một lần làm tròn lại con số đã dẫn nguồn, và nó phá tổng 1.221 + 2.250 + 2.900 = 6.371.

**Lỗ khoan Kola**
- Cũ: "Lỗ khoan **sâu nhất** từng được tạo ra"
- Mới: "Một lỗ khoan của Liên Xô ở bán đảo Kola đạt tới 12 km và vẫn chưa xuyên qua nổi ranh giới vỏ–manti."
- Căn cứ: USGS, The Interior of the Earth — nguồn chỉ nói "a Soviet hole on the Kola Peninsula has been drilled to a depth of 12 kilometers". Không nguồn nào gọi nó là sâu nhất.

**Vai trò của từ trường**
- Cũ: "giúp bảo vệ **khí quyển** và sự sống khỏi bức xạ từ không gian"
- Mới: "vùng từ quyển mà NASA mô tả là lớp che chắn hành tinh khỏi bức xạ có hại từ không gian"
- Căn cứ: NASA, cùng trang trên. Mệnh đề từ trường bảo vệ *khí quyển* không có passage nào chống lưng và còn đang tranh cãi trong giới nghiên cứu — Sao Kim không có từ trường nội tại mà vẫn giữ khí quyển dày.

### Phán quyết kèm theo

**Một lượt sửa tay trên bài đã publish là đính chính, và nó phải đi đường đính chính.** Hai revision ngày 2026-09-08 thay số **có** nguồn bằng số **không** nguồn, gỡ toàn bộ mệnh đề dè dặt, và xoá mọi attribution trong thân bài — trong khi hàng vẫn treo 8 Source và `reviewedById` khác null. Trang tự nhận đã thẩm định trong lúc không câu nào với tới được nguồn nào. Đây là lý do gate accuracy không nhận ngoại lệ cho đường ghi qua giao diện admin.

**`reviewedAt` phải đóng dấu lại, không được giữ.** Dấu 2026-09-06 chứng thực cho một văn bản đã bị thay từ 2026-09-08; giữ nguyên nó là để một byline nói sai. Byline vẫn là tài khoản tổ chức "Ban biên tập Sciencepedia", không bịa tên người.

**Đĩa và CSDL đã lệch nhau hai ngày.** Bản sửa tay chỉ tồn tại trong CSDL; `docs/content/drafts/cau-truc-ben-trong-trai-dat.md` vẫn là bản pipeline 598 từ. Phép kiểm của `meta.yaml` cho bước 3 và bước 9 là `ls` file đó — nên phép kiểm trả kết quả xanh cho một nội dung không còn được phục vụ. Lượt này ghi cả ba chỗ: cột `content`, file draft, và một khối mới trong `meta.yaml`.

## 2026-09-11 — hai lỗi S1 trong lô 9 bài không nguồn

Lượt rà toàn kho ngày 2026-09-11 đo được **41/58 bài đã xuất bản ở `factCheck = PENDING`**, trong đó 9 bài không có một Source nào. `science-editor` thẩm định lô 9 bài đó: **9/9 REVISE**, tổng 36 phát hiện, trong đó **hai phát hiện mức S1 — cả hai nằm ở nội dung sức khoẻ**. Hai lỗi đó đã được đính chính ngay, tách khỏi 34 phát hiện S2/S3 còn lại.

### S1 — `ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai`

- Cũ: "Khoảng **95% serotonin** của cơ thể được sản xuất tại đường tiêu hóa, chỉ khoảng 5% được tạo ra trong não."
- Mới: 90–95% serotonin nằm ở đường tiêu hoá, do tế bào ưa crôm ruột tiết ra, **không đi qua hàng rào máu–não**, không phải nguồn serotonin của não; trục ruột–não đi qua thần kinh phế vị, miễn dịch và nội tiết.
- Căn cứ: Hwang YK và cộng sự, *Interaction of the Vagus Nerve and Serotonin in the Gut–Brain Axis*, Int J Mol Sci 2025;26(3):1160, [10.3390/ijms26031160](https://doi.org/10.3390/ijms26031160)
- **Vì sao là S1 chứ không phải S2.** Bản thân con số không sai. Cái sai là mô hình nó dựng lên khi đứng cạnh mục "Kết nối chặt chẽ với cảm xúc" và mục hướng dẫn ăn sữa chua để "lập trình lại" hệ vi sinh: người đọc ghép ba thứ đó lại thành *serotonin của tâm trạng nằm ở ruột, nên ăn đúng thứ sẽ nâng nó lên*. Đó đúng là mô hình mà ngành thực phẩm chức năng đang bán, và nó có thể đổi hành vi.

Kèm trong cùng lượt: số nơron hệ thần kinh ruột (400–600 triệu là ước lượng trích lại; phép đếm trực tiếp đầu tiên năm 2022 cho ~168 triệu — Michel K và cộng sự, Neurogastroenterol Motil 2022;34(12):e14440, [10.1111/nmo.14440](https://doi.org/10.1111/nmo.14440)); bỏ con số ngầm về tỉ lệ tín hiệu hướng tâm; thống nhất "hàng chục nghìn tỉ" vi sinh vật với hai bài còn lại trong kho.

### S1 — `nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao`

- Cũ: không có một dòng chống chỉ định nào.
- Mới: thêm mục riêng **"Ai không nên nhịn ăn gián đoạn"** đặt trước phần Kết luận — mang thai và cho con bú, trẻ em, tiền sử rối loạn ăn uống, tiền sử hạ đường huyết nặng, người cao tuổi có nguy cơ thiểu cơ, và người đái tháo đường đang dùng thuốc hạ đường huyết.
- **Vì sao là S1.** Bài không nói gì sai. Cái nó **im lặng** mới là thứ có thể gây hại: nó nằm ở chuyên mục dinh dưỡng, liệt kê bảy lợi ích, kết bằng mô tả hành vi ("ít ăn vặt hơn"), và có thể được đọc bởi đúng những người không nên làm theo.
- Đặt thành **mục riêng có tiêu đề**, không nhét vào kết luận: chống chỉ định y tế phải gặp được khi lướt, mà một đoạn nằm lẫn trong kết luận thì người lướt không thấy.

### Phán quyết kèm theo

**Văn bản chèn vào là nguyên văn câu sửa của `science-editor`, không phải bản diễn đạt lại.** Gate accuracy thuộc về editor; một câu về chống chỉ định y tế do người khác viết lại thì không còn là câu đã qua gate.

**`factCheck` vẫn để `PENDING` cho cả hai bài.** Lượt này chỉ đóng hai lỗi S1. Mỗi bài còn 3–4 phát hiện S2/S3 chưa áp, và cả hai vẫn chưa có Source nào gắn vào CSDL. Đặt `PASSED` lúc này là dán nhãn "đã thẩm định" lên một hàng còn dở — đúng thứ sai mà mục 2026-09-10 ở trên đã phán quyết.

### Một mẫu lỗi cho cả kho, không riêng lô này

Lỗi lặp nhiều nhất trong chín bài là **con số đúng gắn vào kết luận sai**: tốc độ kỷ lục của Parker Solar Probe quy thành thời gian bay tới Proxima (tàu ở quỹ đạo đóng, không bao giờ rời Hệ Mặt Trời); biên độ nhiệt vỏ trạm ISS gán cho thân người; "95% serotonin" ở trên. Cả ba đều qua được phép kiểm số học và phép kiểm link — **chỉ đọc nguồn mới bắt được**, đúng như mục Pollack 1996 đã ghi.

Ba trong chín bài **không có phần kết** — một bài cụt hẳn giữa mục. Đó là dấu hiệu một lượt sinh bài bị cắt ngang chứ không phải lựa chọn biên tập, nên 32 bài PENDING còn lại đáng nghi mang cùng khuyết tật.

## 2026-09-11 (tiếp) — 19 câu sửa S2/S3 trên bảy bài, và một lỗi liên kết cả kho

Áp nốt phán quyết của `science-editor` cho lô 9 bài không nguồn, sau khi hai lỗi S1 đã xử ở mục trên. Mọi câu thay thế là **nguyên văn của editor**, không diễn đạt lại.

Mẫu lỗi chung, đáng nhớ hơn từng bài: **con số đúng gắn vào kết luận sai.**

- `neu-roi-he-mat-troi-proxima-centauri` — tốc độ kỷ lục 192 km/s của Parker Solar Probe quy thành "6.700 năm tới Proxima", xếp cùng bảng với Voyager 1 và New Horizons. Số học đúng; suy luận sai: PSP ở **quỹ đạo đóng** quanh Mặt Trời và không bao giờ rời Hệ Mặt Trời. Cùng họ với lỗi Pollack 1996.
- `dieu-gi-se-xay-ra-neu-con-nguoi-ra-ngoai-vu-tru` — biên độ nhiệt +120°C/−150°C là của **vỏ tàu vũ trụ**, bị gán cho thân người. Cơ thể mất nhiệt do nước bay hơi, nên da thấy hơi mát.
- "95% serotonin" ở mục trên.

Cả ba đều qua được phép kiểm số học **và** phép kiểm link. Chỉ đọc nguồn mới bắt được.

Hai phán quyết khác đáng ghi:

**`neu-trai-dat-dang-quay`** — con số "1,2%" sinh ra từ việc nhân bốn lần con số **đã làm tròn của chính bài** (0,3% × 4); giá trị thật là 1,38%. Cùng họ với lỗi làm tròn chồng làm tròn đã ghi ở đợt Sao Mộc. Bài cũng bị **cụt**: mở mục "nếu quay nhanh gấp đôi" rồi dừng sau một gạch đầu dòng, không có phần kết. Theo khuyến nghị của editor, đã **cắt hẳn mục đó** và viết phần kết — câu hỏi ở tiêu đề đã được trả lời trọn vẹn trước khi mục ấy bắt đầu, nên cắt rẻ và an toàn hơn viết nốt.

**`bi-mat-dang-sau-cam-giac-hut-hang`** — gán gia tốc thẳng cho **ống bán khuyên**. Ống bán khuyên cảm nhận gia tốc **góc**; gia tốc thẳng là việc của **cơ quan sỏi tai** (soan nang và cầu nang). Toàn bộ tình huống bài mô tả — xe tăng tốc, phanh gấp — là gia tốc thẳng.

### Liên kết nội bộ trỏ tới slug đã đổi

Ba bài đã xuất bản (`trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song`, `su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian`, `dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat`) vẫn trỏ tới `/articles/hanh-trinh-vao-tam-trai-dat` — slug đã đổi từ 2026-09-10. Đã đổi cả ba sang slug hiện hành.

**Vì sao đáng sửa dù đã có 301.** Người đọc vẫn tới đúng chỗ, nên lỗi này vô hình trên giao diện. Nhưng `check-publish` đếm liên kết vào theo **chuỗi slug**, nên bài đích bị tính là 0 link vào và bị chặn gate; và liên kết nội bộ đi qua redirect là chi phí SEO không có lý do gì phải trả.

**Bài học cho lượt đổi slug sau:** đổi slug là **ba** việc, không phải hai. Đổi cột `slug`, thêm 301, **và viết lại mọi liên kết nội bộ đang trỏ tới slug cũ**. Việc thứ ba từng bị bỏ sót và chỉ lộ ra khi gate xuất bản kêu.

### Trạng thái sau lượt này

`cau-truc-ben-trong-trai-dat` **qua gate xuất bản** (1/1), sau khi thêm bốn liên kết nội bộ bọc quanh cụm từ đã có sẵn — không đổi một chữ nào của bản vừa qua gate accuracy hai vòng.

Chín bài trong lô vẫn để `factCheck = PENDING`: chưa bài nào có Source gắn vào CSDL. 32 bài PENDING còn lại chưa rà.

## 2026-09-11 (tiếp) — rà "cụt giữa chừng" toàn kho: giả thuyết đúng một nửa

Mục trước đặt một nghi vấn: ba trong chín bài lô không nguồn không có phần kết, và đó là dấu vết **một lượt sinh bài bị cắt ngang**, nên 32 bài PENDING còn lại đáng nghi mang cùng khuyết tật. Lượt này đo thử. Công cụ: `scripts/check-closure.ts` (`--all` cho cả kho).

### Phép đo phải chỉnh hai lần, và đó là phần đáng nhớ

Cả hai lần đầu đều cho ra một phép đo **dương tính với gần hết kho**, tức không phân biệt được gì:

1. Mọi bài đều kết bằng mục "Đọc thêm" chỉ chứa liên kết nội bộ → 41/41 bài "kết bằng gạch đầu dòng". Mục ấy là điều hướng, không phải phần cuối của lập luận.
2. Kho **không** dùng tiêu đề "## Kết luận" làm chuẩn — chỉ 7/41 bài có nó. Phần lớn khép bằng đoạn tóm dẫn bằng emoji hoặc trích dẫn khối `>`. Bắt theo tiêu đề thì 34/41 báo dương tính.

Bài học chung: **một phép rà dương tính với gần hết tập đo là một phép rà hỏng, không phải một phát hiện lớn.** Cả hai lần, cái sai nằm ở chỗ lấy quy ước của mình làm chuẩn thay vì đọc quy ước của kho.

### Kết quả

| | PENDING (41) | Cả kho (58) |
|---|---|---|
| Không có động tác khép | 13 | 21 |
| Khép bằng đoạn tóm (emoji / `>`) | 13 | 21 |
| Khép bằng tiêu đề "Kết luận" | 7 | 7 |
| Khép bằng dòng ghi bài gốc | 5 | 6 |
| Khép bằng dòng miễn trừ y tế | 3 | 3 |

### Vì sao giả thuyết chỉ đúng một nửa

**Tám bài đã `factCheck = PASSED` cũng nằm trong nhóm không khép**: `bi-mat-dang-sau-cam-giac-nang-va-nhe`, `khi-quyen-trai-dat`, `nang-luong-la-gi`, `newton-da-giai-ma-the-gioi-nhu-the-nao`, `nhung-hat-vo-hinh-tao-nen-the-gioi-vat-chat`, `song-truyen-nang-luong-nhu-the-nao`, `thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao`, `tu-electron-den-dong-dien-nguon-goc-cua-dien-nang`.

Đọc chúng thì thấy: chúng kết bằng một câu tóm ý thật, chỉ là không mang dấu hiệu hình thức nào. `newton-da-giai-ma-the-gioi-nhu-the-nao` kết bằng "Ông đã tìm ra những…" — một câu khép, không phải một câu bị cắt.

Nên "không khép" gộp hai thứ khác hẳn nhau: bài **thiếu dấu hiệu hình thức** (không sao) và bài **dừng giữa lúc đang trình bày** (khuyết tật thật). Thứ phân biệt được hai loại không phải động tác khép, mà là **mục cuối mỏng** và **kết bằng gạch đầu dòng**.

### Khuyết tật thật, và nó là một cụm

Lọc theo hai dấu hiệu đó thì nhóm nghi vấn co lại và lộ ra hình dạng: **chín bài hành tinh và thiên văn, dài 242–361 từ, đều dừng ở một mục cuối dưới 60 từ.**

`sao-hoa` · `sao-thuy` · `sao-kim` · `sao-moc` · `sao-tho` · `sao-thien-vuong` · `sao-hai-vuong` · `trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song` · `kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh`

`sao-hoa` kết bằng gạch đầu dòng "Hai vệ tinh nhỏ Phobos và Deimos…" nằm dưới tiêu đề **"Địa hình cực đoan"** — vệ tinh không phải địa hình. Đó không phải một bài thiếu dấu hiệu khép; đó là một bài bị cắt giữa lúc đổi chủ đề.

Đây là **một lô sinh bài**, không phải khuyết tật rải đều toàn kho như nghi vấn ban đầu. Chữa nó là viết nốt chín bài, không phải rà lại 32 bài.

### Rác cú pháp: một phát hiện, đã sửa

`scripts/check-artefacts.ts` rà cả 58 bài ở cả hai ngôn ngữ, tìm backtick lạc, fence chưa đóng, `${...}` chưa nội suy, câu đứt giữa chừng.

Một phát hiện: `20-ngoi-sao-sang-nhat-bau-troi-dem` có một dòng chỉ chứa đúng một dấu `` ` `` ở cuối mục "Điều thú vị" — đuôi của một template literal rò vào cột `content`, và Markdown in nó ra màn hình. Toàn bài không có khối mã nào.

Đã gỡ qua `scripts/fix-stray-backtick.ts`, kèm `Revision` chụp bản trước trong cùng transaction. Không đụng `factCheck` và **không** đặt `lastVerifiedAt`: lượt này không đối chiếu câu nào với nguồn nào, đặt mốc ấy là nói dối rằng bài vừa được rà lại.

### Còn nợ sau lượt này

- **Danh sách 2–4 nguồn kèm DOI cho lô 9 bài không nguồn KHÔNG có trong repo.** Toàn repo chỉ ghi 20 DOI rải rác, và chúng gắn với các claim đã đính chính chứ không phải một danh sách đủ cho từng bài. Việc này **không còn là việc cơ học** — phải chạy lại bước 1 và bước 2 của pipeline cho từng bài.
- 32 bài PENDING vẫn chưa rà nội dung. Lượt này chỉ rà **cấu trúc**, không đọc claim nào.
- Chín bài trong cụm trên cần viết nốt phần cuối, không phải chỉ thêm một câu khép.

## 2026-09-11 (tiếp) — gốc rễ "cụt giữa chừng": một lỗ hổng trong đặc tả, không phải một lượt chạy bị cắt

Lịch cron của `content-pipeline.yml` vừa được bật lại, hai giờ một lượt. Nếu khuyết tật ở mục trên do lượt sinh bài bị cắt ngang thì nó sẽ tự tái diễn, nên phải biết gốc rễ trước khi bàn chuyện chữa chín bài cũ.

### Gốc rễ

`.claude/skills/article-generator/SKILL.md`, bước 4, liệt kê thứ tự các phần một bài phải có: định nghĩa một câu · các số liệu chính · các mục thân bài · khái niệm liên quan và tiên quyết · trích dẫn.

**Không có phần khép.** Đặc tả gọi tên mọi phần khác và bỏ sót đúng phần này.

Nên việc một bản nháp có khép lại hay không là chuyện may rủi, và kho phản ánh đúng như vậy: 37/58 bài có động tác khép, 21 bài không. Không phải một lượt chạy hỏng — là một lỗ hổng chạy suốt mọi lượt.

Điều này cũng giải thích vì sao tám bài **đã qua gate accuracy** nằm trong nhóm không khép: `science-editor` không có tiêu chí nào để bắt, vì đặc tả không đặt ra tiêu chí ấy.

### Hai chỗ đã bịt

**Quy tắc 10 của `article-generator`.** Phần khép thành bắt buộc, và nêu đủ năm động tác hợp lệ mà kho đang dùng để người viết sau không phải đoán. Kèm số đo, vì một quy tắc không có lý do thì lần sau sẽ bị gỡ.

**Cảnh báo trong `scripts/check-publish.ts`.** Kêu khi thiếu động tác khép **và** mục cuối dưới 70 từ.

CẢNH chứ không CHẶN, và đó là phán quyết chứ không phải sự thận trọng: phép đo nhận diện một **động tác hình thức**, mà một bài kết bằng câu tóm ý thật nhưng không mang dấu hiệu nào thì vẫn hoàn chỉnh — tám bài đã duyệt ở trên đúng là trường hợp đó. Chặn theo dấu hiệu hình thức là chặn nhầm tám bài hoàn chỉnh để bắt chín bài cụt.

### Ngưỡng 70 là số đo được

Xếp cả 21 bài không có động tác khép theo số từ của mục cuối thì chúng tách làm hai cụm, hở rõ ở giữa:

```
45 · 50 · 51 · 53 · 54 · 55 · 64 · 64 · 66     ← chín bài cụt
──────────────── khoảng hở ────────────────
76 · 85 · 93 · 100 · 124 · 126 · 128 · 143 · 146 · 154 · 156 · 207
```

Bài đầu tiên bên kia khoảng hở là `nang-luong-la-gi`, đã qua gate accuracy và kết bằng một câu tóm ý thật. Đặt ngưỡng ở 70 thì cảnh báo kêu **đúng chín bài** và im ở 49 bài còn lại — đã chạy `publish:check` để xác nhận.

Bản đầu đặt ngưỡng 60 theo cảm giác và bỏ sót ba bài nằm ở 64–66. **Bài học: ngưỡng phải đọc ra từ phân bố, không chọn cho tròn số.**

### Vì sao chín bài cũ vẫn chưa chữa

Trần độ dài 400 từ trong `check-publish.ts` đã chặn dạng cụt nặng nhất ở bài mới. Chín bài cũ thoát vì `lengthExempt` — chúng publish trước khi trần ấy được chốt. Chữa chúng là **viết nốt phần cuối**, tức đi lại bước 1–4 của pipeline cho từng bài, không phải thêm một câu khép. Chưa làm.

## 2026-09-12 — rà toàn bộ DOI: một trích dẫn chết, một DOI sai trong seed

Phát hiện tình cờ khi đi tìm nguồn cho bài Mặt Trăng: `prisma/seed-data/cosmos-spin.ts` ghi DOI `10.1038/35107009` cho nguồn "Long-term evolution of the spin of Venus". DOI ấy **resolve thật** — tới "Multisite phosphorylation of a CDK inhibitor sets a threshold for the onset of DNA replication", một bài sinh học tế bào trên Nature 2001.

Quy tắc 2 của skill `article-generator` gọi đây là failure mode tệ nhất. Nhưng cho tới lượt này **không có phép kiểm nào thi hành nó**: `isAlive()` trong `check-publish.ts` chỉ hỏi URL có trả 200 không, mà một DOI sai vẫn trả 200 — nó dẫn tới một bài báo có thật, chỉ là bài khác. Link bấm được, trang mở ra, tiêu đề không ai đối chiếu.

### `scripts/check-citations.ts`

Resolve từng DOI qua content negotiation của doi.org rồi so tiêu đề Crossref với tiêu đề đang lưu. So sau khi chuẩn hoá — bỏ dấu câu, hạ chữ thường, bỏ từ chức năng — cộng một phép so tập hợp từ, vì bản ghi Crossref dùng dấu câu khác người nhập và bài có phụ đề thì hai bên cắt ở chỗ khác nhau.

Script **không tự sửa**. Một DOI lệch có thể là DOI sai, mà cũng có thể là tiêu đề nhập tắt — hai chuyện khác nhau, và chọn giữa chúng là việc của người đọc cả hai.

### Kết quả trên 242 nguồn (62 có DOI)

| | |
|---|---|
| Khớp | 60 |
| Lệch tiêu đề | 1 |
| Không resolve | 1 |

**DOI chết — đã sửa.** `sao-choi-nguon-goc-cau-tao-va-so-phan` mang `10.1038/35007005` cho Jones, Balogh & Horbury, *Nature* 404, 574–576 (2000). DOI ấy trả **404**. DOI đúng là `10.1038/35007011`, đã đối chiếu tiêu đề, tác giả, tập, trang và năm. `10.1038/35007015` — chỉ khác hai chữ số — là bài KHÁC trong cùng số báo, của Gloeckler & Geiss. Nên đây là lỗi gõ trong một dãy DOI gần nhau, không phải nguồn bịa.

Sửa cả cột `doi` lẫn cột `url`: sửa một cột và bỏ cột kia là để lại đúng lỗi vừa sửa ở chỗ người đọc thật sự bấm vào. Script: `scripts/fix-dead-doi.ts`. **Không** ghi `Revision` — bảng ấy chụp `title` + `content`, mà lượt này không chạm thân bài; chụp một bản content không đổi là để lại một mục lịch sử rỗng nghĩa.

**Lệch tiêu đề — xét là đúng, đã miễn trừ.** `10.1093/mnras/4.17.152` lưu là "On the parallax of 61 Cygni", bản ghi thật là "II. A letter from Professor Bessel to Sir J. Herschel, Bart., dated Konigsberg, Oct. 23, 1838". Bessel công bố thị sai bằng một lá thư và MNRAS lưu nó dưới tiêu đề của lá thư; giới thiên văn vẫn dẫn công trình này bằng nội dung. DOI đúng tác giả, đúng năm.

Đưa vào danh sách miễn trừ **kèm lý do, khoá bằng DOI chứ không bằng slug** — đổi sang nguồn khác trên cùng bài thì miễn trừ không che cho nguồn mới. Lý do phải có: một phép kiểm lúc nào cũng kêu một mục đã biết thì người ta học cách bỏ qua cả phép kiểm.

### Seed cũng sai, và đó mới là chỗ nguy

Hàng trong CSDL vốn đã đúng (`10.1038/35081000`). Lỗi chỉ nằm trong seed file, tức nó **chưa bao giờ lên trang** nhưng **sẽ tiêm vào lần seed lại**. Đã sửa tại chỗ kèm ghi chú.

**Bài học:** một phép kiểm chỉ đo "link còn sống" không phải phép kiểm trích dẫn. Nó bắt được DOI 404 và mù hoàn toàn trước DOI trỏ nhầm bài — mà loại thứ hai mới là loại người đọc không thể tự phát hiện.

## 2026-09-13 — bài `mat-trang` đi hết 11 bước, và hai lỗi do chính gate gây ra

Bài Mặt Trăng là lỗ hổng lớn nhất còn lại của nhánh Hệ Mặt Trời: mười bài NHẮC
tới nó, không bài nào nói về nó. Nay đã PUBLISHED, `factCheck = PASSED`, 8
nguồn (2 bậc 1), 4 liên kết ra, 2 liên kết vào, 599 từ.

### Hai lỗi đáng nhớ, cả hai đều do khâu SỬA sinh ra chứ không phải khâu viết

**E1 — lượt rút gọn tự đẻ ra một claim sai.** Bản nháp 842 từ phải rút về trần
600. Câu gốc: "Ở đáy **vài** hố **gần cực** — nơi ánh nắng chưa bao giờ chạm
tới — vẫn còn băng nước cổ." Lượt rút xoá cùng lúc lượng từ *vài* và vị trí
*gần cực*, rồi để câu đứng ngay sau "bề mặt chi chít hố va chạm". Kết quả đọc
ra thành: hố nào tối cũng có băng. Nguồn không nói thế — s1 gắn băng với **vùng
cực**.

Đây là lần thứ HAI mẫu lỗi này xảy ra (lần đầu: `dien-tich-va-dong-dien`, rút
1.016 → 588 từ và tự sinh ra mệnh đề hai dây song song "HÚT NHAU"). Cùng một cơ
chế cả hai lần: **xoá định ngữ hạn định để tiết kiệm vài chữ.** Định ngữ là thứ
trông giống chữ đệm nhất và chịu lực nhiều nhất. Đã nâng thành quy tắc trong
`content-rules.md`, mục "Rút gọn là một lượt viết".

**E10 — câu sửa của editor làm bài tự đếm sai chính nó.** Vòng 1 cắt mệnh đề
"bóng của nó quét lên Trái Đất mỗi khi có nhật thực" vì không nguồn nào trong
bảng đỡ nó. Câu thay thế giữ được link nhưng bỏ mất *vai trò* — trong khi đoạn
ngay sau vẫn mở bằng "**Vai trò thứ ba** ít được nhắc hơn". Bài đếm ba, nêu
hai.

Điều đáng ghi: lỗi này do **chính gate accuracy** gây ra, không phải do lượt áp
sửa — câu R2 được chèn vào chính xác từng chữ. Và nó chỉ lộ ra khi đọc câu
TRONG NGỮ CẢNH hai câu kề, đúng cơ chế đã sinh ra E1. Sửa bằng R5, dựa trên
chính trang eclipse của NASA/GSFC: *"improved historic knowledge of the Moon's
orbit, enough to permit accurate analyses of solar eclipses"* → "còn nhật thực
thì **phụ thuộc vào quỹ đạo của nó**". Nói được mối liên hệ mà không phát biểu
mệnh đề cơ chế nào.

### Một phủ quyết bị rút lại vì tiền đề đã đổ

Bước 2 chặn con số "không có Mặt Trăng thì độ nghiêng trục biến thiên 0°–85°"
với lý do nó "chưa đọc được từ nguồn gốc", và xếp nó cùng họ với 10¹⁴ vi sinh
vật — loại con số sống sót nhờ được chép lại. Vòng 2, editor **tải được nguyên
văn abstract Laskar 1993** và đọc thấy đúng câu ấy.

Theo mục "kiểm chứng tiền đề trước khi thi hành một phủ quyết" (2026-09-02),
lệnh cấm không còn căn cứ cũ. Kết quả giữ nguyên — con số không vào bài — nhưng
nay **vì lý do biên tập**: đó là kết quả phản thực của một mô hình, Laskar tự
viết "might" và "potential", và bài không còn chỗ mang mệnh đề điều kiện.
`research/mat-trang.yaml` đã sửa: s6/s7 nay có `passages` nguyên văn, và ràng
buộc neo vào **tình trạng đọc được** chứ không ghim một giá trị chết.

Lợi ích kèm theo: s6 nói "generally believed", nên cụm "Giả thuyết được ủng hộ
nhiều nhất" nay có chỗ dựa bậc 1 ngoài NASA.

### Hai bài đã publish bị chạm, và chạm thế nào

`check-publish` CHẶN bài không có liên kết vào. Đã thêm từ hai bài:

| Bài | Câu | Đổi |
|---|---|---|
| `nhat-thuc-va-nguyet-thuc-…` | "Nhật thực xảy ra khi Mặt Trăng che khuất Mặt Trời." | bọc "Mặt Trăng" thành link |
| `dieu-gi-tao-ra-gio-thuy-trieu-…` | "…lực hấp dẫn của Mặt Trăng và Mặt Trời…" | bọc "Mặt Trăng" thành link |

**Không đổi một chữ nào** — chỉ bọc cụm từ đã nằm sẵn trong câu, ở cả VI lẫn
EN. Mỗi bài có một `Revision` chụp bản trước, ghi trong **cùng transaction**
với lệnh sửa. `lastVerifiedAt` **không** đụng tới: lượt này không đối chiếu câu
nào với nguồn nào, đặt mốc ấy là nói dối rằng bài vừa được rà lại.

Script: `scripts/link-to-mat-trang.ts`, có chạy khô và **dừng nếu câu cần tìm
khớp khác một lần** — khớp nhiều nghĩa là sắp sửa nhầm chỗ, khớp không lần nào
nghĩa là bài đã đổi từ lúc khảo sát.

### Còn nợ

`npm run search:reindex` chưa chạy được — `MEILISEARCH_HOST` không có trong
`.env` local (chỉ có trên Vercel). Kho rơi về Postgres FTS nên bài vẫn tìm được;
chạy lại khi có biến môi trường.

## 2026-09-13 — ba lỗi S1, và một trích dẫn BỊA lọt tới PUBLISHED

Lượt rà 32 bài PENDING chạy được 8 bài trước khi hết hạn mức. Cả 8 đều REVISE.
Ba phát hiện mức S1, **cả ba đều ở nội dung sức khoẻ** — lặp lại đúng mẫu của
lượt 2026-09-11. Lượt này chỉ đóng S1; S2/S3 còn nguyên.

### S1 — một nguồn không tồn tại, và vì sao không phép kiểm nào bắt được

`van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao` mang nguồn:

> "Exercise and cardiovascular health: mechanisms and clinical implications",
> Circulation Research, 2019, tier 2

**Bài báo ấy không tồn tại.** Bài tổng quan có thật và gần nhất của Circulation
Research về đúng chủ đề là Lavie, Arena, Swift et al., *Exercise and the
Cardiovascular System*, 2015, 117:207–219 — khác tiêu đề, khác năm.

Điều đáng ghi hơn cả bản thân lỗi là **vì sao nó sống sót**. Nguồn ấy không có
`url` và không có `doi`. `check-citations.ts` chỉ resolve những hàng CÓ doi;
`isAlive()` trong `check-publish.ts` chỉ gọi những hàng CÓ url. Một nguồn không
cung cấp định danh nào thì **đi lọt qua cả hai phép kiểm bằng cách không cung
cấp gì để kiểm**.

Đây là loại lỗ hổng tệ nhất: không phải phép kiểm chạy sai, mà phép kiểm KHÔNG
CHẠY — và im lặng khi không chạy. Nó cũng là lời nhắc rằng mục Pollack 1996
chưa nói hết: ở đó, citation hợp lệ gắn vào claim bịa; ở đây, chính citation là
thứ bịa.

**Đo toàn kho:** 250 nguồn, 63 có doi, 240 có url, **10 hàng không có cả hai**,
nằm ở 7 bài. Chín hàng còn lại đều là bài báo CÓ THẬT và nổi tiếng — Jinek 2012,
LIGO GW150914, Einstein 1905 — chỉ thiếu định danh.

**Đã bịt:** `check-publish.ts` nay CẢNH khi một nguồn không có url lẫn doi.
Chưa CHẶN, vì chặn ngay là kêu ở 7 bài mà lượt này chưa kịp sửa, và một gate
kêu ở chỗ không ai định sửa là gate người ta học cách bỏ qua. **Nâng lên CHẶN
khi 9 hàng còn lại đã có doi.**

Nguồn bịa đã gỡ, thay bằng ba nguồn bậc 1 có DOI, mỗi nguồn gắn vào đúng claim
nó chống lưng: Cornelissen & Smart 2013 (huyết áp), Mandsager 2018 (VO₂max và
tử vong), Lavie 2015 (thích nghi tim và nội mô). Bài nay có 4 nguồn, 3 có DOI,
3 bậc 1 — trước đó là 2 nguồn, 0 DOI.

### S1 — đặt vận động ngang hàng thuốc hạ áp, rồi im lặng

- Cũ: "…mức giảm khoảng 5–8 mmHg huyết áp tâm thu ở người tăng huyết áp —
  **tương đương một số thuốc đơn trị liệu**."
- Mới: con số theo đúng phân nhóm của nguồn — 8,3 mmHg (CI 6,0–10,7) ở người
  **đã tăng huyết áp**, 3,5 mmHg ở người huyết áp bình thường — và bỏ hẳn phép
  so với thuốc.
- Thêm **mục riêng có tiêu đề** "Vận động không thay thế thuốc đang dùng", đặt
  trước dòng miễn trừ y tế.
- Căn cứ: 10.1161/JAHA.112.004473, đọc toàn văn. Không chỗ nào trong nguồn đề
  xuất vận động thay cho thuốc.

**Vì sao là S1.** Con số đúng, phép so đúng, kết luận người đọc rút ra thì nguy
hiểm: với người đang uống thuốc hạ áp — đúng nhóm mà con số nói tới — câu ấy
đọc ra thành một lý do để bỏ thuốc. Ngừng thuốc hạ áp đột ngột có thể gây tăng
huyết áp bật lại. Cùng cấu trúc với lỗi S1 của `nhin-an-gian-doan`: bài không
nói gì sai, cái nó im lặng mới đổi được hành vi. Khác ở chỗ bài này còn **chủ
động gợi ra phép so**, nên sự im lặng nặng hơn.

Câu chống chỉ định cũ nằm làm dòng cuối mục "Khuyến nghị hiện hành", không có
tiêu đề riêng — đúng thứ phán quyết 2026-09-11 đã cấm: chống chỉ định y tế phải
gặp được khi LƯỚT.

### S1 — đầu ra thô của trợ lý AI nằm trong thân bài, ở cả hai ngôn ngữ

`he-vi-sinh-duong-ruot-…` mang một khối ~470 từ về nhịn ăn gián đoạn, dán thẳng
vào cột `content` và `contentEn`. Bằng chứng, không phải suy đoán:

- **Câu lệnh rò vào bài.** Khối mở đầu bằng chính câu hỏi đặt cho trợ lý, viết
  thường, không tiêu đề, kết bằng dấu chấm rồi dính liền câu trả lời:
  *"vì sao nhịn ăn gián đoạn (Intermittent Fasting) lại làm thay đổi quần thể
  vi khuẩn ruột.Nhịn ăn gián đoạn…"*
- **Định dạng bị huỷ ở bản tiếng Việt** nhưng còn nguyên ở bản tiếng Anh:
  `"các tác động cụ thể sau:1."`, `"nhịp sinh học của vi khuẩn2."`. Cùng một
  nội dung, một bản giữ được cấu trúc và một bản mất — dấu vết của thao tác
  DÁN, không phải của một lượt soạn bài.
- **Không một nguồn nào.** Ba nguồn của bài không nguồn nào chạm tới nhịn ăn
  gián đoạn, Akkermansia, MMC hay SIBO.
- **Sai ngược ở điểm then chốt.** Khối viết Firmicutes là "vi khuẩn hảo ngọt và
  cơ hội" cần bỏ đói. Nhưng phần lớn vi khuẩn sinh butyrate — *Faecalibacterium
  prausnitzii*, *Roseburia*, *Eubacterium* — **thuộc chính ngành Firmicutes**,
  và thân bài ở trên vừa gọi butyrate là SCFA quan trọng nhất. Khối này khuyên
  người đọc bỏ đói đúng nhóm vi khuẩn mà bài vừa khen.
- **Kê phác đồ không chống chỉ định**, trong khi bài riêng về đúng chủ đề đã
  được bổ sung mục chống chỉ định từ 2026-09-11. Một lỗi S1 đã đóng đang bị mở
  lại ở một URL khác.

**Xử: CẮT TOÀN BỘ, cả hai ngôn ngữ.** Không viết lại từng câu — theo quy tắc 8
(khi nghi ngờ thì cắt), và ở đây không có gì để cứu vì không một câu nào có
nguồn. Thay bằng đúng một câu trỏ sang bài riêng. Bài rút từ 5.525 xuống 3.530
ký tự (1.139 → 712 từ).

### Ghi chung

`factCheck` của cả hai bài **vẫn PENDING**, `lastVerifiedAt` **không** đặt:
lượt này chỉ đóng S1, mỗi bài còn 3–6 phát hiện S2/S3 chưa áp. Mỗi bài có một
`Revision` chụp bản trước, ghi trong cùng transaction với lệnh sửa. Script:
`scripts/fix-s1-2026-09-13.ts`, có chạy khô và dừng nếu bất kỳ neo nào khớp
khác đúng một lần.

**Còn nợ:** 24/32 bài chưa rà (hết hạn mức phiên giữa chừng); toàn bộ phát hiện
S2/S3 của 8 bài đã rà chưa áp; 9 nguồn vẫn thiếu định danh.

## 2026-09-17 — đính chính S1/S2 sau đợt thẩm định 42 bài PENDING

Thẩm định: `docs/content/checks/2026-09-17/`. Kế hoạch sửa ở `fixes/` cùng thư mục.
Script: `scripts/apply-fixes-2026-09-17.ts` — chạy khô trước, dừng cả lượt nếu một
neo khớp khác đúng một lần.

### dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat

- Niên đại: "diễn ra khoảng 252 triệu năm trước" → "khoảng 251,9 triệu năm trước; đợt tuyệt chủng biển bắt đầu ở 251,941 ± 0,037 triệu năm, ranh giới Permi–Trias ở 251,902 ± 0,024 triệu năm (2σ)" — căn cứ: Gastaldo và cộng sự 2020, Nature Communications, doi 10.1038/s41467-020-15243-7. Số cũ được gắn cho nguồn VACA, nơi thực tế ghi 250 triệu năm.
- Quy mô: "khoảng 80% số loài sinh vật biển biến mất" → "khoảng 81% theo Stanley (2016); ước tính 88–96% của Raup vẫn được trích dẫn rộng rãi và khác biệt này là bất đồng về phương pháp" — căn cứ: Stanley 2016, PNAS, doi 10.1073/pnas.1613094113. Số cũ không có nguồn; nguồn được gắn ghi 95%.
- Côn trùng: "lần duy nhất trong lịch sử mà côn trùng cũng chịu một cuộc tuyệt chủng hàng loạt" → "đợt tuyệt chủng côn trùng nặng nhất được ghi nhận (~82,6% số chi), không phải đợt duy nhất; còn có các đỉnh Roadian–Wordian 64,5% và Ladinian–Carnian 74,8%" — căn cứ: Jouault và cộng sự 2022, Nature Communications, doi 10.1038/s41467-022-35284-4.
- So sánh quy mô: "Không có sự kiện nào khác trong 540 triệu năm qua tiến gần được tới mức đó" → "Burgess, Bowring và Shen (2014) mô tả đây là tổn thất sinh giới biển và trên cạn nặng nề nhất trong 542 triệu năm qua" — căn cứ: doi 10.1073/pnas.1317692111.
- Nguồn: gỡ "Đại tuyệt chủng Permi, vụ thảm sát đẫm máu nhất lịch sử" (VACA, 2012) khỏi danh sách nguồn đỡ — nguồn mâu thuẫn với số liệu bài và bị gắn sai tier 2 (tối đa là bậc 4, tài liệu bối cảnh); thay bằng bốn nguồn peer-review bậc 1.
- **Còn nợ:** Dòng ghi công cuối bài "Biên tập lại từ bài ... của Đặng Vũ Tuấn Sơn ... Bản quyền nội dung gốc thuộc về VACA" — sau lượt này gần như mọi con số chính của bài đã thay bằng nguồn peer-review và không còn trùng với bài gốc. Tôi KHÔNG tự xoá dòng này. Cần người quyết: (a) dòng ghi công còn đúng sự thật không, (b) có giấy phép tái sử dụng/phái sinh không, (c) nếu giữ thì diễn đạt lại thế nào cho không gây hiểu nhầm rằng số liệu đến từ VACA.
- **Còn nợ:** Trường Summary của bài vẫn ghi "252 triệu năm trước, khoảng 80% số loài sinh vật biển biến mất" — đúng hai con số vừa được đính chính trong thân bài. Summary nằm ngoài phần `## NỘI DUNG` nên không sửa được bằng find/replace lượt này. Phải áp cùng bản sửa vào trường summary, nếu không bài sẽ tự mâu thuẫn ngay trên trang.
- **Còn nợ:** Sau khi gỡ VACA, các con số sau KHÔNG còn bất kỳ nguồn nào: "1–4 triệu km³" dung nham (nguồn cũ ghi 1,5 triệu km³), "vài km³" cho phun trào hiện đại, "8–10 °C" ấm lên, "70% loài động vật có xương sống trên cạn", "khoảng 10 triệu năm hồi phục", "270 triệu năm" bọ ba thuỳ, "165 triệu năm" khủng long. Đều là S3/S4 nên ngoài phạm vi lượt này, nhưng bài đang PUBLISHED với các con số trần — cần lô sau xử lý sớm, hoặc cắt.
- **Còn nợ:** Mục "Một giả thuyết đã không đứng vững" (fullerene) hiện không có nguồn nào và trái với nguồn VACA đang bị gỡ (trang đó coi giả thuyết này "khá thuyết phục"). Cần mở Becker 2001 và Farley 2005, và mở kiểm bài 2019 "Enhanced flux of extraterrestrial 3He across the Permian–Triassic boundary" TRƯỚC khi giữ câu "không lặp lại được" — lô S3.
- **Còn nợ:** Burgess, Bowring & Shen 2014: lượt này chỉ mở được bản ghi Crossref (trang PNAS trả 403). URL nguồn đang để tạm là endpoint Crossref. Cần đổi sang URL trang bài khi có người mở được.

### he-mien-dich-nhan-dien-mot-virus-bang-cach-nao

- Gỡ nguồn "Immune memory: understanding long-term protection" (ghi là Nature Reviews Immunology, 2021) — citation không tồn tại, do khâu soạn bài bịa ra; bài từng dựa vào nó cho phần trí nhớ miễn dịch. Căn cứ: Crossref và hai lượt tìm web ngày 2026-09-17 không ra bài nào mang tên đó trên tạp chí đó giai đoạn 2020–2022.
- Claim "tế bào B và T nhớ vẫn tồn tại — có thể hàng chục năm" CŨ: không còn nguồn nào đỡ sau khi gỡ citation bịa → MỚI: giữ nguyên mức dè dặt "có thể hàng chục năm", bổ sung số đo cụ thể (tế bào B nhớ trên 50 năm; đáp ứng T có chu kỳ bán rã 8–15 năm) và nói rõ đây là số đo ở vaccine đậu mùa, không mặc nhiên đúng cho mọi mầm bệnh. Căn cứ: Crotty et al. 2003, J Immunol, doi:10.4049/jimmunol.171.10.4969; Hammarlund et al. 2003, Nature Medicine, doi:10.1038/nm917.
- Hàng nguồn "Janeway's Immunobiology, 10th edition" CŨ: không url/DOI/ISBN, không claim nào truy về được → MỚI: kèm ISBN 9780393884890 và URL nhà xuất bản wwnorton.com/books/9780393884890. Căn cứ: trang W. W. Norton và bản ghi Open Library mở ngày 2026-09-17 (Norton, 01/07/2022, 960 trang).
- **Còn nợ:** Trang Norton mở được xác nhận đúng tên sách, ba tác giả và nhà xuất bản; Open Library xác nhận Norton 2022 — nhưng không trang nào mở được in rõ chuỗi "tenth edition". Số hiệu bản 10 hiện chỉ dựa vào danh mục bán sách. Nếu cần chắc, người biên tập cầm sách giấy xác nhận lại trang bìa lót.
- **Còn nợ:** Vẫn chưa có số chương/trang Janeway cho từng claim (C-3, C-4, C-6, C-7), nên các claim cơ chế vẫn chưa truy về được một chỗ cụ thể. Thuộc diện S3, để lô sau.
- **Còn nợ:** Ba nguồn mới đều đo trên vaccine đậu mùa hoặc trên kháng thể huyết thanh, không phải trên mọi loại nhiễm virus. Câu khái quát về trí nhớ kéo dài hàng chục năm vì thế chỉ nên giữ ở mức "có thể"; muốn khẳng định rộng hơn cần một tổng quan hệ thống về độ bền trí nhớ miễn dịch theo từng mầm bệnh — chưa mở được trong lượt này.
- **Còn nợ:** Bài vẫn đang PUBLISHED. Lượt này chỉ vá S1; các mốc 5–10 ngày, 1–3 ngày, 10¹¹ và đoạn cơ chế vaccine (lĩnh vực nhạy cảm, cần CDC/WHO/NIH) vẫn chưa có nguồn — cần quyết định có gắn nhãn đính chính hiển thị trên trang trong lúc chờ lô S3 hay không.

### nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao

- C-2: "Giống như con người, vi khuẩn đường ruột cũng có nhịp sinh học riêng ... giai đoạn nhịn ăn tạo ra các khoảng nghỉ rõ ràng, giúp thiết lập lại chu kỳ hoạt động tự nhiên của hệ vi sinh" → "Hệ vi sinh dao động theo ngày và chịu ảnh hưởng của nhịp ăn của vật chủ; phá vỡ nhịp ăn gây loạn khuẩn. Không có bằng chứng nhịn ăn gián đoạn thiết lập lại chu kỳ hệ vi sinh ở người." → căn cứ: Thaiss và cộng sự 2014, Cell, doi 10.1016/j.cell.2014.09.048.
- C-4: "Trong thời gian nhịn ăn kéo dài, một số nhóm vi khuẩn ... sẽ phát triển mạnh hơn" (Akkermansia muciniphila nêu như quy luật) → "Đây là giả thuyết; tổng quan hệ thống 2024 trên 8 nghiên cứu ở người chỉ thấy A. muciniphila tăng ở một nghiên cứu, kết quả không đồng nhất, và thay đổi nhất quán hơn cả là tăng Proteobacteria — dấu hiệu loạn khuẩn" → căn cứ: Paukkonen và cộng sự 2024, Frontiers in Nutrition, doi 10.3389/fnut.2024.1342787.
- C-12 (Summary): "Khi thời gian ăn và nhịn được tách biệt rõ ràng, thành phần và hoạt động của hệ vi sinh đường ruột cũng thay đổi theo" → "Bằng chứng ở người còn ít và không nhất quán; tổng quan hệ thống 2024 trên 8 nghiên cứu chỉ kết luận ở mức có thể IF làm tăng độ phong phú và đa dạng" → căn cứ: Paukkonen và cộng sự 2024, doi 10.3389/fnut.2024.1342787; Thaiss và cộng sự 2014, doi 10.1016/j.cell.2014.09.048.
- **Còn nợ:** Lượt này chỉ xử lý S1–S2. Bài vẫn còn các lỗi S3 chưa sửa, trong đó có claim sức khỏe đáng lo: C-5 "giảm nguy cơ béo phì và hội chứng chuyển hóa" (claim về nguy cơ ở quần thể, không nguồn, nằm ngay dưới đoạn Akkermansia vừa sửa) và C-11 "các hướng dẫn hiện hành khuyến cáo" mà không nêu cơ quan nào, năm nào. Đề nghị xếp hai mục này lên đầu lô S3, hoặc cho phép cắt sớm.
- **Còn nợ:** Mục chống chỉ định (C-11) cần một người có chuyên môn y khoa duyệt sau khi gắn hướng dẫn cụ thể. Science-editor kiểm được nguồn nhưng không thay được phán quyết lâm sàng.
- **Còn nợ:** C-7 (MMC): chưa mở được toàn văn/tóm tắt Deloose và cộng sự 2012 trong lượt này, nên không sửa. Khi sửa phải nói rõ MMC diễn ra lúc đói giữa mọi bữa ăn, không phải tác dụng riêng của nhịn ăn gián đoạn.
- **Còn nợ:** Bài sức khỏe đang PUBLISHED với 0 nguồn gốc; hai nguồn thêm ở đây chỉ đỡ hai claim vừa sửa. Cần người quyết: gắn nhãn đính chính công khai, hay gỡ xuống tới khi viết lại.

### ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai

- C-7: "Các vi sinh vật này sản xuất nhiều chất hóa học ... ảnh hưởng đến: cảm giác thèm ăn, trao đổi chất, tâm trạng, sức khỏe tổng thể" → tách rõ "trên gặm nhấm: thay đổi sinh lý não và hành vi" / "ở người: mới là tương quan, không nhất quán, nhân quả chưa xác lập" → căn cứ: Ou và cộng sự 2023, Microbiome Research Reports, doi 10.20517/mrr.2023.33.
- C-8: "Vi khuẩn đường ruột có thể tạo ra các chất hóa học ảnh hưởng đến hoạt động của dây thần kinh phế vị, từ đó tác động tới các trung tâm kiểm soát cảm giác đói và no" (kèm danh sách ghrelin/leptin/PYY/GLP-1) → cắt danh sách hormone không nguồn; nêu chuỗi này chưa được chứng minh ở người, bằng chứng liên lạc vi sinh–não qua phế vị đến từ nghiên cứu trên động vật; bổ sung tỉ lệ 80–90% sợi hướng tâm → căn cứ: Breit và cộng sự 2018, doi 10.3389/fpsyt.2018.00044; Ou và cộng sự 2023, doi 10.20517/mrr.2023.33.
- C-10: "Chính mối liên hệ này khiến sức khỏe đường ruột có ảnh hưởng đáng kể đến tiêu hóa, cảm giác thèm ăn, tâm trạng và sức khỏe tổng thể của con người" → "Ruột có hệ thần kinh riêng và liên lạc hai chiều với não; vai trò của vi khuẩn đường ruột với tâm trạng và thèm ăn ở người vẫn đang được nghiên cứu, bằng chứng cơ chế chủ yếu từ động vật" → căn cứ: Ou và cộng sự 2023, doi 10.20517/mrr.2023.33.
- **Còn nợ:** Lượt này chỉ xử lý S1–S2. Các lỗi S3/S4 vẫn còn trên bài đã xuất bản: C-1 (con số 400–600 triệu nơron chưa gắn nguồn), C-2 ("90–95% serotonin" — nguồn chỉ đỡ "hơn 90%"), C-3 (serotonin ruột không qua hàng rào máu–não — chưa mở được nguồn bậc 1–2), C-5 (ENS hoạt động độc lập), C-6 (căng thẳng → triệu chứng tiêu hóa), C-9 (mục "lập trình lại hệ vi sinh"). Cần lô sau.
- **Còn nợ:** Mục "Có thể lập trình lại hệ vi sinh đường ruột không?" vẫn nói thay đổi ăn uống "có thể ảnh hưởng đến cảm giác thèm ăn" — cùng loại lỗi nhân quả với C-7/C-10 nhưng được chấm S3 nên không sửa lượt này. Đề nghị nâng lên hàng đầu của lô S3, vì để nguyên thì bài vẫn còn một câu dạng hành động cho người đọc mà không có nguồn.
- **Còn nợ:** Bài vẫn đang PUBLISHED với 0 nguồn gốc. Hai nguồn thêm ở đây chỉ đỡ các claim vừa sửa, không đỡ toàn bài — cần người quyết có gắn nhãn đính chính công khai trên trang trong lúc chờ viết lại hay không (quy tắc 9: không sửa lặng lẽ).
- **Còn nợ:** Chồng lấn nội dung với bài "he-vi-sinh-duong-ruot-..." và "nhin-an-gian-doan-..." chưa được giải quyết; thuộc thẩm quyền knowledge-architect.

### su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian

- Niên đại Trái Đất: "Các mẫu vật cổ nhất — thiên thạch và tinh thể zircon ở Tây Australia có tuổi tới 4,4 tỉ năm — cho phép xác định niên đại này khá chắc chắn" → "Niên đại 4,54 tỉ năm đến từ đo phóng xạ trên thiên thạch, sai số dưới 1%; zircon Tây Australia tới 4,3 tỉ năm chỉ cho tuổi tối thiểu của lớp vỏ" — căn cứ: USGS, Age of the Earth. Nguồn cũ (VACA) ghi 4,7 tỉ năm.
- Sự kiện oxy hoá lớn: mốc "khoảng 2,4 tỉ năm" không nguồn → bổ sung "oxy khí quyển bắt đầu tăng khoảng 2,45 tỉ năm trước hoặc sớm hơn, GOE là giai đoạn chuyển tiếp kéo dài chừng 300 triệu năm" — căn cứ: Philippot và cộng sự 2018, Nature Communications, doi 10.1038/s41467-018-04621-x.
- Đại tuyệt chủng Permi: "252 triệu năm trước ... khoảng 80% loài sinh vật biển" → "khoảng 251,9 triệu năm trước (bắt đầu 251,941 ± 0,037 triệu năm) ... khoảng 81% theo Stanley (2016), trong khi các ước tính cũ đặt ở 88–96% — bất đồng về phương pháp" — căn cứ: doi 10.1073/pnas.1613094113 và doi 10.1038/s41467-020-15243-7. Nguồn cũ (VACA) ghi 248 triệu năm và 95%.
- Dấu chân Laetoli: "là bằng chứng trực tiếp sớm nhất về dáng đi hai chân, thuộc về chi Australopithecus" → "là những dấu chân người cổ sớm nhất được biết trên thế giới, được quy cho Australopithecus afarensis; bằng chứng đi hai chân từ xương có thể còn cổ hơn" — căn cứ: Masao và cộng sự 2016, eLife, doi 10.7554/eLife.19568.
- Nguồn: gỡ "Hình thành và tiến hóa của sự sống trên Trái Đất" (VACA, 2011) khỏi danh sách nguồn đỡ — nguồn mâu thuẫn với gần như mọi mốc trong bài và bị gắn sai tier 2 (tối đa là bậc 4); thay bằng bảy nguồn bậc 1–3.
- **Còn nợ:** Dòng ghi công cuối bài "Biên tập lại từ bài ... của Đặng Vũ Tuấn Sơn ... Bản quyền nội dung gốc thuộc về VACA" — gần như mọi mốc thời gian trong bài đã khác bài gốc và nay dựa trên nguồn peer-review. Tôi KHÔNG tự xoá dòng này. Cần người quyết: dòng ghi công còn đúng sự thật không, có giấy phép phái sinh không, và nếu giữ thì diễn đạt lại ra sao để không ngụ ý số liệu đến từ VACA.
- **Còn nợ:** Sau khi gỡ VACA, các mốc sau KHÔNG còn nguồn nào: va chạm Theia "khoảng 4,5 tỉ năm" và "ngày dài vài giờ"; vi hoá thạch "3,5 tỉ năm được chấp nhận rộng rãi"; quả cầu tuyết "720–635 triệu năm"; bùng nổ Cambri "538 triệu năm" và "20–25 triệu năm"; thực vật lên cạn "470 triệu năm"; tetrapod "375–360 triệu năm"; Chicxulub "66 triệu năm" và "đường kính khoảng 10 km"; linh trưởng "55 triệu năm"; nông nghiệp "12.000 năm"; lịch sử thành văn "5.000 năm". Tất cả là S3/S4 nên ngoài phạm vi lượt này, nhưng bài đang PUBLISHED với các con số trần — lô sau phải xử lý.
- **Còn nợ:** Lượt này không trích được số từ bảng niên đại ICS (stratigraphy.org trả về PDF chỉ đọc được metadata), nên mốc Cryogen 720–635 triệu năm và ranh giới Creta–Paleogene 66 triệu năm chưa gắn được nguồn bậc 1–2. Cần một bản ICS trích được chữ, hoặc nguồn peer-review thay thế.
- **Còn nợ:** Câu "là loài người đầu tiên rời châu Phi" (H. erectus) khẳng định chắc hơn nguồn Smithsonian vừa gắn ("generally considered to have been the first species to have expanded beyond Africa"). Đây là nâng mức tự tin so với nguồn — đã đánh S4 trong bản thẩm định nên tôi không sửa lượt này, nhưng nên đưa lên đầu lô S3: theo chuẩn biên tập, nâng mức tự tin là lỗi mức từ chối.
- **Còn nợ:** Bảng "nén 4,54 tỉ năm thành một năm" có dòng "Tế bào đầu tiên — cuối tháng 2" ứng với ~3,8 tỉ năm, lệch với thân bài (hoá thạch 3,5 tỉ năm → khoảng 25/3). Tính toán nội tại, S4, ngoài phạm vi lượt này nhưng cần tính lại sau khi chốt mốc có nguồn.

### Ghi chung

`factCheck` giữ nguyên REVISE/FAILED: lượt này chỉ đóng S1/S2, mỗi bài còn nhiều
phát hiện S3/S4 và vẫn dưới ngưỡng ba nguồn bậc 1–2. Mỗi bài có một `Revision`
chụp bản trước, ghi trong cùng transaction với lệnh sửa.
