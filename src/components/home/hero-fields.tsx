import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickName } from "@/lib/i18n-content";
import { CategoryIcon } from "@/components/category-icon";

type Field = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  icon: string | null;
};

/**
 * Lối tắt vào từng lĩnh vực, đặt ngay dưới ô tìm kiếm trên hero.
 *
 * **Vì sao có khối này khi trang chủ đã có mục "Duyệt theo lĩnh vực".** Ba khối
 * dễ bị nhầm là làm cùng một việc, nên phân vai rõ:
 *
 *  - Khối này — người mở trang lần đầu chưa biết gõ gì vào ô tìm kiếm. Nó trả
 *    lời đúng một câu hỏi: "bắt đầu từ đâu?". Vì vậy chỉ tên + icon, không mô
 *    tả, không đếm bài, và nằm ngay tầm mắt cạnh ô tìm kiếm.
 *  - `TopicChips` phía dưới — dẫn theo **thẻ**, tức chủ đề hẹp, cho người đã
 *    biết mình quan tâm gì.
 *  - Mục "Duyệt theo lĩnh vực" — danh sách **đầy đủ** có mô tả và số bài, cho
 *    người muốn xem toàn cảnh.
 *
 * **Vì sao là Server Component.** Hero là client (framer-motion), nên khối này
 * được trang chủ render rồi truyền xuống qua prop `fields` — giống cách ô tìm
 * kiếm đang làm. Nhờ vậy nó nằm trong HTML đầu tiên và không kéo thêm gì vào
 * bundle client.
 *
 * **Lấy từ CSDL, không viết cứng.** Gợi ý ban đầu (Trái Đất · Vũ Trụ · Sinh
 * vật học · Con người) không khớp cây lĩnh vực thật; viết cứng chúng là ship
 * link tới trang không tồn tại.
 */
export async function HeroFields({
  fields,
  locale,
}: {
  fields: Field[];
  locale: Locale;
}) {
  const t = await getTranslations("home");

  if (fields.length === 0) return null;

  return (
    <nav aria-label={t("heroCategoriesLabel")} className="w-full max-w-2xl">
      <p className="mb-2.5 text-xs font-medium tracking-widest text-white/55 uppercase">
        {t("heroCategoriesLabel")}
      </p>
      <ul className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <li key={field.id}>
            {/* min-h-11 = 44px vùng chạm. Hero là nơi ngón cái bấm nhiều nhất
                trên di động, không áp dụng ngoại lệ 40px của thanh header. */}
            <Link
              href={`/categories/${field.slug}`}
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:border-white/45 hover:bg-white/20 hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <CategoryIcon
                name={field.icon}
                className="size-4 shrink-0 text-accent"
              />
              {pickName(locale, field)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
