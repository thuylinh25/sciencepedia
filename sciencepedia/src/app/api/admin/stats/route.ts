import { getSiteStats } from "@/server/queries";
import { authErrorResponse, requireRole } from "@/lib/rbac";

export const runtime = "nodejs";

/**
 * Số liệu kho cho dải thống kê ở footer.
 *
 * ## Vì sao là một API route chứ không render thẳng ở server
 *
 * Dải này chỉ dành cho quản trị, mà footer thì nằm trong layout của MỌI trang.
 * Kiểm quyền ở server nghĩa là gọi `auth()` trong layout, và `auth()` đọc
 * cookie — một lần đọc cookie ở layout là cả 267 trang tĩnh rơi xuống dynamic.
 * Đó là cái giá quá đắt cho một dải số liệu, và nó đi ngược quy tắc đầu tiên
 * của dự án (static mặc định, xem CLAUDE.md).
 *
 * Nên footer giữ nguyên tĩnh, còn dải số liệu là một Client Component tự hỏi
 * API này sau khi biết mình đang là quản trị.
 *
 * ## Vì sao KHÔNG chỉ ẩn bằng CSS
 *
 * Ẩn ở client thì con số vẫn nằm trong HTML, ai xem mã nguồn cũng đọc được —
 * tức là không giấu gì cả, chỉ làm cho mình tưởng là đã giấu. Số phải đi qua
 * một cửa có kiểm quyền thật thì mới là riêng tư.
 */
export async function GET() {
  try {
    await requireRole("ADMIN");
    return Response.json(await getSiteStats());
  } catch (error) {
    return (
      authErrorResponse(error) ??
      Response.json({ error: "INTERNAL" }, { status: 500 })
    );
  }
}
