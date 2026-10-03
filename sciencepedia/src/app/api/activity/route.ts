import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { recordDuration, recordView } from "@/server/activity";

export const runtime = "nodejs";

/**
 * Ghi lịch sử xem của người dùng ĐANG đăng nhập — gọi từ `useContentActivity`.
 *
 * `userId` lấy từ session phía server, không bao giờ từ body: một người chỉ ghi
 * được lịch sử của chính mình. Khách gọi vào thì 204, không chạm CSDL.
 *
 * Luôn trả 204, kể cả khi lỗi: client gửi bằng `sendBeacon` và không đọc phản
 * hồi; tracking hỏng không có gì để người đọc phải biết.
 */

const body = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("article"),
    id: z.string().min(1).max(64),
    event: z.enum(["view", "duration"]),
    seconds: z.number().int().min(0).max(3600),
  }),
  z.object({
    type: z.literal("model"),
    // Id ổn định của Human Atlas — xem `ContentActivity.contentId`
    id: z.string().regex(/^(structure|view):[\w.:-]{1,150}$/),
    label: z.string().trim().min(1).max(200).optional(),
    event: z.enum(["view", "duration"]),
    seconds: z.number().int().min(0).max(3600),
  }),
]);

const done = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return done();

  // Mỗi trang gửi một lượt "view" và vài lượt "duration" — 60/phút là dư
  // nhiều cho người thật, chỉ chặn vòng lặp hỏng hay gọi thẳng vào API.
  if (!rateLimit(`activity:${userId}`, { limit: 60, windowMs: 60_000 }).ok) {
    return done();
  }

  let parsed: z.infer<typeof body>;
  try {
    // sendBeacon gửi Blob JSON; đọc text rồi parse để không phụ thuộc content-type
    const result = body.safeParse(JSON.parse(await request.text()));
    if (!result.success) return new Response(null, { status: 400 });
    parsed = result.data;
  } catch {
    return new Response(null, { status: 400 });
  }

  const type = parsed.type === "article" ? "ARTICLE" : "MODEL";

  try {
    if (parsed.event === "duration") {
      if (parsed.seconds > 0) {
        await recordDuration({ userId, type, contentId: parsed.id, seconds: parsed.seconds });
      }
      return done();
    }

    if (parsed.type === "article") {
      // Chỉ bài có thật và đang xuất bản — id lạ không được tạo hàng rác
      const article = await prisma.article.findFirst({
        where: { id: parsed.id, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!article) return done();
    }

    await recordView({
      userId,
      type,
      contentId: parsed.id,
      label: parsed.type === "model" ? (parsed.label ?? null) : null,
      seconds: parsed.seconds,
    });
  } catch (error) {
    console.error("[activity] không ghi được:", error);
  }
  return done();
}
