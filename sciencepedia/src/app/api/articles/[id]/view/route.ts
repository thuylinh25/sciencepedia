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
 *
 * Trả về `{ views }` — số lượt SAU khi cộng — để `ViewCount` hiển thị. Con số
 * không nằm trong HTML ISR của trang bài nữa: nằm đó thì mỗi lượt đọc làm lần
 * tái dựng kế tiếp ra byte khác, tức một ISR Write mỗi bài mỗi 5 phút. Cùng
 * một câu `UPDATE … RETURNING` như trước, nên không thêm truy vấn nào. 204 (không
 * có số) khi bị rate limit hoặc không ghi được — trang khi đó ẩn con số.
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
  const views = await incrementViews(id);

  if (views === null) return new Response(null, { status: 204 });
  return Response.json({ views });
}
