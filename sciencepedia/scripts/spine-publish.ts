import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
 * duyệt (docs/content-rules.md, "Byline người duyệt"). Căn cứ duyệt:
 *  - ba bài đầu: science-editor APPROVE 2/2 vòng (59a2933, 4daabb6), bản chép 2 lượt (25103a3);
 *  - mười một bài sau: science-editor PASS 2 vòng (#19, #23) và duyệt lại sau khi gỡ
 *    nguồn MedlinePlus /ency/ (#25); bản chép được chủ sản phẩm MIỄN đối chiếu (D-42).
 *
 * Các bước, theo thứ tự — thứ tự là chỗ đúng sai:
 *  1. factCheck = PASSED, reviewedById = tài khoản Ban biên tập, reviewedAt.
 *  2. Link vào. Gate chỉ đếm link từ bài ĐÃ xuất bản:
 *     - bài đầu loạt có link từ bài Huyệt đạo (mục "Đọc thêm");
 *     - bài chưa xuất bản ĐẦU TIÊN trong SERIES được nối bằng một dòng thêm vào
 *       "Cùng loạt" của bài đầu loạt. Các bài sau có link vào từ "Cùng loạt" của
 *       chính bài vừa xuất bản trước nó — bản nháp liệt kê đủ cả loạt.
 *     Mỗi dòng thêm có Revision chụp bản trước. Thêm sớm hơn thì trên trang thật nó là 404.
 *  3. Publish lần lượt qua `npm run publish` (gate ở trong đó).
 *  4. Bài nào bị gate chặn thì dừng; nếu đó là bài vừa được nối ở bước 2, gỡ dòng nối.
 *  5. Cả loạt đã lên: bài nào xuất bản từ lượt trước mà "Cùng loạt" còn thiếu thì thay
 *     bằng bản nháp mới — chỉ khi chỗ khác nhau toàn là dòng link "Cùng loạt"
 *     (lúc này mọi link đều tới, không còn 404). Khác chỗ nào khác là đính chính: bỏ qua, báo.
 */

const prisma = new PrismaClient();
const ADMIN_ID = "cmti8v05z0000k5ccfg55mget"; // Ban biên tập Sciencepedia
const DRAFTS = path.join(process.cwd(), "../docs/content/drafts");

/* Thứ tự xuất bản. Ba bài đầu đã PUBLISHED (2026-10-05); Đau lưng mãn tính đi ngay sau
   Đau lưng cấp vì nó là bài được nối từ bài đầu loạt — người đọc đau lưng đi tiếp tự nhiên nhất. */
const SERIES = [
  "dau-lung-cap-theo-tac-dong-cot-song",
  "dau-than-kinh-toa-theo-tac-dong-cot-song",
  "dau-nua-dau-theo-tac-dong-cot-song",
  "dau-lung-man-tinh-theo-tac-dong-cot-song",
  "huyet-ap-thap-theo-tac-dong-cot-song",
  "thieu-nang-tuan-hoan-nao-theo-tac-dong-cot-song",
  "huyet-ap-cao-theo-tac-dong-cot-song",
  "dau-dau-theo-tac-dong-cot-song",
  "hen-suyen-ho-hap-theo-tac-dong-cot-song",
  "sot-theo-tac-dong-cot-song",
  "nhieu-mo-hoi-so-gio-theo-tac-dong-cot-song",
  "benh-do-mo-hoi-theo-tac-dong-cot-song",
  "mat-ngu-theo-tac-dong-cot-song",
  "viem-dai-trang-man-tinh-theo-tac-dong-cot-song",
];
const HOST = "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai";
const LINE_VI = `- [Đau lưng cấp theo phương pháp Tác động cột sống](/articles/${SERIES[0]})`;
const LINE_EN = `- [Acute back pain in the Spinal Impact method](/articles/${SERIES[0]})`;
const SERIES_VI = /^\*\*Cùng loạt Tác động cột sống:\*\*\r?$/m;
const SERIES_EN = /^\*\*More from the Spinal Impact series:\*\*\r?$/m;
const SERIES_LINK = /^- \[[^\]]+\]\(\/articles\/[a-z0-9-]+-theo-tac-dong-cot-song\)$/;

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

/** Chèn dòng vào cuối danh sách ngay dưới nhãn "Cùng loạt"; giữ kiểu xuống dòng của bài. */
function appendToSeries(md: string, label: RegExp, line: string): string | null {
  if (md.includes(line)) return md;
  const m = label.exec(md);
  if (!m) return null;
  const eol = md.includes("\r\n") ? "\r\n" : "\n";
  const lines = md.split(/\r?\n/);
  let i = md.slice(0, m.index).split(/\r?\n/).length; // dòng ngay sau nhãn
  while (i < lines.length && lines[i].trim() === "") i += 1;
  while (i < lines.length && lines[i].startsWith("- ")) i += 1;
  lines.splice(i, 0, line);
  return lines.join(eol);
}

/** Chỉ thêm dòng link "Cùng loạt", không bớt, không sửa dòng nào khác. */
function onlySeriesLinksAdded(before: string, after: string): boolean {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  const rest = [...b];
  for (const line of a) {
    const at = rest.indexOf(line);
    if (at < 0) return false;
    rest.splice(at, 1);
  }
  return rest.every((l) => l.trim() === "" || SERIES_LINK.test(l));
}

const draftOf = (slug: string, en = false) => readFileSync(path.join(DRAFTS, `${slug}${en ? ".en" : ""}.md`), "utf8").trim();

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

  const rows = await prisma.article.findMany({
    where: { slug: { in: SERIES } },
    select: { id: true, slug: true, status: true, title: true, titleEn: true, content: true, contentEn: true },
  });
  for (const slug of SERIES) {
    const a = rows.find((d) => d.slug === slug);
    console.log(`${slug.padEnd(48)} ${a?.status ?? "KHÔNG CÓ"}`);
    if (!a) throw new Error(`thiếu ${slug} — chạy npm run spine:import -- --write --drafts-only trước`);
  }
  const wasPublished = new Set(rows.filter((r) => r.status === "PUBLISHED").map((r) => r.slug));
  const head = rows.find((r) => r.slug === SERIES[0])!;
  const firstNew = rows.find((r) => r.slug === SERIES.find((s) => !wasPublished.has(s)));

  // Dòng nối bài đầu loạt → bài chưa xuất bản đầu tiên (chỉ khi bài đầu loạt đã lên).
  let bridge: { vi: string; en: string | null } | null = null;
  if (firstNew && wasPublished.has(head.slug)) {
    const vi = appendToSeries(head.content, SERIES_VI, `- [${firstNew.title}](/articles/${firstNew.slug})`);
    const en =
      head.contentEn && firstNew.titleEn
        ? appendToSeries(head.contentEn, SERIES_EN, `- [${firstNew.titleEn}](/articles/${firstNew.slug})`)
        : null;
    if (!vi) throw new Error(`${head.slug} không có nhãn "Cùng loạt Tác động cột sống:".`);
    bridge = { vi, en };
  }

  console.log(`link vào: ${HOST}\n  + ${LINE_VI}${nextEn ? `\n  + ${LINE_EN}` : ""}`);
  if (bridge && firstNew) console.log(`nối: ${head.slug} → ${firstNew.slug} (dòng thêm vào "Cùng loạt")`);
  for (const slug of wasPublished) {
    const r = rows.find((x) => x.slug === slug)!;
    const ok = onlySeriesLinksAdded(r.content, draftOf(slug)) && onlySeriesLinksAdded(r.contentEn ?? "", draftOf(slug, true));
    console.log(`cuối lượt: ${slug} — ${ok ? "làm mới \"Cùng loạt\" được" : "KHÔNG làm mới được (khác ngoài Cùng loạt)"}`);
  }
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
      // 12 tháng: phần kiến thức chung dựa vào trang NHS/NHLBI/NINDS/MedlinePlus — trang sống.
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
  if (bridge && firstNew && (bridge.vi !== head.content || (bridge.en && bridge.en !== head.contentEn))) {
    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: head.id,
          title: head.title,
          content: head.content,
          editorId: ADMIN_ID,
          note: `Trước khi thêm "Cùng loạt" → ${firstNew.slug} (link vào cho bài kế tiếp của loạt)`,
        },
      }),
      prisma.article.update({
        where: { id: head.id },
        data: { content: bridge.vi, ...(bridge.en ? { contentEn: bridge.en } : {}) },
      }),
    ]);
  }

  // 3. Publish qua gate
  for (const [i, slug] of SERIES.entries()) {
    if (wasPublished.has(slug)) {
      console.log(`· ${slug} đã PUBLISHED — bỏ qua`);
      continue;
    }
    // Gọi thẳng node + tsx, KHÔNG qua shell: qua shell thì --note bị tách theo dấu cách
    // (npm báo "Argument starts with non-ascii dash" ở chữ "—") và Node cảnh báo DEP0190.
    const tsx = path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs");
    const run = spawnSync(process.execPath, [tsx, "--env-file-if-exists=.env", "scripts/publish.ts", "--slug", slug, "--note", "Loạt Tác động cột sống — science-editor PASS"], {
      stdio: "inherit",
    });
    if (run.status !== 0) {
      console.error(`\n✖ ${slug} bị gate chặn — dừng.`);
      if (i === 0) {
        await prisma.article.update({ where: { id: host.id }, data: { content: host.content, ...(host.contentEn ? { contentEn: host.contentEn } : {}) } });
        console.error(`  đã gỡ dòng link khỏi ${HOST} (bài đầu chưa xuất bản thì link đó là 404).`);
      }
      if (bridge && slug === firstNew?.slug) {
        await prisma.article.update({ where: { id: head.id }, data: { content: head.content, ...(head.contentEn ? { contentEn: head.contentEn } : {}) } });
        console.error(`  đã gỡ dòng nối khỏi ${head.slug} (bài chưa xuất bản thì link đó là 404).`);
      }
      process.exitCode = 1;
      return;
    }
  }

  // 5. "Cùng loạt" đủ cho các bài xuất bản từ lượt trước
  const refreshed: string[] = [];
  for (const slug of wasPublished) {
    const cur = await prisma.article.findUniqueOrThrow({ where: { slug }, select: { id: true, title: true, content: true, contentEn: true } });
    const vi = draftOf(slug);
    const en = draftOf(slug, true);
    if (cur.content.trim() === vi && (cur.contentEn ?? "").trim() === en) continue;
    if (!onlySeriesLinksAdded(cur.content, vi) || !onlySeriesLinksAdded(cur.contentEn ?? "", en)) {
      console.warn(`! ${slug}: bản nháp khác bài đang đăng ở chỗ khác ngoài "Cùng loạt" — không thay (đính chính đi đường khác).`);
      continue;
    }
    await prisma.$transaction([
      prisma.revision.create({
        data: { articleId: cur.id, title: cur.title, content: cur.content, editorId: ADMIN_ID, note: `Trước khi làm mới "Cùng loạt" (cả loạt đã xuất bản)` },
      }),
      prisma.article.update({ where: { id: cur.id }, data: { content: vi, contentEn: en } }),
    ]);
    refreshed.push(slug);
    console.log(`✔ ${slug} — "Cùng loạt" làm mới`);
  }

  // 6. Làm mới bài chủ và bài đổi "Cùng loạt" (publish.ts chỉ làm mới slug vừa xuất bản)
  await revalidateSite([HOST, ...refreshed]);
  console.log("\n✔ Đã xuất bản cả loạt.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
