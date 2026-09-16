import "server-only";

import { assetKey } from "@/lib/asset";
import { commonsFile, fetchCommonsCredit } from "@/lib/commons-credit";
import { isConfigured, uploadBuffer } from "@/lib/storage";
import { fetchUnsplashPhoto, unsplashPageId } from "@/lib/unsplash";

/**
 * Biên tập viên dán một URL ảnh ngoài vào ô "Ảnh bìa" → lấy ghi công, kéo ảnh
 * về R2, trả lại URL trên R2. Chạy ngay trong lượt lưu bài.
 *
 * ## Vì sao làm ở đây thay vì để chạy script sau
 *
 * Trước lượt này, dán URL Wikimedia rồi bấm Lưu sẽ để lại một ảnh trỏ ra
 * ngoài: không có các cỡ dựng sẵn, nên nó rơi về `next/image` và dính HTTP 402
 * (hạn mức Image Optimization của Vercel đã cạn). Chữa được bằng
 * `npm run images:credit` rồi `npm run covers:mirror`, ĐÚNG THỨ TỰ đó — tức
 * một bước phải nhớ bằng đầu, và bước bị quên thì hỏng âm thầm.
 *
 * ## URL trang Unsplash là trường hợp riêng
 *
 * Dán `unsplash.com/photos/…` thì API trả về cả tác giả lẫn bản gốc — đó là
 * đường DUY NHẤT lấy được tên người chụp, vì URL CDN của Unsplash không mang
 * id tra cứu được (xem `src/lib/unsplash.ts`). Nhánh này khác mọi nhánh khác ở
 * chỗ nó KHÔNG được phép hụt mà vẫn lưu: đầu vào là một trang HTML, để nguyên
 * vào `coverImage` là chắc chắn hỏng. Hụt thì bỏ trống bìa và ghi log.
 *
 * ## Vì sao ghi công phải lấy TRƯỚC khi sao ảnh
 *
 * Ghi công suy ra từ tên tệp Commons nằm trong URL. Sao ảnh về R2 xong thì URL
 * không còn dấu vết ấy. Đảo thứ tự là mất ghi công vĩnh viễn — mà ghi công là
 * điều kiện của giấy phép CC BY / CC BY-SA, không phải trang trí.
 *
 * ## Vì sao hỏng thì vẫn lưu
 *
 * Wikimedia chậm hoặc R2 trục trặc là chuyện của bên thứ ba. Chặn lượt lưu vì
 * thế là đổi một phiền toái nhỏ (ảnh chưa nằm trên R2, `covers:mirror` dọn sau)
 * lấy một phiền toái lớn (biên tập viên mất nguyên bài đang viết). Hàm này
 * KHÔNG BAO GIỜ ném lỗi: hỏng thì trả lại đúng dữ liệu vào.
 */

/** Ảnh bìa lớn nhất chịu kéo về. Trên ngưỡng là ảnh gốc Commons cỡ bản đồ. */
const MAX_FETCH_BYTES = 25 * 1024 * 1024;

const TIMEOUT_MS = 20_000;

/**
 * Wikimedia **trả 403** cho request không khai User-Agent mô tả được — đó là
 * chính sách của họ, không phải sự cố.
 */
const USER_AGENT =
  "SciencepediaCoverIntake/1.0 (+https://sciencepedia-sciencepedia.vercel.app)";

export type CoverFields = {
  coverImage: string | null;
  coverImageCredit: string | null;
  coverImageCreditEn: string | null;
};

export async function intakeCover<T extends CoverFields>(
  data: T,
  { prefix, name }: { prefix: string; name: string },
): Promise<T> {
  const url = data.coverImage;
  // Không có bìa, hoặc bìa đã nằm trên R2 rồi — không có việc gì để làm.
  if (!url || assetKey(url)) return data;
  if (!isConfigured()) return data;

  let source = url;
  let credit = data.coverImageCredit;
  let creditEn = data.coverImageCreditEn;

  /*
   * 0. URL TRANG Unsplash → hỏi API lấy tác giả và bản gốc.
   *
   * Nhánh này bắt buộc phải thành công: `url` đang là một trang HTML, để
   * nguyên vào `coverImage` là chắc chắn hỏng. Khác hẳn nhánh sao ảnh bên
   * dưới, nơi thất bại chỉ có nghĩa "ảnh còn nằm ở máy chủ cũ".
   */
  const unsplashId = unsplashPageId(url);
  if (unsplashId) {
    const photo = await fetchUnsplashPhoto(unsplashId).catch(() => null);
    if (!photo) {
      console.error("[cover-intake] khong tra duoc anh Unsplash", url);
      return { ...data, coverImage: null };
    }
    source = photo.imageUrl;
    credit = credit || photo.creditVi;
    creditEn = creditEn || photo.creditEn;
  }

  // 1. Ghi công TRƯỚC, khi URL còn mang tên tệp Commons.
  //    Chỉ một lượt thử: người dùng đang ngồi chờ, và `covers:mirror` +
  //    `images:credit` sẽ dọn nốt những lượt hụt.
  if (!credit) {
    const file = commonsFile(source);
    if (file) {
      const got = await fetchCommonsCredit(file, 1).catch(() => null);
      if (got) {
        credit = got.vi;
        creditEn = creditEn || got.en;
      }
    }
  }

  // 2. Kéo ảnh về rồi dựng các cỡ trên R2.
  try {
    const response = await fetch(source, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const type = (response.headers.get("content-type") ?? "").split(";")[0];
    if (!type.startsWith("image/")) throw new Error(`kiểu lạ: ${type}`);

    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > MAX_FETCH_BYTES) throw new Error("ảnh quá lớn");

    const uploaded = await uploadBuffer(body, `${name}.img`, prefix);
    return { ...data, coverImage: uploaded.url, coverImageCredit: credit, coverImageCreditEn: creditEn };
  } catch (error) {
    /*
     * Ghi log chứ không ném: lượt lưu phải đi tiếp.
     *
     * Trả về `source`, KHÔNG phải `url`. Với đầu vào là trang Unsplash thì
     * `url` là một trang HTML — để nguyên vào `coverImage` là chắc chắn hỏng,
     * còn `source` là URL ảnh thật trên CDN Unsplash, một host đã khai báo.
     * Với mọi đầu vào khác thì hai biến bằng nhau.
     */
    console.error("[cover-intake]", source, error);
    return {
      ...data,
      coverImage: source,
      coverImageCredit: credit,
      coverImageCreditEn: creditEn,
    };
  }
}
