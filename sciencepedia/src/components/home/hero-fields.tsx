import { ArrowRight } from "lucide-react";
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
  _count: { articles: number };
};

/**
 * Số chip hiện ngay. Phần còn lại gộp vào một lối đi duy nhất.
 *
 * Kho có 7 lĩnh vực gốc. Bày cả 7 thì trên điện thoại chúng xuống ba hàng và
 * chiếm gần hết phần hero còn lại dưới ô tìm kiếm — người mở trang lần đầu gặp
 * bảy lựa chọn ngang hàng nhau ngay dưới một ô tìm kiếm, tức là hai cơ chế
 * cạnh tranh nhau chứ không bổ trợ.
 *
 * Bốn là con số nhỏ nhất còn nói được rằng đây là một **bách khoa nhiều
 * ngành** chứ không phải một trang thiên văn. Xuống ba thì mất đúng thông điệp
 * đó; lên năm thì trên màn hình hẹp lại tràn sang hàng thứ ba.
 */
const VISIBLE = 4;

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
 *
 * **Vì sao cắt còn bốn, và vì sao nút thứ năm là link chứ không phải nút mở
 * rộng.** Một nút "xem thêm" bung tại chỗ cần state, tức cần `'use client'`,
 * tức kéo cả khối này ra khỏi HTML đầu tiên để đổi lấy việc hiện ba chip mà
 * trang `/categories` vốn đã hiện đầy đủ kèm mô tả và số bài. Link rẻ hơn và
 * dẫn tới chỗ tốt hơn.
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

  /*
   * Xếp theo SỐ BÀI ĐÃ XUẤT BẢN, không theo cột `order`.
   *
   * `order` là thứ tự biên tập, đặt một lần khi dựng cây lĩnh vực và từ đó
   * không đổi theo kho. Bốn chip đầu của hero thì phải dẫn tới chỗ CÓ GÌ ĐỂ
   * ĐỌC: một lĩnh vực mới lập, mới hai bài, là ngõ cụt cho đúng người mà khối
   * này phục vụ — người chưa biết bắt đầu từ đâu.
   *
   * Số bài là proxy chứ không phải phép đo độ phổ biến thật (cái đó cần lượt
   * xem theo lĩnh vực, kho chưa tổng hợp). Nhưng nó đứng cùng chiều với độ
   * phổ biến và tự cập nhật theo kho, nên không có ngày nào nó lạc hậu mà
   * không ai biết.
   *
   * Hoà thì theo `order` — mảng vào đã xếp sẵn theo đó, và `sort` của JS ổn
   * định, nên chỉ cần không đụng tới là thứ tự cũ được giữ.
   */
  const ranked = [...fields].sort(
    (a, b) => b._count.articles - a._count.articles,
  );
  const shown = ranked.slice(0, VISIBLE);
  const hidden = ranked.length - shown.length;

  return (
    <nav aria-label={t("heroCategoriesLabel")} className="w-full max-w-2xl">
      <p className="mb-2.5 text-xs font-medium tracking-widest text-white/55 uppercase">
        {t("heroCategoriesLabel")}
      </p>
      <ul className="flex flex-wrap gap-2">
        {shown.map((field) => (
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

        {/* Chip thứ năm phải TRÔNG khác bốn chip kia, vì nó làm việc khác:
            bốn cái trước dẫn vào một lĩnh vực, cái này dẫn ra danh sách. Cùng
            kiểu nền thì mắt đọc ra năm lĩnh vực ngang hàng và một cái tên lạ.
            Viền đứt + không nền là cách rẻ nhất nói "đây là lối ra", giữ
            nguyên chiều cao 44px để hàng không so le. */}
        {hidden > 0 && (
          <li>
            <Link
              href="/categories"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-white/30 px-4 text-sm font-medium text-white/70 transition-colors hover:border-white/55 hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t("heroFieldsMore", { count: hidden })}
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
