import { PrismaClient } from "@prisma/client";

/**
 * Đính chính hai lỗi **S1** ở hai bài sức khoẻ đường ruột.
 *
 *   npm run fix:s1-gut              # in kế hoạch, KHÔNG ghi
 *   npm run fix:s1-gut -- --write   # thực thi
 *
 * ## Vì sao có script này
 *
 * Lượt rà 2026-09-11 phát hiện **41/58 bài** ở `factCheck = PENDING`, trong đó
 * 9 bài không có nguồn nào. `science-editor` thẩm định lô 9 bài đó và trả
 * REVISE cho cả chín, với **hai phát hiện mức S1 — cả hai nằm ở nội dung sức
 * khoẻ**. Đây là hai lỗi duy nhất trong lô có thể ảnh hưởng tới hành vi của
 * người đọc, nên chúng đi trước, tách khỏi 34 phát hiện S2/S3 còn lại.
 *
 * ## S1 thứ nhất — mô hình sai về serotonin ruột
 *
 * Bài `ruot-he-vi-sinh-vat...` mở bằng "95% serotonin của cơ thể được sản xuất
 * tại đường tiêu hóa", rồi ba mục sau nói về cảm xúc, tâm trạng, và cách đổi
 * chế độ ăn để "lập trình lại" hệ vi sinh. Người đọc ghép lại được đúng một
 * kết luận: *serotonin của tâm trạng nằm ở ruột, nên ăn đúng thứ sẽ nâng nó
 * lên.*
 *
 * Serotonin ngoại vi **không qua được hàng rào máu–não**. Nó điều hoà nhu
 * động, hấp thu và chuyển hoá, không phải nguồn serotonin của não. Trục
 * ruột–não có thật nhưng đi qua thần kinh phế vị, miễn dịch và trục HPA.
 *
 * Đây đúng loại lỗi mà `docs/content-rules.md` gọi là đơn giản hoá để lại mô
 * hình sai — tệ hơn không nói gì, vì nó là mô hình mà cả ngành thực phẩm chức
 * năng đang bán.
 *
 * ## S1 thứ hai — bài nhịn ăn không có một dòng chống chỉ định
 *
 * Bài `nhin-an-gian-doan...` nằm ở chuyên mục dinh dưỡng, liệt kê bảy lợi ích
 * và kết bằng mô tả hành vi ("ít ăn vặt hơn"). Không một chữ nào nói ai KHÔNG
 * nên nhịn ăn gián đoạn.
 *
 * Bài không nói gì sai. Cái nó **im lặng** mới là thứ có thể gây hại: nó có
 * thể được đọc bởi phụ nữ mang thai, người có tiền sử rối loạn ăn uống, hoặc
 * người đái tháo đường đang dùng thuốc hạ đường huyết.
 *
 * ## Vì sao sửa chứ không gỡ bài
 *
 * `science-editor` đề nghị đưa bài nhịn ăn về DRAFT cho tới khi có mục chống
 * chỉ định. Script này **thêm mục đó luôn**, nên lý do để gỡ không còn.
 *
 * Văn bản chèn vào là **nguyên văn câu sửa của editor**, không phải bản diễn
 * đạt lại của phiên chính. Đó là ranh giới quan trọng: gate accuracy thuộc về
 * editor, và một câu về chống chỉ định y tế do người khác viết lại thì không
 * còn là câu đã qua gate.
 */

const prisma = new PrismaClient();

/** Ngày thẩm định của lượt này. */
const VERIFIED_AT = new Date("2026-09-11T00:00:00Z");

/** Byline tổ chức, giống mọi đường ghi khác — xem `docs/content-rules.md`. */
const EDITOR_ID = "cmti8v05z0000k5ccfg55mget";

type Fix = {
  slug: string;
  note: string;
  /** Cặp thay chuỗi, phải khớp DUY NHẤT một chỗ */
  edits: { from: string; to: string }[];
};

const FIXES: Fix[] = [
  {
    slug: "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai",
    note:
      "Đính chính S1 2026-09-11: gạch đầu dòng '95% serotonin' đặt cạnh mục " +
      "cảm xúc và mục đổi chế độ ăn dựng nên mô hình sai — serotonin ruột " +
      "không qua hàng rào máu–não và không phải nguồn serotonin của não. " +
      "Kèm hai đính chính S2: số nơron hệ thần kinh ruột (phép đếm trực tiếp " +
      "2022 cho 168 triệu, không phải 500 triệu) và con số ngầm về tỉ lệ tín " +
      "hiệu hướng tâm. Phán quyết: science-editor, lô 9 bài không nguồn.",
    edits: [
      {
        from:
          "- Khoảng **500 triệu tế bào thần kinh** nằm trong hệ thần kinh ruột.",
        to:
          "- Ước lượng thường được trích dẫn là **400–600 triệu** tế bào thần " +
          "kinh trong hệ thần kinh ruột. Phép đếm trực tiếp toàn diện đầu " +
          "tiên, công bố năm 2022, cho con số thấp hơn nhiều — **khoảng 168 " +
          "triệu** — và tương đương số nơron trong tủy sống. Con số chính xác " +
          "vẫn đang được xác lập.",
      },
      {
        from:
          "- Khoảng **95% serotonin** của cơ thể được sản xuất tại đường tiêu hóa, chỉ khoảng 5% được tạo ra trong não.",
        to:
          "- Khoảng **90–95% serotonin của cơ thể** nằm ở đường tiêu hóa, chủ " +
          "yếu do tế bào ưa crôm ruột tiết ra. Lượng serotonin này **không đi " +
          "qua hàng rào máu–não** và không phải là nguồn serotonin mà não " +
          "dùng: nó điều hòa nhu động ruột, hấp thu và chuyển hóa. Ruột vẫn " +
          "ảnh hưởng tới não, nhưng qua thần kinh phế vị, hệ miễn dịch và các " +
          "tín hiệu nội tiết — không phải bằng cách gửi serotonin lên não.",
      },
      {
        from:
          "- Dây thần kinh phế vị (*vagus nerve*) kết nối não và ruột, với phần lớn tín hiệu được truyền **từ ruột lên não**.",
        to:
          "- Dây thần kinh phế vị (*vagus nerve*) kết nối não và ruột, và " +
          "truyền tín hiệu theo **cả hai chiều**.",
      },
      {
        from: "Ruột chứa hàng nghìn tỷ vi sinh vật",
        to: "Ruột chứa hàng chục nghìn tỉ vi sinh vật",
      },
    ],
  },
  {
    slug: "nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao",
    note:
      "Đính chính S1 2026-09-11: bài liệt kê bảy lợi ích của nhịn ăn gián " +
      "đoạn mà không có một dòng chống chỉ định nào, trong khi nội dung đủ " +
      "sức đổi hành vi ăn uống và có thể được đọc bởi phụ nữ mang thai, người " +
      "có tiền sử rối loạn ăn uống hoặc người đái tháo đường đang dùng thuốc. " +
      "Thêm mục chống chỉ định riêng trước phần Kết luận. Kèm một đính chính " +
      "S3 về mức độ chắc chắn của mệnh đề triệu chứng. Phán quyết: " +
      "science-editor, lô 9 bài không nguồn.",
    edits: [
      {
        from: "- Giảm nguy cơ đầy hơi và chướng bụng ở một số người.",
        to:
          "- Được cho là có thể liên quan đến việc giảm đầy hơi và chướng " +
          "bụng ở một số người.",
      },
      {
        /*
         * Chèn TRƯỚC "## Kết luận", thành một mục riêng.
         *
         * Không nhét vào trong phần kết luận: chống chỉ định y tế là thông tin
         * người đọc phải gặp được khi lướt, và một đoạn nằm lẫn trong kết luận
         * thì người lướt qua sẽ không thấy.
         */
        from: "## Kết luận",
        to:
          "## Ai không nên nhịn ăn gián đoạn\n\n" +
          "**Nhịn ăn gián đoạn không phù hợp với tất cả mọi người.** Các " +
          "hướng dẫn hiện hành khuyến cáo không áp dụng cho phụ nữ mang thai " +
          "hoặc đang cho con bú và cho trẻ em, do chưa đủ dữ liệu an toàn. " +
          "Người có tiền sử rối loạn ăn uống, tiền sử hạ đường huyết nặng, " +
          "hoặc người cao tuổi có nguy cơ thiểu cơ cần cân nhắc thận trọng. " +
          "Người đái tháo đường đang dùng thuốc ảnh hưởng đường huyết chỉ nên " +
          "nhịn ăn gián đoạn dưới giám sát y tế. Bài viết này mô tả nghiên " +
          "cứu, không phải lời khuyên điều trị.\n\n" +
          "## Kết luận",
      },
    ],
  },
];

async function main() {
  const write = process.argv.includes("--write");
  console.log(
    write ? "=== THỰC THI ===\n" : "=== CHẠY KHÔ (thêm --write để ghi) ===\n",
  );

  let blocked = false;
  const plans: { id: string; slug: string; title: string; before: string; after: string; note: string }[] = [];

  for (const fix of FIXES) {
    const article = await prisma.article.findUnique({
      where: { slug: fix.slug },
      select: { id: true, title: true, content: true, status: true },
    });

    if (!article) {
      console.error(`✗ không có bài nào mang slug "${fix.slug}"`);
      blocked = true;
      continue;
    }

    let next = article.content;
    let ok = true;

    for (const [index, edit] of fix.edits.entries()) {
      const hits = next.split(edit.from).length - 1;
      // Khớp đúng MỘT chỗ. Không khớp thì bài đã đổi so với lúc thẩm định;
      // khớp nhiều chỗ thì không biết editor nói về chỗ nào.
      if (hits !== 1) {
        console.error(
          `✗ ${fix.slug}: sửa #${index + 1} khớp ${hits} chỗ (cần đúng 1)\n` +
            `    "${edit.from.slice(0, 60)}…"`,
        );
        ok = false;
        blocked = true;
        continue;
      }
      next = next.replace(edit.from, edit.to);
    }

    if (!ok) continue;

    console.log(`✓ ${article.title}`);
    console.log(`    ${article.status} · ${fix.edits.length} câu sửa`);
    console.log(`    ${article.content.length} → ${next.length} ký tự`);
    console.log();

    plans.push({
      id: article.id,
      slug: fix.slug,
      title: article.title,
      before: article.content,
      after: next,
      note: fix.note,
    });
  }

  if (blocked) {
    console.error("Có mục không áp được. Dừng, không ghi gì.");
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  for (const plan of plans) {
    await prisma.$transaction([
      // Chụp nội dung TRƯỚC khi đổi, cùng transaction với lệnh sửa — không tồn
      // tại trạng thái "đã đổi bài, chưa có bản lưu".
      prisma.revision.create({
        data: {
          articleId: plan.id,
          title: plan.title,
          content: plan.before,
          note: plan.note,
          editorId: EDITOR_ID,
        },
      }),
      prisma.article.update({
        where: { id: plan.id },
        data: {
          content: plan.after,
          lastVerifiedAt: VERIFIED_AT,
          /*
           * `factCheck` vẫn để PENDING, KHÔNG đặt PASSED.
           *
           * Lượt này chỉ đóng hai lỗi S1. Mỗi bài còn 3–4 phát hiện S2/S3 chưa
           * áp, và cả hai bài vẫn chưa có Source nào gắn vào. Đặt PASSED bây
           * giờ là dán nhãn "đã thẩm định" lên một hàng còn dở — đúng thứ sai
           * mà corrections.md mục 2026-09-10 đã phán quyết.
           */
        },
      }),
    ]);
    console.log(`✓ đã ghi: ${plan.slug}`);
  }

  console.log("\nCòn lại trong lô: 34 phát hiện S2/S3 trên 9 bài, và cả 9 bài");
  console.log("vẫn chưa có Source nào gắn vào CSDL.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
