import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Có lockfile ở thư mục cha, nếu không ghim thì Next đoán nhầm gốc workspace
  outputFileTracingRoot: path.resolve(process.cwd()),
  /**
   * `standalone` gói sẵn server + đúng những file node_modules cần thiết,
   * dùng cho Docker / VPS. Bật qua biến môi trường chứ không bật mặc định:
   * Vercel tự lo phần đóng gói và không cần chế độ này.
   */
  output:
    process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage — nguồn ảnh chính của hệ thống.
      // Chỉ mở đúng đường dẫn public object, không mở cả domain.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Nguồn ảnh ngoài dùng cho dữ liệu seed và ảnh dẫn nguồn
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "science.nasa.gov" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Ảnh Trái Đất toàn cảnh của camera EPIC trên vệ tinh DSCOVR
      { protocol: "https", hostname: "epic.gsfc.nasa.gov" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  /**
   * Đổi slug bài viết thì URL cũ phải còn sống.
   *
   * `hanh-trinh-vao-tam-trai-dat` → `cau-truc-ben-trong-trai-dat`
   * (2026-09-10): hàng Article đó đã mang entity, seoTitle và bản tiếng Anh
   * của bài "Cấu trúc bên trong Trái Đất", và bài `trai-dat` đã trỏ link vào
   * slug mới — link đó là 404 chừng nào chưa đổi. Slug cũ vẫn là URL công
   * khai từ 2026-09-06, nên nó chuyển hướng thay vì chết.
   *
   * 301 chứ không 307: đây là đổi tên vĩnh viễn, và 301 mới gộp được tín hiệu
   * xếp hạng về URL mới. Đánh đổi phải biết trước: trình duyệt và CDN nhớ 301
   * gần như vĩnh viễn, nên đảo lại quyết định này về sau là đắt.
   *
   * `localePrefix: "always"` (src/i18n/routing.ts) nên mọi URL thật đều có
   * tiền tố locale; dòng không tiền tố là để bắt link nội bộ viết dạng
   * `/articles/…` trong thân bài trước khi middleware chèn locale.
   */
  async redirects() {
    return [
      {
        source: "/:locale(vi|en)/articles/hanh-trinh-vao-tam-trai-dat",
        destination: "/:locale/articles/cau-truc-ben-trong-trai-dat",
        permanent: true,
      },
      {
        source: "/articles/hanh-trinh-vao-tam-trai-dat",
        destination: "/vi/articles/cau-truc-ben-trong-trai-dat",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
