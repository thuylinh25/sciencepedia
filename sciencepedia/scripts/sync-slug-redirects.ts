import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * Đổ bảng `ArticleSlugRedirect` ra `src/generated/slug-redirects.json` để
 * `next.config.ts` biến chúng thành luật 301 thật.
 *
 *   npm run redirects:sync    # ghi thẳng tệp, rồi COMMIT tệp đó
 *
 * ## Vì sao phải qua tệp, khi đã có sẵn bảng và code tra bảng
 *
 * `page.tsx` CÓ tra bảng và CÓ gọi `permanentRedirect`. Đo ngày 2026-09-21
 * trên Next 15.5.25, cả ở dev lẫn production: hàng tra được, `status` đúng
 * `PUBLISHED`, `permanentRedirect` được gọi đúng đường dẫn và có ném (dòng
 * log ngay sau nó không chạy) — nhưng phản hồi vẫn là **HTTP 200 kèm trang
 * 404 mặc định của Next**. Cú ném bị nuốt. Cùng họ với lỗi đã ghi ở đầu
 * `page.tsx`: `notFound()` trong route động cũng trả 200.
 *
 * Luật trong `next.config.ts` thì chạy: mục `hanh-trinh-vao-tam-trai-dat` có
 * sẵn ở đó trả 308 thật, đo cùng lúc. Nó chạy ở tầng định tuyến, trước khi
 * React render, nên không dính lỗi trên.
 *
 * ## Đánh đổi phải biết
 *
 * Luật tĩnh chỉ đổi khi DEPLOY. Đổi slug xong mà chưa chạy script này và chưa
 * deploy thì URL cũ vẫn 404. Đổi lại, nó là thứ duy nhất hiện đang hoạt động.
 * Bảng vẫn là nguồn sự thật; tệp này là bản kết xuất.
 *
 * Giữ nguyên lệnh tra bảng trong `page.tsx`: nó vô hại, và ngày Next sửa lỗi
 * thì nó lại đỡ được quãng giữa hai lần deploy.
 */
const prisma = new PrismaClient();

const OUT = "src/generated/slug-redirects.json";

async function main() {
  const rows = await prisma.articleSlugRedirect.findMany({
    select: { oldSlug: true, article: { select: { slug: true, status: true } } },
    orderBy: { oldSlug: "asc" },
  });

  const live = rows.filter((r) => r.article.status === "PUBLISHED");
  const skipped = rows.length - live.length;

  /* Slug cũ trỏ về CHÍNH NÓ: thành luật tĩnh là vòng lặp chuyển hướng vô hạn.
     Ở tầng runtime nó vô hại — `page.tsx` chỉ tra bảng khi không tìm thấy
     bài, mà slug ấy tìm thấy — nên hàng rác kiểu này nằm im không ai thấy.
     Bỏ qua kèm cảnh báo chứ không dừng cả lượt chạy: đây là dữ liệu cũ, không
     phải lỗi của lượt đồng bộ này. */
  const loops = live.filter((r) => r.oldSlug === r.article.slug);
  for (const l of loops) {
    console.warn(`BỎ QUA hàng tự trỏ vào mình: ${l.oldSlug} — nên xoá khỏi bảng.`);
  }

  const data = live
    .filter((r) => r.oldSlug !== r.article.slug)
    .map((r) => ({ from: r.oldSlug, to: r.article.slug }));
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`Đã ghi ${data.length} luật vào ${OUT}.`);
  if (skipped > 0) {
    console.log(`Bỏ ${skipped} hàng có bài chưa xuất bản — không dựng luật cho bài chưa công khai.`);
  }
  console.log("Nhớ commit tệp này: luật chỉ có hiệu lực sau khi deploy.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
