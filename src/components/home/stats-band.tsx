import { getTranslations } from "next-intl/server";

import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";

/**
 * Bốn con số thật, không làm tròn lên, không "35+".
 *
 * "Lượt đọc" ở lại dù đang bằng 0: đường ghi lượt đọc chạy đúng
 * (`ViewCounter` → `POST /api/articles/[id]/view` → `incrementViews`), site mới
 * lên nên chưa có lưu lượng. Gỡ ô này đi rồi lắp lại khi có traffic là đổi bố
 * cục hai lần vì một lý do tạm thời.
 *
 * Nhãn phải khớp đúng thứ con số đếm — xem `getSiteStats`, nơi hai truy vấn đã
 * được vá lại cho khớp với "Lĩnh vực khoa học" và "Chủ đề đã có bài".
 */
export async function StatsBand({
  stats,
}: {
  stats: { articles: number; categories: number; tags: number; views: number };
}) {
  const t = await getTranslations("home");

  const items = [
    { value: stats.articles, label: t("statsArticles") },
    { value: stats.categories, label: t("statsFields") },
    { value: stats.tags, label: t("statsTopics") },
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
            <dt className="order-2 text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="order-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <Counter value={item.value} />
            </dd>
          </div>
        ))}
      </dl>

      {/* Một con số trần không nói được nó từ đâu ra. Dòng này là lời hứa đo
          được: đếm thật, không ước lượng. */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("statsCaption")}
      </p>
    </Reveal>
  );
}
