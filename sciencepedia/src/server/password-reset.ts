import "server-only";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

/**
 * Đặt lại mật khẩu qua email.
 *
 * ## Vì sao dùng lại bảng `VerificationToken`
 *
 * Bảng đó do next-auth định nghĩa nhưng chưa có mã nào dùng tới — cả dự án chỉ
 * dùng Credentials và OAuth, không dùng magic link. Cấu trúc của nó
 * (`identifier`, `token` unique, `expires`) khớp đúng thứ luồng này cần, nên
 * thêm một bảng thứ hai cùng hình dạng là nhân đôi chỗ phải dọn token hết hạn.
 *
 * `identifier` ở đây là email đã chuẩn hoá chữ thường.
 *
 * ## Vì sao lưu BĂM của token, không lưu token
 *
 * Token trong CSDL là một mật khẩu tạm: ai đọc được bảng đó thì đặt lại được
 * mật khẩu của mọi tài khoản đang có yêu cầu treo. Lưu SHA-256 thì một bản sao
 * CSDL bị lộ không cho kẻ đọc thứ gì dùng được.
 *
 * Dùng SHA-256 chứ không bcrypt: token là 32 byte ngẫu nhiên từ `randomBytes`,
 * không phải chuỗi người đặt. Không có gì để đoán, nên chi phí làm chậm của
 * bcrypt ở đây chỉ làm chậm chính mình.
 *
 * ## Vì sao mọi nhánh đều trả về như nhau
 *
 * Email không tồn tại, email tồn tại, gửi thư hỏng — cả ba trả cùng một câu.
 * Phân biệt chúng là biến ô "quên mật khẩu" thành công cụ dò xem một địa chỉ
 * có tài khoản ở đây hay không.
 */

/** 60 phút. Đủ để người dùng mở hộp thư, ngắn để một liên kết rò rỉ sớm vô dụng. */
const TTL_MS = 60 * 60 * 1000;

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type ResetRequestResult = { ok: true };

export async function requestReset(
  rawEmail: string,
  origin: string,
  locale: string,
): Promise<ResetRequestResult> {
  const email = rawEmail.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  // Không có tài khoản: dừng im lặng, vẫn trả về ok. Xem chú thích đầu file.
  if (!user) return { ok: true };

  /* Xoá mọi token cũ của email này trước khi phát token mới.
     Không xoá thì mỗi lần bấm "gửi lại" để lại thêm một liên kết còn hiệu lực,
     và cửa sổ tấn công rộng ra theo số lần bấm. */
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hash(token),
      expires: new Date(Date.now() + TTL_MS),
    },
  });

  const link = `${origin}/${locale}/reset-password?token=${token}`;

  const sent = await sendMail({
    to: email,
    subject: "Đặt lại mật khẩu Sciencepedia",
    text: [
      `Chào ${user.name ?? ""}`.trim() + ",",
      "",
      "Có người vừa yêu cầu đặt lại mật khẩu cho tài khoản này.",
      "Mở liên kết dưới đây trong vòng 60 phút:",
      link,
      "",
      "Nếu không phải bạn, bỏ qua thư này — mật khẩu hiện tại vẫn nguyên.",
    ].join("\n"),
    html: `<p>Chào ${user.name ?? "bạn"},</p>
<p>Có người vừa yêu cầu đặt lại mật khẩu cho tài khoản này. Liên kết dưới đây có hiệu lực trong <strong>60 phút</strong>:</p>
<p><a href="${link}">Đặt lại mật khẩu</a></p>
<p>Nếu không phải bạn, bỏ qua thư này — mật khẩu hiện tại vẫn nguyên.</p>`,
  });

  /* Gửi thư hỏng vẫn trả về ok cho NGƯỜI DÙNG, nhưng phải ghi log cho MÁY CHỦ.

     Bản đầu chỉ trả về ok và bỏ qua kết quả của `sendMail`, với chú thích nói
     rằng lỗi "đã được ghi ở tầng sendMail" — điều đó không đúng: `sendMail`
     TRẢ VỀ lỗi chứ không ghi nó. Hệ quả là một khoá Resend sai, một tên miền
     chưa xác minh, hay một địa chỉ bị từ chối đều thất bại hoàn toàn im lặng,
     và người vận hành không có cách nào biết ngoài việc chờ người dùng báo.

     Đây đúng là thứ lỗi mà một luồng "không được để lộ thông tin" dễ mắc:
     giấu thông tin khỏi người dùng bị nhầm thành giấu khỏi chính mình. */
  if (!sent.ok) {
    console.error("[password-reset] gửi thư thất bại:", sent.error);
  }

  /* Ở môi trường phát triển, in liên kết ra console.

     Lý do rất cụ thể: trước khi xác minh một tên miền, Resend chỉ gửi được từ
     `onboarding@resend.dev` và CHỈ tới địa chỉ chủ tài khoản Resend. Lệnh gọi
     API vẫn trả 200 kèm một id — tức phía mình trông như thành công — nhưng
     thư không tới hộp nào cả. Không có đường nào khác để thử luồng này cho
     tới khi tên miền được xác minh, và "không thử được" nghĩa là luồng đặt
     lại mật khẩu đi vào production mà chưa ai chạy qua nó lần nào.

     CHỈ ở development. Liên kết này là một mật khẩu tạm dùng được một lần;
     in nó ra log production là để một credential sống nằm trong file log mà
     nhiều người đọc được. Điều kiện dưới đây là `NODE_ENV`, không phải một
     cờ tự đặt — cờ tự đặt thì có ngày ai đó bật nhầm trên server thật. */
  if (process.env.NODE_ENV === "development") {
    console.info("[password-reset] liên kết (chỉ hiện ở dev):", link);
  }

  return { ok: true };
}

export type ResetResult =
  { ok: true } | { ok: false; error: "INVALID_TOKEN" | "EXPIRED" };

export async function completeReset(
  token: string,
  password: string,
): Promise<ResetResult> {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hash(token) },
  });

  if (!record) return { ok: false, error: "INVALID_TOKEN" };

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: record.token } });
    return { ok: false, error: "EXPIRED" };
  }

  /* Đổi mật khẩu và tiêu token trong CÙNG một transaction.
     Tách ra thì một lỗi giữa chừng để lại token còn sống sau khi mật khẩu đã
     đổi — tức một liên kết dùng lại được lần nữa. */
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    }),
    prisma.verificationToken.delete({ where: { token: record.token } }),
  ]);

  return { ok: true };
}
