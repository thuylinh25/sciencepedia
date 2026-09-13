import { getLocale, getTranslations } from "next-intl/server";
import {
  Aperture,
  Compass,
  Disc3,
  FileText,
  Layers,
  Mail,
  Orbit,
  Scaling,
  Sparkles,
  Tags,
  Telescope,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getRootCategories, getSiteStats } from "@/server/queries";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { CountUp } from "@/components/layout/count-up";
import { formatMeasure } from "@/lib/utils";

/**
 * Địa chỉ liên hệ, viết một chỗ để dòng chữ và link `mailto:` không lệch nhau.
 *
 * Hộp thư CÓ THẬT, do chủ dự án cung cấp. Giá trị trước đó
 * (`contact@sciencepedia.vn`) là địa chỉ tôi tự đặt ra và không ai nhận thư —
 * một địa chỉ như thế in ra footer còn tệ hơn không in gì, vì người đọc bỏ
 * công viết rồi im lặng.
 *
 * Dùng Gmail chứ không phải địa chỉ theo tên miền riêng là lựa chọn có ý thức
 * trong giai đoạn này: một hộp thư đọc được ngay hơn hẳn một địa chỉ đẹp mà
 * chưa cấu hình xong. Đổi sang tên miền riêng thì sửa đúng dòng dưới đây.
 */
const CONTACT_EMAIL = "sciencepedia.contact@gmail.com";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const year = new Date().getFullYear();

  // Cùng lý do như thanh điều hướng: danh sách ghim cứng bỏ sót lĩnh vực mới
  let categories: { slug: string; name: string; nameEn: string }[] = [];
  try {
    categories = await getRootCategories();
  } catch (error) {
    console.warn("[footer] không nạp được danh mục:", (error as Error).message);
  }

  /*
   * Số liệu ĐO ĐƯỢC, không phải số tròn cho đẹp.
   *
   * Bản mô tả đề nghị một dải "12.500+ bài viết · 120+ mô hình · 50+ công cụ".
   * Kho thật có 58 bài, 6 công cụ và 3 mô hình. In những con số kia là bịa ra
   * quy mô mình không có — và một dải số liệu sai ở footer thì phá đúng thứ nó
   * sinh ra để xây: độ tin cậy. Cùng phán quyết đã ghi cho nhãn "phổ biến"
   * trong `interactive-explore.tsx`: gắn một nhãn dựa trên dữ liệu mình không
   * có thì rẻ tiền đúng một lần, rồi người đọc thôi tin mọi nhãn khác.
   *
   * Nên dải này in số thật, và nó sẽ tự lớn lên khi kho lớn lên.
   */
  let stats = { articles: 0, categories: 0, tags: 0, views: 0 };
  try {
    stats = await getSiteStats();
  } catch (error) {
    console.warn("[footer] không nạp được thống kê:", (error as Error).message);
  }

  /**
   * Ba cột liên kết, mỗi cột trả lời một câu hỏi khác nhau.
   *
   * Bản trước dồn cả lĩnh vực, bốn mô hình 3D và trợ lý AI vào một cột dài
   * mười mục — mắt đọc thành một danh sách phẳng không có thứ bậc.
   *
   * Lượt này tách tiếp một bậc nữa: "Khám phá" giữ ba lối vào toàn kho, còn
   * các lĩnh vực xuống thành một nhóm RIÊNG có tiêu đề. Mười mục liền nhau
   * dưới một tiêu đề đọc ra như bức tường chữ; ba mục rồi năm mục dưới hai
   * tiêu đề thì mắt lướt được.
   *
   * Cột "Tài nguyên" (RSS · API · Nguồn dữ liệu · Roadmap · GitHub) đã được
   * cân nhắc và **bỏ hẳn**: cả năm đều chưa tồn tại, dựng cột đó là dựng năm
   * link chết. Thêm lại từng mục khi có thật.
   */
  const explore = [
    { href: "/articles", label: tNav("articles") },
    { href: "/categories", label: tNav("categories") },
    { href: "/tags", label: t("topics") },
  ];

  const fields = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: locale === "en" ? category.nameEn : category.name,
  }));

  /*
   * Công cụ mang icon, ba cột kia thì không.
   *
   * Đây là chỗ Sciencepedia khác một trang blog khoa học, nên nó được ưu tiên
   * thị giác — nhưng ưu tiên bằng ICON chứ không bằng cỡ chữ hay màu: cỡ chữ
   * khác nhau giữa các cột làm hàng chữ so le, còn màu thì phá bảng màu hiện
   * tại. Icon thêm một tầng nhận diện mà không đụng tới hai thứ đó.
   */
  const tools = [
    { href: "/solar-system", label: tNav("solarSystem"), icon: Orbit },
    { href: "/milky-way", label: tNav("milkyWay"), icon: Disc3 },
    { href: "/universe", label: tNav("universe"), icon: Aperture },
    { href: "/space-map", label: tNav("spaceMap"), icon: Telescope },
    { href: "/zoom", label: tNav("zoom"), icon: Scaling },
    { href: "/assistant", label: tNav("assistant"), icon: Sparkles },
  ];

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/contact", label: t("contact") },
  ] as const;

  /* Bốn con số, tất cả đếm được. "Công cụ tương tác" là chính mảng `tools` ở
     trên trừ trợ lý AI — suy ra từ đó chứ không viết một số riêng, để hai chỗ
     không lệch nhau khi thêm công cụ mới. */
  /* Icon nhỏ phía trên mỗi con số: bốn ô cạnh nhau cùng cỡ chữ thì mắt phải
     đọc nhãn mới phân biệt được ô nào là ô nào. Một hình nhỏ cho mỗi ô tạo
     điểm neo trước khi chữ được đọc.

     SỐ ĐỂ NGUYÊN, KHÔNG THÊM DẤU "+". Bản mô tả đề nghị "57+" và "20+", nhưng
     con số ở đây là phép đếm CHÍNH XÁC đọc từ CSDL — một dấu cộng sau nó vừa
     không thêm thông tin gì, vừa ngụ ý rằng con số thật đang bị giấu. Với một
     bách khoa, độ chính xác của chính dải số liệu này là thứ nó đang quảng
     cáo; làm tròn lên ở đó là tự mâu thuẫn. Đây cũng đúng tinh thần "không
     marketing quá đà" mà yêu cầu nêu ra. */
  /* Mỗi ô một màu nhận dạng riêng, đặt trên ô icon chứ KHÔNG trên con số.

     Con số phải giữ đúng một màu chữ chính ở cả bốn ô: chúng là bốn phép đếm
     cùng loại, và tô mỗi số một màu sẽ ngụ ý chúng khác hạng nhau. Màu đi vào
     ô icon — chỗ nó làm được việc phân biệt mà không nói sai điều gì.

     Bốn màu này trùng bảng màu đã dùng cho thẻ công cụ ở trang chủ
     (`interactive-explore.tsx`), nên toàn site chỉ có MỘT bộ màu phụ. */
  const figures = [
    { n: stats.articles, label: t("statArticles"), icon: FileText, tint: "#3b82f6" },
    { n: tools.length - 1, label: t("statTools"), icon: Compass, tint: "#10b981" },
    { n: stats.categories, label: t("statFields"), icon: Layers, tint: "#8b5cf6" },
    { n: stats.tags, label: t("statTopics"), icon: Tags, tint: "#f59e0b" },
  ].map((figure) => ({ ...figure, value: formatMeasure(figure.n, locale) }));

  const linkClass =
    "text-sm leading-7 text-muted-foreground transition-colors hover:text-primary-strong hover:underline hover:underline-offset-4";

  const headingClass =
    "text-xs font-semibold tracking-widest text-foreground/80 uppercase";

  return (
    /* Lề trên 96px → 56px (72px từ sm).

       96px là khoảng thở hợp lý sau một bài dài, nhưng nó là một con số CỐ
       ĐỊNH áp cho mọi trang, kể cả những trang có nội dung ngắn. Trên trang
       quản trị Người dùng — một bảng vài dòng — 96px lề cộng 40px padding của
       khung thành gần 140px đen trước dải số liệu, và người xem đọc nó là
       "trang bị thiếu nội dung" chứ không phải "bố cục thoáng".

       56px vẫn tách được footer khỏi nội dung (nó còn có thêm đường viền trên
       và nền khác màu để làm việc đó), mà không tạo ra lỗ hổng trên trang
       ngắn. Nới lại ở sm trở lên vì màn hình rộng chịu được khoảng trống
       lớn hơn trước khi nó đọc ra là thiếu sót. */
    <footer className="mt-14 border-t bg-muted/30 sm:mt-18">
      {/* Dải số liệu đứng ĐẦU footer, trên các cột liên kết.

          Nó trả lời "đây là nền tảng cỡ nào" — câu hỏi đến trước "đi đâu tiếp",
          và người cuộn hết một trang nội dung thì đang ở đúng lúc để hỏi nó. */}
      <div className="border-b">
        <div className="container-page py-10">
          {/* Vạch vàng ngắn phía trên tiêu đề.

              Dải này là khối duy nhất trong footer mang số liệu, và nó nằm
              ngay dưới một trang nội dung dài — không có gì đánh dấu chỗ bắt
              đầu thì mắt đọc tiếp như thể vẫn còn trong bài. Một vạch màu
              thương hiệu rẻ hơn một đường kẻ ngang cả bề ngang, và nó không
              cắt trang làm đôi. */}
          <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
          <p className={`${headingClass} mt-4`}>{t("statsTitle")}</p>

          {/* Bốn THẺ thay cho bốn cột chữ trần.

              Bản cũ đặt icon nhỏ nằm trên con số, không viền, không nền. Ở
              bề ngang lớn, bốn cụm chữ trôi trong một dải rộng thì mắt không
              nhóm chúng lại thành một bộ — chúng đọc ra như bốn mẩu rời rạc
              lạc vào đầu footer. Một cái viền mờ quanh mỗi ô làm đúng việc
              nhóm ấy, và đây là chỗ hiếm hoi mà thêm đường nét lại giảm nhiễu.

              Icon chuyển sang ô bo tròn có nền màu, đặt CẠNH con số thay vì
              phía trên: hàng ngang icon–số ngắn hơn cột dọc icon–số–nhãn, nên
              thẻ thấp đi và cả dải bớt chiếm chỗ. */}
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {figures.map((figure) => (
              <div
                key={figure.label}
                className="group rounded-2xl border bg-card/50 p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: figure.tint }}
                  >
                    <figure.icon className="size-5 text-white" />
                  </span>

                  {/* `flex-col-reverse` để MÃ đúng thứ tự ngữ nghĩa (dt trước
                      dd) mà MẮT vẫn thấy con số trước nhãn. Bản cũ giải bài
                      này bằng một `dt` ẩn cộng một nhãn hiện, tức trình đọc
                      màn hình nghe nhãn hai lần. */}
                  <div className="flex min-w-0 flex-col-reverse">
                    <dt className="mt-1 truncate text-sm text-muted-foreground">
                      {figure.label}
                    </dt>
                    <dd>
                      <CountUp
                        value={figure.n}
                        formatted={figure.value}
                        className="block font-display text-4xl font-bold tracking-tight text-foreground tabular-nums transition-colors group-hover:text-primary-strong"
                      />
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* gap-10 → gap-x-12 gap-y-12: cột thưa hơn chừng 20% theo yêu cầu, và
          khoảng cách dọc bằng khoảng cách ngang để lưới không lệch nhịp khi
          xuống hai hàng trên tablet. */}
      <div className="container-page py-14">
        <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="md:col-span-2">
            {/* Logo lớn hơn chừng 12% bằng `scale-110` gắn gốc trái.

                Dùng transform chứ không sửa component Logo: nó còn dùng ở
                header và trong drawer, nơi kích thước hiện tại đã đúng. Phóng
                tại chỗ dùng thì chỉ chỗ này đổi. */}
            <div className="origin-left scale-110">
              <Logo />
            </div>

            {/* 15px và giới hạn 34rem. Cỡ cũ 14px với `max-w-sm` (24rem) cho
                dòng quá ngắn, nên đoạn mô tả vỡ thành nhiều dòng cụt. */}
            <p className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground">
              {t("aboutText")}
            </p>

            {/* Địa chỉ email hiện THÀNH CHỮ, không phải một icon phong bì.

                Bản trước chỉ có icon: người xem phải đoán nó là email, rồi bấm
                vào mới biết địa chỉ — mà trên di động cú bấm ấy mở thẳng ứng
                dụng thư, nên họ không bao giờ đọc được địa chỉ để chép đi nơi
                khác. Một dòng liên hệ có thật là thứ phân biệt một tổ chức với
                một trang cá nhân. */}
            <div className="mt-8">
              <p className={headingClass}>{t("contactTitle")}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_18px_-4px_var(--color-accent)]"
              >
                <Mail className="size-4" aria-hidden />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <nav aria-label={t("explore")}>
            <h2 className={headingClass}>{t("explore")}</h2>
            <ul className="mt-4 space-y-1">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* "Các lĩnh vực" là cột RIÊNG, ngang hàng với "Khám phá".

              Bản trước đặt nó làm tiêu đề thứ hai BÊN TRONG cột Khám phá, và
              ở đó nó đọc ra như một mục con — trong khi lĩnh vực là trục phân
              loại chính của cả kho, ngang vai với "Bài viết" và "Danh mục"
              chứ không nằm dưới chúng. */}
          {fields.length > 0 && (
            <nav aria-label={t("fields")}>
              <h2 className={headingClass}>{t("fields")}</h2>
              <ul className="mt-4 space-y-1">
                {fields.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label={t("tools")}>
            <h2 className={headingClass}>{t("tools")}</h2>
            <ul className="mt-4 space-y-1">
              {tools.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${linkClass} flex items-center gap-2.5`}
                  >
                    <item.icon
                      className="size-4 shrink-0 text-primary-strong/70"
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("legal")}>
            <h2 className={headingClass}>{t("legal")}</h2>
            <ul className="mt-4 space-y-1">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="my-10" />

        {/* Bản quyền tách LÀM HAI câu, và đó là một đính chính chứ không phải
            chuyện bố cục.

            Dòng cũ — "© 2026 Sciencepedia. Nội dung phát hành theo giấy phép
            CC BY-SA 4.0." — đọc ra là TOÀN BỘ trang thuộc CC BY-SA. Không
            đúng: ảnh NASA/ESA thuộc phạm vi công cộng, vài ảnh khác là CC BY
            với điều kiện ghi công riêng, và mã nguồn giao diện không nằm dưới
            giấy phép nội dung nào cả. Một lời tuyên bố giấy phép quá rộng vừa
            sai vừa nguy hiểm: người đọc tin nó rồi dùng lại một bức ảnh theo
            điều kiện không áp dụng cho bức ảnh đó.

            Nên câu thứ hai nói "một số nội dung" và chỉ về trang nội dung —
            nơi giấy phép thật được ghi cạnh từng thứ. */}
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground/85">
          <p>© {year} Sciencepedia.</p>
          <p className="max-w-3xl">{t("licenceNote")}</p>
        </div>
      </div>
    </footer>
  );
}
