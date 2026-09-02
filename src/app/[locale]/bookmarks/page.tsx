import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookmarkX } from "lucide-react";

import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { articleCardSelect } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { ArticleGrid } from "@/components/article/article-grid";
import { EmptyState } from "@/components/empty-state";

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
  const tArticle = await getTranslations("article");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { article: { select: articleCardSelect } },
  });

  return (
    <div className="container-page page-pad">
      <SectionHeading title={t("myBookmarks")} />
      <ArticleGrid
        articles={bookmarks.map((bookmark) => bookmark.article)}
        locale={locale as Locale}
        // Danh sách rỗng ở đây KHÔNG có nghĩa là kho chưa có bài — mặc định
        // "Chưa có bài viết nào ở đây" nói sai chuyện đang xảy ra.
        empty={
          <EmptyState
            icon={BookmarkX}
            title={t("bookmarksEmpty")}
            description={t("bookmarksEmptyHint")}
          >
            <Link
              href="/articles"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {tArticle("browseAll")}
            </Link>
          </EmptyState>
        }
      />
    </div>
  );
}
