import { EntityType, PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Gỡ hai mục CHẶN còn lại (chưa entity, 0 link vào) của ba bài đính chính 12/10 sau khi người đã ký
 * duyệt (`scripts/pass-factcheck-2026-10-12-{b,c,d}.ts`): nón ánh sáng quá khứ, chế độ khẩn cấp mạn
 * tính, hội chứng thiếu máu. Cả ba vẫn PUBLISHED suốt quá trình nên không cần `npm run publish`.
 *
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-12-b.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/republish-prep-2026-10-12-b.ts --write
 *
 * Entity: Wikidata tra wbsearchentities 2026-10-12. Link vào: neo giữa câu khi bài nguồn có đúng
 * một câu nói về điều bài đích giải thích; không có thì thêm vào "Đọc thêm". Không neo "thiếu máu"
 * ở bài tim ngừng đập — chữ ấy ở đó là thiếu máu cục bộ (ischemia), khác nghĩa.
 *
 * Chỉ ghi khi bài đích đã PUBLISHED + PASSED + có byline. Script KHÔNG đổi factCheck, byline, status.
 */
const prisma = new PrismaClient();

type Entity = {
  slug: string;
  canonicalName: string;
  canonicalNameEn: string;
  entityType: EntityType;
  aliases: string[];
  wikidataQid: string;
  description: string;
};
type Job = { slug: string; entity: Entity; backlink: { from: string; find: string; replace: string; why: string } };

const NON = "non-anh-sang-qua-khu-ban-chat-vat-ly-cua-viec-quan-sat-vu-tru";
const KHAN = "che-do-khan-cap-man-tinh-co-che-sinh-hoc-tu-cang-thang-den-benh-tat";
const MAU = "hoi-chung-thieu-mau-khi-co-the-van-hanh-nhu-mot-cai-cay-thieu-nuoc";

const JOBS: Job[] = [
  {
    slug: NON,
    entity: {
      slug: "non-anh-sang",
      canonicalName: "Nón ánh sáng",
      canonicalNameEn: "Light cone",
      entityType: "CONCEPT",
      aliases: ["light cone", "nón ánh sáng quá khứ", "past light cone"],
      wikidataQid: "Q1137903",
      description: "Mặt hình nón kép quanh một sự kiện trong không-thời gian, tạo bởi đường đi của các tia sáng tới và đi từ sự kiện ấy; tách các sự kiện có thể và không thể ảnh hưởng qua lại với nó.",
    },
    backlink: {
      from: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
      find: "bầu trời biến thành một cửa sổ nhìn ngược thời gian",
      replace: `bầu trời biến thành một [cửa sổ nhìn ngược thời gian](/articles/${NON})`,
      why: "Câu kết bài nói đúng điều bài đích giải thích: ánh sáng ta thấy là ánh sáng đã rời thiên thể từ trước.",
    },
  },
  {
    slug: KHAN,
    entity: {
      slug: "cang-thang-man-tinh",
      canonicalName: "Căng thẳng mạn tính",
      canonicalNameEn: "Chronic stress",
      entityType: "PHENOMENON",
      aliases: ["stress mạn tính", "chronic stress", "căng thẳng kéo dài"],
      wikidataQid: "Q3305232",
      description: "Phản ứng căng thẳng bị kích hoạt kéo dài; có thể góp phần làm tăng nguy cơ bệnh tim mạch, chuyển hoá, viêm mạn tính và thay đổi ở não.",
    },
    backlink: {
      from: "stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa",
      find: "Nếu không có thời gian phục hồi, stress mạn tính có thể góp phần gây:",
      replace: `Nếu không có thời gian phục hồi, [stress mạn tính](/articles/${KHAN}) có thể góp phần gây:`,
      why: "Câu dẫn danh sách tác hại của stress kéo dài; bài đích trình bày cơ chế và mức bằng chứng của từng tác hại.",
    },
  },
  {
    slug: MAU,
    entity: {
      slug: "thieu-mau",
      canonicalName: "Thiếu máu",
      canonicalNameEn: "Anemia",
      entityType: "PHENOMENON",
      aliases: ["anemia", "anaemia", "hội chứng thiếu máu"],
      wikidataQid: "Q5445",
      description: "Tình trạng máu có ít hồng cầu khỏe mạnh hơn bình thường, khiến cơ thể không nhận đủ máu giàu oxy; có nhiều nguyên nhân, phổ biến nhất là thiếu sắt.",
    },
    backlink: {
      from: "bien-dong-thoi-tiet-va-he-tim-mach-vi-sao-thoi-tiet-co-the-anh-huong-den-huyet-ap",
      find: "- [Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?](/articles/stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa)",
      replace:
        "- [Stress tác động lên cơ thể như thế nào và vì sao vận động giúp chúng ta giải tỏa?](/articles/stress-tac-dong-len-co-the-nhu-the-nao-va-vi-sao-van-dong-giup-chung-ta-giai-toa)\n" +
        `- [Hội chứng thiếu máu: khi cơ thể vận hành như một "cái cây thiếu nước"](/articles/${MAU})`,
      why: "Mục Đọc thêm: bài nguồn nói cơ thể bù khi máu nhận ít oxy (lên cao, hemoglobin); không có câu nào nói về thiếu máu để neo giữa câu.",
    },
  },
];

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  const touched = new Set<string>();

  for (const job of JOBS) {
    const a = await prisma.article.findUniqueOrThrow({
      where: { slug: job.slug },
      select: { id: true, status: true, entityId: true, factCheck: true, reviewedById: true, reviewedAt: true },
    });
    console.log(`\n══════ ${job.slug} (${a.status}, factCheck ${a.factCheck}, byline ${a.reviewedById ? "có" : "KHÔNG"})`);
    if (!(a.status === "PUBLISHED" && a.factCheck === "PASSED" && a.reviewedById && a.reviewedAt)) {
      console.log("BỎ QUA: bài chưa PUBLISHED + PASSED + byline");
      continue;
    }

    const existing = await prisma.entity.findUnique({ where: { slug: job.entity.slug }, select: { id: true } });
    if (a.entityId) console.log("entity: đã gắn, giữ");
    else {
      console.log(`entity: ${job.entity.slug} (${existing ? "đã có" : "tạo mới"}, ${job.entity.wikidataQid})`);
      if (write) {
        const entityId = existing?.id ?? (await prisma.entity.create({ data: job.entity, select: { id: true } })).id;
        await prisma.article.update({ where: { id: a.id }, data: { entityId } });
        touched.add(job.slug);
      }
    }

    const b = job.backlink;
    const src = await prisma.article.findUniqueOrThrow({ where: { slug: b.from }, select: { id: true, status: true, factCheck: true, content: true } });
    if (src.status !== "PUBLISHED") throw new Error(`bài nguồn ${b.from} không PUBLISHED`);
    if (src.content.includes(`/articles/${job.slug}`)) {
      console.log(`link vào: đã có từ ${b.from}`);
      continue;
    }
    const n = src.content.split(b.find).length - 1;
    if (n !== 1) throw new Error(`[${b.from}] cụm neo khớp ${n} chỗ, cần đúng 1`);
    console.log(`link vào từ ${b.from} (${src.factCheck}) — vì: ${b.why}`);
    if (write) {
      await prisma.article.update({ where: { id: src.id }, data: { content: src.content.replace(b.find, () => b.replace) } });
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
