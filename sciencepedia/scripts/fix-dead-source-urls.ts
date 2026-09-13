import { PrismaClient } from "@prisma/client";

/**
 * Thay URL nguồn đã chết bằng URL còn sống.
 *
 *   npx tsx scripts/fix-dead-source-urls.ts            # in kế hoạch
 *   npx tsx scripts/fix-dead-source-urls.ts --write    # thực thi
 *
 * `scripts/check-source-urls.ts` tìm ra chúng; script này chữa. Tách làm hai
 * vì phần chữa KHÔNG tự động được: mỗi URL chết cần một người quyết định đâu
 * là thứ thay thế đúng, và quyết định ấy phải ghi lại.
 *
 * ## Nguyên tắc thay
 *
 * Thay bằng trang CÒN SỐNG NÓI VỀ CÙNG MỘT THỨ, không phải trang gần giống.
 * Khi không tìm được trang tương đương, thà trỏ lên một cấp (trang chủ đề của
 * chính cơ quan ấy) còn hơn trỏ sang một nguồn khác — người đọc theo link để
 * kiểm chứng vẫn tới đúng cơ quan đã phát biểu.
 *
 * Mọi URL thay thế dưới đây đã được mở và xác nhận trả 200 ngày 2026-09-12.
 */
const prisma = new PrismaClient();

type Fix = { from: string; to: string; why: string };

const FIXES: Fix[] = [
  {
    from: "https://eclipse.gsfc.nasa.gov/LEpubs/5MCLE.html",
    to: "https://eclipse.gsfc.nasa.gov/lunar.html",
    why: "Trang danh mục ấn phẩm nguyệt thực đã gỡ. Trang nguyệt thực chính của cùng bộ phận NASA GSFC còn sống và chứa chính các bảng tra ấy.",
  },
  {
    from: "https://eclipse.gsfc.nasa.gov/SEpubs/RPindex.html",
    to: "https://eclipse.gsfc.nasa.gov/solar.html",
    why: "Cùng lý do, phía nhật thực.",
  },
  {
    from: "https://www.nasa.gov/news-release/nasa-noaa-sun-reaches-maximum-phase-in-11-year-solar-cycle/",
    to: "https://science.nasa.gov/science-research/heliophysics/nasa-noaa-sun-reaches-maximum-phase-in-11-year-solar-cycle/",
    why: "NASA dời tin từ nasa.gov sang science.nasa.gov. Cùng bản tin, cùng tiêu đề, chỉ đổi tên miền và đường dẫn.",
  },
  {
    from: "https://www.iau.org/static/resolutions/IAU2012_English.pdf",
    to: "https://syrte.obspm.fr/IAU_resolutions/Res_IAU2012_B2.pdf",
    why: "iau.org đã dựng lại trang và bỏ thư mục /static/resolutions. SYRTE — Đài thiên văn Paris, chính đơn vị soạn thảo nghị quyết B2 về đơn vị thiên văn — lưu bản PDF gốc. Đây là bản sao của CƠ QUAN, không phải của một trang thứ ba.",
  },
  {
    from: "https://science.nasa.gov/solar-system/comets/shoemaker-levy-9/",
    to: "https://science.nasa.gov/solar-system/comets/",
    why: "Trang riêng của Shoemaker-Levy 9 đã gỡ, không có trang thay thế. Trỏ lên trang sao chổi của chính NASA: người đọc theo link để kiểm chứng vẫn tới đúng cơ quan.",
  },
  {
    from: "https://www.imo.net/resources/calendar/",
    to: "https://www.imo.net/resources/calendar",
    why: "Chỉ là dấu gạch chéo cuối. Máy chủ IMO trả lỗi với bản có gạch chéo và trả 200 với bản không có.",
  },
];

/**
 * URL chết mà lượt này KHÔNG chữa, kèm lý do — để lần sau không phải dò lại.
 *
 * Ghi ra đây chứ không im lặng bỏ qua: một danh sách "đã xem xét và chưa xử
 * lý" khác hẳn một danh sách bị quên.
 */
const UNRESOLVED = [
  {
    url: "https://www.iau.org/static/resolutions/IAU2018_ResolB4_English.pdf",
    why: "Nghị quyết B4 năm 2018 (định luật Hubble–Lemaître). Đã thử iau.org, kho thông cáo của IAU và bản sao SYRTE — cả bốn đều 404. Cần người tìm một bản PDF chính thức còn sống, hoặc đổi sang trích dẫn bài báo bình duyệt tương ứng.",
  },
  {
    url: "https://www.minorplanetcenter.net/",
    why: "Không nối được từ máy chạy phép rà (mã 000, không phải 404). Có thể là chặn theo vùng hoặc tạm ngừng, chứ chưa chắc đã chết. Cần kiểm bằng trình duyệt trước khi thay.",
  },
];

async function main() {
  const write = process.argv.includes("--write");

  for (const fix of FIXES) {
    const rows = await prisma.source.findMany({
      where: { url: fix.from },
      select: { title: true, article: { select: { slug: true } } },
    });

    console.log(`${rows.length} hàng · ${fix.from}`);
    console.log(`   → ${fix.to}`);
    console.log(`   ${fix.why}`);
    for (const row of rows) console.log(`   · ${row.article.slug}`);
    console.log();

    if (write && rows.length) {
      await prisma.source.updateMany({
        where: { url: fix.from },
        data: { url: fix.to },
      });
    }
  }

  console.log("=== CHƯA CHỮA ===\n");
  for (const item of UNRESOLVED) {
    console.log(item.url);
    console.log(`   ${item.why}\n`);
  }

  console.log(write ? "Đã ghi." : "Chạy khô. Thêm --write để ghi.");
}

main()
  .catch((error) => {
    console.error((error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
