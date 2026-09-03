import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

type CategoryLike = {
  slug: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  icon: string | null;
  color: string;
  _count?: { articles: number };
};

/**
 * Card lĩnh vực cỡ lớn, có ảnh nền — dùng ở khối "Duyệt theo lĩnh vực" trên
 * trang chủ.
 *
 * Khác `CategoryCard` (bản gọn, dùng ở trang /categories) ở chỗ nó đặt ảnh làm
 * nền và đẩy chữ lên trên ảnh. Tách thành component riêng thay vì thêm một
 * prop `variant`: hai bản khác nhau ở gần như mọi dòng, và một `variant` sẽ
 * biến file kia thành hai component lồng trong một hàm.
 *
 * ## Ảnh ở đâu ra
 *
 * `getCategoryCovers()` mượn ảnh bìa của bài mới nhất trong lĩnh vực. Xem chú
 * thích ở đó cho lý do và đánh đổi. Không có ảnh thì card vẫn dựng được, chỉ
 * là nền chuyển sang dải màu riêng của lĩnh vực — đó là trạng thái bình thường
 * chứ không phải hỏng, nên không có khung xám hay chữ "thiếu ảnh".
 *
 * ## Vì sao chữ đọc được trên mọi ảnh
 *
 * Ảnh bìa do biên tập chọn, sáng tối không đoán trước được. Nên thay vì hy
 * vọng, đặt một lớp phủ gradient đen đặc ở đáy — nơi duy nhất chữ được phép
 * nằm. Cùng lý do đã khiến badge lĩnh vực trên thẻ bài bỏ mã màu theo danh
 * mục: contrast phải bảo đảm ở mọi giá trị dữ liệu, không phải ở giá trị may
 * mắn.
 */
export async function CategoryFeatureCard({
  category,
  coverImage,
  locale,
  priority,
  className,
}: {
  category: CategoryLike;
  coverImage?: string;
  locale: Locale;
  /** Đặt cho card đầu tiên — nó nằm trong khung nhìn đầu ở màn hình cao */
  priority?: boolean;
  className?: string;
}) {
  const t = await getTranslations("category");

  const name = locale === "en" ? category.nameEn : category.name;
  const description =
    locale === "en"
      ? (category.descriptionEn ?? category.description)
      : category.description;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        // Hover phải nói rõ "bấm được": đây là lối điều hướng chính vào từng
        // lĩnh vực. Nâng 6px, viền sáng lên, bóng dày hơn — ba tín hiệu cùng
        // lúc vì trên nền tối thì riêng bóng gần như vô hình.
        "group relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/70 hover:shadow-2xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      {coverImage ? (
        <>
          <Image
            src={coverImage}
            alt=""
            fill
            // Card chiếm 1/3 bề ngang container ở lg, 1/2 ở sm, cả bề ngang ở
            // mobile. Không khai báo thì Next tải bản đủ rộng cho cả viewport.
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Lớp phủ: đen đặc ở đáy, tan dần lên trên. Đây là thứ bảo đảm chữ
              đọc được bất kể ảnh sáng hay tối. */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/70 to-space-900/15"
          />
        </>
      ) : (
        // Không có ảnh: dải màu riêng của lĩnh vực. Trạng thái bình thường,
        // không phải lỗi.
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${category.color}55, var(--color-space-900) 70%)`,
          }}
        />
      )}

      <div className="relative p-6">
        <span
          className="grid size-11 place-items-center rounded-xl backdrop-blur transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${category.color}33`,
            color: category.color,
          }}
        >
          <CategoryIcon name={category.icon} className="size-5" />
        </span>

        <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
          {name}
        </h3>

        {/* Khối mô tả cao cố định hai dòng, kể cả khi mô tả chỉ có một dòng
            hoặc không có.

            Chỉ đặt `line-clamp` là chưa đủ để card cân nhau: clamp chặn phần
            thừa nhưng không lấp phần thiếu, nên lĩnh vực có mô tả ngắn vẫn cho
            ra card có trọng tâm cao hơn hẳn card bên cạnh. `min-h` mới là thứ
            giữ cho hàng nút và số bài của mọi card nằm cùng một đường. */}
        <p className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-white/75">
          {description}
        </p>

        <span className="mt-4 flex items-center justify-between text-xs font-medium text-white/70">
          {category._count && (
            <span>{t("articleCount", { count: category._count.articles })}</span>
          )}
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
