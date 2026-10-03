import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Điền mô tả ảnh bìa (alt) từ `scripts/data/cover-alt.json`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/set-cover-alt.ts           # in kế hoạch
 *   npx tsx --env-file-if-exists=.env scripts/set-cover-alt.ts --write   # ghi
 *
 * ## Vì sao mô tả được viết bằng cách NHÌN ảnh, không suy từ tiêu đề
 *
 * Alt suy từ tiêu đề bài là đọc lại tiêu đề lần thứ hai cho người dùng trình
 * đọc màn hình, và nói với Google Images một điều ảnh không cho thấy. Mỗi mục
 * trong tệp JSON được viết sau khi xem chính tấm ảnh trên R2 (2026-10-03), đối
 * chiếu mô tả gốc trên Wikimedia Commons khi ảnh đến từ đó. Đã qua
 * `science-editor` cho những mục có nội dung khoa học (tên thiên thể, tàu,
 * bước sóng, cấu trúc sinh học).
 *
 * Tả cái ẢNH, kể cả khi ảnh lệch bài: bìa bài GABA là phân tử acetylcholine,
 * nên alt nói acetylcholine. Alt nói "GABA" là nói dối người không nhìn thấy.
 * Chỗ sửa là thay ảnh, không phải sửa alt.
 *
 * Chỉ điền ô TRỐNG: alt người biên tập đã gõ trong form không bị ghi đè. Thay
 * ảnh bìa thì alt cũ thành sai — xoá alt cùng lúc thay ảnh.
 */
const prisma = new PrismaClient();

type Alt = { vi: string; en: string };

async function main() {
  const write = process.argv.includes("--write");
  const data = JSON.parse(
    readFileSync(new URL("./data/cover-alt.json", import.meta.url), "utf8"),
  ) as Record<string, Alt>;

  const articles = await prisma.article.findMany({
    where: { slug: { in: Object.keys(data) } },
    select: {
      id: true,
      slug: true,
      coverImage: true,
      coverImageAlt: true,
      coverImageAltEn: true,
      updatedAt: true,
    },
  });

  for (const slug of Object.keys(data)) {
    if (!articles.some((a) => a.slug === slug)) {
      console.warn(`⚠ không có bài "${slug}" — bỏ qua`);
    }
  }

  const changed: string[] = [];
  for (const article of articles) {
    const alt = data[article.slug];
    if (!article.coverImage) {
      console.warn(`⚠ ${article.slug}: không có ảnh bìa — bỏ qua`);
      continue;
    }
    const update = {
      ...(article.coverImageAlt ? {} : { coverImageAlt: alt.vi }),
      ...(article.coverImageAltEn ? {} : { coverImageAltEn: alt.en }),
    };
    if (Object.keys(update).length === 0) continue;
    changed.push(article.slug);
    console.log(`+ ${article.slug}`);
    if (write) {
      await prisma.article.update({
        where: { id: article.id },
        // `updatedAt` là ngày "Cập nhật" hiện trên bài và `dateModified` trong
        // JSON-LD. Thêm alt không đổi nội dung bài, nên giữ nguyên mốc cũ —
        // phải truyền tường minh, không thì `@updatedAt` tự đẩy sang "bây giờ".
        data: { ...update, updatedAt: article.updatedAt },
        select: { id: true },
      });
    }
  }

  if (!write) {
    console.log(`\n${changed.length} bài sẽ được điền alt. Chạy lại với --write để ghi.`);
    return;
  }
  console.log(`\n✓ Đã điền alt cho ${changed.length} bài.`);
  if (changed.length > 0) await revalidateSite(changed);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
