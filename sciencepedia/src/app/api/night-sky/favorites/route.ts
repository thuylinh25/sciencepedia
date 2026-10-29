import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findCatalogEntry } from "@/lib/night-sky/catalog";

export const runtime = "nodejs";

/**
 * Thiên thể yêu thích của người dùng đã đăng nhập (S1). Cùng kỷ
 * luật với route reminders bên cạnh: userId từ session, `targetId`
 * phải là một id có thật trong catalog thiên thể phía code — bảng
 * chỉ giữ id, tên hiển thị tra lại từ catalog ở phía đọc.
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

const body = z.object({ targetId: z.string().min(1).max(80) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const favorites = await prisma.skyFavorite.findMany({
      where: { userId: session.user.id },
      select: { targetId: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ favorites });
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
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !findCatalogEntry(parsed.data.targetId)) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  try {
    await prisma.skyFavorite.upsert({
      where: {
        userId_targetId: {
          userId: session.user.id,
          targetId: parsed.data.targetId,
        },
      },
      create: { userId: session.user.id, targetId: parsed.data.targetId },
      update: {},
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
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  try {
    await prisma.skyFavorite.deleteMany({
      where: { userId: session.user.id, targetId: parsed.data.targetId },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (isMissingTable(error)) return NOT_READY();
    throw error;
  }
}
