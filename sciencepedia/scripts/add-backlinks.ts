import { PrismaClient } from "@prisma/client";

/**
 * Thêm link nội bộ trỏ vào một bài, từ những bài đã publish.
 *
 *   npm run backlinks              # in kế hoạch, KHÔNG ghi gì
 *   npm run backlinks -- --write   # thực thi
 *
 * ## Vì sao cần
 *
 * Gate đòi mỗi bài có ≥1 link VÀO (`.claude/skills/seo-optimizer/SKILL.md`:
 * "≥3 contextual out, ≥1 in"). Bài mới xuất bản trỏ ra được ngay, nhưng không
 * ai trỏ vào nó cho tới khi có người sửa bài cũ — nên đây là việc của lượt
 * xuất bản, không phải của bài.
 *
 * ## Vì sao neo theo NGỮ CẢNH chứ không theo "lần xuất hiện đầu tiên"
 *
 * Thay tự động cụm khớp đầu tiên là cách nhanh nhất để tạo ra một link sai
 * nghĩa. Kiểm thật trên kho này: `big-bang` nhắc "năng lượng" ba lần, và cả
 * ba đều là **"năng lượng tối"** — một khái niệm khác hẳn. Trỏ nó về bài
 * "Năng lượng là gì" không phải link thừa mà là link SAI.
 *
 * Nên mỗi mục dưới đây ghi cả cụm bao quanh, đủ dài để chỉ khớp đúng một chỗ,
 * và chỗ đó đã được đọc bằng mắt trước khi ghi vào file.
 *
 * ## Vì sao chỉ hai bài chứ không phải ba
 *
 * 14/41 bài có nhắc "năng lượng", nhưng phần lớn là "năng lượng tối" hoặc
 * nhắc thoáng qua. Hai chỗ dưới đây là hai chỗ mà link thật sự giúp người đọc
 * đang thắc mắc. Thêm bài thứ ba chỉ để cho đủ số là đúng thứ SEO máy móc làm
 * hỏng bài viết — và gate chỉ đòi ≥1.
 */
const prisma = new PrismaClient();

type Backlink = {
  /** Bài sẽ được sửa */
  from: string;
  /** Bài được trỏ tới */
  to: string;
  /** Cụm hiện có trong bài, phải khớp DUY NHẤT một chỗ */
  find: string;
  /** Cụm thay thế, chứa link */
  replace: string;
  /** Vì sao chỗ này là chỗ đúng — đọc bằng mắt trước khi ghi vào đây */
  why: string;
};

const BACKLINKS: Backlink[] = [
  {
    from: "mat-troi",
    to: "nang-luong-la-gi",
    find: "thành năng lượng mỗi giây",
    replace: "thành [năng lượng](/articles/nang-luong-la-gi) mỗi giây",
    why: "Câu đang nói phản ứng proton–proton chuyển vật chất thành năng lượng theo E = mc². Người đọc gặp chữ này ở đây rất có thể đang muốn biết chính xác 'năng lượng' nghĩa là gì.",
  },
  {
    from: "thuyet-tuong-doi-hep",
    to: "nang-luong-la-gi",
    find: "Khối lượng và năng lượng là hai mặt",
    replace: "Khối lượng và [năng lượng](/articles/nang-luong-la-gi) là hai mặt",
    why: "Câu giải thích E = mc². Đây là chỗ khái niệm 'năng lượng' được dùng ở nghĩa chặt nhất trong toàn bài.",
  },
];

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
  const only = flagValue(argv, "to");

  const jobs = only ? BACKLINKS.filter((b) => b.to === only) : BACKLINKS;
  if (jobs.length === 0) {
    console.error(`Không có mục nào trỏ tới "${only}".`);
    process.exitCode = 1;
    return;
  }

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  for (const job of jobs) {
    console.log(`\n${job.from} → ${job.to}`);

    const target = await prisma.article.findUnique({
      where: { slug: job.to },
      select: { status: true },
    });
    if (target?.status !== "PUBLISHED") {
      // Trỏ vào bản nháp thì người đọc gặp 404 — link chết, không phải link chưa tới lượt.
      console.log(`   BỎ QUA: "${job.to}" đang ở trạng thái ${target?.status ?? "không tồn tại"}`);
      continue;
    }

    const article = await prisma.article.findUnique({
      where: { slug: job.from },
      select: { id: true, title: true, content: true, status: true },
    });
    if (!article) {
      console.log(`   BỎ QUA: không có bài "${job.from}"`);
      continue;
    }

    if (article.content.includes(`/articles/${job.to}`)) {
      console.log("   BỎ QUA: đã có link trỏ tới bài này");
      continue;
    }

    // Khớp đúng một chỗ, nếu không thì dừng — thay nhầm chỗ trong bài đã
    // publish là thứ không ai phát hiện ra cho tới khi có người đọc lại.
    const count = article.content.split(job.find).length - 1;
    if (count !== 1) {
      console.log(`   BỎ QUA: cụm neo khớp ${count} chỗ, cần đúng 1 — sửa \`find\` cho hẹp hơn`);
      continue;
    }

    const updated = article.content.replace(job.find, job.replace);
    console.log(`   lý do:  ${job.why}`);
    console.log(`   trước:  …${job.find}…`);
    console.log(`   sau:    …${job.replace}…`);
    console.log(`   dài:    ${article.content.length} → ${updated.length} ký tự`);

    if (!write) continue;

    // Revision trước khi sửa: giữ lại nguyên văn bản đã publish, để sau này
    // đối chiếu được "bài lúc duyệt trông thế nào".
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          note: `Trước khi thêm backlink tới ${job.to}`,
        },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { content: updated },
      }),
    ]);
    console.log("   ĐÃ GHI (kèm revision)");
  }

  console.log(
    write
      ? "\nXong. Chạy `npm run publish:check` để xác nhận bài đích hết mồ côi."
      : "\nChưa ghi gì. Thêm --write để thực thi.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
