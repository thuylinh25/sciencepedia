import { PrismaClient } from "@prisma/client";
import {
  commonsFile,
  fetchCommonsCredit,
  type Credit,
} from "../src/lib/commons-credit";

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

    const credit = await fetchCommonsCredit(file);
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
