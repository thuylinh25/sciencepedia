import { getLocale, getTranslations } from "next-intl/server";
import {
  Disc3,
  Aperture,
  Mail,
  Orbit,
  Scaling,
  Sparkles,
  Telescope,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getRootCategories, getSiteStats } from "@/server/queries";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { formatMeasure } from "@/lib/utils";

/** Địa chỉ liên hệ, viết một chỗ để dòng chữ và link `mailto:` không lệch nhau. */
const CONTACT_EMAIL = "hello@sciencepedia.dev";

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
  const figures = [
    { value: formatMeasure(stats.articles, locale), label: t("statArticles") },
    { value: formatMeasure(tools.length - 1, locale), label: t("statTools") },
    { value: formatMeasure(stats.categories, locale), label: t("statFields") },
    { value: formatMeasure(stats.tags, locale), label: t("statTopics") },
  ];

  const linkClass =
    "text-sm leading-7 text-muted-foreground transition-colors hover:text-primary-strong hover:underline hover:underline-offset-4";

  const headingClass =
    "text-xs font-semibold tracking-widest text-foreground/80 uppercase";

  return (
    <footer className="mt-24 border-t bg-muted/30">
      {/* Dải số liệu đứng ĐẦU footer, trên các cột liên kết.

          Nó trả lời "đây là nền tảng cỡ nào" — câu hỏi đến trước "đi đâu tiếp",
          và người cuộn hết một trang nội dung thì đang ở đúng lúc để hỏi nó. */}
      <div className="border-b">
        <div className="container-page py-10">
          <p className={headingClass}>{t("statsTitle")}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.label}>
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                    {figure.value}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {figure.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* gap-10 → gap-x-12 gap-y-12: cột thưa hơn chừng 20% theo yêu cầu, và
          khoảng cách dọc bằng khoảng cách ngang để lưới không lệch nhịp khi
          xuống hai hàng trên tablet. */}
      <div className="container-page py-14">
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-5">
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

            {fields.length > 0 && (
              <>
                <h2 className={`${headingClass} mt-8`}>{t("fields")}</h2>
                <ul className="mt-4 space-y-1">
                  {fields.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

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
