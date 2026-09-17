import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BookOpen } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata, breadcrumbJsonLd, definedTermJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { getGlossaryDetail } from "@/server/glossary";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";

/**
 * Trang của một thuật ngữ — đích `href` của mọi `<GlossaryTerm>`.
 *
 * Tồn tại vì ba lẽ, không phải để trang trí: (1) crawler và người không bật JS
 * bấm vào thuật ngữ thì đến được định nghĩa thay vì 404; (2) định nghĩa có một
 * URL riêng, server-render, mang `DefinedTerm` — thứ tooltip trong bài không
 * bao giờ cho Google thấy được; (3) mỗi `[[...]]` trong bài thành một internal
 * link thật.
 */
export const revalidate = 300;

// Mảng rỗng vẫn phải khai: thiếu `generateStaticParams` thì route động bị
// render theo từng request thay vì ISR.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const detail = await getGlossaryDetail(slug, loc).catch(() => null);
  // noindex cho slug không tồn tại — xem chú thích ở articles/[slug]/page.tsx
  if (!detail) return { title: "404", robots: { index: false, follow: false } };

  const t = await getTranslations({ locale, namespace: "glossary" });
  return buildMetadata({
    title: `${detail.term} — ${t("title")}`,
    description: detail.shortDef,
    path: `/glossary/${detail.slug}`,
    locale: loc,
    image: detail.image?.src,
  });
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const detail = await getGlossaryDetail(slug, loc);
  if (!detail) notFound();

  const t = await getTranslations("glossary");
  const tCommon = await getTranslations("common");
  const url = absoluteUrl(`/${locale}/glossary/${detail.slug}`);

  return (
    <div className="container-prose page-pad">
      <JsonLd
        data={definedTermJsonLd({
          name: detail.term,
          description: detail.shortDef,
          url,
          locale: loc,
          setName: `Sciencepedia — ${t("title")}`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sciencepedia", url: absoluteUrl(`/${locale}`) },
          { name: detail.term, url },
        ])}
      />

      <Breadcrumb items={[{ label: tCommon("home"), href: "/" }, { label: detail.term }]} />

      <article className="mt-6">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t("title")}
          {detail.category && ` · ${detail.category}`}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-bold tracking-tight text-balance">
          <dfn className="not-italic">{detail.term}</dfn>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-pretty">{detail.shortDef}</p>

        {detail.image && (
          <figure className="mt-8 overflow-hidden rounded-2xl border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh R2 có srcSet dựng sẵn; xem AssetImage */}
            <img
              src={detail.image.src}
              srcSet={detail.image.srcSet}
              sizes="(min-width: 768px) 42rem, 100vw"
              alt=""
              width={1200}
              height={675}
              decoding="async"
              className="aspect-video w-full object-contain"
            />
            {detail.image.credit && (
              <figcaption className="px-4 py-2 text-xs text-muted-foreground">
                {t("imageCredit", { credit: detail.image.credit })}
              </figcaption>
            )}
          </figure>
        )}

        {detail.paragraphs.length > 0 && (
          <div className="mt-8 space-y-4 text-base leading-relaxed">
            {detail.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </article>

      {detail.related.length > 0 && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 border-b pb-3 font-display text-2xl font-bold tracking-tight">
            <BookOpen className="size-5 text-accent" aria-hidden />
            {t("related")}
          </h2>
          <ul className="mt-4 divide-y rounded-2xl border">
            {detail.related.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {article.title}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
