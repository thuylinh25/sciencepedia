/**
 * Nhà cung cấp OAuth nào thật sự BẬT — một nguồn sự thật duy nhất.
 *
 * Trước đây có hai điều kiện khác nhau cho cùng một câu hỏi: `auth.ts` đăng ký
 * nhà cung cấp khi có CẢ id lẫn secret, còn `login/page.tsx` vẽ nút khi chỉ có
 * id. Thiếu secret thì trang đăng nhập hiện nút "Tiếp tục với Google" trỏ tới
 * một nhà cung cấp không tồn tại, và Auth.js đá người dùng về
 * `/login?error=Configuration`.
 *
 * ## Vì sao là HÀM, không phải hằng số
 *
 * Một `const` ở cấp module bị chốt ngay lần nạp module đầu tiên — và trên
 * Vercel, lần ấy có thể là lúc BUILD, khi Next dựng sẵn trang đăng nhập tĩnh.
 * Lúc build thì môi trường KHÔNG giống lúc chạy: biến được đánh dấu
 * **Sensitive** (mọi `AUTH_*_SECRET` ở dự án này) chỉ được tiêm cho runtime,
 * còn bước build không thấy chúng.
 *
 * Đó không phải lý thuyết. Bản deploy 2026-09-22 chốt điều kiện "id VÀ secret"
 * rồi đọc nó ở một trang đang prerender: production mất sạch nút Google và
 * GitHub, trong khi `/api/auth/providers` — chạy ở runtime — vẫn liệt kê đủ cả
 * hai. Một câu hỏi, hai môi trường, hai câu trả lời.
 *
 * Nên: hàm, và nơi gọi phải chạy ở RUNTIME (xem `export const dynamic` ở
 * `login/page.tsx`). `auth.ts` đã an toàn sẵn — nó chỉ dựng cấu hình khi một
 * request thật chạm vào Auth.js.
 */
export function oauthProviders() {
  return {
    github: Boolean(
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
    ),
    google: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
    ),
  };
}
