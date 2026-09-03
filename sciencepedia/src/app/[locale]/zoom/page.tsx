import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { ZoomJourney } from "@/components/zoom/zoom-journey";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "zoom" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/zoom",
    locale: locale as Locale,
  });
}

export default async function ZoomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("zoom");

  return (
    <div className="container-page py-8">
      <header className="mb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <ZoomJourney />
    </div>
  );
}
