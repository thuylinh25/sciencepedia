import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";
import { pick } from "@/lib/i18n-content";
import { assetSrcSet } from "@/lib/image-variants";
import {
  extractGlossaryKeys,
  type GlossaryDetail,
  type GlossaryMap,
} from "@/lib/glossary";

/**
 * Mục từ cho mọi `[[...]]` trong một bài — gọi LÚC RENDER TRÊN SERVER.
 *
 * Tooltip lấy định nghĩa từ props chứ không fetch khi rê chuột: định nghĩa ngắn
 * là nội dung, và nội dung phải có sẵn trong RSC payload của trang ISR (xem
 * "Không fetch nội dung phía client" ở CLAUDE.md). Rê chuột là tức thì, không
 * có spinner, không có request nào chạm DB theo lượt đọc.
 *
 * Lỗi thì trả về map rỗng: thuật ngữ khi đó hiện như chữ thường. Từ điển là
 * lớp phụ — một bảng chưa migrate hay một lần DB chập chờn không được phép làm
 * sập trang bài viết.
 */
export async function getGlossaryForMarkdown(
  markdown: string,
  locale: Locale,
): Promise<GlossaryMap> {
  const keys = extractGlossaryKeys(markdown);
  if (keys.length === 0) return {};

  try {
    const rows = await prisma.glossaryTerm.findMany({
      where: { OR: [{ slug: { in: keys } }, { aliases: { hasSome: keys } }] },
      select: {
        slug: true,
        term: true,
        termEn: true,
        shortDef: true,
        shortDefEn: true,
        aliases: true,
      },
    });

    const wanted = new Set(keys);
    const map: GlossaryMap = {};

    for (const row of rows) {
      const preview = {
        slug: row.slug,
        term: pick(locale, row.term, row.termEn),
        definition: pick(locale, row.shortDef, row.shortDefEn),
      };
      // Slug chính thắng alias khi cùng một khoá trỏ về hai mục khác nhau
      for (const alias of row.aliases) {
        if (wanted.has(alias) && !map[alias]) map[alias] = preview;
      }
      if (wanted.has(row.slug)) map[row.slug] = preview;
    }

    return map;
  } catch (error) {
    console.error("[glossary] không tra được mục từ:", (error as Error).message);
    return {};
  }
}

export const getGlossarySlugs = cache(async () =>
  prisma.glossaryTerm.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  }),
);

const RELATED_LIMIT = 5;

/**
 * Chi tiết một mục từ, dùng chung cho modal (qua API) và trang
 * `/glossary/[slug]`, để hai nơi không bao giờ hiện hai phiên bản khác nhau.
 *
 * Bài liên quan, theo thứ tự tin cậy:
 *   1. bài trình bày đúng entity mà mục từ nối vào (knowledge graph)
 *   2. bài có dùng `[[thuật ngữ]]` trong thân bài
 *
 * Vế 2 là `ILIKE` trên `content` — quét tuần tự. Chấp nhận vì kết quả nằm sau
 * cache (ISR của trang, `s-maxage` của API), không chạy theo lượt đọc. Khi kho
 * lên hàng chục nghìn bài thì thay bằng bảng nối ghi lúc publish.
 */
export const getGlossaryDetail = cache(
  async (slug: string, locale: Locale): Promise<GlossaryDetail | null> => {
    const row = await prisma.glossaryTerm.findUnique({ where: { slug } });
    if (!row) return null;

    const needles = [row.term, row.termEn].filter(
      (name): name is string => Boolean(name && name.trim()),
    );

    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          ...(row.entityId ? [{ entityId: row.entityId }] : []),
          ...needles.flatMap((name) => [
            { content: { contains: `[[${name}`, mode: "insensitive" as const } },
            { contentEn: { contains: `[[${name}`, mode: "insensitive" as const } },
          ]),
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: RELATED_LIMIT * 2,
      select: { slug: true, title: true, titleEn: true, entityId: true },
    });

    // Bài của entity lên đầu; `sort` ổn định nên phần còn lại giữ thứ tự ngày
    const related = articles
      .sort(
        (a, b) =>
          Number(b.entityId === row.entityId && row.entityId !== null) -
          Number(a.entityId === row.entityId && row.entityId !== null),
      )
      .slice(0, RELATED_LIMIT)
      .map((article) => ({
        slug: article.slug,
        title: pick(locale, article.title, article.titleEn),
      }));

    const full = pick(locale, row.fullDef ?? "", row.fullDefEn);

    return {
      slug: row.slug,
      term: pick(locale, row.term, row.termEn),
      shortDef: pick(locale, row.shortDef, row.shortDefEn),
      paragraphs: full
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      category: row.category,
      // `srcSet` dựng trên server: bản kê biến thể ảnh nặng ~20 KB, không đáng
      // gửi xuống client chỉ để modal tự tính.
      image: row.image
        ? { ...(assetSrcSet(row.image) ?? { src: row.image }), credit: row.imageCredit }
        : null,
      related,
      updatedAt: row.updatedAt.toISOString(),
    };
  },
);
