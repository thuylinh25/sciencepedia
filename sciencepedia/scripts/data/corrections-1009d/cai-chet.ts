import type { Plan } from "../../lib/corrections";

/**
 * Phiếu: docs/content/checks/2026-10-09/cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai.md
 * Văn bản thay lấy nguyên văn mục D (D1–D11, khối VI và EN), trừ thuật ngữ — chủ sản phẩm chốt
 * 09/10 cho cả kho: "tích lũy đột biến" (không "… muộn"), "đa hiệu đối kháng" (không "đa hiệu đối
 * nghịch"); EN giữ "mutation accumulation", "antagonistic pleiotropy". Cũng chốt: đổi tiêu đề (B1),
 * gỡ byline duyệt (bản cũ dạy thuyết Weismann — byline không đứng trên nội dung chưa ai đọc), bài
 * giữ PUBLISHED, chính tả "hóa" theo bài. Bài đã có "Đọc thêm"/"Further reading" nên thay bằng
 * fix `section` (D10); engine không tự thêm. Link text ở 4 bài trỏ vào: lien-quan.ts.
 */

const D1 = `Con người thường xem cái chết là một bi kịch, một thất bại của cơ thể hay một lỗi cần được sửa chữa. Sinh học tiến hóa nhìn cái chết vì già theo cách khác: nó không phải một sai sót ngẫu nhiên, cũng không phải một chương trình có lợi cho loài, mà là hệ quả của việc sức mạnh của chọn lọc tự nhiên giảm dần theo tuổi.

Chọn lọc tự nhiên không có mục đích. Nó chỉ giữ lại nhiều hơn những biến thể di truyền giúp sinh vật sống sót và sinh sản tốt hơn, nhất là ở tuổi còn trẻ. Đó là nền tảng của lời giải thích chủ lưu cho việc vì sao nhiều sinh vật già đi.`;

const D1_EN = `People often see death as a tragedy, a failure of the body or a fault that needs fixing. Evolutionary biology sees death from old age differently: it is neither a random mistake nor a programme that benefits the species, but a consequence of the force of natural selection weakening with age.

Natural selection has no purpose. It simply retains more of the genetic variants that help organisms survive and reproduce better, especially when young. That is the basis of the mainstream explanation of why many organisms age.`;

const D2 = `## Chọn lọc tự nhiên giữ lại điều gì?

Tiến hóa không có mục đích, cảm xúc hay đạo đức.

Chọn lọc tự nhiên, một trong những cơ chế của tiến hóa, là kết quả của một điều đơn giản: những biến thể di truyền giúp sinh vật sống sót và sinh sản hiệu quả hơn có nhiều khả năng được truyền lại hơn.

Từ góc nhìn này:

> Một [[gen]] được giữ lại qua nhiều thế hệ không phải vì nó giúp cơ thể sống vĩnh viễn, mà vì những cá thể mang nó để lại nhiều con cháu mang bản sao của nó.

Nếu một biến thể mang lại lợi thế trong độ tuổi sinh sản, nó có thể được duy trì qua nhiều thế hệ ngay cả khi gây hại ở tuổi già.`;

const D2_EN = `## What does natural selection retain?

Evolution has no purpose, emotions or morality.

Natural selection, one of the mechanisms of evolution, follows from something simple: genetic variants that help organisms survive and reproduce more effectively are more likely to be passed on.

From this point of view:

> A [[gen|gene]] persists over many generations not because it helps the body live forever, but because the individuals carrying it leave more offspring carrying copies of it.

If a variant gives an advantage during the reproductive years, it can be maintained over many generations even if it is harmful in old age.`;

const D3 = `## Vì sao cơ thể lão hóa?

Lời giải thích chủ lưu của sinh học tiến hóa cho hiện tượng [lão hóa](/articles/cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the) bắt đầu từ một nhận xét của nhà sinh học Peter Medawar: vì sinh vật luôn đối mặt với những rủi ro không tránh được của môi trường, sức mạnh của chọn lọc tự nhiên giảm dần theo tuổi. Càng về sau, phần sinh sản còn ở phía trước của một cá thể càng nhỏ, nên chọn lọc càng ít "nhìn thấy" những gì xảy ra với nó. Hai ý tưởng dưới đây xây trên nhận xét ấy; ý thứ ba ở mục sau.

### Tích lũy đột biến

Medawar để ý rằng [[đột biến]] mới liên tục xuất hiện, và đột biến có hại nhiều hơn hẳn đột biến có lợi. Ông cho rằng một đột biến có hại chỉ biểu hiện ở tuổi già sẽ bị chọn lọc tự nhiên chống lại rất yếu. Ông so sánh với bệnh Huntington: một bệnh di truyền luôn gây tử vong, nhưng thường khởi phát muộn, trong hoặc thậm chí sau những năm sinh con, nên alen gây bệnh không bị chọn lọc loại khỏi vốn gen.

Qua nhiều thế hệ, những đột biến bất lợi chỉ biểu hiện ở tuổi già có thể tích tụ lại trong bộ gen của loài. Ý tưởng này gọi là thuyết tích lũy đột biến (*mutation accumulation*).

### Đa hiệu đối kháng

Nhà sinh học George C. Williams (1957) chỉ ra một hệ quả khác: nếu một gen có lợi cho sống sót hoặc sinh sản lúc còn trẻ, khi chọn lọc tự nhiên còn mạnh, nhưng gây hại về sau, khi chọn lọc đã yếu, thì gen ấy vẫn có thể được chọn lọc giữ lại. Hiện tượng này gọi là đa hiệu đối kháng (*antagonistic pleiotropy*); "đa hiệu" nghĩa là một gen có nhiều tác động.

Kowald và Kirkwood (2016) nêu hai ví dụ khả dĩ: nồng độ testosterone cao có lợi cho sinh sản nhưng có thể làm tăng nguy cơ ung thư tuyến tiền liệt về sau; việc tắt enzyme telomerase có thể giúp chống ung thư nhưng cũng dẫn tới lão hóa tế bào. Một tổng quan năm 2018 cho biết mỗi khi những đánh đổi kiểu này được nghiên cứu nghiêm túc, người ta đều tìm thấy chúng, dù không phải đánh đổi nào cũng là giữa sinh sản và tuổi thọ.

Lão hóa cũng không chỉ xảy ra với vật nuôi hay với con người được bảo vệ khỏi hiểm nguy: hàng chục nghiên cứu thực địa đã ghi nhận lão hóa ở động vật hoang dã.`;

const D3_EN = `## Why does the body age?

The mainstream evolutionary explanation of ageing starts from an observation by the biologist Peter Medawar: because organisms always face unavoidable environmental risks, the force of natural selection declines with age. The later in life, the smaller the share of an individual's reproduction still ahead of it, so the less selection "sees" what happens to it then. The two ideas below build on that observation; the third is in the next section.

### Mutation accumulation

Medawar noted that new [[dot-bien|mutations]] arise constantly, and harmful ones far outnumber beneficial ones. He argued that a harmful mutation that shows its effects only in old age is opposed only very weakly by natural selection. He compared it with Huntington's disease: an inherited disease that is always fatal but usually strikes late, during or even after the child-bearing years, so the allele responsible is not purged from the gene pool.

Over many generations, unfavourable mutations that act only in old age can build up in a species' genome. This idea is called the mutation accumulation theory.

### Antagonistic pleiotropy

The biologist George C. Williams (1957) pointed out another consequence: if a gene benefits survival or reproduction early in life, when natural selection is strong, but is harmful later, when selection has weakened, the gene can still be favoured by selection. This is called antagonistic pleiotropy; "pleiotropy" means that one gene has several effects.

Kowald and Kirkwood (2016) give two possible examples: high testosterone levels benefit reproduction but might raise the risk of prostate cancer later in life; switching off the enzyme telomerase might protect against cancer but also leads to cellular senescence. A 2018 review reports that whenever trade-offs of this kind have been seriously investigated, they have been found, although not every trade-off is between reproduction and lifespan.

Nor does ageing happen only in pets or in humans shielded from danger: dozens of field studies have recorded ageing in wild animals.`;

const D4 = `## Ngân sách có hạn: thuyết cơ thể dùng một lần

Một chiếc xe cần bảo dưỡng liên tục để hoạt động lâu dài. Cơ thể sống cũng vậy: sửa chữa tổn thương ở protein, tế bào và cơ quan đều tốn năng lượng.

Thuyết cơ thể dùng một lần (*disposable soma*), do Thomas Kirkwood đề xuất năm 1977, xem đây là một bài toán phân bổ. Năng lượng của sinh vật có hạn, phải chia giữa:

- Sinh trưởng.
- Sinh sản.
- Bảo trì, sửa chữa cơ thể.

Sinh vật dành phần lớn hơn cho bảo trì sẽ già chậm hơn, nhưng còn ít nguồn lực hơn cho sinh trưởng và sinh sản, và ngược lại. Các mô hình toán học của thuyết này cho thấy mức đầu tư vào bảo trì đem lại độ thích nghi cao nhất luôn thấp hơn mức cần để ngăn lão hóa.

Không ai "chọn" mức đầu tư ấy. Theo các mô hình này, những biến thể di truyền được chọn lọc giữ lại là những biến thể để lại nhiều con cháu hơn, và đó là những biến thể không bảo trì cơ thể đủ để tồn tại mãi.

Dù vậy, lão hóa không phổ biến đều như lý thuyết từng dự đoán. Một nghiên cứu năm 2014 so sánh 46 loài, từ thú, các động vật có xương sống khác, động vật không xương sống, thực vật có mạch đến một loài tảo lục, thấy tỉ lệ tử vong theo tuổi có thể tăng, không đổi, thậm chí giảm, ở cả loài sống lâu lẫn loài sống ngắn.`;

const D4_EN = `## A limited budget: the disposable soma theory

A car needs constant maintenance to keep running for a long time. So does a living body: repairing damage to proteins, cells and organs all costs energy.

The disposable soma theory, proposed by Thomas Kirkwood in 1977, treats this as an allocation problem. An organism's energy is limited and has to be divided between:

- Growth.
- Reproduction.
- Maintenance and repair of the body.

An organism that puts a larger share into maintenance ages more slowly, but has fewer resources left for growth and reproduction, and vice versa. Mathematical models of the theory show that the level of investment in maintenance that maximises fitness is always below the level needed to prevent ageing.

Nobody "chooses" that level. According to these models, the genetic variants retained by selection are those that leave more offspring, and those are variants that do not maintain the body well enough to last forever.

Even so, ageing is not as universal as theory once predicted. A 2014 study comparing 46 species, from mammals, other vertebrates, invertebrates and vascular plants to a green alga, found that mortality with age can rise, stay constant or even fall, in long-lived and short-lived species alike.`;

const D5 = `## Cái chết vì già có giúp loài tiến hóa?

Một ý tưởng rất phổ biến cho rằng già và chết là một "chương trình" có lợi cho loài: thế hệ già nhường chỗ cho thế hệ sau, tránh cho môi trường sống bị quá tải; và các thế hệ thay nhau nhanh hơn thì loài tiến hóa nhanh hơn, nhờ những thế hệ mới mang tổ hợp gen mới. Ý tưởng này được August Weismann nêu từ năm 1891.

Theo một tổng quan năm 2016 của Axel Kowald và Thomas Kirkwood, ý tưởng ấy nay được chấp nhận rộng rãi là sai:

- Nó dựa vào chọn lọc ở cấp nhóm, vốn thường yếu hơn nhiều so với chọn lọc ở cấp cá thể.
- Nó lập luận vòng quanh: giả định sẵn rằng cá thể già, kể cả khi không lão hóa, là cá thể đã suy yếu.
- Thế hệ mới không tự động thích nghi tốt hơn, vì phần lớn đột biến là có hại.

Hai tác giả rà từng đề xuất cụ thể rằng lão hóa được "lập trình" và không thấy đề xuất nào đứng vững khi xem xét kỹ. Vẫn có những nhà nghiên cứu công bố các thuyết lão hóa được lập trình, nhưng đó không phải quan điểm chủ lưu.

Cũng cần tách hai câu hỏi: "nếu không ai chết" và "nếu không ai già". Một sinh vật không lão hóa vẫn có thể chết vì những rủi ro của môi trường, và chính những rủi ro ấy là điểm xuất phát của lập luận Medawar. Thủy tức (*Hydra*) là ví dụ: một nghiên cứu năm 2015 theo dõi 2.256 cá thể, tổng cộng hơn 3,9 triệu ngày quan sát trong phòng thí nghiệm, thấy tỉ lệ chết rất thấp và không tăng theo tuổi, khả năng sinh sản không giảm một cách có hệ thống. Vậy mà ngoài tự nhiên, tuổi thọ kỳ vọng của thủy tức lại ngắn. Không già không có nghĩa là không chết.`;

const D5_EN = `## Does death from old age help a species evolve?

A very popular idea holds that ageing and death are a "programme" that benefits the species: the old generation makes way for the next, preventing the environment from becoming overcrowded; and a faster turnover of generations makes the species evolve faster, because new generations carry new combinations of genes. The idea was put forward by August Weismann in 1891.

According to a 2016 review by Axel Kowald and Thomas Kirkwood, this idea is now generally accepted to be wrong:

- It relies on selection at the level of the group, which is normally much weaker than selection at the level of the individual.
- It is circular: it assumes that old individuals, even if they do not age, are already worn out.
- A new generation is not automatically better adapted, because most mutations are harmful.

The two authors examined specific proposals that ageing is "programmed" one by one and found that none withstands close scrutiny. Some researchers still publish theories of programmed ageing, but that is not the mainstream view.

It also helps to separate two questions: "what if nobody died?" and "what if nobody aged?". An organism that does not age can still die from environmental risks, and those very risks are the starting point of Medawar's argument. *Hydra* is an example: a 2015 study followed 2,256 individuals for a total of more than 3.9 million days of observation in the laboratory and found that the death rate was very low and did not rise with age, while fertility did not decline systematically. Yet in the wild, the life expectancy of *Hydra* is short. Not ageing does not mean not dying.`;

const D6 = `## Không có loài nào là "điểm đến cuối cùng"

Con người thường tự xem mình là đỉnh cao của tiến hóa.

Nhưng tiến hóa không có đích đến.

Tuyệt chủng là chuyện thường trong lịch sử sự sống. Theo nhà cổ sinh vật học David Raup (1994), số loài đã tuyệt chủng gần bằng số loài từng xuất hiện; sự đa dạng sinh học ngày nay chỉ là phần dư rất nhỏ của số loài mới hình thành so với số loài mất đi, tích lũy qua hàng triệu năm.

Khủng long là ví dụ quen thuộc. Theo hóa thạch, mọi loài khủng long không phải chim và bò sát bay biến mất đột ngột vào cuối kỷ Phấn Trắng. Một tổng quan năm 2010 trình bày các bằng chứng ủng hộ giả thuyết rằng [một tiểu hành tinh va vào vùng Chicxulub](/articles/su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian), Mexico ngày nay, đã gây ra đợt tuyệt chủng ấy.

Từ góc nhìn sinh học, loài người cũng không được bảo đảm vị trí đặc biệt nào trong tương lai xa.

Chúng ta chỉ là một nhánh trong cây tiến hóa rộng lớn của sự sống.`;

const D6_EN = `## No species is the "final destination"

Humans often regard themselves as the pinnacle of evolution.

But evolution has no destination.

Extinction is commonplace in the history of life. According to the palaeontologist David Raup (1994), the number of species that have gone extinct is almost the same as the number that have ever appeared; today's biodiversity is only a trivial surplus of new species over lost ones, accumulated over millions of years.

Dinosaurs are the familiar example. According to the fossil record, all non-avian dinosaurs and flying reptiles disappeared abruptly at the end of the Cretaceous. A 2010 review presents the evidence supporting the hypothesis that [an asteroid impact at Chicxulub](/articles/su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian), in present-day Mexico, triggered that extinction.

From a biological point of view, humans are not guaranteed any special place in the distant future either.

We are just one branch on life's vast evolutionary tree.`;

const D7 = `## Điều khiến con người khác biệt

Điều thú vị là con người không chỉ là sản phẩm của tiến hóa.

Con người còn có khả năng suy ngẫm về tiến hóa.

Chúng ta biết rằng:

- Mình sẽ già đi.
- Mình sẽ chết.
- Cuộc đời là hữu hạn.

Nhận thức ấy có thể gây lo âu, nhưng nó không phải tất cả những gì con người có. Nghệ thuật, triết học, khoa học, văn học, tình yêu và sự đồng cảm góp phần tạo nên ý nghĩa của cuộc sống con người.`;

const D7_EN = `## What makes humans different

Interestingly, humans are not just a product of evolution.

Humans are also able to reflect on evolution.

We know that:

- We will grow old.
- We will die.
- Life is finite.

This awareness can bring anxiety, but it is not all that humans have. Art, philosophy, science, literature, love and empathy help create the meaning of human life.`;

const D8 = `## Cái chết và ý nghĩa của sự sống

Khi một sinh vật chết đi, các nguyên tử trong cơ thể nó không biến mất. Chúng trở về môi trường, tham gia các chu trình hóa học khác và có thể trở thành một phần của những dạng sống mới.

Nhiều nguyên tử trong số đó còn có lịch sử lâu hơn cả sự sống. Các nguyên tố nặng hơn heli, như carbon, oxy hay sắt trong cơ thể chúng ta, được tạo ra trong [đời sống và cái chết của các ngôi sao](/articles/ngoi-sao-cau-tao-va-vong-doi), rồi được trả lại không gian qua những vụ nổ [[siêu tân tinh]] và lớp vỏ ngoài mà các ngôi sao đang chết thổi bay đi.

Theo nghĩa vật chất:

> Chúng ta đang mượn các nguyên tử của vũ trụ trong một khoảng thời gian ngắn.`;

const D8_EN = `## Death and the meaning of life

When an organism dies, the atoms in its body do not disappear. They return to the environment, take part in other chemical cycles and may become part of new forms of life.

Many of those atoms have a history longer than life itself. Elements heavier than helium, such as the carbon, oxygen and iron in our bodies, were made in [the lives and deaths of stars](/articles/ngoi-sao-cau-tao-va-vong-doi), then returned to space through [[sieu-tan-tinh|supernova]] explosions and the outer layers that dying stars throw off.

In a material sense:

> We are borrowing the universe's atoms for a short while.`;

const D9 = `## Kết luận

Theo cách giải thích chủ lưu của sinh học tiến hóa, cái chết vì già không phải một lỗi bất ngờ của tự nhiên, cũng không phải một chương trình có lợi cho loài. Nó là hệ quả của việc sức mạnh chọn lọc tự nhiên giảm dần theo tuổi: đột biến có hại biểu hiện muộn ít bị loại bỏ, gen có lợi lúc trẻ vẫn được giữ lại dù gây hại về sau, và nguồn lực dành cho bảo trì cơ thể có hạn.

- Chọn lọc tự nhiên giữ lại những biến thể giúp sinh vật sống sót và sinh sản, không nhắm tới sự bất tử của cá thể.
- Lão hóa không phổ biến đều ở mọi loài: một số loài như thủy tức không cho thấy dấu hiệu già đi trong các nghiên cứu dài hạn, dù vẫn chết vì những nguyên nhân khác.
- Không một loài nào được bảo đảm tồn tại mãi mãi.

Tuy nhiên, con người có một điều mà tiến hóa không thể định đoạt hoàn toàn:

> Khả năng tự tạo ra ý nghĩa cho cuộc đời mình.

Chọn lọc tự nhiên không có mục đích, nhưng con người thì có: nghệ thuật, tình bạn, tri thức, tình yêu và sự khám phá cho phép chúng ta sống vì nhiều điều lớn hơn việc truyền gen.`;

const D9_EN = `## Conclusion

In the mainstream explanation of evolutionary biology, death from old age is neither an unexpected mistake of nature nor a programme that benefits the species. It is a consequence of the force of natural selection weakening with age: harmful mutations that act late are poorly weeded out, genes that help when young are retained even if they cause harm later, and the resources available for maintaining the body are limited.

- Natural selection retains variants that help organisms survive and reproduce; it does not aim at the immortality of the individual.
- Ageing is not equally universal across species: some, such as *Hydra*, show no sign of ageing in long-term studies, although they still die from other causes.
- No species is guaranteed to exist forever.

However, humans have something that evolution cannot fully determine:

> The ability to create meaning for their own lives.

Natural selection has no purpose, but humans do: art, friendship, knowledge, love and discovery let us live for many things greater than passing on genes.`;

const D10 = `## Đọc thêm

- [Sự sống trên Trái Đất: 4 tỉ năm trong một dòng thời gian](/articles/su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian)
- [Đại tuyệt chủng Permi: cuộc khủng hoảng lớn nhất của sự sống](/articles/dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat)
- [Cái giá của sự bất tử: sống mãi có phải là lợi thế?](/articles/cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the)
- [Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?](/articles/y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa)
- [Khi tim ngừng đập: Điều gì thực sự xảy ra với cơ thể khi chúng ta chết?](/articles/khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet)`;

const D10_EN = `## Further reading

- [Life on Earth: four billion years in one timeline](/articles/su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian)
- [The Permian extinction: life's greatest crisis](/articles/dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat)
- [Consciousness: a great gift or a costly price of evolution?](/articles/y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa)
- [When the heart stops: what really happens to the body when we die?](/articles/khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet)`;

const TITLE = `Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?`;

const TITLE_EN = `Death through the lens of evolution: why don't we live forever?`;

const SEO_DESCRIPTION = `Vì sao cái chết vì già tồn tại? Sinh học tiến hóa giải thích bằng sức mạnh chọn lọc tự nhiên giảm dần theo tuổi, không phải vì cái chết có lợi cho loài.`;

const SEO_KEYWORDS = `cái chết tiến hóa, vì sao con người không sống mãi, lão hóa sinh học, chọn lọc tự nhiên, tích lũy đột biến, đa hiệu đối kháng, cơ thể dùng một lần`;

export const CAI_CHET: Plan = {
  slug: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A3; B1–B10; bỏ thuyết 'cái chết dọn chỗ cho thế hệ mới' (Weismann), bỏ văn mục đích luận ở tóm tắt/tiêu đề/kết luận, bỏ ba con số không nguồn; thuyết cơ thể dùng một lần, ngoại lệ thủy tức; bỏ emoji ở tiêu đề mục; đổi tiêu đề; thuật ngữ 'tích lũy đột biến', 'đa hiệu đối kháng'; gỡ byline duyệt)",
  clearReview: true,
  dropLinks: ["crispr-cay-keo-phan-tu-den-tu-vi-khuan"],
  forbid: [
    "Mục tiêu duy nhất",
    "tạo chỗ cho thế hệ mới",
    "Hơn 99%",
    "160 triệu năm",
    "khoảng trống cho quá trình đó",
    "tiến hóa con người",
    "Its only",
    "makes room for new generations",
    "More than 99%",
    "160 million",
    "Tích lũy đột biến muộn",
    "tích lũy đột biến muộn",
    "đa hiệu đối nghịch",
    "Đa hiệu đối nghịch",
  ],
  fixes: [
    {
      field: "title",
      find: "Cái chết dưới góc nhìn tiến hóa: Vì sao tự nhiên không thiết kế chúng ta để sống mãi?",
      replace: TITLE,
      why: "B1 (D11, chủ sản phẩm duyệt 09/10): bỏ khung 'tự nhiên thiết kế' — cùng lỗi mục đích luận với A2; viết thường sau dấu hai chấm. Slug và seoTitle giữ nguyên.",
    },
    {
      field: "titleEn",
      find: "Death through the lens of evolution: why didn't nature design us to live forever?",
      replace: TITLE_EN,
      why: "B1 (D11): đi cùng title.",
    },
    {
      field: "summary",
      find: `Con người thường xem cái chết là một bi kịch, một thất bại của cơ thể hay một lỗi cần được sửa chữa. Nhưng dưới góc nhìn của sinh học tiến hóa, cái chết không hẳn là một sai sót.

Tiến hóa không hướng tới việc tạo ra những cá thể bất tử. Mục tiêu duy nhất của nó là giúp các gen được truyền sang thế hệ tiếp theo. Vì vậy, điều quan trọng nhất đối với tiến hóa không phải là bạn sống bao lâu, mà là bạn có để lại thế hệ kế tiếp hay không.`,
      replace: D1,
      why: "A2 (D1): 'Mục tiêu duy nhất của nó', 'điều quan trọng nhất đối với tiến hóa' mâu thuẫn với câu mở thân bài 'Tiến hóa không có mục đích'; mô hình đúng: sức chọn lọc giảm theo tuổi (Kowald & Kirkwood 2016, Austad & Hoffman 2018).",
    },
    {
      field: "summaryEn",
      find: `People often see death as a tragedy, a failure of the body or a fault that needs fixing. But from the perspective of evolutionary biology, death is not exactly a mistake.

Evolution is not aimed at producing immortal individuals. Its only "goal" is to help genes pass to the next generation. So what matters most to evolution is not how long you live, but whether you leave a next generation behind.`,
      replace: D1_EN,
      why: "A2 (D1-EN): như summary.",
    },
    {
      field: "seoDescription",
      find: "Tìm hiểu lý do sinh học tiến hóa không thiết kế sinh vật sống mãi mãi mà ưu tiên duy trì và truyền gen qua các thế hệ.",
      replace: SEO_DESCRIPTION,
      why: "A2, B10 (D11): bỏ 'không thiết kế … mà ưu tiên'; góc 'cái chết vì già', không trùng câu hỏi seoTitle bài bất tử.",
    },
    {
      field: "seoKeywords",
      find: "cái chết tiến hóa, lão hóa sinh học, chọn lọc tự nhiên, tích lũy đột biến, truyền gen, tiến hóa con người",
      replace: SEO_KEYWORDS,
      why: "B10 (D11): bỏ 'truyền gen' (mục đích luận) và 'tiến hóa con người' (không khớp nội dung); thêm thuật ngữ của bản mới theo cách gọi chủ sản phẩm chốt ('đa hiệu đối kháng').",
    },
    {
      field: "content",
      section: "## 🧬 Tiến hóa thực sự quan tâm điều gì?",
      replace: D2,
      why: "A2, B8 (D2): tiêu đề mục 'Tiến hóa … quan tâm' là văn mục đích luận; câu mô tả chọn lọc tự nhiên bị gán cho tiến hóa nói chung, blockquote mơ hồ chủ thể (gen hay cơ thể). B2: bỏ emoji ở tiêu đề.",
    },
    {
      field: "contentEn",
      section: "## 🧬 What does evolution actually care about?",
      replace: D2_EN,
      why: "D2-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## ⏳ Vì sao cơ thể lão hóa?",
      replace: D3,
      why: "B3, B5 (D3): ví dụ ung thư do tăng trưởng tế bào không nguồn → hai ví dụ có rào của Kowald & Kirkwood 2016; 'nhiều cá thể không sống đủ lâu' dễ đọc thành 'ngoài tự nhiên không có lão hóa' — trái Kowald 2016, Austad & Hoffman 2018. Giữ link [lão hóa] tới bài bất tử (B9). Thuật ngữ chủ sản phẩm chốt cho cả kho 09/10: 'tích lũy đột biến', 'đa hiệu đối kháng'.",
    },
    {
      field: "contentEn",
      section: "## ⏳ Why does the body age?",
      replace: D3_EN,
      why: "D3-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 🧓 Cơ thể không được thiết kế để tồn tại mãi mãi",
      replace: D4,
      why: "A2, B4 (D4): 'không được thiết kế', 'tự nhiên cân đối ngân sách', 'ưu tiên' là văn mục đích luận — mức bảo trì thấp hơn mức ngăn lão hóa là kết quả mô hình (Kowald & Kirkwood 2016, Kirkwood 1977); 'hầu hết sinh vật đa bào' vượt nguồn — thêm Jones 2014 (46 loài).",
    },
    {
      field: "contentEn",
      section: "## 🧓 The body was not designed to last forever",
      replace: D4_EN,
      why: "D4-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 🌱 Nếu không có cái chết thì điều gì xảy ra?",
      replace: D5,
      why: "A1 (D5): ba tiểu mục dạy lại thuyết Weismann/Skulachev (lão hóa có lợi cho loài) mà Kowald & Kirkwood 2016 nói 'now generally accepted to be wrong', và mâu thuẫn với mục Medawar–Williams của chính bài; tách 'không ai chết' khỏi 'không ai già' bằng thủy tức (Schaible 2015).",
    },
    {
      field: "contentEn",
      section: "## 🌱 What would happen without death?",
      replace: D5_EN,
      why: "D5-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 🦖 Không có loài nào là \"điểm đến cuối cùng\"",
      replace: D6,
      why: "A3 (D6): bỏ ba con số không nguồn ('hơn 4 tỷ năm', 'hơn 99%', 'hơn 160 triệu năm'), thay bằng câu định tính có nguồn (Raup 1994, Schulte 2010). B9: link giữa câu Chicxulub → bài dòng thời gian sự sống.",
    },
    {
      field: "contentEn",
      section: "## 🦖 No species is the \"final destination\"",
      replace: D6_EN,
      why: "D6-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 🧠 Điều khiến con người khác biệt",
      replace: D7,
      why: "B7 (D7): bỏ hai khẳng định không nguồn ('không trực tiếp phục vụ việc truyền gen'; nhận thức về cái chết 'tạo ra' tình yêu — nhân quả tự thêm). Giữ phần suy ngẫm.",
    },
    {
      field: "contentEn",
      section: "## 🧠 What makes humans different",
      replace: D7_EN,
      why: "D7-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 🌌 Cái chết và ý nghĩa của sự sống",
      replace: D8,
      why: "B6 (D8): 'các nguyên tử tạo nên cơ thể từng thuộc về các ngôi sao' sai với hydro — chỉ nguyên tố nặng hơn heli sinh ra trong sao (Johnson 2019); bỏ 'đất đá nguyên thủy' không nguồn. B9: link giữa câu → bài vòng đời ngôi sao.",
    },
    {
      field: "contentEn",
      section: "## 🌌 Death and the meaning of life",
      replace: D8_EN,
      why: "D8-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## 📌 Kết luận",
      replace: D9,
      why: "A1, A2 (D9): câu kết 'Cái chết giúp tạo chỗ cho thế hệ mới…' (thuyết Weismann, A1) và 'Tiến hóa ưu tiên/quan tâm…' (A2); viết lại theo khung Medawar–Williams–Kirkwood, thêm ngoại lệ thủy tức (Schaible 2015).",
    },
    {
      field: "contentEn",
      section: "## 📌 Conclusion",
      replace: D9_EN,
      why: "D9-EN: như bản VI.",
    },
    {
      field: "content",
      section: "## Đọc thêm",
      replace: D10,
      why: "B9 (D10): bỏ CRISPR (lạc chủ đề; còn 3 link vào khác — dropLinks); thêm Đại tuyệt chủng Permi, và bài bất tử ở bản VI (bài bất tử chưa có bản EN). Bài đã có mục này nên engine không tự thêm.",
    },
    {
      field: "contentEn",
      section: "## Further reading",
      replace: D10_EN,
      why: "D10-EN: như bản VI.",
    },
  ],
  // D10: năm bài PUBLISHED, tiêu đề chép từ khối D10 của phiếu. Engine dùng để kiểm PUBLISHED; bài đã
  // có mục "Đọc thêm" nên engine không chèn — fix section D10 thay cả mục.
  reading: [
    ["Sự sống trên Trái Đất: 4 tỉ năm trong một dòng thời gian", "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian"],
    ["Đại tuyệt chủng Permi: cuộc khủng hoảng lớn nhất của sự sống", "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat"],
    ["Cái giá của sự bất tử: sống mãi có phải là lợi thế?", "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the"],
    ["Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?", "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa"],
    ["Khi tim ngừng đập: Điều gì thực sự xảy ra với cơ thể khi chúng ta chết?", "khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet"],
  ],
  // Mục C: 6 nguồn thêm, bậc 1, DOI đã tra Crossref 2026-10-09. Ba nguồn cũ (Kirkwood 1977,
  // Kirkwood & Austad 2000, Austad & Hoffman 2018) đã có trong CSDL.
  sources: [
    { title: "Can aging be programmed? A critical literature review", publisher: "Aging Cell", doi: "10.1111/acel.12510", year: 2016, tier: 1 },
    { title: "Constant mortality and fertility over age in Hydra", publisher: "Proceedings of the National Academy of Sciences", doi: "10.1073/pnas.1521002112", year: 2015, tier: 1 },
    { title: "Diversity of ageing across the tree of life", publisher: "Nature", doi: "10.1038/nature12789", year: 2014, tier: 1 },
    { title: "The role of extinction in evolution", publisher: "Proceedings of the National Academy of Sciences", doi: "10.1073/pnas.91.15.6758", year: 1994, tier: 1 },
    { title: "The Chicxulub asteroid impact and mass extinction at the Cretaceous-Paleogene boundary", publisher: "Science", doi: "10.1126/science.1177265", year: 2010, tier: 1 },
    { title: "Populating the periodic table: Nucleosynthesis of the elements", publisher: "Science", doi: "10.1126/science.aau9540", year: 2019, tier: 1 },
  ],
};
