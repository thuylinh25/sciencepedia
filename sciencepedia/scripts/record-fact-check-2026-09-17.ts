import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Ghi verdict của đợt thẩm định 17/09 vào `Article.factCheck`.
 *
 *   npx tsx scripts/record-fact-check-2026-09-17.ts            # in kế hoạch
 *   npx tsx scripts/record-fact-check-2026-09-17.ts --write    # thực thi
 *
 * Nguồn verdict là `content/checks/<slug>.yaml` do `science-editor` ghi, mỗi
 * claim có evidence đã mở trong lượt. Script không tự phán xử gì.
 *
 * ## Vì sao lần này ghi, trong khi các đợt 11/09 và 13/09 để nguyên PENDING
 *
 * Các đợt trước giữ PENDING để KHÔNG dán nhãn PASSED lên bài còn dở — lý do
 * ấy vẫn đúng và script này không đặt PASSED cho bài nào. Nhưng giữ PENDING
 * sau ba lượt thẩm định có cái giá riêng: PENDING đọc ra là "chưa ai xem",
 * trong khi sự thật là "đã xem, không đạt". Enum có sẵn REVISE và FAILED cho
 * đúng hai trạng thái đó.
 *
 *   revise → REVISE   sửa được; về bước 3 (viết lại) hoặc bước 1 (nguồn)
 *   reject → FAILED   có S1 hoặc sai nhân quả ở nội dung sức khoẻ
 *
 * ## Vì sao KHÔNG đặt reviewedById, reviewedAt, lastVerifiedAt
 *
 * Ba cột đó hiện lên byline "đã được biên tập viên duyệt" ở trang bài. Bài
 * không đạt gate thì không được mang byline duyệt. `lastVerifiedAt` điều
 * khiển lịch đối chiếu lại — đặt cho bài chưa sửa thì lịch ấy bị đẩy lùi sai.
 *
 * Đổi `factCheck` không gỡ bài: `status` giữ nguyên, trang không đọc cột này.
 * Gỡ hay giữ online là quyết định riêng của science-editor.
 */
const prisma = new PrismaClient();

const CHECKS = join(__dirname, "..", "..", "docs", "content", "checks", "2026-09-17");
const TO_STATE = { revise: "REVISE", reject: "FAILED" } as const;

/**
 * Slug bị đổi trên trang quản trị TRONG LÚC thẩm định (17/09, 06:24 UTC).
 * File YAML mang slug lúc dump. Đã so: nội dung bài không đổi một ký tự, chỉ
 * slug và tiêu đề đổi, nên verdict vẫn áp được. Lượt đổi ấy KHÔNG ghi
 * `ArticleSlugRedirect` — link cũ giờ là trang 404.
 */
const RENAMED: Record<string, string> = {
  "tuyet-ky-di-ke-hanh-tinh-cach-cac-tau-tham-do-bay-ty-cay-so-khong-ton-nhien-lieu":
    "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
};

/**
 * Chỉ cần hai khoá cấp cao nhất, và cả hai là chuỗi một dòng không dấu nháy
 * — nên đọc bằng regex thay vì kéo `js-yaml` (không nằm trong package.json,
 * chỉ có mặt gián tiếp qua gói khác).
 */
function readCheck(text: string): { slug: string; verdict: string } | null {
  const slug = /^slug:\s*(\S+)\s*$/m.exec(text)?.[1];
  const verdict = /^verdict:\s*(\S+)\s*$/m.exec(text)?.[1];
  return slug && verdict ? { slug, verdict } : null;
}

async function main() {
  const write = process.argv.includes("--write");
  console.log("=== GHI VERDICT THẨM ĐỊNH — đợt 17/09 ===");
  console.log(write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  const checks = readdirSync(CHECKS)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => ({ file: f, check: readCheck(readFileSync(join(CHECKS, f), "utf8")) }));

  const counts: Record<string, number> = {};
  for (const { file, check } of checks) {
    if (!check) {
      console.log(`⚠ bỏ qua ${file}: không đọc được slug/verdict`);
      continue;
    }
    const slug = RENAMED[check.slug] ?? check.slug;
    const state = TO_STATE[check.verdict as keyof typeof TO_STATE];
    if (!state) {
      console.log(`⚠ bỏ qua ${check.slug}: verdict "${check.verdict}" không ghi bằng script này`);
      continue;
    }

    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true, factCheck: true },
    });
    if (!article) {
      console.log(`⚠ không thấy ${slug}`);
      continue;
    }
    // Chỉ chạm bài còn PENDING: bài đã có người khác đổi trạng thái trong lúc
    // thẩm định thì quyết định của họ mới hơn file YAML này.
    if (article.factCheck !== "PENDING") {
      console.log(`⚠ bỏ qua ${slug}: đang là ${article.factCheck}, không phải PENDING`);
      continue;
    }

    counts[state] = (counts[state] ?? 0) + 1;
    console.log(`${state.padEnd(6)} ${slug}`);
    if (write) {
      await prisma.article.update({ where: { id: article.id }, data: { factCheck: state } });
    }
  }

  console.log(`\n${JSON.stringify(counts)}`);
  console.log(write ? "Xong." : "Sẵn sàng. Chạy lại với --write để ghi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
