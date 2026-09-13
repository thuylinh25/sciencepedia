/**
 * Bốn route "chỉ có một việc để làm": đăng nhập, đăng ký, quên mật khẩu, đặt
 * lại mật khẩu.
 *
 * Chúng dùng chung `AuthShell` — một khung hai cột cao bằng cửa sổ, tự có
 * footer pháp lý riêng — nên phần khung chung của site phải lùi lại ở đây:
 * header rút gọn còn logo + ngôn ngữ + theme, và footer đầy đủ thì KHÔNG
 * render.
 *
 * Vì sao bỏ hẳn footer chứ không chỉ thu nhỏ: dải số liệu cộng bốn cột liên
 * kết cao hơn cả form đăng nhập, nên nó biến một trang đáng lẽ gọn trong một
 * màn hình thành một trang phải cuộn — và thứ người ta cuộn tới lại là hai
 * mươi lối đi khác, đặt ngay dưới ô mật khẩu họ đang gõ dở. Với người vừa
 * nhập sai mật khẩu, mỗi lối thoát thêm là một lý do để rời đi thay vì thử
 * lại. `AuthShell` đã tự in bản quyền và hai liên kết pháp lý — đúng phần bắt
 * buộc phải có, không hơn.
 *
 * Danh sách nằm ở module riêng vì cả header (client) lẫn chỗ đặt footer
 * (client) đều đọc nó; hai bản chép tay thì thêm một route auth mới sẽ chỉ
 * được sửa ở một nơi.
 */
export const FOCUSED_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/**
 * `pathname` ở đây là đường dẫn ĐÃ BỎ tiền tố ngôn ngữ — tức `usePathname`
 * của `@/i18n/navigation`, không phải của `next/navigation`. Dùng nhầm cái
 * thứ hai thì mọi so sánh đều trượt vì chuỗi thật là `/vi/login`.
 */
export function isFocusedRoute(pathname: string): boolean {
  return FOCUSED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
