import { spawnSync } from "node:child_process";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Xuất bản loạt "Tác động cột sống" — NGƯỜI chạy, không phải agent.
 *
 *   npm run spine:publish              # in kế hoạch, không ghi
 *   npm run spine:publish -- --write   # duyệt + thêm link vào + publish
 *
 * Vì sao người chạy: script ghi `reviewedById` (byline duyệt). Agent không tự ký
 * byline — một máy đóng dấu "đã duyệt" lên chính bài nó soạn là mạo danh người
 * duyệt (docs/content-rules.md, "Byline người duyệt"). Căn cứ duyệt: science-editor
 * APPROVE 2/2 vòng (commit 59a2933, 4daabb6), bản chép 2 lượt (25103a3).
 *
 * Các bước, theo thứ tự — thứ tự là chỗ đúng sai:
 *  1. factCheck = PASSED, reviewedById = tài khoản Ban biên tập, reviewedAt.
 *  2. Thêm MỘT dòng vào "Đọc thêm" của bài Huyệt đạo (đã xuất bản), trỏ tới bài
 *     đầu loạt — có Revision chụp bản trước, cùng transaction. Đây là link vào bắt
 *     buộc của gate; thêm sớm hơn thì trên trang thật nó là link 404.
 *  3. Publish lần lượt qua `npm run publish` (gate ở trong đó). Bài đầu có link vào
 *     từ Huyệt đạo; hai bài sau có link vào từ bài đầu ("Cùng loạt").
 *  4. Bài nào bị gate chặn thì dừng; nếu bài ĐẦU bị chặn, gỡ dòng vừa thêm.
 */

const prisma = new PrismaClient();
const ADMIN_ID = "cmti8v05z0000k5ccfg55mget"; // Ban biên tập Sciencepedia

const SERIES = [
  "dau-lung-cap-theo-tac-dong-cot-song",
  "dau-than-kinh-toa-theo-tac-dong-cot-song",
  "dau-nua-dau-theo-tac-dong-cot-song",
];
const HOST = "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai";
const LINE_VI = `- [Đau lưng cấp theo phương pháp Tác động cột sống](/articles/${SERIES[0]})`;
const LINE_EN = `- [Acute back pain in the Spinal Impact method](/articles/${SERIES[0]})`;

/** Chèn dòng vào cuối mục "Đọc thêm"/"Further reading"; trả null nếu không có mục. */
function appendToReading(md: string, heading: RegExp, line: string): string | null {
  if (md.includes(line)) return md;
  const m = heading.exec(md);
  if (!m) return null;
  const start = m.index + m[0].length;
  const next = md.slice(start).search(/\n## /);
  const end = next < 0 ? md.length : start + next;
  return `${md.slice(0, end).replace(/\s+$/, "")}\n${line}\n${md.slice(end)}`.replace(/\n{3,}$/, "\n");
}

async function main() {
  const write = process.argv.includes("--write");
  const now = new Date();
  const host = await prisma.article.findUniqueOrThrow({
    where: { slug: HOST },
    select: { id: true, title: true, content: true, contentEn: true, status: true },
  });
  if (host.status !== "PUBLISHED") throw new Error(`${HOST} không còn PUBLISHED — chọn bài khác làm link vào.`);
  const nextVi = appendToReading(host.content, /^## Đọc thêm[^\n]*$/m, LINE_VI);
  const nextEn = host.contentEn ? appendToReading(host.contentEn, /^## Further reading[^\n]*$/m, LINE_EN) : null;
  if (!nextVi) throw new Error(`${HOST} không có mục "## Đọc thêm".`);

  const drafts = await prisma.article.findMany({ where: { slug: { in: SERIES } }, select: { slug: true, status: true } });
  for (const slug of SERIES) {
    const a = drafts.find((d) => d.slug === slug);
    console.log(`${slug.padEnd(44)} ${a?.status ?? "KHÔNG CÓ"}`);
    if (!a) throw new Error(`thiếu ${slug} — chạy npm run spine:import -- --write trước`);
  }
  console.log(`link vào: ${HOST}\n  + ${LINE_VI}${nextEn ? `\n  + ${LINE_EN}` : ""}`);
  if (!write) {
    console.log("\nChạy khô — thêm --write để duyệt, thêm link vào và xuất bản.");
    return;
  }

  // 1. Dấu duyệt
  await prisma.article.updateMany({
    where: { slug: { in: SERIES }, status: "DRAFT" },
    data: {
      factCheck: "PASSED",
      reviewedById: ADMIN_ID,
      reviewedAt: now,
      lastVerifiedAt: now,
      // 12 tháng: phần kiến thức chung dựa vào trang MedlinePlus/NHS/NINDS — trang sống.
      reverifyDueAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
    },
  });

  // 2. Link vào, có Revision chụp bản trước
  if (nextVi !== host.content || (nextEn && nextEn !== host.contentEn)) {
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: host.id,
          title: host.title,
          content: host.content,
          editorId: ADMIN_ID,
          note: `Trước khi thêm "Đọc thêm" → ${SERIES[0]} (link vào cho loạt Tác động cột sống)`,
        },
      }),
      prisma.article.update({
        where: { id: host.id },
        data: { content: nextVi, ...(nextEn ? { contentEn: nextEn } : {}) },
      }),
    ]);
  }

  // 3. Publish qua gate
  for (const [i, slug] of SERIES.entries()) {
    if (drafts.find((d) => d.slug === slug)?.status === "PUBLISHED") {
      console.log(`· ${slug} đã PUBLISHED — bỏ qua`);
      continue;
    }
    // Gọi thẳng node + tsx, KHÔNG qua shell: qua shell thì --note bị tách theo dấu cách
    // (npm báo "Argument starts with non-ascii dash" ở chữ "—") và Node cảnh báo DEP0190.
    const tsx = path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs");
    const run = spawnSync(process.execPath, [tsx, "--env-file-if-exists=.env", "scripts/publish.ts", "--slug", slug, "--note", "Loạt Tác động cột sống — science-editor 2/2 vòng"], {
      stdio: "inherit",
    });
    if (run.status !== 0) {
      console.error(`\n✖ ${slug} bị gate chặn — dừng.`);
      if (i === 0) {
        await prisma.article.update({ where: { id: host.id }, data: { content: host.content, ...(host.contentEn ? { contentEn: host.contentEn } : {}) } });
        console.error(`  đã gỡ dòng link khỏi ${HOST} (bài đầu chưa xuất bản thì link đó là 404).`);
      }
      process.exitCode = 1;
      return;
    }
  }

  // 4. Làm mới bài chủ (publish.ts chỉ làm mới slug vừa xuất bản)
  await revalidateSite([HOST]);
  console.log("\n✔ Đã xuất bản cả loạt.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
