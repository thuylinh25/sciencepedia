import type { Plan } from "../../lib/corrections";

/**
 * Phiếu: docs/content/checks/2026-10-09/bi-an-di-truyen-nhung-gi-con-trai-thua-huong-tu-me.md
 * Văn bản thay lấy nguyên văn mục D (D0–D6) bằng chương trình; "Đọc thêm" (D7) do engine thêm từ `reading`.
 * Bài GIỮ PUBLISHED (quy tắc chủ sản phẩm 2026-10-09). Bài chưa có byline duyệt → không clearReview.
 * seoTitle, seoKeywords giữ nguyên.
 */

const TITLE = "Bí ẩn di truyền: những gì con trai thừa hưởng từ mẹ";

const SUMMARY = "Con trai nhận từ mẹ một nửa số nhiễm sắc thể trong nhân tế bào, chiếc nhiễm sắc thể X duy nhất của mình và toàn bộ ADN ti thể. Phần lớn những gì nhận từ mẹ có thể đi tiếp sang con cháu qua người con trai, nhưng không phải tất cả: ADN ti thể của mẹ dừng lại ở thế hệ của anh.";

const SEO_DESCRIPTION = "Con trai nhận từ mẹ nửa số nhiễm sắc thể, chiếc X duy nhất và ADN ti thể. Phần nào truyền tiếp cho con cháu, phần nào dừng lại ở người con trai?";

const D1 = "## Mỗi người nhận một nửa số nhiễm sắc thể từ mẹ\n\nTế bào người thường có 46 nhiễm sắc thể, xếp thành 23 cặp. Trứng và tinh trùng được tạo ra qua một kiểu phân bào gọi là giảm phân, nên mỗi tế bào chỉ mang 23 nhiễm sắc thể. Khi thụ tinh:\n\n- Trứng của mẹ góp 23 nhiễm sắc thể.\n- Tinh trùng của bố góp 23 nhiễm sắc thể.\n\nVì vậy, dù là trai hay gái, mỗi đứa trẻ nhận một nửa số nhiễm sắc thể trong nhân tế bào từ mẹ và một nửa từ bố. Trong 23 cặp ấy, 22 cặp là nhiễm sắc thể thường; cặp còn lại là nhiễm sắc thể giới tính, nữ thường có XX, nam thường có XY.\n\nMột nửa số nhiễm sắc thể không có nghĩa là đúng một nửa lượng [[ADN]]. Ở con trai, phần nhận từ mẹ nhỉnh hơn một chút: nhiễm sắc thể X từ mẹ dài khoảng 155 triệu cặp bazơ, chiếm khoảng 5% tổng ADN trong tế bào, còn nhiễm sắc thể Y từ bố dài hơn 59 triệu cặp bazơ, gần 2%. Ngoài ra còn ADN ti thể, cũng chỉ đến từ mẹ.";

const D2 = "## Nhiễm sắc thể X: chiếc duy nhất, và đến từ mẹ\n\nỞ nam giới có bộ nhiễm sắc thể giới tính XY điển hình:\n\n- Nhiễm sắc thể X đến từ mẹ.\n- Nhiễm sắc thể Y đến từ bố.\n\nNhiễm sắc thể X mang nhiều gen hơn hẳn Y: X có khoảng 900 đến 1.400 [[gen]] mã hóa protein, Y chỉ khoảng 70 đến 200 gen. Nữ giới có hai chiếc X, còn con trai chỉ có một chiếc, là chiếc nhận từ mẹ.\n\nHệ quả dễ thấy nhất là các bệnh di truyền liên kết X lặn, như bệnh máu khó đông (hemophilia). Ở nam giới, chỉ một bản gen mang biến thể gây bệnh trên chiếc X duy nhất là đủ để mắc bệnh; nữ giới thường chỉ mắc khi cả hai chiếc X đều mang biến thể. Vì thế nam giới mắc các bệnh này nhiều hơn hẳn nữ giới. Người cha không truyền các tình trạng liên kết X cho con trai, vì con trai nhận từ bố chiếc Y chứ không phải chiếc X.";

const D3 = "## ADN ti thể: phần chỉ đến từ mẹ\n\nNgoài ADN trong nhân tế bào, con người còn có **ADN ti thể (mtDNA)**. Ti thể là bào quan tạo năng lượng cho tế bào và có bộ gen riêng: một phân tử ADN nhỏ, dài khoảng 16.500 cặp bazơ, mang 37 gen.\n\nKhi thụ tinh, ti thể của tinh trùng có đi vào trứng, nhưng ADN ti thể của bố bị loại bỏ và không truyền cho con. Chỉ trứng góp ti thể cho phôi, nên cả con trai và con gái đều nhận ADN ti thể từ mẹ.\n\nNăm 2018, một nhóm nghiên cứu báo cáo ba gia đình dường như nhận ADN ti thể từ cả bố lẫn mẹ. Năm 2020, một phân tích trên hơn 11.000 bộ ba bố, mẹ và con cho thấy dấu hiệu tương tự nhiều khả năng đến từ những đoạn ADN ti thể đã chèn vào nhiễm sắc thể trong nhân của người bố, và không tìm thấy bằng chứng ADN ti thể truyền từ bố ở người.";

const D4 = "## Con trai có truyền gen của mẹ cho con cháu không?\n\nCó, nhưng không phải mọi phần.\n\nKhi tạo tinh trùng, giảm phân xáo trộn gen trên các nhiễm sắc thể, nên mỗi tinh trùng mang một tổ hợp riêng của các đoạn ADN mà người con trai đã nhận từ bố và từ mẹ. Cụ thể:\n\n- **Nhiễm sắc thể thường:** người con trai truyền cho mỗi đứa con một nửa số nhiễm sắc thể thường của mình, trong đó có những đoạn nhận từ mẹ.\n- **Nhiễm sắc thể X:** nếu sinh con gái, người cha truyền cho con chiếc X duy nhất của mình, tức chiếc X anh nhận từ mẹ, bà nội của bé. Khi tạo tinh trùng, X và Y chỉ trao đổi đoạn ở hai vùng nhỏ ở hai đầu, gọi là vùng giả nhiễm sắc thể thường, nên chiếc X này đến với con gái gần như nguyên vẹn. Con trai của anh nhận chiếc Y, không nhận chiếc X này.\n- **ADN ti thể:** người con trai không truyền ADN ti thể cho con. ADN ti thể của mẹ anh dừng lại ở thế hệ của anh; chỉ chị em gái của anh truyền tiếp được.";

const D5 = "## Điều gì chỉ truyền theo dòng cha hoặc dòng mẹ?\n\nCó hai ngoại lệ:\n\n- Nhiễm sắc thể Y chỉ truyền từ cha sang con trai, trừ hai vùng giả nhiễm sắc thể thường ở hai đầu, nơi Y trao đổi đoạn với X.\n- ADN ti thể chỉ truyền từ mẹ sang con.\n\nPhần lớn bộ gen người nằm trên 22 cặp nhiễm sắc thể thường và được xáo trộn qua mỗi thế hệ. Vì thế, cho rằng con trai chỉ mang gen của bố là không đúng.";

const D6 = "## Kết luận\n\nNgười con trai nhận từ mẹ một nửa số nhiễm sắc thể trong nhân, chiếc nhiễm sắc thể X duy nhất của mình và toàn bộ ADN ti thể. Phần lớn những gì nhận từ mẹ có thể đi tiếp sang con cháu qua anh: các đoạn trên nhiễm sắc thể thường đến với mọi đứa con, chiếc X đến với các con gái. Riêng ADN ti thể của mẹ dừng lại ở thế hệ của anh.";

export const DI_TRUYEN: Plan = {
  slug: "bi-an-di-truyen-nhung-gi-con-trai-thua-huong-tu-me",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-09 (A1–A3; B1–B6: X của người cha 'có ADN từ bà nội và bà ngoại' → chiếc X nhận từ mẹ anh, X–Y chỉ trao đổi ở PAR; thêm: con trai không truyền ADN ti thể; '50/50' → nửa số nhiễm sắc thể, lượng ADN từ mẹ nhỉnh hơn; bỏ 'hoàn toàn ngược lại'; tiêu đề viết hoa kiểu câu)",
  reverifyMonths: 36,
  forbid: ["bà nội và bà ngoại", "hoàn toàn ngược lại", "không hề bị đứt đoạn", "Bài viết giải thích", "Bí Ẩn Di Truyền", "50% vật chất di truyền"],
  fixes: [
    { field: "title", find: "Bí Ẩn Di Truyền: Những Gì Con Trai Thừa Hưởng Từ Mẹ", replace: TITLE, why: "B6 (D0): viết hoa kiểu câu. Slug giữ nguyên." },
    { field: "summary", find: "Nhiều người cho rằng con trai chủ yếu mang gen của bố hoặc không thể truyền gen từ mẹ sang thế hệ sau. Tuy nhiên, di truyền học hiện đại cho thấy điều hoàn toàn ngược lại: con trai không chỉ nhận một nửa bộ gen từ mẹ mà còn sở hữu một số vật chất di truyền chỉ có thể được thừa hưởng từ mẹ.", replace: SUMMARY, why: "B5 (D0): bỏ người rơm 'nhiều người cho rằng' và 'hoàn toàn ngược lại'; nêu phần ADN ti thể dừng ở con trai (MedlinePlus)." },
    { field: "seoDescription", find: "Bài viết giải thích cơ chế di truyền từ mẹ sang con trai qua nhiễm sắc thể X, ADN ti thể và khả năng truyền lại gen cho các thế hệ sau.", replace: SEO_DESCRIPTION, why: "B6 (D0): bỏ 'Bài viết giải thích…', nêu cả phần không truyền được." },
    { field: "content", section: "## Mỗi Người Nhận Một Nửa Bộ Gen Từ Mẹ", replace: D1, why: "B1–B2 (D1): '50% vật chất di truyền' → nửa số nhiễm sắc thể; lượng ADN từ mẹ ở con trai nhỉnh hơn (X ~5%, Y ~2% — MedlinePlus); bỏ danh sách đặc điểm không nguồn; giảm phân 46 → 23 (MedlinePlus)." },
    { field: "content", section: "## Nhiễm Sắc Thể X: Dấu Ấn Đặc Biệt Từ Người Mẹ", replace: D2, why: "B3 (D2): số gen X 900–1.400, Y 70–200 (MedlinePlus); bệnh liên kết X lặn, cha không truyền tình trạng liên kết X cho con trai (MedlinePlus)." },
    { field: "content", section: "## ADN Ti Thể: Di Sản Chỉ Đến Từ Mẹ", replace: D3, why: "B4 (D3): mtDNA của bố bị loại sau thụ tinh (Sato & Sato 2013); 16.500 bp, 37 gen (MedlinePlus); tranh luận Luo 2018 / Wei 2020." },
    { field: "content", section: "## Con Trai Có Truyền Gen Của Mẹ Cho Con Cháu Không?", replace: D4, why: "A2–A3 (D4): X của người cha là chiếc nhận từ mẹ anh, X–Y chỉ trao đổi đoạn ở PAR (Mangs & Morris 2007; MedlinePlus); con trai không truyền ADN ti thể (MedlinePlus)." },
    { field: "content", section: "## Điều Gì Thực Sự Chỉ Truyền Theo Dòng Cha Hoặc Dòng Mẹ?", replace: D5, why: "B4 (D5): Y chỉ cha → con trai trừ PAR (Mangs & Morris 2007); mtDNA chỉ từ mẹ, thống nhất mức chắc chắn với D3." },
    { field: "content", section: "## Kết Luận", replace: D6, why: "A3 (D6): 'không hề bị đứt đoạn' → ADN ti thể của mẹ dừng ở thế hệ con trai." },
  ],
  reading: [
    ["CRISPR: cây kéo phân tử đến từ vi khuẩn", "crispr-cay-keo-phan-tu-den-tu-vi-khuan"],
    ["Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?", "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai"],
    ["Cái giá của sự bất tử: sống mãi có phải là lợi thế?", "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the"],
  ],
  sources: [
    { title: "Biparental Inheritance of Mitochondrial DNA in Humans", publisher: "Proceedings of the National Academy of Sciences", doi: "10.1073/pnas.1810946115", year: 2018, tier: 1 },
    { title: "Nuclear-mitochondrial DNA segments resemble paternally inherited mitochondrial DNA in humans", publisher: "Nature Communications", doi: "10.1038/s41467-020-15336-3", year: 2020, tier: 1 },
    { title: "Maternal inheritance of mitochondrial DNA by diverse mechanisms to eliminate paternal mitochondrial DNA", publisher: "Biochimica et Biophysica Acta – Molecular Cell Research", doi: "10.1016/j.bbamcr.2013.03.010", year: 2013, tier: 1 },
    { title: "The Human Pseudoautosomal Region (PAR): Origin, Function and Future", publisher: "Current Genomics", doi: "10.2174/138920207780368141", year: 2007, tier: 1 },
    { title: "The DNA sequence of the human X chromosome", publisher: "Nature", doi: "10.1038/nature03440", year: 2005, tier: 1 },
    { title: "X chromosome", publisher: "MedlinePlus Genetics, U.S. National Library of Medicine", url: "https://medlineplus.gov/genetics/chromosome/x/", year: 2026, tier: 2 },
    { title: "Y chromosome", publisher: "MedlinePlus Genetics, U.S. National Library of Medicine", url: "https://medlineplus.gov/genetics/chromosome/y/", year: 2026, tier: 2 },
    { title: "Mitochondrial DNA", publisher: "MedlinePlus Genetics, U.S. National Library of Medicine", url: "https://medlineplus.gov/genetics/chromosome/mitochondrial-dna/", year: 2026, tier: 2 },
    { title: "What are the different ways a genetic condition can be inherited?", publisher: "MedlinePlus Genetics, U.S. National Library of Medicine", url: "https://medlineplus.gov/genetics/understanding/inheritance/inheritancepatterns/", year: 2026, tier: 2 },
    { title: "How do cells divide?", publisher: "MedlinePlus Genetics, U.S. National Library of Medicine", url: "https://medlineplus.gov/genetics/understanding/howgeneswork/cellsdivide/", year: 2026, tier: 2 },
  ],
};
