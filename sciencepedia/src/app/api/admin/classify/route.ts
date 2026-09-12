import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { classifyDraft, isClassifyConfigured } from "@/server/classify";

/**
 * Gợi ý danh mục, thẻ và SEO cho một bản nháp đang soạn.
 *
 * `runtime = "nodejs"` và `maxDuration` là BẮT BUỘC, không phải tối ưu:
 * Agent SDK khởi chạy một tiến trình con, nên route này không chạy được ở
 * Edge runtime, và một lượt gọi mô hình vượt xa mặc định 10 giây.
 *
 * Xem `src/server/classify.ts` để biết vì sao đi qua Agent SDK chứ không qua
 * `@anthropic-ai/sdk`, và ràng buộc triển khai kèm theo.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  title: z.string().min(3),
  content: z.string().min(50),
  summary: z.string().optional(),
});

export async function POST(request: Request) {
  /* Chặn quyền TRƯỚC khi chạm vào thân yêu cầu.
     Route này tiêu hạn mức tài khoản mỗi lần gọi, nên nó là một tài nguyên
     tốn tiền chứ không chỉ là một phép đọc — để ngỏ cho người chưa đăng nhập
     là để ngỏ một vòi tiêu hạn mức. */
  try {
    await requireRole("EDITOR");
  } catch {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isClassifyConfigured()) {
    return Response.json(
      {
        error: "NO_CREDENTIAL",
        detail:
          "Chưa có CLAUDE_CODE_OAUTH_TOKEN. Sinh bằng `claude setup-token` rồi đặt vào .env.",
      },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  /* Đọc danh mục và thẻ NGAY LÚC GỌI, không nhận từ client.
     Client gửi lên danh sách id thì client cũng quyết được tập chọn, và một
     id không có thật sẽ đi thẳng vào form. Đọc từ CSDL thì tập chọn luôn đúng
     với thực tế tại thời điểm gọi. */
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const result = await classifyDraft({ ...parsed.data, categories, tags });

  if (!result.ok) {
    const status = result.error === "NO_CREDENTIAL" ? 503 : 502;
    return Response.json(result, { status });
  }

  return Response.json(result.data);
}
