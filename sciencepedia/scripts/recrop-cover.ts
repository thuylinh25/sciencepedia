import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

import { assetUrl } from "../src/lib/asset";
import { LADDER, variantKey } from "../src/lib/image-variants";
import { missingEnv, put } from "./r2-client";

/**
 * Cắt sẵn ảnh bìa của MỘT bài về 16/10, chọn vị trí dải cắt bằng tay.
 *
 *   npx tsx --env-file-if-exists=.env scripts/recrop-cover.ts --slug <slug> --top <px>
 *   ... --write   # tải lên R2 và đổi coverImage
 *
 * ## Vì sao tồn tại
 *
 * Thẻ bài dùng `object-cover` trong khung 16/10 và cắt QUANH TÂM ảnh (lý do
 * giữ cách ấy: ghi chú trong `article-card.tsx`). Ảnh dựng đứng thì dải giữa
 * chỉ còn ~40% chiều cao, và chủ thể nằm ở phần trên — đầu người, đỉnh núi —
 * bị cắt mất. Ghi chú ấy đã chốt chỗ sửa: cắt sẵn ảnh của chính bài đó, không
 * đổi `object-fit` cho cả lưới. Script này là cách làm việc đó lặp lại được.
 *
 * `--top` là toạ độ px (trên ảnh GỐC) của mép trên dải cắt, chọn bằng mắt.
 * Không tự dò chủ thể: dò sai thì lặng lẽ cắt sai, còn một con số người đã
 * nhìn ảnh rồi chọn thì kiểm lại được.
 *
 * Tệp cũ trên R2 KHÔNG bị xoá — muốn hoàn nguyên thì trỏ `coverImage` về URL
 * cũ mà script in ra. Tên tệp mới mang UUID mới vì biến thể được đệm
 * `immutable` một năm: ghi đè cùng tên thì trình duyệt giữ ảnh cũ.
 */
const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const slug = arg("slug");
  const top = Number(arg("top"));
  const write = process.argv.includes("--write");
  if (!slug || !Number.isFinite(top)) throw new Error("Cần --slug và --top <px>");
  if (write && missingEnv().length) throw new Error(`Thiếu biến môi trường: ${missingEnv().join(", ")}`);

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, coverImage: true },
  });
  if (!article?.coverImage) throw new Error(`Bài ${slug} không có ảnh bìa`);

  const source = Buffer.from(await (await fetch(article.coverImage)).arrayBuffer());
  const meta = await sharp(source).metadata();
  const width = meta.width ?? 0;
  const height = Math.round((width * 10) / 16);
  if (!meta.height || top < 0 || top + height > meta.height) {
    throw new Error(`Dải ${top}..${top + height} vượt ảnh cao ${meta.height}`);
  }
  console.log(`ảnh gốc ${width}×${meta.height} → cắt ${width}×${height} từ y=${top}`);

  const cropped = await sharp(source).extract({ left: 0, top, width, height }).toBuffer();
  const stem = `articles/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${slug.slice(0, 60)}-${crypto.randomUUID().slice(0, 8)}`;
  const targets = [...new Set([...LADDER.filter((w) => w < width), Math.min(width, LADDER[LADDER.length - 1])])].sort(
    (a, b) => a - b,
  );

  if (!write) {
    await sharp(cropped).toFile(`${process.env.TEMP ?? "."}/recrop-preview.png`);
    console.log(`xem trước: ${process.env.TEMP ?? "."}/recrop-preview.png — các nấc ${targets.join(", ")}. Chưa ghi gì.`);
    return;
  }

  // Cùng nấc, cùng chất lượng WebP, cùng header với `uploadBuffer` trong
  // src/lib/storage.ts — lệch ở đây là `<CoverImage>` suy sai srcset.
  const widths: number[] = [];
  for (const w of targets) {
    const buffer = await sharp(cropped).resize(w, undefined, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const actual = (await sharp(buffer).metadata()).width ?? w;
    if (widths.includes(actual)) continue;
    widths.push(actual);
    await put(variantKey(`${stem}.webp`, actual), buffer, {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    });
  }
  const url = assetUrl(variantKey(`${stem}.webp`, widths[widths.length - 1]));
  await prisma.article.update({ where: { id: article.id }, data: { coverImage: url } });
  console.log(`cũ:  ${article.coverImage}\nmới: ${url}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
