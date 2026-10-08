import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Đính chính 3 bài lên trang qua form /admin với 0 nguồn và factCheck PENDING, theo phiếu
 * thẩm định 2026-10-08 (docs/content/checks/2026-10-08/<slug>.md):
 *
 *   - bi-an-ria-thai-duong-he-…        sơ đồ đặt sai vị trí các vùng, mật độ plasma "cao hơn
 *                                        dự đoán" (ngược số đo), "xác nhận" bỏ vế tranh luận.
 *   - khung-hoang-hien-sinh-cua-vu-tru-… "có thể lớn hơn" bị nâng thành "luôn tồn tại", cơ chế
 *                                        chân trời sai, hydro không sinh ra trong sao.
 *   - cuoc-chien-chong-lai-trong-luc-…   luận điểm "tiết kiệm năng lượng" không nguồn, sơ đồ ngược
 *                                        số đo áp lực đĩa đệm, thiếu mục "khi nào nên đi khám".
 *
 *   npm run corrections:1009              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1009 -- --write   # thực thi — NGƯỜI chạy
 *
 * Quyết định của chủ sản phẩm (2026-10-08):
 *   1. Bài ngồi thẳng lưng về DRAFT trong cùng transaction (`toDraft`), tới khi người duyệt
 *      đọc lại bản đã sửa; hai bài kia giữ PUBLISHED.
 *   2. Câu trích Carl Sagan: GIỮ, kèm xuất xứ (lời thoại phim *Cosmos*, tập 1, 1980 — không
 *      phải "từng viết") và bản dịch sát "We are a way for the cosmos to know itself".
 *   3. Bài rìa: dùng "nhật bao" cho heliopause và "Hệ Mặt Trời" thay "Thái Dương Hệ" ở MỌI
 *      trường, kể cả tiêu đề (slug giữ). Đây là thống nhất thuật ngữ, không phải đổi claim.
 *   4. Bài khủng hoảng hiện sinh đổi tiêu đề theo B1 của phiếu (slug giữ): tiêu đề hỏi
 *      chuyện "hiểu", thân bài nói về giới hạn "quan sát". Bài ngồi thẳng lưng giữ tiêu đề.
 *
 * Quy trình theo docs/content-rules.md, "Sửa bài đã publish là đính chính": mục trong
 * docs/content/corrections.md, Revision chụp bản TRƯỚC (cả title) trong CÙNG transaction với
 * lệnh sửa và lệnh thêm nguồn, lastVerifiedAt cập nhật. Ba bài chưa có bản en nên chỉ sửa vi.
 *
 * `factCheck` GIỮ NGUYÊN: sửa chuỗi không phải là qua gate — người duyệt đặt sau khi đọc bản
 * đã sửa.
 *
 * VIỆC NGƯỜI LÀM (script không đụng):
 *   - Alt ảnh bìa của cả ba bài — người xem ảnh rồi mới viết (phiếu khủng hoảng hiện sinh có
 *     đề xuất alt ở B7).
 *   - Bài ngồi thẳng lưng: ảnh bìa ghi công Science Photo Library (thư viện thương mại) — kiểm
 *     giấy phép, không có thì thay ảnh.
 *   - Câu Sagan: phiếu ghi CHƯA đối chiếu được bản gốc (tập phim hoặc sách *Cosmos*); nguồn
 *     thêm ở bậc 3, không tính vào 3 nguồn bậc 1–2 tối thiểu.
 *   - Sau --write: bài về DRAFT phải ra khỏi chỉ mục tìm kiếm — `npm run search:reindex`.
 */
const prisma = new PrismaClient();

type Field = "title" | "summary" | "content" | "seoTitle" | "seoDescription";
type Fix = { field: Field; find: string; replace: string; why: string };
type SourceIn = { title: string; publisher: string; doi?: string; url?: string | null; year: number; tier: number };
type Plan = {
  slug: string;
  note: string;
  fixes: Fix[];
  reading: readonly (readonly [string, string])[];
  sources: SourceIn[];
  /** Chuỗi không được còn ở bất kỳ trường nào sau khi sửa (thống nhất thuật ngữ). */
  forbid?: string[];
  toDraft?: boolean;
};

const FENCE = "```";

// ───────────────────────── 1. Rìa Hệ Mặt Trời ─────────────────────────

const RIA_D2 = `## Nhật quyển và nhật bao: nơi gió Mặt Trời dừng lại

Mặt Trời liên tục thổi ra dòng hạt mang điện gọi là **gió Mặt Trời**, tạo nên một vùng không gian chịu chi phối của từ trường và plasma Mặt Trời, gọi là **nhật quyển** (*heliosphere*). Mọi hành tinh đều nằm trong vùng này.

Càng ra xa, gió Mặt Trời càng bị môi trường liên sao — khí, bụi và vật chất khác giữa các ngôi sao — ép lại. Ở **sốc kết thúc** (*termination shock*), gió Mặt Trời đột ngột giảm từ tốc độ siêu âm xuống dưới tốc độ âm thanh. Voyager 1 đi qua sốc kết thúc vào tháng 12/2004 ở khoảng 94 AU, Voyager 2 vào tháng 8/2007 ở khoảng 84 AU. Xa hơn là **nhật bao** (*heliopause*), mặt ngoài của nhật quyển, nơi áp lực của môi trường liên sao chặn không cho gió Mặt Trời đi tiếp.

Voyager 1 vượt nhật bao ngày 25/8/2012, ở khoảng 122 AU (khoảng 18 tỷ km) tính từ Mặt Trời; Voyager 2 vượt qua vào tháng 11/2018. Khi Voyager 1 qua ranh giới này:

- Các hạt năng lượng có nguồn gốc Mặt Trời giảm hơn 1.000 lần, trong khi tia vũ trụ đến từ Thiên Hà tăng khoảng 9%.
- Mật độ plasma đo được khoảng 0,08 electron/cm³, so với khoảng 0,002 electron/cm³ ở vùng ngoài của nhật quyển — rất gần giá trị dự kiến cho môi trường liên sao.

Kết luận không đến ngay: số đo từ trường khi ấy vẫn cho thấy tàu còn ở trong nhật quyển. Số đo mật độ plasma từ tháng 4/2013 là bằng chứng mạnh cho thấy Voyager 1 đã ở trong plasma liên sao. Với Voyager 2, việc vượt ranh giới được xác nhận bằng cả thiết bị đo hạt lẫn thiết bị đo plasma.`;

const RIA: Plan = {
  slug: "bi-an-ria-thai-duong-he-noi-anh-huong-cua-mat-troi-dan-ket-thuc",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A4; sơ đồ, mật độ plasma, Voyager; thống nhất 'Hệ Mặt Trời' kể cả tiêu đề)",
  forbid: ["Thái Dương Hệ"],
  fixes: [
    {
      field: "title",
      find: "Bí Ẩn Rìa Thái Dương Hệ: Nơi Ảnh Hưởng Của Mặt Trời Dần Kết Thúc",
      replace: "Bí ẩn rìa Hệ Mặt Trời: nơi ảnh hưởng của Mặt Trời dần kết thúc",
      why: "Thống nhất thuật ngữ 'Hệ Mặt Trời' (chủ sản phẩm chốt); viết hoa kiểu câu tiếng Việt (B7). Slug giữ.",
    },
    {
      field: "seoTitle",
      find: "Khám phá bí ẩn rìa Thái Dương Hệ và môi trường liên sao",
      replace: "Khám phá bí ẩn rìa Hệ Mặt Trời và môi trường liên sao",
      why: "Thống nhất thuật ngữ 'Hệ Mặt Trời'.",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích cấu trúc rìa Thái Dương Hệ gồm Nhật bao, Vành đai Kuiper và Đám mây Oort nơi ảnh hưởng của Mặt Trời dần kết thúc.",
      replace:
        "Rìa Hệ Mặt Trời: Vành đai Kuiper, nhật bao nơi gió Mặt Trời dừng lại, và Đám mây Oort giả thuyết, nơi lực hấp dẫn của Mặt Trời vẫn còn giữ các thiên thể băng giá.",
      why: "B8: cùng claim với A2 — liệt kê ba vùng như cùng một loại ranh giới. Câu thay của phiếu, đổi 'Thái Dương Hệ' → 'Hệ Mặt Trời'.",
    },
    {
      field: "summary",
      find: "Cách Trái Đất hàng tỷ kilomet là vùng biên giới giữa ảnh hưởng của Mặt Trời và không gian liên sao. Đây không phải khoảng không trống rỗng mà là khu vực chứa nhiều cấu trúc quan trọng, giúp các nhà khoa học hiểu rõ hơn về nguồn gốc và giới hạn của Thái Dương Hệ.",
      replace:
        "Từ quỹ đạo Hải Vương Tinh ra tới khoảng cách hàng nghìn tỷ kilomet là vùng chuyển tiếp giữa ảnh hưởng của Mặt Trời và không gian liên sao. Ở đó có Vành đai Kuiper, nhật bao — nơi gió Mặt Trời dừng lại — và xa hơn nữa là Đám mây Oort giả thuyết, nơi lực hấp dẫn của Mặt Trời vẫn còn giữ các thiên thể băng giá.",
      why: "B1 (D6): 'hàng tỷ kilomet' sai bậc cho Đám mây Oort (5.000–100.000 AU).",
    },
    {
      field: "content",
      find: `${FENCE}text
Mặt Trời
   ↓
Các hành tinh
   ↓
Vành đai Kuiper
   ↓
Nhật quyển (Heliosphere)
   ↓
Nhật bao (Heliopause)
   ↓
Không gian liên sao
${FENCE}`,
      replace: `Đi từ Mặt Trời ra ngoài, các vùng chính lần lượt là (khoảng cách tính bằng đơn vị thiên văn, AU; 1 AU là khoảng cách Trái Đất – Mặt Trời, khoảng 150 triệu km):

1. **Các hành tinh**, tới quỹ đạo Hải Vương Tinh ở khoảng 30 AU.
2. **Vành đai Kuiper**, phần chính từ khoảng 30 đến 50 AU.
3. **Nhật bao** (*heliopause*), mặt ngoài của nhật quyển. Voyager 1 đi qua nó ở khoảng 122 AU. Các hành tinh và phần chính của Vành đai Kuiper đều nằm *bên trong* nhật quyển.
4. **Không gian liên sao.**
5. **Đám mây Oort** (giả thuyết), ước tính ở khoảng 5.000 đến 100.000 AU: nằm ngoài nhật bao, trong không gian liên sao, nhưng các thiên thể ở đó vẫn bị lực hấp dẫn của Mặt Trời giữ lại.

Vì vậy "rìa" Hệ Mặt Trời có hai nghĩa: nơi gió Mặt Trời dừng lại (nhật bao), và vùng xa nhất mà lực hấp dẫn của Mặt Trời còn giữ được thiên thể (Đám mây Oort), xa hơn nhiều.`,
      why: "A2 (D1): sơ đồ đặt nhật quyển SAU Vành đai Kuiper (phần chính 30–50 AU nằm trong nhật quyển, nhật bao ~122 AU) và bỏ Đám mây Oort.",
    },
    {
      field: "content",
      find: `## Nhật bao: Ranh giới của ảnh hưởng Mặt Trời

Mặt Trời liên tục phát ra dòng hạt mang điện gọi là **gió Mặt Trời**, tạo nên một vùng không gian được chi phối bởi từ trường và plasma của nó, gọi là **Nhật quyển** (*Heliosphere*).

Ranh giới nơi gió Mặt Trời không còn đủ mạnh để chống lại môi trường liên sao được gọi là **Nhật bao** (*Heliopause*). Đây được xem là biên giới ngoài cùng của Nhật quyển.

Hai tàu thăm dò **Voyager 1** và **Voyager 2** lần lượt vượt qua Nhật bao vào năm 2012 và 2018. Dữ liệu thu được cho thấy:

- Mật độ plasma bên ngoài Nhật bao cao hơn dự đoán trước đây.
- Lượng tia vũ trụ từ không gian liên sao tăng mạnh sau khi vượt qua ranh giới này.

Những quan sát đó xác nhận rằng các tàu đã đi vào môi trường liên sao.

## Vành đai Kuiper và giả thuyết Hành tinh Thứ Chín

Bên ngoài quỹ đạo Hải Vương Tinh là **Vành đai Kuiper**, khu vực chứa vô số thiên thể băng giá, bao gồm các hành tinh lùn như **Pluto**, **Eris** và **Haumea**.

Đây được xem là phần còn sót lại của vật chất hình thành Thái Dương Hệ cách đây khoảng 4,6 tỷ năm.`,
      replace: `## Vành đai Kuiper và giả thuyết Hành tinh Thứ Chín

Bên ngoài quỹ đạo Hải Vương Tinh là **Vành đai Kuiper**, một vùng hình đĩa dày chứa vô số thiên thể băng giá. Phần chính của vành đai trải từ khoảng 30 đến 50 AU. Chồng lên rìa ngoài của nó là **đĩa phân tán**, kéo dài tới gần 1.000 AU. Các hành tinh lùn **Pluto**, **Haumea** và **Makemake** là thiên thể Vành đai Kuiper; **Eris** là thành viên lớn nhất được biết của đĩa phân tán.

Các nhà thiên văn cho rằng thiên thể Vành đai Kuiper là phần vật chất còn sót lại từ thời hình thành Hệ Mặt Trời, khoảng 4,6 tỷ năm trước.`,
      why: "A3, A4, B5, B6: gỡ mục Nhật bao khỏi vị trí trước Vành đai Kuiper (viết lại theo D2, đặt sau mục Kuiper ở fix kế tiếp) — mật độ plasma ~0,08 cm⁻³ là ĐÚNG giá trị dự kiến (Gurnett 2013), tia vũ trụ chỉ tăng 9,3% (Krimigis 2013), 'xác nhận' bỏ vế số đo từ trường (Stone 2013). B2 (D3): khoảng cách, đĩa phân tán, Eris.",
    },
    {
      field: "content",
      find: `Một số vật thể ở vùng rìa xa của Vành đai Kuiper có quỹ đạo bất thường. Để giải thích hiện tượng này, các nhà thiên văn đã đề xuất giả thuyết về **Hành tinh Thứ Chín** (*Planet Nine*), một hành tinh lớn nằm rất xa Mặt Trời.

Nếu tồn tại, thiên thể này có thể sở hữu khối lượng lớn hơn Trái Đất nhiều lần và ảnh hưởng đến quỹ đạo của các vật thể xa xôi. Tuy nhiên, cho đến nay vẫn chưa có quan sát trực tiếp nào xác nhận sự tồn tại của nó.`,
      replace: `Một số thiên thể xa nhất trong đĩa phân tán có quỹ đạo dường như tụm lại theo cùng một hướng. Năm 2016, Konstantin Batygin và Michael Brown đề xuất rằng sự sắp hàng này có thể do một hành tinh chưa được phát hiện gây ra: khối lượng khoảng 10 lần Trái Đất trở lên, chạy trên một quỹ đạo lệch tâm rất xa Mặt Trời. Họ gọi nó là **Hành tinh Thứ Chín** (*Planet Nine*). Các ước tính về sau đưa khối lượng giả định về khoảng 5–10 lần Trái Đất.

Giả thuyết này còn tranh luận. Năm 2021, một phân tích tính đến thiên lệch chọn mẫu của ba cuộc khảo sát cho thấy 14 thiên thể mà các khảo sát ấy phát hiện phù hợp với một quần thể phân bố đều, tức không có bằng chứng về sự tụm quỹ đạo. Cho đến nay, chưa có quan sát nào phát hiện trực tiếp hành tinh này.

${RIA_D2}`,
      why: "B3 (D4): bằng chứng là sự tụm quỹ đạo, và chính nó bị chất vấn (Napier 2021). Tiếp theo là mục nhật quyển/nhật bao (D2) đặt SAU mục Kuiper theo B6.",
    },
    {
      field: "content",
      find: "## Đám mây Oort: Vùng bao bọc xa nhất của Thái Dương Hệ",
      replace: "## Đám mây Oort: Vùng bao bọc xa nhất của Hệ Mặt Trời",
      why: "Thống nhất thuật ngữ 'Hệ Mặt Trời'.",
    },
    {
      field: "content",
      find: "có dạng gần hình cầu bao quanh toàn bộ Thái Dương Hệ.",
      replace: "có dạng gần hình cầu bao quanh toàn bộ Hệ Mặt Trời.",
      why: "Thống nhất thuật ngữ 'Hệ Mặt Trời'.",
    },
    {
      field: "content",
      find: `Một số đặc điểm nổi bật:

- Có thể kéo dài tới khoảng 100.000 AU hoặc xa hơn tính từ Mặt Trời.
- Chứa số lượng rất lớn vật thể băng đá nguyên thủy.
- Là khu vực mà lực hấp dẫn của Mặt Trời trở nên rất yếu.
- Ảnh hưởng hấp dẫn từ các ngôi sao lân cận bắt đầu trở nên đáng kể.`,
      replace: `Một số đặc điểm theo các ước tính hiện nay:

- Nằm ở khoảng 5.000 đến 100.000 AU tính từ Mặt Trời, hoàn toàn bên ngoài nhật bao — có thể trải tới một phần tư hoặc nửa quãng đường tới ngôi sao gần nhất.
- Có thể chứa hàng trăm tỷ, thậm chí hàng nghìn tỷ thiên thể băng giá.
- Ở khoảng cách này, lực hấp dẫn của Mặt Trời rất yếu. Các thiên thể vẫn bị Mặt Trời giữ lại, nhưng cũng chịu tác động hấp dẫn từ Thiên Hà, trong đó mạnh nhất có lẽ là lực thủy triều của Thiên Hà.
- Thỉnh thoảng, quỹ đạo của một thiên thể bị nhiễu động và nó bắt đầu rơi về phía Mặt Trời, trở thành một sao chổi chu kỳ dài.`,
      why: "B4 (D5): NASA cho 5.000–100.000 AU ('hoặc xa hơn' không nguồn), có ước tính số lượng kèm rào, tác động mạnh nhất có lẽ là lực thủy triều Thiên Hà.",
    },
    {
      field: "content",
      find: `## Kết Luận

Rìa Thái Dương Hệ không phải là một đường biên rõ ràng mà là vùng chuyển tiếp giữa ảnh hưởng của Mặt Trời và không gian liên sao. Từ Nhật bao, Vành đai Kuiper đến Đám mây Oort, mỗi cấu trúc đều lưu giữ những manh mối quan trọng về quá trình hình thành và tiến hóa của hệ hành tinh mà chúng ta đang sinh sống.

Việc nghiên cứu những vùng xa xôi này không chỉ giúp hiểu rõ lịch sử Thái Dương Hệ mà còn hỗ trợ các sứ mệnh khám phá không gian sâu trong tương lai.`,
      replace: `## Kết luận

Rìa Hệ Mặt Trời không phải một đường biên duy nhất. Xét theo gió Mặt Trời, ranh giới là nhật bao, nơi Voyager 1 đi qua ở khoảng 122 AU. Xét theo lực hấp dẫn, Hệ Mặt Trời còn kéo dài xa hơn nhiều, tới Đám mây Oort giả thuyết. Vành đai Kuiper, nằm bên trong nhật quyển, lưu giữ vật chất còn sót lại từ thời hệ hành tinh hình thành.`,
      why: "A2 + B7 (D7): kết luận liệt kê sai thứ tự (nhật bao trước Kuiper); câu cuối chung chung không kiểm chứng được.",
    },
  ],
  reading: [
    ["Tại sao Pluto không còn là hành tinh", "tai-sao-pluto-khong-con-la-hanh-tinh"],
    ["Sao chổi: nguồn gốc, cấu tạo và số phận", "sao-choi-nguon-goc-cau-tao-va-so-phan"],
    ["Sự ra đời của Hệ Mặt Trời", "su-ra-doi-cua-he-mat-troi"],
  ],
  sources: [
    { title: "In situ observations of interstellar plasma with Voyager 1", publisher: "Science", doi: "10.1126/science.1241681", year: 2013, tier: 1 },
    { title: "Voyager 1 observes low-energy galactic cosmic rays in a region depleted of heliospheric ions", publisher: "Science", doi: "10.1126/science.1236408", year: 2013, tier: 1 },
    { title: "Search for the exit: Voyager 1 at heliosphere's border with the galaxy", publisher: "Science", doi: "10.1126/science.1235721", year: 2013, tier: 1 },
    { title: "Voyager — Interstellar Mission", publisher: "NASA Science", url: "https://science.nasa.gov/mission/voyager/interstellar-mission/", year: 2026, tier: 2 },
    { title: "Kuiper Belt: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/solar-system/kuiper-belt/facts/", year: 2026, tier: 2 },
    { title: "Oort Cloud: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/solar-system/oort-cloud/facts/", year: 2026, tier: 2 },
    { title: "Planet X / Planet Nine", publisher: "NASA Science", url: "https://science.nasa.gov/solar-system/planet-x/", year: 2026, tier: 2 },
    { title: "Evidence for a distant giant planet in the solar system", publisher: "The Astronomical Journal", doi: "10.3847/0004-6256/151/2/22", year: 2016, tier: 1 },
    { title: "No evidence for orbital clustering in the extreme trans-Neptunian objects", publisher: "The Planetary Science Journal", doi: "10.3847/PSJ/abe53e", year: 2021, tier: 1 },
  ],
};

// ─────────────── 2. Vũ trụ quan sát được (khủng hoảng hiện sinh) ───────────────

const VU_TRU: Plan = {
  slug: "khung-hoang-hien-sinh-cua-vu-tru-lieu-chung-ta-co-the-hieu-toan-bo-vu-tru",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A6; chân trời sự kiện, kích thước Vũ Trụ, hydro, trích Sagan; đổi tiêu đề theo B1)",
  fixes: [
    {
      field: "title",
      find: "Khủng Hoảng Hiện Sinh Của Vũ Trụ: Liệu Chúng Ta Có Thể Hiểu Toàn Bộ Vũ Trụ?",
      replace: "Vũ trụ quan sát được: vì sao ta không thể nhìn thấy toàn bộ Vũ Trụ",
      why: "B1 (chủ sản phẩm duyệt): tiêu đề hỏi chuyện 'hiểu', thân bài nói giới hạn 'quan sát'; 'khủng hoảng hiện sinh' là nhân cách hoá giật gân. Slug giữ.",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích về sự giãn nở của Vũ Trụ dưới tác động của năng lượng tối cùng giới hạn quan sát do tốc độ ánh sáng tạo ra.",
      replace:
        "Vì sao ta không thể nhìn thấy toàn bộ Vũ Trụ: tuổi hữu hạn, tốc độ ánh sáng và sự giãn nở đang tăng tốc giới hạn những gì con người quan sát được.",
      why: "B9: rà lại cho khớp tiêu đề mới. Phiếu không có câu nguyên văn — câu ghép từ kết luận D5, không thêm claim mới.",
    },
    {
      field: "content",
      find: `${FENCE}text
Big Bang
   ↓
Giãn nở ban đầu
   ↓
Hình thành sao và thiên hà
   ↓
Vũ trụ tiếp tục giãn nở
   ↓
Năng lượng tối chi phối
   ↓
Các vùng xa dần vượt khỏi khả năng quan sát
${FENCE}`,
      replace: `${FENCE}text
Big Bang (khoảng 13,8 tỷ năm trước)
   ↓
Vài phút đầu: hình thành hydro, heli
   ↓
Giãn nở chậm dần do hấp dẫn; sao và thiên hà hình thành
   ↓
Khoảng 9 tỷ năm sau Big Bang: giãn nở chuyển sang tăng tốc (năng lượng tối)
   ↓
Thiên hà ở xa lùi ngày càng nhanh; ánh sáng phát ra từ nay về sau ở ngoài chân trời sự kiện sẽ không bao giờ tới ta
${FENCE}`,
      why: "B5 (D4): 'Big Bang → Giãn nở ban đầu' lặp; bỏ mất pha giãn nở chậm dần trước khi tăng tốc.",
    },
    {
      field: "content",
      find: `## Năng Lượng Tối Và Sự Giãn Nở Của Vũ Trụ

Năm 1998, các nhà thiên văn phát hiện rằng Vũ Trụ không chỉ đang giãn nở mà tốc độ giãn nở còn tăng dần theo thời gian.

Nguyên nhân của hiện tượng này được cho là **năng lượng tối** (*Dark Energy*), một thành phần bí ẩn chiếm phần lớn mật độ năng lượng của Vũ Trụ. Dù chưa hiểu rõ bản chất, các quan sát cho thấy năng lượng tối đang thúc đẩy không gian mở rộng nhanh hơn.

Hệ quả là các thiên hà ở rất xa sẽ ngày càng cách xa nhau. Trong tương lai rất xa, nhiều thiên hà có thể nằm ngoài khả năng quan sát của nhau do ánh sáng từ chúng không còn đủ thời gian để đến nơi.`,
      replace: `## Năng Lượng Tối Và Sự Giãn Nở Của Vũ Trụ

Năm 1998, hai nhóm nghiên cứu độc lập — Supernova Cosmology Project do Saul Perlmutter dẫn đầu, và High-z Supernova Search Team với Brian Schmidt và Adam Riess — công bố kết quả đo các siêu tân tinh ở rất xa: Vũ Trụ không chỉ đang giãn nở mà tốc độ giãn nở còn đang tăng lên. Ba nhà khoa học này nhận giải Nobel Vật lý năm 2011.

Các nhà khoa học gọi nguyên nhân chưa rõ của sự tăng tốc ấy là **năng lượng tối** (*dark energy*). Bản chất của nó vẫn chưa được biết. Theo NASA, năng lượng tối chiếm khoảng 68–70% Vũ Trụ; phép đo của vệ tinh Planck (công bố năm 2018) cho giá trị khoảng 68,5% trong mô hình vũ trụ học chuẩn ΛCDM. Cũng theo NASA, sau giai đoạn hấp dẫn làm giãn nở chậm dần, khoảng 9 tỷ năm sau khi Vũ Trụ bắt đầu thì sự giãn nở chuyển sang nhanh dần.

Trong mô hình chuẩn, năng lượng tối không đổi theo thời gian. Kết quả công bố năm 2025 của khảo sát DESI gợi ý điều ngược lại — năng lượng tối có thể thay đổi theo thời gian — với mức ý nghĩa thống kê từ 2,8 đến 4,2σ tùy tổ hợp dữ liệu. Chính nhóm DESI lưu ý kết quả có thể do một sai số hệ thống chưa biết; câu hỏi này vẫn đang mở.

Nếu sự tăng tốc tiếp diễn như mô hình chuẩn dự đoán, các thiên hà không bị hấp dẫn giữ lại với nhóm thiên hà của chúng ta sẽ lùi xa ngày càng nhanh. Tồn tại một **chân trời sự kiện vũ trụ**: ánh sáng phát ra từ nay về sau ở những nơi xa hơn chân trời này sẽ không bao giờ tới được chúng ta. Theo tính toán của Lawrence Krauss và Robert Scherrer (2007), trong tương lai rất xa, người quan sát trong "hòn đảo" thiên hà của chúng ta sẽ không còn cách nào phát hiện sự giãn nở, năng lượng tối, bức xạ nền vi sóng vũ trụ hay nguồn gốc nguyên thủy của các nguyên tố nhẹ — những bằng chứng mà vũ trụ học ngày nay dựa vào.`,
      why: "A4 + B2 + B3 (D1): cơ chế là chân trời sự kiện do giãn nở tăng tốc, không phải 'không đủ thời gian' (Davis & Lineweaver 2004), kèm điều kiện ΛCDM (Krauss & Scherrer 2007); năng lượng tối là TÊN cho nguyên nhân chưa biết, có số liệu (NASA, Planck 2018); DESI 2025 là kết quả sơ bộ.",
    },
    {
      field: "content",
      find: `## Giới Hạn Của Vũ Trụ Quan Sát Được

Tốc độ ánh sáng là tốc độ truyền thông tin nhanh nhất mà chúng ta biết.

Vì Vũ Trụ có tuổi đời khoảng 13,8 tỷ năm, con người chỉ có thể quan sát phần không gian mà ánh sáng đã kịp truyền tới kể từ sau Big Bang. Khu vực này được gọi là **Vũ trụ quan sát được** (*Observable Universe*), với đường kính ước tính khoảng 93 tỷ năm ánh sáng.

Tuy nhiên, Vũ trụ quan sát được không nhất thiết là toàn bộ Vũ Trụ. Các mô hình vũ trụ học hiện nay cho thấy Vũ Trụ thực tế có thể lớn hơn rất nhiều, thậm chí có khả năng là vô hạn.

Điều đó đồng nghĩa với việc luôn tồn tại những vùng không gian mà ánh sáng từ đó chưa từng và có thể sẽ không bao giờ đến được với chúng ta.`,
      replace: `## Giới Hạn Của Vũ Trụ Quan Sát Được

Tốc độ ánh sáng là tốc độ truyền thông tin nhanh nhất mà chúng ta biết.

Vũ Trụ có tuổi khoảng 13,8 tỷ năm (phép đo Planck công bố năm 2018: 13,787 ± 0,020 tỷ năm), nên chúng ta chỉ nhận được ánh sáng từ những nơi mà ánh sáng đã kịp đi tới Trái Đất trong khoảng thời gian ấy. Vùng không gian chứa những nơi đó được gọi là **Vũ trụ quan sát được** (*observable universe*).

Bán kính của vùng này không phải 13,8 tỷ năm ánh sáng mà khoảng 46 tỷ năm ánh sáng — tức đường kính khoảng 93 tỷ năm ánh sáng. Lý do là không gian tiếp tục giãn nở trong lúc ánh sáng đang trên đường: những vị trí đã phát ra thứ ánh sáng cổ nhất mà ta nhận được hôm nay hiện đã cách xa chúng ta khoảng 46 tỷ năm ánh sáng.

Vũ trụ quan sát được không nhất thiết là toàn bộ Vũ Trụ. Kết hợp dữ liệu Planck với phép đo dao động âm baryon (BAO), độ cong không gian đo được là Ω_K = 0,001 ± 0,002, tức không gian gần như phẳng. Các phép đo hiện nay chỉ đặt được giới hạn dưới cho kích thước của Vũ Trụ: nó có thể lớn hơn nhiều so với phần ta quan sát được, thậm chí vô hạn, nhưng Vũ Trụ hữu hạn hay vô hạn vẫn chưa xác định được.

Nếu Vũ Trụ quả thật lớn hơn Vũ trụ quan sát được, sẽ có những vùng mà ánh sáng từ đó chưa từng tới được chúng ta — và vì sự giãn nở đang tăng tốc, một phần trong số đó có thể sẽ không bao giờ tới.`,
      why: "A2 (D2): 'có thể lớn hơn' bị nâng thành 'luôn tồn tại' — kích thước chỉ có giới hạn dưới (Vardanyan 2011). A5: 93 tỷ năm ánh sáng cần giải thích vì sao lớn hơn 2 × 13,8. B4: phép đo độ cong, không phải 'mô hình cho thấy'.",
    },
    {
      field: "content",
      find: `Các nguyên tố tạo nên cơ thể con người như carbon, oxy, canxi hay sắt đều được hình thành trong các thế hệ sao trước khi Trái Đất ra đời.

Điều này có nghĩa rằng vật chất tạo nên sự sống ngày nay bắt nguồn từ những quá trình diễn ra trong lòng các ngôi sao hàng tỷ năm trước.`,
      replace: `Phần lớn các nguyên tố tạo nên cơ thể con người, như carbon, oxy, canxi và sắt, được tạo ra trong vòng đời và cái chết của các thế hệ sao trước khi Hệ Mặt Trời hình thành: các ngôi sao tổng hợp nguyên tố nặng dần trong lõi, rồi trả chúng ra không gian khi bung các lớp vỏ ngoài hoặc khi nổ thành siêu tân tinh.

Ngoại lệ quan trọng là hydro: nó không sinh ra trong sao mà đã hình thành ngay trong vài phút đầu sau Big Bang. Vì vậy, vật chất tạo nên sự sống ngày nay mang dấu vết của cả thời kỳ sơ khai nhất của Vũ Trụ lẫn những quá trình diễn ra trong và quanh các ngôi sao hàng tỷ năm trước.`,
      why: "A3 (D3): hydro hình thành vài phút sau Big Bang (NASA), không trong sao; nguyên tố nặng được giải phóng khi sao chết (Johnson 2019).",
    },
    {
      field: "content",
      find: `Nhà thiên văn học **Carl Sagan** từng viết:

> "Chúng ta là cách để Vũ Trụ tự nhận thức chính mình."`,
      replace: `Trong tập đầu của loạt phim tài liệu *Cosmos* (1980), nhà thiên văn học **Carl Sagan** nói:

> "Chúng ta là một cách để vũ trụ tự biết về chính mình." (nguyên văn: *"We are a way for the cosmos to know itself."*)`,
      why: "A6 (chủ sản phẩm chọn giữ kèm nguồn): câu là lời thoại phim Cosmos: A Personal Voyage, tập 1 — không phải 'từng viết'; 'know itself' = tự biết về mình.",
    },
    {
      field: "content",
      find: `## Kết Luận

Vũ Trụ là một hệ thống đang liên tục tiến hóa và giãn nở. Năng lượng tối, giới hạn của tốc độ ánh sáng và khoảng cách khổng lồ giữa các thiên hà khiến việc hiểu toàn bộ Vũ Trụ trở thành một trong những thách thức lớn nhất của khoa học hiện đại.

Dù chỉ sống trên một hành tinh nhỏ bé quanh một ngôi sao bình thường, con người đã có thể lần theo dấu vết của những sự kiện xảy ra hàng tỷ năm trước. Mỗi khám phá mới không chỉ giúp chúng ta hiểu rõ hơn về Vũ Trụ, mà còn giúp trả lời câu hỏi lâu đời nhất của khoa học: Vũ Trụ đã hình thành và tiến hóa như thế nào?`,
      replace: `## Kết Luận

Vũ Trụ là một hệ đang tiến hóa và giãn nở. Tuổi hữu hạn của Vũ Trụ, giới hạn của tốc độ ánh sáng và sự giãn nở đang tăng tốc đặt ra những giới hạn cho những gì con người có thể quan sát trực tiếp — và bản chất của năng lượng tối, thứ quyết định số phận lâu dài của Vũ Trụ, vẫn chưa được biết.

Dù chỉ sống trên một hành tinh nhỏ quanh một ngôi sao bình thường, con người đã có thể lần theo dấu vết của những sự kiện xảy ra hàng tỷ năm trước, và mỗi phép đo mới giúp trả lời rõ hơn câu hỏi: Vũ Trụ đã hình thành và tiến hóa như thế nào?`,
      why: "B6 (D5): xếp hạng không nguồn ('lớn nhất', 'lâu đời nhất'); rào cản là tuổi hữu hạn + chân trời, không phải khoảng cách giữa các thiên hà.",
    },
  ],
  reading: [
    ["Big Bang: vũ trụ đã diễn ra thế nào trong 13,8 tỉ năm", "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam"],
    ["Thang khoảng cách vũ trụ: đo tới sao và thiên hà bằng cách nào", "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao"],
    ["Kính James Webb: nhìn ngược về thuở vũ trụ sơ sinh", "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh"],
  ],
  sources: [
    { title: "Observational evidence from supernovae for an accelerating universe and a cosmological constant", publisher: "The Astronomical Journal", doi: "10.1086/300499", year: 1998, tier: 1 },
    { title: "Measurements of Ω and Λ from 42 high-redshift supernovae", publisher: "The Astrophysical Journal", doi: "10.1086/307221", year: 1999, tier: 1 },
    { title: "The Nobel Prize in Physics 2011 — Press release", publisher: "Nobel Prize Outreach", url: "https://www.nobelprize.org/prizes/physics/2011/press-release/", year: 2011, tier: 2 },
    { title: "Planck 2018 results. VI. Cosmological parameters", publisher: "Astronomy & Astrophysics", doi: "10.1051/0004-6361/201833910", year: 2020, tier: 1 },
    { title: "Dark Energy", publisher: "NASA Science", url: "https://science.nasa.gov/dark-energy/", year: 2026, tier: 2 },
    { title: "Universe overview", publisher: "NASA Science", url: "https://science.nasa.gov/universe/overview/", year: 2026, tier: 2 },
    { title: "Expanding confusion: common misconceptions of cosmological horizons and the superluminal expansion of the Universe", publisher: "Publications of the Astronomical Society of Australia", doi: "10.1071/AS03040", year: 2004, tier: 1 },
    { title: "The return of a static universe and the end of cosmology", publisher: "General Relativity and Gravitation", doi: "10.1007/s10714-007-0472-9", year: 2007, tier: 1 },
    { title: "Applications of Bayesian model averaging to the curvature and size of the Universe", publisher: "Monthly Notices of the Royal Astronomical Society: Letters", doi: "10.1111/j.1745-3933.2011.01040.x", year: 2011, tier: 1 },
    { title: "Populating the periodic table: Nucleosynthesis of the elements", publisher: "Science", doi: "10.1126/science.aau9540", year: 2019, tier: 1 },
    // Tiền ấn phẩm, chưa kiểm trạng thái bình duyệt — bậc 2, chỉ làm căn cứ cho câu "kết quả sơ bộ".
    { title: "DESI DR2 Results II: Measurements of baryon acoustic oscillations and cosmological constraints (preprint)", publisher: "arXiv (DESI Collaboration)", url: "https://arxiv.org/abs/2503.14738", year: 2025, tier: 2 },
    // Xuất xứ câu trích Sagan. Phiếu không xếp bậc và chưa đối chiếu bản gốc — bậc 3, ngoài 3 nguồn bậc 1–2.
    { title: "Cosmos: A Personal Voyage — Tập 1: The Shores of the Cosmic Ocean", publisher: "KCET / PBS (Carl Sagan)", url: null, year: 1980, tier: 3 },
  ],
};

// ───────────────────────── 3. Ngồi thẳng lưng ─────────────────────────

const NGOI: Plan = {
  slug: "cuoc-chien-chong-lai-trong-luc-vi-sao-ngoi-thang-lung-lai-kho-den-the",
  note: "Trước đính chính 09/10: phiếu thẩm định 2026-10-08 (A1–A8; viết lại phần lớn thân bài). Bài chuyển về DRAFT trong cùng transaction theo quyết định chủ sản phẩm — chờ người duyệt đọc lại bản đã sửa",
  toDraft: true,
  fixes: [
    {
      field: "summary",
      find: "Nhiều người cho rằng ngồi khom lưng là do thiếu ý thức hoặc lười vận động. Thực tế, đó phần nào là kết quả của cách cơ thể con người được thiết kế để tiết kiệm năng lượng và thích nghi với lực hấp dẫn.",
      replace:
        "Ngồi khom sau một lúc ngồi thẳng thường bị coi là thiếu ý thức. Đo đạc cơ học cho thấy hai tư thế dùng cơ bắp và các mô nâng đỡ cột sống theo cách khác nhau, còn các tổng quan nghiên cứu chưa xác định được tư thế ngồi nào gây ra hay ngăn được đau lưng. Điều được khuyến nghị rộng rãi hơn là bớt ngồi liên tục và thay đổi tư thế.",
      why: "A3 (D2): 'được thiết kế để tiết kiệm năng lượng' — luận điểm không nguồn, ngôn ngữ mục đích luận.",
    },
    {
      field: "seoDescription",
      find: "Bài viết giải thích nguyên nhân sinh học khiến việc ngồi thẳng lưng tốn nhiều năng lượng và cách cải thiện sức khỏe cột sống hiệu quả.",
      replace:
        "Ngồi thẳng và ngồi khom dùng cơ và mô nâng đỡ cột sống khác nhau. Bằng chứng hiện nay nói gì về tư thế ngồi, đau lưng và khi nào nên đi khám.",
      why: "A3 (D2): 'tốn nhiều năng lượng' không nguồn; 'hiệu quả' là lời hứa.",
    },
    {
      field: "content",
      find: `${FENCE}text
Ngồi thẳng
    ↓
Cơ lưng và cơ cốt lõi phải hoạt động liên tục
    ↓
Tiêu tốn năng lượng và dễ mỏi

Ngồi khom
    ↓
Giảm hoạt động của cơ
    ↓
Tải trọng chuyển sang dây chằng và đĩa đệm
    ↓
Ít tốn sức hơn nhưng tăng áp lực lên cột sống
${FENCE}`,
      replace: `Ngồi thẳng và ngồi khom không chỉ khác nhau về dáng: chúng chia công việc nâng đỡ thân trên khác nhau giữa cơ bắp và các mô thụ động của cột sống.

- **Ngồi thẳng, không tựa:** một số cơ thân mình phải hoạt động để giữ tư thế; cơ nào hoạt động tùy kiểu ngồi thẳng.
- **Ngồi khom:** cơ dựng sống vùng ngực có thể ngừng hoạt động, và các nhà nghiên cứu cho rằng khi đó các mô thụ động như dây chằng nhiều khả năng gánh phần tải.

Ngồi thả lỏng không nhất thiết làm tăng áp lực trong đĩa đệm. Trong một phép đo trực tiếp ở đĩa đệm thắt lưng của một tình nguyện viên, áp lực khi ngồi thả lỏng (0,3 MPa) thấp hơn khi ngồi không tựa lưng (0,46 MPa); khi ngồi gập người tối đa, áp lực tăng lên 0,83 MPa. Vì chỉ đo trên một người, đây là số liệu tham khảo chứ chưa phải quy luật.`,
      why: "A2 (D1): 'khom = tăng áp lực lên cột sống' ngược số đo trực tiếp (Wilke 1999: thả lỏng 0,3 MPa < không tựa 0,46 MPa); 'tiêu tốn năng lượng' không nguồn.",
    },
    {
      field: "content",
      find: `## Cột Sống Con Người Không Được Thiết Kế Để Ngồi Hàng Giờ

Trong quá trình tiến hóa, con người phát triển tư thế đứng bằng hai chân. Cột sống vì thế hình thành các đường cong tự nhiên tạo thành dạng gần giống chữ S, giúp phân bổ lực và hấp thụ chấn động khi đi lại.

Tuy nhiên, hệ thống này được tối ưu cho việc vận động, chứ không phải ngồi bất động nhiều giờ mỗi ngày.

Khi ngồi lâu, đặc biệt trong tư thế cúi người về phía trước, xương chậu có xu hướng xoay ra sau, làm giảm độ cong tự nhiên của vùng thắt lưng. Điều này khiến áp lực phân bố lên cột sống thay đổi và dễ dẫn đến cảm giác mỏi hoặc khó chịu.`,
      replace: `## Cột sống người và tư thế ngồi

Lưng dưới của người có một đường cong lõm ra sau gọi là độ ưỡn thắt lưng — một đặc điểm gắn với dáng đi bằng hai chân. Độ cong này giúp thân trên đứng vững bằng cách đặt trọng tâm của thân phía trên khớp háng.

Khi ngồi, cột sống thắt lưng thường chuyển sang tư thế gập hơn so với lúc đứng. Trong một nghiên cứu theo dõi 2 giờ ngồi liên tục, tư thế cột sống khi ngồi và khi đứng của các tình nguyện viên gần như không trùng nhau.`,
      why: "B1 + B2 (D8): 'hấp thụ chấn động' không có trong nguồn (Whitcome 2007); 'không được thiết kế', 'được tối ưu' là mục đích luận; liên hệ với khó chịu là giả thuyết.",
    },
    {
      field: "content",
      find: `## Não Bộ Luôn Muốn Tiết Kiệm Năng Lượng

Để duy trì tư thế ngồi thẳng, nhiều nhóm cơ phải hoạt động liên tục, bao gồm:

- Cơ bụng.
- Cơ lưng dưới.
- Cơ vùng hông.
- Các cơ ổn định thân người (core muscles).

Việc duy trì sự co cơ trong thời gian dài khiến các cơ dần mệt mỏi.

Khi đó, cơ thể thường chuyển sang tư thế cần ít hoạt động cơ hơn. Đây là lý do nhiều người bắt đầu bằng tư thế ngồi đúng nhưng sau một thời gian lại dần cúi người hoặc khom lưng mà không nhận ra.

Nói cách khác, cơ thể đang lựa chọn phương án tiết kiệm năng lượng thay vì duy trì tư thế tối ưu.`,
      replace: `## Hai cách ngồi, hai cách chia tải

Ngồi thẳng không tựa đòi hỏi các cơ thân mình làm việc, và "ngồi thẳng" không chỉ có một kiểu. Một nghiên cứu trên 22 người không đau lưng so sánh hai kiểu ngồi thẳng với ngồi khom. So với kiểu ngồi thẳng từ vùng thắt lưng – chậu, kiểu ngồi thẳng bằng cách ưỡn vùng ngực dùng ít hơn cơ nhiều chân (multifidus) vùng thắt lưng và cơ chéo bụng trong, nhưng dùng nhiều hơn cơ dựng sống vùng ngực và cơ chéo bụng ngoài. Riêng với cơ nhiều chân vùng thắt lưng, kiểu ưỡn ngực không khác ngồi khom.

Khi ngồi khom, cơ dựng sống vùng ngực có thể im hẳn — hiện tượng "giãn khi gập" vốn đã được biết khi cúi người lúc đứng. Trong khi đó, cơ dựng sống vùng thắt lưng giữ mức hoạt động gần như không đổi dù ngồi kiểu nào. Nhóm nghiên cứu cho rằng các mô thụ động của cột sống, như dây chằng, nhiều khả năng gánh phần tải ở thắt lưng, và nêu giả thuyết đây có thể là một nguồn gây đau lưng khi ngồi làm việc. Giả thuyết này chưa được kiểm chứng.`,
      why: "A4 (D3): 'cơ thể chọn tiết kiệm năng lượng', 'mỏi → tự khom' không nguồn; danh sách cơ không khớp đo đạc (O'Sullivan 2006; Callaghan & Dunk 2002).",
    },
    {
      field: "content",
      find: `## Vì Sao Ngồi Co Chân Lên Ghế Lại Dễ Chịu?

Nhiều người thích ngồi xếp bằng hoặc co một chân lên ghế khi làm việc. Cảm giác dễ chịu này đến từ nhiều yếu tố sinh học và cơ học.

Khi co chân, cơ thể tạo thêm điểm tựa, giúp trọng tâm ổn định hơn và giảm áp lực tập trung lên vùng lưng dưới và xương ngồi. Đồng thời, một số nhóm cơ không còn phải hoạt động liên tục để giữ thăng bằng nên cảm giác mỏi giảm đi.

Việc thay đổi cách phân bố lực lên khớp và cột sống cũng tạo cảm giác thoải mái sau khi ngồi một tư thế cố định quá lâu. Ngoài ra, các tư thế co chân khá gần với những tư thế nghỉ ngơi tự nhiên của con người trước khi ghế văn phòng trở nên phổ biến.

Tuy nhiên, không nên duy trì tư thế này quá lâu vì có thể làm tăng áp lực không đều lên khớp, cột sống và gây tê chân.`,
      replace: `## Nghỉ mà không ngồi ghế

Ở người Hadza (Tanzania), một cộng đồng săn bắt – hái lượm, tổng thời gian không đi lại trung bình khoảng 10 giờ mỗi ngày, tương đương người ở các xã hội công nghiệp. Khác biệt nằm ở tư thế: nhiều lúc nghỉ của họ diễn ra khi ngồi xổm hoặc quỳ, và các tư thế "nghỉ chủ động" này đòi hỏi cơ chi dưới hoạt động nhiều hơn ngồi ghế.

Từ kết quả đó, nhóm nghiên cứu đề xuất giả thuyết "lệch pha bất động": cơ thể người có lẽ đã thích nghi với cơ bắp hoạt động đều đặn hơn mức mà việc ngồi ghế mang lại. Đây là giả thuyết, chưa phải kết luận đã được xác nhận.`,
      why: "A5 (D5): tư thế nghỉ ngoài xã hội công nghiệp (Raichlen 2020, người Hadza) dùng cơ chi dưới NHIỀU hơn ngồi ghế — ngược lập luận 'giảm hoạt động cơ'; phần cơ học co chân không nguồn.",
    },
    {
      field: "content",
      find: `## Lối Sống Hiện Đại Khiến Việc Ngồi Đúng Khó Hơn

Ngồi nhiều giờ mỗi ngày có thể làm suy yếu các nhóm cơ quan trọng giúp duy trì tư thế.

Một số thay đổi thường gặp gồm:

- Cơ mông và cơ đùi sau hoạt động ít hơn.
- Cơ ngực có xu hướng căng và ngắn lại.
- Cơ lưng trên yếu dần.
- Vai và đầu dễ trượt về phía trước.

Khi những mất cân bằng này tích lũy theo thời gian, việc giữ tư thế thẳng trở nên khó khăn hơn và đòi hỏi nhiều nỗ lực hơn.`,
      replace: `## Ngồi lâu, không chỉ là chuyện tư thế

Một số nghiên cứu gần đây gợi ý rằng thời gian ngồi kéo dài gắn với nguy cơ bệnh tim mạch và tử vong cao hơn, và các nhà nghiên cứu liên hệ điều này với việc cơ bắp ít co khi ngồi ghế.

Hướng dẫn về hoạt động thể chất của Tổ chức Y tế Thế giới (WHO) năm 2020 khuyến nghị mọi lứa tuổi giảm thời gian tĩnh tại và tập tăng sức cơ đều đặn. Hướng dẫn cũng nói rõ bằng chứng hiện chưa đủ để xác định một ngưỡng thời gian ngồi cụ thể.`,
      why: "A6 (D4): chuỗi 'thay đổi thường gặp' (khung hội chứng chéo trên) không có nghiên cứu chứng minh ngồi lâu gây ra; 'thường gặp' là tần suất tự đặt.",
    },
    {
      field: "content",
      find: `## Có Tư Thế Ngồi Hoàn Hảo Không?

Các nghiên cứu hiện nay cho thấy không có tư thế ngồi tĩnh nào hoàn hảo nếu duy trì quá lâu.

Ngay cả tư thế ngồi được xem là "đúng" cũng có thể gây khó chịu khi giữ liên tục trong nhiều giờ. Điều quan trọng không chỉ là tư thế, mà còn là tần suất thay đổi tư thế.

Những thói quen hữu ích bao gồm:

- Thay đổi vị trí ngồi thường xuyên.
- Đứng dậy hoặc đi lại mỗi 30-60 phút.
- Tăng cường sức mạnh cơ bụng, cơ lưng và cơ mông.
- Điều chỉnh màn hình, bàn và ghế phù hợp với chiều cao cơ thể.
- Kết hợp vận động trong ngày thay vì ngồi liên tục.`,
      replace: `## Có tư thế ngồi hoàn hảo không?

Chưa có bằng chứng mạnh rằng một tư thế ngồi cụ thể nào đem lại kết quả sức khỏe tốt hơn. Một tổng quan gộp 41 tổng quan hệ thống ghi nhận cả kết quả có liên hệ lẫn không liên hệ giữa đau thắt lưng với tư thế cột sống, ngồi lâu, đứng lâu, cúi và vặn người; tổng quan kết luận chưa có đồng thuận rằng các yếu tố này gây ra đau thắt lưng. Dù vậy, khi được khảo sát, phần lớn nhà vật lý trị liệu vẫn chọn một biến thể của ngồi thẳng, giữ độ ưỡn thắt lưng, làm tư thế "tối ưu".

Các cơ quan y tế vẫn coi tư thế là một yếu tố có thể góp phần. Viện Quốc gia về Viêm khớp, Bệnh cơ xương và Da Hoa Kỳ (NIAMS) viết rằng công việc bàn giấy có thể đóng vai trò trong đau lưng, nhất là khi tư thế kém hoặc ngồi cả ngày trên ghế không thoải mái, và cơ lưng, cơ bụng yếu có thể không nâng đỡ cột sống tốt.

Những điều có căn cứ hơn cả:

- Thay đổi tư thế thường xuyên thay vì giữ một tư thế cố định. Nhóm đo áp lực đĩa đệm thận trọng kết luận rằng việc liên tục đổi tư thế quan trọng cho dòng dịch nuôi đĩa đệm.
- Giảm thời gian ngồi liên tục và vận động nhiều hơn trong ngày.
- Tập tăng sức cơ đều đặn.
- Ngồi trên ghế thoải mái.`,
      why: "A7 (D6): '30–60 phút' không nguồn — WHO 2020 nói bằng chứng chưa đủ định lượng ngưỡng. B3, B4, B5: trích đúng mức (Swain 2020; Korakakis 2019), thêm vế NIAMS, bỏ quy tắc chỉnh bàn ghế không nguồn.",
    },
    {
      field: "content",
      find: `## Kết Luận

Việc ngồi thẳng lưng không khó vì chúng ta thiếu ý chí, mà vì cơ thể luôn cố gắng hoạt động theo cách tiết kiệm năng lượng nhất. Sau một thời gian, các cơ duy trì tư thế sẽ mỏi và cơ thể tự động tìm đến những tư thế ít tốn sức hơn.

Thay vì cố giữ một tư thế hoàn hảo suốt nhiều giờ, cách tiếp cận hiệu quả hơn là vận động thường xuyên, thay đổi tư thế định kỳ và duy trì sức mạnh của các nhóm cơ hỗ trợ cột sống. Đối với sức khỏe cột sống, tư thế tốt nhất thường là tư thế tiếp theo sau khi bạn đã ngồi quá lâu ở tư thế hiện tại.`,
      replace: `## Khi nào nên đi khám

Đau lưng, nhất là đau thắt lưng, rất phổ biến và thường đỡ sau vài tuần. Theo Dịch vụ Y tế Quốc gia Anh (NHS), nên đi khám nếu đau lưng và:

- không đỡ sau vài tuần tự chăm sóc tại nhà;
- cản trở sinh hoạt hằng ngày, hoặc bạn lo lắng, khó chịu đựng;
- sụt cân không rõ lý do;
- có khối u hoặc sưng ở lưng, hoặc lưng thay đổi hình dạng;
- không đỡ khi nghỉ, hoặc nặng hơn về đêm;
- nặng hơn khi hắt hơi, ho hoặc đi đại tiện;
- đau ở lưng trên (giữa hai vai) chứ không phải lưng dưới.

Cần khám gấp nếu đau lưng kèm cảm giác nóng, lạnh, run hoặc mệt mỏi toàn thân, hoặc đau dữ dội khởi phát đột ngột hay nặng lên nhanh.

Cần cấp cứu ngay nếu đau lưng kèm: đau, ngứa ran, yếu hoặc tê ở cả hai chân; mất cảm giác quanh vùng sinh dục hoặc hậu môn; thay đổi khi đi tiểu, đi đại tiện (khó tiểu, tiểu hoặc đại tiện không tự chủ); thay đổi cảm giác hoặc chức năng tình dục; đau ngực; hoặc đau xuất hiện sau một tai nạn nghiêm trọng.

## Kết luận

Ngồi thẳng và ngồi khom chia việc nâng đỡ thân trên khác nhau giữa cơ bắp và các mô thụ động của cột sống, và "ngồi thẳng" cũng không chỉ có một kiểu. Các tổng quan hiện chưa xác định được tư thế ngồi nào gây ra hay ngăn được đau lưng. Điều được khuyến nghị rộng rãi hơn là bớt ngồi liên tục, thay đổi tư thế thường xuyên và duy trì vận động, kể cả tập tăng sức cơ.`,
      why: "A8 (D7): bài sức khoẻ có lời khuyên tự làm mà thiếu dấu hiệu cần đi khám (NHS). B6 (D9): kết luận lặp luận điểm 'tiết kiệm năng lượng' và câu cửa miệng không nguồn.",
    },
  ],
  reading: [
    ["Vận động thay đổi tim và mạch máu như thế nào", "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
    ["Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?", "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa"],
    ['Khối lượng, trọng lượng và quán tính: vì sao "nặng" không phải lúc nào cũng giống nhau?', "bi-mat-dang-sau-cam-giac-nang-va-nhe"],
  ],
  sources: [
    { title: "New in vivo measurements of pressures in the intervertebral disc in daily life", publisher: "Spine", doi: "10.1097/00007632-199904150-00005", year: 1999, tier: 1 },
    { title: "Effect of different upright sitting postures on spinal-pelvic curvature and trunk muscle activation in a pain-free population", publisher: "Spine", doi: "10.1097/01.brs.0000234735.98075.50", year: 2006, tier: 1 },
    { title: "Examination of the flexion relaxation phenomenon in erector spinae muscles during short duration slumped sitting", publisher: "Clinical Biomechanics", doi: "10.1016/S0268-0033(02)00023-2", year: 2002, tier: 1 },
    { title: "Low back joint loading and kinematics during standing and unsupported sitting", publisher: "Ergonomics", doi: "10.1080/00140130118276", year: 2001, tier: 1 },
    { title: "No consensus on causality of spine postures or physical exposure and low back pain: a systematic review of systematic reviews", publisher: "Journal of Biomechanics", doi: "10.1016/j.jbiomech.2019.08.006", year: 2020, tier: 1 },
    { title: "Physiotherapist perceptions of optimal sitting and standing posture", publisher: "Musculoskeletal Science and Practice", doi: "10.1016/j.msksp.2018.11.004", year: 2019, tier: 1 },
    // Bài quan điểm — chỉ dùng kèm Korakakis 2019 và Swain 2020, không đứng một mình.
    { title: '"Sit up straight": time to re-evaluate', publisher: "Journal of Orthopaedic & Sports Physical Therapy", doi: "10.2519/jospt.2019.0610", year: 2019, tier: 1 },
    { title: "Sitting, squatting, and the evolutionary biology of human inactivity", publisher: "PNAS", doi: "10.1073/pnas.1911868117", year: 2020, tier: 1 },
    { title: "Fetal load and the evolution of lumbar lordosis in bipedal hominins", publisher: "Nature", doi: "10.1038/nature06342", year: 2007, tier: 1 },
    { title: "World Health Organization 2020 guidelines on physical activity and sedentary behaviour", publisher: "British Journal of Sports Medicine", doi: "10.1136/bjsports-2020-102955", year: 2020, tier: 2 },
    { title: "Back pain", publisher: "NHS", url: "https://www.nhs.uk/conditions/back-pain/", year: 2026, tier: 2 },
    { title: "Back pain", publisher: "NIAMS (NIH)", url: "https://www.niams.nih.gov/health-topics/back-pain", year: 2026, tier: 2 },
  ],
};

const PLANS: Plan[] = [RIA, VU_TRU, NGOI];

const FIELDS: Field[] = ["title", "summary", "content", "seoTitle", "seoDescription"];

function sourceUrl(s: SourceIn): string | null {
  if (s.url !== undefined) return s.url;
  return s.doi ? `https://doi.org/${s.doi}` : null;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const now = new Date();

  // Mọi bài trong "Đọc thêm" phải đang PUBLISHED — không link bài DRAFT.
  const readingSlugs = PLANS.flatMap((p) => p.reading.map(([, s]) => s));
  const live = new Set(
    (await prisma.article.findMany({ where: { slug: { in: readingSlugs }, status: "PUBLISHED" }, select: { slug: true } })).map((r) => r.slug),
  );
  const dead = readingSlugs.filter((s) => !live.has(s));
  if (dead.length) throw new Error(`"Đọc thêm" trỏ bài chưa PUBLISHED: ${dead.join(", ")}`);

  const jobs = [];
  for (const plan of PLANS) {
    console.log(`\n══════ ${plan.slug}`);
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: plan.slug },
      select: { id: true, title: true, summary: true, content: true, seoTitle: true, seoDescription: true, factCheck: true, status: true },
    });
    const next: Record<Field, string> = {
      title: a.title,
      summary: a.summary,
      content: a.content,
      seoTitle: a.seoTitle ?? "",
      seoDescription: a.seoDescription ?? "",
    };

    let applied = 0;
    for (const fix of plan.fixes) {
      const text = next[fix.field];
      // "Đã sửa" = không còn bản cũ mà có bản mới.
      if (!text.includes(fix.find) && text.includes(fix.replace)) {
        console.log(`· đã sửa từ trước: [${fix.field}] ${fix.find.slice(0, 60)}…`);
        continue;
      }
      const count = text.split(fix.find).length - 1;
      if (count !== 1) throw new Error(`[${plan.slug} · ${fix.field}] cụm cần sửa khớp ${count} chỗ, cần đúng 1: ${fix.find.slice(0, 80)}`);
      next[fix.field] = text.replace(fix.find, () => fix.replace);
      applied++;
      console.log(`\n[${fix.field}] cũ : ${fix.find.slice(0, 120).replace(/\n/g, " ⏎ ")}`);
      console.log(`        mới: ${fix.replace.slice(0, 120).replace(/\n/g, " ⏎ ")}…`);
      console.log(`        vì : ${fix.why}`);
    }

    for (const word of plan.forbid ?? []) {
      const left = FIELDS.filter((f) => next[f].includes(word));
      if (left.length) throw new Error(`[${plan.slug}] vẫn còn "${word}" ở: ${left.join(", ")}`);
    }

    if (!/^## Đọc thêm/m.test(next.content)) {
      next.content = `${next.content.replace(/\s+$/, "")}\n\n## Đọc thêm\n\n${plan.reading.map(([t, s]) => `- [${t}](/articles/${s})`).join("\n")}\n`;
      console.log(`\n+ mục "Đọc thêm": ${plan.reading.map(([, s]) => s).join(", ")}`);
    }

    const have = await prisma.source.findMany({ where: { articleId: a.id }, select: { url: true, title: true } });
    const haveUrl = new Set(have.map((s) => s.url).filter(Boolean));
    const haveTitle = new Set(have.map((s) => s.title));
    const add = plan.sources.filter((s) => {
      const url = sourceUrl(s);
      return url ? !haveUrl.has(url) : !haveTitle.has(s.title);
    });
    const tier12 = plan.sources.filter((s) => s.tier <= 2).length;
    const draft = plan.toDraft && a.status !== "DRAFT";
    console.log(
      `\nfix áp: ${applied}/${plan.fixes.length} · nguồn thêm: ${add.length}/${plan.sources.length} (bậc 1–2: ${tier12})` +
        ` · factCheck ${a.factCheck} — GIỮ NGUYÊN · status ${a.status}${draft ? " → DRAFT" : " — giữ"}`,
    );

    const data = {
      title: next.title,
      summary: next.summary,
      content: next.content,
      seoTitle: a.seoTitle === null && next.seoTitle === "" ? null : next.seoTitle,
      seoDescription: a.seoDescription === null && next.seoDescription === "" ? null : next.seoDescription,
      lastVerifiedAt: now,
      ...(draft ? { status: "DRAFT" as const } : {}),
    };
    jobs.push({ plan, a, data, add, draft });
  }

  if (!write) {
    console.log(`\n══════ TỔNG: ${jobs.length} bài · ${jobs.reduce((n, j) => n + j.plan.fixes.length, 0)} fix · ${jobs.reduce((n, j) => n + j.add.length, 0)} nguồn thêm · về DRAFT: ${jobs.filter((j) => j.draft).map((j) => j.plan.slug).join(", ") || "không"}`);
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  // Mỗi bài một transaction: Revision (bản trước, cả title) + update + nguồn.
  for (const { plan, a, data, add, draft } of jobs) {
    await prisma.$transaction([
      prisma.revision.create({
        data: { articleId: a.id, title: a.title, content: a.content, note: draft ? `${plan.note}. Trạng thái trước: ${a.status} → DRAFT.` : plan.note },
      }),
      prisma.article.update({ where: { id: a.id }, data }),
      ...add.map((s) =>
        prisma.source.create({
          data: { articleId: a.id, title: s.title, publisher: s.publisher, url: sourceUrl(s), doi: s.doi ?? null, year: s.year, tier: s.tier, accessedAt: now },
        }),
      ),
    ]);
    console.log(`ĐÃ GHI ${plan.slug}${draft ? " (→ DRAFT)" : ""}`);
  }
  await revalidateSite(PLANS.map((p) => p.slug));
  console.log("\nĐÃ GHI (revision + nội dung + nguồn, mỗi bài một transaction). factCheck vẫn giữ — người duyệt đặt sau khi đọc bản đã sửa.");
  console.log("Bài về DRAFT cần ra khỏi chỉ mục tìm kiếm: npm run search:reindex");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
