import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Nhóm con của Sức khoẻ mà script này sở hữu: Cơ thể người — cộng việc xếp
 * thứ tự cho mọi danh mục con còn lại của Sức khoẻ.
 *
 *   npm run taxonomy:health              # in kế hoạch, KHÔNG ghi gì
 *   npm run taxonomy:health -- --write   # thực thi
 *
 * ## Ba nhóm truyền thống đã bị xóa — ĐỪNG thêm lại ở đây
 *
 * Tác động cột sống · Bấm huyệt · Y học cổ truyền từng là nhóm con của Sức
 * khoẻ (chốt 2026-10-05: để chúng ở gốc là menu dài thêm và ngầm đặt phương
 * pháp truyền thống ngang hàng một ngành khoa học). Ngày 2026-10-28 Linh
 * quyết định xóa hẳn: cả ba danh mục cùng 14 bài Tác động cột sống đã bị
 * xóa khỏi CSDL bởi `scripts/remove-traditional-categories.ts`. Đưa chúng
 * trở lại là một quyết định sản phẩm mới, không phải chạy lại seed này.
 *
 * Không có hệ danh mục thứ hai: đây vẫn là bảng `Category` với `parentId`, nên
 * thêm "Sơ cứu", "Bệnh học" sau này là thêm hàng (form quản trị hoặc script
 * như thế này) — không sửa menu, không sửa trang.
 *
 * ## Không ghi đè cái đã có
 *
 * Danh mục đã tồn tại dưới một cha KHÁC thì dừng: chuyển nhánh là phán quyết
 * của category-manager, không phải tác dụng phụ của một script.
 *
 * Danh mục con khác của Sức khoẻ (Giấc ngủ, Dinh dưỡng…) giữ thứ tự tương đối,
 * xếp sau nhóm ở đây.
 */
const prisma = new PrismaClient();

const PARENT = "suc-khoe";

type Group = {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  // Phải có trong whitelist `src/components/category-icon.tsx`.
  icon: string;
  color: string;
};

/** Theo thứ tự hiển thị trên trang Sức khoẻ. */
const GROUPS: Group[] = [
  {
    slug: "co-the-nguoi",
    name: "Cơ thể người",
    nameEn: "Human body",
    description:
      "Cấu tạo và hoạt động của cơ thể người — cơ quan, hệ cơ quan và cách chúng phối hợp với nhau.",
    descriptionEn:
      "How the human body is built and how it works — organs, organ systems and how they work together.",
    icon: "PersonStanding",
    color: "#e11d48",
  },
];

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===\n");

  const parent = await prisma.category.findUnique({
    where: { slug: PARENT },
    select: { id: true, parentId: true },
  });
  if (!parent || parent.parentId !== null) {
    console.error(`Không tìm thấy lĩnh vực gốc "${PARENT}".`);
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.category.findMany({
    where: { slug: { in: GROUPS.map((g) => g.slug) } },
    select: { id: true, slug: true, parentId: true, order: true },
  });
  const bySlug = new Map(existing.map((c) => [c.slug, c]));

  const misplaced = existing.filter((c) => c.parentId !== parent.id);
  if (misplaced.length > 0) {
    console.error(
      `Đã tồn tại dưới nhánh khác: ${misplaced.map((c) => c.slug).join(", ")}.\n` +
        "Chuyển nhánh là quyết định của category-manager — không tự làm. Dừng.",
    );
    process.exitCode = 1;
    return;
  }

  const others = await prisma.category.findMany({
    where: { parentId: parent.id, slug: { notIn: GROUPS.map((g) => g.slug) } },
    orderBy: [{ order: "asc" }, { slug: "asc" }],
    select: { id: true, slug: true, order: true },
  });

  for (const [index, group] of GROUPS.entries()) {
    const order = index + 1;
    const current = bySlug.get(group.slug);
    if (!current) {
      console.log(`  ${order}. ${group.slug} — ${write ? "đã tạo" : "sẽ tạo"}`);
      if (write) {
        const { slug, ...rest } = group;
        await prisma.category.create({ data: { slug, ...rest, order, parentId: parent.id } });
      }
      continue;
    }
    console.log(
      `  ${order}. ${group.slug} — đã có` + (current.order === order ? "" : `, order ${current.order} → ${order}`),
    );
    if (write && current.order !== order) {
      await prisma.category.update({ where: { id: current.id }, data: { order } });
    }
  }

  for (const [index, other] of others.entries()) {
    const order = GROUPS.length + index + 1;
    console.log(
      `  ${order}. ${other.slug} — giữ` + (other.order === order ? "" : `, order ${other.order} → ${order}`),
    );
    if (write && other.order !== order) {
      await prisma.category.update({ where: { id: other.id }, data: { order } });
    }
  }

  if (write) {
    // /categories đọc cây qua cache tag `articles`; trang /categories/suc-khoe
    // là ISR 300 s nên tự mới sau ≤ 5 phút. Menu không đổi (chỉ lĩnh vực gốc).
    await revalidateSite([]);
    console.log("\nXong. Chạy `npm run search:reindex` nếu Meilisearch đang bật.");
  } else {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
