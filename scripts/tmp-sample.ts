import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const a = await prisma.article.findUnique({
    where: { slug: "dinh-luat-kepler" },
    include: { sources: true, tags: { include: { tag: true } }, category: true },
  });
  if (!a) return console.log("not found");
  const { content, ...rest } = a;
  console.log(JSON.stringify(rest, null, 2));
  console.log("\n===== CONTENT =====\n");
  console.log(content);
}
main().finally(() => prisma.$disconnect());
