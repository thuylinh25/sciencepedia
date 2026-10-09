import type { Plan } from "./types";

/** Phiếu: docs/content/checks/2026-10-08/grounding-tiep-dia-dieu-gi-thuc-su-xay-ra-khi-di-chan-tran-tren-dat.md */

const D1 = `Grounding, còn gọi là earthing hay tiếp địa, là để da tiếp xúc trực tiếp với mặt đất — đi chân trần trên đất, cát, cỏ — hoặc nối cơ thể xuống đất bằng tấm lót, miếng dán dẫn điện. Phần vật lý là có thật: cơ thể dẫn điện, nên khi được nối đất, điện thế của nó cân bằng với điện thế của đất. Còn những lợi ích sức khoẻ thường được quảng bá — ngủ ngon hơn, bớt đau, bớt viêm — thì chưa được chứng minh: các nghiên cứu hiện có rất nhỏ, phần lớn dùng thiết bị nối đất trong nhà chứ không phải đi chân trần, và nhiều nghiên cứu do những tác giả có quan hệ tài chính với một công ty bán sản phẩm earthing thực hiện.`;

const D2 = `## Grounding có lợi cho sức khoẻ không?

Chưa được chứng minh. Đã có nghiên cứu ghi nhận một số thay đổi, nhưng bằng chứng còn rất yếu, vì những lý do dưới đây.

**Mẫu rất nhỏ, phần lớn là nghiên cứu thí điểm.** Ví dụ:

- **Giấc ngủ và căng thẳng:** 12 người có vấn đề về giấc ngủ, đau và căng thẳng ngủ trên tấm lót dẫn điện nối đất trong 8 tuần. Nồng độ cortisol ban đêm giảm, và hầu hết người tham gia tự báo cáo ngủ tốt hơn, bớt đau, bớt căng thẳng. Nghiên cứu không có nhóm đối chứng (Ghaly và Teplitz, 2004).
- **Đau cơ sau vận động:** 8 người, 4 người được nối đất và 4 người dùng thiết bị giả không nối đất; cả người tham gia lẫn người nghiên cứu đều không biết ai thuộc nhóm nào. Nhóm tác giả đo 48 chỉ số và gọi đây là nghiên cứu thí điểm, nhằm chọn chỉ số cho một nghiên cứu lớn hơn (Brown và cộng sự, 2010).
- **Máu:** 10 người được nối đất trong 2 giờ; trong mẫu máu đầu ngón tay quan sát dưới kính hiển vi, hồng cầu ít vón cụm hơn (Chevalier và cộng sự, 2013). Đây là phép đo trên lam kính, không phải phép đo tuần hoàn máu trong cơ thể.
- **Đau và mệt mỏi ở người làm nghề xoa bóp:** 16 người, kết quả dựa trên bảng hỏi tự đánh giá (Chevalier và cộng sự, 2019).

**Nhiều kết quả là tự đánh giá.** Giấc ngủ, mức đau, mức căng thẳng thường được đo bằng cảm nhận của chính người tham gia. Kỳ vọng rằng một phương pháp sẽ giúp ích có thể tự nó mang lại cảm giác tốt hơn — đó là [[Giả dược|hiệu ứng giả dược]]. Vì vậy nghiên cứu cần nhóm đối chứng dùng thiết bị giả, và một nghiên cứu không có nhóm đối chứng không tách được tác dụng của việc nối đất khỏi tác dụng của kỳ vọng.

**Xung đột lợi ích.** Ba tác giả có mặt trong nhiều nghiên cứu và bài tổng quan về earthing — Gaétan Chevalier, James Oschman và Stephen Sinatra — khai rằng họ làm việc theo hợp đồng cho Earth FX, công ty tài trợ nghiên cứu earthing, và sở hữu cổ phần trong công ty này. Nghiên cứu về hồng cầu nói trên ghi rõ được Earth FX tài trợ. Điều đó không tự động làm kết quả sai, nhưng là lý do để chờ những nghiên cứu độc lập, lớn hơn.

**Phần lớn thí nghiệm không phải là đi chân trần.** Các nghiên cứu nói trên dùng tấm lót, ga giường hoặc miếng dán dẫn điện nối dây xuống đất. Chính bài tổng quan năm 2012 của nhóm ủng hộ earthing mô tả các nghiên cứu này là phương pháp thử trong nhà "mô phỏng" việc đi chân trần ngoài trời. Vì vậy, kể cả các kết quả trên cũng không trực tiếp cho biết điều gì xảy ra khi bạn đi chân trần trên cỏ.

Về cơ chế, nhóm ủng hộ đưa ra giả thuyết rằng electron từ mặt đất đi vào cơ thể và trung hoà các gốc tự do, qua đó giảm viêm. Chính bài tổng quan của họ trình bày điều này như một giả định, không phải điều đã đo được.

Tính đến tháng 10/2026, grounding không phải là phương pháp điều trị hay phòng bệnh đã được chứng minh, và không nên dùng để thay cho việc khám và điều trị.`;

const D3 = `## Vì sao nhiều người thấy dễ chịu khi đi chân trần ngoài trời?

Cảm giác dễ chịu là có thật, nhưng chưa có cơ sở để quy nó cho dòng điện. Đi chân trần ngoài trời thường đi kèm những yếu tố khác, mỗi yếu tố có bằng chứng riêng:

- **Ở giữa thiên nhiên.** Trong một khảo sát đại diện toàn quốc với 19.806 người tham gia, những người dành từ 120 phút mỗi tuần trở lên ở nơi có thiên nhiên có khả năng tự đánh giá sức khoẻ tốt và tinh thần tốt cao hơn người không ra ngoài thiên nhiên. Đây là tương quan, chưa phải nhân quả; chính nhóm tác giả cho rằng cần nghiên cứu theo dõi dài hạn và nghiên cứu can thiệp.
- **Vận động.** Hoạt động thể chất đều đặn giúp ngủ ngon hơn và giảm nguy cơ trầm cảm, lo âu.
- **Kỳ vọng.** Tin rằng một phương pháp có ích có thể tự nó mang lại cảm giác tốt hơn — hiệu ứng giả dược.`;

const D5 = `## Cơ thể có dẫn điện không?

Có. Tim và não tự tạo ra hoạt động điện; điện tâm đồ (ECG) và điện não đồ (EEG) ghi lại hoạt động ấy qua các điện cực đặt trên da. Máy ECG chỉ ghi tín hiệu, không phát điện vào người.

Khi cơ thể được nối với đất — da trần chạm đất, hoặc qua dây dẫn — điện thế của cơ thể cân bằng với điện thế của đất. Giày đế cao su hoặc nhựa cách điện, nên khi mang giày, sự tiếp xúc điện này không xảy ra.

Dòng điện chạy giữa người và đất rất nhỏ. Một nhóm kỹ sư điện ở Đại học New Hampshire (Mỹ), không có nguồn tài trợ hay xung đột lợi ích, đo dòng điện giữa người được nối đất và mặt đất: dòng chỉ cỡ nano-ampe (một phần tỉ ampe), thay đổi khi người đó cử động, và ngoài thông tin về cử động thì không chứa tín hiệu nào khác. Nghiên cứu này chỉ đo trên 3 người.`;

const D6 = `## Kết luận

Phần vật lý của grounding là có thật nhưng nhỏ: cơ thể dẫn điện, khi được nối đất thì điện thế của nó cân bằng với điện thế của đất, và dòng điện chạy qua chỉ cỡ nano-ampe. Từ đó tới lợi ích sức khoẻ là một bước chưa được chứng minh. Các nghiên cứu hiện có rất nhỏ, phần lớn dùng thiết bị nối đất trong nhà chứ không phải đi chân trần, và nhiều nghiên cứu do những tác giả có quan hệ tài chính với một công ty bán sản phẩm earthing thực hiện.

Nếu bạn thích đi chân trần ngoài trời, thời gian ở giữa thiên nhiên và vận động đều đặn là những phần có bằng chứng riêng. Người mắc đái tháo đường thì không nên đi chân trần.`;

const D7 = `## Những lưu ý an toàn

Đi chân trần ngoài trời có những rủi ro đã được biết rõ, dù grounding có lợi hay không:

- **Người mắc đái tháo đường không nên đi chân trần, kể cả trong nhà.** Bệnh có thể làm tổn thương thần kinh ở bàn chân; khi không còn cảm thấy đau, người bệnh có thể không nhận ra vết cắt, vết phồng hay vết loét. Các cơ quan y tế Mỹ (CDC, NIDDK) khuyên người đái tháo đường luôn mang giày và tất hoặc dép.
- **Giun móc.** Trứng giun móc nở trong đất nhiễm phân người, và ấu trùng có thể chui qua da. Bệnh lây chủ yếu do đi chân trần trên đất nhiễm bẩn; mang giày khi đi trên đất có thể đã nhiễm phân người.
- **Uốn ván.** Vi khuẩn uốn ván xâm nhập qua vết thương hở, nhất là vết đâm sâu như giẫm phải đinh, hoặc vết thương dính đất, phân. Tiêm phòng uốn ván đầy đủ, đúng hạn là cách phòng tốt nhất.
- Tránh những nơi có thể có mảnh kính, đinh hoặc vật sắc nhọn.`;

export const GROUNDING: Plan = {
  slug: "grounding-tiep-dia-dieu-gi-thuc-su-xay-ra-khi-di-chan-tran-tren-dat",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A6; xung đột lợi ích Earth FX, thiết bị nối đất trong nhà ≠ đi chân trần, lời khuyên đái tháo đường theo CDC/NIDDK, gỡ mục bề mặt dẫn điện, ECG; tiêu đề viết hoa kiểu câu theo B5)",
  fixes: [
    {
      field: "title",
      find: "Grounding (Tiếp Địa): Điều Gì Thực Sự Xảy Ra Khi Đi Chân Trần Trên Đất?",
      replace: "Grounding (tiếp địa): điều gì thực sự xảy ra khi đi chân trần trên đất?",
      why: "B5: viết hoa từng chữ kiểu quảng cáo → viết hoa kiểu câu, giữ 'tiếp địa' (chủ sản phẩm chốt). Slug giữ.",
    },
    {
      field: "summary",
      find: "Nhiều người cho rằng việc đi chân trần trên cỏ, đất hoặc cát có thể mang lại lợi ích cho sức khỏe. Thực hành này thường được gọi là **grounding** hoặc **earthing**, dựa trên ý tưởng rằng cơ thể thiết lập kết nối điện với bề mặt Trái Đất.\n\nTuy nhiên, bên cạnh các nguyên lý vật lý đã được xác nhận, nhiều lợi ích sức khỏe được cho là liên quan đến grounding vẫn đang được nghiên cứu và chưa có sự đồng thuận khoa học hoàn toàn.",
      replace: D1,
      why: "A3 (D1): 'chưa có sự đồng thuận khoa học hoàn toàn' gợi ý đa số đã đồng ý — lợi ích chưa được chứng minh; tóm tắt nêu thiết bị nối đất trong nhà và quan hệ tài chính của tác giả (A2).",
    },
    {
      field: "seoDescription",
      find: "Bài viết phân tích cơ sở vật lý và thực chứng y học về grounding, giúp bạn hiểu rõ bản chất cùng các lưu ý an toàn khi đi chân trần trên đất.",
      replace: "Cơ thể dẫn điện và cân bằng điện thế với mặt đất là thật; lợi ích sức khoẻ của grounding thì chưa được chứng minh. Bằng chứng và rủi ro khi đi chân trần.",
      why: "B6: 'giúp bạn hiểu rõ bản chất' hứa quá; 'thực chứng y học' không rõ nghĩa.",
    },
    {
      field: "content",
      section: "## Cơ Thể Có Dẫn Điện Không?",
      replace: D5,
      why: "B1 + B2 (D5): ECG/EEG ghi hoạt động điện, không cho dòng điện chạy qua người (NHLBI, NINDS); độ lớn dòng chỉ nano-ampe (Chamberlin 2014, độc lập, 3 người); câu đế cao su/nhựa chuyển từ mục bề mặt (A5, Chevalier 2012). Bỏ vế 'nước và ion' — không có nguồn đã đọc (F).",
    },
    {
      field: "content",
      section: "## Grounding Có Lợi Cho Sức Khỏe Không?",
      replace: D2,
      why: "A2 (D2): nghiên cứu dùng thiết bị nối đất trong nhà 'mô phỏng' đi chân trần (Chevalier 2012); mẫu 8–16 người, thí điểm, không đối chứng, tự đánh giá; xung đột lợi ích — Chevalier, Oschman, Sinatra là nhà thầu Earth FX và có cổ phần, Chevalier 2013 do Earth FX tài trợ; 'chỉ số tuần hoàn' thực là vón cụm hồng cầu trên lam kính. A3: bỏ 'chưa trở thành khuyến nghị chính thức'. B3: cơ chế gốc tự do gắn nhãn giả định. B4: mốc 10/2026.",
    },
    {
      field: "content",
      section: "## Vì Sao Nhiều Người Vẫn Cảm Thấy Thư Giãn?",
      replace: D3,
      why: "A3 + A4 (D3): 'không chỉ đến từ yếu tố điện học' mặc định yếu tố điện có góp phần; cắt 'không khí trong lành', 'giảm thiết bị điện tử' (không nguồn); thiên nhiên chỉ là tương quan (White 2019); vận động 'đều đặn' (CDC), thêm kỳ vọng / giả dược (NCCIH).",
    },
    {
      field: "content",
      section: "## Bề Mặt Nào Dẫn Điện Tốt?",
      replace: "",
      why: "A5 (D4): chín mệnh đề phân loại vật liệu không nguồn, và là hướng dẫn tối ưu một phương pháp chưa chứng minh có lợi. Câu có nguồn (đế cao su/nhựa) đã chuyển vào mục vật lý.",
    },
    {
      field: "content",
      section: "## Những Lưu Ý Về An Toàn",
      replace: D7,
      why: "A6 (D7): bài nói người đái tháo đường có biến chứng 'nên đặc biệt thận trọng' — CDC: 'Never go barefoot… even inside'; NIDDK: 'Do not walk barefoot… even when you are indoors', cho mọi người đái tháo đường. Thêm giun móc và uốn ván (CDC).",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D6,
      why: "A3 (D6): 'chưa được xác nhận chắc chắn bởi bằng chứng quy mô lớn' gợi ý bằng chứng nhỏ đã xác nhận; kết luận lặp lời khuyên đái tháo đường cho khớp CDC.",
    },
  ],
  reading: [
    ["Huyệt đạo và châm cứu: \"Khí\" của Đông y có liên hệ gì với khoa học hiện đại?", "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai"],
    ["Thiếu ngủ: Khoản nợ thế chấp bằng sức khỏe và tương lai", "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai"],
    ["Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?", "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa"],
    ["Từ electron đến dòng điện: Nguồn gốc của điện năng", "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang"],
  ],
  sources: [
    { title: "The biologic effects of grounding the human body during sleep as measured by cortisol levels and subjective reporting of sleep, pain, and stress", publisher: "Journal of Alternative and Complementary Medicine", doi: "10.1089/acm.2004.10.767", year: 2004, tier: 1 },
    { title: "Pilot study on the effect of grounding on delayed-onset muscle soreness", publisher: "Journal of Alternative and Complementary Medicine", doi: "10.1089/acm.2009.0399", year: 2010, tier: 1 },
    { title: "Earthing (grounding) the human body reduces blood viscosity — a major factor in cardiovascular disease", publisher: "Journal of Alternative and Complementary Medicine", doi: "10.1089/acm.2011.0820", year: 2013, tier: 1 },
    { title: "The effects of grounding (earthing) on bodyworkers' pain and overall quality of life: a randomized controlled trial", publisher: "Explore (NY)", doi: "10.1016/j.explore.2018.10.001", year: 2019, tier: 1 },
    { title: "Analysis of the charge exchange between the human body and ground: evaluation of \"earthing\" from an electrical perspective", publisher: "Journal of Chiropractic Medicine", doi: "10.1016/j.jcm.2014.10.001", year: 2014, tier: 1 },
    // Tổng quan tường thuật của nhóm có lợi ích tài chính — chỉ trích điều chính họ thừa nhận (C).
    { title: "Earthing: health implications of reconnecting the human body to the Earth's surface electrons", publisher: "Journal of Environmental and Public Health", doi: "10.1155/2012/291541", year: 2012, tier: 1 },
    { title: "The effects of grounding (earthing) on inflammation, the immune response, wound healing, and prevention and treatment of chronic inflammatory and autoimmune diseases", publisher: "Journal of Inflammation Research", doi: "10.2147/JIR.S69656", year: 2015, tier: 1 },
    { title: "Spending at least 120 minutes a week in nature is associated with good health and wellbeing", publisher: "Scientific Reports", doi: "10.1038/s41598-019-44097-3", year: 2019, tier: 1 },
    { title: "Diabetes and Your Feet", publisher: "CDC", url: "https://www.cdc.gov/diabetes/diabetes-complications/diabetes-and-your-feet.html", year: 2026, tier: 2 },
    { title: "Diabetes & Foot Problems", publisher: "NIDDK", url: "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/foot-problems", year: 2026, tier: 2 },
    { title: "About Soil-transmitted Helminths", publisher: "CDC", url: "https://www.cdc.gov/sth/about/index.html", year: 2026, tier: 2 },
    { title: "About Tetanus", publisher: "CDC", url: "https://www.cdc.gov/tetanus/about/index.html", year: 2026, tier: 2 },
    { title: "Heart Tests — Electrocardiogram", publisher: "NHLBI", url: "https://www.nhlbi.nih.gov/health/heart-tests", year: 2026, tier: 2 },
    { title: "Epilepsy and Seizures", publisher: "NINDS", url: "https://www.ninds.nih.gov/health-information/disorders/epilepsy-and-seizures", year: 2026, tier: 2 },
    { title: "Placebo Effect", publisher: "NCCIH", url: "https://www.nccih.nih.gov/health/placebo-effect", year: 2026, tier: 2 },
    { title: "Benefits of Physical Activity", publisher: "CDC", url: "https://www.cdc.gov/physical-activity-basics/benefits/index.html", year: 2026, tier: 2 },
  ],
  forbid: [
    "không chỉ đến từ yếu tố điện học",
    "đặc biệt thận trọng",
    "đồng thuận khoa học hoàn toàn",
    "Sàn gỗ công nghiệp",
    "Một số chỉ số tuần hoàn máu",
  ],
};
