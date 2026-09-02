import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { syncKnowledgeFeeds } from "@/lib/feed-sync";
import { syncNewArticles } from "@/lib/vaca-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Phải tải hơn chục feed bên ngoài nên cần dài hơn mặc định 10 giây. */
export const maxDuration = 60;

/**
 * Quét các nguồn khoa học đang dùng, nhập bài mới về dưới dạng bản nháp.
 *
 * Hai nhánh: `feed-sync` đọc RSS/Atom của NASA, ESA, WHO, IPCC… (xem
 * `knowledge-feeds.ts`), còn `vaca-sync` cào trực tiếp thienvanvietnam.org vì
 * trang đó không có feed dùng được.
 *
 * Chạy hằng ngày qua Vercel Cron (lịch trong vercel.json). Vercel gửi kèm
 * header `Authorization: Bearer $CRON_SECRET`, và route từ chối mọi lời gọi
 * không mang đúng bí mật đó — nếu không thì đây là một endpoint công khai ai
 * cũng gọi được để bắt máy chủ đi cào hộ.
 *
 * Chưa đặt CRON_SECRET thì route tự khoá lại thay vì mở toang: thà tính năng
 * không chạy còn hơn chạy mà ai gọi cũng được.
 */
export async function GET(request: NextRequest) {
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

  const [feeds, vaca] = await Promise.all([
    syncKnowledgeFeeds(),
    syncNewArticles({ limit: 5 }),
  ]);

  const imported = feeds.imported.length + vaca.imported.length;
  // Bản nháp không hiện ra ngoài, nhưng trang quản trị đọc qua cache chung
  if (imported > 0) revalidateTag("articles");

  return Response.json({
    ranAt: new Date().toISOString(),
    imported,
    feeds,
    vaca,
  });
}
