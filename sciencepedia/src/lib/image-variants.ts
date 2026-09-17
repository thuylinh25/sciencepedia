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

/**
 * `hash` là dấu vân của ẢNH GỐC (cộng công thức dựng), nằm luôn trong tên tệp
 * biến thể. Xem `HASHED_VARIANT` bên dưới để biết vì sao.
 */
export type VariantManifest = Record<string, { hash: string; widths: number[] }>;

const VARIANTS = manifest as VariantManifest;

/**
 * `sky/m31.jpg` + 640            → `sky/m31-640.webp`          (ảnh tải lên)
 * `sky/m31.jpg` + 640 + `3f2a9c1e` → `sky/m31.3f2a9c1e-640.webp` (ảnh dựng lúc build)
 */
export function variantKey(key: string, width: number, hash?: string): string {
  const stem = key.replace(/\.[^./]+$/, "");
  return hash ? `${stem}.${hash}-${width}.webp` : `${stem}-${width}.webp`;
}

/**
 * Biến thể mang dấu vân trong tên — thứ duy nhất được đệm `immutable` một năm.
 *
 * ## Vì sao phải có dấu vân mới dám đệm lâu
 *
 * Tên cũ `sky/m31-640.webp` là tên theo CHỖ, không theo NỘI DUNG: thay ảnh gốc
 * rồi dựng lại là ghi đè đúng khoá ấy. Đệm một năm trên tên như thế thì trình
 * duyệt đã từng xem giữ bản cũ suốt một năm, không cách nào gọi về — kiểu lỗi
 * "máy tôi thấy ảnh mới, máy anh thấy ảnh cũ". Vì thế trước đây chỉ dám đệm
 * một ngày, tức khách quay lại sau một ngày tải lại toàn bộ ảnh, và mỗi lượt
 * tải ấy đều tính vào giới hạn tốc độ của `r2.dev`.
 *
 * Có dấu vân thì ảnh đổi → tên đổi → bản kê đổi → trang trỏ sang tệp mới. Tệp
 * cũ không bao giờ bị ghi đè nên đệm vĩnh viễn cũng không sai.
 *
 * Ảnh tải lên qua `/api/upload` không cần dấu vân: tên đã mang UUID sinh mới
 * mỗi lượt, cũng không bao giờ bị ghi đè — `storage.ts` đặt `immutable` từ đầu.
 */
export const HASHED_VARIANT = /\.[0-9a-f]{8}-\d+\.webp$/;

/** Bề rộng có sẵn của một ảnh, rỗng nghĩa là chưa dựng biến thể nào. */
export function variantWidths(key: string): number[] {
  return VARIANTS[key]?.widths ?? [];
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

  const entry = VARIANTS[key];
  const widths = entry ? entry.widths : widthsFromKey(key);
  if (widths.length === 0) return null;

  const at = (w: number) =>
    assetUrl(
      entry
        ? variantKey(key, w, entry.hash)
        : variantKey(key.replace(VARIANT_SUFFIX, ""), w),
    );

  return {
    src: at(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${at(w)} ${w}w`).join(", "),
  };
}

/** `articles/2026/09/x-1200.webp` → 1200 */
const VARIANT_SUFFIX = /-(\d+)\.webp$/;

/**
 * Suy các nấc có sẵn từ CHÍNH tên tệp, khi bản kê không có mục nào.
 *
 * ## Vì sao cần đường thứ hai
 *
 * Bản kê được sinh lúc dựng và commit vào repo, nên nó chỉ biết những ảnh có
 * mặt trước lúc build. Ảnh biên tập viên tải lên SAU đó — qua `/api/upload` —
 * không thể có trong bản kê, và nếu chỉ dựa vào bản kê thì mọi ảnh mới đều mất
 * `srcset`, tức rơi lại đúng cái bẫy vừa thoát ra.
 *
 * Nên đường tải lên tự ràng buộc mình vào một quy ước: nó dựng đủ các nấc
 * `LADDER` không vượt bề rộng gốc, và trả về URL của nấc LỚN NHẤT. Con số
 * trong tên tệp vì thế nói luôn "có tới đây" — đủ để suy ngược cả bộ mà không
 * cần tra ở đâu.
 *
 * Bản kê vẫn đứng trước: ảnh dựng lúc build có bề rộng gốc lẻ (800, 1760,
 * 3200…) không nằm trong `LADDER`, chỉ bản kê mới biết chúng.
 */
function widthsFromKey(key: string): number[] {
  const max = Number(VARIANT_SUFFIX.exec(key)?.[1] ?? 0);
  if (!max) return [];
  const widths = LADDER.filter((w) => w < max);
  return [...widths, max];
}
