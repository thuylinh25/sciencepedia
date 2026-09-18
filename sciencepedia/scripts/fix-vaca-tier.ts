import { PrismaClient } from "@prisma/client";

/**
 * Hạ mọi hàng nguồn VACA từ tier 2 xuống tier 4.
 *
 *   npx tsx scripts/fix-vaca-tier.ts            # in kế hoạch
 *   npx tsx scripts/fix-vaca-tier.ts --write    # thực thi
 *
 * ## Vì sao
 *
 * `Source.tier` mặc định là 2 — bậc của NASA, NOAA, NIH, CERN. `vaca-sync.ts`
 * không đặt trường này, nên mọi bài nhập từ thienvanvietnam.org lặng lẽ mang
 * bậc ấy. Thiên văn Việt Nam là câu lạc bộ nghiệp dư: theo thang của
 * `science-editor` nó là bậc 4, dùng làm bối cảnh chứ không đỡ claim.
 *
 * Con số này không phải nhãn trang trí. `check-publish.ts` đếm nguồn bậc 1–2
 * để quyết bài có đủ nguồn hay chưa, nên một hàng gắn nhầm bậc làm bài trông
 * như đã đạt ngưỡng. Đợt thẩm định 17/09 gặp đúng cảnh đó: chín bài chỉ có
 * mỗi nguồn VACA mà vẫn hiện ra như có nguồn bậc 2.
 *
 * Script KHÔNG xoá nguồn và KHÔNG đụng nội dung bài. Bỏ hẳn nguồn VACA là
 * việc của lô sửa S3 — ở đó mỗi claim đang dựa vào nó phải tìm được nguồn
 * thay thế, chứ không chỉ đổi một con số bậc.
 */
const prisma = new PrismaClient();

const HOST = "thienvanvietnam.org";
const TIER = 4;

async function main() {
  const write = process.argv.includes("--write");

  console.log("=== HẠ BẬC NGUỒN VACA ===");
  console.log(
    write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n",
  );

  const rows = await prisma.source.findMany({
    where: { url: { contains: HOST }, tier: { not: TIER } },
    select: { id: true, tier: true, title: true, article: { select: { slug: true } } },
    orderBy: { article: { slug: "asc" } },
  });

  if (rows.length === 0) {
    console.log("Không còn hàng nào cần hạ bậc.");
    return;
  }

  for (const row of rows) {
    console.log(`tier ${row.tier} → ${TIER}  ${row.article.slug}`);
  }
  console.log(`\n${rows.length} hàng nguồn.`);

  if (!write) {
    console.log("Sẵn sàng. Chạy lại với --write để ghi.");
    return;
  }

  const result = await prisma.source.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { tier: TIER },
  });
  console.log(`\nĐã hạ bậc ${result.count} hàng.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
