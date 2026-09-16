"use client";

import { useState } from "react";
import Image from "next/image";

import { assetSrcSet } from "@/lib/image-variants";
import { cn } from "@/lib/utils";

/**
 * Ảnh bìa bài viết, có đường lui khi URL chết.
 *
 * ## Vì sao cần
 *
 * `article.coverImage` có thể trỏ tới một tệp không còn tồn tại. Ngày
 * 11/09/2026, bốn trong năm ảnh bìa mà trang chủ đang dùng trả về
 * `{"code":"NoSuchKey","message":"Object not found"}` từ Supabase Storage:
 * hàng dữ liệu vẫn giữ đường dẫn nhưng tệp đã biến mất khỏi bucket.
 *
 * Component cũ chỉ phân biệt "có đường dẫn" với "không có đường dẫn", nên
 * trường hợp "có đường dẫn nhưng tải hỏng" rơi vào nhánh có ảnh và để lại
 * một ô đen. Ô đen đó tệ hơn hẳn ô gradient của nhánh không có ảnh: nó trông
 * như trang lỗi chứ không như một bài chưa kịp có ảnh.
 *
 * ## Vì sao phải là Client Component
 *
 * `onError` là sự kiện của trình duyệt, chỉ biết được sau khi trình duyệt đã
 * thử tải. Máy chủ không có cách nào biết trước, và cũng không nên biết: kiểm
 * từng URL lúc render sẽ thêm một lượt đi mạng cho mỗi thẻ bài.
 *
 * Đây là lớp lá — chỉ đúng thẻ ảnh này là client, phần còn lại của thẻ bài
 * vẫn render ở máy chủ.
 */
export function CoverImage({
  src,
  sizes,
  priority,
  fallbackColor,
  className,
}: {
  src: string;
  sizes: string;
  priority?: boolean;
  /** Màu danh mục, dùng dựng gradient thay thế */
  fallbackColor: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="size-full"
        style={{
          background: `linear-gradient(135deg, ${fallbackColor}33, ${fallbackColor}0d)`,
        }}
      />
    );
  }

  /*
   * Bìa nằm trên R2 thì dùng các cỡ đã dựng sẵn và tải thẳng, không qua
   * `/_next/image` — hạn mức Image Optimization của Vercel đã cạn (HTTP 402).
   * Xem `docs/architecture.md`, mục "Ảnh tĩnh KHÔNG đi qua `/_next/image`".
   *
   * Nhánh `next/image` phía dưới không phải mã chết: bài mới do pipeline sinh
   * ra có thể mang URL ảnh ngoài cho tới lượt `covers:mirror` kế tiếp. Nó vẫn
   * dính 402, nhưng vẫn còn `onError` để lui về dải màu thay vì ô đen.
   */
  const variants = assetSrcSet(src);

  if (variants) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- cố ý không qua /_next/image
      <img
        src={variants.src}
        srcSet={variants.srcSet}
        sizes={sizes}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("absolute inset-0 size-full", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
