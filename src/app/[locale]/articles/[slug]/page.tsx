import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { after } from "next/server";
import { BookOpen, Clock, Eye, Tag as TagIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelatedArticles,
  incrementViews,
} from "@/server/queries";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { absoluteUrl, extractHeadings, formatDate, formatNumber } from "@/lib/utils";
import { isFallback, pick, pickName } from "@/lib/i18n-content";

import { JsonLd } from "@/components/json-ld";
import { ArticleContent } from "@/components/article/article-content";
import { TableOfContents } from "@/components/article/table-of-contents";
import { PlanetGlobe } from "@/components/solar/planet-globe";
import { ReadingProgress } from "@/components/article/reading-progress";
import { ShareBar } from "@/components/article/share-bar";
import { BookmarkButton } from "@/components/article/bookmark-button";
import { ArticleGrid } from "@/components/article/article-grid";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const revalidate = 300;

/**
 * Dựng sẵn 50 bài mới nhất; phần còn lại render theo yêu cầu.
 * Nếu không kết nối được DB lúc build (CI, preview, container chưa có DB),
 * trả về mảng rỗng để build vẫn qua — mọi trang khi đó render theo yêu cầu.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getPublishedSlugs();
    return slugs.slice(0, 50).map(({ slug }) => ({ slug }));
  } catch (error) {
    console.warn("[build] bỏ qua prerender bài viết:", (error as Error).message);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug);

  // Next 15.5 render đúng trang 404 nhưng vẫn trả HTTP 200 khi `notFound()`
  // được gọi trong route có tham số động (đã kiểm chứng: không phải do ISR,
  // not-found.tsx hay middleware). Chừng nào status còn sai, `noindex` là thứ
  // thực sự ngăn Google đưa slug không tồn tại vào chỉ mục.
  if (!article) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  const loc = locale as Locale;
  const title = pick(loc, article.title, article.titleEn);
  const summary = pick(loc, article.summary, article.summaryEn);

  return buildMetadata({
    title: article.seoTitle || title,
    description: article.seoDescription || summary,
    path: `/articles/${article.slug}`,
    locale: loc,
    image: article.ogImage ?? article.coverImage,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: article.author.name ? [article.author.name] : undefined,
    keywords: article.seoKeywords
      ? article.seoKeywords.split(",").map((k) => k.trim())
      : article.tags.map((t) => t.tag.name),
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const loc = locale as Locale;
  const t = await getTranslations("article");

  const title = pick(loc, article.title, article.titleEn);
  const summary = pick(loc, article.summary, article.summaryEn);
  const content = pick(loc, article.content, article.contentEn);
  const showFallbackNotice = isFallback(loc, article.contentEn);
  const categoryName = pickName(loc, article.category);

  const headings = extractHeadings(content);
  const url = absoluteUrl(`/${locale}/articles/${article.slug}`);

  const related = await getRelatedArticles(
    article.id,
    article.categoryId,
    article.tags.map((t) => t.tagId),
  );

  // Đếm lượt xem sau khi response đã gửi đi — không làm chậm trang
  after(() => incrementViews(article.id));

  return (
    <>
      <ReadingProgress />

      <JsonLd
        data={articleJsonLd({
          title,
          description: summary,
          url,
          image: article.coverImage,
          author: article.author.name ?? "Sciencepedia",
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          section: categoryName,
          keywords: article.tags.map((t) => t.tag.name),
          locale: loc,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sciencepedia", url: absoluteUrl(`/${locale}`) },
          {
            name: categoryName,
            url: absoluteUrl(`/${locale}/categories/${article.category.slug}`),
          },
          { name: title, url },
        ])}
      />

      {/* ------------------------------------------------------- Ảnh bìa */}
      <header className="relative">
        {article.coverImage ? (
          <div className="relative h-[52vh] min-h-[22rem] w-full overflow-hidden bg-space-900">
            <Image
              src={article.coverImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
        ) : (
          <div className="bg-cosmos starfield h-56 w-full" />
        )}

        <div className="container-prose relative -mt-40 pb-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            <Link href="/articles" className="hover:text-foreground">
              {t("backToArticles")}
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/categories/${article.category.slug}`}
              className="font-medium"
              style={{ color: article.category.color }}
            >
              {categoryName}
            </Link>
          </nav>

          <h1 className="mt-4 font-display text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
            {summary}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2.5">
              <Avatar className="size-8">
                {article.author.image && (
                  <AvatarImage src={article.author.image} alt="" />
                )}
                <AvatarFallback>
                  {article.author.name?.[0]?.toUpperCase() ?? "S"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">
                {article.author.name}
              </span>
            </span>

            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {t("publishedOn", {
                  date: formatDate(article.publishedAt, locale),
                })}
              </time>
            )}

            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {t("readingTime", { minutes: article.readingTime })}
            </span>

            <span className="flex items-center gap-1.5">
              <Eye className="size-4" />
              {formatNumber(article.views, locale)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <ShareBar title={title} url={url} />
            <BookmarkButton articleId={article.id} />
          </div>

          {showFallbackNotice && (
            <p className="mt-6 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
              {t("noTranslation")}
            </p>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------- Nội dung */}
      <div className="container-page mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <article className="mx-auto w-full max-w-3xl">
          {/* Quả cầu 3D — tự ẩn nếu bài không phải về một thiên thể trong
              Hệ Mặt Trời, nên gọi vô điều kiện ở đây là an toàn. */}
          <PlanetGlobe slug={article.slug} />

          <ArticleContent markdown={content} />

          {/* Thẻ */}
          {article.tags.length > 0 && (
            <div className="mt-14 flex flex-wrap items-center gap-2">
              <TagIcon className="size-4 text-muted-foreground" />
              {article.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    {pickName(loc, tag)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Nguồn tham khảo */}
          {article.sources.length > 0 && (
            <section className="mt-14">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <BookOpen className="size-5 text-accent" />
                {t("sources")}
              </h2>
              <ol className="mt-4 space-y-3 text-sm">
                {article.sources.map((source, index) => (
                  <li key={source.id} className="flex gap-3">
                    <span className="shrink-0 font-mono text-muted-foreground">
                      [{index + 1}]
                    </span>
                    <span>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary underline underline-offset-4"
                        >
                          {source.title}
                        </a>
                      ) : (
                        source.title
                      )}
                      {source.publisher && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {source.publisher}
                        </span>
                      )}
                      {source.year && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({source.year})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <Separator className="my-12" />

          <ShareBar title={title} url={url} />
        </article>

        {/* Mục lục dính */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------- Liên quan */}
      {related.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeading title={t("related")} />
          <ArticleGrid articles={related} locale={loc} />
        </section>
      )}
    </>
  );
}
