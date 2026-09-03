import { PrismaClient, Role } from "@prisma/client";

/**
 * Nhập nội dung từ một trang Notion (ví dụ "Life Wiki") vào Sciencepedia.
 *
 * Chuẩn bị một lần:
 *   1. Tạo internal integration tại https://www.notion.so/my-integrations
 *   2. Mở trang Notion → ⋯ → Connections → thêm integration vừa tạo
 *   3. Đặt biến môi trường:
 *        NOTION_TOKEN=ntn_...
 *        NOTION_PAGE_ID=11246aed6be380b38d5ec252ea5b65b5
 *
 * Chạy:
 *   npx tsx scripts/import-notion.ts                 # nhập toàn bộ
 *   npx tsx scripts/import-notion.ts "Vũ trụ" "Sức khoẻ"   # chỉ vài mục
 *
 * Script chỉ TẠO BẢN NHÁP (status DRAFT). Biên tập viên xem lại rồi mới xuất bản.
 */

const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

const prisma = new PrismaClient();

type NotionRichText = { plain_text: string; href: string | null };
type NotionBlock = {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

async function notion<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireEnv("NOTION_TOKEN")}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

/** Lấy tất cả block con, tự xử lý phân trang. */
async function listChildren(blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const query = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const page = await notion<{
      results: NotionBlock[];
      next_cursor: string | null;
      has_more: boolean;
    }>(`/blocks/${blockId}/children${query}`);

    blocks.push(...page.results);
    cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

function text(block: NotionBlock, type: string): string {
  const payload = block[type] as { rich_text?: NotionRichText[] } | undefined;
  const parts = payload?.rich_text ?? [];
  return parts
    .map((part) => (part.href ? `[${part.plain_text}](${part.href})` : part.plain_text))
    .join("");
}

/** Chuyển cây block của Notion thành Markdown. */
async function toMarkdown(blockId: string, depth = 0): Promise<string> {
  const blocks = await listChildren(blockId);
  const lines: string[] = [];

  for (const block of blocks) {
    const indent = "  ".repeat(depth);

    switch (block.type) {
      case "heading_1":
        lines.push(`\n## ${text(block, "heading_1")}\n`);
        break;
      case "heading_2":
        lines.push(`\n### ${text(block, "heading_2")}\n`);
        break;
      case "heading_3":
        lines.push(`\n#### ${text(block, "heading_3")}\n`);
        break;
      case "paragraph": {
        const content = text(block, "paragraph");
        if (content.trim()) lines.push(`${content}\n`);
        break;
      }
      case "bulleted_list_item":
        lines.push(`${indent}- ${text(block, "bulleted_list_item")}`);
        break;
      case "numbered_list_item":
        lines.push(`${indent}1. ${text(block, "numbered_list_item")}`);
        break;
      case "to_do": {
        const done = (block.to_do as { checked?: boolean })?.checked;
        lines.push(`${indent}- [${done ? "x" : " "}] ${text(block, "to_do")}`);
        break;
      }
      case "quote":
        lines.push(`\n> ${text(block, "quote")}\n`);
        break;
      case "code": {
        const language =
          (block.code as { language?: string })?.language ?? "text";
        lines.push(`\n\`\`\`${language}\n${text(block, "code")}\n\`\`\`\n`);
        break;
      }
      case "divider":
        lines.push("\n---\n");
        break;
      case "callout":
        lines.push(`\n> **Lưu ý:** ${text(block, "callout")}\n`);
        break;
      case "image": {
        const image = block.image as {
          file?: { url: string };
          external?: { url: string };
          caption?: NotionRichText[];
        };
        const url = image.file?.url ?? image.external?.url;
        const caption = image.caption?.map((c) => c.plain_text).join("") ?? "";
        if (url) lines.push(`\n![${caption}](${url})\n`);
        break;
      }
      // Các block chưa hỗ trợ (table, embed, database...) được bỏ qua có chủ đích
      default:
        break;
    }

    // Đệ quy vào block con, trừ child_page vì đó là một bài viết riêng
    if (block.has_children && block.type !== "child_page") {
      lines.push(await toMarkdown(block.id, depth + 1));
    }
  }

  return lines.join("\n");
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readingTime(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function main() {
  const pageId = requireEnv("NOTION_PAGE_ID").replace(/-/g, "");
  const only = process.argv.slice(2);

  const author = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    orderBy: { createdAt: "asc" },
  });
  if (!author) {
    throw new Error("Chưa có tài khoản ADMIN. Chạy `npm run db:seed` trước.");
  }

  console.log(`→ Đọc trang Notion ${pageId}`);
  const topLevel = await listChildren(pageId);

  // Mỗi child_page ở cấp cao nhất được coi là một DANH MỤC
  const sections = topLevel.filter((block) => block.type === "child_page");
  console.log(`  Tìm thấy ${sections.length} mục cấp 1`);

  let imported = 0;

  for (const section of sections) {
    const sectionTitle = (section.child_page as { title: string }).title;

    if (only.length > 0 && !only.includes(sectionTitle)) continue;

    const categorySlug = slugify(sectionTitle);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: {
        slug: categorySlug,
        name: sectionTitle,
        nameEn: sectionTitle,
        icon: "Sparkles",
        color: "#3b82f6",
        order: 99,
      },
    });

    console.log(`\n  ▸ ${sectionTitle} → danh mục "${category.slug}"`);

    // Mỗi child_page bên trong là một BÀI VIẾT
    const pages = (await listChildren(section.id)).filter(
      (block) => block.type === "child_page",
    );

    for (const page of pages) {
      const title = (page.child_page as { title: string }).title;
      const markdown = (await toMarkdown(page.id)).trim();

      if (markdown.length < 50) {
        console.log(`    – Bỏ qua "${title}" (nội dung quá ngắn)`);
        continue;
      }

      const summary =
        markdown
          .split("\n")
          .find((line) => line.trim() && !line.startsWith("#"))
          ?.slice(0, 300) ?? title;

      const slug = slugify(title);

      await prisma.article.upsert({
        where: { slug },
        update: {
          title,
          summary,
          content: markdown,
          readingTime: readingTime(markdown),
          categoryId: category.id,
        },
        create: {
          slug,
          title,
          summary,
          content: markdown,
          readingTime: readingTime(markdown),
          categoryId: category.id,
          authorId: author.id,
          // Luôn là bản nháp: nội dung nhập tự động cần người xem lại
          status: "DRAFT",
        },
      });

      imported += 1;
      console.log(`    ✓ ${title}`);
    }
  }

  console.log(
    `\n→ Đã nhập ${imported} bài dưới dạng BẢN NHÁP. Vào /admin/articles để duyệt và xuất bản.`,
  );
}

main()
  .catch((error) => {
    console.error("Import thất bại:", (error as Error).message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
