/**
 * Tra ảnh Unsplash để lấy tác giả và bản gốc chất lượng cao.
 *
 * ## Vì sao phải là URL TRANG ẢNH, không phải URL ảnh
 *
 * URL trên CDN có dạng `images.unsplash.com/photo-1454789548928-9efd52dc4031`.
 * Chuỗi `photo-…` ấy **không phải** id ảnh của Unsplash — id thật là dạng ngắn
 * kiểu `Qp9WLf1Ovak` và chỉ xuất hiện trong URL trang ảnh. Đo ngày 2026-09-16:
 *
 *     unsplash.com/photos/photo-1454789548928-9efd52dc4031  → 401 (tường bot)
 *     api.unsplash.com/photos/<id CDN>                      → 401
 *     EXIF / IPTC / XMP của chính tệp ảnh                   → rỗng sạch
 *
 * Nghĩa là từ một URL CDN thì KHÔNG có đường nào suy ra tác giả, kể cả có khoá
 * API. Muốn ghi công đúng thì biên tập viên phải dán URL trang ảnh — thứ họ
 * vẫn thấy trên thanh địa chỉ khi xem ảnh đó trên Unsplash.
 *
 * ## Vì sao gọi `download_location`
 *
 * Điều khoản API của Unsplash bắt buộc: mỗi lần dùng một tấm ảnh phải gọi
 * endpoint ấy để họ đếm lượt về cho tác giả. Không gọi là vi phạm điều khoản,
 * và đây là điều kiện để được dùng ảnh miễn phí — cùng loại nghĩa vụ với ghi
 * công, không phải tuỳ chọn. Gọi hỏng thì bỏ qua: nó không được phép làm hỏng
 * lượt lưu bài.
 *
 * ## Vì sao link ghi công có UTM
 *
 * Hướng dẫn ghi công của Unsplash yêu cầu link về hồ sơ tác giả và về Unsplash
 * mang tham số `utm_source` / `utm_medium=referral`. Bỏ đi thì ghi công vẫn
 * đọc được nhưng không còn đúng chuẩn họ đặt ra.
 */

const API = "https://api.unsplash.com";

/** Tên ứng dụng đã đăng ký — Unsplash đòi nó trong tham số UTM. */
const APP_NAME = "sciencepedia";

const TIMEOUT_MS = 15_000;

export type UnsplashPhoto = {
  /** URL tệp ảnh gốc, đem đi tải về và dựng các cỡ. */
  imageUrl: string;
  creditVi: string;
  creditEn: string;
};

function accessKey(): string | null {
  return process.env.UNSPLASH_ACCESS_KEY || null;
}

/** Id ảnh Unsplash: đúng 11 ký tự base64url. */
const ID_LENGTH = 11;
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Lấy id ảnh từ URL TRANG Unsplash.
 *
 * Hai dạng đang lưu hành:
 *   unsplash.com/photos/Qp9WLf1Ovak
 *   unsplash.com/photos/a-black-and-white-photo-Qp9WLf1Ovak
 *
 * `null` cho mọi thứ khác — kể cả `images.unsplash.com`, vì id ở đó là id
 * khác và tra sẽ ra 404.
 *
 * ## Vì sao cắt theo ĐỘ DÀI chứ không theo dấu gạch cuối
 *
 * Lượt đầu viết hàm này cắt `slug.split("-").at(-1)`. Sai — id là base64url,
 * tức **bản thân nó chứa được dấu `-`**. Gặp `…-anh-nui-Qp9-Lf1Ovak` thì cách
 * ấy trả về `Lf1Ovak`, API tra ra 404, và biên tập viên chỉ thấy "không lấy
 * được ảnh" mà không hiểu vì sao — lỗi chỉ rơi vào những id có gạch, tức lác
 * đác chứ không đều.
 *
 * Id luôn dài đúng 11 ký tự và luôn đứng cuối, nên lấy 11 ký tự cuối là đúng.
 * Slug có phần mô tả thì ký tự ngay trước id phải là `-`; kiểm cả điều đó để
 * một slug dài 11 ký tự không bị nhận nhầm thành id.
 */
export function unsplashPageId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "unsplash.com" && u.hostname !== "www.unsplash.com") {
      return null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] !== "photos" || !parts[1]) return null;

    const slug = parts[1];
    if (ID_PATTERN.test(slug)) return slug; // id trần, không có phần mô tả

    if (slug.length <= ID_LENGTH) return null;
    if (slug[slug.length - ID_LENGTH - 1] !== "-") return null;

    const id = slug.slice(-ID_LENGTH);
    return ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export async function fetchUnsplashPhoto(
  id: string,
): Promise<UnsplashPhoto | null> {
  const key = accessKey();
  if (!key) return null;

  const response = await fetch(`${API}/photos/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);

  if (!response?.ok) return null;

  const data = (await response.json()) as {
    urls?: { raw?: string; full?: string; regular?: string };
    links?: { html?: string; download_location?: string };
    user?: { name?: string; username?: string };
  };

  const imageUrl = data.urls?.raw ?? data.urls?.full ?? data.urls?.regular;
  if (!imageUrl) return null;

  const utm = `utm_source=${APP_NAME}&utm_medium=referral`;
  const page = data.links?.html ?? `https://unsplash.com/photos/${id}`;
  const author = data.user?.name?.trim() || "không rõ tác giả";
  const profile = data.user?.username
    ? `https://unsplash.com/@${data.user.username}?${utm}`
    : null;

  const who = profile ? `[${author}](${profile})` : author;
  const where = `[Unsplash](${page}?${utm})`;

  // Đếm lượt về cho tác giả — điều khoản API bắt buộc. Không chờ, không để
  // lỗi của nó lan ra ngoài.
  if (data.links?.download_location) {
    void fetch(data.links.download_location, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => {});
  }

  return {
    // `raw` không kèm tham số cắt/nén; thêm fm=jpg để chắc chắn nhận được ảnh
    // chứ không phải một định dạng lạ, và w để khỏi tải bản 6000px.
    imageUrl: `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}fm=jpg&w=2000&q=85`,
    creditVi: `Ảnh: ${who} — ${where}.`,
    creditEn: `Image: ${who} — ${where}.`,
  };
}

export function isUnsplashConfigured(): boolean {
  return Boolean(accessKey());
}
