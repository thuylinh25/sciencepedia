import { statSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { MOON, PLANETS, SUN } from "../src/lib/solar-data";

/**
 * Dựng lại ảnh bìa thiên thể từ CHÍNH bản đồ HiPS mà nút "Mở bản đồ" mở ra.
 *
 *   npm run covers:bodies              # in kế hoạch, KHÔNG ghi
 *   npm run covers:bodies -- --write   # thực thi
 *
 * ## Vì sao phải dựng lại
 *
 * Bộ ảnh cũ là 768×768, lấy từ ảnh xem trước của HiPS. Trên điện thoại thẻ
 * rộng `calc(100vw - 3rem)`, tức chừng 364 px CSS trên máy 412 px — nhân với
 * DPR 2,75 là **hơn 1000 px vật lý**. `next/image` không tạo được biến thể lớn
 * hơn tệp gốc, nên nó dừng ở 768 và trình duyệt phóng nốt phần còn lại. Đó là
 * lý do ảnh mờ, và cũng là lý do hai lượt "làm nét" trước đó không ăn thua:
 * cả hai đều xử lý lại đúng tệp 768 px ấy. **Nội suy không sinh ra chi tiết.**
 *
 * ## Vì sao dùng hips2fits chứ không tải ảnh xem trước
 *
 * `hips2fits` của CDS kết xuất thẳng từ các ô ảnh HiPS ở bậc phân giải đủ cao,
 * theo đúng phép chiếu mình chọn. Nghĩa là ảnh bìa và bản đồ tương tác đọc
 * **cùng một dữ liệu** — yêu cầu "ảnh bìa phải giống khi mở bản đồ" được bảo
 * đảm bởi cách lấy ảnh, không phải bởi việc ai đó nhớ chọn cho giống.
 *
 * `projection=SIN` là phép chiếu trực giao: đúng hình một quả cầu nhìn từ xa,
 * và ở `fov=180` thì đĩa nội tiếp khít khung vuông.
 *
 * ## Vì sao 1536 chứ không phải 2048
 *
 * 1536 phủ được mọi thẻ trên mọi thiết bị hiện tại (nhu cầu lớn nhất đo được
 * là ~1000 px vật lý) với dư địa cho màn hình dày điểm ảnh hơn. Lên 2048 thì
 * mỗi tệp nặng thêm chừng 70% để phục vụ một mức chi tiết không màn hình nào
 * đang dùng tới — và đây là ảnh nằm trong vùng đo LCP của trang thư viện.
 *
 * ## Vì sao phải che góc
 *
 * Ngoài đĩa, `hips2fits` trả nền TRẮNG. Trên thẻ nền đen thì bốn góc trắng là
 * bốn mảng chói nằm quanh thiên thể. Che bằng mặt nạ tròn rồi dán lên nền đen.
 */

const SERVICE = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits";

/** Cạnh ảnh ra, tính bằng pixel. Xem chú thích "Vì sao 1536". */
const SIZE = 1536;

/** Kết xuất một quả cầu mất hàng chục giây; đừng bỏ cuộc sớm hơn máy chủ. */
const TIMEOUT_MS = 240_000;

type Job = { name: string; hipsUrl: string; file: string };

function collect(): Job[] {
  const bodies = [SUN, MOON, ...PLANETS] as {
    name: string;
    surface?: { hipsUrl: string };
    photo?: { url: string };
  }[];

  const jobs: Job[] = [];
  for (const body of bodies) {
    const hipsUrl = body.surface?.hipsUrl;
    const url = body.photo?.url;
    // Chỉ dựng cho thiên thể có CẢ bản đồ HiPS lẫn một tệp ảnh nội bộ. Thiên
    // thể trỏ ảnh ra máy chủ ngoài không phải việc của script này.
    if (!hipsUrl || !url || !url.startsWith("/images/")) continue;
    jobs.push({ name: body.name, hipsUrl, file: url.replace("/images/", "") });
  }
  return jobs;
}

/**
 * Kết xuất, thử lại một lần nếu lượt đầu quá hạn.
 *
 * `hips2fits` dựng ảnh theo yêu cầu và thời gian trả lời phụ thuộc tải của máy
 * chủ CDS — cùng một thiên thể có lượt xong sau 40 giây, có lượt quá 240 giây.
 * Đó là hàng đợi bận, không phải yêu cầu sai, nên thử lại là đúng. Chỉ thử một
 * lần: quá hạn hai lần liên tiếp thì vấn đề không còn là vận rủi.
 */
async function renderWithRetry(hipsUrl: string): Promise<Buffer> {
  try {
    return await render(hipsUrl);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return render(hipsUrl);
  }
}

async function render(hipsUrl: string): Promise<Buffer> {
  const query = new URLSearchParams({
    hips: hipsUrl,
    width: String(SIZE),
    height: String(SIZE),
    fov: "180",
    projection: "SIN",
    coordsys: "icrs",
    ra: "0",
    dec: "0",
    format: "jpg",
  });

  const response = await fetch(`${SERVICE}?${query}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`hips2fits trả HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Mặt nạ tròn nội tiếp: ĐỤC trong đĩa, TRONG SUỐT ngoài đĩa.
 *
 * Điểm dễ sai, và lượt đầu đã sai đúng chỗ này: `blend: "dest-in"` của sharp
 * đọc **kênh alpha** của mặt nạ, không đọc độ sáng. Mặt nạ vẽ hình tròn trắng
 * trên nền ĐEN có alpha đặc ở mọi pixel, nên nó giữ lại toàn bộ ảnh và bốn góc
 * trắng của `hips2fits` sống sót nguyên vẹn.
 *
 * Nền SVG mặc định trong suốt, nên chỉ cần KHÔNG vẽ nền: ngoài hình tròn là
 * alpha 0, và đó mới là thứ `dest-in` cắt đi.
 */
function discMask(): Buffer {
  const r = SIZE / 2;
  return Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>` +
      `</svg>`,
  );
}

async function main() {
  const write = process.argv.includes("--write");
  /** Dựng lại cả thiên thể đã đạt kích thước — cần khi chính cách dựng đổi. */
  const force = process.argv.includes("--force");
  console.log(
    write ? "=== THỰC THI ===\n" : "=== CHẠY KHÔ (thêm --write để ghi) ===\n",
  );

  const jobs = collect();
  const outDir = path.resolve(process.cwd(), "public", "images");
  let failed = false;

  for (const job of jobs) {
    const target = path.join(outDir, job.file);
    let before = "—";
    let done = false;
    try {
      const meta = await sharp(target).metadata();
      before = `${meta.width}×${meta.height}, ${Math.round(statSync(target).size / 1024)} KB`;
      done = meta.width === SIZE && meta.height === SIZE;
    } catch {
      before = "(chưa có)";
    }

    /*
     * Bỏ qua thiên thể đã đạt kích thước đích.
     *
     * `hips2fits` là hàng đợi công cộng và hay quá hạn, nên lượt chạy đủ sáu
     * thiên thể trong một lần là chuyện may. Cho script chạy lại được nhiều
     * lượt mà không dựng lại thứ đã xong biến một việc hên xui thành một việc
     * chắc chắn xong — chỉ cần chạy thêm lượt nữa.
     */
    if (done && !force) {
      console.log(`${job.name.padEnd(14)} ${before.padEnd(22)}   đã đạt, bỏ qua`);
      continue;
    }

    process.stdout.write(`${job.name.padEnd(14)} ${before.padEnd(22)} → `);

    try {
      const raw = await renderWithRetry(job.hipsUrl);

      const image = await sharp(raw)
        .ensureAlpha()
        // `dest-in` giữ lại phần ảnh nằm trong vùng trắng của mặt nạ; phần còn
        // lại thành trong suốt, rồi `flatten` dán nó lên nền đen.
        .composite([{ input: discMask(), blend: "dest-in" }])
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        // 4:4:4 vì đây là ảnh có chi tiết màu nhỏ (vết sáng, vùng hoạt động);
        // lấy mẫu màu thưa sẽ làm nhoè đúng thứ vừa bỏ công lấy về.
        .jpeg({ quality: 86, chromaSubsampling: "4:4:4" })
        .toBuffer();

      const meta = await sharp(image).metadata();
      const kb = Math.round(image.length / 1024);

      if (meta.width !== SIZE || meta.height !== SIZE) {
        throw new Error(`kích thước lạ ${meta.width}×${meta.height}`);
      }

      console.log(`${meta.width}×${meta.height}, ${kb} KB`);
      if (write) writeFileSync(target, image);
    } catch (error) {
      failed = true;
      console.log(`LỖI — ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log();
  if (failed) {
    console.error("Có thiên thể dựng hỏng. Chạy lại; hips2fits đôi khi quá tải.");
    process.exitCode = 1;
  }
  if (!write) console.log("Chưa ghi gì. Thêm --write để thực thi.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
