import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ các mục CHẶN do máy làm được cho bài "Từ dòng điện đến phép tính: mạch điện làm toán như thế
 * nào?" sau đính chính 15/10 (`scripts/apply-corrections-2026-10-15-b.ts`), theo phiếu mục E.
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-15.ts            # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-15.ts --write    # entity + SEO + readingTime + link vào
 *
 * - entity: tạo "Điện tử số" (Wikidata Q173156, tra wbsearchentities 2026-10-15) rồi gắn vào bài.
 * - SEO: đặt seoTitle/seoDescription/seoKeywords (trống) theo phiếu D1–D3 — engine đính chính không
 *   điền được trường rỗng nên làm ở đây (trường metadata thường, không phải byline).
 * - readingTime: tính lại theo nội dung đã sửa — cùng công thức với `check-publish.ts`.
 * - link vào: thêm link từ bài "Ứng dụng cơ học lượng tử…" (PUBLISHED+PASSED) trỏ sang bài này.
 *   Bài ĐÍCH đang PUBLISHED nên link an toàn ngay (không 404) — khác republish-prep cho bài DRAFT.
 *
 * Script KHÔNG đổi factCheck, byline duyệt hay status — đó là quyết định của người duyệt
 * (`scripts/pass-factcheck-2026-10-15-b.ts`). Idempotent.
 */
const prisma = new PrismaClient();

const SLUG = "tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao";

const ENTITY = {
  slug: "dien-tu-so",
  canonicalName: "Điện tử số",
  canonicalNameEn: "Digital electronics",
  entityType: "CONCEPT" as EntityType,
  aliases: ["điện tử kỹ thuật số", "kỹ thuật số", "digital electronics"],
  wikidataQid: "Q173156",
  description:
    "Ngành điện tử dùng tín hiệu rời rạc (0 và 1) biểu diễn bằng các mức điện áp; nền tảng của transistor, cổng logic và vi xử lý.",
};

const SEO = {
  seoTitle: "Mạch điện làm toán như thế nào? Từ transistor đến phép tính",
  seoDescription:
    'Máy tính không "hiểu" toán học. Transistor, cổng logic và mạch cộng biến dòng điện thành phép cộng, trừ, nhân, chia; máy tính tương tự giải toán bằng chính các định luật vật lý.',
  seoKeywords:
    "mạch điện làm toán, transistor, cổng logic, hệ nhị phân, bộ cộng, máy tính tương tự, op-amp, memristor",
};

const BACKLINK = {
  from: "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
  find: "những công tắc điện tử cực nhỏ dùng để xử lý thông tin",
  replace: `những công tắc điện tử cực nhỏ dùng để [xử lý thông tin](/articles/${SLUG})`,
  why: "Bài nguồn (mục Transistor và chip máy tính) nói transistor là công tắc 'dùng để xử lý thông tin'; bài đích giải thích chính xác cách transistor → cổng logic → phép tính làm việc đó.",
};

// Cùng công thức readingTime với scripts/check-publish.ts.
const PROVENANCE = /\b(?:Nguồn|Source|Bản quyền|Trang chủ|viết lại từ)\b/i;
function prose(markdown: string): string {
  const cut = markdown.lastIndexOf("\n---");
  if (cut === -1) return markdown;
  const tail = markdown.slice(cut);
  if (!/^\n-{3,}[ \t]*\n/.test(tail)) return markdown;
  if (tail.length > 1_000) return markdown;
  return PROVENANCE.test(tail) ? markdown.slice(0, cut).trimEnd() : markdown;
}
const readingTimeOf = (content: string) => Math.max(1, Math.round(prose(content).trim().split(/\s+/).length / 200));

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  const touched = new Set<string>();

  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, status: true, content: true, readingTime: true, entityId: true, seoTitle: true },
  });
  const rt = readingTimeOf(a.content);
  const existing = await prisma.entity.findUnique({ where: { slug: ENTITY.slug }, select: { id: true } });
  console.log(`\n══════ ${SLUG} (${a.status})`);
  console.log(`entity ${ENTITY.slug} (${existing ? "đã có" : "tạo mới"}, ${ENTITY.wikidataQid})${a.entityId ? " — bài đã gắn entity khác, giữ" : ""}`);
  console.log(`readingTime ${a.readingTime} → ${rt}`);
  console.log(`SEO: ${a.seoTitle ? "đã có seoTitle, đặt đè" : "đặt mới"} → "${SEO.seoTitle}"`);

  if (write) {
    const entityId = a.entityId ?? (existing ? existing.id : (await prisma.entity.create({ data: ENTITY, select: { id: true } })).id);
    await prisma.article.update({ where: { id: a.id }, data: { entityId, readingTime: rt, ...SEO } });
    touched.add(SLUG);
    console.log("ĐÃ GHI entity + SEO + readingTime");
  }

  const src = await prisma.article.findUniqueOrThrow({ where: { slug: BACKLINK.from }, select: { id: true, status: true, factCheck: true, content: true } });
  if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${BACKLINK.from} không PUBLISHED`);
  if (src.content.includes(`/articles/${SLUG}`)) {
    console.log(`link vào: đã có từ ${BACKLINK.from}`);
  } else {
    const n = src.content.split(BACKLINK.find).length - 1;
    if (n !== 1) throw new Error(`[${BACKLINK.from}] cụm neo khớp ${n} chỗ, cần đúng 1`);
    console.log(`link vào từ ${BACKLINK.from} (bài đích đang PUBLISHED → an toàn)`);
    console.log(`   vì: ${BACKLINK.why}`);
    if (write) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(BACKLINK.find, () => BACKLINK.replace) } });
      touched.add(BACKLINK.from);
      console.log("   ĐÃ GHI link vào");
    }
  }

  if (write && touched.size) await revalidateSite([...touched]);
  if (!write) console.log("\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
