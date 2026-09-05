import { appendFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { publishedSince, toMarkdown, type PublishedRow } from "./published-since.js";

/**
 * Loan báo bài mới sau một lượt chạy pipeline: ghi tóm tắt lên trang chạy của
 * GitHub Actions và gửi Telegram. CHỈ ĐỌC CSDL.
 *
 *   npm run announce -- --hours 6
 *   npm run announce -- --since 2026-09-05T13:00:00Z
 *   npm run announce -- --hours 24 --dry-run   # in ra, không gửi, không ghi
 *
 * ## Vì sao MỘT bước chứ không phải hai
 *
 * Bản đầu tách "tóm tắt" và "báo Telegram" thành hai bước workflow. Hai bước là
 * hai tiến trình, hai Prisma client, và HAI lần truy vấn y hệt nhau mỗi lượt —
 * cùng một câu hỏi hỏi hai lần, hai chỗ có thể hỏng, và không có gì bảo đảm hai
 * bên nhìn thấy cùng một tập bài nếu có bài lên xen giữa.
 *
 * Ở đây hỏi một lần, dùng kết quả cho cả hai đích.
 *
 * ## Ba quyết định, để lần sau không ai "sửa cho đầy đủ"
 *
 * **Không có bài mới thì KHÔNG gửi Telegram.** Cron chạy mỗi 2 giờ, phần lớn
 * lượt sẽ không ra bài nào. Gửi "không có gì mới" 12 lần một ngày là cách nhanh
 * nhất biến thông báo thành thứ bị tắt tiếng, và lúc đó tin đáng đọc chìm theo.
 * Tóm tắt trên Actions thì vẫn ghi — chỗ đó người phải chủ động mở mới thấy.
 *
 * **Thiếu secret thì bỏ qua êm, không hỏng lượt chạy.** Thông báo là tiện ích
 * phụ; bài đã publish rồi. Để nó làm đỏ cả workflow sẽ khiến người ta tưởng
 * việc xuất bản thất bại — đúng cái bẫy `publish.ts` đã dính với reindex.
 *
 * **Escape HTML.** Tiêu đề bài do agent sinh và có thể chứa `<`, `>`, `&`.
 * Telegram từ chối CẢ tin nhắn khi HTML hỏng, nghĩa là một dấu ngoặc nhọn trong
 * tiêu đề làm mất luôn thông báo, mà lỗi thì chỉ hiện ở phía Telegram.
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

function telegramMessage(rows: PublishedRow[], base: string): string {
  const title = rows.length === 1 ? "1 bài mới trên SciencePedia" : `${rows.length} bài mới trên SciencePedia`;
  const body = rows
    .map((r) => {
      const name = escapeHtml(r.title);
      const cat = r.category?.name ? ` — ${escapeHtml(r.category.name)}` : "";
      const url = base ? `${base}/vi/articles/${r.slug}` : "";
      return url ? `• <a href="${url}">${name}</a>${cat}` : `• ${name}${cat}`;
    })
    .join("\n");
  return `<b>${escapeHtml(title)}</b>\n\n${body}`;
}

async function sendTelegram(message: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log("--- CHẠY THỬ, không gửi Telegram ---\n" + message);
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
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });

  if (!response.ok) {
    // Không ném: bài đã publish, hỏng khâu báo không được làm đỏ cả lượt chạy.
    console.warn(`Telegram từ chối (HTTP ${response.status}): ${await response.text()}`);
    return;
  }
  console.log("Đã báo Telegram.");
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

  // Một câu hỏi, một lần hỏi. Cả tóm tắt lẫn Telegram đều đọc từ đây.
  const rows = await publishedSince(since);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const markdown = toMarkdown(rows, since, base);

  console.log(markdown);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath && !dryRun) {
    appendFileSync(summaryPath, `## Bài mới trong lượt này\n\n${markdown}\n`, "utf8");
  }

  if (rows.length === 0) {
    console.log("Không có bài mới — không gửi Telegram.");
    return;
  }

  await sendTelegram(telegramMessage(rows, base), dryRun);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
