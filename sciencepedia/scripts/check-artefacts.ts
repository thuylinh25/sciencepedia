import { prisma } from "../src/lib/prisma";

/** Rác cú pháp lọt từ lượt sinh bài vào cột `content`. */
const CHECKS: { name: string; test: (c: string) => string | null }[] = [
  {
    name: "dòng chỉ có một backtick",
    test: (c) => {
      const hits = c.split("\n").map((l, i) => [i + 1, l.trim()] as const)
        .filter(([, l]) => l === "`");
      return hits.length ? hits.map(([n]) => `dòng ${n}`).join(", ") : null;
    },
  },
  {
    name: "số ``` lẻ (fence chưa đóng)",
    test: (c) => {
      const n = (c.match(/```/g) ?? []).length;
      return n % 2 ? `${n} dấu` : null;
    },
  },
  {
    name: "còn ${...} chưa nội suy",
    test: (c) => (/\$\{[^}]*\}/.test(c) ? (c.match(/\$\{[^}]*\}/g) ?? []).join(" ") : null),
  },
  {
    name: "kết thúc giữa câu",
    test: (c) => {
      const last = c.trimEnd().split("\n").filter((l) => l.trim()).pop() ?? "";
      return /[a-zàâăêôơưđ,]$/i.test(last.trim()) ? JSON.stringify(last.slice(-60)) : null;
    },
  },
  {
    name: "dòng --- lạc ở cuối",
    test: (c) => (c.trimEnd().endsWith("---") ? "có" : null),
  },
];

async function main() {
  const arts = await prisma.article.findMany({
    select: { slug: true, content: true, contentEn: true, factCheck: true },
  });

  let total = 0;
  for (const a of arts) {
    for (const [locale, body] of [["vi", a.content], ["en", a.contentEn]] as const) {
      if (!body) continue;
      for (const c of CHECKS) {
        const hit = c.test(body);
        if (hit) {
          console.log(`${a.factCheck.padEnd(8)} ${locale}  ${a.slug}`);
          console.log(`    ${c.name}: ${hit}`);
          total++;
        }
      }
    }
  }
  console.log(`\n${total} phát hiện trên ${arts.length} bài`);
}

main().finally(() => prisma.$disconnect());
