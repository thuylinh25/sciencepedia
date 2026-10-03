import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        /* `/api/og` là ảnh chia sẻ dự phòng mà og:image trỏ tới khi bài
           không có ảnh bìa. Chặn nó cùng `/api/` thì Google không tải được
           ảnh đó. Google chọn quy tắc DÀI hơn khi allow/disallow cùng khớp,
           nên `/api/og` thắng `/api/` mà không mở phần API còn lại. */
        allow: ["/", "/api/og"],
        // Khu quản trị, API và trang kết quả tìm kiếm không cần vào chỉ mục
        disallow: [
          "/api/",
          "/vi/admin",
          "/en/admin",
          "/vi/search",
          "/en/search",
          "/vi/login",
          "/en/login",
          "/vi/register",
          "/en/register",
        ],
      },
    ],
    // Không khai `host`: chỉ thị riêng của Yandex, Google bỏ qua
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
