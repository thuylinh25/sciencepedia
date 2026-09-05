import { PrismaClient } from "@prisma/client";

/**
 * Liệt kê bài đã xuất bản kể từ một mốc thời gian — CHỈ ĐỌC.
 *
 *   npm run report:published -- --hours 6
 *   npm run report:published -- --since 2026-09-05T13:00:00Z
 *   npm run report:published -- --hours 6 --json
 *
 * ## Vì sao đọc CSDL chứ không đọc báo cáo của agent
 *
 * Báo cáo là lời agent tự khai, và một lượt chạy bị cắt giữa chừng thì không
 * kịp khai gì cả. `publishedAt` thì do `scripts/publish.ts` ghi, tức là do
 * đường ghi duy nhất có gate ghi ra — nó phản ánh chuyện đã thật sự xảy ra,
 * kể cả khi tiến trình chết ngay sau đó.
 *
 * Dùng cho bước thông báo trong workflow, và chạy tay được khi muốn biết
 * "hôm qua ra được mấy bài".
 */

const prisma = new PrismaClient();

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const sinceRaw = flagValue(argv, "since");
  const hours = Number(flagValue(argv, "hours") ?? 6);

  const since = sinceRaw ? new Date(sinceRaw) : new Date(Date.now() - hours * 3600 * 1000);
  if (Number.isNaN(since.getTime())) {
    console.error(`Mốc thời gian không hợp lệ: ${sinceRaw}`);
    process.exitCode = 1;
    return;
  }

  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { publishedAt: "asc" },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          since: since.toISOString(),
          count: rows.length,
          articles: rows.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category?.slug ?? null,
            url: base ? `${base}/vi/articles/${r.slug}` : null,
            publishedAt: r.publishedAt?.toISOString() ?? null,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (rows.length === 0) {
    console.log(`Không có bài nào xuất bản kể từ ${since.toISOString()}.`);
    return;
  }

  console.log(`${rows.length} bài mới kể từ ${since.toISOString()}:\n`);
  for (const r of rows) {
    const url = base ? `${base}/vi/articles/${r.slug}` : `/vi/articles/${r.slug}`;
    console.log(`- **${r.title}** — ${r.category?.name ?? "chưa xếp danh mục"}`);
    console.log(`  ${url}`);
    if (r.summary) console.log(`  ${r.summary.slice(0, 160)}${r.summary.length > 160 ? "…" : ""}`);
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
