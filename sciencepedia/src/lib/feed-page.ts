export const FEED_MAX_LIMIT = 50;

/**
 * `?limit=&offset=` của feed → số an toàn cho truy vấn. Giá trị rác, âm hay
 * quá lớn không được làm hỏng request: kẹp về mặc định thay vì trả 400, vì
 * người dùng duy nhất là một job định kỳ, không có ai đọc thông báo lỗi.
 */
export function parseFeedPage(params: URLSearchParams) {
  const int = (key: string) => {
    const n = Number(params.get(key));
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };
  const limit = Math.min(FEED_MAX_LIMIT, Math.max(1, int("limit") || 20));
  const offset = Math.max(0, int("offset"));
  return { limit, offset };
}

/** Trang đầy thì có thể còn trang sau; trang thiếu là trang cuối. */
export function nextFeedOffset(page: { limit: number; offset: number }, count: number) {
  return count === page.limit ? page.offset + page.limit : null;
}
