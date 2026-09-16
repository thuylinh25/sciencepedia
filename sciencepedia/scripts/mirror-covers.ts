import { PrismaClient } from "@prisma/client";

import { assetKey, assetUrl } from "../src/lib/asset";
import { missingEnv, put } from "./r2-client";

/**
 * Sao ảnh bìa bài viết và ảnh bìa lĩnh vực từ máy chủ ngoài về Cloudflare R2,
 * rồi trỏ cột trong CSDL sang bản trên R2.
 *
 *   npm run covers:mirror              # chạy khô, in bảng dự định
 *   npm run covers:mirror -- --write   # tải về, đẩy lên R2, cập nhật CSDL
 *
 * Xong rồi phải chạy tiếp, theo đúng thứ tự:
 *   npm run images:variants -- --write
 *   npm run assets:upload -- --write
 *
 * ## Vì sao sao về thay vì để nguyên
 *
 * Bìa đang trỏ ra Unsplash / Wikimedia / Supabase, và `next/image` proxy từng
 * tấm qua `/_next/image`. Hạn mức Image Optimization của Vercel đã cạn (HTTP
 * 402), nên mỗi bề rộng chưa được cache là một ô trống. Đưa ảnh về R2 mới dựng
 * sẵn được các cỡ và cho trình duyệt tải thẳng — xem `docs/architecture.md`,
 * mục "Ảnh tĩnh KHÔNG đi qua `/_next/image`".
 *
 * ## Ảnh giữ nguyên, chỉ đổi nơi chứa
 *
 * Script KHÔNG chọn ảnh khác, không cắt, không nén: nó tải đúng tệp đang hiển
 * thị và đặt lại ở R2. Vì thế `coverImageCredit` không bị đụng tới và vẫn đúng
 * — giấy phép Wikimedia/Unsplash cho phép sao chép chừng nào ghi công còn giữ.
 * Đổi ảnh là quyết định biên tập, không phải việc của một lượt dọn hạ tầng.
 *
 * ## Thứ tự bắt buộc: ghi công TRƯỚC, sao ảnh SAU
 *
 * `npm run images:credit` suy ghi công bằng cách đọc tên tệp trong URL
 * `upload.wikimedia.org` rồi hỏi API của Commons. Sao ảnh về R2 xong thì URL
 * không còn dấu vết ấy nữa, và script kia mất đường suy.
 *
 * Bài nào đã có `coverImageCredit` thì không sao cả — `images:credit` bỏ qua
 * chúng. Nhưng với bài MỚI: chạy `images:credit -- --write` trước, rồi mới
 * `covers:mirror -- --write`. Đảo thứ tự là mất ghi công, mà ghi công là điều
 * kiện của giấy phép chứ không phải trang trí.
 *
 * ## Vì sao phải khai User-Agent
 *
 * Wikimedia **trả 403** cho request không khai User-Agent mô tả được — đó là
 * chính sách của họ, không phải sự cố. `scripts/check-covers.ts` đã học bài
 * này một lần: 16 trong 21 ảnh "hỏng" hồi 2026-09-11 thật ra đang sống, chỉ là
 * Node gửi mặc định `User-Agent: node`.
 */

const USER_AGENT =
  "SciencepediaCoverMirror/1.0 (+https://sciencepedia-sciencepedia.vercel.app)";

const TIMEOUT_MS = 60_000;

/** Ảnh bìa lớn nhất chấp nhận tải về. Trên ngưỡng này là ảnh gốc Commons cỡ
 *  bản đồ, tải về chỉ để `images:variants` thu nhỏ ngay — phí cả hai đầu. */
const MAX_BYTES = 25 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const prisma = new PrismaClient();

type Job = {
  table: "Article" | "Category";
  id: string;
  slug: string;
  url: string;
};

async function collect(): Promise<Job[]> {
  const articles = await prisma.article.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, coverImage: true },
    orderBy: { slug: "asc" },
  });
  const categories = await prisma.category.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, coverImage: true },
    orderBy: { slug: "asc" },
  });

  const jobs: Job[] = [];
  for (const row of articles) {
    // Đã nằm trên R2 rồi thì bỏ qua — script chạy lại được nhiều lượt.
    if (!row.coverImage || assetKey(row.coverImage)) continue;
    jobs.push({ table: "Article", id: row.id, slug: row.slug, url: row.coverImage });
  }
  for (const row of categories) {
    if (!row.coverImage || assetKey(row.coverImage)) continue;
    jobs.push({ table: "Category", id: row.id, slug: row.slug, url: row.coverImage });
  }
  return jobs;
}

async function download(url: string): Promise<{ body: Buffer; ext: string }> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXTENSION[type];
  if (!ext) throw new Error(`kiểu ảnh không nhận: ${type || "(trống)"}`);

  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > MAX_BYTES) {
    throw new Error(`${Math.round(body.length / 1024 / 1024)} MB, quá lớn`);
  }
  return { body, ext };
}

async function main() {
  const write = process.argv.includes("--write");

  const missing = missingEnv();
  if (missing.length > 0) {
    console.error(`Thiếu trong .env: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const jobs = await collect();
  console.log(
    write
      ? `=== THỰC THI === ${jobs.length} ảnh bìa\n`
      : `=== CHẠY KHÔ (thêm --write để ghi) === ${jobs.length} ảnh bìa\n`,
  );

  if (jobs.length === 0) {
    console.log("Không còn bìa nào trỏ ra ngoài. Xong.");
    return;
  }

  let done = 0;

  for (const job of jobs) {
    const host = new URL(job.url).hostname;
    process.stdout.write(
      `${job.table.padEnd(8)} ${job.slug.slice(0, 38).padEnd(38)} ${host.padEnd(26)} `,
    );

    if (!write) {
      console.log("→ sẽ sao về R2");
      continue;
    }

    try {
      const { body, ext } = await download(job.url);
      const key = `${job.table === "Article" ? "article" : "category"}/${job.slug}.${ext}`;

      await put(key, body, {
        "content-type": `image/${ext === "jpg" ? "jpeg" : ext}`,
        "cache-control": "public, max-age=86400",
      });

      const url = assetUrl(key);
      const check = await fetch(url, { cache: "no-store" });
      if (!check.ok) throw new Error(`công khai trả HTTP ${check.status}`);

      if (job.table === "Article") {
        await prisma.article.update({ where: { id: job.id }, data: { coverImage: url } });
      } else {
        await prisma.category.update({ where: { id: job.id }, data: { coverImage: url } });
      }

      done += 1;
      console.log(`✓ ${key}  ${Math.round(body.length / 1024)} KB`);
    } catch (error) {
      process.exitCode = 1;
      console.log(`LỖI — ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(
    write
      ? `\n${done}/${jobs.length} đã sao về và cập nhật CSDL.\n` +
          "Tiếp: npm run images:variants -- --write  rồi  npm run assets:upload -- --write"
      : "\nChưa ghi gì. Thêm --write để thực thi.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
