import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import slugRedirects from "./src/generated/slug-redirects.json";

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
   * Danh sách sinh ra từ bảng `ArticleSlugRedirect` bằng
   * `npm run redirects:sync`. Bảng là nguồn sự thật; tệp JSON là bản kết xuất
   * và PHẢI được commit — luật chỉ có hiệu lực sau khi deploy.
   *
   * ## Vì sao không để `page.tsx` tự tra bảng lúc chạy
   *
   * Nó CÓ tra, và cách ấy KHÔNG hoạt động. Đo 2026-09-21 trên Next 15.5.25,
   * cả dev lẫn production: hàng tra được, `status` đúng `PUBLISHED`,
   * `permanentRedirect` được gọi đúng đường dẫn và có ném — nhưng phản hồi
   * vẫn là HTTP 200 kèm trang 404 mặc định của Next. Cú ném bị nuốt. Cùng họ
   * với lỗi ghi ở đầu `page.tsx`: `notFound()` trong route động cũng trả 200.
   *
   * Luật ở đây chạy trước khi React render nên không dính lỗi đó. Lệnh tra
   * bảng trong `page.tsx` vẫn giữ: vô hại, và ngày Next sửa lỗi thì nó đỡ
   * được quãng giữa lúc đổi slug và lúc deploy.
   *
   * ## Vì sao mỗi slug sinh ra HAI luật
   *
   * Dòng có tiền tố giữ đúng locale của người đọc. Dòng không tiền tố trỏ
   * cứng về `/vi` — không phải vì muốn thế, mà vì không còn lựa chọn: đo
   * 2026-09-21, middleware next-intl KHÔNG chèn locale cho `/articles/…`.
   * `/articles/mat-trang` (slug đang sống) trả thẳng 404, trong khi `/` vẫn
   * chuyển đúng sang `/vi`. Bỏ dòng không tiền tố đi là để link thân bài viết
   * dạng `/articles/…` chết hẳn.
   *
   * Hệ quả còn tồn: mọi URL bài KHÔNG tiền tố mà không nằm trong danh sách
   * này vẫn 404. Đó là lỗi riêng của tầng định tuyến, chưa sửa ở đây.
   *
   * 301 chứ không 307: đây là đổi tên vĩnh viễn, và 301 mới gộp được tín hiệu
   * xếp hạng về URL mới. Đánh đổi phải biết trước: trình duyệt và CDN nhớ 301
   * gần như vĩnh viễn, nên đảo lại quyết định này về sau là đắt.
   */
  async redirects() {
    return slugRedirects.flatMap(({ from, to }) => [
      {
        source: `/:locale(vi|en)/articles/${from}`,
        destination: `/:locale/articles/${to}`,
        permanent: true,
      },
      {
        source: `/articles/${from}`,
        destination: `/vi/articles/${to}`,
        permanent: true,
      },
    ]);
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
