import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  BookOpen,
  Clock,
  Eye,
  ShieldCheck,
  Tag as TagIcon,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getArticleBySlug,
  getArticleSlugRedirect,
  getPublishedSlugs,
  getRelatedForArticle,
} from "@/server/queries";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import {
  absoluteUrl,
  extractHeadings,
  formatDate,
  formatNumber,
} from "@/lib/utils";
import { isFallback, pick, pickName } from "@/lib/i18n-content";

import { JsonLd } from "@/components/json-ld";
import { ArticleContent } from "@/components/article/article-content";
import { ImageCredit } from "@/components/article/image-credit";
import { ViewCounter } from "@/components/article/view-counter";
import {
  MobileTableOfContents,
  TableOfContents,
} from "@/components/article/table-of-contents";
import { Breadcrumb } from "@/components/breadcrumb";
import { SOLAR_BODY_SLUGS } from "@/lib/solar-data";
import SketchfabViewer from "@/components/sketchfab-viewer";

// Tách thành chunk riêng: chỉ bài về thiên thể mới tải
const PlanetGlobe = dynamic(() =>
  import("@/components/solar/planet-globe").then((mod) => mod.PlanetGlobe),
);
/**
 * Khối bản đồ bầu trời cũng vào chunk riêng, và cũng chỉ tải khi bài có gắn
 * `skyObject`. Bản thân khối này còn hoãn tiếp một lớp nữa: Aladin chỉ được
 * kéo về khi người đọc bấm — xem `AladinArticleEmbed`.
 */
const AladinArticleEmbed = dynamic(() =>
  import("@/components/sky/aladin-article-embed").then(
    (mod) => mod.AladinArticleEmbed,
  ),
);
import { ReadingProgress } from "@/components/article/reading-progress";
import { ShareBar } from "@/components/article/share-bar";
import { BookmarkButton } from "@/components/article/bookmark-button";
import { ArticleGrid } from "@/components/article/article-grid";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssetImage } from "@/components/ui/asset-image";

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
    console.warn(
      "[build] bỏ qua prerender bài viết:",
      (error as Error).message,
    );
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
    const moved = await getArticleSlugRedirect(slug);
    if (moved?.article.status === "PUBLISHED") {
      permanentRedirect(`/${locale}/articles/${moved.article.slug}`);
    }
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
  if (!article) {
    const moved = await getArticleSlugRedirect(slug);
    if (moved?.article.status === "PUBLISHED") {
      permanentRedirect(`/${locale}/articles/${moved.article.slug}`);
    }
    notFound();
  }

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
      {/* Ảnh bìa LẤP ĐẦY khung: `object-cover`.

          Đây là lượt đảo lại quyết định ngày 06/09, nên phải ghi cả hai vế,
          không thì lần sau có người đọc mỗi một vế rồi đảo tiếp.

          Vế cũ: khung hero dẹt (~3,6:1 trên cửa sổ thấp) còn ảnh bìa là 16:10,
          nên `cover` cắt mất quá nửa chiều cao. Với 12 ảnh bìa TỰ VẼ lúc đó —
          thang khoảng cách, sơ đồ nguyên tử — mỗi nét đều mang nghĩa, và cắt
          là mất đúng cái hình định nói. `contain` giữ trọn nội dung.

          Vế mới: kho ảnh đã đổi. Phần lớn bài dùng ảnh CHỤP, mà ảnh chụp là
          kết cấu kín khung — cắt chỗ nào cũng còn là ảnh. Đổi lại, `contain`
          để ảnh nổi lơ lửng giữa một khung rộng với hai vệt mờ hai bên, và
          trên một trang bài thì đó là thứ đầu tiên người đọc nhìn thấy.

          Cái giá còn nguyên và có thật: ảnh bìa tự vẽ ở các bài cũ sẽ bị cắt
          trên dưới. Nếu một bài nào đó mất nghĩa vì phép cắt, chỗ sửa là cắt
          sẵn ảnh bìa của CHÍNH bài đó về dải ngang — đừng đổi lại `object-fit`
          cho mọi bài.

          Lớp ảnh phóng to làm mờ phía sau đã bỏ: nó sinh ra để lấp phần hụt
          hai bên của `contain`, mà nay không còn phần hụt nào. Giữ lại là tải
          và giải mã một tấm ảnh không ai nhìn thấy. */}
      <header className="relative">
        {article.coverImage ? (
          /* Chiều cao 72vh, KHÔNG phải 58vh — và con số này suy ra từ phép
             cắt, không phải từ thẩm mỹ.

             Ở 58vh, trên cửa sổ 1355×845 khung hero là 1355×490, tức 2,76:1.
             Kho ảnh bìa phần lớn là ảnh CHỤP vuông hoặc đứng (ảnh NASA thường
             1:1, ảnh y khoa thường đứng), nên `object-cover` khớp theo bề ngang
             và chỉ để lộ 490/1355 = 27% chiều cao ảnh. Người đọc thấy một dải
             giữa bức ảnh phóng hết cỡ và gọi đúng tên nó: "zoom quá to".

             `object-scale-down`, KHÔNG phải `cover` — và đây là lượt thứ ba của
             cùng một chỗ, nên chép lại cả ba để lần sau không đi lại vòng này.

             Lượt 1 nâng độ phân giải nguồn (1280px → 1920px). Có thật và vẫn
             cần, nhưng không chữa được lời phàn nàn, vì thứ tạo cảm giác zoom là
             PHẦN BỊ CẮT chứ không phải hệ số phóng. Lượt 2 nâng khung từ 58vh
             lên 72vh để bớt cắt; bị báo ngược lại là "ảnh quá to". Hai lời phàn
             nàn kéo về hai phía vì với `cover` trong một khung tràn bề ngang,
             cách duy nhất để lộ thêm ảnh là cao thêm — ta đang chọn giữa "cắt
             nhiều" và "chiếm chỗ nhiều", không có ô nào là đúng.

             `scale-down` bỏ hẳn phép chọn đó: ảnh hiện TRỌN, đúng tỉ lệ, và giữ
             nguyên kích thước gốc khi nó vừa khung — chỉ thu lại khi lớn hơn
             khung, không bao giờ phóng to. Không cắt một pixel nào.

             Khác `contain` ở đúng một điểm, và điểm đó là lý do chọn nó: `contain`
             PHÓNG một ảnh nhỏ cho đầy khung, nên sáu ảnh bìa gốc dưới 1280px
             trong kho sẽ bị kéo to ra rồi vỡ. `scale-down` để chúng nguyên cỡ
             thật, nhỏ mà nét.

             Cái giá: ảnh hẹp hơn khung để lộ nền hai bên. Đó chính là bố cục
             "ảnh lơ lửng" đã gỡ ngày 13/09 — lần này giữ, vì nó là hệ quả trực
             tiếp của yêu cầu "hiển thị đúng size ảnh, không phóng to thu nhỏ".
             Nền hai bên là `bg-space-900` chứ không phải một vệt mờ, nên nó đọc
             ra như nền trang chứ không như phần thiếu của ảnh.

             Đã cân nhắc và BỎ `object-contain`: nó cho thấy trọn ảnh, nhưng để
             ảnh nổi lơ lửng giữa hai vệt nền — đúng bố cục đã gỡ ngày 13/09.
             Xem docs/design-system.md, mục "Ảnh phải sống được ở MỌI khung nó
             bị cắt".

             Cái giá đã nhận: tiêu đề bài tụt xuống chừng 120px, nên khối nội
             dung đầu tiên lùi khỏi màn hình đầu trên laptop. Đổi lại ảnh bìa
             không còn bị đọc nhầm là ảnh hỏng. */
          <div className="relative h-[64vh] max-h-[36rem] min-h-[24rem] w-full overflow-hidden bg-space-900">
            <AssetImage
              src={article.coverImage}
              alt=""
              priority
              sizes="100vw"
              className="object-scale-down"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
          </div>
        ) : (
          <div className="bg-cosmos starfield h-56 w-full" />
        )}

        <div className="container-prose relative -mt-28 pb-4">
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

            {/* Byline người thẩm định — BẮT BUỘC có mặt khi JSON-LD phát `reviewedBy`.

                `lib/seo.ts` phát `reviewedBy` + `dateReviewed` làm tín hiệu
                E-E-A-T cho nội dung YMYL, và chính file đó ghi luật: "chỉ khai
                báo những gì thật sự hiện trên trang". Commit 10836c1 gỡ khối
                trạng thái thẩm định khỏi trang mà không gỡ phần JSON-LD, nên
                từ đó site đánh dấu dữ liệu không hiển thị — đúng thứ nguyên
                tắc structured data cấm.

                Một dòng, không phải một khối. Khối cũ bị gỡ vì cồng kềnh,
                không phải vì thông tin sai; nên trả lại thông tin ở dạng nhẹ
                nhất đủ để lời khai là thật.

                Điều kiện hiển thị phải KHỚP ĐÚNG điều kiện phát JSON-LD
                (`reviewer` khác null). Lệch một bên là quay lại đúng lỗi này. */}
            {article.reviewedBy?.name && article.reviewedAt && (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary-strong" />
                <span>
                  {t("reviewedBy", {
                    name: article.reviewedBy.name,
                    date: formatDate(article.reviewedAt, locale),
                  })}
                </span>
              </span>
            )}
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

          {article.sketchfabModelId && (
            <SketchfabViewer
              modelId={article.sketchfabModelId}
              title={title}
            />
          )}

          <ArticleContent markdown={content} locale={loc} />

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

          {/* Bản đồ bầu trời — chỉ bài có thiên thể gắn kèm mới có khối này.
              Đặt TRƯỚC mục nguồn tham khảo: đây vẫn là nội dung bài, còn mục
              nguồn là phần khép lại. */}
          {article.skyObject && (
            <AladinArticleEmbed
              object={{
                objectName: pick(
                  loc,
                  article.skyObject.objectName,
                  article.skyObject.objectNameEn,
                ),
                catalogId: article.skyObject.catalogId,
                ra: article.skyObject.ra,
                dec: article.skyObject.dec,
                fovDeg: article.skyObject.fovDeg,
                survey: article.skyObject.survey,
              }}
            />
          )}

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
                          className="text-primary-strong underline underline-offset-4"
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

          {/* Ghi công ảnh bìa.

              Từng nằm đè lên chính tấm ảnh. Bỏ chỗ đó vì hai lẽ: nó tranh chỗ
              với tiêu đề trên màn hình hẹp — đã phải dời từ đáy ảnh lên đỉnh
              một lần rồi — và nó lặp lại thứ mà đoạn dẫn nguồn cuối bài đã nói.

              Cuối bài là đúng chỗ: ghi công là nghĩa vụ pháp lý, không phải nội
              dung, nên nó đứng cạnh mục nguồn tham khảo chứ không tranh chấp
              với phần người đọc tìm đến để đọc. CC BY đòi ghi công "hợp lý theo
              phương tiện", không đòi dán lên ảnh.

              Vẫn lấy từ CSDL chứ không viết vào thân bài: `images:credit` cập
              nhật trường này thẳng từ Commons, nên thay ảnh là ghi công đổi
              theo. Chép vào Markdown thì lần thay ảnh sau để lại ghi công của
              tấm cũ — ghi công sai người, tệ hơn không ghi. */}
          <ImageCredit
            credit={
              loc === "en"
                ? (article.coverImageCreditEn ?? article.coverImageCredit)
                : article.coverImageCredit
            }
            className="mt-10"
          />

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
