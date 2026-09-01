/**
 * Giới hạn tần suất đơn giản, lưu trong bộ nhớ tiến trình.
 *
 * Đủ dùng cho một instance duy nhất hoặc môi trường dev. Khi chạy nhiều
 * instance (Vercel, Kubernetes...) hãy thay bằng Redis/Upstash — mỗi instance
 * ở đây có bộ đếm riêng nên hạn mức thực tế sẽ nhân lên theo số instance.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
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
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterMs: 0,
  };
}
