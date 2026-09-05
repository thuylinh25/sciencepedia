import { readFileSync } from "node:fs";

/**
 * CHỈ ĐỌC — đo bài trước khi ghi CSDL. Xoá sau khi dùng.
 * Logic prose() chép đúng từ scripts/check-publish.ts (không import để tránh
 * chạy main() của file đó). Trọng tài cuối vẫn là `npm run publish:check`.
 */
const PROVENANCE = /\b(?:Nguồn|Source|Bản quyền|Trang chủ|viết lại từ)\b/i;

function prose(markdown: string): string {
  const cut = markdown.lastIndexOf("\n---");
  if (cut === -1) return markdown;
  const tail = markdown.slice(cut);
  if (!/^\n-{3,}[ \t]*\n/.test(tail)) return markdown;
  if (tail.length > 1_000) return markdown;
  return PROVENANCE.test(tail) ? markdown.slice(0, cut).trimEnd() : markdown;
}

const file = process.argv[2];
const md = readFileSync(file, "utf8");
const body = prose(md);
const words = body.trim().split(/\s+/).length;

console.log(`file        ${file}`);
console.log(`toàn bài    ${md.length} ký tự`);
console.log(`văn xuôi    ${body.length} ký tự   (3.000-5.000)`);
console.log(`đuôi bị cắt ${md.length - body.length} ký tự   (phải >0 và <=1.000)`);
console.log(`số từ       ${words}`);
console.log(`readingTime ${Math.max(1, Math.round(words / 200))} phút`);

const links = new Set<string>();
for (const m of md.matchAll(/\]\(\/(?:[a-z]{2}\/)?articles\/([a-z0-9-]+)\)/gi)) links.add(m[1]);
console.log(`link nội bộ ${links.size}: ${[...links].join(", ")}`);

const credit = /^\s*(?:\*\*|_)?\s*(?:Ảnh bìa|Ảnh|Nguồn ảnh|Image credit)\s*:/im.test(md);
console.log(`ghi công chép tay trong thân bài: ${credit ? "CÓ — CHẶN" : "không"}`);
