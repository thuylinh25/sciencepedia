import { PrismaClient } from "@prisma/client";

/**
 * Rà toàn bộ ảnh bìa bài viết: đường dẫn nào còn tải được, đường dẫn nào chết.
 *
 *   npm run check:covers
 *
 * ## Vì sao cần
 *
 * Ngày 2026-09-11, hai bài trong khối "đọc nhiều nhất" hiện ô đen. Thử tay
 * năm ảnh bìa mà trang chủ đang dùng thì **bốn cái trả 404**: hàng dữ liệu
 * vẫn giữ đường dẫn, nhưng tệp không còn trong bucket Supabase.
 *
 *   {"statusCode":"404","error":"not_found",
 *    "message":"Object not found","code":"NoSuchKey"}
 *
 * Kiểu hỏng này không lộ ra ở đâu cả: `next/image` nhận một URL hợp lệ, gọi
 * nó, thất bại, rồi vẽ một ô trống. Không có log, không có lỗi build, và
 * `publish:check` cũng không bắt vì nó kiểm nội dung chứ không gọi ảnh.
 *
 * ## Vì sao chỉ đọc
 *
 * Script này không sửa gì. Nó không biết ảnh đúng phải là ảnh nào — chỉ người
 * biên tập biết. Việc của nó là nói ra danh sách, để lượt sửa sau đó là một
 * quyết định có dữ liệu chứ không phải một cuộc đi tìm.
 */

const prisma = new PrismaClient();

const TIMEOUT_MS = 15000;

async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    /*
     * GET chứ không HEAD: Supabase Storage trả 400 cho HEAD trên đường dẫn
     * public, nên HEAD sẽ báo hỏng cho cả những ảnh đang sống.
     */
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { coverImage: { not: null } },
    select: { slug: true, title: true, coverImage: true, status: true },
    orderBy: { views: "desc" },
  });

  const missingCover = await prisma.article.count({
    where: { coverImage: null, status: "PUBLISHED" },
  });

  console.log(`${articles.length} bài có đường dẫn ảnh bìa.`);
  if (missingCover > 0) {
    console.log(`${missingCover} bài đã xuất bản KHÔNG có ảnh bìa nào.\n`);
  }

  const broken: typeof articles = [];

  for (const article of articles) {
    const result = await probe(article.coverImage as string);
    if (!result.ok) {
      broken.push(article);
      console.log(
        `✗ ${String(result.status).padEnd(4)} ${article.slug}  —  ${article.title.slice(0, 50)}`,
      );
    }
  }

  console.log(
    `\n${broken.length}/${articles.length} ảnh bìa không tải được.`,
  );

  if (broken.length > 0) {
    console.log("\nĐường dẫn hỏng:");
    for (const article of broken) {
      console.log(`  ${article.slug}\n    ${article.coverImage}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
