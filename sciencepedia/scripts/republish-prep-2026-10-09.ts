import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ các mục CHẶN do máy làm được cho 3 bài về DRAFT sau đính chính 09/10
 * (`scripts/apply-corrections-2026-10-09-b.ts`), để đăng lại qua `npm run publish`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09.ts                   # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09.ts --write           # entity + readingTime
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-09.ts --write --links   # + link vào
 *
 * - entity: tạo nếu chưa có (Wikidata đã tra wbsearchentities 2026-10-09) rồi gắn vào bài.
 * - readingTime: tính lại theo nội dung đã sửa — cùng công thức với `check-publish.ts`.
 * - link vào (`--links`): sửa bài ĐANG PUBLISHED để trỏ vào bài DRAFT. Chỉ ghi cho bài đích đã
 *   có factCheck PASSED + byline duyệt, tức là sắp `npm run publish` ngay sau đó — ghi sớm hơn
 *   thì người đọc bài nguồn bấm vào gặp 404. Gate chỉ đếm link từ bài PUBLISHED nên không thể
 *   đăng trước rồi mới thêm link.
 *
 * Script KHÔNG đổi factCheck, byline duyệt hay status — đó là quyết định của người duyệt.
 */
const prisma = new PrismaClient();

type Job = {
  slug: string;
  entity: {
    slug: string;
    canonicalName: string;
    canonicalNameEn: string;
    entityType: EntityType;
    aliases: string[];
    wikidataQid: string;
    description: string;
  };
  backlink: { from: string; find: string; replace: string; why: string };
};

const DAU = "bi-an-giai-phau-vi-sao-bo-nao-khong-the-cam-nhan-dau";
const BAT_TU = "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the";
const SARC = "chung-teo-co-do-tuoi-tac-sarcopenia-ke-thu-tham-lang-cua-tuoi-gia";

const JOBS: Job[] = [
  {
    slug: DAU,
    entity: {
      slug: "dau-dau",
      canonicalName: "Đau đầu",
      canonicalNameEn: "Headache",
      entityType: "PHENOMENON",
      aliases: ["nhức đầu", "headache"],
      wikidataQid: "Q86",
      description: "Đau hoặc khó chịu ở vùng đầu, gồm đau đầu nguyên phát (migraine, đau đầu kiểu căng thẳng) và đau đầu thứ phát do bệnh khác.",
    },
    backlink: {
      from: "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai",
      find: "- Đau đầu do căng thẳng.",
      replace: `- [Đau đầu do căng thẳng](/articles/${DAU}).`,
      why: "Danh sách tình trạng châm cứu có thể giúp; bài đích có mục riêng về đau đầu kiểu căng thẳng và cơ chế còn chưa rõ.",
    },
  },
  {
    slug: BAT_TU,
    entity: {
      slug: "lao-hoa-sinh-hoc",
      canonicalName: "Lão hoá sinh học",
      canonicalNameEn: "Senescence",
      entityType: "PROCESS",
      aliases: ["lão hoá", "lão hóa", "senescence"],
      wikidataQid: "Q2070979",
      description: "Sự suy giảm chức năng của sinh vật theo tuổi; sinh học tiến hoá giải thích bằng việc sức chọn lọc tự nhiên giảm dần theo tuổi.",
    },
    backlink: {
      from: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
      find: "Các nhà sinh học tiến hóa đã đưa ra nhiều lời giải thích cho hiện tượng lão hóa.",
      replace: `Các nhà sinh học tiến hóa đã đưa ra nhiều lời giải thích cho hiện tượng [lão hóa](/articles/${BAT_TU}).`,
      why: "Câu mở mục 'Vì sao cơ thể lão hóa?'; bài đích trình bày đủ ba thuyết chủ lưu và vì sao thuyết 'lão hoá được lập trình' không đứng vững.",
    },
  },
  {
    slug: SARC,
    entity: {
      slug: "sarcopenia",
      canonicalName: "Sarcopenia",
      canonicalNameEn: "Sarcopenia",
      entityType: "PHENOMENON",
      aliases: ["chứng teo cơ do tuổi tác"],
      wikidataQid: "Q1787939",
      description: "Bệnh của cơ xương: sức cơ và khối cơ giảm dưới ngưỡng chẩn đoán (EWGSOP2, AWGS 2019), thường gặp ở người cao tuổi.",
    },
    backlink: {
      from: "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
      find: "- [Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?](/articles/stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa)",
      replace:
        "- [Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?](/articles/stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa)\n" +
        `- [Chứng teo cơ do tuổi tác (Sarcopenia): kẻ thù thầm lặng của tuổi già](/articles/${SARC})`,
      why: "Mục Đọc thêm: kho chưa có câu nào trong bài đã đăng nói về sarcopenia — neo vào 'mất cơ' do nhịn ăn sẽ là link sai nghĩa. Bài đích trỏ ngược lại bài này.",
    },
  },
];

// Cùng công thức với scripts/check-publish.ts (`prose`, `countWords`, WORDS_PER_MINUTE) — không
// import vì check-publish chạy main() khi được nạp.
const PROVENANCE = /\b(?:Nguồn|Source|Bản quyền|Trang chủ|viết lại từ)\b/i;
function prose(markdown: string): string {
  const cut = markdown.lastIndexOf("\n---");
  if (cut === -1) return markdown;
  const tail = markdown.slice(cut);
  if (!/^\n-{3,}[ \t]*\n/.test(tail)) return markdown;
  if (tail.length > 1_000) return markdown;
  return PROVENANCE.test(tail) ? markdown.slice(0, cut).trimEnd() : markdown;
}
const readingTimeOf = (content: string) => Math.max(1, Math.round(prose(content).trim().split(/\s+/).length / 200));

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const links = argv.includes("--links");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const touched = new Set<string>();
  for (const job of JOBS) {
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: job.slug },
      select: { id: true, status: true, content: true, readingTime: true, entityId: true, factCheck: true, reviewedById: true, reviewedAt: true },
    });
    console.log(`\n══════ ${job.slug} (${a.status}, factCheck ${a.factCheck})`);

    const rt = readingTimeOf(a.content);
    const existing = await prisma.entity.findUnique({ where: { slug: job.entity.slug }, select: { id: true } });
    console.log(`readingTime ${a.readingTime} → ${rt} · entity ${job.entity.slug} (${existing ? "đã có" : "tạo mới"}, ${job.entity.wikidataQid})${a.entityId ? " — bài đã gắn entity khác, giữ" : ""}`);
    if (write) {
      const entityId = a.entityId ?? (existing ? existing.id : (await prisma.entity.create({ data: job.entity, select: { id: true } })).id);
      await prisma.article.update({ where: { id: a.id }, data: { readingTime: rt, entityId } });
      touched.add(job.slug);
    }

    const b = job.backlink;
    const src = await prisma.article.findUniqueOrThrow({ where: { slug: b.from }, select: { id: true, status: true, content: true } });
    if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${b.from} không PUBLISHED`);
    if (src.content.includes(`/articles/${job.slug}`)) {
      console.log(`link vào: đã có từ ${b.from}`);
      continue;
    }
    const n = src.content.split(b.find).length - 1;
    if (n !== 1) throw new Error(`[${b.from}] cụm neo khớp ${n} chỗ, cần đúng 1`);
    const ready = a.factCheck === "PASSED" && a.reviewedById && a.reviewedAt;
    console.log(`link vào từ ${b.from}${ready ? "" : " — CHỜ: bài đích chưa có factCheck PASSED + byline duyệt"}`);
    console.log(`   vì: ${b.why}`);
    if (write && links && ready) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(b.find, () => b.replace) } });
      touched.add(b.from);
      console.log("   ĐÃ GHI link vào");
    }
  }

  if (write && touched.size) await revalidateSite([...touched]);
  if (!write) console.log("\nChưa ghi gì.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
