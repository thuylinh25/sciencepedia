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

/** HTML của Commons → Markdown gọn, giữ link. */
function toMarkdown(html: string): string {
  return html
    .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_m, href, text) => {
      const url = String(href).startsWith("//") ? `https:${href}` : href;
      return `[${String(text).replace(/<[^>]+>/g, "")}](${url})`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Credit = { vi: string; en: string };

async function fetchCredit(file: string): Promise<Credit | null> {
  const url = `${API}?action=query&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SciencepediaBot/1.0 (image credit backfill)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }> };
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
    // Lịch sự với API công cộng của Commons
    await new Promise((r) => setTimeout(r, 250));
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
