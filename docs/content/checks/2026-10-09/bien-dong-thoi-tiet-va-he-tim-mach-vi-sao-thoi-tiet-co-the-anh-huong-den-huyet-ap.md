# Thẩm định — Biến động thời tiết và hệ tim mạch: vì sao thời tiết có thể ảnh hưởng đến huyết áp?

- Slug: `bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap`
- Danh mục: `sinh-ly-va-trao-doi-chat` (con của `sinh-hoc`) — **không** có khung lưu ý "health" theo `src/lib/category-notices.ts` (chỉ `suc-khoe` và các nhóm con của nó mới có).
- Trạng thái lúc thẩm định (2026-10-09): PUBLISHED qua form /admin (publishedAt 2026-10-09T02:10Z, sửa lần cuối 02:20Z) · `factCheck = PENDING` · 0 nguồn · `reviewedById` trống · chưa có bản EN (`titleEn`, `contentEn` trống) · `entityId` trống · `readingTime = 3` · ảnh bìa trên R2, có ghi công Unsplash và có alt · không có mục "Đọc thêm", không có link nội bộ · không có mục "khi nào nên đi khám", không có dòng lưu ý y tế.
- **Phán quyết: SỬA (REVISE), viết lại phần lớn thân bài.** Không gỡ: chủ đề có cơ sở, và hai ý trụ cột đều có nguồn bậc 1–2 đỡ — huyết áp cao hơn khi trời lạnh (tuyên bố đồng thuận ESH 2020, nghiên cứu Three-City 8.801 người cao tuổi), và huyết áp tăng khi lên núi cao do thiếu oxy kích hoạt giao cảm (khuyến nghị chung ESC/ESH 2018). Bài cũng đã có câu đúng và quan trọng "Không nên tự ý thay đổi thuốc". Nhưng luận điểm xuyên suốt của bài — thời tiết thay đổi "nồng độ oxy" và cơ thể phản ứng với dao động áp suất hằng ngày qua "điều hòa oxy" — là **gộp hai thang đo cách nhau hàng chục lần** (thời tiết vs. núi cao) và để lại mô hình sai ở sơ đồ, tóm tắt, mục áp suất và kết luận. Thêm vào đó: một nhân quả tự thêm (huyết áp tăng "là nguyên nhân" của triệu chứng say độ cao), "khó thở" — dấu hiệu nặng theo NHS — bị xếp chung với triệu chứng nhẹ, lời khuyên "uống đủ nước" cho người bệnh tim **bỏ ngoại lệ suy tim**, bài chỉ nói chiều lạnh và **bỏ hẳn chiều nóng** (huyết áp hạ quá mức ở người đang uống thuốc — chiều quan trọng ở Việt Nam), và một bài có lời khuyên cho người cao tuổi/người bệnh tim lại không có dấu hiệu cần đi khám hay gọi cấp cứu. Tám mục chặn, chín mục nên sửa.
- Khuyến nghị: **đưa về DRAFT tới khi áp xong mục A** (chủ sản phẩm quyết — xem E). Lý do: A6 (uống nước) và A5 (khó thở) là lời khuyên an toàn sai cho đúng nhóm người đọc bài nhắm tới, cùng loại với lỗi "khuyên tăng đạm mà bỏ ngoại lệ bệnh thận" đã khiến phiếu sarcopenia 08/10 khuyến nghị DRAFT; trang lại không có khung lưu ý y tế. Vì bài đã xuất bản, mọi sửa là đính chính và phải ghi công khai (`docs/content-rules.md`, "Sửa bài đã publish là đính chính").

Ký hiệu mức lỗi (như phiếu 08/10): **S1** = trái với số đo/kết luận của nguồn bậc 1–2; **S2** = không nguồn nào xác nhận (tra không thấy, đánh dấu chứ không đoán); **KQ** = khái quát quá tay / chủ thể bị nới rộng (quy tắc 18); **DD** = thiếu dè dặt / nâng mức chắc chắn; **NQ** = nhân quả tự thêm; **CM** = chọn một kể như tất cả / bỏ vế đối trọng (quy tắc 15); **AT** = thiếu hoặc sai thông tin an toàn; **VP** = văn phong không hợp bách khoa.

## A. Chặn (phải sửa) — 8 mục

| # | Vị trí | Mức | Vấn đề | Câu thay thế (nguyên văn) |
|---|---|---|---|---|
| A1 | Toàn bài | Gate | 0 nguồn. Gate accuracy cần ≥3 nguồn bậc 1–2; bài có lời khuyên sức khoẻ cho người cao tuổi và người bệnh tim mạch nên từng lời khuyên phải có nguồn cơ quan y tế. | Thêm nguồn ở mục C (đã kiểm 21 nguồn: 14 bậc 1, 7 bậc 2). |
| A2 | Sơ đồ ```` ```text ```` đầu thân bài ("Cơ thể phát hiện thay đổi nhiệt độ, áp suất và nồng độ oxy") + trường `summary` ("cơ thể phản ứng gián tiếp thông qua hệ thần kinh, mạch máu và quá trình điều hòa oxy") + `seoDescription` ("thay đổi nhiệt độ, áp suất và oxy khi thời tiết biến động") | S1 + KQ | Ba chỗ cùng dựng một mô hình: thời tiết biến động → nồng độ oxy đổi → cơ thể điều chỉnh. Sai thang đo. Thiếu oxy chỉ có ý nghĩa ở độ cao: ở 2.500 m áp suất riêng phần oxy hít vào thấp hơn ~25% (Parati 2018). Dao động áp suất do thời tiết nhỏ hơn hàng chục lần: mức giảm >5 hPa/ngày — mốc mà một nghiên cứu về đau nửa đầu dùng (Kimoto 2011) — chỉ là ~0,5% của 1013,25 hPa (tính: 5 / 1013,25). Không nguồn nào đã đọc nói thời tiết hằng ngày làm thay đổi oxy máu. Sơ đồ còn ngầm khẳng định cơ thể "phát hiện" áp suất khí quyển — không nguồn nào trong gói nói vậy. Yếu tố duy nhất có bằng chứng mạnh, nhất quán là **nhiệt độ** (ESH 2020). Sơ đồ để lại đúng mô hình sai cho người đọc chỉ lướt. | Xem D1 (thay sơ đồ), D11 (summary, seoDescription). |
| A3 | Mục "Vai Trò Của Áp Suất Khí Quyển", đoạn cuối ("Khi thời tiết thay đổi **hoặc** khi di chuyển lên vùng núi cao … cơ thể không phản ứng chủ yếu vì thành mạch bị nén hay giãn …, mà vì những thay đổi này ảnh hưởng đến khả năng trao đổi oxy và hoạt động của hệ thần kinh tự chủ") + Kết luận ("Những thay đổi về nhiệt độ, nồng độ oxy và phản ứng điều hòa của cơ thể mới là các yếu tố đóng vai trò quan trọng nhất"; "Đối với người khỏe mạnh, các cơ chế tự điều chỉnh thường đủ để duy trì huyết áp ổn định") | KQ + S2 + S1 | (1) Một câu gộp thời tiết và núi cao rồi gán cơ chế của núi cao (thiếu oxy → thụ thể hoá học xoang cảnh → giao cảm; Parati 2018) cho cả hai — chủ thể bị nới rộng (quy tắc 18). (2) Với dao động áp suất hằng ngày, bằng chứng về ảnh hưởng lên huyết áp **chưa nhất quán**: thử nghiệm DASH (333 người, đo 24 giờ) thấy độ dao động huyết áp liên quan với nhiệt độ, **không** với áp suất (Jehn 2002); Kamiński 2016 ghi phần lớn nghiên cứu trước dùng áp suất trung bình ngày "found no correlation", và chỉ thấy liên quan nghịch ở ban ngày mùa xuân và ban đêm mùa đông. Bài khẳng định một cơ chế cho một hiệu ứng chưa chắc có. (3) "Quan trọng nhất" — xếp hạng không nguồn; "nồng độ oxy" không thuộc thời tiết hằng ngày. (4) "Người khỏe mạnh … huyết áp ổn định" trái ESH 2020: biến đổi huyết áp theo mùa là "global phenomenon affecting both sexes, all age groups, **normotensive individuals**, and hypertensive patients". | Thay toàn mục bằng D2; Kết luận bằng D10. |
| A4 | Mục "Vì Sao Trời Lạnh Dễ Làm Huyết Áp Tăng?", câu cuối: "Đây cũng là **một trong những nguyên nhân** khiến nguy cơ đột quỵ và nhồi máu cơ tim tăng trong các đợt rét đậm hoặc thời tiết lạnh đột ngột." | DD + NQ + KQ | (1) Nguồn chỉ nói huyết áp tăng/dao động khi lạnh "**may contribute** to the high cardiovascular mortality observed in the winter" (Jehn 2002) — bài nâng thành nguyên nhân (quy tắc 3, nâng mức chắc chắn là lỗi mức từ chối). (2) "Các đợt rét đậm hoặc lạnh đột ngột" đổi chủ thể: nghiên cứu lớn nhất (Gasparrini 2015, 74 triệu ca tử vong, 13 nước gồm Thái Lan) thấy phần lớn tử vong gắn với nhiệt độ là do lạnh (7,29% so với 0,42% do nóng) **và chủ yếu do những ngày lạnh vừa phải**, không phải nhiệt độ cực đoan (cực đoan cả nóng lẫn lạnh chỉ 0,86%). Lưu ý: số liệu này là tử vong mọi nguyên nhân, không riêng tim mạch. | Xem D3 (đoạn cuối). |
| A5 | Mục "Điều Gì Xảy Ra Khi Lên Núi Cao Hoặc Đi Máy Bay?": "Chính phản ứng bù trừ này khiến huyết áp và nhịp tim có thể tăng **tạm thời ở một số người** … Đây cũng là **nguyên nhân** gây ra các triệu chứng như: Đau đầu. Chóng mặt. **Khó thở.** Mệt mỏi." | NQ + AT + DD | (1) **Nhân quả tự thêm:** bài quy triệu chứng say độ cao cho phản ứng tăng huyết áp/nhịp tim. NHS mô tả say độ cao là bệnh do ở độ cao (thường >2.500 m) khi cơ thể chưa quen với "lower oxygen levels"; không nguồn nào nói tăng huyết áp gây ra đau đầu, mệt của say độ cao. (2) **An toàn:** NHS xếp "feel short of breath, **even when resting**", ho ra đờm bọt/lẫn máu, lú lẫn, mất thăng bằng, môi tím vào nhóm "**Get medical help immediately**" và khuyên xuống thấp 300–1.000 m ngay. Bài để "khó thở" chung danh sách với mệt mỏi, như triệu chứng chờ thích nghi — người đọc có thể ở lại trên cao với dấu hiệu nặng. Bài không có lời khuyên xuống thấp, không có dấu hiệu nguy hiểm. (3) "Tạm thời ở một số người" nói nhẹ hơn nguồn: Parati 2018 — "a significant and persistent arterial BP increase occurs shortly after the arrival at HA, proportional to the altitude reached and more evident at night", kéo dài "at least over the first 7 days". (4) Thiếu khuyến nghị cho đúng nhóm người đọc: người tăng huyết áp nặng/chưa kiểm soát nên tránh lên cao (Parati 2018, bảng 3, class I). | Thay toàn mục bằng D6; dấu hiệu cấp cứu ở D9. |
| A6 | Mục "Hạn Chế Ảnh Hưởng …": gạch "Uống đủ nước." trong danh sách dành cho người có bệnh tim mạch/tăng huyết áp | AT + CM | Lời khuyên chung bỏ ngoại lệ của chính nhóm đích. NHLBI (sống chung với suy tim): "You may also be asked to **limit the amount of salt and liquids** that you drink to reduce fluid buildup." Bài nhắm người bệnh tim mạch — nhóm có người suy tim — mà khuyên uống đủ nước không kèm ngoại lệ. Cùng hình dạng với A8 của phiếu sarcopenia 08/10 (khuyên tăng đạm, bỏ ngoại lệ bệnh thận). | Xem D8 (gạch thứ ba). |
| A7 | Toàn bài — chỉ có chiều lạnh, không có chiều nóng | CM + AT | ESH 2020: huyết áp "lower levels at higher environmental temperatures"; ở người đang điều trị tăng huyết áp, mùa nóng "may result in **excessive BP decline** in summer"; triệu chứng xuất hiện khi trời nóng lên gợi ý điều trị quá mức "must be investigated". Modesti 2006 (6.404 người): ngày nóng đi kèm huyết áp tâm thu **ban đêm cao hơn** ở người cao tuổi đang điều trị — nên chỉnh thuốc theo mùa không đơn giản. NHS: nắng nóng gây mất nước và "overheating, which can make symptoms worse for people who already have problems with their heart or breathing". Bài về thời tiết và huyết áp, viết cho người đọc ở Việt Nam, mà chỉ kể một chiều là chọn một kể như tất cả (quy tắc 15), và bỏ đúng tình huống an toàn (choáng do hạ huyết áp khi trời nóng ở người uống thuốc). | Thêm mục mới D4; câu "đi khám" ở D9. |
| A8 | Cuối bài — thiếu | AT | Bài khuyên người cao tuổi và người bệnh tim mạch "đặc biệt chú ý" nhưng không nói chú ý **cái gì**: không có dấu hiệu đột quỵ, nhồi máu cơ tim, ngưỡng huyết áp cần chăm sóc ngay, dấu hiệu say độ cao nặng. Danh mục `sinh-ly-va-trao-doi-chat` không có khung "không thay thế tư vấn y tế", nên trang hiện **không có dòng lưu ý y tế nào**. Bài cùng danh mục `van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao` đã giải quyết bằng một dòng lưu ý viết trong thân bài — tiền lệ dùng được. | Thêm D9 trước Kết luận; dòng lưu ý ở cuối D10. |

## B. Nên sửa — 9 mục

| # | Vị trí | Mức | Vấn đề | Câu thay thế |
|---|---|---|---|---|
| B1 | Mục "Vì Sao Nhiều Người Khó Chịu Trước Khi Trời Mưa?" | CM + DD | "Một số nghiên cứu cho thấy … có thể ảnh hưởng đến đau đầu, đau nửa đầu, đau khớp" — có dè dặt, nhưng chỉ kể vế ủng hộ. Bằng chứng thật sự trái chiều: đau nửa đầu — phân tích gộp 31 nghiên cứu (Li 2025) thấy liên quan với áp suất nhưng nhỏ (OR 1,07), tổng quan Denney 2024 kết luận "inconsistent", "no causative relationship"; đau khớp — phân tích gộp 14 nghiên cứu quan sát thấy liên quan với đau thoái hoá khớp (Wang 2023), nhưng phân tích gộp các nghiên cứu case-crossover (Ferreira 2024, 15.315 người) **không** thấy liên quan với viêm khớp dạng thấp, đau gối, háng, thắt lưng; Jena 2017 (1,55 triệu người ≥65 tuổi) không thấy lượt khám vì đau khớp/lưng tăng vào ngày mưa. Quy tắc 7: bất đồng thật thì nói là bất đồng. "Đau đầu" (chung, không phải migraine) không có nguồn nào trong gói. | Xem D5. |
| B2 | Mục áp suất: "Ở mực nước biển, áp suất khí quyển **trung bình** khoảng 1013 hPa, 760 mmHg" | — (nhẹ) | NOAA: "The **standard** pressure at sea-level is 1013.25 … hPa"; "standard air pressure is 29.92 inches of mercury" (= 760 mmHg). Đó là giá trị chuẩn quy ước, không phải trung bình đo được. | Xem D2. |
| B3 | Mục "Vì Sao Trời Lạnh…", câu 1 ("được chứng minh có ảnh hưởng rõ rệt") + danh sách cơ chế | DD (nhẹ) + thiếu số đo | Hướng đúng, nhưng không có số đo nào và cơ chế không nguồn. Có số đo thật: Alpérovitch 2009, huyết áp tâm thu chênh 8,0 mmHg giữa nhóm ngày lạnh nhất và ấm nhất, thay đổi lớn hơn ở người ≥80 tuổi. Cơ chế có nguồn: co mạch dưới da qua giao cảm khi lạnh, mạnh hơn ở người tăng huyết áp, yếu hơn ở người cao tuổi (Alba 2019). "Chứng minh" cho một mối liên hệ quan sát nên đổi thành mô tả đồng thuận (ESH 2020). | Xem D3. |
| B4 | Mục "Những Ai Nhạy Cảm Với Thời Tiết?" | S2 + KQ | Danh sách đúng hướng nhưng không gắn nguồn, và gộp mọi loại thời tiết thành một. Nguồn tách được: người ≥80 tuổi nhạy với nhiệt độ hơn (Alpérovitch 2009); người đang điều trị tăng huyết áp (ESH 2020); nhóm dễ bị ảnh hưởng khi **nắng nóng** theo NHS (≥65 tuổi, bệnh tim, bệnh hô hấp, đái tháo đường, bệnh thận, dùng nhiều thuốc); người đau nửa đầu (Li 2025). "Nên theo dõi huyết áp thường xuyên hơn trong các giai đoạn thời tiết thay đổi mạnh" — nguồn nói hẹp hơn: theo dõi khi **nhiệt độ cực đoan** (Alpérovitch), xác nhận thay đổi theo mùa bằng đo tại nhà/đo 24 giờ (ESH). | Xem D7. |
| B5 | Tiêu đề mục "… Hoặc **Đi Máy Bay**?" | S2 | Tiêu đề hứa nói về máy bay, thân mục không có câu nào. Áp suất cabin máy bay không có trong nguồn đã đọc (trang CDC Yellow Book trả 403). Parati 2018 chỉ ghi khuyến nghị cho độ cao "can be applied also for air travel, although specific data in this regard are largely missing". | Bỏ "đi máy bay" khỏi tiêu đề (D6). Nếu muốn giữ chủ đề máy bay, cần nguồn riêng — xem E. |
| B6 | Mục "Hạn Chế …": "Ngủ đủ giấc", "Duy trì vận động đều đặn" | S2 (nhẹ) | Không sai về sức khoẻ chung, nhưng không nguồn nào trong gói gắn hai việc này với thời tiết. Vận động hạ huyết áp ở người tăng huyết áp đã có nguồn trong bài `van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao` (Cornelissen & Smart 2013) — dẫn sang đó thay vì nói lại. | D8 bỏ "ngủ đủ giấc", giữ vận động kèm link nội bộ. |
| B7 | Tiêu đề, tiêu đề mục | VP | Viết hoa mọi chữ kiểu tiêu đề tiếng Anh. | Tiêu đề: "Biến động thời tiết và hệ tim mạch: vì sao thời tiết có thể ảnh hưởng đến huyết áp?" (giữ slug). Tiêu đề mục viết hoa kiểu câu như D. `seoTitle` giữ nguyên. |
| B8 | Ảnh bìa | a11y — kiểm từ chữ, **chưa xem ảnh** | Ghi công "Ảnh: Colin Lloyd - [Unsplash](…)" có, đúng dạng. Alt ("bầu trời giông bão … con đường cao tốc vắng xe") khớp với slug trang Unsplash ("gray-asphalt-road-under-gray-clouds"). Alt có thể do máy viết; agent không xem ảnh nên không xác nhận "cao tốc", "vắng xe". Ảnh hợp chủ đề thời tiết, không gợi ý gì sai về y khoa. | Người xem ảnh rồi giữ hoặc sửa alt (E). |
| B9 | Liên kết, thuật ngữ, entity | SEO | Không link nội bộ (gate SEO ≥3); `entityId` trống. Mục từ `huyet-ap` trong `prisma/seed-data/glossary.json` đã có dấu duyệt (science-editor, 2026-09-25). | D12 ("Đọc thêm", 4 bài PUBLISHED + PASSED, đã truy vấn CSDL). D1 dùng `[[huyết áp]]` ở lần nhắc đầu. Entity: knowledge-graph-manager (E). |

## C. Nguồn đề xuất (đã kiểm tồn tại)

Mọi DOI đã tra Crossref (api.crossref.org, ngày 2026-10-09): 14/14 DOI dưới đây trả 200, khớp tiêu đề, tạp chí, năm, tập/trang. (Một DOI tự đoán cho Hoffmann 2011, *J Neurol*, trả 404 → không dùng, không đưa vào bảng.) Abstract đọc qua Europe PMC REST. Toàn văn đọc qua Europe PMC fullTextXML khi có (Parati 2018). Trang cơ quan y tế tải bằng curl và đọc ngày 2026-10-09. Không dùng `medlineplus.gov/ency/` và OpenStax.

**Bậc 1 — nghiên cứu, tổng quan, đồng thuận:**

| Nguồn | Đã đọc để kiểm | Dùng cho |
|---|---|---|
| Stergiou, Palatini, Modesti, Asayama et al. Seasonal variation in blood pressure: evidence, consensus and recommendations for clinical practice. Consensus statement by the European Society of Hypertension Working Group on BP Monitoring and Cardiovascular Variability. *J Hypertens* 2020;38(7):1235–1243. doi:10.1097/HJH.0000000000002341 | **Chỉ abstract** (không có toàn văn mở): huyết áp thấp hơn khi nóng, cao hơn khi lạnh; "global phenomenon affecting both sexes, all age groups, normotensive individuals, and hypertensive patients"; người đang điều trị: "excessive BP decline in summer, or rise in winter"; triệu chứng khi trời nóng gợi ý điều trị quá mức "must be investigated"; xác nhận bằng đo lặp lại, "preferably with home or ambulatory BP monitoring"; loại trừ nguyên nhân khác; khuyến nghị dành cho nhân viên y tế. | A3, A7, B3, B4, D3, D4, D7, D8, D9, D10, D11 |
| Alpérovitch, Lacombe, Hanon, Dartigues et al. Relationship between blood pressure and outdoor temperature in a large sample of elderly individuals: the Three-City study. *Arch Intern Med* 2009;169(1):75–80. doi:10.1001/archinternmed.2008.512 | Abstract: 8.801 người ≥65 tuổi; huyết áp tâm thu chênh 8,0 mmHg giữa ngũ phân vị nhiệt độ thấp nhất và cao nhất (≥21,2°C); trong cùng người, nhiệt độ cao hơn → huyết áp thấp hơn; thay đổi lớn hơn ở người ≥80 tuổi; "careful monitoring of blood pressure and antihypertensive treatment" trong giai đoạn nhiệt độ cực đoan. | B3, B4, D3, D7 |
| Modesti, Morabito, Bertolozzi, Massetti et al. Weather-related changes in 24-hour blood pressure profile: effects of age and implications for hypertension management. *Hypertension* 2006;47(2):155–161. doi:10.1161/01.HYP.0000199192.17126.d4 | Abstract: 6.404 người; ngày nóng: huyết áp phòng khám và 24 giờ thấp hơn, ngày lạnh cao hơn; huyết áp tâm thu ban đêm cao hơn vào ngày nóng ở người cao tuổi đang điều trị; tác giả cho là có thể do phác đồ nhẹ hơn vào mùa hè. | A7, D4 |
| Jehn et al. The effect of ambient temperature and barometric pressure on ambulatory blood pressure variability. *Am J Hypertens* 2002;15(11):941–945. doi:10.1016/S0895-7061(02)02999-0 | Abstract: 333 người huyết áp trên mức tối ưu hoặc tăng huyết áp giai đoạn 1 (thử nghiệm DASH); độ dao động huyết áp tâm thu liên quan nghịch với nhiệt độ; "no observed association between BP variability and barometric pressure"; dao động khi lạnh "may contribute to the high cardiovascular mortality observed in the winter". | A3, A4, D2, D3 |
| Kamiński, Cieślik-Guerra, Kotas, Mazur et al. Evaluation of the impact of atmospheric pressure in different seasons on blood pressure in patients with arterial hypertension. *Int J Occup Med Environ Health* 2016;29(5):783–792. doi:10.13075/ijomeh.1896.00546 | Abstract: 1.662 người đang điều trị tăng huyết áp ở Łódź (Ba Lan); phần lớn nghiên cứu trước dùng áp suất trung bình ngày "have found no correlation"; liên quan nghịch chỉ ở ban ngày mùa xuân (tâm thu, tâm trương) và ban đêm mùa đông (tâm thu). | A3, D2 |
| Alba, Castellani, Charkoudian. Cold-induced cutaneous vasoconstriction in humans: function, dysfunction and the distinctly counterproductive. *Exp Physiol* 2019;104(8):1202–1214. doi:10.1113/EP087718 | **Chỉ abstract**: co mạch dưới da do thần kinh giao cảm là "first line of defense" chống mất nhiệt; người cao tuổi khoẻ mạnh có phản xạ co mạch suy giảm; tăng huyết áp đi kèm co mạch tăng, có thể ảnh hưởng hậu gánh thất trái ở người vốn có nguy cơ. | B3, D3 |
| Gasparrini, Guo, Hashizume, Lavigne et al. Mortality risk attributable to high and low ambient temperature: a multicountry observational study. *Lancet* 2015;386(9991):369–375. doi:10.1016/S0140-6736(14)62114-0 | Abstract: 74.225.200 ca tử vong, 384 địa điểm, 13 nước (có Thái Lan); 7,71% tử vong gắn với nhiệt độ không tối ưu; lạnh 7,29% so với nóng 0,42%; nhiệt độ cực đoan chỉ 0,86%; "effect of days of extreme temperature was substantially less than that attributable to milder but non-optimum weather". Tử vong mọi nguyên nhân. | A4, D3 |
| Parati, Agostoni, Basnyat, Bilo et al. Clinical recommendations for high altitude exposure of individuals with pre-existing cardiovascular conditions (ESC/ESH/ISMM…). *Eur Heart J* 2018;39(17):1546–1554. doi:10.1093/eurheartj/ehx720 | **Toàn văn (PMC5930248)**: áp suất riêng phần oxy hít vào giảm 25% ở 2.500 m, 60% ở 8.000 m; bù bằng tăng thông khí, tăng nhịp tim, đổi trương lực mạch, tăng hemoglobin; thiếu oxy → thụ thể hoá học xoang cảnh → giao cảm → co mạch; "significant and persistent arterial BP increase … proportional to the altitude reached and more evident at night", ít nhất 7 ngày đầu; bảng 3: tăng huyết áp vừa–nặng/nguy cơ cao kiểm tra huyết áp trước và trong chuyến đi, nhẹ/kiểm soát tốt có thể lên >4.000 m với điều trị đầy đủ, nặng/chưa kiểm soát tránh lên cao; bảng 2: người bệnh tim mạch "should continue pre-existing medications", mọi thay đổi bàn với bác sĩ; về máy bay "specific data … largely missing". | A2, A3, A5, B5, D2, D6 |
| Kimoto, Aiba, Takashima, Suzuki et al. Influence of barometric pressure in patients with migraine headache. *Intern Med* 2011;50(18):1923–1928. doi:10.2169/internalmedicine.50.5640 | Abstract: 28 người đau nửa đầu, nhật ký 1 năm; cơn tăng khi áp suất giảm >5 hPa từ ngày đau sang ngày sau; 18/28 người liên quan với thời tiết; không liên quan với áp suất trung bình tháng. | A2, B1, D2, D5 |
| Li, Liu, Ma, Fang et al. Association between weather conditions and migraine: a systematic review and meta-analysis. *J Neurol* 2025;272(5). doi:10.1007/s00415-025-13078-0 | Abstract: 31 nghiên cứu; thời tiết được báo cáo là yếu tố khởi phát (RD 0,47); nhiệt độ OR 1,15 (1,02–1,29), áp suất OR 1,07 (1,01–1,15), độ ẩm không liên quan. Abstract không nói chiều (tăng hay giảm) của áp suất → D5 không nói chiều. | B1, B4, D5, D7 |
| Denney, Lee, Joshi. Whether weather matters with migraine. *Curr Pain Headache Rep* 2024;28(4):181–187. doi:10.1007/s11916-024-01216-8 | Abstract: kết quả "inconsistent"; nhiều người coi thời tiết là yếu tố khởi phát "yet we see no causative relationship"; khác biệt lớn giữa từng người. | B1, D5 |
| Wang, Xu, Chen, Zhu et al. Associations between weather conditions and osteoarthritis pain: a systematic review and meta-analysis. *Ann Med* 2023;55(1). doi:10.1080/07853890.2023.2196439 | Abstract: 14 nghiên cứu quan sát; 13/14 thấy thời tiết nói chung liên quan với đau thoái hoá khớp; cần thêm nghiên cứu. | B1, D5 |
| Ferreira, Hunter, Fu, Raihana et al. Come rain or shine: is weather a risk factor for musculoskeletal pain? A systematic review with meta-analysis of case-crossover studies. *Semin Arthritis Rheum* 2024;65:152392. doi:10.1016/j.semarthrit.2024.152392 | Abstract: 11 nghiên cứu, 15.315 người; không liên quan giữa độ ẩm, áp suất, nhiệt độ, lượng mưa với viêm khớp dạng thấp, đau gối, háng, thắt lưng; gút liên quan với nóng + khô (OR 2,04). | B1, D5 |
| Jena, Olenski, Molitor, Miller. Association between rainfall and diagnoses of joint or back pain: retrospective claims analysis. *BMJ* 2017;359:j5326. doi:10.1136/bmj.j5326 | Abstract: 1.552.842 người ≥65 tuổi (Medicare), 11,67 triệu lượt khám; không liên quan giữa mưa và lượt khám vì đau khớp/lưng; "a relation may still exist". | B1, D5 |

**Bậc 2 — cơ quan y tế, khí tượng (đã đọc đoạn trích):**

| Nguồn | Đã đọc | Dùng cho |
|---|---|---|
| NOAA JetStream — Air Pressure. https://www.noaa.gov/jetstream/atmosphere/air-pressure | "standard pressure at sea-level is 1013.25 … hPa"; "standard air pressure is 29.92 inches of mercury"; một nửa phân tử không khí nằm trong 5,6 km đầu; áp suất "almost always changing", dao động hai lần mỗi ngày, thay đổi lớn hơn theo các hệ thời tiết H/L; trích Brewer 1848: khí áp kế tụt và giữ thấp → "expect much wet in a few days, and probably wind". | B2, D2, D5 |
| NHS — Altitude sickness. https://www.nhs.uk/conditions/altitude-sickness/ (reviewed 31/7/2023) | Thường >2.500 m; dễ gặp khi lên nhanh; triệu chứng bắt đầu 6–10 giờ; đau đầu, chán ăn, buồn nôn/nôn, mệt, chóng mặt, khó ngủ; đỡ sau 1–3 ngày; không đỡ sau 1 ngày → xuống 300–1.000 m; "Get medical help immediately" nếu rất mệt, lú lẫn, mất thăng bằng/phối hợp, ảo giác, khó thở cả khi nghỉ, ho/khạc đờm bọt hoặc lẫn máu, da/môi/lưỡi/móng xanh xám, buồn ngủ li bì; phòng: lên chậm, uống đủ nước, không rượu, hỏi bác sĩ nếu từng bị. | A5, D6, D9 |
| NHS — Heatwave: how to cope in hot weather. https://www.nhs.uk/live-well/seasonal-health/heatwave-how-to-cope-in-hot-weather/ (reviewed 12/6/2026) | Rủi ro chính: mất nước, quá nóng làm nặng triệu chứng tim/hô hấp, kiệt sức do nóng, sốc nhiệt; nhóm dễ bị: ≥65 tuổi, bệnh tim, hô hấp, đái tháo đường, bệnh thận…, dùng nhiều thuốc; tránh nắng 11–15 giờ, quần áo nhẹ, tránh hoạt động làm nóng thêm, "Drink extra fluids but avoid alcohol, caffeine and hot drinks". | A7, B4, D4, D7, D8 |
| NHS — Winter vaccinations and winter health (mục "Keep warm and get help with heating"). https://www.nhs.uk/live-well/seasonal-health/keep-warm-keep-well/ (URL chuyển hướng về trang này) | "Keeping warm over the winter months can help to prevent colds, flu and more serious health problems such as heart attacks, strokes…"; sưởi các phòng thường dùng "at least 18°C", "particularly important if you have a health condition". | D8 |
| NHS — Symptoms of a stroke. https://www.nhs.uk/conditions/stroke/symptoms/ (reviewed 12/9/2024) | Mặt xệ một bên, yếu/tê một tay, nói ngọng/lú; FAST; triệu chứng tự hết vẫn phải gọi cấp cứu; không tự lái xe. | D9 |
| NHLBI — Living With High Blood Pressure. https://www.nhlbi.nih.gov/health/high-blood-pressure/living-with | "continue your treatment plan"; theo dõi tại nhà nếu được khuyên, ứng dụng theo dõi; "Readings above 180/120 mm Hg are dangerously high and require immediate medical attention"; gọi cấp cứu nếu đau đầu dữ dội đột ngột, khó thở, đau dữ dội đột ngột ở bụng/ngực/lưng, tê hoặc yếu, thay đổi thị lực đột ngột, khó nói; triệu chứng nhồi máu cơ tim (đau/đè ép/bóp nghẹt ngực kéo dài hơn vài phút hoặc đến rồi đi, khó thở, khó chịu ở tay/lưng/cổ/hàm/bụng trên, buồn nôn, chóng mặt, ngất, vã mồ hôi lạnh); F.A.S.T. | D8, D9 |
| NHLBI — Living With Heart Failure. https://www.nhlbi.nih.gov/health/heart-failure/living-with | "You may also be asked to limit the amount of salt and liquids that you drink to reduce fluid buildup." | A6, D8 |

**Bài trong kho đã đối chiếu (không mâu thuẫn):** `huyet-ap-cao-theo-tac-dong-cot-song` dùng ngưỡng NHLBI 180/120 theo nghĩa "tâm thu trên 180 **hoặc** tâm trương trên 120" — D9 dùng cùng cách đọc. `van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao` dùng NHLBI "tiếp tục kế hoạch điều trị, không tự bỏ thuốc" — D8 nói cùng ý. `co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho` nói về giảm áp cực đoan (chân không), không chồng lấn. `dau-nua-dau-theo-tac-dong-cot-song` không có câu nào về thời tiết.

## D. Đoạn thay thế

### D1 — thay khối sơ đồ ```` ```text ```` đầu thân bài (từ dòng ```` ```text ```` tới dòng ```` ``` ```` đóng)

```markdown
[[huyết áp|Huyết áp]] không cố định mà thay đổi theo nhiều yếu tố, trong đó có thời tiết. Trong các yếu tố thời tiết, nhiệt độ là yếu tố có bằng chứng rõ nhất: huyết áp thường cao hơn khi trời lạnh và thấp hơn khi trời nóng. Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao; còn với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng tới huyết áp chưa nhất quán.
```

### D2 — thay toàn mục "## Vai Trò Của Áp Suất Khí Quyển"

```markdown
## Áp suất khí quyển

Áp suất khí quyển là lực do khối không khí phía trên đè lên mỗi đơn vị diện tích. Theo Cơ quan Quản lý Khí quyển và Đại dương Quốc gia Hoa Kỳ (NOAA), áp suất chuẩn ở mực nước biển là 1013,25 hPa, tương đương 29,92 inch thuỷ ngân (khoảng 760 mmHg). Áp suất gần như luôn thay đổi: nó lên xuống hai lần mỗi ngày theo nhiệt của Mặt Trời, và thay đổi nhiều hơn khi các hệ thời tiết — vùng áp cao, vùng áp thấp — di chuyển qua.

Càng lên cao, không khí càng loãng và áp suất càng giảm; khoảng một nửa số phân tử không khí của khí quyển nằm trong 5,6 km đầu tiên tính từ mặt đất. Không khí loãng nên mỗi hơi thở đưa vào ít oxy hơn: ở độ cao 2.500 m, áp suất riêng phần của oxy hít vào thấp hơn khoảng 25% so với ở mực nước biển.

Hai thang đo này cách nhau rất xa. Mức giảm áp suất hơn 5 hPa trong một ngày — mốc được dùng trong một nghiên cứu về đau nửa đầu — chỉ bằng khoảng 0,5% áp suất khí quyển. Vì vậy, điều đúng ở núi cao, nơi cơ thể thật sự thiếu oxy, không thể suy ra cho một ngày trời chuyển mưa.

Bằng chứng về ảnh hưởng của dao động áp suất hằng ngày lên huyết áp cũng chưa nhất quán. Trong một thử nghiệm trên 333 người có huyết áp trên mức tối ưu hoặc tăng huyết áp giai đoạn 1, được đo huyết áp liên tục 24 giờ, độ dao động huyết áp liên quan với nhiệt độ nhưng không liên quan với áp suất khí quyển. Một nghiên cứu ở Ba Lan trên 1.662 người đang điều trị tăng huyết áp ghi nhận phần lớn các nghiên cứu trước đó không thấy tương quan giữa áp suất trung bình trong ngày và huyết áp; bản thân nghiên cứu này thấy huyết áp cao hơn vào những lúc áp suất thấp, nhưng chỉ ở ban ngày mùa xuân và, với huyết áp tâm thu, ở ban đêm mùa đông.
```

### D3 — thay toàn mục "## Vì Sao Trời Lạnh Dễ Làm Huyết Áp Tăng?"

```markdown
## Vì sao trời lạnh thường làm huyết áp tăng?

Huyết áp thay đổi theo mùa: thấp hơn khi trời nóng, cao hơn khi trời lạnh. Theo tuyên bố đồng thuận năm 2020 của Hội Tăng huyết áp châu Âu (ESH), đây là hiện tượng toàn cầu, gặp ở cả nam và nữ, ở mọi lứa tuổi, ở cả người huyết áp bình thường lẫn người tăng huyết áp.

Một nghiên cứu ở Pháp trên 8.801 người từ 65 tuổi thấy huyết áp tâm thu giảm dần khi nhiệt độ ngoài trời tăng, chênh nhau 8,0 mmHg giữa nhóm ngày lạnh nhất và nhóm ngày ấm nhất (từ 21,2°C trở lên). Ở cùng một người, lần đo vào ngày ấm hơn cho huyết áp thấp hơn, và mức thay đổi lớn hơn ở người từ 80 tuổi trở lên.

Một cơ chế chính là phản xạ giữ nhiệt. Khi da lạnh, các dây thần kinh giao cảm làm mạch máu dưới da co lại, giảm lượng máu chảy qua da để bớt mất nhiệt. Ở người tăng huyết áp, phản ứng co mạch này mạnh hơn bình thường, và có thể làm tăng gánh cho tim ở những người vốn đã có nguy cơ tim mạch. Ngược lại, ở người cao tuổi khỏe mạnh, phản xạ co mạch yếu đi, nên họ khó giữ thân nhiệt hơn khi trời lạnh.

Cái lạnh cũng gắn với số ca tử vong cao hơn. Một nghiên cứu trên hơn 74 triệu ca tử vong do mọi nguyên nhân ở 13 nước, gồm cả nước nhiệt đới như Thái Lan, thấy số ca tử vong gắn với cái lạnh nhiều hơn hẳn số ca gắn với cái nóng — và phần lớn gắn với những ngày lạnh vừa phải, không phải những đợt rét cực đoan. Huyết áp tăng và dao động nhiều hơn khi trời lạnh được cho là có thể góp phần vào số ca tử vong do tim mạch cao hơn vào mùa đông.
```

### D4 — thêm mục mới ngay sau D3, trước mục "Đau đầu và đau khớp khi trời chuyển mưa" (D5)

```markdown
## Khi trời nóng

Trời nóng thì huyết áp thường thấp hơn. Với người đang dùng thuốc hạ huyết áp, ESH lưu ý điều này có thể khiến huyết áp hạ quá mức vào mùa hè, cũng như có thể tăng lên vào mùa lạnh. Theo ESH, những triệu chứng xuất hiện khi trời nóng lên và gợi ý điều trị quá mức cần được bác sĩ kiểm tra; thay đổi huyết áp theo mùa cần được xác nhận bằng nhiều lần đo, tốt nhất là đo tại nhà hoặc đo liên tục 24 giờ, và cần loại trừ các nguyên nhân khác trước khi điều chỉnh thuốc.

Giảm thuốc vào mùa hè cũng không đơn giản. Trong một nghiên cứu ở Ý trên 6.404 người, ngày nóng đi kèm huyết áp ban ngày thấp hơn, nhưng ở người cao tuổi đang điều trị tăng huyết áp, huyết áp tâm thu ban đêm lại cao hơn; các tác giả cho rằng có thể do phác đồ thuốc nhẹ hơn vào mùa hè không đủ giữ huyết áp về đêm. Vì vậy, đổi liều là việc bác sĩ quyết định dựa trên số đo, không phải việc tự làm theo mùa.

Nắng nóng còn có những nguy cơ riêng. Theo Dịch vụ Y tế Quốc gia Anh (NHS), rủi ro chính của đợt nắng nóng là mất nước; cơ thể quá nóng, làm nặng thêm triệu chứng ở người có bệnh tim hoặc bệnh hô hấp; và kiệt sức do nóng, sốc nhiệt.
```

### D5 — thay toàn mục "## Vì Sao Nhiều Người Khó Chịu Trước Khi Trời Mưa?"

```markdown
## Đau đầu và đau khớp khi trời chuyển mưa

Áp suất khí quyển thường giảm khi một hệ thời tiết xấu kéo đến; NOAA còn trích một sách phổ biến khoa học năm 1848 viết rằng khí áp kế tụt mạnh và giữ ở mức thấp báo hiệu mưa nhiều, có thể kèm gió, trong vài ngày tới. Nhiều người bị đau nửa đầu kể thời tiết là yếu tố làm khởi phát cơn đau, và nhiều người bị đau khớp cũng nói như vậy. Bằng chứng khoa học về điều này còn trái chiều.

- **Đau nửa đầu (migraine).** Một phân tích gộp 31 nghiên cứu công bố năm 2025 thấy cơn đau nửa đầu có liên quan với nhiệt độ và áp suất khí quyển, nhưng mức liên quan nhỏ: tỉ số chênh (một thước đo mức độ liên quan) khoảng 1,07 với áp suất và 1,15 với nhiệt độ. Trong một nghiên cứu ở Nhật Bản, 28 người bị đau nửa đầu ghi nhật ký suốt một năm: cơn đau thường gặp hơn khi áp suất giảm hơn 5 hPa từ ngày này sang ngày sau, và 18 người có cơn đau liên quan với thời tiết. Một tổng quan năm 2024 kết luận kết quả các nghiên cứu không nhất quán, mức độ nhạy cảm khác nhau nhiều giữa từng người, và chưa thấy quan hệ nhân quả.
- **Đau khớp, đau lưng.** Một phân tích gộp 14 nghiên cứu quan sát (2023) thấy thời tiết nói chung có liên quan với cơn đau ở người thoái hoá khớp. Nhưng một phân tích gộp khác (2024), chỉ gồm những nghiên cứu so sánh mỗi người với chính họ ở các thời điểm khác nhau, không thấy độ ẩm, áp suất, nhiệt độ hay lượng mưa làm tăng nguy cơ đau ở người viêm khớp dạng thấp, đau gối, đau háng hay đau thắt lưng; chỉ bệnh gút có liên quan với thời tiết nóng và khô. Một phân tích dữ liệu bảo hiểm của hơn 1,5 triệu người Mỹ từ 65 tuổi cũng không thấy lượt khám vì đau khớp, đau lưng tăng vào những ngày mưa.

Nếu những liên hệ này có thật, cơ chế của chúng vẫn chưa rõ.
```

### D6 — thay toàn mục "## Điều Gì Xảy Ra Khi Lên Núi Cao Hoặc Đi Máy Bay?"

```markdown
## Khi lên núi cao

Lên cao, không khí loãng hơn nên máu nhận ít oxy hơn. Theo khuyến nghị chung năm 2018 của Hội Tim mạch châu Âu (ESC), Hội Tăng huyết áp châu Âu và các hội y học miền núi, cơ thể bù lại bằng cách thở nhiều hơn, tăng nhịp tim để bơm nhiều máu hơn, thay đổi trương lực mạch máu và dần dần tăng nồng độ hemoglobin. Lượng oxy thấp trong máu kích thích các thụ thể hoá học ở xoang cảnh, từ đó kích hoạt hệ thần kinh giao cảm và làm mạch máu co lại. Kết quả là huyết áp tăng rõ ngay sau khi đến nơi cao, tăng nhiều hơn khi lên càng cao, rõ hơn về đêm, và kéo dài ít nhất trong 7 ngày đầu.

Cũng theo khuyến nghị này:

- Người tăng huyết áp nhẹ hoặc đã kiểm soát tốt có thể lên rất cao (trên 4.000 m) nếu được điều trị đầy đủ.
- Người tăng huyết áp mức vừa đến nặng, hoặc có nguy cơ tim mạch từ trung bình trở lên, nên kiểm tra huyết áp trước và trong chuyến đi.
- Người tăng huyết áp nặng hoặc chưa kiểm soát được nên tránh lên cao, để phòng tổn thương cơ quan.
- Người bệnh tim mạch nên tiếp tục dùng các thuốc đang dùng khi lên cao; mọi thay đổi điều trị cần bàn với bác sĩ trước.

Huyết áp tăng là một chuyện; **say độ cao** là chuyện khác, do cơ thể chưa quen với lượng oxy thấp. Theo NHS, say độ cao thường xảy ra ở độ cao trên 2.500 m, dễ gặp hơn khi lên cao nhanh, và triệu chứng thường bắt đầu 6–10 giờ sau khi đến nơi: đau đầu, chán ăn, buồn nôn hoặc nôn, mệt, chóng mặt, khó ngủ. Triệu chứng thường đỡ sau 1–3 ngày nghỉ ở cùng độ cao; nếu nặng lên hoặc không đỡ sau 1 ngày, nên xuống thấp hơn khoảng 300–1.000 m. Để giảm nguy cơ, NHS khuyên lên cao từ từ, uống đủ nước, không uống rượu, và hỏi bác sĩ trước chuyến đi nếu từng bị say độ cao.

Khó thở cả khi nghỉ, lú lẫn hay mất thăng bằng **không** phải triệu chứng chờ cơ thể thích nghi, mà là dấu hiệu cần trợ giúp y tế ngay — xem mục "Khi nào cần đi khám hoặc gọi cấp cứu".
```

### D7 — thay toàn mục "## Những Ai Nhạy Cảm Với Thời Tiết?"

```markdown
## Ai cần chú ý hơn khi thời tiết thay đổi?

- **Người cao tuổi**, nhất là từ 80 tuổi: huyết áp thay đổi theo nhiệt độ nhiều hơn, và phản xạ giữ nhiệt khi lạnh yếu hơn. NHS xếp người từ 65 tuổi vào nhóm dễ bị ảnh hưởng nhất khi nắng nóng.
- **Người đang điều trị tăng huyết áp**: huyết áp có thể hạ quá mức khi trời nóng hoặc tăng khi trời lạnh (ESH).
- **Người có bệnh tim, bệnh hô hấp, đái tháo đường, bệnh thận**, và **người dùng nhiều loại thuốc**: NHS xếp vào nhóm dễ bị ảnh hưởng khi nắng nóng.
- **Người có bệnh tim mạch định lên núi cao**: xem khuyến nghị ở mục "Khi lên núi cao".
- **Người bị đau nửa đầu**: một số người thấy cơn đau liên quan với thời tiết, dù mức độ khác nhau nhiều giữa từng người.

Nhóm nghiên cứu ở Pháp nói trên cho rằng theo dõi kỹ huyết áp và việc dùng thuốc trong những đợt nóng hoặc lạnh cực đoan có thể giúp giảm hậu quả của dao động huyết áp ở người cao tuổi. ESH khuyên xác nhận thay đổi theo mùa bằng đo lặp lại, tốt nhất là đo tại nhà hoặc đo liên tục 24 giờ.
```

### D8 — thay toàn mục "## Hạn Chế Ảnh Hưởng Của Thời Tiết Đến Hệ Tim Mạch"

```markdown
## Giảm ảnh hưởng của thời tiết lên tim mạch

- **Giữ ấm khi trời lạnh.** NHS cho rằng giữ ấm trong mùa đông giúp phòng cảm lạnh, cúm và những vấn đề nặng hơn như nhồi máu cơ tim, đột quỵ. Nếu được, giữ nhiệt độ các phòng thường dùng, như phòng khách và phòng ngủ, từ 18°C trở lên — nhất là khi có bệnh.
- **Tránh nóng khi trời nóng.** NHS khuyên tránh nắng, nhất là từ 11 giờ đến 15 giờ; mặc quần áo nhẹ; tránh hoạt động làm người nóng thêm; uống thêm nước, tránh rượu, cà phê và đồ uống nóng.
- **Nếu bác sĩ đã dặn hạn chế muối và nước** — điều có thể gặp ở người suy tim, theo Viện Tim, Phổi và Máu Hoa Kỳ (NHLBI) — thì làm theo lời dặn ấy, không theo lời khuyên chung "uống thêm nước"; hỏi bác sĩ nên làm gì khi trời nóng.
- **Đo huyết áp tại nhà** nếu bác sĩ khuyên, và ghi lại kết quả (NHLBI).
- **Không tự ý đổi hay bỏ thuốc** vì trời nóng hay lạnh. NHLBI khuyên người đã được chẩn đoán tăng huyết áp tiếp tục kế hoạch điều trị; đổi liều theo mùa là việc bác sĩ quyết định dựa trên số đo (ESH).
- **Vận động đều đặn** giúp hạ huyết áp ở người tăng huyết áp — xem [Vận động thay đổi tim và mạch máu như thế nào](/articles/van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao).
```

### D9 — thêm mục mới, đặt ngay trước "## Kết luận"

```markdown
## Khi nào cần đi khám hoặc gọi cấp cứu

**Gọi cấp cứu ngay** nếu bạn hoặc người bên cạnh:

- Có dấu hiệu đột quỵ, thường đến đột ngột: một bên mặt xệ xuống, khó cười; yếu hoặc tê một tay, không giơ được cả hai tay lên; nói ngọng hoặc nói lẫn lộn (NHS). Gọi cấp cứu kể cả khi các dấu hiệu đã tự hết.
- Có dấu hiệu nhồi máu cơ tim: đau, đè ép, bóp nghẹt hoặc nặng ở giữa hoặc bên trái ngực, kéo dài hơn vài phút hoặc hết rồi lại đến; khó thở; khó chịu ở một hoặc hai tay, lưng, cổ, hàm hoặc vùng bụng trên; buồn nôn, chóng mặt, ngất hoặc vã mồ hôi lạnh (NHLBI).
- Đo huyết áp trên 180/120 mmHg — chỉ cần tâm thu trên 180 **hoặc** tâm trương trên 120 — kèm đau đầu dữ dội đột ngột, khó thở, đau dữ dội đột ngột ở bụng, ngực hoặc lưng, tê hoặc yếu, thay đổi thị lực đột ngột hoặc khó nói. Theo NHLBI, huyết áp ở mức này là nguy hiểm và cần được chăm sóc y tế ngay.
- Đang ở nơi cao và có triệu chứng say độ cao kèm cảm thấy rất mệt, lú lẫn, mất thăng bằng hoặc khó phối hợp động tác, thấy hoặc nghe những thứ không có thật, khó thở cả khi nghỉ, ho hoặc khạc đờm có bọt hay lẫn máu, da, môi, lưỡi hoặc móng tím tái, buồn ngủ li bì hoặc khó đánh thức (NHS). Xuống thấp hơn khoảng 300–1.000 m ngay nếu có thể.

**Đi khám** nếu đang dùng thuốc hạ huyết áp mà thấy chóng mặt, choáng váng khi trời nóng lên, hoặc số đo tại nhà thay đổi rõ theo mùa — bác sĩ sẽ quyết định có cần điều chỉnh thuốc hay không (ESH).
```

### D10 — thay toàn mục "## Kết Luận"

```markdown
## Kết luận

Trong các yếu tố thời tiết, nhiệt độ có ảnh hưởng rõ nhất tới huyết áp: trời lạnh làm mạch máu dưới da co lại và huyết áp thường cao hơn; trời nóng thì huyết áp thường thấp hơn, đôi khi hạ quá mức ở người đang dùng thuốc. Hiện tượng này gặp ở cả người huyết áp bình thường, và rõ hơn ở người cao tuổi. Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao — nơi cơ thể thiếu oxy, hệ thần kinh giao cảm được kích hoạt và huyết áp tăng. Với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng lên huyết áp, đau đầu hay đau khớp vẫn trái chiều.

Người cao tuổi và người có bệnh tim mạch nên giữ ấm khi trời lạnh, tránh nóng khi trời nóng, theo dõi huyết áp theo lời dặn của bác sĩ, và không tự đổi thuốc theo mùa.

---

*Bài viết cung cấp thông tin khoa học mang tính tham khảo, không thay thế cho tư vấn, chẩn đoán hoặc điều trị của nhân viên y tế. Nếu bạn có vấn đề sức khoẻ cụ thể, hãy trao đổi với bác sĩ.*
```

(Dòng lưu ý cuối giữ đúng nguyên văn của bài `van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao`. Nếu chủ sản phẩm chuyển bài sang `suc-khoe` — xem E — thì bỏ dòng lưu ý và gạch `---` vì khung danh mục đã hiện.)

### D11 — thay trường `title`, `summary` và `seoDescription`

Title:

```text
Biến động thời tiết và hệ tim mạch: vì sao thời tiết có thể ảnh hưởng đến huyết áp?
```

Summary:

```markdown
Huyết áp thay đổi theo thời tiết, và nhiệt độ là yếu tố có bằng chứng rõ nhất: khi trời lạnh, mạch máu dưới da co lại để giữ nhiệt và huyết áp thường cao hơn; khi trời nóng, huyết áp thường thấp hơn. Hiện tượng này gặp ở mọi lứa tuổi nhưng rõ hơn ở người cao tuổi, và có thể khiến huyết áp tăng hoặc hạ quá mức ở người đang điều trị tăng huyết áp.

Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao, nơi cơ thể thiếu oxy và huyết áp tăng. Với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng tới huyết áp, đau đầu hay đau khớp còn trái chiều.
```

seoDescription:

```text
Trời lạnh và trời nóng ảnh hưởng tới huyết áp ra sao, áp suất khí quyển tác động thế nào ở núi cao và khi trời chuyển mưa, ai cần chú ý và khi nào cần đi khám.
```

`seoTitle` ("Vì sao biến động thời tiết ảnh hưởng đến huyết áp?") và `seoKeywords` giữ nguyên.

### D12 — thêm mục mới ở cuối bài, sau dòng lưu ý của D10

```markdown
## Đọc thêm

- [Vận động thay đổi tim và mạch máu như thế nào](/articles/van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao)
- [Nguyên nhân của mùa: độ nghiêng trục, không phải khoảng cách](/articles/nguyen-nhan-cua-mua-do-nghieng-truc-khong-phai-khoang-cach)
- [Cơ thể người sẽ biến đổi thế nào trong không gian nếu không có đồ bảo hộ?](/articles/co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho)
- [Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?](/articles/stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa)
```

Cả bốn slug đã truy vấn CSDL production ngày 2026-10-09: `status = PUBLISHED`, `factCheck = PASSED`; tiêu đề chép nguyên văn từ CSDL.

**Thứ tự mục sau khi áp:** (D1) → Áp suất khí quyển (D2) → Vì sao trời lạnh thường làm huyết áp tăng? (D3) → Khi trời nóng (D4) → Đau đầu và đau khớp khi trời chuyển mưa (D5) → Khi lên núi cao (D6) → Ai cần chú ý hơn khi thời tiết thay đổi? (D7) → Giảm ảnh hưởng của thời tiết lên tim mạch (D8) → Khi nào cần đi khám hoặc gọi cấp cứu (D9) → Kết luận + dòng lưu ý (D10) → Đọc thêm (D12).

## E. Việc chưa làm / cần người

- Sửa CSDL production là việc của người (form `/admin` hoặc script người chạy). Agent không tự ghi, không đặt `reviewedById`, không đổi `factCheck`.
- **Giữ PUBLISHED hay đưa về DRAFT trong lúc sửa — chủ sản phẩm quyết.** Khuyến nghị DRAFT: A6 (khuyên người bệnh tim "uống đủ nước" mà bỏ ngoại lệ suy tim) và A5 ("khó thở" ở nơi cao bị xếp là triệu chứng chờ thích nghi) là lời khuyên an toàn sai cho đúng nhóm người đọc của bài, và trang không có khung lưu ý y tế. Nếu chủ sản phẩm chọn giữ PUBLISHED thì A5, A6, A8 phải áp trong 48 giờ.
- **Danh mục — cần chủ chốt:** bài nằm ở `sinh-ly-va-trao-doi-chat` (Sinh học) nên không có khung "không thay thế tư vấn y tế", dù có lời khuyên cho người bệnh. Hai lựa chọn: (a) giữ danh mục, thêm dòng lưu ý trong thân bài như D10 — tiền lệ `van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao`; (b) chuyển sang `suc-khoe` (category-manager; URL `/articles/<slug>` không đổi) và bỏ dòng lưu ý. Phiếu này nghiêng về (a) vì phần lớn bài là sinh lý, nhưng đây là quyết định taxonomy, không phải accuracy.
- Bài đã xuất bản nên đây là đính chính: một dòng trong `docs/content/corrections.md` cho mỗi claim đổi (ít nhất A2/A3 — mô hình "thời tiết thay đổi oxy", "người khỏe mạnh huyết áp ổn định"; A4 — "một trong những nguyên nhân … rét đậm"; A5 — "nguyên nhân gây triệu chứng", "khó thở"; A6 — "uống đủ nước"; B1 — vế phản bác về đau khớp), Revision chụp bản trước trong cùng transaction, cập nhật `lastVerifiedAt`, gắn bảng nguồn mục C cùng lượt. Chưa có bản EN nên chưa có `enEdits`; khi dịch (bước 9) dịch từ bản ĐÃ sửa.
- `reverifyDueAt`: đề xuất 12 tháng — phân tích gộp về đau nửa đầu (2025) và về đau cơ xương (2024) còn mới, mảng thời tiết–sức khoẻ đang có thêm nghiên cứu.
- **Ảnh bìa:** người xem ảnh rồi giữ hoặc sửa alt (B8). Ghi công Unsplash đã có, đúng dạng.
- **Máy bay (B5):** nếu chủ sản phẩm muốn bài nói về đi máy bay, cần nguồn riêng cho áp suất cabin và lời khuyên cho người bệnh tim khi bay (trang CDC Yellow Book bị chặn 403 trong lượt này). D6 bỏ máy bay khỏi tiêu đề thay vì viết không nguồn.
- `entityId` trống: knowledge-graph-manager gắn entity (bước 5). `readingTime` cần tính lại sau khi áp D (bài dài ra khoảng gấp ba).
- `factCheck` chỉ chuyển PASSED sau khi áp đủ mục A và người duyệt đọc lại bản đã sửa.
- **Lỗi mẫu cho prompt `article-generator` — cần science-editor quyết:** hình dạng "lời khuyên sức khoẻ nói nhẹ hơn nguồn / bỏ ngoại lệ của chính nhóm đích" nay đã gặp ba lần trong hai ngày: grounding 08/10 (lời khuyên đái tháo đường nhẹ hơn CDC/NIDDK — phiếu ấy ghi "lần 1"), sarcopenia 08/10 (khuyên tăng đạm, bỏ ngoại lệ bệnh thận nặng), và bài này (khuyên uống đủ nước, bỏ ngoại lệ suy tim; "khó thở" ở nơi cao bị nói nhẹ). Theo quy tắc "một lỗi lặp 3 lần thì sửa prompt", đề xuất thêm một quy tắc vào `.claude/skills/article-generator/SKILL.md`: *mọi lời khuyên hành động cho một nhóm bệnh phải kèm ngoại lệ mà nguồn nêu cho chính nhóm ấy, và mọi triệu chứng mà nguồn xếp là dấu hiệu cấp cứu không được liệt kê như triệu chứng thường*. Phiếu này không sửa file prompt.

## F. Ghi chú thẩm định

- **Nguồn không tải được:** trang AHA về thời tiết lạnh và tim mạch trả 403; trang CDC Yellow Book về độ cao trả 403. Không dùng hai nguồn này. Mọi lời khuyên trong D lấy từ NHS, NHLBI, NOAA (đã tải và đọc) và các bài bậc 1 ở C.
- **Chỉ đọc abstract:** Stergiou 2020 (ESH), Alba 2019, cùng các nghiên cứu khác trừ Parati 2018. D chỉ dùng điều abstract nói. Abstract Alpérovitch 2009 bị lỗi ký tự ở ngưỡng ngũ phân vị nhiệt độ thấp nhất, nên D3 chỉ nêu ngưỡng nhóm ấm nhất (≥21,2°C) và mức chênh 8,0 mmHg.
- **Con số tự tính:** "5 hPa ≈ 0,5% áp suất khí quyển" (D2) là phép chia 5 / 1013,25 = 0,49%. Mốc 5 hPa lấy từ Kimoto 2011; 1013,25 hPa từ NOAA. Đây là so sánh minh hoạ thang đo, không phải khẳng định rằng mọi thay đổi thời tiết đều ≤5 hPa — câu trong D2 nói rõ "mốc được dùng trong một nghiên cứu".
- **"Không liên quan với áp suất" (Jehn 2002)** là về **độ dao động** huyết áp 24 giờ, không phải mức huyết áp trung bình; D2 viết đúng là "độ dao động huyết áp". Cùng với Kamiński 2016, bằng chứng đủ để nói "chưa nhất quán", không đủ để nói "không ảnh hưởng" — D2 không nói "không ảnh hưởng" (tránh lập luận từ sự im lặng, quy tắc 17).
- **Gasparrini 2015** là tử vong **mọi nguyên nhân**; D3 nói rõ, và chỉ dùng nó để sửa chủ thể "rét đậm" (phần lớn gắn với lạnh vừa phải), không dùng làm số liệu tử vong tim mạch. Nhóm nước có Thái Lan nên áp dụng được cho người đọc ở khí hậu nhiệt đới; không có Việt Nam trong 13 nước.
- **Li 2025** (phân tích gộp đau nửa đầu): abstract nêu OR 1,07 cho "ambient pressure" nhưng không nói chiều; D5 không viết "áp suất giảm làm tăng cơn" ở câu về phân tích gộp, chỉ dùng chiều giảm ở câu về Kimoto 2011, nơi abstract nói rõ.
- **Ngưỡng 180/120:** trang NHLBI đã đọc ("Living With High Blood Pressure") ghi "Readings above 180/120 … require immediate medical attention" và liệt kê triệu chứng cần gọi cấp cứu. Bài `huyet-ap-cao-theo-tac-dong-cot-song` dẫn một trang NHLBI khác có thêm bước "chờ 5 phút đo lại nếu không có triệu chứng". D9 chỉ dùng điều trang đã đọc nói, và đọc 180/120 theo nghĩa "hoặc" như bài kia — không mâu thuẫn trong kho.
- **"Thay đổi trương lực mạch máu" (D6):** Parati 2018 mô tả giãn mạch ban đầu có thể hạ huyết áp chút ít, sau vài giờ bị co mạch giao cảm lấn át. D6 giữ ở mức "thay đổi trương lực" rồi nói co mạch giao cảm, không đi vào pha giãn mạch ban đầu.
- **Câu "hỏi bác sĩ nên làm gì khi trời nóng" (D8)** và "bác sĩ sẽ quyết định có cần điều chỉnh thuốc" (D9) là chỉ dẫn biên tập nối hai nguồn (NHLBI hạn chế nước; ESH chỉnh thuốc là việc của nhân viên y tế), không gán cho cơ quan nào.
- **Truy vấn CSDL:** chỉ đọc, bằng một script tạm trong `sciencepedia/scripts/`, đã xoá ngay sau khi chạy. Không ghi gì vào CSDL.
