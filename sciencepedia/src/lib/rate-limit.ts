import { prisma } from "@/lib/prisma";

/**
 * Rate limit với hai backend:
 *
 *   rateLimit()       — đồng bộ, đếm trong RAM tiến trình. Nhanh, không I/O.
 *   rateLimitShared() — bất đồng bộ, đếm trong Postgres, dùng chung giữa các
 *                       instance.
 *
 * Vì sao cần cả hai:
 *
 * Trên một server (VPS) đếm trong RAM là đúng. Trên serverless (Vercel) mỗi
 * lambda là một tiến trình riêng với `Map` riêng, nên hạn mức thực tế bị NHÂN
 * LÊN theo số instance đang sống, và cold start làm bộ đếm reset về 0.
 *
 * Nhưng không phải endpoint nào cũng đáng trả giá một lệnh ghi DB mỗi request:
 *
 *   endpoint           | lưu lượng | thiệt hại nếu bị lạm dụng | backend
 *   -------------------|-----------|---------------------------|---------
 *   /api/ai/chat       | thấp      | đốt hết quota Gemini      | Postgres
 *   /api/upload        | thấp      | đầy dung lượng Storage    | Postgres
 *   /api/auth/register | thấp      | spam tài khoản            | Postgres
 *   /api/search        | CAO       | gần như không             | RAM
 *
 * `/api/search` cho 120 request/phút và bị gọi mỗi lần gõ trong ⌘K — thêm một
 * lệnh ghi DB vào đó chỉ làm chậm mà không bảo vệ được gì đáng kể.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
};

// ------------------------------------------------------------------ Trong RAM

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

/**
 * Đếm trong bộ nhớ tiến trình. Chỉ chính xác khi chạy một instance duy nhất.
 * Dùng cho endpoint lưu lượng cao mà rủi ro lạm dụng thấp.
 */
export function rateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Dọn rác thô: khi map phình quá lớn thì xoá các khoá đã hết hạn
    if (buckets.size > MAX_KEYS) {
      for (const [existingKey, existing] of buckets) {
        if (existing.resetAt <= now) buckets.delete(existingKey);
      }
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

// ------------------------------------------------------------------ Postgres

/** Xác suất dọn các dòng đã hết hạn, tính trên mỗi lần gọi. */
const CLEANUP_CHANCE = 0.02;

/**
 * Đếm trong Postgres nên mọi instance dùng chung một bộ đếm.
 *
 * Toàn bộ nằm trong MỘT câu `INSERT ... ON CONFLICT DO UPDATE`: Postgres giữ
 * row lock khi xử lý xung đột, nên hai request đồng thời không thể cùng đọc một
 * giá trị rồi cùng ghi đè — tránh được race condition kinh điển của
 * read-modify-write.
 *
 * Nếu database không phản hồi thì hạ xuống đếm trong RAM chứ không chặn hết
 * người dùng: rate limit là lớp bảo vệ, không phải chức năng chính.
 */
export async function rateLimitShared(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const windowSeconds = windowMs / 1000;

  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}::double precision))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."resetAt" <= now() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= now()
            THEN now() + make_interval(secs => ${windowSeconds}::double precision)
          ELSE "RateLimit"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;

    const row = rows[0];
    if (!row) throw new Error("INSERT không trả về dòng nào");

    const retryAfterMs = Math.max(0, row.resetAt.getTime() - Date.now());

    // Dọn rác nhưng không chặn response — lỗi ở đây không quan trọng
    if (Math.random() < CLEANUP_CHANCE) {
      void prisma
        .$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 hour'`
        .catch(() => undefined);
    }

    if (row.count > limit) {
      return { ok: false, remaining: 0, retryAfterMs };
    }

    return { ok: true, remaining: limit - row.count, retryAfterMs: 0 };
  } catch (error) {
    console.warn(
      "[rate-limit] Postgres không phản hồi, tạm đếm trong RAM:",
      (error as Error).message,
    );
    return rateLimit(key, { limit, windowMs });
  }
}
