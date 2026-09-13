/**
 * Bước 5–10 của pipeline cho bài `mat-trang`, chạy một lượt trong MỘT transaction.
 *
 * Chạy lại được nhiều lần: mọi thao tác đều `upsert` hoặc có kiểm tra trước,
 * nên lượt thứ hai không đẻ thêm hàng. Cần thế vì bước 11 (`publish`) có thể
 * trả bài về và lượt sau phải chạy lại từ đây.
 *
 * KHÔNG đặt `status: PUBLISHED`. Đường ghi duy nhất sang PUBLISHED là
 * `scripts/publish.ts`, và gate nằm trong chính nó.
 */
import { readFileSync } from "node:fs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "mat-trang";
const ADMIN_ID = "cmti8v05z0000k5ccfg55mget"; // Ban biên tập Sciencepedia
const CATEGORY_SLUG = "he-mat-troi";

const vi = readFileSync("../docs/content/drafts/mat-trang.md", "utf8").trim();
const en = readFileSync("../docs/content/drafts/mat-trang.en.md", "utf8").trim();

/** Cùng công thức với `src/lib/utils.ts` và `scripts/check-publish.ts`. */
const readingTime = Math.max(1, Math.round(vi.split(/\s+/).length / 200));

/* Tám nguồn của bảng ở `docs/content/research/mat-trang.yaml`, giữ nguyên bậc
   và DOI. Hai nguồn bậc 1 là chỗ đối chứng thật cho sáu trang NASA. */
const SOURCES = [
  {
    title: "Moon Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/facts/",
    tier: 2,
  },
  {
    title: "Tidal Locking",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/tidal-locking/",
    tier: 2,
  },
  {
    title: "Measuring the Moon's Distance",
    publisher: "NASA Goddard Space Flight Center",
    url: "https://eclipse.gsfc.nasa.gov/SEhelp/ApolloLaser.html",
    tier: 2,
  },
  {
    title: "How Did the Moon Form?",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/formation/",
    tier: 2,
  },
  {
    title: "Earth's Moon",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/",
    tier: 2,
  },
  {
    title:
      "Origin of the Moon in a giant impact near the end of the Earth's formation",
    publisher: "Nature 412, 708–712 — Canup & Asphaug",
    url: "https://doi.org/10.1038/35089010",
    doi: "10.1038/35089010",
    year: 2001,
    tier: 1,
  },
  {
    title: "Stabilization of the Earth's obliquity by the Moon",
    publisher: "Nature 361, 615–617 — Laskar, Joutel & Robutel",
    url: "https://doi.org/10.1038/361615a0",
    doi: "10.1038/361615a0",
    year: 1993,
    tier: 1,
  },
  {
    title: "Milankovitch (Orbital) Cycles and Their Role in Earth's Climate",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
    tier: 2,
  },
];

async function main() {
  const now = new Date();
  const accessed = new Date("2026-09-12T00:00:00Z");

  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: CATEGORY_SLUG },
    select: { id: true, name: true },
  });

  await prisma.$transaction(
    async (tx) => {
      /* ── Bước 5: entity + quan hệ có kiểu ───────────────────────────── */
      const entity = await tx.entity.upsert({
        where: { slug: SLUG },
        update: {},
        create: {
          slug: SLUG,
          canonicalName: "Mặt Trăng",
          canonicalNameEn: "The Moon",
          entityType: "OBJECT",
          aliases: ["mặt trăng", "nguyệt", "moon", "luna"],
          wikidataQid: "Q405",
          description:
            "Vệ tinh tự nhiên duy nhất của Trái Đất, khoá thuỷ triều đồng bộ nên luôn hướng một mặt về phía hành tinh.",
        },
      });

      const neighbours = await tx.entity.findMany({
        where: { slug: { in: ["he-mat-troi", "trai-dat"] } },
        select: { id: true, slug: true },
      });
      const byId = Object.fromEntries(neighbours.map((n) => [n.slug, n.id]));

      /* Chỉ hai cạnh, và cả hai đều phát biểu được thành một câu tiếng Việt:
           - Mặt Trăng LÀ MỘT PHẦN CỦA Hệ Mặt Trời
           - Phải đọc Trái Đất TRƯỚC KHI đọc Mặt Trăng
         Không thêm cạnh "Mặt Trăng GÂY RA thuỷ triều" vì kho chưa có entity
         thuỷ triều, và dựng một entity chỉ để treo một cạnh là làm graph
         phình ra bằng những nút không ai đọc. */
      const edges: {
        from: string;
        to: string;
        relType: "PART_OF" | "PREREQUISITE_OF";
        weight: number;
        note: string;
      }[] = [];

      if (byId["he-mat-troi"]) {
        edges.push({
          from: entity.id,
          to: byId["he-mat-troi"],
          relType: "PART_OF",
          weight: 1,
          note: "Vệ tinh của Trái Đất, nằm trong Hệ Mặt Trời",
        });
      }
      if (byId["trai-dat"]) {
        edges.push({
          from: byId["trai-dat"],
          to: entity.id,
          relType: "PREREQUISITE_OF",
          weight: 0.9,
          note: "Bài Mặt Trăng giả định người đọc đã biết Trái Đất",
        });
      }

      for (const e of edges) {
        await tx.relationship.upsert({
          where: {
            fromEntityId_toEntityId_relType: {
              fromEntityId: e.from,
              toEntityId: e.to,
              relType: e.relType,
            },
          },
          update: { weight: e.weight, note: e.note },
          create: {
            fromEntityId: e.from,
            toEntityId: e.to,
            relType: e.relType,
            weight: e.weight,
            note: e.note,
          },
        });
      }

      /* ── Bước 6 (SEO) + 7 (taxonomy) + 8 (ảnh) + 10 (ghi CSDL) ──────── */
      const data = {
        title: "Mặt Trăng: nguồn gốc, nửa xa và vai trò với Trái Đất",
        titleEn: "The Moon: its origin, its far side, and what it does for Earth",
        summary:
          "Mặt Trăng quay đồng bộ với quỹ đạo nên chỉ hướng một mặt về Trái Đất; nhiều khả năng nó sinh ra từ một vụ va chạm cổ xưa, và nó vẫn đang lùi xa từng năm.",
        summaryEn:
          "The Moon's spin matches its orbit, so it shows Earth only one face; it most likely formed in an ancient collision, and it is still receding year by year.",
        content: vi,
        contentEn: en,
        /* Ảnh ghép nửa GẦN của LRO — đúng cái mặt mà bài giải thích vì sao ta
           chỉ thấy có nó. NASA/GSFC/ASU, phạm vi công cộng.

           `coverImageCredit` cố tình để trống: `npm run images:credit --
           --write` điền thẳng từ Commons, và ghi công chép tay sẽ lạc hậu
           ngay lần đổi ảnh sau — ghi công sai người còn tệ hơn không ghi. */
        coverImage:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moon_nearside_LRO.jpg/1280px-Moon_nearside_LRO.jpg",
        seoTitle: "Mặt Trăng: nguồn gốc, nửa xa và vai trò với Trái Đất",
        seoDescription:
          "Vì sao ta chỉ thấy một mặt của Mặt Trăng, nhiều khả năng nó sinh ra từ đâu, và nó làm gì cho Trái Đất — tổng hợp từ NASA và hai công trình trên Nature.",
        seoKeywords:
          "Mặt Trăng, Thiên văn học, NASA, Hệ Mặt Trời, khoá thuỷ triều, Theia, Trái Đất",
        readingTime,
        categoryId: category.id,
        authorId: ADMIN_ID,
        entityId: entity.id,
        /* Bước 4 đã APPROVE ở vòng 2. Byline là tài khoản tổ chức, không bịa
           tên người — quy tắc đã chốt trong content-rules. */
        factCheck: "PASSED" as const,
        reviewedById: ADMIN_ID,
        reviewedAt: now,
        lastVerifiedAt: now,
        /* 12 tháng. Bài không có nguồn cấp dữ liệu lăn theo tháng; rủi ro
           thật có nhịp năm — sáu trang NASA là trang sống bị viết lại không
           báo trước, và băng ở cực là vùng đang có số liệu mới thời Artemis,
           tức chính câu về băng là câu dễ cũ nhất trong bài. */
        reverifyDueAt: new Date("2027-09-13T00:00:00Z"),
      };

      const article = await tx.article.upsert({
        where: { slug: SLUG },
        update: data,
        create: { slug: SLUG, ...data },
      });

      /* Nguồn: xoá rồi ghi lại, vì bảng nguồn là một TẬP chứ không phải một
         dãy hàng có danh tính riêng. Nằm trong cùng transaction nên không có
         khoảnh khắc nào bài đứng không nguồn. */
      await tx.source.deleteMany({ where: { articleId: article.id } });
      await tx.source.createMany({
        data: SOURCES.map((s) => ({
          ...s,
          articleId: article.id,
          accessedAt: accessed,
        })),
      });

      /* Bản Revision đầu — ảnh chụp nội dung đúng lúc qua gate accuracy. */
      const already = await tx.revision.count({
        where: { articleId: article.id },
      });
      if (already === 0) {
        await tx.revision.create({
          data: {
            articleId: article.id,
            title: data.title,
            content: vi,
            editorId: ADMIN_ID,
            note: "Bản đầu, sau khi qua gate accuracy vòng 2 (APPROVE, đã áp R1–R5)",
          },
        });
      }

      console.log(`entity   ${entity.slug} (${entity.id}), ${edges.length} quan hệ`);
      console.log(
        `article  ${article.slug} — ${article.status}, ${readingTime} phút, danh mục ${category.name}`,
      );
      console.log(
        `nguồn    ${SOURCES.length} (bậc 1: ${SOURCES.filter((s) => s.tier === 1).length})`,
      );
    },
    { timeout: 20_000 },
  );
}

main()
  .catch((e) => {
    console.error(
      e instanceof Prisma.PrismaClientKnownRequestError
        ? `${e.code}: ${e.message}`
        : e,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
