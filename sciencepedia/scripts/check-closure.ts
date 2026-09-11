import { prisma } from "../src/lib/prisma";

/**
 * Bài nào dừng giữa chừng thay vì khép lại.
 *
 *   npx tsx scripts/check-closure.ts          # chỉ bài factCheck = PENDING
 *   npx tsx scripts/check-closure.ts --all    # cả kho
 *
 * ## Vì sao có phép rà này
 *
 * `science-editor` thẩm định lô 9 bài không nguồn ngày 2026-09-11 và thấy ba
 * bài không có phần kết, một bài cụt hẳn giữa mục. Kết luận của editor: đó là
 * dấu vết một lượt SINH BÀI BỊ CẮT NGANG, không phải lựa chọn biên tập — nên
 * các bài PENDING còn lại đáng nghi mang cùng khuyết tật.
 *
 * Đọc 41 bài bằng mắt để trả lời câu đó là việc của cả ngày. Phép rà thu nó
 * xuống còn danh sách bài cần đọc.
 *
 * ## Hai lần phải chỉnh phép đo, và đây là phần đáng giữ
 *
 * Cả hai lần đầu đều cho ra một phép đo DƯƠNG TÍNH VỚI GẦN HẾT KHO, tức không
 * phân biệt được gì:
 *
 * 1. Mọi bài kết bằng mục "Đọc thêm" chỉ chứa liên kết nội bộ → 41/41 bài
 *    "kết bằng gạch đầu dòng". Mục ấy là điều hướng, không phải phần cuối của
 *    lập luận, nên nó bị cắt trước khi đo.
 *
 * 2. Kho KHÔNG dùng tiêu đề "## Kết luận" làm chuẩn khép bài — chỉ 7/41 bài có
 *    nó. Phần lớn khép bằng một đoạn tóm dẫn bằng emoji hoặc một trích dẫn
 *    khối `>`. Bắt theo tiêu đề thì 34/41 bài báo dương tính.
 *
 * Nên thứ đo được là có ĐỘNG TÁC KHÉP LẠI nào ở cuối thân bài hay không, và
 * kho có bốn động tác hợp lệ: tiêu đề kết luận, đoạn emoji tóm ý, trích dẫn
 * khối, và — với bài biên tập lại từ nguồn ngoài hoặc bài y tế — dòng ghi
 * nguồn gốc hoặc dòng miễn trừ y tế.
 *
 * Bài không có động tác nào thì dừng giữa lúc đang trình bày. Đó là danh sách
 * cần người đọc. Script KHÔNG phán quyết — "KHÔNG-KHÉP" là nghi vấn, không
 * phải kết luận.
 */

const CONCLUSION_HEADING =
  /^##\s*(kết luận|tóm lại|tổng kết|điều đáng nhớ|nhìn lại|còn lại gì|conclusion)/im;

/** Mục phụ trợ cuối bài — điều hướng, không phải lập luận. */
const APPENDIX = /^##\s*(đọc thêm|xem thêm|nguồn|tham khảo|further reading)/i;

/** Đoạn tóm ý dẫn bằng emoji — quy ước khép bài phổ biến nhất của kho. */
const EMOJI_WRAP = /^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}]/u;

/** Dòng ghi bài gốc, với bài biên tập lại từ nguồn ngoài. */
const ATTRIBUTION = /^(\*?)(biên tập lại từ|lược dịch từ|theo bài)/i;

/** Dòng miễn trừ y tế, bắt buộc ở nội dung sức khoẻ. */
const DISCLAIMER = /không thay thế cho tư vấn|chẩn đoán|điều trị y khoa/i;

type Verdict =
  | "KHÔNG-KHÉP"
  | "khép-bằng-đoạn-tóm"
  | "khép-bằng-tiêu-đề"
  | "khép-bằng-ghi-nguồn"
  | "khép-bằng-miễn-trừ";

function stripAppendix(text: string): string {
  const parts = text.split(/^(?=##\s)/m);
  while (parts.length > 1 && APPENDIX.test(parts[parts.length - 1])) parts.pop();
  return parts.join("").trim();
}

function analyse(content: string) {
  const body = stripAppendix(content.trim());
  const lines = body.split("\n").filter((l) => l.trim());
  const last = lines[lines.length - 1]?.trim() ?? "";

  const h2 = [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const lastH2 = h2[h2.length - 1] ?? "";
  const idx = body.lastIndexOf(`## ${lastH2}`);
  const tailWords =
    idx === -1 ? 0 : body.slice(idx + lastH2.length + 3).trim().split(/\s+/).filter(Boolean).length;

  let verdict: Verdict;
  if (CONCLUSION_HEADING.test(body)) verdict = "khép-bằng-tiêu-đề";
  else if (ATTRIBUTION.test(last)) verdict = "khép-bằng-ghi-nguồn";
  else if (DISCLAIMER.test(last)) verdict = "khép-bằng-miễn-trừ";
  else if (EMOJI_WRAP.test(last) || last.startsWith(">")) verdict = "khép-bằng-đoạn-tóm";
  else verdict = "KHÔNG-KHÉP";

  // Dấu hiệu phụ — chỉ có nghĩa khi đi kèm KHÔNG-KHÉP.
  const flags: string[] = [];
  if (/^[-*•]\s/.test(last)) flags.push("kết-bằng-gạch-đầu-dòng");
  if (/^\|/.test(last)) flags.push("kết-bằng-bảng");
  if (h2.length > 1 && tailWords < 50) flags.push(`mục-cuối-mỏng(${tailWords}từ)`);
  if (/\?$/.test(lastH2)) flags.push("mục-cuối-là-câu-hỏi");

  const words = body.split(/\s+/).filter(Boolean).length;
  return { verdict, flags, h2Count: h2.length, lastH2, tailWords, last, words };
}

async function main() {
  const all = process.argv.includes("--all");

  const arts = await prisma.article.findMany({
    where: all ? {} : { factCheck: "PENDING" },
    select: { slug: true, content: true, factCheck: true, _count: { select: { sources: true } } },
  });

  const rows = arts
    .map((a) => ({ slug: a.slug, src: a._count.sources, fc: a.factCheck, ...analyse(a.content) }))
    .sort((x, y) => x.src - y.src || y.flags.length - x.flags.length);

  const order: Verdict[] = [
    "KHÔNG-KHÉP",
    "khép-bằng-đoạn-tóm",
    "khép-bằng-tiêu-đề",
    "khép-bằng-ghi-nguồn",
    "khép-bằng-miễn-trừ",
  ];

  console.log(`${rows.length} bài${all ? " (cả kho)" : " (factCheck = PENDING)"}\n`);

  for (const v of order) {
    const group = rows.filter((r) => r.verdict === v);
    if (!group.length) continue;
    console.log(`\n===== ${v} — ${group.length} bài =====\n`);
    for (const r of group) {
      console.log(`src=${r.src} h2=${r.h2Count} w=${r.words}  ${r.slug}`);
      if (v === "KHÔNG-KHÉP") {
        if (r.flags.length) console.log(`   ⚠ ${r.flags.join(" · ")}`);
        console.log(`   mục cuối: "${r.lastH2}" (${r.tailWords} từ)`);
        console.log(`   dòng cuối: ${JSON.stringify(r.last.slice(0, 95))}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
