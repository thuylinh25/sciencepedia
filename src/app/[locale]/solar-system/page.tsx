import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { ScaleLadder } from "@/components/models/scale-ladder";
import { tryGetPlanetPositions } from "@/lib/horizons";
import { SolarSystem } from "@/components/solar/solar-system";

/**
 * Vị trí hành tinh lấy từ JPL Horizons được cache 6 giờ, nên trang cũng phải
 * được dựng lại theo nhịp đó — nếu không, bản tĩnh sinh lúc build sẽ giữ mãi
 * cấu hình của ngày build.
 */
export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solar" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/solar-system",
    locale: locale as Locale,
  });
}

export default async function SolarSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("solar");
  // Hỏng thì trả null và cảnh dùng góc tượng trưng — trang không được vỡ vì API ngoài
  const positions = await tryGetPlanetPositions();

  return (
    <div className="container-page py-8">
      <header className="mb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <SolarSystem positions={positions} />

      <ScaleLadder current="solar-system" />
    </div>
  );
}
