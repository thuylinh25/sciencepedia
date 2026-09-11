import { PrismaClient } from "@prisma/client";

/**
 * Áp các phát hiện **S2/S3** của `science-editor` cho lô 9 bài không nguồn.
 *
 *   npm run fix:s2s3              # in kế hoạch, KHÔNG ghi
 *   npm run fix:s2s3 -- --write   # thực thi
 *
 * Hai lỗi **S1** đã xử riêng trong `fix-s1-gut.ts`; script này lo phần còn
 * lại trên bảy bài kia.
 *
 * ## Nguyên tắc của lượt này
 *
 * Mọi câu thay thế bên dưới là **nguyên văn phán quyết của editor**. Phiên
 * chính không diễn đạt lại, không rút gọn, không "làm cho mượt hơn" — một câu
 * đã qua gate accuracy mà bị viết lại thì không còn là câu đã qua gate.
 *
 * Mỗi cặp thay chuỗi phải khớp **đúng một chỗ**. Không khớp nghĩa là bài đã
 * đổi so với lúc thẩm định, và lúc đó dừng lại đúng hơn là đoán.
 *
 * ## Mẫu lỗi chung, đáng đọc trước khi sửa bài tiếp theo
 *
 * Lỗi lặp nhiều nhất trong lô là **con số đúng gắn vào kết luận sai**:
 *
 *  · tốc độ kỷ lục của Parker Solar Probe quy thành thời gian bay tới Proxima
 *    — tàu ở quỹ đạo đóng quanh Mặt Trời, không bao giờ rời Hệ Mặt Trời;
 *  · biên độ nhiệt của vỏ trạm ISS gán cho thân người;
 *  · "95% serotonin" (đã xử ở script kia).
 *
 * Cả ba đều qua được phép kiểm số học và phép kiểm link. Chỉ đọc nguồn mới
 * bắt được — đúng như `docs/content-rules.md` đã ghi sau vụ Pollack 1996.
 */

const prisma = new PrismaClient();

const VERIFIED_AT = new Date("2026-09-11T00:00:00Z");
const EDITOR_ID = "cmti8v05z0000k5ccfg55mget";

type Fix = { slug: string; note: string; edits: { from: string; to: string }[] };

const FIXES: Fix[] = [
  /* ------------------------------------------------- ra ngoài vũ trụ */
  {
    slug: "dieu-gi-se-xay-ra-neu-con-nguoi-ra-ngoai-vu-tru-ma-khong-co-bo-do-vu-tru",
    note:
      "Đính chính 2026-09-11 (science-editor, lô 9 bài không nguồn): S2 nhiệt " +
      "độ vỏ trạm ISS bị gán cho thân người; S2 'máu không sôi ngay lập tức' " +
      "hàm ý lát sau thì sôi; S3 thời gian mất ý thức 10–15 s so với 9–11 s " +
      "của NASA SP-3006; S3 mức nghiêm trọng của vỡ phổi bị nói nhẹ.",
    edits: [
      {
        from: "- Sau khoảng **10–15 giây**, con người sẽ bất tỉnh.",
        to:
          "- Sau khoảng **9–11 giây**, con người sẽ bất tỉnh. Trong tai nạn " +
          "buồng chân không tại NASA Houston năm 1966, nạn nhân mất ý thức " +
          "sau 12–15 giây và hồi phục không di chứng.",
      },
      {
        from:
          "Nếu cố nín thở, không khí trong phổi sẽ giãn nở khi áp suất bên ngoài giảm đột ngột, có thể gây tổn thương mô phổi.",
        to:
          "Nếu cố nín thở, không khí trong phổi sẽ giãn nở khi áp suất bên " +
          "ngoài giảm đột ngột. Hậu quả không dừng ở tổn thương: mô phổi và " +
          "mao mạch có thể rách, khí lọt thẳng vào tuần hoàn thành thuyên tắc " +
          "khí tới tim và não — gần như chắc chắn gây tử vong.",
      },
      {
        from:
          "Máu trong các mạch lớn không sôi ngay lập tức vì vẫn còn được duy trì dưới áp suất của hệ tuần hoàn, nhưng các bọt khí hình thành sẽ gây tổn thương nghiêm trọng cho cơ thể.",
        to:
          "Máu trong các mạch lớn **không sôi** chừng nào tim còn đập: áp suất " +
          "của hệ tuần hoàn đẩy điểm sôi của nước lên khoảng 46°C, trên thân " +
          "nhiệt 37°C. Thứ hóa hơi là nước trong mô mềm, và các bọt khí hình " +
          "thành ở đó gây tổn thương nghiêm trọng cho cơ thể.",
      },
      {
        from:
          "- Bề mặt được chiếu sáng có thể nóng trên **120°C**.\n- Vùng trong bóng tối có thể xuống dưới **−150°C**.",
        to:
          "- Hai con số thường gặp — bề mặt được chiếu nắng trên **120°C**, " +
          "vùng khuất dưới **−150°C** — là biên độ nhiệt của **vỏ tàu vũ " +
          "trụ** ở quỹ đạo thấp, không phải của cơ thể người.\n" +
          "- Cơ thể mất nhiệt chủ yếu do nước bay hơi qua đường thở và qua " +
          "da, nên da sẽ thấy hơi mát chứ không nóng lên hay đóng băng trong " +
          "khoảng thời gian đang nói tới.",
      },
    ],
  },

  /* -------------------------------------------------------- sao tối */
  {
    slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 nâng 'bằng chứng 3,5–4σ' " +
      "của NANOGrav thành 'đã phát hiện'; S3 trích dẫn vô danh, gắn đích danh " +
      "Ghodla & Ilie; S3 dải khối lượng sao tối hẹp hơn nguồn.",
    edits: [
      {
        from:
          "các nhà thiên văn đã phát hiện một **nền sóng hấp dẫn nanohertz** trải rộng khắp vũ trụ.",
        to:
          "các nhà thiên văn đã tìm thấy **bằng chứng** về một **nền sóng hấp " +
          "dẫn nanohertz** trải rộng khắp vũ trụ. Công bố NANOGrav 15 năm báo " +
          "cáo mức ý nghĩa khoảng 3,5–4σ — chưa đạt ngưỡng 5σ mà ngành dùng " +
          "cho chữ \"phát hiện\".",
      },
      {
        from:
          "Theo một số mô hình, chúng có thể phát triển tới hàng trăm nghìn hoặc hàng triệu lần khối lượng Mặt Trời",
        to:
          "Theo một số mô hình, chúng có thể phát triển tới khoảng 10⁴–10⁷ lần " +
          "khối lượng Mặt Trời",
      },
      {
        from: "Các mô phỏng mới cho thấy",
        to:
          "Ghodla và Ilie (2026, *Physical Review D*) tính toán rằng",
      },
    ],
  },

  /* ------------------------------------------------------- Proxima */
  {
    slug: "neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 Proxima Centauri c xếp dưới " +
      "nhan đề 'đã được phát hiện' trong khi NASA Exoplanet Archive không có " +
      "nó; S2 Proxima d bị nói là 'quá nóng' trong khi nhiệt độ cân bằng ~282 " +
      "K, lý do thật là khối lượng quá nhỏ; S2 Parker Solar Probe xếp cùng " +
      "bảng với tàu ở quỹ đạo thoát dù nó không bao giờ rời Hệ Mặt Trời.",
    edits: [
      {
        from:
          "- **Proxima Centauri c**: hành tinh lớn hơn, vẫn đang được nghiên cứu thêm.",
        to:
          "- **Proxima Centauri c**: một tín hiệu được đề xuất năm 2020, " +
          "**chưa được xác nhận** và hiện không nằm trong danh mục hành tinh " +
          "ngoài hệ Mặt Trời của NASA.",
      },
      {
        from:
          "- **Proxima Centauri d**: nằm rất gần sao chủ và quá nóng để có nước lỏng.",
        to:
          "- **Proxima Centauri d**: hành tinh rất nhẹ (khoảng 0,26 lần khối " +
          "lượng Trái Đất) quay sát sao chủ với chu kỳ chỉ 5,1 ngày. Nhiệt độ " +
          "cân bằng ước tính khoảng 282 K, nhưng khối lượng quá nhỏ khiến nó " +
          "khó giữ được khí quyển.",
      },
      {
        from: "- **Parker Solar Probe**: khoảng 6.700 năm.",
        to:
          "- **Parker Solar Probe**: khoảng 6.700 năm — *nhưng đây chỉ là " +
          "phép quy đổi từ tốc độ kỷ lục của nó tại cận nhật. Tàu ở quỹ đạo " +
          "đóng quanh Mặt Trời và không thể rời Hệ Mặt Trời.*",
      },
    ],
  },

  /* ------------------------------------------- gió, thuỷ triều, hải lưu */
  {
    slug: "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 phần gió bỏ mất lực " +
      "Coriolis và dùng chữ 'luôn'; S2 phần hải lưu bỏ mất dòng triều dù NOAA " +
      "xếp thủy triều là động lực đầu tiên; S3 chế độ triều nói mơ hồ; S3 tốc " +
      "độ gió do gradient áp suất quyết định, không do chênh lệch nhiệt độ.",
    edits: [
      {
        from:
          "Vì vậy, trên Trái Đất luôn tồn tại hai vùng nước dâng cao, tạo nên hiện tượng thủy triều lên xuống theo chu kỳ hằng ngày.",
        to:
          "Vì vậy, trên Trái Đất luôn tồn tại hai vùng nước dâng cao. Phần lớn " +
          "nơi trên thế giới có hai lần nước lên và hai lần nước xuống mỗi " +
          "ngày mặt trăng (khoảng 24 giờ 50 phút); một số vùng chỉ có một lần " +
          "lên và một lần xuống.",
      },
      {
        from:
          "Không khí luôn di chuyển từ nơi áp suất cao đến nơi áp suất thấp, tạo thành gió.",
        to:
          "Không khí bắt đầu chuyển động từ vùng áp cao về vùng áp thấp, " +
          "nhưng chuyển động quay của Trái Đất làm nó lệch hướng, nên ở quy mô " +
          "lớn gió thổi gần như song song với các đường đẳng áp thay vì cắt " +
          "ngang chúng.",
      },
      {
        from: "Sự chênh lệch nhiệt độ càng lớn thì gió càng mạnh.",
        to: "Sự chênh lệch áp suất càng lớn thì gió càng mạnh.",
      },
      {
        from: "Động lực quan trọng nhất tạo ra chúng là các hệ thống gió",
        to:
          "Thủy triều là một trong những động lực chính của dòng nước ven bờ. " +
          "Ở quy mô đại dương, động lực quan trọng nhất là các hệ thống gió",
      },
    ],
  },

  /* -------------------------------------------------- cảm giác hụt hẫng */
  {
    slug: "bi-mat-dang-sau-cam-giac-hut-hang-khi-van-toc-thay-doi",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 gán gia tốc thẳng cho ống " +
      "bán khuyên. Ống bán khuyên cảm nhận gia tốc GÓC; gia tốc thẳng là việc " +
      "của cơ quan sỏi tai (soan nang và cầu nang).",
    edits: [
      {
        from:
          "Trong tai trong có các ống bán khuyên chứa chất lỏng và những tế bào cảm nhận chuyển động cực nhỏ. Khi vận tốc thay đổi đột ngột, chất lỏng này không kịp chuyển động đồng bộ với cơ thể mà tiếp tục dịch chuyển theo quán tính.",
        to:
          "Trong tai trong có hai nhóm cảm biến khác nhau. **Cơ quan sỏi tai** " +
          "— soan nang và cầu nang — cảm nhận **gia tốc thẳng**: khi xe tăng " +
          "tốc hay phanh gấp, lớp màng chứa các hạt sỏi tai nhỏ bị trễ lại so " +
          "với lớp tế bào cảm nhận bên dưới, và độ lệch đó được gửi về não. " +
          "**Ống bán khuyên** thì cảm nhận **chuyển động xoay**, tức khi bạn " +
          "quay hay nghiêng đầu. Cảm giác bị kéo khi xe thay đổi vận tốc chủ " +
          "yếu đến từ nhóm thứ nhất.",
      },
    ],
  },

  /* ------------------------------------------------------ Trái Đất quay */
  {
    slug: "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 bài bị cụt — mục 'nếu quay " +
      "nhanh gấp đôi' mở ra rồi dừng sau một gạch đầu dòng, không có phần " +
      "kết. Cắt mục đó theo khuyến nghị của editor: câu hỏi ở tiêu đề đã được " +
      "trả lời xong trước khi mục này bắt đầu. S3 con số 1,2% sinh ra từ việc " +
      "nhân bốn lần con số đã làm tròn của chính bài; giá trị thật là 1,38%. " +
      "S3 tốc độ máy bay chở khách nói nhẹ đi.",
    edits: [
      {
        from:
          "Dù máy bay có thể đạt tốc độ hàng trăm km/h, hành khách bên trong vẫn cảm thấy gần như đứng yên",
        to:
          "Dù máy bay có thể bay ở khoảng 900 km/h, hành khách bên trong vẫn " +
          "cảm thấy gần như đứng yên",
      },
      {
        /*
         * Cắt cả mục cụt và thay bằng phần kết.
         *
         * Editor cho hai lối ra — viết nốt mục, hoặc cắt — và khuyên cắt:
         * câu hỏi ở tiêu đề đã được trả lời trọn vẹn trước khi mục này bắt
         * đầu, nên cắt là lựa chọn rẻ và an toàn hơn. Bài đang thiếu phần kết
         * nên thêm luôn một đoạn kết ngắn.
         */
        from:
          "## Điều gì sẽ xảy ra nếu Trái Đất quay nhanh gấp đôi?\n\nNếu một ngày nào đó Trái Đất hoàn thành một vòng quay chỉ trong **12 giờ** thay vì 24 giờ, thế giới sẽ thay đổi đáng kể.\n\n### Trọng lượng cơ thể giảm\n\nKhi tốc độ quay tăng gấp đôi, lực ly tâm tăng lên khoảng bốn lần.\n\nTại xích đạo, lực này sẽ triệt tiêu khoảng **1,2%** lực hấp dẫn. \n\n## Đọc thêm",
        to:
          "## Kết luận\n\n🌍 Chúng ta không cảm nhận được chuyển động quay của " +
          "Trái Đất vì cơ thể chỉ nhận ra **sự thay đổi** vận tốc, chứ không " +
          "nhận ra vận tốc đều. Trái Đất quay với tốc độ gần như không đổi, và " +
          "khí quyển cùng mọi thứ trên bề mặt đều chuyển động cùng nó. Lực ly " +
          "tâm sinh ra từ chuyển động ấy có thật, nhưng ở xích đạo nó chỉ " +
          "triệt tiêu khoảng **0,35%** lực hấp dẫn — quá nhỏ để giác quan nào " +
          "của con người ghi nhận được.\n\n## Đọc thêm",
      },
    ],
  },

  /* ---------------------------------------------------------- chân không */
  {
    slug: "khong-gian-vu-tru-moi-truong-chan-khong-gan-nhu-hoan-hao",
    note:
      "Đính chính 2026-09-11 (science-editor): S2 một con số mật độ dùng cho " +
      "ba môi trường lệch nhau 5–7 bậc độ lớn; S3 'Sự trống rỗng vĩ đại' " +
      "trình bày như tên gọi khoa học trong khi đó là biệt danh phổ thông.",
    edits: [
      {
        from:
          "Trung bình, mỗi mét khối không gian chỉ chứa khoảng vài proton hoặc nguyên tử. Con số này thấp hơn rất nhiều so với bất kỳ môi trường nào trên Trái Đất.",
        to:
          "Trung bình, mỗi mét khối không gian chỉ chứa khoảng vài proton hoặc " +
          "nguyên tử. Con số này thấp hơn rất nhiều so với bất kỳ môi trường " +
          "nào trên Trái Đất.\n\nĐây là mức trung bình của vũ trụ, tương ứng " +
          "với không gian **liên thiên hà**. Các vùng khác đặc hơn nhiều: môi " +
          "trường liên sao bên trong Ngân Hà chứa khoảng 10⁵–10⁶ hạt mỗi mét " +
          "khối, còn gió Mặt Trời ở khoảng cách Trái Đất khoảng vài triệu hạt " +
          "mỗi mét khối. Cả ba đều loãng hơn mọi chân không tạo được trong " +
          "phòng thí nghiệm, nhưng chúng không loãng như nhau.",
      },
      {
        from: 'thường được gọi là **"Sự trống rỗng vĩ đại"**',
        to: 'có biệt danh phổ thông là **"Sự trống rỗng vĩ đại"**',
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
  const plans: {
    id: string;
    slug: string;
    title: string;
    before: string;
    after: string;
    note: string;
    count: number;
  }[] = [];

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
      if (hits !== 1) {
        console.error(
          `✗ ${fix.slug}: sửa #${index + 1} khớp ${hits} chỗ (cần đúng 1)\n` +
            `    "${edit.from.slice(0, 70)}…"`,
        );
        ok = false;
        blocked = true;
        continue;
      }
      next = next.replace(edit.from, edit.to);
    }

    if (!ok) continue;

    console.log(`✓ ${article.title}`);
    console.log(
      `    ${article.status} · ${fix.edits.length} câu sửa · ${article.content.length} → ${next.length} ký tự`,
    );

    plans.push({
      id: article.id,
      slug: fix.slug,
      title: article.title,
      before: article.content,
      after: next,
      note: fix.note,
      count: fix.edits.length,
    });
  }

  console.log();
  if (blocked) {
    console.error("Có mục không áp được. Dừng, không ghi gì.");
    process.exitCode = 1;
    return;
  }

  const total = plans.reduce((sum, p) => sum + p.count, 0);
  console.log(`${plans.length} bài, ${total} câu sửa.\n`);

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  for (const plan of plans) {
    await prisma.$transaction([
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
        data: { content: plan.after, lastVerifiedAt: VERIFIED_AT },
      }),
    ]);
    console.log(`✓ đã ghi: ${plan.slug}`);
  }

  console.log(
    "\n`factCheck` vẫn để PENDING: cả chín bài trong lô vẫn chưa có Source nào\n" +
      "gắn vào CSDL, và đó mới là thứ `publish:check` đòi.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
