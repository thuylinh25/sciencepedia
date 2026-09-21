import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { slugify } from "../src/lib/utils";

/**
 * Đồng bộ `prisma/seed-data/glossary.json` sang bảng `GlossaryTerm`.
 *
 *   npm run glossary:seed              # in kế hoạch, KHÔNG ghi gì
 *   npm run glossary:seed -- --write   # tạo mục mới + cập nhật mục chưa ai sửa tay
 *   npm run glossary:seed -- --write --force   # đè cả mục đã sửa tay
 *
 * `/admin/glossary` cũng ghi vào bảng này. Mục nào trong CSDL đã khác file thì
 * nhiều khả năng biên tập viên vừa sửa tay; đè nó bằng bản trong file là xoá
 * lặng lẽ công của người ta — không lỗi, không cảnh báo, chỉ là chữ cũ quay
 * về. Nên lượt ghi thường GIỮ NGUYÊN mục lệch và in ra lệch ở trường nào;
 * muốn file thắng thì phải nói thẳng bằng `--force`.
 *
 * Chỉ mục có `verdict: "PASS"` mới được ghi. File JSON là bản science-editor
 * đã duyệt, kèm nguồn cho từng mục — nguồn ở lại trong file (và git) chứ không
 * vào bảng, vì giao diện chưa hiện nguồn của định nghĩa.
 *
 * Upsert chứ không xoá-rồi-tạo: bỏ một mục khỏi file KHÔNG xoá nó khỏi CSDL.
 * Gỡ định nghĩa đang hiện trên trang là quyết định biên tập, phải làm tay.
 *
 * ## Dấu vết người duyệt
 *
 * `reviewedBy` + `reviewedAt` trong file là dấu vết duyệt, và file là nguồn
 * DUY NHẤT của chúng: `/admin/glossary` không có ô nào ghi được hai cột này.
 * Mục nào không có cặp ấy thì cột trong CSDL KHÔNG bị đụng tới — vắng trong
 * file nghĩa là "chưa ký", không phải "xoá chữ ký đi", cùng tinh thần với
 * chuyện bỏ mục khỏi file không xoá mục khỏi bảng.
 *
 * `reviewedBy` là TÊN VAI (`science-editor`), không phải id tài khoản: ghim
 * một cuid vào file thì nó chỉ đúng trên đúng một cơ sở dữ liệu. Vai được
 * dịch sang tài khoản mang byline ngay dưới đây.
 */
const prisma = new PrismaClient();

/**
 * Vai đã duyệt → tài khoản hiện lên byline.
 *
 * `science-editor` là một vai agent, KHÔNG phải một con người và cũng không
 * phải một hàng `User`. Tạo một hàng `User` tên "science-editor" là dựng ra
 * một người không tồn tại. docs/content-rules.md (mục "Byline người duyệt")
 * đã chốt cách xử lý đúng: quy về tài khoản tổ chức "Ban biên tập
 * Sciencepedia" — nó nói đúng sự thật, rằng có một quy trình duyệt chứ không
 * có một cá nhân bảo chứng. Bài viết đã làm đúng như vậy từ 2026-09-05.
 *
 * Tra theo `role: ADMIN` chứ không ghim cuid, giống
 * scripts/pass-fact-check-2026-09-13.ts. Kho hiện có duy nhất một tài khoản
 * ADMIN, và đó cũng là tài khoản đang đứng byline mọi bài đã duyệt.
 */
const REVIEWER_ROLES = new Set(["science-editor"]);

async function resolveReviewer() {
  const account = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true },
  });
  return account;
}

const entrySchema = z
  .object({
    slug: z.string().min(1),
    term: z.string().min(1),
    termEn: z.string().min(1),
    shortDef: z.string().min(1),
    shortDefEn: z.string().min(1),
    fullDef: z.string().nullable().optional(),
    fullDefEn: z.string().nullable().optional(),
    aliases: z.array(z.string()).default([]),
    category: z.string().nullable().optional(),
    sources: z.array(z.object({ title: z.string(), url: z.string().optional() }).passthrough()),
    verdict: z.enum(["PASS", "REVISE", "REJECT"]),
    /** Vai đã duyệt. Vắng = chưa ai ký, và đó là một trạng thái hợp lệ. */
    reviewedBy: z.string().min(1).optional(),
    /** Ngày duyệt, `YYYY-MM-DD`. Đọc là nửa đêm UTC. */
    reviewedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "reviewedAt phải là YYYY-MM-DD")
      .optional(),
    notes: z.string().optional(),
  })
  // Nửa chữ ký còn tệ hơn không có chữ ký: một cái tên không kèm ngày không
  // nói được nó duyệt bản nào, một cái ngày không kèm tên thì không ai chịu
  // trách nhiệm. Chặn ngay ở đây thay vì để nó thành hàng nửa vời trong bảng.
  .refine((entry) => Boolean(entry.reviewedBy) === Boolean(entry.reviewedAt), {
    message: "reviewedBy và reviewedAt phải đi cùng nhau, hoặc cùng vắng",
    path: ["reviewedBy"],
  });

/**
 * Những trường seed quản VÀ dùng để phát hiện sửa tay. `image`/`imageCredit`
 * không nằm đây: file JSON không có chúng, ảnh chỉ đến từ trang quản trị — so
 * sánh sẽ luôn báo lệch.
 *
 * `reviewedById`/`reviewedAt` CŨNG KHÔNG nằm đây, dù seed có ghi chúng. Hai
 * việc mà mảng này đang gộp làm một thật ra là hai:
 *
 *   (1) trường nào seed ghi xuống;
 *   (2) trường nào mà CSDL khác file thì coi là "biên tập viên vừa sửa tay".
 *
 * Dấu vết duyệt thuộc (1) chứ không thuộc (2), vì `/admin/glossary` không có ô
 * nào ghi được nó — lệch ở đó KHÔNG BAO GIỜ là công sửa tay của ai, chỉ là
 * "chưa đóng dấu". Xếp nhầm nó vào đây thì hỏng đúng cái việc đang làm: cả 42
 * hàng đang có `reviewedById` NULL, nên lượt seed đầu tiên sẽ thấy lệch ở mọi
 * hàng, GIỮ NGUYÊN tất, và không đóng được con dấu nào — trừ khi chạy
 * `--force`, mà `--force` thì lại đè luôn cả những sửa tay thật.
 *
 * Chiều ngược lại vẫn đúng và vẫn cần: mục nào lệch ở phần NỘI DUNG thì bị
 * giữ nguyên, và vì thế cũng KHÔNG được đóng dấu. Đúng như vậy — chữ trong
 * CSDL lúc ấy không còn là chữ mà science-editor đã đọc, nên nó không có
 * quyền mang dấu duyệt của lượt đọc đó.
 */
const MANAGED = [
  "term",
  "termEn",
  "shortDef",
  "shortDefEn",
  "fullDef",
  "fullDefEn",
  "aliases",
  "category",
] as const;

type Managed = { [K in (typeof MANAGED)[number]]: string | string[] | null };

/** Tên những trường CSDL khác file. Rỗng nghĩa là chưa ai đụng vào. */
function drift(current: Managed, next: Managed): string[] {
  return MANAGED.filter((field) => {
    const a = current[field];
    const b = next[field];
    if (Array.isArray(a) || Array.isArray(b)) {
      const left = Array.isArray(a) ? a : [];
      const right = Array.isArray(b) ? b : [];
      return left.length !== right.length || left.some((value, i) => value !== right[i]);
    }
    return a !== b;
  });
}

async function main() {
  const flags = process.argv.slice(2);
  const write = flags.includes("--write");
  const force = flags.includes("--force");
  const file = path.join(__dirname, "..", "prisma", "seed-data", "glossary.json");
  const entries = z.array(entrySchema).parse(JSON.parse(readFileSync(file, "utf8")));

  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const signed = entries.filter((entry) => entry.reviewedBy).length;
  const reviewer = signed > 0 ? await resolveReviewer() : null;
  if (signed > 0) {
    if (reviewer) {
      console.log(`Byline: ${reviewer.name} (${reviewer.id}) — ${signed} mục có dấu duyệt\n`);
    } else if (write) {
      // Ghi nội dung mà bỏ rơi con dấu là đúng cái trạng thái đang phải sửa.
      throw new Error(
        "Không tìm thấy tài khoản ADMIN để làm byline, trong khi file có mục đã duyệt.",
      );
    } else {
      console.log("Chưa tra được tài khoản ADMIN — dấu duyệt sẽ không đóng được.\n");
    }
  }

  let ready = 0;
  let kept = 0;
  let stamped = 0;
  for (const entry of entries) {
    const problems: string[] = [];
    if (entry.verdict !== "PASS") problems.push(`verdict ${entry.verdict}`);
    // Khoá sinh từ `[[...]]` là slugify(term) — slug lệch thì thuật ngữ không bao giờ khớp
    if (slugify(entry.term) !== entry.slug) problems.push(`slug phải là "${slugify(entry.term)}"`);
    const badAlias = entry.aliases.filter((alias) => slugify(alias) !== alias);
    if (badAlias.length) problems.push(`alias không ở dạng slug: ${badAlias.join(", ")}`);
    if (entry.sources.length < 2) problems.push("ít hơn 2 nguồn");
    // Một vai lạ ở đây gần như chắc chắn là gõ nhầm. Bỏ qua lặng lẽ thì mục đó
    // mất dấu duyệt mà không ai biết, nên chặn thành lỗi thấy được.
    if (entry.reviewedBy && !REVIEWER_ROLES.has(entry.reviewedBy)) {
      problems.push(`reviewedBy không phải vai đã biết: "${entry.reviewedBy}"`);
    }

    if (problems.length) {
      console.log(`  BỎ QUA ${entry.slug}: ${problems.join("; ")}`);
      continue;
    }

    const data = {
      term: entry.term,
      termEn: entry.termEn,
      shortDef: entry.shortDef,
      shortDefEn: entry.shortDefEn,
      fullDef: entry.fullDef ?? null,
      fullDefEn: entry.fullDefEn ?? null,
      aliases: entry.aliases,
      category: entry.category ?? null,
    };
    // Tách khỏi `data`: đây là những trường seed GHI nhưng KHÔNG so lệch — xem
    // ghi chú ở `MANAGED`. Mục chưa ký thì object này rỗng, và cột trong CSDL
    // giữ nguyên chứ không bị ghi null đè lên.
    const review: { reviewedById?: string; reviewedAt?: Date } =
      entry.reviewedBy && entry.reviewedAt && reviewer
        ? { reviewedById: reviewer.id, reviewedAt: new Date(`${entry.reviewedAt}T00:00:00Z`) }
        : {};
    const current = await prisma.glossaryTerm.findUnique({
      where: { slug: entry.slug },
      select: {
        term: true,
        termEn: true,
        shortDef: true,
        shortDefEn: true,
        fullDef: true,
        fullDefEn: true,
        aliases: true,
        category: true,
        reviewedById: true,
      },
    });
    const changed = current ? drift(current, data) : [];

    if (current && changed.length > 0 && !force) {
      kept += 1;
      console.log(
        `  GIỮ NGUYÊN ${entry.slug}: CSDL khác file ở ${changed.join(", ")}` +
          " — có thể vừa sửa trên /admin/glossary. Thêm --force nếu muốn file thắng." +
          (review.reviewedById && !current.reviewedById
            ? " Dấu duyệt cũng KHÔNG đóng: chữ trong CSDL không còn là chữ đã duyệt."
            : ""),
      );
      continue;
    }

    ready += 1;
    const label = !current
      ? "TẠO MỚI "
      : changed.length === 0
        ? "KHÔNG ĐỔI"
        : `ĐÈ (${changed.join(", ")})`;
    // Chỉ đếm và khoe con dấu khi nó thật sự MỚI. In "+ dấu duyệt" ở mọi lượt
    // chạy lại thì con số ấy không còn nói lên điều gì.
    const newStamp = Boolean(review.reviewedById) && !current?.reviewedById;
    if (newStamp) stamped += 1;
    console.log(
      `  ${label} ${entry.slug}  (${entry.aliases.length} alias, ${entry.sources.length} nguồn)` +
        (newStamp ? `  + dấu duyệt ${entry.reviewedBy} ${entry.reviewedAt}` : "") +
        (!entry.reviewedBy ? "  [chưa ký]" : ""),
    );

    if (write) {
      await prisma.glossaryTerm.upsert({
        where: { slug: entry.slug },
        create: { slug: entry.slug, ...data, ...review },
        update: { ...data, ...review },
      });
    }
  }

  console.log(
    write
      ? `\nĐã ghi ${ready}/${entries.length} mục.`
      : `\n${ready}/${entries.length} mục sẵn sàng. Chưa ghi gì.`,
  );
  console.log(
    `Dấu duyệt: ${stamped} mục được đóng lượt này, ` +
      `${entries.length - signed} mục không có dấu vết duyệt trong file nên để trống.`,
  );
  if (kept > 0) {
    console.log(
      `${kept} mục giữ nguyên vì CSDL đã lệch khỏi file. Sửa file cho khớp bản` +
        " trên trang quản trị, hoặc chạy lại với --force nếu file mới là bản đúng.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
