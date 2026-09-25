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

## Đợt 2026-09-22 — hai câu science-editor phủ quyết từ 17/09

Cả hai lộ ra khi `link-glossary.ts` định gắn `[[...]]` vào chúng. Editor chặn
với cùng một lý do: đặt tooltip vào một câu sai là chống lưng cho câu ấy. Hai
ghi chú `KHÔNG gắn` trong `link-glossary.ts` ghi "gắn lại sau khi bài được
sửa" — đây là lượt sửa ấy.

### ho-den-noi-hinh-hoc-cua-khong-gian-sup-do

- Hình thành hố đen sao: "lõi một ngôi sao nặng sụp đổ **sau** siêu tân tinh"
  → "lõi sụp đổ **trước**; cú sụp đổ giải phóng neutrino, và chính neutrino
  truyền năng lượng cho các lớp ngoài, đẩy chúng nổ tung thành siêu tân tinh"
  — căn cứ: OpenStax *Astronomy 2e* §23.2, thêm vào bảng nguồn (bậc 3).
  Bản cũ đảo nhân quả. Bản sửa giữ đúng một chỗ dè dặt của nguồn: sóng xung
  kích của cú sụp đổ **một mình** không đủ gây nổ.

### 20-ngoi-sao-sang-nhat-bau-troi-dem

- Vega: "Sao Bắc Cực khoảng **12.000 năm trước**" → "khoảng **14.000 năm
  trước**, và sẽ trở lại sau chừng **12.000 năm nữa**" — căn cứ: NASA,
  *Summer Triangle Corner: Vega*, thêm vào bảng nguồn (bậc 2).
  Bản cũ trộn hai con số của hai chiều thời gian: NASA nói 14.000 năm TRƯỚC
  và 12.000 năm NỮA, bài lấy số của tương lai gắn vào quá khứ. Trục Trái Đất
  đảo một vòng ~26.000 năm, nên hai số ấy là hai đầu của cùng một chu kỳ.

### Ghi chung

`factCheck` giữ nguyên `REVISE` ở cả hai bài: sửa chuỗi không phải là qua
gate. Mỗi bài có một `Revision` chụp bản trước, ghi trong cùng transaction
với lệnh sửa nội dung và lệnh thêm nguồn — không có trạng thái trung gian nào
mà claim đã đổi còn nguồn thì chưa. `lastVerifiedAt` đặt 2026-09-22.

- **Còn nợ:** hai bài vẫn dưới ngưỡng ba nguồn bậc 1–2 (`ho-den` có 3 nguồn
  nhưng một là bậc 3; `20-ngoi-sao` có 2, một là bậc 4). Nguồn thêm ở đây chỉ
  đỡ đúng claim vừa sửa.
- **Còn nợ:** dải "5–100 khối lượng Mặt Trời" cho hố đen sao vẫn chưa có
  nguồn nào đỡ. Ngoài phạm vi lượt này vì không phải câu bị phủ quyết, nhưng
  nó nằm ngay trong câu vừa sửa nên dễ bị tưởng là đã được kiểm.
- **Còn nợ:** hai chỗ `[[...]]` mà editor chặn nay đã hết lý do chặn, nhưng
  gắn lại là việc của lượt duyệt sau — `factCheck` vẫn REVISE, và quy tắc nói
  rõ sửa chuỗi xong không có nghĩa là qua gate.

## 2026-09-25 — duyệt lại bài factCheck = FAILED

Thẩm định: `docs/content/checks/2026-09-25/`, kế hoạch sửa ở `fixes/` cùng thư mục.
Script: `scripts/apply-review-2026-09-25.ts`. Sửa cả bản vi lẫn en; bản trước
sửa của cả hai được chụp vào `Revision` trong cùng transaction.

### dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat — PASSED

- Bản tiếng Anh (contentEn, summaryEn) chưa từng nhận bốn đính chính S1/S2 ngày 17/09: vẫn ghi "252 million years", "80% of marine species", "the only time ... insects", "No other event in the past 540 million years" → nay mang cùng claim và cùng nguồn với bản vi (Gastaldo 2020, Stanley 2016, Jouault 2022, Burgess 2014).
- Mở bài: "nó suýt xoá sạch sự sống phức tạp khỏi hành tinh này" → "sự sống chưa từng tiến gần tới chỗ biến mất hẳn" — căn cứ: Stanley 2016, PNAS, doi 10.1073/pnas.1613094113 ("Life did not nearly disappear at the end of the Permian, as has often been claimed"). Tiêu đề đề xuất đổi theo (xem titleEdits).
- Động vật trên cạn: "khoảng 70% số loài động vật có xương sống trên cạn" (không nguồn) → "khoảng 75% số loài trên cạn, theo con số Burgess và Bowring (2015) dẫn" — căn cứ: doi 10.1126/sciadv.1500470.
- Hồi phục: "khoảng 10 triệu năm mới hồi phục về mức đa dạng cũ" → "cúc đá đa dạng hoá lại trong 1–3 triệu năm; hệ sinh thái ổn định, phức tạp xuất hiện lại sau khoảng 8–9 triệu năm" — căn cứ: Chen & Benton 2012, Nature Geoscience, doi 10.1038/ngeo1475.
- Siberian Traps: "phun trào trong khoảng vài trăm nghìn năm, trùng với ranh giới ở độ chính xác vài chục nghìn năm" → "hai phần ba dung nham trong ~300 nghìn năm trước và trong lúc tuyệt chủng, phần còn lại thêm ít nhất 500 nghìn năm; tuyệt chủng biển kéo dài 60 ± 48 nghìn năm"; thêm vế "mối liên hệ nhân quả vẫn còn được tranh luận" — căn cứ: doi 10.1126/sciadv.1500470, doi 10.1073/pnas.1317692111, doi 10.1186/s40645-019-0267-0.
- Thể tích: "lượng dung nham ước tính khoảng 1–4 triệu km³; phun trào lịch sử hiếm khi vượt vài km³" → "tổng thể tích magma (khoảng một nửa là xâm nhập ngầm) ước tính 1 đến hơn 10 triệu km³, phần đông ước tính 2–5 triệu km³"; bỏ câu so sánh — căn cứ: Burgess & Bowring 2015, doi 10.1126/sciadv.1500470.
- Nóng lên: "đồng vị oxy cho thấy nước biển nhiệt đới ấm lên khoảng 8–10 °C" (không nguồn mở được) → "mô hình Cui và cộng sự 2021: ~36.000 Gt C, CO₂ tăng ~13 lần, nhiệt độ toàn cầu tăng hơn 10 °C, phù hợp số đo đồng vị oxy vỏ tay cuộn" — căn cứ: doi 10.1073/pnas.2014701118.
- Axit hoá: "phá huỷ khả năng tạo vỏ của san hô, tay cuộn..." → "pH ổn định ở pha tuyệt chủng thứ nhất, tụt đột ngột ở pha thứ hai; sinh vật vôi hoá dày bị mất nhiều hơn" — căn cứ: Clarkson et al. 2015, Science, doi 10.1126/science.aaa0193.
- Thiếu oxy: bỏ "tuần hoàn đại dương chậm lại" (không nguồn); thêm "nóng lên + mất oxy giải thích hơn một nửa mức tuyệt chủng biển" và euxinia ở Tây Australia/Nam Trung Quốc — căn cứ: Penn et al. 2018, doi 10.1126/science.aat1327; Grice et al. 2005, doi 10.1126/science.1104323.
- Than/ozone: "Đốt cháy than ... giải phóng khí halogen phá huỷ tầng ozone" → "sill nung nóng đá trầm tích bồn Tunguska, nhiều khả năng giải phóng thêm khí nhà kính; 53–77% CO₂ vẫn là núi lửa, phần nhỏ từ than/methane"; bỏ vế ozone (không nguồn, Dal Corso 2024 trái chiều) — căn cứ: doi 10.1038/s41467-017-00083-9, doi 10.1073/pnas.2014701118, doi 10.1038/s41467-024-51671-5.
- Cắt câu "Bốn cơ chế này nối tiếp nhau, và đó là lý do cuộc tuyệt chủng kéo dài chứ không tức thời" — quan hệ nhân quả không nguồn, trái với khoảng 60 ± 48 nghìn năm (doi 10.1073/pnas.1317692111).
- Fullerene: "chứa heli-3 và argon-36 ... nhắc lại rộng rãi suốt hơn một thập niên" → "heli và argon với tỉ lệ đồng vị giống chondrite carbon (Becker 2001)" — căn cứ: doi 10.1126/science.1057243.
- Không lặp lại được: "Nhiều phòng thí nghiệm độc lập ... không tìm thấy tín hiệu tương tự; không có lớp iridium toàn cầu, không thạch anh sốc, không hố va chạm" → "Farley và cộng sự phân tích lại chính mẫu Meishan và mẫu Canada, không thấy ³He ngoài Trái Đất; Bedout bị chất vấn trên Science 2004; iridium thấp ở Nam Trung Quốc (1986); năm 2019 một nhóm Nhật thấy ³He bụi liên hành tinh tăng, không diễn giải là va chạm" — căn cứ: doi 10.1126/science.293.5539.2343a, 10.1016/j.epsl.2005.09.054, 10.1126/science.1093925, 10.1126/science.233.4767.984, 10.1186/s40645-019-0267-0.
- Cắt cả mục "Pangaea đóng vai trò gì" — không nguồn nào đỡ, câu kết là khái quát tự dựng.
- Hệ quả: bỏ "therapsid đang trên đường tiến hoá thành động vật có vú", "khủng long thống trị 165 triệu năm" (không nguồn) và "tổ tiên động vật có vú chờ tới lượt sau vụ tuyệt chủng kế tiếp" (sai: vụ kế tiếp là cuối Trias, động vật có vú lên ngôi sau Creta–Paleogene); giữ bọ ba thuỳ 270 triệu năm và thêm archosauromorph lên ngôi — căn cứ: Kraft et al. 2023, doi 10.1038/s41586-023-06567-7; Ezcurra & Butler 2018, doi 10.1098/rspb.2018.0361.
- Lời kết: "là điều loài người đang làm, chỉ nhanh hơn nhiều bậc" → "tốc độ tối đa ~4,5 Gt C/năm, theo chính nhóm tác giả cỡ một nửa tốc độ phát thải carbon hiện nay" — căn cứ: Cui et al. 2021, doi 10.1073/pnas.2014701118.
- Summary vi/en: "Thủ phạm không phải một thiên thạch" → "Thủ phạm được nhiều nhà khoa học ủng hộ nhất không phải một thiên thạch"; summaryEn đổi 252/80% theo bản vi.
- Ghi công cuối bài: giữ nguyên dòng ghi công và bản quyền VACA, thêm câu nói số liệu đã được đối chiếu lại theo nguồn bình duyệt nên nhiều chỗ khác bài gốc.
- Nguồn: thêm 17 nguồn bình duyệt bậc 1 (danh sách trong docs/content/checks/2026-09-25/fixes/dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat.json); bảng nguồn từ 4 lên 21.
- **Còn nợ:** titleEdits (title, titleEn, seoTitle, seoDescription) nằm ngoài schema mà apply-fixes-2026-09-17.ts đọc. Verdict 'pass' giả định bốn trường này được áp; không áp thì tiêu đề vẫn khẳng định điều mà nguồn của bài (Stanley 2016) bác, và SEO description vẫn ghi 252 triệu năm / 80% — khi đó phải coi là 'revise'.
- **Còn nợ:** Slug 'dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat' mang đúng cụm 'suýt biến mất' vừa bị đổi ở tiêu đề. Đổi slug cần 301 (npm run slugs:redirect + redirects:sync + deploy) và sửa các link nội bộ trỏ tới nó — việc của seo-expert/backend; không chặn gate accuracy vì slug không phải claim hiển thị như một khẳng định.
- **Còn nợ:** Burgess, Bowring & Shen 2014: URL trong bảng nguồn vẫn là endpoint Crossref. Bản toàn văn công khai có ở https://pmc.ncbi.nlm.nih.gov/articles/PMC3948271/ (đã mở lượt này qua Europe PMC) — đề nghị đổi URL; schema fixes không có trường sửa URL nên không đưa vào edits.
- **Còn nợ:** Quyền sử dụng bài gốc VACA vẫn chưa ai quyết (mở từ 17/09). Lượt này chỉ thêm câu nói đúng nguồn gốc số liệu, không xoá ghi công và không đụng dòng bản quyền.
- **Còn nợ:** Mục 'Đọc thêm' bản en thiếu link thứ tư (bài về hành trình Hệ Mặt Trời trong Ngân Hà) so với bản vi — không phải claim khoa học, để content-curator/translation bù.
- **Còn nợ:** S4 để nguyên: câu mở bài ghi '66 triệu năm trước' cho Chicxulub, trong khi Schulte 2010 (nguồn mở được lượt này) ghi 'approximately 65.5 million years ago'; giá trị 66,0 của bảng ICS hiện hành chưa trích được chữ trong lượt này. Chênh lệch nằm trong mức làm tròn của 'khoảng'.

### he-mien-dich-nhan-dien-mot-virus-bang-cach-nao — PASSED

- Thẩm định lại 2026-09-25 (science-editor): bản tiếng Anh chưa từng nhận bản sửa S1 ngày 17/09 — câu 'memory B and T cells persists—potentially for decades' vẫn không nguồn. CŨ: en thiếu số đo đậu mùa → MỚI: en mang đúng claim như vi. Căn cứ: Crotty 2003 doi 10.4049/jimmunol.171.10.4969; Hammarlund 2003 doi 10.1038/nm917.
- Đa dạng thụ thể: 'tái tổ hợp V(D)J sinh ra khoảng 10¹¹ biến thể — đủ để với gần như mọi phân tử lạ tồn tại sẵn một tế bào khớp' → 'kho kháng thể nguyên sơ ít nhất 10¹², ước tính tới 10¹⁶–10¹⁸; tế bào B lưu hành chỉ mang một phần nhỏ; về nguyên tắc có thể đáp ứng với bất kỳ phân tử lạ nào'. Căn cứ: Briney và cộng sự 2019, Nature, doi 10.1038/s41586-019-0879-y.
- RNA sợi đôi: 'hầu như chỉ xuất hiện khi virus đang nhân lên' → 'được tạo ra khi phần lớn nhóm virus nhân lên; không phát hiện được ở các virus RNA sợi âm được khảo sát'. Căn cứ: Weber và cộng sự 2006, J Virol, doi 10.1128/JVI.80.10.5059-5064.2006.
- Mốc thời gian: bỏ '5–10 ngày' (lần đầu) và '1–3 ngày' (lần sau) — không có nguồn → 'độ trễ từ vài giờ tới vài ngày' và 'nhanh hơn, hiệu quả hơn lần đầu'. Căn cứ: Marshall và cộng sự 2018, doi 10.1186/s13223-018-0278-1.
- Cơ chế vaccine: 'đưa vào một phần mầm bệnh không gây bệnh (protein, virus bất hoạt, mRNA)' → 'bắt chước nhiễm trùng; có thể là mầm bệnh sống giảm độc lực, bất hoạt, hoặc protein/carbohydrate đặc hiệu; vaccine mRNA đưa chỉ dẫn để tế bào tự tạo protein; miễn dịch có thể mất vài tuần'. Căn cứ: CDC 'Explaining How Vaccines Work'; Marshall 2018; Pardi 2018 doi 10.1038/nrd.2017.243.
- Cúm và sởi: 'vaccine cúm được cập nhật hằng năm ... vaccine sởi hiệu quả gần như trọn đời' → 'thành phần vaccine cúm xem xét hằng năm, cập nhật khi cần; hai liều MMR hiệu quả 97%, phần lớn người tiêm được bảo vệ suốt đời'. Căn cứ: CDC 'How Flu Viruses Can Change'; CDC 'Measles Vaccination'.
- Summary và mô tả SEO: 'một tuyến phản ứng tức thì với mọi thứ lạ' → 'một tuyến phản ứng nhanh với những đặc trưng chung của mầm bệnh'. Căn cứ: Marshall 2018.
- Bổ sung: độ bền kháng thể khác nhau theo kháng nguyên (thuỷ đậu–zona ~50 năm, sởi/quai bị >200 năm, uốn ván 11 năm, bạch hầu 19 năm) — Amanna 2007, NEJM, doi 10.1056/NEJMoa066092; nêu rõ 'chọn lọc dòng' là giản lược (đột biến soma) — Briney 2019; bỏ khung 'giải pháp tiến hoá' không nguồn.
- Nguồn: thêm 9 nguồn (6 bình duyệt bậc 1, 3 trang CDC bậc 2); hạ Janeway's Immunobiology từ bậc 2 xuống bậc 3 (giáo trình).
- **Còn nợ:** seoDescription trùng nguyên văn summary và mang cùng lỗi C-18; sửa qua khoá seoDescriptionEdits (script áp đã đọc khoá này; neo khớp đúng 1 lần). Kiểm thêm có seoDescriptionEn riêng không (dump không có trường này).
- **Còn nợ:** Ba nguồn bậc 1 cũ (Crotty, Hammarlund, Amanna) có url=null trong CSDL. Đề nghị điền https://doi.org/<doi> tương ứng.
- **Còn nợ:** Bài chưa có reviewedBy/reviewedAt. Sau khi áp bản sửa, gán byline tài khoản tổ chức theo docs/content-rules.md mục 'Byline người duyệt'; không được suy từ ngày tạo.
- **Còn nợ:** Revision chụp nội dung trước khi sửa phải ghi cùng transaction với lệnh sửa, và cập nhật lastVerifiedAt (content-rules: 'Sửa bài đã publish là đính chính').

### nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao — PASSED

- C-1: "Nhưng dao động đó không đến từ một 'đồng hồ riêng' của vi khuẩn" → "dao động này chịu ảnh hưởng của nhịp ăn của vật chủ" (nguồn nói influenced by, không loại trừ đồng hồ của vi khuẩn) → căn cứ: Thaiss và cộng sự 2014, Cell, doi 10.1016/j.cell.2014.09.048.
- C-2: "không có bằng chứng cho thấy nhịn ăn gián đoạn 'thiết lập lại' chu kỳ hệ vi sinh ở người … đi kèm, chưa phải gây ra" → "chưa được nghiên cứu trực tiếp; tổng quan 2024 nêu cần nghiên cứu ở người về vai trò của nhịp ngày đêm, và giảm cân/đổi khẩu phần làm nhiễu kết quả" → căn cứ: Paukkonen và cộng sự 2024, doi 10.3389/fnut.2024.1342787.
- C-3: danh sách "cải thiện chuyển hóa năng lượng, giảm viêm mức thấp kéo dài, tăng tính đa dạng" → chỉ giữ "có vẻ có thể tăng độ phong phú và đa dạng alpha, kết quả không đồng nhất, chưa rõ có lợi cho sức khỏe" → căn cứ: Paukkonen và cộng sự 2024, doi 10.3389/fnut.2024.1342787.
- C-4b: "thay đổi nhất quán hơn cả lại là tăng ngành Proteobacteria" và "các nghiên cứu còn lại không báo cáo loài này" → thay đổi lặp lại có cả hai chiều (tăng Faecalibacterium, giảm Veillonellaceae; tăng Proteobacteria, Gammaproteobacteria); Proteobacteria còn tăng/giảm trái chiều giữa các nghiên cứu → căn cứ: Paukkonen và cộng sự 2024, doi 10.3389/fnut.2024.1342787.
- C-5: Akkermansia "liên quan đến hàng rào niêm mạc khỏe, chuyển hóa tốt hơn, giảm nguy cơ béo phì và hội chứng chuyển hóa" → tương quan quan sát ở người; một thử nghiệm thăm dò 32 người hoàn thành, 3 tháng, cải thiện độ nhạy insulin/cholesterol, cân nặng không đổi có ý nghĩa; là bổ sung vi khuẩn, không phải nhịn ăn → căn cứ: Depommier và cộng sự 2019, Nature Medicine, doi 10.1038/s41591-019-0495-2.
- C-6: "vi khuẩn tạo SCFA như butyrate có xu hướng tăng khi chế độ ăn phù hợp" → "Faecalibacterium (tạo butyrate) tăng ở ≥3 nhóm nhịn ăn, cùng lúc với tăng Proteobacteria có thể có hại" → căn cứ: Paukkonen và cộng sự 2024, doi 10.3389/fnut.2024.1342787.
- C-7/C-8: "Kích hoạt cơ chế quét dọn" — MMC sau "vài giờ", đẩy cặn xuống ruột già, hạn chế vi khuẩn ruột non, giảm đầy hơi → MMC diễn ra mỗi khi đói, không riêng nhịn ăn gián đoạn; vai trò chưa hiểu đầy đủ; thiếu MMC liên quan tăng sinh vi khuẩn ruột non; bỏ claim đầy hơi → căn cứ: Deloose và cộng sự 2012, doi 10.1038/nrgastro.2012.57.
- C-9/C-10: cắt mục "Ảnh hưởng đến cảm giác đói và thèm ăn" (danh sách hormone không nguồn; lời kể "một số người nhận thấy") → căn cứ: không có nguồn bậc 1–2 nào đỡ.
- C-11: "Các hướng dẫn hiện hành khuyến cáo…" (không nêu hướng dẫn nào) → nêu đích danh hai tổng quan; thêm nhóm suy giảm miễn dịch; "trẻ em" → "trẻ nhỏ"; người cao tuổi từ "cân nhắc thận trọng" → nằm trong nhóm không khuyến nghị; người dùng insulin/sulfonylurea cần bác sĩ theo dõi và chỉnh thuốc → căn cứ: Vasim và cộng sự 2022, Nutrients, doi 10.3390/nu14030631; Albosta và Bakke 2021, Clin Diabetes Endocrinol, doi 10.1186/s40842-020-00116-1.
- C-14: tiêu đề mục "Đồng bộ hóa nhịp sinh học của hệ vi sinh" và "Tăng một số vi khuẩn có lợi" (khẳng định mạnh hơn thân bài) → "Nhịp ngày đêm của hệ vi sinh" và "Vi khuẩn phân giải chất nhầy và những thay đổi khác"; bản en đổi tương ứng → căn cứ: Paukkonen 2024, doi 10.3389/fnut.2024.1342787.
- C-13 (Kết luận): "có ảnh hưởng thực sự đến tiêu hóa, miễn dịch và chuyển hóa… từ đó tác động đến sức khỏe đường ruột" → tóm tắt đúng mức thân bài: có thể đổi thành phần, bằng chứng ít, không đồng nhất, có cả chiều lợi lẫn hại → căn cứ: Thaiss 2014, doi 10.1016/j.cell.2014.09.048; Paukkonen 2024, doi 10.3389/fnut.2024.1342787.
- Bản en (contentEn): chưa từng nhận các lượt đính chính 2026-09-11 (S1 chống chỉ định) và 2026-09-17 (C-2, C-4, C-12) — vẫn nói nhịn ăn "helping to reset" hệ vi sinh, vi khuẩn ăn chất nhầy "tend to thrive", và KHÔNG có mục chống chỉ định → đồng bộ toàn bộ với bản vi sau lượt này, thêm mục "Who should not practice intermittent fasting" → căn cứ: như các dòng vi ở trên.
- Nguồn: gỡ "Effects of Intermittent Fasting on Health, Aging, and Disease" (NEJM 2019) — không claim nào truy về được, không mở được toàn văn; thêm Deloose 2012, Depommier 2019, Vasim 2022, Albosta & Bakke 2021 (đều bậc 1, đã mở tóm tắt/toàn văn ngày 2026-09-25).
- **Còn nợ:** seoDescription vẫn là câu cũ "…còn thay đổi môi trường sống của hàng chục nghìn tỉ vi sinh vật…" — không có trường sửa cho nó trong schema này. Mức S4 (tổng quan có nói 'IF influences gut microbiota'), không chặn gate, nhưng nên đổi theo câu đầu của summary vi cho nhất quán.
- **Còn nợ:** Mục chống chỉ định (vi + en) nay có nguồn, nhưng vẫn nên có một người có chuyên môn y khoa đọc lại. Science-editor kiểm được nguồn nói gì, không thay được phán quyết lâm sàng. Hai nguồn là tổng quan tường thuật, không phải hướng dẫn lâm sàng của một cơ quan — nên bài viết 'các tổng quan y khoa', không viết 'hướng dẫn'.
- **Còn nợ:** Thaiss 2014: chỉ mở được tóm tắt (toàn văn Cell bị Cloudflare chặn, API Elsevier trả rỗng). Câu 'ở cả chuột và người, loạn khuẩn do lệch múi giờ thúc đẩy rối loạn dung nạp glucose và béo phì' sát nguyên văn tóm tắt, nhưng chưa kiểm được cỡ mẫu người và phần 'ở người' được đo trên chính người hay trên chuột nhận phân. Không chặn gate; nếu mở được toàn văn thì nên nêu cỡ mẫu.
- **Còn nợ:** Bản en thiếu mục thứ tư của 'Further reading' (bài 'Đằng sau tiếng bụng kêu') so với bản vi. Không phải claim nên không sửa ở đây; seo-expert/translation nên đồng bộ.
- **Còn nợ:** Bảng nguồn [s2] Thaiss dùng url trang Pure của Johns Hopkins (đã kiểm HTTP 200). Nên cân nhắc đổi sang https://doi.org/10.1016/j.cell.2014.09.048 để link bền hơn — không phải lỗi accuracy.

### nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha — PASSED

- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Nhánh xoắn ốc: "Ngày nay nhiều nhà nghiên cứu cho rằng..." → "một số tác giả đề xuất", thêm kết quả phản bác của Overholt et al. 2009 và giới hạn mật độ trong nhánh | Overholt, Melott & Pohl 2009 (doi 10.1088/0004-637X/705/2/L101); Bailer-Jones 2009 mục 6.2
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | K-Pg: "va chạm thiên thạch" đặt như minh hoạ cho mưa sao chổi Oort → nêu rõ vật thể Chicxulub là tiểu hành tinh kiểu carbonaceous, nên K-Pg không đỡ kịch bản sao chổi thiên hà | Fischer-Gödde et al. 2024 (doi 10.1126/science.adk4868)
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Kết luận: "một điều đã rõ: số phận hành tinh... được quyết định bởi hành trình trong Ngân Hà" → nhịp điệu thiên hà chưa được chứng minh; va chạm ngẫu nhiên và cơ chế trên Trái Đất vẫn là nguyên nhân khả dĩ | Bailer-Jones 2009 (doi 10.1017/S147355040999005X)
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Giả thuyết Shiva: thêm quy kết (Rampino & Stothers 1984; Rampino & Haggerty 1996) và cán cân bằng chứng (Bailer-Jones 2009: ít bằng chứng; Melott & Bambach 2013: tín hiệu 27 Myr, không đòi hỏi vai trò thiên văn)
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Chu kỳ quay quanh tâm Ngân Hà: 225–250 → khoảng 200–265 triệu năm (~235 với 220 km/s); dao động qua mặt phẳng: 50–70 → 52–74 triệu năm, giữa hai lần băng qua 25–35 → khoảng 26–37 triệu năm | Bailer-Jones 2009 mục 6, 6.1 (Bahcall & Bahcall 1985)
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Đám mây Oort: "hàng tỷ thiên thể" → "có thể hàng trăm tỷ, thậm chí hàng nghìn tỷ" kèm khoảng cách giả định; tuổi 4,5 → 4,6 tỷ năm | NASA Oort Cloud Facts
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | "Sai số thời gian có thể lên tới hàng triệu năm" → sai số trung bình ~6 triệu năm (dữ liệu Raup & Sepkoski 1984) và ~5 triệu năm (hố va chạm) | Bailer-Jones 2009 mục 2.3.1, 2.4.1
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Vị trí hiện tại: "khá gần mặt phẳng" → ~15 pc (ước tính 8–35 pc), biên độ ~70 pc; thay lập luận "giai đoạn nguy hiểm" bằng lập luận của nguồn (không có đại tuyệt chủng lớn trong 15 triệu năm) | Bailer-Jones 2009 mục 6.1
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Thêm giới hạn cơ chế mưa sao chổi (đám mây phân tử quá phân tán, vật chất thông thường không đủ) và độ yếu thống kê của chu kỳ 35 triệu năm | Randall & Reece 2014 (doi 10.1103/PhysRevLett.112.161301)
- 2026-09-25 | nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha | Bụi liên sao: câu phủ định không nguồn → cơ chế khả dĩ trên lý thuyết, chưa có bằng chứng là nguyên nhân chính | Bailer-Jones 2009 mục 5.6; tia vũ trụ: "nguồn phát tia vũ trụ" → tàn dư siêu tân tinh, nơi được cho là sinh ra phần lớn tia vũ trụ thiên hà
- **Còn nợ:** Tiêu đề "Những lần đại tuyệt chủng có liên quan tới hành trình của Hệ Mặt Trời trong Ngân Hà?" mang tiền giả định: dù có dấu hỏi, cụm "Những lần đại tuyệt chủng có liên quan" đọc như có một tập sự kiện đã được gắn với Ngân Hà. Đề xuất: "Đại tuyệt chủng có theo nhịp hành trình của Hệ Mặt Trời trong Ngân Hà? Một giả thuyết còn tranh cãi" (hoặc ngắn: "Đại tuyệt chủng và hành trình của Hệ Mặt Trời: giả thuyết còn tranh cãi"). Đổi title/slug là quyết định riêng; nếu đổi slug thì cần 301 (npm run slugs:redirect).
- **Còn nợ:** contentEn, titleEn, summaryEn đều null — không có bản en để sửa song song. Khi dịch, bản en phải dịch từ bản vi SAU khi áp các edit này, không từ bản cũ.
- **Còn nợ:** Sau khi áp edit, bảng nguồn có 9 nguồn (8 bậc 1, 1 bậc 2). Người áp phải ghi Revision trước khi sửa, dòng corrections.md, cập nhật lastVerifiedAt, đặt reviewer (tài khoản tổ chức) — và chỉ đặt factCheck=PASSED sau khi soát lại chuỗi đã áp.

### ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai — PASSED

- EN (toàn bài): bản contentEn chưa nhận đính chính S1 ngày 2026-09-11 lẫn các sửa S2 ngày 2026-09-17 — vẫn nói "About 95% of the body's serotonin is produced in the digestive tract, with only about 5% created in the brain", "500 million neurons", chuỗi vi khuẩn → phế vị → trung tâm đói/no kèm danh sách hormone, và kết luận "significantly influential on ... mood" → đưa về cùng claim với bản vi → căn cứ: Hwang 2025 doi 10.3390/ijms26031160; Kanova & Kohout 2021 doi 10.3390/ijms22094837; Michel 2022 doi 10.1111/nmo.14440; Breit 2018 doi 10.3389/fpsyt.2018.00044; Ou 2023 doi 10.20517/mrr.2023.33.
- C-1: "Phép đếm trực tiếp toàn diện đầu tiên ... khoảng 168 triệu" → "Phép đếm toàn diện đầu tiên (Michel và cộng sự, 2022) ... số liệu người tính từ mật độ nơron × kích thước ruột lấy từ tài liệu" → căn cứ: Michel 2022 doi 10.1111/nmo.14440; ước lượng 400–600 triệu: Fleming 2020 doi 10.1155/2020/8024171.
- C-3: serotonin ruột "điều hòa nhu động ruột, hấp thu và chuyển hóa" → "tham gia điều hòa nhu động và bài tiết của ruột, cùng một số chức năng chuyển hóa năng lượng"; ý không qua hàng rào máu–não nay có nguồn → căn cứ: Kanova & Kohout 2021 doi 10.3390/ijms22094837; Chen 2021 doi 10.3390/nu13062099.
- C-5: "Ruột có thể tự kiểm soát: nhu động, tiết enzyme tiêu hóa, hấp thu dinh dưỡng" (và Summary "hoạt động độc lập với não bộ") → "ở ruột non và ruột già, ENS tự điều khiển nhu động, dòng dịch qua niêm mạc, lưu lượng máu niêm mạc; mức tự chủ khác nhau dọc ống tiêu hóa" → căn cứ: Breit 2018 doi 10.3389/fpsyt.2018.00044; Furness 2012 doi 10.1038/nrgastro.2012.32.
- C-6: "Đó là lý do: căng thẳng có thể gây đau bụng hoặc tiêu chảy; các vấn đề đường ruột có thể ảnh hưởng tới tâm trạng và giấc ngủ" → IBS là rối loạn tương tác não–ruột, nguyên nhân chưa rõ, căng thẳng đầu đời/trầm cảm/lo âu gặp nhiều hơn và có thể góp phần — là liên hệ, chưa phải cơ chế; bỏ ý "giấc ngủ" → căn cứ: NIDDK, Symptoms & Causes of Irritable Bowel Syndrome (2017).
- C-7: "Phần lớn cơ chế phân tử được phát hiện ở đây" → "Nhiều cơ chế phân tử tiềm năng được tìm ra từ các nghiên cứu động vật này" → căn cứ: Ou 2023 doi 10.20517/mrr.2023.33 ("several potential molecular mechanisms").
- C-8: "Dây thần kinh phế vị là kênh liên lạc chính" → "một trong những kênh liên lạc giữa não và ruột" → căn cứ: Breit 2018 doi 10.3389/fpsyt.2018.00044.
- C-12: "Các sợi hướng tâm ... góp phần định đoạt tốc độ hấp thu, dự trữ và huy động chất dinh dưỡng. Theo nghĩa đó, ruột chủ yếu là một cơ quan cảm giác" → sợi hướng tâm báo tin; tốc độ hấp thu/dự trữ/huy động do sợi ly tâm cùng cơ chế nội tiết định đoạt; dây phế vị chủ yếu là đường báo tin lên → căn cứ: Breit 2018 doi 10.3389/fpsyt.2018.00044.
- C-9: mục "Có thể 'lập trình lại' hệ vi sinh đường ruột không?" (danh sách thói quen có lợi không nguồn; "có thể ảnh hưởng đến cảm giác thèm ăn") → "Ăn uống có thay đổi được hệ vi sinh đường ruột không?": thay đổi nhanh và cũng hồi nhanh (David 2014); lên men tăng đa dạng, chất xơ không (Wastyk 2021); đổi thành phần chưa có nghĩa đổi tâm trạng/thèm ăn ở người → căn cứ: doi 10.1038/nature12820; doi 10.1016/j.cell.2021.06.019.
- **Còn nợ:** Mục glossary: edit C-5 gỡ [[enzyme]] khỏi cả vi và en; sau khi áp cần chạy `npm run glossary:usedin` (chạy khô rồi --write) để trường usedIn của mục 'enzyme' không còn trỏ bài này. Không tự chạy trong lượt này.
- **Còn nợ:** Bản en thiếu mục thứ tư của 'Further reading' (link /articles/dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi) so với bản vi. Không phải claim nên không đưa vào enEdits; seo-expert/translation bổ sung.
- **Còn nợ:** Tiêu đề 'Ruột, hệ vi sinh vật và quyền lực của bộ não thứ hai' / 'the Power of the Second Brain' và SEO_DESC không mang mệnh đề sai, nhưng chữ 'quyền lực' hứa nhiều hơn thân bài (nay nói phần lớn ảnh hưởng lên tâm trạng/thèm ăn ở người chưa xác lập). Schema fixes không có trường cho title/seoDescription — đề nghị seo-expert cân nhắc, không chặn gate.
- **Còn nợ:** Sau khi áp: đặt reviewedBy = tài khoản tổ chức 'Ban biên tập Sciencepedia', reviewedAt = ngày áp, lastVerifiedAt cập nhật, ghi Revision cùng transaction (content-rules, 'Sửa bài đã publish là đính chính'). Bản dump hiện reviewedBy=null.
- **Còn nợ:** Chồng lấn nội dung với 'he-vi-sinh-duong-ruot-...' và 'nhin-an-gian-doan-...' (đã nêu 2026-09-17) vẫn thuộc thẩm quyền knowledge-architect; không ảnh hưởng gate accuracy.

### su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian — PASSED

- Bản tiếng Anh chưa từng nhận bốn bản sửa S1 ngày 17/09 (niên đại Trái Đất/zircon, GOE theo Philippot 2018, Permi 251,9 triệu năm/81%, Laetoli) — corrections.md ghi đã sửa nhưng chỉ bản vi đổi. Lượt này áp cả bốn vào contentEn; bản en còn mâu thuẫn với bản vi ở Homo sapiens ("100,000-year figure" → 195.000 năm theo Omo I) và ở bảng lịch (oxy "End of July", Homo sapiens "23:37") — đã sửa theo bản vi.
- Zircon: "theo USGS có tuổi tới 4,3 tỉ năm" → "tới khoảng 4,4 tỉ năm (4,404 ± 0,008 tỉ năm)" — căn cứ: ghi chú biên tập trên chính trang USGS Age of the Earth; Wilde và cộng sự 2001, doi 10.1038/35051550.
- Sự hình thành lõi: "Ban đầu nó là một hành tinh nóng chảy. Kim loại nặng chìm vào trong..." → đại dương magma "có thể", "một hoặc nhiều"; lõi sắt–niken tách xong trong ~30 triệu năm đầu — căn cứ: Elkins-Tanton 2012, doi 10.1146/annurev-earth-042711-105503; Kleine và cộng sự 2002, doi 10.1038/nature00982. Từ trường: gắn nguồn NASA (lõi ngoài lỏng, chắn gió Mặt Trời).
- Va chạm tạo Mặt Trăng: "Một thiên thể cỡ Sao Hoả... đâm vào" (viết như sự kiện đã xác lập) → "các giả thuyết vẫn cạnh tranh, nhưng gần như tất cả chung ý: khoảng 4,5 tỉ năm trước, một thiên thể cỡ Sao Hoả hoặc một loạt thiên thể..." — căn cứ: NASA, How did the Moon form?
- Mặt Trăng và khí hậu: "giữ cho khí hậu không dao động hỗn loạn qua các chu kỳ dài" → "giữ trục không lắc quá nhiều, góp phần ổn định khí hậu" — căn cứ: NASA, Top Moon Questions. Độ dài ngày: "ngày trên Trái Đất sơ khai chỉ dài vài giờ" (không nguồn) → "1,4 tỉ năm trước một ngày dài khoảng 18,7 giờ" — căn cứ: Meyers & Malinverno 2018, doi 10.1073/pnas.1717689115.
- Sự sống sớm nhất: "Hoá thạch vi khuẩn cổ nhất được chấp nhận rộng rãi có tuổi khoảng 3,5 tỉ năm" → vi hoá thạch tới ~3,5 tỉ năm, dấu vết hoá học có thể tới ~3,8 tỉ năm, graphit 4,1 tỉ năm là gợi ý; nguồn gốc sinh học còn tranh luận — căn cứ: Bell và cộng sự 2015, doi 10.1073/pnas.1517557112; Allwood và cộng sự 2006, doi 10.1038/nature04764.
- "Một trong những lý do nhiều nhà khoa học cho rằng sự sống có thể không hiếm" (một phía) → trình bày cả hai phía — căn cứ: Spiegel & Turner 2012, doi 10.1073/pnas.1111694108.
- Quặng sắt dải: "nguồn sắt mà phần lớn ngành thép hiện đại đang khai thác" → "phần lớn quặng sắt trên thế giới nằm trong loại đá này" — căn cứ: CSIRO, Banded iron formations (2024). Cắt câu "sự kiện oxy hoá có thể là cuộc tuyệt chủng hàng loạt lớn nhất" (không nguồn).
- Quả cầu tuyết: "băng lan tới tận vùng nhiệt đới" trong cả kỷ Cryogen → hai đợt băng hà (Sturtian ~58 triệu năm, Marinoan ≥5 triệu năm), mốc 720–635 triệu năm theo ICS, trình bày là giả thuyết — căn cứ: ICS v2024/12; Hoffman và cộng sự 2017, doi 10.1126/sciadv.1600983.
- Bùng nổ Cambri: "538 triệu năm", "20–25 triệu năm", "lần đầu tiên có bộ xương cứng, mắt và săn mồi chủ động" → đáy Cambri 538,8 ± 0,6 triệu năm (ICS), bùng nổ ~540–520 triệu năm; bộ xương khoáng hoá và săn mồi đã có từ cuối Tiền Cambri (Cloudina) — căn cứ: Wood và cộng sự 2019, doi 10.1038/s41559-019-0821-6; Sperling và cộng sự 2013, doi 10.1073/pnas.1312778110; Bengtson & Zhao 1992, doi 10.1126/science.257.5068.367.
- Anomalocaris: "dài tới nửa mét là kẻ săn mồi đứng đầu" → "kẻ săn mồi lớn nhất ở Burgess Shale (~505 triệu năm), dài tới khoảng 1 m, mẫu đầy đủ nhất 25 cm" — căn cứ: Bảo tàng Hoàng gia Ontario.
- Thực vật lên cạn: "khoảng 470 triệu năm trước... Động vật chân đốt theo sau" → bào tử sớm nhất 469 triệu năm, đồng hồ phân tử gợi ý nguồn gốc Cambri, thực vật có mạch cuối Ordovic–Silur; bỏ câu chân đốt — căn cứ: Morris và cộng sự 2018, doi 10.1073/pnas.1719588115.
- Tetrapod: "xuất hiện vào cuối kỷ Devon, khoảng 375–360 triệu năm" → hoá thạch thân cổ nhất cuối Devon, dấu chân Zachełmie sớm hơn ~18 triệu năm, thời điểm còn được xem xét lại; bỏ Ichthyostega — căn cứ: Niedźwiedzki và cộng sự 2010, doi 10.1038/nature08623; Daeschler và cộng sự 2006, doi 10.1038/nature04639.
- Kỷ Than đá: "các mỏ than hiện đại" và "trứng có màng ối cho phép bò sát" → kỷ đặt tên theo các vỉa than lớn; nhánh có màng ối (bò sát, chim, thú) có từ đầu kỷ — căn cứ: Nelsen và cộng sự 2016, doi 10.1073/pnas.1517943113; Long và cộng sự 2025, doi 10.1038/s41586-025-08884-5.
- Permi: "mở đường cho nhóm archosaur" → archosauromorph trở thành nhóm chiếm ưu thế trên cạn — căn cứ: Ezcurra & Butler 2018, doi 10.1098/rspb.2018.0361.
- K–Pg: "bụi và sulfat che khuất Mặt Trời trong nhiều năm" → bụi silicate mịn, muội than, lưu huỳnh; quang hợp gần như ngừng gần 2 năm (mô phỏng); vai trò Deccan Traps trình bày là tranh luận — căn cứ: Senel và cộng sự 2023, doi 10.1038/s41561-023-01290-4; Hull và cộng sự 2020, doi 10.1126/science.aay5055; kích thước tiểu hành tinh: NOAA.
- Thú sau K–Pg: "sống sót nhờ nhỏ, ăn tạp và đào hang" (nhân quả không nguồn) → ở Bắc Mỹ chỉ 4/59 loài sống sót, phục hồi trong 300.000 năm; "toả ra chiếm mọi ổ sinh thái" bị bỏ — căn cứ: Longrich và cộng sự 2016, doi 10.1111/jeb.12882.
- Linh trưởng: "xuất hiện khoảng 55 triệu năm trước với... ngón cái đối diện, mắt hướng về phía trước" → bộ xương linh trưởng cổ nhất được biết (Archicebus, ~55 triệu năm); bỏ danh sách đặc điểm không nguồn — căn cứ: Ni và cộng sự 2013, doi 10.1038/nature12200.
- Homo erectus: "là loài người đầu tiên rời châu Phi" → "thường được coi là loài người đầu tiên lan ra ngoài châu Phi" (giữ mức dè dặt của nguồn) — căn cứ: Smithsonian, Homo erectus.
- Homo sapiens: thêm niên đại Jebel Irhoud 315.000 ± 34.000 năm và niên đại mới của Omo I (tối thiểu 233.000 ± 22.000 năm) — căn cứ: Hublin và cộng sự 2017, doi 10.1038/nature22336; Vidal và cộng sự 2022, doi 10.1038/s41586-021-04275-8.
- Nông nghiệp và chữ viết: "Nông nghiệp bắt đầu khoảng 12.000 năm trước, khi kỷ băng hà cuối cùng kết thúc... khoảng 5.000 năm" → thuần hoá bắt đầu ở Đông Địa Trung Hải khoảng 12.000–11.000 năm trước; chữ viết sớm nhất ~3200 TCN, tức ~5.200 năm — căn cứ: Zeder 2008, doi 10.1073/pnas.0801317105; ICS v2024/12; Đại học Chicago.
- Bảng "nén thành một năm": tính lại theo mốc có nguồn — vi hoá thạch 3,5 tỉ năm → 25/3 (cũ: tế bào đầu tiên, cuối tháng 2); oxy 2,45–2,4 tỉ năm → 18–22/6; quần sinh vật Ediacara 571 triệu năm → 16/11; Bùng nổ Cambri → 18/11 (cũ 19/11); lịch sử thành văn → khoảng 36 giây (cũ 30 giây).
- Câu kết "khả năng cao nhất là ta sẽ tìm thấy [sự sống ngoài kia] ở dạng vi khuẩn" (suy đoán không nguồn) → bỏ; "Sự sống đơn bào chiếm gần ba tỉ năm đầu" (cả phần mở bài) → "chủ yếu là vi sinh vật", động vật lớn và thực vật trên cạn trong "chưa tới 600 triệu năm cuối" — căn cứ: Bobrovskiy và cộng sự 2018, doi 10.1126/science.aat7228; Morris và cộng sự 2018.
- Laetoli: cắt câu "Nguồn nói về dấu chân chứ không nói ... bằng chứng từ xương có thể còn cổ hơn" (do lượt 17/09 thêm, nói về gói nguồn và có vế không nguồn); giữ câu "những dấu chân người cổ sớm nhất được biết trên thế giới" — căn cứ: Masao và cộng sự 2016, doi 10.7554/eLife.19568.
- Mở bài: "Trái Đất bắt đầu như một quả cầu đá nóng chảy" → "có lẽ đã bắt đầu như..." cho khớp mức dè dặt của thân bài — căn cứ: Elkins-Tanton 2012.
- Nguồn: thêm 34 nguồn đã mở kiểm trong lượt này (25 bậc 1, 7 bậc 2, 2 bậc 3 — xem bảng); không bỏ, không đổi bậc nguồn nào trong 8 nguồn hiện có.
- **Còn nợ:** Dòng ghi công cuối bài "Biên tập lại từ bài ... của Đặng Vũ Tuấn Sơn ... Bản quyền nội dung gốc thuộc về VACA" (cả vi lẫn en) — câu hỏi từ 17/09 vẫn chưa có người quyết. Sau lượt này hầu hết các đoạn đã viết lại theo nguồn khác. Đây là câu hỏi về quyền và provenance, không phải về độ chính xác, nên không chặn gate accuracy; nhưng editor không tự sửa dòng này.
- **Còn nợ:** Tiêu đề "4 tỉ năm" / "four billion years": dấu vết sự sống có nguồn trải từ ~3,5 tỉ năm (vi hoá thạch) tới 4,1 tỉ năm (gợi ý, chưa kết luận). "4 tỉ năm" nằm trong khoảng ấy như một bậc độ lớn nên editor giữ nguyên; ghi lại đây để không ai "sửa cho đẹp" thành một con số điểm.
- **Còn nợ:** Sau khi áp, factCheck chỉ nên chuyển sang PASSED khi người chạy script xác nhận cả 36 edit vi và 35 edit en đã khớp đúng một lần và đã ghi Revision trong cùng transaction.

## 2026-09-25 — đồng bộ bản en với bản vi đã đính chính

Đối chiếu: `docs/content/checks/2026-09-25/en-parity/`. Script:
`scripts/apply-en-parity-2026-09-25.ts` — chỉ sửa contentEn/summaryEn/titleEn;
bản en trước khi sửa được chụp vào `Revision` trong cùng transaction.

### bi-mat-dang-sau-cam-giac-nang-va-nhe

- - 2026-09-25 | bi-mat-dang-sau-cam-giac-nang-va-nhe | Bản en: dịch lại toàn bài từ vi hiện tại — gỡ phần không có ở vi (CGPM 1901, định nghĩa kilogram 2019, số MICROSCOPE, ví dụ 98 N, máy bay nhẹ đi theo độ cao); thêm g Mặt Trăng 1,62 m/s², tốc độ ISS ~7,7 km/s, ví dụ thiết bị vài tấn; 'thí nghiệm cho thấy bằng nhau' → 'chưa tìm thấy khác biệt, trong giới hạn rất chặt'; thiết bị vài tấn 'trôi khá dễ dàng' → 'bị đẩy thì trôi, nhưng tăng tốc chậm' | Đối chiếu song ngữ 25/09; NASA What is Microgravity (88,8%, 28.000 km/h), NASA Moon Facts (1/6), NSSDC Moon Fact Sheet (1,62), MICROSCOPE 2022
- **Còn nợ:** Vi, ví dụ thiết bị vài tấn: 'có thể trôi đi khá dễ dàng' dựng mô hình sai — khối lượng lớn vẫn khó làm tăng tốc như ở Trái Đất (chính là ý của bài). en đã viết lại; vi nên sửa tương ứng.
- **Còn nợ:** Vi 'mọi thí nghiệm ... đều cho thấy khối lượng quán tính = khối lượng hấp dẫn' nâng mức chắc chắn: thực nghiệm (MICROSCOPE [s13]) chỉ đặt giới hạn trên cho độ lệch. Nên viết 'chưa tìm thấy khác biệt nào, tới độ chính xác ~10⁻¹⁵'.
- **Còn nợ:** Vi 'g ≈ 1,62 m/s²' trên Mặt Trăng không có nguồn trong bảng (Moon Facts [s12] chỉ nói 1/6). Con số đúng theo NSSDC Moon Fact Sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html); cần thêm nguồn này vào bảng.
- **Còn nợ:** Bản en cũ có phần có nguồn bậc 1–2 (CGPM 1901, kilogram 2019, MICROSCOPE) sâu hơn vi; muốn giữ thì đưa vào vi trước.

### big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam

- (en) "Around 1 Billion Years — The first galaxies appeared" → "Around 300 Million Years — the first galaxies had formed" + JADES-GS-z14-0 (z = 14,32, khoảng 290 triệu năm) ghi mốc "As of May 2024" — căn cứ: NASA Science, 30/05/2024 (nguồn s3 của bài).
- (en) gỡ dòng "In about 8 billion years: The Sun becomes a white dwarf" — căn cứ: NASA Science, Sun: Facts: "another 5 billion years or so before it becomes a white dwarf" (check 2026-09-17, C-11). Bản vi CHƯA sửa dòng tương ứng.
- **Còn nợ:** Bản vi còn "Khoảng 8 tỷ năm nữa: Mặt Trời trở thành sao lùn trắng" — sai (S2, check 2026-09-17 C-11). NASA Science, Sun: Facts, mở ngày 25/09/2026: "will last another 5 billion years or so before it becomes a white dwarf". Cần lượt đính chính vi: sửa thành ~5 tỉ năm và thêm NASA Sun: Facts vào bảng nguồn, rồi thêm lại dòng tương ứng vào en.
- **Còn nợ:** Bản vi viết JADES-GS-z14-0 là "thiên hà xa nhất được xác nhận cho tới nay" — đã lỗi thời (check 2026-09-17 C-9: MoM-z14, z = 14,44, Naidu và cs. 2025). En chỉ nói "as of May 2024", nên không sai; vi cần sửa ở lượt đính chính riêng. Nguồn s3 (NASA) ghi "less than 300 million years"; con số 290 của cả hai bản khớp với mức đó nhưng không phải nguyên văn nguồn.
- **Còn nợ:** Các phát hiện S3 khác của check 2026-09-17 vẫn còn ở CẢ HAI bản và lượt đối chiếu này không đóng chúng: 27% vật chất tối (Planck 2018 ≈ 26,4%), 75/25% thiếu chữ "theo khối lượng" và lithi gộp vào "dự đoán chính xác", lạm phát viết như sự kiện đã xác lập, "cái chết nhiệt được ủng hộ nhiều nhất", mốc 200 triệu năm và 100 nghìn tỉ / 10¹⁰⁰ năm không nguồn, thiếu căng thẳng Hubble. factCheck=REVISE là đúng.

### cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru

- (en) "astronomers have detected a nanohertz gravitational wave background" → "found evidence for …", kèm mức ý nghĩa ~3,5–4σ, chưa tới 5σ — căn cứ: NANOGrav 15 năm, doi 10.3847/2041-8213/acdac6 (nguồn s1).
- (en) sao tối lớn tới "hundreds of thousands or millions" lần khối lượng Mặt Trời → "about 10⁴–10⁷" — căn cứ: bản vi đã đính chính (check 2026-09-17, C-5).
- (en) "New simulations suggest" → "Ghodla and Ilie (2026, Physical Review D) calculate" — căn cứ: doi 10.1103/hvfd-8fkr; arXiv:2507.06163.
- (en, summaryEn) "recently detected … not only from merging SMBH binaries, but also signatures of dark stars that existed over 13 billion years ago" → "In 2023 … reported evidence … may come mainly from SMBH pairs whose seeds were collapsed dark stars" — căn cứ: arXiv:2507.06163 ("Dark Star seeded SMBHs … can be the dominant contributor"); NANOGrav 15 năm.
- **Còn nợ:** summary và seoDescription bản vi vẫn mang ba lỗi đã sửa ở summaryEn: "gần đây đã phát hiện" (NANOGrav 2023 là bằng chứng ~3,5–4σ), "không chỉ đến từ các cặp lỗ đen … mà còn chứa dấu vết của sao tối" (sai cơ chế — check 2026-09-17 C-2; arXiv:2507.06163v2 mở ngày 25/09/2026: "Dark Star seeded SMBHs … can be the dominant contributor to the PTA signal"), và "hơn 13 tỷ năm trước" (tóm tắt chỉ nói high-z). Cần lượt đính chính vi.
- **Còn nợ:** Khoảng 10⁴–10⁷ M☉ (cả hai bản) dựa trên arXiv:2511.08578 — tiền ấn phẩm, KHÔNG có trong bảng nguồn của bài. Gắn nguồn hoặc hạ thành "theo một số mô hình" không kèm số.
- **Còn nợ:** Các fix còn mở của check 2026-09-17 ở cả hai bản: chưa nêu cách giải thích thiên lệch quan sát cho lỗ đen JWST, chưa ghi sao tối "chưa được quan sát xác nhận", chưa nêu điều kiện mật độ hạt giống ~10⁻³ Mpc⁻³, vế "nếu quá ít thì cần cơ chế khác" chưa kiểm, câu "mắt xích còn thiếu" chưa gắn nhãn suy diễn.
- **Còn nợ:** titleEn có dấu chấm cuối ("… across the universe.") — định dạng, chuyển seo-expert.

### co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho

- 2026-09-25 · `co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru` (en) — đính chính 11/09 chưa tới bản en: bỏ "+120°C/−150°C" gán cho thân người (đó là điều kiện môi trường khi đi bộ ngoài không gian), thêm cơ chế mất nhiệt do bay hơi; không chép 46°C và "gần như chắc chắn tử vong" của vi (check 17/09); thêm sự cố Houston 14 giây; đồng bộ kết bài với mốc 1–2 phút. Căn cứ: NASA Imagine (s2), NASA SP-3006 qua check 17/09.
- **Còn nợ:** Bản vi vẫn có "điểm sôi … khoảng 46°C" — check 17/09: không nguồn, trái NASA SP-3006. Cần cắt ở vi.
- **Còn nợ:** Bản vi vẫn có "gần như chắc chắn gây tử vong" và câu thuyên tắc khí tới tim và não — check 17/09 yêu cầu hạ mức; bản en đã hạ.
- **Còn nợ:** Bản vi ghi +120/−150°C là của "vỏ tàu vũ trụ"; check 17/09 dẫn NASA gắn con số với môi trường đi bộ ngoài không gian (−157°C đến 121°C). Cần một nguồn NASA trong bảng nguồn cho con số này; hiện không có.
- **Còn nợ:** Kết bài vi "trong vòng vài phút" mâu thuẫn mục 1–2 phút. NASA SP-3006 (khuyến nghị gắn nguồn ở check 17/09) chưa có trong bảng nguồn.
- **Còn nợ:** Tôi chưa mở lại s1 (Murray 2013) và SP-3006 ở lượt này; đoạn máu/ebullism của en dựa trên trích dẫn nguyên văn trong check 17/09.

### dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu

- 2026-09-25 · `dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu` (en) — bản en chưa nhận lượt sửa của vi: "air always moves from high to low pressure" → bị lệch do Trái Đất quay, gần song song đường đẳng áp; "temperature difference" → "pressure difference"; "daily cycle" → hai lần mỗi ngày mặt trăng 24 giờ 50 phút, có nơi một lần. Căn cứ: NOAA NOS (s2, s3).
- **Còn nợ:** Check 17/09 lưu ý lời giải thích chỗ phình phía đối diện bằng "lực quán tính" là cách đơn giản hoá có mất mát — cả hai bản chưa ghi điều đó; ngoài phạm vi đối chiếu.

### mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh

- **Còn nợ:** Không có claim khoa học nào lệch giữa vi và en; chỉ thiếu cấu trúc/link. Không cần dòng corrections.md (không phải đính chính claim). Tỉ lệ độ dài thấp do en thiếu câu trích và mục Đọc thêm.

### nang-luong-la-gi

- - 2026-09-25 | nang-luong-la-gi | contentEn/summaryEn là bản dài cũ, lệch cấu trúc với vi đã rút gọn (định nghĩa 'where it falls short', quy đổi eV/kWh, năng lượng bức xạ, năng lượng tối) → en dịch lại từ vi hiện tại; giữ phạm vi bảo toàn 'isolated system' (en cũ ghi 'closed system'); E=mc² viết là 'tương ứng', không phải 'khối lượng chuyển hoá thành năng lượng' | NASA Glenn Conservation of Energy (s6, mở 25/09)
- **Còn nợ:** vi trình bày 'đại lượng đo khả năng gây ra sự biến đổi hoặc thực hiện công' như định nghĩa vật lý. Bản en cũ và EIA (s4) coi đây là mô tả làm việc, không chặt. en mới nói rõ 'a working description rather than a rigorous definition'. Đề nghị vi thêm mệnh đề tương đương.
- **Còn nợ:** vi 'Năng lượng không tự sinh ra cũng không tự mất đi' không nêu phạm vi; NASA s6 viết 'within some problem domain'. Đề nghị vi thêm 'trong một hệ cô lập' (en và summaryEn đã có).
- **Còn nợ:** vi 'khối lượng và năng lượng thực chất là hai biểu hiện của cùng một đại lượng' và 'khối lượng ... chuyển hóa thành năng lượng' là đơn giản hoá gây mô hình sai (quy tắc 4). NRC s8 (bản en cũ trích: 'when the energy of a body changes by an amount E ... the mass changes by E/c²'). Lượt này không mở lại được NRC (curl trả Access Denied). Đề nghị vi viết 'tương ứng với'.
- **Còn nợ:** vi mất dòng dẫn nguồn cuối bài; en cũ có dòng này, dẫn đủ 8 nguồn. Nếu trang bài chỉ hiện nguồn qua dòng này thì sau khi apply, cả hai bản đều không dẫn nguồn trong thân bài. Cần kiểm cách trang render bảng Source trước khi apply.
- **Còn nợ:** vi đã được rút gọn nhưng corrections.md không có dòng nào cho bài này. Lần rút gọn là đính chính hay biên tập? Nếu là đính chính trên bài đã publish thì còn nợ dòng nhật ký (content-rules, mục 'Sửa bài đã publish là đính chính').

### neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien

- 2026-09-25 · `neu-roi-he-mat-troi-proxima-centauri` (en) — đính chính 11/09 chưa tới bản en: thêm chú thích Parker Solar Probe ở quỹ đạo đóng cho con số 6.700 năm. Kèm sửa en (vi còn sai): Proxima d "too hot for liquid water" → nhiệt độ cân bằng có thể tới ~360 K (albedo 0,3), nằm trong mép trong vùng sinh sống, khối lượng tối thiểu 0,26 (Faria 2022, s2); Proxima c là tín hiệu chưa xác nhận; b "rocky" → "may be rocky"; Starshot 20% → ~15% c, bay ngang Alpha Centauri sau hơn 20 năm (breakthroughinitiatives.org); thêm giả định cho thời gian bay; summaryEn bỏ "closest star to Earth".
- **Còn nợ:** Bản vi SAI, không phải chuẩn, ở: nhiệt độ cân bằng Proxima d 282 K (Faria 2022 ghi 360 K — đã mở full text lượt này), "khó giữ khí quyển" (không nguồn), "0,26 lần khối lượng" thiếu chữ "tối thiểu", b "hành tinh đá", Starshot 20% c tới Proxima (trang dự án: ≤100 triệu dặm/giờ ≈15% c, bay ngang Alpha Centauri). Cần sửa vi và ghi corrections.md cho vi.
- **Còn nợ:** Hai nguồn đã dùng cho en chưa có trong bảng nguồn: trang NASA Voyager 1 (17,0 km/s) và breakthroughinitiatives.org/initiative/3 (tier 3, chỉ mô tả dự án). Cần thêm vào bảng nguồn khi áp lượt sửa.
- **Còn nợ:** New Horizons 90.000 năm vẫn không nguồn ở cả hai bản (check 17/09 C-10). Giữ ở en vì cùng mức với vi và đã kèm giả định; nếu không tìm được vận tốc từ NASA thì cắt ở cả hai.
- **Còn nợ:** Vế "không nằm trong danh mục NASA" của Proxima c chưa kiểm được (check 17/09) — đã bỏ khỏi en; vi vẫn giữ.
- **Còn nợ:** Summary vi "ngôi sao gần Trái Đất nhất" sai (Mặt Trời). Tiêu đề en/vi "First Stop"/"điểm dừng" vẫn là câu hỏi mở từ 17/09 (dự án duy nhất là bay ngang).

### neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc

- 2026-09-25 · `neu-trai-dat-dang-quay` (en) — đính chính 11/09 chưa tới bản en: bỏ mục "twice as fast" (1,2%) còn sót, 0,3% → 0,35%, thêm phần kết; mục cơ chế viết lại theo check 17/09 C-3 (gia tốc hướng tâm nhỏ và không đổi, không phải "vận tốc đều"). Căn cứ: NASA NSSDC Earth Fact Sheet (s1), NASA Glenn (s2).
- **Còn nợ:** Bản vi vẫn mang lỗi S2 của check 17/09 C-3: "cơ thể chỉ nhận ra sự thay đổi vận tốc, chứ không nhận ra vận tốc đều" (ở mục thứ ba và câu kết). Chuyển động tròn luôn có gia tốc hướng tâm — chính bài tính 0,35%. Bản en mới đã viết đúng; vi cần sửa theo cùng hướng.
- **Còn nợ:** Bản vi còn "khoảng 900 km/h" không nguồn (check 17/09 yêu cầu cắt). Bản en không có con số.
- **Còn nợ:** Vai trò cơ quan sỏi tai (cảm nhận trọng lực — gia tốc không đổi) vẫn chưa có nguồn sinh lý trong bảng nguồn (check 17/09 gợi ý NIDCD); s3 (Cullen 2012) chưa được mở để đỡ đoạn tiền đình.

### newton-da-giai-ma-the-gioi-nhu-the-nao

- - 2026-09-25 | newton-da-giai-ma-the-gioi-nhu-the-nao | Bản en: gỡ các đoạn không có ở vi (Halley trả tiền in Principia, dạng động lượng của định luật II và ví dụ tên lửa, đơn vị newton/joule, cánh máy bay, Sao Hải Vương 1846, 'GPS cần tính tương đối hẹp') → dịch lại toàn bài từ vi hiện tại; câu kết bỏ 'toàn bộ' nền vật lý hiện đại | Đối chiếu song ngữ 25/09; Sao Hải Vương không có nguồn trong bảng; câu GPS thiếu tương đối rộng
- **Còn nợ:** Vi trình bày F = ma như chính định luật II, không nói đó là trường hợp khối lượng không đổi (dạng chặt: lực = tốc độ biến thiên động lượng, NASA [s1]). Theo quy tắc 4 nên thêm một câu nói rõ phép đơn giản này mất thông tin; bản en cũ có sẵn nội dung có nguồn để chuyển sang vi qua lượt duyệt riêng.
- **Còn nợ:** Vi câu kết 'đặt nền móng cho toàn bộ nền vật lý hiện đại' là nói quá; en đã bỏ 'toàn bộ'. Vi nên sửa tương ứng (ngoài phạm vi việc này).
- **Còn nợ:** Bản en cũ có nhiều nội dung có nguồn bậc 2 (Royal Society/Halley [s7], NIST newton [s5], NASA Glenn định luật III [s3]) mà vi đã rút gọn mất. Muốn giữ độ sâu này thì đưa vào vi trước rồi dịch — không để en đi trước vi.

### nguyen-tu-cau-tao-nen-van-vat

- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | contentEn/summaryEn là bản dài cũ (hằng số CODATA, độ phổ biến và bán rã đồng vị, NUBASE 3.340 nuclide, 12,098940 u / 0,82%, năng lượng liên kết/nucleon, claim Permi 8–10 °C), lệch cấu trúc với vi đã rút gọn → en dịch lại từ vi hiện tại, không chép bốn chỗ vi sai hoặc mất mát: s/p/d/f là phân lớp (vi: 'lớp'); tỉ số khối lượng ~1.840 (vi: 'khoảng 2.000'); 'mọi vật chất thông thường' (vi: 'mọi vật chất'); hụt khối 'tương ứng' năng lượng liên kết (vi: 'chuyển hoá thành') | CODATA 2022 m_p/m_e, m_n/m_e (physics.nist.gov, mở 25/09); NIST Atomic Spectroscopy (s4)
- **Còn nợ:** vi 'Lớp s, p, d, f' sai thuật ngữ: s/p/d/f là phân lớp (subshell); lớp (shell) đánh theo n (NIST s4, như en cũ). Mức S3 vì để lại mô hình sai. Đề nghị đính chính vi: 'Các electron sắp xếp theo lớp, mỗi lớp chia thành các phân lớp s, p, d, f'.
- **Còn nợ:** vi 'lớn hơn electron khoảng 2.000 lần': CODATA 2022 (mở 25/09) cho 1836,15 (proton) và 1838,68 (neutron). Đề nghị vi viết 'khoảng 1.840 lần' để hai bản cùng con số.
- **Còn nợ:** vi 'khối lượng mất đi đã được chuyển hóa thành năng lượng liên kết ..., giúp giữ' và 'mỗi hạt nhân đều chứa một lượng năng lượng liên kết' gợi ý năng lượng liên kết là thứ được cất trong hạt nhân; thật ra đó là năng lượng đã toả ra khi hạt nhân hình thành. Đề nghị vi viết lại như en mới.
- **Còn nợ:** vi 'tạo nên mọi vật chất trong vũ trụ' mâu thuẫn với bài vật chất tối của kho. Đề nghị 'mọi vật chất thông thường'.
- **Còn nợ:** vi rút gọn mất toàn bộ số liệu có nguồn và mọi trích dẫn trong thân bài; corrections.md không có dòng cho lần rút gọn này. Bảng nguồn 10 mục (NUBASE2020, CIAAW, bán kính điện tích…) giờ hầu như không đỡ claim nào trong cả hai bản.

### sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc

- 2026-09-25 · `sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc` (en) — bản en còn "22 km, gần gấp ba Everest" → 21,9 km so với mốc chuẩn, khoảng 2,5 lần (s2); "Phobos, Deimos likely captured asteroids" → nguồn gốc chưa ngã ngũ, MMX phân xử (s3, s4); Valles Marineris 4.000 km/7 km → 3.870 km/9,3 km (NASA Mars Facts, vi còn sai).
- **Còn nợ:** Bản vi còn Valles Marineris "dài 4.000 km, sâu tới 7 km" — NASA Mars Facts (đã mở lượt này) ghi 3.870 km, sâu 9,3 km (check 17/09 đã nêu). Cần sửa vi và thêm NASA Mars Facts vào bảng nguồn.
- **Còn nợ:** Check 17/09 còn nợ nguồn cho MAVEN, băng ở vĩ độ trung bình, đất sét/sulfat — chung cho cả hai bản, ngoài phạm vi đối chiếu.

### sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he

- - 2026-09-25 | sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he | EN chưa từng nhận các sửa 17/09: summaryEn "at least 350 years old", "magnetic field … 20,000 times that of Earth", Galileo "about 150 km", gió "about 430 km/h", "40,000 km … today", "directly refuted the geocentric model", "astronomers consider these two different vortices", Europa không dè dặt → en mang cùng claim với vi: theo dõi từ ~1831; mômen từ ~20.000 lần / cường độ ~16–54 lần; ~200 km; >640 km/h (Hubble 2009–2020); 39.000 km (1879) → ~14.000 km (công bố 2024); Horner & Jones 2008 | Sánchez-Lavega 2024 doi 10.1029/2024GL108993; NASA Jupiter Facts; NASA Galileo; ESA/Hubble heic2110; Horner & Jones 2008 doi 10.1017/s1473550408004187; NASA Ganymede
- **Còn nợ:** BẢN VI: seoDescription vẫn ghi "với cơn bão Vết Đỏ Lớn đã tồn tại ít nhất 350 năm" — đúng claim S2 đã bị bác ở summary 17/09. Ngoài phạm vi en; cần sửa vi seoDescription và ghi corrections.md.
- **Còn nợ:** BẢN VI (S4): câu Ganymede "là vệ tinh được biết tới là có từ trường riêng" đã rơi mất "duy nhất" khi áp fix 17/09 (fix yêu cầu THÊM 'được biết tới', không bỏ 'duy nhất'). NASA Ganymede (mở 25/09): "the only moon known to have its own magnetic field". Đề nghị vi: "và là vệ tinh duy nhất được biết tới có từ trường riêng".
- **Còn nợ:** Tiêu đề vi/en vẫn khẳng định "tấm khiên" / "shields the system" trong khi thân bài nói giả thuyết còn tranh cãi (C-16, 17/09, chưa có người quyết). titleEn giữ nguyên vì phản ánh đúng tiêu đề vi; đổi tiêu đề thì đổi cả hai cùng lượt.
- **Còn nợ:** "16–54 lần" là số của NASA Jupiter Facts (không phân biệt 'ở bề mặt'); bản vi thêm 'ở bề mặt'. Fact Sheet: 4–13 G bề mặt so với ~0,25–0,65 G của Trái Đất — cùng cỡ. En theo vi; không coi là lỗi.

### song-truyen-nang-luong-nhu-the-nao

- - 2026-09-25 | song-truyen-nang-luong-nhu-the-nao | contentEn/summaryEn là bản dài cũ (định nghĩa SI qua tần số Cs và c; ví dụ số FM / 550 nm / 340 m/s; vùng bóng 104–140°; GW150914), lệch cấu trúc với vi đã rút gọn → en dịch lại từ vi hiện tại; giữ ý tán sắc (bước sóng khác nhau lệch góc khác nhau) trong câu cầu vồng/lăng kính | NASA Wave Behaviors (s5, mở 25/09)
- **Còn nợ:** vi 'Khúc xạ ... là nguyên nhân tạo nên cầu vồng và lăng kính' bỏ mất tán sắc. s5 NASA: các bước sóng bị làm chậm khác nhau nên lệch góc khác nhau. en mới giữ ý này. Đề nghị vi thêm một câu tương ứng.
- **Còn nợ:** vi đã rút gọn mạnh: mất mọi trích dẫn trong thân bài, dù bảng có 15 nguồn. corrections.md không có dòng nào cho bài này. Cần xác nhận lần rút gọn là biên tập có chủ ý. Nhiều mục trong bảng nguồn giờ không còn đỡ claim nào trong cả hai bản (s1–s3, s8, s9, s11, s14, s15).
- **Còn nợ:** Đoạn khép của vi ('mọi loại sóng') mâu thuẫn nhẹ với câu 'mối liên hệ cơ bản của mọi sóng tuần hoàn' trong chính bài. Đề nghị vi viết 'mọi sóng tuần hoàn'.

### su-ra-doi-cua-he-mat-troi

- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản en: 'Sun holds 99.86% of the mass but about 1% of the angular momentum' (thân bài + summaryEn) → 'more than 99% of the mass', 'a very small fraction of its angular momentum' | NASA Solar System Facts ('more than 99%'); 1% không có nguồn bậc 1–2 (check 2026-09-17 C-2, C-3)
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản en: di cư hành tinh xếp là cơ chế thứ ba giải bài toán động lượng góc, 'the current model solves this' → phanh từ tính và gió Mặt Trời là cơ chế 'được đề xuất'; di cư tách mục riêng, nói rõ không làm Mặt Trời quay chậm | check 2026-09-17 C-11
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản en: gỡ claim không nguồn — Kant 1755/Laplace 1796/Chamberlin–Moulton/Jeans–Jeffreys 1918, James Webb, 'gaps swept clean', đường tuyết trong vành tiểu hành tinh, ngưỡng lõi ~10 M⊕, 'Jupiter alone', Grand Tack, hành tinh bị hất ra, 'super-Earths most common', 'over millions of years' | Bảng nguồn không đỡ; ALMA/HL Tau giữ theo ALMA Partnership 2015 ('bright and dark rings')
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản en: 'over 6,000 exoplanets' → thêm '(NASA count, as of September 2026)'; 'the general mechanisms are correct' → 'the same physical processes can produce very different outcomes'; đường tuyết → đường tuyết của nước | NASA Exoplanets; check 2026-09-17 C-9, C-13, C-15
- **Còn nợ:** Bản vi hiện tại VẪN mang các lỗi check 2026-09-17 đã chỉ ra: 99,86%, 'khoảng 1%', 'đặc biệt là Sao Mộc', di cư hành tinh là cơ chế thứ ba (S2), 'quy luật hình thành hành tinh là phổ quát', James Webb không nguồn, 'hàng triệu năm', 'một số hành tinh sơ khai bị hất ra', thiếu mốc thời gian cho 6.000, emoji. factCheck=REVISE là đúng. Bản en giờ đi TRƯỚC vi — lượt sửa vi nên chép theo en này, không ngược lại.
- **Còn nợ:** Bản vi đã mất khối ghi công VACA mà en còn giữ. Check 2026-09-05 yêu cầu không gỡ ghi công; cần khôi phục ở vi (nếu vi vẫn là tác phẩm phái sinh của VACA).
- **Còn nợ:** C-11 (di cư không giải bài toán động lượng góc) vẫn dựa trên lập luận vật lý, chưa mở được review bậc 1 — như check 09-17 đã ghi. en đã viết theo hướng an toàn; cần đóng câu hỏi khi sửa vi.

### tai-sao-pluto-khong-con-la-hanh-tinh

- (en) điều kiện 2 "enough mass for its gravity to pull it into a nearly spherical shape" → "self-gravity to overcome rigid-body forces … hydrostatic equilibrium (a nearly round shape)" — căn cứ: IAU 2006 Resolution B5 (nguồn s2).
- (en) "Earth is 1.7 million times more massive than the sum of all other bodies in its orbital zone" → bỏ số, giữ ý định tính theo chỉ số của Soter (2006) — căn cứ: số không có nguồn đã kiểm (check 2026-09-17), bản vi đã cắt.
- (en) hành tinh lùn "bodies that satisfy the first two conditions" → đủ bốn điều kiện (a)–(d) của IAU B5(2) — căn cứ: IAU 2006 (nguồn s2).
- (en) "Earth itself, if placed in Pluto's orbit, would not be able to clear its neighborhood" (viết như sự thật) → quy kết cho lập luận của phía phản đối — căn cứ: check 2026-09-17.
- (en) "nearly 5 billion km from the Sun" → "an average distance of about 5.9 billion km" — căn cứ: NASA Science, Pluto: Facts (nguồn s3).
- **Còn nợ:** Cả hai bản vẫn gọi Eris là "thiên thể vành đai Kuiper" (check 2026-09-17: Eris thuộc đĩa phân tán, nên viết "thiên thể ngoài Sao Hải Vương") và vẫn chưa ghi mốc "(tính tới 9/2026)" cho năm hành tinh lùn. Không phải lệch song ngữ; để lượt đính chính vi rồi đồng bộ sang en.
- **Còn nợ:** Bản en để nguyên tiêu đề tiếng Việt cho 2/3 link Đọc thêm (Sao Thổ, Sao Mộc) — không phải claim, chuyển translation/seo-expert.

### thien-ha-dinh-nghia-va-cach-phan-loai

- - 2026-09-25 | thien-ha-dinh-nghia-va-cach-phan-loai | EN chưa từng nhận các sửa 17/09: "millions to hundreds of billions of stars", "approximately 105,000 light-years", dwarf "few thousand"/giant "hundreds of thousands" ly, và "about 50% … in 7 to 8 billion years" trình bày như kết luận; summaryEn "hundreds of billions more" không nguồn → en mang cùng claim với vi: vài nghìn–nghìn tỷ sao; >100.000 ly; vài trăm ly–>1 triệu ly; Sawala 2025 (~50% trong 10 tỷ năm) và Wu 2026 (90%, 6,5 +1,3/−1,5 tỷ năm, 2σ 64,7–100%) đặt cạnh nhau | NASA Galaxies; Sawala 2025 doi 10.1038/s41550-025-02563-1; Wu 2026 doi 10.3847/2041-8213/ae5799; Cox & Loeb 2008 doi 10.1111/j.1365-2966.2008.13048.x
- **Còn nợ:** Cả vi lẫn en vẫn xếp Mây Magellan Lớn là thiên hà không định hình — câu hỏi mở từ 17/09 (có thể là xoắn ốc Magellan, SBm) chưa được đóng. Không đổi ở lượt đồng bộ này.

### thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi

- (en) "reconstructed all of mechanics from two postulates" → "rebuilt the kinematics of motion" — căn cứ: bản vi đã đính chính (check 2026-09-17, C-1).
- (en) E = mc² không ghi nguồn gốc → thêm câu: hệ quả này nằm ở bài thứ hai tháng 9/1905, Annalen der Physik 323 — căn cứ: doi 10.1002/andp.19053231314 (check 2026-09-17, C-2).
- (en) "positioning errors would accumulate by about 10 km per day" → "a timing error equivalent to about 11 km of light-travel distance every day"; thêm độ lệch tần số 4,4647 × 10⁻¹⁰ ≈ 38,6 μs/ngày của Ashby và ghi rõ cách tách 7/45 μs là của tài liệu giảng dạy (Pogge) — căn cứ: Ashby 2003, doi 10.12942/lrr-2003-1; Pogge, Ohio State (check 2026-09-17, C-4, C-5).
- (en) muon "lifespan is too short to reach the ground" → "most of them should decay before reaching the ground" — căn cứ: bản vi đã đính chính (check 2026-09-17, C-6).
- **Còn nợ:** Bản vi viết "4,4647 × 10−10" (dấu trừ thường, không mũ) — nên là 4,4647 × 10⁻¹⁰. Lỗi định dạng, không đổi nghĩa; bản en đã viết đúng. Sửa ở lượt đính chính vi.
- **Còn nợ:** Đoạn muon ở cả hai bản vẫn chưa trích nguồn thực nghiệm trong câu dù s3 (Frisch & Smith 1963) đã có trong bảng nguồn — check 2026-09-17 C-6 ghi là chưa mở được trang AIP/OSTI. Lượt đối chiếu này không mở lại.

### toan-canh-dac-diem-8-hanh-tinh-he-mat-troi

- - 2026-09-25 | toan-canh-dac-diem-8-hanh-tinh-he-mat-troi | EN chưa từng nhận các sửa 17/09: số vệ tinh 95/146/28 "officially named as of 2024", "mythological order … consistent with the order in which they were discovered", "each name is tied to an observable characteristic", Hành tinh thứ chín không nêu tranh cãi → en mang cùng claim với vi: 115/293/29/16 vệ tinh xác nhận theo NASA 8/2026; phả hệ thần thoại là trùng hợp tên gọi, Thiên Vương là hành tinh đầu tiên tìm bằng kính thiên văn (1781); giả thuyết Batygin & Brown 2016 còn tranh cãi; hành tinh lùn có mốc 9/2026 | NASA Jupiter/Saturn/Uranus Moons (8/2026); NASA Planetary Fact Sheet; IAU Resolution 5A 2006; Batygin & Brown 2016 doi 10.3847/0004-6256/151/2/22
- **Còn nợ:** Câu "128 vệ tinh … tháng 3/2025" (vi, nay cả en) vẫn chưa có nguồn trong bảng nguồn (check 17/09: partially-supported). Nên gắn thông báo MPC hoặc NASA về đợt công bố; nếu không gắn được thì cắt ở cả hai bản cùng lượt.
- **Còn nợ:** Câu tranh cãi về Hành tinh thứ chín và câu 'đường tuyết … không phải trùng hợp' (vi, nay cả en) chưa có nguồn bậc 1–2 trong bảng; check 17/09 đề nghị hạ mức khẳng định về đường tuyết. Ngoài phạm vi đồng bộ; nếu sửa vi thì sửa en cùng lượt.

### tu-electron-den-dong-dien-nguon-goc-cua-dien-nang

- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | Bản en: dịch lại toàn bài từ vi hiện tại — gỡ phần không có ở vi (lực 2 × 10⁻⁷ N/m, cân Kibble, 'Franklin guessed wrong', 120 V/15 A, trích Neuroscience/Hodgkin–Huxley); 'một lượng điện tích rất nhỏ đã đủ tạo dòng điện' → 'mỗi electron mang điện tích rất nhỏ, dòng điện hằng ngày gồm số rất lớn electron'; cực quang: hạt được từ trường dẫn vào thượng tầng khí quyển rồi va chạm với khí | Đối chiếu song ngữ 25/09; 1 C ≈ 6,24 × 10¹⁸ e (NIST CODATA [s3])
- **Còn nợ:** Vi 'chỉ một lượng điện tích rất nhỏ của electron đã đủ tạo nên những dòng điện quen thuộc' ngược với chính con số ngay trên nó (1 C ≈ 6,24 × 10¹⁸ e): dòng 1 A cần hàng tỉ tỉ electron mỗi giây. Nên sửa vi theo en mới.
- **Còn nợ:** Vi 'va chạm với từ trường và khí quyển' — nên đổi thành 'được từ trường dẫn xuống vùng cực và va chạm với khí quyển'.

### van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao

- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | EN chưa từng nhận đính chính S1 13/09: vẫn ghi "about 5–8 mmHg … equivalent to some monotherapies" và không có mục không-bỏ-thuốc/dấu hiệu cảnh báo → en mang số theo phân nhóm của nguồn (8,3 [6,0–10,7]/5,2 mmHg ở người tăng huyết áp; ~0,75 mmHg, CI chứa 0, ở người huyết áp bình thường), bỏ phép so với thuốc, thêm mục "Exercise does not replace the medication you take" và danh sách dấu hiệu cần ngừng tập | Cornelissen & Smart 2013, doi 10.1161/JAHA.112.004473 (tóm tắt đọc qua Europe PMC, PMC3603230)
- **Còn nợ:** BẢN VI SAI (S2, do chính lượt đính chính 13/09 đưa vào): "Ở người huyết áp bình thường, mức giảm nhỏ hơn hẳn — 3,5 mmHg tâm thu." Tóm tắt Cornelissen & Smart 2013 (Europe PMC, PMID 23525435): −3,5 mmHg [−4,6; −2,3] là hiệu ứng GỘP của tập bền bỉ trên mọi người tham gia; nhóm huyết áp bình thường là −0,75 [−2,2; +0,69] mmHg (khoảng tin cậy chứa 0), nhóm tiền tăng huyết áp −2,1 [−3,3; −0,83]. Đề nghị sửa vi thành "khoảng 0,75 mmHg tâm thu, khoảng tin cậy chứa 0" (đúng như en mới), ghi corrections.md. En đã được viết theo số đúng.
- **Còn nợ:** BẢN VI tự mâu thuẫn với đính chính 13/09: corrections.md ghi "bỏ hẳn phép so với thuốc", nhưng mục mới lại mở bằng "Mức hạ huyết áp nhờ tập luyện có thể sánh với một thuốc hạ áp đơn trị" — không nguồn nào trong bảng đỡ phép so này. En mới không chép phép so ("Because regular training can lower blood pressure, some people start thinking about stopping their medication"). Đề nghị sửa vi tương tự.
- **Còn nợ:** Câu "ngừng thuốc hạ áp đột ngột có thể làm huyết áp bật lên… tăng nguy cơ đột quỵ" và "các khuyến cáo điều trị xếp vận động là biện pháp đi kèm thuốc" không có nguồn trong bảng 5 nguồn (cả vi lẫn en). Nội dung an toàn, giữ; nên gắn một hướng dẫn điều trị tăng huyết áp (ESC/ESH 2023 hoặc ACC/AHA 2017) ở lượt sau.

## 2026-09-25 — đính chính bản vi (sau lượt đồng bộ song ngữ)

Thẩm định + kế hoạch: `docs/content/checks/2026-09-25/vi-fix/`.
Script: `scripts/apply-vi-fix-2026-09-25.ts`. Bài PASSED mà verdict revise bị gỡ dấu duyệt; bản trước
sửa của cả hai được chụp vào `Revision` trong cùng transaction.

### bi-mat-dang-sau-cam-giac-nang-va-nhe — PASSED

- - 2026-09-25 | bi-mat-dang-sau-cam-giac-nang-va-nhe | (vi) thiết bị vài tấn ở ISS 'có thể trôi đi khá dễ dàng' → 'một cú đẩy có thể làm nó trôi đi ... nhưng vì khối lượng lớn, nó chỉ tăng tốc chậm'; 'nặng 60 kg' / 'nặng vài tấn' / 'thiết bị nặng hàng tấn' → 'có khối lượng ...' (tiêu đề mục đổi ở cả en) | NASA Glenn Newton's laws [s8]; NASA What is Microgravity [s11]
- - 2026-09-25 | bi-mat-dang-sau-cam-giac-nang-va-nhe | (vi + en) 'mọi thí nghiệm ... đều cho thấy khối lượng quán tính = khối lượng hấp dẫn' → 'chưa tìm thấy khác biệt nào, trong giới hạn cực kỳ chặt: MICROSCOPE 2022 không phát hiện vi phạm ở độ chính xác cỡ 10⁻¹⁵'; 'vì sao bằng nhau là một trong những câu hỏi sâu sắc nhất' → Thuyết Tương đối Tổng quát chưa được coi là hoàn chỉnh (chưa hợp nhất với cơ học lượng tử); một số lý thuyết mở rộng dự đoán vi phạm cực nhỏ | MICROSCOPE, PRL 129, 121102 (2022), doi 10.1103/PhysRevLett.129.121102
- - 2026-09-25 | bi-mat-dang-sau-cam-giac-nang-va-nhe | (vi + en) 'một trong những hiểu lầm phổ biến nhất' → 'một hiểu lầm phổ biến'; tốc độ ISS 'khoảng 7,7 km/s' → 'khoảng 28.000 km/h (gần 7,8 km/s)'; thêm nguồn NSSDC Moon Fact Sheet cho g Mặt Trăng 1,62 m/s² | NASA What is Microgravity [s11]; NSSDC Moon Fact Sheet (mở 25/09)

### co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho — PASSED

- 2026-09-25 · `co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru` (vi + en) — cắt "điểm sôi ~46°C, máu không sôi chừng nào tim còn đập" (vi) → huyết áp giữ máu lúc đầu nhưng hơi nước vẫn hình thành chậm hơn trong máu tĩnh mạch, tuần hoàn gần như ngừng trong ~1 phút; "gần như chắc chắn tử vong" + thuyên tắc khí (vi) → "có thể tổn thương phổi nặng hoặc tử vong"; 10–15 giây → có lẽ 9–11 giây (cả hai bản); +120/−150°C "vỏ tàu" → −157…121°C là môi trường đi bộ ngoài không gian; "da hơi mát" → miệng, mũi lạnh gần đóng băng; bỏ nước mắt, tầng ozone, tia X; mốc cứu sống "dưới 1 phút, không tổn thương nghiêm trọng" → 60–90 giây, dữ liệu động vật, không bảo đảm; "tử vong thường trong 1–2 phút"/"vài phút" → có lẽ 1–2 phút, NASA: gây tử vong nếu quá 60–90 giây. Căn cứ: NASA SP-3006 (NTRS 19730006364), NASA Imagine, Murray 2013 (doi 10.3357/ASEM.3468.2013), NASA Spacewalk Spacesuit Basics, NASA Why Space Radiation Matters.
- **Còn nợ:** Năm sự cố buồng chân không: NASA Imagine ghi '65; bài giữ "giữa thập niên 1960" — không ghi năm hay tên người cho tới khi có hồ sơ gốc NASA JSC.
- **Còn nợ:** Trang NASA Imagine tự ghi là tổng hợp từ một trang y khoa JSC đã gỡ và thư bạn đọc; trong bài chỉ dùng kèm SP-3006, không làm nguồn duy nhất cho claim nào ngoài sự cố Houston và câu nước bọt.

### crispr-cay-keo-phan-tu-den-tu-vi-khuan — PASSED

- 2026-09-25 · `crispr-cay-keo-phan-tu-den-tu-vi-khuan` (vi + en) — "muốn cắt ở đâu chỉ cần tổng hợp RNA 20 nucleotide" → Cas9 chỉ cắt khi cạnh đích có PAM (NGG với SpCas9); đột phá 2012 quy về nhóm Jinek do Doudna và Charpentier dẫn dắt; NHEJ bỏ "nhanh", HDR thêm tần suất thấp, chỉ ở tế bào phân chia; Casgevy thêm điều kiện chỉ định (≥12 tuổi, thalassemia phụ thuộc truyền máu, cơn tắc mạch tái diễn); He Jiankui: ba trẻ, án 3 năm tù tháng 12/2019; "cấm hoặc hạn chế ở hầu hết các nước" → khảo sát 106 nước năm 2020 (75 cấm chỉnh sửa di truyền được, không nước nào cho phép); summary bỏ "rẻ và nhanh"; nguồn Jinek 2012 bổ sung doi 10.1126/science.1225829. Căn cứ: Jinek 2012, Barrangou 2007, Ran 2013, NobelPrize.org, MHRA, FDA, Baylis 2020, Alonso & Savulescu 2021, Zou 2025.

### dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu — PASSED

- 2026-09-25 · `dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu` (vi + en) — "chuyển động quay của hệ Trái Đất–Mặt Trăng tạo ra lực quán tính" → hấp dẫn thắng ở phía gần, quán tính thắng ở phía xa, nêu rõ là mô hình giản lược; thêm lực tạo triều Mặt Trời ≈ ½ Mặt Trăng; "phần lớn nơi trên thế giới" → phần lớn vùng ven biển, thêm bán nhật triều hỗn hợp; gió: gọi tên Coriolis, thêm vế ma sát gần mặt đất; "thủy triều là động lực chính của dòng ven bờ" → dòng triều ở sông ven biển, cửa sông; "gió là động lực quan trọng nhất ở quy mô đại dương" → của hải lưu MẶT (~100 m trên cùng), bỏ "gió mùa"; tách hoàn lưu nhiệt muối cho dòng sâu; summary/SEO bỏ "tác động mạnh mẽ đến khí hậu, thời tiết, hệ sinh thái biển" (không nguồn). Căn cứ: NOAA NOS (tides02, tides03, tides05, tides07, currents 02tidal1, 04currents1, 04currents2, 05conveyor1), NOAA JetStream (Origin of Wind, Global Atmospheric Circulations), NWS Glossary.

### nang-luong-la-gi — PASSED

- - 2026-09-25 | nang-luong-la-gi | vi: "Năng lượng không tự sinh ra cũng không tự mất đi" (không phạm vi) → "Trong một hệ cô lập, …" (cả summary); định nghĩa "đại lượng đo khả năng … thực hiện công" → nói rõ là mô tả dễ dùng, không phải định nghĩa chặt | NASA Glenn Conservation of Energy, Second Law (s6, s7); EIA What is energy (s4), mở 25/09
- - 2026-09-25 | nang-luong-la-gi | vi+en: E = mc² "khối lượng và năng lượng là hai biểu hiện của cùng một đại lượng" → "năng lượng đổi E thì khối lượng đổi E/c²"; vì c² rất lớn nên khối lượng rất nhỏ tương ứng năng lượng rất lớn | NRC glossary Mass-energy equation (s8, đọc qua Wayback 2025-04-29 vì trang trả 403)
- - 2026-09-25 | nang-luong-la-gi | vi+en: "Điện năng vận hành hầu hết thiết bị hiện đại", "nguồn năng lượng của Mặt Trời và nhà máy điện hạt nhân", ví dụ quang hợp và ma sát (không nguồn) → electron mang điện năng trong dây dẫn, tia sét; Mặt Trời dùng tổng hợp, nhà máy dùng phân hạch; ba ví dụ chuyển hoá của EIA (thức ăn → vận động, xăng → nhiệt, xe đạp xuống dốc) | EIA Forms of energy (s5), EIA Nuclear explained (thêm mới)
- **Còn nợ:** Ví dụ quang hợp (ánh sáng Mặt Trời → hoá năng trong cây) và ma sát (động năng → nhiệt năng) đúng nhưng đã bị thay vì không mở được nguồn trong bảng nói ra. Muốn đưa lại thì thêm một nguồn bậc 1–2 (vd. trang photosynthesis của NASA/EIA đọc được) trước.
- **Còn nợ:** s8 (NRC) trả 403 với mọi yêu cầu không phải trình duyệt; isAlive() có thể báo chết giả. Nội dung đọc qua Wayback ngày 2025-04-29.
- **Còn nợ:** Câu hỏi của lượt đối chiếu song ngữ về dòng dẫn nguồn cuối bài và về dòng nhật ký cho lần rút gọn bản vi trước đây vẫn thuộc content-curator, không phải claim.

### neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc — PASSED

- 2026-09-25 · `neu-trai-dat-dang-quay` (vi + en) — "cơ thể chỉ nhận ra sự thay đổi vận tốc, không nhận ra vận tốc đều" (vi) → người đứng trên Trái Đất luôn có gia tốc hướng tâm, nhưng nó nhỏ (≈0,034 m/s², 0,35% g) và không đổi nên hoà vào cảm giác trọng lượng; tách vai trò ống bán khuyên/sỏi tai; cắt "900 km/h" (vi) và phép so "nhanh hơn máy bay chở khách" ở summary (vi+en); bỏ "đã chuyển động từ khi sinh ra nên không cảm nhận" (cả hai bản); ghi phép tính 1.670 km/h và 0,35%. Căn cứ: NASA NSSDC Earth Fact Sheet, NASA Glenn, NIDCD Balance Disorders, Caltech IPAC Cool Cosmos.

### newton-da-giai-ma-the-gioi-nhu-the-nao — PASSED

- - 2026-09-25 | newton-da-giai-ma-the-gioi-nhu-the-nao | vi+en: "Newton chứng minh được vì sao các hành tinh phải chuyển động đúng như Kepler đã quan sát" → thuyết hấp dẫn giải thích lực còn thiếu sau định luật thứ ba của Kepler và cho dạng tổng quát của nó (dùng đo khối lượng thiên thể); "gần lỗ đen" (không nguồn) → vận tốc cỡ một phần đáng kể tốc độ ánh sáng, và GPS/quỹ đạo tàu vũ trụ đã cần hiệu chỉnh tương đối | NASA Orbits and Kepler's Laws (s6), NASA Basics of Space Flight ch.3 (s1), mở 25/09
- - 2026-09-25 | newton-da-giai-ma-the-gioi-nhu-the-nao | vi+en: định luật I "không cần lực để duy trì chuyển động" → không cần lực TỔNG HỢP (máy bay bay đều vẫn cần lực đẩy để cân bằng lực cản); định luật II thêm "tổng hợp", bỏ "nổi tiếng nhất", nói rõ F = ma là trường hợp khối lượng không đổi của dạng động lượng; định luật III thêm hai lực đặt lên hai vật khác nhau | NASA Glenn First Law (s2), Third Law (s3); NASA Basics of Space Flight ch.3 (s1)
- - 2026-09-25 | newton-da-giai-ma-the-gioi-nhu-the-nao | vi+en+summary: danh sách ứng dụng không nguồn (cầu đường, mô phỏng kỹ thuật) → điều hướng tàu vũ trụ, máy bay, đo khối lượng thiên thể; câu kết "chi phối mọi vật thể … toàn bộ nền vật lý hiện đại" và summary "mọi vật thể có khối lượng trong vũ trụ" → cùng một bộ quy luật cho quả táo và hành tinh, Principia 1687 | NASA (s1, s2, s3, s6); Royal Society 2012 (s7)
- **Còn nợ:** Nguồn s1 (NASA Basics of Space Flight ch.3) ghi Principia 'published in 1685', NASA Glenn s2/s3 ghi 'presented ... in 1686'; Royal Society s7 ghi in năm 1687. Bài dùng 1687 theo Royal Society (nơi giữ bản thảo) — đúng. Không trích năm từ s1/s2/s3.
- **Còn nợ:** Giới hạn áp dụng thứ hai (vật phải lớn hơn cỡ phân tử, ~10⁻⁹ m — F3 ngày 12/09) chưa đưa vào vì nguồn đỡ nó (OpenStax) không nằm trong bảng của bài; muốn thêm thì thêm nguồn trước.
- **Còn nợ:** s5 (NIST SP 330, đơn vị newton) không còn đỡ claim nào ở cả hai bản.

### nguyen-tu-cau-tao-nen-van-vat — PASSED

- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | (vi) 'lớn hơn electron khoảng 2.000 lần' → 'khoảng 1.840 lần' | CODATA 2022 m_p/m_e = 1836,15, m_n/m_e = 1838,68 (physics.nist.gov, mở 25/09)
- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | (vi) 'Lớp s, p, d, f' → lớp chia thành các phân lớp s, p, d, f; 'quyết định tính chất hóa học' → 'quyết định nhiều tính chất hóa học' (vi + en) | NIST Atomic Spectroscopy [s4]; OpenStax Chemistry §6.4
- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | (vi) 'khối lượng mất đi đã được chuyển hóa thành năng lượng liên kết, giúp giữ...', 'mỗi hạt nhân chứa năng lượng liên kết', 'một phần năng lượng liên kết được giải phóng' → hụt khối tương ứng năng lượng liên kết (toả ra khi hình thành, phải cấp vào để tách); nhiệt hạch/phân hạch toả năng lượng vì sản phẩm liên kết chặt hơn | NRC Glossary 'Binding energy'; IAEA Live Chart B/A ⁴He, ¹²C, ⁵⁶Fe, ²³⁵U
- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | (vi + en) cắt 'vụ nổ hạt nhân mạnh nhất từng được con người tạo ra' — không mở được nguồn đỡ | quy tắc 'khi nghi thì cắt'
- - 2026-09-25 | nguyen-tu-cau-tao-nen-van-vat | (vi) 'tạo nên mọi vật chất trong vũ trụ ... những hạt cơ bản này' → 'mọi vật chất thông thường ... những hạt này' | NASA Dark Matter; proton/neutron không phải hạt cơ bản
- **Còn nợ:** Bảng nguồn còn các mục không đỡ claim nào trong bản rút gọn (s1, s2 cột mô tả NIST, s3 năng lượng ion hoá, s6 NUBASE2020, s8 bán kính điện tích). Giữ lại vì còn hiệu lực và có thể dùng khi mở rộng bài; không gỡ ở lượt đính chính này.
- **Còn nợ:** Nếu muốn giữ ý 'vũ khí hạt nhân' thì cần một nguồn bậc 2 mở được (vd CTBTO về vụ thử 1961) rồi thêm lại ở CẢ HAI bản.

### song-truyen-nang-luong-nhu-the-nao — PASSED

- - 2026-09-25 | song-truyen-nang-luong-nhu-the-nao | vi: "Khúc xạ … là nguyên nhân tạo nên cầu vồng và lăng kính" → các bước sóng bị làm chậm khác nhau nên lệch góc khác nhau: lăng kính tách màu, và là một phần cơ chế cầu vồng; "mọi loại sóng" → "mọi sóng tuần hoàn" | NASA Wave Behaviors (s5), Basics of Space Flight ch.6 (s7), mở 25/09
- - 2026-09-25 | song-truyen-nang-luong-nhu-the-nao | vi+en: "Biên độ càng lớn, sóng mang càng nhiều năng lượng" (không điều kiện) → với cùng loại sóng, cùng tần số; thêm vế năng lượng còn phụ thuộc tần số (ánh sáng bước sóng ngắn năng lượng lớn); "động đất tạo ra hai loại sóng chính" → hai loại sóng chính truyền trong lòng Trái Đất | NASA Anatomy of an EM Wave (s4), USGS P/S paths (s12, qua Wayback), mở 25/09
- **Còn nợ:** Bảng 15 nguồn nay có nhiều mục không còn đỡ claim nào ở cả hai bản (s1–s3 định nghĩa SI, s6 ánh sáng khả kiến, s9 tốc độ âm, s11 vùng bóng, s14 LIGO, s15 thính giác) — di sản của bản dài cũ. Không sai, nhưng làm bảng nguồn nói nhiều hơn bài; để content-curator quyết giữ hay gỡ.
- **Còn nợ:** Trang USGS (s10, s12) trả 202 kèm trang chặn bot với curl; isAlive() có thể báo chết giả.

### thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi — PASSED

- - 2026-09-25 | thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi | (vi) '4,4647 × 10−10' → '4,4647 × 10⁻¹⁰' (lỗi định dạng) | Ashby 2003, Living Reviews in Relativity 6:1, pt. (35)
- - 2026-09-25 | thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi | (vi + en) đoạn muon 'sinh ra ở tầng cao khí quyển ... phần lớn sẽ phân rã trước khi tới mặt đất, vậy mà vẫn tới' (không trích nguồn) → mô tả thí nghiệm Frisch & Smith 1963: muon ~0,995 c từ đỉnh núi Washington tới mực nước biển, hệ số giãn nở đo được 8,8 ± 0,8 so với 8,4 ± 2 dự đoán | Frisch & Smith, Am. J. Phys. 31, 342 (1963), doi 10.1119/1.1969508 (tóm tắt qua Crossref, mở 25/09)

### tu-electron-den-dong-dien-nguon-goc-cua-dien-nang — PASSED

- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | (vi + en) 'Mọi vật chất đều được cấu tạo từ các hạt mang điện' → 'Vật chất thông thường được cấu tạo từ nguyên tử, và nguyên tử chứa các hạt mang điện' | EIA Nuclear explained (neutron không mang điện); NASA Dark Matter
- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | (vi + en) 'điện tích nhỏ nhất tồn tại độc lập trong tự nhiên' → 'độ lớn điện tích của một electron (hay một proton)' | NIST Ampere: Introduction [s2]
- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | (vi) 'chỉ một lượng điện tích rất nhỏ của electron đã đủ tạo nên những dòng điện quen thuộc' → 'điện tích của một electron rất nhỏ: dòng điện hằng ngày là chuyển động của một số cực lớn electron' | NIST CODATA e [s3]; 1 C ≈ 6,24 × 10¹⁸ e
- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | (vi) cực quang: hạt 'va chạm với từ trường và khí quyển' → 'được từ trường dẫn vào thượng tầng khí quyển gần vùng cực và va chạm với các chất khí ở đó'; 'ampere được định nghĩa là dòng vận chuyển 1 C/s' → 'ampere là dòng vận chuyển 1 C/s' | NASA Solar Storms and Flares [s7]; NASA Auroras; BIPM ampere [s1]
- - 2026-09-25 | tu-electron-den-dong-dien-nguon-goc-cua-dien-nang | thêm nguồn bậc 1 cho đoạn thần kinh (Na⁺, K⁺, Ca²⁺): Ori và cs. 2020, doi 10.1073/pnas.1916514117; Südhof 2012, doi 10.1101/cshperspect.a011353 | tóm tắt qua Europe PMC (mở 25/09)
- **Còn nợ:** Sét: NWS [s5] ghi tia sét điển hình 'about 30,000 Amps'; chú thích ảnh trên trang NIST [s2] ghi 'Typical lightning bolts can carry 100,000 amps or more'. Bài theo NWS (cơ quan chuyên trách, câu chính văn chứ không phải chú thích ảnh). Nếu muốn nêu khoảng dao động dòng đỉnh thì cần nguồn bậc 1 về phân bố dòng sét.
- **Còn nợ:** [s8] Purves NBK10879 (NCBI Bookshelf) bị reCAPTCHA trong lượt này nên không đọc lại; đoạn Na⁺/K⁺/Ca²⁺ nay dựa vào hai nguồn bậc 1 mới thêm.

### van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao — PASSED

- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi+en: "Ở người huyết áp bình thường … 3,5 mmHg tâm thu" (vi) → khoảng 0,75 mmHg, khoảng tin cậy chứa 0; 3,5 là hiệu ứng gộp trên mọi người tham gia | Cornelissen & Smart 2013, doi 10.1161/JAHA.112.004473 (tóm tắt Europe PMC)
- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi: mục "Vận động không thay thế thuốc" mở bằng "có thể sánh với một thuốc hạ áp đơn trị" (phép so đã bị bác 13/09) và dẫn "các khuyến cáo điều trị", "bật lại, tăng nguy cơ đột quỵ" không nguồn → bỏ phép so; lời khuyên không tự bỏ thuốc gắn vào NHLBI (tiếp tục kế hoạch điều trị, lối sống đi cùng thuốc, bác sĩ đổi liều); vế bật lại/đột quỵ cắt ở cả vi lẫn en | NHLBI High Blood Pressure — Treatment, Living With (mở 25/09)
- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi+en: "VO₂max … mạnh hơn cả hút thuốc, tăng huyết áp hay đái tháo đường" (E4 12/09, chưa từng áp) → HR ~5 (thể lực kém nhất so với đỉnh) cạnh HR ~1,4 (hút thuốc, đái tháo đường), nói rõ hai phép so khác loại, kết luận "tương đương hoặc lớn hơn", nhãn nghiên cứu quan sát | Mandsager et al. 2018, doi 10.1001/jamanetworkopen.2018.3605
- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi+en: nhịp tim nghỉ "40–50 so với 60–80 lần/phút" và "từ 300 lên 400 phút lợi ích thêm nhỏ hơn nhiều" không có nguồn → gỡ số; giữ hướng (nhịp nghỉ chậm hơn, cung lượng nghỉ ~5 L/phút) và số của Wen 2011 (≈90 phút/tuần: tử vong thấp hơn 14%; +15 phút/ngày: thêm ~4%), viết dạng tương quan | Lavie et al. 2015, doi 10.1161/CIRCRESAHA.117.305205; Wen et al. 2011, doi 10.1016/S0140-6736(11)60749-6
- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi+en+summary+seoDescription: "thành cơ dày lên vừa phải" / "làm dày thành tâm thất" → buồng thất giãn, khối cơ tăng, độ dày thành thường gần bình thường, mức độ khác nhau giữa từng người; phân biệt với phì đại do tăng huyết áp theo nguồn (cơ tim dày và cứng, khó nạp máu vs chức năng tâm trương bình thường/tốt hơn, thoái lui khi ngừng tập) | Flanagan et al. 2023, doi 10.1186/s44156-023-00027-8; NHLBI Heart Failure — Causes
- - 2026-09-25 | van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao | vi+en: dấu hiệu cảnh báo và đối tượng cần hỏi bác sĩ viết lại theo NHLBI (bỏ "ngất", thêm lưng/vai; báo bác sĩ khi đau ngực/chóng mặt, gọi cấp cứu khi nghi đau tim); "ngắt quãng bằng vài phút đứng dậy" → câu của WHO; lực trượt là "một trong những tín hiệu", không phải tác nhân chính | NHLBI Physical Activity — Risks, Heart Attack — Symptoms; WHO 2020 (Bull et al., PMC7719906); Green et al. 2017, doi 10.1152/physrev.00014.2016
- **Còn nợ:** Nhận định ngừng thuốc hạ áp đột ngột có thể gây huyết áp bật lại (đúng với một số nhóm thuốc) đã bị cắt vì lượt này không mở được nguồn hướng dẫn nói điều đó. Nếu muốn đưa lại, cần một hướng dẫn điều trị (ESC/ESH 2023 hoặc ACC/AHA 2017) đọc toàn văn, và nói rõ nhóm thuốc.
- **Còn nợ:** Trang NHLBI là nguồn Hoa Kỳ: lời khuyên 'gọi cấp cứu' giữ chung, không ghi số 9-1-1. Bản vi nên cân nhắc thêm số cấp cứu 115 của Việt Nam — việc biên tập, không phải claim khoa học.

### big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam — PASSED

- 2026-09-25 · `big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam` (vi + en) — vi "Khoảng 8 tỷ năm nữa Mặt Trời thành sao lùn trắng" → khoảng 5 tỷ năm (NASA Sun: Facts), dòng tương ứng đưa lại vào en; "thiên hà xa nhất cho tới nay là JADES-GS-z14-0" → tính đến 09/2026 là MoM-z14 (z = 14,44, ~280 triệu năm; NASA Webb Early Universe, Naidu 2026), bỏ "thiên hà đầu tiên hình thành ở 300 triệu năm"; cả hai bản: 75/25% ghi "theo khối lượng", lithi-7 lệch (Cyburt 2016); lạm phát ghi là giả thuyết (Planck 2018 X); sao đầu tiên 200 → 150–200 triệu năm (CERN); tuổi 13,797 ± 0,023 tỷ năm theo ΛCDM (Planck 2018) + thêm căng thẳng Hubble 67,4 vs 73,0 km/s/Mpc, ~5σ (Planck 2018; Riess 2022); thành phần 68/27/5 → 68,5/26,4/4,9% (Planck 2018 Bảng 2); 1998 gắn hai nhóm (Riess 1998; Perlmutter 1999); hai mốc xa gắn Adams & Laughlin 1997; "cái chết nhiệt được ủng hộ nhiều nhất" → kịch bản có điều kiện; gỡ nguồn Andromeda không đỡ claim nào.
- **Còn nợ:** Claim kỷ lục thiên hà xa nhất có mốc 09/2026 — kiểm lại 03/2027.
- **Còn nợ:** Nguồn s1 (thienvanvietnam.org, bậc 4) giữ làm tham khảo tiếng Việt; không claim nào dựa riêng vào nó.

### cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru — PASSED

- 2026-09-25 · `cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru` (vi + en) — summary/seoDescription vi "PTA gần đây đã phát hiện… tín hiệu không chỉ từ các cặp lỗ đen mà còn chứa dấu vết sao tối tồn tại hơn 13 tỷ năm trước" → năm 2023 công bố bằng chứng; tín hiệu có thể chủ yếu từ các cặp lỗ đen siêu nặng có hạt giống là sao tối (NANOGrav 2023; Ghodla & Ilie 2026); cả hai bản: nêu điều kiện mật độ hạt giống ~10⁻³ Mpc⁻³; lỗ đen JWST sớm kèm cách giải thích bằng thiên lệch chọn mẫu (Maiolino 2024; Li 2025); sao tối ghi rõ cơ chế hủy cặp vật chất tối, chưa được xác nhận quan sát, ứng viên 2023 (Spolyar 2008; Freese 2023); 10⁴–10⁷ M☉ gắn tiền ấn phẩm arXiv:2511.08578 kèm nhãn; cắt vế "nếu quá ít thì cần cơ chế khác" (không có trong nguồn); câu "mắt xích còn thiếu" gắn nhãn suy diễn; titleEn bỏ dấu chấm cuối.
- **Còn nợ:** arXiv:2511.08578 vẫn là tiền ấn phẩm (tier 3); khi có bản bình duyệt thì cập nhật nguồn và bỏ nhãn.

### kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh — PASSED

- 2026-09-25 · `kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh` (vi + en, cả hai bản đều sai) — "thiên hà hình thành chỉ 300 triệu năm sau Big Bang, sáng và trưởng thành hơn nhiều mô hình" → tính đến 09/2026 thiên hà xa nhất được xác nhận là MoM-z14 (z = 14,44, ~280 triệu năm sau Big Bang; NASA Webb Early Universe; Naidu 2026), số thiên hà sáng nhiều hơn >100 lần mô hình TRƯỚC JWST; "không tên lửa nào chứa nổi gương 6,5 m" → gương rộng hơn chụp mũi Ariane 5 (~5,4 m), cắt "căn chỉnh độ chính xác cỡ nanomet" (không nguồn); CO₂/nước/methane gắn với WASP-39 b/WASP-96 b/K2-18 b; L2 "Mặt Trời, Trái Đất, Mặt Trăng luôn cùng một phía" → tấm chắn che cùng lúc cả ba (NASA Webb Orbit); Webb "thiết kế cho hồng ngoại" → chủ yếu hồng ngoại, 0,6–28,5 µm; bỏ "chưa từng có" ở ảnh Cột trụ Sáng tạo.
- **Còn nợ:** Claim kỷ lục "thiên hà xa nhất được xác nhận" có mốc 09/2026 — đặt lịch kiểm lại mỗi 6 tháng (lần tới 03/2027).
- **Còn nợ:** lastVerifiedAt đang null — script áp phải đặt ngày 2026-09-25.

### neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien — PASSED

- 2026-09-25 · `neu-roi-he-mat-troi-proxima-centauri` (vi, kèm en) — Proxima d "0,26 lần khối lượng Trái Đất… nhiệt độ cân bằng 282 K… khó giữ khí quyển" → khối lượng tối thiểu 0,26, gần sao hơn mép trong vùng sinh sống, nhiệt độ cân bằng có thể tới ~360 K (albedo 0,3), bỏ câu khí quyển (Faria 2022); b "hành tinh đá" → khối lượng tối thiểu ~1 Trái Đất, có thể là đá (NIRPS 2025); c bỏ vế "không nằm trong danh mục NASA"; Starshot 20% c tới Proxima trong 20 năm → ~15% c, bay ngang Alpha Centauri sau hơn 20 năm (breakthroughinitiatives.org); thêm giả định cho thời gian bay; cả hai bản: cắt New Horizons 90.000 năm (không nguồn), Parker 6.700 → 6.600 năm (NASA 430.000 dặm/giờ), sao lùn đỏ 70–75% → ~75% và tuổi thọ "hàng trăm tỷ–nghìn tỷ năm" → hàng nghìn tỷ, tới ~14 nghìn tỷ năm (NASA Star Types), bùng phát "làm suy giảm khí quyển" → theo lời ESO; "gần như chắc chắn là điểm đến đầu tiên" → ứng viên hiển nhiên; summary "ngôi sao gần Trái Đất nhất" → gần nhất ngoài Mặt Trời (ESO eso1629).
- **Còn nợ:** Tiêu đề vi "… Proxima Centauri sẽ là điểm dừng đầu tiên" / en "The First Stop Beyond the Solar System": dự án thật duy nhất (Starshot) là bay ngang, không dừng. Thân bài nay đã nói rõ; đổi tiêu đề kéo theo slug/SEO nên để người quyết (S4).
- **Còn nợ:** Emoji ⭐ ở câu kết (cả hai bản) — quy ước trình bày, không phải claim; chuyển content-curator.

### thien-ha-dinh-nghia-va-cach-phan-loai — PASSED

- 2026-09-25 · `thien-ha-dinh-nghia-va-cach-phan-loai` (vi + en) — Mây Magellan Lớn không còn được gọi thẳng là thiên hà không định hình: SMC là dIrr, LMC là xoắn ốc kiểu Magellan có thanh chắn SB(s)m (SIMBAD), cả hai quay quanh Ngân Hà (Kallivayalil 2013); "hai nhóm đọc cùng số liệu" → cùng khung mô hình, số liệu khác (Wu 2026 dùng chuyển động riêng Gaia mới, đã hiệu chỉnh); lỗ đen siêu khối lượng "thường có" → hầu hết thiên hà lớn; phần phân loại chuyển sang nguồn NASA Galaxy Types: bỏ "hình thành sao mạnh mẽ", elip từ sáp nhập các thiên hà xoắn ốc, thấu kính không có nhánh và bỏ nhân quả "ít khí nên tạo sao thấp", hình dạng không định hình "thường do" → "đôi khi do".
- **Còn nợ:** Nguồn s1 (thienvanvietnam.org, bậc 4) nay không còn là chỗ dựa duy nhất cho claim nào; giữ làm tham khảo tiếng Việt.

### sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc — PASSED

- - 2026-09-25 | sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc | Bản vi: Valles Marineris 'dài 4.000 km, sâu tới 7 km' → 'khoảng 3.870 km, sâu tới khoảng 9,3 km' (en đã sửa trong lượt en-parity) | NASA Mars Facts
- - 2026-09-25 | sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc | Cả hai bản: 'nhỏ → lõi nguội nhanh → từ trường tắt; không còn lá chắn, gió mặt trời bào mòn' → không có từ trường toàn cầu nay, dấu vết từ 4 tỉ năm; mất khí lên không gian 'có thể' góp phần lớn; MAVEN đo mất khí đang diễn ra (ICME 3/2015); 'nước lỏng không còn ổn định … phần thoát, phần đóng băng' → nước nay chủ yếu là băng, thêm hướng 30–99% bị khoá trong khoáng vật vỏ | NASA Mars Facts; Jakosky et al. 2015 doi 10.1126/science.aad0210; Scheller et al. 2021 doi 10.1126/science.abc7717
- - 2026-09-25 | sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc | Cả hai bản: 'khoảng 3,5–4 tỉ năm trước ấm và ẩm' → 'hàng tỉ năm trước ẩm và ấm hơn, khoáng vật do nước chủ yếu trên 3,5 tỉ năm tuổi'; 'châu thổ rõ nhất ở Jezero nơi Perseverance đang hoạt động' → 'nơi Perseverance hạ cánh năm 2021'; 'khoáng vật chỉ hình thành khi có nước' → 'hình thành nhờ nước'; 'băng lộ thiên ở hai cực' → chỏm băng, băng dưới bề mặt vùng cực, băng ngầm >100 m ở vĩ độ trung bình | NASA Mars Facts; NASA Perseverance; Bibring et al. 2006 doi 10.1126/science.1122659; Dundas et al. 2018 doi 10.1126/science.aao1619
- - 2026-09-25 | sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc | Cả hai bản: Olympus Mons '21,9 km so với mốc chuẩn' → '21,9 km theo THEMIS/ASU; tính từ chân tới đỉnh NASA ghi hơn 40 km'; Phobos/Deimos 'tiểu hành tinh nguyên thuỷ' → 'loại D', thêm mốc số vệ tinh 9/2026, tách mục riêng; MMX 'launched' (en) → 'dự kiến phóng 20/10/2026 theo JAXA' | THEMIS/ASU; NASA Mars Facts; Hyodo et al. 2017 doi 10.3847/1538-4357/aa81c4; JAXA MMX
- **Còn nợ:** MMX dự kiến phóng 20/10/2026: kiểm lại bài ngay sau ngày đó (câu 'dự kiến phóng' sẽ lỗi thời).
- **Còn nợ:** Olympus Mons: số 21,9 km là nguồn bậc 3 (ASU/THEMIS); chưa mở được nguồn bậc 1 (dữ liệu MOLA) nêu rõ mốc đo. Số 'hơn 40 km từ chân tới đỉnh' của NASA lớn bất thường so với các ước tính thường gặp — bài chỉ quy kết, không tự khẳng định.
- **Còn nợ:** Tranh luận Sao Hoả cổ 'ấm và ẩm' hay 'lạnh, băng giá với các đợt tan chảy' (check 17/09 C-5) chưa được trình bày; bài theo NASA ('wetter and warmer').

### sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he — REVISE

- - 2026-09-25 | sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he | seoDescription (vi): 'Vết Đỏ Lớn đã tồn tại ít nhất 350 năm' → 'được theo dõi liên tục từ khoảng năm 1831' (sót từ lượt 17/09, summary đã sửa) | Sánchez-Lavega et al. 2024 doi 10.1029/2024GL108993
- - 2026-09-25 | sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he | Cả hai bản: Vết Đỏ Lớn 'từ 39.000 km (1879) xuống khoảng 14.000 km (công bố 2024)' → 'từ 1879 chiều dài đông–tây giảm trung bình ~200 km/năm, tốc độ co tăng gần đây' (hai số không có nguồn bậc 1–2); Callisto 'bề mặt cổ' → 'thiên thể nhiều hố va chạm nhất Hệ Mặt Trời' | Sánchez-Lavega et al. 2024 (arXiv 2406.13222); NASA Callisto
- - 2026-09-25 | sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he | Bản vi: Ganymede 'là vệ tinh được biết tới là có từ trường riêng' → 'là vệ tinh duy nhất được biết tới có từ trường riêng' | NASA Ganymede
- **Còn nợ:** Tiêu đề vi/en và seoTitle/seoDescription vẫn khẳng định 'tấm khiên' / 'shields the system' trong khi thân bài nói giả thuyết còn tranh cãi (Horner & Jones 2008). Không đổi trong lượt này theo chỉ đạo; cần người quyết — nếu đổi thì đổi cả title, titleEn, seoTitle, phần đầu seoDescription cùng lượt (không đổi slug, hoặc đổi kèm 301).
- **Còn nợ:** NASA Jupiter Facts vẫn ghi Vết Đỏ Lớn 'observed for more than 300 years' — mâu thuẫn bài peer-review; bài ưu tiên Sánchez-Lavega 2024 (bậc 1).
- **Còn nợ:** Nguồn s2 (trang Wiley) trả 403 với truy cập tự động; toàn văn tương đương ở arXiv 2406.13222 — cân nhắc thêm URL phụ.

### su-ra-doi-cua-he-mat-troi — PASSED

- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản vi: 'Mặt Trời chứa 99,86% khối lượng nhưng chỉ giữ khoảng 1% động lượng góc … đặc biệt là Sao Mộc' (thân bài + seoDescription) → 'hơn 99% khối lượng', 'một phần rất nhỏ động lượng góc', bỏ 'đặc biệt là Sao Mộc' | NASA Solar System Facts; phép tính từ NASA Sun + Planetary Fact Sheet (Mặt Trời ~0,6%)
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản vi: 'Mô hình hiện nay giải thích bằng ba cơ chế' gồm di cư hành tinh → phanh từ tính và gió Mặt Trời là cơ chế 'được đề xuất'; di cư tách mục riêng, nói rõ không làm Mặt Trời quay chậm; bỏ 'hành tinh sơ khai bị hất ra' | Bouvier et al. 2014 doi 10.2458/azu_uapress_9780816531240-ch019; Tsiganis et al. 2005 doi 10.1038/nature03539
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản vi: 'ALMA và James Webb đã quan sát nhiều đĩa' → ALMA chụp đĩa HL Tau với vành sáng–tối 'có thể' liên quan hình thành hành tinh; 'sau hàng triệu năm' → bỏ thang thời gian; 'quy luật hình thành hành tinh là phổ quát' → 'gợi ý cùng quá trình vật lý cho ra kết cục rất khác nhau'; 6.000 ngoại hành tinh thêm mốc 9/2026 | ALMA Partnership 2015 doi 10.1088/2041-8205/808/1/L3; NASA Exoplanets
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Cả hai bản: đường tuyết gộp nước/amoniac/methane → 'đường tuyết của nước; chất dễ bay hơi hơn như CO đóng băng xa hơn nhiều'; bồi tụ lõi gọi đúng là 'mô hình chủ đạo'; bỏ câu 'mô hình cổ điển vành vật chất' không nguồn; siêu Trái Đất theo tiêu chí khối lượng của NASA | Pfalzner et al. 2015 doi 10.1088/0031-8949/90/6/068001; Johansen et al. 2014; NASA Planet Types
- - 2026-09-25 | su-ra-doi-cua-he-mat-troi | Bản vi: khôi phục khối ghi công VACA (bản en còn giữ) — không phải đổi claim | check 2026-09-05
- **Còn nợ:** C-11: câu 'sự di cư … tự nó không giải thích vì sao Mặt Trời quay chậm' dựa trên lập luận vật lý (di cư trao đổi động lượng góc giữa hành tinh và đĩa) cộng review Bouvier 2014 (cơ chế quay chậm là tương tác sao–đĩa và gió sao); chưa có nguồn nói thẳng câu phủ định này. Chấp nhận ở mức S4.
- **Còn nợ:** Số ngoại hành tinh (NASA, 9/2026) cần kiểm lại sau 12 tháng.
- **Còn nợ:** Quyền sử dụng nội dung phái sinh VACA (nguồn đã chết từ 17/09) vẫn chờ người quyết — lượt này chỉ khôi phục ghi công cho khớp bản en.

### tai-sao-pluto-khong-con-la-hanh-tinh — PASSED

- - 2026-09-25 | tai-sao-pluto-khong-con-la-hanh-tinh | Cả hai bản: núi băng nước 'cao tới 3.500 m, đủ cứng để đứng vững ở −230 °C' → 'cao tới 2–3 km, là khối băng nước, nhiệt độ trung bình −232 °C'; Sputnik Planitia 'rộng khoảng 1.000 km … tuổi có thể dưới 10 triệu năm' → 'bồn trũng băng nitơ, ô đa giác 10–40 km do đối lưu, tuổi theo hố va chạm không quá ~10 triệu năm'; khí quyển 'nhiều lớp, hàng chục lớp mù' → 'mỏng, chủ yếu nitơ, một lớp mù rộng bao trùm' | NASA Pluto Facts; McKinnon et al. 2016 doi 10.1038/nature18289; Moore et al. 2016 doi 10.1126/science.aad7055; Gladstone et al. 2016 doi 10.1126/science.aad8866
- - 2026-09-25 | tai-sao-pluto-khong-con-la-hanh-tinh | Cả hai bản: 'nếu đặt Trái Đất vào quỹ đạo Pluto cũng không dọn sạch nổi' (lập luận không nguồn, ngược với tiêu chí Margot 2015) → 'càng xa Mặt Trời càng cần nặng hơn mới dọn sạch quỹ đạo'; phía phản đối gắn nguồn Metzger, Sykes, Stern, Runyon 2019; 'Trái Đất vượt trội tuyệt đối' → chỉ số Π Trái Đất ~800, Pluto ~0,03, ngưỡng 1 | Margot 2015 doi 10.1088/0004-6256/150/6/185; Metzger et al. 2019 doi 10.1016/j.icarus.2018.08.026; NASA New Horizons
- - 2026-09-25 | tai-sao-pluto-khong-con-la-hanh-tinh | Cả hai bản: Eris 'thiên thể vành đai Kuiper' → 'ở rất xa ngoài quỹ đạo Sao Hải Vương'; 'danh sách hành tinh dài ra vô hạn định' → 'có thể thêm hàng chục, thậm chí hơn một trăm'; năm hành tinh lùn thêm mốc 9/2026; bỏ 'Pluto quá nhỏ để gây nhiễu loạn đo được', 'ở đúng vùng trời tính toán sai chỉ tới', 'nhiều tháng so sánh từng cặp ảnh' (không nguồn) → 'Pluto rất nhẹ, khoảng 1/6 Mặt Trăng; tìm ra là tình cờ' | NASA Eris, Dwarf Planets, Pluto Facts; Brown & Schaller 2007 doi 10.1126/science.1139415; Soter 2006 doi 10.1086/508861; Standish 1993 doi 10.1086/116575
- **Còn nợ:** Hộp khuyên dùng 'Pluto' thay 'Sao Diêm Vương' là quy ước biên tập, không phải claim khoa học — cần xác nhận là quy ước chính thức của kho (check 17/09).
- **Còn nợ:** Quyền sử dụng nội dung phái sinh VACA (nguồn đã chết) vẫn chờ người quyết.
- **Còn nợ:** Chi tiết Tombaugh dùng máy so ảnh (blink comparator) có thể khôi phục nếu mở được trang Lowell Observatory.

### toan-canh-dac-diem-8-hanh-tinh-he-mat-troi — PASSED

- - 2026-09-25 | toan-canh-dac-diem-8-hanh-tinh-he-mat-troi | Cả hai bản: 'phả hệ Saturn–Uranus là trùng hợp về tên gọi' → không phải trùng hợp: Bode đề xuất tên Uranus năm 1782 để khớp lối đặt tên; 'tên hành tinh lấy từ thần thoại La Mã' → thêm 'riêng Uranus từ thần thoại Hy Lạp'; 'sự khớp tên–đặc điểm là trùng hợp; Neptune gắn với màu' → Mars, Jupiter, Mercury được chọn vì đặc điểm (NASA), bỏ Neptune; Mercury 'thần đưa tin' → 'vị thần nhanh nhất' | Royal Museums Greenwich; NASA StarChild; NASA Mars/Jupiter/Mercury/Uranus/Saturn Facts
- - 2026-09-25 | toan-canh-dac-diem-8-hanh-tinh-he-mat-troi | Cả hai bản: 'hành tinh là thiên thể dưới cấp sao' → bỏ (gộp sao lùn nâu); diễn giải điều kiện c 'trừ vệ tinh và thiên thể khoá cộng hưởng' → 'áp đảo về khối lượng trong vùng quỹ đạo' theo Soter 2006; 'ranh giới vành đai tiểu hành tinh không phải trùng hợp' → 'theo mô hình chủ đạo (bồi tụ lõi)' | Soter 2006 doi 10.1086/508861; Öberg et al. 2011 doi 10.1088/2041-8205/743/1/L16; Pfalzner et al. 2015
- - 2026-09-25 | toan-canh-dac-diem-8-hanh-tinh-he-mat-troi | Cả hai bản: Hành tinh thứ chín 'chưa từng được quan sát trực tiếp' → 'chưa được phát hiện (tính tới 9/2026)'; tranh cãi 'cấu trúc vành đai Kuiper đủ giải thích' → hai hướng có nguồn: thiên lệch khảo sát (Napier 2021) và đĩa TNO tự hấp dẫn (Sefilian & Touma 2019); chu kỳ Thiên Vương '84,0 năm' → '84 năm'; bỏ lý do đặt tên ngũ hành không nguồn | NASA Planet X; doi 10.3847/PSJ/abe53e; doi 10.3847/1538-3881/aaf0fc; NASA Uranus Facts
- **Còn nợ:** Quyền sử dụng nội dung phái sinh VACA (nguồn đã chết từ 17/09) vẫn chờ người quyết.
- **Còn nợ:** Số vệ tinh (NASA 8/2026) và số hành tinh lùn (9/2026): kiểm lại sau 6 tháng; cột vệ tinh vẫn gộp ba tiêu chí đếm của NASA (IAU công nhận / confirmed / known) — chưa chuẩn hoá.
- **Còn nợ:** Tên Sao Mai/Sao Hôm là tên tiếng Việt; nguồn NASA chỉ đỡ ý 'người xưa tưởng là hai thiên thể, sao mai và sao hôm'.
