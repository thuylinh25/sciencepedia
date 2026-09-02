import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Clock, Eye, Tag as TagIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelatedForArticle,
} from "@/server/queries";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { absoluteUrl, extractHeadings, formatDate, formatNumber } from "@/lib/utils";
import { isFallback, pick, pickName } from "@/lib/i18n-content";

import { JsonLd } from "@/components/json-ld";
import { ArticleContent } from "@/components/article/article-content";
import { ReviewStatus } from "@/components/article/review-status";
import { ViewCounter } from "@/components/article/view-counter";
import {
  MobileTableOfContents,
  TableOfContents,
} from "@/components/article/table-of-contents";
import { Breadcrumb } from "@/components/breadcrumb";
import { SOLAR_BODY_SLUGS } from "@/lib/solar-data";

// Tách thành chunk riêng: chỉ bài về thiên thể mới tải
const PlanetGlobe = dynamic(() =>
  import("@/components/solar/planet-globe").then((mod) => mod.PlanetGlobe),
);
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
  const tCommon = await getTranslations("common");

  const title = pick(loc, article.title, article.titleEn);
  const summary = pick(loc, article.summary, article.summaryEn);
  const content = pick(loc, article.content, article.contentEn);
  const showFallbackNotice = isFallback(loc, article.contentEn);
  const categoryName = pickName(loc, article.category);

  const headings = extractHeadings(content);
  const url = absoluteUrl(`/${locale}/articles/${article.slug}`);
  // Ưu tiên quan hệ trong knowledge graph, thiếu thì bù bằng tag/category
  const related = await getRelatedForArticle(
    article,
    article.tags.map((t) => t.tagId),
  );

  // Thống kê nguồn cho khối tín hiệu tin cậy
  const strongSourceCount = article.sources.filter((s) => s.tier <= 2).length;
  const hasRetractedSource = article.sources.some((s) => s.retractedAt !== null);

  return (
    <>
      <ReadingProgress />
      <ViewCounter articleId={article.id} />

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
          reviewer: article.reviewedBy?.name,
          reviewedAt: article.reviewedAt,
          // Chỉ khai báo nguồn thật sự hiển thị ở mục tham khảo cuối bài
          citations: article.sources.map((source) => ({
            title: source.title,
            url: source.url,
            doi: source.doi,
          })),
          entity: article.entity
            ? {
                name: pickName(loc, {
                  name: article.entity.canonicalName,
                  nameEn: article.entity.canonicalNameEn,
                }),
                wikidataQid: article.entity.wikidataQid,
              }
            : null,
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
          {/* Người đọc từ Google rơi thẳng vào đây, không có lịch sử điều hướng
              nào phía sau — đường dẫn phải nói rõ trang này nằm ở đâu trong cây
              tri thức, và phải khớp với BreadcrumbList đã khai bên trên.
              Màu lĩnh vực chuyển thành chấm màu: `color` lấy thẳng từ CSDL nên
              không ai bảo đảm được nó đủ tương phản với nền để làm màu chữ. */}
          <Breadcrumb
            items={[
              { label: tCommon("home"), href: "/" },
              {
                label: categoryName,
                href: `/categories/${article.category.slug}`,
                dotColor: article.category.color,
              },
              { label: title },
            ]}
          />

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
          {SOLAR_BODY_SLUGS.has(article.slug) && (
            <PlanetGlobe slug={article.slug} />
          )}

          {/* Cột mục lục bên phải là `hidden lg:block`; đây là bản cho điện
              thoại, bố cục chính của dự án. */}
          <MobileTableOfContents headings={headings} />

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

          {/* Trạng thái thẩm định — đặt ngay trước mục nguồn để người đọc gặp
              chứng cứ tin cậy cùng lúc với danh sách nguồn */}
          <ReviewStatus
            className="mt-14"
            locale={loc}
            reviewerName={article.reviewedBy?.name}
            reviewedAt={article.reviewedAt}
            lastVerifiedAt={article.lastVerifiedAt}
            sourceCount={article.sources.length}
            strongSourceCount={strongSourceCount}
            hasRetractedSource={hasRetractedSource}
          />

          {/* Nguồn tham khảo */}
          {article.sources.length > 0 && (
            <section className="mt-14">
              {/* Cùng cỡ với h2 trong thân bài: mục nguồn là một mục ngang hàng
                  của bài, không phải chú thích cuối trang. */}
              <h2 className="flex items-center gap-2 border-b pb-3 font-display text-2xl font-bold tracking-tight">
                <BookOpen className="size-5 shrink-0 text-accent" aria-hidden />
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
        <section className="container-page section-gap">
          <SectionHeading title={t("related")} />
          <ArticleGrid articles={related} locale={loc} />
        </section>
      )}
    </>
  );
}
