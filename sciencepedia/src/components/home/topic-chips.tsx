import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { TagChip } from "@/server/queries";
import { formatNumber } from "@/lib/utils";

type CategoryChip = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  _count: { articles: number };
};

/**
 * Dải "lối rẽ nhanh" — chip dẫn tới thẻ và lĩnh vực.
 *
 * Lấy từ dữ liệu thật, KHÔNG viết cứng. Danh sách gợi ý ban đầu
 * ([Lỗ đen][DNA][Sao Hỏa][Giấc ngủ][Khủng long]) có ba chip trỏ vào thứ không
 * tồn tại trong CSDL và hai chip còn lại chỉ có 1–2 bài — viết cứng chúng là
 * ship link tới trang trống.
 *
 * Luật lọc, chạy hoàn toàn ở server:
 *  - Ngưỡng dưới 3 bài: dưới mức đó trang đích trông như lỗi.
 *  - Ngưỡng trên 60% kho: \`thien-van\` chiếm 30/35 bài (86%) — nó không phải một
 *    lối rẽ mà là "xem tất cả", đặt vào đây chỉ làm loãng dải chip.
 *  - Tối đa 8 chip, thẻ trước rồi bù bằng lĩnh vực, bỏ lĩnh vực trùng slug thẻ.
 *
 * Chip LUÔN hiện số bài: chip có số là một lời hứa đo được.
 *
 * Không dùng \`<Badge>\`: Badge là \`py-0.5\`, cao khoảng 22px, trượt WCAG 2.5.8
 * (vùng chạm 44px). \`h-11\` ở đây đúng bằng 44px.
 */
export async function TopicChips({
  tags,
  categories,
  total,
  locale,
}: {
  tags: TagChip[];
  categories: CategoryChip[];
  /** Tổng số bài đã xuất bản — dùng cho ngưỡng trên. */
  total: number;
  locale: Locale;
}) {
  const t = await getTranslations("home");

  const ceiling = Math.floor(total * 0.6);

  const tagChips = tags
    .filter((tag) => tag._count.articles >= 3 && tag._count.articles <= ceiling)
    .slice(0, 5);

  const catChips = categories
    .filter((category) => category._count.articles >= 3)
    .filter((category) => !tagChips.some((tag) => tag.slug === category.slug))
    .slice(0, 8 - tagChips.length);

  const chips = [
    ...tagChips.map((tag) => ({
      key: `tag-${tag.id}`,
      href: `/tags/${tag.slug}`,
      label: locale === "en" ? tag.nameEn : tag.name,
      count: tag._count.articles,
    })),
    ...catChips.map((category) => ({
      key: `cat-${category.id}`,
      href: `/categories/${category.slug}`,
      label: locale === "en" ? category.nameEn : category.name,
      count: category._count.articles,
    })),
  ];

  // Không có chip nào đạt ngưỡng thì ẩn cả hàng. Một EmptyState ở đây chỉ nói
  // "không có lối rẽ", điều mà việc không hiện gì đã nói rồi.
  if (chips.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {t("chipsTitle")}
      </h3>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.href}
              /* h-9 chứ không h-11: đây là lối rẽ phụ, không phải hành động
                 chính. Ở cỡ 44px chúng nặng ngang nút "Khám phá" và tranh chú ý
                 với chính khối bài viết ngay trên. Ngoại lệ vùng chạm 44px là
                 có chủ ý và giới hạn ở đây — chip xếp thành lưới thưa, không
                 phải hàng nút sát nhau nên bấm nhầm khó xảy ra.

                 Dấu # thay vì 🔥: đây là danh sách theo số bài, không phải theo
                 mức tăng. Icon lửa hứa "đang nóng" — một tuyên bố về xu hướng
                 mà không có dữ liệu nào chống lưng. */
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors hover:border-accent hover:bg-accent/10"
            >
              <span aria-hidden className="text-accent">
                #
              </span>
              <span>{chip.label}</span>
              <span className="text-xs text-muted-foreground">
                {formatNumber(chip.count, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
