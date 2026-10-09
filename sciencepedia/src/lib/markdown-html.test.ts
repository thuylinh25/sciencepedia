import assert from "node:assert/strict";
import { test } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { remarkGlossary } from "@/lib/glossary";
import { rehypeArticleHtml, safeStyle } from "@/lib/markdown-html";

// Cùng chuỗi plugin với ArticleContent (component đó có JSX + component client, không chạy được dưới tsx --test).
const render = (markdown: string) =>
  renderToStaticMarkup(
    createElement(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkGlossary], rehypePlugins: rehypeArticleHtml }, markdown),
  );

test("khối HTML căn giữa của biên tập viên hiển thị thành thẻ, không thành chữ", () => {
  const html = render('<div style="text-align:center"> <div>🧬 Tổ tiên chung</div> <div style="font-size:24px">↓</div> </div>');
  assert.match(html, /<div style="text-align:center">/);
  assert.match(html, /<div style="font-size:24px">↓<\/div>/);
  assert.doesNotMatch(html, /&lt;div/);
});

test("script, thuộc tính on*, iframe và href javascript: bị gỡ", () => {
  const html = render(
    '<div onclick="alert(1)">a</div><script>alert(1)</script><iframe src="https://x.y"></iframe><a href="javascript:alert(1)">b</a><img src="x" onerror="alert(1)">',
  );
  assert.doesNotMatch(html, /onclick|onerror|<script|<iframe|javascript:/i);
});

test("style chỉ giữ thuộc tính trình bày", () => {
  assert.equal(safeStyle("text-align:center; position:fixed; top:0"), "text-align: center");
  assert.equal(safeStyle("background-color: url(https://x.y/a.png)"), "");
  assert.equal(safeStyle("color: red; font-size: 24px"), "color: red; font-size: 24px");
  const html = render('<div style="position:fixed;inset:0;z-index:9999">phủ trang</div>');
  assert.doesNotMatch(html, /position|z-index/);
});

test("Markdown và [[thuật ngữ]] vẫn render như cũ", () => {
  const html = render("## Tiêu đề\n\nĐoạn có **đậm** và [[gen]].");
  assert.match(html, /<h2>Tiêu đề<\/h2>/);
  assert.match(html, /<strong>đậm<\/strong>/);
  // Thẻ tự đặt của remarkGlossary phải sống sót qua sanitize, không thì mất tooltip.
  assert.match(html, /<glossary-term data-key="gen">gen<\/glossary-term>/);
});
