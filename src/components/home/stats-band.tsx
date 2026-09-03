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
            className="flex flex-col items-center justify-center gap-1 bg-card px-4 py-6 sm:py-8"
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
            {/* KHÔNG dùng `leading-none` ở đây.

                Với chữ số, `leading-none` cho hộp dòng cao đúng bằng cỡ chữ,
                nhưng chữ số không có nét thò xuống — nên phần khoảng trống
                chân chữ nằm trong hộp mà không có nét nào. Flexbox căn giữa
                theo HỘP, vậy nên nét chữ nhìn thấy được bị đẩy lên trên tâm
                thật vài pixel. Ba ô cạnh nhau cùng lệch một hướng thì cả dải
                trông như bị dồn lên đầu — đúng thứ đã bị báo hai lần.

                `leading-tight` cho hộp cân hơn và mắt đọc ra là giữa. */}
            <dd className="order-2 font-display text-4xl leading-tight font-bold tracking-tight tabular-nums sm:text-5xl lg:text-[48px]">
              <Counter value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
