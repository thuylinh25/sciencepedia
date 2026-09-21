import { PrismaClient } from "@prisma/client";

/**
 * Sửa link nội bộ trỏ tới slug đã chết.
 *
 *   npm run links:fix              # in kế hoạch, KHÔNG ghi gì
 *   npm run links:fix -- --write   # thực thi
 *
 * ## Vì sao có link chết
 *
 * Slug bài bị đổi mà không ghi hàng nào vào `ArticleSlugRedirect`, nên URL cũ
 * không 301 về đâu cả, còn thân bài của những bài khác vẫn trỏ vào URL ấy. Đo
 * ngày 2026-09-21: 5 đích chết, 18 link, 16 bài đã xuất bản.
 *
 * Không công cụ nào báo động, vì trang thiếu bài trả HTTP 200 kèm nội dung
 * 404 — soft-404. Trình thu thập coi đó là trang bình thường.
 *
 * ## Vì sao neo theo CHÍNH URL chứ không theo cụm chữ bao quanh
 *
 * `add-backlinks.ts` và `link-glossary.ts` phải neo theo ngữ cảnh vì chúng
 * biến chữ thường thành link — khớp nhầm là tạo ra một link sai nghĩa. Ở đây
 * ngược lại: thứ cần sửa ĐÃ là một link, và `](/articles/<slug-chết>)` chỉ có
 * đúng một nghĩa. Neo theo URL vừa chính xác tuyệt đối, vừa bắt được cả những
 * chỗ chưa ai đọc tới.
 *
 * ## Vì sao nhãn đổi trong danh sách Đọc thêm nhưng giữ nguyên trong câu văn
 *
 * Trong danh sách Đọc thêm, nhãn LÀ tên bài — để nguyên tên cũ thì người đọc
 * bấm vào rồi tới một bài mang tên khác. Trong câu văn, nhãn là một cụm của
 * câu (`the [eight planets](...)`); thay nó bằng tên bài là làm hỏng câu.
 * Nên: mục danh sách lấy tên bài đích, nằm trong câu thì chỉ đổi URL.
 */
const prisma = new PrismaClient();

type Fix =
  | { dead: string; to: string; drop?: never; why: string }
  | { dead: string; to?: never; drop: true; why: string };

const FIXES: Fix[] = [
  {
    dead: "tam-hanh-tinh-cua-he-mat-troi",
    to: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    why: "Tên cũ [Tám hành tinh của Hệ Mặt Trời] nay là [Toàn cảnh về cấu trúc và đặc điểm của 8 hành tinh trong Hệ Mặt Trời] — cùng một bài.",
  },
  {
    dead: "dieu-gi-se-xay-ra-neu-con-nguoi-ra-ngoai-vu-tru-ma-khong-co-bo-do-vu-tru",
    to: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    why: "Tên cũ [Điều gì sẽ xảy ra nếu con người ra ngoài vũ trụ mà không có bộ đồ vũ trụ?] nay là [Cơ thể người sẽ biến đổi thế nào trong không gian nếu không có đồ bảo hộ?] — cùng chủ đề, cùng bài.",
  },
  {
    dead: "vi-sao-cac-hanh-tinh-tu-quay-quanh-truc",
    to: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    why: "Tên cũ [Vì sao các hành tinh tự quay quanh trục] nay là [Giải mã hiện tượng tự quay quanh trục của các hành tinh trong vũ trụ].",
  },
  {
    dead: "nhung-hat-vo-hinh-tao-nen-the-gioi-vat-chat",
    to: "nguyen-tu-cau-tao-nen-van-vat",
    why: "Bài hiện mang tên [Nguyên tử: Khám phá những hạt vô hình kiến tạo nên vạn vật] — giữ nguyên cụm hạt vô hình của tên cũ, nên đây chính là bài ấy.",
  },
  {
    dead: "hanh-trinh-vao-tam-trai-dat",
    to: "cau-truc-ben-trong-trai-dat",
    why: "Đích này CÓ 301 trong next.config.ts, nhưng luật không tiền tố locale trỏ thẳng về /vi — người đọc bản tiếng Anh bấm vào bị đẩy sang trang tiếng Việt. Ba link còn lại đều nằm trong contentEn, nên trỏ thẳng vào slug đang sống thay vì đi vòng qua redirect. Luật redirect vẫn giữ, cho link từ ngoài site.",
  },
  {
    dead: "khong-gian-vu-tru-moi-truong-chan-khong-gan-nhu-hoan-hao",
    drop: true,
    why: "Kho không có bài nào về chân không vũ trụ để thay thế. Gỡ nguyên mục khỏi danh sách Đọc thêm, không trỏ bừa sang bài khác: một gợi ý sai tệ hơn không gợi ý.",
  },
];

/** Link có phải là toàn bộ một mục danh sách — `- [nhãn](url)` rồi hết dòng. */
function listItemBounds(body: string, linkStart: number, linkEnd: number) {
  const lineStart = body.lastIndexOf("\n", linkStart) + 1;
  const found = body.indexOf("\n", linkEnd);
  const lineEnd = found === -1 ? body.length : found;
  const prefix = body.slice(lineStart, linkStart);
  const suffix = body.slice(linkEnd, lineEnd);
  return {
    isItem: /^[-*]\s+$/.test(prefix) && suffix.trim() === "",
    lineStart,
    lineEnd,
  };
}

/**
 * Tìm `[nhãn](/articles/<slug>)`. Quét từ `](` ngược ra dấu `[` gần nhất và
 * loại trường hợp có `]` xen giữa — nhãn lồng ngoặc vuông thì bỏ qua, để
 * không cắt nhầm giữa một cấu trúc phức tạp hơn.
 */
function findLinks(body: string, slug: string) {
  const needle = "](/articles/" + slug + ")";
  const out: { start: number; end: number; label: string }[] = [];
  let at = body.indexOf(needle);
  while (at !== -1) {
    const open = body.lastIndexOf("[", at);
    if (open !== -1 && !body.slice(open + 1, at).includes("]")) {
      out.push({ start: open, end: at + needle.length, label: body.slice(open + 1, at) });
    }
    at = body.indexOf(needle, at + 1);
  }
  return out;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, content: true, contentEn: true },
    orderBy: { slug: "asc" },
  });

  const wanted = FIXES.flatMap((fix) => (fix.to ? [fix.to] : []));
  const targets = await prisma.article.findMany({
    where: { slug: { in: wanted } },
    select: { slug: true, title: true, titleEn: true, status: true },
  });
  const titleOf = new Map(targets.map((t) => [t.slug, t]));

  // Dừng trước khi ghi nếu một đích không tồn tại hoặc chưa xuất bản: sửa
  // link chết thành một link chết khác là tệ hơn không sửa.
  for (const fix of FIXES) {
    if (!fix.to) continue;
    const target = titleOf.get(fix.to);
    if (!target) throw new Error(`Bài đích không có trong CSDL: ${fix.to}`);
    if (target.status !== "PUBLISHED") {
      throw new Error(`Bài đích chưa xuất bản: ${fix.to} (${target.status})`);
    }
  }

  let changed = 0;
  const updates: {
    id: string;
    slug: string;
    title: string;
    before: string;
    data: Record<string, string>;
  }[] = [];

  for (const article of articles) {
    const data: Record<string, string> = {};

    for (const field of ["content", "contentEn"] as const) {
      const original = article[field];
      if (!original) continue;
      let body = original;

      for (const fix of FIXES) {
        // Quét lại sau mỗi lần thay: mọi vị trí phía sau đều dịch đi.
        for (;;) {
          const hit = findLinks(body, fix.dead)[0];
          if (!hit) break;
          const bounds = listItemBounds(body, hit.start, hit.end);

          if (fix.drop) {
            if (!bounds.isItem) {
              throw new Error(
                `${article.slug}.${field}: link tới ${fix.dead} nằm trong câu văn — gỡ tự động sẽ làm thủng câu, phải sửa tay`,
              );
            }
            console.log(`  ${article.slug} [${field}] GỠ MỤC · ${hit.label}`);
            // Nuốt luôn dấu xuống dòng đứng trước, để không còn dòng trống.
            body = body.slice(0, Math.max(0, bounds.lineStart - 1)) + body.slice(bounds.lineEnd);
          } else {
            const target = titleOf.get(fix.to)!;
            const label = bounds.isItem
              ? field === "content"
                ? target.title
                : (target.titleEn ?? target.title)
              : hit.label;
            console.log(
              `  ${article.slug} [${field}] ${bounds.isItem ? "MỤC      " : "TRONG CÂU"} · ${hit.label} → ${label}`,
            );
            body =
              body.slice(0, hit.start) +
              `[${label}](/articles/${fix.to})` +
              body.slice(hit.end);
          }
          changed++;
        }
      }

      if (body !== original) data[field] = body;
    }

    if (Object.keys(data).length > 0) {
      updates.push({
        id: article.id,
        slug: article.slug,
        title: article.title,
        before: article.content,
        data,
      });
    }
  }

  console.log(`\n${changed} link sửa, trên ${updates.length} bài.`);

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  /* Revision trước khi sửa, cùng quy ước với `add-backlinks.ts` — giữ nguyên
     văn bản đã publish để sau này đối chiếu được.

     Bảng `Revision` chỉ có cột `content`, không có `contentEn`. Bản tiếng Anh
     vì thế KHÔNG được chụp lại; nó hoàn nguyên được nhờ chính bản ghi này:
     mỗi thay đổi là một URL đổi chỗ, và slug cũ nằm sẵn trong `FIXES`. */
  await prisma.$transaction([
    ...updates.map((u) =>
      prisma.revision.create({
        data: {
          articleId: u.id,
          title: u.title,
          content: u.before,
          note: "Trước khi sửa link nội bộ trỏ tới slug đã chết",
        },
      }),
    ),
    ...updates.map((u) =>
      prisma.article.update({ where: { id: u.id }, data: u.data }),
    ),
  ]);
  console.log(`Đã ghi ${updates.length} bài (kèm revision).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
