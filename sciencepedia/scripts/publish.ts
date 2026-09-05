import { execFileSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

/**
 * Đường DUY NHẤT để đưa một bài sang PUBLISHED.
 *
 *   npm run publish -- --slug <slug>
 *   npm run publish -- --slug <slug> --note "lý do"
 *
 * ## Vì sao gate nằm trong đây chứ không chỉ nằm trong hook
 *
 * `scripts/pipeline.ts` có hook chặn agent chạy lệnh ghi thẳng vào CSDL. Hook
 * đó tốt nhưng không kín: agent viết được một file rồi chạy nó, và không có
 * cách nào chặn hết mọi hình dạng của một lệnh ghi mà vẫn để agent làm việc.
 *
 * Nên bất biến thật phải nằm ở đây — trong chính đường ghi. Hook làm việc của
 * hàng rào: nâng chi phí của đường vòng và bắt được lối đi thẳng. Script này
 * làm việc của cái khoá: không qua `check-publish` thì không có gì đổi state,
 * kể cả khi hook thủng, kể cả khi người gọi là con người.
 *
 * ## Vì sao gọi check-publish qua tiến trình con
 *
 * Import hàm từ `check-publish.ts` thì nhanh hơn, nhưng nó tạo ra hai đường
 * vào cùng một logic, và đường thứ hai sẽ trôi. Gọi đúng cái CLI mà con người
 * cũng chạy đảm bảo hai bên luôn thấy cùng một kết quả — và hợp đồng JSON đã
 * được ghi rõ ở đầu `check-publish.ts`.
 *
 * CHỈ đổi `status`, `publishedAt` và ghi một `Revision`. Không sửa nội dung,
 * không sửa metadata: nếu bài chưa đạt thì việc phải làm là sửa bài, không
 * phải nới gate.
 */
const prisma = new PrismaClient();

type CheckResult = {
  ok: boolean;
  error?: string;
  articles: {
    slug: string;
    status: string;
    ok: boolean;
    blocks: string[];
    warns: string[];
  }[];
};

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

/**
 * Chạy gate. Ném lỗi nếu không đọc được kết quả.
 *
 * `check-publish` trả exit code 1 khi có bài bị chặn, nên `execFileSync` sẽ
 * ném — đó là đường chạy BÌNH THƯỜNG ở đây, không phải sự cố. Bắt lỗi rồi đọc
 * stdout kèm theo, vì stdout vẫn chứa JSON đầy đủ.
 */
function runGate(slug: string): CheckResult {
  const args = ["tsx", "--env-file-if-exists=.env", "scripts/check-publish.ts", "--json", "--slug", slug];
  let stdout: string;
  try {
    stdout = execFileSync("npx", args, { encoding: "utf8", shell: process.platform === "win32" });
  } catch (error) {
    const failure = error as { stdout?: string };
    if (!failure.stdout) throw error;
    stdout = failure.stdout;
  }
  return JSON.parse(stdout) as CheckResult;
}

async function main() {
  const argv = process.argv.slice(2);
  const slug = flagValue(argv, "slug");
  const note = flagValue(argv, "note");

  if (!slug) {
    console.error("Thiếu --slug. Ví dụ: npm run publish -- --slug ho-den-la-gi");
    process.exitCode = 1;
    return;
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, content: true, status: true, publishedAt: true },
  });

  if (!article) {
    console.error(`Không có bài nào mang slug "${slug}".`);
    process.exitCode = 1;
    return;
  }

  if (article.status === "PUBLISHED") {
    console.log(`"${slug}" đã ở trạng thái PUBLISHED. Không làm gì.`);
    return;
  }

  const result = runGate(slug);
  const row = result.articles?.[0];

  if (!row) {
    console.error(`Gate không trả về kết quả cho "${slug}": ${result.error ?? "không rõ"}`);
    process.exitCode = 1;
    return;
  }

  if (!row.ok) {
    console.error(`✗ "${slug}" chưa đạt điều kiện xuất bản — KHÔNG đổi gì.\n`);
    for (const block of row.blocks) console.error(`   CHẶN  ${block}`);
    for (const warn of row.warns) console.error(`   CẢNH  ${warn}`);
    console.error("\nSửa những mục CHẶN ở trên rồi chạy lại.");
    process.exitCode = 1;
    return;
  }

  for (const warn of row.warns) console.log(`   CẢNH  ${warn}`);

  // Revision ghi TRƯỚC khi đổi state, và ghi nguyên văn nội dung tại thời điểm
  // duyệt. Đây là bản chụp để sau này đối chiếu "bài được duyệt trông thế nào",
  // nên nó phải là nội dung đã qua gate, không phải nội dung sau lần sửa kế tiếp.
  await prisma.$transaction([
    prisma.revision.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        note: note ?? `Xuất bản qua publish.ts — qua gate lúc ${new Date().toISOString()}`,
      },
    }),
    prisma.article.update({
      where: { id: article.id },
      data: {
        status: "PUBLISHED",
        // Giữ nguyên publishedAt nếu bài từng publish rồi bị rút về nháp:
        // ngày xuất bản đầu tiên là dữ kiện, không phải trường tiện tay ghi đè.
        publishedAt: article.publishedAt ?? new Date(),
      },
    }),
  ]);

  console.log(`✓ "${slug}" → PUBLISHED (đã ghi revision)`);
  console.log("Nhớ chạy `npm run search:reindex` nếu Meilisearch đang bật.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
