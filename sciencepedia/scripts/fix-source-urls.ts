import { PrismaClient } from "@prisma/client";

/**
 * Ghi URL đích cuối vào những hàng `Source` đang trỏ qua một chuyển hướng.
 *
 *   npx tsx scripts/fix-source-urls.ts            # in kế hoạch, KHÔNG ghi
 *   npx tsx scripts/fix-source-urls.ts --write    # thực thi
 *
 * Đầu vào là kết quả của `scripts/check-source-urls.ts --json`, chạy lại ngay
 * trong file này để kế hoạch luôn khớp trạng thái mạng hiện tại.
 *
 * ## Hai loại chuyển hướng KHÔNG được sửa
 *
 * Đây là phần đáng đọc nhất của file. Một script sửa hết mọi chuyển hướng sẽ
 * làm hỏng nhiều hơn nó chữa.
 *
 * **1. doi.org — 28 hàng.** DOI ĐƯỢC THIẾT KẾ để chuyển hướng: nó là định
 * danh bền, còn URL nhà xuất bản là thứ sẽ mục. Thay DOI bằng đích hiện tại
 * của nó là vứt đúng cái lớp bền vững đi và giữ lại cái lớp dễ hỏng — ngược
 * hoàn toàn với mục đích. Một bài báo đổi nhà xuất bản thì DOI vẫn đúng còn
 * URL kia chết.
 *
 * **2. Trang chặn bot — 2 hàng NCBI.** `ncbi.nlm.nih.gov/books/...` chuyển
 * hướng tới `misuse.ncbi.nlm.nih.gov/error/abuse.shtml`. Đó không phải địa
 * chỉ mới của tài liệu, đó là lời từ chối. Ghi nó vào CSDL là thay một nguồn
 * đang sống bằng một trang báo lỗi.
 *
 * Quy tắc chung rút ra: chuyển hướng chỉ đáng ghi lại khi nó là một lần DI
 * DỜI THẬT của tài liệu. Chuyển hướng do hạ tầng (định danh bền, cân bằng
 * tải, chặn bot, tường đăng nhập) thì URL cũ mới là URL đúng.
 */
const prisma = new PrismaClient();

/** Host mà chuyển hướng KHÔNG bao giờ có nghĩa là "tài liệu đã dời". */
const NEVER_REWRITE = [
  /^https?:\/\/(dx\.)?doi\.org\//i,
  /^https?:\/\/([^/]*\.)?ncbi\.nlm\.nih\.gov\//i,
];

type Row = { url: string; final: string; verdict: string; slugs: string[] };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
} as const;

function canonical(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

async function probe(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    return response.url || url;
  } catch {
    return null;
  }
}

async function main() {
  const write = process.argv.includes("--write");

  const sources = await prisma.source.findMany({
    where: { url: { not: null } },
    select: { url: true, article: { select: { slug: true } } },
  });

  const byUrl = new Map<string, string[]>();
  for (const source of sources) {
    const list = byUrl.get(source.url!) ?? [];
    list.push(source.article.slug);
    byUrl.set(source.url!, list);
  }

  const urls = [...byUrl.keys()].filter(
    (url) => !NEVER_REWRITE.some((pattern) => pattern.test(url)),
  );

  console.log(
    `${byUrl.size} URL, ${byUrl.size - urls.length} bỏ qua theo NEVER_REWRITE, ` +
      `${urls.length} đem đi kiểm…\n`,
  );

  const plan: Row[] = [];
  const LANES = 8;
  await Promise.all(
    Array.from({ length: LANES }, async (_, lane) => {
      for (let i = lane; i < urls.length; i += LANES) {
        const url = urls[i];
        const final = await probe(url);
        if (final && canonical(final) !== canonical(url)) {
          plan.push({ url, final, verdict: "redirect", slugs: byUrl.get(url)! });
        }
        process.stdout.write(".");
      }
    }),
  );

  console.log(`\n\n${plan.length} hàng sẽ đổi:\n`);
  for (const row of plan) {
    console.log(row.url);
    console.log(`   → ${row.final}`);
    console.log(`   ${row.slugs.join(", ")}\n`);
  }

  if (!write) {
    console.log("Chạy khô. Thêm --write để ghi.");
    return;
  }

  let changed = 0;
  for (const row of plan) {
    const result = await prisma.source.updateMany({
      where: { url: row.url },
      data: { url: row.final },
    });
    changed += result.count;
  }
  console.log(`Đã ghi ${changed} hàng.`);
}

main()
  .catch((error) => {
    console.error((error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
