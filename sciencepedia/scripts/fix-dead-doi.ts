import { PrismaClient } from "@prisma/client";

/**
 * Sửa một DOI chết trên bài `sao-choi-nguon-goc-cau-tao-va-so-phan`.
 *
 *   npx tsx scripts/fix-dead-doi.ts            # in kế hoạch, KHÔNG ghi
 *   npx tsx scripts/fix-dead-doi.ts --write    # thực thi
 *
 * ## Lỗi
 *
 * Nguồn "Identification of comet Hyakutake's extremely long ion tail from
 * magnetic field signatures" (Jones, Balogh & Horbury, Nature 404, 574–576,
 * 2000) đang mang DOI `10.1038/35007005`. DOI ấy trả **404** — nó không tồn
 * tại. DOI đúng là `10.1038/35007011`, đã resolve và đối chiếu tiêu đề, tác
 * giả, tập, số trang và năm.
 *
 * `10.1038/35007015` — một hàng xóm chỉ khác hai chữ số — là bài KHÁC trong
 * cùng số báo: "Interception of comet Hyakutake's ion tail at a distance of
 * 500 million kilometres" của Gloeckler & Geiss. Nên đây là lỗi gõ trong một
 * dãy DOI gần nhau, không phải nguồn bịa.
 *
 * ## Vì sao `check-publish.ts` không bắt được
 *
 * `isAlive()` ở đó chỉ chạy với `source.url`, và hàng này lưu DOI ở cột
 * `doi`. Kể cả có chạy thì phép kiểm ấy hỏi "URL trả 200 không" — đủ để bắt
 * một DOI 404 như hàng này, nhưng KHÔNG đủ để bắt một DOI resolve được mà
 * trỏ sai bài. `scripts/check-citations.ts` mới là phép kiểm đối chiếu tiêu
 * đề, và chính nó tìm ra hàng này.
 *
 * ## Vì sao không ghi `Revision`
 *
 * `Revision` chụp `title` + `content` của bài. Lượt này không chạm vào thân
 * bài — nó sửa một hàng `Source`. Chụp một bản content không đổi là để lại
 * một mục lịch sử rỗng nghĩa. Dấu vết của lượt sửa nằm ở
 * `docs/content/corrections.md`.
 */
const prisma = new PrismaClient();

const SLUG = "sao-choi-nguon-goc-cau-tao-va-so-phan";
const WRONG = "10.1038/35007005";
const RIGHT = "10.1038/35007011";

async function main() {
  const write = process.argv.includes("--write");

  const rows = await prisma.source.findMany({
    where: { article: { slug: SLUG }, doi: WRONG },
    select: { id: true, title: true, doi: true, url: true },
  });

  if (rows.length !== 1) {
    throw new Error(
      `Khớp ${rows.length} hàng, cần đúng 1 — dừng, không ghi gì.`,
    );
  }

  const [row] = rows;
  console.log(`${SLUG}`);
  console.log(`  "${row.title}"`);
  console.log(`  doi ${row.doi} → ${RIGHT}`);
  // Cột `url` mang chính DOI đó, nên nó cũng chết. Sửa một cột và bỏ cột kia
  // là để lại đúng lỗi vừa sửa ở chỗ người đọc THẬT SỰ bấm vào.
  const nextUrl = row.url?.replace(WRONG, RIGHT) ?? null;
  if (row.url) console.log(`  url ${row.url} → ${nextUrl}`);

  if (!write) {
    console.log("\nChạy khô. Thêm --write để ghi.");
    return;
  }

  await prisma.source.update({
    where: { id: row.id },
    data: { doi: RIGHT, ...(nextUrl ? { url: nextUrl } : {}) },
  });
  console.log("Đã ghi.");
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
