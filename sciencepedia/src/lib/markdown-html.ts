import type { Options as MarkdownOptions } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";

/**
 * HTML thô trong thân bài — cho qua MỘT TẬP CON an toàn.
 *
 * Trước 2026-10-09 react-markdown chặn hẳn HTML thô, nên khối `<div style="text-align:center">…`
 * biên tập viên dán vào form /admin hiện thành chữ trơn có cả thẻ. Chủ sản phẩm muốn nó hiển thị.
 * Nội dung vẫn là dữ liệu do người nhập, nên không bật HTML tự do: `rehype-raw` dựng cây HTML,
 * `rehype-sanitize` lọc theo danh sách trắng của GitHub (không script, không thuộc tính `on*`,
 * không iframe/form, href chỉ http(s)/mailto/tương đối), rồi `rehypeSafeStyle` lọc `style` về vài
 * thuộc tính trình bày.
 *
 * Vì sao lọc `style` chứ không cấm: căn giữa, cỡ chữ là thứ biên tập viên thật sự dùng. Nhưng
 * `style` tự do cho phép `position:fixed` phủ kín trang (giả giao diện đăng nhập), `url(...)` tải
 * tài nguyên ngoài — nên chỉ giữ thuộc tính trong STYLE_ALLOW, giá trị không có `url(`, `expression`,
 * dấu `\`, `<`.
 *
 * Thẻ tự đặt `glossary-term` (sinh bởi `remarkGlossary`) phải nằm trong danh sách trắng, không thì
 * sanitize gỡ mất tooltip thuật ngữ.
 */
const STYLE_ALLOW = new Set([
  "text-align",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "margin",
  "margin-top",
  "margin-bottom",
  "padding",
  "color",
  "background-color",
]);

const STYLE_TAGS = ["div", "span", "p", "td", "th", "figure", "figcaption"];

const schema: SanitizeSchema = {
  ...defaultSchema,
  // Giữ id nguyên văn: không có heading HTML nào cần id ở đây, và tiền tố "user-content-" của GitHub
  // không làm hỏng gì — nhưng heading Markdown lấy id từ component, không qua sanitize.
  tagNames: [...(defaultSchema.tagNames ?? []), "glossary-term", "figure", "figcaption", "mark", "u"],
  attributes: {
    ...defaultSchema.attributes,
    "glossary-term": ["dataKey"],
    ...Object.fromEntries(STYLE_TAGS.map((tag) => [tag, [...(defaultSchema.attributes?.[tag] ?? []), "style"]])),
  },
};

/** Lọc một chuỗi CSS inline về các khai báo được phép; trả "" nếu không còn gì. */
export function safeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const i = decl.indexOf(":");
      if (i === -1) return null;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).trim();
      if (!STYLE_ALLOW.has(prop) || !value) return null;
      if (/url\s*\(|expression|javascript:|[\\<>]|@import/i.test(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

/** Nút cây HAST tối thiểu cần dùng — tránh phụ thuộc gián tiếp vào @types/hast, unist-util-visit. */
type HastNode = { type: string; properties?: Record<string, unknown>; children?: HastNode[] };

function cleanStyles(node: HastNode) {
  const raw = node.properties?.style;
  if (node.type === "element" && node.properties && raw !== undefined) {
    const cleaned = safeStyle(String(raw));
    if (cleaned) node.properties.style = cleaned;
    else delete node.properties.style;
  }
  node.children?.forEach(cleanStyles);
}

function rehypeSafeStyle() {
  return (tree: HastNode) => cleanStyles(tree);
}

export const rehypeArticleHtml: NonNullable<MarkdownOptions["rehypePlugins"]> = [rehypeRaw, [rehypeSanitize, schema], rehypeSafeStyle];
