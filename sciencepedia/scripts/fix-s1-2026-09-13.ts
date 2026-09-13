/**
 * Đóng ba phát hiện mức S1 của lượt rà 2026-09-13. CHỈ S1, không đụng S2/S3.
 *
 * Tách riêng đúng như lượt 2026-09-11 đã làm: S1 là thứ có thể đổi hành vi
 * người đọc, nên nó không được xếp hàng chờ cùng những lỗi sửa câu chữ.
 *
 * Ba lỗi, cả ba ở nội dung sức khoẻ:
 *
 *   A. `van-dong-…`  — một nguồn BỊA trong bảng Source.
 *   B. `van-dong-…`  — đặt vận động ngang hàng thuốc hạ áp rồi im lặng.
 *   C. `he-vi-sinh-…` — đầu ra thô của trợ lý AI dán thẳng vào thân bài.
 *
 * Mọi câu thay thế là NGUYÊN VĂN của `science-editor`, chép từ khối
 * `replacement_text` trong `docs/content/checks/*.yaml`. Không diễn đạt lại:
 * một câu về chống chỉ định y tế do người khác viết lại thì không còn là câu
 * đã qua gate.
 *
 * Mỗi bài một transaction, kèm `Revision` chụp bản TRƯỚC khi sửa.
 * `lastVerifiedAt` KHÔNG đặt: lượt này chỉ đóng S1, mỗi bài còn nhiều phát
 * hiện S2/S3 chưa áp. `factCheck` giữ nguyên PENDING.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const write = process.argv.includes("--write");

const VAN_DONG = "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao";
const VI_SINH = "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung";

/* ── A. Nguồn bịa ──────────────────────────────────────────────────────────
   "Exercise and cardiovascular health: mechanisms and clinical implications",
   Circulation Research 2019 — không tồn tại. Không url, không doi, nên nó lọt
   qua cả `check-citations.ts` (chỉ soi hàng CÓ doi) lẫn `isAlive()` (chỉ soi
   hàng CÓ url): một nguồn không cung cấp gì để kiểm thì không có gì kiểm nó. */
const FAKE_SOURCE_TITLE =
  "Exercise and cardiovascular health: mechanisms and clinical implications";

/* Ba nguồn THẬT thay vào, mỗi nguồn gắn vào đúng claim nó chống lưng. Điều
   kiện của phán quyết 2026-09-05: đổi claim thì phải đổi cả bảng nguồn. */
const REAL_SOURCES = [
  {
    title:
      "Exercise, Alcohol, and Other Lifestyle Factors in Reducing Blood Pressure: Endurance Training and Blood Pressure — a meta-analysis of 93 randomized controlled trials",
    publisher: "Journal of the American Heart Association 2:e004473 — Cornelissen & Smart",
    url: "https://doi.org/10.1161/JAHA.112.004473",
    doi: "10.1161/JAHA.112.004473",
    year: 2013,
    tier: 1,
  },
  {
    title:
      "Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing",
    publisher: "JAMA Network Open 1:e183605 — Mandsager et al.",
    url: "https://doi.org/10.1001/jamanetworkopen.2018.3605",
    doi: "10.1001/jamanetworkopen.2018.3605",
    year: 2018,
    tier: 1,
  },
  {
    title: "Exercise and the Cardiovascular System: Clinical Science and Cardiovascular Outcomes",
    publisher: "Circulation Research 117:207-219 — Lavie, Arena, Swift et al.",
    url: "https://doi.org/10.1161/CIRCRESAHA.117.305205",
    doi: "10.1161/CIRCRESAHA.117.305205",
    year: 2015,
    tier: 1,
  },
];

/** Thay đúng một lần; khớp khác một lần thì DỪNG chứ không đoán tiếp. */
function replaceOnce(haystack: string, from: string, to: string, label: string): string {
  const hits = haystack.split(from).length - 1;
  if (hits !== 1) throw new Error(`${label}: khớp ${hits} lần, cần đúng 1`);
  return haystack.replace(from, to);
}

/** Cắt từ `start` tới ngay trước `stop`, thay bằng `to`. */
function cutBlock(text: string, start: string, stop: string, to: string, label: string): string {
  const i = text.indexOf(start);
  const j = text.indexOf(stop);
  if (i < 0 || j < 0 || j <= i) throw new Error(`${label}: không khoanh được khối (${i}, ${j})`);
  return text.slice(0, i) + to + text.slice(j);
}

async function fixVanDong() {
  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: VAN_DONG },
    select: { id: true, title: true, content: true, contentEn: true, sources: { select: { id: true, title: true } } },
  });

  /* B — R1: trả lại con số đúng theo phân nhóm, bỏ phép so với thuốc. */
  let vi = replaceOnce(
    a.content,
    "Tập luyện đều đặn cải thiện chức năng nội mô, và đây được xem là một trong những cơ chế trung tâm giải thích vì sao vận động hạ được huyết áp: các phân tích tổng hợp cho thấy mức giảm khoảng 5–8 mmHg huyết áp tâm thu ở người tăng huyết áp — tương đương một số thuốc đơn trị liệu.",
    "Tập luyện đều đặn cải thiện chức năng nội mô, và đây được xem là một trong những cơ chế giải thích vì sao vận động hạ được huyết áp. Phân tích tổng hợp 93 thử nghiệm của Cornelissen và Smart (2013) cho thấy ở nhóm người **đã tăng huyết áp**, tập bền bỉ hạ huyết áp tâm thu trung bình **8,3 mmHg** (giới hạn tin cậy 6,0–10,7) và huyết áp tâm trương 5,2 mmHg. Ở người huyết áp bình thường, mức giảm nhỏ hơn hẳn — 3,5 mmHg tâm thu.",
    "van-dong R1",
  );

  /* B — R2: mục riêng CÓ TIÊU ĐỀ, đặt ngay trước phần Kết luận.
     Chống chỉ định y tế phải gặp được khi LƯỚT, không nhét trong kết luận. */
  const R2 = `## Vận động không thay thế thuốc đang dùng

Mức hạ huyết áp nhờ tập luyện có thể sánh với một thuốc hạ áp đơn trị, và chính điều đó khiến một số người nghĩ tới chuyện bỏ thuốc. **Đừng tự bỏ.** Các khuyến cáo điều trị xếp vận động là biện pháp *đi kèm* thuốc, không phải biện pháp thay thế; ngừng thuốc hạ áp đột ngột có thể làm huyết áp bật lên cao hơn trước và làm tăng nguy cơ đột quỵ. Nếu tập luyện đã đưa huyết áp của bạn xuống, đó là lý do để bác sĩ cân nhắc chỉnh liều — và việc chỉnh liều là của bác sĩ.

Hãy đi khám trước khi bắt đầu nếu bạn có bệnh tim mạch đã biết, tăng huyết áp chưa kiểm soát, đái tháo đường, hoặc đã lâu không vận động.

**Ngừng tập và đi khám ngay nếu khi gắng sức bạn thấy:** đau hoặc tức ngực, khó thở nhiều hơn hẳn so với mức gắng sức đang làm, choáng váng hoặc ngất, tim đập không đều, hoặc đau lan lên hàm, cổ hay cánh tay.

`;

  /* Câu chống chỉ định CŨ bị gỡ khỏi chỗ cũ — nó là dòng cuối của mục
     "Khuyến nghị hiện hành", không có tiêu đề riêng, nên người lướt không
     gặp. R2 thay nó và nói rộng hơn. */
  vi = replaceOnce(
    vi,
    "\n\nNgười có bệnh tim mạch, tăng huyết áp chưa kiểm soát hoặc lâu không vận động nên trao đổi với bác sĩ trước khi bắt đầu chương trình cường độ cao.",
    "",
    "van-dong gỡ câu chống chỉ định cũ",
  );

  /* Bài này KHÔNG có mục "Kết luận" — nó khép bằng dòng miễn trừ y tế sau một
     đường kẻ ngang. Editor chỉ định R2 đứng SAU "Khuyến nghị hiện hành" và
     TRƯỚC dòng miễn trừ, nên neo vào chính đường kẻ ấy. */
  vi = replaceOnce(
    vi,
    "\n---\n\n*Bài viết cung cấp thông tin khoa học",
    "\n" + R2 + "---\n\n*Bài viết cung cấp thông tin khoa học",
    "van-dong R2",
  );

  return { article: a, vi, fake: a.sources.find((s) => s.title === FAKE_SOURCE_TITLE) };
}

async function fixViSinh() {
  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: VI_SINH },
    select: { id: true, title: true, content: true, contentEn: true },
  });

  /* C — R1: CẮT toàn bộ khối, cả hai ngôn ngữ. Không viết lại từng câu:
     không một câu nào trong khối có nguồn, nên không có gì để cứu. */
  const vi = cutBlock(
    a.content,
    "vì sao nhịn ăn gián đoạn (Intermittent Fasting) lại làm thay đổi quần thể vi khuẩn ruột.",
    "## Kết luận",
    "Nhịn ăn gián đoạn cũng làm thay đổi thành phần hệ vi sinh, nhưng đó là một chủ đề riêng và có những chống chỉ định riêng — xem bài [Nhịn ăn gián đoạn ảnh hưởng tới hệ vi sinh đường ruột như thế nào?](/articles/nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao).\n\n",
    "vi-sinh R1 (VI)",
  );

  const en = cutBlock(
    a.contentEn ?? "",
    "Why Intermittent Fasting (IF) changes the gut microbial population.",
    "## Conclusion",
    "Intermittent fasting also shifts the composition of the gut microbiota, but that is a separate topic with contraindications of its own — see [How intermittent fasting affects the gut microbiota](/articles/nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao).\n\n",
    "vi-sinh R1 (EN)",
  );

  return { article: a, vi, en };
}

async function main() {
  const vd = await fixVanDong();
  const vs = await fixViSinh();

  const report = [
    `van-dong  VI ${vd.article.content.length} → ${vd.vi.length} ký tự` +
      ` | nguồn bịa: ${vd.fake ? "tìm thấy, sẽ gỡ" : "KHÔNG THẤY (có thể đã gỡ)"}`,
    `vi-sinh   VI ${vs.article.content.length} → ${vs.vi.length} ký tự` +
      ` (cắt ${vs.article.content.length - vs.vi.length})`,
    `vi-sinh   EN ${(vs.article.contentEn ?? "").length} → ${vs.en.length} ký tự` +
      ` (cắt ${(vs.article.contentEn ?? "").length - vs.en.length})`,
    `vi-sinh   số từ VI sau cắt: ${vs.vi.trim().split(/\s+/).length}`,
  ];
  report.forEach((r) => console.log("  " + r));

  if (!write) {
    console.log("\nChạy khô. Thêm `--write` để ghi thật.");
    return;
  }

  await prisma.$transaction([
    prisma.revision.create({
      data: {
        articleId: vd.article.id,
        title: vd.article.title,
        content: vd.article.content,
        note: "Trước khi đóng S1: gỡ nguồn bịa, sửa câu so sánh với thuốc hạ áp, thêm mục chống chỉ định",
      },
    }),
    prisma.article.update({ where: { id: vd.article.id }, data: { content: vd.vi } }),
    ...(vd.fake ? [prisma.source.delete({ where: { id: vd.fake.id } })] : []),
    prisma.source.createMany({
      data: REAL_SOURCES.map((s) => ({ ...s, articleId: vd.article.id, accessedAt: new Date() })),
    }),
  ]);
  console.log("✔ van-dong — đã đóng S1 (nguồn bịa + im lặng về thuốc)");

  await prisma.$transaction([
    prisma.revision.create({
      data: {
        articleId: vs.article.id,
        title: vs.article.title,
        content: vs.article.content,
        note: "Trước khi đóng S1: cắt khối nhịn ăn gián đoạn (đầu ra thô của trợ lý AI, không nguồn)",
      },
    }),
    prisma.article.update({
      where: { id: vs.article.id },
      data: { content: vs.vi, contentEn: vs.en },
    }),
  ]);
  console.log("✔ vi-sinh — đã đóng S1 (cắt khối AI, cả hai ngôn ngữ)");
}

main()
  .catch((e) => {
    console.error("DỪNG:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
