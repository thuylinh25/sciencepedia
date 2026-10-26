import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gắn entity cho bài 'Khi bộ não "rảnh rỗi"…' (sau thẩm định 1026c/1026d) — bài đang PUBLISHED,
 * entityId còn rỗng nên nằm ngoài knowledge graph.
 *
 * Entity trung tâm của bài: Mạng lưới mặc định (Default Mode Network) — khái niệm khoa học cụ thể
 * làm trụ cho bài. Wikidata Q1182555 (tra wbsearchentities 2026-10-26).
 *
 * KHÔNG tạo Relationship: các entity hàng xóm cần cho cạnh có kiểu (não / lo âu / tính dẻo thần
 * kinh) chưa tồn tại, và rumination↔DMN là MỐI LIÊN HỆ, không phải CAUSES — nên không có cạnh nào
 * đúng nghĩa để thêm. Cấm quan hệ "related" chung chung (enum RelationType). Thêm cạnh khi các
 * entity ấy ra đời.
 *
 * Script KHÔNG đổi factCheck/byline/status. readingTime tính lại cho khớp nội dung sau đính chính.
 *
 *   npx tsx --env-file-if-exists=.env scripts/attach-entity-nhan-roi-2026-10-26.ts            # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/attach-entity-nhan-roi-2026-10-26.ts --write    # ghi
 */
const prisma = new PrismaClient();

const SLUG = "khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi";

const ENTITY = {
  slug: "mang-luoi-mac-dinh",
  canonicalName: "Mạng lưới mặc định",
  canonicalNameEn: "Default mode network",
  entityType: "CONCEPT" as EntityType,
  aliases: ["DMN", "mạng lưới chế độ mặc định", "default mode network", "default-mode network"],
  wikidataQid: "Q1182555",
  description:
    "Mạng lưới các vùng vỏ não tăng hoạt động khi không tập trung ra bên ngoài (nghỉ ngơi, hồi tưởng, nghĩ về bản thân, tưởng tượng tương lai) và giảm khi làm nhiệm vụ đòi hỏi chú ý.",
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
  const write = process.argv.slice(2).includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, status: true, content: true, readingTime: true, entityId: true, factCheck: true },
  });
  const rt = readingTimeOf(a.content);
  const existing = await prisma.entity.findUnique({ where: { slug: ENTITY.slug }, select: { id: true } });
  console.log(`\n${SLUG} (${a.status}, factCheck ${a.factCheck})`);
  console.log(`entity ${ENTITY.slug} (${existing ? "đã có" : "tạo mới"}, ${ENTITY.wikidataQid})${a.entityId ? " — bài đã gắn entity khác, GIỮ" : ""}`);
  console.log(`readingTime ${a.readingTime} → ${rt}`);

  if (!write) {
    console.log("\nChưa ghi gì.");
    return;
  }
  const entityId = a.entityId ?? (existing ? existing.id : (await prisma.entity.create({ data: ENTITY, select: { id: true } })).id);
  await prisma.article.update({ where: { id: a.id }, data: { entityId, readingTime: rt } });
  await revalidateSite([SLUG]);
  console.log(`\nĐÃ GẮN entity ${entityId} vào ${SLUG}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
