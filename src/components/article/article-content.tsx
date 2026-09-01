import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugify } from "@/lib/utils";

/**
 * Trình bày nội dung Markdown của bài viết.
 *
 * Id của heading được sinh bằng chính `slugify` mà mục lục dùng, nên hai bên
 * luôn khớp nhau (rehype-slug giữ nguyên dấu tiếng Việt nên sẽ lệch).
 * react-markdown mặc định không cho HTML thô đi qua, nên nội dung do biên tập
 * viên nhập không thể chèn script.
 */
const components: Components = {
  h2: ({ children }) => (
    <h2 id={slugify(String(children))}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(String(children))}>{children}</h3>
  ),
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
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
    <div className="my-8 overflow-x-auto rounded-2xl border">
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
