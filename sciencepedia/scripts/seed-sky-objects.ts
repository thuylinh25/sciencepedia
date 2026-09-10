import { PrismaClient, type SkyObjectType } from "@prisma/client";

import { SKY_TARGETS, type SkyTarget } from "../src/lib/sky-data";
import { parseCoordinates } from "../src/lib/sky-coords";

/**
 * Đưa danh mục thiên thể vào CSDL và gắn bài viết vào thiên thể của nó.
 *
 *   npm run sky:seed                                   # in kế hoạch, không ghi
 *   npm run sky:seed -- --write                        # ghi danh mục
 *   npm run sky:seed -- --attach lo-den=M87 --write    # gắn bài vào thiên thể
 *   npm run sky:seed -- --detach lo-den --write        # gỡ gắn kết
 *
 * Mặc định chạy khô, theo lệ của `category:image` và `taxonomy:tier2`: một
 * script ghi thẳng vào bảng nội dung mà không cho xem trước là một script chỉ
 * sai được đúng một lần.
 *
 * ## Vì sao danh mục vừa nằm trong code vừa nằm trong CSDL
 *
 * Hai chỗ dùng phục vụ hai việc khác nhau. Trang `/space-map` đọc thẳng từ
 * `sky-data.ts` vì nó là route tĩnh — không truy vấn nào, dựng sẵn lúc build.
 * Còn bài viết cần một khoá ngoại thật để biên tập viên gắn bài vào thiên thể
 * mà không phải sửa code và deploy lại.
 *
 * `catalogId` là chỗ nối giữa hai bên, và nó UNIQUE ở cả hai. Script này là
 * đường đồng bộ một chiều: code → CSDL. Không có chiều ngược lại, nên không
 * có chuyện hai nguồn cùng tự nhận là đúng.
 */
const prisma = new PrismaClient();

/** `SkyObjectKind` trong code và `SkyObjectType` trong CSDL cùng một tập giá
 *  trị; phép ép này tồn tại để nếu một bên đổi thì TypeScript báo ngay. */
const TYPE_MAP: Record<SkyTarget["kind"], SkyObjectType> = {
  GALAXY: "GALAXY",
  NEBULA: "NEBULA",
  STAR: "STAR",
  CLUSTER: "CLUSTER",
  BLACK_HOLE: "BLACK_HOLE",
  OTHER: "OTHER",
};

type Attachment = { slug: string; catalogId: string };

function parseArgs(argv: string[]) {
  const write = argv.includes("--write");
  const attach: Attachment[] = [];
  const detach: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--attach") {
      const pair = argv[index + 1] ?? "";
      const [slug, catalogId] = pair.split("=");
      if (!slug || !catalogId) {
        throw new Error(`--attach cần dạng <slug-bai>=<ma-catalog>, nhận "${pair}"`);
      }
      attach.push({ slug, catalogId });
    }
    if (argv[index] === "--detach") {
      const slug = argv[index + 1];
      if (!slug) throw new Error("--detach cần slug bài viết");
      detach.push(slug);
    }
  }

  return { write, attach, detach };
}

async function main() {
  const { write, attach, detach } = parseArgs(process.argv.slice(2));

  console.log(write ? "→ CHẾ ĐỘ GHI" : "→ Chạy khô (thêm --write để ghi thật)");

  // ------------------------------------------------------------- Danh mục
  for (const target of SKY_TARGETS) {
    // Toạ độ hỏng thì dừng cả lượt chứ không bỏ qua một hàng: một hàng thiếu
    // trong danh mục là lỗi im lặng, và nó chỉ lộ ra khi có người bấm vào.
    if (!parseCoordinates(target.ra, target.dec)) {
      throw new Error(
        `Toạ độ không đọc được: ${target.catalogId} (${target.ra} / ${target.dec})`,
      );
    }

    const data = {
      objectName: target.name,
      objectNameEn: target.nameEn,
      ra: target.ra,
      dec: target.dec,
      fovDeg: target.fovDeg,
      survey: target.survey ?? null,
      objectType: TYPE_MAP[target.kind],
      constellation: target.constellation,
      constellationEn: target.constellationEn,
    };

    const existing = await prisma.skyObject.findUnique({
      where: { catalogId: target.catalogId },
    });

    console.log(
      `  ${existing ? "cập nhật" : "thêm mới"}  ${target.catalogId.padEnd(12)} ${target.name}`,
    );

    if (write) {
      await prisma.skyObject.upsert({
        where: { catalogId: target.catalogId },
        create: { catalogId: target.catalogId, ...data },
        update: data,
      });
    }
  }

  // ------------------------------------------------------------- Gắn bài
  for (const item of attach) {
    const [article, skyObject] = await Promise.all([
      prisma.article.findUnique({
        where: { slug: item.slug },
        select: { id: true, title: true },
      }),
      prisma.skyObject.findUnique({ where: { catalogId: item.catalogId } }),
    ]);

    if (!article) throw new Error(`Không có bài nào mang slug "${item.slug}"`);
    if (!skyObject && !write) {
      console.log(
        `  gắn      ${item.slug} → ${item.catalogId} (thiên thể sẽ được tạo ở lượt ghi này)`,
      );
      continue;
    }
    if (!skyObject) {
      throw new Error(`Không có thiên thể nào mang mã "${item.catalogId}"`);
    }

    console.log(`  gắn      ${item.slug} → ${item.catalogId}`);

    if (write) {
      await prisma.article.update({
        where: { id: article.id },
        data: { skyObjectId: skyObject.id },
      });
    }
  }

  for (const slug of detach) {
    console.log(`  gỡ      ${slug}`);
    if (write) {
      await prisma.article.update({
        where: { slug },
        data: { skyObjectId: null },
      });
    }
  }

  console.log(
    write ? "✓ Đã ghi xong." : "✓ Xem xong. Thêm --write để thực thi.",
  );
}

main()
  .catch((error) => {
    console.error("✗", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
