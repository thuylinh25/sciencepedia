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
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/drei"],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
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
