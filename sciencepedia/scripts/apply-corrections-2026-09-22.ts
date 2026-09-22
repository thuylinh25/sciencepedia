import { PrismaClient } from "@prisma/client";

/**
 * Đính chính hai câu sai mà science-editor đã phủ quyết ngày 17/09.
 *
 *   npm run corrections:0922              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:0922 -- --write   # thực thi
 *
 * ## Vì sao hai câu này, và vì sao tới giờ mới sửa
 *
 * Cả hai bị phát hiện khi `link-glossary.ts` định gắn `[[...]]` vào chúng.
 * science-editor chặn lại với lý do giống nhau: đặt tooltip vào một câu sai
 * là chống lưng cho câu ấy. Hai ghi chú `KHÔNG gắn` trong `link-glossary.ts`
 * ghi rõ "gắn lại sau khi bài được sửa" — lượt này là lượt sửa ấy.
 *
 * ## Quy trình theo `docs/content-rules.md`
 *
 * Sửa claim trên bài đã publish là ĐÍNH CHÍNH, không phải biên tập, nên mỗi
 * lượt để lại ba thứ: một dòng trong `docs/content/corrections.md`, một
 * `Revision` chụp bản TRƯỚC ghi trong CÙNG transaction với lệnh sửa, và
 * `lastVerifiedAt` cập nhật. Thêm một điều kiện nữa của cùng mục: đổi claim
 * thì phải đổi cả bảng nguồn — thay một con số không nguồn bằng một con số
 * không nguồn khác chỉ là đổi phiên bản của cùng một vấn đề. Cả hai bài đều
 * chưa có nguồn nào đỡ đúng claim đang sửa, nên lượt này thêm nguồn.
 *
 * `factCheck` GIỮ NGUYÊN `REVISE`. Sửa chuỗi xong không có nghĩa là qua gate:
 * `factCheck` là phán quyết của người duyệt, không phải hệ quả của một phép
 * thay chuỗi. Cùng cách các lượt đính chính trước đã làm.
 */
const prisma = new PrismaClient();

type Fix = {
  slug: string;
  find: string;
  replace: string;
  why: string;
  source: {
    title: string;
    url: string;
    publisher: string;
    year: number;
    tier: number;
  };
};

const FIXES: Fix[] = [
  {
    slug: "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do",
    find:
      "**Hố đen sao** (5–100 khối lượng Mặt Trời) hình thành khi lõi một ngôi sao nặng sụp đổ sau siêu tân tinh.",
    replace:
      "**Hố đen sao** (5–100 khối lượng Mặt Trời) hình thành khi lõi một ngôi sao nặng sụp đổ. Cú sụp đổ ấy đứng TRƯỚC vụ nổ chứ không phải sau: lõi sụp đổ giải phóng neutrino, và chính neutrino truyền năng lượng cho các lớp ngoài, đẩy chúng nổ tung thành siêu tân tinh.",
    why:
      "Bản cũ đảo nhân quả: viết lõi sụp đổ SAU siêu tân tinh, trong khi sụp đổ lõi mới là thứ khởi đầu chuỗi dẫn tới vụ nổ. OpenStax Astronomy 2e §23.2 mô tả đúng thứ tự, và cẩn thận ở một chỗ mà bản sửa giữ nguyên: sóng xung kích của cú sụp đổ MỘT MÌNH không đủ gây nổ, chính neutrino sinh ra trong lúc sụp đổ mới truyền năng lượng đẩy các lớp ngoài ra.",
    source: {
      title: "Astronomy 2e, 23.2 Evolution of Massive Stars: An Explosive Finish",
      url: "https://openstax.org/books/astronomy-2e/pages/23-2-evolution-of-massive-stars-an-explosive-finish",
      publisher: "OpenStax, Rice University",
      year: 2022,
      tier: 3,
    },
  },
  {
    slug: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    find:
      "- Từng là Sao Bắc Cực khoảng 12.000 năm trước và sẽ trở lại vị trí này trong tương lai do hiện tượng tiến động của Trái Đất.",
    replace:
      "- Từng là Sao Bắc Cực khoảng 14.000 năm trước, và sẽ trở lại vị trí ấy sau chừng 12.000 năm nữa, do hiện tượng tiến động của trục Trái Đất.",
    why:
      "Bản cũ trộn hai con số của hai chiều thời gian. NASA nói Vega là sao Bắc Cực 14.000 năm TRƯỚC, và sẽ trở lại sau 12.000 năm NỮA; bài lấy số 12.000 rồi gắn vào quá khứ. Trục quay Trái Đất đảo một vòng khoảng 26.000 năm, nên hai con số ấy là hai đầu của cùng một chu kỳ chứ không thay thế nhau được.",
    source: {
      title: "Summer Triangle Corner: Vega",
      url: "https://science.nasa.gov/solar-system/skywatching/night-sky-network/summer-triangle-corner-vega/",
      publisher: "NASA Science",
      year: 2020,
      tier: 2,
    },
  },
];

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const now = new Date();

  for (const fix of FIXES) {
    const article = await prisma.article.findUnique({
      where: { slug: fix.slug },
      select: { id: true, title: true, content: true, factCheck: true },
    });
    if (!article) throw new Error(`Không có bài ${fix.slug}`);

    if (article.content.includes(fix.replace)) {
      console.log(`${fix.slug}: đã sửa từ trước, bỏ qua.`);
      continue;
    }

    const count = article.content.split(fix.find).length - 1;
    if (count !== 1) {
      throw new Error(`${fix.slug}: cụm cần sửa khớp ${count} chỗ, cần đúng 1`);
    }

    const already = await prisma.source.findFirst({
      where: { articleId: article.id, url: fix.source.url },
      select: { id: true },
    });

    console.log(`\n${fix.slug}   (factCheck ${article.factCheck} — GIỮ NGUYÊN)`);
    console.log(`   cũ : ${fix.find}`);
    console.log(`   mới: ${fix.replace}`);
    console.log(`   vì : ${fix.why}`);
    console.log(
      `   nguồn thêm: [tier ${fix.source.tier}] ${fix.source.title}${already ? "  (đã có, bỏ qua)" : ""}`,
    );

    if (!write) continue;

    /* Revision chụp TRƯỚC khi sửa, trong CÙNG transaction với lệnh sửa và với
       lệnh thêm nguồn — để lịch sử không thể lệch khỏi nội dung, và để không
       có trạng thái trung gian nào mà claim đã đổi còn nguồn thì chưa. */
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          note: `Trước đính chính 22/09: ${fix.find.slice(0, 80)}…`,
        },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: {
          content: article.content.replace(fix.find, fix.replace),
          lastVerifiedAt: now,
        },
      }),
      ...(already
        ? []
        : [
            prisma.source.create({
              data: {
                articleId: article.id,
                ...fix.source,
                accessedAt: now,
              },
            }),
          ]),
    ]);
    console.log("   ĐÃ GHI (revision + nội dung + nguồn, cùng transaction)");
  }

  console.log(
    write
      ? "\nXong. factCheck vẫn REVISE — sửa chuỗi không phải là qua gate."
      : "\nChưa ghi gì. Thêm --write để thực thi.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
