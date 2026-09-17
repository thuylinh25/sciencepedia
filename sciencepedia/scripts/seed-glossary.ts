import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { slugify } from "../src/lib/utils";

/**
 * Đồng bộ `prisma/seed-data/glossary.json` sang bảng `GlossaryTerm`.
 *
 *   npm run glossary:seed              # in kế hoạch, KHÔNG ghi gì
 *   npm run glossary:seed -- --write   # tạo mục mới + cập nhật mục chưa ai sửa tay
 *   npm run glossary:seed -- --write --force   # đè cả mục đã sửa tay
 *
 * `/admin/glossary` cũng ghi vào bảng này. Mục nào trong CSDL đã khác file thì
 * nhiều khả năng biên tập viên vừa sửa tay; đè nó bằng bản trong file là xoá
 * lặng lẽ công của người ta — không lỗi, không cảnh báo, chỉ là chữ cũ quay
 * về. Nên lượt ghi thường GIỮ NGUYÊN mục lệch và in ra lệch ở trường nào;
 * muốn file thắng thì phải nói thẳng bằng `--force`.
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

/**
 * Những trường seed quản. `image`/`imageCredit` không nằm đây: file JSON không
 * có chúng, ảnh chỉ đến từ trang quản trị — so sánh sẽ luôn báo lệch.
 */
const MANAGED = [
  "term",
  "termEn",
  "shortDef",
  "shortDefEn",
  "fullDef",
  "fullDefEn",
  "aliases",
  "category",
] as const;

type Managed = { [K in (typeof MANAGED)[number]]: string | string[] | null };

/** Tên những trường CSDL khác file. Rỗng nghĩa là chưa ai đụng vào. */
function drift(current: Managed, next: Managed): string[] {
  return MANAGED.filter((field) => {
    const a = current[field];
    const b = next[field];
    if (Array.isArray(a) || Array.isArray(b)) {
      const left = Array.isArray(a) ? a : [];
      const right = Array.isArray(b) ? b : [];
      return left.length !== right.length || left.some((value, i) => value !== right[i]);
    }
    return a !== b;
  });
}

async function main() {
  const flags = process.argv.slice(2);
  const write = flags.includes("--write");
  const force = flags.includes("--force");
  const file = path.join(__dirname, "..", "prisma", "seed-data", "glossary.json");
  const entries = z.array(entrySchema).parse(JSON.parse(readFileSync(file, "utf8")));

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  let ready = 0;
  let kept = 0;
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
    const current = await prisma.glossaryTerm.findUnique({
      where: { slug: entry.slug },
      select: {
        term: true,
        termEn: true,
        shortDef: true,
        shortDefEn: true,
        fullDef: true,
        fullDefEn: true,
        aliases: true,
        category: true,
      },
    });
    const changed = current ? drift(current, data) : [];

    if (current && changed.length > 0 && !force) {
      kept += 1;
      console.log(
        `  GIỮ NGUYÊN ${entry.slug}: CSDL khác file ở ${changed.join(", ")}` +
          " — có thể vừa sửa trên /admin/glossary. Thêm --force nếu muốn file thắng.",
      );
      continue;
    }

    ready += 1;
    const label = !current
      ? "TẠO MỚI "
      : changed.length === 0
        ? "KHÔNG ĐỔI"
        : `ĐÈ (${changed.join(", ")})`;
    console.log(
      `  ${label} ${entry.slug}  (${entry.aliases.length} alias, ${entry.sources.length} nguồn)`,
    );

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
  if (kept > 0) {
    console.log(
      `${kept} mục giữ nguyên vì CSDL đã lệch khỏi file. Sửa file cho khớp bản` +
        " trên trang quản trị, hoặc chạy lại với --force nếu file mới là bản đúng.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
