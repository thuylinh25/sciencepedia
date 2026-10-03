import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Điền mô tả cho các danh mục con còn trống.
 *
 *   npx tsx --env-file-if-exists=.env scripts/set-category-descriptions.ts           # in kế hoạch
 *   npx tsx --env-file-if-exists=.env scripts/set-category-descriptions.ts --write   # ghi
 *
 * ## Vì sao cần
 *
 * 12/28 danh mục không có mô tả, nên meta description của trang danh mục
 * chính là tên danh mục — Google coi đó là thiếu mô tả và tự cắt một đoạn bất
 * kỳ trong trang. Đầu trang danh mục cũng hiện một khối trống.
 *
 * ## Vì sao tả PHẠM VI, không tả các bài đang có
 *
 * Danh mục là một nhánh của khoa học, còn bài trong đó sẽ thêm dần. Mô tả
 * "gồm bài về Newton và tàu vũ trụ" đúng hôm nay và sai ở bài thứ bảy. Cùng
 * luật với `docs/content-rules.md`, "Số liệu trên trang": không hứa nội dung,
 * không đếm bài.
 *
 * Chỉ điền ô TRỐNG — không bao giờ ghi đè mô tả đã có, kể cả khi ở đây có một
 * bản cho cùng slug. Văn bản đã qua `science-editor` (2026-10-03); bản sửa
 * theo lượt duyệt đó: `vat-ly-hien-dai` từng viết "thế giới nhỏ hơn nguyên tử",
 * đọc thành cơ học lượng tử không áp dụng cho chính nguyên tử.
 */
const prisma = new PrismaClient();

const DESCRIPTIONS: Record<string, { vi: string; en: string }> = {
  "co-hoc": {
    vi: "Lực, chuyển động, khối lượng và quán tính — các định luật của Newton và cách chúng giải thích từ quả táo rơi tới quỹ đạo của tàu vũ trụ.",
    en: "Force, motion, mass and inertia — Newton's laws and how they explain everything from a falling apple to a spacecraft's orbit.",
  },
  "nhiet-va-nang-luong": {
    vi: "Năng lượng là gì, nó chuyển từ dạng này sang dạng khác ra sao, và nhiệt độ, nhiệt, entropy nói gì về chiều diễn ra của các quá trình tự xảy ra.",
    en: "What energy is, how it changes from one form to another, and what temperature, heat and entropy say about the direction of spontaneous processes.",
  },
  "dien-tu-va-anh-sang": {
    vi: "Điện tích, dòng điện, từ trường và ánh sáng — một tương tác duy nhất đứng sau sóng radio, tia X và màu sắc ta nhìn thấy.",
    en: "Electric charge, current, magnetism and light — a single interaction behind radio waves, X-rays and the colours we see.",
  },
  "vat-ly-hien-dai": {
    vi: "Thuyết tương đối và cơ học lượng tử — vật lý của tốc độ gần bằng ánh sáng, của hấp dẫn cực mạnh, và của nguyên tử cùng thế giới còn nhỏ hơn thế.",
    en: "Relativity and quantum mechanics — the physics of near-light speeds, extreme gravity, and atoms and the world smaller still.",
  },
  "te-bao-va-phan-tu": {
    vi: "Tế bào, các phân tử sinh học và những tín hiệu hoá học giữ cho sự sống vận hành, từ protein tới chất dẫn truyền thần kinh.",
    en: "Cells, biological molecules and the chemical signals that keep life running, from proteins to neurotransmitters.",
  },
  "di-truyen": {
    vi: "DNA, gen và di truyền — thông tin sinh học được lưu giữ, truyền qua các thế hệ và chỉnh sửa bằng những công cụ như CRISPR ra sao.",
    en: "DNA, genes and heredity — how biological information is stored, passed between generations and edited with tools such as CRISPR.",
  },
  "tien-hoa": {
    vi: "Chọn lọc tự nhiên, các cơ chế tiến hoá khác như phiêu bạt di truyền, và lịch sử sự sống — vì sao sinh vật có hình dạng, hành vi và những giới hạn như ngày nay.",
    en: "Natural selection, other mechanisms such as genetic drift, and the history of life — why living things have the forms, behaviours and limits they have today.",
  },
  "sinh-ly-va-trao-doi-chat": {
    vi: "Cơ thể người vận hành ra sao: tim mạch, tiêu hoá, hệ thần kinh, hormone và cách cơ thể sử dụng năng lượng.",
    en: "How the human body works: the heart and circulation, digestion, the nervous system, hormones and how the body uses energy.",
  },
  "dia-chat": {
    vi: "Cấu trúc bên trong Trái Đất, đá, kiến tạo mảng và những biến cố địa chất đã định hình lịch sử sự sống.",
    en: "Earth's interior, rocks, plate tectonics and the geological events that have shaped the history of life.",
  },
  "khi-quyen-va-thoi-tiet": {
    vi: "Lớp không khí bao quanh Trái Đất: nó gồm những gì, ánh sáng đi qua nó ra sao, gió, mây và thời tiết.",
    en: "The air around Earth: what it is made of, how light passes through it, wind, clouds and weather.",
  },
  "dai-duong": {
    vi: "Đại dương phủ phần lớn bề mặt Trái Đất: dòng hải lưu, thuỷ triều và vai trò của biển trong hệ thống khí hậu.",
    en: "The oceans that cover most of Earth's surface: currents, tides and the sea's role in the climate system.",
  },
  "khi-hau-va-bien-doi": {
    vi: "Hệ thống khí hậu Trái Đất, những dao động tự nhiên như El Niño, và bằng chứng về biến đổi khí hậu do con người gây ra.",
    en: "Earth's climate system, natural swings such as El Niño, and the evidence for human-caused climate change.",
  },
};

async function main() {
  const write = process.argv.includes("--write");

  const categories = await prisma.category.findMany({
    where: { slug: { in: Object.keys(DESCRIPTIONS) } },
    select: { id: true, slug: true, description: true, descriptionEn: true },
  });

  const missing = Object.keys(DESCRIPTIONS).filter(
    (slug) => !categories.some((category) => category.slug === slug),
  );
  for (const slug of missing) console.warn(`⚠ không có danh mục "${slug}" — bỏ qua`);

  let changed = 0;
  for (const category of categories) {
    const text = DESCRIPTIONS[category.slug];
    const data = {
      ...(category.description ? {} : { description: text.vi }),
      ...(category.descriptionEn ? {} : { descriptionEn: text.en }),
    };
    if (Object.keys(data).length === 0) {
      console.log(`= ${category.slug}: đã có mô tả, giữ nguyên`);
      continue;
    }
    console.log(`+ ${category.slug}`);
    if (data.description) console.log(`    vi: ${data.description}`);
    if (data.descriptionEn) console.log(`    en: ${data.descriptionEn}`);
    changed++;
    if (write) {
      await prisma.category.update({ where: { id: category.id }, data });
    }
  }

  if (!write) {
    console.log(`\n${changed} danh mục sẽ được điền. Chạy lại với --write để ghi.`);
    return;
  }
  console.log(`\n✓ Đã điền ${changed} danh mục.`);
  // Trang danh mục đọc qua `getAllCategories`, cache mang tag `articles`
  if (changed > 0) await revalidateSite([]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
