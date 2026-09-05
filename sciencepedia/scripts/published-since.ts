import { pathToFileURL } from "node:url";

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

/**
 * Bài đã publish kể từ `since`. Export để bước thông báo dùng CHUNG một định
 * nghĩa "bài mới" với bước tóm tắt — hai chỗ đếm khác nhau thì sớm muộn sẽ
 * báo hai con số khác nhau và không ai biết tin cái nào.
 */
export async function publishedSince(since: Date) {
  return prisma.article.findMany({
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
}

/** Kiểu hàng `publishedSince()` trả về — khai một lần, dùng ở cả hai nơi. */
export type PublishedRow = Awaited<ReturnType<typeof publishedSince>>[number];

/**
 * Dựng đoạn markdown mô tả các bài mới. Export vì bước tóm tắt trên Actions và
 * bước báo Telegram phải nói CÙNG một nội dung — hai nơi tự định dạng thì sớm
 * muộn chúng mô tả khác nhau và không ai biết bản nào đúng.
 */
export function toMarkdown(rows: PublishedRow[], since: Date, base: string): string {
  if (rows.length === 0) return `Không có bài nào xuất bản kể từ ${since.toISOString()}.`;

  const out = [`${rows.length} bài mới kể từ ${since.toISOString()}:`, ""];
  for (const r of rows) {
    const url = base ? `${base}/vi/articles/${r.slug}` : `/vi/articles/${r.slug}`;
    out.push(`- **${r.title}** — ${r.category?.name ?? "chưa xếp danh mục"}`);
    out.push(`  ${url}`);
    if (r.summary) out.push(`  ${r.summary.slice(0, 160)}${r.summary.length > 160 ? "…" : ""}`);
    out.push("");
  }
  return out.join("\n");
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

  const rows = await publishedSince(since);

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

  console.log(toMarkdown(rows, since, base));
}

/* Cùng khuôn với check-publish.ts: file này vừa là lệnh chạy tay vừa là module
   được import. Không có chốt này thì mỗi lần import kéo theo một lượt in danh
   sách vào giữa output của người gọi. */
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
