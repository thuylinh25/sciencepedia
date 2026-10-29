import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Nhắc sự kiện thiên văn của người dùng đã đăng nhập (S1).
 *
 * Kỷ luật như `/api/activity`: `userId` chỉ lấy từ session phía
 * server, không bao giờ từ thân yêu cầu — một người chỉ đặt/gỡ được
 * nhắc của chính mình. Dữ kiện sự kiện (tên, mốc, múi giờ) do client
 * gửi lên từ `events.ts` nhưng bị kẹp chặt: id phải đúng khuôn của
 * registry sự kiện, mốc phải nằm trong cửa sổ hợp lệ quanh hiện tại.
 *
 * Trước khi migration chạy trên production, bảng chưa tồn tại:
 * Prisma ném P2021 → route trả 503 NOT_READY để giao diện hiện lỗi
 * nhẹ thay vì sập (tiền lệ triển khai dần của ToolViewStat).
 */

const NOT_READY = () =>
  Response.json({ error: "NOT_READY" }, { status: 503 });

function isMissingTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2021"
  );
}

const createBody = z.object({
  eventId: z
    .string()
    .regex(/^(meteor|full-moon|new-moon|season)-[\w-]{1,60}$/),
  nameVi: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  instant: z.string().datetime(),
  tz: z.string().min(1).max(64),
  locale: z.enum(["vi", "en"]),
});

const deleteBody = z.object({
  eventId: z.string().min(1).max(80),
});

function validTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const reminders = await prisma.skyEventReminder.findMany({
      where: { userId: session.user.id },
      select: { eventId: true, eventInstant: true },
      orderBy: { eventInstant: "asc" },
    });
    return Response.json({ reminders });
  } catch (error) {
    if (isMissingTable(error)) return NOT_READY();
    throw error;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const parsed = createBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validTz(parsed.data.tz)) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const instant = new Date(parsed.data.instant);
  const now = Date.now();
  if (
    instant.getTime() < now - 2 * 86_400_000 ||
    instant.getTime() > now + 400 * 86_400_000
  ) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  try {
    await prisma.skyEventReminder.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: parsed.data.eventId,
        },
      },
      create: {
        userId: session.user.id,
        eventId: parsed.data.eventId,
        nameVi: parsed.data.nameVi,
        nameEn: parsed.data.nameEn,
        eventInstant: instant,
        tz: parsed.data.tz,
        locale: parsed.data.locale,
      },
      update: {
        nameVi: parsed.data.nameVi,
        nameEn: parsed.data.nameEn,
        eventInstant: instant,
        tz: parsed.data.tz,
        locale: parsed.data.locale,
        sentAt: null,
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (isMissingTable(error)) return NOT_READY();
    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const parsed = deleteBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  try {
    await prisma.skyEventReminder.deleteMany({
      where: { userId: session.user.id, eventId: parsed.data.eventId },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (isMissingTable(error)) return NOT_READY();
    throw error;
  }
}
