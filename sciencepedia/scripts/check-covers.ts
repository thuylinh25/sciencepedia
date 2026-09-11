import { PrismaClient } from "@prisma/client";

/**
 * Rà toàn bộ ảnh bìa bài viết: đường dẫn nào còn tải được, đường dẫn nào chết.
 *
 *   npm run check:covers
 *
 * ## Vì sao cần
 *
 * Ngày 2026-09-11, hai bài trong khối "đọc nhiều nhất" hiện ô đen. Thử tay
 * năm ảnh bìa mà trang chủ đang dùng thì **bốn cái trả 404**: hàng dữ liệu
 * vẫn giữ đường dẫn, nhưng tệp không còn trong bucket Supabase.
 *
 *   {"statusCode":"404","error":"not_found",
 *    "message":"Object not found","code":"NoSuchKey"}
 *
 * Kiểu hỏng này không lộ ra ở đâu cả: `next/image` nhận một URL hợp lệ, gọi
 * nó, thất bại, rồi vẽ một ô trống. Không có log, không có lỗi build, và
 * `publish:check` cũng không bắt vì nó kiểm nội dung chứ không gọi ảnh.
 *
 * ## Vì sao chỉ đọc
 *
 * Script này không sửa gì. Nó không biết ảnh đúng phải là ảnh nào — chỉ người
 * biên tập biết. Việc của nó là nói ra danh sách, để lượt sửa sau đó là một
 * quyết định có dữ liệu chứ không phải một cuộc đi tìm.
 */

const prisma = new PrismaClient();

/**
 * User-Agent bắt buộc, không phải phép lịch sự.
 *
 * Node gửi mặc định `User-Agent: node`, và Wikimedia **trả 403** cho mọi
 * request không khai một User-Agent mô tả được — đó là chính sách của họ, không
 * phải sự cố. Ngày 2026-09-11 script này báo 21 ảnh bìa hỏng; **16 trong số đó
 * là ảnh Wikimedia đang sống bình thường** trong trình duyệt. Một phép kiểm
 * báo động giả ba phần tư thì tệ hơn không có phép kiểm nào: nó dạy người đọc
 * kết quả bỏ qua chính nó.
 *
 * Khai đúng tên dự án kèm một địa chỉ liên hệ là thứ chính sách Wikimedia yêu
 * cầu — đừng rút gọn thành một chuỗi giả trình duyệt.
 */
const USER_AGENT =
  "SciencepediaCoverCheck/1.0 (+https://sciencepedia-sciencepedia.vercel.app)";

const TIMEOUT_MS = 15000;

async function attempt(url: string): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    /*
     * GET chứ không HEAD: Supabase Storage trả 400 cho HEAD trên đường dẫn
     * public, nên HEAD sẽ báo hỏng cho cả những ảnh đang sống.
     */
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    return { ok: response.ok, status: response.status };
  } catch {
    // `status: 0` = không nhận được phản hồi nào: quá hạn, DNS hỏng, đứt kết
    // nối. Phân biệt với một mã HTTP thật, vì hai thứ này cần cách xử khác nhau.
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gọi thử, và thử LẠI một lần nếu lượt đầu không nhận được phản hồi nào.
 *
 * Lỗi truyền tải khác hẳn lỗi HTTP. Một `404` là kết luận về cái URL; một lượt
 * đứt kết nối chỉ là kết luận về mạng lúc đó. Chạy 57 lượt gọi liên tiếp thì
 * thỉnh thoảng có một lượt rơi — ngày 2026-09-11 ảnh Unsplash của bài
 * `newton-da-giai-ma-the-gioi-nhu-the-nao` bị báo hỏng, gọi tay ngay sau đó
 * trả 200 trong 3 giây.
 *
 * Không thử lại với mã HTTP thật: gọi lại một URL vừa trả 404 chỉ tốn thời gian
 * để nhận đúng câu trả lời cũ.
 *
 * Đây là cùng một bài học với chỗ User-Agent ở trên, chỉ khác nguyên nhân: một
 * phép kiểm còn báo động giả là một phép kiểm người ta học cách bỏ qua.
 */
async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  const first = await attempt(url);
  if (first.status !== 0) return first;

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return attempt(url);
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { coverImage: { not: null } },
    select: { slug: true, title: true, coverImage: true, status: true },
    orderBy: { views: "desc" },
  });

  const missingCover = await prisma.article.count({
    where: { coverImage: null, status: "PUBLISHED" },
  });

  console.log(`${articles.length} bài có đường dẫn ảnh bìa.`);
  if (missingCover > 0) {
    console.log(`${missingCover} bài đã xuất bản KHÔNG có ảnh bìa nào.\n`);
  }

  const broken: typeof articles = [];

  for (const article of articles) {
    const result = await probe(article.coverImage as string);
    if (!result.ok) {
      broken.push(article);
      console.log(
        `✗ ${String(result.status).padEnd(4)} ${article.slug}  —  ${article.title.slice(0, 50)}`,
      );
    }
  }

  console.log(
    `\n${broken.length}/${articles.length} ảnh bìa không tải được.`,
  );

  if (broken.length > 0) {
    console.log("\nĐường dẫn hỏng:");
    for (const article of broken) {
      console.log(`  ${article.slug}\n    ${article.coverImage}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
