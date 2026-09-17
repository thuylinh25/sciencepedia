import { GLOSSARY_PATTERN as PATTERN, slugify } from "@/lib/utils";

/**
 * Cú pháp thuật ngữ trong thân bài:
 *
 *   [[động lượng góc]]                 → tra mục từ "dong-luong-goc", hiện nguyên chữ
 *   [[động lượng góc|động lượng góc]]  → tra theo vế trái, hiện vế phải
 *
 * Chỉ chữ trơn. `[[spin|**spin**]]` không chạy: parser Markdown đã tách phần in
 * đậm ra node riêng trước khi plugin nhìn thấy.
 *
 * Module này KHÔNG được import `server-only`: `ArticleContent` còn chạy trong
 * form quản trị (client) để xem trước bài.
 *
 * Regex nằm ở `@/lib/utils` (`GLOSSARY_PATTERN`) để tránh import vòng.
 */

/** Phần nhìn thấy được của một mục từ — đúng những gì tooltip cần, không hơn. */
export type GlossaryPreview = {
  slug: string;
  term: string;
  definition: string;
};

/** Khoá tra cứu → mục từ. Khoá là `slugify` của vế trái trong `[[...]]`. */
export type GlossaryMap = Record<string, GlossaryPreview>;

/** Chi tiết cho modal — hình dạng JSON mà `GET /api/glossary/[slug]` trả về. */
export type GlossaryDetail = {
  slug: string;
  term: string;
  shortDef: string;
  /** Đã tách đoạn. Rỗng khi mục từ chưa có định nghĩa đầy đủ. */
  paragraphs: string[];
  category: string | null;
  image: { src: string; srcSet?: string; credit: string | null } | null;
  related: { slug: string; title: string }[];
  updatedAt: string;
};

export const glossaryKey = (raw: string) => slugify(raw);

/**
 * Mọi khoá xuất hiện trong bài, không trùng lặp.
 *
 * Quét chuỗi thô nên cũng nhặt cả `[[...]]` nằm trong code block. Chấp nhận:
 * tra thừa một khoá rẻ hơn nhiều so với parse Markdown hai lần mỗi lần render.
 */
export function extractGlossaryKeys(markdown: string): string[] {
  const keys = new Set<string>();
  for (const match of markdown.matchAll(PATTERN)) {
    const key = glossaryKey(match[1]);
    if (key) keys.add(key);
  }
  return [...keys];
}

// ------------------------------------------------------------------ remark

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
};

/**
 * Không đổi `[[...]]` nằm trong link: kết quả sẽ là `<a>` lồng trong `<a>`,
 * HTML không hợp lệ và trình duyệt tự "sửa" bằng cách tách thẻ ra.
 * `inlineCode`/`code` không cần liệt kê — chữ của chúng nằm ở `value`, không
 * phải node `text` con.
 */
const SKIP_INSIDE = new Set(["link", "linkReference"]);

function splitText(value: string): MdNode[] | null {
  // Không dùng `PATTERN.test()`: regex cờ `g` giữ `lastIndex` sau lần test, và
  // `matchAll` sao chép luôn `lastIndex` đó — mục từ đầu tiên sẽ bị bỏ qua.
  if (!value.includes("[[")) return null;

  const out: MdNode[] = [];
  let cursor = 0;

  for (const match of value.matchAll(PATTERN)) {
    const start = match.index ?? 0;
    const key = glossaryKey(match[1]);
    const label = (match[2] ?? match[1]).trim();
    // `[[ ]]`, `[[???]]`: không ra khoá nào — để nguyên chữ gốc, đừng nuốt mất
    if (!key || !label) continue;

    if (start > cursor) out.push({ type: "text", value: value.slice(cursor, start) });
    out.push({
      type: "glossaryTerm",
      data: {
        hName: "glossary-term",
        hProperties: { "data-key": key },
      },
      children: [{ type: "text", value: label }],
    });

    cursor = start + match[0].length;
  }

  if (cursor === 0) return null; // có "[[" nhưng không khớp cú pháp
  if (cursor < value.length) out.push({ type: "text", value: value.slice(cursor) });
  return out;
}

function walk(node: MdNode) {
  if (!node.children || SKIP_INSIDE.has(node.type)) return;

  const next: MdNode[] = [];
  for (const child of node.children) {
    const replaced = child.type === "text" && child.value ? splitText(child.value) : null;
    if (replaced) {
      next.push(...replaced);
    } else {
      walk(child);
      next.push(child);
    }
  }
  node.children = next;
}

/**
 * Remark plugin: `[[...]]` → phần tử `<glossary-term data-key>`, để
 * `ArticleContent` map sang `<GlossaryTerm>`.
 *
 * Tự đi cây thay vì dùng `unist-util-visit`/`mdast-util-find-and-replace`: cả
 * hai chỉ là phụ thuộc bắc cầu của react-markdown, không nằm trong package.json,
 * nên có thể biến mất ở lần nâng cấp kế tiếp.
 */
export function remarkGlossary() {
  return (tree: MdNode) => walk(tree);
}
