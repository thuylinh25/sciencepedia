/**
 * Khôi phục `Article.updatedAt` bị bộ đếm lượt xem đẩy lên.
 *
 * Trước khi `incrementViews` chuyển sang SQL thô, mỗi lượt đọc chạy
 * `prisma.article.update` và `@updatedAt` nhảy sang "bây giờ" — nên
 * `dateModified` (JSON-LD) và `lastmod` (sitemap) của phần lớn bài là thời
 * điểm có người đọc gần nhất, không phải lần sửa gần nhất.
 *
 * Mốc thay thế: bản Revision mới nhất, hoặc `publishedAt` nếu không có bản nào.
 * Chỉ HẠ `updatedAt` xuống, không bao giờ nâng lên. Cái giá đã biết: lần sửa
 * chỉ đụng bản tiếng Anh không sinh Revision, nên những bài đó sẽ mang mốc sớm
 * hơn thực tế — sai về phía cũ vẫn ít hại hơn một ngày sửa bịa ra.
 *
 *   npx tsx --env-file-if-exists=.env scripts/restore-updated-at.ts          # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/restore-updated-at.ts --write
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const write = process.argv.includes("--write");

async function main() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      publishedAt: true,
      createdAt: true,
      revisions: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let changed = 0;
  for (const article of articles) {
    const anchor =
      article.revisions[0]?.createdAt ??
      article.publishedAt ??
      article.createdAt;
    const latest = new Date(
      Math.max(anchor.getTime(), (article.publishedAt ?? anchor).getTime()),
    );
    if (latest >= article.updatedAt) continue;

    changed++;
    console.log(
      `${article.slug}: ${article.updatedAt.toISOString()} → ${latest.toISOString()}`,
    );
    if (write) {
      // SQL thô: `prisma.article.update` sẽ lại tự đặt `updatedAt` = now()
      await prisma.$executeRaw`UPDATE "Article" SET "updatedAt" = ${latest} WHERE id = ${article.id}`;
    }
  }

  console.log(
    `\n${changed}/${articles.length} bài cần hạ updatedAt.` +
      (write ? " Đã ghi." : " Chạy khô — thêm --write để ghi."),
  );
}

main().finally(() => prisma.$disconnect());
