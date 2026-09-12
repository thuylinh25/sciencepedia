import "server-only";

/**
 * Gửi email qua Resend, bằng `fetch` thẳng tới HTTP API.
 *
 * ## Vì sao không cài SDK `resend`
 *
 * API cần đúng một lệnh POST với một thân JSON. Một phụ thuộc nữa trong
 * `package.json` để gói lại một lệnh fetch là chi phí bảo trì không đổi lấy
 * được gì — và nó kéo theo cả vòng đời nâng cấp, kiểm bảo mật, khác biệt
 * runtime giữa Node và Edge.
 *
 * ## Vì sao trả về kết quả thay vì ném lỗi
 *
 * Nơi gọi hàm này là luồng quên mật khẩu, và luồng đó KHÔNG được để lộ việc
 * một email có tồn tại trong hệ thống hay không. Nếu gửi mail ném lỗi thì
 * người gọi phải bắt và nuốt nó ở mọi nhánh; trả về kết quả thì việc "ghi log
 * rồi vẫn trả lời như nhau" là mặc định chứ không phải điều phải nhớ.
 */

export type MailResult = { ok: true } | { ok: false; error: string };

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Địa chỉ người gửi.
 *
 * Resend CHỈ gửi được từ một tên miền đã xác minh trong tài khoản. Trước khi
 * xác minh, giá trị duy nhất dùng được là `onboarding@resend.dev` và nó chỉ
 * gửi tới chính email chủ tài khoản — đủ để thử, không đủ để chạy thật.
 *
 * Nên `MAIL_FROM` là biến môi trường: ngày tên miền được xác minh thì đổi một
 * dòng cấu hình, không phải sửa mã.
 *
 * HỆ QUẢ PHẢI BIẾT khi chưa xác minh tên miền: mọi thư gửi tới địa chỉ KHÁC
 * chủ tài khoản Resend đều bị từ chối. Người thử luồng quên mật khẩu bằng một
 * email bất kỳ sẽ không nhận được gì, và vì luồng ấy cố ý không phân biệt các
 * nhánh với người dùng nên nó trông y hệt như thành công. Dòng log ở
 * `password-reset.ts` là chỗ duy nhất nhìn ra được.
 */
const FROM = process.env.MAIL_FROM ?? "Sciencepedia <onboarding@resend.dev>";

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  /** Bản chữ thuần. Không phải tuỳ chọn: thiếu nó thì bộ lọc thư rác chấm điểm nặng. */
  text: string;
}): Promise<MailResult> {
  if (!isMailConfigured()) return { ok: false, error: "NO_API_KEY" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false, error: `${response.status} ${detail.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
