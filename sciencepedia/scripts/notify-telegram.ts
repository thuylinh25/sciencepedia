import { PrismaClient } from "@prisma/client";

import { publishedSince } from "./published-since.js";

/**
 * Báo Telegram khi có bài mới lên — CHỈ ĐỌC CSDL.
 *
 *   npm run notify -- --hours 6
 *   npm run notify -- --since 2026-09-05T13:00:00Z
 *   npm run notify -- --hours 24 --dry-run   # in ra, không gửi
 *
 * Cần `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`.
 *
 * ## Ba quyết định, để lần sau không ai "sửa cho đầy đủ"
 *
 * **Không có bài mới thì KHÔNG gửi gì.** Cron chạy mỗi 2 giờ, phần lớn lượt sẽ
 * không ra bài nào. Gửi "không có gì mới" 12 lần một ngày là cách nhanh nhất
 * biến thông báo thành thứ bị tắt tiếng, và lúc đó tin đáng đọc cũng chìm theo.
 *
 * **Thiếu secret thì bỏ qua êm, không hỏng lượt chạy.** Thông báo là tiện ích
 * phụ; bài đã publish rồi. Để nó làm đỏ cả workflow sẽ khiến người ta tưởng
 * việc xuất bản thất bại.
 *
 * **Escape HTML.** Tiêu đề bài do agent sinh và có thể chứa `<`, `>`, `&`.
 * Telegram từ chối cả tin nhắn khi HTML hỏng — nghĩa là một dấu ngoặc nhọn
 * trong tiêu đề làm mất luôn thông báo, mà lỗi thì nằm ở phía Telegram.
 */

const prisma = new PrismaClient();

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const sinceRaw = flagValue(argv, "since");
  const hours = Number(flagValue(argv, "hours") ?? 6);

  const since = sinceRaw ? new Date(sinceRaw) : new Date(Date.now() - hours * 3600 * 1000);
  if (Number.isNaN(since.getTime())) {
    console.error(`Mốc thời gian không hợp lệ: ${sinceRaw}`);
    process.exitCode = 1;
    return;
  }

  const rows = await publishedSince(since);
  if (rows.length === 0) {
    console.log("Không có bài mới — không gửi gì.");
    return;
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const title = rows.length === 1 ? "1 bài mới trên SciencePedia" : `${rows.length} bài mới trên SciencePedia`;

  const body = rows
    .map((r) => {
      const name = escapeHtml(r.title);
      const cat = r.category?.name ? ` — ${escapeHtml(r.category.name)}` : "";
      const url = base ? `${base}/vi/articles/${r.slug}` : "";
      return url ? `• <a href="${url}">${name}</a>${cat}` : `• ${name}${cat}`;
    })
    .join("\n");

  const message = `<b>${escapeHtml(title)}</b>\n\n${body}`;

  if (dryRun) {
    console.log("--- CHẠY THỬ, không gửi ---\n" + message);
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Chưa đặt TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — bỏ qua bước báo.");
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    // Không ném: bài đã publish, hỏng khâu báo không được làm đỏ cả lượt chạy.
    console.warn(`Telegram từ chối (HTTP ${response.status}): ${await response.text()}`);
    return;
  }
  console.log(`Đã báo Telegram: ${rows.length} bài.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
