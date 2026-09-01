import type { NextRequest } from "next/server";

import { listArticles } from "@/server/queries";
import { createArticle } from "@/server/actions/articles";
import { articleSchema } from "@/lib/validations";

export const runtime = "nodejs";

/** GET /api/articles — danh sách bài đã xuất bản, có phân trang. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const result = await listArticles({
    page: Math.max(1, Number(params.get("page")) || 1),
    perPage: Math.min(50, Math.max(1, Number(params.get("perPage")) || 12)),
    categorySlug: params.get("category") ?? undefined,
    tagSlug: params.get("tag") ?? undefined,
    sort:
      params.get("sort") === "popular"
        ? "popular"
        : params.get("sort") === "alphabetical"
          ? "alphabetical"
          : "newest",
  });

  return Response.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

/** POST /api/articles — tạo bài viết (yêu cầu quyền EDITOR trở lên). */
export async function POST(request: NextRequest) {
  const parsed = articleSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await createArticle(parsed.data);

  if (!result.ok) {
    const status =
      result.error === "UNAUTHENTICATED"
        ? 401
        : result.error === "FORBIDDEN"
          ? 403
          : result.error === "SLUG_TAKEN"
            ? 409
            : 400;
    return Response.json(result, { status });
  }

  return Response.json(result.data, { status: 201 });
}
