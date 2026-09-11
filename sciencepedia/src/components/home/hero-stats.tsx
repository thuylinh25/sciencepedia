import { getTranslations } from "next-intl/server";

import { formatNumber } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import { INTERACTIVE_TOOL_COUNT } from "@/components/home/interactive-explore";

/**
 * Một dòng số liệu ngay dưới ô tìm kiếm.
 *
 * ## Vì sao các con số phải là số THẬT
 *
 * Bản mô tả ban đầu của khối này đề nghị "2.500+ bài viết · 120+ mô hình 3D ·
 * 40+ chủ đề". Kho thật có **57 bài, 6 mô hình, 20 chủ đề** — tức cao hơn sự
 * thật khoảng 44 lần.
 *
 * Không in những con số đó, và lý do không phải là sự cẩn thận thừa. Đây là
 * một bách khoa toàn thư khoa học, và thứ nó bán là *tính đáng tin*. Một trang
 * bị bắt gặp thổi số ở ngay màn hình đầu tiên thì mọi con số khác trên đó cũng
 * mất giá — kể cả con số trong thân bài, thứ đã trả giá bằng tám nguồn và hai
 * vòng duyệt để có được.
 *
 * ## Vì sao chọn bốn đại lượng này
 *
 * Không lấy đại lượng LỚN NHẤT mà lấy đại lượng NÓI ĐÚNG điểm mạnh. "57 bài đã
 * thẩm định" mạnh hơn "2.500 bài" ở đúng thị trường mà trang này đứng: nơi nội
 * dung khoa học sinh hàng loạt bằng máy đang rẻ đi mỗi ngày, còn thứ hiếm là
 * bài có nguồn và có người duyệt.
 *
 * "Lượt đọc" không có mặt ở đây, khác với thanh số liệu cũ: 141 lượt là con số
 * thật nhưng nó đo tuổi của site chứ không đo giá trị của kho, và đặt nó cạnh
 * ba đại lượng kia là tự hạ mình vì một lý do tạm thời.
 *
 * ## Vì sao số mô hình lấy từ `INTERACTIVE_TOOL_COUNT`
 *
 * Viết cứng số 6 ở đây thì ngày ai đó thêm mô hình thứ bảy, dòng này lặng lẽ
 * nói sai. Đếm từ chính mảng dựng ra khối "Khám phá tương tác" nên hai chỗ
 * không thể lệch nhau.
 */
export async function HeroStats({
  stats,
  locale,
}: {
  stats: { articles: number; tags: number };
  locale: Locale;
}) {
  const t = await getTranslations("home");

  const items = [
    {
      value: formatNumber(stats.articles, locale),
      label: t("heroStatsArticles"),
    },
    { value: String(INTERACTIVE_TOOL_COUNT), label: t("heroStatsModels") },
    { value: formatNumber(stats.tags, locale), label: t("heroStatsTopics") },
    { value: null, label: t("heroStatsAi") },
  ];

  return (
    <dl className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm text-white/55 sm:gap-x-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="flex items-baseline gap-x-2.5 sm:gap-x-4"
        >
          {/* Dấu phân cách là trang trí thuần tuý: trình đọc màn hình phải
              nghe "57, bài đã thẩm định, 6, mô hình 3D…" chứ không nghe một
              chuỗi dấu chấm giữa. */}
          {index > 0 && (
            <span aria-hidden className="text-white/25 select-none">
              ·
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            {/* Mục "Trợ lý AI" không có số — nó là một tính năng, không phải
                một phép đếm. Ép cho nó một con số (kiểu "1 trợ lý") chỉ để
                hàng cho đều là thêm nhiễu chứ không thêm thông tin. */}
            {item.value && (
              <dd className="font-display font-semibold text-white/90 tabular-nums">
                {item.value}
              </dd>
            )}
            <dt className={item.value ? undefined : "text-white/75"}>
              {item.label}
            </dt>
          </div>
        </div>
      ))}
    </dl>
  );
}
