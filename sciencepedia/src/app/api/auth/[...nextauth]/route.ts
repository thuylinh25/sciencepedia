import type { NextRequest } from "next/server";

import { handlers, takeAuthCauseSlug } from "@/auth";

/**
 * Handler của Auth.js, bọc thêm hai việc: ghi một dòng log khi lượt callback
 * hỏng, và bắt lại lượt đăng nhập khi nguyên nhân là thứ tự khỏi.
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
  const failed =
    url.pathname.includes("/callback/") && location.includes("error=");

  if (!failed) return response;

  const cookies = authCookieNames(request);
  const target = new URL(location, url.origin);
  /* Lấy MỘT lần: `takeAuthCauseSlug` xoá dấu vết khi đọc, gọi hai lần thì lần
     sau trả `null`. */
  const cause = takeAuthCauseSlug() ?? "nolog";

  console.error(
    "[auth] callback hỏng",
    JSON.stringify({
      path: url.pathname,
      error: target.searchParams.get("error"),
      cause,
      cookies,
      ua: (request.headers.get("user-agent") ?? "").slice(0, 120),
    }),
  );

  const headers = new Headers(response.headers);

  /* ── Bắt lại lượt đăng nhập, MỘT lần, trong trình duyệt đang cầm callback ──

     Đo trên production 2026-09-22: `pkce-missing/cookie/br/none`. Không cookie
     mồi nào quay về, dù chúng được đặt trong chính phản hồi dựng cookie PKCE —
     nên lượt bấm và lượt quay về nằm ở hai hộp cookie khác nhau. Người dùng
     bấm trong trình duyệt nhúng của một app, Google trả về trình duyệt hệ
     thống, và cookie PKCE ở lại bên kia.

     Không dò được app ấy qua user-agent (phần `br`), nên cách chữa không được
     phụ thuộc vào việc dò. Thay vào đó: trình duyệt ĐANG cầm callback chính là
     một trình duyệt tử tế — nó vừa nhận được chuyển hướng từ Google. Bắt lại
     lượt đăng nhập ở đây thì cả hai nửa cùng một hộp cookie, và lượt thứ hai
     chạy được. Đây cũng chính là lời giải thích cho triệu chứng "lần 1 hỏng,
     lần 2 được" đã ghi ở `docs/process/diagnosis.md`, nay làm tự động thay vì
     bắt người dùng tự đoán ra.

     Chặn vòng lặp bằng một cookie đánh dấu: chỉ bắt lại ĐÚNG MỘT lần, và chỉ
     cho hai nguyên nhân thật sự tự khỏi khi đổi ngữ cảnh. Mọi nguyên nhân khác
     đi thẳng tới trang lỗi như cũ. */
  const provider = url.pathname.split("/").pop() ?? "";
  const canRetry =
    (cause === "pkce-missing" || cause === "state-missing") &&
    provider !== "" &&
    !request.cookies.has(RETRY_COOKIE);

  if (canRetry) {
    target.searchParams.set("retry", provider);
    headers.append(
      "set-cookie",
      `${RETRY_COOKIE}=1; Path=/; Max-Age=300; SameSite=Lax; HttpOnly; Secure`,
    );
  }

  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, headers });
}

/** Đánh dấu "đã bắt lại một lần" — xem khối chú thích ở `GET`. */
const RETRY_COOKIE = "authretry";

export const POST = handlers.POST;
