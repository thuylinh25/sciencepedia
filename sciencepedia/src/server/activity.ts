import "server-only";

import { randomUUID } from "node:crypto";
import type { ActivityContentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Lịch sử xem của người dùng đã đăng nhập — xem docs/architecture.md, mục
 * "Lịch sử xem".
 *
 * Hai lệnh ghi, cả hai là MỘT câu SQL nguyên tử:
 *   - `recordView`: INSERT … ON CONFLICT trên khoá UNIQUE (userId, contentType,
 *     contentId). Hai tab gửi cùng lúc không tạo được hai hàng, và không có cửa
 *     sổ "đọc rồi ghi" như `prisma.upsert` (cái đó ném P2002 khi đua).
 *   - `recordDuration`: chỉ UPDATE. Thời gian của một nội dung chưa đủ điều kiện
 *     tính lượt xem (bài đọc chưa tới 5 giây) không được tạo hàng.
 */

/**
 * Hai lượt xem cách nhau ít hơn khoảng này là MỘT lượt: tải lại trang, mở bài
 * ở tab thứ hai, component mount lại — đều không cộng `viewCount`. Đây là chốt
 * phía server nên client không phải nhớ gì qua các lần tải trang. 30 phút là
 * định nghĩa "phiên" quen thuộc của các công cụ analytics. `lastViewedAt` vẫn
 * cập nhật ở mọi lượt, nên cửa sổ trượt theo lúc người đọc còn ở đó.
 */
const SESSION_GAP = "30 minutes";

export async function recordView(input: {
  userId: string;
  type: ActivityContentType;
  contentId: string;
  label: string | null;
  seconds: number;
}) {
  const { userId, type, contentId, label, seconds } = input;
  // `@default(cuid())` chỉ chạy trong Prisma Client, SQL thô phải tự sinh id
  await prisma.$executeRaw`
    INSERT INTO "ContentActivity"
      ("id", "userId", "contentType", "contentId", "label",
       "firstViewedAt", "lastViewedAt", "viewCount", "totalDuration")
    VALUES
      (${randomUUID()}, ${userId}, ${type}::"ActivityContentType", ${contentId}, ${label},
       NOW(), NOW(), 1, ${seconds})
    ON CONFLICT ("userId", "contentType", "contentId") DO UPDATE SET
      "viewCount" = "ContentActivity"."viewCount" + CASE
        WHEN "ContentActivity"."lastViewedAt" < NOW() - ${SESSION_GAP}::interval THEN 1
        ELSE 0
      END,
      "lastViewedAt" = NOW(),
      "totalDuration" = "ContentActivity"."totalDuration" + EXCLUDED."totalDuration",
      "label" = COALESCE(EXCLUDED."label", "ContentActivity"."label")`;
}

export async function recordDuration(input: {
  userId: string;
  type: ActivityContentType;
  contentId: string;
  seconds: number;
}) {
  const { userId, type, contentId, seconds } = input;
  await prisma.$executeRaw`
    UPDATE "ContentActivity" SET
      "totalDuration" = "totalDuration" + ${seconds},
      "lastViewedAt" = NOW()
    WHERE "userId" = ${userId}
      AND "contentType" = ${type}::"ActivityContentType"
      AND "contentId" = ${contentId}`;
}

// ------------------------------------------------------------- phía admin

export type ActivitySummary = {
  articles: number;
  models: number;
  lastActivityAt: Date | null;
};

/**
 * Tổng hợp cho bảng Users: MỘT truy vấn GROUP BY cho cả trang, không N+1.
 * Đi trên khoá UNIQUE (tiền tố userId, contentType).
 */
export async function getActivitySummaries(
  userIds: string[],
): Promise<Map<string, ActivitySummary>> {
  const out = new Map<string, ActivitySummary>();
  if (userIds.length === 0) return out;

  const rows = await prisma.contentActivity.groupBy({
    by: ["userId", "contentType"],
    where: { userId: { in: userIds } },
    _count: { _all: true },
    _max: { lastViewedAt: true },
  });

  for (const row of rows) {
    const entry = out.get(row.userId) ?? {
      articles: 0,
      models: 0,
      lastActivityAt: null,
    };
    if (row.contentType === "ARTICLE") entry.articles = row._count._all;
    else entry.models = row._count._all;
    const last = row._max.lastViewedAt;
    if (last && (!entry.lastActivityAt || last > entry.lastActivityAt)) {
      entry.lastActivityAt = last;
    }
    out.set(row.userId, entry);
  }
  return out;
}

export async function getUserActivityOverview(userId: string) {
  const rows = await prisma.contentActivity.groupBy({
    by: ["contentType"],
    where: { userId },
    _count: { _all: true },
    _sum: { totalDuration: true },
    _max: { lastViewedAt: true },
  });

  const pick = (type: ActivityContentType) =>
    rows.find((row) => row.contentType === type);
  const articles = pick("ARTICLE")?._count._all ?? 0;
  const models = pick("MODEL")?._count._all ?? 0;
  const lasts = rows
    .map((row) => row._max.lastViewedAt)
    .filter((d): d is Date => d !== null);

  return {
    total: articles + models,
    articles,
    models,
    totalDuration: rows.reduce((sum, row) => sum + (row._sum.totalDuration ?? 0), 0),
    lastActivityAt: lasts.length
      ? new Date(Math.max(...lasts.map((d) => d.getTime())))
      : null,
  };
}

/** Một trang lịch sử, mới nhất trước. Tên bài lấy từ `Article` cho trang này thôi. */
export async function getUserActivityPage(input: {
  userId: string;
  type: ActivityContentType | null;
  page: number;
  perPage: number;
}) {
  const { userId, type, page, perPage } = input;
  const where = { userId, ...(type ? { contentType: type } : {}) };

  const [total, rows] = await Promise.all([
    prisma.contentActivity.count({ where }),
    prisma.contentActivity.findMany({
      where,
      orderBy: [{ lastViewedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        contentType: true,
        contentId: true,
        label: true,
        viewCount: true,
        totalDuration: true,
        lastViewedAt: true,
      },
    }),
  ]);

  const articleIds = rows
    .filter((row) => row.contentType === "ARTICLE")
    .map((row) => row.contentId);
  const articles = articleIds.length
    ? await prisma.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, slug: true, title: true, titleEn: true },
      })
    : [];
  const byId = new Map(articles.map((a) => [a.id, a]));

  return {
    total,
    items: rows.map((row) => ({ ...row, article: byId.get(row.contentId) ?? null })),
  };
}
