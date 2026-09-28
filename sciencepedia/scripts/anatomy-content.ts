import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  ANATOMY_SOURCES,
  CONTENT_FIELDS,
  contentFileSchema,
  type AnatomyData,
  type ContentField,
  type StructureContent,
} from "../src/lib/human-atlas/structures";

/**
 * Kiểm và gộp nội dung Level 2 (`data/anatomy/content-l2.json`) — gọi từ
 * `anatomy-enrich.ts`.
 *
 * Tệp nội dung do người (hoặc AI dưới sự giám sát) viết tay. Máy không tin
 * nó; máy kiểm năm điều, điều nào hỏng thì mục đó KHÔNG phát hành:
 *
 * 1. Mã FMA có trong dữ liệu (cấu trúc của atlas hoặc cha được trỏ tới).
 * 2. Mọi trường khác `null` có ít nhất một bằng chứng chống lưng (`supports`).
 * 3. Mỗi câu trích có NGUYÊN VĂN trong mục sách đã tải về (`.cache/…`). Câu
 *    trích bịa hoặc chép sai là lỗi, không phải cảnh báo — trích dẫn không
 *    resolve thì mọi thứ dựa trên nó cũng không đứng được.
 * 4. Mọi con số trong câu tiếng Việt và tiếng Anh xuất hiện trong một câu trích
 *    chống lưng trường đó. Số là chỗ bịa hay trốn nhất (docs/content-rules.md).
 * 5. Từ rào đón ("có lẽ" / "might") bị cấm; "có thể", "thường", "nhìn chung"
 *    chỉ được dùng khi câu trích chống lưng cũng rào đón — giữ nguyên mức dè
 *    dặt của nguồn, không thêm, không bớt.
 *
 * Qua được cả năm vẫn chưa đủ: chỉ mục có `review` (science-editor) mới vào
 * bản phát hành. Máy kiểm hình thức; người duyệt kiểm nghĩa.
 */

const ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(ROOT, "data/anatomy/content-l2.json");

function normalize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function numbers(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

const BANNED = [/có lẽ/i, /\bmight\b/i, /\bperhaps\b/i, /\bprobably\b/i];
const HEDGE_VI = /(^|[^\p{L}])(có thể|nhìn chung|(?<!bình )thường)([^\p{L}]|$)/iu;
// "can" không nằm ở đây: "can stretch", "can be felt" là khả năng, không phải rào đón.
// "thường gặp" (tần suất) khớp "commonly" của nguồn.
const HEDGE_EN = /\b(may|usually|generally|typically|often|in general)\b/i;
const HEDGE_SOURCE =
  /\b(may|might|can|usually|generally|typically|often|commonly|in general|somewhat|approximately|about)\b/i;

/**
 * Từ hạn định của nguồn mà câu viết lại hay đánh rơi — lượt duyệt đầu bắt
 * năm lần: "sometimes" (lách), "largely" (tiểu não), "In general" (cơ hoành),
 * "main" (phổi), "major" (tuỷ sống). Rơi mất một từ này là nâng mức chắc chắn.
 * Chỉ CẢNH BÁO: cùng một từ có thể thuộc vế khác của câu trích.
 */
const QUALIFIERS = ["largely", "sometimes", "generally", "in general", "mostly", "main", "major", "primary"];

/**
 * Chuỗi từ liên tiếp dài nhất chung giữa câu viết và câu trích. OpenStax là
 * CC BY-NC-SA: câu tiếng Anh gần như chép lại câu sách là tác phẩm phái sinh.
 * Lượt duyệt đầu thấy ~25/32 mục như vậy mà bộ kiểm không kêu.
 */
/*
 * Ngưỡng đặt theo lượt đo đầu (2026-09-28): 8–9 từ trùng hầu hết là chuỗi
 * thuật ngữ hay danh sách không tránh được ("the right upper quadrant of the
 * abdominal cavity", "12 pairs of ribs with their costal cartilages") — chỉ
 * cảnh báo. Từ 10 từ trở lên là câu diễn đạt ("an important role in
 * anchoring the upper limb to the body") — lỗi.
 */
const MAX_SHARED_WORDS = 10;
const WARN_SHARED_WORDS = 8;
function longestSharedRun(a: string, b: string): number {
  const words = (text: string) =>
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const x = words(a);
  const y = words(b);
  let best = 0;
  const row = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    let diagonal = 0;
    for (let j = 1; j <= y.length; j++) {
      const up = row[j];
      row[j] = x[i - 1] === y[j - 1] ? diagonal + 1 : 0;
      if (row[j] > best) best = row[j];
      diagonal = up;
    }
  }
  return best;
}

/** Văn bản thường của một mục sách, tải một lần rồi đọc cache. */
async function sectionText(template: string, cacheDir: string, section: string): Promise<string> {
  const file = path.join(cacheDir, `${section}.txt`);
  if (existsSync(file)) return readFileSync(file, "utf8");
  const url = template.replace("{section}", section);
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Sciencepedia anatomy-enrich)" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const html = await response.text();
  const body = html.split(/<div[^>]*data-type="page"[^>]*>/)[1] ?? html;
  const text = body
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<\/(p|h[1-6]|li|tr|figcaption|div)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ");
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(file, text);
  return text;
}

export async function buildContent(data: AnatomyData): Promise<{
  content: Record<string, StructureContent>;
  drafts: string[];
  errors: string[];
  warnings: string[];
}> {
  const content: Record<string, StructureContent> = {};
  const drafts: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!existsSync(CONTENT_FILE)) return { content, drafts, errors, warnings };

  const file = contentFileSchema.parse(JSON.parse(readFileSync(CONTENT_FILE, "utf8")));

  for (const [id, entry] of Object.entries(file.entries)) {
    const problems: string[] = [];
    const say = (message: string) => problems.push(`${id}: ${message}`);

    // 1.
    if (!data.structures[id] && !data.terms[id]) say("mã FMA không có trong dữ liệu");

    // 3. Trích dẫn nguyên văn.
    const texts = new Map<string, string>();
    for (const evidence of entry.evidence) {
      const source = ANATOMY_SOURCES[evidence.source as keyof typeof ANATOMY_SOURCES];
      if (!source) {
        say(`nguồn chưa đăng ký: ${evidence.source}`);
        continue;
      }
      const key = `${evidence.source}/${evidence.section}`;
      if (!texts.has(key)) {
        const cacheDir = path.join(ROOT, ".cache/anatomy", evidence.source);
        texts.set(key, normalize(await sectionText(source.urlTemplate, cacheDir, evidence.section)));
      }
      if (!texts.get(key)!.includes(normalize(evidence.quote))) {
        say(`trích dẫn không có nguyên văn trong ${evidence.section}: "${evidence.quote.slice(0, 70)}…"`);
      }
    }

    for (const field of CONTENT_FIELDS) {
      const value = entry[field];
      if (!value) continue;
      const support = entry.evidence.filter((e) => e.supports.includes(field as ContentField));
      // 2.
      if (support.length === 0) {
        say(`${field}: không có bằng chứng`);
        continue;
      }
      const quotes = support.map((e) => normalize(e.quote));
      // 4.
      const available = new Set(quotes.flatMap(numbers));
      for (const [lang, text] of Object.entries(value)) {
        for (const n of numbers(text)) {
          if (!available.has(n)) say(`${field}.${lang}: số "${n}" không có trong câu trích nào chống lưng`);
        }
        // 5.
        for (const banned of BANNED) if (banned.test(text)) say(`${field}.${lang}: từ rào đón bị cấm (${banned.source})`);
        if (lang === "en") {
          for (const quote of quotes) {
            const run = longestSharedRun(text, quote);
            if (run >= MAX_SHARED_WORDS) {
              say(`${field}.en: trùng ${run} từ liên tiếp với câu trích — viết lại bằng câu của mình (CC BY-NC-SA)`);
            } else if (run >= WARN_SHARED_WORDS) {
              warnings.push(`${id}: ${field}.en: trùng ${run} từ liên tiếp với câu trích — kiểm xem là thuật ngữ hay là câu chép`);
            }
          }
          for (const word of QUALIFIERS) {
            const pattern = new RegExp(`\\b${word}\\b`, "i");
            if (quotes.some((q) => pattern.test(q)) && !pattern.test(text)) {
              warnings.push(`${id}: ${field}.en: nguồn có "${word}", câu viết không có — kiểm xem có đánh rơi không`);
            }
          }
        }
        const hedge = lang === "vi" ? HEDGE_VI : HEDGE_EN;
        if (hedge.test(text) && !quotes.some((q) => HEDGE_SOURCE.test(q))) {
          say(`${field}.${lang}: câu rào đón mà nguồn không rào đón`);
        }
      }
    }

    if (problems.length > 0) {
      errors.push(...problems);
      continue;
    }
    if (!entry.review) {
      drafts.push(id);
      continue;
    }

    // Gộp nguồn theo (nguồn, mục), bỏ câu trích.
    const bySection = new Map<string, StructureContent["sources"][number]>();
    for (const evidence of entry.evidence) {
      const key = `${evidence.source}/${evidence.section}`;
      const source = ANATOMY_SOURCES[evidence.source as keyof typeof ANATOMY_SOURCES];
      const existing = bySection.get(key) ?? {
        ref: evidence.source,
        section: evidence.section,
        url: source.urlTemplate.replace("{section}", evidence.section),
        supports: [],
      };
      existing.supports = [...new Set([...existing.supports, ...evidence.supports])];
      bySection.set(key, existing);
    }
    content[id] = {
      summary: entry.summary,
      location: entry.location,
      function: entry.function,
      sources: [...bySection.values()],
      review: { by: entry.review.by, at: entry.review.at },
    };
  }

  return { content, drafts, errors, warnings };
}
