import { PrismaClient } from "@prisma/client";

import { slugify } from "../src/lib/utils";

/**
 * Đổi tiêu đề bài `cau-truc-ben-trong-trai-dat` cho khớp slug của chính nó.
 *
 *   npm run fix:earth-title              # in kế hoạch, KHÔNG ghi gì
 *   npm run fix:earth-title -- --write   # thực thi
 *
 * ## Vì sao
 *
 * Bài đổi slug ngày 10/09 từ `hanh-trinh-vao-tam-trai-dat` sang
 * `cau-truc-ben-trong-trai-dat`, nhưng TIÊU ĐỀ không đổi theo. Hệ quả không
 * chỉ là khó coi: `slugs:rename` chuẩn hoá slug về `slugify(title)`, nên nó
 * muốn kéo slug NGƯỢC về `hanh-trinh-vao-tam-trai-dat` — đúng slug mà
 * `next.config.ts` đang 301 VỀ `cau-truc-ben-trong-trai-dat`. Chạy lượt chuẩn
 * hoá ấy là dựng một vòng lặp chuyển hướng vô hạn trên URL công khai.
 * Bộ chặn trong `rename-article-slugs.ts` (21/09) ngăn tai nạn, nhưng nó chặn
 * CẢ lượt chạy — tức mọi slug lệch khác cũng không chuẩn hoá được cho tới khi
 * gốc rễ này được sửa.
 *
 * ## Vì sao là tiêu đề ngắn, không phải bản đầy đủ
 *
 * `seoTitle` đã là "Cấu trúc bên trong Trái Đất: vỏ, manti và lõi" và
 * `titleEn` đã là "Inside the Earth: Crust, Mantle and Core" — hai trường ấy
 * đúng từ lâu, chỉ mỗi `title` tiếng Việt bị bỏ quên. Nhưng nếu lấy nguyên
 * bản dài làm `title` thì `slugify` ra `…-vo-manti-va-loi`, tức lệch lại theo
 * hướng khác. `title` lấy bản gọn để khớp slug; bản đầy đủ ở lại `seoTitle`,
 * đúng việc của trường ấy.
 *
 * ## Vì sao KHÔNG ghi vào corrections.md
 *
 * `docs/content-rules.md` đòi ba thứ cho mỗi lượt sửa CLAIM trên bài đã
 * publish. Đây không phải claim: không con số nào đổi, không mệnh đề nào đổi,
 * chỉ là một cái tên vốn đã sai lệch so với chính slug và seoTitle của bài.
 * Vẫn chụp `Revision` — rẻ, và lịch sử tên bài là thứ đáng tra lại.
 */
const prisma = new PrismaClient();

const SLUG = "cau-truc-ben-trong-trai-dat";
const NEXT_TITLE = "Cấu trúc bên trong Trái Đất";
const OLD_TITLE = "Hành trình vào tâm Trái Đất";

/** Nhãn link tiếng Việt trỏ tới bài này, phải đổi theo tên mới. */
const LABEL_FIXES = [
  "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
  "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
];

async function main() {
  const write = process.argv.slice(2).includes("--write");

  if (slugify(NEXT_TITLE) !== SLUG) {
    throw new Error(
      `Tiêu đề mới slugify ra "${slugify(NEXT_TITLE)}", không khớp slug "${SLUG}" — sửa thế này là lệch lại theo hướng khác.`,
    );
  }

  const article = await prisma.article.findUnique({
    where: { slug: SLUG },
    select: { id: true, title: true, content: true, seoTitle: true, titleEn: true },
  });
  if (!article) throw new Error(`Không có bài ${SLUG}`);
  if (article.title === NEXT_TITLE) {
    console.log("Tiêu đề đã đúng, không có gì để làm.");
    return;
  }
  if (article.title !== OLD_TITLE) {
    throw new Error(
      `Tiêu đề hiện tại là "${article.title}", không phải "${OLD_TITLE}" — ai đó đã sửa, dừng lại để không đè.`,
    );
  }

  console.log(`${SLUG}`);
  console.log(`   title   : ${article.title}`);
  console.log(`           → ${NEXT_TITLE}`);
  console.log(`   seoTitle: ${article.seoTitle}  (giữ nguyên)`);
  console.log(`   titleEn : ${article.titleEn}  (giữ nguyên)`);

  const labelUpdates: {
    id: string;
    slug: string;
    title: string;
    /** Nội dung TRƯỚC khi sửa — thứ đi vào Revision. */
    before: string;
    /** Nội dung SAU khi sửa — thứ đi vào Article. */
    after: string;
  }[] = [];
  for (const slug of LABEL_FIXES) {
    const other = await prisma.article.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, content: true },
    });
    if (!other) throw new Error(`Không có bài ${slug}`);

    const find = `[${OLD_TITLE}](/articles/${SLUG})`;
    const count = other.content.split(find).length - 1;
    if (count !== 1) {
      throw new Error(`${slug}: nhãn link khớp ${count} chỗ, cần đúng 1`);
    }
    console.log(`   nhãn link ở ${slug}: ${OLD_TITLE} → ${NEXT_TITLE}`);
    labelUpdates.push({
      id: other.id,
      slug: other.slug,
      title: other.title,
      before: other.content,
      after: other.content.replace(find, `[${NEXT_TITLE}](/articles/${SLUG})`),
    });
  }

  if (!write) {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  /* Revision chụp TRƯỚC khi sửa, cùng transaction với lệnh sửa — cùng quy ước
     với các lượt sửa bài đã publish khác, để lịch sử không lệch khỏi nội dung. */
  await prisma.$transaction([
    prisma.revision.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        note: `Trước khi đổi tiêu đề cho khớp slug: "${OLD_TITLE}" → "${NEXT_TITLE}"`,
      },
    }),
    prisma.article.update({ where: { id: article.id }, data: { title: NEXT_TITLE } }),
    ...labelUpdates.flatMap((u) => [
      prisma.revision.create({
        data: {
          articleId: u.id,
          title: u.title,
          content: u.before,
          note: `Trước khi đổi nhãn link trỏ tới ${SLUG}`,
        },
      }),
      prisma.article.update({ where: { id: u.id }, data: { content: u.after } }),
    ]),
  ]);
  console.log("\nĐã ghi (kèm revision cho cả ba bài).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
