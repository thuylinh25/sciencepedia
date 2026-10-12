import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ hai mục CHẶN còn lại của bài "Bí ẩn bầu trời đêm…" sau đính chính 12/10
 * (`scripts/apply-corrections-2026-10-12.ts`) và ký duyệt (`scripts/pass-factcheck-2026-10-12.ts`):
 * chưa có entity, 0 link vào. Bài vẫn PUBLISHED suốt quá trình nên không cần `npm run publish`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-12.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-12.ts --write
 *
 * - entity: Wikidata Q538992 "scintillation — variation in brightness and the position of stars due
 *   to atmospheric refraction" (wbsearchentities 2026-10-12; Q3078889 là chớp sáng của hạt trong
 *   chất phát quang, khác nghĩa).
 * - link vào: thêm vào "Đọc thêm" của hai bài PASSED cùng chủ đề. Không neo giữa câu: hai bài không có
 *   câu nào đang nói về lấp lánh, neo vào chữ khác nghĩa là link sai.
 * - Chỉ ghi link khi bài đích đã PASSED + có byline (đã có từ pass-factcheck-2026-10-12).
 *
 * Script KHÔNG đổi factCheck, byline duyệt hay status.
 */
const prisma = new PrismaClient();

const SLUG = "bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong";
const TITLE = "Bí ẩn bầu trời đêm: vì sao ngôi sao lấp lánh còn hành tinh thì không?";

const ENTITY: {
  slug: string;
  canonicalName: string;
  canonicalNameEn: string;
  entityType: EntityType;
  aliases: string[];
  wikidataQid: string;
  description: string;
} = {
  slug: "lap-lanh-cua-sao",
  canonicalName: "Lấp lánh của sao",
  canonicalNameEn: "Stellar scintillation",
  entityType: "PHENOMENON",
  aliases: ["sao lấp lánh", "scintillation", "twinkling"],
  wikidataQid: "Q538992",
  description: "Độ sáng của ngôi sao dao động nhanh khi nhìn từ mặt đất, do nhiễu động khí quyển hội tụ và phân kỳ ánh sáng; hành tinh có kích thước góc lớn nên ít lấp lánh.",
};

const BACKLINKS: { from: string; after: string; why: string }[] = [
  {
    from: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    after: "- [Thang khoảng cách vũ trụ: đo tới sao và thiên hà bằng cách nào](/articles/thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao)",
    why: "Cùng chủ đề ánh sáng đi qua khí quyển; cả hai bài có ý 'gần chân trời ánh sáng đi qua nhiều khí quyển hơn'.",
  },
  {
    from: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    after: "- [Ngôi sao: cấu tạo và vòng đời](/articles/ngoi-sao-cau-tao-va-vong-doi)",
    why: "Người đọc vừa xem các sao sáng nhìn được bằng mắt thường; bài đích giải thích vì sao chúng lấp lánh, còn Sao Kim, Sao Mộc thì không.",
  },
];

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, status: true, entityId: true, factCheck: true, reviewedById: true, reviewedAt: true },
  });
  const ready = a.status === "PUBLISHED" && a.factCheck === "PASSED" && a.reviewedById && a.reviewedAt;
  console.log(`${SLUG}: ${a.status}, factCheck ${a.factCheck}, byline ${a.reviewedById ? "có" : "KHÔNG"}`);
  if (!ready) throw new Error("bài đích chưa PUBLISHED + PASSED + byline — chưa ghi link vào");

  const touched = new Set<string>();
  const existing = await prisma.entity.findUnique({ where: { slug: ENTITY.slug }, select: { id: true } });
  if (a.entityId) console.log("entity: bài đã gắn entity, giữ");
  else {
    console.log(`entity: ${ENTITY.slug} (${existing ? "đã có" : "tạo mới"}, ${ENTITY.wikidataQid})`);
    if (write) {
      const entityId = existing?.id ?? (await prisma.entity.create({ data: ENTITY, select: { id: true } })).id;
      await prisma.article.update({ where: { id: a.id }, data: { entityId } });
      touched.add(SLUG);
    }
  }

  const line = `- [${TITLE}](/articles/${SLUG})`;
  for (const b of BACKLINKS) {
    const src = await prisma.article.findUniqueOrThrow({ where: { slug: b.from }, select: { id: true, status: true, factCheck: true, content: true } });
    if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${b.from} không PUBLISHED`);
    if (src.content.includes(`/articles/${SLUG}`)) {
      console.log(`link vào: đã có từ ${b.from}`);
      continue;
    }
    const n = src.content.split(b.after).length - 1;
    if (n !== 1) throw new Error(`[${b.from}] dòng neo khớp ${n} chỗ, cần đúng 1`);
    console.log(`link vào từ ${b.from} (${src.factCheck}) — vì: ${b.why}`);
    if (write) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(b.after, () => `${b.after}\n${line}`) } });
      touched.add(b.from);
    }
  }

  if (write && touched.size) await revalidateSite([...touched]);
  console.log(write ? `\nĐÃ GHI: ${[...touched].join(", ") || "không có gì mới"}` : "\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
