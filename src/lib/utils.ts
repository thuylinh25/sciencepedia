import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bỏ dấu tiếng Việt.
 *
 * PHẢI khớp với hàm `sciencepedia_unaccent` trong migration
 * 20260901120000_article_search_vector — cột tsvector được sinh bằng hàm SQL đó,
 * nên nếu hai bên bỏ dấu khác nhau thì truy vấn sẽ không khớp được index.
 */
export function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Chuyển tiếng Việt có dấu thành slug an toàn cho URL. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Ước lượng thời gian đọc (phút) — 200 từ/phút, tối thiểu 1. */
export function readingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Cắt chuỗi theo ranh giới từ. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max)).trimEnd() + "…";
}

export function formatNumber(n: number, locale = "vi"): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    notation: n >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(date: Date | string, locale = "vi"): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Trích các heading h2/h3 từ Markdown để dựng mục lục. */
export function extractHeadings(markdown: string) {
  const lines = markdown.split("\n");
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({
      id: slugify(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }
  return headings;
}

/**
 * Các host ảnh được phép. Phải khớp với `images.remotePatterns` trong
 * next.config.ts — nếu lệch, next/image sẽ ném lỗi lúc chạy thay vì lúc lưu.
 */
const ALLOWED_IMAGE_HOSTS = [
  /\.supabase\.co$/,
  /\.supabase\.in$/,
  /^images\.unsplash\.com$/,
  /^science\.nasa\.gov$/,
  /^upload\.wikimedia\.org$/,
];

export function isAllowedImageUrl(url: string): boolean {
  if (!url) return true; // để trống là hợp lệ
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export const absoluteUrl = (path = "") =>
  new URL(
    path,
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ).toString();
