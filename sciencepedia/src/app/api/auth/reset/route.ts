import { z } from "zod";

import { rateLimitShared } from "@/lib/rate-limit";
import { completeReset, requestReset } from "@/server/password-reset";

/**
 * Hai thao tác của luồng quên mật khẩu, trên cùng một route.
 *
 *   POST { email }            → gửi liên kết đặt lại
 *   POST { token, password }  → đặt mật khẩu mới
 *
 * Gộp vào một route vì chúng là hai nửa của một luồng và dùng chung giới hạn
 * tần suất. Tách ra thành hai file thì giới hạn ấy phải viết hai lần.
 */
export const runtime = "nodejs";

const requestSchema = z.object({ email: z.string().email() });

const completeSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  /* Giới hạn tần suất theo IP, và nó BẮT BUỘC ở đây chứ không phải tuỳ chọn.
     Không có nó thì ô "quên mật khẩu" thành một vòi gửi thư: ai cũng bơm được
     hàng nghìn email tới một địa chỉ bất kỳ, và tên miền gửi bị đánh dấu rác. */
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await rateLimitShared(`reset:${ip}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!allowed.ok) {
    return Response.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  // --- Nửa hai: đặt mật khẩu mới ---
  const complete = completeSchema.safeParse(body);
  if (complete.success) {
    const result = await completeReset(
      complete.data.token,
      complete.data.password,
    );
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  // --- Nửa một: xin liên kết ---
  const requested = requestSchema.safeParse(body);
  if (!requested.success) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  /* `origin` lấy từ biến môi trường, KHÔNG từ header của yêu cầu.

     Header `Host` do client gửi và sửa được. Dựng liên kết đặt lại mật khẩu
     từ nó là mời một cuộc tấn công kinh điển: kẻ tấn công gửi yêu cầu với
     Host trỏ về máy chủ của mình, nạn nhân nhận thư thật từ tên miền thật, bấm
     vào, và token đi thẳng tới kẻ tấn công. */
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const locale = new URL(request.url).searchParams.get("locale") ?? "vi";

  const result = await requestReset(requested.data.email, origin, locale);
  return Response.json(result);
}
