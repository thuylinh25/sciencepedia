import { getTranslations } from "next-intl/server";

import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";

/**
 * Bốn con số thật, không làm tròn lên, không "35+".
 *
 * "Lượt đọc" ở lại dù còn rất nhỏ: đường ghi lượt đọc chạy đúng
 * (`ViewCounter` → `POST /api/articles/[id]/view` → `incrementViews`), site mới
 * lên nên chưa có lưu lượng. Gỡ ô này đi rồi lắp lại khi có traffic là đổi bố
 * cục hai lần vì một lý do tạm thời.
 *
 * Nhãn phải khớp đúng thứ con số đếm — xem `getSiteStats`, nơi hai truy vấn đã
 * được vá lại cho khớp với "Lĩnh vực khoa học" và "Chủ đề đã có bài".
 *
 * ## Vì sao một dòng chứ không phải bốn ô
 *
 * Bản cũ là lưới 4 ô có viền, đặt chờm lên đáy hero. Nó cao chừng 100px và
 * đứng ở vị trí đắt nhất trang: giữa hero và khối nội dung đầu tiên. Tức là
 * thứ đầu tiên người đọc gặp sau tiêu đề không phải khoa học mà là một bảng
 * số — và với 57 bài, 141 lượt đọc thì bảng số đó cũng chưa chứng minh được
 * điều gì. Nó trả giá bằng chiều dọc mà không mua lại được uy tín.
 *
 * Bốn ô có viền còn kéo theo một cái giá thứ hai khó gỡ hơn: nó đọc ra như
 * một **dashboard**. Bách khoa toàn thư thì không có dashboard ở trang chủ.
 *
 * Một dòng chữ giữ nguyên đủ bốn con số nhưng chỉ còn chừng 24px, và quan
 * trọng hơn là nó tự xếp mình đúng hạng: một dòng chú thích, không phải một
 * mục. Bỏ luôn icon vì ở cỡ này icon chỉ thêm nhiễu — nhãn đã nói rõ con số
 * đếm cái gì.
 *
 * ## Vì sao đứng SAU "Bài viết nổi bật"
 *
 * Số liệu là thứ người ta tra khi đã quan tâm, không phải thứ làm người ta
 * quan tâm. Đặt sau khối bài nổi bật thì nó đóng đúng vai trò: người vừa đọc
 * xong vài tựa đề, thấy bốn con số, và biết kho này lớn cỡ nào. Đặt trước thì
 * nó chỉ là một chướng ngại giữa tiêu đề và bài viết.
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
    <Reveal as="section" className="container-page">
      {/* `<dl>` vẫn là thẻ đúng — đây là bốn cặp tên/giá trị, và việc nó được
          vẽ thành một dòng không đổi quan hệ ngữ nghĩa giữa chúng.

          `flex-wrap` + `justify-center`: ở 360px bốn cặp không lọt một dòng,
          và xuống hai dòng cân nhau vẫn thấp hơn hẳn lưới cũ. */}
      <dl className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1.5 border-t pt-5 text-sm text-muted-foreground sm:gap-x-5">
        {items.map(({ value, label }, index) => (
          <div key={label} className="flex items-baseline gap-x-3 sm:gap-x-5">
            {/* Dấu chấm giữa là TRANG TRÍ, nên `aria-hidden` và nằm ngoài mọi
                cặp dt/dd. Trình đọc màn hình đọc "57, Bài viết, 7, Lĩnh
                vực…" — dấu phân cách chỉ dành cho mắt. */}
            {index > 0 && (
              <span aria-hidden className="text-border select-none">
                •
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              {/* Con số giữ `font-display` và `tabular-nums` như bản cũ: đây
                  là phần duy nhất của dòng cần đọc nhanh, và `tabular-nums`
                  giữ bề rộng chữ số ổn định khi Counter đếm lên.

                  `text-foreground` chứ không `text-primary-strong`: vàng
                  thương hiệu ở đây sẽ kéo mắt về bốn con số đúng lúc ta vừa
                  quyết định hạ chúng xuống hàng phụ. Đậm hơn nền chữ xung
                  quanh là đủ để tách. */}
              <dd className="font-display text-base font-bold tabular-nums text-foreground">
                <Counter value={value} />
              </dd>
              <dt>{label}</dt>
            </div>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
