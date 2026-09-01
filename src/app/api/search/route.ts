import type { NextRequest } from "next/server";

import { search } from "@/lib/search";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Tìm kiếm toàn văn — dùng bởi hộp tìm nhanh (⌘K) và trang /search. */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`search:${ip}`, { limit: 120, windowMs: 60_000 }).ok) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();

  if (query.length < 2) {
    return Response.json({ hits: [], total: 0 });
  }

  const limit = Math.min(50, Math.max(1, Number(params.get("limit")) || 10));
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sortParam = params.get("sort");
  const sort =
    sortParam === "newest" || sortParam === "popular" ? sortParam : "relevance";

  const result = await search({
    query,
    categorySlug: params.get("category") ?? undefined,
    limit,
    offset: (page - 1) * limit,
    sort,
  });

  if (result.backend === "none") {
    return Response.json({ error: "SEARCH_UNAVAILABLE" }, { status: 503 });
  }

  return Response.json(
    {
      hits: result.hits,
      total: result.total,
      page,
      backend: result.backend,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}
