import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/lib/utils";

/**
 * Chuẩn hoá slug của TOÀN BỘ bài về `slugify(title)`, và ghi slug cũ vào
 * `ArticleSlugRedirect` để URL cũ trả 301 thay vì 404.
 *
 *   npm run slugs:rename            # in kế hoạch, KHÔNG ghi
 *   npm run slugs:rename -- --write # thực thi
 *
 * ## Vì sao mặc định không ghi
 *
 * Đây là thao tác hàng loạt trên URL công khai — cùng loại rủi ro mà
 * `rename-slug.ts` và `publish.ts` đã chốt quy ước: in kế hoạch trước, ghi
 * sau. Một lượt chạy nhầm đổi hàng chục địa chỉ cùng lúc.
 *
 * ## Vì sao kiểm trùng trước khi vào transaction
 *
 * `Article.slug` là unique. Nếu hai bài cùng slugify về một slug, hoặc slug
 * đích đang thuộc về bài khác, transaction sẽ chết giữa chừng. Kiểm hết
 * trước rồi mới ghi, để không rơi vào trạng thái đổi được một nửa.
 */

async function main() {
  const write = process.argv.slice(2).includes("--write");

  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { id: "asc" },
  });

  const changes = articles
    .map((article) => ({ ...article, nextSlug: slugify(article.title) }))
    .filter((article) => article.slug !== article.nextSlug);

  // Hai bài slugify về cùng một slug: dừng, vì slug là unique.
  const targetSlugs = new Map<string, string>();
  for (const article of articles) {
    const nextSlug = slugify(article.title);
    const previous = targetSlugs.get(nextSlug);
    if (previous && previous !== article.id) {
      throw new Error(`Slug đích bị trùng: ${nextSlug}`);
    }
    targetSlugs.set(nextSlug, article.id);
  }

  // Slug đích đang là slug hiện tại của một bài khác: cũng dừng.
  const currentSlugs = new Map(articles.map((a) => [a.slug, a.id]));
  for (const change of changes) {
    const owner = currentSlugs.get(change.nextSlug);
    if (owner && owner !== change.id) {
      throw new Error(
        `Slug đích ${change.nextSlug} đang thuộc bài ${owner}; không đổi dữ liệu`,
      );
    }
  }

  if (changes.length === 0) {
    console.log("Không có slug nào lệch khỏi slugify(title).");
    return;
  }

  for (const change of changes) {
    console.log(`${change.slug}  →  ${change.nextSlug}`);
  }
  console.log(`\n${changes.length} slug sẽ đổi.`);

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      for (const change of changes) {
        await tx.articleSlugRedirect.upsert({
          where: { oldSlug: change.slug },
          create: { oldSlug: change.slug, articleId: change.id },
          update: { articleId: change.id },
        });
        await tx.article.update({
          where: { id: change.id },
          data: { slug: change.nextSlug },
        });
      }
    },
    { maxWait: 30_000, timeout: 120_000 },
  );

  console.log(`\n✓ Đã đổi ${changes.length} slug và tạo redirect tương ứng.`);
  console.log("Chạy `npm run search:reindex` để chỉ mục không còn trỏ slug cũ.");
}

main()
  .catch((error) => {
    console.error("[rename-article-slugs]", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
