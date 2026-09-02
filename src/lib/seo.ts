import type { Metadata } from "next";
import { absoluteUrl, truncate } from "./utils";
import type { Locale } from "@/i18n/routing";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Sciencepedia";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  authors?: string[];
  keywords?: string[];
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  locale,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noindex,
}: SeoInput): Metadata {
  const suffix = path === "/" ? "" : path;
  const url = absoluteUrl(`/${locale}${suffix}`);
  // Không có ảnh bìa riêng thì sinh ảnh OG động từ tiêu đề
  const ogImage =
    image ?? absoluteUrl(`/api/og?title=${encodeURIComponent(title)}`);

  return {
    title,
    description: truncate(description, 300),
    keywords,
    authors: authors?.map((name) => ({ name })),
    alternates: {
      canonical: url,
      languages: {
        vi: absoluteUrl(`/vi${suffix}`),
        en: absoluteUrl(`/en${suffix}`),
        "x-default": absoluteUrl(`/vi${suffix}`),
      },
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      title,
      description: truncate(description, 300),
      url,
      siteName: SITE_NAME,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
      description: truncate(description, 200),
      images: [ogImage],
    },
  };
}

/**
 * JSON-LD cho một mục bách khoa.
 *
 * Dùng `ScholarlyArticle` chứ không phải `Article`: đây là nội dung tham khảo
 * có trích dẫn, không phải tin bài. Kèm theo ba tín hiệu E-E-A-T mà Google
 * dùng để đánh giá nội dung khoa học (YMYL):
 *   - `reviewedBy` — ai đã thẩm định về mặt khoa học
 *   - `citation`   — bài dựa trên nguồn nào
 *   - `about.sameAs` — khái niệm này ứng với thực thể nào trên Wikidata
 *
 * Chỉ khai báo những gì thật sự hiện trên trang: đánh dấu dữ liệu không hiển
 * thị là vi phạm nguyên tắc structured data.
 */
export function articleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  author: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  section?: string;
  keywords?: string[];
  locale: Locale;
  reviewer?: string | null;
  reviewedAt?: Date | string | null;
  /// Nguồn đã hiển thị trong mục tham khảo cuối bài
  citations?: { title: string; url?: string | null; doi?: string | null }[];
  /// Tên khái niệm + Wikidata QID, nếu bài đã gắn entity
  entity?: { name: string; wikidataQid?: string | null } | null;
}) {
  const iso = (value?: Date | string | null) =>
    value ? new Date(value).toISOString() : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: input.title,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    author: { "@type": "Person", name: input.author },
    // Chỉ phát khi thật sự có người duyệt — bịa reviewer là bịa tín hiệu tin cậy
    reviewedBy: input.reviewer
      ? { "@type": "Person", name: input.reviewer }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    },
    datePublished: iso(input.publishedAt),
    dateModified: iso(input.updatedAt),
    // Ngày thẩm định khoa học, tách khỏi ngày sửa nội dung
    dateReviewed: iso(input.reviewedAt),
    citation: input.citations?.length
      ? input.citations.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          url: source.doi ? `https://doi.org/${source.doi}` : source.url ?? undefined,
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
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    articleSection: input.section,
    keywords: input.keywords?.join(", "),
    inLanguage: input.locale,
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

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(`/${locale}`),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl(`/${locale}/search?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };
}
