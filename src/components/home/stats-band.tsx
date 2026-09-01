import { getTranslations } from "next-intl/server";

import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";

export async function StatsBand({
  stats,
}: {
  stats: { articles: number; categories: number; tags: number; views: number };
}) {
  const t = await getTranslations("home");

  const items = [
    { value: stats.articles, label: t("statsArticles") },
    { value: stats.categories, label: t("statsCategories") },
    { value: stats.tags, label: t("statsTags") },
    { value: stats.views, label: t("statsReaders") },
  ];

  return (
    <Reveal as="section" className="container-page -mt-10">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 bg-card px-4 py-8"
          >
            <dt className="order-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="order-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <Counter value={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
