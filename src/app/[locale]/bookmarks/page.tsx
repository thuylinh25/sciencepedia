import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import type { Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { articleCardSelect } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { ArticleGrid } from "@/components/article/article-grid";

export const dynamic = "force-dynamic";

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations("auth");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { article: { select: articleCardSelect } },
  });

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("myBookmarks")} />
      <ArticleGrid
        articles={bookmarks.map((bookmark) => bookmark.article)}
        locale={locale as Locale}
      />
    </div>
  );
}
