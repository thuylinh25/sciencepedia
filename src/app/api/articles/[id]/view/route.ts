import type { NextRequest } from "next/server";

import { incrementViews } from "@/server/queries";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Ghi nhận một lượt đọc.
 *
 * Vì sao phải đếm từ trình duyệt thay vì đếm ngay trong server component:
 * trang bài viết đặt `revalidate = 300` và được prerender sẵn, nên phần lớn
 * lượt truy cập được phục vụ thẳng từ bản cache — server component không chạy
 * lại, và `after()` cũng không chạy theo. Đo thực tế: sáu lượt truy cập liên
 * tiếp vào một bài, con số vẫn đứng nguyên. Con số khi đó không phải lượt đọc
 * mà gần như là số lần trang được dựng lại.
 *
 * Endpoint này công khai nên có hai lớp chặn lạm dụng: một chốt trong
 * `sessionStorage` phía trình duyệt để cùng một người tải lại không cộng thêm,
 * và rate limit theo IP ở đây cho trường hợp gọi thẳng vào API. Dùng bộ đếm
 * trong RAM chứ không phải Postgres — thiệt hại tối đa nếu bị lạm dụng chỉ là
 * một con số hiển thị bị thổi phồng, không đáng một lệnh ghi DB mỗi request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!rateLimit(`view:${ip}`, { limit: 60, windowMs: 60_000 }).ok) {
    // Im lặng bỏ qua: đây không phải lỗi người đọc cần biết
    return new Response(null, { status: 204 });
  }

  const { id } = await params;
  await incrementViews(id);

  return new Response(null, { status: 204 });
}
