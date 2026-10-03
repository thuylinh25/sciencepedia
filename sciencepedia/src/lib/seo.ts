import type { Metadata } from "next";
import { absoluteUrl, truncate } from "./utils";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Sciencepedia";

/**
 * Hộp thư liên hệ chính thức. Viết MỘT chỗ vì nó xuất hiện ở footer, ở trang
 * Chính sách bảo mật và ở Điều khoản sử dụng — mà hai trang sau là thứ được
 * nộp cho bên xét duyệt ứng dụng, nên một địa chỉ lệch giữa ba chỗ không chỉ
 * khó đọc: nó làm hồ sơ trông như không có ai duy trì.
 */
export const CONTACT_EMAIL = "sciencepedia.contact@gmail.com";

/**
 * Tài khoản đứng tên tác giả và người duyệt của mọi bài hiện có. Đây là một
 * BAN, không phải một người — `docs/content-rules.md`, mục "Byline người
 * duyệt". Khai nó là `Person` trong JSON-LD là nói với Google rằng có một cá
 * nhân tên "Ban biên tập Sciencepedia" bảo chứng bài, đúng loại quy công sai
 * mà luật byline sinh ra để tránh.
 *
 * Nhận diện bằng tên chứ không bằng cột trong `User`: hiện chỉ có đúng một
 * tài khoản tổ chức, và thêm cột là một migration cho một phân biệt chưa ai
 * cần ở chỗ khác. Khi có biên tập viên thật ký bài, tên họ khác chuỗi này nên
 * tự rơi về `Person` — đúng điều kiện đổi mà luật byline đã chốt.
 */
export const EDITORIAL_BOARD_NAME = `Ban biên tập ${SITE_NAME}`;

/** Một node Organization dùng chung, mọi trang tham chiếu cùng `@id` này. */
export const ORGANIZATION_ID = absoluteUrl("/#organization");

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    // Tệp có thật trong public/ — từng trỏ /icon.png, một URL 404
    logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    // Hộp thư này hiện ở footer mọi trang — khai được vì nó hiển thị
    email: CONTACT_EMAIL,
  };
}

/** Tác giả/người duyệt: tổ chức nếu là tài khoản ban biên tập, còn lại là người. */
function partyNode(name: string) {
  if (name === EDITORIAL_BOARD_NAME || name === SITE_NAME) {
    return {
      "@type": "Organization",
      name,
      parentOrganization: { "@id": ORGANIZATION_ID },
    };
  }
  return { "@type": "Person", name };
}

type SeoInput = {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string | null;
  /// Mô tả ảnh (alt) — thiếu thì og:image:alt lấy tiêu đề như trước
  imageAlt?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  authors?: string[];
  keywords?: string[];
  noindex?: boolean;
  /// Những ngôn ngữ trang này THẬT SỰ có nội dung. Mặc định: mọi locale.
  /// Bài chưa dịch truyền `["vi"]` — xem chú thích trong `buildMetadata`.
  availableLocales?: readonly Locale[];
  /// Trang danh sách có phân trang: trang 2 trở đi là trang KHÁC, có danh
  /// sách bài khác — canonical trỏ chính nó, không trỏ về trang 1.
  page?: number;
};

/** Giới hạn Google hiển thị cho tiêu đề và mô tả trên trang kết quả. */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 159; // `truncate` có thể thêm một dấu "…"
/** Phải khớp `title.template` trong `[locale]/layout.tsx`. */
const TITLE_SUFFIX = ` · ${SITE_NAME}`;

export function buildMetadata({
  title,
  description,
  path,
  locale,
  image,
  imageAlt,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noindex,
  availableLocales = routing.locales,
  page,
}: SeoInput): Metadata {
  /* Trước đây `?page=2` khai canonical về trang 1. Google hiểu thế là "trang
     2 là bản sao của trang 1" và bỏ nó khỏi chỉ mục — kéo theo những bài chỉ
     được liệt kê từ trang 2 trở đi mất một đường dẫn nội bộ. Tiêu đề cũng
     phải khác, không thì hai trang mang cùng <title>. */
  if (page !== undefined && page > 1) {
    title = `${title} · ${locale === "vi" ? "Trang" : "Page"} ${page}`;
    path = `${path}?page=${page}`;
  }
  const suffix = path === "/" ? "" : path;
  const localeUrl = (code: Locale) => absoluteUrl(`/${code}${suffix}`);

  /* Bản `/en` của một bài chưa dịch vẫn render — người đọc thấy nội dung
     tiếng Việt kèm thông báo "chưa có bản dịch". Với máy tìm kiếm thì nó là
     bản sao của trang `/vi` mang nhãn tiếng Anh. Nên canonical trỏ về bản có
     thật, và hreflang chỉ khai những bản có thật — ở CẢ HAI trang, để khai
     báo vẫn hai chiều. Sitemap lọc theo cùng điều kiện. */
  const canonicalLocale = availableLocales.includes(locale)
    ? locale
    : (availableLocales[0] ?? routing.defaultLocale);
  const url = localeUrl(canonicalLocale);
  const pageDescription = truncate(description, DESCRIPTION_MAX);

  /* Tiêu đề dài thì bỏ hậu tố tên site thay vì để Google cắt cụt chính tiêu
     đề: phần bị cắt là phần mang nghĩa, còn tên site đã có trong
     `og:site_name` và breadcrumb. */
  const pageTitle =
    title.length + TITLE_SUFFIX.length > TITLE_MAX ? { absolute: title } : title;

  // Không có ảnh bìa riêng thì sinh ảnh OG động từ tiêu đề
  const ogImage =
    image ?? absoluteUrl(`/api/og?title=${encodeURIComponent(title)}`);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    authors: authors?.map((name) => ({ name })),
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          availableLocales.map((code) => [code, localeUrl(code)]),
        ),
        "x-default": localeUrl(
          availableLocales.includes(routing.defaultLocale)
            ? routing.defaultLocale
            : canonicalLocale,
        ),
      },
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
          },
        },
    openGraph: {
      title,
      description: pageDescription,
      url,
      siteName: SITE_NAME,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: imageAlt || title },
      ],
      ...(type === "article"
        ? {
            publishedTime: publishedTime
              ? new Date(publishedTime).toISOString()
              : undefined,
            modifiedTime: modifiedTime
              ? new Date(modifiedTime).toISOString()
              : undefined,
            authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pageDescription,
      images: [ogImage],
    },
  };
}

/** Bỏ cú pháp liên kết Markdown, giữ chữ: `[NASA](https://…)` → `NASA`. */
function plainCredit(markdown: string) {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ảnh bìa dạng `ImageObject`, để Google Images đọc được mô tả, ghi công và
 * nơi nêu giấy phép.
 *
 * `license` chỉ phát khi ghi công trỏ tới trang tệp trên Wikimedia Commons —
 * trang đó nêu đúng giấy phép của đúng tấm ảnh. Ảnh Unsplash, iStock… không
 * phát: ghi công của chúng không nói giấy phép nào, và đoán ("Unsplash thì là
 * Unsplash License") sai với ảnh Unsplash+ trả phí. Khai sai giấy phép tệ hơn
 * không khai.
 */
function imageObject(
  url: string,
  alt?: string | null,
  credit?: string | null,
) {
  const commonsPage = credit?.match(
    /https?:\/\/commons\.wikimedia\.org\/wiki\/File:[^)\s]+/,
  )?.[0];
  return {
    "@type": "ImageObject",
    url,
    contentUrl: url,
    caption: alt || undefined,
    creditText: credit ? plainCredit(credit) || undefined : undefined,
    license: commonsPage,
    acquireLicensePage: commonsPage,
  };
}

/**
 * JSON-LD cho một mục bách khoa — một `@graph` gồm trang (`WebPage`), bài
 * (`ScholarlyArticle`) và tổ chức đứng sau site.
 *
 * Dùng `ScholarlyArticle` chứ không phải `Article`: đây là nội dung tham khảo
 * có trích dẫn, không phải tin bài. Kèm các tín hiệu tin cậy mà Google dùng
 * để đánh giá nội dung khoa học (YMYL):
 *   - `reviewedBy` + `lastReviewed` — ai đã thẩm định, lần cuối khi nào
 *   - `citation`   — bài dựa trên nguồn nào
 *   - `about.sameAs` — khái niệm này ứng với thực thể nào trên Wikidata
 *
 * `reviewedBy`/`lastReviewed` nằm trên `WebPage`, KHÔNG trên bài: schema.org
 * chỉ định nghĩa chúng cho `WebPage`. Bản cũ gắn `reviewedBy` vào
 * `ScholarlyArticle` và phát `dateReviewed` — thuộc tính không có trong
 * chuẩn — nên trình kiểm tra bỏ qua đúng tín hiệu ta muốn nó đọc.
 *
 * Chỉ khai báo những gì thật sự hiện trên trang: đánh dấu dữ liệu không hiển
 * thị là vi phạm nguyên tắc structured data.
 */
export function articleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  /// Mô tả ảnh bìa đang dùng làm alt trên trang
  imageAlt?: string | null;
  /// Ghi công ảnh bìa (Markdown), đang hiện ở cuối bài
  imageCredit?: string | null;
  author: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  section?: string;
  keywords?: string[];
  locale: Locale;
  /// Byline thẩm định chỉ hiện khi có CẢ tên và ngày — JSON-LD theo đúng điều kiện đó
  reviewer?: string | null;
  reviewedAt?: Date | string | null;
  /// Ngày đối chiếu nguồn gần nhất, cũng hiện trên trang
  lastVerifiedAt?: Date | string | null;
  /// Nguồn đã hiển thị trong mục tham khảo cuối bài
  citations?: { title: string; url?: string | null; doi?: string | null }[];
  /// Tên khái niệm + Wikidata QID, nếu bài đã gắn entity
  entity?: { name: string; wikidataQid?: string | null } | null;
}) {
  const iso = (value?: Date | string | null) =>
    value ? new Date(value).toISOString() : undefined;

  const reviewed = Boolean(input.reviewer && input.reviewedAt);
  // Lần duyệt gần nhất: mốc mới hơn giữa thẩm định và đối chiếu nguồn
  const reviewTimes = [reviewed ? input.reviewedAt : null, input.lastVerifiedAt]
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value).getTime());
  const lastReviewed = reviewTimes.length
    ? new Date(Math.max(...reviewTimes)).toISOString()
    : undefined;

  const articleId = `${input.url}#article`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": input.url,
        url: input.url,
        name: input.title,
        inLanguage: input.locale,
        isPartOf: { "@id": websiteId(input.locale) },
        mainEntity: { "@id": articleId },
        // Chỉ phát khi thật sự có người duyệt — bịa reviewer là bịa tín hiệu tin cậy
        reviewedBy:
          reviewed && input.reviewer ? partyNode(input.reviewer) : undefined,
        lastReviewed,
      },
      {
        "@type": "ScholarlyArticle",
        "@id": articleId,
        mainEntityOfPage: { "@id": input.url },
        headline: input.title,
        description: input.description,
        image: input.image
          ? imageObject(input.image, input.imageAlt, input.imageCredit)
          : undefined,
        author: partyNode(input.author),
        publisher: { "@id": ORGANIZATION_ID },
        datePublished: iso(input.publishedAt),
        dateModified: iso(input.updatedAt),
        citation: input.citations?.length
          ? input.citations.map((source) => ({
              "@type": "CreativeWork",
              name: source.title,
              url: source.doi
                ? `https://doi.org/${source.doi}`
                : (source.url ?? undefined),
            }))
          : undefined,
        about: input.entity
          ? {
              "@type": "Thing",
              name: input.entity.name,
              sameAs: input.entity.wikidataQid
                ? `https://www.wikidata.org/wiki/${input.entity.wikidataQid}`
                : undefined,
            }
          : undefined,
        articleSection: input.section,
        keywords: input.keywords?.join(", "),
        inLanguage: input.locale,
      },
      // Lặp lại node tổ chức trong cùng graph: tham chiếu `@id` sang một khối
      // JSON-LD khác trên trang không phải trình đọc nào cũng nối được.
      organizationNode(),
    ],
  };
}

/**
 * `DefinedTerm` cho trang thuật ngữ. `description` phải là đúng định nghĩa
 * ngắn đang HIỆN trên trang — cùng luật "chỉ khai báo thứ hiển thị" như
 * `articleJsonLd`.
 */
export function definedTermJsonLd(input: {
  name: string;
  description: string;
  url: string;
  locale: Locale;
  setName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.locale,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: input.setName,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** `@id` của node `WebSite` theo ngôn ngữ — `WebPage.isPartOf` trỏ vào đây. */
export function websiteId(locale: Locale) {
  return absoluteUrl(`/${locale}#website`);
}

/** Phát ở layout, tức trên MỌI trang: đây là chỗ Google đọc tổ chức của site. */
export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId(locale),
        name: SITE_NAME,
        url: absoluteUrl(`/${locale}`),
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: absoluteUrl(
              `/${locale}/search?q={search_term_string}`,
            ),
          },
          "query-input": "required name=search_term_string",
        },
      },
      organizationNode(),
    ],
  };
}
