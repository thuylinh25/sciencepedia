import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const arts = await prisma.article.findMany({
    select: { slug: true, title: true, status: true, categoryId: true },
    orderBy: { slug: "asc" },
  });
  console.log("=== ARTICLES", arts.length, "===");
  for (const a of arts) console.log(`${a.status}\t${a.slug}\t${a.title}`);

  const srcs = await prisma.source.findMany({
    where: { url: { contains: "thienvanvietnam.org" } },
    select: { url: true, title: true, publisher: true, year: true, tier: true },
  });
  console.log("\n=== VACA SOURCES", srcs.length, "===");
  for (const s of srcs) console.log(`${s.url}\n   ${s.title} | ${s.publisher} | ${s.year} | tier=${s.tier}`);

  const cats = await prisma.category.findMany({
    select: { slug: true, name: true, nameEn: true, parentId: true, id: true },
    orderBy: { slug: "asc" },
  });
  console.log("\n=== CATEGORIES", cats.length, "===");
  for (const c of cats) console.log(`${c.slug}\t${c.name}\tparent=${c.parentId ?? "-"}`);

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, name: true, email: true } });
  console.log("\n=== ADMIN ===", JSON.stringify(admin));

  const tags = await prisma.tag.findMany({ select: { slug: true, name: true, nameEn: true } });
  console.log("\n=== TAGS", tags.length, "===");
  console.log(tags.map(t => t.slug).join(", "));
}
main().finally(() => prisma.$disconnect());
