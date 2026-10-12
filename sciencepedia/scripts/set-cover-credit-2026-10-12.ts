import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Ghi công ảnh bìa bài "Bí ẩn bầu trời đêm…" (phiếu docs/content/checks/2026-10-12/, mục E1).
 *
 * Ảnh là sơ đồ "Stars vs Planets: where their light comes from" của Star Walk (Vito Technology),
 * trong bài https://starwalk.space/en/news/difference-between-stars-and-planets — cùng tên tệp
 * `star-vs-planet`, cùng cỡ 1140×641, có logo StarWalk. Chủ sản phẩm chốt 2026-10-12: tạm giữ
 * ảnh, ghi công. Ghi công không phải giấy phép: ảnh vẫn chưa có căn cứ được phép dùng.
 *
 * Chỉ điền ô đang trống — không đè chữ người gõ. Chạy lại không đổi gì.
 *
 *   npx tsx --env-file-if-exists=.env scripts/set-cover-credit-2026-10-12.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/set-cover-credit-2026-10-12.ts --write
 */
const SLUG = "bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong";
const PAGE = "https://starwalk.space/en/news/difference-between-stars-and-planets";
const CREDIT = `Ảnh: [Star Walk / Vito Technology](${PAGE})`;
const CREDIT_EN = `Image: [Star Walk / Vito Technology](${PAGE})`;

const prisma = new PrismaClient();

async function main() {
  const write = process.argv.includes("--write");
  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, coverImage: true, coverImageCredit: true, coverImageCreditEn: true },
  });
  if (!a.coverImage?.includes("star-vs-planet")) throw new Error(`ảnh bìa đã đổi (${a.coverImage}) — ghi công này không còn đúng`);

  const data = {
    ...(a.coverImageCredit?.trim() ? {} : { coverImageCredit: CREDIT }),
    ...(a.coverImageCreditEn?.trim() ? {} : { coverImageCreditEn: CREDIT_EN }),
  };
  console.log(Object.keys(data).length ? data : "đã có ghi công — không đổi gì");
  if (!write || !Object.keys(data).length) {
    if (!write) console.log("Chạy khô. Thêm --write để ghi.");
    return;
  }
  await prisma.article.update({ where: { id: a.id }, data });
  await revalidateSite([SLUG]);
  console.log(`ĐÃ GHI ${SLUG}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
