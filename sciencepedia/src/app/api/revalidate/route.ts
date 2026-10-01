import type { NextRequest } from "next/server";

import { revalidateArticles } from "@/server/revalidate-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Làm mới cache sau khi sửa bài thẳng trong CSDL — từ script (`publish.ts`,
 * `links:fix`…, qua `scripts/revalidate-site.ts`) hoặc tay trên Supabase.
 *
 *   npm run revalidate -- --slug ten-bai-viet      # hoặc:
 *   curl -X POST https://<host>/api/revalidate \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slugs":["ten-bai-viet"]}'
 *
 * Làm đúng việc form quản trị làm (`revalidateArticles`): trang chủ, danh
 * sách, tag `articles`, và trang bài của từng slug. `slugs` rỗng vẫn hợp lệ —
 * sửa hàng loạt thì làm mới trang chủ và danh sách, trang bài tự hết hạn.
 * `{"slug": "…"}` (một bài) vẫn nhận, cho lệnh curl cũ.
 *
 * ## Vì sao cần
 *
 * Trang bài đặt `revalidate = 300`, trang chủ 120. Sửa một cột trong bảng
 * Article không đi qua code nên Next không biết gì: bản HTML cũ vẫn được
 * phục vụ tới hết TTL, và vì stale-while-revalidate, lượt truy cập đầu tiên
 * sau khi hết hạn vẫn nhận bản cũ — lượt sau mới thấy bản mới. Chờ mười phút
 * rồi kết luận "code hỏng" là cái bẫy đã dính một lần với sketchfabModelId.
 *
 * ## Vì sao dùng chung CRON_SECRET
 *
 * Cùng một loại quyền: bắt máy chủ làm việc nặng theo yêu cầu. Thêm một biến
 * môi trường thứ hai chỉ tạo thêm một thứ để quên đặt trên Vercel. Chưa đặt
 * secret thì route tự khoá chứ không mở toang — revalidate công khai là một
 * cách miễn phí để ai đó bắt trang render lại liên tục.
 *
 * Không nhận `path` tuỳ ý: chỉ nhận slug và tự dựng đường dẫn cho từng locale.
 * Nhận path thô nghĩa là để người gọi quyết định cái gì bị xoá khỏi cache.
 */
const SLUG = /^[a-z0-9-]{1,200}$/;
/** Đủ cho một lượt sửa hàng loạt; script tự chia lô nếu nhiều hơn. */
const MAX_SLUGS = 100;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "Chưa đặt CRON_SECRET nên không cho revalidate" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Không được phép" }, { status: 401 });
  }

  let body: { slug?: unknown; slugs?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Body phải là JSON" }, { status: 400 });
  }

  const slugs =
    body.slugs !== undefined ? body.slugs : body.slug !== undefined ? [body.slug] : [];

  if (
    !Array.isArray(slugs) ||
    slugs.length > MAX_SLUGS ||
    !slugs.every((slug) => typeof slug === "string" && SLUG.test(slug))
  ) {
    return Response.json(
      {
        error: `\`slugs\` phải là mảng tối đa ${MAX_SLUGS} slug hợp lệ (chữ thường, số và dấu gạch ngang)`,
      },
      { status: 400 },
    );
  }

  const revalidated = revalidateArticles(slugs as string[]);

  return Response.json({ revalidated, at: new Date().toISOString() });
}
