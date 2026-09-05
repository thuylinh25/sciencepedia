import { PrismaClient } from "@prisma/client";

/**
 * Dựng tầng 2 cho ba nhánh phẳng, và tách Hoá học thành lĩnh vực gốc.
 *
 *   npm run taxonomy:tier2              # in kế hoạch, KHÔNG ghi gì
 *   npm run taxonomy:tier2 -- --write   # thực thi
 *
 * Mặc định chạy khô, theo đúng lệ của `images:credit` — một script đổi cấu
 * trúc taxonomy mà chạy ngay khi gõ tên là script sẽ có ngày được gõ nhầm.
 *
 * ## Vì sao bây giờ chứ không phải sau
 *
 * Đo ngày 2026-09-05: `vat-ly` 2 bài, `sinh-hoc` 1, `trai-dat-va-khi-hau` 3 —
 * tổng 6 bài gán trực tiếp vào ba nhánh phẳng. Hàng đợi đổ thêm 44 bài vào
 * đúng ba nhánh đó. Làm bây giờ là gán lại 6 bài; làm sau là gán lại 50.
 *
 * Cái đắt khi hoãn KHÔNG phải URL bài viết — route là `/articles/[slug]`,
 * không lồng danh mục, nên đổi danh mục không đổi URL. Cái đắt là **mạng link
 * nội bộ**: gate đòi ≥3 link resolve được, và link đó suy ra từ vị trí trong
 * cây. Dựng 44 bài trên cây phẳng rồi chia lại là dựng lại cả mạng link.
 *
 * ## Vì sao Vật lý có 4 danh mục con chứ không phải 5
 *
 * Đề xuất ban đầu có "Vật chất và Nguyên tử". Khi Hoá học tách ra thành lĩnh
 * vực gốc, hai chủ đề nuôi nhánh đó (bảng tuần hoàn, liên kết hoá học) đi
 * theo, và nhánh còn đúng một bài — mức mỏng mà `category-manager` sinh ra để
 * chặn. "Nguyên tử: hạt nhân, electron, đồng vị" về "Vật lý hiện đại", nơi nó
 * đứng cạnh cơ học lượng tử đúng chỗ.
 *
 * ## Hoá học tạm thời là nhánh phẳng
 *
 * Chỉ 2 chủ đề trong hàng đợi, nên chia tầng 2 bây giờ là tạo bốn nhánh mỗi
 * nhánh nửa bài. Ngưỡng xem lại: **8 bài hoá học**, ghi trong
 * `docs/content/topic-queue.md`.
 */
const prisma = new PrismaClient();

type Child = { slug: string; name: string; nameEn: string; icon: string };

/** Tầng 2, theo thứ tự hiển thị. `order` lấy từ chỉ số trong mảng. */
const TIER_2: Record<string, Child[]> = {
  "vat-ly": [
    { slug: "co-hoc", name: "Cơ học", nameEn: "Mechanics", icon: "Move" },
    { slug: "nhiet-va-nang-luong", name: "Nhiệt và Năng lượng", nameEn: "Heat and Energy", icon: "Flame" },
    { slug: "dien-tu-va-anh-sang", name: "Điện từ và Ánh sáng", nameEn: "Electromagnetism and Light", icon: "Zap" },
    { slug: "vat-ly-hien-dai", name: "Vật lý hiện đại", nameEn: "Modern Physics", icon: "Atom" },
  ],
  "sinh-hoc": [
    { slug: "te-bao-va-phan-tu", name: "Tế bào và Phân tử", nameEn: "Cell and Molecular Biology", icon: "Microscope" },
    { slug: "di-truyen", name: "Di truyền", nameEn: "Genetics", icon: "Dna" },
    { slug: "tien-hoa", name: "Tiến hoá", nameEn: "Evolution", icon: "GitBranch" },
    { slug: "sinh-ly-va-trao-doi-chat", name: "Sinh lý và Trao đổi chất", nameEn: "Physiology and Metabolism", icon: "HeartPulse" },
  ],
  "trai-dat-va-khi-hau": [
    { slug: "dia-chat", name: "Địa chất", nameEn: "Geology", icon: "Mountain" },
    { slug: "khi-quyen-va-thoi-tiet", name: "Khí quyển và Thời tiết", nameEn: "Atmosphere and Weather", icon: "CloudSun" },
    { slug: "dai-duong", name: "Đại dương", nameEn: "Oceans", icon: "Waves" },
    { slug: "khi-hau-va-bien-doi", name: "Khí hậu và Biến đổi", nameEn: "Climate and Change", icon: "ThermometerSun" },
  ],
};

/** Lĩnh vực gốc thứ sáu. `order` đặt sau năm gốc hiện có. */
const NEW_ROOT = {
  slug: "hoa-hoc",
  name: "Hoá học",
  nameEn: "Chemistry",
  icon: "FlaskConical",
  color: "#22c55e",
  description:
    "Nguyên tố, liên kết và phản ứng — cách vật chất kết hợp và biến đổi.",
  descriptionEn:
    "Elements, bonds and reactions — how matter combines and changes.",
};

/**
 * Gán lại 6 bài đang treo thẳng ở nhánh gốc.
 *
 * Cố ý KHÔNG chuyển bài sang lĩnh vực gốc khác, dù có bài đáng chuyển:
 * "Sự sống trên Trái Đất: 4 tỉ năm" nằm ở Trái Đất mà nội dung nghiêng về
 * Tiến hoá. Chuyển nhánh gốc là phán quyết biên tập, không phải việc của một
 * script dựng cấu trúc — để `knowledge-architect` quyết riêng.
 */
const REASSIGN: Record<string, string> = {
  "crispr-la-gi": "di-truyen",
  "dai-tuyet-chung-permi": "dia-chat",
  "hinh-thanh-va-tien-hoa-su-song": "dia-chat",
  "nguyen-nhan-cua-mua": "khi-quyen-va-thoi-tiet",
  "song-hap-dan-va-song-trong-luc": "vat-ly-hien-dai",
  "thuyet-tuong-doi-hep": "vat-ly-hien-dai",
};

async function main() {
  const write = process.argv.includes("--write");

  const parents = await prisma.category.findMany({
    where: { slug: { in: Object.keys(TIER_2) } },
    select: { id: true, slug: true, name: true, color: true },
  });
  const parentBySlug = new Map(parents.map((p) => [p.slug, p]));

  const missing = Object.keys(TIER_2).filter((s) => !parentBySlug.has(s));
  if (missing.length > 0) {
    console.error(`Không tìm thấy danh mục gốc: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const rootCount = await prisma.category.count({ where: { parentId: null } });
  const existing = new Set(
    (await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug),
  );

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  console.log();

  // --- 1. Lĩnh vực gốc mới ---
  console.log(`Lĩnh vực gốc mới: ${NEW_ROOT.name} (${NEW_ROOT.slug})`);
  if (existing.has(NEW_ROOT.slug)) {
    console.log("   đã tồn tại — bỏ qua");
  } else if (write) {
    await prisma.category.create({
      data: { ...NEW_ROOT, order: rootCount, parentId: null },
    });
    console.log("   đã tạo");
  } else {
    console.log("   sẽ tạo");
  }
  console.log();

  // --- 2. Tầng 2 ---
  for (const [parentSlug, children] of Object.entries(TIER_2)) {
    const parent = parentBySlug.get(parentSlug)!;
    console.log(`${parent.name} (${parentSlug})`);
    for (const [index, child] of children.entries()) {
      if (existing.has(child.slug)) {
        console.log(`   ${child.name} — đã tồn tại, bỏ qua`);
        continue;
      }
      if (write) {
        await prisma.category.create({
          data: {
            ...child,
            // Kế thừa màu của nhánh cha: card danh mục con phải đọc ra là
            // thuộc cùng một lĩnh vực, không phải một lĩnh vực thứ sáu.
            color: parent.color,
            order: index,
            parentId: parent.id,
          },
        });
        console.log(`   ${child.name} — đã tạo`);
      } else {
        console.log(`   ${child.name} — sẽ tạo`);
      }
    }
    console.log();
  }

  // --- 3. Gán lại bài ---
  console.log("Gán lại bài đang treo ở nhánh gốc:");
  const targets = await prisma.category.findMany({
    where: { slug: { in: [...new Set(Object.values(REASSIGN))] } },
    select: { id: true, slug: true },
  });
  const targetBySlug = new Map(targets.map((c) => [c.slug, c.id]));

  for (const [articleSlug, categorySlug] of Object.entries(REASSIGN)) {
    const article = await prisma.article.findUnique({
      where: { slug: articleSlug },
      select: { id: true, category: { select: { slug: true } } },
    });
    if (!article) {
      console.log(`   ${articleSlug} — KHÔNG TÌM THẤY, bỏ qua`);
      continue;
    }
    const targetId = targetBySlug.get(categorySlug);
    if (!targetId) {
      // Chạy khô thì danh mục đích chưa tồn tại — đó là bình thường, không phải lỗi.
      console.log(`   ${articleSlug} → ${categorySlug} (${write ? "THIẾU DANH MỤC ĐÍCH" : "sẽ gán sau khi tạo"})`);
      continue;
    }
    if (article.category.slug === categorySlug) {
      console.log(`   ${articleSlug} — đã ở ${categorySlug}`);
      continue;
    }
    if (write) {
      await prisma.article.update({ where: { id: article.id }, data: { categoryId: targetId } });
      console.log(`   ${articleSlug}: ${article.category.slug} → ${categorySlug}`);
    } else {
      console.log(`   ${articleSlug}: ${article.category.slug} → ${categorySlug}`);
    }
  }

  console.log();
  if (write) {
    const total = await prisma.category.count();
    console.log(`Xong. Tổng danh mục: ${total}.`);
    console.log("Chạy `npm run search:reindex` nếu Meilisearch đang bật.");
  } else {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
