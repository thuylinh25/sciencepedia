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

/** JSON-LD cho một mục bách khoa. */
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    author: { "@type": "Person", name: input.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    },
    datePublished: input.publishedAt
      ? new Date(input.publishedAt).toISOString()
      : undefined,
    dateModified: input.updatedAt
      ? new Date(input.updatedAt).toISOString()
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
