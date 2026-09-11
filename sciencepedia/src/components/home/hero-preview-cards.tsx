import { ArrowRight, Boxes, FileText, Tag as TagIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { MODEL_STEPS } from "@/lib/models";
import { pick, pickName } from "@/lib/i18n-content";
import type { ArticleCard, TagChip } from "@/server/queries";

/**
 * Ba thẻ xem trước ở cuối hero: bài mới nhất, một mô hình 3D, một chủ đề.
 *
 * ## Vì sao lần này card trong hero là đúng, sau ba lần nó là sai
 *
 * Hero từng có một nút lớn, rồi ba chip, rồi sáu card cuộn ngang — cả ba lượt
 * đều bị gỡ, và đều vì cùng một lý do: chúng trỏ tới **đúng sáu công cụ** mà
 * khối "Khám phá tương tác" ngay bên dưới đã bày ra kèm ảnh và mô tả. Người
 * vào lần đầu phải chọn hai lần cho cùng một việc.
 *
 * Ba thẻ này khác về bản chất, không khác về kiểu dáng: chúng là **nội dung
 * động** — một bài cụ thể vừa đăng, một chủ đề cụ thể đang có nhiều bài — chứ
 * không phải lối tắt tới tính năng. Chúng đổi khi kho đổi, và không khối nào
 * khác trên trang chủ nói được điều đó ở vị trí này.
 *
 * Nếu lượt sau lại thấy chúng thừa, phép thử là: *nội dung của thẻ có đổi theo
 * kho không?* Thẻ trỏ tới một trang cố định thì không thuộc về đây.
 *
 * ## Vì sao chỉ một thẻ trên điện thoại
 *
 * Hero vừa được hạ 19% chiều cao để khối sau lộ ra. Xếp ba thẻ kính mờ chồng
 * dọc trên màn 360px là trả lại nhiều hơn số vừa lấy được, và đúng thứ vừa bị
 * báo lỗi ở bảng điều khiển Hệ Mặt Trời: một khối phụ cao bằng nửa khung nhìn.
 *
 * Thẻ được giữ lại là **bài mới nhất**, vì nó là thứ duy nhất trong ba cái mà
 * người đọc không tìm được ở chỗ nào khác trong màn hình đầu tiên.
 *
 * ## Vì sao là Server Component
 *
 * Toàn chữ và liên kết. Dữ liệu do trang chủ truyền xuống — nó đã truy vấn
 * `getLatestArticles` và `getTagsWithArticles` cho các khối bên dưới, nên khối
 * này không thêm một lượt đọc cơ sở dữ liệu nào.
 */
export async function HeroPreviewCards({
  latest,
  tag,
  locale,
}: {
  latest: ArticleCard | null;
  tag: TagChip | null;
  locale: Locale;
}) {
  const t = await getTranslations("home");

  /*
   * Mô hình được chọn xoay vòng theo NGÀY, không cố định và cũng không ngẫu
   * nhiên.
   *
   * Cố định thì thẻ này thành một quảng cáo đứng yên. Ngẫu nhiên mỗi lần render
   * thì phá prerender tĩnh — trang chủ là ISR, hai lượt dựng cho hai kết quả
   * khác nhau là một khác biệt không giải thích được.
   *
   * Chia theo số ngày kể từ epoch: trong cùng một ngày mọi lượt dựng cho cùng
   * một kết quả, và sang ngày mới thì đổi.
   */
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const model = MODEL_STEPS[dayIndex % MODEL_STEPS.length];

  const cards = [
    latest && {
      key: "latest",
      href: `/articles/${latest.slug}`,
      Icon: FileText,
      label: t("previewLatest"),
      title: pick(locale, latest.title, latest.titleEn),
      note: pickName(locale, latest.category),
      accent: latest.category.color,
      /** Thẻ duy nhất còn lại trên điện thoại — xem chú thích đầu file */
      keepOnMobile: true,
    },
    {
      key: "model",
      href: model.href,
      Icon: Boxes,
      label: t("previewModel"),
      title: pick(locale, model.name, model.nameEn),
      note: pick(locale, model.scale, model.scaleEn),
      accent: model.color,
      keepOnMobile: false,
    },
    tag && {
      key: "tag",
      href: `/tags/${tag.slug}`,
      Icon: TagIcon,
      label: t("previewTopic"),
      title: pickName(locale, tag),
      note: t("previewTopicCount", { count: tag._count.articles }),
      accent: tag.color ?? "#38bdf8",
      keepOnMobile: false,
    },
  ].filter((card) => card !== null);

  if (cards.length === 0) return null;

  return (
    <ul className="grid gap-2.5 sm:grid-cols-3">
      {cards.map((card) => (
        <li
          key={card.key}
          className={card.keepOnMobile ? undefined : "hidden sm:block"}
        >
          {/* Kính mờ: nền trắng rất nhạt + blur, KHÔNG phải một khối màu.
              Hero có ảnh thiên hà chạy phía sau; nền đặc sẽ cắt một lỗ vuông
              vào đó, còn nền trong mờ thì để thiên hà đi qua. */}
          <Link
            href={card.href}
            className="group flex h-full items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.06] p-3.5 backdrop-blur-md transition-[border-color,background-color] duration-300 ease-out hover:border-white/30 hover:bg-white/[0.11] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span
              aria-hidden
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10"
              style={{ color: card.accent }}
            >
              <card.Icon className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium tracking-widest text-white/45 uppercase">
                {card.label}
              </span>
              {/* `line-clamp-2` chứ không `truncate`: tiêu đề bài tiếng Việt
                  thường dài, và cắt ở một dòng thì ba thẻ cạnh nhau đều kết
                  thúc bằng dấu ba chấm mà không thẻ nào đọc được. */}
              <span className="mt-0.5 block line-clamp-2 text-sm font-semibold text-white/95">
                {card.title}
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs text-white/50">
                {card.note}
                <ArrowRight className="size-3 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
