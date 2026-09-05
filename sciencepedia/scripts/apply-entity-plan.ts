import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient, EntityType, RelationType } from "@prisma/client";

/**
 * Áp `docs/content/entity-plan.json` vào CSDL.
 *
 *   npm run entity:apply                    # in kế hoạch + báo lỗi dữ liệu
 *   npm run entity:apply -- --write         # thực thi
 *   npm run entity:apply -- --only entities # chỉ một phần
 *
 * Ba phần độc lập, chạy được riêng: `entities`, `relationships`, `backlinks`.
 *
 * ## Vì sao kiểm hết trước rồi mới ghi
 *
 * Kế hoạch do agent soạn, tức dữ liệu ngoài. Áp nửa chừng rồi gặp một giá trị
 * enum sai sẽ để lại kho ở trạng thái nửa vời — vài entity đã tạo, vài cạnh
 * chưa, và không ai biết đã tới đâu. Nên: kiểm toàn bộ trước, có một lỗi thì
 * không ghi gì cả.
 *
 * ## Vì sao `find` phải khớp đúng một chỗ
 *
 * Backlink sửa nội dung bài ĐÃ PUBLISHED. Thay nhầm chỗ trong một bài đang
 * chạy là thứ không ai phát hiện ra cho tới khi có người đọc lại. Khớp 0 chỗ
 * hay 2 chỗ đều là lỗi dữ liệu, không phải chuyện tự xoay xở được.
 */
const prisma = new PrismaClient();

type Plan = {
  entities?: {
    slug: string;
    canonicalName: string;
    canonicalNameEn: string;
    entityType: string;
    aliases?: string[];
    wikidataQid?: string | null;
    description?: string | null;
    articleSlug?: string | null;
  }[];
  relationships?: {
    from: string;
    to: string;
    relType: string;
    weight?: number;
    why?: string;
  }[];
  backlinks?: { from: string; to: string; find: string; replace: string; why?: string }[];
};

const ENTITY_TYPES = new Set(Object.values(EntityType) as string[]);
const REL_TYPES = new Set(Object.values(RelationType) as string[]);

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const only = flagValue(argv, "only");

  const path = resolve(
    import.meta.dirname,
    "..",
    "..",
    "docs",
    "content",
    "entity-plan.json",
  );

  let plan: Plan;
  try {
    plan = JSON.parse(readFileSync(path, "utf8")) as Plan;
  } catch (error) {
    console.error(`Không đọc được ${path}: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  const want = (part: string) => !only || only === part;
  const errors: string[] = [];

  // ---------- Kiểm trước, không ghi gì ----------

  const articleSlugs = new Set(
    (await prisma.article.findMany({ select: { slug: true } })).map((a) => a.slug),
  );
  const planSlugs = new Set((plan.entities ?? []).map((e) => e.slug));

  for (const e of plan.entities ?? []) {
    if (!ENTITY_TYPES.has(e.entityType)) {
      errors.push(`entity "${e.slug}": entityType "${e.entityType}" không có trong enum`);
    }
    if (e.articleSlug && !articleSlugs.has(e.articleSlug)) {
      errors.push(`entity "${e.slug}": không có bài "${e.articleSlug}"`);
    }
    // QID bịa xuất hiện trong `sameAs` của JSON-LD và tuyên bố sai với máy tìm
    // kiếm rằng bài nói về một thứ khác. Chỉ kiểm được hình dạng ở đây; tính
    // đúng đắn là việc của người soạn kế hoạch.
    if (e.wikidataQid && !/^Q\d+$/.test(e.wikidataQid)) {
      errors.push(`entity "${e.slug}": wikidataQid "${e.wikidataQid}" sai định dạng`);
    }
  }

  const existingEntities = new Set(
    (await prisma.entity.findMany({ select: { slug: true } })).map((e) => e.slug),
  );
  const known = (slug: string) => planSlugs.has(slug) || existingEntities.has(slug);

  for (const r of plan.relationships ?? []) {
    if (!REL_TYPES.has(r.relType)) {
      errors.push(`cạnh ${r.from}→${r.to}: relType "${r.relType}" không có trong enum`);
    }
    if (!known(r.from)) errors.push(`cạnh ${r.from}→${r.to}: không biết entity "${r.from}"`);
    if (!known(r.to)) errors.push(`cạnh ${r.from}→${r.to}: không biết entity "${r.to}"`);
    if (r.from === r.to) errors.push(`cạnh ${r.from}→${r.to}: trỏ vào chính nó`);
    if (r.weight !== undefined && (r.weight < 0 || r.weight > 1)) {
      errors.push(`cạnh ${r.from}→${r.to}: weight ${r.weight} ngoài khoảng 0–1`);
    }
  }

  // Nạp nội dung một lần để kiểm mọi `find`
  const contents = new Map(
    (
      await prisma.article.findMany({
        where: { slug: { in: (plan.backlinks ?? []).map((b) => b.from) } },
        select: { slug: true, content: true },
      })
    ).map((a) => [a.slug, a.content]),
  );

  for (const b of plan.backlinks ?? []) {
    const content = contents.get(b.from);
    if (content === undefined) {
      errors.push(`backlink ${b.from}→${b.to}: không có bài "${b.from}"`);
      continue;
    }
    if (!articleSlugs.has(b.to)) {
      errors.push(`backlink ${b.from}→${b.to}: không có bài đích "${b.to}"`);
    }
    const hits = content.split(b.find).length - 1;
    if (hits !== 1) {
      errors.push(`backlink ${b.from}→${b.to}: cụm neo khớp ${hits} chỗ, cần đúng 1`);
    }
    if (!b.replace.includes(`/articles/${b.to}`)) {
      errors.push(`backlink ${b.from}→${b.to}: chuỗi thay thế không chứa link tới bài đích`);
    }
  }

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  console.log(
    `\nKế hoạch: ${plan.entities?.length ?? 0} entity · ` +
      `${plan.relationships?.length ?? 0} cạnh · ${plan.backlinks?.length ?? 0} backlink`,
  );

  if (errors.length > 0) {
    console.error(`\n${errors.length} lỗi dữ liệu — KHÔNG ghi gì:\n`);
    for (const e of errors) console.error(`   ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log("Kiểm dữ liệu: sạch.");

  if (!write) {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  // ---------- Ghi ----------

  let created = 0;
  let attached = 0;
  if (want("entities")) {
    for (const e of plan.entities ?? []) {
      const entity = await prisma.entity.upsert({
        where: { slug: e.slug },
        create: {
          slug: e.slug,
          canonicalName: e.canonicalName,
          canonicalNameEn: e.canonicalNameEn,
          entityType: e.entityType as EntityType,
          aliases: e.aliases ?? [],
          wikidataQid: e.wikidataQid ?? null,
          description: e.description ?? null,
        },
        update: {
          canonicalName: e.canonicalName,
          canonicalNameEn: e.canonicalNameEn,
          entityType: e.entityType as EntityType,
          aliases: e.aliases ?? [],
          wikidataQid: e.wikidataQid ?? null,
          description: e.description ?? null,
        },
      });
      created += 1;
      if (e.articleSlug) {
        await prisma.article.update({
          where: { slug: e.articleSlug },
          data: { entityId: entity.id },
        });
        attached += 1;
      }
    }
    console.log(`Entity: ${created} tạo/cập nhật, gắn vào ${attached} bài.`);
  }

  let edges = 0;
  if (want("relationships")) {
    const ids = new Map(
      (await prisma.entity.findMany({ select: { id: true, slug: true } })).map((e) => [
        e.slug,
        e.id,
      ]),
    );
    for (const r of plan.relationships ?? []) {
      const from = ids.get(r.from);
      const to = ids.get(r.to);
      if (!from || !to) continue;
      // Cặp (from, to, relType) là unique — chạy lại không nhân đôi cạnh.
      await prisma.relationship.upsert({
        where: {
          fromEntityId_toEntityId_relType: {
            fromEntityId: from,
            toEntityId: to,
            relType: r.relType as RelationType,
          },
        },
        create: {
          fromEntityId: from,
          toEntityId: to,
          relType: r.relType as RelationType,
          weight: r.weight ?? 1,
          note: r.why ?? null,
        },
        update: { weight: r.weight ?? 1, note: r.why ?? null },
      });
      edges += 1;
    }
    console.log(`Cạnh: ${edges} tạo/cập nhật.`);
  }

  let links = 0;
  if (want("backlinks")) {
    for (const b of plan.backlinks ?? []) {
      const article = await prisma.article.findUnique({
        where: { slug: b.from },
        select: { id: true, title: true, content: true },
      });
      if (!article) continue;
      if (article.content.includes(`/articles/${b.to}`)) continue;

      // Revision trước khi sửa: bài đã publish thì không đổi mà không để vết.
      await prisma.$transaction([
        prisma.revision.create({
          data: {
            articleId: article.id,
            title: article.title,
            content: article.content,
            note: `Trước khi thêm backlink tới ${b.to}`,
          },
        }),
        prisma.article.update({
          where: { id: article.id },
          data: { content: article.content.replace(b.find, b.replace) },
        }),
      ]);
      links += 1;
    }
    console.log(`Backlink: ${links} bài đã sửa (mỗi bài kèm một revision).`);
  }

  console.log("\nXong. Chạy `npm run publish:check` để xem kho còn nợ gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
