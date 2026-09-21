import { readFileSync, writeFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { extractGlossaryKeys } from "../src/lib/glossary";

/**
 * Điền lại trường `usedIn` của `prisma/seed-data/glossary.json` từ thực tế.
 *
 *   npm run glossary:usedin              # in kế hoạch, KHÔNG ghi gì
 *   npm run glossary:usedin -- --write   # ghi tệp
 *
 * ## Vì sao cần một lệnh riêng
 *
 * `usedIn` là danh sách bài đang dùng mục từ, và nó lệch ngay khi có ai gắn
 * thêm một `[[...]]`. Viết tay thì chắc chắn lệch: 12 mục cũ có trường này,
 * 10 mục thêm ngày 21/09 thì không, và không ai nhận ra cho tới lúc
 * science-editor soi.
 *
 * Trường này KHÔNG vào CSDL — schema Zod của `seed-glossary.ts` bỏ qua nó.
 * Nó sống trong file để người đọc file biết mục từ đang phục vụ bài nào,
 * trước khi sửa định nghĩa hay đổi slug.
 *
 * ## Vì sao CHỈ THÊM, không xoá bài chưa gắn dấu
 *
 * `usedIn` nghĩa là "bài DÙNG khái niệm này", rộng hơn "bài đã gắn
 * `[[...]]`". Một lượt đồng bộ ngây thơ — ghi đè bằng đúng những bài có dấu —
 * sẽ xoá mất chính những dòng đáng giá nhất: `hieu-ung-nha-kinh` mất bài Sao
 * Kim, `tien-dong` mất bài 20 ngôi sao, `sieu-tan-tinh` mất bài hố đen. Hai
 * bài sau là chỗ science-editor CỐ Ý không cho gắn (câu sai nhân quả, câu sai
 * số năm), nên xoá chúng khỏi `usedIn` là xoá luôn dấu vết của phán quyết ấy.
 *
 * Nên: thêm bài mới gắn được, GIỮ bài có tên mà chưa gắn (in ra như một việc
 * còn tồn), và chỉ xoá khi slug KHÔNG còn là bài đã xuất bản — tức là bài đã
 * đổi tên hoặc biến mất.
 *
 * Quét cả `content` lẫn `contentEn`, và tính cả alias: bài gắn
 * `[[mo-men-dong-luong|...]]` vẫn là bài đang dùng mục `dong-luong-goc`.
 */
const prisma = new PrismaClient();

const PATH = "prisma/seed-data/glossary.json";

type Entry = {
  slug: string;
  aliases?: string[];
  usedIn?: string[];
  [key: string]: unknown;
};

async function main() {
  const write = process.argv.slice(2).includes("--write");

  const entries = JSON.parse(readFileSync(PATH, "utf8")) as Entry[];
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, content: true, contentEn: true },
    orderBy: { slug: "asc" },
  });

  const used = new Map<string, string[]>();
  for (const article of articles) {
    const keys = new Set(
      extractGlossaryKeys(`${article.content}\n${article.contentEn ?? ""}`),
    );
    for (const key of keys) {
      used.set(key, [...(used.get(key) ?? []), article.slug]);
    }
  }

  const live = new Set(articles.map((a) => a.slug));

  let changed = 0;
  let pending = 0;
  for (const entry of entries) {
    const keys = [entry.slug, ...(entry.aliases ?? [])];
    const marked = new Set(keys.flatMap((k) => used.get(k) ?? []));
    const before = entry.usedIn ?? [];

    const kept = before.filter((s) => live.has(s));
    const dropped = before.filter((s) => !live.has(s));
    const added = [...marked].filter((s) => !kept.includes(s));
    const next = [...new Set([...kept, ...added])].sort();

    // Bài có tên trong `usedIn` mà chưa gắn dấu: việc còn tồn, không phải lỗi.
    const unmarked = next.filter((s) => !marked.has(s));
    pending += unmarked.length;

    if (before.length === next.length && before.every((s, i) => s === next[i])) {
      if (unmarked.length > 0) {
        console.log(`${entry.slug}: ${unmarked.length} bài chưa gắn dấu`);
        for (const s of unmarked) console.log(`   ? ${s}`);
      }
      continue;
    }

    changed += 1;
    console.log(`${entry.slug}: ${before.length} → ${next.length} bài`);
    for (const s of added) console.log(`   + ${s}  (vừa gắn dấu)`);
    for (const s of dropped) console.log(`   - ${s}  (slug không còn là bài đã xuất bản)`);
    for (const s of unmarked) console.log(`   ? ${s}  (có tên nhưng chưa gắn dấu)`);
    entry.usedIn = next;
  }

  console.log(`\n${changed}/${entries.length} mục lệch; ${pending} cặp (mục từ x bài) có tên mà chưa gắn dấu.`);
  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }
  if (changed === 0) return;

  writeFileSync(PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
  console.log(`Đã ghi ${PATH}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
