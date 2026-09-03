import type { SeedArticle } from "./types";

/**
 * Nhánh "chuyển động tự quay và từ trường".
 *
 * Biên tập lại từ ghi chép Notion "Vũ trụ" (7 mục hỏi–đáp), gộp thành ba bài
 * đứng độc lập được. Bảng so sánh trong Notion vốn là ảnh chụp màn hình, ở đây
 * dựng lại bằng bảng Markdown để đọc được trên mọi khổ màn hình và tìm kiếm
 * được bằng full-text.
 */

/** Ảnh NASA/ESA public domain trên Wikimedia — xem chú thích COVERS ở seed.ts */
const nasaCover = (dir: string, file: string) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${dir}/${file}/1280px-${file}`;

const planetSpin: SeedArticle = {
  slug: "vi-sao-hanh-tinh-tu-quay",
  title: "Vì sao các hành tinh tự quay quanh trục",
  titleEn: "Why planets spin on their axes",
  summary:
    "Không có bàn tay nào búng cho hành tinh quay. Vòng quay của chúng là bản quyết toán của hàng tỉ cú va chạm lệch tâm trong đĩa tiền hành tinh — và đôi khi một cú va chạm duy nhất đủ để lật ngược tất cả.",
  summaryEn:
    "Nothing set the planets spinning by hand. Their rotation is the sum of billions of off-centre impacts in the protoplanetary disk — and sometimes one collision was enough to flip everything over.",
  coverImage: nasaCover("9/9d", "HL_Tau_protoplanetary_disk.jpg"),
  categorySlug: "he-mat-troi",
  tagSlugs: ["hanh-tinh", "thien-van", "vat-ly"],
  seoKeywords:
    "hành tinh tự quay, va chạm lệch tâm, mô-men động lượng, Sao Kim quay ngược, trục Sao Thiên Vương",
  content: `Mọi hành tinh trong Hệ Mặt Trời đều tự quay, không có ngoại lệ. Và không có lực nào bên ngoài đang duy trì chuyển động đó — trong chân không gần như không có ma sát, một vật đã quay sẽ quay mãi. Câu hỏi thật sự không phải cái gì giữ cho hành tinh quay, mà cái gì đã làm chúng quay ngay từ đầu.

Câu trả lời nằm ở giai đoạn hỗn loạn nhất trong lịch sử của chúng: đĩa tiền hành tinh.

## Va chạm lệch tâm: nguồn gốc của vòng quay

Vật chất trong đĩa tiền hành tinh không rơi thẳng tuột vào tâm của một hành tinh sơ khai. Các hạt bụi và khối đá bay đến từ mọi hướng với vận tốc lớn, và phần lớn đâm vào **lệch tâm** — trúng phần rìa chứ không trúng tâm.

Mỗi cú đâm lệch tâm hoạt động đúng như một cú búng vào mép quả cầu: nó không đẩy quả cầu đi, nó làm quả cầu xoay. Trong cơ học, đó là việc truyền **mô-men động lượng**.

Một cú búng thì không đáng kể. Nhưng quá trình ấy lặp lại hàng triệu, hàng tỉ lần suốt hàng triệu năm, từ mọi phía. Các cú va chạm ngược chiều nhau triệt tiêu một phần, nhưng không bao giờ triệt tiêu hoàn toàn — luôn còn dư một chiều quay ưu thế. Chiều quay ưu thế đó chính là vòng tự quay mà hành tinh giữ lại tới hôm nay.

Vì phần lớn vật chất trong đĩa chuyển động cùng một chiều quanh Mặt Trời, đa số hành tinh thừa hưởng chiều quay thuận: nhìn từ phía bắc hoàng đạo, chúng quay ngược chiều kim đồng hồ, cùng chiều với chuyển động trên quỹ đạo.

Hai hành tinh không theo quy luật đó.

## Khi một cú va chạm đi quá xa

**Sao Thiên Vương bị lật nhào.** Trục quay của nó nghiêng khoảng 98 độ — gần như nằm ngang so với mặt phẳng quỹ đạo. Thay vì quay như một con quay đứng, nó lăn nghiêng dọc theo quỹ đạo của mình.

Giả thuyết được chấp nhận rộng rãi: khoảng 4 tỉ năm trước, một tiền hành tinh đá–băng lớn gấp 1–2 lần Trái Đất đã đâm sượt vào vùng cực hoặc rìa bên của nó. Cú va chạm không chỉ truyền thêm mô-men động lượng mà còn bẻ gãy trục quay cũ, ép hành tinh nằm ngang ra. Vì trục bị lật quá 90 độ, nếu lấy mặt phẳng quỹ đạo làm chuẩn thì Sao Thiên Vương được xếp vào nhóm quay ngược.

**Sao Kim bị hãm rồi bị đẩy ngược lại.** Sao Kim quay ngược chiều với Trái Đất và hầu hết hành tinh khác, lại quay chậm đến kỳ lạ: một ngày trên Sao Kim (243 ngày Trái Đất) còn dài hơn một năm của chính nó (225 ngày Trái Đất).

Một giả thuyết cho rằng khi Sao Kim còn quay thuận, một thiên thể cỡ Sao Hoả đã lao vào lệch tâm theo hướng ngược với chiều quay lúc đó. Mô-men lực nghịch đủ mạnh để hãm toàn bộ vòng quay thuận về gần bằng không, phần năng lượng còn dư tiếp tục ép hành tinh xoay theo chiều ngược lại, rất chậm.

Đây không phải lời giải duy nhất. Nhiều mô hình hiện đại giải thích chiều quay của Sao Kim bằng thuỷ triều khí quyển cộng với ma sát giữa lõi và lớp phủ, tác động đều đặn qua hàng tỉ năm mà không cần cú va chạm thảm hoạ nào. Cả hai hướng vẫn đang được tranh luận.

## Hành tinh khí lấy đâu ra chỗ để va chạm?

Nếu vòng quay đến từ va chạm, thì Sao Mộc, Sao Thổ hay Sao Thiên Vương — những khối khí không có bề mặt rắn — nhận cú búng ở đâu?

Câu trả lời: chúng không sinh ra đã là khối khí.

**Giai đoạn lõi rắn.** Theo mô hình bồi tụ lõi, hành tinh khí bắt đầu bằng việc tích tụ đá, bụi và băng thành một lõi rắn nặng cỡ 5–10 lần khối lượng Trái Đất. Chính trong giai đoạn còn là thiên thể rắn này, chúng hứng những cú va chạm định hình trục quay và tốc độ quay. Chỉ sau khi lõi đủ nặng, lực hấp dẫn của nó mới hút lượng khí khổng lồ từ đĩa để bọc quanh, tạo thành hành tinh khí như ta thấy hôm nay.

**Va chạm kiểu thuỷ động học.** Với những cú đâm xảy ra muộn hơn, va chạm không còn giống hai hòn đá đập vào nhau mà giống một thiên thạch lao xuống đại dương. Càng vào sâu, áp suất càng khủng khiếp, hydro và heli chuyển sang trạng thái lỏng đậm đặc, thậm chí hydro kim loại lỏng. Thiên thể lao vào theo hướng lệch tâm bị lực cản và áp suất động hấp thụ toàn bộ động năng, chuyển hoá thành chuyển động cuộn xoáy của cả khối khí — đúng như khuấy mạnh một chiếc thìa vào bát nước.

> Vòng quay của một hành tinh không phải thứ được ban cho. Nó là bản quyết toán của mọi va chạm mà hành tinh đó từng chịu.`,
  sources: [
    {
      title: "Planetary Fact Sheet",
      url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
      publisher: "NASA NSSDC",
      year: 2024,
    },
    {
      title: "Consequences of Giant Impacts on Early Uranus",
      url: "https://doi.org/10.3847/1538-4357/aad0f0",
      publisher: "The Astrophysical Journal",
      year: 2018,
    },
    {
      title: "Long-term evolution of the spin of Venus",
      url: "https://doi.org/10.1038/35107009",
      publisher: "Nature",
      year: 2001,
    },
  ],
};

const jupiterSpin: SeedArticle = {
  slug: "sao-moc-quay-nhanh-nhat",
  title: "Sao Mộc: hành tinh quay nhanh nhất và chiếc phanh vô hình",
  titleEn: "Jupiter: the fastest-spinning planet and its invisible brake",
  summary:
    "Rộng gấp 11 lần Trái Đất nhưng chỉ mất 9 giờ 55 phút để quay hết một vòng. Vì sao Sao Mộc quay nhanh đến vậy — và cơ chế nào đã ghìm nó lại.",
  summaryEn:
    "Eleven times wider than Earth, yet it turns once every 9 hours 55 minutes. Why Jupiter spins so fast — and what slowed it down.",
  coverImage: nasaCover(
    "b/b0",
    "PIA21641-Jupiter-SouthernStorms-JunoCam-20170525.jpg",
  ),
  categorySlug: "he-mat-troi",
  tagSlugs: ["hanh-tinh", "thien-van", "vat-ly", "nasa"],
  seoKeywords:
    "Sao Mộc tự quay, bảo toàn mô-men động lượng, bồi tụ thảm khốc, phanh từ tính, magnetic braking",
  content: `Sao Mộc rộng gấp hơn 11 lần Trái Đất và nặng gấp 318 lần, vậy mà chỉ cần **9 giờ 55 phút** để hoàn thành một vòng tự quay. Tại xích đạo, lớp mây của nó chạy với vận tốc khoảng 45.000 km/h — gần 28 lần Trái Đất. Không hành tinh nào trong Hệ Mặt Trời quay nhanh hơn.

Ba nguyên nhân cộng lại tạo ra con số đó.

## Bảo toàn mô-men động lượng

Sao Mộc hình thành sớm nhất và đã vét phần lớn khí bụi còn lại trong đĩa Mặt Trời, tích tụ khối lượng lớn hơn tất cả các hành tinh còn lại cộng lại tới 2,5 lần. Vật chất rơi vào từ một vùng đĩa rất rộng, mang theo mô-men động lượng của cả vùng đó.

Khi khối vật chất ấy co lại thành một quả cầu nhỏ hơn nhiều lần, mô-men động lượng phải được bảo toàn, nên tốc độ quay tăng vọt — đúng nguyên lý một vũ công trượt băng thu tay vào sát người để xoay nhanh hơn.

## Bồi tụ thảm khốc

Khi lõi rắn ban đầu vượt qua một ngưỡng khối lượng, nó kích hoạt giai đoạn **bồi tụ thảm khốc**: hydro và heli quanh nó không rơi vào từ tốn nữa mà sụp xuống rất nhanh, mang theo động năng khổng lồ. Các dòng khí này cuộn xoáy và đập vào hành tinh theo hướng lệch tâm, liên tục bơm thêm mô-men động lượng suốt giai đoạn ấy.

## Không có bề mặt rắn để hãm

Trái Đất đang quay chậm dần. Thuỷ triều do Mặt Trăng gây ra kéo lê trên đáy đại dương và lớp vỏ rắn, mỗi thế kỷ làm ngày dài thêm khoảng 1,7 mili giây.

Sao Mộc không có cơ chế đó. Nó không có bề mặt rắn, không có đại dương nước đè lên đáy đá, và không vệ tinh nào đủ lớn so với nó để tạo hãm thuỷ triều đáng kể. Các lớp chất lưu cứ cuộn xoáy trong chân không mà gần như không mất năng lượng quay.

Hệ quả thì nhìn thấy được ngay trên ảnh chụp: quay nhanh tới mức lực ly tâm làm Sao Mộc phình ra ở xích đạo và dẹt ở hai cực. Bán kính xích đạo lớn hơn bán kính cực khoảng 4.600 km — độ dẹt gần 7%.

## Chiếc phanh vô hình

Nếu quá trình bồi tụ chỉ bơm mô-men động lượng vào mà không có gì lấy ra, tốc độ quay sẽ tăng cho tới khi lực ly tâm ở xích đạo vượt lực hấp dẫn và hành tinh không còn giữ nổi chính nó. Cơ chế được cho là đã ghìm bớt vòng quay ấy gọi là **phanh từ tính** — cùng cơ chế giới thiên văn dùng để giải thích vì sao các ngôi sao trẻ không quay nhanh vô hạn.

Nó hoạt động qua ba bước.

**Khí bị ion hoá.** Trong giai đoạn bồi tụ, hydro và heli lao vào với vận tốc và nhiệt độ rất cao. Nhiệt độ đó đủ để ion hoá chúng thành **plasma** — trạng thái vật chất gồm ion và electron tự do, tức là dẫn điện.

**Từ trường bám lấy plasma.** Dòng hydro kim loại lỏng chuyển động sâu bên trong Sao Mộc sinh ra một từ trường khổng lồ, mạnh nhất trong các hành tinh của Hệ Mặt Trời. Các đường sức từ vươn rộng ra không gian, và vì plasma dẫn điện không thể cắt ngang đường sức một cách tự do, chúng bám vào đĩa khí bao quanh như những nan hoa vô hình.

**Mô-men động lượng bị kéo ra ngoài.** Đường sức từ quay theo hành tinh, còn plasma ở xa quay chậm hơn. Độ lệch vận tốc đó bẻ cong đường sức và sinh ra lực ghì ngược chiều quay: dòng plasma mang điện di chuyển xuyên qua từ trường sinh ra dòng điện cảm ứng, và dòng điện cảm ứng lại sinh ra lực chống lại chính chuyển động đã tạo ra nó. Kết quả là mô-men động lượng được truyền từ hành tinh ra đĩa khí bên ngoài, đẩy khí ra xa và làm hành tinh quay chậm lại — hệt như thả một đĩa nam châm đang xoay vào chậu chất lỏng dẫn điện.

> Cần nói rõ: diễn biến chi tiết của quá trình này ở Sao Mộc vẫn là mô hình lý thuyết, dựng lại từ những gì quan sát được ở các sao trẻ và đĩa bồi tụ. Không ai chứng kiến giai đoạn đó, và các con số cụ thể còn đang được tranh luận.`,
  sources: [
    {
      title: "Jupiter Fact Sheet",
      url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
      publisher: "NASA NSSDC",
      year: 2024,
    },
    {
      title: "Juno Mission",
      url: "https://science.nasa.gov/mission/juno/",
      publisher: "NASA",
      year: 2024,
    },
    {
      title:
        "Formation of the Giant Planets by Concurrent Accretion of Solids and Gas",
      url: "https://doi.org/10.1006/icar.1996.0190",
      publisher: "Icarus",
      year: 1996,
    },
  ],
};

const magnetismVsGravity: SeedArticle = {
  slug: "tu-truong-va-luc-hap-dan",
  title: "Từ trường và lực hấp dẫn: hai lực vô hình, hai cơ chế khác nhau",
  titleEn: "Magnetism and gravity: two invisible forces, two mechanisms",
  summary:
    "Cùng tác động từ xa, cùng lan truyền bằng trường, cùng yếu đi theo khoảng cách. Nhưng một lực sinh ra từ khối lượng, còn lực kia chỉ xuất hiện khi điện tích chuyển động — và khác biệt đó quyết định số phận khí quyển của cả một hành tinh.",
  summaryEn:
    "Both act at a distance, both propagate as fields, both weaken with range. But one arises from mass and the other only from moving charge — and that difference decides whether a planet keeps its atmosphere.",
  coverImage: nasaCover("f/f3", "Magnetosphere_rendition.jpg"),
  categorySlug: "he-mat-troi",
  tagSlugs: ["vat-ly", "thien-van", "hanh-tinh"],
  seoKeywords:
    "từ trường, lực hấp dẫn, từ quyển, dynamo, gió Mặt Trời, khí quyển Sao Hoả",
  content: `Lực hấp dẫn và từ trường dễ bị gộp chung vì cả hai đều vô hình và đều tác động từ xa. Nhưng chúng sinh ra từ hai nguồn hoàn toàn khác nhau, và hệ quả của khác biệt đó lớn hơn nhiều người tưởng.

## Giống nhau ở đâu

- **Đều tác động từ xa.** Không cần tiếp xúc vật lý giữa hai vật thể.
- **Đều lan truyền dưới dạng trường.** Trường hấp dẫn và từ trường đều lấp đầy không gian quanh nguồn, và nhiễu loạn của chúng lan đi với vận tốc không vượt quá vận tốc ánh sáng.
- **Đều suy giảm theo khoảng cách.** Càng xa nguồn, cường độ càng nhỏ.

## Khác nhau ở đâu

| | Lực hấp dẫn | Từ trường |
|---|---|---|
| Nguồn sinh ra | Khối lượng và năng lượng | Điện tích **đang chuyển động** |
| Điều kiện xuất hiện | Chỉ cần có khối lượng | Phải có dòng điện, hoặc spin xếp trật tự |
| Chiều tác dụng | Chỉ hút | Vừa hút vừa đẩy, tuỳ cực |
| Cường độ tương đối | Yếu nhất trong bốn lực cơ bản | Áp đảo hấp dẫn ở quy mô hạt |
| Che chắn được không | Không | Có, bằng vật liệu từ tính |
| Suy giảm theo khoảng cách | Tỉ lệ nghịch với bình phương khoảng cách | Nhanh hơn — với lưỡng cực là luỹ thừa ba |

Khác biệt cốt lõi nằm ở dòng đầu tiên. Một hòn đá, dù đứng yên hay chuyển động, nóng hay lạnh, chỉ cần có khối lượng là tự động sinh ra lực hấp dẫn. Ngược lại, một khối kim loại lỏng dù lớn đến đâu, nếu các điện tích bên trong không chuyển động thành dòng, sẽ không sinh ra từ trường nào cả.

Đó là lý do Trái Đất và Sao Mộc có từ trường mạnh: lõi chất lưu dẫn điện của chúng vẫn đang chuyển động không ngừng, duy trì một máy phát tự nhiên gọi là **dynamo**. Và cũng là lý do Sao Hoả gần như mất sạch từ trường toàn cầu — lõi của nó đã nguội đi, dynamo tắt từ hơn 4 tỉ năm trước, trong khi lực hấp dẫn của nó thì không mất đi đâu cả.

## Vì sao Sao Hoả mất khí quyển còn Trái Đất thì không

Đây là chỗ khác biệt giữa hai lực trở nên rất cụ thể.

Giữ khí quyển lại quanh một hành tinh là việc của lực hấp dẫn. Nhưng gió Mặt Trời — dòng hạt tích điện phóng ra từ Mặt Trời với vận tốc 400–800 km/s — không cướp khí quyển bằng cách thắng lực hấp dẫn. Nó bào mòn khí quyển bằng cách truyền động lượng cho từng phân tử ở lớp trên cùng, đẩy chúng vượt vận tốc thoát từng chút một.

Từ trường Trái Đất đứng chắn trước dòng hạt đó. Vì gió Mặt Trời gồm các hạt mang điện, từ trường bẻ cong quỹ đạo của chúng và làm chúng chảy vòng qua hai bên, tạo thành một khoang gọi là **từ quyển**. Phần lớn dòng hạt bị dẫn đi vòng quanh hành tinh thay vì đâm thẳng vào khí quyển; phần lọt vào theo đường sức ở hai cực thì tạo ra cực quang.

Sao Hoả không còn lá chắn đó. Tàu MAVEN của NASA đo được rằng hành tinh này vẫn đang mất khí quyển vào không gian ngay lúc này, và tốc độ mất tăng vọt mỗi khi có bão Mặt Trời. Áp suất bề mặt của Sao Hoả hiện chưa tới 1% của Trái Đất.

> Lực hấp dẫn giữ khí quyển lại. Từ trường giữ cho gió Mặt Trời không cướp nó đi. Mất một trong hai là đủ để một hành tinh khô cạn.`,
  sources: [
    {
      title: "MAVEN Mission",
      url: "https://science.nasa.gov/mission/maven/",
      publisher: "NASA",
      year: 2024,
    },
    {
      title: "Earth Fact Sheet",
      url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
      publisher: "NASA NSSDC",
      year: 2024,
    },
  ],
};

export const spinArticles: SeedArticle[] = [
  planetSpin,
  jupiterSpin,
  magnetismVsGravity,
];
