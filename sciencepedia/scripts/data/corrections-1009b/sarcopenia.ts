import type { Plan } from "./types";

/**
 * Phiếu: docs/content/checks/2026-10-08/chung-teo-co-do-tuoi-tac-sarcopenia-ke-thu-tham-lang-cua-tuoi-gia.md
 * Văn bản thay lấy nguyên văn mục D. Tiêu đề: tên Việt cho sarcopenia CHƯA chốt (phiếu E) — không
 * dùng tiêu đề đề xuất ở B7, chỉ viết hoa kiểu câu, giữ nguyên chữ.
 */

const FENCE = "```";

const D1 = `**Sarcopenia** không chỉ là sự hao hụt cơ bình thường khi già đi. Nhóm công tác châu Âu về sarcopenia ở người cao tuổi (EWGSOP2) xếp nó là một bệnh của cơ, trong đó sức cơ thấp là dấu hiệu chính, và chẩn đoán chỉ được xác nhận khi khối lượng hoặc chất lượng cơ cũng thấp. Bệnh thường gặp ở người cao tuổi — một hướng dẫn lâm sàng quốc tế năm 2018 ước tính khoảng 6–22% — nhưng cũng có thể xuất hiện sớm hơn, ở tuổi trung niên, đi kèm một số bệnh khác.`;

const D2 = `## Sarcopenia được xác định thế nào

Không có một bộ ngưỡng chung cho mọi nơi. Hai bộ tiêu chí được dùng rộng rãi là của EWGSOP2 (châu Âu) và của Nhóm công tác châu Á về sarcopenia (AWGS 2019):

- **Sức cơ thấp** — thường đo bằng lực bóp tay: dưới 27 kg ở nam và dưới 16 kg ở nữ theo EWGSOP2; dưới 28 kg ở nam và dưới 18 kg ở nữ theo AWGS 2019. EWGSOP2 cũng chấp nhận bài đứng lên ngồi xuống khỏi ghế 5 lần không dùng tay, coi là thấp khi mất hơn 15 giây.
- **Khối cơ thấp** — đo bằng máy, như hấp thụ tia X năng lượng kép (DXA) hoặc phân tích trở kháng điện sinh học (BIA), để xác nhận chẩn đoán.
- **Khả năng vận động kém** — ví dụ tốc độ đi bộ từ 0,8 m/giây trở xuống theo EWGSOP2 — cho thấy bệnh ở mức nặng.

Để sàng lọc, các nhóm chuyên gia dùng bảng hỏi ngắn SARC-F, gồm năm câu về sức cơ, việc đi bộ, đứng dậy khỏi ghế, leo cầu thang và số lần ngã. Theo EWGSOP2, bảng hỏi này hiếm khi báo nhầm nhưng bỏ sót khá nhiều trường hợp, nên chủ yếu phát hiện các ca nặng.`;

const D3 = `## Cơ bắp thay đổi theo tuổi

Khối cơ không giảm đột ngột khi về già. Một nghiên cứu chụp cộng hưởng từ toàn thân trên 468 người từ 18 đến 88 tuổi thấy tỉ lệ cơ so với cân nặng bắt đầu giảm từ độ tuổi 20–29, nhưng khối cơ tính theo kilogam chỉ giảm rõ từ cuối độ tuổi 40, chủ yếu ở phần thân dưới. Nghiên cứu này so sánh những người ở các độ tuổi khác nhau, không theo dõi cùng một người theo thời gian.

Sức cơ giảm nhanh hơn khối cơ. Trong một nghiên cứu theo dõi 1.880 người cao tuổi suốt ba năm, sức cơ chân giảm khoảng 2,6–4,1% mỗi năm tùy giới và chủng tộc, nhanh gấp khoảng ba lần tốc độ mất khối nạc ở chân (khoảng 1% mỗi năm). Người giữ được, thậm chí tăng được khối cơ vẫn không tránh khỏi việc sức cơ giảm. Một tổng quan định lượng cũng ghi nhận sức cơ mất nhanh gấp 2–5 lần khối cơ, và sức cơ yếu là yếu tố dự báo tàn tật và tử vong ổn định hơn khối cơ thấp. EWGSOP2 coi sức cơ là thước đo đáng tin cậy nhất hiện nay của chức năng cơ.`;

const D4 = `## Vì sao sarcopenia xảy ra?

Sarcopenia có nhiều nguyên nhân đan xen. Khi không tìm thấy nguyên nhân nào khác ngoài tuổi tác, bệnh được gọi là sarcopenia nguyên phát; khi có thêm nguyên nhân khác, gọi là thứ phát.

### Mất tế bào thần kinh vận động

Mỗi sợi cơ co được là nhờ một tế bào thần kinh vận động. Các ước tính cho thấy đến khoảng 71 tuổi, người cao tuổi khỏe mạnh có ít hơn chừng 40% đơn vị vận động — mỗi đơn vị gồm một tế bào thần kinh vận động và các sợi cơ nó điều khiển. Những đơn vị còn lại to ra, được cho là do "nhận nuôi" một phần sợi cơ đã mất dây thần kinh. Sự bù đắp này không đủ, và cả số lượng lẫn kích thước sợi cơ đều giảm. Một tổng quan năm 2019 cho rằng mất khối cơ theo tuổi phần lớn là do mất dần tế bào thần kinh vận động; một tổng quan khác lưu ý bằng chứng còn hạn chế vì thiếu nghiên cứu theo dõi dài hạn và cỡ mẫu còn nhỏ.

### Cơ kém đáp ứng với đạm

Trong một thí nghiệm trên 44 nam giới trẻ và cao tuổi có vóc người tương tự, tốc độ tổng hợp protein cơ lúc nghỉ của hai nhóm không khác nhau. Nhưng sau khi uống các axit amin thiết yếu, cơ của người cao tuổi tăng tổng hợp protein ít hơn. Hiện tượng này gọi là **kháng đồng hoá** (*anabolic resistance*); các tác giả cho rằng nó có lẽ là một nguyên nhân chính khiến cơ người cao tuổi không duy trì được.

### Thay đổi nội tiết

Nồng độ nhiều hormone đồng hoá và hormone sinh dục trong máu giảm theo tuổi, và sự tiết hormone tăng trưởng giảm sau tuổi 50. Bổ sung testosterone làm tăng khối cơ ở nam giới cao tuổi bị thiếu hormone này, nhưng một hướng dẫn lâm sàng quốc tế năm 2018 không đưa ra khuyến nghị dùng hormone đồng hoá để điều trị sarcopenia.

### Ít vận động, ăn thiếu và bệnh khác

Theo EWGSOP2, ít vận động — do lối sống tĩnh tại hoặc do bệnh tật, tàn tật khiến phải nằm, ngồi nhiều — góp phần gây sarcopenia. Ăn thiếu năng lượng hoặc thiếu đạm cũng vậy, dù do chán ăn, kém hấp thu hay khó tiếp cận thực phẩm. Bệnh toàn thân, nhất là bệnh có phản ứng viêm như ung thư hay suy tạng, cũng có thể gây sarcopenia. Trong số này, vận động và ăn uống là những yếu tố có thể thay đổi được.`;

const D5_NGA = `### Té ngã và gãy xương

Một phân tích gộp 33 nghiên cứu trên hơn 45.000 người từ 65 tuổi thấy người mắc sarcopenia có nguy cơ ngã và gãy xương cao hơn người không mắc. Trong các nghiên cứu theo dõi theo thời gian, tỉ số chênh (một thước đo mức độ liên quan) là khoảng 1,9 với ngã và 1,7 với gãy xương. Theo Viện Lão hoá Quốc gia Hoa Kỳ (NIA), hơn một phần tư người từ 65 tuổi bị ngã mỗi năm; với người cao tuổi, gãy xương có thể mở đầu cho những vấn đề sức khỏe nghiêm trọng hơn và tàn tật lâu dài.`;

const D5_DUONG = `### Đường huyết

Cơ xương là nơi hấp thu glucose chính sau bữa ăn: khi insulin trong máu được nâng cao trong thí nghiệm, khoảng 80% lượng glucose được cơ hấp thu. Lúc đói thì khác: khoảng 70–75% glucose được dùng ở các mô không phụ thuộc insulin như não, hồng cầu và các tạng trong ổ bụng.

Trong dữ liệu một khảo sát quốc gia của Hoa Kỳ trên hơn 13.000 người, tỉ lệ khối cơ trên cân nặng càng cao thì độ nhạy insulin càng tốt và tỉ lệ tiền đái tháo đường càng thấp. Đây là nghiên cứu cắt ngang: nó cho thấy mối liên quan, chưa chứng minh mất cơ gây ra đái tháo đường. Các tác giả cho rằng cần nghiên cứu thêm xem tập luyện để tăng khối cơ có làm giảm số người mắc đái tháo đường hay không.`;

// D6 thay tới hết "Bổ Sung Đủ Protein"; tiểu mục "Duy trì vận động hằng ngày" giữ nguyên chữ, chỉ sửa viết hoa.
const D6 = `## Có thể phòng ngừa và điều trị sarcopenia không?

Theo EWGSOP2, can thiệp sớm và hiệu quả có thể giúp phòng ngừa, làm chậm, điều trị và đôi khi đảo ngược sarcopenia. Để phòng hoặc làm chậm bệnh, nhóm này khuyên nhìn theo cả đời người: tích luỹ tối đa khối cơ khi còn trẻ, duy trì ở tuổi trung niên và hạn chế hao hụt khi về già.

### Tập luyện kháng lực

Tập kháng lực là dùng sức cơ chống lại một lực cản — tạ, dây kháng lực hoặc chính trọng lượng cơ thể. Hướng dẫn lâm sàng quốc tế của ICFSR (2018) khuyến nghị mạnh tập kháng lực để điều trị sarcopenia. Hướng dẫn này không khuyến nghị loại thuốc nào; các thuốc đang được phát triển nhằm tăng thêm lợi ích của tập kháng lực.

Theo hướng dẫn về hoạt động thể chất của Tổ chức Y tế Thế giới (WHO) năm 2020:

- Người trưởng thành nên tập tăng sức cơ ở cường độ vừa trở lên, cho mọi nhóm cơ chính, từ 2 ngày mỗi tuần trở lên.
- Người cao tuổi, trong lượng vận động hằng tuần, nên tập nhiều dạng phối hợp, nhấn mạnh thăng bằng và tăng sức cơ, ở cường độ vừa trở lên, từ 3 ngày mỗi tuần trở lên, để tăng khả năng vận động và phòng ngã.
- Người cao tuổi nên vận động nhiều nhất mà khả năng cho phép, và điều chỉnh mức gắng sức theo thể lực của mình.

WHO cho rằng người không có chống chỉ định nhìn chung không cần khám trước khi bắt đầu tập nếu bắt đầu nhẹ rồi tăng dần. Người có bệnh mạn tính có thể hỏi nhân viên y tế hoặc chuyên gia vận động về loại và lượng bài tập phù hợp, và ai xuất hiện triệu chứng mới khi tăng mức tập nên đi khám.

### Ăn đủ đạm

Đạm (protein) cung cấp nguyên liệu để xây dựng và sửa chữa mô cơ. Nhóm chuyên gia PROT-AGE (2013) và Hội Dinh dưỡng lâm sàng và Chuyển hoá châu Âu (ESPEN, 2014) cho rằng người cao tuổi cần nhiều đạm hơn người trẻ, một phần vì cơ của họ đáp ứng kém hơn với đạm ăn vào. Các nhóm này khuyến nghị:

- Người cao tuổi khỏe mạnh: ít nhất 1,0–1,2 g đạm cho mỗi kilogam cân nặng mỗi ngày.
- Người cao tuổi đang tập luyện, vận động nhiều: từ 1,2 g/kg/ngày trở lên (PROT-AGE).
- Người cao tuổi mắc bệnh cấp hoặc mạn tính, hoặc có nguy cơ suy dinh dưỡng: khoảng 1,2–1,5 g/kg/ngày.
- **Ngoại lệ:** người bệnh thận nặng (mức lọc cầu thận ước tính dưới 30 mL/phút/1,73 m²) chưa chạy thận có thể cần **hạn chế** lượng đạm.

Hướng dẫn ICFSR chỉ khuyến nghị có điều kiện — mức yếu hơn so với tập luyện — việc bổ sung đạm hoặc ăn giàu đạm cho người mắc sarcopenia.

Các nguồn đạm gồm cá, thịt nạc, trứng, sữa, các loại đậu và sản phẩm từ đậu nành.

Chia đều lượng đạm trong các bữa thay vì dồn vào bữa tối có thể giúp cơ tổng hợp protein tốt hơn. Trong một thí nghiệm nhỏ trên 8 người trưởng thành khoảng 37 tuổi, ăn khoảng 30 g đạm mỗi bữa làm tốc độ tổng hợp protein cơ trong 24 giờ cao hơn 25% so với dồn phần lớn lượng đạm vào bữa tối. Tuy vậy, nhóm PROT-AGE đánh giá bằng chứng về thời điểm ăn đạm chưa đủ để đưa ra khuyến nghị cụ thể.

### Duy trì vận động hằng ngày

Ngoài tập luyện có chủ đích, các hoạt động thường ngày như đi bộ, leo cầu thang, làm việc nhà hoặc làm vườn cũng góp phần duy trì chức năng cơ bắp.`;

const D7 = `## Khi nào nên đi khám

Viện Lão hoá Quốc gia Hoa Kỳ (NIA) khuyên: nếu bạn hoặc người thân cảm thấy yếu toàn thân, hãy nói chuyện với bác sĩ. Nguyên nhân có thể là sarcopenia, nhưng cũng có thể là một bệnh khác.

Theo EWGSOP2, những dấu hiệu sau nên được kiểm tra thêm:

- hay bị ngã;
- cảm thấy yếu;
- đi bộ chậm;
- khó đứng dậy khỏi ghế;
- sụt cân hoặc teo cơ.

Bác sĩ có thể đo lực bóp tay, thời gian đứng lên ngồi xuống khỏi ghế, tốc độ đi bộ và khối cơ để chẩn đoán.`;

const D8 = `## Kết luận

Sarcopenia không đồng nghĩa với sự hao hụt cơ bình thường theo tuổi: đó là một bệnh của cơ, được chẩn đoán khi sức cơ và khối cơ xuống dưới những ngưỡng xác định. Sức cơ giảm nhanh hơn khối cơ, và sức cơ yếu báo trước nguy cơ tàn tật và tử vong rõ hơn. Tập luyện kháng lực là biện pháp duy nhất được hướng dẫn quốc tế ICFSR khuyến nghị ở mức mạnh; ăn đủ đạm hỗ trợ thêm, trừ ở người bệnh thận nặng cần hạn chế đạm. Để phòng hoặc làm chậm sarcopenia, các chuyên gia châu Âu khuyên tích luỹ khối cơ khi còn trẻ, giữ nó ở tuổi trung niên và hạn chế hao hụt khi về già.`;

export const SARCOPENIA: Plan = {
  slug: "chung-teo-co-do-tuoi-tac-sarcopenia-ke-thu-tham-lang-cua-tuoi-gia",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A10; B1–B7, B9; sarcopenia là bệnh có ngưỡng chẩn đoán, ngoại lệ bệnh thận khi tăng đạm, mục khi nào nên đi khám; tiêu đề chỉ viết hoa kiểu câu)",
  toDraft: true,
  forbid: [
    "sau tuổi 30",
    "nguyên nhân phổ biến nhất",
    "2-3 buổi",
    "hiệu quả nhất",
    "một phần của quá trình lão hóa",
    "tiêu thụ glucose lớn nhất",
  ],
  fixes: [
    {
      field: "title",
      find: "Chứng Teo Cơ Do Tuổi Tác (Sarcopenia): Kẻ Thù Thầm Lặng Của Tuổi Già",
      replace: "Chứng teo cơ do tuổi tác (Sarcopenia): kẻ thù thầm lặng của tuổi già",
      why: "B7: viết hoa kiểu câu tiếng Việt. Tên Việt cho sarcopenia chưa chốt (phiếu E) — giữ nguyên chữ, không dùng tiêu đề đề xuất. Slug giữ.",
    },
    {
      field: "summary",
      find: "Khi nhắc đến lão hóa, nhiều người nghĩ ngay đến tóc bạc, nếp nhăn hay loãng xương. Tuy nhiên, một trong những thay đổi ảnh hưởng lớn nhất đến sức khỏe người cao tuổi lại là **Sarcopenia** – tình trạng mất dần khối lượng, sức mạnh và chức năng cơ bắp theo tuổi tác.\n\nĐây không chỉ là vấn đề ngoại hình mà còn ảnh hưởng trực tiếp đến khả năng đi lại, vận động và duy trì sự độc lập trong cuộc sống hằng ngày.",
      replace: `**Sarcopenia** là một bệnh của cơ, trong đó sức cơ và khối cơ suy giảm. Bệnh thường gặp ở người cao tuổi nhưng cũng có thể xuất hiện sớm hơn, và đi kèm nguy cơ té ngã, gãy xương và mất khả năng tự lập cao hơn.

Sức cơ giảm nhanh hơn khối cơ, và các tiêu chí chẩn đoán hiện nay lấy sức cơ làm dấu hiệu chính. Tập luyện kháng lực là biện pháp điều trị được khuyến nghị mạnh nhất; ăn đủ đạm hỗ trợ thêm.`,
      why: "A3 (D9): sarcopenia là bệnh cơ có tiêu chí chẩn đoán (EWGSOP2), không đồng nhất với lão hoá; bỏ xếp hạng không nguồn 'một trong những thay đổi ảnh hưởng lớn nhất'.",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích nguyên nhân gây teo cơ Sarcopenia ở người cao tuổi và hướng dẫn các phương pháp phòng ngừa qua tập luyện, dinh dưỡng.",
      replace:
        "Sarcopenia là gì, được chẩn đoán theo tiêu chí nào, vì sao xảy ra, liên quan thế nào tới té ngã, bằng chứng về tập kháng lực và ăn đủ đạm, và khi nào nên đi khám.",
      why: "B9 (D9): bài bách khoa không 'hướng dẫn' phòng ngừa/điều trị.",
    },
    {
      field: "content",
      find: `${FENCE}text
Tuổi tác tăng
      ↓
Khối lượng cơ giảm
      ↓
Sức mạnh giảm
      ↓
Khả năng vận động suy giảm
      ↓
Tăng nguy cơ té ngã và mất tự chủ
${FENCE}`,
      replace: D1,
      why: "A2 (D1): sơ đồ dựng chuỗi 'mất khối cơ → mất sức cơ' mà Goodpaster 2006, Mitchell 2012 và chính bài bác; A3: nói rõ sarcopenia là bệnh của cơ (EWGSOP2), có thể gặp sớm hơn.",
    },
    {
      field: "content",
      before: "## Cơ Bắp Mất Đi Theo Tuổi Tác",
      insert: D2,
      why: "A3 (D2): mục mới về ngưỡng chẩn đoán EWGSOP2 / AWGS 2019 và sàng lọc SARC-F.",
    },
    {
      field: "content",
      section: "## Cơ Bắp Mất Đi Theo Tuổi Tác",
      replace: D3,
      why: "A4 (D3): mốc 'sau tuổi 30' không nguồn — thay bằng số đo Janssen 2000 kèm giới hạn cắt ngang; B3: sức cơ giảm nhanh hơn khối nạc (không phải 'cân nặng'), số đo Goodpaster 2006 / Mitchell 2012.",
    },
    {
      field: "content",
      section: "## Vì Sao Sarcopenia Xảy Ra?",
      replace: D4,
      why: "A5 (D4): bỏ 'nguyên nhân phổ biến nhất' và câu mục đích luận; B1: hormone không còn đứng đầu, nêu ICFSR không khuyến nghị hormone đồng hoá; B2: mất dây thần kinh và tái phân bố (Piasecki 2016, Larsson 2019) kèm giới hạn bằng chứng.",
    },
    {
      field: "content",
      find: "## Hậu Quả Không Chỉ Là Yếu Sức",
      replace: "## Hậu quả không chỉ là yếu sức",
      why: "B7: tiêu đề mục viết hoa kiểu câu (phiếu D giữ câu mở mục).",
    },
    {
      field: "content",
      section: "### Tăng Nguy Cơ Té Ngã",
      replace: D5_NGA,
      why: "B4 (D5): cơ chế và xếp hạng 'nguyên nhân hàng đầu' không nguồn — thay bằng phân tích gộp Yeung 2019 và số liệu NIA.",
    },
    {
      field: "content",
      section: "### Rối Loạn Chuyển Hóa",
      replace: D5_DUONG,
      why: "A6 (D5): 'nơi tiêu thụ glucose lớn nhất' chỉ đúng sau ăn (DeFronzo 2009); 'làm tăng nguy cơ' đái tháo đường là nhân quả tự thêm trên số liệu cắt ngang (Srikanthan 2011).",
    },
    {
      field: "content",
      find: "### Giảm Chất Lượng Cuộc Sống",
      replace: "### Giảm chất lượng cuộc sống",
      why: "B7: tiêu đề mục viết hoa kiểu câu (phiếu D giữ tiểu mục).",
    },
    {
      field: "content",
      section: "## Có Thể Phòng Ngừa Sarcopenia Không?",
      replace: D6,
      why: "A7 (D6): '2-3 buổi' không nguồn, thay bằng WHO 2020 (người cao tuổi ≥3 ngày/tuần, đa thành phần); A8: thêm ngoại lệ bệnh thận nặng eGFR <30 (PROT-AGE) và nói rõ là khuyến nghị nhóm chuyên gia; A9: thời điểm ăn đạm 'chưa đủ bằng chứng', Mamerow n = 8 tuổi ~37; B5: tập kháng lực khuyến nghị mạnh, đạm chỉ có điều kiện (ICFSR); B6: định nghĩa chung + câu an toàn WHO thay danh sách bài tập. Giữ tiểu mục 'Duy trì vận động hằng ngày', sửa viết hoa.",
    },
    {
      field: "content",
      before: "## Kết Luận",
      insert: D7,
      why: "A10 (D7): bài sức khoẻ có lời khuyên tự làm nhưng thiếu dấu hiệu nên đi khám (NIA, EWGSOP2).",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D8,
      why: "A3 + B5 (D8): 'một phần của quá trình lão hoá' và xếp tập luyện ngang bổ sung đạm là 'hiệu quả nhất' — sai mức khuyến nghị ICFSR; nhắc lại ngoại lệ bệnh thận.",
    },
  ],
  // Không có bài cơ/xương/dinh dưỡng đạm đang PUBLISHED + PASSED; chọn ba bài về vận động gần nhất.
  reading: [
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    [
      "Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?",
      "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa",
    ],
    ["Runner’s High: Vì sao chạy bộ có thể khiến bạn hưng phấn?", "runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan"],
  ],
  sources: [
    { title: "Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2)", publisher: "Age and Ageing", doi: "10.1093/ageing/afy169", year: 2019, tier: 1 },
    { title: "Asian Working Group for Sarcopenia: 2019 consensus update on sarcopenia diagnosis and treatment", publisher: "Journal of the American Medical Directors Association", doi: "10.1016/j.jamda.2019.12.012", year: 2020, tier: 1 },
    { title: "Sarcopenia", publisher: "The Lancet", doi: "10.1016/S0140-6736(19)31138-9", year: 2019, tier: 1 },
    { title: "International Clinical Practice Guidelines for Sarcopenia (ICFSR): screening, diagnosis and management", publisher: "The Journal of Nutrition, Health & Aging", doi: "10.1007/s12603-018-1139-9", year: 2018, tier: 1 },
    { title: "The loss of skeletal muscle strength, mass, and quality in older adults: the Health, Aging and Body Composition Study", publisher: "The Journals of Gerontology: Series A", doi: "10.1093/gerona/61.10.1059", year: 2006, tier: 1 },
    { title: "Sarcopenia, dynapenia, and the impact of advancing age on human skeletal muscle size and strength; a quantitative review", publisher: "Frontiers in Physiology", doi: "10.3389/fphys.2012.00260", year: 2012, tier: 1 },
    { title: "Skeletal muscle mass and distribution in 468 men and women aged 18–88 yr", publisher: "Journal of Applied Physiology", doi: "10.1152/jappl.2000.89.1.81", year: 2000, tier: 1 },
    { title: "Sarcopenia: aging-related loss of muscle mass and function", publisher: "Physiological Reviews", doi: "10.1152/physrev.00061.2017", year: 2019, tier: 1 },
    { title: "Age-dependent motor unit remodelling in human limb muscles", publisher: "Biogerontology", doi: "10.1007/s10522-015-9627-3", year: 2016, tier: 1 },
    { title: "Anabolic signaling deficits underlie amino acid resistance of wasting, aging muscle", publisher: "The FASEB Journal", doi: "10.1096/fj.04-2640fje", year: 2005, tier: 1 },
    { title: "Sarcopenia and its association with falls and fractures in older adults: a systematic review and meta-analysis", publisher: "Journal of Cachexia, Sarcopenia and Muscle", doi: "10.1002/jcsm.12411", year: 2019, tier: 1 },
    { title: "Skeletal muscle insulin resistance is the primary defect in type 2 diabetes", publisher: "Diabetes Care", doi: "10.2337/dc09-S302", year: 2009, tier: 1 },
    { title: "Relative muscle mass is inversely associated with insulin resistance and prediabetes. Findings from the Third National Health and Nutrition Examination Survey", publisher: "The Journal of Clinical Endocrinology & Metabolism", doi: "10.1210/jc.2011-0435", year: 2011, tier: 1 },
    { title: "Evidence-based recommendations for optimal dietary protein intake in older people: a position paper from the PROT-AGE Study Group", publisher: "Journal of the American Medical Directors Association", doi: "10.1016/j.jamda.2013.05.021", year: 2013, tier: 1 },
    { title: "Protein intake and exercise for optimal muscle function with aging: recommendations from the ESPEN Expert Group", publisher: "Clinical Nutrition", doi: "10.1016/j.clnu.2014.04.007", year: 2014, tier: 1 },
    { title: "Dietary protein distribution positively influences 24-h muscle protein synthesis in healthy adults", publisher: "The Journal of Nutrition", doi: "10.3945/jn.113.185280", year: 2014, tier: 1 },
    { title: "World Health Organization 2020 guidelines on physical activity and sedentary behaviour", publisher: "British Journal of Sports Medicine", doi: "10.1136/bjsports-2020-102955", year: 2020, tier: 2 },
    {
      title: "Falls and Fractures in Older Adults: Causes and Prevention",
      publisher: "National Institute on Aging (NIH)",
      url: "https://www.nia.nih.gov/health/falls-and-falls-prevention/falls-and-fractures-older-adults-causes-and-prevention",
      year: 2022,
      tier: 2,
    },
  ],
};
