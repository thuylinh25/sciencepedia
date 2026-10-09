import type { Plan } from "./types";

const FENCE = "```";

// Văn bản thay: nguyên văn mục D của docs/content/checks/2026-10-08/cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the.md
const D1 = `Nếu sống lâu là có lợi, vì sao phần lớn sinh vật vẫn già đi, và vì sao một số ít loài dường như không già? Sinh học tiến hoá giải thích lão hoá bằng việc sức mạnh của chọn lọc tự nhiên giảm dần theo tuổi, chứ không phải vì cái chết giúp loài tiến hoá nhanh hơn. Bài viết đi qua lời giải thích ấy, qua trường hợp sứa *Turritopsis dohrnii* và thuỷ tức *Hydra*, và qua vai trò của đa dạng di truyền đối với sức chống chịu của quần thể.`;

const D2 = `Trong thần thoại và khoa học viễn tưởng, bất tử thường được coi là trạng thái hoàn hảo. Sinh học đặt câu hỏi theo hướng khác: nếu sống lâu và khoẻ mạnh là có lợi, vì sao chọn lọc tự nhiên không loại bỏ lão hoá? Để trả lời, cần tách hai chuyện ở hai cấp khác nhau: một **cá thể** sống được bao lâu, và một **quần thể** biến đổi và thích nghi ra sao qua các thế hệ.`;

const D3 = `## Vì sao sinh vật già đi: câu trả lời của tiến hoá

Lời giải thích chủ lưu bắt đầu từ một nhận xét của nhà sinh học Peter Medawar. Ngay cả khi không già, sinh vật vẫn đối mặt với những rủi ro không tránh được của môi trường, nên càng về sau, phần sinh sản còn ở phía trước càng nhỏ. Vì vậy sức mạnh của chọn lọc tự nhiên giảm dần theo tuổi sau khi trưởng thành. Từ nguyên lý này có ba ý tưởng bổ sung cho nhau:

- **Tích luỹ đột biến:** đột biến có hại chỉ biểu hiện ở tuổi già bị chọn lọc loại bỏ rất yếu, nên có thể tích tụ lại qua nhiều thế hệ.
- **Đa hiệu đối kháng** (George Williams, 1957): một gen có lợi lúc trẻ nhưng có hại về sau vẫn có thể được chọn lọc giữ lại.
- **Cơ thể dùng một lần** (*disposable soma*, Thomas Kirkwood, 1977): nguồn lực của sinh vật có hạn, phải chia giữa sinh sản và việc bảo trì, sửa chữa cơ thể. Kirkwood cho rằng lão hoá có thể là hệ quả của cách "tiết kiệm" ấy: cơ thể không được bảo trì đủ để tồn tại mãi.

Một ý tưởng khác cho rằng già và chết là một "chương trình" có lợi cho loài, dọn chỗ cho thế hệ mới mang biến dị mới để loài thích nghi nhanh hơn. Ý tưởng này được August Weismann nêu từ cuối thế kỷ 19. Theo một tổng quan năm 2016 của Axel Kowald và Thomas Kirkwood, nó nay được chấp nhận rộng rãi là sai: nó dựa vào chọn lọc ở cấp nhóm, vốn thường yếu hơn nhiều so với chọn lọc ở cấp cá thể; và thế hệ mới không tự động thích nghi tốt hơn, vì phần lớn đột biến là có hại. Hai tác giả rà từng đề xuất cụ thể rằng lão hoá được "lập trình" và không thấy đề xuất nào đứng vững khi xem xét kỹ. Vẫn có những nhà nghiên cứu bảo vệ các thuyết lão hoá được lập trình, nhưng đó không phải quan điểm chủ lưu.`;

const D4 = `## Đa dạng di truyền và sức chống chịu của quần thể

Trái Đất chưa bao giờ đứng yên. Oxy tự do bắt đầu tích tụ trong khí quyển khoảng 2,5 tỷ năm trước, và phải khoảng hai tỷ năm sau, lượng oxy trong biển và không khí mới gần mức ngày nay. Dữ liệu hoá thạch sinh vật biển ghi nhận bốn đợt tuyệt chủng hàng loạt nổi bật hẳn so với mức tuyệt chủng nền, vào cuối các kỷ Ordovic, Permi, Trias và Phấn Trắng, cùng một đợt nữa ở kỷ Devon.

Trước những thay đổi như vậy, đa dạng di truyền là một lợi thế của quần thể. Một phân tích gộp 34 bộ dữ liệu, công bố năm 2003, thấy mức đa dạng di truyền của quần thể tương quan thuận với độ thích nghi của quần thể; tương quan ở mức vừa, giải thích khoảng 19% khác biệt về độ thích nghi. Một phân tích năm 2004 so sánh 170 loài và phân loài đang bị đe doạ với họ hàng gần không bị đe doạ: mức dị hợp tử — một thước đo đa dạng di truyền — thấp hơn ở 77% số cặp so sánh, trung bình thấp hơn 35%. Các tác giả cho rằng điều đó đồng nghĩa với tiềm năng tiến hoá giảm và nguy cơ tuyệt chủng tăng.

Đa dạng di truyền là đặc tính của quần thể, còn già hay không già là đặc tính của cá thể. Một sinh vật không già vẫn sinh sản, và thế hệ con của nó vẫn có thể mang biến dị mới.`;

const D5 = `## Sứa "bất tử" có thực sự bất tử?

Sứa *Turritopsis dohrnii* thường được gọi là "sứa bất tử". Ở một số loài thuộc ngành Thích ty bào (sứa, thuỷ tức, san hô), cá thể có thể quay ngược giai đoạn phát triển, nhưng khả năng ấy thường mất đi khi chúng đã trưởng thành sinh dục. *T. dohrnii* thì giữ được khả năng ấy cả sau khi đã sinh sản: con sứa co lại thành một khối giống bào nang, từ đó mọc ra dây bò rồi nảy chồi thành polyp — dạng sống bám đáy, giai đoạn non trong vòng đời.

Năm 1996, một nhóm nghiên cứu mô tả hiện tượng này trên sứa *Turritopsis* khi đó được định danh là *Turritopsis nutricula*, và gọi nó là loài động vật đầu tiên được biết có thể quay về dạng non sau khi đã trưởng thành sinh dục: mọi giai đoạn của sứa, từ mới tách ra đến trưởng thành hoàn toàn, đều có thể biến đổi ngược thành tập đoàn polyp, nhờ đó thoát chết và đạt tới khả năng bất tử *tiềm năng*. Một nghiên cứu bộ gen năm 2022 mô tả *T. dohrnii* là loài động vật duy nhất được biết có thể trẻ hoá lặp đi lặp lại sau khi sinh sản, điều *gợi ý* khả năng bất tử sinh học.

Như vậy, "bất tử" ở đây chỉ có nghĩa là con sứa có thể quay ngược vòng đời thay vì đi tới cái chết vì già. Nó không có nghĩa con sứa không thể chết.`;

const D6 = `## Không già vẫn có thể là chiến lược có lợi

Lão hoá không phổ biến đều như lý thuyết từng dự đoán. Một nghiên cứu năm 2014 so sánh 46 loài — thú, các động vật có xương sống khác, động vật không xương sống, thực vật có mạch và một loài tảo lục — thấy tỉ lệ tử vong theo tuổi có thể tăng, không đổi, thậm chí giảm, ở cả loài sống lâu lẫn loài sống ngắn.

Thuỷ tức (*Hydra*) là ví dụ rõ nhất. Một nghiên cứu năm 2015 theo dõi 2.256 cá thể thuộc hai loài gần nhau trong phòng thí nghiệm, tổng cộng hơn 3,9 triệu ngày quan sát: tỉ lệ chết rất thấp và không tăng theo tuổi, khả năng sinh sản không giảm một cách có hệ thống. Các tác giả cho rằng với thuỷ tức, không già có thể là chiến lược tối ưu, vì kéo dài đời sống trưởng thành có thể làm tăng tổng số con trong đời nhiều hơn so với tăng số con mỗi ngày. Họ cũng lưu ý rằng ngoài tự nhiên, tuổi thọ kỳ vọng của thuỷ tức lại ngắn: không già không có nghĩa là không chết.

Tiến hoá không nhắm tới sống ngắn hay sống mãi. Già nhanh, già chậm hay gần như không già là kết quả của những đánh đổi giữa sinh sản và bảo trì cơ thể, trong môi trường cụ thể của từng loài.`;

const D7 = `## Kết luận

Theo cách giải thích chủ lưu của sinh học tiến hoá, phần lớn sinh vật già đi không phải vì cái chết giúp loài tiến hoá, mà vì chọn lọc tự nhiên yếu dần ở tuổi lớn và vì nguồn lực bảo trì cơ thể có hạn. Một số ít loài như thuỷ tức hay sứa *Turritopsis dohrnii* cho thấy lão hoá không phải là điều bắt buộc với mọi sinh vật. Còn khả năng thích nghi của sự sống trước một Trái Đất luôn thay đổi đến từ biến dị di truyền trong quần thể, thứ vẫn được tạo ra qua mỗi thế hệ, dù cá thể sống ngắn hay sống lâu.`;

const OLD_DIAGRAM = `${FENCE}text
Biến dị di truyền
        ↓
Chọn lọc tự nhiên
        ↓
Thích nghi
        ↓
Sinh tồn

Nếu không còn biến đổi
        ↓
Khả năng thích nghi giảm
        ↓
Dễ bị môi trường đào thải
${FENCE}`;

export const BAT_TU: Plan = {
  slug: "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A3; luận điểm Weismann 'già và chết giúp loài tiến hoá', bỏ bằng chứng Hydra và Jones 2014)",
  toDraft: true,
  fixes: [
    {
      field: "title",
      find: "Cái Giá Của Sự Bất Tử: Liệu Sống Mãi Có Thực Sự Là Lợi Thế?",
      replace: "Cái giá của sự bất tử: sống mãi có phải là lợi thế?",
      why: "B7: viết hoa kiểu câu tiếng Việt. Slug giữ.",
    },
    {
      field: "summary",
      find: "Trong thần thoại và khoa học viễn tưởng, bất tử thường được xem là trạng thái hoàn hảo giúp sinh vật thoát khỏi sự già hóa và cái chết. Tuy nhiên, dưới góc nhìn của sinh học tiến hóa, sự sống lâu dài không phải lúc nào cũng đồng nghĩa với thành công về mặt tiến hóa.\n\nĐiều giúp sự sống tồn tại hàng tỷ năm không phải là sự bất biến, mà là khả năng thích nghi với một môi trường luôn thay đổi.",
      replace: D1,
      why: "A2 (D1): tóm tắt đặt bất tử đối lập với thích nghi — đánh đồng tuổi thọ cá thể với biến dị của quần thể.",
    },
    {
      field: "seoTitle",
      find: "Góc nhìn tiến hóa về ý nghĩa của sự bất tử sinh học",
      replace: "Vì sao sinh vật già đi? Góc nhìn tiến hoá về sự bất tử sinh học",
      why: "B6 (D8).",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích tại sao sự bất tử sinh học không hẳn là lợi thế tiến hóa, khi khả năng thích nghi mới là cốt lõi giúp sinh giới tồn tại.",
      replace:
        "Vì sao chọn lọc tự nhiên không loại bỏ lão hoá, vì sao sứa Turritopsis và thuỷ tức Hydra dường như không già, và đa dạng di truyền giúp quần thể chống chịu ra sao.",
      why: "B6 (D8): mang nguyên luận điểm sai của A2.",
    },
    {
      field: "content",
      find: OLD_DIAGRAM,
      replace: D2,
      why: "A2 (D2): sơ đồ 'không còn biến đổi → bị đào thải' gieo mô hình sai.",
    },
    {
      field: "content",
      find: "## Tiến Hóa Cần Sự Thay Đổi",
      replace: "## Tiến hoá cần sự thay đổi",
      why: "B7: tiêu đề mục viết hoa kiểu câu.",
    },
    {
      field: "content",
      find: "Nhờ cơ chế này, sinh giới liên tục thay đổi để đối phó với:",
      replace: "Nhờ cơ chế này, các quần thể có thể thích nghi dần trước những thay đổi như:",
      why: "B5: văn mục đích luận ('để đối phó') — chọn lọc tự nhiên không có ý định.",
    },
    {
      field: "content",
      before: "## Sự Bất Biến Có Thể Trở Thành Điểm Yếu",
      insert: D3,
      why: "A2 (D3): thiếu giải thích chủ lưu (Medawar, Williams 1957, Kirkwood 1977); nói rõ thuyết Weismann bị coi là sai (Kowald & Kirkwood 2016).",
    },
    {
      field: "content",
      section: "## Sự Bất Biến Có Thể Trở Thành Điểm Yếu",
      replace: D4,
      why: "A2, B2, B3, B4 (D4): 'bất biến thì bị đào thải'; tuyệt chủng, oxy, đa dạng di truyền thay bằng dữ kiện có nguồn (Raup & Sepkoski 1982; Lyons 2014; Reed & Frankham 2003; Spielman 2004).",
    },
    {
      field: "content",
      section: "## Môi Trường Luôn Thay Đổi",
      replace: "",
      why: "A2, B3, B4 (D4): gộp vào mục 'Đa dạng di truyền và sức chống chịu của quần thể'.",
    },
    {
      field: "content",
      section: '## Loài Sứa "Bất Tử" Có Thực Sự Bất Tử?',
      replace: D5,
      why: "B1 (D5): 'potential immortality' bị nâng thành 'bất tử'; 'khi gặp điều kiện bất lợi' và bốn cách chết không nguồn; thiếu điểm đặc biệt — quay ngược sau khi đã trưởng thành sinh dục (Piraino 1996; Pascual-Torner 2022).",
    },
    {
      field: "content",
      section: "## Bất Tử Có Thể Không Phải Đích Đến Của Tiến Hóa",
      replace: D6,
      why: "A3, B5 (D6): lập luận từ im lặng, bỏ Hydra không lão hoá (Schaible 2015) và đa dạng quỹ đạo tử vong (Jones 2014); 'loài chọn chiến lược'.",
    },
    {
      field: "content",
      section: "## Kết Luận",
      replace: D7,
      why: "A2 (D7): kết luận lặp luận điểm 'thích nghi chứ không phải bất tử'.",
    },
  ],
  // Không đưa "Cái chết dưới góc nhìn tiến hóa…" vào đây dù cùng chủ đề: bài ấy có mục "Tiến hóa
  // chậm lại" và câu "Cái chết giúp tạo chỗ cho thế hệ mới" — đúng thuyết mà đính chính này gỡ.
  reading: [
    ["Đại tuyệt chủng Permi: cuộc khủng hoảng lớn nhất của sự sống", "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat"],
    ["Những lần đại tuyệt chủng có liên quan tới hành trình của Hệ Mặt Trời trong Ngân Hà?", "nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha"],
    ["Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?", "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa"],
  ],
  sources: [
    { title: "Can aging be programmed? A critical literature review", publisher: "Aging Cell", doi: "10.1111/acel.12510", year: 2016, tier: 1 },
    { title: "Constant mortality and fertility over age in Hydra", publisher: "PNAS", doi: "10.1073/pnas.1521002112", year: 2015, tier: 1 },
    { title: "Diversity of ageing across the tree of life", publisher: "Nature", doi: "10.1038/nature12789", year: 2014, tier: 1 },
    { title: "Reversing the life cycle: medusae transforming into polyps and cell transdifferentiation in Turritopsis nutricula", publisher: "The Biological Bulletin", doi: "10.2307/1543022", year: 1996, tier: 1 },
    { title: "Comparative genomics of mortal and immortal cnidarians unveils novel keys behind rejuvenation", publisher: "PNAS", doi: "10.1073/pnas.2118763119", year: 2022, tier: 1 },
    { title: "Correlation between fitness and genetic diversity", publisher: "Conservation Biology", doi: "10.1046/j.1523-1739.2003.01236.x", year: 2003, tier: 1 },
    { title: "Most species are not driven to extinction before genetic factors impact them", publisher: "PNAS", doi: "10.1073/pnas.0403809101", year: 2004, tier: 1 },
    { title: "Mass extinctions in the marine fossil record", publisher: "Science", doi: "10.1126/science.215.4539.1501", year: 1982, tier: 1 },
    { title: "The rise of oxygen in Earth's early ocean and atmosphere", publisher: "Nature", doi: "10.1038/nature13068", year: 2014, tier: 1 },
    { title: "Evolution of ageing", publisher: "Nature", doi: "10.1038/270301a0", year: 1977, tier: 1 },
    // Chỉ xác minh tồn tại; nội dung trong D3 lấy theo lời thuật của Kowald & Kirkwood 2016.
    { title: "Pleiotropy, natural selection, and the evolution of senescence", publisher: "Evolution", doi: "10.2307/2406060", year: 1957, tier: 1 },
    { title: "Why do we age?", publisher: "Nature", doi: "10.1038/35041682", year: 2000, tier: 1 },
  ],
};
