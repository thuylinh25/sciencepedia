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
    /* `relative z-10` là bắt buộc, không phải thừa.

       Thanh này thụt lên 40px (`-mt-10`) để chờm vào đáy hero. Hero là
       `position: relative`, còn khối này nếu để tĩnh thì bị vẽ ở lớp DƯỚI —
       phần tử có position luôn vẽ trên phần tử tĩnh, bất kể thứ tự DOM. Hệ quả
       là dải gradient `h-20` ở đáy hero phủ lên 40px trên cùng của thanh số và
       **cắt cụt phần đầu các icon**, khiến cả dải trông như bị dồn xuống.

       Đó là lời giải thật cho hai lần báo "nội dung bị lệch" — không phải lỗi
       căn giữa. */
    <Reveal as="section" className="container-page relative z-10 -mt-10">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm md:grid-cols-4">
        {items.map(({ value, label, Icon }) => (
          <div
            key={label}
            /* `justify-center` là bắt buộc, không phải trang trí.

               Các ô trong lưới bị kéo cao bằng ô cao nhất, mà nhãn dài nhất
               ("Bài viết đã xuất bản") xuống hai dòng ở một số bề rộng. Không
               có `justify-center` thì `flex-col` dồn nội dung lên đầu ô, và cả
               dải trông như bị lệch lên — thấy rõ trong ảnh chụp màn hình:
               khoảng trống dưới gấp rưỡi khoảng trống trên. */
            /* Đệm hẹp lại dưới `sm`. Ở 360px, lưới 2 cột cho mỗi ô khoảng
               160px, và với `px-4` thì chữ chỉ còn 127px — đủ hẹp để cả hai
               nhãn dài nhất xuống hai dòng. `px-3` trả lại 8px mỗi bên.

               `py-4` thay `py-5`: cả dải cao 2 hàng, nên mỗi 8px cắt ở đây
               tiết kiệm 16px trên một màn hình chỉ cao chừng 780px. */
            className="flex flex-col items-center justify-center gap-0.5 bg-card px-3 py-4 sm:px-4 sm:py-6"
          >
            {/* Icon nằm CÙNG DÒNG với con số, không xếp chồng bên trên.

                Xếp chồng thì mỗi ô mất thêm một hàng (icon ~24px) cộng một
                khoảng cách, tức cả dải cao thêm chừng 30px mà không thêm thông
                tin nào. Đặt ngang: cùng lượng thông tin, thấp hơn hẳn, và icon
                đứng cạnh con số cũng nói rõ hơn nó chú thích cho cái gì.

                KHÔNG dùng `leading-none` cho con số. Chữ số không có nét thò
                xuống, nên `leading-none` để lại khoảng trống chân chữ rỗng
                trong hộp; flexbox căn giữa theo HỘP nên nét nhìn thấy được bị
                đẩy lên trên tâm thật. */}
            {/* `text-3xl` dưới `sm`, không phải `text-4xl`. Con số cao nhất
                trong kho có hai chữ số; 36px chỉ để chiếm chỗ chứ không giúp
                đọc nhanh hơn 30px, mà mỗi hàng cao thêm 7px thì cả dải cao
                thêm 14px. Từ `sm` giữ nguyên 42px như cũ. */}
            <dd className="flex items-center gap-2.5 font-display text-3xl leading-tight font-bold tracking-tight tabular-nums sm:text-[42px]">
              <Icon
                aria-hidden
                className="size-5 shrink-0 text-primary-strong sm:size-6"
              />
              <Counter value={value} />
            </dd>
            <dt className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {label}
            </dt>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
