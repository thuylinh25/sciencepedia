import { PrismaClient } from "@prisma/client";

import { findDraftArtifacts } from "../src/lib/draft-artifacts";

/**
 * Gỡ dấu trích dẫn của công cụ soạn thảo AI (`【1-03d267】`…) khỏi mọi bài.
 *
 *   npx tsx --env-file-if-exists=.env scripts/strip-draft-artifacts.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/strip-draft-artifacts.ts --write   # ghi
 *
 * Gate (`check-publish`) và form quản trị đã chặn dấu này từ 2026-09-24, nên
 * script chỉ còn việc dọn bài lọt vào TRƯỚC đó. Mẫu lấy từ một chỗ duy nhất,
 * `src/lib/draft-artifacts.ts`. Chỉ xoá đúng dấu và khoảng trắng dính liền
 * phía trước nó, không đụng chữ nào khác.
 */
const prisma = new PrismaClient();

function strip(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const found = findDraftArtifacts(line);
      if (found.length === 0) return line;
      let out = line;
      for (const mark of found) out = out.split(mark).join("");
      // Dấu thường đứng sau dấu chấm câu, cách một khoảng: "câu. 【1-x】" → "câu."
      // Chỉ cắt khoảng trắng cuối ở dòng VỪA gỡ dấu: hai dấu cách cuối dòng
      // ở chỗ khác là ngắt dòng Markdown có chủ ý.
      return out.replace(/[ \t]+$/, "");
    })
    .join("\n");
}

async function main() {
  const write = process.argv.includes("--write");
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, title: true, content: true, contentEn: true },
  });

  let changed = 0;
  for (const article of articles) {
    const found = findDraftArtifacts(`${article.content}\n${article.contentEn ?? ""}`);
    if (found.length === 0) continue;
    changed += 1;
    console.log(`${article.slug}: ${found.length} dấu — ${found.slice(0, 4).join(" ")}`);
    if (!write) continue;

    const content = strip(article.content);
    const contentEn = article.contentEn ? strip(article.contentEn) : article.contentEn;
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          note: "Trước khi gỡ dấu trích dẫn của công cụ soạn thảo",
        },
      }),
      prisma.article.update({ where: { id: article.id }, data: { content, contentEn } }),
    ]);
  }
  console.log(`\n${changed} bài.` + (write ? " Đã ghi (kèm revision)." : " Chưa ghi gì."));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
