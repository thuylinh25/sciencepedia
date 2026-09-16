import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { assetUrl } from "../src/lib/asset";
import { LADDER, variantKey, type VariantManifest } from "../src/lib/image-variants";
import { listKeys, missingEnv } from "./r2-client";

/**
 * Dựng sẵn các bề rộng của mọi ảnh trên R2, và ghi bản kê để trang biết có
 * những cỡ nào.
 *
 *   npm run images:variants              # chạy khô
 *   npm run images:variants -- --write   # dựng tệp vào `assets/` + ghi bản kê
 *
 * Dựng xong thì `npm run assets:upload -- --write` đẩy lên bucket.
 *
 * ## Vì sao phải tự dựng
 *
 * Ngày 2026-09-16, `/_next/image` trên production trả **HTTP 402
 * `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`**: hạn mức Image Optimization của
 * Vercel đã cạn. Biến thể nào còn trong cache thì vẫn hiện, biến thể mới thì
 * chết — nên lỗi này không lộ đều, nó lộ theo bề rộng màn hình của từng khách.
 *
 * Đổi kho ảnh KHÔNG chữa được: ảnh Wikimedia cũng chết y hệt, mà Wikimedia đâu
 * phải Vercel. Nút thắt nằm ở bộ tối ưu, không ở nơi chứa ảnh. Cách duy nhất
 * không tốn tiền là dựng sẵn các cỡ rồi cho trình duyệt tải thẳng từ R2 —
 * egress của R2 miễn phí, và không cú nào đi qua bộ tối ưu nữa.
 *
 * ## Vì sao WebP chứ không AVIF
 *
 * AVIF nhỏ hơn chừng 20% nhưng `<img srcset>` chỉ trỏ được MỘT định dạng; muốn
 * cả hai thì phải `<picture>` với hai nguồn, tức gấp đôi số tệp và gấp đôi thời
 * gian dựng. WebP chạy trên mọi trình duyệt còn được hỗ trợ, nên nó là lựa chọn
 * không cần đánh đổi gì. Cần AVIF thì thêm sau, đừng thêm trước khi cần.
 *
 * ## Vì sao không phóng to
 *
 * `withoutEnlargement` giữ ảnh nhỏ ở đúng cỡ gốc. Bản kê vì thế chỉ liệt kê
 * những bề rộng THẬT SỰ có, và `srcset` không bịa ra một tệp 1920 px mà bên
 * trong chỉ là 800 px phóng lên — trình duyệt sẽ tải tệp to hơn để nhận đúng
 * ngần ấy điểm ảnh.
 */

/** Chỉ xử lý ảnh gốc; bỏ qua chính các biến thể đã dựng. */
const VARIANT_PATTERN = /-\d+\.webp$/;

const SOURCE_PATTERN = /\.(jpe?g|png|webp)$/i;

async function main() {
  const write = process.argv.includes("--write");

  const missing = missingEnv();
  if (missing.length > 0) {
    console.error(`Thiếu trong .env: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    write
      ? "=== THỰC THI ===\n"
      : "=== CHẠY KHÔ (thêm --write để dựng) ===\n",
  );

  const sources = (await listKeys()).filter(
    (key) => SOURCE_PATTERN.test(key) && !VARIANT_PATTERN.test(key),
  );

  const outDir = path.resolve(process.cwd(), "assets");
  const manifest: VariantManifest = {};
  let failed = false;

  for (const key of sources) {
    process.stdout.write(`${key.padEnd(34)} `);

    try {
      const response = await fetch(assetUrl(key), { cache: "no-store" });
      if (!response.ok) throw new Error(`tải gốc: HTTP ${response.status}`);
      const source = Buffer.from(await response.arrayBuffer());

      const meta = await sharp(source).metadata();
      const origWidth = meta.width ?? 0;
      if (!origWidth) throw new Error("không đọc được bề rộng");

      /*
       * Lấy các nấc nhỏ hơn ảnh gốc, cộng thêm một nấc vừa vượt qua nó — nấc
       * ấy `withoutEnlargement` sẽ ghim lại đúng bề rộng gốc. Không có nó thì
       * ảnh rộng 900 px chỉ còn cỡ lớn nhất là 828, tức tự cắt mất chi tiết
       * mình đang có.
       */
      const widths: number[] = LADDER.filter((w) => w < origWidth);
      widths.push(Math.min(origWidth, LADDER[LADDER.length - 1]));

      const made: number[] = [];
      for (const width of [...new Set(widths)].sort((a, b) => a - b)) {
        const image = sharp(source).resize(width, undefined, {
          withoutEnlargement: true,
        });
        const buffer = await image.webp({ quality: 80 }).toBuffer();
        const actual = (await sharp(buffer).metadata()).width ?? width;
        if (made.includes(actual)) continue; // đã có đúng bề rộng ấy rồi
        made.push(actual);

        if (write) {
          const file = path.join(outDir, ...variantKey(key, actual).split("/"));
          mkdirSync(path.dirname(file), { recursive: true });
          writeFileSync(file, buffer);
        }
      }

      manifest[key] = made;
      console.log(`${String(origWidth).padStart(5)} px gốc → ${made.join(", ")}`);
    } catch (error) {
      failed = true;
      console.log(`LỖI — ${error instanceof Error ? error.message : error}`);
    }
  }

  if (write) {
    const file = path.resolve(process.cwd(), "src", "lib", "image-variants.json");
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`\nBản kê: src/lib/image-variants.json (${Object.keys(manifest).length} ảnh)`);
    console.log("Tiếp: npm run assets:upload -- --write");
  } else {
    console.log("\nChưa dựng tệp nào. Thêm --write để ghi.");
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
