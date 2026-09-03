import { PrismaClient } from "@prisma/client";

import { articlesIndex, ensureIndex, toDocument } from "../src/lib/meili";

/**
 * Nạp lại toàn bộ bài viết đã xuất bản vào Meilisearch.
 *   npm run search:reindex
 */
const prisma = new PrismaClient();

async function main() {
  if (!process.env.MEILISEARCH_HOST) {
    throw new Error("Chưa đặt MEILISEARCH_HOST trong .env");
  }

  console.log("→ Cấu hình index…");
  await ensureIndex();

  const index = articlesIndex();
  await index.deleteAllDocuments();

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: { select: { slug: true, name: true, nameEn: true } },
      tags: {
        select: { tag: { select: { slug: true, name: true, nameEn: true } } },
      },
    },
  });

  const BATCH = 200;
  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH);
    await index.addDocuments(batch.map(toDocument));
    console.log(`  ✓ ${Math.min(i + BATCH, articles.length)}/${articles.length}`);
  }

  console.log(`→ Xong: ${articles.length} bài viết.`);
}

main()
  .catch((error) => {
    console.error("Reindex thất bại:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
