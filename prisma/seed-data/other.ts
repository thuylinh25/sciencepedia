import type { SeedArticle, SeedCategory, SeedTag } from "./types";

/** Các lĩnh vực còn lại — dựng khung sẵn để nội dung bổ sung dần. */

export const otherCategories: SeedCategory[] = [
  {
    slug: "vat-ly",
    name: "Vật lý",
    nameEn: "Physics",
    description:
      "Từ cơ học lượng tử tới thuyết tương đối — những quy luật nền tảng chi phối mọi thứ còn lại.",
    descriptionEn:
      "From quantum mechanics to relativity - the ground rules everything else obeys.",
    icon: "Atom",
    color: "#0ea5e9",
    order: 3,
  },
  {
    slug: "sinh-hoc",
    name: "Sinh học",
    nameEn: "Biology",
    description:
      "Tế bào, DNA, tiến hoá và sự đa dạng của sự sống trên Trái Đất.",
    descriptionEn: "Cells, DNA, evolution and the diversity of life on Earth.",
    icon: "Dna",
    color: "#16a34a",
    order: 4,
  },
  {
    slug: "trai-dat-va-khi-hau",
    name: "Trái Đất và Khí hậu",
    nameEn: "Earth and Climate",
    description:
      "Địa chất, đại dương, khí quyển và hệ thống khí hậu đang thay đổi.",
    descriptionEn:
      "Geology, oceans, atmosphere and a climate system in transition.",
    icon: "Globe2",
    color: "#0d9488",
    order: 5,
  },
];

export const otherTags: SeedTag[] = [
  { slug: "luong-tu", name: "Lượng tử", nameEn: "Quantum", color: "#8b5cf6" },
  { slug: "tien-hoa", name: "Tiến hoá", nameEn: "Evolution", color: "#16a34a" },
  { slug: "khi-hau", name: "Khí hậu", nameEn: "Climate", color: "#0d9488" },
  { slug: "dna", name: "DNA", nameEn: "DNA", color: "#db2777" },
];

export const otherArticles: SeedArticle[] = [
  {
    slug: "thuyet-tuong-doi-hep",
    title: "Thuyết tương đối hẹp: khi thời gian không còn tuyệt đối",
    titleEn: "Special relativity: when time stops being absolute",
    summary:
      "Chỉ từ hai tiên đề đơn giản, Einstein suy ra rằng đồng hồ chạy chậm lại, độ dài co lại, và khối lượng là một dạng năng lượng.",
    summaryEn:
      "From two simple postulates, Einstein derived slowed clocks, contracted lengths, and mass as a form of energy.",
    categorySlug: "vat-ly",
    tagSlugs: ["vat-ly", "thien-van"],
    seoKeywords: "thuyết tương đối hẹp, Einstein, giãn nở thời gian, E=mc2",
    content: `Năm 1905, Albert Einstein công bố một bài báo xây dựng lại toàn bộ cơ học từ hai giả định:

1. Các định luật vật lý là như nhau trong mọi hệ quy chiếu quán tính.
2. Tốc độ ánh sáng trong chân không là như nhau với mọi quan sát viên, bất kể chuyển động của nguồn hay người quan sát.

Tiên đề thứ hai nghe vô hại nhưng phá vỡ trực giác hằng ngày. Nếu bạn chạy theo một chùm sáng, bạn vẫn đo được nó chuyển động với đúng tốc độ c so với mình.

## Hệ quả

**Giãn nở thời gian.** Đồng hồ chuyển động so với bạn sẽ chạy chậm hơn đồng hồ của bạn, theo hệ số Lorentz γ = 1/√(1 − v²/c²).

**Co độ dài.** Vật thể chuyển động ngắn lại theo phương chuyển động, cùng hệ số đó.

**Tính đồng thời là tương đối.** Hai sự kiện xảy ra cùng lúc với người này có thể không cùng lúc với người khác đang chuyển động.

**E = mc².** Khối lượng và năng lượng là hai mặt của cùng một đại lượng.

## Không phải chuyện lý thuyết suông

Hệ thống GPS phải hiệu chỉnh cả hiệu ứng tương đối hẹp (vệ tinh chuyển động nhanh nên đồng hồ chạy chậm đi khoảng 7 μs/ngày) lẫn tương đối rộng (ở xa Trái Đất, trường hấp dẫn yếu hơn nên đồng hồ chạy nhanh hơn khoảng 45 μs/ngày). Tổng cộng khoảng 38 μs/ngày — nếu bỏ qua, sai số định vị sẽ tích luỹ khoảng 10 km mỗi ngày.

Các hạt muon sinh ra ở tầng cao khí quyển cũng là bằng chứng trực tiếp: thời gian sống trung bình của chúng quá ngắn để tới được mặt đất, vậy mà chúng vẫn tới — vì với hệ quy chiếu của chúng ta, đồng hồ của chúng chạy chậm.`,
    sources: [
      {
        title: "Zur Elektrodynamik bewegter Körper",
        publisher: "Annalen der Physik",
        year: 1905,
      },
    ],
  },
  {
    slug: "crispr-la-gi",
    title: "CRISPR: cây kéo phân tử đến từ vi khuẩn",
    titleEn: "CRISPR: molecular scissors borrowed from bacteria",
    summary:
      "Một cơ chế miễn dịch của vi khuẩn được chuyển thành công cụ chỉnh sửa gene chính xác, rẻ và nhanh — đã trở thành liệu pháp được phê duyệt.",
    summaryEn:
      "A bacterial immune mechanism turned into a precise, cheap and fast gene-editing tool - now an approved therapy.",
    categorySlug: "sinh-hoc",
    tagSlugs: ["dna", "tien-hoa", "y-hoc"],
    seoKeywords: "CRISPR, Cas9, chỉnh sửa gene, liệu pháp gene",
    content: `CRISPR ban đầu không phải phát minh của con người. Đó là hệ miễn dịch thích ứng của vi khuẩn: khi bị virus tấn công, vi khuẩn lưu một đoạn DNA của kẻ tấn công vào bộ gene của mình để nhận diện lần sau.

## Cơ chế

Hệ thống gồm hai phần:

- **RNA dẫn đường (guide RNA)** — một đoạn khoảng 20 nucleotide khớp bổ sung với vị trí DNA cần cắt.
- **Enzyme Cas9** — protein thực hiện việc cắt cả hai mạch DNA tại đúng vị trí đó.

Điểm đột phá năm 2012 của Jennifer Doudna và Emmanuelle Charpentier là chứng minh có thể lập trình lại RNA dẫn đường tuỳ ý. Muốn cắt ở đâu, chỉ cần tổng hợp một đoạn RNA 20 nucleotide tương ứng. Hai người nhận giải Nobel Hoá học năm 2020.

## Sau khi cắt thì sao

Tế bào tự sửa vết đứt theo hai con đường:

- **Nối đầu không tương đồng (NHEJ)** — nhanh nhưng hay sai sót, thường tạo ra đột biến làm hỏng gene. Dùng khi mục tiêu là *tắt* một gene.
- **Sửa chữa theo khuôn (HDR)** — chính xác hơn, cho phép *chèn* một trình tự mới nếu cung cấp khuôn mẫu.

## Từ phòng thí nghiệm tới bệnh nhân

Tháng 12/2023, các cơ quan quản lý Anh và Mỹ phê duyệt **exagamglogene autotemcel** (Casgevy) cho bệnh hồng cầu hình liềm và beta-thalassemia — liệu pháp dùng CRISPR đầu tiên được chấp thuận.

## Ranh giới đạo đức

Năm 2018, He Jiankui công bố đã chỉnh sửa phôi người và tạo ra hai em bé — hành động bị cộng đồng khoa học lên án rộng rãi và dẫn tới án tù. Khác biệt then chốt: chỉnh sửa **tế bào soma** chỉ ảnh hưởng bệnh nhân, còn chỉnh sửa **dòng mầm** truyền cho các thế hệ sau. Hiện nay việc chỉnh sửa dòng mầm ở người bị cấm hoặc hạn chế nghiêm ngặt ở hầu hết các nước.`,
    sources: [
      {
        title:
          "A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity",
        publisher: "Science",
        year: 2012,
      },
    ],
  },
];
