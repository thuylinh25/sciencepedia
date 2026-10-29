/**
 * Logic thuần của nhắc sự kiện (S1) — tách khỏi route/cron để kiểm
 * thử được bằng engine vendor thật như mọi lib night-sky khác.
 *
 * Cửa sổ gửi: cron chạy mỗi sáng 08:00 (giờ Việt Nam). Một nhắc được
 * gửi khi sự kiện còn cách từ bây giờ tới 36 giờ — đủ phủ "tối mai"
 * cho mọi sự kiện trong ngày hôm sau ở mọi múi giờ người dùng, và
 * mốc `sentAt` phía CSDL bảo đảm không gửi hai lần. Sự kiện đã qua
 * (instant ≤ now) không bao giờ được gửi: nhắc về một đêm đã qua là
 * thư rác, và hàng đó nằm lại cho tới khi người dùng tự gỡ.
 */

export const REMINDER_WINDOW_MS = 36 * 3_600_000;

export function reminderDue(instant: Date, now: Date): boolean {
  const delta = instant.getTime() - now.getTime();
  return delta > 0 && delta <= REMINDER_WINDOW_MS;
}

export type DueReminderMail = {
  nameVi: string;
  nameEn: string;
  instant: Date;
  tz: string;
};

const SITE_BASE = "https://sciencepedia-sciencepedia.vercel.app";

function eventLine(reminder: DueReminderMail, locale: string): string {
  const vi = locale !== "en";
  const name = vi ? reminder.nameVi : reminder.nameEn;
  const when = new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", {
    timeZone: reminder.tz,
    dateStyle: "full",
    timeStyle: "short",
  }).format(reminder.instant);
  return `- ${name} · ${when}`;
}

/** Thư nhắc gộp: một thư cho mọi sự kiện đến hạn của một người,
 *  soạn theo ngôn ngữ họ đã chọn lúc đặt nhắc. */
export function buildReminderMail(
  reminders: readonly DueReminderMail[],
  locale: string,
): { subject: string; text: string } {
  const vi = locale !== "en";
  const first = reminders[0];
  const subject =
    reminders.length === 1
      ? vi
        ? `Sắp tới trên bầu trời: ${first.nameVi}`
        : `Coming up in the sky: ${first.nameEn}`
      : vi
        ? `${reminders.length} sự kiện bầu trời sắp tới`
        : `${reminders.length} sky events coming up`;
  const intro = vi
    ? "Bạn đã đặt nhắc cho (các) sự kiện thiên văn này trên Sciencepedia — chúng sắp diễn ra:"
    : "You asked Sciencepedia to remind you about these sky events — they are coming up:";
  const link = `${SITE_BASE}/${vi ? "vi" : "en"}/night-sky#su-kien-sap-toi`;
  const outro = vi
    ? `Mở mô phỏng bầu trời để xem trước khung cảnh: ${link}`
    : `Open the sky simulator to preview the scene: ${link}`;
  const text = [intro, "", ...reminders.map((r) => eventLine(r, locale)), "", outro].join("\n");
  return { subject, text };
}
