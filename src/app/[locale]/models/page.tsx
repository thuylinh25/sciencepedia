import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { MODEL_STEPS } from "@/lib/models";
import { SectionHeading } from "@/components/section-heading";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "models" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/models",
    locale: locale as Locale,
  });
}

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("models");
  const tNav = await getTranslations("nav");
  const loc = locale as Locale;

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      <ol className="grid gap-6 lg:grid-cols-3">
        {MODEL_STEPS.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-space-900">
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span
                  className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
                  style={{ backgroundColor: `${step.color}cc` }}
                >
                  {index + 1}. {loc === "en" ? step.scaleEn : step.scale}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-xl font-bold group-hover:text-primary-strong">
                  {tNav(step.navKey)}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {loc === "en" ? step.blurbEn : step.blurb}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                  {t("open")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t("note")}
      </p>
    </div>
  );
}
