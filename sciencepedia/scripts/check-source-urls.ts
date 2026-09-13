import { prisma } from "../src/lib/prisma";

/**
 * Rà URL của mọi hàng `Source`: còn sống, chuyển hướng đi đâu, hay đã chết.
 *
 *   npx tsx scripts/check-source-urls.ts            # in báo cáo
 *   npx tsx scripts/check-source-urls.ts --json     # xuất JSON để script sửa dùng
 *
 * ## Vì sao không dùng lại `isAlive()` của check-publish.ts
 *
 * Hàm đó trả về một boolean và đã bị ghi nhận là sai ở corrections.md: nó dùng
 * `redirect: "follow"` rồi xét `response.ok`, nên một URL chết chuyển hướng về
 * trang chủ vẫn được tính là còn sống.
 *
 * Ở đây phân biệt bốn kết cục khác nhau, vì cách xử lý mỗi loại một khác:
 *
 *   `ok`        — 200, không chuyển hướng. Không phải làm gì.
 *   `redirect`  — 200 nhưng đích cuối khác URL đã lưu. SỬA ĐƯỢC TỰ ĐỘNG: ghi
 *                 đích cuối vào CSDL để người đọc không phải đi qua một chặng
 *                 thừa, và để `check-publish` đếm đúng.
 *   `blocked`   — 401/403/405/429. Máy chủ chặn bot, KHÔNG phải link chết.
 *                 usgs.gov và who.int đều thế. Sửa những link này là sửa nhầm.
 *   `dead`      — 404/410, hoặc không nối được. Phải thay nguồn bằng tay.
 *
 * Phân biệt `blocked` với `dead` là toàn bộ giá trị của script này. Gộp chúng
 * lại thì báo cáo nói có 65 link hỏng trong khi thực tế phần lớn vẫn mở được
 * bằng trình duyệt.
 */

type Verdict = "ok" | "redirect" | "blocked" | "dead";

type Row = {
  url: string;
  slugs: string[];
  status: number;
  final: string;
  verdict: Verdict;
};

/** Trình duyệt thật. Nhiều máy chủ từ chối thẳng khi thiếu User-Agent. */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
} as const;

/** Bỏ tham số theo dõi và dấu `/` thừa trước khi so hai URL. */
function canonical(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

async function probe(url: string): Promise<{ status: number; final: string }> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    return { status: response.status, final: response.url || url };
  } catch {
    return { status: 0, final: url };
  }
}

function judge(url: string, status: number, final: string): Verdict {
  if ([401, 403, 405, 429].includes(status)) return "blocked";
  if (status === 0 || status >= 400) return "dead";
  return canonical(final) === canonical(url) ? "ok" : "redirect";
}

async function main() {
  const asJson = process.argv.includes("--json");

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

  if (!asJson) {
    console.log(`${byUrl.size} URL duy nhất trên ${sources.length} hàng nguồn\n`);
  }

  const rows: Row[] = [];
  /* Tám luồng song song. Tuần tự thì 212 URL × tối đa 30 giây là quá lâu để
     ai đó thực sự chạy phép rà này, và một phép rà không ai chạy thì bằng
     không tồn tại. */
  const urls = [...byUrl.keys()];
  const LANES = 8;

  await Promise.all(
    Array.from({ length: LANES }, async (_, lane) => {
      for (let i = lane; i < urls.length; i += LANES) {
        const url = urls[i];
        const { status, final } = await probe(url);
        rows.push({
          url,
          slugs: byUrl.get(url)!,
          status,
          final,
          verdict: judge(url, status, final),
        });
        if (!asJson) process.stdout.write(".");
      }
    }),
  );

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const group = (verdict: Verdict) => rows.filter((row) => row.verdict === verdict);

  console.log(
    `\n\nOK: ${group("ok").length} · Chuyển hướng: ${group("redirect").length}` +
      ` · Bị chặn bot: ${group("blocked").length} · Chết: ${group("dead").length}`,
  );

  for (const [verdict, title] of [
    ["dead", "CHẾT — phải thay nguồn bằng tay"],
    ["redirect", "CHUYỂN HƯỚNG — sửa được tự động"],
    ["blocked", "BỊ CHẶN BOT — không phải link chết, đừng sửa"],
  ] as [Verdict, string][]) {
    const list = group(verdict);
    if (!list.length) continue;
    console.log(`\n===== ${title} (${list.length}) =====\n`);
    for (const row of list) {
      console.log(`${row.status || "—"}  ${row.url}`);
      if (verdict === "redirect") console.log(`     → ${row.final}`);
      console.log(`     ${row.slugs.join(", ")}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
