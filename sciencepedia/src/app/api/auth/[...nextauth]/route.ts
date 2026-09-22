import type { NextRequest } from "next/server";

import { handlers, takeAuthCauseSlug } from "@/auth";
import { isInAppBrowser } from "@/lib/in-app-browser";

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

  /* Slug nguyên nhân + việc cookie có tới hay không được gắn vào URL để trang
     đăng nhập hiện lên một dòng nhỏ. Đây là dấu vết TẠM: log của Vercel giữ
     quá ít để bắt được lượt hỏng của người dùng thật (xem `auth.ts`). Gỡ cả
     hai đầu khi đã chốt nguyên nhân. */
  /* Phần thứ ba nói phép dò trình duyệt nhúng có nhận ra thiết bị này không
     (`wv` = có, `br` = không). Nếu lượt hỏng mà vẫn là `br` thì cảnh báo
     "Mở bằng trình duyệt" đã không hiện, và chỗ cần sửa là các mẫu user-agent
     trong `lib/in-app-browser.ts`, không phải luồng đăng nhập. */
  const ua = request.headers.get("user-agent") ?? "";
  target.searchParams.set(
    "dx",
    [
      cause,
      cookies === "(không có)" ? "nocookie" : "cookie",
      isInAppBrowser(ua) ? "wv" : "br",
      decoyReport(request),
    ].join("/"),
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

/* ── Cookie mồi: phân định "hộp cookie khác" với "cookie bị từ chối" ────────
   TẠM, gỡ cùng phần dấu vết còn lại.

   Mã chẩn đoán đang dừng ở `pkce-missing/cookie/br`: lượt quay về CÓ mang
   cookie `authjs.*`, nhưng thiếu đúng `pkce.code_verifier`, và user-agent của
   lượt ấy trông như trình duyệt thật. Hai lời giải thích còn sống, và chúng
   đòi hai cách sửa trái ngược nhau:

   1. Lượt bấm xuất phát từ hộp cookie KHÁC (trình duyệt nhúng), cookie
      `authjs.*` thấy được chỉ là tàn dư của một lần mở trước trong trình duyệt
      này. Sửa: buộc mở trình duyệt hệ thống.
   2. Cùng một hộp cookie, nhưng riêng cookie PKCE không sống sót — tên có
      tiền tố `__Secure-`, hoặc thuộc tính, hoặc kích thước.

   Hai cookie mồi được đặt trong CHÍNH phản hồi dựng cookie PKCE, cùng thuộc
   tính, khác nhau đúng một điểm: một cái mang tiền tố `__Secure-`, một cái
   không. Lượt quay về báo lại cái nào tới được:

     both   → cùng hộp cookie, cả hai mồi sống ⇒ riêng PKCE chết (giả thuyết 2)
     plain  → tiền tố `__Secure-` là thủ phạm
     secure → cookie không tiền tố bị chặn
     none   → không mồi nào tới ⇒ hộp cookie khác hẳn (giả thuyết 1)

   Mồi không mang nội dung gì: giá trị là "1", hết hạn sau 15 phút như PKCE. */
const DECOY_PLAIN = "authdx";
const DECOY_SECURE = "__Secure-authdx";

function decoyReport(request: NextRequest): string {
  const raw = request.headers.get("cookie") ?? "";
  const has = (name: string) =>
    raw.split(";").some((c) => c.trim().startsWith(`${name}=`));
  const plain = has(DECOY_PLAIN);
  const secure = has(DECOY_SECURE);
  if (plain && secure) return "both";
  if (plain) return "plain";
  if (secure) return "secure";
  return "none";
}

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);

  if (!new URL(request.url).pathname.includes("/signin/")) return response;

  const headers = new Headers(response.headers);
  const attributes = "Path=/; Max-Age=900; SameSite=Lax; HttpOnly";
  headers.append("set-cookie", `${DECOY_PLAIN}=1; ${attributes}; Secure`);
  headers.append("set-cookie", `${DECOY_SECURE}=1; ${attributes}; Secure`);

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
