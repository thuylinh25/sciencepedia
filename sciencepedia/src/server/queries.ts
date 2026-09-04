import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

/** Trường tối thiểu để dựng thẻ bài viết — tránh kéo cả `content`. */
export const articleCardSelect = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  summary: true,
  summaryEn: true,
  coverImage: true,
  readingTime: true,
  views: true,
  featured: true,
  publishedAt: true,
  category: {
    select: { slug: true, name: true, nameEn: true, color: true, icon: true },
  },
  tags: {
    select: { tag: { select: { slug: true, name: true, nameEn: true } } },
  },
  author: { select: { name: true, image: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCard = Prisma.ArticleGetPayload<{
  select: typeof articleCardSelect;
}>;

const PUBLISHED = { status: "PUBLISHED" as const };

// ---------------------------------------------------------------- Bài viết

export const getFeaturedArticles = unstable_cache(
  async (take = 3) =>
    prisma.article.findMany({
      where: { ...PUBLISHED, featured: true },
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ["featured-articles"],
  { revalidate: 300, tags: ["articles"] },
);

export const getLatestArticles = unstable_cache(
  async (take = 6) =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ["latest-articles"],
  { revalidate: 120, tags: ["articles"] },
);

/**
 * ⚠ CẢNH BÁO: cột `views` hiện bằng 0 trên TOÀN BỘ bài viết (đo ngày
 * 2026-09-02: 35/35 bài PUBLISHED có views = 0).
 *
 * Đường ghi lượt đọc có tồn tại và đúng về mặt mã nguồn — `ViewCounter`
 * (client) → `POST /api/articles/[id]/view` → `incrementViews` — nhưng chưa có
 * lưu lượng người thật nào chạy qua nó, và `prisma/seed.ts` cố ý KHÔNG gán
 * views giả. Vì vậy `orderBy: { views: "desc" }` ở đây thực chất trả về một
 * thứ tự tuỳ ý do Postgres quyết (mọi hàng đồng hạng, không có tie-break).
 *
 * Vì mọi hàng đang đồng hạng, `orderBy` ĐƠN trên `views` trả về thứ tự vật lý
 * trong heap Postgres — đổi sau mỗi UPDATE, tức danh sách nhảy loạn mà không ai
 * sửa gì. Tie-break `publishedAt` làm thứ tự ổn định và, khi đồng hạng, suy
 * biến về đúng thứ tự của "Mới nhất" — một mặc định có nghĩa.
 */
export const getPopularArticles = unstable_cache(
  async (take = 5) =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: articleCardSelect,
      orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
      take,
    }),
  ["popular-articles"],
  { revalidate: 600, tags: ["articles"] },
);

/**
 * Bài được sửa gần đây nhất — sắp theo `updatedAt`.
 *
 * ⚠ Khác `getLatestArticles` (sắp theo `publishedAt`) về mặt ngữ nghĩa, nhưng
 * trên DỮ LIỆU HIỆN TẠI thì gần như vô nghĩa: 34/35 bài PUBLISHED dùng chung
 * đúng một mốc `updatedAt` (2026-09-02T11:59:35.264Z) vì `prisma/seed.ts`
 * upsert lại mọi bài trong một lần chạy, và `@updatedAt` bị đẩy lên đồng loạt.
 * Chỉ `mat-troi` có mốc riêng. Nói cách khác cột này đang ghi lại "lần cuối
 * seed chạm vào hàng", không phải "lần cuối biên tập viên sửa bài".
 *
 * Vì thế phải có tie-break tường minh: nếu chỉ `orderBy: { updatedAt: "desc" }`
 * thì 34 hàng đồng hạng và Postgres trả về theo thứ tự vật lý của heap — đổi
 * sau mỗi lần VACUUM hoặc UPDATE, tức danh sách nhảy loạn mà không ai sửa gì.
 * Thêm `publishedAt` rồi `id` làm cho kết quả ổn định và, khi đồng hạng, suy
 * biến về đúng thứ tự của "Mới nhất".
 */
export const getRecentlyUpdatedArticles = unstable_cache(
  async (take = 6) =>
    prisma.article.findMany({
      where: PUBLISHED,
      select: articleCardSelect,
      orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
      take,
    }),
  ["recently-updated-articles"],
  { revalidate: 120, tags: ["articles"] },
);

export type ListArticlesParams = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  sort?: "newest" | "popular" | "alphabetical";
};

export async function listArticles({
  page = 1,
  perPage = 12,
  categorySlug,
  tagSlug,
  sort = "newest",
}: ListArticlesParams = {}) {
  const where: Prisma.ArticleWhereInput = {
    ...PUBLISHED,
    ...(categorySlug
      ? {
          category: {
            OR: [
              { slug: categorySlug },
              { parent: { slug: categorySlug } },
            ],
          },
        }
      : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
  };

  const orderBy: Prisma.ArticleOrderByWithRelationInput =
    sort === "popular"
      ? { views: "desc" }
      : sort === "alphabetical"
        ? { title: "asc" }
        : { publishedAt: "desc" };

  const findPage = (target: number) =>
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy,
      skip: (target - 1) * perPage,
      take: perPage,
    });

  const requested = Math.max(1, Math.trunc(page) || 1);
  const [optimistic, total] = await Promise.all([
    findPage(requested),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Trang vượt quá số trang thật (link cũ, URL gõ tay, bài bị gỡ sau khi trang
  // được cache) phải rơi về trang cuối thay vì trả lưới rỗng — và `page` trả ra
  // là trang thật sự đang hiển thị, để thanh phân trang không trỏ đi đâu khác.
  const current = Math.min(requested, totalPages);
  const items = current === requested ? optimistic : await findPage(current);

  return { items, total, page: current, perPage, totalPages };
}

/** `cache` của React gộp các lần gọi trùng trong cùng một request. */
export const getArticleBySlug = cache(async (slug: string) =>
  prisma.article.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      category: {
        select: {
          slug: true,
          name: true,
          nameEn: true,
          color: true,
          icon: true,
          parent: { select: { slug: true, name: true, nameEn: true } },
        },
      },
      tags: { include: { tag: true } },
      // Byline biên tập viên khoa học — hiển thị ai đã duyệt bài này
      reviewedBy: { select: { id: true, name: true, image: true, bio: true } },
      // Khái niệm mà bài trình bày, dùng cho related concepts và prerequisite
      entity: {
        select: {
          id: true,
          slug: true,
          entityType: true,
          canonicalName: true,
          canonicalNameEn: true,
          wikidataQid: true,
        },
      },
      author: { select: { id: true, name: true, image: true, bio: true } },
      // Nguồn mạnh nhất lên trước; nguồn đã bị rút vẫn lấy về để cảnh báo
      sources: { orderBy: [{ tier: "asc" }, { year: "desc" }] },
      _count: { select: { comments: true } },
    },
  }),
);

export type ArticleDetail = NonNullable<
  Awaited<ReturnType<typeof getArticleBySlug>>
>;

/** Bài liên quan: ưu tiên trùng thẻ, bù thêm bằng bài cùng danh mục. */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  tagIds: string[],
  take = 3,
) {
  const byTag = tagIds.length
    ? await prisma.article.findMany({
        where: {
          ...PUBLISHED,
          id: { not: articleId },
          tags: { some: { tagId: { in: tagIds } } },
        },
        select: articleCardSelect,
        orderBy: { views: "desc" },
        take,
      })
    : [];

  if (byTag.length >= take) return byTag;

  const byCategory = await prisma.article.findMany({
    where: {
      ...PUBLISHED,
      categoryId,
      id: { not: articleId, notIn: byTag.map((a) => a.id) },
    },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
    take: take - byTag.length,
  });

  return [...byTag, ...byCategory];
}

/**
 * Tăng lượt đọc thêm một.
 *
 * Được gọi từ `/api/articles/[id]/view`, tức từ trình duyệt của người đọc, chứ
 * không phải từ server component của trang bài viết. Lý do: trang đặt
 * `revalidate = 300` và được prerender, nên phần lớn lượt truy cập đến từ bản
 * cache và server component không chạy lại — đếm ở đó thì bỏ sót gần hết. Đã
 * đo: sáu lượt truy cập liên tiếp mà con số không nhúc nhích.
 *
 * Lỗi ở đây được nuốt: một lượt đọc không đáng để làm hỏng gì.
 */
export async function incrementViews(id: string) {
  // Chốt phòng xa: nếu sau này lại có chỗ nào gọi hàm này trong lúc prerender,
  // mỗi lần deploy sẽ cộng khống một lượt cho từng bài được dựng sẵn.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  try {
    await prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error("[views] không tăng được lượt xem:", error);
  }
}

/**
 * Danh sách slug đã xuất bản — dùng cho `generateStaticParams` và sitemap.
 *
 * KHÔNG bọc `unstable_cache` ở đây. Next lưu kết quả của nó xuống `.next/cache`
 * và khôi phục thư mục đó giữa các lần build (Vercel cũng vậy), nên một bản
 * build có thể đọc lại danh sách cũ và lặng lẽ bỏ sót những bài mới đăng.
 * Đúng chuyện đã xảy ra: bài mới có mặt trong sitemap nhưng không được
 * prerender, phải chờ render theo yêu cầu ở lần truy cập đầu tiên.
 *
 * Hàm này chỉ chạy lúc build và lúc revalidate, mỗi lần một truy vấn — không
 * đáng để đánh đổi lấy nguy cơ build ra thiếu trang.
 */
export const getPublishedSlugs = cache(async () =>
  prisma.article.findMany({
    where: PUBLISHED,
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  }),
);

// ---------------------------------------------------------------- Danh mục

/**
 * Số bài PUBLISHED của từng danh mục, đã cộng dồn cả nhánh con.
 *
 * `_count.articles` của Prisma chỉ đếm bài gán trực tiếp và không lọc trạng
 * thái. Bài viết luôn nằm ở danh mục lá (ví dụ "Hệ Mặt Trời"), nên danh mục gốc
 * như "Vũ trụ" hiển thị 0 bài dù `listArticles` vẫn trả về bài của cả nhánh.
 */
const publishedCountByCategory = cache(async () => {
  const [groups, tree] = await Promise.all([
    prisma.article.groupBy({
      by: ["categoryId"],
      where: PUBLISHED,
      _count: { _all: true },
    }),
    prisma.category.findMany({ select: { id: true, parentId: true } }),
  ]);

  const parentOf = new Map(tree.map(({ id, parentId }) => [id, parentId]));
  const totals = new Map<string, number>(tree.map(({ id }) => [id, 0]));

  for (const group of groups) {
    // Cộng cho chính danh mục và mọi tổ tiên của nó. `seen` chặn vòng lặp vô
    // hạn nếu cây danh mục bị hỏng (hai danh mục trỏ vòng về nhau).
    const seen = new Set<string>();
    let cursor: string | null | undefined = group.categoryId;

    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      totals.set(cursor, (totals.get(cursor) ?? 0) + group._count._all);
      cursor = parentOf.get(cursor);
    }
  }

  return totals;
});

/** Thay `_count.articles` bằng con số đã cộng dồn ở trên. */
function withRolledUpCount<
  T extends { id: string; _count: { articles: number } },
>(category: T, totals: Map<string, number>): T {
  return {
    ...category,
    _count: { ...category._count, articles: totals.get(category.id) ?? 0 },
  };
}

/**
 * Ảnh đại diện cho mỗi lĩnh vực gốc, khoá theo slug.
 *
 * **Ưu tiên `Category.coverImage`,** chỉ mượn ảnh bìa của bài **mới nhất**
 * trong lĩnh vực khi trường đó còn rỗng.
 *
 * **Vì sao ưu tiên trường của danh mục.** Ảnh của một lĩnh vực phải đại diện
 * cho cả lĩnh vực và phải ổn định — người đọc nhận ra "Vũ trụ" qua ảnh của nó.
 * Ảnh mượn từ bài mới nhất không có cả hai tính chất đó: nó nói về một bài chứ
 * không về lĩnh vực, và nó đổi mỗi lần xuất bản bài mới. Cả 5 lĩnh vực gốc nay
 * đã được gán ảnh có kiểm giấy phép, nên đường mượn chỉ còn là lưới an toàn
 * cho lĩnh vực mới lập mà biên tập chưa kịp chọn ảnh.
 *
 * **Vì sao vẫn giữ đường mượn.** Bỏ hẳn thì một lĩnh vực mới sẽ ra card trơn
 * cho tới khi có người gán ảnh thủ công. Giữ lại thì trạng thái xấu nhất là
 * ảnh không thật khớp — rẻ hơn nhiều so với card trống.
 *
 * Một truy vấn cho cả cây thay vì một truy vấn mỗi lĩnh vực: kho chỉ vài chục
 * bài, lọc trong bộ nhớ rẻ hơn năm vòng đi lại cơ sở dữ liệu.
 */
export const getCategoryCovers = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const [roots, articles] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        select: {
          slug: true,
          id: true,
          coverImage: true,
          children: { select: { id: true } },
        },
      }),
      prisma.article.findMany({
        where: { ...PUBLISHED, coverImage: { not: null } },
        select: { categoryId: true, coverImage: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const covers: Record<string, string> = {};
    for (const root of roots) {
      if (root.coverImage) {
        covers[root.slug] = root.coverImage;
        continue;
      }
      const ids = new Set([root.id, ...root.children.map((c) => c.id)]);
      const newest = articles.find((a) => ids.has(a.categoryId));
      if (newest?.coverImage) covers[root.slug] = newest.coverImage;
    }
    return covers;
  },
  ["category-covers"],
  { revalidate: 600, tags: ["categories", "articles"] },
);

export const getRootCategories = unstable_cache(
  async () => {
    const [categories, totals] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          children: {
            orderBy: { order: "asc" },
            include: { _count: { select: { articles: true } } },
          },
          _count: { select: { articles: true } },
        },
      }),
      publishedCountByCategory(),
    ]);

    return categories.map((category) => ({
      ...withRolledUpCount(category, totals),
      children: category.children.map((child) =>
        withRolledUpCount(child, totals),
      ),
    }));
  },
  ["root-categories"],
  { revalidate: 600, tags: ["categories", "articles"] },
);

export const getAllCategories = unstable_cache(
  async () => {
    const [categories, totals] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { _count: { select: { articles: true } } },
      }),
      publishedCountByCategory(),
    ]);

    return categories.map((category) => withRolledUpCount(category, totals));
  },
  ["all-categories"],
  { revalidate: 600, tags: ["categories", "articles"] },
);

export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { slug: true, name: true, nameEn: true } },
      children: {
        orderBy: { order: "asc" },
        include: { _count: { select: { articles: true } } },
      },
      _count: { select: { articles: true } },
    },
  });
  if (!category) return null;

  const totals = await publishedCountByCategory();

  return {
    ...withRolledUpCount(category, totals),
    children: category.children.map((child) =>
      withRolledUpCount(child, totals),
    ),
  };
});

// ---------------------------------------------------------------- Thẻ

export const getAllTags = unstable_cache(
  async () =>
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { articles: true } } },
    }),
  ["all-tags"],
  { revalidate: 600, tags: ["tags"] },
);

export const getTagBySlug = cache(async (slug: string) =>
  prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } },
  }),
);

/**
 * Thẻ dùng cho dải chip điều hướng.
 *
 * `_count.articles` ở đây được LỌC theo `status: PUBLISHED`. `getAllTags`
 * không lọc, nên nó đếm cả bài DRAFT/REVIEW: một thẻ chỉ gắn với bài nháp vẫn
 * hiện "3 bài" rồi dẫn tới trang trống, vì `listArticles` chỉ trả bài đã đăng.
 */
const tagChipSelect = {
  id: true,
  slug: true,
  name: true,
  nameEn: true,
  color: true,
  _count: { select: { articles: { where: { article: PUBLISHED } } } },
} satisfies Prisma.TagSelect;

export type TagChip = Prisma.TagGetPayload<{ select: typeof tagChipSelect }>;

/**
 * Thẻ có ít nhất một bài ĐÃ ĐĂNG, xếp theo số bài giảm dần.
 *
 * Chặn thẻ rỗng ở tầng query chứ không ở UI: hiện `khi-hau` và `luong-tu` có 0
 * bài, chip trỏ vào chúng là chip dẫn tới trang trống. Lọc ở UI thì mỗi nơi
 * hiển thị thẻ lại phải nhớ lọc lại một lần — sớm muộn cũng có chỗ quên.
 *
 * Sắp xếp làm ở JS chứ không phải `orderBy: { articles: { _count: "desc" } }`:
 * order-by-count của Prisma đếm TOÀN BỘ hàng ArticleTag, không nhận điều kiện
 * lọc, nên nó sẽ xếp theo một con số khác với con số đem hiển thị. Với 19 thẻ
 * (và vài trăm thẻ trong tương lai gần) sắp ở JS rẻ hơn nhiều so với sai lệch.
 */
export const getTagsWithArticles = unstable_cache(
  async (take = 12): Promise<TagChip[]> => {
    const tags = await prisma.tag.findMany({
      where: { articles: { some: { article: PUBLISHED } } },
      select: tagChipSelect,
    });

    return tags
      .sort(
        (a, b) =>
          b._count.articles - a._count.articles ||
          a.name.localeCompare(b.name, "vi"),
      )
      .slice(0, Math.max(0, Math.trunc(take)));
  },
  ["tags-with-articles"],
  { revalidate: 600, tags: ["tags", "articles"] },
);

// ------------------------------------------------------------- Khám phá

/** Kết quả raw SQL là dữ liệu ngoài biên — parse chứ không ép kiểu. */
const slugRows = z.array(z.object({ slug: z.string().min(1) }));

/**
 * Slug một bài đã đăng, chọn ngẫu nhiên — phục vụ route `/random`.
 *
 * KHÔNG bọc `unstable_cache`. Cache sẽ đóng băng kết quả và "ngẫu nhiên" biến
 * thành "cùng một bài suốt 10 phút". Route gọi hàm này phải là dynamic
 * (`export const dynamic = "force-dynamic"`), nếu không Next sẽ prerender nó
 * lúc build và ghim vĩnh viễn một bài.
 *
 * Vì sao `ORDER BY random()` chứ không phải "đếm rồi skip ngẫu nhiên":
 *
 *   - `random()` là MỘT lượt đi-về tới Postgres. Cách đếm-rồi-skip cần hai
 *     (`COUNT(*)`, rồi `OFFSET n`), và với Supabase qua pooler mỗi lượt tốn
 *     ~15–30 ms mạng — đắt hơn nhiều so với phần CPU mà nó tiết kiệm được.
 *   - Ở 35 bài: seq scan + top-N heapsort, đo được 0,1 ms. Không đáng bàn.
 *   - Ở 10.000 bài: vẫn seq scan toàn bảng nhưng chỉ giữ 1 hàng trong heap —
 *     cỡ 3–6 ms trên bảng vài MB, tức vẫn rẻ hơn một lượt đi-về mạng thừa.
 *     `OFFSET n` cũng phải quét qua n hàng nên không hề nhanh hơn.
 *   - Điểm gãy nằm ở khoảng vài trăm nghìn hàng, khi seq scan bắt đầu tốn I/O
 *     thật. Đến lúc đó mới đổi sang `TABLESAMPLE SYSTEM_ROWS(1)` hoặc bốc theo
 *     một cột số ngẫu nhiên có index. Bây giờ mà làm là tối ưu hoá mù.
 */
export async function getRandomPublishedSlug(): Promise<string | null> {
  const rows = await prisma.$queryRaw`
    SELECT slug
    FROM "Article"
    WHERE status = 'PUBLISHED'
    ORDER BY random()
    LIMIT 1
  `;

  const parsed = slugRows.safeParse(rows);
  if (!parsed.success) {
    console.error("[random] kết quả truy vấn không đúng dạng:", parsed.error);
    return null;
  }

  return parsed.data[0]?.slug ?? null;
}

/**
 * Múi giờ dùng để cắt ngày. Vercel chạy UTC, nên nếu không ghim múi giờ thì
 * "bài hôm nay" sẽ đổi lúc 7 giờ sáng giờ Việt Nam.
 */
const DAILY_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Khoá ngày dạng `YYYY-MM-DD` theo giờ Việt Nam. `en-CA` cho đúng thứ tự đó. */
export function currentDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * FNV-1a 32-bit. Cần một hàm băm ổn định QUA CÁC LẦN DEPLOY và các phiên bản
 * Node — nên không dùng `Math.random`, không dùng `hashCode` tự chế phụ thuộc
 * thứ tự mảng, và không dùng `crypto.randomUUID`.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type DailyPick = {
  dayKey: string;
  article: ArticleCard | null;
  tags: TagChip[];
};

/**
 * Phần thật sự chạm DB. Nhận `dayKey` làm THAM SỐ — đây là mấu chốt, xem chú
 * thích của `getDailyPick`.
 */
const dailyPickFor = unstable_cache(
  async (dayKey: string, tagTake: number): Promise<DailyPick> => {
    // Chọn bằng `md5(id || dayKey)` ngay trong Postgres: deterministic theo
    // ngày, ổn định qua mọi lần deploy, và không phải kéo 35 (hay 10.000) id
    // về Node chỉ để bốc một hàng. Băm theo TỪNG id thay vì "modulo trên vị
    // trí thứ n" có một tính chất quan trọng: đăng thêm bài giữa ngày chỉ đổi
    // lựa chọn với xác suất 1/n, thay vì làm lệch toàn bộ danh sách và đổi
    // bài của hôm nay ngay lập tức.
    const rows = await prisma.$queryRaw`
      SELECT slug
      FROM "Article"
      WHERE status = 'PUBLISHED'
      ORDER BY md5(id || ${dayKey}::text)
      LIMIT 1
    `;

    const parsed = slugRows.safeParse(rows);
    if (!parsed.success) {
      console.error("[daily] kết quả truy vấn không đúng dạng:", parsed.error);
    }

    const slug = parsed.success ? parsed.data[0]?.slug : undefined;

    const [article, allTags] = await Promise.all([
      slug
        ? prisma.article.findFirst({
            where: { slug, ...PUBLISHED },
            select: articleCardSelect,
          })
        : Promise.resolve(null),
      getTagsWithArticles(64),
    ]);

    // Thẻ của ngày: xáo trộn deterministic trên tập thẻ ĐÃ lọc rỗng, nên chip
    // nào cũng dẫn tới một trang có bài. Không truy vấn thêm.
    const tags = allTags
      .map((tag) => ({ tag, rank: fnv1a(`${dayKey}:${tag.id}`) }))
      .sort((a, b) => a.rank - b.rank || a.tag.slug.localeCompare(b.tag.slug))
      .slice(0, Math.max(0, Math.trunc(tagTake)))
      .map((entry) => entry.tag);

    return { dayKey, article, tags };
  },
  ["daily-pick"],
  { revalidate: 3600, tags: ["articles", "tags"] },
);

/**
 * "Bài viết hôm nay" — cùng một ngày cho cùng một kết quả, sang ngày mới thì
 * đổi. Trang chủ là static/ISR nên "ngẫu nhiên mỗi lần tải" là bất khả thi:
 * HTML được dựng sẵn và phục vụ lại cho mọi người.
 *
 * ---- Tương tác với cache: đây là chỗ dễ sai nhất, có HAI lớp ----
 *
 * Lớp 1 — `unstable_cache`. `new Date()` được gọi Ở ĐÂY, ngoài hàm cached, rồi
 * `dayKey` truyền vào như một tham số. Next đưa tham số vào khoá cache, nên
 * sang ngày mới là một khoá mới, tức cache MISS ngay, không phải chờ hết
 * `revalidate`. Nếu gọi `new Date()` BÊN TRONG hàm cached thì ngày bị đông
 * cứng cùng với kết quả và mùng 3 vẫn trả bài của mùng 2 — đúng cái bẫy cần
 * tránh. `revalidate: 3600` bên trong chỉ để dữ liệu bài không quá cũ, nó
 * không còn liên quan gì tới việc đổi ngày.
 *
 * Lớp 2 — ISR của trang chủ, và ĐÂY MỚI LÀ RÀNG BUỘC THẬT. Cache của tầng
 * query có miss đúng lúc nửa đêm cũng vô ích nếu trang chủ không được render
 * lại: người đọc vẫn nhận bản HTML cũ. Trần thời gian trễ = `revalidate` của
 * `src/app/[locale]/page.tsx`, cộng thời gian tới lượt truy cập đầu tiên sau
 * khi hết hạn (Next revalidate theo kiểu stale-while-revalidate: lượt truy cập
 * đầu tiên sau khi hết hạn vẫn nhận bản cũ, lượt sau mới nhận bản mới).
 *
 * Hai cách xử lý, chọn một:
 *
 *   a) Đặt `export const revalidate = 900` ở trang chủ. Bài của ngày mới lên
 *      trong vòng ~15–30 phút sau nửa đêm. Không cần hạ tầng gì thêm. Với 35
 *      bài và lưu lượng hiện tại, đây là lựa chọn đúng.
 *   b) Muốn đổi đúng 00:00: thêm Vercel Cron chạy `0 17 * * *` UTC (= 00:00
 *      giờ Việt Nam) gọi một route gọi `revalidateTag("articles")` hoặc
 *      `revalidatePath("/vi", "page")`. Chính xác tuyệt đối, đổi lại là một
 *      cron và một route được bảo vệ bằng secret.
 *
 * Lưu ý build: trang chủ được prerender lúc build, nên bản HTML đầu tiên mang
 * `dayKey` của NGÀY BUILD. Không sao miễn là trang chủ có `revalidate` hữu
 * hạn — nhưng nếu ai đó đặt `revalidate = false` thì bài "hôm nay" sẽ đứng im
 * ở ngày deploy cho tới lần deploy kế tiếp.
 */
export function getDailyPick(tagTake = 6): Promise<DailyPick> {
  return dailyPickFor(currentDayKey(), tagTake);
}

// ---------------------------------------------------------------- Thống kê

/**
 * Bốn con số trên StatsBand. Mỗi con số phải khớp ĐÚNG với thứ nhãn của nó hứa.
 *
 *  - `categories` đếm DANH MỤC GỐC, không phải toàn bộ cây. Nhãn là "Lĩnh vực
 *    khoa học"; `category.count()` trả 14 vì kể cả danh mục con, trong khi chỉ
 *    có 5 lĩnh vực thật — phóng đại gần 3×.
 *  - `tags` chỉ đếm thẻ CÓ ÍT NHẤT MỘT BÀI ĐÃ ĐĂNG. `tag.count()` trả 19, kể
 *    cả 2 thẻ rỗng; hứa nội dung không tồn tại rồi dẫn tới trang trống.
 *
 * Không làm tròn lên, không "35+". Đây là bách khoa toàn thư khoa học: thổi số
 * của chính mình phá đúng thứ tài sản mà sản phẩm bán.
 */
export const getSiteStats = unstable_cache(
  async () => {
    const [articles, categories, tags, views] = await Promise.all([
      prisma.article.count({ where: PUBLISHED }),
      prisma.category.count({ where: { parentId: null } }),
      prisma.tag.count({
        where: { articles: { some: { article: PUBLISHED } } },
      }),
      prisma.article.aggregate({ where: PUBLISHED, _sum: { views: true } }),
    ]);

    return {
      articles,
      categories,
      tags,
      views: views._sum.views ?? 0,
    };
  },
  ["site-stats"],
  { revalidate: 900, tags: ["articles", "categories", "tags"] },
);

export async function getAdminStats() {
  const [total, published, drafts, users, views, recent, byCategory] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: PUBLISHED }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.article.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          views: true,
          updatedAt: true,
          category: { select: { name: true, nameEn: true, color: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({
        select: {
          name: true,
          nameEn: true,
          color: true,
          _count: { select: { articles: true } },
        },
        orderBy: { order: "asc" },
      }),
    ]);

  return {
    total,
    published,
    drafts,
    users,
    views: views._sum.views ?? 0,
    recent,
    byCategory,
  };
}

// ------------------------------------------------------- Knowledge graph

/**
 * Bài cần đọc trước — đi ngược cạnh PREREQUISITE_OF.
 *
 * Cạnh có hướng `A PREREQUISITE_OF B` nghĩa là "phải hiểu A trước khi hiểu B",
 * nên tiền đề của bài hiện tại là các cạnh ĐI VÀO entity của nó.
 *
 * Chỉ lấy một bậc. Chuỗi tiền đề đầy đủ là việc của learning path, không phải
 * của trang bài viết: đổ cả cây lên trang chỉ làm người đọc bối rối.
 */
export const getPrerequisites = cache(async (entityId: string, take = 4) => {
  const edges = await prisma.relationship.findMany({
    where: { toEntityId: entityId, relType: "PREREQUISITE_OF" },
    orderBy: { weight: "desc" },
    take,
    select: {
      fromEntity: {
        select: {
          slug: true,
          canonicalName: true,
          canonicalNameEn: true,
          articles: {
            where: PUBLISHED,
            select: articleCardSelect,
            take: 1,
          },
        },
      },
    },
  });

  // Tiền đề chưa có bài viết thì bỏ qua: link tới trang trống còn tệ hơn
  // không link. content-curator nhặt các khoảng trống này qua báo cáo riêng.
  return edges
    .map((edge) => edge.fromEntity.articles[0])
    .filter((article): article is ArticleCard => Boolean(article));
});

/**
 * Khái niệm liên quan theo graph — hai chiều, bỏ quan hệ phân cấp.
 *
 * IS_A và PART_OF đã được thể hiện bằng breadcrumb và danh mục rồi, lặp lại ở
 * đây chỉ tốn chỗ. PREREQUISITE_OF có khối riêng. Còn lại là các quan hệ ngang
 * thực sự mở rộng hiểu biết: nguyên nhân, ứng dụng, khái niệm hay bị nhầm lẫn.
 */
const LATERAL_RELATIONS = [
  "CAUSES",
  "APPLIES_TO",
  "CONTRASTS_WITH",
  "EXAMPLE_OF",
  "MEASURED_BY",
  "DISCOVERED_BY",
] as const;

export const getRelatedByGraph = cache(async (entityId: string, take = 3) => {
  const edges = await prisma.relationship.findMany({
    where: {
      relType: { in: [...LATERAL_RELATIONS] },
      OR: [{ fromEntityId: entityId }, { toEntityId: entityId }],
    },
    orderBy: { weight: "desc" },
    // Lấy dư rồi lọc: một cạnh có thể trỏ tới entity chưa có bài viết
    take: take * 3,
    select: {
      fromEntityId: true,
      fromEntity: {
        select: { articles: { where: PUBLISHED, select: articleCardSelect, take: 1 } },
      },
      toEntity: {
        select: { articles: { where: PUBLISHED, select: articleCardSelect, take: 1 } },
      },
    },
  });

  const seen = new Set<string>();
  const related: ArticleCard[] = [];

  for (const edge of edges) {
    // Lấy đầu kia của cạnh, bất kể hướng
    const other =
      edge.fromEntityId === entityId ? edge.toEntity : edge.fromEntity;
    const article = other.articles[0];
    if (!article || seen.has(article.id)) continue;
    seen.add(article.id);
    related.push(article);
    if (related.length >= take) break;
  }

  return related;
});

/**
 * Bài liên quan dùng cho trang bài viết: ưu tiên graph, thiếu thì bù bằng
 * tag/category như trước.
 *
 * Graph cho ra quan hệ có chủ đích do biên tập viên khẳng định; tag/category
 * chỉ cho ra "cùng chủ đề". Bài chưa gắn entity vẫn chạy được như cũ, nên
 * không cần backfill toàn bộ dữ liệu trước khi triển khai.
 */
export async function getRelatedForArticle(
  article: { id: string; categoryId: string; entityId: string | null },
  tagIds: string[],
  take = 3,
) {
  const fromGraph = article.entityId
    ? await getRelatedByGraph(article.entityId, take)
    : [];

  if (fromGraph.length >= take) return fromGraph;

  const fallback = await getRelatedArticles(
    article.id,
    article.categoryId,
    tagIds,
    take - fromGraph.length,
  );

  const seen = new Set(fromGraph.map((a) => a.id));
  return [...fromGraph, ...fallback.filter((a) => !seen.has(a.id))];
}
