import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import {
  getAllCategories,
  getDailyPick,
  getFeaturedArticles,
  getLatestArticles,
  getPopularArticles,
  getCategoryCovers,
  getRootCategories,
  getSiteStats,
  getTagsWithArticles,
} from "@/server/queries";

import { Hero } from "@/components/home/hero";
import { HeroStats } from "@/components/home/hero-stats";
import { InteractiveExplore } from "@/components/home/interactive-explore";
import { HeroFields } from "@/components/home/hero-fields";
import { AiQuestions } from "@/components/home/ai-questions";
import { DiscoverToday } from "@/components/home/discover-today";
import { SearchHeroForm } from "@/components/search/search-hero-form";
import { SectionHeading } from "@/components/section-heading";
import { ArticleCard } from "@/components/article/article-card";
import { ArticleGrid } from "@/components/article/article-grid";
import { CategoryFeatureCard } from "@/components/category/category-feature-card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/**
 * "Bài của hôm nay" đổi theo ngày ở tầng query, nhưng trang chủ được prerender
 * nên bản HTML tĩnh sẽ giữ nguyên bài của NGÀY BUILD cho tới lần deploy sau nếu
 * không có `revalidate` hữu hạn. Một giờ là trần thời gian trễ sau nửa đêm.
 * Vẫn là ISR — không SSR, không fetch phía client.
 */
export const revalidate = 3600;

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
  const [
    featured,
    latest,
    categories,
    stats,
    dailyPick,
    popularRaw,
    chipTags,
    allCategories,
    categoryCovers,
  ] = await Promise.all([
    getFeaturedArticles(5),
    getLatestArticles(6),
    getRootCategories(),
    getSiteStats(),
    getDailyPick(),
    // Lấy dư một bài để còn chỗ loại bài của hôm nay ra: cùng một bài xuất hiện
    // hai lần trong cùng một khối là lỗi thấy được.
    getPopularArticles(4),
    getTagsWithArticles(64),
    getAllCategories(),
    getCategoryCovers(),
  ]);

  const [heroArticle, ...restFeatured] = featured;
  const popular = popularRaw
    .filter((item) => item.id !== dailyPick.article?.id)
    .slice(0, 3);

  return (
    <>
      <Hero
        search={<SearchHeroForm locale={locale as Locale} />}
        fields={<HeroFields fields={categories} locale={locale as Locale} />}
        stats={<HeroStats stats={stats} locale={locale as Locale} />}
      />

      {/* Ngay dưới hero, trên bài nổi bật: đây là câu trả lời cho "trang này
          làm được gì", và nó phải đến trước danh sách bài đọc.

          Khối này là thứ ĐẦU TIÊN sau hero. Đã có hai lượt thử đặt một thanh
          bốn ô số liệu chen vào giữa, và cả hai lượt đều bắt người đọc cuộn
          qua một bảng số trước khi tới được câu trả lời đó. Số liệu nay là
          một dòng chữ nằm trong chính hero — xem `HeroStats`. */}
      <InteractiveExplore />

      {/* ---------------------------------------------------- Nổi bật */}
      {heroArticle && (
        <section className="container-page section-gap">
          <SectionHeading
            title={t("featured")}
            subtitle={t("featuredSubtitle")}
            href="/articles"
            linkLabel={t("seeAllArticles")}
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

      {/* ------------------------------------------- Khám phá hôm nay */}
      <DiscoverToday
        article={dailyPick.article}
        popular={popular}
        tags={chipTags}
        categories={allCategories}
        total={stats.articles}
        locale={locale as Locale}
      />

      {/* ---------------------------------------------------- Lĩnh vực */}
      <section className="container-page section-gap">
        <SectionHeading
          title={t("browseCategories")}
          subtitle={t("browseCategoriesSubtitle")}
        />
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <StaggerItem key={category.id} className="h-full">
              <CategoryFeatureCard
                category={category}
                coverImage={categoryCovers[category.slug]}
                locale={locale as Locale}
                priority={index === 0}
                className="h-full"
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>


      {/* --------------------------------------------------- Mới xuất bản */}
      <section className="container-page section-gap">
        <SectionHeading
          title={t("latest")}
          subtitle={t("latestSubtitle")}
          href="/articles"
          linkLabel={t("featured")}
        />
        <ArticleGrid articles={latest} locale={locale as Locale} />
      </section>
      {/* ---------------------------------------------------- Trợ lý AI */}
      <section className="container-page section-gap mb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-card p-10 sm:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl"
            />
            {/* Hai cột: chữ trái, câu hỏi bấm được phải. Bản cũ để cả cột
                phải trống 60% và câu hỏi ví dụ nằm trong khung nét đứt — trông
                như nút nhưng không bấm được. */}
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-medium tracking-widest text-primary-strong uppercase">
                  <Sparkles className="size-3.5" /> AI
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                  {t("aiTitle")}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
                  {t("aiSubtitle")}
                </p>

                <div className="mt-8">
                  <Button asChild size="xl">
                    <Link href="/assistant">
                      {t("aiCta")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <AiQuestions />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
