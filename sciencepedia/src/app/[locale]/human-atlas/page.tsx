import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { ASSET_BASE_URL } from "@/lib/asset";
import { pick } from "@/lib/i18n-content";
import { SYSTEM_COLORS } from "@/lib/human-atlas/anatomy";
import { FALLBACK_ICON, SYSTEM_COUNTS, SYSTEM_ICON, SYSTEM_ORDER } from "@/lib/human-atlas/systems";
import { Link } from "@/i18n/navigation";
import { ATLAS_PROVENANCE } from "@/lib/human-atlas/provenance";
import { SYSTEM_DESCRIPTIONS, sectionNumber } from "@/lib/human-atlas/system-descriptions";
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
        {/* Suspense: viewer đọc `?system=` bằng useSearchParams — route vẫn tĩnh,
            chỉ khung viewer dựng ở client (nó vốn là canvas, không có chữ để SEO). */}
        <Suspense fallback={<div className="size-full bg-[#eef0f1] dark:bg-[#05070a]" />}>
          <HumanAtlas articles={articles} />
        </Suspense>
      </section>

      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t("page.heading")}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{t("page.intro")}</p>
            {/* Viewer ở ngay trên cùng route, nên CTA là neo trong trang chứ không
                phải một route mới. Ai đọc tới đây là đã cuộn qua khung 3D. */}
            <Button asChild size="lg" className="mt-5 h-12 px-6 text-base max-sm:w-full">
              <a href="#atlas-viewer">
                {t("page.cta")}
                <ArrowRight aria-hidden />
              </a>
            </Button>

            <h3 className="mt-10 text-base font-semibold">{t("page.systemsHeading")}</h3>
            {/*
              Thẻ hệ: tên + số cấu trúc + một câu (đã duyệt riêng, `short`) + "Khám
              phá". Cả thẻ bấm được bằng mẫu "stretched link" — link thật ở tên
              hệ, `after:inset-0` phủ cả thẻ; khối "Mô tả đầy đủ" nằm trên lớp đó
              (z-10) nên vẫn mở được. Không lồng <details> trong <a>.
              Số, màu, thứ tự, icon đều từ `systems.ts` — chung với viewer.
            */}
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {SYSTEM_ORDER.map((id) => {
                const Icon = SYSTEM_ICON[id] ?? FALLBACK_ICON;
                const description = SYSTEM_DESCRIPTIONS[id];
                const pickText = (v: { vi: string; en: string }) => (locale === "vi" ? v.vi : v.en);
                return (
                  <li
                    key={id}
                    className="group relative flex flex-col rounded-xl border bg-card/60 p-4 transition-colors hover:border-foreground/25 hover:bg-card focus-within:ring-[3px] focus-within:ring-ring/50"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]"
                      >
                        <Icon className="size-4.5" style={{ color: SYSTEM_COLORS[id] }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold leading-snug">
                          <Link
                            href={`/human-atlas?system=${id}#atlas-viewer`}
                            className="outline-none after:absolute after:inset-0 after:rounded-xl"
                          >
                            {t(`systemNames.${id}`)}
                          </Link>
                        </h4>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t("page.systemCount", { count: SYSTEM_COUNTS[id] ?? 0 })}
                        </p>
                      </div>
                    </div>
                    {description?.short && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {pickText(description.short)}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      {description && (
                        <details className="relative z-10 text-sm">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            {t("page.systemDetails")}
                          </summary>
                          <p className="mt-2 leading-relaxed text-muted-foreground">
                            {pickText(description.summary)}
                          </p>
                        </details>
                      )}
                      {/* pointer-events-none BẮT BUỘC: `translate` lúc rê chuột
                          tạo lớp vẽ riêng, nằm TRÊN `::after` của link — không có
                          dòng này, bấm đúng chữ "Khám phá" là bấm vào span trơn. */}
                      <span
                        aria-hidden
                        className="pointer-events-none ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5"
                      >
                        {t("page.systemExplore")}
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* Nguồn ngay dưới danh sách (docs/content-rules.md, "Provenance"):
                mọi mục OpenStax được dẫn, mỗi mục một link. Phần "trong mô hình
                này" kiểm trên chính dữ liệu BodyParts3D. */}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t("page.systemsSource", { source: ATLAS_PROVENANCE.descriptions.title })}{" "}
              {[...new Map(
                Object.values(SYSTEM_DESCRIPTIONS)
                  .flatMap((d) => d?.sources ?? [])
                  .map((s) => [s.url, s] as const),
              ).values()]
                .sort((a, b) => a.section.localeCompare(b.section, "en", { numeric: true }))
                .map((source, index) => (
                  <span key={source.url}>
                    {index > 0 && ", "}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {sectionNumber(source.section)}
                    </a>
                  </span>
                ))}
              {" · "}
              {t("detail.reviewedBy")}
            </p>

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
