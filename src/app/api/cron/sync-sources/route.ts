import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { syncKnowledgeFeeds } from "@/lib/feed-sync";
import { isRewriteConfigured } from "@/lib/rewrite";
import { syncNewArticles } from "@/lib/vaca-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Tải hơn chục feed rồi gọi mô hình cho từng bài — dài hơn mặc định 10 giây. */
export const maxDuration = 60;

/** Chừa lại ít giây cuối để ghi CSDL và trả kết quả trước khi Vercel cắt. */
const SAFETY_MS = 8_000;
/** VACA đăng ít hơn nhiều so với tổng 12 nguồn quốc tế, nên chia phần nhỏ hơn. */
const VACA_SHARE = 0.3;

/**
 * Quét các nguồn khoa học đang dùng, nhờ Claude biên tập lại rồi đăng.
 *
 * Hai nhánh: `feed-sync` đọc RSS/Atom của NASA, ESA, WHO, IPCC… (xem
 * `knowledge-feeds.ts`), còn `vaca-sync` cào trực tiếp thienvanvietnam.org vì
 * trang đó không có feed dùng được.
 *
 * Chạy tuần tự chứ không song song: cả hai nhánh chia nhau cùng một quỹ thời
 * gian, chạy song song thì cả hai cùng đâm vào trần 60 giây và cùng mất bài.
 *
 * Chạy hằng ngày qua Vercel Cron (lịch trong vercel.json). Vercel gửi kèm
 * header `Authorization: Bearer $CRON_SECRET`, và route từ chối mọi lời gọi
 * không mang đúng bí mật đó — nếu không thì đây là một endpoint công khai ai
 * cũng gọi được để bắt máy chủ đi cào và đốt quota mô hình.
 *
 * Chưa đặt CRON_SECRET thì route tự khoá lại thay vì mở toang: thà tính năng
 * không chạy còn hơn chạy mà ai gọi cũng được.
 */
export async function GET(request: NextRequest) {
  // Không có khoá biên tập thì mọi bài lấy về đều rơi về DRAFT với nguyên văn
  // nguồn — đúng 20 bản nháp thô đã đổ vào kho ngày 2026-09-02, tiêu đề còn
  // nguyên tiếng Anh. Đồng bộ khi không biên tập được chỉ tạo rác phải dọn
  // tay, nên chặn ngay ở cửa thay vì đi cào rồi mới bỏ.
  if (!isRewriteConfigured()) {
    return Response.json(
      { error: "Chưa đặt ANTHROPIC_API_KEY nên không đồng bộ — xem docs/architecture.md" },
      { status: 503 },
    );
  }

  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "Chưa đặt CRON_SECRET nên không chạy đồng bộ" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Không được phép" }, { status: 401 });
  }

  const started = Date.now();
  const budget = maxDuration * 1000 - SAFETY_MS;

  const feeds = await syncKnowledgeFeeds({
    budgetMs: Math.round(budget * (1 - VACA_SHARE)),
  });

  // Phần còn lại của quỹ, kể cả phần nhánh trên dùng chưa hết
  const vaca = await syncNewArticles({
    budgetMs: Math.max(0, budget - (Date.now() - started)),
  });

  const imported = [...feeds.imported, ...vaca.imported];
  const published = imported.filter((row) => row.status === "PUBLISHED").length;

  if (imported.length > 0) revalidateTag("articles");

  return Response.json({
    ranAt: new Date().toISOString(),
    elapsedMs: Date.now() - started,
    imported: imported.length,
    published,
    drafted: imported.length - published,
    feeds,
    vaca,
  });
}
