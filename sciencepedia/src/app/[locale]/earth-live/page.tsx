import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Radio, Satellite, Telescope } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { EpicEarth } from "@/components/earth/epic-earth";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "earthLive" });

  return buildMetadata({
    title: t("title"),
    description: t("metaDescription"),
    path: "/earth-live",
    locale: locale as Locale,
  });
}

/**
 * Trang "Trái Đất thời gian thực".
 *
 * ## Vì sao là một trang chứ không chỉ là khối trên trang chủ
 *
 * Khối ảnh trên trang chủ trả lời được "Trái Đất hôm nay trông thế nào" và
 * hết. Ba câu hỏi đến ngay sau đó — ảnh này ai chụp, chụp từ đâu, và vì sao
 * lúc nào cũng thấy ban ngày — không có chỗ nào trả lời. Đó là phần biến một
 * widget thành một công cụ để học, và nó cần chỗ.
 *
 * ## Vì sao trang này là static
 *
 * Không một dòng nào ở đây phụ thuộc vào dữ liệu NASA: ảnh do component
 * client tự lấy sau khi trang đã hiện. Nên trang được prerender như mọi
 * trang nội dung khác, và phần "thời gian thực" không kéo theo một lượt
 * render phía máy chủ nào.
 */
export default async function EarthLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("earthLive");

  const facts = [
    {
      icon: Satellite,
      term: t("facts.spacecraft.term"),
      detail: t("facts.spacecraft.detail"),
    },
    {
      icon: Telescope,
      term: t("facts.instrument.term"),
      detail: t("facts.instrument.detail"),
    },
    {
      icon: Radio,
      term: t("facts.cadence.term"),
      detail: t("facts.cadence.detail"),
    },
  ];

  return (
    <div className="container-page py-8">
      {/* Kiểu WebApplication chứ không phải Article: trang này là một công cụ
          chạy được, không phải một bài đọc. Google dùng phân biệt đó để quyết
          định hiển thị nó ra sao trong kết quả tìm kiếm. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("title"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/earth-live`),
          applicationCategory: "EducationalApplication",
          browserRequirements: "JavaScript",
          isAccessibleForFree: true,
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          creator: {
            "@type": "Organization",
            name: "Sciencepedia",
            url: absoluteUrl("/"),
          },
          about: [
            { "@type": "Thing", name: "Earth observation" },
            { "@type": "Thing", name: "DSCOVR" },
            { "@type": "Thing", name: "NASA EPIC" },
          ],
        }}
      />

      <header className="mb-6 max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("intro")}
        </p>
      </header>

      <EpicEarth locale={locale} />

      {/* ----------------------------------------------- Ba thứ cần biết */}
      <section className="section-gap">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("howTitle")}
        </h2>

        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          {facts.map(({ icon: Icon, term, detail }) => (
            <div key={term} className="rounded-2xl border bg-card p-5">
              <Icon className="size-5 text-primary-strong" aria-hidden />
              <dt className="mt-3 font-display font-semibold">{term}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* --------------------------------------- Vì sao lúc nào cũng ban ngày */}
      <section className="section-gap max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("dayTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("dayBody")}
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold tracking-tight">
          {t("colourTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("colourBody")}
        </p>

        <h2 className="mt-8 font-display text-2xl font-bold tracking-tight">
          {t("limitTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("limitBody")}
        </p>
      </section>

      <section className="section-gap">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/30 p-5">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            {t("nextHint")}
          </p>
          <Link
            href="/zoom"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong hover:underline"
          >
            {t("nextCta")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t("credit")}
        </p>
      </section>
    </div>
  );
}
