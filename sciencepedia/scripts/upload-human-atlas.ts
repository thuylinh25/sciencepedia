import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { BUCKET, missingEnv, put } from "./r2-client";

/**
 * Đẩy dữ liệu giải phẫu của Bản đồ cơ thể người lên Cloudflare R2.
 *
 *   npx tsx --env-file-if-exists=.env scripts/upload-human-atlas.ts --source <dir>
 *   npx tsx --env-file-if-exists=.env scripts/upload-human-atlas.ts --source <dir> --write
 *
 * `<dir>` là thư mục `public/models` của repo Human Atlas
 * (https://github.com/ashemag/human-atlas): `atlas.json` + 15 khối
 * `body-N.bin` / `body-N.bin.gz`.
 *
 * ## Vì sao không để trong `public/`, và không commit vào repo
 *
 * ~90 MB nhị phân (một nửa là bản gzip). Commit vào git thì mỗi lần clone,
 * mỗi lượt OneDrive đồng bộ và mỗi bản deploy Vercel đều kéo theo; phát từ
 * Vercel thì mỗi người mở atlas tiêu ~33 MB băng thông của Vercel. R2 không
 * tính phí egress — cùng lý do với ảnh tĩnh (`src/lib/asset.ts`).
 *
 * ## Vì sao khoá có dấu vân nội dung
 *
 * Khoá là `human-atlas/<phiên bản>-<sha256 10 ký tự>/…`. Dữ liệu đổi thì
 * dấu vân đổi, khoá đổi, tệp cũ không bị ghi đè — nên đệm `immutable` một năm
 * là an toàn, và người mở atlas lần hai không tải lại 33 MB. Đổi dữ liệu xong
 * phải sửa `HUMAN_ATLAS_DATA_VERSION` trong `src/lib/human-atlas/assets.ts`
 * theo đúng dòng script in ra — đẩy tệp TRƯỚC, đổi hằng số SAU.
 *
 * `ATTRIBUTION.md` đi kèm dữ liệu: CC BY 4.0 đòi ghi công đi theo bản phân
 * phối lại, không chỉ nằm trên trang.
 */

const MIME: Record<string, string> = {
  ".json": "application/json",
  ".bin": "application/octet-stream",
  ".gz": "application/gzip",
  ".md": "text/markdown; charset=utf-8",
};

function arg(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function verify(url: string, size: number): Promise<string> {
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (!response.ok) return `✗ công khai trả HTTP ${response.status}`;
  const length = Number(response.headers.get("content-length") ?? "0");
  return length === size ? "✓" : `✗ lệch cỡ: R2 ${length}b, cục bộ ${size}b`;
}

async function main() {
  const write = process.argv.includes("--write");
  const source = arg("--source");
  if (!source) {
    console.error("Thiếu --source <thư mục public/models của Human Atlas>");
    process.exitCode = 1;
    return;
  }

  const missing = missingEnv();
  if (write && missing.length > 0) {
    console.error(`Thiếu trong .env: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const dir = path.resolve(source);
  const names = readdirSync(dir)
    .filter((name) => /^(atlas\.json|body-\d+\.bin(\.gz)?)$/.test(name))
    .sort();
  if (!names.includes("atlas.json")) {
    console.error(`Không thấy atlas.json trong ${dir}`);
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(readFileSync(path.join(dir, "atlas.json"), "utf8")) as {
    version: string;
  };

  // Dấu vân tính trên nội dung mọi tệp, theo thứ tự tên — đổi một byte là đổi khoá.
  const hash = createHash("sha256");
  const files = names.map((name) => {
    const body = readFileSync(path.join(dir, name));
    hash.update(name).update(body);
    return { name, body };
  });

  // atlas.json 1,3 MB nhưng gzip còn ~220 KB: đẩy thêm bản nén, trình duyệt tự giải.
  const { gzipSync } = await import("node:zlib");
  const manifestBody = files.find((f) => f.name === "atlas.json")!.body;
  files.push({ name: "atlas.json.gz", body: gzipSync(manifestBody, { level: 9 }) });

  // Ghi công đi cùng dữ liệu, chép nguyên văn từ repo gốc.
  const attributionPath = path.join(dir, "..", "ATTRIBUTION.md");
  try {
    files.push({ name: "ATTRIBUTION.md", body: readFileSync(attributionPath) });
  } catch {
    console.error(`Không thấy ${attributionPath} — CC BY 4.0 đòi ghi công đi kèm dữ liệu.`);
    process.exitCode = 1;
    return;
  }

  const slug = manifest.version.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const version = `${slug}-${hash.digest("hex").slice(0, 10)}`;
  const prefix = `human-atlas/${version}`;
  const publicBase = (
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ??
    "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"
  ).replace(/\/+$/, "");

  console.log(
    write
      ? `=== THỰC THI === bucket ${BUCKET} → ${prefix}\n`
      : `=== CHẠY KHÔ (thêm --write để ghi) === → ${prefix}\n`,
  );

  let total = 0;
  for (const { name, body } of files) {
    const key = `${prefix}/${name}`;
    total += body.length;
    const kb = String(Math.round(body.length / 1024)).padStart(6);
    process.stdout.write(`${key.padEnd(64)} ${kb} KB  `);
    if (!write) {
      console.log("→ sẽ đẩy");
      continue;
    }
    try {
      await put(key, body, {
        "content-type": MIME[path.extname(name)] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      });
      const result = await verify(`${publicBase}/${key}`, body.length);
      if (result !== "✓") process.exitCode = 1;
      console.log(result);
    } catch (error) {
      process.exitCode = 1;
      console.log(`LỖI — ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\nTổng ${(total / 1024 / 1024).toFixed(1)} MB.`);
  console.log(
    `Đặt trong src/lib/human-atlas/assets.ts:\n  export const HUMAN_ATLAS_DATA_VERSION = "${version}";`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
