import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Orbit, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import {
  getFeaturedArticles,
  getLatestArticles,
  getRootCategories,
  getSiteStats,
} from "@/server/queries";

import { Hero } from "@/components/home/hero";
import { StatsBand } from "@/components/home/stats-band";
import { SectionHeading } from "@/components/section-heading";
import { ArticleCard } from "@/components/article/article-card";
import { ArticleGrid } from "@/components/article/article-grid";
import { CategoryCard } from "@/components/category/category-card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return buildMetadata({
    title: `${t("name")} — ${t("tagline")}`,
    description: t("description"),
    path: "/",
    locale: locale as Locale,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [featured, latest, categories, stats] = await Promise.all([
    getFeaturedArticles(5),
    getLatestArticles(6),
    getRootCategories(),
    getSiteStats(),
  ]);

  const [heroArticle, ...restFeatured] = featured;

  return (
    <>
      <Hero />

      <StatsBand stats={stats} />

      {/* ---------------------------------------------------- Nổi bật */}
      {heroArticle && (
        <section className="container-page section-gap">
          <SectionHeading
            title={t("featured")}
            subtitle={t("featuredSubtitle")}
            href="/articles"
            linkLabel={t("latest")}
          />

          <Reveal>
            <ArticleCard
              article={heroArticle}
              locale={locale as Locale}
              variant="hero"
              priority
            />
          </Reveal>

          {restFeatured.length > 0 && (
            <StaggerGroup className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {restFeatured.map((article) => (
                <StaggerItem key={article.id} className="h-full">
                  <ArticleCard
                    article={article}
                    locale={locale as Locale}
                    className="h-full"
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </section>
      )}

      {/* ---------------------------------------------------- Lĩnh vực */}
      <section className="container-page section-gap">
        <SectionHeading
          title={t("browseCategories")}
          subtitle={t("browseCategoriesSubtitle")}
        />
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <StaggerItem key={category.id} className="h-full">
              <CategoryCard
                category={category}
                locale={locale as Locale}
                className="h-full"
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ---------------------------------------------------- Hệ Mặt Trời */}
      <section className="section-gap">
        <Reveal>
          <div className="bg-cosmos starfield relative isolate overflow-hidden py-24">
            <div className="container-page grid items-center gap-12 lg:grid-cols-2">
              <div className="text-star">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium tracking-widest text-white/85 uppercase">
                  <Orbit className="size-3.5" /> 3D · WebGL
                </span>
                <h2 className="font-display text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl">
                  {t("solarTitle")}
                </h2>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-pretty text-white/70">
                  {t("solarSubtitle")}
                </p>
                <Button asChild size="xl" variant="accent" className="mt-8">
                  <Link href="/solar-system">
                    {t("solarCta")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              {/* Minh hoạ quỹ đạo bằng CSS — nhẹ hơn nhiều so với nhúng canvas ở trang chủ */}
              <div
                aria-hidden
                className="relative mx-auto aspect-square w-full max-w-md"
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="size-16 rounded-full bg-accent shadow-[0_0_80px_25px_var(--color-accent)]" />
                </div>
                {[
                  { size: "45%", duration: "8s", dot: "0.5rem" },
                  { size: "62%", duration: "13s", dot: "0.75rem" },
                  { size: "80%", duration: "21s", dot: "0.6rem" },
                  { size: "98%", duration: "34s", dot: "0.9rem" },
                ].map((orbit) => (
                  <div
                    key={orbit.size}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
                    style={{ width: orbit.size, height: orbit.size }}
                  >
                    <div
                      className="absolute inset-0 motion-safe:animate-[spin_var(--d)_linear_infinite]"
                      style={{ ["--d" as string]: orbit.duration }}
                    >
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90"
                        style={{ width: orbit.dot, height: orbit.dot }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------------------------- Trợ lý AI */}
      <section className="container-page section-gap">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-card p-10 sm:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-medium tracking-widest text-primary uppercase">
                <Sparkles className="size-3.5" /> AI
              </span>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                {t("aiTitle")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
                {t("aiSubtitle")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="xl">
                  <Link href="/assistant">
                    {t("aiCta")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <span className="rounded-full border border-dashed px-4 py-2 text-sm text-muted-foreground">
                  “{t("aiPlaceholder")}”
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------------------------- Mới nhất */}
      <section className="container-page section-gap mb-8">
        <SectionHeading
          title={t("latest")}
          subtitle={t("latestSubtitle")}
          href="/articles"
          linkLabel={t("featured")}
        />
        <ArticleGrid articles={latest} locale={locale as Locale} />
      </section>
    </>
  );
}
