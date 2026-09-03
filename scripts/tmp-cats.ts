import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const arts = await prisma.article.findMany({
    select: { slug: true, category: { select: { slug: true } } },
    orderBy: { slug: "asc" },
  });
  const by: Record<string, string[]> = {};
  for (const a of arts) (by[a.category.slug] ??= []).push(a.slug);
  for (const [c, list] of Object.entries(by).sort()) console.log(`${c} (${list.length}): ${list.join(", ")}`);
}
main().finally(() => prisma.$disconnect());
