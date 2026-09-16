import { assetSrcSet } from "@/lib/image-variants";
import { cn } from "@/lib/utils";

/**
 * Ảnh tĩnh trên R2, tải thẳng từ R2 — KHÔNG đi qua `/_next/image`.
 *
 * ## Vì sao không dùng `next/image` cho những ảnh này
 *
 * Ngày 2026-09-16, `/_next/image` trên production trả **HTTP 402
 * `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`**: hạn mức Image Optimization của
 * Vercel đã cạn. Triệu chứng độc ở chỗ nó KHÔNG hỏng đều — biến thể đã nằm
 * trong cache vẫn hiện, biến thể mới thì chết, nên ảnh hỏng theo bề rộng màn
 * hình của từng khách chứ không theo trang.
 *
 * Đổi nơi chứa ảnh không chữa được: ảnh Wikimedia cũng chết y hệt, mà Wikimedia
 * đâu phải Vercel. Nút thắt nằm ở bộ tối ưu, không ở kho. Nên các cỡ được dựng
 * SẴN (`npm run images:variants`) và trình duyệt tải thẳng từ R2 — egress R2
 * miễn phí, và không cú nào chạm hạn mức Vercel nữa.
 *
 * ## Vì sao là `<img>` chứ không phải `next/image` với `unoptimized`
 *
 * `unoptimized` bỏ luôn `srcset`: điện thoại sẽ tải đúng tệp gốc 285 KB cho
 * một ô rộng 360 px. Cái mình cần giữ lại chính là `srcset` — phần đắt giá
 * nhất của `next/image` — chứ không phải phần biến đổi ảnh lúc chạy.
 *
 * ## Ghi chú cho lần sửa sau
 *
 * Component này dựng lại đúng hành vi `fill` của `next/image`: phủ kín thẻ cha,
 * và thẻ cha phải có `position: relative` cùng một chiều cao xác định. Mọi chỗ
 * gọi hiện nay đều đã như vậy — đừng bỏ `relative` ở thẻ bọc.
 */

type Props = {
  /** URL đầy đủ do `assetUrl()` sinh ra. */
  src: string;
  alt: string;
  /** Như `sizes` của `next/image`: nói cho trình duyệt ô ảnh rộng bao nhiêu. */
  sizes: string;
  className?: string;
  /**
   * Ảnh nằm trong màn hình đầu tiên. Tắt lazy-load và xin ưu tiên tải —
   * dùng cho đúng ảnh trong vùng đo LCP, không rắc đại trà.
   */
  priority?: boolean;
};

export function AssetImage({ src, alt, sizes, className, priority }: Props) {
  /*
   * Không có bản kê thì trả về chính ảnh gốc, không `srcset`.
   *
   * Xảy ra khi ảnh vừa được thêm mà chưa chạy `images:variants`. Thà nặng một
   * tấm còn hơn `srcset` trỏ vào tệp chưa tồn tại: 404 thì trình duyệt vẽ ô
   * trống chứ không tự lùi về nấc nhỏ hơn.
   */
  const variants = assetSrcSet(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- xem chú thích đầu tệp: cố ý không qua /_next/image
    <img
      src={variants?.src ?? src}
      srcSet={variants?.srcSet}
      sizes={variants ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn("absolute inset-0 size-full", className)}
    />
  );
}
