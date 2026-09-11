import { PrismaClient } from "@prisma/client";

/**
 * Gỡ một dấu backtick lạc trong `20-ngoi-sao-sang-nhat-bau-troi-dem`.
 *
 *   npx tsx scripts/fix-stray-backtick.ts            # in kế hoạch, KHÔNG ghi
 *   npx tsx scripts/fix-stray-backtick.ts --write    # thực thi
 *
 * ## Đây là cái gì
 *
 * Dòng 99 của bài chỉ chứa đúng một ký tự `` ` ``, đứng một mình giữa mục
 * "Điều thú vị" và mục "Đọc thêm". Nó không mở gì và không đóng gì — toàn bài
 * không có khối mã nào, tổng số `` ``` `` bằng 0. Đây là đuôi của một template
 * literal rò từ lượt sinh bài vào cột `content`, và Markdown in nó ra màn hình
 * đúng như một dấu backtick trần.
 *
 * ## Vì sao vẫn đi đường đính chính cho một ký tự
 *
 * Bài đang PUBLISHED. `docs/content/corrections.md` đã phán quyết: mọi phép
 * ghi vào `content` của bài đã xuất bản phải chụp `Revision` trong CÙNG một
 * transaction, nếu không lịch sử lệch khỏi nội dung. Phán quyết đó không kèm
 * ngưỡng "đủ lớn mới cần" — và ngưỡng như thế sẽ tự nở ra theo từng lần dùng.
 *
 * ## Vì sao KHÔNG đụng `factCheck` và `lastVerifiedAt`
 *
 * Lượt này không đối chiếu câu nào với nguồn nào; nó gỡ một ký tự không mang
 * nghĩa. Đặt `lastVerifiedAt` sẽ nói dối rằng bài vừa được rà lại.
 */
const prisma = new PrismaClient();

const SLUG = "20-ngoi-sao-sang-nhat-bau-troi-dem";

/**
 * Khớp DUY NHẤT một chỗ, theo quy tắc của `apply-corrections.ts`.
 *
 * Neo bằng cả dòng trước và dòng sau chứ không tìm mỗi `` "`" ``: một backtick
 * trần xuất hiện trong mọi đoạn mã inline của bài, nên tìm trần là mời sửa
 * nhầm chỗ.
 */
const FIND = "mắt thường**.\n`\n\n## Đọc thêm";
const REPLACE = "mắt thường**.\n\n## Đọc thêm";

async function main() {
  const write = process.argv.includes("--write");

  const article = await prisma.article.findUnique({
    where: { slug: SLUG },
    select: { id: true, title: true, content: true },
  });
  if (!article) throw new Error(`Không thấy bài ${SLUG}`);

  const hits = article.content.split(FIND).length - 1;
  if (hits !== 1) {
    throw new Error(`Chuỗi neo khớp ${hits} chỗ, cần đúng 1 — dừng, không ghi gì.`);
  }

  const next = article.content.replace(FIND, REPLACE);
  console.log(`${SLUG}`);
  console.log(`  ${article.content.length} → ${next.length} ký tự (gỡ ${article.content.length - next.length})`);

  if (!write) {
    console.log("\nChạy khô. Thêm --write để ghi.");
    return;
  }

  await prisma.$transaction([
    prisma.revision.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        note: "Trước khi gỡ dấu backtick lạc ở cuối mục 'Điều thú vị' (rác từ lượt sinh bài, không phải nội dung)",
      },
    }),
    prisma.article.update({
      where: { id: article.id },
      data: { content: next },
    }),
  ]);

  console.log("Đã ghi, kèm Revision chụp bản trước.");
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
