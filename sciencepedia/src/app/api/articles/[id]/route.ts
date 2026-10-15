import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/rbac";
import { articleSchema } from "@/lib/validations";
import { deleteArticle, updateArticle } from "@/server/actions/articles";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function statusFor(error: string) {
  return error === "UNAUTHENTICATED"
    ? 401
    : error === "FORBIDDEN"
      ? 403
      : error === "NOT_FOUND"
        ? 404
        : error === "SLUG_TAKEN"
          ? 409
          : 400;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true, image: true } },
      sources: true,
    },
  });

  if (!article) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Bài chưa xuất bản chưa qua gate accuracy — chỉ biên tập viên được đọc.
  // Người khác nhận 404 như bài không tồn tại, để id không thành cách dò bài nháp.
  if (article.status !== "PUBLISHED") {
    try {
      await requireRole("EDITOR");
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      throw error;
    }
  }

  return Response.json(article, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const parsed = articleSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await updateArticle(id, parsed.data);
  if (!result.ok) return Response.json(result, { status: statusFor(result.error) });

  return Response.json(result.data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await deleteArticle(id);

  if (!result.ok) return Response.json(result, { status: statusFor(result.error) });
  return new Response(null, { status: 204 });
}
