import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { EXPLORE_TOOLS, MODEL_STEPS } from "@/lib/models";
import { SectionHeading } from "@/components/section-heading";
import { AssetImage } from "@/components/ui/asset-image";

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
  /* Thẻ của hai công cụ ngoài bậc thang dùng lại ĐÚNG tiêu đề và mô tả của
     chính trang chúng dẫn tới, chứ không viết một bản rút gọn riêng. Hai bản
     mô tả cho cùng một thứ là hai bản sẽ lệch nhau. */
  const tSky = await getTranslations("sky");
  const tZoom = await getTranslations("zoom");
  const loc = locale as Locale;

  const toolCopy = { sky: tSky, zoom: tZoom } as const;

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      {/* Tiêu đề nhóm, mới có từ khi trang này gom cả năm công cụ.

          Trước đây trang chỉ có ba mô hình nên tiêu đề trang nói luôn được
          "ba bậc thang kích thước". Giờ nó còn đỡ thêm hai công cụ KHÔNG nằm
          trên thang ấy, nên câu về bậc thang phải lùi xuống đúng nhóm nó mô
          tả — để nguyên ở tiêu đề trang thì nó nói sai về hai thẻ cuối. */}
      <h2 className="font-display text-xl font-bold">{t("modelsGroup")}</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t("modelsGroupNote")}
      </p>

      <ol className="grid gap-6 lg:grid-cols-3">
        {MODEL_STEPS.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-space-900">
                <AssetImage
                  src={step.image}
                  alt=""
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

      {/* `<ul>` chứ không `<ol>` như nhóm trên: ba mô hình có thứ tự thật —
          nhỏ tới lớn — còn hai công cụ này không xếp trước sau gì cả. */}
      <h2 className="mt-14 font-display text-xl font-bold">
        {t("toolsGroup")}
      </h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t("toolsGroupNote")}
      </p>

      <ul className="grid gap-6 lg:grid-cols-3">
        {EXPLORE_TOOLS.map((tool) => {
          const tc = toolCopy[tool.copyKey];

          return (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-space-900">
                  <AssetImage
                    src={tool.image}
                    alt=""
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-bold group-hover:text-primary-strong">
                    {tc("title")}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tc("subtitle")}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                    {t("openTool")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
