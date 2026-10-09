import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gắn entity cho 4 bài đính chính 09/10 còn nằm ngoài knowledge graph, và đặt mốc thẩm định
 * lại 12 tháng cho bài grounding (phiếu 2026-10-08 B4 đề nghị; engine đợt đó chưa có trường này).
 *
 *   npx tsx --env-file-if-exists=.env scripts/entity-2026-10-09.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/entity-2026-10-09.ts --write
 *
 * Bài đã PUBLISHED nên thiếu entity không chặn gì, nhưng trang mất node `about`/`sameAs` trong
 * JSON-LD và "Bài liên quan" tụt về "cùng danh mục" (docs/architecture.md). Wikidata tra bằng
 * wbsearchentities 2026-10-09. Grounding không có mục Wikidata riêng — Q432571 là hệ thống tiếp
 * địa của kỹ thuật điện, khác nghĩa — nên để trống, không gán gần đúng.
 *
 * Không đổi factCheck, byline hay nội dung.
 */
const prisma = new PrismaClient();

type EntityIn = {
  slug: string;
  canonicalName: string;
  canonicalNameEn: string;
  entityType: EntityType;
  aliases: string[];
  wikidataQid: string | null;
  description: string;
};

const JOBS: { article: string; entity: EntityIn; reverifyMonths?: number }[] = [
  {
    article: "tu-khong-khi-den-song-dien-tu-vi-sao-am-thanh-va-hinh-anh-co-the-truyen-di-khong-can-day",
    entity: {
      slug: "song-vo-tuyen",
      canonicalName: "Sóng vô tuyến",
      canonicalNameEn: "Radio wave",
      entityType: "PHENOMENON",
      aliases: ["sóng radio", "radio wave"],
      wikidataQid: "Q4262",
      description: "Phần có tần số thấp nhất của phổ điện từ, dùng cho phát thanh, truyền hình, Wi-Fi, Bluetooth và mạng di động.",
    },
  },
  {
    article: "bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap",
    entity: {
      slug: "huyet-ap",
      canonicalName: "Huyết áp",
      canonicalNameEn: "Blood pressure",
      entityType: "QUANTITY",
      aliases: ["blood pressure"],
      wikidataQid: "Q82642",
      description: "Áp lực của máu tuần hoàn lên thành mạch máu, đo bằng hai số: tâm thu và tâm trương.",
    },
  },
  {
    article: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    // Entity đã có (Q4), đang gắn với bài "Khi tim ngừng đập" — dùng lại, không tạo trùng.
    entity: {
      slug: "cai-chet",
      canonicalName: "Cái chết",
      canonicalNameEn: "Death",
      entityType: "PROCESS",
      aliases: [],
      wikidataQid: "Q4",
      description: "Sự chấm dứt vĩnh viễn các chức năng sống của một sinh vật.",
    },
  },
  {
    article: "grounding-tiep-dia-dieu-gi-thuc-su-xay-ra-khi-di-chan-tran-tren-dat",
    entity: {
      slug: "tiep-dia-grounding",
      canonicalName: "Tiếp địa (grounding)",
      canonicalNameEn: "Grounding (earthing)",
      entityType: "METHOD",
      aliases: ["grounding", "earthing", "đi chân trần"],
      wikidataQid: null,
      description: "Phương pháp cho da tiếp xúc trực tiếp với mặt đất hoặc nối cơ thể xuống đất bằng vật dẫn; lợi ích sức khoẻ chưa được chứng minh.",
    },
    reverifyMonths: 12,
  },
];

async function main() {
  const write = process.argv.includes("--write");
  const now = new Date();
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const touched: string[] = [];
  for (const job of JOBS) {
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: job.article },
      select: { id: true, entityId: true, reverifyDueAt: true },
    });
    const existing = await prisma.entity.findUnique({ where: { slug: job.entity.slug }, select: { id: true } });
    const due = job.reverifyMonths && !a.reverifyDueAt ? new Date(new Date(now).setMonth(now.getMonth() + job.reverifyMonths)) : null;
    console.log(
      `${job.article.slice(0, 50)}… entity ${job.entity.slug} (${existing ? "đã có" : "tạo mới"}, ${job.entity.wikidataQid ?? "không QID"})` +
        `${a.entityId ? " — bài đã gắn entity, giữ" : ""}${due ? ` · reverifyDueAt → ${due.toISOString().slice(0, 10)}` : ""}`,
    );
    if (!write || (a.entityId && !due)) continue;
    const entityId = a.entityId ?? existing?.id ?? (await prisma.entity.create({ data: job.entity, select: { id: true } })).id;
    await prisma.article.update({ where: { id: a.id }, data: { entityId, ...(due ? { reverifyDueAt: due } : {}) } });
    touched.push(job.article);
  }
  if (touched.length) await revalidateSite(touched);
  if (!write) console.log("\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
