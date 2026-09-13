import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/**
 * Một mục của trang tĩnh dài.
 *
 * `id` KHÔNG đổi theo ngôn ngữ, dù tiêu đề thì có. Neo `#luu-tru` được chép
 * vào email, vào hồ sơ xét duyệt ứng dụng Facebook, vào tài liệu nội bộ — nếu
 * nó đổi theo locale thì cùng một đường dẫn sẽ hỏng khi người nhận đang xem
 * bản tiếng còn lại.
 */
export type PageSection = { id: string; title: string; body: ReactNode };

/** Khung dùng chung cho các trang tĩnh (chính sách, điều khoản, liên hệ). */
export async function StaticPage({
  title,
  updatedAt,
  intro,
  sections,
  children,
}: {
  title: string;
  updatedAt?: string;
  /** Đoạn dẫn, đặt trên mục lục — nói trang này là gì trước khi liệt kê mục */
  intro?: ReactNode;
  /**
   * Nội dung có cấu trúc. Truyền vào thì khung tự dựng mục lục từ chính danh
   * sách này, nên không có đường nào để mục lục lệch với nội dung — khác hẳn
   * việc viết tay hai danh sách song song rồi quên sửa một bên.
   */
  sections?: PageSection[];
  /** Nội dung tự do, cho trang ngắn không cần mục lục */
  children?: ReactNode;
}) {
  // Nhãn này từng bị ghim cứng tiếng Việt nên bản /en cũng hiện "Cập nhật lần cuối"
  const t = await getTranslations("common");
  // Dùng lại nhãn "Mục lục" của bài viết thay vì thêm một khoá thứ hai cùng
  // nghĩa: hai khoá đồng nghĩa thì sớm muộn hai bản dịch sẽ lệch nhau.
  const tArticle = await getTranslations("article");

  return (
    <div className="container-prose py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {title}
      </h1>
      {updatedAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated", { date: updatedAt })}
        </p>
      )}

      {intro && (
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}

      {/* Mục lục chỉ từ md trở lên.

          Trên điện thoại, một danh sách bảy dòng đặt ngay đầu trang đẩy nội
          dung thật xuống gần hết một màn hình — mà lợi ích của nó ở đó gần
          bằng không: cuộn bằng ngón tay qua bảy mục ngắn nhanh hơn là đọc mục
          lục rồi chạm đúng dòng. Trên màn hình rộng thì ngược lại, nó là bản
          đồ cho một tài liệu mà người ta thường vào để tìm ĐÚNG MỘT mục (xoá
          dữ liệu, liên hệ) chứ không để đọc từ đầu. */}
      {sections && sections.length > 0 && (
        <nav
          aria-label={tArticle("tableOfContents")}
          className="mt-10 hidden rounded-2xl border bg-muted/30 p-6 md:block"
        >
          <h2 className="text-xs font-semibold tracking-widest text-foreground/80 uppercase">
            {tArticle("tableOfContents")}
          </h2>
          <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id} className="flex gap-2 text-sm leading-6">
                <span
                  aria-hidden
                  className="w-4 shrink-0 text-right font-mono text-xs text-muted-foreground/70"
                >
                  {index + 1}
                </span>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary-strong hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="article-prose mt-8">
        {sections?.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            {/* `id` nằm trên chính thẻ h2: `.article-prose` đã đặt
                `scroll-mt-28` cho h2, nên neo dừng dưới thanh điều hướng dính
                thay vì bị nó che mất tiêu đề. */}
            <h2 id={section.id}>{section.title}</h2>
            {section.body}
          </section>
        ))}
        {children}
      </div>
    </div>
  );
}
