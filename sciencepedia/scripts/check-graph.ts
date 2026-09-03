import { PrismaClient } from "@prisma/client";

/**
 * Kiểm tra sức khoẻ knowledge graph — CHỈ ĐỌC.
 *   npm run graph:check
 *
 * Script này cố tình không có bất kỳ lệnh ghi nào (create/update/delete/
 * executeRaw). Nó tồn tại để trả lời một câu hỏi: graph đã có dữ liệu chưa,
 * và bao nhiêu bài đã được gắn vào graph. Giữ nguyên tính chất chỉ-đọc —
 * permission rule cho phép chạy script này dựa trên đúng giả định đó.
 */
const prisma = new PrismaClient();

async function main() {
  const [entities, relationships, articles, linkedArticles] = await Promise.all(
    [
      prisma.entity.count(),
      prisma.relationship.count(),
      prisma.article.count(),
      prisma.article.count({ where: { entityId: { not: null } } }),
    ],
  );

  console.log("=== KNOWLEDGE GRAPH ===");
  console.log(`Entity:            ${entities}`);
  console.log(`Relationship:      ${relationships}`);
  console.log(`Article:           ${articles}`);
  console.log(`Article có entity: ${linkedArticles} / ${articles}`);

  if (entities === 0) {
    console.log(
      "\nGraph RỖNG. Learning path chưa có dữ liệu để dựng — cần xây graph trước.",
    );
    return;
  }

  const byEntityType = await prisma.entity.groupBy({
    by: ["entityType"],
    _count: { _all: true },
    orderBy: { _count: { entityType: "desc" } },
  });
  console.log("\n--- Entity theo loại ---");
  for (const row of byEntityType) {
    console.log(`${row.entityType.padEnd(12)} ${row._count._all}`);
  }

  if (relationships === 0) {
    console.log("\nKhông có cạnh nào. Graph là tập điểm rời rạc.");
    return;
  }

  const byRelType = await prisma.relationship.groupBy({
    by: ["relType"],
    _count: { _all: true },
    orderBy: { _count: { relType: "desc" } },
  });
  console.log("\n--- Cạnh theo loại quan hệ ---");
  for (const row of byRelType) {
    console.log(`${row.relType.padEnd(16)} ${row._count._all}`);
  }

  const prereq = byRelType.find((r) => r.relType === "PREREQUISITE_OF");
  console.log(
    `\nCạnh PREREQUISITE_OF: ${prereq?._count._all ?? 0} — đây là loại cạnh mà learning path dựa vào.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/** Kiểm tra phân bố lượt đọc — chỉ đọc. Gọi riêng bằng: npm run graph:check -- views */
export async function checkViews() {
  const client = new PrismaClient();
  try {
    const rows = await client.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, views: true },
      orderBy: { views: "desc" },
      take: 8,
    });
    const total = rows.reduce((sum, r) => sum + r.views, 0);
    console.log("\n=== LƯỢT ĐỌC (top 8 bài published) ===");
    for (const r of rows) console.log(`${String(r.views).padStart(6)}  ${r.slug}`);
    console.log(`Tổng của 8 bài đầu: ${total}`);
  } finally {
    await client.$disconnect();
  }
}
