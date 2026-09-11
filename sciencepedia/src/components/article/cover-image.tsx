"use client";

import { useState } from "react";
import Image from "next/image";

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
