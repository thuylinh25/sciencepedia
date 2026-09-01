import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { AssistantChat } from "@/components/ai/assistant-chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ai" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/assistant",
    locale: locale as Locale,
  });
}

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ai");

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </header>

        <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t("healthDisclaimer")}
        </p>

        <AssistantChat />
      </div>
    </div>
  );
}
