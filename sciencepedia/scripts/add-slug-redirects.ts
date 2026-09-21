import { PrismaClient } from "@prisma/client";

/**
 * Ghi hàng `ArticleSlugRedirect` cho những slug đã đổi mà không để lại vết.
 *
 *   npm run slugs:redirect              # in kế hoạch, KHÔNG ghi gì
 *   npm run slugs:redirect -- --write   # thực thi
 *
 * ## Vì sao cần, khi link trong bài đã sửa rồi
 *
 * `fix-dead-internal-links.ts` chỉ chữa được link NẰM TRONG kho. Link từ bên
 * ngoài — chia sẻ trên mạng xã hội, chỉ mục của Google, dấu trang của người
 * đọc — vẫn trỏ vào URL cũ, và ta không sửa được chúng. Một hàng ở bảng này
 * biến 404 thành 301: `page.tsx` tra bảng trước khi bỏ cuộc.
 *
 * Nó cũng chữa một lỗi kín: trang thiếu bài trả HTTP 200 kèm nội dung 404
 * (Next 15.5, route động — ghi ở đầu `page.tsx`), nên URL cũ hiện KHÔNG báo
 * hỏng cho bất cứ công cụ nào. 301 thì rõ ràng với cả người và máy.
 *
 * ## Vì sao không có mục cho `khong-gian-vu-tru-moi-truong-chan-khong…`
 *
 * Bài ấy không có người kế nhiệm trong kho. Trỏ 301 sang một bài khác chủ đề
 * là nói dối với người đọc và với Google; để 404 là câu trả lời đúng.
 */
const prisma = new PrismaClient();

const REDIRECTS: { oldSlug: string; toSlug: string; why: string }[] = [
  {
    oldSlug: "tam-hanh-tinh-cua-he-mat-troi",
    toSlug: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    why: "Đổi tên bài: Tám hành tinh của Hệ Mặt Trời → Toàn cảnh về cấu trúc và đặc điểm của 8 hành tinh trong Hệ Mặt Trời.",
  },
  {
    oldSlug: "dieu-gi-se-xay-ra-neu-con-nguoi-ra-ngoai-vu-tru-ma-khong-co-bo-do-vu-tru",
    toSlug: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    why: "Đổi tên bài, cùng chủ đề cơ thể người trong chân không.",
  },
  {
    oldSlug: "vi-sao-cac-hanh-tinh-tu-quay-quanh-truc",
    toSlug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    why: "Đổi tên bài về hiện tượng tự quay quanh trục.",
  },
  {
    oldSlug: "nhung-hat-vo-hinh-tao-nen-the-gioi-vat-chat",
    toSlug: "nguyen-tu-cau-tao-nen-van-vat",
    why: "Đổi tên bài: tên mới giữ nguyên cụm hạt vô hình của tên cũ.",
  },
  {
    oldSlug: "hanh-trinh-vao-tam-trai-dat",
    toSlug: "cau-truc-ben-trong-trai-dat",
    why: "Đã có luật 301 trong next.config.ts, nhưng biến thể KHÔNG tiền tố locale ở đó trỏ cứng về /vi. Hàng này giữ đúng locale của người đọc.",
  },
];

async function main() {
  const write = process.argv.slice(2).includes("--write");

  const targets = await prisma.article.findMany({
    where: { slug: { in: REDIRECTS.map((r) => r.toSlug) } },
    select: { id: true, slug: true, status: true },
  });
  const bySlug = new Map(targets.map((t) => [t.slug, t]));

  // Slug cũ trùng slug của một bài đang sống thì tuyệt đối không ghi: hàng ấy
  // sẽ không bao giờ được dùng, nhưng nó là một cái bẫy chờ lần đổi tên sau.
  const collisions = await prisma.article.findMany({
    where: { slug: { in: REDIRECTS.map((r) => r.oldSlug) } },
    select: { slug: true },
  });
  if (collisions.length > 0) {
    throw new Error(
      `Slug cũ đang thuộc về bài đang sống: ${collisions.map((c) => c.slug).join(", ")}`,
    );
  }

  const existing = await prisma.articleSlugRedirect.findMany({
    where: { oldSlug: { in: REDIRECTS.map((r) => r.oldSlug) } },
    select: { oldSlug: true },
  });
  const already = new Set(existing.map((e) => e.oldSlug));

  const plan: { oldSlug: string; articleId: string }[] = [];

  for (const r of REDIRECTS) {
    const target = bySlug.get(r.toSlug);
    if (!target) throw new Error(`Bài đích không có: ${r.toSlug}`);
    if (target.status !== "PUBLISHED") {
      throw new Error(`Bài đích chưa xuất bản: ${r.toSlug} (${target.status})`);
    }
    if (already.has(r.oldSlug)) {
      console.log(`bỏ qua  ${r.oldSlug} — đã có hàng`);
      continue;
    }
    console.log(`301     ${r.oldSlug}\n        → ${r.toSlug}\n        ${r.why}`);
    plan.push({ oldSlug: r.oldSlug, articleId: target.id });
  }

  console.log(`\n${plan.length} hàng sẽ thêm.`);
  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }
  if (plan.length === 0) return;

  await prisma.articleSlugRedirect.createMany({ data: plan });
  console.log(`Đã ghi ${plan.length} hàng.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
