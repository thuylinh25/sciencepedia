import { PrismaClient } from "@prisma/client";

import { extractGlossaryKeys } from "../src/lib/glossary";

/**
 * Rà thuật ngữ trong bài đã xuất bản — CHỈ ĐỌC.
 *   npm run glossary:check
 *
 * Trả lời một câu hỏi: `[[...]]` nào trong kho đang không có mục từ, tức đang
 * hiện như chữ thường thay vì tooltip. Xếp theo số bài dùng, để biên tập viết
 * mục từ cho khoá được dùng nhiều nhất trước.
 *
 * Không có lệnh ghi nào, và phải giữ như vậy: định nghĩa là nội dung khoa học,
 * đi qua science-editor, không được script sinh ra.
 */
const prisma = new PrismaClient();

async function main() {
  const [articles, terms] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, content: true, contentEn: true },
    }),
    prisma.glossaryTerm.findMany({ select: { slug: true, aliases: true } }),
  ]);

  const known = new Set(terms.flatMap((term) => [term.slug, ...term.aliases]));
  const missing = new Map<string, string[]>();
  let used = 0;

  for (const article of articles) {
    const keys = extractGlossaryKeys(`${article.content}\n${article.contentEn ?? ""}`);
    if (keys.length > 0) used += 1;
    for (const key of keys) {
      if (known.has(key)) continue;
      missing.set(key, [...(missing.get(key) ?? []), article.slug]);
    }
  }

  console.log("=== THUẬT NGỮ ===");
  console.log(`Mục từ:                 ${terms.length}`);
  console.log(`Bài có [[...]]:         ${used} / ${articles.length}`);
  console.log(`Khoá chưa có mục từ:    ${missing.size}`);

  const ranked = [...missing.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [key, slugs] of ranked) {
    console.log(`\n  ${key}  (${slugs.length} bài)`);
    for (const slug of slugs.slice(0, 5)) console.log(`    - ${slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
