import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Bốn nhóm con của Sức khoẻ: Cơ thể người · Tác động cột sống · Bấm huyệt ·
 * Y học cổ truyền.
 *
 *   npm run taxonomy:health              # in kế hoạch, KHÔNG ghi gì
 *   npm run taxonomy:health -- --write   # thực thi
 *
 * ## Vì sao là danh mục CON, không phải lĩnh vực gốc
 *
 * Menu "Khám phá" liệt kê lĩnh vực gốc (`getNavigationCategories`, `parentId:
 * null`). Đưa ba nhóm phương pháp truyền thống lên gốc là (1) menu dài thêm
 * ba dòng, và (2) đặt chúng ngang hàng Vật lý, Hoá học — tức ngầm nói chúng là
 * một ngành khoa học. Dưới `suc-khoe`, chúng hiện thành thẻ trên trang Sức
 * khoẻ, cạnh khung "mô tả không phải bằng chứng" (`@/lib/category-notices`).
 *
 * Không có hệ danh mục thứ hai: đây vẫn là bảng `Category` với `parentId`, nên
 * thêm "Sơ cứu", "Bệnh học" sau này là thêm hàng (form quản trị hoặc script
 * như thế này) — không sửa menu, không sửa trang.
 *
 * ## Không ghi đè cái đã có
 *
 * `tac-dong-cot-song` do `spine:import` tạo và sở hữu tên/mô tả; script này chỉ
 * đặt `order`. Danh mục đã tồn tại dưới một cha KHÁC thì dừng: chuyển nhánh là
 * phán quyết của category-manager, không phải tác dụng phụ của một script.
 *
 * Danh mục con khác của Sức khoẻ (Giấc ngủ, Dinh dưỡng…) giữ thứ tự tương đối,
 * xếp sau bốn nhóm này.
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
  {
    // Chỉ dùng khi chưa có — tên/mô tả thật nằm ở `scripts/spine-import.ts`.
    slug: "tac-dong-cot-song",
    name: "Tác động cột sống",
    nameEn: "Spinal Impact method",
    description:
      "Tư liệu lưu trữ tài liệu Phương pháp Tác động Cột sống Việt Nam, trích nguyên văn có trang, đặt cạnh kiến thức y khoa có nguồn. Không thay thế chẩn đoán hay điều trị.",
    descriptionEn:
      "Archive of the Vietnamese Spinal Impact method document, quoted with page numbers alongside sourced medical information. Not a substitute for diagnosis or treatment.",
    icon: "Activity",
    color: "#0891b2",
  },
  {
    slug: "bam-huyet",
    name: "Bấm huyệt",
    nameEn: "Acupressure",
    description:
      "Bấm huyệt theo mô tả của y học cổ truyền, đặt cạnh những gì nghiên cứu hiện đại đã và chưa xác nhận. Không thay thế chẩn đoán hay điều trị.",
    descriptionEn:
      "Acupressure as traditional medicine describes it, alongside what modern research has and has not confirmed. Not a substitute for diagnosis or treatment.",
    icon: "Hand",
    color: "#d97706",
  },
  {
    slug: "y-hoc-co-truyen",
    name: "Y học cổ truyền",
    nameEn: "Traditional medicine",
    description:
      "Các hệ thống y học truyền thống như Đông y: lịch sử, khái niệm, và cách khoa học hiện đại đánh giá chúng. Mô tả theo truyền thống không phải bằng chứng điều trị.",
    descriptionEn:
      "Traditional medical systems such as Vietnamese and Chinese medicine: history, concepts, and how modern science evaluates them. A traditional description is not evidence of treatment.",
    icon: "Leaf",
    color: "#0d9488",
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
