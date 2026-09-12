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

  await sendMail({
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

  // Gửi thư hỏng cũng trả về ok, và lỗi đã được ghi ở tầng `sendMail`.
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
