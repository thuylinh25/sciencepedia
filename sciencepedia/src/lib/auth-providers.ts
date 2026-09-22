/**
 * Nhà cung cấp OAuth nào thật sự BẬT — một nguồn sự thật duy nhất.
 *
 * Trước đây có hai điều kiện khác nhau cho cùng một câu hỏi: `auth.ts` đăng ký
 * nhà cung cấp khi có CẢ id lẫn secret, còn `login/page.tsx` vẽ nút khi chỉ có
 * id. Thiếu secret (trường hợp hay gặp nhất: dán id vào Vercel rồi quên secret)
 * thì trang đăng nhập hiện nút "Tiếp tục với Google" trỏ tới một nhà cung cấp
 * không tồn tại, và Auth.js đá người dùng về `/login?error=Configuration`.
 * Màn hình khi ấy tự mâu thuẫn: băng đỏ bảo "đăng nhập mạng xã hội đang không
 * chạy" ngay phía trên chính những cái nút đó.
 *
 * Mọi nơi hỏi "nút này có nên hiện không" và "provider này có nên đăng ký
 * không" đều phải đọc từ đây, để hai câu trả lời không bao giờ lệch nhau nữa.
 */
export const oauthProviders = {
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  facebook: Boolean(
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
  ),
} as const;
