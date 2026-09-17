import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { slugify } from "../src/lib/utils";

/**
 * Đồng bộ `prisma/seed-data/glossary.json` sang bảng `GlossaryTerm`.
 *
 *   npm run glossary:seed              # in kế hoạch, KHÔNG ghi gì
 *   npm run glossary:seed -- --write   # upsert theo slug
 *
 * Chỉ mục có `verdict: "PASS"` mới được ghi. File JSON là bản science-editor
 * đã duyệt, kèm nguồn cho từng mục — nguồn ở lại trong file (và git) chứ không
 * vào bảng, vì giao diện chưa hiện nguồn của định nghĩa.
 *
 * Upsert chứ không xoá-rồi-tạo: bỏ một mục khỏi file KHÔNG xoá nó khỏi CSDL.
 * Gỡ định nghĩa đang hiện trên trang là quyết định biên tập, phải làm tay.
 */
const prisma = new PrismaClient();

const entrySchema = z.object({
  slug: z.string().min(1),
  term: z.string().min(1),
  termEn: z.string().min(1),
  shortDef: z.string().min(1),
  shortDefEn: z.string().min(1),
  fullDef: z.string().nullable().optional(),
  fullDefEn: z.string().nullable().optional(),
  aliases: z.array(z.string()).default([]),
  category: z.string().nullable().optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string().optional() }).passthrough()),
  verdict: z.enum(["PASS", "REVISE", "REJECT"]),
  notes: z.string().optional(),
});

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const file = path.join(__dirname, "..", "prisma", "seed-data", "glossary.json");
  const entries = z.array(entrySchema).parse(JSON.parse(readFileSync(file, "utf8")));

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  let ready = 0;
  for (const entry of entries) {
    const problems: string[] = [];
    if (entry.verdict !== "PASS") problems.push(`verdict ${entry.verdict}`);
    // Khoá sinh từ `[[...]]` là slugify(term) — slug lệch thì thuật ngữ không bao giờ khớp
    if (slugify(entry.term) !== entry.slug) problems.push(`slug phải là "${slugify(entry.term)}"`);
    const badAlias = entry.aliases.filter((alias) => slugify(alias) !== alias);
    if (badAlias.length) problems.push(`alias không ở dạng slug: ${badAlias.join(", ")}`);
    if (entry.sources.length < 2) problems.push("ít hơn 2 nguồn");

    if (problems.length) {
      console.log(`  BỎ QUA ${entry.slug}: ${problems.join("; ")}`);
      continue;
    }

    ready += 1;
    const data = {
      term: entry.term,
      termEn: entry.termEn,
      shortDef: entry.shortDef,
      shortDefEn: entry.shortDefEn,
      fullDef: entry.fullDef ?? null,
      fullDefEn: entry.fullDefEn ?? null,
      aliases: entry.aliases,
      category: entry.category ?? null,
    };
    console.log(`  ${entry.slug}  (${entry.aliases.length} alias, ${entry.sources.length} nguồn)`);

    if (write) {
      await prisma.glossaryTerm.upsert({
        where: { slug: entry.slug },
        create: { slug: entry.slug, ...data },
        update: data,
      });
    }
  }

  console.log(
    write
      ? `\nĐã ghi ${ready}/${entries.length} mục.`
      : `\n${ready}/${entries.length} mục sẵn sàng. Chưa ghi gì.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
