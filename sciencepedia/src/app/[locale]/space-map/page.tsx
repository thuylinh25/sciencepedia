import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  ALADIN_ORIGIN,
  ALADIN_SCRIPT_ORIGIN,
  SKY_TARGETS,
} from "@/lib/sky-data";
import { SURFACE_HIPS_ORIGIN } from "@/lib/solar-data";
import { JsonLd } from "@/components/json-ld";
import { OortCloudDiagram } from "@/components/sky/oort-cloud-diagram";
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
      {/* Hai máy chủ khác nhau: một phát script, một phát ô tile HiPS. Từ
          2026-09-11 script chuyển sang jsDelivr nên chúng không còn trùng
          nhau, và thiếu preconnect cho máy chủ script là trả thêm một lượt
          DNS + TLS ngay trên đường tải nặng nhất của trang. */}
      <link
        rel="preconnect"
        href={ALADIN_SCRIPT_ORIGIN}
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href={ALADIN_SCRIPT_ORIGIN} />
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

      {/* --------------------------------------------- Sơ đồ Đám mây Oort

          Nấc "Đám mây Oort" trong bậc thang kích thước trỏ về đây. Trước đó
          nó là nấc duy nhất không có chỗ nào để tới, vì đám mây Oort không có
          ảnh — chưa ai quan sát trực tiếp nó.

          Giải pháp KHÔNG phải là đi tìm một tấm ảnh: mọi "ảnh đám mây Oort"
          đều là hình vẽ, và mượn một hình vẽ về rồi đặt giữa một trang mang
          tên "ảnh bầu trời thật" là làm đúng điều trang này dạy người đọc
          đừng làm. Giải pháp là vẽ một sơ đồ và dán nhãn nó là sơ đồ. */}
      <section id="oort-cloud" className="section-gap scroll-mt-24">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("oortTitle")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("oortLead")}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
          <div className="rounded-2xl border bg-[#04060e] p-4 text-white">
            <OortCloudDiagram className="w-full" />
          </div>

          <div className="space-y-4">
            <ul className="space-y-2.5 text-sm leading-relaxed">
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#a78bfa]"
                />
                {t("oortKuiper")}
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#7dd3fc]"
                />
                {t("oortInner")}
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#bae6fd]"
                />
                {t("oortOuter")}
              </li>
            </ul>

            <p className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-4 text-sm leading-relaxed">
              {t("oortScaleNote")}
            </p>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("oortUnknown")}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        {t("credit")}
      </p>
    </div>
  );
}
