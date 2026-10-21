import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { chromium } from "playwright-core";

import { assetUrl } from "../src/lib/asset";
import { ATLAS_VIEWS, hasCard, viewParts } from "../src/lib/human-atlas/views";
import { missingEnv, put } from "./r2-client";

/**
 * Chụp sẵn ảnh thu nhỏ của mọi góc nhìn Human Atlas và đẩy lên R2.
 *
 *   npx tsx --env-file-if-exists=.env scripts/bake-atlas-thumbnails.ts                 # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/bake-atlas-thumbnails.ts --write         # đẩy R2 + ghi bản kê
 *   ... --base https://sciencepedia-sciencepedia.vercel.app                            # chụp từ bản live
 *
 * ## Vì sao chụp bằng chính trang, không dựng lại cảnh trong Node
 *
 * Ảnh phải giống hệt ảnh trình duyệt người đọc tự chụp (cùng `renderThumbnail`,
 * cùng vật liệu, cùng khoá đệm). Script mở trang với `?thumbs=capture` — cảnh bỏ
 * qua ảnh chụp sẵn cũ và chụp lại tất cả — rồi đọc thẳng `{id, key, url}` mà cảnh
 * ghi vào IndexedDB. Khoá do CHÍNH trang tính, nên trang phải chạy cùng code và
 * cùng dữ liệu với bản sẽ phát hành: `next build && next start` của nhánh này
 * (dev server không tải dữ liệu atlas), hoặc bản live sau khi deploy.
 *
 * Chrome headless dùng GPU thật (ANGLE D3D11) — SwiftShader mất ~7 s mỗi ảnh và
 * sập tab sau ~40 ảnh. Khung 1600×1000, DPR 1: khung xem ≥ 480×600 thì cảnh vẽ
 * gấp đôi rồi thu nhỏ (giữ màu dây thần kinh mảnh), như trên màn lớn.
 *
 * ## Thứ tự
 *
 * Đẩy ảnh lên R2 TRƯỚC, commit `thumbnails.generated.json` SAU — bản kê trỏ vào
 * tệp chưa có là thẻ ảnh vỡ. Tên tệp là dấu vân nội dung, đệm một năm.
 */

const OUT = path.join(process.cwd(), ".cache", "atlas-thumbs");
const MANIFEST = path.join(process.cwd(), "src", "lib", "human-atlas", "thumbnails.generated.json");

function arg(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

type Entry = { id: string; key: string; url: string };

async function main() {
  const write = process.argv.includes("--write");
  const base = (arg("--base") ?? "http://localhost:3000").replace(/\/+$/, "");
  const missing = missingEnv();
  if (write && missing.length > 0) {
    console.error(`Thiếu trong .env: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // Cùng bộ lọc với `thumbQueue` trong anatomy-scene.
  const expected = ATLAS_VIEWS.filter((v) => hasCard(v) && !v.missing && viewParts(v.id)).map((v) => v.id);
  console.log(`${expected.length} góc nhìn cần ảnh — chụp từ ${base}`);

  const browser = await chromium.launch({
    channel: process.env.ATLAS_BAKE_CHROME ? undefined : "chrome",
    executablePath: process.env.ATLAS_BAKE_CHROME,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  });
  let entries: Entry[] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    const renderer = await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "?";
    });
    console.log(`GPU: ${renderer}`);
    if (/swiftshader/i.test(renderer)) throw new Error("Chrome đang vẽ bằng SwiftShader — cần GPU thật.");

    await page.goto(`${base}/vi/human-atlas?thumbs=capture`, { waitUntil: "domcontentloaded" });
    await page.locator('[role="status"]').first().waitFor({ state: "detached", timeout: 180_000 });
    await page
      .locator('button[aria-haspopup="dialog"]')
      .filter({ has: page.locator("svg.lucide-layout-grid") })
      .click({ timeout: 60_000 });

    const started = Date.now();
    let last = -1;
    for (;;) {
      entries = await page.evaluate(
        () =>
          new Promise<Entry[]>((resolve) => {
            const request = indexedDB.open("sciencepedia-atlas", 1);
            request.onupgradeneeded = () => request.result.createObjectStore("thumbnails", { keyPath: "id" });
            request.onsuccess = () => {
              const all = request.result.transaction("thumbnails", "readonly").objectStore("thumbnails").getAll();
              all.onsuccess = () => resolve(all.result as Entry[]);
              all.onerror = () => resolve([]);
            };
            request.onerror = () => resolve([]);
          }),
      );
      const done = entries.filter((e) => expected.includes(e.id)).length;
      if (done !== last) {
        console.log(`  ${done}/${expected.length} (${Math.round((Date.now() - started) / 1000)} s)`);
        last = done;
      }
      if (done >= expected.length) break;
      if (Date.now() - started > 20 * 60_000) {
        throw new Error(`Hết giờ, còn thiếu: ${expected.filter((id) => !entries.some((e) => e.id === id)).join(", ")}`);
      }
      await page.waitForTimeout(2000);
    }
  } finally {
    await browser.close();
  }

  mkdirSync(OUT, { recursive: true });
  const manifest: Record<string, { key: string; file: string }> = {};
  const files = new Map<string, Buffer>();
  for (const id of [...expected].sort()) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) continue;
    const body = Buffer.from(entry.url.replace(/^data:image\/webp;base64,/, ""), "base64");
    const file = `${createHash("sha256").update(body).digest("hex").slice(0, 16)}.webp`;
    manifest[id] = { key: entry.key, file };
    files.set(file, body);
    writeFileSync(path.join(OUT, file), body);
  }
  const bytes = [...files.values()].reduce((n, b) => n + b.length, 0);
  console.log(`${files.size} tệp, ${Math.round(bytes / 1024)} KB — xem ở ${OUT}`);

  if (!write) {
    console.log("Chạy khô: chưa đẩy R2, chưa ghi bản kê. Thêm --write để thực thi.");
    return;
  }

  let failed = 0;
  for (const [file, body] of files) {
    const key = `human-atlas/thumbs/${file}`;
    await put(key, body, { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" });
    const response = await fetch(assetUrl(key), { method: "HEAD", cache: "no-store" });
    const ok = response.ok && Number(response.headers.get("content-length")) === body.length;
    if (!ok) {
      failed += 1;
      console.error(`  ✗ ${key}: HTTP ${response.status}`);
    }
  }
  if (failed) {
    console.error(`${failed} tệp không đọc lại được công khai — KHÔNG ghi bản kê.`);
    process.exitCode = 1;
    return;
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Đã đẩy ${files.size} tệp và ghi ${path.relative(process.cwd(), MANIFEST)} — commit bản kê này.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
