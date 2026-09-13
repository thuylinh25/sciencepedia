/**
 * Thêm liên kết VÀO bài `mat-trang` từ hai bài đã xuất bản.
 *
 * ## Vì sao cần
 *
 * `check-publish` CHẶN bài không có liên kết vào. Đó không phải hình thức: một
 * bài không ai trỏ tới là một bài chỉ vào được qua tìm kiếm hoặc sitemap, tức
 * nó nằm ngoài cấu trúc của kho.
 *
 * ## Vì sao chỉ BỌC chữ có sẵn
 *
 * Hai bài đích đã xuất bản, nên mọi lượt chạm vào chúng là ĐÍNH CHÍNH chứ
 * không phải biên tập. Cách rẻ nhất và an toàn nhất là bọc một cụm từ đã nằm
 * sẵn trong câu — không thêm, không bớt, không đổi thứ tự chữ nào. Tiền lệ:
 * `cau-truc-ben-trong-trai-dat` thêm bốn liên kết đúng kiểu này mà không đổi
 * một chữ của bản vừa qua gate accuracy hai vòng.
 *
 * ## Ba thứ để lại, theo `docs/content-rules.md`
 *
 * 1. `Revision` chụp nội dung TRƯỚC khi sửa, ghi trong CÙNG transaction — để
 *    lịch sử không thể lệch khỏi nội dung.
 * 2. Một dòng trong `docs/content/corrections.md` (làm tay sau khi chạy).
 * 3. `lastVerifiedAt` thì **KHÔNG** đụng tới. Lượt này không đối chiếu câu nào
 *    với nguồn nào; đặt mốc ấy là nói dối rằng bài vừa được rà lại. Cùng phán
 *    quyết với lượt gỡ dấu backtick lạc.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET = "/articles/mat-trang";

/** Mỗi mục: câu NGUYÊN VĂN cần tìm, và chính nó với cụm từ đã bọc link. */
const EDITS = [
  {
    slug: "nhat-thuc-va-nguyet-thuc-hai-hien-tuong-che-khuat-khong-doi-xung",
    vi: {
      from: "- **Nhật thực** xảy ra khi Mặt Trăng che khuất Mặt Trời.",
      to: `- **Nhật thực** xảy ra khi [Mặt Trăng](${TARGET}) che khuất Mặt Trời.`,
    },
    en: {
      from: "- **Solar eclipses** occur when the Moon obscures the Sun.",
      to: `- **Solar eclipses** occur when [the Moon](${TARGET}) obscures the Sun.`,
    },
  },
  {
    slug: "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
    vi: {
      from:
        "Nguyên nhân chính của thủy triều là lực hấp dẫn của Mặt Trăng và Mặt Trời tác động lên khối nước đại dương.",
      to: `Nguyên nhân chính của thủy triều là lực hấp dẫn của [Mặt Trăng](${TARGET}) và Mặt Trời tác động lên khối nước đại dương.`,
    },
    en: {
      from:
        "The primary cause of tides is the gravitational pull of the Moon and the Sun acting on the ocean waters.",
      to: `The primary cause of tides is the gravitational pull of [the Moon](${TARGET}) and the Sun acting on the ocean waters.`,
    },
  },
];

const write = process.argv.includes("--write");

async function main() {
  for (const edit of EDITS) {
    const article = await prisma.article.findUnique({
      where: { slug: edit.slug },
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        contentEn: true,
      },
    });

    if (!article) {
      console.log(`✘ ${edit.slug} — không có bài`);
      continue;
    }
    if (article.content.includes(TARGET)) {
      console.log(`· ${edit.slug} — đã có liên kết, bỏ qua`);
      continue;
    }

    /* Phải khớp ĐÚNG MỘT lần. Khớp nhiều lần nghĩa là câu không đủ đặc trưng
       và mình sắp sửa nhầm chỗ; khớp không lần nào nghĩa là bài đã đổi từ lúc
       khảo sát. Cả hai đều phải dừng chứ không đoán tiếp. */
    const viHits = article.content.split(edit.vi.from).length - 1;
    const enHits = (article.contentEn ?? "").split(edit.en.from).length - 1;
    if (viHits !== 1 || enHits !== 1) {
      console.log(`✘ ${edit.slug} — VI khớp ${viHits} lần, EN khớp ${enHits} lần; DỪNG`);
      continue;
    }

    const nextVi = article.content.replace(edit.vi.from, edit.vi.to);
    const nextEn = (article.contentEn ?? "").replace(edit.en.from, edit.en.to);

    if (!write) {
      console.log(`≫ ${edit.slug} [${article.status}] — sẽ thêm 1 liên kết VI + 1 EN (chạy khô)`);
      continue;
    }

    await prisma.$transaction([
      /* Ảnh chụp bản TRƯỚC khi sửa, cùng transaction với lệnh sửa. */
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          note: "Trước khi bọc liên kết nội bộ tới /articles/mat-trang — không đổi chữ nào",
        },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { content: nextVi, contentEn: nextEn },
      }),
    ]);

    console.log(`✔ ${edit.slug} — đã thêm liên kết VI + EN, kèm Revision`);
  }

  if (!write) console.log("\nChạy khô. Thêm `--write` để ghi thật.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
