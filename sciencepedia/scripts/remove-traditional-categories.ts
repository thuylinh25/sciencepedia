import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Xóa hẳn ba nhóm phương pháp truyền thống khỏi Sức khoẻ — quyết định của
 * Linh 2026-10-28: `tac-dong-cot-song`, `bam-huyet`, `y-hoc-co-truyen`,
 * KÈM mọi bài viết trong chúng (14 bài Tác động cột sống đang PUBLISHED;
 * hai nhóm kia 0 bài).
 *
 *   npm run taxonomy:remove-traditional              # in kế hoạch + sao lưu, KHÔNG ghi CSDL
 *   npm run taxonomy:remove-traditional -- --write   # thực thi
 *
 * ## Script này làm gì, theo thứ tự
 *
 * 1. SAO LƯU toàn bộ dữ liệu sắp xóa (3 danh mục, mọi bài trong chúng, và
 *    các hàng con: Source, Revision, ArticleTag, Comment, Bookmark,
 *    ArticleSlugRedirect, ContentActivity) vào `backups/` — cả ở chế độ
 *    chạy khô. Xóa là không rút lại được bằng nút nào trên site; tệp sao
 *    lưu là đường lui duy nhất.
 * 2. SỬA LINK CHẾT: quét nội dung (vi + en) của mọi bài KHÔNG bị xóa, bỏ
 *    những dòng "đọc thêm" trỏ tới một bài sắp xóa (`/articles/<slug>`).
 *    Lúc viết script có đúng một bài như vậy (bài Huyệt đạo trỏ tới "Đau
 *    lưng cấp theo Tác động cột sống"); quét toàn bộ để lần chạy thật tự
 *    kiểm chứng lại, có gì khác nó in ra.
 * 3. Xóa ContentActivity loại ARTICLE của các bài (bảng này tham chiếu
 *    bài bằng chuỗi id, không có FK — không dọn thì lịch sử xem của người
 *    dùng còn trỏ vào bài không còn tồn tại).
 * 4. Xóa các bài — hàng con có FK `onDelete: Cascade` tự đi theo.
 * 5. Xóa 3 danh mục (lúc này đã rỗng; `deleteCategory` ở admin cũng chỉ
 *    cho xóa danh mục rỗng).
 *
 * Mọi ghi nằm trong một transaction. Sau khi ghi: báo site làm mới cache
 * (`revalidateSite`) và nhắc chạy `npm run search:reindex` nếu Meilisearch
 * đang bật — chỉ mục tìm kiếm còn giữ 14 bài tới lần reindex.
 *
 * Phần code đi kèm (PR cùng đợt): gỡ 3 slug khỏi
 * `scripts/seed-health-groups.ts` (chạy lại seed không sinh lại chúng) và
 * khỏi ánh xạ khung "traditional" trong `src/lib/category-notices.ts`.
 * Pipeline spine (`src/lib/spine/`, `scripts/spine-*`,
 * `content/tac-dong-cot-song/`) không thuộc đợt xóa dữ liệu này; nó đã bị
 * gỡ khỏi repo ngay sau đó, cùng ngày, theo quyết định "dọn luôn" của Linh
 * (PR dọn pipeline spine) — gồm cả tích hợp lúc chạy trong trang Human
 * Atlas (chỉ mục đốt sống ↔ bài ở `human-atlas/page.tsx` và khung riêng
 * trong bảng chi tiết cấu trúc).
 */
const prisma = new PrismaClient();

const CATEGORY_SLUGS = ["tac-dong-cot-song", "bam-huyet", "y-hoc-co-truyen"];

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "=== THỰC THI ===\n" : "=== CHẠY KHÔ (thêm --write để ghi) ===\n");

  const categories = await prisma.category.findMany({
    where: { slug: { in: CATEGORY_SLUGS } },
    select: { id: true, slug: true, name: true, parentId: true },
  });
  if (categories.length === 0) {
    console.log("Cả ba danh mục đều không còn — không có gì để xóa.");
    return;
  }
  const categoryIds = categories.map((c) => c.id);

  const articles = await prisma.article.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true, slug: true, status: true, categoryId: true },
    orderBy: { slug: "asc" },
  });
  const articleIds = articles.map((a) => a.id);
  const slugOfCategory = new Map(categories.map((c) => [c.id, c.slug]));
  for (const c of categories) {
    const own = articles.filter((a) => a.categoryId === c.id);
    console.log(`Danh mục ${c.slug} (${c.name}): ${own.length} bài`);
  }
  for (const a of articles) {
    console.log(`  - [${a.status}] ${a.slug} (${slugOfCategory.get(a.categoryId)})`);
  }

  // ---- 1. Sao lưu (cả chạy khô) -------------------------------------------
  const [fullArticles, sources, revisions, tags, comments, bookmarks, redirects, activities] =
    await Promise.all([
      prisma.article.findMany({ where: { id: { in: articleIds } } }),
      prisma.source.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.revision.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.articleTag.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.comment.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.bookmark.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.articleSlugRedirect.findMany({ where: { articleId: { in: articleIds } } }),
      prisma.contentActivity.findMany({
        where: { contentType: "ARTICLE", contentId: { in: articleIds } },
      }),
    ]);
  const stamp = new Date().toISOString().slice(0, 10);
  const backupDir = path.join(process.cwd(), "backups");
  mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `traditional-removal-${stamp}.json`);
  writeFileSync(
    backupFile,
    JSON.stringify(
      {
        categories,
        articles: fullArticles,
        related: {
          sources,
          revisions,
          articleTags: tags,
          comments,
          bookmarks,
          articleSlugRedirects: redirects,
          contentActivities: activities,
        },
      },
      null,
      1,
    ),
  );
  console.log(
    `\nSao lưu: ${backupFile}` +
      ` (bài ${fullArticles.length}, nguồn ${sources.length}, bản sửa ${revisions.length},` +
      ` hoạt động ${activities.length})`,
  );

  // ---- 2. Quét link chết trong các bài còn lại ----------------------------
  const deletedSlugs = new Set(articles.map((a) => a.slug));
  const others = await prisma.article.findMany({
    where: { id: { notIn: articleIds } },
    select: { id: true, slug: true, content: true, contentEn: true },
  });
  type Repair = { id: string; slug: string; content: string; contentEn: string | null; removed: number };
  const repairs: Repair[] = [];
  for (const other of others) {
    let removed = 0;
    const strip = (body: string | null): string | null => {
      if (!body) return body;
      const lines = body.split("\n");
      const kept = lines.filter((line) => {
        for (const slug of deletedSlugs) {
          if (line.includes(`/articles/${slug}`)) return false;
        }
        return true;
      });
      removed += lines.length - kept.length;
      return kept.join("\n");
    };
    const content = strip(other.content);
    const contentEn = strip(other.contentEn);
    if (removed > 0 && content !== null) {
      repairs.push({ id: other.id, slug: other.slug, content, contentEn, removed });
      console.log(`Link chết: bài ${other.slug} có ${removed} dòng trỏ tới bài sắp xóa — sẽ bỏ dòng.`);
    }
  }
  if (repairs.length === 0) console.log("Link chết: không bài nào còn lại trỏ tới các bài sắp xóa.");

  console.log(
    `\nKế hoạch: sửa ${repairs.length} bài có link chết, xóa ${activities.length} hàng ContentActivity,` +
      ` xóa ${articles.length} bài, xóa ${categories.length} danh mục.`,
  );

  if (!write) {
    console.log("\nChưa ghi gì vào CSDL. Thêm --write để thực thi.");
    return;
  }

  // ---- 3–5. Ghi trong một transaction --------------------------------------
  await prisma.$transaction(async (tx) => {
    for (const r of repairs) {
      await tx.article.update({
        where: { id: r.id },
        data: { content: r.content, contentEn: r.contentEn },
      });
    }
    await tx.contentActivity.deleteMany({
      where: { contentType: "ARTICLE", contentId: { in: articleIds } },
    });
    await tx.article.deleteMany({ where: { id: { in: articleIds } } });
    await tx.category.deleteMany({ where: { id: { in: categoryIds } } });
  });
  console.log("Đã ghi xong.");

  const touched = [...articles.map((a) => a.slug), ...repairs.map((r) => r.slug)];
  await revalidateSite(touched);
  console.log("\nXong. Chạy `npm run search:reindex` nếu Meilisearch đang bật.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
