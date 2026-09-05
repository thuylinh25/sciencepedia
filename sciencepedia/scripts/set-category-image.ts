import { PrismaClient } from "@prisma/client";

/**
 * Gán ảnh bìa cho một danh mục, kèm ghi công.
 *
 *   npm run category:image -- --slug hoa-hoc              # in kế hoạch
 *   npm run category:image -- --slug hoa-hoc --write      # thực thi
 *
 * Mặc định chạy khô, theo lệ của `images:credit` và `taxonomy:tier2`.
 *
 * ## Vì sao ảnh và ghi công phải đi cùng một lượt ghi
 *
 * `docs/content-rules.md` chốt: ghi công lấy từ CSDL, không chép tay vào thân
 * bài, vì thay ảnh mà quên đổi ghi công thì còn tệ hơn không ghi — ghi công sai
 * người. Script này ghi hai trường trong CÙNG một `update`, nên không tồn tại
 * trạng thái trung gian "đã có ảnh, chưa có ghi công".
 *
 * Với giấy phép CC BY / CC BY-SA thì ghi công là điều kiện pháp lý, không phải
 * phép lịch sự: script từ chối ghi nếu thiếu.
 *
 * ## Vì sao dữ liệu ảnh viết cứng trong file
 *
 * Mỗi tấm đã qua ba bước kiểm tay: tìm trên Commons, đọc `extmetadata` để lấy
 * đúng tên tác giả và tên giấy phép, rồi gọi thật vào URL xem có trả 200 không.
 * Ba bước đó không tự động hoá được một cách đáng tin — một URL Commons đoán
 * theo tên file trông rất giống URL thật và hỏng âm thầm.
 */
const prisma = new PrismaClient();

type Picture = {
  url: string;
  /** Trang mô tả trên Commons — phải có trong ghi công để giấy phép truy được */
  page: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** Màu chủ đạo, đặt cùng lượt nếu cần sửa */
  color?: string;
};

const PICTURES: Record<string, Picture> = {
  "hoa-hoc": {
    // Ngọn lửa của dung dịch methanol pha muối kim loại — phản ứng màu ngọn
    // lửa, cách nhận biết nguyên tố có từ thế kỷ 19. Chọn tấm này thay vì ống
    // nghiệm nhiều màu vì nó cho thấy một HIỆN TƯỢNG hoá học, không phải một
    // phòng thí nghiệm; bốn ảnh bìa còn lại cũng đều là hiện tượng, không phải
    // dụng cụ.
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Coloured_flames_of_methanol_solutions_of_metal_salts_and_compounds.jpg/1280px-Coloured_flames_of_methanol_solutions_of_metal_salts_and_compounds.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Coloured_flames_of_methanol_solutions_of_metal_salts_and_compounds.jpg",
    author: "Hegelrast",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    // Sửa luôn màu: #22c55e đặt lúc tạo quá gần #16a34a của Sinh học, hai lĩnh
    // vực gốc cạnh nhau trong lưới mà gần như cùng một màu xanh. Hổ phách tách
    // bạch khỏi cả năm màu đang dùng (chàm, hồng, lam, lục, mòng két) và hợp
    // với chính tấm ảnh ngọn lửa.
    color: "#d97706",
  },
};

/** Ghi công theo đúng định dạng năm danh mục gốc đang dùng. */
function credit(p: Picture, lang: "vi" | "en"): string {
  const label = lang === "vi" ? "Ảnh" : "Image";
  return `${label}: ${p.author} — [Wikimedia Commons](${p.page}). Giấy phép [${p.licence}](${p.licenceUrl}).`;
}

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

/** Gọi thật vào URL. Ghi một đường dẫn ảnh hỏng vào CSDL thì hỏng âm thầm. */
async function reachable(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SciencepediaBot/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`content-type ${type}, không phải ảnh`);
  return type;
}

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const slug = flagValue(argv, "slug");

  if (!slug) {
    console.error(`Thiếu --slug. Đang có dữ liệu cho: ${Object.keys(PICTURES).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const picture = PICTURES[slug];
  if (!picture) {
    console.error(`Chưa có dữ liệu ảnh cho "${slug}". Thêm vào PICTURES trong file này.`);
    process.exitCode = 1;
    return;
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, coverImage: true, color: true },
  });
  if (!category) {
    console.error(`Không có danh mục "${slug}".`);
    process.exitCode = 1;
    return;
  }

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  console.log(`\nDanh mục: ${category.name} (${slug})`);
  console.log(`Ảnh hiện tại: ${category.coverImage ?? "(trống)"}`);

  const type = await reachable(picture.url).catch((error: Error) => {
    console.error(`\nẢnh không truy cập được: ${error.message} — KHÔNG ghi gì.`);
    process.exitCode = 1;
    return null;
  });
  if (!type) return;

  console.log(`\nẢnh mới:   ${picture.url}`);
  console.log(`   kiểm:   ${type}, truy cập được`);
  console.log(`   ghi công: ${credit(picture, "vi")}`);
  if (picture.color && picture.color !== category.color) {
    console.log(`   màu:    ${category.color} → ${picture.color}`);
  }

  if (!write) {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  await prisma.category.update({
    where: { id: category.id },
    data: {
      coverImage: picture.url,
      coverImageCredit: credit(picture, "vi"),
      coverImageCreditEn: credit(picture, "en"),
      ...(picture.color ? { color: picture.color } : {}),
    },
  });
  console.log("\nĐã ghi ảnh, ghi công (vi + en) và màu trong cùng một lượt.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
