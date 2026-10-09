import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Chuyển bài "Từ nguyên tử đến kim cương" từ gốc Vật lý sang lĩnh vực Hoá học (chủ sản phẩm chốt
 * 2026-10-09, phiếu thẩm định mục E2). Bài nói về electron hóa trị, liên kết hóa học, cấu trúc
 * tinh thể — chủ đề của hoá học; Vật lý chỉ chung phần trạng thái vật chất.
 *
 *   npx tsx --env-file-if-exists=.env scripts/recategorize-2026-10-09.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/recategorize-2026-10-09.ts --write
 *
 * Hoá học đang 0 bài nên trang lĩnh vực tự noindex; bài này là bài đầu tiên.
 */
const prisma = new PrismaClient();

const MOVES = [{ article: "tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat", to: "hoa-hoc" }];

async function main() {
  const write = process.argv.includes("--write");
  const touched: string[] = [];
  for (const m of MOVES) {
    const a = await prisma.article.findUniqueOrThrow({ where: { slug: m.article }, select: { id: true, category: { select: { slug: true } } } });
    const to = await prisma.category.findUniqueOrThrow({ where: { slug: m.to }, select: { id: true } });
    if (a.category?.slug === m.to) {
      console.log(`· ${m.article}: đã ở ${m.to}`);
      continue;
    }
    console.log(`${m.article}: ${a.category?.slug} → ${m.to}`);
    if (!write) continue;
    await prisma.article.update({ where: { id: a.id }, data: { categoryId: to.id } });
    touched.push(m.article);
  }
  if (touched.length) await revalidateSite(touched);
  if (!write) console.log("\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
