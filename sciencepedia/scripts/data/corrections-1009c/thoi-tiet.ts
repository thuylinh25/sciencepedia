import type { Plan } from "../../lib/corrections";

/**
 * Phiếu: docs/content/checks/2026-10-09/bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap.md
 * Văn bản thay lấy nguyên văn mục D (D1–D11); "Đọc thêm" (D12) do engine thêm từ `reading`.
 * Chủ sản phẩm chốt: bài GIỮ PUBLISHED (không toDraft, dù phiếu khuyến nghị DRAFT) — vì thế A5, A6,
 * A8 bắt buộc có trong lượt này; giữ danh mục Sinh học → phương án (a) của phiếu E: dòng lưu ý y tế
 * viết trong thân bài (cuối D10). Chủ đề máy bay bỏ theo D6 (không nguồn, B5).
 */

const FENCE = "```";

const D1 = `[[huyết áp|Huyết áp]] không cố định mà thay đổi theo nhiều yếu tố, trong đó có thời tiết. Trong các yếu tố thời tiết, nhiệt độ là yếu tố có bằng chứng rõ nhất: huyết áp thường cao hơn khi trời lạnh và thấp hơn khi trời nóng. Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao; còn với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng tới huyết áp chưa nhất quán.`;

const D2 = `## Áp suất khí quyển

Áp suất khí quyển là lực do khối không khí phía trên đè lên mỗi đơn vị diện tích. Theo Cơ quan Quản lý Khí quyển và Đại dương Quốc gia Hoa Kỳ (NOAA), áp suất chuẩn ở mực nước biển là 1013,25 hPa, tương đương 29,92 inch thuỷ ngân (khoảng 760 mmHg). Áp suất gần như luôn thay đổi: nó lên xuống hai lần mỗi ngày theo nhiệt của Mặt Trời, và thay đổi nhiều hơn khi các hệ thời tiết — vùng áp cao, vùng áp thấp — di chuyển qua.

Càng lên cao, không khí càng loãng và áp suất càng giảm; khoảng một nửa số phân tử không khí của khí quyển nằm trong 5,6 km đầu tiên tính từ mặt đất. Không khí loãng nên mỗi hơi thở đưa vào ít oxy hơn: ở độ cao 2.500 m, áp suất riêng phần của oxy hít vào thấp hơn khoảng 25% so với ở mực nước biển.

Hai thang đo này cách nhau rất xa. Mức giảm áp suất hơn 5 hPa trong một ngày — mốc được dùng trong một nghiên cứu về đau nửa đầu — chỉ bằng khoảng 0,5% áp suất khí quyển. Vì vậy, điều đúng ở núi cao, nơi cơ thể thật sự thiếu oxy, không thể suy ra cho một ngày trời chuyển mưa.

Bằng chứng về ảnh hưởng của dao động áp suất hằng ngày lên huyết áp cũng chưa nhất quán. Trong một thử nghiệm trên 333 người có huyết áp trên mức tối ưu hoặc tăng huyết áp giai đoạn 1, được đo huyết áp liên tục 24 giờ, độ dao động huyết áp liên quan với nhiệt độ nhưng không liên quan với áp suất khí quyển. Một nghiên cứu ở Ba Lan trên 1.662 người đang điều trị tăng huyết áp ghi nhận phần lớn các nghiên cứu trước đó không thấy tương quan giữa áp suất trung bình trong ngày và huyết áp; bản thân nghiên cứu này thấy huyết áp cao hơn vào những lúc áp suất thấp, nhưng chỉ ở ban ngày mùa xuân và, với huyết áp tâm thu, ở ban đêm mùa đông.`;

const D3 = `## Vì sao trời lạnh thường làm huyết áp tăng?

Huyết áp thay đổi theo mùa: thấp hơn khi trời nóng, cao hơn khi trời lạnh. Theo tuyên bố đồng thuận năm 2020 của Hội Tăng huyết áp châu Âu (ESH), đây là hiện tượng toàn cầu, gặp ở cả nam và nữ, ở mọi lứa tuổi, ở cả người huyết áp bình thường lẫn người tăng huyết áp.

Một nghiên cứu ở Pháp trên 8.801 người từ 65 tuổi thấy huyết áp tâm thu giảm dần khi nhiệt độ ngoài trời tăng, chênh nhau 8,0 mmHg giữa nhóm ngày lạnh nhất và nhóm ngày ấm nhất (từ 21,2°C trở lên). Ở cùng một người, lần đo vào ngày ấm hơn cho huyết áp thấp hơn, và mức thay đổi lớn hơn ở người từ 80 tuổi trở lên.

Một cơ chế chính là phản xạ giữ nhiệt. Khi da lạnh, các dây thần kinh giao cảm làm mạch máu dưới da co lại, giảm lượng máu chảy qua da để bớt mất nhiệt. Ở người tăng huyết áp, phản ứng co mạch này mạnh hơn bình thường, và có thể làm tăng gánh cho tim ở những người vốn đã có nguy cơ tim mạch. Ngược lại, ở người cao tuổi khỏe mạnh, phản xạ co mạch yếu đi, nên họ khó giữ thân nhiệt hơn khi trời lạnh.

Cái lạnh cũng gắn với số ca tử vong cao hơn. Một nghiên cứu trên hơn 74 triệu ca tử vong do mọi nguyên nhân ở 13 nước, gồm cả nước nhiệt đới như Thái Lan, thấy số ca tử vong gắn với cái lạnh nhiều hơn hẳn số ca gắn với cái nóng — và phần lớn gắn với những ngày lạnh vừa phải, không phải những đợt rét cực đoan. Huyết áp tăng và dao động nhiều hơn khi trời lạnh được cho là có thể góp phần vào số ca tử vong do tim mạch cao hơn vào mùa đông.`;

const D4 = `## Khi trời nóng

Trời nóng thì huyết áp thường thấp hơn. Với người đang dùng thuốc hạ huyết áp, ESH lưu ý điều này có thể khiến huyết áp hạ quá mức vào mùa hè, cũng như có thể tăng lên vào mùa lạnh. Theo ESH, những triệu chứng xuất hiện khi trời nóng lên và gợi ý điều trị quá mức cần được bác sĩ kiểm tra; thay đổi huyết áp theo mùa cần được xác nhận bằng nhiều lần đo, tốt nhất là đo tại nhà hoặc đo liên tục 24 giờ, và cần loại trừ các nguyên nhân khác trước khi điều chỉnh thuốc.

Giảm thuốc vào mùa hè cũng không đơn giản. Trong một nghiên cứu ở Ý trên 6.404 người, ngày nóng đi kèm huyết áp ban ngày thấp hơn, nhưng ở người cao tuổi đang điều trị tăng huyết áp, huyết áp tâm thu ban đêm lại cao hơn; các tác giả cho rằng có thể do phác đồ thuốc nhẹ hơn vào mùa hè không đủ giữ huyết áp về đêm. Vì vậy, đổi liều là việc bác sĩ quyết định dựa trên số đo, không phải việc tự làm theo mùa.

Nắng nóng còn có những nguy cơ riêng. Theo Dịch vụ Y tế Quốc gia Anh (NHS), rủi ro chính của đợt nắng nóng là mất nước; cơ thể quá nóng, làm nặng thêm triệu chứng ở người có bệnh tim hoặc bệnh hô hấp; và kiệt sức do nóng, sốc nhiệt.`;

const D5 = `## Đau đầu và đau khớp khi trời chuyển mưa

Áp suất khí quyển thường giảm khi một hệ thời tiết xấu kéo đến; NOAA còn trích một sách phổ biến khoa học năm 1848 viết rằng khí áp kế tụt mạnh và giữ ở mức thấp báo hiệu mưa nhiều, có thể kèm gió, trong vài ngày tới. Nhiều người bị đau nửa đầu kể thời tiết là yếu tố làm khởi phát cơn đau, và nhiều người bị đau khớp cũng nói như vậy. Bằng chứng khoa học về điều này còn trái chiều.

- **Đau nửa đầu (migraine).** Một phân tích gộp 31 nghiên cứu công bố năm 2025 thấy cơn đau nửa đầu có liên quan với nhiệt độ và áp suất khí quyển, nhưng mức liên quan nhỏ: tỉ số chênh (một thước đo mức độ liên quan) khoảng 1,07 với áp suất và 1,15 với nhiệt độ. Trong một nghiên cứu ở Nhật Bản, 28 người bị đau nửa đầu ghi nhật ký suốt một năm: cơn đau thường gặp hơn khi áp suất giảm hơn 5 hPa từ ngày này sang ngày sau, và 18 người có cơn đau liên quan với thời tiết. Một tổng quan năm 2024 kết luận kết quả các nghiên cứu không nhất quán, mức độ nhạy cảm khác nhau nhiều giữa từng người, và chưa thấy quan hệ nhân quả.
- **Đau khớp, đau lưng.** Một phân tích gộp 14 nghiên cứu quan sát (2023) thấy thời tiết nói chung có liên quan với cơn đau ở người thoái hoá khớp. Nhưng một phân tích gộp khác (2024), chỉ gồm những nghiên cứu so sánh mỗi người với chính họ ở các thời điểm khác nhau, không thấy độ ẩm, áp suất, nhiệt độ hay lượng mưa làm tăng nguy cơ đau ở người viêm khớp dạng thấp, đau gối, đau háng hay đau thắt lưng; chỉ bệnh gút có liên quan với thời tiết nóng và khô. Một phân tích dữ liệu bảo hiểm của hơn 1,5 triệu người Mỹ từ 65 tuổi cũng không thấy lượt khám vì đau khớp, đau lưng tăng vào những ngày mưa.

Nếu những liên hệ này có thật, cơ chế của chúng vẫn chưa rõ.`;

const D6 = `## Khi lên núi cao

Lên cao, không khí loãng hơn nên máu nhận ít oxy hơn. Theo khuyến nghị chung năm 2018 của Hội Tim mạch châu Âu (ESC), Hội Tăng huyết áp châu Âu và các hội y học miền núi, cơ thể bù lại bằng cách thở nhiều hơn, tăng nhịp tim để bơm nhiều máu hơn, thay đổi trương lực mạch máu và dần dần tăng nồng độ hemoglobin. Lượng oxy thấp trong máu kích thích các thụ thể hoá học ở xoang cảnh, từ đó kích hoạt hệ thần kinh giao cảm và làm mạch máu co lại. Kết quả là huyết áp tăng rõ ngay sau khi đến nơi cao, tăng nhiều hơn khi lên càng cao, rõ hơn về đêm, và kéo dài ít nhất trong 7 ngày đầu.

Cũng theo khuyến nghị này:

- Người tăng huyết áp nhẹ hoặc đã kiểm soát tốt có thể lên rất cao (trên 4.000 m) nếu được điều trị đầy đủ.
- Người tăng huyết áp mức vừa đến nặng, hoặc có nguy cơ tim mạch từ trung bình trở lên, nên kiểm tra huyết áp trước và trong chuyến đi.
- Người tăng huyết áp nặng hoặc chưa kiểm soát được nên tránh lên cao, để phòng tổn thương cơ quan.
- Người bệnh tim mạch nên tiếp tục dùng các thuốc đang dùng khi lên cao; mọi thay đổi điều trị cần bàn với bác sĩ trước.

Huyết áp tăng là một chuyện; **say độ cao** là chuyện khác, do cơ thể chưa quen với lượng oxy thấp. Theo NHS, say độ cao thường xảy ra ở độ cao trên 2.500 m, dễ gặp hơn khi lên cao nhanh, và triệu chứng thường bắt đầu 6–10 giờ sau khi đến nơi: đau đầu, chán ăn, buồn nôn hoặc nôn, mệt, chóng mặt, khó ngủ. Triệu chứng thường đỡ sau 1–3 ngày nghỉ ở cùng độ cao; nếu nặng lên hoặc không đỡ sau 1 ngày, nên xuống thấp hơn khoảng 300–1.000 m. Để giảm nguy cơ, NHS khuyên lên cao từ từ, uống đủ nước, không uống rượu, và hỏi bác sĩ trước chuyến đi nếu từng bị say độ cao.

Khó thở cả khi nghỉ, lú lẫn hay mất thăng bằng **không** phải triệu chứng chờ cơ thể thích nghi, mà là dấu hiệu cần trợ giúp y tế ngay — xem mục "Khi nào cần đi khám hoặc gọi cấp cứu".`;

const D7 = `## Ai cần chú ý hơn khi thời tiết thay đổi?

- **Người cao tuổi**, nhất là từ 80 tuổi: huyết áp thay đổi theo nhiệt độ nhiều hơn, và phản xạ giữ nhiệt khi lạnh yếu hơn. NHS xếp người từ 65 tuổi vào nhóm dễ bị ảnh hưởng nhất khi nắng nóng.
- **Người đang điều trị tăng huyết áp**: huyết áp có thể hạ quá mức khi trời nóng hoặc tăng khi trời lạnh (ESH).
- **Người có bệnh tim, bệnh hô hấp, đái tháo đường, bệnh thận**, và **người dùng nhiều loại thuốc**: NHS xếp vào nhóm dễ bị ảnh hưởng khi nắng nóng.
- **Người có bệnh tim mạch định lên núi cao**: xem khuyến nghị ở mục "Khi lên núi cao".
- **Người bị đau nửa đầu**: một số người thấy cơn đau liên quan với thời tiết, dù mức độ khác nhau nhiều giữa từng người.

Nhóm nghiên cứu ở Pháp nói trên cho rằng theo dõi kỹ huyết áp và việc dùng thuốc trong những đợt nóng hoặc lạnh cực đoan có thể giúp giảm hậu quả của dao động huyết áp ở người cao tuổi. ESH khuyên xác nhận thay đổi theo mùa bằng đo lặp lại, tốt nhất là đo tại nhà hoặc đo liên tục 24 giờ.`;

const D8 = `## Giảm ảnh hưởng của thời tiết lên tim mạch

- **Giữ ấm khi trời lạnh.** NHS cho rằng giữ ấm trong mùa đông giúp phòng cảm lạnh, cúm và những vấn đề nặng hơn như nhồi máu cơ tim, đột quỵ. Nếu được, giữ nhiệt độ các phòng thường dùng, như phòng khách và phòng ngủ, từ 18°C trở lên — nhất là khi có bệnh.
- **Tránh nóng khi trời nóng.** NHS khuyên tránh nắng, nhất là từ 11 giờ đến 15 giờ; mặc quần áo nhẹ; tránh hoạt động làm người nóng thêm; uống thêm nước, tránh rượu, cà phê và đồ uống nóng.
- **Nếu bác sĩ đã dặn hạn chế muối và nước** — điều có thể gặp ở người suy tim, theo Viện Tim, Phổi và Máu Hoa Kỳ (NHLBI) — thì làm theo lời dặn ấy, không theo lời khuyên chung "uống thêm nước"; hỏi bác sĩ nên làm gì khi trời nóng.
- **Đo huyết áp tại nhà** nếu bác sĩ khuyên, và ghi lại kết quả (NHLBI).
- **Không tự ý đổi hay bỏ thuốc** vì trời nóng hay lạnh. NHLBI khuyên người đã được chẩn đoán tăng huyết áp tiếp tục kế hoạch điều trị; đổi liều theo mùa là việc bác sĩ quyết định dựa trên số đo (ESH).
- **Vận động đều đặn** giúp hạ huyết áp ở người tăng huyết áp — xem [Vận động thay đổi tim và mạch máu như thế nào](/articles/van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao).`;

const D9 = `## Khi nào cần đi khám hoặc gọi cấp cứu

**Gọi cấp cứu ngay** nếu bạn hoặc người bên cạnh:

- Có dấu hiệu đột quỵ, thường đến đột ngột: một bên mặt xệ xuống, khó cười; yếu hoặc tê một tay, không giơ được cả hai tay lên; nói ngọng hoặc nói lẫn lộn (NHS). Gọi cấp cứu kể cả khi các dấu hiệu đã tự hết.
- Có dấu hiệu nhồi máu cơ tim: đau, đè ép, bóp nghẹt hoặc nặng ở giữa hoặc bên trái ngực, kéo dài hơn vài phút hoặc hết rồi lại đến; khó thở; khó chịu ở một hoặc hai tay, lưng, cổ, hàm hoặc vùng bụng trên; buồn nôn, chóng mặt, ngất hoặc vã mồ hôi lạnh (NHLBI).
- Đo huyết áp trên 180/120 mmHg — chỉ cần tâm thu trên 180 **hoặc** tâm trương trên 120 — kèm đau đầu dữ dội đột ngột, khó thở, đau dữ dội đột ngột ở bụng, ngực hoặc lưng, tê hoặc yếu, thay đổi thị lực đột ngột hoặc khó nói. Theo NHLBI, huyết áp ở mức này là nguy hiểm và cần được chăm sóc y tế ngay.
- Đang ở nơi cao và có triệu chứng say độ cao kèm cảm thấy rất mệt, lú lẫn, mất thăng bằng hoặc khó phối hợp động tác, thấy hoặc nghe những thứ không có thật, khó thở cả khi nghỉ, ho hoặc khạc đờm có bọt hay lẫn máu, da, môi, lưỡi hoặc móng tím tái, buồn ngủ li bì hoặc khó đánh thức (NHS). Xuống thấp hơn khoảng 300–1.000 m ngay nếu có thể.

**Đi khám** nếu đang dùng thuốc hạ huyết áp mà thấy chóng mặt, choáng váng khi trời nóng lên, hoặc số đo tại nhà thay đổi rõ theo mùa — bác sĩ sẽ quyết định có cần điều chỉnh thuốc hay không (ESH).`;

const D10 = `## Kết luận

Trong các yếu tố thời tiết, nhiệt độ có ảnh hưởng rõ nhất tới huyết áp: trời lạnh làm mạch máu dưới da co lại và huyết áp thường cao hơn; trời nóng thì huyết áp thường thấp hơn, đôi khi hạ quá mức ở người đang dùng thuốc. Hiện tượng này gặp ở cả người huyết áp bình thường, và rõ hơn ở người cao tuổi. Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao — nơi cơ thể thiếu oxy, hệ thần kinh giao cảm được kích hoạt và huyết áp tăng. Với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng lên huyết áp, đau đầu hay đau khớp vẫn trái chiều.

Người cao tuổi và người có bệnh tim mạch nên giữ ấm khi trời lạnh, tránh nóng khi trời nóng, theo dõi huyết áp theo lời dặn của bác sĩ, và không tự đổi thuốc theo mùa.

---

*Bài viết cung cấp thông tin khoa học mang tính tham khảo, không thay thế cho tư vấn, chẩn đoán hoặc điều trị của nhân viên y tế. Nếu bạn có vấn đề sức khoẻ cụ thể, hãy trao đổi với bác sĩ.*`;

const TITLE = `Biến động thời tiết và hệ tim mạch: vì sao thời tiết có thể ảnh hưởng đến huyết áp?`;

const SUMMARY = `Huyết áp thay đổi theo thời tiết, và nhiệt độ là yếu tố có bằng chứng rõ nhất: khi trời lạnh, mạch máu dưới da co lại để giữ nhiệt và huyết áp thường cao hơn; khi trời nóng, huyết áp thường thấp hơn. Hiện tượng này gặp ở mọi lứa tuổi nhưng rõ hơn ở người cao tuổi, và có thể khiến huyết áp tăng hoặc hạ quá mức ở người đang điều trị tăng huyết áp.

Áp suất khí quyển chỉ tác động rõ khi giảm nhiều, như khi lên núi cao, nơi cơ thể thiếu oxy và huyết áp tăng. Với những dao động áp suất của thời tiết hằng ngày, bằng chứng về ảnh hưởng tới huyết áp, đau đầu hay đau khớp còn trái chiều.`;

const SEO_DESCRIPTION = `Trời lạnh và trời nóng ảnh hưởng tới huyết áp ra sao, áp suất khí quyển tác động thế nào ở núi cao và khi trời chuyển mưa, ai cần chú ý và khi nào cần đi khám.`;

export const THOI_TIET: Plan = {
  slug: "bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A8; B1–B7, B9; bỏ mô hình 'thời tiết thay đổi oxy', thêm chiều trời nóng, ngoại lệ suy tim khi khuyên uống nước, khó thở khi nghỉ ở nơi cao là dấu hiệu cấp cứu, mục khi nào cần đi khám, dòng lưu ý y tế trong thân bài; bỏ chủ đề máy bay; tiêu đề viết hoa kiểu câu)",
  reverifyMonths: 12,
  forbid: [
    "nồng độ oxy",
    "điều hòa oxy",
    "máy bay",
    "Uống đủ nước.",
    "Ngủ đủ giấc",
    "một trong những nguyên nhân",
    "Đây cũng là nguyên nhân",
    "được chứng minh",
    "huyết áp ổn định",
    "quan trọng nhất",
    "áp suất khí quyển trung bình",
    "tạm thời ở một số người",
  ],
  fixes: [
    {
      field: "title",
      find: "Biến Động Thời Tiết Và Hệ Tim Mạch: Vì Sao Thời Tiết Có Thể Ảnh Hưởng Đến Huyết Áp?",
      replace: TITLE,
      why: "B7 (D11): viết hoa kiểu câu tiếng Việt. Slug và seoTitle giữ nguyên.",
    },
    {
      field: "summary",
      find: `Nhiều người nhận thấy mình dễ đau đầu, chóng mặt hoặc cảm thấy mệt mỏi hơn khi thời tiết thay đổi. Những ảnh hưởng này đặc biệt rõ ở người cao tuổi hoặc người có bệnh lý tim mạch.

Mặc dù áp suất khí quyển có liên quan, sự thay đổi huyết áp không đơn thuần là kết quả của việc không khí "ép" lên mạch máu. Thay vào đó, cơ thể phản ứng gián tiếp thông qua hệ thần kinh, mạch máu và quá trình điều hòa oxy.`,
      replace: SUMMARY,
      why: "A2 (D11): bỏ mô hình 'cơ thể phản ứng qua quá trình điều hòa oxy' khi thời tiết biến động — sai thang đo (Parati 2018, NOAA); nhiệt độ là yếu tố có bằng chứng rõ nhất (ESH 2020); thêm chiều trời nóng (A7).",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích cơ chế sinh lý khiến sự thay đổi nhiệt độ, áp suất và oxy khi thời tiết biến động có thể ảnh hưởng đến huyết áp và tim mạch.",
      replace: SEO_DESCRIPTION,
      why: "A2 (D11): bỏ 'thay đổi … oxy khi thời tiết biến động'.",
    },
    {
      field: "content",
      find: `${FENCE}text
Thời tiết thay đổi
        ↓
Cơ thể phát hiện thay đổi nhiệt độ,
áp suất và nồng độ oxy
        ↓
Hệ thần kinh và mạch máu điều chỉnh
        ↓
Nhịp tim và huyết áp thay đổi
${FENCE}`,
      replace: D1,
      why: "A2 (D1): sơ đồ 'cơ thể phát hiện thay đổi nhiệt độ, áp suất và nồng độ oxy' gộp thang đo thời tiết với núi cao; thay bằng đoạn mở: nhiệt độ có bằng chứng rõ nhất (ESH 2020), áp suất chỉ tác động rõ ở núi cao (Parati 2018). B9: [[huyết áp]] ở lần nhắc đầu.",
    },
    {
      field: "content",
      section: "## Vai Trò Của Áp Suất Khí Quyển",
      replace: D2,
      why: "A3 (D2): câu gộp 'thời tiết hoặc núi cao' rồi gán cơ chế thiếu oxy cho cả hai; bằng chứng về áp suất hằng ngày chưa nhất quán (Jehn 2002, Kamiński 2016); so thang đo 5 hPa ≈ 0,5% (Kimoto 2011, NOAA). B2: 1013,25 hPa là áp suất chuẩn, không phải trung bình (NOAA).",
    },
    {
      field: "content",
      section: "## Vì Sao Trời Lạnh Dễ Làm Huyết Áp Tăng?",
      replace: D3,
      why: "A4 (D3): 'một trong những nguyên nhân … rét đậm' nâng 'may contribute' (Jehn 2002) thành nguyên nhân và đổi chủ thể — phần lớn tử vong gắn với lạnh vừa phải (Gasparrini 2015, mọi nguyên nhân). B3: 'được chứng minh' → đồng thuận ESH 2020; số đo Alpérovitch 2009; cơ chế co mạch giao cảm (Alba 2019).",
    },
    {
      field: "content",
      section: "## Vì Sao Nhiều Người Khó Chịu Trước Khi Trời Mưa?",
      replace: D5,
      why: "B1 (D5): chỉ kể vế ủng hộ — thêm vế trái chiều: đau nửa đầu (Li 2025 OR 1,07; Kimoto 2011; Denney 2024 'inconsistent'), đau khớp (Wang 2023 vs Ferreira 2024, Jena 2017). Bỏ 'đau đầu' chung không nguồn.",
    },
    {
      field: "content",
      before: "## Đau đầu và đau khớp khi trời chuyển mưa",
      insert: D4,
      why: "A7 (D4): bài chỉ có chiều lạnh — thêm chiều nóng: huyết áp có thể hạ quá mức ở người đang dùng thuốc (ESH 2020), huyết áp đêm cao hơn ở người cao tuổi đang điều trị (Modesti 2006), nguy cơ nắng nóng (NHS). Đặt sau D3, trước D5 như phiếu.",
    },
    {
      field: "content",
      section: "## Điều Gì Xảy Ra Khi Lên Núi Cao Hoặc Đi Máy Bay?",
      replace: D6,
      why: "A5 (D6): bỏ nhân quả tự thêm 'huyết áp tăng là nguyên nhân gây triệu chứng' say độ cao; 'khó thở' khi nghỉ là dấu hiệu cần trợ giúp ngay (NHS); 'tạm thời ở một số người' nói nhẹ hơn Parati 2018; thêm khuyến nghị cho người tăng huyết áp (Parati 2018, bảng 2–3). B5: bỏ 'đi máy bay' khỏi tiêu đề — không nguồn.",
    },
    {
      field: "content",
      section: "## Những Ai Nhạy Cảm Với Thời Tiết?",
      replace: D7,
      why: "B4 (D7): gắn nguồn cho từng nhóm (Alpérovitch 2009, ESH 2020, NHS nắng nóng, Li 2025); 'theo dõi khi thời tiết thay đổi mạnh' → theo dõi khi nhiệt độ cực đoan, xác nhận bằng đo tại nhà/24 giờ.",
    },
    {
      field: "content",
      section: "## Hạn Chế Ảnh Hưởng Của Thời Tiết Đến Hệ Tim Mạch",
      replace: D8,
      why: "A6 (D8): 'uống đủ nước' cho người bệnh tim bỏ ngoại lệ suy tim hạn chế muối và nước (NHLBI); thêm tránh nóng (NHS), giữ ấm ≥18°C (NHS), không tự đổi thuốc (NHLBI, ESH). B6: bỏ 'ngủ đủ giấc' không nguồn, vận động dẫn sang bài có nguồn.",
    },
    {
      field: "content",
      before: "## Kết Luận",
      insert: D9,
      why: "A8 (D9): bài có lời khuyên cho người cao tuổi/người bệnh tim nhưng thiếu dấu hiệu cấp cứu — đột quỵ (NHS), nhồi máu cơ tim và ngưỡng 180/120 (NHLBI), say độ cao nặng (NHS), choáng khi trời nóng ở người dùng thuốc hạ áp (ESH).",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D10,
      why: "A3 (D10): 'nồng độ oxy … quan trọng nhất' và 'người khỏe mạnh … huyết áp ổn định' trái ESH 2020 (gặp cả ở người huyết áp bình thường). A8: danh mục Sinh học không có khung lưu ý y tế — chủ chốt phương án (a), dòng lưu ý trong thân bài như bài van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao.",
    },
  ],
  // D12: bốn bài PUBLISHED + PASSED; tiêu đề chép từ CSDL (published-passed.tsv).
  reading: [
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    ["Nguyên nhân của mùa: độ nghiêng trục, không phải khoảng cách", "nguyen-nhan-cua-mua-do-nghieng-truc-khong-phai-khoang-cach"],
    ["Cơ thể người sẽ biến đổi thế nào trong không gian nếu không có đồ bảo hộ?", "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho"],
    [
      "Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?",
      "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa",
    ],
  ],
  // Mục C: 14 bậc 1 (DOI đã tra Crossref) + 7 bậc 2. Trang không ghi ngày duyệt → năm truy cập (2026), như tiền lệ các đợt trước.
  sources: [
    { title: "Seasonal variation in blood pressure: evidence, consensus and recommendations for clinical practice. Consensus statement by the European Society of Hypertension Working Group on Blood Pressure Monitoring and Cardiovascular Variability", publisher: "Journal of Hypertension", doi: "10.1097/HJH.0000000000002341", year: 2020, tier: 1 },
    { title: "Relationship between blood pressure and outdoor temperature in a large sample of elderly individuals: the Three-City study", publisher: "Archives of Internal Medicine", doi: "10.1001/archinternmed.2008.512", year: 2009, tier: 1 },
    { title: "Weather-related changes in 24-hour blood pressure profile: effects of age and implications for hypertension management", publisher: "Hypertension", doi: "10.1161/01.HYP.0000199192.17126.d4", year: 2006, tier: 1 },
    { title: "The effect of ambient temperature and barometric pressure on ambulatory blood pressure variability", publisher: "American Journal of Hypertension", doi: "10.1016/S0895-7061(02)02999-0", year: 2002, tier: 1 },
    { title: "Evaluation of the impact of atmospheric pressure in different seasons on blood pressure in patients with arterial hypertension", publisher: "International Journal of Occupational Medicine and Environmental Health", doi: "10.13075/ijomeh.1896.00546", year: 2016, tier: 1 },
    { title: "Cold-induced cutaneous vasoconstriction in humans: function, dysfunction and the distinctly counterproductive", publisher: "Experimental Physiology", doi: "10.1113/EP087718", year: 2019, tier: 1 },
    { title: "Mortality risk attributable to high and low ambient temperature: a multicountry observational study", publisher: "The Lancet", doi: "10.1016/S0140-6736(14)62114-0", year: 2015, tier: 1 },
    { title: "Clinical recommendations for high altitude exposure of individuals with pre-existing cardiovascular conditions", publisher: "European Heart Journal", doi: "10.1093/eurheartj/ehx720", year: 2018, tier: 1 },
    { title: "Influence of barometric pressure in patients with migraine headache", publisher: "Internal Medicine", doi: "10.2169/internalmedicine.50.5640", year: 2011, tier: 1 },
    { title: "Association between weather conditions and migraine: a systematic review and meta-analysis", publisher: "Journal of Neurology", doi: "10.1007/s00415-025-13078-0", year: 2025, tier: 1 },
    { title: "Whether weather matters with migraine", publisher: "Current Pain and Headache Reports", doi: "10.1007/s11916-024-01216-8", year: 2024, tier: 1 },
    { title: "Associations between weather conditions and osteoarthritis pain: a systematic review and meta-analysis", publisher: "Annals of Medicine", doi: "10.1080/07853890.2023.2196439", year: 2023, tier: 1 },
    { title: "Come rain or shine: is weather a risk factor for musculoskeletal pain? A systematic review with meta-analysis of case-crossover studies", publisher: "Seminars in Arthritis and Rheumatism", doi: "10.1016/j.semarthrit.2024.152392", year: 2024, tier: 1 },
    { title: "Association between rainfall and diagnoses of joint or back pain: retrospective claims analysis", publisher: "BMJ", doi: "10.1136/bmj.j5326", year: 2017, tier: 1 },
    { title: "JetStream — Air Pressure", publisher: "NOAA", url: "https://www.noaa.gov/jetstream/atmosphere/air-pressure", year: 2026, tier: 2 },
    { title: "Altitude sickness", publisher: "NHS", url: "https://www.nhs.uk/conditions/altitude-sickness/", year: 2023, tier: 2 },
    { title: "Heatwave: how to cope in hot weather", publisher: "NHS", url: "https://www.nhs.uk/live-well/seasonal-health/heatwave-how-to-cope-in-hot-weather/", year: 2026, tier: 2 },
    { title: "Winter vaccinations and winter health", publisher: "NHS", url: "https://www.nhs.uk/live-well/seasonal-health/keep-warm-keep-well/", year: 2026, tier: 2 },
    { title: "Symptoms of a stroke", publisher: "NHS", url: "https://www.nhs.uk/conditions/stroke/symptoms/", year: 2024, tier: 2 },
    { title: "Living With High Blood Pressure", publisher: "NHLBI", url: "https://www.nhlbi.nih.gov/health/high-blood-pressure/living-with", year: 2026, tier: 2 },
    { title: "Living With Heart Failure", publisher: "NHLBI", url: "https://www.nhlbi.nih.gov/health/heart-failure/living-with", year: 2026, tier: 2 },
  ],
};
