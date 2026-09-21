import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { extractGlossaryKeys } from "@/lib/glossary";
import { GlossaryManager } from "@/components/admin/glossary-manager";

/**
 * Quản lý mục từ điển thuật ngữ.
 *
 * Cột "Dùng trong" đếm bằng cách quét `[[...]]` của mọi bài đã xuất bản, một
 * lượt cho cả bảng. Đây là con số biên tập viên cần trước khi xoá hay đổi slug
 * — "mục này có ai dùng không" — và không có bảng nối nào trả lời được câu đó.
 * Với vài chục bài thì một lượt quét rẻ hơn một bảng nối phải giữ đồng bộ. Khi
 * kho lên hàng nghìn bài, đổi sang bảng nối ghi lúc publish.
 */
export default async function AdminGlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");

  const [terms, articles] = await Promise.all([
    prisma.glossaryTerm.findMany({ orderBy: { term: "asc" } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { content: true, contentEn: true },
    }),
  ]);

  const usage = new Map<string, number>();
  for (const article of articles) {
    for (const key of extractGlossaryKeys(`${article.content}\n${article.contentEn ?? ""}`)) {
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("glossary")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("glossaryForm.intro")}
        </p>
      </div>

      <GlossaryManager
        terms={terms.map((term) => ({
          id: term.id,
          slug: term.slug,
          term: term.term,
          termEn: term.termEn,
          shortDef: term.shortDef,
          shortDefEn: term.shortDefEn,
          fullDef: term.fullDef,
          fullDefEn: term.fullDefEn,
          aliases: term.aliases,
          category: term.category,
          image: term.image,
          imageCredit: term.imageCredit,
          reviewed: Boolean(term.reviewedById),
          // Bài dùng mục từ qua slug HOẶC qua bất kỳ alias nào của nó
          usage: [term.slug, ...term.aliases].reduce(
            (total, key) => total + (usage.get(key) ?? 0),
            0,
          ),
        }))}
      />
    </div>
  );
}
