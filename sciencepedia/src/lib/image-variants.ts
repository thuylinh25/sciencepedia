import { assetKey, assetUrl } from "./asset";
import manifest from "./image-variants.json";

/**
 * Bản kê các bề rộng đã dựng sẵn cho mỗi ảnh trên R2.
 *
 * `scripts/build-image-variants.ts` sinh ra `image-variants.json`; tệp ấy được
 * commit vì `<AssetImage>` cần nó lúc render, kể cả khi dựng tĩnh. Đây là dữ
 * liệu, không phải cấu hình — đừng sửa tay, chạy lại script.
 *
 * ## Vì sao phải có bản kê thay vì đoán
 *
 * Ảnh không được phóng to, nên một ảnh gốc rộng 800 px chỉ có tới nấc 800.
 * Nếu `srcset` cứ liệt kê đủ nấc thì những nấc không tồn tại trả 404, và trình
 * duyệt vẽ ô trống chứ không tự lùi về nấc nhỏ hơn. Bản kê là cách duy nhất để
 * `srcset` chỉ nói ra những gì thật sự có.
 */

/**
 * Các nấc bề rộng dựng sẵn, tính bằng pixel CSS × mật độ điểm ảnh.
 *
 * Bám theo `sizes` đang dùng thật trong mã: có ô ảnh 48 px (danh sách thiên
 * thể), có card chừng 30–50vw, và có hero 100vw. Sáu nấc phủ hết dải đó mà
 * không sinh ra một rừng tệp — mỗi nấc thêm vào là nhân số tệp lên theo số ảnh.
 */
export const LADDER = [128, 384, 640, 828, 1200, 1920] as const;

export type VariantManifest = Record<string, number[]>;

const VARIANTS = manifest as VariantManifest;

/** `sky/m31.jpg` + 640 → `sky/m31-640.webp` */
export function variantKey(key: string, width: number): string {
  return `${key.replace(/\.[^./]+$/, "")}-${width}.webp`;
}

/** Bề rộng có sẵn của một ảnh, rỗng nghĩa là chưa dựng biến thể nào. */
export function variantWidths(key: string): number[] {
  return VARIANTS[key] ?? [];
}

/**
 * Từ một URL bất kỳ, trả về cặp `src` + `srcSet` để đưa thẳng vào `<img>`.
 * `null` khi URL không nằm trên R2 hoặc chưa có biến thể nào — lúc đó chỗ gọi
 * tự quyết định đường lui (thường là `next/image`).
 *
 * Đây là nơi DUY NHẤT dựng `srcset`, để `<AssetImage>` và `<CoverImage>` không
 * trôi ra hai luật khác nhau. `<CoverImage>` không dùng thẳng `<AssetImage>`
 * được vì nó còn phải bắt `onError` để lui về dải màu.
 */
export function assetSrcSet(
  url: string,
): { src: string; srcSet: string } | null {
  const key = assetKey(url);
  if (!key) return null;

  const widths = variantWidths(key);
  if (widths.length === 0) return null;

  return {
    src: assetUrl(variantKey(key, widths[widths.length - 1])),
    srcSet: widths
      .map((w) => `${assetUrl(variantKey(key, w))} ${w}w`)
      .join(", "),
  };
}
