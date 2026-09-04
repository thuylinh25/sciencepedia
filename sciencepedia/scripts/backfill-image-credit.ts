import { PrismaClient } from "@prisma/client";

/**
 * Điền ghi công ảnh bìa cho bài viết và lĩnh vực, lấy trực tiếp từ Wikimedia
 * Commons.
 *
 *   npm run images:credit          # chạy thử, không ghi
 *   npm run images:credit -- --write
 *
 * ## Vì sao script này tồn tại
 *
 * CC BY và CC BY-SA **bắt buộc ghi công ngay tại chỗ hiển thị**. Kho hiện có
 * 41 ảnh bài + 5 ảnh lĩnh vực, tất cả từ Wikimedia, và không ảnh nào có ghi
 * công cho tới migration `20260904120000_cover_image_credit`. Gõ tay 46 dòng
 * ghi công là vừa chậm vừa sai — tên tác giả và tên giấy phép nằm sẵn trong
 * metadata của Commons, hỏi máy chính xác hơn hỏi người.
 *
 * ## Vì sao mặc định là chạy thử
 *
 * Script ghi vào cơ sở dữ liệu production. Một lượt chạy trước đó trong dự án
 * này đã ghi nhầm vì quên cờ. Mặc định phải là không-ghi.
 *
 * ## Giới hạn đã biết
 *
 * `extmetadata` của Commons trả HTML cho trường `Artist`; script gỡ thẻ và giữ
 * lại link dưới dạng Markdown. Ảnh nào Commons không có metadata thì script
 * **bỏ qua và báo tên**, không đoán — ghi công sai còn tệ hơn không ghi.
 */

const p = new PrismaClient();
const WRITE = process.argv.includes("--write");

const API = "https://commons.wikimedia.org/w/api.php";

/** Lấy tên file Commons từ URL thumb hoặc URL gốc. */
function commonsFile(url: string): string | null {
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

type Credit = { vi: string; en: string };

/**
 * Thử lại khi Commons trả rỗng.
 *
 * API công cộng của Commons chặn theo tốc độ, và khi bị chặn nó **không** trả
 * lỗi HTTP — nó trả 200 với `extmetadata` rỗng. Chạy một lượt rồi chạy lại
 * ngay sẽ thấy đúng những file vừa lấy được lại báo "không có metadata", tức
 * kết quả không ổn định. Nếu tin lần trả đầu tiên thì script sẽ bỏ sót ngẫu
 * nhiên, và ghi công thiếu là vi phạm giấy phép.
 *
 * Ba lần thử, giãn dần 1s → 3s → 9s.
 */
async function fetchCredit(file: string): Promise<Credit | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 3 ** (attempt - 1)));
    }
    const got = await fetchCreditOnce(file);
    if (got) return got;
  }
  return null;
}

async function fetchCreditOnce(file: string): Promise<Credit | null> {
  const url = `${API}?action=query&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SciencepediaBot/1.0 (image credit backfill)" },
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

async function main() {
  console.log(WRITE ? "GHI THẬT\n" : "CHẠY THỬ — thêm --write để ghi\n");

  const articles = await p.article.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, coverImage: true, coverImageCredit: true },
  });
  const categories = await p.category.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, coverImage: true, coverImageCredit: true },
  });

  let filled = 0;
  let skipped = 0;

  for (const row of [...articles, ...categories]) {
    const isArticle = articles.includes(row as (typeof articles)[number]);
    if (row.coverImageCredit) {
      console.log(`·  ${row.slug} — đã có ghi công, bỏ qua`);
      continue;
    }

    const file = commonsFile(row.coverImage!);
    if (!file) {
      console.log(`⚠  ${row.slug} — ảnh không nằm trên Wikimedia, BỎ QUA`);
      skipped++;
      continue;
    }

    const credit = await fetchCredit(file);
    if (!credit) {
      console.log(`⚠  ${row.slug} — Commons không trả metadata, BỎ QUA`);
      skipped++;
      continue;
    }

    console.log(`✓  ${row.slug}\n   ${credit.vi}`);
    filled++;

    if (WRITE) {
      const data = {
        coverImageCredit: credit.vi,
        coverImageCreditEn: credit.en,
      };
      if (isArticle) {
        await p.article.update({ where: { id: row.id }, data });
      } else {
        await p.category.update({ where: { id: row.id }, data });
      }
    }
    // Lịch sự với API công cộng của Commons.
    //
    // 1 giây chứ không 250ms: ở 250ms Commons chặn tốc độ và trả 200 với
    // metadata RỖNG — 16/46 ảnh bị bỏ sót một cách ngẫu nhiên. Script bỏ qua
    // hàng đã có ghi công nên chạy lại nhiều lần vẫn hội tụ, nhưng chậm một
    // chút ngay từ đầu thì đỡ phải chạy lại.
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nĐiền được: ${filled} · Bỏ qua: ${skipped}`);
  if (!WRITE && filled > 0) console.log("Chạy lại với --write để ghi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
