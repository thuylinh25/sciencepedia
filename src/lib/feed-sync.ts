import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { KNOWLEDGE_FEEDS, type KnowledgeFeed } from "@/lib/knowledge-feeds";

/**
 * Theo dõi feed của các nguồn khoa học chính thống và tạo bản nháp cho bài mới.
 *
 * Hai quy tắc định hình toàn bộ module này:
 *
 * 1. **Chỉ lấy tóm tắt, không lấy toàn văn.** Nature, Science, Physics World,
 *    Smithsonian giữ bản quyền chặt; sao chép nguyên bài về là vi phạm. Nên bản
 *    nháp chỉ gồm đoạn tóm tắt mà chính feed công bố, kèm liên kết bài gốc — đủ
 *    để người biên tập biết có tin gì đáng viết, không thay thế bài gốc.
 *
 * 2. **Luôn là DRAFT.** Đây là tin tức tiếng Anh chưa qua kiểm chứng, chưa dịch,
 *    chưa viết theo định dạng Sciencepedia. Trong 15 bài đã biên tập tay từ VACA,
 *    bài nào cũng có ít nhất một chỗ sai hoặc lỗi thời; đăng thẳng nội dung chưa
 *    đọc lại là đưa những chỗ như thế lên site dưới danh nghĩa bách khoa.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; SciencepediaBot/1.0; +https://sciencepedia-eight.vercel.app)";

export type FeedSyncResult = {
  checked: number;
  imported: { slug: string; title: string; url: string; source: string }[];
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

function draftBody(item: FeedItem, feed: KnowledgeFeed): string {
  const credit = item.author
    ? `${item.author} — ${feed.publisher}`
    : feed.publisher;

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
    "---",
    "",
    `Nguồn: **[${item.title}](${item.link})** — ${credit}.`,
    `Trang chủ: ${feed.homepage}. Bản quyền nội dung gốc thuộc về ${feed.publisher}.`,
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

async function importFeed(
  feed: KnowledgeFeed,
  authorId: string,
  seenUrls: Set<string>,
  budget: number,
  result: FeedSyncResult,
): Promise<number> {
  const category = await prisma.category.findUnique({
    where: { slug: feed.categorySlug },
    select: { id: true },
  });
  if (!category) {
    result.errors.push(`${feed.id}: không có danh mục ${feed.categorySlug}`);
    return 0;
  }

  const items = parseFeed(await fetchFeed(feed.feed));
  result.checked += items.length;

  let imported = 0;

  for (const item of items) {
    if (imported >= budget) break;

    if (seenUrls.has(item.link)) {
      result.skipped += 1;
      continue;
    }

    // Tiêu đề cụt hoặc mục chỉ có link thường là mẩu quảng bá, không phải bài
    if (item.title.length < 15 || feed.skipUrl?.test(item.link)) {
      result.skipped += 1;
      continue;
    }

    const slug = await freeSlug(
      slugify(item.title).slice(0, 80) || feed.id,
      feed.id,
    );

    const summary =
      (item.summary || item.title).slice(0, 280).replace(/\s+\S*$/, "") + "…";

    await prisma.article.create({
      data: {
        slug,
        title: item.title,
        summary,
        content: draftBody(item, feed),
        // Giữ nháp: xem chú thích đầu file
        status: "DRAFT",
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
      title: item.title,
      url: item.link,
      source: feed.publisher,
    });
    imported += 1;
  }

  return imported;
}

/**
 * Quét mọi feed trong danh sách và nhập bài chưa có.
 *
 * `perFeed` chặn một nguồn xả cả trăm mục cũ trong lần chạy đầu (arXiv trả 180
 * mục mỗi ngày). `total` giữ toàn bộ lần chạy trong giới hạn thời gian của
 * serverless.
 */
export async function syncKnowledgeFeeds({
  perFeed = 3,
  total = 20,
  feeds = KNOWLEDGE_FEEDS,
} = {}): Promise<FeedSyncResult> {
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
    if (result.imported.length >= total) break;

    try {
      await importFeed(
        feed,
        author.id,
        seenUrls,
        Math.min(perFeed, total - result.imported.length),
        result,
      );
    } catch (error) {
      // Một nguồn hỏng không được làm chết cả lần chạy
      result.errors.push(`${feed.id}: ${(error as Error).message}`);
    }
  }

  return result;
}
