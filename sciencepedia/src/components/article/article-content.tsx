import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugify } from "@/lib/utils";
import { remarkGlossary, type GlossaryMap } from "@/lib/glossary";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { GlossaryTerm } from "@/components/glossary/glossary-term";
import { ScrollStrip } from "@/components/ui/scroll-strip";

/**
 * Thêm tiền tố locale cho link nội bộ viết trong Markdown.
 *
 * Nội dung bài viết link tới bài khác bằng `/articles/<slug>` — cố ý KHÔNG
 * mang tiền tố ngôn ngữ, vì cùng một chuỗi Markdown phải dùng được cho cả
 * `content` (vi) lẫn `contentEn`. Nhét `/vi/` vào nội dung thì bản tiếng Anh
 * sẽ trỏ người đọc sang trang tiếng Việt.
 *
 * Nhưng `routing.localePrefix` là `"always"`, tức KHÔNG có route nào ở
 * `/articles/...` — mọi đường đều là `/vi/...` hoặc `/en/...`. Nên href thiếu
 * tiền tố trả về 404. Đó là lỗi đã gặp thật khi bấm vào link trong bài
 * "Năng lượng là gì".
 *
 * Chỗ đúng để vá là tầng render, không phải nội dung: nội dung giữ trung lập,
 * còn tiền tố sinh ra theo locale đang xem.
 *
 * Bỏ qua: link ngoài (http…), neo trong trang (#…), đường giao thức tương đối
 * (//host), và link đã mang sẵn tiền tố.
 */
const HAS_LOCALE = new RegExp(`^/(${locales.join("|")})(/|$)`);

export function localizeHref(href: string | undefined, locale: string) {
  if (!href) return href;
  if (!href.startsWith("/")) return href;
  if (href.startsWith("//")) return href;
  if (HAS_LOCALE.test(href)) return href;
  return `/${locale}${href}`;
}

/**
 * Gom toàn bộ chữ trong một cây ReactNode thành chuỗi phẳng.
 *
 * `String(children)` trước đây chỉ đúng khi tiêu đề là chữ trơn. Hễ tiêu đề có
 * định dạng nội tuyến — "## Định luật **Hubble**", "## Hằng số `c`", tiêu đề
 * chứa link — thì children là một mảng phần tử React và String() cho ra
 * "[object Object]". Kết quả: id sinh ra rác, không khớp với id mà
 * `extractHeadings` tính từ Markdown, và mọi mục lục có tiêu đề định dạng đều
 * trỏ vào hư không. Bài toán học và bài có thuật ngữ là nhóm dính nhiều nhất.
 */
function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }
  return "";
}

/** Id của heading phải khớp với `extractHeadings`, vốn đã bỏ các ký tự định dạng. */
const headingId = (children: ReactNode) =>
  slugify(nodeToText(children).replace(/[*_`]/g, "").trim());

/**
 * Trình bày nội dung Markdown của bài viết.
 *
 * Id của heading được sinh bằng chính `slugify` mà mục lục dùng, nên hai bên
 * luôn khớp nhau (rehype-slug giữ nguyên dấu tiếng Việt nên sẽ lệch).
 * react-markdown mặc định không cho HTML thô đi qua, nên nội dung do biên tập
 * viên nhập không thể chèn script.
 */
function buildComponents(locale: string, glossary: GlossaryMap): Components {
  const components: Components & {
    "glossary-term": (props: { children?: ReactNode; "data-key"?: string }) => ReactNode;
  } = {
    /**
     * `[[thuật ngữ]]` — xem `remarkGlossary`. Khoá không có mục từ thì hiện
     * như chữ thường: bài được viết trước từ điển là chuyện bình thường, và
     * một tooltip rỗng tệ hơn không có tooltip. `npm run glossary:check` liệt
     * kê các khoá đang thiếu.
     */
    "glossary-term": ({ children, "data-key": key }) => {
      const entry = key ? glossary[key] : undefined;
      if (!entry) return <>{children}</>;
      return (
        <GlossaryTerm slug={entry.slug} term={entry.term} definition={entry.definition}>
          {children}
        </GlossaryTerm>
      );
    },
    h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
    a: ({ href, children }) => {
      const external = href?.startsWith("http");
      return (
        <a
          href={localizeHref(href, locale)}
          {...(external
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) =>
      typeof src === "string" ? (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- kích thước ảnh trong Markdown không biết trước */}
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl shadow-lg"
          />
          {alt && (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              {alt}
            </figcaption>
          )}
        </figure>
      ) : null,
    table: ({ children }) => (
      // Vùng cuộn ngang phải nhận được focus, nếu không người dùng bàn phím không
      // có cách nào xem phần bảng nằm ngoài khung (WCAG 2.1.1).
      //
      // ĐỪNG thêm `[&_td]:px-4` hay biến thể first/last vào đây để trị chuyện ô
      // dính sát viền. Đã thử hai lần và cả hai đều không ăn: utility của Tailwind
      // nằm trong `@layer utilities`, còn `.article-prose` không nằm trong layer
      // nào, mà lớp cascade đứng trên độ ưu tiên. Luật đệm ô nằm ở globals.css,
      // ngay dưới định nghĩa `.article-prose`.
      <ScrollStrip
        rootClassName="my-8"
        className="rounded-2xl border"
        trackClassName="-mt-1"
        tabIndex={0}
      >
        <table className="my-0 w-full">{children}</table>
      </ScrollStrip>
    ),
    /**
     * Blockquote có NỀN, nên phải tự lo cả bốn phía — nhưng phần đệm nằm ở
     * globals.css, cùng lý do layer như bảng ở trên. Ở đây chỉ còn màu và bo góc,
     * hai thứ typography không đụng tới nên utility vẫn ăn.
     */
    blockquote: ({ children }) => (
      <blockquote className="rounded-r-xl border-l-4 border-accent bg-accent/5">
        {children}
      </blockquote>
    ),
  };
  // react-markdown chỉ khai kiểu cho thẻ HTML chuẩn; thẻ tự đặt đi qua ép kiểu
  return components as Components;
}

export function ArticleContent({
  markdown,
  locale = defaultLocale,
  glossary = {},
}: {
  markdown: string;
  /** Locale đang xem — quyết định tiền tố của link nội bộ. */
  locale?: Locale;
  /**
   * Mục từ cho `[[...]]`, tra sẵn trên server bằng `getGlossaryForMarkdown`.
   * Không truyền (form quản trị xem trước) thì thuật ngữ hiện như chữ thường.
   */
  glossary?: GlossaryMap;
}) {
  return (
    <div className="article-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGlossary]}
        components={buildComponents(locale, glossary)}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
