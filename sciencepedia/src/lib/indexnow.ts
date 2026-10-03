import { absoluteUrl } from "@/lib/utils";

/**
 * IndexNow — báo Bing (và Yandex, Seznam, Naver: họ chia sẻ nhau) rằng một URL
 * vừa đổi, thay vì chờ bot tự quay lại. Google KHÔNG tham gia; với Google,
 * sitemap + Search Console vẫn là đường duy nhất.
 *
 * Khoá không phải bí mật: giao thức bắt nó nằm công khai ở
 * `/<khoá>.txt` (`public/`) để công cụ tìm kiếm xác minh ta sở hữu host. Đổi
 * khoá thì đổi CẢ hằng số này lẫn tên + nội dung tệp đó, không thì mọi lượt
 * gửi bị từ chối 403.
 */
export const INDEXNOW_KEY = "cc1c25c17d73eb4addf24d02da277955";

const ENDPOINT = "https://api.indexnow.org/indexnow";
/** Giới hạn của giao thức cho một lượt POST. */
const MAX_URLS = 10_000;

/**
 * Gửi danh sách URL đã đổi. Không bao giờ ném: bài đã ghi xong lúc tới đây,
 * và một lượt báo hỏng chỉ có nghĩa là Bing thấy bài muộn hơn — tức đúng như
 * khi chưa có IndexNow.
 *
 * Chỉ chạy trên production. Preview và máy dev mang host khác (hoặc
 * localhost), gửi từ đó là báo cho Bing những URL không công khai — và host
 * không khớp tệp khoá thì đằng nào cũng bị từ chối.
 */
export async function notifyIndexNow(urls: readonly string[]): Promise<void> {
  if (process.env.VERCEL_ENV !== "production" || urls.length === 0) return;

  const host = new URL(absoluteUrl("/")).host;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`),
        urlList: [...new Set(urls)].slice(0, MAX_URLS),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 và 202 đều là nhận; 202 = đã nhận, đang chờ xác minh khoá
    if (!response.ok) {
      console.warn(`[indexnow] HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn("[indexnow]", (error as Error).message);
  }
}
