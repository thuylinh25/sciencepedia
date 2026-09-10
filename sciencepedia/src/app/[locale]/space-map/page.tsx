import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { ALADIN_ORIGIN, SKY_TARGETS } from "@/lib/sky-data";
import { SURFACE_HIPS_ORIGIN } from "@/lib/solar-data";
import { JsonLd } from "@/components/json-ld";
import { SkyMap } from "@/components/sky/sky-map";
import { PlanetGallery } from "@/components/solar/planet-gallery";

/**
 * Bản đồ bầu trời — `/vi/space-map` và `/en/space-map`.
 *
 * ## Vì sao route này tĩnh hoàn toàn
 *
 * Không có một truy vấn CSDL nào: danh mục thiên thể nằm trong `sky-data.ts`,
 * còn ảnh bầu trời do CDS phát thẳng tới trình duyệt. Không đọc `searchParams`
 * (xem chú thích trong `SkyMap`), nên Next dựng sẵn được cả hai bản ngôn ngữ
 * lúc build và Vercel phục vụ từ CDN.
 *
 * ## Vì sao SEO không mất gì dù bản đồ không SSR
 *
 * Thứ duy nhất bị hoãn là khung WebGL, mà khung đó không chứa chữ. Tiêu đề,
 * mô tả, danh sách 10 thiên thể kèm chòm sao và chú giải đều nằm trong HTML
 * đầu tiên, cùng JSON-LD `ItemList` mô tả đúng danh sách đang hiển thị.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sky" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/space-map",
    locale: locale as Locale,
  });
}

export default async function SpaceMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("sky");
  const isEnglish = locale === "en";

  return (
    <div className="container-page py-8">
      {/*
        Bắt tay TLS với CDS tốn khoảng một vòng đi-về; làm sớm ở đây thì lúc
        người đọc bấm mở bản đồ, kết nối đã sẵn sàng. Chỉ đặt ở route này —
        preconnect ở layout chung sẽ bắt mọi trang trả giá cho một máy chủ mà
        chúng chẳng bao giờ gọi tới.
      */}
      <link rel="preconnect" href={ALADIN_ORIGIN} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={ALADIN_ORIGIN} />
      {/* Ô tile bề mặt hành tinh nằm ở máy chủ khác với máy chủ phát script. */}
      <link
        rel="preconnect"
        href={SURFACE_HIPS_ORIGIN}
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href={SURFACE_HIPS_ORIGIN} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("catalogTitle"),
          url: absoluteUrl(`/${locale}/space-map`),
          numberOfItems: SKY_TARGETS.length,
          itemListElement: SKY_TARGETS.map((target, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Thing",
              name: isEnglish ? target.nameEn : target.name,
              alternateName: target.catalogId,
              description: isEnglish ? target.blurbEn : target.blurb,
            },
          })),
        }}
      />

      <header className="mb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <SkyMap />

      <PlanetGallery />

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        {t("credit")}
      </p>
    </div>
  );
}
