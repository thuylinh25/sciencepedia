import type { NextRequest } from "next/server";

import { isToolViewId } from "@/lib/models";
import { incrementToolViews } from "@/server/queries";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Ghi nhận một lượt xem của một mô hình/công cụ tương tác.
 *
 * Bản song song của `POST /api/articles/[id]/view`, cùng lý do tồn tại: các
 * trang công cụ được prerender/ISR nên server component không chạy ở phần lớn
 * lượt truy cập — đếm ở đó là đếm số lần dựng trang. Xem
 * docs/architecture.md, mục "Đếm lượt đọc".
 *
 * Khác phía bài viết ở một điểm: id ở đây KHÔNG tra CSDL để biết có thật hay
 * không (mô hình không có bảng), mà đối chiếu danh sách đóng trong registry
 * (`isToolViewId`). Endpoint công khai mà nhận id tuỳ ý thì mỗi id bịa là một
 * hàng rác vĩnh viễn trong `ToolViewStat`.
 *
 * Chặn lạm dụng cũng hai lớp như phía bài viết: chốt `sessionStorage` ở
 * `ToolViewTracker` và rate limit theo IP ở đây. Id lạ, bị rate limit hay ghi
 * lỗi đều trả 204 — không có gì để người xem phải biết.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isToolViewId(id)) return new Response(null, { status: 204 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!rateLimit(`tool-view:${ip}`, { limit: 60, windowMs: 60_000 }).ok) {
    return new Response(null, { status: 204 });
  }

  const views = await incrementToolViews(id);

  if (views === null) return new Response(null, { status: 204 });
  return Response.json({ views });
}
