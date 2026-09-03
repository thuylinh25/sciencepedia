import { getTranslations } from "next-intl/server";
import { Shuffle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ArticleCard as ArticleCardData, TagChip } from "@/server/queries";
import { SectionHeading } from "@/components/section-heading";
import { ArticleCard } from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { DidYouKnowCard } from "@/components/home/did-you-know-card";
import { TopicChips } from "@/components/home/topic-chips";

type CategoryChip = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  _count: { articles: number };
};

/**
 * Một khối "Khám phá hôm nay", không phải hai.
 *
 * Đã loại khỏi khối và đừng dựng lại:
 *  - "Chủ đề nổi bật" trùng đúng khối "Bài viết nổi bật" ngay phía trên.
 *  - "Mới cập nhật" trùng khối "Mới xuất bản" phía dưới, và tệ hơn: 34/35 bài
 *    dùng chung một \`updatedAt\` vì seed upsert một lượt, nên khối đó sẽ nói
 *    "vừa cập nhật" về những bài không ai sửa.
 *
 * Kho rỗng thì KHÔNG render gì cả. Không dựng EmptyState ở đây: nếu không có
 * bài nào thì "Nổi bật" và "Mới xuất bản" cũng rỗng, ba EmptyState liên tiếp
 * đọc ra thành một trang lỗi.
 */
export async function DiscoverToday({
  article,
  popular,
  tags,
  categories,
  total,
  locale,
}: {
  article: ArticleCardData | null;
  popular: ArticleCardData[];
  tags: TagChip[];
  categories: CategoryChip[];
  total: number;
  locale: Locale;
}) {
  const t = await getTranslations("home");

  if (!article) return null;

  const excerpt = await DidYouKnowCard({
    article,
    locale,
    className: "flex-1",
  });
  const hasAside = excerpt !== null || popular.length > 0;

  return (
    <section className="container-page section-gap">
      <SectionHeading
        title={t("discoverTitle")}
        subtitle={t("discoverSubtitle")}
      >
        {/* rel="nofollow" + prefetch tắt: /random trả 307 khác nhau mỗi lần,
            không có gì để index và không có gì để nạp trước. */}
        <Button asChild variant="outline" size="sm">
          <Link href="/random" rel="nofollow" prefetch={false}>
            <Shuffle className="size-4" aria-hidden />
            {t("randomCta")}
          </Link>
        </Button>
      </SectionHeading>

      <Reveal>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className={hasAside ? "lg:col-span-7" : "lg:col-span-12"}>
            <h3 className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {t("todayPick")}
            </h3>
            <ArticleCard
              article={article}
              locale={locale}
              variant={hasAside ? "default" : "hero"}
              className="h-full"
            />
          </div>

          {hasAside && (
            <aside className="flex flex-col gap-6 lg:col-span-5">
              {excerpt}

              {popular.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    {t("popularTitle")}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {popular.map((item) => (
                      <li key={item.id}>
                        <ArticleCard
                          article={item}
                          locale={locale}
                          variant="compact"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}

          <div className="lg:col-span-12">
            <TopicChips
              tags={tags}
              categories={categories}
              total={total}
              locale={locale}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
