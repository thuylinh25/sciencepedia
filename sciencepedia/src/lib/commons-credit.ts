/**
 * Suy ghi công ảnh từ Wikimedia Commons.
 *
 * Dùng chung bởi `scripts/backfill-image-credit.ts` (rà cả kho) và
 * `src/lib/cover-intake.ts` (lúc biên tập viên lưu một URL Commons). Một cách
 * suy, hai nơi gọi — bản chép thứ hai sẽ lệch đi ở lần sửa sau.
 *
 * Ghi công KHÔNG phải trang trí: ảnh dùng giấy phép CC BY / CC BY-SA thì đây
 * là điều kiện của giấy phép, thiếu nó là vi phạm.
 */

const API = "https://commons.wikimedia.org/w/api.php";

const USER_AGENT = "SciencepediaBot/1.0 (image credit)";

export type Credit = { vi: string; en: string };

/** Lấy tên tệp Commons từ URL thumb hoặc URL gốc. `null` nếu không phải Commons. */
export function commonsFile(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "upload.wikimedia.org") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const thumbAt = parts.indexOf("thumb");
    // .../thumb/a/ab/Tên.jpg/1280px-Tên.jpg  → phần tử ngay trước bản thu nhỏ
    // .../a/ab/Tên.jpg                        → phần tử cuối
    const name = thumbAt === -1 ? parts.at(-1) : parts.at(-2);
    return name ? decodeURIComponent(name) : null;
  } catch {
    return null;
  }
}

/** Giải mã thực thể HTML, lặp cho tới khi chuỗi không đổi. */
function decodeEntities(input: string): string {
  let out = input;
  for (let i = 0; i < 4; i++) {
    const next = out
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * HTML của Commons → Markdown gọn, giữ link.
 *
 * Ba thứ phải xử lý, cả ba đều đã thấy trong dữ liệu thật:
 *
 * 1. **Thực thể HTML.** Trường `Artist` trả "ESA &amp;amp; MPS", và URL trang
 *    người dùng chứa "&amp;amp;action=edit". Không giải mã thì ghi công hiện ra
 *    với "&amp;amp;" nằm giữa câu.
 * 2. **Neo chú thích nội bộ.** Có mục ghi `[[1]](#cite_note-author-1)` — neo
 *    trỏ vào chính trang Commons; đặt trên site này thì trỏ vào hư không. Giữ
 *    chữ, bỏ link.
 * 3. **Link đỏ.** Trang người dùng chưa tồn tại trả URL chứa `redlink=1`. Dẫn
 *    người đọc tới một trang tạo bài là vô nghĩa — giữ tên, bỏ link.
 */
function toMarkdown(html: string): string {
  return decodeEntities(html)
    .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_m, href, text) => {
      const label = String(text)
        .replace(/<[^>]+>/g, "")
        .trim();
      const raw = String(href);
      if (raw.startsWith("#") || raw.includes("redlink=1")) return label;
      const url = raw.startsWith("//") ? `https:${raw}` : raw;
      return `[${label}](${url})`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Thử lại khi Commons trả rỗng.
 *
 * API công cộng của Commons chặn theo tốc độ, và khi bị chặn nó **không** trả
 * lỗi HTTP — nó trả 200 với `extmetadata` rỗng. Chạy một lượt rồi chạy lại
 * ngay sẽ thấy đúng những tệp vừa lấy được lại báo "không có metadata", tức
 * kết quả không ổn định. Nếu tin lần trả đầu tiên thì sẽ bỏ sót ngẫu nhiên, và
 * ghi công thiếu là vi phạm giấy phép.
 *
 * `attempts` mặc định 3, giãn dần 1s → 3s. Đường lưu bài của trang quản trị
 * hạ xuống 1: ở đó người dùng đang ngồi chờ, và `covers:mirror` sẽ dọn nốt
 * những lượt hụt.
 */
export async function fetchCommonsCredit(
  file: string,
  attempts = 3,
): Promise<Credit | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 3 ** (attempt - 1)));
    }
    const got = await fetchOnce(file);
    if (got) return got;
  }
  return null;
}

async function fetchOnce(file: string): Promise<Credit | null> {
  const url = `${API}?action=query&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res?.ok) return null;

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }
      >;
    };
  };
  const page = Object.values(data.query?.pages ?? {})[0];
  const meta = page?.imageinfo?.[0]?.extmetadata;
  if (!meta) return null;

  const artist = meta.Artist?.value ? toMarkdown(meta.Artist.value) : null;
  const licence = meta.LicenseShortName?.value
    ? toMarkdown(meta.LicenseShortName.value)
    : null;
  if (!artist && !licence) return null;

  const filePage = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
  const who = artist ?? "không rõ tác giả";
  const lic = licence ?? "xem trang gốc";

  return {
    vi: `Ảnh: ${who} — [Wikimedia Commons](${filePage}), ${lic}.`,
    en: `Image: ${who} — [Wikimedia Commons](${filePage}), ${lic}.`,
  };
}
