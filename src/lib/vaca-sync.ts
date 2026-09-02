import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * Đồng bộ bài mới từ thienvanvietnam.org (VACA).
 *
 * Bài được nhập về dưới dạng BẢN NHÁP, không xuất bản thẳng. Lý do không phải
 * sự thận trọng chung chung: trong 15 bài đã biên tập tay từ nguồn này, bài nào
 * cũng có ít nhất một chỗ sai hoặc đã lỗi thời — WIMP, hố Chicxulub, phân loại
 * Cartwheel, ngưỡng khối lượng thành sao, số phận vũ trụ. Đăng thẳng là đưa
 * những chỗ đó lên site dưới danh nghĩa bách khoa.
 *
 * Thông báo bản quyền của VACA cho phép tái sử dụng kèm ghi rõ tên tác giả và
 * nguồn, nên mỗi bản nháp đều mang sẵn khối dẫn nguồn và một mục Source trỏ về
 * bài gốc.
 */

const SITEMAP = "https://thienvanvietnam.org/sitemap.xml";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SciencepediaBot/1.0; +https://sciencepedia-eight.vercel.app)";

/**
 * Chuyên mục KHÔNG lấy, nhận diện qua `catid` ngay trong URL nên không phải
 * tải trang mới biết: 27 và 35 là Tin tức, 21 là Hoạt động, 34 là Giải trí,
 * 25 là Tài liệu/tiện ích, 47 là Giới thiệu về chính VACA.
 */
const SKIP_CATIDS = new Set(["21", "25", "27", "34", "35", "47"]);

/** Ánh xạ chuyên mục VACA sang danh mục Sciencepedia. */
const CATEGORY_BY_CATID: Record<string, string> = {
  "18": "he-mat-troi",
  "38": "he-mat-troi",
  "16": "sao-va-thien-ha",
  "39": "sao-va-thien-ha",
  "40": "sao-va-thien-ha",
  "13": "vu-tru-hoc",
  "42": "vu-tru-hoc",
  "9": "quan-sat-bau-troi",
  "11": "quan-sat-bau-troi",
  "23": "quan-sat-bau-troi",
  "50": "quan-sat-bau-troi",
  "8": "lich-su-thien-van",
  "37": "trai-dat-va-khi-hau",
  "22": "trai-dat-va-khi-hau",
};

const FALLBACK_CATEGORY = "vu-tru-hoc";

export type SyncResult = {
  checked: number;
  imported: { slug: string; title: string; url: string }[];
  skipped: number;
  errors: string[];
};

function decode(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

/** Mã bài trong URL của Joomla, ví dụ `id=570:dai-tuyet-chung` → "570". */
export function vacaArticleId(url: string): string | null {
  return url.match(/[?&]id=(\d+)/)?.[1] ?? null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/** Danh sách URL bài thuộc các chuyên mục kiến thức, đã gộp trùng theo mã bài. */
export async function listKnowledgeArticleUrls(): Promise<
  { id: string; url: string }[]
> {
  const xml = await fetchText(SITEMAP);
  const seen = new Map<string, string>();

  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    // Sitemap của họ chứa cả URL dị dạng kiểu /.../index.php
    const url = decode(match[1]).replace(/\/\.\.\.\//g, "/");
    if (!url.includes("view=article")) continue;

    const catid = url.match(/catid=(\d+)/)?.[1];
    if (catid && SKIP_CATIDS.has(catid)) continue;

    const id = vacaArticleId(url);
    // Một bài xuất hiện nhiều lần dưới các Itemid khác nhau; giữ bản đầu tiên
    if (id && !seen.has(id)) seen.set(id, url);
  }

  return [...seen].map(([id, url]) => ({ id, url }));
}

export function extractArticle(html: string) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const author = stripTags(
    html.match(/Written by:\s*<span>([\s\S]{0,120}?)<\/span>/i)?.[1] ?? "",
  );
  const created = html.match(/<time datetime="([^"]+)"/)?.[1] ?? null;
  const body =
    html.match(
      /<div[^>]*class="[^"]*com-content-article__body[^"]*"[^>]*>([\s\S]*)<\/body>/i,
    )?.[1] ?? "";

  let text = stripTags(body);
  const cut = text.indexOf("Vui lòng ghi rõ tên tác giả");
  if (cut > 0) text = text.slice(0, cut).trim();

  return { title, author, created, text };
}

/**
 * Nhập những bài chưa có trong CSDL.
 *
 * `limit` giữ mỗi lần chạy trong giới hạn thời gian của serverless. Chạy hàng
 * ngày thì 5 bài là dư — VACA không đăng tới 5 bài kiến thức mỗi ngày.
 */
export async function syncNewArticles({ limit = 5 } = {}): Promise<SyncResult> {
  const result: SyncResult = {
    checked: 0,
    imported: [],
    skipped: 0,
    errors: [],
  };

  const candidates = await listKnowledgeArticleUrls();
  result.checked = candidates.length;

  // Đã nhập bài nào rồi thì Source giữ URL gốc — dùng chính nó làm dấu
  const existing = await prisma.source.findMany({
    where: { url: { contains: "thienvanvietnam.org" } },
    select: { url: true },
  });
  const importedIds = new Set(
    existing
      .map((source) => (source.url ? vacaArticleId(source.url) : null))
      .filter((id): id is string => Boolean(id)),
  );

  const author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!author) {
    result.errors.push("Không tìm thấy tài khoản quản trị để gán tác giả");
    return result;
  }

  for (const candidate of candidates) {
    if (result.imported.length >= limit) break;
    if (importedIds.has(candidate.id)) {
      result.skipped += 1;
      continue;
    }

    try {
      const html = await fetchText(candidate.url);
      const article = extractArticle(html);

      // Trang quá ngắn thường là trang tải file hoặc mẩu thông báo
      if (!article.title || article.text.length < 1200) {
        result.skipped += 1;
        continue;
      }

      const catid = candidate.url.match(/catid=(\d+)/)?.[1] ?? "";
      const categorySlug = CATEGORY_BY_CATID[catid] ?? FALLBACK_CATEGORY;
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (!category) {
        result.errors.push(`Không có danh mục ${categorySlug}`);
        continue;
      }

      // Trùng slug thì thêm mã bài của VACA vào cho khỏi đụng
      const base = slugify(article.title).slice(0, 80) || `vaca-${candidate.id}`;
      const taken = await prisma.article.findUnique({
        where: { slug: base },
        select: { id: true },
      });
      const slug = taken ? `${base}-${candidate.id}` : base;

      const attribution = article.author
        ? `${article.author}, Thiên văn Việt Nam (VACA)`
        : "Thiên văn Việt Nam (VACA)";

      await prisma.article.create({
        data: {
          slug,
          title: article.title,
          summary: article.text.slice(0, 280).replace(/\s+\S*$/, "") + "…",
          content: [
            "> **Bản nháp nhập tự động — chưa biên tập.**",
            "> Nội dung dưới đây là văn bản gốc lấy về nguyên trạng. Cần đối",
            "> chiếu số liệu, cập nhật những chỗ đã lỗi thời và viết lại theo",
            "> định dạng Sciencepedia trước khi xuất bản.",
            "",
            article.text,
            "",
            "---",
            "",
            `Nguồn: **[${article.title}](${candidate.url})** — ${attribution}. Bản quyền nội dung gốc thuộc về VACA.`,
          ].join("\n"),
          // Giữ nháp: xem chú thích đầu file
          status: "DRAFT",
          categoryId: category.id,
          authorId: author.id,
          sources: {
            create: {
              title: article.title,
              url: candidate.url,
              publisher: attribution,
              year: article.created
                ? new Date(article.created).getFullYear()
                : null,
            },
          },
        },
      });

      result.imported.push({ slug, title: article.title, url: candidate.url });
    } catch (error) {
      result.errors.push(`${candidate.url}: ${(error as Error).message}`);
    }
  }

  return result;
}
