import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/mail";
import {
  buildReminderMail,
  reminderDue,
  REMINDER_WINDOW_MS,
} from "@/lib/night-sky/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Gửi thư nhắc sự kiện thiên văn (S1) — chạy hằng ngày qua Vercel
 * Cron (lịch trong vercel.json, 01:00 UTC = 08:00 giờ Việt Nam).
 *
 * Khoá cửa đúng khuôn `/api/cron/sync-sources`: Vercel gửi kèm
 * `Authorization: Bearer $CRON_SECRET`; chưa đặt bí mật thì route tự
 * khoá (503) thay vì mở toang một endpoint ai cũng gọi được để bắt
 * máy chủ gửi thư.
 *
 * Chọn nhắc: `sentAt` còn trống và mốc sự kiện nằm trong cửa sổ
 * (now, now+36h] của `reminderDue` — truy vấn CSDL lọc thô theo
 * cùng cửa sổ, `reminderDue` chốt lại từng hàng trong mã để logic
 * đã kiểm thử là thứ quyết định. Gộp một thư cho mỗi người; gửi
 * thành công mới đóng dấu `sentAt`. Thư chưa cấu hình (chưa có
 * RESEND_API_KEY) thì không đóng dấu và báo rõ trong phản hồi.
 *
 * Trước khi migration chạy, bảng chưa có: trả 200 kèm ghi chú
 * NOT_READY thay vì để cron đỏ mỗi ngày vì một việc đã biết trước.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Chưa đặt CRON_SECRET nên không gửi nhắc" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Không được phép" }, { status: 401 });
  }

  const now = new Date();
  let due;
  try {
    due = await prisma.skyEventReminder.findMany({
      where: {
        sentAt: null,
        eventInstant: {
          gt: now,
          lte: new Date(now.getTime() + REMINDER_WINDOW_MS),
        },
      },
      include: { user: { select: { email: true } } },
      orderBy: { eventInstant: "asc" },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2021"
    ) {
      return Response.json({ ok: true, skipped: "NOT_READY" });
    }
    throw error;
  }

  const fresh = due.filter((row) => reminderDue(row.eventInstant, now));
  if (fresh.length === 0) {
    return Response.json({ ok: true, due: 0, sent: 0 });
  }
  if (!isMailConfigured()) {
    return Response.json({ ok: false, due: fresh.length, sent: 0, error: "MAIL_NOT_CONFIGURED" });
  }

  const byUser = new Map<string, typeof fresh>();
  for (const row of fresh) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  let sent = 0;
  let failed = 0;
  for (const rows of byUser.values()) {
    const locale = rows[0].locale;
    const { subject, text } = buildReminderMail(
      rows.map((row) => ({
        nameVi: row.nameVi,
        nameEn: row.nameEn,
        instant: row.eventInstant,
        tz: row.tz,
      })),
      locale,
    );
    const html = text
      .split("\n")
      .map((line) =>
        line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      )
      .join("<br/>\n");
    const result = await sendMail({
      to: rows[0].user.email,
      subject,
      html: `<p>${html}</p>`,
      text,
    });
    if (result.ok) {
      sent += rows.length;
      await prisma.skyEventReminder.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { sentAt: new Date() },
      });
    } else {
      failed += rows.length;
    }
  }
  return Response.json({ ok: true, due: fresh.length, sent, failed });
}
