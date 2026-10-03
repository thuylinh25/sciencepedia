import { ASSET_BASE_URL } from "@/lib/asset";

/**
 * Nơi phát dữ liệu giải phẫu (BodyParts3D 4.0, CC BY 4.0): `atlas.json` và 15
 * khối hình học, ~33 MB nén. Đẩy lên R2 bằng `scripts/upload-human-atlas.ts`.
 *
 * ## Vì sao trình duyệt tải thẳng từ R2 — và điều kiện để nó chạy
 *
 * R2 không tính phí egress; phát 33 MB mỗi lượt xem qua Vercel thì có. Nhưng
 * viewer đọc dữ liệu bằng `fetch()`, không phải `<img>`, nên bucket PHẢI có
 * luật CORS cho GET. Luật đó được đặt ngày 2026-09-28 (GET/HEAD, mọi origin —
 * mọi thứ trong bucket vốn đã công khai). Gỡ luật ấy là atlas hỏng ngay với
 * lỗi "Không thể tải mô hình 3D", trong khi mọi ảnh của site vẫn hiện bình
 * thường — đừng tìm lỗi trong code trước khi kiểm header
 * `Access-Control-Allow-Origin` của một tệp dưới `human-atlas/`.
 *
 * `NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL` để trỏ sang nơi khác (tên miền riêng,
 * máy chủ cục bộ) mà không sửa code.
 */

/** Khoá thư mục trên R2 — dòng cuối của `upload-human-atlas.ts` in ra giá trị này. */
export const HUMAN_ATLAS_DATA_VERSION = "bodyparts3d-4.0-23e4eb0d96";

const BASE = (
  process.env.NEXT_PUBLIC_HUMAN_ATLAS_BASE_URL ?? `${ASSET_BASE_URL}/human-atlas`
).replace(/\/+$/, "");

/** `atlasDataUrl("body-3.bin.gz")` → `<R2>/human-atlas/<phiên bản>/body-3.bin.gz` */
export function atlasDataUrl(file: string): string {
  // Khối của phần bổ sung (`supplements.ts`) mang URL tuyệt đối riêng.
  if (/^https?:\/\//.test(file)) return file;
  // `atlas.json` ghi đường dẫn kiểu `/models/body-0.bin` của repo gốc; chỉ giữ tên tệp.
  const name = file.split("/").pop() ?? file;
  return `${BASE}/${HUMAN_ATLAS_DATA_VERSION}/${name}`;
}

/**
 * Dữ liệu cấu trúc giải phẫu đã làm giàu từ FMA (`scripts/anatomy-enrich.ts`).
 *
 * Nằm NGOÀI thư mục phiên bản BodyParts3D vì nó có vòng đời riêng: sửa một
 * tên Latin không phải dựng lại 33 MB hình học. Tên tệp mang dấu vân nội
 * dung nên đệm một năm; script in ra đúng giá trị để dán vào đây — đẩy tệp
 * TRƯỚC, đổi hằng số SAU.
 *
 * Nguồn thật là `data/anatomy/fma-structures.json` trong repo; tệp trên R2 chỉ
 * là bản phát hành của nó.
 */
export const ANATOMY_DATA_FILE: string | null = "fma-structures.5a7981569b.json";

export function anatomyDataUrl(file: string): string {
  return `${BASE}/anatomy/${file}`;
}
