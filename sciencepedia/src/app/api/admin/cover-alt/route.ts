import { z } from "zod";

import { rateLimitShared } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { describeCover, isCoverAltConfigured } from "@/server/cover-alt";

/**
 * Tả ảnh bìa vừa chọn trong form bài viết — Gemini nhìn ảnh, trả `{vi, en}`.
 *
 * Chỉ ĐỀ XUẤT: kết quả đổ vào form chưa lưu, người biên tập thấy và sửa được.
 * Lý do và quy tắc không ghi đè: docs/architecture.md, "Mô tả ảnh bìa tự động".
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().trim().url().max(2048),
});

export async function POST(request: Request) {
  /* Chặn quyền TRƯỚC khi chạm vào thân yêu cầu — như `/api/admin/classify`.
     Mỗi lượt gọi tiêu hạn mức Gemini và khiến máy chủ tải một URL tuỳ ý. */
  let userId: string;
  try {
    ({ id: userId } = await requireRole("EDITOR"));
  } catch {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isCoverAltConfigured()) {
    return Response.json(
      { error: "NO_CREDENTIAL", detail: "Chưa có GEMINI_API_KEY trong biến môi trường." },
      { status: 503 },
    );
  }

  // Đổi ảnh liên tục hay bấm "Tạo lại" dồn dập là một vòi tiêu hạn mức.
  const limit = await rateLimitShared(`cover-alt:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!limit.ok) {
    return Response.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const alt = await describeCover(parsed.data.url);
  if (!alt) {
    // Lý do cụ thể (ảnh hỏng, 429, đầu ra rác) đã ghi log trong `describeCover`.
    return Response.json({ error: "FAILED" }, { status: 502 });
  }

  return Response.json(alt);
}
