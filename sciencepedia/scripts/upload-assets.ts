import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { assetUrl } from "../src/lib/asset";
import { HASHED_VARIANT } from "../src/lib/image-variants";
import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Đẩy thư mục dàn `assets/` lên bucket Cloudflare R2.
 *
 *   npm run assets:upload                    # chạy khô, chỉ liệt kê
 *   npm run assets:upload -- --write         # thực thi
 *   npm run assets:upload -- --write covers  # chỉ một nhánh
 *
 * Đường dẫn tương đối trong `assets/` trở thành khoá trong bucket, y nguyên:
 * `assets/covers/x.webp` → `covers/x.webp`.
 *
 * ## Vì sao chạy khô là mặc định
 *
 * Theo lệ của `publish`, `covers:build` và `sky:seed`. Ghi đè một tệp trên R2
 * không có nút hoàn tác: bucket này không bật versioning, nên tệp cũ biến mất
 * ngay khi tệp mới lên. In ra trước, ghi sau.
 */

/**
 * Đệm bao lâu tuỳ tên tệp có mang dấu vân nội dung hay không.
 *
 * Biến thể do `images:variants` dựng mang dấu vân (`sky/m31.3f2a9c1e-640.webp`):
 * ảnh đổi thì tên đổi, tệp cũ không bị ghi đè, nên đệm `immutable` một năm là
 * đúng. Đây là gần như toàn bộ lượt tải ảnh của trang.
 *
 * Mọi tệp khác (bìa gốc `covers/<slug>.webp`…) là tên theo CHỖ: sửa bìa là ghi
 * đè đúng khoá cũ. Đặt một năm ở đó thì bản cũ sống trong trình duyệt lâu hơn
 * trí nhớ người sửa — "máy tôi thấy ảnh mới, máy anh thấy ảnh cũ". Giữ một ngày.
 * Lý do đầy đủ: `HASHED_VARIANT` trong `src/lib/image-variants.ts`.
 */
function cacheControl(key: string): string {
  return HASHED_VARIANT.test(key)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400";
}

/**
 * Đuôi tệp nào không có mặt ở đây thì script bỏ qua, không đẩy.
 *
 * **Cố ý không có `.svg`.** `src/lib/storage.ts` đã chốt: SVG chạy được script
 * nên không đưa lên kho công khai. Ở đây còn một lý do thứ hai — SVG trong
 * `assets/covers/` là BẢN VẼ NGUỒN để sửa bằng mắt, trang chỉ dùng WebP. Đưa
 * nguồn lên kho phát hành là trộn hai thứ khác vai.
 */
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

/** Tệp nào đã lên thì công khai đọc được — kiểm bằng chính URL người dùng gọi. */
async function verify(key: string, size: number): Promise<string> {
  const response = await fetch(assetUrl(key), { cache: "no-store" });
  if (!response.ok) return `✗ công khai trả HTTP ${response.status}`;
  const length = Number(response.headers.get("content-length") ?? "0");
  return length === size ? "✓" : `✗ lệch cỡ: R2 ${length}b, cục bộ ${size}b`;
}

function walk(dir: string, base: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const only = argv.filter((a) => !a.startsWith("--"));

  const missing = missingEnv();
  if (missing.length > 0) {
    console.error(`Thiếu trong .env: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const base = path.resolve(process.cwd(), "assets");
  let keys: string[];
  try {
    keys = walk(base, base).sort();
  } catch {
    console.error(
      "Không có thư mục `assets/`. Chạy `npm run images:variants` hoặc `covers:build` trước.",
    );
    process.exitCode = 1;
    return;
  }
  if (only.length > 0) {
    keys = keys.filter((key) => only.some((prefix) => key.startsWith(prefix)));
  }

  console.log(
    write
      ? `=== THỰC THI === bucket ${BUCKET}\n`
      : `=== CHẠY KHÔ (thêm --write để ghi) === bucket ${BUCKET}\n`,
  );

  let done = 0;
  let skipped = 0;

  for (const key of keys) {
    const file = path.join(base, ...key.split("/"));
    const body = readFileSync(file);
    const size = statSync(file).size;
    const contentType = MIME[path.extname(key).toLowerCase()];

    if (!contentType) {
      skipped += 1;
      const reason =
        path.extname(key).toLowerCase() === ".svg"
          ? "SVG là bản vẽ nguồn, không đẩy lên kho công khai"
          : "không biết kiểu MIME";
      console.log(`${key.padEnd(52)} BỎ QUA — ${reason}`);
      continue;
    }

    const kb = String(Math.round(size / 1024)).padStart(5);
    process.stdout.write(`${key.padEnd(52)} ${kb} KB  `);

    if (!write) {
      console.log("→ sẽ đẩy");
      continue;
    }

    try {
      await put(key, body, {
        "content-type": contentType,
        "cache-control": cacheControl(key),
      });
      const result = await verify(key, size);
      if (result === "✓") done += 1;
      else process.exitCode = 1;
      console.log(result);
    } catch (error) {
      process.exitCode = 1;
      console.log(`LỖI — ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(
    write
      ? `\n${done} tệp đã lên và kiểm xong, ${skipped} bỏ qua.`
      : `\n${keys.length - skipped} tệp chờ đẩy, ${skipped} bỏ qua. Thêm --write để ghi.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
