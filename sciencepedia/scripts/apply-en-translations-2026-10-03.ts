import { readdirSync, readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/utils";

/**
 * Bổ sung bản tiếng Anh cho bài đã xuất bản còn thiếu (đợt 03/10).
 *
 *   npx tsx --env-file-if-exists=.env scripts/apply-en-translations-2026-10-03.ts                 # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/apply-en-translations-2026-10-03.ts --only a,b      # chỉ vài bài
 *   npx tsx --env-file-if-exists=.env scripts/apply-en-translations-2026-10-03.ts --write         # ghi
 *
 * Dữ liệu: `docs/content/checks/2026-10-03/en-translate/<slug>.json` (titleEn, summaryEn)
 * + `<slug>.en.md` (contentEn), do `science-editor` dịch và đối chiếu từng bài với bản vi.
 *
 * ## Vì sao có lượt này
 *
 * Rà 03/10: 38/95 bài PUBLISHED thiếu cả titleEn, summaryEn lẫn contentEn. Theo
 * docs/content-rules.md ("Song ngữ phải thật") locale en không được hiển thị bài
 * thiếu summaryEn và không được fallback tiếng Việt — tức 38 bài vô hình với người
 * đọc tiếng Anh.
 *
 * ## Chỉ ĐIỀN chỗ trống, không ghi đè
 *
 * Bài nào đã có bất kỳ trường en nào thì bỏ qua: đó là việc của lượt đồng bộ
 * (apply-en-parity-*), không phải lượt dịch mới. Trường vi không bao giờ bị chạm.
 *
 * ## Vì sao vẫn tạo Revision dù trước đó bản en trống
 *
 * `scripts/restore-updated-at.ts` lấy Revision mới nhất làm mốc `updatedAt`; một lượt
 * ghi không có Revision sẽ bị hạ ngày sửa về mốc cũ. Revision ở đây chụp bản VI
 * NGUỒN đã được dịch — đúng vai `source_revision` của skill `translation`: về sau so
 * bản vi hiện tại với bản chụp này là biết bản en đã lỗi thời hay chưa.
 *
 * ## Các phép chặn cấu trúc (lệch thì dừng cả lượt)
 *
 * - Tập slug link nội bộ ở bản en phải bằng đúng bản vi (gate SEO đếm, graph suy ra).
 * - `[[...]]`: cùng số lượng, và mỗi mục en phải trỏ về CÙNG mục từ với mục vi tương
 *   ứng (khoá en là slug mục từ — quy ước các bản en đã có: `[[slug|nhãn tiếng Anh]]`).
 * - Chuỗi cấp heading phải trùng nhau.
 * Lệch tập con số chỉ cảnh báo (bản vi có thể viết "hàng triệu" chỗ en viết số) —
 * editor đọc cảnh báo trước khi ghi.
 */
const prisma = new PrismaClient();

const DIR = join(__dirname, "..", "..", "docs", "content", "checks", "2026-10-03", "en-translate");
const INTERNAL_LINK = /\]\(\/(?:[a-z]{2}\/)?articles\/([a-z0-9-]+)\)/gi;
const GLOSSARY = /\[\[([^[\]|\n]{1,80})(?:\|([^[\]\n]{1,80}))?\]\]/g;
const VI_LETTERS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const NOTE = "Bản dịch EN lần đầu 2026-10-03 (titleEn/summaryEn/contentEn) — chụp bản VI nguồn đã dịch";

type Plan = { slug: string; titleEn: string; summaryEn: string; contentEnFile: string };

const links = (md: string) => [...md.matchAll(INTERNAL_LINK)].map((m) => m[1]).sort();
const headings = (md: string) =>
  md
    .split("\n")
    .filter((l) => /^#{1,6}\s/.test(l))
    .map((l) => l.match(/^#+/)![0].length)
    .join("");
const numbers = (md: string) =>
  [...md.replace(INTERNAL_LINK, "").matchAll(/\d[\d.,]*\d|\d/g)].map((m) => m[0].replace(/[.,]/g, "")).sort();

function multisetDiff(a: string[], b: string[]): string[] {
  const left = [...a];
  for (const x of b) {
    const i = left.indexOf(x);
    if (i !== -1) left.splice(i, 1);
  }
  return left;
}

async function main() {
  const write = process.argv.includes("--write");
  const onlyArg = process.argv.find((a, i) => process.argv[i - 1] === "--only");
  const only = onlyArg ? new Set(onlyArg.split(",")) : null;
  console.log("=== BỔ SUNG BẢN EN — đợt 03/10 ===");
  console.log(write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  const terms = await prisma.glossaryTerm.findMany({ select: { id: true, slug: true, aliases: true } });
  const termOf = new Map<string, string>();
  for (const t of terms) {
    termOf.set(t.slug, t.id);
    for (const a of t.aliases) if (!termOf.has(a)) termOf.set(a, t.id);
  }
  const resolve = (raw: string) => {
    const key = slugify(raw);
    return termOf.get(key) ?? `?${key}`;
  };

  const plans = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as Plan)
    .filter((p) => !only || only.has(p.slug));

  let failures = 0;
  const fail = (m: string) => {
    console.error(`   ✗ ${m}`);
    failures++;
  };
  const planned: { slug: string; run: () => Promise<unknown> }[] = [];

  for (const plan of plans) {
    console.log(plan.slug);
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: { id: true, status: true, title: true, content: true, titleEn: true, summaryEn: true, contentEn: true },
    });
    if (!article) {
      fail("không thấy bài");
      continue;
    }
    if (article.status !== "PUBLISHED") {
      fail(`bài đang ${article.status}, chỉ dịch bài đã xuất bản`);
      continue;
    }
    if (article.titleEn !== null || article.summaryEn !== null || article.contentEn !== null) {
      console.log("   = đã có bản en, bỏ qua (không ghi đè)\n");
      continue;
    }
    const file = join(DIR, basename(plan.contentEnFile));
    if (!existsSync(file)) {
      fail(`không thấy ${plan.contentEnFile}`);
      continue;
    }
    const contentEn = readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
    const titleEn = plan.titleEn?.trim();
    const summaryEn = plan.summaryEn?.trim();
    if (!titleEn || !summaryEn || !contentEn) {
      fail("thiếu titleEn/summaryEn/contentEn");
      continue;
    }

    const lv = links(article.content);
    const le = links(contentEn);
    if (lv.join() !== le.join()) {
      fail(`link nội bộ lệch — thiếu [${multisetDiff(lv, le).join(", ")}], thừa [${multisetDiff(le, lv).join(", ")}]`);
    }

    const gv = [...article.content.matchAll(GLOSSARY)].map((m) => resolve(m[1]));
    const ge = [...contentEn.matchAll(GLOSSARY)].map((m) => resolve(m[1]));
    if (gv.slice().sort().join() !== ge.slice().sort().join()) {
      fail(`[[...]] lệch — vi [${gv.join(", ")}] / en [${ge.join(", ")}]`);
    }

    const hv = headings(article.content);
    const he = headings(contentEn);
    if (hv !== he) fail(`cấu trúc heading lệch — vi ${hv} / en ${he}`);

    for (const [label, text] of [["titleEn", titleEn], ["summaryEn", summaryEn], ["contentEn", contentEn]] as const) {
      const hit = text.match(VI_LETTERS);
      if (hit) fail(`${label} còn chữ tiếng Việt quanh "${text.slice(Math.max(0, hit.index! - 20), hit.index! + 20)}"`);
    }

    const nv = numbers(article.content);
    const ne = numbers(contentEn);
    const onlyVi = multisetDiff(nv, ne);
    const onlyEn = multisetDiff(ne, nv);
    if (onlyVi.length || onlyEn.length) {
      console.log(`   ⚠ con số lệch — chỉ vi [${onlyVi.join(" ")}], chỉ en [${onlyEn.join(" ")}]`);
    }
    console.log(`   • ${article.content.length} → ${contentEn.length} ký tự, ${lv.length} link, ${gv.length} thuật ngữ`);
    console.log();

    planned.push({
      slug: plan.slug,
      run: () =>
        prisma.$transaction([
          prisma.revision.create({
            data: { articleId: article.id, title: article.title, content: article.content, note: NOTE },
          }),
          prisma.article.update({
            where: { id: article.id },
            data: { titleEn, summaryEn, contentEn },
          }),
        ]),
    });
  }

  if (failures > 0) {
    console.error(`✗ ${failures} chỗ không đạt. KHÔNG ghi gì cả.`);
    process.exitCode = 1;
    return;
  }
  if (!write) {
    console.log(`Sẵn sàng ghi ${planned.length} bài. Chạy lại với --write.`);
    return;
  }
  for (const p of planned) {
    await p.run();
    console.log(`✓ ${p.slug}`);
  }
  console.log(`\nĐã ghi ${planned.length} bài.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
