import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickName } from "@/lib/i18n-content";

type Field = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  icon: string | null;
  _count: { articles: number };
};

/**
 * Emoji cho từng lĩnh vực gốc, khoá theo slug.
 *
 * **Vì sao emoji ở đây mà `StatsBand` cũ lại cấm emoji.** Quy tắc cũ đúng cho
 * chỗ của nó: ở đó icon phải đứng cạnh một con số cỡ 42px và phải nhận màu
 * theme, mà emoji thì không chỉnh được cỡ theo thang chữ và không đổi màu.
 * Ở đây icon đứng cạnh một nhãn cỡ chữ thường, thuần trang trí, và emoji cho
 * mỗi lĩnh vực một hình ảnh riêng mà bộ icon nét mảnh không cho được — sáu
 * icon lucide cùng màu accent trông na ná nhau, sáu emoji thì không.
 *
 * **Khoá theo slug, không theo tên.** Tên hiển thị đổi theo ngôn ngữ; slug thì
 * không. Khoá theo tên là để bản tiếng Anh mất sạch emoji.
 *
 * Lĩnh vực không có trong bảng vẫn chạy, chỉ là không có emoji — thiếu một
 * hình trang trí rẻ hơn nhiều so với việc chặn một lĩnh vực mới khỏi hero.
 */
const FIELD_EMOJI: Record<string, string> = {
  "vu-tru": "🪐",
  "vat-ly": "⚛️",
  "sinh-hoc": "🧬",
  "trai-dat-va-khi-hau": "🌍",
  "suc-khoe": "🫀",
  "hoa-hoc": "🧪",
  "cong-nghe-va-ky-thuat": "🤖",
};

/**
 * Lối tắt vào từng lĩnh vực, đặt ngay dưới ô tìm kiếm trên hero.
 *
 * **Vì sao có khối này khi trang chủ đã có mục "Duyệt theo lĩnh vực".** Ba khối
 * dễ bị nhầm là làm cùng một việc, nên phân vai rõ:
 *
 *  - Khối này — người mở trang lần đầu chưa biết gõ gì vào ô tìm kiếm. Nó trả
 *    lời đúng một câu hỏi: "bắt đầu từ đâu?".
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
 * link tới trang không tồn tại. Cùng lý do, bản mô tả đề nghị thêm chip "Thần
 * kinh học" và "AI" — hai lĩnh vực KHÔNG tồn tại trong taxonomy, nên chip cho
 * chúng sẽ là hai liên kết 404. Muốn có thì phải dựng nhánh taxonomy và viết
 * bài trước, đó là việc của `knowledge-architect` chứ không phải của hero.
 */
export async function HeroFields({
  fields,
  locale,
}: {
  fields: Field[];
  locale: Locale;
}) {
  const t = await getTranslations("home");

  /*
   * Bỏ lĩnh vực chưa có bài nào.
   *
   * Tính đến 2026-09-11, "Hoá học" và "Công nghệ và Kỹ thuật" đều 0 bài. Một
   * chip dẫn tới trang rỗng tệ hơn hẳn một chip vắng mặt: người bấm vào đã bỏ
   * ra một cú nhấp và nhận lại con số không, và đó là ấn tượng đầu tiên về độ
   * đầy đặn của cả kho.
   *
   * Lọc theo dữ liệu chứ không theo danh sách viết cứng, nên ngày hai lĩnh vực
   * đó có bài đầu tiên thì chúng tự xuất hiện, không cần ai nhớ để sửa chỗ này.
   */
  const shown = fields
    .filter((field) => field._count.articles > 0)
    .sort((a, b) => b._count.articles - a._count.articles);

  if (shown.length === 0) return null;

  return (
    <nav aria-label={t("heroCategoriesLabel")} className="w-full max-w-2xl">
      <p className="mb-2.5 text-xs font-medium tracking-widest text-white/55 uppercase">
        {t("heroCategoriesLabel")}
      </p>
      <ul className="flex flex-wrap gap-2">
        {shown.map((field) => (
          <li key={field.id}>
            {/* min-h-11 = 44px vùng chạm. Hero là nơi ngón cái bấm nhiều nhất
                trên di động, không áp dụng ngoại lệ 40px của thanh header.

                Quầng sáng khi rê chuột dùng `shadow` màu accent chứ không dùng
                gradient: yêu cầu nói rõ "không gradient quá gắt", và một quầng
                sáng toả ra ngoài viền cho cảm giác vật thể phát sáng, trong khi
                gradient nền chỉ làm chip đổi màu. */}
            <Link
              href={`/categories/${field.slug}`}
              className="group flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white/90 backdrop-blur transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/50 hover:bg-white/[0.16] hover:text-white hover:shadow-[0_0_22px_-6px_var(--color-accent)] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span aria-hidden className="text-base leading-none">
                {FIELD_EMOJI[field.slug] ?? "•"}
              </span>
              {pickName(locale, field)}
              {/* Số bài hiện SẴN, không đợi rê chuột.
                  Trên thiết bị cảm ứng không có trạng thái hover, nên "hiện khi
                  hover" đồng nghĩa với "không bao giờ hiện" cho phần lớn người
                  đọc trang chủ. Để sẵn ở mức chữ mờ thì cả hai loại thiết bị
                  đều đọc được, và khi rê chuột nó sáng lên thành nhấn mạnh. */}
              <span className="text-xs text-white/45 tabular-nums transition-colors group-hover:text-white/75">
                {field._count.articles}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
