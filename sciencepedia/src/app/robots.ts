import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
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
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
