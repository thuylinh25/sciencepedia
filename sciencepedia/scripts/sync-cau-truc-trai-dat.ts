import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { MAX_WORDS, MIN_WORDS, prose } from "./check-publish";
import { readingTime } from "../src/lib/utils";

/**
 * Đồng bộ lại `cau-truc-ben-trong-trai-dat` sau lượt sửa tay không qua gate.
 *
 *   npm run sync:cau-truc              # in kế hoạch, KHÔNG ghi gì
 *   npm run sync:cau-truc -- --write   # thực thi
 *
 * ## Chuyện gì đã xảy ra
 *
 * Bài xuất bản 2026-09-06 qua pipeline, `science-editor` duyệt hai vòng. Ngày
 * 2026-09-08, hai lượt sửa tay qua giao diện admin thay nội dung tiếng Việt và
 * đổi title — không ghi chú, không qua gate. Lượt sửa đó **hoàn tác cả hai lỗi
 * S2 mà vòng duyệt trước đã bắt**: con số nhiệt độ lõi không nguồn quay lại,
 * và 6.371 km quay lại. Nó cũng gỡ mọi mệnh đề dè dặt và mọi attribution,
 * trong khi hàng vẫn treo 8 Source và `reviewedById` khác null.
 *
 * Chủ sản phẩm quyết **giữ bản sửa tay làm bản chuẩn**, nên lượt này không lùi
 * về bản pipeline: nó sửa bản sửa tay cho qua được gate. `science-editor` duyệt
 * hai vòng ngày 2026-09-10, verdict APPROVE. Chi tiết từng claim:
 * `docs/content/corrections.md`, mục 2026-09-10.
 *
 * ## Vì sao đọc từ file trên đĩa chứ không nhúng chuỗi vào script
 *
 * Từ 2026-09-08, đĩa và CSDL đã lệch nhau: `drafts/…md` vẫn là bản pipeline
 * 598 từ trong khi cột `content` là bản sửa tay. Phép kiểm của `meta.yaml` cho
 * bước 3 và bước 9 là `ls` hai file đó — nên phép kiểm trả kết quả xanh cho
 * một nội dung không còn được phục vụ cho người đọc.
 *
 * Đọc từ đĩa buộc hai bên hội tụ: sau lượt này, file draft **là** thứ đang
 * chạy. Nhúng chuỗi vào script thì sinh ra bản thứ ba.
 *
 * ## Vì sao KHÔNG dùng `scripts/apply-corrections.ts`
 *
 * Script đó sửa theo cặp find/replace khớp duy nhất một chỗ — đúng cho lượt
 * 2026-09-05 khi mỗi bài đổi vài câu. Ở đây cả hai locale bị thay toàn bộ, nên
 * find/replace sẽ là mười cặp chuỗi dài mà không cặp nào đọc bằng mắt được.
 * Cùng ràng buộc quan trọng nhất được giữ nguyên: `Revision` chụp nội dung
 * TRƯỚC khi đổi, trong **cùng một transaction** với lệnh sửa, nên lịch sử
 * không thể lệch khỏi nội dung.
 *
 * ## Vì sao đóng dấu lại `reviewedAt`
 *
 * Dấu 2026-09-06 chứng thực cho một văn bản đã bị thay từ 2026-09-08. Giữ
 * nguyên nó là để một byline nói sai. `reviewedById` KHÔNG đổi — vẫn là tài
 * khoản tổ chức "Ban biên tập Sciencepedia", theo `docs/content-rules.md` mục
 * "Byline người duyệt".
 *
 * `readingTime` tính bằng `readingTime()` của `src/lib/utils.ts` — cùng hàm mà
 * đường ghi qua form admin dùng — chứ không đặt tay. Hai hàm đếm từ trong kho
 * cho hai con số (gate `countWords` đếm chuỗi thô, `readingTime` bóc markdown
 * trước), và chỉ hàm này mới là thứ ghi vào cột.
 */
const prisma = new PrismaClient();

const SLUG = "cau-truc-ben-trong-trai-dat";

/**
 * Ngày chạy lượt này — cũng là `reviewedAt` và `lastVerifiedAt` được đặt.
 *
 * 2026-09-11, KHÔNG phải 2026-09-10 như bản đầu.
 *
 * Mốc 09-10 là ngày bản tiếng Việt qua gate. Nhưng lệnh ghi này đặt cả
 * `content` LẪN `contentEn` trong một transaction, mà bản tiếng Anh ngày đó
 * còn chưa tồn tại — nó được dịch và duyệt ngày 11. Đóng dấu 09-10 lên một
 * hàng có nửa tiếng Anh chưa hề qua gate vào ngày đó là đúng thứ sai mà
 * `docs/content/corrections.md` mục 2026-09-10 đã phán quyết: một byline
 * chứng thực cho văn bản chưa được thẩm định ở thời điểm nó ghi.
 *
 * Đẩy mốc tới ngày muộn hơn cũng đúng cho bản tiếng Việt: hàng dữ liệu chỉ
 * trọn vẹn khi cả hai ngôn ngữ cùng qua gate, và đó là ngày 11.
 *
 * `reviewedById` KHÔNG đổi — vẫn là tài khoản tổ chức "Ban biên tập
 * Sciencepedia".
 */
const VERIFIED_AT = new Date("2026-09-11T00:00:00Z");

const DRAFTS = path.resolve(process.cwd(), "..", "docs", "content", "drafts");
const VI_FILE = path.join(DRAFTS, `${SLUG}.md`);
const EN_FILE = path.join(DRAFTS, `${SLUG}.en.md`);

const REVISION_NOTE =
  "Trước lượt đồng bộ 2026-09-10: hoàn tác hai lượt sửa tay 2026-09-08 " +
  "(không ghi chú, không qua gate accuracy) đã tái lập lỗi S2-1 (nhiệt độ lõi " +
  "không nguồn) và S2-2 (6.371 km), gỡ mọi mệnh đề dè dặt và mọi attribution. " +
  "science-editor duyệt hai vòng ngày 2026-09-10, verdict APPROVE. Chi tiết: " +
  "docs/content/corrections.md mục 2026-09-10.";

async function main() {
  const write = process.argv.includes("--write");

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  console.log();

  const vi = readFileSync(VI_FILE, "utf8").trimEnd() + "\n";
  const en = readFileSync(EN_FILE, "utf8").trimEnd() + "\n";

  const article = await prisma.article.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      title: true,
      content: true,
      contentEn: true,
      readingTime: true,
      reviewedById: true,
      reviewedAt: true,
      lastVerifiedAt: true,
    },
  });
  if (!article) {
    console.error(`Không có bài nào mang slug \`${SLUG}\`.`);
    process.exitCode = 1;
    return;
  }

  // Gate độ dài đo trên cùng đại lượng với `check-publish.ts`, để script này
  // không ghi ra thứ mà gate sẽ chặn ngay sau đó.
  const gateWords = prose(vi).trim().split(/\s+/).length;
  const minutes = readingTime(vi);

  console.log(`Bài: ${article.title} (${SLUG})`);
  console.log(`  content   : ${article.content.length} → ${vi.length} ký tự`);
  console.log(`  contentEn : ${article.contentEn?.length ?? 0} → ${en.length} ký tự`);
  console.log(`  readingTime: ${article.readingTime} → ${minutes}`);
  console.log(`  reviewedAt : ${article.reviewedAt?.toISOString().slice(0, 10) ?? "-"} → ${VERIFIED_AT.toISOString().slice(0, 10)}`);
  console.log(`  reviewedById: ${article.reviewedById ?? "-"} (không đổi)`);
  console.log();
  console.log(`  từ theo gate: ${gateWords} (băng ${MIN_WORDS}–${MAX_WORDS})`);

  if (gateWords < MIN_WORDS || gateWords > MAX_WORDS) {
    console.error("  → NGOÀI BĂNG. Sửa bản nháp trước, đừng ghi.");
    process.exitCode = 1;
    return;
  }
  if (!article.reviewedById) {
    // Không tự điền: byline người duyệt là phán quyết, không phải hệ quả của
    // một phép thay chuỗi.
    console.error("  → `reviewedById` đang trống. Script này không tự điền byline.");
    process.exitCode = 1;
    return;
  }
  console.log("  → trong băng");
  console.log();

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  await prisma.$transaction([
    // Chụp nội dung TRƯỚC khi đổi. Cùng transaction với lệnh sửa, nên không
    // tồn tại trạng thái "đã đổi bài, chưa có bản lưu".
    prisma.revision.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        note: REVISION_NOTE,
        editorId: article.reviewedById,
      },
    }),
    prisma.article.update({
      where: { id: article.id },
      data: {
        content: vi,
        contentEn: en,
        readingTime: minutes,
        reviewedAt: VERIFIED_AT,
        lastVerifiedAt: VERIFIED_AT,
      },
    }),
  ]);

  console.log("Đã ghi trong một transaction: Revision chụp bản cũ + nội dung mới.");
  console.log("Chạy `npm run publish:check -- --slug cau-truc-ben-trong-trai-dat` để xác nhận.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
