import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Làm mới ngay một trang bài viết sau khi sửa dữ liệu thẳng trên Supabase.
 *
 *   curl -X POST https://<host>/api/revalidate \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slug":"ten-bai-viet"}'
 *
 * ## Vì sao cần
 *
 * Trang bài đặt `revalidate = 300` và được prerender sẵn. Sửa một cột trong
 * bảng Article không đi qua code nên Next không biết gì: bản HTML cũ vẫn được
 * phục vụ tới năm phút, và vì stale-while-revalidate, lượt truy cập đầu tiên
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

  let slug: unknown;
  try {
    ({ slug } = (await request.json()) as { slug?: unknown });
  } catch {
    return Response.json({ error: "Body phải là JSON" }, { status: 400 });
  }

  if (typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/.test(slug)) {
    return Response.json(
      { error: "Thiếu `slug` hợp lệ (chữ thường, số và dấu gạch ngang)" },
      { status: 400 },
    );
  }

  const revalidated = locales.map((locale) => {
    const path = `/${locale}/articles/${slug}`;
    revalidatePath(path);
    return path;
  });

  return Response.json({ revalidated, at: new Date().toISOString() });
}
