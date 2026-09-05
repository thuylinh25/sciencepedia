import { PrismaClient } from "@prisma/client";

/** CHỈ ĐỌC — khảo sát trạng thái kho trước khi chạy pipeline. Xoá sau khi dùng. */
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, parentId: true },
    orderBy: { slug: "asc" },
  });
  const byId = new Map(cats.map((c) => [c.id, c]));
  console.log("=== CATEGORIES ===");
  for (const c of cats) {
    const parent = c.parentId ? byId.get(c.parentId)?.slug : "(gốc)";
    console.log(`${c.slug}\t| ${c.name}\t| parent=${parent}\t| ${c.id}`);
  }

  console.log("\n=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  for (const u of users) console.log(`${u.role}\t${u.email}\t${u.name}\t${u.id}`);

  console.log("\n=== ENTITIES ===");
  const ents = await prisma.entity.findMany({
    select: { slug: true, canonicalName: true, entityType: true },
  });
  console.log(`count=${ents.length}`);
  for (const e of ents) console.log(`${e.slug}\t${e.canonicalName}\t${e.entityType}`);

  console.log("\n=== ARTICLE nang-luong-la-gi ===");
  const a = await prisma.article.findUnique({
    where: { slug: "nang-luong-la-gi" },
    select: { id: true, status: true, title: true, categoryId: true, entityId: true },
  });
  console.log(a ? JSON.stringify(a, null, 2) : "chưa có");

  console.log("\n=== PUBLISHED SLUGS (liên quan) ===");
  const pub = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true, seoTitle: true },
    orderBy: { slug: "asc" },
  });
  console.log(`count=${pub.length}`);
  for (const p of pub) console.log(p.slug);

  console.log("\n=== TAGS ===");
  const tags = await prisma.tag.findMany({ select: { slug: true, name: true } });
  console.log(tags.map((t) => t.slug).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
