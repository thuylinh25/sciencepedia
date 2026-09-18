import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Host phát ảnh tĩnh. Phải khớp với `NEXT_PUBLIC_ASSET_BASE_URL` trong
 * `src/lib/asset.ts` — giữ cùng một giá trị mặc định ở hai nơi vì next.config
 * không import được module dùng path alias `@/`.
 */
const ASSET_HOST = new URL(
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ??
    "https://pub-2f39abf8661142edaf3c3c48f755ffa8.r2.dev",
).hostname;

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
      // Cloudflare R2 — ảnh tĩnh của giao diện (hero, bìa thiên thể, ô khám
      // phá). Host đọc từ chính biến mà `src/lib/asset.ts` dùng để dựng URL:
      // một nguồn sự thật, nên đổi sang tên miền riêng không thể quên mở cổng
      // ở đây rồi ngồi đoán vì sao `next/image` trả 400.
      { protocol: "https", hostname: ASSET_HOST },
      // Supabase Storage — ảnh bài viết và ảnh danh mục do biên tập tải lên.
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
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "science.nasa.gov" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      // Ảnh Trái Đất toàn cảnh của camera EPIC trên vệ tinh DSCOVR
      { protocol: "https", hostname: "epic.gsfc.nasa.gov" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/drei",
    ],

    /**
     * Dựng tối đa 4 trang tĩnh cùng lúc, thay cho mặc định 8.
     *
     * 268 trang nội dung, mỗi trang vài truy vấn Prisma, dựng song song trên
     * nhiều worker — đó là thứ làm build trên Vercel chết với P2024 (hết
     * connection pool) quanh trang thứ 60. Xem chú thích dài trong
     * `src/lib/prisma.ts` để biết vì sao chỗ nghẽn nằm ở pooler chứ không ở
     * Prisma.
     *
     * Đây là nửa thứ hai của cùng một phép chữa: `prisma.ts` hạ số kết nối mỗi
     * worker, còn chỗ này hạ số worker chạy cùng lúc. Chỉ làm một trong hai thì
     * tổng tải vẫn có thể vượt pooler khi máy build có nhiều nhân hơn.
     *
     * Build lâu hơn. Đổi lại nó chạy xong.
     */
    staticGenerationMaxConcurrency: 4,

    /**
     * Thử lại 2 lần trước khi bỏ cuộc trên một trang.
     *
     * Hết pool là lỗi NHẤT THỜI: chờ một nhịp rồi gọi lại thì gần như luôn
     * được. Mặc định Next dừng cả build ngay ở trang đầu tiên hỏng, nên một cú
     * nghẽn thoáng qua giết luôn bản triển khai. Ba lần thử không giấu được
     * lỗi thật — hỏng thật thì hỏng cả ba.
     */
    staticGenerationRetryCount: 2,
  },
  /*
   * `sharp` là thư viện native. Để Next gói nó vào bundle server thì bản nhị
   * phân đúng nền tảng bị bỏ lại — nó phải được `require` lúc chạy. `/api/upload`
   * dùng sharp để dựng các cỡ ảnh ngay khi biên tập viên tải lên.
   */
  serverExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
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
