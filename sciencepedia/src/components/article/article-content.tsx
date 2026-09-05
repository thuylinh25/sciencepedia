import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugify } from "@/lib/utils";

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
const components: Components = {
  h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
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
    // `[&_th]:px-4 [&_td]:px-4` là bắt buộc, không phải trang trí.
    //
    // Plugin typography đặt `padding-inline-start: 0` cho ô ĐẦU và
    // `padding-inline-end: 0` cho ô CUỐI, để bảng trôi thẳng hàng với dòng
    // chữ xung quanh. Nhưng ở đây bảng nằm trong một khung CÓ VIỀN, nên chữ ở
    // cột đầu và cột cuối dính sát vào viền — thấy rõ trên di động, nơi bảng
    // rộng gần hết màn hình.
    //
    // Typography dùng `:where()` nên độ ưu tiên bằng 0, utility ở đây thắng.
    <div
      className="my-8 overflow-x-auto rounded-2xl border [&_td]:px-4 [&_th]:px-4"
      tabIndex={0}
    >
      <table className="my-0 w-full">{children}</table>
    </div>
  ),
  blockquote: ({ children }) => (
    <blockquote className="rounded-r-xl border-l-4 border-accent bg-accent/5 py-1 pl-6">
      {children}
    </blockquote>
  ),
};

export function ArticleContent({ markdown }: { markdown: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
