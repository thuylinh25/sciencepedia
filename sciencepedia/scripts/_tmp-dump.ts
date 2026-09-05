// CHỈ ĐỌC — dump nội dung bài PUBLISHED ra file để phân tích ngoại tuyến.
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
const prisma = new PrismaClient();
const OUT = process.env.DUMP_DIR!;
async function main() {
  const arts = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true, summary: true, content: true, entityId: true },
    orderBy: { slug: "asc" },
  });
  for (const a of arts) {
    writeFileSync(`${OUT}/${a.slug}.md`, a.content, "utf8");
  }
  writeFileSync(`${OUT}/_index.json`, JSON.stringify(arts.map(a => ({
    slug: a.slug, title: a.title, summary: a.summary, entityId: a.entityId, len: a.content.length
  })), null, 2), "utf8");
  console.log("dumped", arts.length);
}
main().finally(() => prisma.$disconnect());
