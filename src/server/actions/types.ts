/**
 * Kiểu trả về chung của Server Actions.
 *
 * Đặt ở file riêng (không có "use server") vì một module "use server" chỉ được
 * export các hàm async — để kiểu ở đó dễ khiến trình biên dịch phàn nàn.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
