import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { KNOWLEDGE_FEEDS, type KnowledgeFeed } from "@/lib/knowledge-feeds";
import {
  isRewriteConfigured,
  rewriteArticle,
  type RewriteOutput,
} from "@/lib/rewrite";

/**
 * Theo dõi feed của các nguồn khoa học chính thống, nhờ Claude biên tập lại
 * thành bài tiếng Việt rồi đăng thẳng.
 *
 * Ba quy tắc định hình module này:
 *
 * 1. **Viết lại, không sao chép.** Science, Physics World, Smithsonian giữ bản
 *    quyền chặt. Bài gốc chỉ dùng làm tư liệu cho Claude viết một bài tiếng
 *    Việt mới; câu chữ đăng lên là của Sciencepedia, và luôn dẫn nguồn về
 *    trang gốc.
 *
 * 2. **Claude hỏng thì rơi về DRAFT, không đăng bừa.** Hết quota, mô hình trả
 *    bài rỗng, không lấy được trang gốc — mọi trường hợp đều cho ra bản nháp
 *    kèm cảnh báo thay vì một bài dở trên site. Chưa đặt ANTHROPIC_API_KEY thì
 *    toàn bộ rơi về nhánh nháp, tính năng vẫn chạy chứ không chết.
 *
 * 3. **Có hạn thời gian.** Mỗi bài tốn một lượt gọi mô hình, mà hàm serverless
 *    thì có trần thời gian chạy. Vòng lặp dừng khi hết ngân sách thay vì để
 *    Vercel cắt ngang giữa chừng.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; SciencepediaBot/1.0; +https://sciencepedia-eight.vercel.app)";

export type FeedSyncResult = {
  checked: number;
  imported: {
    slug: string;
    title: string;
    url: string;
    source: string;
    status: "PUBLISHED" | "DRAFT";
  }[];
  skipped: number;
  errors: string[];
};

type FeedItem = {
  title: string;
  link: string;
  summary: string;
  published: Date | null;
  author: string | null;
};

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    // Feed WordPress đầy &#8230; &#8217; …— giải mã theo mã điểm thay vì liệt kê
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function textOf(html: string): string {
  return decodeEntities(
    html
      // Bóc CDATA trước: "<![CDATA[…]]>" không có ">" bên trong nên bước xoá
      // thẻ bên dưới sẽ nuốt trọn cả nội dung nếu để nguyên
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Lấy nội dung thẻ đầu tiên; `<title>` và `<atom:title>` tính là một. */
function tag(block: string, name: string): string | null {
  const pattern = new RegExp(
    `<(?:[a-z]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${name}>`,
    "i",
  );
  return pattern.exec(block)?.[1] ?? null;
}

/**
 * Đọc cả RSS 2.0 (`<item>`) lẫn Atom (`<entry>`).
 *
 * Không dùng thư viện XML: chỉ cần vài trường phẳng ở tầng ngoài cùng, mà thêm
 * một parser đầy đủ vào bundle chỉ để lấy chừng đó là quá tay.
 */
export function parseFeed(xml: string): FeedItem[] {
  const blocks = [
    ...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi),
  ].map((match) => match[0]);

  const items: FeedItem[] = [];

  for (const block of blocks) {
    const title = textOf(tag(block, "title") ?? "");

    // Atom để link trong thuộc tính href; RSS để trong nội dung thẻ
    const rawLink = tag(block, "link") ?? "";
    const href =
      /<link[^>]*\srel=["']alternate["'][^>]*\shref=["']([^"']+)["']/i.exec(
        block,
      )?.[1] ??
      /<link[^>]*\shref=["']([^"']+)["']/i.exec(block)?.[1] ??
      textOf(rawLink);
    const link = decodeEntities(href).trim();

    if (!title || !/^https?:\/\//i.test(link)) continue;

    // Thẻ rỗng vẫn là chuỗi rỗng, nên phải dùng "||" chứ không phải "??":
    // NASA để <description> trống và đặt nội dung ở <content:encoded>
    const summary =
      textOf(tag(block, "description") ?? "") ||
      textOf(tag(block, "encoded") ?? "") ||
      textOf(tag(block, "summary") ?? "") ||
      textOf(tag(block, "content") ?? "");

    // `date` cuối cùng bắt <dc:date> của RSS 1.0/RDF — dạng Science dùng
    const dateText =
      tag(block, "pubDate") ??
      tag(block, "published") ??
      tag(block, "updated") ??
      tag(block, "date");
    const parsed = dateText ? new Date(textOf(dateText)) : null;

    items.push({
      title,
      link,
      summary,
      published: parsed && !Number.isNaN(parsed.valueOf()) ? parsed : null,
      author: textOf(tag(block, "creator") ?? tag(block, "author") ?? "") || null,
    });
  }

  return items;
}

async function fetchFeed(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function credit(item: FeedItem, feed: KnowledgeFeed): string {
  return item.author ? `${item.author} — ${feed.publisher}` : feed.publisher;
}

/** Khối dẫn nguồn gắn cuối mọi bài, dù do Claude viết hay để nguyên nháp. */
function attribution(item: FeedItem, feed: KnowledgeFeed): string {
  return [
    "---",
    "",
    `Nguồn: **[${item.title}](${item.link})** — ${credit(item, feed)}.`,
    `Trang chủ: ${feed.homepage}. Bản quyền nội dung gốc thuộc về ${feed.publisher}.`,
  ].join("\n");
}

/**
 * Lấy toàn văn bài gốc làm tư liệu cho Claude.
 *
 * Tóm tắt trong feed thường chỉ 200 ký tự — viết một bài bách khoa từ chừng đó
 * thì mô hình buộc phải bịa. Trang gốc lấy được thì bài chắc chắn hơn hẳn;
 * không lấy được thì đành dùng tóm tắt và bài sẽ ngắn.
 */
async function fetchSourceText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const html = await response.text();
  const body =
    /<article[\s>][\s\S]*?<\/article>/i.exec(html)?.[0] ??
    /<main[\s>][\s\S]*?<\/main>/i.exec(html)?.[0] ??
    html;

  return textOf(body.replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " "));
}

function draftBody(item: FeedItem, feed: KnowledgeFeed): string {
  return [
    "> **Bản nháp nhập tự động — chưa biên tập, chưa dịch.**",
    "> Dưới đây chỉ là tóm tắt do chính nguồn công bố kèm liên kết bài gốc.",
    "> Cần đọc bài gốc, kiểm chứng số liệu và viết lại bằng tiếng Việt theo",
    "> định dạng Sciencepedia trước khi xuất bản.",
    "",
    "## Tóm tắt từ nguồn",
    "",
    item.summary || "_Nguồn không kèm tóm tắt._",
    "",
    attribution(item, feed),
  ].join("\n");
}

/**
 * Slug chưa ai dùng: thêm mã nguồn, rồi thêm số, cho tới khi trống.
 *
 * Hai nguồn hay đưa tin cùng một sự kiện với tiêu đề y hệt, nên va slug là
 * chuyện thường chứ không phải trường hợp hiếm.
 */
async function freeSlug(base: string, feedId: string): Promise<string> {
  for (const candidate of [base, `${base}-${feedId}`]) {
    const taken = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${feedId}-${Date.now().toString(36)}`;
}

/**
 * Nhờ Claude biên tập lại thành bài tiếng Việt.
 *
 * Trả `null` thay vì ném lỗi: một bài viết hỏng không phải lý do để dừng cả
 * lần chạy, và bên gọi vẫn còn đường lui là giữ bản nháp.
 */
async function tryRewrite(
  item: FeedItem,
  feed: KnowledgeFeed,
  categoryName: string,
  result: FeedSyncResult,
): Promise<RewriteOutput | null> {
  if (!isRewriteConfigured()) return null;

  try {
    // Trang gốc cho tư liệu dày hơn feed nhiều; lấy không được thì dùng tóm tắt
    const sourceText = await fetchSourceText(item.link).catch(() => item.summary);

    if (sourceText.length < 400) {
      result.errors.push(`${item.link}: tư liệu quá mỏng để viết bài`);
      return null;
    }

    return await rewriteArticle({
      title: item.title,
      url: item.link,
      publisher: feed.publisher,
      sourceText,
      categoryName,
    });
  } catch (error) {
    result.errors.push(`${item.link}: Claude — ${(error as Error).message}`);
    return null;
  }
}

async function importFeed(
  feed: KnowledgeFeed,
  authorId: string,
  seenUrls: Set<string>,
  budget: number,
  deadline: number,
  result: FeedSyncResult,
): Promise<number> {
  const category = await prisma.category.findUnique({
    where: { slug: feed.categorySlug },
    select: { id: true, name: true },
  });
  if (!category) {
    result.errors.push(`${feed.id}: không có danh mục ${feed.categorySlug}`);
    return 0;
  }

  const items = parseFeed(await fetchFeed(feed.feed));
  result.checked += items.length;

  let imported = 0;

  for (const item of items) {
    if (imported >= budget || Date.now() > deadline) break;

    if (seenUrls.has(item.link)) {
      result.skipped += 1;
      continue;
    }

    // Tiêu đề cụt hoặc mục chỉ có link thường là mẩu quảng bá, không phải bài
    if (item.title.length < 15 || feed.skipUrl?.test(item.link)) {
      result.skipped += 1;
      continue;
    }

    const article = await tryRewrite(item, feed, category.name, result);

    // Claude viết được thì đăng luôn; hỏng thì giữ nháp để người biên tập xử lý
    const published = article !== null;
    const title = article?.title ?? item.title;

    const slug = await freeSlug(slugify(title).slice(0, 80) || feed.id, feed.id);

    await prisma.article.create({
      data: {
        slug,
        title,
        titleEn: published ? item.title : null,
        summary:
          article?.summary ??
          (item.summary || item.title).slice(0, 280).replace(/\s+\S*$/, "") + "…",
        content: article
          ? `${article.content}\n\n${attribution(item, feed)}`
          : draftBody(item, feed),
        seoKeywords: article?.seoKeywords || null,
        readingTime: article?.readingTime ?? 1,
        status: published ? "PUBLISHED" : "DRAFT",
        publishedAt: published ? (item.published ?? new Date()) : null,
        categoryId: category.id,
        authorId,
        sources: {
          create: {
            title: item.title,
            url: item.link,
            publisher: feed.publisher,
            year: item.published?.getFullYear() ?? null,
          },
        },
      },
    });

    seenUrls.add(item.link);
    result.imported.push({
      slug,
      title,
      url: item.link,
      source: feed.publisher,
      status: published ? "PUBLISHED" : "DRAFT",
    });
    imported += 1;
  }

  return imported;
}

/**
 * Quét mọi feed trong danh sách và nhập bài chưa có.
 *
 * `perFeed` chặn một nguồn xả cả trăm mục cũ trong lần chạy đầu (arXiv trả 180
 * mục mỗi ngày) và giữ cho một ngày không toàn tin của cùng một nơi.
 *
 * `budgetMs` mới là thứ thật sự quyết định số bài mỗi lần chạy: viết một bài
 * mất chừng 15–30 giây, mà hàm trên Vercel bị cắt ở 60 giây (gói Hobby). Dừng
 * chủ động trước hạn thì những bài đã viết được lưu trọn vẹn; để Vercel cắt
 * ngang thì mất cả lần chạy. Cron chạy hằng ngày nên bài còn lại đợi hôm sau.
 */
export async function syncKnowledgeFeeds({
  perFeed = 2,
  total = 20,
  budgetMs = 45_000,
  feeds = KNOWLEDGE_FEEDS,
} = {}): Promise<FeedSyncResult> {
  const deadline = Date.now() + budgetMs;
  const result: FeedSyncResult = {
    checked: 0,
    imported: [],
    skipped: 0,
    errors: [],
  };

  const author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!author) {
    result.errors.push("Không tìm thấy tài khoản quản trị để gán tác giả");
    return result;
  }

  // URL bài gốc nằm ở Source — dùng chính nó làm dấu đã-nhập
  const existing = await prisma.source.findMany({ select: { url: true } });
  const seenUrls = new Set(
    existing
      .map((source) => source.url)
      .filter((url): url is string => Boolean(url)),
  );

  for (const feed of feeds) {
    if (result.imported.length >= total || Date.now() > deadline) break;

    try {
      await importFeed(
        feed,
        author.id,
        seenUrls,
        Math.min(perFeed, total - result.imported.length),
        deadline,
        result,
      );
    } catch (error) {
      // Một nguồn hỏng không được làm chết cả lần chạy
      result.errors.push(`${feed.id}: ${(error as Error).message}`);
    }
  }

  return result;
}
