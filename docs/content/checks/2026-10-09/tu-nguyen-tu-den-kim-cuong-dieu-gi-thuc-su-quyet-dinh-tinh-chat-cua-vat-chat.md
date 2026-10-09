# Thẩm định — Từ Nguyên Tử Đến Kim Cương: Điều Gì Thực Sự Quyết Định Tính Chất Của Vật Chất?

- Slug: `tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat`
- Trạng thái lúc thẩm định (2026-10-09): PUBLISHED qua form /admin (publishedAt 2026-10-09T04:44Z) · `factCheck = PENDING` · 0 nguồn · không `reviewedById` · chưa có bản EN (`titleEn`, `summaryEn`, `contentEn` trống) · `entityId` trống · `readingTime = 3` · danh mục `vat-ly` (lĩnh vực gốc, không phải con của `suc-khoe` → không có khung lưu ý y tế) · **không có ảnh bìa** (`coverImage`, alt, ghi công đều trống) · không có link nội bộ, không có mục "Đọc thêm" · thân bài không chứa HTML thô; có một khối sơ đồ ```` ```text ```` (nước đá → nước lỏng → hơi nước).
- **Phán quyết: SỬA (REVISE).** Không gỡ: khung bài đúng và đáng giữ (electron lớp ngoài → liên kết và cấu trúc → điều kiện nhiệt độ, áp suất → hai trạng thái đặc biệt), cặp ví dụ kim cương/than chì đúng, mô tả cấu trúc hai dạng carbon đúng về cơ bản, các ví dụ natri, clo, khí hiếm đúng. Không chỉ "giữ nguyên + thêm nguồn" vì bài vi phạm gate accuracy (0 nguồn) và có bốn chỗ để lại thông tin sai hoặc không nguồn: (1) phần tóm tắt đặt câu hỏi "vì sao oxy là khí, nước là lỏng, sắt là rắn" mà thân bài không hề trả lời, và câu trả lời nó gợi ý ("phản ứng với môi trường xung quanh") là nhân quả sai; (2) mục Plasma lấy "sấm sét" làm ví dụ plasma — sấm là âm thanh (NOAA), nâng "plasma dẫn được điện" (DOE) thành "dẫn điện rất tốt", thêm hai đặc điểm không nguồn, và gọi cực quang là plasma trong khi nguồn nói cực quang *do* plasma gây ra; (3) mục siêu dẫn gắn siêu dẫn với "tàu đệm từ" không nguồn, mở bằng một khái quát không nguồn ("ở nhiệt độ rất thấp, hiệu ứng lượng tử bắt đầu chi phối"), và viết "điện trở gần như bằng 0" trong khi định nghĩa của DOE là dẫn dòng một chiều *không mất năng lượng*; (4) "electron hóa trị quyết định tính axit, bazơ, khả năng cháy" là chọn một kể như tất cả. Bốn mục chặn, tám mục nên sửa. Mọi chỗ sửa nằm trong phạm vi các mục hiện có; D viết sẵn thay cả sáu mục hiện có (không bỏ mục nào), thay tóm tắt và thêm "Đọc thêm".

## A. Chặn (phải sửa)

| # | Vị trí | Loại | Vấn đề | Câu thay thế (nguyên văn) |
|---|---|---|---|---|
| A1 | Toàn bài | Gate | 0 nguồn. Gate cần ≥3 nguồn độc lập bậc 1–2. `publish:check` báo thêm: 0/3 link nội bộ, 0 link vào, chưa có entity, chưa có ảnh bìa (mục E). | Thêm nguồn ở mục C. |
| A2 | Trường `summary` ("Tại sao oxy là chất khí, nước là chất lỏng còn sắt lại là chất rắn ở nhiệt độ phòng? … Câu trả lời nằm ở cách các nguyên tử được cấu tạo, liên kết với nhau và phản ứng với môi trường xung quanh.") | **Hứa điều thân bài không giao + nhân quả sai** | (1) Không mục nào của thân bài giải thích vì sao oxy, nước, sắt ở ba trạng thái khác nhau ở nhiệt độ phòng (lực giữa các phân tử, liên kết kim loại không được nhắc tới). Người đọc chỉ có câu trả lời ngầm của bài: "electron hóa trị" và "liên kết" — tức là mô hình sai rằng sôi/nóng chảy là phá liên kết trong phân tử. (2) "Phản ứng với môi trường xung quanh" không phải lý do một chất là rắn, lỏng hay khí ở nhiệt độ phòng; chính mục "Nhiệt độ và áp suất" của bài nói đúng hơn: trạng thái phụ thuộc vào *điều kiện* nhiệt độ, áp suất, không phải phản ứng. Số liệu NIST WebBook (oxy sôi ở 90,2 K) chỉ xác nhận hiện tượng, không giải thích cơ chế; chưa đọc được nguồn bậc 1–2 cho cơ chế lực liên phân tử → không thêm mục mới, mà viết lại tóm tắt cho khớp với điều thân bài thực sự trả lời (xem F). | D1. |
| A3 | Mục "Plasma: Trạng Thái Thứ Tư Của Vật Chất" ("Dẫn điện rất tốt. Phản ứng mạnh với từ trường. Phát sáng khi bị kích thích." · "Ví dụ về plasma: Sấm sét. Cực quang. Mặt Trời và các ngôi sao." · "gồm: Ion mang điện tích dương. Electron tự do.") | **Ví dụ sai + nâng mức chắc chắn + đặc điểm không nguồn + chủ thể bị nới rộng** | (1) "Sấm sét": NOAA/NWS — "Thunder is the sound caused by a nearby flash of lightning… This rapid expansion and contraction creates the sound wave that we hear as thunder." Sấm là sóng âm, không phải plasma. Tia sét là kênh không khí bị nung tới khoảng 50.000 °F (NOAA), nhưng không nguồn nào đã đọc gọi thẳng tia sét thường là plasma (DOE chỉ nói "One type of lightning – ball lightning – is plasma") → bỏ ví dụ, không thay bằng "tia sét". (2) "Dẫn điện rất tốt": DOE viết "unlike gas, plasma can conduct electricity" — dẫn *được* điện; "rất tốt" là nâng mức. (3) "Phản ứng mạnh với từ trường", "Phát sáng khi bị kích thích": không có trong nguồn đã đọc → bỏ (quy tắc 6, 8). (4) "Cực quang" là plasma: DOE — "The aurora borealis is also caused by plasma"; NOAA SWPC mô tả ánh sáng cực quang do electron được gia tốc trong từ quyển va vào nguyên tử, phân tử oxy và nitơ ở khí quyển trên cao rồi phát sáng — ánh sáng ta thấy là khí bị kích thích, không phải "plasma phát sáng". (5) "Gồm ion dương và electron tự do" bỏ mất vế của DOE: plasma nhiệt độ thấp chỉ "partially ionized" (còn nguyên tử trung hòa). | D5 (thay toàn mục). |
| A4 | Mục "Khi Vật Chất Được Làm Lạnh Cực Độ" ("Ở nhiệt độ rất thấp, các hiệu ứng lượng tử bắt đầu chi phối hành vi của vật chất." · "Điện trở gần như bằng 0." · "Dòng điện có thể truyền đi mà hầu như không hao phí năng lượng." · "nền tảng cho các công nghệ như máy MRI, nam châm siêu mạnh và tàu đệm từ.") | **Ứng dụng không nguồn + khái quát không nguồn + mô hình sai** | (1) "Tàu đệm từ": không nguồn nào đã đọc nêu; DOE và CERN chỉ nêu MRI và nam châm máy gia tốc. Bỏ (quy tắc 6, 8). (2) Câu mở đầu khái quát cho mọi vật chất ở nhiệt độ thấp — không nguồn; điều nguồn nói là siêu dẫn "is one of nature's most intriguing quantum phenomena" (DOE). (3) "Gần như bằng 0", "hầu như không hao phí": DOE định nghĩa siêu dẫn là dẫn dòng một chiều "without energy loss", các cặp electron "move through the material without resistance"; CERN: cuộn siêu dẫn cho dòng 11.080 A chạy "without losing any energy to electrical resistance". Viết "gần như" biến siêu dẫn thành "dây dẫn rất tốt" — đúng cái mô hình sai mà hiệu ứng Meissner (bài cũng nhắc) dùng để phân biệt. (4) Thiếu mức dè dặt mà nguồn có: cơ chế siêu dẫn nhiệt độ cao "a complete understanding… is yet to be discovered" (DOE). | D6 (thay toàn mục). |

## B. Nên sửa

| # | Vị trí | Loại | Vấn đề | Câu thay thế |
|---|---|---|---|---|
| B1 | Mục "Electron Quyết Định…", "Mỗi nguyên tử gồm hạt nhân và các electron chuyển động xung quanh." | Đơn giản hóa để lại mô hình hành tinh | "Chuyển động xung quanh" gợi electron chạy vòng như hành tinh. Bài đã PASSED `nguyen-tu-cau-tao-nen-van-vat` nói rõ electron "không chuyển động theo các quỹ đạo cố định", mà ở trong orbital. Phiếu này chưa đọc nguồn bậc 1–2 về orbital → D2 bỏ chữ "chuyển động" và dẫn link giữa câu sang bài nguyên tử (bài đích giải thích kỹ đúng điều câu đang lướt qua). | D2. |
| B2 | Cùng mục, "Chính chúng quyết định: … Tính axit, bazơ hoặc khả năng cháy của chất." | Chọn một kể như tất cả | Tính axit/bazơ và khả năng cháy là tính chất của *chất* (phân tử, hợp chất), phụ thuộc cả cấu trúc phân tử, không phải chỉ electron hóa trị của một nguyên tử. Không nguồn nào đã đọc nêu mệnh đề này → bỏ. | D2. |
| B3 | Cùng mục, ví dụ natri, clo, khí hiếm | Thiếu căn cứ, thiếu ngoại lệ | Giữ ý, gắn số liệu RSC: natri [Ne] 3s¹, năng lượng ion hóa thứ nhất 495,8 kJ/mol so với thứ hai 4.562 kJ/mol (gấp hơn 9 lần), "reacts vigorously with water"; clo [Ne] 3s² 3p⁵, ái lực electron 348,6 kJ/mol; argon [Ne] 3s² 3p⁶, "totally inert to other substances". "Gần như không phản ứng" của bài là đúng mức và phải giữ: RSC — Neil Bartlett tạo hợp chất của xenon năm 1962, nay "more than 100 xenon compounds". | D2. |
| B4 | Mục "Cách Các Nguyên Tử Liên Kết…", "### Than Chì": "Liên kết giữa các lớp lại khá yếu." | Từ ngữ gợi sai | Viện Hàn lâm Khoa học Hoàng gia Thụy Điển: các lớp "are weakly held together and are therefore fairly simple to tear off" — lực giữ các lớp không phải liên kết hóa học cùng loại với liên kết trong lớp; gọi chung là "liên kết" làm mờ đúng điểm mà ví dụ muốn dạy. Thêm điều nguồn có: mỗi carbon trong than chì liên kết với 3 nguyên tử (Nat Commun 2025, "three-fold coordinated"), lớp hình tổ ong; kim cương cách điện ở nhiệt độ phòng (Nanomaterials 2024). | D3. |
| B5 | Mục "Nhiệt Độ Và Áp Suất…", khối ```` ```text ```` "Nước đá ↓ Nước lỏng ↓ Hơi nước" | Sơ đồ một chiều, thiếu điều kiện | Sơ đồ không sai nhưng chỉ đi một chiều và không nêu áp suất, trong khi tên mục là "nhiệt độ **và áp suất**". Thay bằng câu: có chiều ngược lại, nhiệt độ sôi của nước gắn với áp suất tiêu chuẩn (NIST WebBook: 373,17 K, tức khoảng 100 °C), oxy hóa lỏng ở 90,2 K (khoảng −183 °C). Câu "Áp suất cũng ảnh hưởng đáng kể… cấu trúc" chưa có ví dụ: chính kim cương là ví dụ — hình thành dưới áp suất cao, là dạng giả bền ở áp suất thường (KVA 2010; Nat Commun 2025: "large free energy barrier between graphite and diamond"). Nhiệt độ nóng chảy 0 °C của nước không có trên trang NIST đã đọc → không đưa vào. | D4. |
| B6 | Tiêu đề và tên mục | Văn phong | Viết hoa từng chữ ("Từ Nguyên Tử Đến Kim Cương", "Kết Luận") không theo cách viết tiếng Việt. Chính tả "hóa" giữ nguyên (đa số kho: 55 bài "hóa" / 33 bài "hoá"; chủ sản phẩm đã chốt). | `title`: "Từ nguyên tử đến kim cương: điều gì thực sự quyết định tính chất của vật chất?" (giữ slug). Tên mục như trong D. |
| B7 | Liên kết | SEO | 0 link nội bộ (gate ≥3). D thêm 2 link giữa câu (D2 → `nguyen-tu-cau-tao-nen-van-vat` ở chỗ nói cấu tạo nguyên tử; D5 → `vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru` ở cụm "vật chất nhìn thấy", bài đích giải thích phần vũ trụ nhìn thấy so với vật chất tối) và mục "Đọc thêm" 4 bài PUBLISHED + PASSED (D8). Tổng 5 slug khác nhau. | D2, D5, D8. |
| B8 | `seoDescription` | SEO | Hiện tại 143 ký tự, không mang claim sai, nhưng mở bằng "Bài viết giải thích…" (lãng phí đầu đoạn hiện trên kết quả tìm kiếm) và nói "tính chất vật lý và hóa học của các dạng vật chất" chung chung. Đề xuất bản 160 ký tự nêu cặp kim cương/than chì — đúng điều bài trả lời. Không trùng bài nào trong kho (truy vấn 121 bài PUBLISHED). | D9. |

## C. Nguồn đề xuất (đã kiểm tồn tại)

Mọi trang đọc ngày 2026-10-09 bằng curl (HTML → văn bản) hoặc pypdf; bài báo đọc toàn văn qua Europe PMC REST (`/PMCxxxx/fullTextXML`); mọi DOI tra Crossref (tiêu đề, tạp chí, năm khớp). **Không dùng** vì trả 403: IUPAC Gold Book (`goldbook.iupac.org`), PPPL (`pppl.gov`), AMNH, Smithsonian NMNH; `usgs.gov` trả 405/202 (không đọc được). Trang CERN "Superconductivity" trả 404 → dùng trang LHC magnets.

| Bậc | Nguồn | Đã đọc để kiểm | Dùng cho |
|---|---|---|---|
| 1 | Donadio D. và cs. "Metastability and Ostwald step rule in the crystallisation of diamond and graphite from molten carbon." *Nature Communications* 16:6324 (2025). DOI 10.1038/s41467-025-61674-5 (Crossref khớp). PMC12241486. | **Toàn văn** (PMC12241486), các đoạn: Introduction (giản đồ pha carbon, điểm ba graphite–kim cương–lỏng "~12 GPa and 4500 K"); Results (kim cương "four-fold coordinated", graphite "three-fold coordinated", "large free energy barrier between graphite and diamond"). | B4, B5, D3, D4 |
| 1 | Hasan M.N. và cs. "Diamond for High-Power, High-Frequency, and Terahertz Plasma Wave Electronics." *Nanomaterials* 14:460 (2024). DOI 10.3390/nano14050460 (Crossref khớp). PMC10935413. Bài tổng quan. | **Toàn văn**, mục 2 "Electronic Material Properties of Diamond": "At room temperature, diamond is a good electrical insulator"; "three-dimensional network of sp³ hybridized carbon atoms… Strong covalent connections… result in a high degree of stiffness"; "Diamond is an ultra-hard material". | B4, D3 |
| 1 | Guo và cs. "CVD diamond processing tools: A review." *Journal of Advanced Research* 74:333–358 (2025). DOI 10.1016/j.jare.2024.09.013 (Crossref khớp). PMC12302480. Bài tổng quan. | **Toàn văn**, đoạn mở đầu: "As the hardest material in nature, diamond possesses… high melting point". Chỉ dùng cho "cứng nhất trong tự nhiên" và "nhiệt độ nóng chảy rất cao" (trích dẫn thứ cấp trong tổng quan). | D1, D3, D7 |
| 1 | Meissner W., Ochsenfeld R. "Ein neuer Effekt bei Eintritt der Supraleitfähigkeit." *Die Naturwissenschaften* 21:787–788 (1933). DOI 10.1007/BF01504252. | **Chỉ xác minh tồn tại** (Crossref). Dùng cho *tên gọi* hiệu ứng Meissner; nội dung hiệu ứng lấy từ DOE. | D6 |
| 2 | US DOE Office of Science — DOE Explains… Plasma. https://www.energy.gov/science/doe-explainsplasma | Trang: "one of the four states of matter"; "makes up 99% of the visible matter in the universe"; electron tách khỏi nguyên tử trung hòa, nguyên tử thành ion dương; tạo plasma bằng "high-voltage electricity, lasers, or electromagnetic fields", trong sao do áp suất và nhiệt độ cao; "unlike gas, plasma can conduct electricity"; electron và ion "interact in very complex ways"; plasma nhiệt độ cao "all the atoms can be fully ionized", nhiệt độ thấp "only partially ionized… even room temperature"; plasma trong tinh vân, trong các sao kể cả Mặt Trời; "The aurora borealis is also caused by plasma"; "One type of lightning – ball lightning – is plasma". | A3, D5 |
| 2 | US DOE Office of Science — DOE Explains… Superconductivity. https://www.energy.gov/science/doe-explainssuperconductivity | Trang: vật liệu thường vẫn có điện trở kể cả khi làm lạnh; siêu dẫn "conduct direct current (DC) electricity without energy loss when… cooled below a critical temperature"; "expel magnetic fields"; "quantum phenomena"; phát hiện 1911 (Kamerlingh Onnes) ở thủy ngân lạnh tới nhiệt độ heli lỏng, "only a few degrees above absolute zero"; 1957 ba nhà vật lý: electron kết cặp nhờ phonon, cặp "move through the material without resistance"; 1970s nam châm siêu dẫn cho từ trường "needed for the development of" MRI; MRI dùng hợp kim niobi–titan; 1986 vật liệu đồng oxit nhiệt độ cao; "a complete understanding of the quantum mechanism is yet to be discovered". | A4, D6 |
| 2 | CERN — Pulling together: superconducting electromagnets. https://home.cern/science/engineering/pulling-together-superconducting-electromagnets | Trang: nam châm lưỡng cực chính của LHC "8.3 tesla… more than 100,000 times more powerful than the Earth's magnetic field", dòng "11,080 amperes", cuộn siêu dẫn cho dòng chạy "without losing any energy to electrical resistance". | A4, D6 |
| 2 | NOAA National Weather Service — Understanding Lightning: Thunder. https://www.weather.gov/safety/lightning-science-thunder | Trang: "Thunder is the sound caused by a nearby flash of lightning"; không khí trong kênh sét tới "50,000 degrees Fahrenheit"; giãn nở và co lại nhanh "creates the sound wave that we hear as thunder". (Trang NSSL Lightning Basics nói cùng ý.) | A3 |
| 2 | NOAA Space Weather Prediction Center — Aurora. https://www.swpc.noaa.gov/phenomena/aurora | Trang: cực quang "result of electrons colliding with the upper reaches of Earth's atmosphere"; electron được gia tốc ở đuôi từ quyển, theo từ trường xuống vùng cực, va vào nguyên tử và phân tử oxy, nitơ, kích thích chúng, chúng phát sáng khi trở về trạng thái năng lượng thấp. | A3, D5 |
| 2 | Royal Swedish Academy of Sciences — Popular information, Nobel Prize in Physics 2010 (graphene). https://www.nobelprize.org/uploads/2018/06/popular-physicsprize2010.pdf · Scientific background (advanced) cùng năm. https://www.nobelprize.org/uploads/2018/06/advanced-physicsprize2010.pdf | Popular (pypdf): than chì "such as is found in pencils"; graphene là lớp carbon "similar to a honeycomb structure"; "One millimeter of graphite actually consists of three million layers of graphene… The layers are weakly held together and are therefore fairly simple to tear off"; viết bút chì là bóc lớp than chì lên giấy; graphene "the strongest" vật liệu. Advanced, mục 2: "The most common form of carbon is graphite… Under high pressure diamond is formed, which is a metastable form of carbon." | B4, B5, D1, D3, D4, D7 |
| 2 | NIST Chemistry WebBook (SRD 69) — Phase change data: Oxygen (C7782447), Water (C7732185). https://webbook.nist.gov/cgi/cbook.cgi?ID=C7782447&Mask=4 · …ID=C7732185&Mask=4 | Oxy: T boil 90,2 K (±0,2). Nước: T boil 373,17 ± 0,04 K (trung bình 7 giá trị). Trang nước không có T fus. | A2, B5, D4 |
| 2–3 | Royal Society of Chemistry — Periodic Table: Sodium, Chlorine, Argon, Xenon. https://periodic-table.rsc.org/element/11/sodium (…/17/chlorine, …/18/argon, …/54/xenon) | Hội khoa học (learned society); dùng cho số liệu nguyên tố. Glossary: thành viên một nhóm "typically have similar properties and electron configurations in their outer shell". Natri [Ne] 3s¹, ion hóa 1st 495,845 / 2nd 4562,444 kJ/mol, "reacts vigorously with water". Clo [Ne] 3s² 3p⁵, ái lực electron 348,575 kJ/mol. Argon [Ne] 3s² 3p⁶, "totally inert to other substances", dùng che chắn khi hàn. Xenon: Bartlett 1962, "more than 100 xenon compounds". | B3, D2 |

Bậc 1–2 độc lập: Nat Commun 2025, Nanomaterials 2024, J Adv Res 2025 (ba nhóm tác giả khác nhau), DOE, CERN, NOAA (2 đơn vị), KVA/Nobel, NIST — đủ ≥3. Không dùng MedlinePlus `/ency/`, OpenStax, Britannica hay Wikipedia.

## D. Đoạn thay thế

### D1 — thay trường `summary`

```markdown
Kim cương và than chì đều chỉ gồm nguyên tử carbon, vậy mà một thứ là vật liệu tự nhiên cứng nhất, còn thứ kia mềm đến mức dùng làm ruột bút chì. Câu trả lời nằm ở nhiều cấp độ: các electron lớp ngoài cùng của nguyên tử, cách các nguyên tử liên kết và sắp xếp với nhau, và điều kiện nhiệt độ, áp suất. Bài viết đi qua từng cấp độ ấy, rồi tới hai trạng thái đặc biệt của vật chất: plasma và siêu dẫn.
```

### D2 — thay toàn mục "## Electron Quyết Định Tính Chất Hóa Học"

```markdown
## Electron quyết định tính chất hóa học

Mỗi nguyên tử gồm hạt nhân và các electron ở xung quanh hạt nhân; [cấu tạo của nguyên tử](/articles/nguyen-tu-cau-tao-nen-van-vat) được giải thích kỹ ở một bài riêng.

Trong phản ứng hóa học, vai trò chính thuộc về các electron ở lớp ngoài cùng, gọi là **electron hóa trị**. Các nguyên tố cùng một nhóm (cùng một cột) của bảng tuần hoàn thường có cấu hình electron lớp ngoài giống nhau, và cũng có tính chất giống nhau. Electron hóa trị chi phối việc một nguyên tử dễ hay khó phản ứng, và nó tạo liên kết với nguyên tử khác ra sao.

Ví dụ:

- **Natri** chỉ có một electron ở lớp ngoài cùng. Tách electron này ra cần khoảng 496 kJ/mol, trong khi tách electron thứ hai cần khoảng 4.562 kJ/mol, gấp hơn chín lần. Natri phản ứng mạnh, kể cả với nước.
- **Clo** có bảy electron ở lớp ngoài cùng và dễ nhận thêm một electron: việc nhận ấy giải phóng năng lượng, khoảng 349 kJ/mol. Clo cũng là một nguyên tố phản ứng mạnh.
- **Khí hiếm** như neon và argon có lớp electron ngoài cùng đầy đủ và gần như không phản ứng. Argon trơ đến mức được dùng làm khí che chắn khi hàn, để kim loại nóng không bị oxy hóa. Chữ "gần như" là cần thiết: năm 1962, Neil Bartlett tạo được hợp chất đầu tiên của xenon, một khí hiếm khác, và đến nay đã có hơn 100 hợp chất xenon.
```

### D3 — thay toàn mục "## Cách Các Nguyên Tử Liên Kết Quyết Định Tính Chất Vật Lý" (gồm cả hai mục con "### Kim Cương", "### Than Chì")

```markdown
## Cách các nguyên tử liên kết quyết định tính chất vật lý

Hai vật liệu có thể được tạo từ cùng một nguyên tố mà vẫn có tính chất hoàn toàn khác nhau. Ví dụ điển hình là **kim cương** và **than chì**, đều chỉ gồm nguyên tử carbon.

### Kim cương

Trong kim cương, mỗi nguyên tử carbon liên kết cộng hóa trị với 4 nguyên tử carbon khác, tạo thành một mạng lưới ba chiều liên tục. Nhờ các liên kết bền chặt ấy, kim cương:

- Là vật liệu tự nhiên cứng nhất.
- Rất khó biến dạng.
- Có nhiệt độ nóng chảy rất cao.
- Cách điện tốt ở nhiệt độ phòng.

### Than chì

Trong than chì, mỗi nguyên tử carbon liên kết với 3 nguyên tử khác, tạo thành những lớp phẳng hình tổ ong. Liên kết trong mỗi lớp rất bền, nhưng các lớp chỉ bám vào nhau rất lỏng lẻo. Một milimét than chì gồm khoảng ba triệu lớp như vậy chồng lên nhau, và chúng khá dễ tách ra. Vì thế than chì:

- Mềm hơn kim cương rất nhiều.
- Dễ tách lớp.
- Được dùng làm ruột bút chì: khi viết, các lớp than chì bong ra và bám lại trên giấy.

Cặp ví dụ này cho thấy cách các nguyên tử liên kết và sắp xếp quan trọng không kém việc chúng là nguyên tố gì.
```

### D4 — thay toàn mục "## Nhiệt Độ Và Áp Suất Thay Đổi Trạng Thái Vật Chất" (gồm cả khối sơ đồ ```` ```text ```` trong mục)

```markdown
## Nhiệt độ và áp suất thay đổi trạng thái vật chất

Tính chất của một chất không cố định mà còn phụ thuộc vào điều kiện môi trường.

Khi nhiệt độ tăng, các hạt chuyển động mạnh hơn. Chất rắn có thể nóng chảy thành chất lỏng, chất lỏng có thể hóa hơi thành chất khí; khi nhiệt độ giảm, các quá trình ấy diễn ra theo chiều ngược lại. Ở áp suất khí quyển tiêu chuẩn, nước sôi ở khoảng 100 °C, còn oxy, chất khí ta hít thở, chỉ hóa lỏng khi được làm lạnh xuống khoảng −183 °C.

Áp suất cũng ảnh hưởng đến nhiệt độ nóng chảy, nhiệt độ sôi và cả cấu trúc của vật chất. Chính kim cương là một ví dụ: than chì là dạng phổ biến nhất của carbon, còn kim cương hình thành ở áp suất cao. Ở áp suất thường, kim cương là một dạng giả bền của carbon; nó vẫn tồn tại được vì giữa kim cương và than chì có một rào năng lượng lớn.
```

### D5 — thay toàn mục "## Plasma: Trạng Thái Thứ Tư Của Vật Chất"

```markdown
## Plasma: trạng thái thứ tư của vật chất

Plasma là một trong bốn trạng thái của vật chất, cùng với rắn, lỏng và khí. Khi các nguyên tử nhận đủ năng lượng, chẳng hạn bị nung tới nhiệt độ rất cao, bị phóng điện cao áp hay bị chiếu tia laser, một số electron tách khỏi nguyên tử. Nguyên tử mất electron trở thành ion mang điện dương. Plasma vì thế gồm các ion dương và electron tự do. Trong plasma nhiệt độ cao, mọi nguyên tử có thể bị ion hóa hoàn toàn; trong plasma nhiệt độ thấp, chỉ một phần nguyên tử bị ion hóa, và loại plasma này có thể nguội tới cỡ nhiệt độ phòng.

Khác với chất khí, plasma dẫn được điện, và các electron, ion trong đó tương tác với nhau theo những cách rất phức tạp.

Ví dụ về plasma:

- Mặt Trời và các ngôi sao khác.
- Các tinh vân trong không gian.

Cực quang cũng do plasma gây ra: electron được gia tốc trong từ quyển của Trái Đất lao dọc theo từ trường xuống vùng cực, va vào nguyên tử và phân tử oxy, nitơ ở tầng khí quyển trên cao và làm chúng phát sáng.

Theo Bộ Năng lượng Mỹ (DOE), plasma chiếm khoảng 99% [vật chất nhìn thấy](/articles/vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru) trong vũ trụ.
```

### D6 — thay toàn mục "## Khi Vật Chất Được Làm Lạnh Cực Độ"

```markdown
## Khi vật chất được làm lạnh cực độ

Ở nhiệt độ bình thường, mọi vật liệu đều có điện trở: một phần năng lượng của dòng điện luôn biến thành nhiệt. Với hầu hết vật liệu, điện trở vẫn còn kể cả khi được làm lạnh rất sâu. Ngoại lệ là các vật liệu **siêu dẫn**. Khi được làm lạnh dưới một nhiệt độ gọi là nhiệt độ tới hạn, chúng:

- Dẫn dòng điện một chiều mà không mất năng lượng: điện trở bằng 0, không chỉ gần bằng 0.
- Đẩy từ trường ra khỏi lòng vật liệu khi chuyển sang trạng thái siêu dẫn (hiệu ứng Meissner).

Siêu dẫn là một hiện tượng lượng tử. Nó được phát hiện năm 1911 ở thủy ngân được làm lạnh tới nhiệt độ của heli lỏng, chỉ cao hơn độ không tuyệt đối vài độ. Năm 1957, ba nhà vật lý giải thích được cơ chế: các electron, vốn đẩy nhau, kết thành từng cặp nhờ dao động của mạng tinh thể, và các cặp ấy di chuyển qua vật liệu mà không gặp điện trở. Năm 1986, người ta tìm ra một nhóm vật liệu gốc đồng oxit siêu dẫn ở nhiệt độ cao hơn nhiều. Tính đến năm 2026, cơ chế siêu dẫn ở những vật liệu nhiệt độ cao này vẫn chưa được hiểu đầy đủ.

Cuộn dây siêu dẫn tạo ra được những nam châm rất mạnh. Từ thập niên 1970, nam châm siêu dẫn đã được dùng để tạo từ trường mạnh cần cho máy chụp cộng hưởng từ (MRI); máy MRI dùng hợp kim niobi–titan. Ở Máy Gia tốc Hạt Lớn (LHC) của CERN, các nam châm lưỡng cực chính tạo từ trường 8,3 tesla, mạnh hơn từ trường Trái Đất hơn 100.000 lần, nhờ cuộn dây siêu dẫn cho dòng điện 11.080 ampe chạy qua mà không mất năng lượng vì điện trở.
```

### D7 — thay toàn mục "## Kết Luận"

```markdown
## Kết luận

Tính chất của vật chất không do một yếu tố duy nhất quyết định mà là kết quả của nhiều cấp độ. Electron lớp ngoài cùng quyết định nguyên tử phản ứng và liên kết ra sao. Cách các nguyên tử liên kết và sắp xếp quyết định vật liệu cứng hay mềm. Nhiệt độ và áp suất quyết định chất ấy ở trạng thái nào, và có khi cả cấu trúc của nó.

Chính vì vậy, cùng là carbon, than chì mềm đến mức dùng làm ruột bút chì, còn kim cương là vật liệu tự nhiên cứng nhất.
```

### D8 — thêm mục mới ở cuối thân bài, sau "## Kết luận"

```markdown
## Đọc thêm

- [Nguyên tử: Khám phá những "hạt vô hình" kiến tạo nên vạn vật](/articles/nguyen-tu-cau-tao-nen-van-vat)
- [Cơ học lượng tử: Thế giới kỳ lạ phía sau vật chất](/articles/co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat)
- [Từ electron đến dòng điện: Nguồn gốc của điện năng](/articles/tu-electron-den-dong-dien-nguon-goc-cua-dien-nang)
- [Sao Mộc: hành tinh quay nhanh nhất và chiếc phanh vô hình](/articles/sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh)
```

Bốn bài đều PUBLISHED + `factCheck = PASSED` (truy vấn 2026-10-09); tiêu đề chép nguyên văn từ CSDL. Bài nguyên tử và cơ học lượng tử cho phần electron; bài điện năng cho electron và dòng điện; bài Sao Mộc có đoạn plasma (ion + electron tự do, dẫn điện) khớp với D5. Bài vật chất tối (PASSED) đã được link giữa câu ở D5.

### D9 — thay `title`, `seoDescription`

- `title`: `Từ nguyên tử đến kim cương: điều gì thực sự quyết định tính chất của vật chất?` (giữ slug)
- `seoTitle`: giữ nguyên (`Điều gì quyết định tính chất của vật chất?` — 42 ký tự, đúng, không trùng).
- `seoDescription`: `Vì sao kim cương và than chì cùng là carbon mà khác hẳn nhau? Electron hóa trị, cách nguyên tử liên kết, nhiệt độ và áp suất cùng quyết định tính chất vật chất.` (160 ký tự)
- `seoKeywords`: giữ nguyên — không từ khóa nào mang claim mà bản sửa bỏ.

**Thứ tự thân bài sau khi sửa:** Electron quyết định tính chất hóa học (D2) → Cách các nguyên tử liên kết quyết định tính chất vật lý (D3) → Nhiệt độ và áp suất thay đổi trạng thái vật chất (D4) → Plasma: trạng thái thứ tư của vật chất (D5) → Khi vật chất được làm lạnh cực độ (D6) → Kết luận (D7) → Đọc thêm (D8).

## E. Việc chưa làm / cần người

- **Kết quả kiểm máy (bước 1b, 2026-10-09):**
  - `npm run publish:check -- --slug …`: 7 CHẶN — `factCheck = PENDING`; chưa có người duyệt; 0/3 nguồn bậc 1–2; 0/3 link nội bộ resolve; 0 link vào; chưa gắn entity; chưa có ảnh bìa. `readingTime` không bị báo (sẽ đổi khi áp D — bài dài lên, tính lại).
  - `npm run glossary:check`: bài không có `[[…]]` nào → không có thuật ngữ thiếu mục từ.
  - **Link vào:** 0 bài PUBLISHED nào trỏ tới `/articles/tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat`. Đổi tiêu đề không kéo theo link text nào. Ứng viên link vào tự nhiên: `nguyen-tu-cau-tao-nen-van-vat` (câu "Cách sắp xếp này quyết định nhiều tính chất hóa học của mỗi nguyên tố") — ghi khi bài đã có byline, theo mẫu `scripts/republish-prep-2026-10-09.ts`.
- **Đây là bài đã xuất bản → sửa là đính chính** (`content-rules.md`): một mục trong `docs/content/corrections.md` cho các claim đổi — A2 (tóm tắt: bỏ câu hỏi oxy/nước/sắt và "phản ứng với môi trường"), A3 ("sấm sét" là plasma → bỏ; "dẫn điện rất tốt" → dẫn được điện; bỏ "phản ứng mạnh với từ trường", "phát sáng khi bị kích thích"; cực quang do plasma gây ra, không phải plasma; plasma nhiệt độ thấp chỉ ion hóa một phần), A4 ("tàu đệm từ" → bỏ; "điện trở gần như bằng 0" → bằng 0 với dòng một chiều; thêm cơ chế nhiệt độ cao chưa hiểu đầy đủ), B2 (bỏ "electron hóa trị quyết định tính axit, bazơ, khả năng cháy"). Đối chiếu với bản dump khi áp, không với phiếu.
- **Giữ PUBLISHED trong lúc sửa** — theo quyết định của chủ sản phẩm; phiếu không khuyến nghị DRAFT (không có lỗi an toàn, không mâu thuẫn bài PASSED nào).
- **Ảnh bìa:** bài không có ảnh (gate CHẶN). Cần `image-finder` tìm ảnh có giấy phép (ví dụ ảnh kim cương thô cạnh than chì, hoặc sơ đồ cấu trúc hai dạng carbon), tải về, xem rồi mới viết alt; ghi công đúng. Agent không viết alt cho ảnh chưa xem.
- **Entity:** `entityId` trống — knowledge-architect gán entity (đề xuất khái niệm "tính chất vật chất"/"thù hình carbon"; người chốt) khi đăng lại, mẫu `scripts/republish-prep-2026-10-09.ts`.
- **Danh mục:** bài nằm thẳng ở lĩnh vực gốc `vat-ly`, trong khi các bài vật lý khác trong kho nằm ở danh mục con (`vat-ly-hien-dai`, `nhiet-va-nang-luong`, `co-hoc`, `dien-tu-va-anh-sang`). Nội dung bài pha vật lý chất rắn và hóa học; không danh mục con hiện có nào khớp rõ. `category-manager` / chủ sản phẩm quyết giữ ở gốc hay chuyển.
- **Thuật ngữ:** "than chì" (bài này, 1 bài) / "graphit" (1 bài: `su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian`, PASSED) — chủ sản phẩm chốt. D giữ "than chì" (cách gọi đang dùng của bài). "carbon" 21 bài / "cacbon" 1 bài — D dùng "carbon". "oxy" 23 / "oxi" 0. "hóa" theo đa số. `glossary.json` chưa có mục từ cho "electron hóa trị", "plasma", "siêu dẫn", "hiệu ứng Meissner", "thù hình" — nếu muốn chèn `[[…]]`, thêm mục từ qua `glossary.json` + science-editor duyệt, không ghi thẳng CSDL.
- **`reverifyDueAt`:** đề xuất 36 tháng — mệnh đề theo thời điểm duy nhất là "tính đến năm 2026, cơ chế siêu dẫn nhiệt độ cao chưa được hiểu đầy đủ" (D6).
- **Mở rộng sau (không thuộc đính chính):** câu hỏi bị bỏ khỏi tóm tắt (vì sao oxy là khí, nước là lỏng, sắt là rắn ở nhiệt độ phòng) là một mục hay: lực giữa các phân tử, liên kết hydro, liên kết kim loại. Cần chạy lại `content-research` với nguồn bậc 1–2 cho cơ chế (IUPAC Gold Book bị 403 khi thẩm định; có thể dùng khuyến nghị IUPAC về liên kết hydro trên *Pure and Applied Chemistry* sau khi đọc được), rồi viết qua pipeline — không thêm vào bài đang đăng khi chưa có nguồn.
- Sửa CSDL production là việc của người (form `/admin` hoặc script đính chính người chạy theo bước 5 của skill). Agent không tự ghi, không đặt `reviewedById`, không đổi `factCheck`. Bài chưa có byline duyệt nào → không có câu hỏi giữ/gỡ byline cũ.

## F. Ghi chú thẩm định

- **Skill đã gọi (theo thứ tự):** `content-research` → `fact-check` (chế độ Audit) → `seo-optimizer` (phần SEO: `title`, `seoTitle`, `seoDescription`, `seoKeywords`, link nội bộ, "Đọc thêm"). Không gọi `translation` (bài chưa có bản EN). Kết quả các skill ghi thẳng vào phiếu này, không tạo tệp yaml riêng (đầu ra duy nhất được giao là phiếu).
- **Cách đọc bài:** script tạm chỉ đọc (Prisma `findUnique` + `findMany` bài PUBLISHED) trong `sciencepedia/scripts/tmp-kc-read.ts`, xuất JSON ra scratchpad, đã xoá ngay sau khi chạy. Không ghi CSDL. (Các tệp `scripts/tmp-*.ts` khác đang có trong thư mục không phải của phiếu này; không đụng tới.)
- **Kết quả fact-check Audit (claim nguyên tử của bản đang đăng):**

  | Claim | Phán quyết | Mức | Xử lý |
  |---|---|---|---|
  | Nguyên tử gồm hạt nhân và electron "chuyển động xung quanh" | partially-supported (lossy) | S3 | D2 |
  | Electron hóa trị đóng vai trò chính trong phản ứng | verified (RSC glossary, ở mức nhóm–cấu hình–tính chất) | — | giữ |
  | Electron hóa trị quyết định tính axit, bazơ, khả năng cháy | unsupported | S3 | bỏ (D2) |
  | Natri phản ứng mạnh vì dễ mất electron | verified (RSC: 3s¹, IE1 ≪ IE2, phản ứng mạnh với nước) | — | giữ, thêm số |
  | Clo phản ứng mạnh vì dễ nhận electron | verified (RSC: 3p⁵, ái lực electron 348,6 kJ/mol) | — | giữ, thêm số |
  | Neon, argon gần như không phản ứng | verified (RSC argon "totally inert"; xenon có hơn 100 hợp chất → "gần như" đúng mức) | — | giữ |
  | Kim cương: mỗi C liên kết 4 C, mạng ba chiều | verified (Nat Commun 2025; Nanomaterials 2024) | — | giữ |
  | Kim cương cực kỳ cứng, khó biến dạng | verified (J Adv Res 2025 "hardest material in nature"; Nanomaterials "ultra-hard", "stiffness") | — | giữ |
  | Kim cương nhiệt độ nóng chảy rất cao | partially-supported (J Adv Res, trích thứ cấp) | S4 | giữ, xem dưới |
  | Than chì: lớp phẳng, trong lớp mạnh, giữa lớp yếu | verified (KVA 2010) | — | giữ, sửa chữ "liên kết" (B4) |
  | Than chì mềm, dễ tách lớp, làm ruột bút chì | verified (KVA 2010) | — | giữ |
  | Nhiệt độ tăng → nóng chảy, hóa hơi | verified (kiến thức nền; NIST số liệu pha) | — | giữ, bỏ sơ đồ một chiều |
  | Áp suất ảnh hưởng nhiệt độ nóng chảy, sôi, cấu trúc | verified (Nat Commun 2025 giản đồ pha carbon; KVA: kim cương hình thành ở áp suất cao) | — | giữ, thêm ví dụ |
  | Plasma: electron tách khỏi nguyên tử; ion dương + electron tự do | partially-supported (DOE; thiếu vế ion hóa một phần) | S3 | D5 |
  | Plasma dẫn điện "rất tốt" | contradicted về mức (DOE "can conduct") | S3 | D5 |
  | Plasma phản ứng mạnh với từ trường | unverifiable (nguồn đã đọc) | S3 | bỏ |
  | Plasma phát sáng khi bị kích thích | unverifiable | S3 | bỏ |
  | "Sấm sét" là plasma | contradicted (NOAA: sấm là âm thanh) | S2 | bỏ |
  | Cực quang là plasma | partially-supported (DOE/SWPC: do plasma gây ra; ánh sáng từ khí bị kích thích) | S3 | D5 |
  | Mặt Trời, các sao là plasma | verified (DOE) | — | giữ |
  | Phần lớn vật chất nhìn thấy là plasma | verified (DOE 99%) | — | giữ, ghi số + nguồn |
  | Ở nhiệt độ rất thấp, hiệu ứng lượng tử chi phối vật chất | unsupported như khái quát | S3 | thay bằng "siêu dẫn là hiện tượng lượng tử" (DOE) |
  | Siêu dẫn dưới nhiệt độ tới hạn | verified (DOE) | — | giữ |
  | Điện trở "gần như bằng 0", "hầu như không hao phí" | contradicted (DOE "without energy loss"; CERN) | S2 | D6 |
  | Đẩy từ trường (hiệu ứng Meissner) | verified (DOE "expel magnetic fields"; tên: Meissner & Ochsenfeld 1933, chỉ xác minh tồn tại) | — | giữ |
  | Siêu dẫn là nền tảng cho MRI, nam châm siêu mạnh | verified (DOE, CERN) | — | giữ, thêm số LHC |
  | … và tàu đệm từ | unverifiable | S3 | bỏ |

  Không có S1 (bài không dẫn nguồn nào nên không có trích dẫn bịa). Hai S2 (sấm sét; "gần như bằng 0"). Khuyến nghị: **revise**.
- **"Nhiệt độ nóng chảy rất cao" của kim cương (giữ):** tổng quan J Adv Res 2025 viết đúng cụm "high melting point". Chi tiết vật lý tinh hơn: carbon chỉ được nghiên cứu nóng chảy ở hàng nghìn kelvin và áp suất hàng GPa (điểm ba ~12 GPa, ~4.500 K theo Nat Commun 2025), và ở áp suất thường kim cương là dạng giả bền. Cân nhắc viết lại thành "chỉ nóng chảy ở áp suất cực lớn" nhưng không làm: Nat Commun cũng nói than chì có đường nóng chảy riêng ở áp suất thấp hơn, nên "chỉ" sẽ sai; và chưa đọc nguồn về hành vi kim cương khi nung ở áp suất thường. Giữ cụm của nguồn, không thêm.
- **Electron và orbital:** không viết câu "electron không chạy theo quỹ đạo cố định, mà ở trong orbital" vào D2 dù bài PASSED `nguyen-tu-…` đã viết, vì phiếu này chưa đọc nguồn bậc 1–2 cho mệnh đề đó; D2 chỉ bỏ chữ "chuyển động" và link sang bài kia.
- **"Lớp electron ngoài cùng đầy đủ" của khí hiếm:** cấu hình argon [Ne] 3s² 3p⁶ từ RSC; neon không lấy được cấu hình từ trang đã tải. Lý giải "vì lớp ngoài đã đầy nên không phản ứng" là cách giải thích chuẩn; D2 đặt hai vế cạnh nhau ("có lớp electron ngoài cùng đầy đủ và gần như không phản ứng") thay vì "vì… nên…" như bản gốc, để không nâng một cách giải thích giáo khoa thành nhân quả có trích dẫn.
- **Tia sét:** không thay "sấm sét" bằng "tia sét". Nhiệt độ kênh sét 50.000 °F (NOAA) gợi mạnh rằng không khí trong kênh bị ion hóa, nhưng không nguồn đã đọc nói thẳng; DOE chỉ nêu sét hòn (ball lightning) là plasma — một hiện tượng hiếm và còn bàn cãi, không hợp làm ví dụ đầu tiên. Cắt.
- **Số trong D, đã kiểm từng số:** 496 và 4.562 kJ/mol (RSC: 495,845 và 4562,444; tỉ số 9,2 → "gấp hơn chín lần"); 349 kJ/mol (RSC 348,575); "hơn 100 hợp chất xenon", 1962 (RSC); ba triệu lớp/mm (KVA); ~100 °C (NIST 373,17 K = 100,02 °C); −183 °C (NIST 90,2 K = −182,95 °C); 99% (DOE); 1911, 1957, 1986, thập niên 1970, niobi–titan (DOE); 8,3 T, >100.000 lần, 11.080 A (CERN).
- **Câu "Ở nhiệt độ bình thường, mọi vật liệu đều có điện trở" (D6):** chép ý DOE "At what most people think of as 'normal' temperatures, all materials have some amount of electrical resistance".
- **Đối chiếu kho:** grep 121 bài PUBLISHED theo plasma / siêu dẫn / kim cương / than chì / electron hóa trị / liên kết hóa học / orbital. Không bài PASSED nào mâu thuẫn với bản sửa. Plasma "gồm ion và electron tự do, tức là dẫn điện" ở `sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh` (PASSED) khớp D5. Bài nguyên tử (PASSED) mâu thuẫn nhẹ với chữ "chuyển động xung quanh" của bản đang đăng — đã xử lý ở B1. Không bài nào khác nói về siêu dẫn.
- **Kiểm tiêu đề mục:** sáu tiêu đề "## …" trong D được chép nguyên văn từ `content` (truy vấn 2026-10-09) và kiểm bằng chương trình: mỗi tiêu đề khớp đúng một dòng. Mục bị thay không chứa link `/articles/…` nào (bản đang đăng có 0 link nội bộ), nên không có link nào phải giữ hay `dropLinks`.
- **Lỗi mẫu cho prompt `article-generator`:** bài lặp các hình dạng đã có quy tắc — **nâng mức chắc chắn** ("dẫn điện rất tốt" từ "can conduct"; "gần như" ở chiều ngược lại cũng là đổi nghĩa nguồn), **chọn một kể như tất cả** (electron hóa trị quyết định cả axit/bazơ/cháy), **đặc điểm/ứng dụng không nguồn** (từ trường, phát sáng, tàu đệm từ — dạng "danh sách ba gạch đầu dòng nghe xuôi" của bài dán từ công cụ AI). Dạng mới đáng ghi: **tóm tắt đặt câu hỏi mà thân bài không trả lời** — lần đầu gặp trong đợt; nếu lặp lần thứ ba, đề xuất thêm quy tắc "mọi câu hỏi trong summary phải có mục trả lời trong thân bài".
