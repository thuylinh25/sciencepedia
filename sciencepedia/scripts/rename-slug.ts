import { PrismaClient } from "@prisma/client";

/**
 * Đổi slug của một bài viết.
 *
 *   npm run rename:slug -- --from cu --to moi           # in kế hoạch, KHÔNG ghi
 *   npm run rename:slug -- --from cu --to moi --write   # thực thi
 *
 * ## Vì sao cần script này
 *
 * Ngày 2026-09-10, commit 002b874 thêm redirect 301 từ
 * `hanh-trinh-vao-tam-trai-dat` sang `cau-truc-ben-trong-trai-dat` — nhưng
 * việc đổi slug trong cơ sở dữ liệu thì không ai làm. Kết quả đúng bằng thứ
 * chính commit đó viết ra để cảnh báo: URL cũ 301 sang một slug không tồn
 * tại, tức là 301 sang 404. Bài biến mất khỏi web trong khi vẫn nằm trong
 * danh sách "đọc nhiều nhất", vì danh sách đó đọc slug từ cùng hàng dữ liệu.
 *
 * Đổi slug bằng tay qua giao diện admin làm được, nhưng nó không kiểm hai
 * điều mà một URL công khai bắt buộc phải có: slug đích còn trống, và slug
 * nguồn thật sự tồn tại. Sai một trong hai thì hoặc mất bài, hoặc dựng lên
 * một hàng trùng slug mà Prisma sẽ từ chối ở giữa chừng.
 *
 * ## Vì sao mặc định không ghi
 *
 * Slug là URL công khai. Ghi nhầm là làm chết một địa chỉ mà người khác đã
 * lưu hoặc đã dẫn link tới. In kế hoạch trước, ghi sau — cùng quy ước với
 * `publish.ts` và `sync-cau-truc-trai-dat.ts`.
 */

const prisma = new PrismaClient();

function flag(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv
    .find((item) => item.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

/** Slug hợp lệ: chữ thường, số và dấu nối. Đúng dạng mà route `[slug]` nhận. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function main() {
  const argv = process.argv.slice(2);
  const from = flag(argv, "from");
  const to = flag(argv, "to");
  const write = argv.includes("--write");

  if (!from || !to) {
    console.error(
      "Thiếu tham số. Ví dụ:\n" +
        "  npm run rename:slug -- --from hanh-trinh-vao-tam-trai-dat --to cau-truc-ben-trong-trai-dat",
    );
    process.exitCode = 1;
    return;
  }

  if (!SLUG_PATTERN.test(to)) {
    console.error(
      `Slug đích "${to}" không hợp lệ. Chỉ nhận chữ thường, số và dấu nối.`,
    );
    process.exitCode = 1;
    return;
  }

  const [source, target] = await Promise.all([
    prisma.article.findUnique({
      where: { slug: from },
      select: { id: true, slug: true, title: true, status: true },
    }),
    prisma.article.findUnique({
      where: { slug: to },
      select: { id: true, title: true, status: true },
    }),
  ]);

  if (!source) {
    if (target) {
      console.log(
        `Không có bài nào mang slug "${from}", nhưng "${to}" đã tồn tại ` +
          `(${target.status}) — nhiều khả năng lượt đổi đã chạy rồi.`,
      );
      return;
    }
    console.error(`Không có bài nào mang slug "${from}", và "${to}" cũng trống.`);
    process.exitCode = 1;
    return;
  }

  if (target) {
    console.error(
      `Slug đích "${to}" đã thuộc về một bài khác: "${target.title}" ` +
        `(${target.status}). Dừng lại — ghi tiếp sẽ là hai bài tranh một URL.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Bài   : ${source.title}`);
  console.log(`Trạng : ${source.status}`);
  console.log(`Slug  : ${from}  →  ${to}`);

  if (!write) {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  await prisma.article.update({
    where: { id: source.id },
    data: { slug: to },
  });

  console.log(`\n✓ Đã đổi slug sang "${to}".`);
  console.log(
    "Nhớ kiểm hai thứ: redirect 301 cho slug cũ trong next.config.ts, và " +
      "chạy `npm run search:reindex` để chỉ mục tìm kiếm không còn trỏ slug cũ.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
