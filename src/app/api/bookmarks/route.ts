import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireUser } from "@/lib/rbac";

export const runtime = "nodejs";

/** GET /api/bookmarks?articleId=… — bài này đã được lưu chưa. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const articleId = request.nextUrl.searchParams.get("articleId");

    if (!articleId) {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: user.id },
        select: { articleId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      return Response.json({ bookmarks });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: user.id, articleId } },
    });

    return Response.json({ saved: Boolean(bookmark) });
  } catch (error) {
    return authErrorResponse(error) ?? handleUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { articleId } = (await request.json()) as { articleId?: string };
    if (!articleId) {
      return Response.json({ error: "MISSING_ARTICLE_ID" }, { status: 400 });
    }

    // upsert để bấm hai lần không gây lỗi khoá trùng
    await prisma.bookmark.upsert({
      where: { userId_articleId: { userId: user.id, articleId } },
      create: { userId: user.id, articleId },
      update: {},
    });

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? handleUnknown(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const { articleId } = (await request.json()) as { articleId?: string };
    if (!articleId) {
      return Response.json({ error: "MISSING_ARTICLE_ID" }, { status: 400 });
    }

    await prisma.bookmark.deleteMany({ where: { userId: user.id, articleId } });
    return Response.json({ saved: false });
  } catch (error) {
    return authErrorResponse(error) ?? handleUnknown(error);
  }
}

function handleUnknown(error: unknown) {
  console.error("[bookmarks]", error);
  return Response.json({ error: "SERVER_ERROR" }, { status: 500 });
}
