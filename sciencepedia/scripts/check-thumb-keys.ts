import { gunzipSync } from "node:zlib";

import { atlasSchema, correctSystems } from "../src/lib/human-atlas/anatomy";
import { withSupplements } from "../src/lib/human-atlas/supplements";
import {
  HUMAN_ATLAS_DATA_VERSION,
  atlasDataUrl,
} from "../src/lib/human-atlas/assets";
import { viewById, viewParts } from "../src/lib/human-atlas/views";
import {
  fingerprint,
  THUMB_STYLE,
} from "../src/lib/human-atlas/thumbnail-cache";
import manifest from "../src/lib/human-atlas/thumbnails.generated.json";

/**
 * Kiểm khoá của bản kê ảnh thu nhỏ đã nướng (`thumbnails.generated.json`)
 * còn khớp với code + dữ liệu hiện tại hay không.
 *
 *   npx tsx scripts/check-thumb-keys.ts
 *
 * Thoát 0 khi mọi khoá khớp, 1 khi có khoá lệch.
 *
 * ## Vì sao cần script này (sự cố 2026-10-28)
 *
 * Trang chỉ dùng ảnh nướng sẵn khi `thumbKey` tính tại chỗ khớp khoá trong
 * bản kê; lệch là thẻ tự về chụp ở client — tải gần đủ hình học rồi vẽ từng
 * ảnh ~150 ms, cả lưới mất hàng phút. Khoá gồm dấu vân của TOÀN BỘ mô hình
 * lắp ráp (số mảnh + danh sách khối), nên một thay đổi mô hình làm lệch
 * MỌI khoá cùng lúc mà không có dấu hiệu nào trong repo.
 *
 * Đợt nướng 2026-10-27 chạy lúc 17:52, một phút sau commit khử trùng mạch
 * (17:51, mô hình 2.901 → 2.898 mảnh) và TRƯỚC khi bản deploy chứa commit
 * đó lên sóng: trang live lúc nướng vẫn tính khoá theo mô hình cũ. Bản kê
 * trông hoàn hảo — 214 tệp trên R2 đúng cỡ 480×600 — nhưng khoá thuộc về
 * một mô hình không còn tồn tại, production khớp 0/214 và thư viện kẹt
 * "Đang dựng ảnh…" cho tới khi có người kêu. Kiểm tệp tồn tại không đủ;
 * phải tính lại khoá mà so, đó là việc script này làm.
 *
 * Chạy sau mỗi lần nướng (trước khi commit bản kê) và sau mỗi PR đụng vào
 * mô hình/dữ liệu atlas. Dữ liệu lấy từ R2 công khai như trang thật —
 * code là code của checkout này, nên checkout phải ở đúng commit đã deploy.
 */

async function main() {
  const response = await fetch(atlasDataUrl("atlas.json.gz"));
  if (!response.ok) {
    console.error(`Không tải được atlas.json.gz: ${response.status}`);
    process.exitCode = 1;
    return;
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(new TextDecoder().decode(gunzipSync(buffer)));
  } catch {
    parsedJson = JSON.parse(new TextDecoder().decode(buffer));
  }
  const atlas = withSupplements(correctSystems(atlasSchema.parse(parsedJson)));
  const atlasPrint = fingerprint(
    JSON.stringify([
      HUMAN_ATLAS_DATA_VERSION,
      atlas.parts.length,
      atlas.chunks.map((c) => [c.url, c.gzip, c.bytes]),
    ]),
  );

  const entries = manifest as Record<string, { key: string; file: string }>;
  const ids = Object.keys(entries);
  const stale: string[] = [];
  for (const id of ids) {
    const def = viewById(id);
    const key = def
      ? `${THUMB_STYLE}:${atlasPrint}:${fingerprint(JSON.stringify([def, viewParts(id)]))}`
      : null;
    if (key !== entries[id].key) stale.push(id);
  }

  console.log(
    `Mô hình lắp ráp: ${atlas.parts.length} mảnh, dấu vân ${atlasPrint}.`,
  );
  if (stale.length === 0) {
    console.log(`Bản kê: ${ids.length}/${ids.length} khoá khớp — ảnh nướng sẵn dùng được.`);
    return;
  }
  console.error(
    `Bản kê: ${ids.length - stale.length}/${ids.length} khoá khớp; ${stale.length} khoá lệch (ví dụ: ${stale.slice(0, 5).join(", ")}).`,
  );
  console.error(
    "Các thẻ lệch sẽ tự chụp ở client rất chậm. Nướng lại trên máy có GPU: npm run atlas:thumbs -- --base https://sciencepedia-sciencepedia.vercel.app --write",
  );
  process.exitCode = 1;
}

void main();
