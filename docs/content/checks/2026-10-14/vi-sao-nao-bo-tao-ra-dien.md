# Thẩm định — Vì Sao Não Bộ Tạo Ra Điện?

- Slug: `vi-sao-nao-bo-tao-ra-dien`
- Trạng thái lúc thẩm định (2026-10-14): PUBLISHED qua form /admin (publishedAt 2026-10-14T10:20Z) · `factCheck = PENDING` · 0 nguồn · không `reviewedById` · chưa có bản EN · `entityId` trống · `readingTime = 4` · danh mục `co-the-nguoi` (con của `suc-khoe` → **có** khung lưu ý y tế) · `coverImageCredit` trống, `coverImageCreditEn` = "Ảnh:  iStock/ktsimage", `coverImageAlt` = "Image:  iStock/ktsimage" · 0 link nội bộ, 0 link vào, không có "Đọc thêm".
- **Phán quyết: SỬA (REVISE).** Không gỡ: phần lõi đúng — điện sinh học là dòng ion (Na⁺, K⁺, Ca²⁺, Cl⁻), điện thế nghỉ khoảng -70 mV, natri tràn vào tạo điện thế hoạt động, não chiếm khoảng 2% khối lượng cơ thể nhưng dùng khoảng 20% năng lượng. Không giữ nguyên: gate accuracy (0 nguồn) và ba lỗi nội dung. (1) **Bài bị cụt**: câu cuối dừng giữa chừng ("…bên trong não bộ của "). (2) Bài dựng mô hình "nơron giao tiếp bằng điện", bỏ hẳn bước hóa học ở synapse — trong khi NINDS viết "Neurons communicate with each other by sending chemicals, called neurotransmitters, across a tiny space called a synapse". (3) Mục năng lượng đặt ra lựa chọn giả "không dùng để suy nghĩ mà dùng để… tạo và truyền các xung thần kinh" — truyền tin chính là hoạt động của não. Ba mục chặn nội dung, sáu mục nên sửa.

## A. Chặn (phải sửa)

| # | Vị trí | Loại | Vấn đề | Câu thay thế (nguyên văn) |
|---|---|---|---|---|
| A1 | Toàn bài | Gate | 0 nguồn (gate cần ≥3 nguồn độc lập bậc 1–2). `publish:check` còn chặn: 0/3 link nội bộ, 0 link vào, chưa entity, chưa byline; CẢNH: ảnh bìa chưa ghi công. | Nguồn ở mục C; link nội bộ trong D4, D7 và "Đọc thêm" (D10). Link vào, entity, ghi công: mục E. |
| A2 | Mục "## Kết Luận": "…tất cả đều bắt đầu từ hàng tỷ tín hiệu điện đang liên tục được tạo ra và truyền đi bên trong não bộ của " | **Bài cụt** | Câu cuối của bài dừng giữa chừng — trang đang đăng kết thúc bằng một câu dở. | D9 (thay toàn mục). |
| A3 | Sơ đồ HTML đầu bài (Ion tích điện ↓ Chênh lệch điện thế ↓ Xung thần kinh ↓ Trao đổi thông tin giữa các nơron); tóm tắt "Mỗi suy nghĩ… đều bắt nguồn từ các tín hiệu điện"; Kết luận "Những dòng điện cực nhỏ này tạo nên các xung thần kinh giúp nơron giao tiếp với nhau." | **Mô hình thiếu bước then chốt** | NINDS (Brain Basics): "They use electrical and chemical signals to send information"; "Neurons communicate with each other by sending chemicals, called neurotransmitters, across a tiny space called a synapse". Queensland Brain Institute: "At the junction between two neurons (synapse), an action potential causes neuron A to release a chemical neurotransmitter. The neurotransmitter can either help (excite) or hinder (inhibit) neuron B". Sơ đồ nối thẳng "xung thần kinh" sang "trao đổi thông tin giữa các nơron", bỏ bước hóa học; bài không có chữ "synapse" hay "chất dẫn truyền" nào. Bài PASSED `nhung-su-gia-hoa-hoc-…` trình bày đúng bước này. | D1 (tóm tắt), D2 (thay sơ đồ), D4, D9. |

## B. Nên sửa

| # | Vị trí | Loại | Vấn đề | Câu thay thế |
|---|---|---|---|---|
| B1 | "Tế bào duy trì trạng thái này nhờ các \"máy bơm ion\" liên tục vận chuyển natri và kali qua màng tế bào, giống như sạc một cục pin nhỏ." | Cơ chế nói gọn quá mức | StatPearls (Physiology, Resting Potential): điện thế nghỉ "is the result of the movement of several different ion species through various ion channels and transporters (uniporters, cotransporters, and pumps)". StatPearls (Physiology, Action Potential): bơm Na/K-ATPase "induces movement of sodium ions out of the cell and potassium ions into the cell" để tái lập cân bằng ion. Bơm giữ chênh lệch nồng độ; điện thế sinh ra từ ion đi qua cả kênh lẫn bơm. Hình ảnh "sạc pin" giữ được nếu nói đúng bơm làm gì. | D3. |
| B2 | Mục "## Xung Thần Kinh Được Tạo Ra Như Thế Nào?": khối ```` ```text ```` mũi tên; "Xung điện này di chuyển dọc theo sợi thần kinh với tốc độ từ vài mét mỗi giây đến hơn 100 mét mỗi giây tùy loại nơron." | Sơ đồ thiếu bước; số không nguồn | Sơ đồ dừng ở "natri đi vào", bỏ pha hồi cực — StatPearls: "depolarization, is an all-or-nothing event that is initiated by the opening of sodium ion channels… The subsequent return to resting potential, repolarization, is mediated by the opening of potassium ion channels". QBI: ngưỡng "around -50 mV". Khoảng tốc độ: không nguồn bậc 1–2 nào đọc được trong đợt này (trang NCBI Bookshelf của Purves chặn curl) → bỏ, không làm tròn cho có vẻ đúng. | D4 (thay toàn mục). |
| B3 | Mục "## Vì Sao Não Cần Điện?": "Điện là phương thức truyền thông tin cực nhanh."; "Mỗi giây, hàng tỷ nơron liên tục phát và nhận các xung điện…" | Văn mục đích luận; số không nguồn | Tiêu đề "Vì sao não cần điện?" đọc như điện là thứ não chọn dùng. "Hàng tỷ nơron mỗi giây" không nguồn. Số đếm có nguồn: Azevedo và cộng sự (2009) — não nam giới trưởng thành có trung bình 86,1 ± 8,1 tỷ nơron. NINDS: "Everything we think, feel, and do would be impossible without the work of neurons". | D5 (thay toàn mục). |
| B4 | Mục "## Não Bộ Tiêu Thụ Bao Nhiêu Năng Lượng?": "Phần lớn năng lượng này không dùng để \"suy nghĩ\" mà dùng để: …" | Lựa chọn giả | Herculano-Houzel (2011, toàn văn PMC3046985): "use in humans of 20% of the whole body energy budget by a brain that represents only 2% of body mass"; "synaptic activity is considered the major determinant of metabolic cost". Attwell & Laughlin (2001, abstract, chất xám não loài gặm nhấm): trong năng lượng cho truyền tin, điện thế hoạt động khoảng 47%, tác động sau synapse 34%, điện thế nghỉ 13%. Năng lượng dùng cho truyền tin **là** năng lượng cho hoạt động của não; "không dùng để suy nghĩ" sai. | D6 (thay toàn mục). |
| B5 | Mục "## Tại Sao Có Thể Đo Được Điện Não?": "các tín hiệu điện cộng hưởng với nhau"; danh sách năm loại sóng; "bác sĩ có thể theo dõi hoạt động của não trong nhiều bệnh lý thần kinh khác nhau" | Sai chữ; thiếu nguồn; thiếu ví dụ | "Cộng hưởng" (*resonance*) là hiện tượng khác — đúng là cộng gộp. Buzsáki và cộng sự (2012, abstract): "the major contributor of the extracellular signal is the synaptic transmembrane current" — không chỉ xung thần kinh. Năm dải sóng và chức năng gán cho chúng (vd. gamma "xử lý thông tin phức tạp") không có nguồn đã đọc → thay bằng ý có nguồn: nhịp khác nhau giữa thức và ngủ, giấc ngủ sâu là giấc ngủ sóng chậm (bài PASSED `giac-ngu-sau-…`). NHS: EEG dùng để chẩn đoán hoặc theo dõi bệnh của não, "The main condition it's used for is epilepsy", ngoài ra "sleep conditions and encephalitis". | D7 (thay toàn mục). |
| B6 | Tiêu đề, tên mục; `coverImageAlt`, `coverImageCredit` | Văn phong; ảnh | Viết hoa từng chữ. **Đã tải và xem ảnh** (800×600): hình minh họa 3D các nơron màu xám bạc với thân tế bào và nhiều nhánh, những tia sáng như tia điện xanh trắng và các vệt đỏ chạy dọc sợi nhánh, nền xanh đen. Alt hiện là chuỗi ghi công ("Image:  iStock/ktsimage"), không tả ảnh; `coverImageCredit` trống, chữ ghi công tiếng Việt lại nằm ở trường tiếng Anh. Engine không sửa alt và không điền được trường đang rỗng. | D0, D8; ảnh: mục E. |

## C. Nguồn đề xuất (đã kiểm tồn tại)

Mọi trang đọc ngày 2026-10-14 bằng curl (HTML → văn bản); abstract và toàn văn qua Europe PMC REST. Mọi DOI tra bằng Crossref (`query.bibliographic` rồi `works/<doi>`): tiêu đề, tạp chí, năm, tập, trang khớp. NCBI (Bookshelf, E-utilities) chặn truy cập từ máy này trong đợt — không dùng. PNAS (Raichle & Gusnard 2002) trả 403 — không dùng. Không dùng MedlinePlus `/ency/` hay OpenStax.

| Bậc | Nguồn | Đã đọc để kiểm | Dùng cho |
|---|---|---|---|
| 2 | NINDS (NIH) — Brain Basics: The Life and Death of a Neuron. https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-life-and-death-neuron | Toàn trang (trích ở A3, B3). | A3, B3, D1, D2, D5 |
| 2 | Queensland Brain Institute (University of Queensland) — Action potentials and synapses. https://qbi.uq.edu.au/brain-basics/brain/brain-physiology/action-potentials-and-synapses | Toàn trang: điện thế nghỉ "around -70 mV"; ngưỡng "around -50 mV"; tín hiệu kích thích / ức chế; giải phóng chất dẫn truyền ở synapse. | A3, B2, D4; số -70 mV (giữ nguyên) |
| 2 | Chrysafides S. M., Bordes S. J., Sharma S. Physiology, Resting Potential. StatPearls Publishing (2023). PMID 30855922 | Abstract (Europe PMC). | B1, D3 |
| 2 | Grider M. H., Jessu R., Kabir R. Physiology, Action Potential. StatPearls Publishing (2023). PMID 30844170 | Abstract (Europe PMC) (trích ở B1, B2). | B1, B2, D3, D4 |
| 1 | Azevedo F. A. C. và cộng sự. Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain. *Journal of Comparative Neurology* 513, 532–541 (2009). DOI 10.1002/cne.21974 | Abstract (Europe PMC). | B3, D5 |
| 1 | Herculano-Houzel S. Scaling of Brain Metabolism with a Fixed Energy Budget per Neuron. *PLoS ONE* 6, e17514 (2011). DOI 10.1371/journal.pone.0017514 | Toàn văn (PMC3046985), đoạn tóm tắt về 2% / 20% và chi phí synapse. | B4, D6 |
| 1 | Attwell D., Laughlin S. B. An Energy Budget for Signaling in the Grey Matter of the Brain. *Journal of Cerebral Blood Flow & Metabolism* 21, 1133–1145 (2001). DOI 10.1097/00004647-200110000-00001 | Abstract (Europe PMC). | B4, D6 |
| 1 | Buzsáki G., Anastassiou C. A., Koch C. The origin of extracellular fields and currents — EEG, ECoG, LFP and spikes. *Nature Reviews Neuroscience* 13, 407–420 (2012). DOI 10.1038/nrn3241 | Abstract (Europe PMC). | B5, D7 |
| 2 | NHS — EEG (electroencephalogram). https://www.nhs.uk/tests-and-treatments/electroencephalogram/ | Mục "Why an EEG is done" (trích ở B5). | B5, D7 |

Bậc 1–2 độc lập: NINDS (NIH), Đại học Queensland, NHS, StatPearls, các bài báo bình duyệt — đủ ≥3.

## D. Đoạn thay thế

### D0 — thay trường `title`

```markdown
Vì sao não bộ tạo ra điện?
```

### D1 — thay câu trong trường `summary`: "Mỗi suy nghĩ, ký ức, cảm xúc hay chuyển động của cơ thể đều bắt nguồn từ các tín hiệu điện bên trong não. Trên thực tế, bộ não không chỉ xử lý thông tin bằng hóa chất mà còn hoạt động như một mạng lưới điện sinh học cực kỳ phức tạp."

```markdown
Mỗi suy nghĩ, ký ức, cảm xúc hay chuyển động của cơ thể đều cần đến các tín hiệu điện bên trong não. Các tế bào thần kinh dùng cả điện lẫn hóa chất để truyền tin: tín hiệu điện chạy dọc theo từng tế bào, còn tín hiệu hóa học chuyển tin từ tế bào này sang tế bào kế tiếp.
```

### D2 — thay khối sơ đồ HTML đầu bài (từ `<div style="max-width:500px` tới thẻ `</div>` đóng ngoài cùng, ngay trước "## Não Bộ Không Tạo Điện Theo Cách Chúng Ta Vẫn Nghĩ")

```markdown
Nơron, hay tế bào thần kinh, dùng hai loại tín hiệu: tín hiệu điện chạy dọc theo từng tế bào, và tín hiệu hóa học truyền từ tế bào này sang tế bào kế tiếp qua một khe rất hẹp gọi là synapse. Bài này nói về phần điện: nó sinh ra từ đâu, đi như thế nào, và vì sao có thể đo được từ bên ngoài hộp sọ.
```

### D3 — thay câu "Tế bào duy trì trạng thái này nhờ các \"máy bơm ion\" liên tục vận chuyển natri và kali qua màng tế bào, giống như sạc một cục pin nhỏ."

```markdown
Điện thế này sinh ra từ sự di chuyển của nhiều loại ion qua các kênh và các bơm trên màng tế bào. Trong đó, bơm natri–kali dùng năng lượng để đẩy natri ra ngoài và đưa kali vào trong, giữ cho nồng độ hai loại ion này ở hai bên màng luôn chênh lệch, giống như liên tục sạc lại một cục pin nhỏ.
```

### D4 — thay toàn mục "## Xung Thần Kinh Được Tạo Ra Như Thế Nào?"

```markdown
## Xung thần kinh được tạo ra như thế nào?

Điện thế màng của nơron không đứng yên. Nó liên tục lên xuống theo tín hiệu nhận được từ các nơron khác: tín hiệu kích thích đẩy điện thế lên, tín hiệu ức chế kéo điện thế xuống.

Khi tổng các tín hiệu ấy đẩy điện thế màng lên tới khoảng -50 mV, gọi là **ngưỡng**, các kênh natri trên màng mở ra. Ion natri tràn nhanh vào trong tế bào làm điện thế thay đổi đột ngột.

Hiện tượng này gọi là **điện thế hoạt động** (*action potential*). Nó diễn ra theo kiểu "tất cả hoặc không": hoặc không xảy ra, hoặc xảy ra trọn vẹn.

1. Ở trạng thái nghỉ, điện thế màng khoảng -70 mV.
2. Các tín hiệu nhận được đẩy điện thế lên tới ngưỡng.
3. Kênh natri mở, natri đi vào: điện thế tăng vọt.
4. Kênh kali mở, kali đi ra: điện thế trở về mức nghỉ.
5. Bơm natri–kali dần khôi phục chênh lệch nồng độ ion.

Điện thế hoạt động lan dọc theo sợi trục tới đầu tận cùng của nơron. Tại đó, nó khiến nơron giải phóng [[chất dẫn truyền thần kinh]] vào synapse. Các chất này có thể kích thích hoặc ức chế nơron kế tiếp phát xung của chính nó (xem [Những "sứ giả hóa học" điều khiển hoạt động của não bộ](/articles/nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo)).
```

### D5 — thay toàn mục "## Vì Sao Não Cần Điện?"

```markdown
## Tín hiệu điện làm được gì?

Theo một nghiên cứu năm 2009 đếm tế bào trong não nam giới trưởng thành, não người có khoảng 86 tỷ nơron. Tín hiệu điện và hóa học truyền qua mạng lưới ấy tham gia vào mọi hoạt động của hệ thần kinh:

- Điều khiển cơ bắp.
- Tiếp nhận cảm giác.
- Ghi nhớ và học tập.
- Xử lý ngôn ngữ.
- Suy nghĩ và cảm xúc.

Không có hoạt động của các nơron, mọi điều chúng ta nghĩ, cảm nhận và làm đều không thể xảy ra.
```

### D6 — thay toàn mục "## Não Bộ Tiêu Thụ Bao Nhiêu Năng Lượng?"

```markdown
## Não bộ tiêu thụ bao nhiêu năng lượng?

Dù chỉ chiếm khoảng 2% khối lượng cơ thể, não dùng khoảng 20% năng lượng của toàn cơ thể.

Phần lớn năng lượng ấy dành cho chính việc truyền tin. Mỗi xung thần kinh và mỗi tín hiệu tại synapse đều để ion tràn qua màng, và bơm natri–kali phải tiêu tốn năng lượng để đưa chúng về chỗ cũ. Một ước tính năm 2001 trên chất xám não loài gặm nhấm cho thấy trong phần năng lượng dành cho truyền tin, khoảng 47% dùng cho điện thế hoạt động, 34% cho các tác động tại synapse, còn duy trì điện thế nghỉ chỉ chiếm khoảng 13%.

Nói cách khác, bộ não phải liên tục "trả hóa đơn điện" để duy trì mạng lưới truyền tin của mình.
```

### D7 — thay toàn mục "## Tại Sao Có Thể Đo Được Điện Não?"

```markdown
## Tại sao có thể đo được điện não?

Khi rất nhiều nơron hoạt động cùng lúc, các dòng điện nhỏ của chúng cộng gộp lại thành những dao động đủ lớn để đo được từ bên ngoài hộp sọ. Phần đóng góp lớn nhất đến từ các dòng điện tại synapse, không chỉ từ các xung thần kinh.

Kỹ thuật này được gọi là:

**Điện não đồ (EEG - Electroencephalography)**

Nhịp sóng trên điện não đồ thay đổi theo trạng thái của não, chẳng hạn khác hẳn nhau giữa lúc thức và lúc ngủ; giai đoạn ngủ sâu nhất còn được gọi là [giấc ngủ sóng chậm](/articles/giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban).

Bác sĩ dùng điện não đồ để chẩn đoán hoặc theo dõi một số bệnh của não. Bệnh chính là động kinh; ngoài ra còn có các rối loạn giấc ngủ và viêm não.
```

### D8 — đổi tên mục (thay nguyên dòng, giữ nội dung)

| Cũ | Mới |
|---|---|
| `## Não Bộ Không Tạo Điện Theo Cách Chúng Ta Vẫn Nghĩ` | `## Não bộ không tạo điện theo cách chúng ta vẫn nghĩ` |
| `## Điện Thế Nghỉ: Pin Sinh Học Của Tế Bào Thần Kinh` | `## Điện thế nghỉ: pin sinh học của tế bào thần kinh` |
| `## Não Bộ Có Thể Hoạt Động Nếu Không Có Điện Không?` | `## Não bộ có thể hoạt động nếu không có điện không?` |

### D9 — thay toàn mục "## Kết Luận"

```markdown
## Kết luận

Bộ não tạo ra điện thông qua sự di chuyển của các ion mang điện tích qua màng tế bào thần kinh. Những dòng điện cực nhỏ này tạo nên các xung thần kinh chạy dọc từng nơron; tới synapse, tín hiệu được chuyển sang dạng hóa học để đi tiếp sang nơron kế tiếp.

Từ việc cử động ngón tay, nhớ lại một kỷ niệm cho đến suy nghĩ về nguồn gốc của vũ trụ, tất cả đều cần tới những tín hiệu điện và hóa học ấy, liên tục được tạo ra và truyền đi bên trong não bộ.
```

### D10 — thêm mục "## Đọc thêm" cuối bài (engine thêm từ `reading`)

Bốn bài PUBLISHED + `factCheck = PASSED` (truy vấn CSDL 2026-10-14), chưa được link trong thân bài:

- [GABA: "Bộ phanh" của não có khiến bạn lờ đờ, uể oải?](/articles/gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai)
- [Thuốc gây mê đã "tắt" ý thức của bạn như thế nào?](/articles/thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao)
- [Khi tim ngừng đập: Điều gì thực sự xảy ra với cơ thể khi chúng ta chết?](/articles/khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet)
- [Vì sao chúng ta không thể nhớ những năm tháng đầu đời?](/articles/vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi)

## E. Việc chưa làm / cần người

1. **Ảnh bìa — ghi công và alt** (engine không điền được trường đang rỗng, không sửa alt; sửa qua form /admin):
   - `coverImageCredit`: `Ảnh: iStock/ktsimage` — với điều kiện tổ chức có giấy phép iStock cho ảnh này.
   - `coverImageCreditEn`: `Image: iStock/ktsimage`.
   - `coverImageAlt` (đã xem ảnh), đề xuất: `Hình minh họa 3D các tế bào thần kinh màu xám bạc với nhiều nhánh, những tia sáng như tia điện chạy dọc theo các sợi nhánh trên nền xanh thẫm.`
2. **Thuật ngữ** — chủ sản phẩm chốt 2026-10-14: "nơron" (docs/content-rules.md, "Thuật ngữ đã chốt"); áp toàn kho bằng `corrections:1014b`. Kho chưa có mục từ "Điện thế hoạt động", "Synapse" — đề xuất soạn qua `glossary.json` + science-editor. `[[chất dẫn truyền thần kinh]]` đã có mục từ.
3. **Link vào** (gate: 0): đề xuất thêm link từ bài PASSED `nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo` (câu "Khi một xung điện chạy tới đầu neuron…", neo "xung điện") — làm sau khi ký.
4. **Entity** (gate chặn): gợi ý "Điện thế hoạt động" (*action potential*, Wikidata — tra lúc làm). Làm sau khi ký.
5. **Kiểm máy (bước 1b)**: `publish:check` — CHẶN: factCheck PENDING; không byline; 0/3 nguồn; 0/3 link nội bộ; 0 link vào; chưa entity; CẢNH: ảnh bìa chưa ghi công. `glossary:check`: bài không có `[[…]]` trước đính chính. Link vào bài này: không có.
6. **Byline**: sau đính chính, người đọc bản mới và chạy `scripts/pass-factcheck-2026-10-14.ts`.

## F. Ghi chú thẩm định

- Skill đã gọi: `tham-dinh-bai-da-dang` (khung); nguồn và claim theo `content-research` + `fact-check` (Audit); DOI tra Crossref. SEO theo `seo-optimizer`: `seoTitle` ("Vì sao não bộ tạo ra điện?" — trùng tiêu đề sau D0, không trùng bài khác), `seoDescription`, `seoKeywords` không mang claim sai → giữ. Không gọi `translation` (không có bản EN).
- **Mục "Khi nào nên đi khám"**: không cần. Bài nằm trong nhóm Sức khoẻ nhưng không có lời khuyên tự làm nào; EEG chỉ được nhắc như một xét nghiệm.
- **Cân nhắc mà không đưa vào D:**
  - Tốc độ dẫn truyền và vai trò của bao myelin: đúng chủ đề, nhưng không đọc được nguồn bậc 1–2 nào trong đợt (NCBI Bookshelf chặn, QBI không có trang tương ứng). Bỏ câu số liệu thay vì giữ một khoảng không nguồn. Thêm lại khi có nguồn.
  - Synapse điện (khớp nối khe) cũng tồn tại; D2/D4 nói "tín hiệu hóa học" không kèm "phần lớn". Không thêm: không nguồn đã đọc, và nguồn NINDS/QBI trình bày synapse hóa học là cách giao tiếp chính.
  - Tỷ lệ 47/34/13% đến từ mô hình trên não loài gặm nhấm; D6 nói rõ điều đó thay vì gán cho não người.
  - Mục "## Não Bộ Có Thể Hoạt Động Nếu Không Có Điện Không?" giữ nội dung: đúng ở mức khái quát (xung điện là thứ kích hoạt việc giải phóng chất dẫn truyền); chỉ đổi tên mục.
  - Khung HTML "≈ -70 mV" giữ nguyên; bộ lọc `rehypeSafeStyle` gỡ `background`/`border` lúc render.
