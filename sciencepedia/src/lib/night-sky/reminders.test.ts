import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildReminderMail,
  reminderDue,
  REMINDER_WINDOW_MS,
} from "./reminders";

const NOW = new Date("2026-11-16T01:00:00Z"); // 08:00 giờ Hà Nội 16/11

test("cửa sổ gửi: tối nay và tối mai thì đến hạn, xa hơn thì chưa", () => {
  const tonight = new Date(NOW.getTime() + 11 * 3_600_000); // 19:00 cùng ngày
  const tomorrow = new Date(NOW.getTime() + 35 * 3_600_000);
  const later = new Date(NOW.getTime() + REMINDER_WINDOW_MS + 1);
  assert.equal(reminderDue(tonight, NOW), true);
  assert.equal(reminderDue(tomorrow, NOW), true);
  assert.equal(reminderDue(later, NOW), false);
});

test("sự kiện đã qua không bao giờ đến hạn", () => {
  assert.equal(reminderDue(new Date(NOW.getTime() - 1), NOW), false);
  assert.equal(reminderDue(NOW, NOW), false);
});

test("thư gộp: chủ đề và dòng sự kiện theo đúng ngôn ngữ + múi giờ đã lưu", () => {
  const mail = buildReminderMail(
    [
      {
        nameVi: "Mưa sao băng Leonids",
        nameEn: "Leonid meteor shower",
        instant: new Date("2026-11-17T12:00:00Z"), // 19:00 Hà Nội
        tz: "Asia/Ho_Chi_Minh",
      },
    ],
    "vi",
  );
  assert.match(mail.subject, /Leonids/);
  assert.match(mail.text, /Mưa sao băng Leonids/);
  assert.match(mail.text, /19:00/);
  assert.match(mail.text, /#su-kien-sap-toi/);

  const multi = buildReminderMail(
    [
      { nameVi: "Siêu trăng", nameEn: "Supermoon", instant: new Date("2026-11-24T14:54:00Z"), tz: "Asia/Ho_Chi_Minh" },
      { nameVi: "Trăng mới", nameEn: "New Moon", instant: new Date("2026-12-09T00:52:00Z"), tz: "Asia/Ho_Chi_Minh" },
    ],
    "en",
  );
  assert.match(multi.subject, /2 sky events/);
  assert.match(multi.text, /Supermoon/);
  assert.match(multi.text, /New Moon/);
});
