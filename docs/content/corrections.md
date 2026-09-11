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
