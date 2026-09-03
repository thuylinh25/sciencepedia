import { getTranslations } from "next-intl/server";
import { Eye, FileText, Library, Microscope } from "lucide-react";

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

  // Icon dùng lucide chứ không dùng emoji: emoji render khác nhau theo hệ điều
  // hành (Segoe UI Emoji trên Windows, Apple Color Emoji trên macOS), không
  // nhận màu theme, và không chỉnh được kích thước theo thang chữ.
  const items = [
    { value: stats.articles, label: t("statsArticles"), Icon: FileText },
    { value: stats.categories, label: t("statsFields"), Icon: Microscope },
    { value: stats.tags, label: t("statsTopics"), Icon: Library },
    { value: stats.views, label: t("statsReaders"), Icon: Eye },
  ];

  return (
    <Reveal as="section" className="container-page -mt-10">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm md:grid-cols-4">
        {items.map(({ value, label, Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 bg-card px-4 py-6 sm:py-8"
          >
            <Icon
              aria-hidden
              className="order-1 size-5 text-primary-strong sm:size-6"
            />
            <dt className="order-3 text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {label}
            </dt>
            {/* 48px là cỡ cho desktop. Ở 390px bốn ô nằm 2×2 và nhãn "Chủ đề
                đã có bài" phải xuống dòng, nên thang phải bắt đầu thấp hơn
                nhiều rồi mới lên — 48px ngay từ mobile sẽ đẩy band cao gấp đôi
                và dìm phần nội dung xuống dưới màn hình đầu. */}
            <dd className="order-2 font-display text-4xl leading-none font-bold tracking-tight tabular-nums sm:text-5xl lg:text-[48px]">
              <Counter value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
