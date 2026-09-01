import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { cosmosArticles, cosmosCategories, cosmosTags } from "./seed-data/cosmos";
import { healthArticles, healthCategories, healthTags } from "./seed-data/health";
import { otherArticles, otherCategories, otherTags } from "./seed-data/other";
import { vacaArticles } from "./seed-data/vaca";
import type { SeedArticle } from "./seed-data/types";

const prisma = new PrismaClient();

/** Ước lượng thời gian đọc — giữ đồng bộ với src/lib/utils.ts */
function readingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Ảnh bìa.
 *
 * Các bài thiên thể dùng ảnh chụp thật của NASA/ESA lấy từ Wikimedia Commons
 * (public domain): ảnh stock Unsplash chỉ là bầu trời sao chung chung, không
 * minh hoạ đúng đối tượng bài viết. URL ghim theo bản thumbnail 1280px —
 * Wikimedia chỉ chấp nhận một số bề rộng cố định, đổi số sẽ trả về 400.
 * Các chủ đề còn lại vẫn dùng Unsplash, ổn định vì đã ghim photo id.
 */
const WIKIMEDIA = "https://upload.wikimedia.org/wikipedia/commons/thumb";
const nasaCover = (dir: string, file: string) =>
  `${WIKIMEDIA}/${dir}/${file}/1280px-${file}`;

const COVERS: Record<string, string> = {
  // Hệ Mặt Trời — ảnh thật theo đúng thiên thể của từng bài
  "mat-troi": nasaCover(
    "b/b4",
    "The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg",
  ),
  "sao-thuy": nasaCover("4/4a", "Mercury_in_true_color.jpg"),
  "sao-kim": nasaCover("e/e5", "Venus-real_color.jpg"),
  "trai-dat": nasaCover("9/97", "The_Earth_seen_from_Apollo_17.jpg"),
  "sao-hoa": nasaCover("0/02", "OSIRIS_Mars_true_color.jpg"),
  "sao-moc": nasaCover("2/2b", "Jupiter_and_its_shrunken_Great_Red_Spot.jpg"),
  "sao-tho": nasaCover("c/c7", "Saturn_during_Equinox.jpg"),
  "sao-thien-vuong": nasaCover("3/3d", "Uranus2.jpg"),
  "sao-hai-vuong": nasaCover("5/56", "Neptune_Full.jpg"),
  "ho-den":
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80",
  "kinh-james-webb":
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
  "giac-ngu-sau-va-tri-nho":
    "https://images.unsplash.com/photo-1520206183501-b80df61043c2?w=1600&q=80",
  "he-mien-dich-nhan-dien-virus":
    "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=1600&q=80",
  "he-vi-sinh-duong-ruot":
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80",
  "van-dong-va-tim-mach":
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80",
  "thuyet-tuong-doi-hep":
    "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1600&q=80",
  "crispr-la-gi":
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1600&q=80",
};

async function main() {
  console.log("→ Bắt đầu seed Sciencepedia");

  // ---------------------------------------------------------------- Người dùng
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@sciencepedia.dev")
    .toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      email,
      name: "Ban biên tập Sciencepedia",
      role: Role.ADMIN,
      bio: "Tài khoản quản trị được tạo bởi script seed.",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`  ✓ Quản trị viên: ${admin.email}`);

  // ---------------------------------------------------------------- Danh mục
  // Danh mục gốc phải tồn tại trước khi tạo danh mục con.
  const allCategories = [
    ...cosmosCategories,
    ...healthCategories,
    ...otherCategories,
  ];
  const roots = allCategories.filter((category) => !category.parentSlug);
  const children = allCategories.filter((category) => category.parentSlug);

  const categoryIds = new Map<string, string>();

  for (const category of [...roots, ...children]) {
    const parentId = category.parentSlug
      ? categoryIds.get(category.parentSlug)
      : null;

    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
        order: category.order,
        parentId,
      },
      create: {
        slug: category.slug,
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
        order: category.order,
        parentId,
      },
    });

    categoryIds.set(category.slug, record.id);
  }
  console.log(`  ✓ ${allCategories.length} danh mục`);

  // ---------------------------------------------------------------- Thẻ
  const allTags = [...cosmosTags, ...healthTags, ...otherTags];
  const tagIds = new Map<string, string>();

  for (const tag of allTags) {
    const record = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, nameEn: tag.nameEn, color: tag.color },
      create: tag,
    });
    tagIds.set(tag.slug, record.id);
  }
  console.log(`  ✓ ${allTags.length} thẻ`);

  // ---------------------------------------------------------------- Bài viết
  // Vũ trụ và Sức khoẻ đứng trước — đây là hai nhánh được ưu tiên.
  const all: SeedArticle[] = [
    ...cosmosArticles,
    ...healthArticles,
    ...otherArticles,
    ...vacaArticles,
  ];

  // Truyền slug để chỉ ghi vài bài: `npm run db:seed -- mat-troi sao-thuy`.
  // Dùng khi thêm bài mới vào một CSDL đang chạy, tránh ghi đè nội dung của
  // những bài đã được biên tập lại qua trang quản trị.
  const only = new Set(process.argv.slice(2));
  const articles = only.size
    ? all.filter((article) => only.has(article.slug))
    : all;

  if (only.size) {
    const missing = [...only].filter(
      (slug) => !all.some((article) => article.slug === slug),
    );
    if (missing.length) {
      throw new Error(`Không có bài nào mang slug: ${missing.join(", ")}`);
    }
    console.log(`  → Chỉ ghi ${articles.length} bài được chỉ định`);
  }

  let index = 0;
  for (const article of articles) {
    const categoryId = categoryIds.get(article.categorySlug);
    if (!categoryId) {
      console.warn(`  ! Bỏ qua ${article.slug}: không tìm thấy danh mục`);
      continue;
    }

    // Ngày đăng giãn lùi về quá khứ để danh sách "mới nhất" có thứ tự hợp lý
    const publishedAt = new Date(Date.now() - index * 36 * 60 * 60 * 1000);

    const data = {
      title: article.title,
      titleEn: article.titleEn,
      summary: article.summary,
      summaryEn: article.summaryEn,
      content: article.content,
      contentEn: article.contentEn ?? null,
      coverImage: article.coverImage ?? COVERS[article.slug] ?? null,
      status: "PUBLISHED" as const,
      featured: article.featured ?? false,
      readingTime: readingTime(article.content),
      seoKeywords: article.seoKeywords ?? null,
      categoryId,
      authorId: admin.id,
    };

    // `views` và `publishedAt` chỉ đặt lúc tạo: chạy lại seed để cập nhật nội
    // dung không được xáo lại lượt xem hay đẩy bài lên đầu "mới nhất".
    const record = await prisma.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: {
        slug: article.slug,
        ...data,
        views: Math.floor(Math.random() * 4000) + 120,
        publishedAt,
      },
    });

    // Gán lại thẻ và nguồn từ đầu để seed chạy lại nhiều lần vẫn cho kết quả giống nhau
    await prisma.articleTag.deleteMany({ where: { articleId: record.id } });
    await prisma.articleTag.createMany({
      data: article.tagSlugs
        .map((slug) => tagIds.get(slug))
        .filter((id): id is string => Boolean(id))
        .map((tagId) => ({ articleId: record.id, tagId })),
      skipDuplicates: true,
    });

    await prisma.source.deleteMany({ where: { articleId: record.id } });
    if (article.sources?.length) {
      await prisma.source.createMany({
        data: article.sources.map((source) => ({
          articleId: record.id,
          title: source.title,
          url: source.url ?? null,
          publisher: source.publisher ?? null,
          year: source.year ?? null,
        })),
      });
    }

    index += 1;
  }
  console.log(`  ✓ ${index} bài viết`);

  // ---------------------------------------------------------------- Meilisearch
  if (process.env.MEILISEARCH_HOST) {
    try {
      const { ensureIndex, articlesIndex, toDocument } = await import(
        "../src/lib/meili"
      );
      await ensureIndex();

      const published = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: {
          category: { select: { slug: true, name: true, nameEn: true } },
          tags: {
            select: {
              tag: { select: { slug: true, name: true, nameEn: true } },
            },
          },
        },
      });

      await articlesIndex().addDocuments(published.map(toDocument));
      console.log(`  ✓ Đã đẩy ${published.length} bài lên Meilisearch`);
    } catch (error) {
      console.warn(
        "  ! Bỏ qua bước Meilisearch (chưa chạy hoặc sai cấu hình):",
        (error as Error).message,
      );
    }
  } else {
    console.log("  – Bỏ qua Meilisearch: chưa đặt MEILISEARCH_HOST");
  }

  console.log("→ Seed xong.");
  console.log(`   Đăng nhập: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error("Seed thất bại:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
