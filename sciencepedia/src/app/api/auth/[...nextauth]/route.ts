import type { NextRequest } from "next/server";

import { handlers } from "@/auth";

/**
 * Handler của Auth.js, bọc thêm MỘT dòng log cho các lượt callback hỏng.
 *
 * ## Vì sao phải bọc
 *
 * Auth.js gộp gần hết lỗi thành `error=Configuration` trước khi chuyển hướng
 * (xem chú thích ở `components/auth/login-form.tsx`), nên nhìn từ trình duyệt
 * thì mọi nguyên nhân khác nhau đều giống hệt nhau. Còn log request của Vercel
 * thì không kèm user-agent lẫn cookie, nên nhìn từ máy chủ cũng không phân
 * biệt được "cookie PKCE chưa từng tới" với "cookie tới nhưng sai".
 *
 * Mà đó lại đúng là câu hỏi cần trả lời: đo ngày 2026-09-22 cho thấy cùng một
 * tài khoản đăng nhập Google ĐƯỢC trên máy tính và HỎNG trên điện thoại. Khác
 * biệt duy nhất là ngữ cảnh trình duyệt, nên bằng chứng phải là: lượt callback
 * ấy mang theo những cookie nào, và user-agent nào gửi nó.
 *
 * ## Không ghi gì nhạy cảm
 *
 * Chỉ ghi TÊN cookie (`authjs.*`), không ghi giá trị — giá trị của
 * `pkce.code_verifier` và `csrf-token` là bí mật một lần. `code` của OAuth
 * cũng không ghi. User-agent cắt còn 120 ký tự.
 */
function authCookieNames(request: NextRequest): string {
  const raw = request.headers.get("cookie") ?? "";
  const names = raw
    .split(";")
    .map((c) => c.split("=")[0]?.trim() ?? "")
    .filter((n) => n.includes("authjs"))
    .map((n) => n.replace(/^__(Secure|Host)-/, ""));
  return names.length ? names.join(",") : "(không có)";
}

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);

  const url = new URL(request.url);
  const location = response.headers.get("location") ?? "";
  const failed = url.pathname.includes("/callback/") && location.includes("error=");

  if (failed) {
    console.error(
      "[auth] callback hỏng",
      JSON.stringify({
        path: url.pathname,
        error: new URL(location, url.origin).searchParams.get("error"),
        cookies: authCookieNames(request),
        ua: (request.headers.get("user-agent") ?? "").slice(0, 120),
      }),
    );
  }

  return response;
}

export const POST = handlers.POST;
