import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getAllTags } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tag" });

  return buildMetadata({
    title: t("allTags"),
    description: t("title"),
    path: "/tags",
    locale: locale as Locale,
  });
}

export default async function TagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tag");
  const tags = await getAllTags();
  const loc = locale as Locale;

  // Cỡ chữ theo số bài — dạng "tag cloud" nhưng vẫn đọc được
  const max = Math.max(1, ...tags.map((tag) => tag._count.articles));

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("allTags")} />

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const weight = tag._count.articles / max;
          return (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{
                borderColor: `${tag.color}55`,
                backgroundColor: `${tag.color}12`,
                fontSize: `${0.875 + weight * 0.45}rem`,
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium">
                {loc === "en" ? tag.nameEn : tag.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {tag._count.articles}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
