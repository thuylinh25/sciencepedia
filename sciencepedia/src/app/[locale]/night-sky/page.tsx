import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { toolImage } from "@/lib/models";
import { absoluteUrl } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { NightSky } from "@/components/night-sky/night-sky";
import { ToolViewTracker } from "@/components/tools/tool-view-tracker";

/**
 * Bầu trời đêm nay — `/vi/night-sky` và `/en/night-sky`.
 *
 * ## Khác gì trang Bản đồ bầu trời (`/space-map`)
 *
 * Hai trang cùng nói về bầu trời nhưng trả lời hai câu khác nhau.
 * `/space-map` là ảnh khảo sát thật để soi sâu vào một vùng trời;
 * trang này là planetarium theo NGƯỜI QUAN SÁT: đứng ở một nơi trên Trái
 * Đất, vào một thời điểm, ngẩng đầu lên thì thấy gì. Đừng gộp hai trang
 * làm một — tên gần nhau đã là đủ nhầm lẫn, nội dung phải tách bạch, và
 * cuối trang này có liên kết chéo nói rõ sự khác nhau đó.
 *
 * ## Vì sao route này tĩnh hoàn toàn
 *
 * Không truy vấn CSDL, không đọc `searchParams`: nơi quan sát và thời gian
 * là trạng thái của client component, engine VirtualSky tự host trong
 * `public/night-sky/` nên cả trang không phụ thuộc máy chủ ngoài nào.
 * Khung canvas không chứa chữ, nên việc nó nạp ở client không mất SEO —
 * tiêu đề, mô tả và khối giải thích đều có trong HTML đầu tiên, cùng
 * JSON-LD `WebApplication`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nightSky" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/night-sky",
    image: toolImage("/night-sky"),
    locale: locale as Locale,
  });
}

export default async function NightSkyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("nightSky");

  return (
    <div className="container-page py-8">
      <ToolViewTracker toolId="night-sky" />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("title"),
          description: t("subtitle"),
          url: absoluteUrl(`/${locale}/night-sky`),
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          inLanguage: locale,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />

      <header className="mb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <NightSky />

      <section className="section-gap">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("aboutTitle")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("aboutBody")}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/space-map"
            className="font-medium text-primary-strong underline-offset-4 hover:underline"
          >
            {t("spaceMapCta")}
          </Link>
        </p>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        {t("credit")}
      </p>
    </div>
  );
}
