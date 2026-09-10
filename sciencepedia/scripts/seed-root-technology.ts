import { PrismaClient } from "@prisma/client";

/**
 * Lĩnh vực gốc thứ bảy — "Công nghệ và Kỹ thuật" — và dọn thứ tự hiển thị.
 *
 *   npm run taxonomy:tech              # in kế hoạch, KHÔNG ghi gì
 *   npm run taxonomy:tech -- --write   # thực thi
 *
 * Mặc định chạy khô, theo đúng lệ của `taxonomy:tier2`.
 *
 * ## Vì sao KHÔNG đặt tên "Khoa học và Ứng dụng"
 *
 * Tên ban đầu được đề nghị là "Khoa học và Ứng dụng". Bảy nhánh gốc phải loại
 * trừ lẫn nhau ở cùng một tầng, mà sáu nhánh đang có **đều là** khoa học —
 * đặt tên nhánh thứ bảy bắt đầu bằng "Khoa học" là treo một tập cha cạnh các
 * tập con của chính nó. Breadcrumb `Trang chủ > Khoa học và Ứng dụng > Pin
 * lithium-ion` ngầm nói sáu nhánh kia không phải khoa học.
 *
 * Hệ quả nặng hơn là **không có phép thử phân loại**: với cái tên đó, mọi bài
 * trong kho đều "đúng", nên không tồn tại lý do bác một đề xuất xếp bài vào
 * đây. Một nhánh không từ chối được gì sẽ nuốt hết bài khó xếp, và chuyện đó
 * không đảo ngược được.
 *
 * ## Phép thử phân loại — dùng để BÁC đề xuất
 *
 * Sáu nhánh hiện có trả lời *thế giới vận hành thế nào*. Nhánh này trả lời
 * *con người chế tạo được gì từ hiểu biết đó*. Một câu để quyết:
 *
 *   **Bỏ loài người đi, chủ đề này còn tồn tại không?**
 *   Còn → khoa học tự nhiên. Không còn → nhánh này.
 *
 * Quang điện là hiện tượng (Vật lý); tấm pin mặt trời là thiết bị (nhánh này).
 * Từ trường hạt nhân là hiện tượng (Vật lý); máy MRI là thiết bị (nhánh này).
 *
 * **Quy tắc phá hoà:** chủ đề đứng được ở cả hai bên thì **ở lại nhánh tự
 * nhiên**. Nhánh này chỉ nhận cái mà sáu nhánh kia từ chối. Không có quy tắc
 * đó, `kinh-james-webb` bị kéo khỏi `kham-pha-khong-gian` (nhánh chỉ có 1 bài)
 * và `crispr-la-gi` bị kéo khỏi `di-truyen` — phá hai nhánh để mồi một nhánh.
 *
 * ## Vì sao nhánh phẳng, không chia tầng 2 ngay
 *
 * Nhánh có 0 bài. Chia bốn danh mục con bây giờ là tạo bốn nhánh mỗi nhánh 0
 * bài — mức mỏng mà `category-manager` sinh ra để chặn. Ngưỡng chia: **8 bài
 * đã xuất bản**, cùng con số với `hoa-hoc` để không phải nhớ hai ngưỡng.
 *
 * Nhưng hình dạng tầng 2 đã chốt trước và ghi ở `docs/content/topic-queue.md`,
 * kèm danh mục con cho từng chủ đề mở màn. Đó là bài học của `taxonomy:tier2`:
 * *"làm bây giờ là gán lại 6 bài; làm sau là gán lại 50"* — cái đắt không phải
 * URL bài (route `/articles/[slug]` không lồng danh mục) mà là **mạng link nội
 * bộ**, vì link suy ra từ vị trí trong cây. Chốt trước thì lúc chia chỉ còn là
 * `UPDATE` theo bảng có sẵn, không phải một phán quyết biên tập giữa đợt.
 *
 * ## Vì sao đánh số lại toàn bộ `order`
 *
 * `seed-taxonomy.ts:123` đặt `order: rootCount` cho `hoa-hoc` khi đã có 5 gốc,
 * nhưng `vu-tru` bắt đầu từ 1 — nên `hoa-hoc` và `trai-dat-va-khi-hau` **cùng
 * `order = 5`**. `getRootCategories()` sắp bằng `orderBy` trên cột đó, nên hai
 * lĩnh vực này tự đổi chỗ cho nhau sau mỗi `UPDATE`: đúng lỗi mà
 * `docs/content-rules.md` mục "Bảng xếp hạng phải có tie-break" đã ghi. Thêm
 * gốc thứ bảy mà không dọn là để lỗi sinh sôi, nên đánh số lại 1–7 một lượt.
 * (Tie-break `{ slug: "asc" }` đã thêm vào `src/server/queries.ts` cùng đợt —
 * đánh số lại chữa triệu chứng, tie-break chữa nguyên nhân.)
 *
 * Đổi `order` **không đổi URL**: route danh mục là `/categories/[slug]`.
 */
const prisma = new PrismaClient();

/** Lĩnh vực gốc thứ bảy. */
const NEW_ROOT = {
  slug: "cong-nghe-va-ky-thuat",
  name: "Công nghệ và Kỹ thuật",
  nameEn: "Technology and Engineering",
  // `Cog` phải có trong whitelist `src/components/category-icon.tsx`, nếu
  // không thẻ danh mục rơi về `Sparkles` mà không báo lỗi.
  icon: "Cog",
  // Fuchsia-700. Dải magenta 290–330 là dải hue rộng duy nhất còn trống: cách
  // màu gần nhất (`#8b5cf6`, `sao-va-thien-ha`) 35°. Tương phản 6,33:1 với chữ
  // trắng — đạt AA. Magenta đọc ra "nhân tạo/số"; lime (dải trống còn lại) đọc
  // ra "tự nhiên", sai tín hiệu cho một nhánh về vật do người chế tạo.
  color: "#a21caf",
  description:
    "Máy móc, vật liệu, năng lượng và máy tính — con người chế tạo được gì từ hiểu biết khoa học.",
  descriptionEn:
    "Machines, materials, energy and computing — what humans build with scientific knowledge.",
};

/**
 * Thứ tự hiển thị của bảy lĩnh vực gốc, đánh số lại từ 1.
 *
 * Sáu dòng đầu giữ nguyên thứ tự đang hiển thị; chỉ `hoa-hoc` đổi 5 → 6 để gỡ
 * đụng độ với `trai-dat-va-khi-hau`.
 */
const ROOT_ORDER = [
  "vu-tru",
  "suc-khoe",
  "vat-ly",
  "sinh-hoc",
  "trai-dat-va-khi-hau",
  "hoa-hoc",
  NEW_ROOT.slug,
];

async function main() {
  const write = process.argv.includes("--write");

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  console.log();

  const roots = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, slug: true, name: true, order: true },
  });
  const bySlug = new Map(roots.map((r) => [r.slug, r]));

  // Dừng sớm nếu cây không như mong đợi: một script đổi cấu trúc chạy trên cây
  // lạ thì hỏng theo cách khó lần ra hơn nhiều so với việc không chạy.
  const unknown = roots.filter((r) => !ROOT_ORDER.includes(r.slug));
  if (unknown.length > 0) {
    console.error(
      `Có lĩnh vực gốc ngoài kế hoạch: ${unknown.map((r) => r.slug).join(", ")}.`,
    );
    console.error("Cập nhật ROOT_ORDER rồi chạy lại.");
    process.exitCode = 1;
    return;
  }
  const missing = ROOT_ORDER.filter(
    (s) => s !== NEW_ROOT.slug && !bySlug.has(s),
  );
  if (missing.length > 0) {
    console.error(`Không tìm thấy lĩnh vực gốc: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // --- 1. Lĩnh vực gốc mới ---
  console.log(`Lĩnh vực gốc mới: ${NEW_ROOT.name} (${NEW_ROOT.slug})`);
  const existing = await prisma.category.findUnique({
    where: { slug: NEW_ROOT.slug },
    select: { id: true, parentId: true },
  });
  if (existing) {
    console.log("   đã tồn tại — bỏ qua");
  } else if (write) {
    const created = await prisma.category.create({
      data: {
        ...NEW_ROOT,
        order: ROOT_ORDER.indexOf(NEW_ROOT.slug) + 1,
        parentId: null,
      },
      select: { id: true, slug: true, name: true, order: true },
    });
    // Đưa vào `bySlug` ngay: bản đồ được dựng TRƯỚC bước tạo, nên nếu không
    // thêm thì bảng thứ tự bên dưới in "THIẾU" cho chính dòng vừa tạo đúng —
    // một lượt chạy thành công mà báo cáo như hỏng, đủ để người đọc đi tìm
    // một lỗi không tồn tại.
    bySlug.set(created.slug, created);
    console.log(`   đã tạo — icon ${NEW_ROOT.icon}, màu ${NEW_ROOT.color}`);
  } else {
    console.log(`   sẽ tạo — icon ${NEW_ROOT.icon}, màu ${NEW_ROOT.color}`);
  }
  console.log();

  // --- 2. Đánh số lại thứ tự hiển thị ---
  console.log("Thứ tự hiển thị (đánh số lại 1–7):");
  for (const [index, slug] of ROOT_ORDER.entries()) {
    const order = index + 1;
    const current = bySlug.get(slug);
    if (!current) {
      // Lĩnh vực mới trong lượt chạy khô: chưa tồn tại là bình thường.
      console.log(`   ${order}. ${slug} — ${write ? "THIẾU" : "sẽ có order đúng khi tạo"}`);
      continue;
    }
    if (current.order === order) {
      console.log(`   ${order}. ${slug} — đã đúng`);
      continue;
    }
    if (write) {
      await prisma.category.update({ where: { id: current.id }, data: { order } });
      console.log(`   ${order}. ${slug} — ${current.order} → ${order}`);
    } else {
      console.log(`   ${order}. ${slug} — ${current.order} → ${order}`);
    }
  }

  console.log();
  if (write) {
    const rootCount = await prisma.category.count({ where: { parentId: null } });
    const total = await prisma.category.count();
    console.log(`Xong. ${rootCount} lĩnh vực, ${total} chuyên mục.`);
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
