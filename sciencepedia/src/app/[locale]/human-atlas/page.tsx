import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { ASSET_BASE_URL } from "@/lib/asset";
import { pick } from "@/lib/i18n-content";
import { SYSTEM_COLORS, SYSTEM_IDS } from "@/lib/human-atlas/anatomy";
import {
  STRUCTURE_ARTICLES,
  STRUCTURE_ARTICLE_SLUGS,
  type StructureArticle,
} from "@/lib/human-atlas/structure-links";
import { getPublishedArticleTitles } from "@/server/queries";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { AboutCopy, HumanAtlas } from "@/components/human-atlas/human-atlas";

/**
 * Bản đồ cơ thể người — `/vi/human-atlas`, `/en/human-atlas`.
 *
 * Human Atlas (https://github.com/ashemag/human-atlas) chuyển thành module
 * của site, không iframe, không app riêng. Mô hình giải phẫu BodyParts3D
 * (CC BY 4.0) nằm trên R2 — xem `src/lib/human-atlas/assets.ts`.
 *
 * ## Vì sao route này tĩnh (ISR)
 *
 * Truy vấn duy nhất là tiêu đề các bài được gắn với cấu trúc giải phẫu, để
 * CTA "Đọc thêm" chỉ hiện khi bài còn PUBLISHED. `?structure=` KHÔNG đọc ở
 * đây: `searchParams` trong Server Component ép trang thành dynamic — client
 * đọc nó sau khi danh mục giải phẫu tải xong (cùng lối `/solar-system`).
 *
 * ## Vì sao SEO không mất gì dù cảnh 3D không SSR
 *
 * Canvas không chứa chữ. Tiêu đề, mô tả, danh sách hệ và phần ghi công đều
 * nằm trong HTML đầu tiên.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "humanAtlas" });

  return buildMetadata({
    title: t("title"),
    description: t("description"),
    path: "/human-atlas",
    locale: locale as Locale,
  });
}

export default async function HumanAtlasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("humanAtlas");

  const rows = await getPublishedArticleTitles(STRUCTURE_ARTICLE_SLUGS);
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const articles: Record<string, StructureArticle[]> = {};
  for (const [conceptId, slugs] of Object.entries(STRUCTURE_ARTICLES)) {
    const found = slugs
      .map((slug) => bySlug.get(slug))
      .filter((row): row is NonNullable<typeof row> => !!row)
      .map((row) => ({ slug: row.slug, title: pick(locale as Locale, row.title, row.titleEn) }));
    if (found.length > 0) articles[conceptId] = found;
  }

  const r2Origin = new URL(ASSET_BASE_URL).origin;

  return (
    <>
      {/* 33 MB tải từ R2 ngay khi trang chạy — bắt tay TLS sớm, chỉ ở route này. */}
      <link rel="preconnect" href={r2Origin} crossOrigin="anonymous" />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("title"),
          description: t("description"),
          url: absoluteUrl(`/${locale}/human-atlas`),
          inLanguage: locale,
          isBasedOn: {
            "@type": "Dataset",
            name: "BodyParts3D 4.0",
            creator: {
              "@type": "Organization",
              name: "The Database Center for Life Science",
            },
            license: "https://creativecommons.org/licenses/by/4.0/",
            url: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html",
          },
        }}
      />

      {/* Khung chiếm trọn phần màn hình dưới header dính (h-16 / lg:h-20). */}
      {/* `scroll-mt` = chiều cao header dính: CTA "Khám phá bản đồ" ở phần giới
          thiệu cuộn về đúng khung này, không để header che mép trên. */}
      <section
        id="atlas-viewer"
        aria-label={t("title")}
        className="relative h-[calc(100dvh-4rem)] min-h-[18rem] scroll-mt-16 lg:h-[calc(100dvh-5rem)] lg:scroll-mt-20"
      >
        <HumanAtlas articles={articles} />
      </section>

      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t("page.heading")}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{t("page.intro")}</p>
            {/* Viewer ở ngay trên cùng route, nên CTA là neo trong trang chứ không
                phải một route mới. Ai đọc tới đây là đã cuộn qua khung 3D. */}
            <Button asChild className="mt-5 h-11 max-sm:w-full">
              <a href="#atlas-viewer">
                {t("page.cta")}
                <ArrowRight aria-hidden />
              </a>
            </Button>

            <h3 className="mt-8 text-sm font-semibold">{t("page.systemsHeading")}</h3>
            <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {SYSTEM_IDS.map((id) => (
                <li key={id} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ background: SYSTEM_COLORS[id] }}
                  />
                  <span>
                    <strong className="font-semibold">{t(`systemNames.${id}`)}</strong>
                    <span className="text-muted-foreground"> — {t(`systemDescriptions.${id}`)}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-muted-foreground">
              {t("page.linkHint")}{" "}
              <a
                href={`/${locale}/human-atlas?structure=heart`}
                className="font-mono text-xs text-accent underline-offset-4 hover:underline"
              >
                /{locale}/human-atlas?structure=heart
              </a>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("page.disclaimer")}</p>
          </div>

          <aside
            aria-labelledby="atlas-attribution"
            className="h-fit rounded-2xl border bg-card p-6"
          >
            <h2 id="atlas-attribution" className="font-display text-xl font-bold tracking-tight">
              {t("page.attributionHeading")}
            </h2>
            <div className="mt-4">
              <AboutCopy />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
