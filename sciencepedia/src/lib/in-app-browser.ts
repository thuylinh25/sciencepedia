/**
 * Nhận biết trình duyệt NHÚNG trong một ứng dụng khác, và dựng đường mở lại
 * trang bằng trình duyệt hệ thống.
 *
 * ## Vì sao cần
 *
 * Lượt OAuth không thể hoàn tất khi nó bắt đầu ở một trình duyệt và kết thúc
 * ở một trình duyệt khác. Đo trên production 2026-09-22: mã chẩn đoán trả về
 * `pkce-missing/cookie` — máy chủ NHẬN được cookie `authjs.*` nhưng thiếu
 * đúng `pkce.code_verifier`. Cookie ấy được đặt ở lượt `POST signin`, tức
 * trong trình duyệt nhúng của app; còn Google trả về Chrome, nơi chỉ có
 * `csrf-token` còn sót từ một lần mở trước. Cùng một người, hai hộp cookie.
 *
 * PKCE không thể bỏ để "cho tiện" — nó là thứ chặn việc đánh cắp mã uỷ quyền.
 * Nên chỗ sửa duy nhất còn lại là ĐỪNG BẮT ĐẦU lượt đăng nhập trong trình
 * duyệt nhúng.
 *
 * ## Vì sao dò theo user-agent, dù cách ấy vốn mong manh
 *
 * Không có API nào cho biết "tôi đang nằm trong webview của một app". Các mẫu
 * dưới đây là chuỗi mà chính các app ấy tự thêm vào user-agent, nên nhận sai
 * chỉ dẫn tới việc hiện thêm một nút "Mở bằng trình duyệt" — không chặn ai
 * khỏi đăng nhập. Sai theo hướng vô hại.
 */
const IN_APP_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook, Messenger
  /Instagram/i,
  /Zalo/i,
  /Line\//i,
  /TikTok|musical_ly|BytedanceWebview/i,
  /MicroMessenger/i, // WeChat
  /Snapchat/i,
  /Twitter(?:Android|iPhone)/i,
  /; wv\)/i, // Android WebView nói chung
];

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * URL mở `target` bằng trình duyệt hệ thống, hoặc `null` nếu nền tảng không có
 * đường nào.
 *
 * Android: `intent://` kèm `package=com.android.chrome` và một
 * `browser_fallback_url` cho máy không có Chrome. iOS: `x-safari-https://`,
 * một lược đồ Safari đăng ký sẵn mà phần lớn webview cho đi qua.
 *
 * Trả `null` cho nền tảng khác thay vì đoán: một nút bấm không ăn còn tệ hơn
 * không có nút, và người dùng vẫn còn lối đăng nhập bằng email.
 */
export function systemBrowserUrl(
  userAgent: string,
  target: string,
): string | null {
  const withoutScheme = target.replace(/^https?:\/\//, "");

  if (/Android/i.test(userAgent)) {
    return [
      `intent://${withoutScheme}#Intent`,
      "scheme=https",
      "package=com.android.chrome",
      `S.browser_fallback_url=${encodeURIComponent(target)}`,
      "end",
    ].join(";");
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return `x-safari-https://${withoutScheme}`;
  }

  return null;
}
