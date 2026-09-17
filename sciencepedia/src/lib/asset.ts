/**
 * Ảnh tĩnh của giao diện — hero, bìa thiên thể, ảnh ô "khám phá" — nằm trên
 * Cloudflare R2 chứ không trong `public/`.
 *
 * ## Vì sao không để trong `public/`
 *
 * 26 tệp, 4,5 MB, gần như không đổi. Để trong repo thì mỗi bản triển khai
 * Vercel phải đóng gói và phát lại toàn bộ, và mọi lượt tải đều tính vào băng
 * thông của Vercel. R2 không tính phí egress — đó là toàn bộ lý do.
 *
 * ## Vì sao qua biến môi trường chứ không viết cứng URL
 *
 * `pub-….r2.dev` là **Public Development URL** của R2: Cloudflare giới hạn
 * tốc độ nó và nói thẳng là không dành cho lưu lượng thật. Khi gắn tên miền
 * riêng vào bucket, chỉ cần đổi `NEXT_PUBLIC_ASSET_BASE_URL` — không đụng vào
 * một dòng code nào. Mặc định giữ URL r2.dev để `git clone` xong là chạy
 * được ngay, không cần cấu hình.
 *
 * Host nào đặt ở đây cũng phải có mặt trong `images.remotePatterns`
 * (`next.config.ts`), nếu không `next/image` từ chối tải.
 */

export const ASSET_BASE_URL = (
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ??
  "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev"
).replace(/\/+$/, "");

const BASE = ASSET_BASE_URL;

/**
 * `assetUrl("sky/m31.jpg")` → `https://…/sky/m31.jpg`
 *
 * Tham số là khoá trong bucket, KHÔNG phải đường dẫn URL của site — đừng
 * truyền `/images/…` vào đây.
 */
export function assetUrl(key: string): string {
  // Mã hoá từng đoạn, giữ nguyên `/`. Khoá có dấu cách ("article/James
  // Webb.webp") mà để trần thì hỏng `srcset`: thuộc tính ấy tách URL với bề
  // rộng bằng DẤU CÁCH, nên "James Webb-640.webp 640w" bị đọc thành ba mảnh.
  const path = key
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${BASE}/${path}`;
}

/**
 * Phép nghịch của `assetUrl`: lấy lại khoá trong bucket, `null` nếu URL trỏ ra
 * máy chủ khác.
 *
 * Dùng cho script dựng ảnh: nó cần biết thiên thể nào có tệp ảnh do mình quản
 * lý và tệp đó tên gì. So bằng tiền tố chứ không bằng `/images/` như trước —
 * đường dẫn nội bộ ấy không còn tồn tại.
 */
export function assetKey(url: string): string | null {
  if (!url.startsWith(`${BASE}/`)) return null;
  const path = url.slice(BASE.length + 1);
  // Khoá trong bucket là tên THẬT, không phải dạng mã hoá của URL. Bỏ bước
  // này thì "article/James%20Webb.webp" không khớp mục "article/James
  // Webb.webp" của bản kê biến thể, ảnh rơi sang `next/image`, dính HTTP 402
  // và thẻ bài chỉ còn dải màu.
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
