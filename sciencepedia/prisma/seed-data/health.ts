import type { SeedArticle, SeedCategory, SeedTag } from "./types";

/**
 * Nhánh SỨC KHOẺ — được dựng trước theo yêu cầu.
 *
 * Nguyên tắc biên tập cho mảng này: mọi bài đều là thông tin tham khảo,
 * không đưa ra chẩn đoán hay phác đồ điều trị, và luôn có phần dẫn nguồn.
 */

export const healthCategories: SeedCategory[] = [
  {
    slug: "suc-khoe",
    name: "Sức khoẻ",
    nameEn: "Health",
    description:
      "Cơ thể người vận hành thế nào, khoa học nói gì về giấc ngủ, dinh dưỡng, miễn dịch và vận động — trình bày dựa trên bằng chứng, không dựa trên lời đồn.",
    descriptionEn:
      "How the human body works, and what the evidence actually says about sleep, nutrition, immunity and exercise.",
    icon: "HeartPulse",
    color: "#e11d48",
    order: 2,
  },
  {
    slug: "giac-ngu",
    name: "Giấc ngủ",
    nameEn: "Sleep",
    description:
      "Các giai đoạn của giấc ngủ, nhịp sinh học và vai trò của ngủ với trí nhớ, chuyển hoá và tâm trạng.",
    descriptionEn:
      "Sleep stages, circadian rhythm, and what sleep does for memory, metabolism and mood.",
    icon: "Brain",
    color: "#6366f1",
    order: 1,
    parentSlug: "suc-khoe",
  },
  {
    slug: "dinh-duong",
    name: "Dinh dưỡng",
    nameEn: "Nutrition",
    description:
      "Thức ăn được cơ thể xử lý ra sao, hệ vi sinh đường ruột, và cách đọc bằng chứng dinh dưỡng một cách tỉnh táo.",
    descriptionEn:
      "How the body processes food, the gut microbiome, and how to read nutrition evidence sceptically.",
    icon: "Salad",
    color: "#16a34a",
    order: 2,
    parentSlug: "suc-khoe",
  },
  {
    slug: "mien-dich",
    name: "Miễn dịch",
    nameEn: "Immunity",
    description:
      "Hệ thống nhận diện và ghi nhớ mầm bệnh — nền tảng của vaccine và của phần lớn y học hiện đại.",
    descriptionEn:
      "The system that recognises and remembers pathogens - the basis of vaccines and much of modern medicine.",
    icon: "Microscope",
    color: "#0891b2",
    order: 3,
    parentSlug: "suc-khoe",
  },
];

export const healthTags: SeedTag[] = [
  { slug: "co-the-nguoi", name: "Cơ thể người", nameEn: "Human body", color: "#e11d48" },
  { slug: "nao-bo", name: "Não bộ", nameEn: "The brain", color: "#8b5cf6" },
  { slug: "vi-sinh-vat", name: "Vi sinh vật", nameEn: "Microbes", color: "#16a34a" },
  { slug: "y-hoc", name: "Y học", nameEn: "Medicine", color: "#0891b2" },
  { slug: "van-dong", name: "Vận động", nameEn: "Exercise", color: "#f97316" },
];

const DISCLAIMER = `

---

*Bài viết cung cấp thông tin khoa học mang tính tham khảo, không thay thế cho tư vấn, chẩn đoán hoặc điều trị của nhân viên y tế. Nếu bạn có vấn đề sức khoẻ cụ thể, hãy trao đổi với bác sĩ.*`;

export const healthArticles: SeedArticle[] = [
  {
    slug: "giac-ngu-sau-va-tri-nho",
    title: "Giấc ngủ sâu làm gì với trí nhớ của bạn",
    titleEn: "What deep sleep does to your memory",
    summary:
      "Trong lúc bạn ngủ, não không nghỉ. Nó phát lại, chọn lọc và chuyển những gì học được ban ngày vào lưu trữ dài hạn — đồng thời dọn dẹp chất thải chuyển hoá.",
    summaryEn:
      "Your brain does not rest while you sleep. It replays, filters and moves the day's learning into long-term storage while clearing metabolic waste.",
    categorySlug: "giac-ngu",
    tagSlugs: ["nao-bo", "co-the-nguoi", "y-hoc"],
    featured: true,
    seoKeywords: "giấc ngủ sâu, trí nhớ, sóng chậm, REM, hệ glymphatic, nhịp sinh học",
    content: `Một đêm ngủ bình thường gồm khoảng 4–6 chu kỳ, mỗi chu kỳ dài 90–110 phút và đi qua nhiều giai đoạn khác nhau.

## Các giai đoạn

| Giai đoạn | Tỉ lệ thời gian | Vai trò nổi bật |
|---|---|---|
| N1 | ~5% | Chuyển tiếp giữa thức và ngủ |
| N2 | ~45–55% | Xuất hiện thoi ngủ (sleep spindle) |
| N3 — ngủ sâu sóng chậm | ~15–25% | Củng cố trí nhớ khai báo, phục hồi thể chất |
| REM | ~20–25% | Trí nhớ quy trình, điều hoà cảm xúc, giấc mơ sống động |

Điều đáng chú ý: N3 tập trung nhiều ở nửa đầu đêm, còn REM kéo dài dần về sáng. Cắt ngắn giấc ngủ hai tiếng cuối không làm mất "một phần đều" của mọi giai đoạn — nó cắt gần như trọn phần REM.

## Củng cố trí nhớ diễn ra thế nào

Giả thuyết được ủng hộ rộng rãi nhất là **củng cố hệ thống hoá** (systems consolidation):

1. Ban ngày, hải mã ghi nhận trải nghiệm mới một cách nhanh nhưng tạm thời.
2. Trong giấc ngủ sóng chậm, hải mã "phát lại" các chuỗi hoạt động thần kinh đó với tốc độ nén.
3. Vỏ não mới dần tiếp nhận và tích hợp thông tin vào mạng lưới kiến thức sẵn có.

Các thí nghiệm ghi điện não ở động vật cho thấy chính xác cùng một chuỗi tế bào vị trí kích hoạt khi con vật chạy qua mê cung sẽ được phát lại trong lúc ngủ. Thoi ngủ ở giai đoạn N2 được cho là dấu hiệu của quá trình chuyển giao này — mật độ thoi ngủ tương quan với mức cải thiện trí nhớ sau khi ngủ.

## Dọn dẹp chất thải

Năm 2013, nhóm của Maiken Nedergaard mô tả **hệ glymphatic**: khoảng gian bào trong não giãn ra khoảng 60% khi ngủ, cho phép dịch não tuỷ chảy qua mạnh hơn và cuốn đi các sản phẩm chuyển hoá, trong đó có beta-amyloid — protein tích tụ trong bệnh Alzheimer.

Đây là một trong những lý do khiến thiếu ngủ mạn tính được xem là yếu tố nguy cơ của thoái hoá thần kinh, dù mối quan hệ nhân quả hai chiều vẫn đang được nghiên cứu.

## Ngủ bao nhiêu là đủ

Khuyến nghị của các hiệp hội giấc ngủ dành cho người trưởng thành là 7–9 giờ. Vài điểm cần lưu ý:

- **Không thể "trả nợ" hoàn toàn.** Ngủ bù cuối tuần cải thiện được cảm giác buồn ngủ nhưng không phục hồi hết suy giảm nhận thức tích luỹ.
- **Đều đặn quan trọng ngang thời lượng.** Giờ đi ngủ dao động lớn giữa các ngày làm lệch nhịp sinh học, tương tự lệch múi giờ.
- **Ánh sáng là tín hiệu mạnh nhất.** Ánh sáng xanh buổi tối ức chế melatonin và đẩy lùi thời điểm buồn ngủ.

## Điều nên làm, dựa trên bằng chứng

- Giữ giờ thức dậy cố định, kể cả cuối tuần
- Ra ngoài trời sáng trong vòng một giờ sau khi dậy
- Tránh caffeine sau buổi trưa — thời gian bán thải khoảng 5–6 giờ
- Giữ phòng ngủ tối và mát (khoảng 18–20°C)
- Nếu không ngủ được sau 20 phút, rời giường và làm việc gì đó yên tĩnh${DISCLAIMER}`,
    sources: [
      {
        title: "Sleep drives metabolite clearance from the adult brain",
        publisher: "Science",
        year: 2013,
      },
      {
        title: "About Sleep's Role in Memory",
        publisher: "Physiological Reviews",
        year: 2013,
      },
    ],
  },

  {
    slug: "he-mien-dich-nhan-dien-virus",
    title: "Hệ miễn dịch nhận diện một virus bằng cách nào",
    titleEn: "How the immune system recognises a virus",
    summary:
      "Hai tuyến phòng thủ: một tuyến phản ứng tức thì với mọi thứ lạ, một tuyến chậm hơn nhưng học được và ghi nhớ. Vaccine hoạt động nhờ tuyến thứ hai.",
    summaryEn:
      "Two lines of defence: one reacts instantly to anything foreign, the other is slower but learns and remembers. Vaccines work through the second.",
    categorySlug: "mien-dich",
    tagSlugs: ["co-the-nguoi", "vi-sinh-vat", "y-hoc"],
    featured: true,
    seoKeywords: "hệ miễn dịch, kháng thể, tế bào T, vaccine, miễn dịch bẩm sinh",
    content: `Cơ thể phải phân biệt được "của mình" với "không phải của mình" — và làm việc đó với những tác nhân chưa từng gặp. Giải pháp tiến hoá là hai hệ thống bổ sung cho nhau.

## Tuyến một: miễn dịch bẩm sinh

Phản ứng trong vài phút tới vài giờ, không cần biết trước kẻ xâm nhập là ai.

Các tế bào như đại thực bào và tế bào tua mang những **thụ thể nhận dạng khuôn mẫu** (PRR). Chúng không nhận diện từng virus cụ thể mà nhận diện các đặc trưng phân tử chung của mầm bệnh — ví dụ RNA sợi đôi, thứ hầu như chỉ xuất hiện khi virus đang nhân lên trong tế bào.

Khi PRR được kích hoạt, tế bào tiết interferon và cytokine, gây viêm cục bộ và báo động cho các tế bào lân cận chuyển sang trạng thái kháng virus.

## Tuyến hai: miễn dịch thích ứng

Chậm hơn — mất 5–10 ngày cho lần gặp đầu tiên — nhưng đặc hiệu và có trí nhớ.

**Tế bào lympho B** sản xuất kháng thể gắn vào các vùng cụ thể trên bề mặt virus (epitope), trung hoà nó hoặc đánh dấu để tế bào khác tiêu diệt.

**Tế bào lympho T** chia hai vai chính: T hỗ trợ điều phối toàn bộ phản ứng, còn T gây độc tiêu diệt các tế bào đã bị nhiễm.

### Vì sao đặc hiệu đến vậy

Mỗi tế bào B và T mang một thụ thể duy nhất, được tạo ra bằng cách tái tổ hợp ngẫu nhiên các đoạn gen (cơ chế V(D)J). Quá trình này sinh ra khoảng 10¹¹ biến thể khác nhau — đủ để, với gần như mọi phân tử lạ, tồn tại sẵn một tế bào có thụ thể khớp với nó.

Khi một tế bào bắt gặp đúng mục tiêu, nó nhân lên hàng loạt. Đây gọi là **chọn lọc dòng** (clonal selection): cơ thể không thiết kế kháng thể theo yêu cầu, nó chọn ra sẵn cái phù hợp rồi khuếch đại lên.

## Trí nhớ miễn dịch

Sau khi nhiễm trùng kết thúc, phần lớn tế bào hiệu ứng chết đi, nhưng một nhóm tế bào B và T nhớ vẫn tồn tại — có thể hàng chục năm. Lần gặp thứ hai, phản ứng diễn ra trong 1–3 ngày thay vì 5–10 ngày và mạnh hơn nhiều.

Vaccine khai thác đúng cơ chế này: đưa vào một phần mầm bệnh không gây bệnh (protein bề mặt, virus bất hoạt, hoặc mRNA mã hoá protein đó) để hệ miễn dịch tạo trí nhớ mà không phải trải qua đợt bệnh thật.

## Vì sao vẫn mắc cúm hằng năm

Virus cúm biến đổi liên tục các protein bề mặt (kháng nguyên trôi dạt). Kháng thể tạo ra năm ngoái có thể không còn khớp tốt với chủng năm nay — đó là lý do vaccine cúm được cập nhật hằng năm, khác với vaccine sởi vốn hiệu quả gần như trọn đời.${DISCLAIMER}`,
    sources: [
      {
        title: "Janeway's Immunobiology, 10th edition",
        publisher: "W. W. Norton",
        year: 2022,
      },
      {
        title: "Immune memory: understanding long-term protection",
        publisher: "Nature Reviews Immunology",
        year: 2021,
      },
    ],
  },

  {
    slug: "he-vi-sinh-duong-ruot",
    title: "Hệ vi sinh đường ruột: 100 nghìn tỉ cư dân và ảnh hưởng của chúng",
    titleEn: "The gut microbiome: 100 trillion residents and what they do",
    summary:
      "Vi khuẩn trong ruột tham gia tiêu hoá chất xơ, tổng hợp vitamin và trao đổi tín hiệu với hệ miễn dịch lẫn não. Nhưng khoảng cách giữa tương quan và nhân quả ở lĩnh vực này còn rất lớn.",
    summaryEn:
      "Gut bacteria digest fibre, make vitamins and talk to the immune system and brain. But the gap between correlation and causation here is still wide.",
    categorySlug: "dinh-duong",
    tagSlugs: ["vi-sinh-vat", "co-the-nguoi", "y-hoc"],
    seoKeywords: "hệ vi sinh đường ruột, microbiome, chất xơ, axit béo chuỗi ngắn, probiotic",
    content: `Ruột người chứa khoảng 10¹⁴ vi sinh vật, phần lớn là vi khuẩn, tập trung ở đại tràng. Tổng khối lượng chỉ khoảng 200 gram, nhưng số gene chúng mang gấp hàng trăm lần bộ gene người.

## Chúng làm gì cho chúng ta

**Tiêu hoá thứ ta không tiêu hoá được.** Enzyme người không phân giải được phần lớn chất xơ. Vi khuẩn đại tràng lên men chúng và tạo ra **axit béo chuỗi ngắn** — chủ yếu là acetate, propionate và butyrate.

Butyrate đặc biệt quan trọng: nó là nguồn năng lượng chính cho tế bào biểu mô đại tràng và có tác dụng chống viêm tại chỗ.

**Tổng hợp vitamin.** Vitamin K và một số vitamin nhóm B (B12, folate, biotin) được vi khuẩn ruột sản xuất.

**Huấn luyện hệ miễn dịch.** Khoảng 70% mô lympho của cơ thể nằm quanh đường ruột. Việc tiếp xúc liên tục với vi khuẩn cộng sinh giúp hệ miễn dịch học cách dung nạp cái vô hại và phản ứng với cái nguy hiểm.

**Cạnh tranh với mầm bệnh.** Một hệ vi sinh đa dạng chiếm chỗ và tiêu thụ dinh dưỡng, khiến vi khuẩn gây bệnh khó bám trụ.

## Trục ruột – não

Ruột có mạng lưới khoảng 500 triệu neuron riêng (hệ thần kinh ruột) và trao đổi tín hiệu với não qua dây thần kinh phế vị, qua hormone, và qua các chất chuyển hoá do vi khuẩn tạo ra.

Đây là lĩnh vực đang rất sôi động — nhưng cũng là nơi truyền thông hay đi trước bằng chứng. Phần lớn kết quả ấn tượng đến từ chuột vô trùng, và việc ngoại suy sang người vẫn còn nhiều khoảng trống. Hãy đọc mọi tuyên bố kiểu "vi khuẩn ruột gây ra bệnh X" với thái độ dè dặt: rất nhiều nghiên cứu chỉ cho thấy **tương quan**.

## Điều gì thực sự thay đổi hệ vi sinh

Bằng chứng vững nhất hiện nay:

- **Chất xơ đa dạng** làm tăng đa dạng vi sinh và sản xuất butyrate. Đa dạng loại thực vật ăn vào có vẻ quan trọng hơn tổng lượng chất xơ.
- **Thực phẩm lên men** (sữa chua, kim chi, dưa muối) làm tăng đa dạng vi sinh và giảm dấu ấn viêm trong một thử nghiệm ngẫu nhiên ở Stanford năm 2021.
- **Kháng sinh** giảm mạnh đa dạng; hệ vi sinh thường hồi phục phần lớn trong vài tuần đến vài tháng, nhưng không phải luôn hoàn toàn.

Về **men vi sinh (probiotic) dạng viên**: bằng chứng có tính chất theo từng chủng và từng chỉ định cụ thể, không phải một lợi ích chung. Một số chủng có hiệu quả rõ với tiêu chảy do kháng sinh; nhiều sản phẩm thương mại khác thì chưa.${DISCLAIMER}`,
    sources: [
      {
        title:
          "Gut-microbiota-targeted diets modulate human immune status",
        publisher: "Cell",
        year: 2021,
      },
      {
        title: "The gut microbiota - masters of host development and physiology",
        publisher: "Nature Reviews Microbiology",
        year: 2013,
      },
    ],
  },

  {
    slug: "van-dong-va-tim-mach",
    title: "Vận động thay đổi tim và mạch máu như thế nào",
    titleEn: "How exercise reshapes the heart and blood vessels",
    summary:
      "Không chỉ đốt calo. Tập luyện đều đặn làm dày thành tâm thất, tăng thể tích tống máu, cải thiện chức năng nội mô và hạ huyết áp nghỉ.",
    summaryEn:
      "It is not just about calories. Regular training thickens ventricular walls, raises stroke volume, improves endothelial function and lowers resting blood pressure.",
    categorySlug: "suc-khoe",
    tagSlugs: ["van-dong", "co-the-nguoi", "y-hoc"],
    seoKeywords: "vận động, tim mạch, VO2max, huyết áp, nội mô, tập luyện",
    content: `Tim là một cơ, và giống mọi cơ khác, nó thích nghi với tải trọng lặp lại.

## Tim thay đổi ra sao

Ở người tập bền bỉ đều đặn, tâm thất trái giãn rộng hơn và thành cơ dày lên vừa phải. Kết quả là **thể tích tống máu** — lượng máu bơm ra mỗi nhịp — tăng lên đáng kể.

Vì cơ thể cần một lưu lượng máu nhất định lúc nghỉ, tim bơm nhiều hơn mỗi nhịp thì cần ít nhịp hơn. Đó là lý do nhịp tim nghỉ của vận động viên bền bỉ thường ở mức 40–50 lần/phút, so với 60–80 ở người ít vận động.

Cần phân biệt thích nghi sinh lý này với **phì đại bệnh lý** do tăng huyết áp: hình thái, chức năng tâm trương và khả năng hồi phục khác hẳn nhau.

## Mạch máu

Lớp tế bào lót trong lòng mạch — **nội mô** — tiết ra nitric oxide làm giãn mạch. Dòng máu chảy nhanh khi vận động tạo lực trượt lên thành mạch, kích thích chính quá trình này.

Tập luyện đều đặn cải thiện chức năng nội mô, và đây được xem là một trong những cơ chế trung tâm giải thích vì sao vận động hạ được huyết áp: các phân tích tổng hợp cho thấy mức giảm khoảng 5–8 mmHg huyết áp tâm thu ở người tăng huyết áp — tương đương một số thuốc đơn trị liệu.

## VO₂max: chỉ số dự báo mạnh

VO₂max là lượng oxy tối đa cơ thể sử dụng được mỗi phút. Trong các nghiên cứu đoàn hệ lớn, đây là một trong những yếu tố dự báo tử vong do mọi nguyên nhân mạnh nhất — mạnh hơn cả hút thuốc, tăng huyết áp hay đái tháo đường trong một số phân tích.

Điều đáng mừng: mức cải thiện lớn nhất về nguy cơ nằm ở đoạn từ "hoàn toàn không vận động" lên "vận động một chút". Đi từ 0 lên 90 phút mỗi tuần đã giảm nguy cơ đáng kể; đi từ 300 lên 400 phút thì lợi ích thêm nhỏ hơn nhiều.

## Khuyến nghị hiện hành

WHO khuyến nghị người trưởng thành:

- 150–300 phút vận động cường độ vừa mỗi tuần, **hoặc** 75–150 phút cường độ cao
- Cộng thêm tập sức mạnh cho các nhóm cơ lớn từ 2 ngày/tuần trở lên
- Giảm thời gian ngồi liên tục — ngắt quãng bằng vài phút đứng dậy đi lại

Người có bệnh tim mạch, tăng huyết áp chưa kiểm soát hoặc lâu không vận động nên trao đổi với bác sĩ trước khi bắt đầu chương trình cường độ cao.${DISCLAIMER}`,
    sources: [
      {
        title: "WHO guidelines on physical activity and sedentary behaviour",
        url: "https://www.who.int/publications/i/item/9789240015128",
        publisher: "World Health Organization",
        year: 2020,
      },
      {
        title:
          "Exercise and cardiovascular health: mechanisms and clinical implications",
        publisher: "Circulation Research",
        year: 2019,
      },
    ],
  },
];
