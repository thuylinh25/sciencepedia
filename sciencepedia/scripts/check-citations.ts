import { prisma } from "../src/lib/prisma";

/**
 * Đối chiếu mọi DOI trong bảng `Source` với bản ghi thật ở Crossref/DataCite.
 *
 *   npx tsx scripts/check-citations.ts
 *   npx tsx scripts/check-citations.ts --slug <slug>
 *
 * ## Vì sao phép rà này đáng có
 *
 * Quy tắc 2 của skill `article-generator`: "Never invent a citation. The
 * single worst failure mode — a fabricated or mismatched reference halts the
 * pipeline." Nhưng cho tới lượt này KHÔNG có phép kiểm nào thi hành nó.
 *
 * `check-publish.ts` có `isAlive()` — nó chỉ hỏi URL có trả 200 không. Một
 * DOI sai vẫn trả 200, vì nó dẫn tới một bài báo CÓ THẬT, chỉ là bài khác.
 * Đó là dạng hỏng tệ nhất: link bấm được, trang mở ra, tiêu đề không ai đối
 * chiếu.
 *
 * Lỗi đã bắt được theo đúng cách này: `prisma/seed-data/cosmos-spin.ts` ghi
 * `10.1038/35107009` cho "Long-term evolution of the spin of Venus". DOI ấy
 * resolve thật — tới "Multisite phosphorylation of a CDK inhibitor sets a
 * threshold for the onset of DNA replication", một bài sinh học tế bào. DOI
 * đúng của bài Sao Kim là `10.1038/35081000`.
 *
 * ## Cách so
 *
 * So tiêu đề đã chuẩn hoá, không so chuỗi thô: bản ghi Crossref dùng dấu câu
 * và chữ hoa khác với tiêu đề người nhập, và một bài có phụ đề thì hai bên
 * cắt ở chỗ khác nhau. Nên phép so là "một bên có chứa bên kia sau khi bỏ
 * dấu câu và hạ chữ thường", cộng một phép so tập hợp từ để bắt trường hợp
 * đảo trật tự.
 *
 * Script KHÔNG tự sửa. Một DOI lệch có thể là DOI sai, mà cũng có thể là
 * tiêu đề nhập tắt — hai chuyện khác nhau, và chọn giữa chúng là việc của
 * người đọc cả hai.
 */

/**
 * Những DOI đã đối chiếu bằng mắt và kết luận là ĐÚNG, dù tiêu đề không khớp.
 *
 * Một phép kiểm lúc nào cũng kêu một mục đã biết thì người ta học cách bỏ qua
 * cả phép kiểm. Nên chỗ miễn trừ phải tồn tại — kèm lý do, và khoá bằng DOI
 * cụ thể chứ không bằng slug: đổi sang nguồn khác trên cùng bài thì miễn trừ
 * này KHÔNG che cho nguồn mới.
 */
const ACCEPTED = new Map<string, string>([
  [
    "10.1093/mnras/4.17.152",
    "Bessel công bố thị sai của 61 Cygni bằng một lá THƯ gửi Herschel, và " +
      "MNRAS lưu nó đúng dưới tiêu đề của lá thư. Giới thiên văn từ đó tới nay " +
      "vẫn dẫn công trình này bằng nội dung chứ không bằng tiêu đề hành chính " +
      "ấy. DOI đã resolve: đúng tác giả Bessel, đúng MNRAS, đúng năm 1838.",
  ],
]);

type Csl = {
  title?: string | string[];
  author?: { family?: string; literal?: string }[];
  "container-title"?: string | string[];
  issued?: { "date-parts"?: number[][] };
};

const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** Bỏ dấu câu, gộp khoảng trắng, hạ chữ thường. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’'"“”‘]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function words(s: string): Set<string> {
  // Bỏ từ chức năng: chúng trùng nhau ở mọi tiêu đề nên chỉ làm loãng phép so.
  const stop = new Set([
    "the",
    "of",
    "a",
    "an",
    "and",
    "in",
    "on",
    "for",
    "to",
    "with",
    "at",
    "by",
  ]);
  return new Set(
    normalise(s)
      .split(" ")
      .filter((w) => w.length > 2 && !stop.has(w)),
  );
}

function similar(stored: string, real: string): boolean {
  const a = normalise(stored);
  const b = normalise(real);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return false;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.min(wa.size, wb.size) >= 0.6;
}

async function resolve(doi: string): Promise<Csl | null> {
  try {
    const res = await fetch(`https://doi.org/${doi}`, {
      headers: { Accept: "application/vnd.citationstyles.csl+json" },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Csl;
  } catch {
    return null;
  }
}

/** DOI ghi ở cột `doi`, hoặc nhặt ra từ URL doi.org. */
function doiOf(s: { doi: string | null; url: string | null }): string | null {
  if (s.doi) return s.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
  const m = s.url?.match(/10\.\d{4,}\/[^\s)]+/);
  return m ? m[0].replace(/[.,;]$/, "") : null;
}

async function main() {
  const slugArg = process.argv.indexOf("--slug");
  const slug = slugArg !== -1 ? process.argv[slugArg + 1] : undefined;

  const sources = await prisma.source.findMany({
    where: slug ? { article: { slug } } : {},
    select: {
      title: true,
      url: true,
      doi: true,
      publisher: true,
      year: true,
      article: { select: { slug: true, status: true, factCheck: true } },
    },
    orderBy: { articleId: "asc" },
  });

  const withDoi = sources
    .map((s) => ({ ...s, resolvedDoi: doiOf(s) }))
    .filter(
      (s): s is typeof s & { resolvedDoi: string } => s.resolvedDoi !== null,
    );

  console.log(
    `${sources.length} nguồn, ${withDoi.length} có DOI. Đang đối chiếu…\n`,
  );

  let ok = 0;
  const mismatched: string[] = [];
  const unresolved: string[] = [];

  for (const s of withDoi) {
    const csl = await resolve(s.resolvedDoi);
    if (!csl) {
      unresolved.push(`${s.resolvedDoi}  (${s.article.slug})  "${s.title}"`);
      process.stdout.write("?");
      continue;
    }
    const realTitle = one(csl.title);
    const accepted = ACCEPTED.get(s.resolvedDoi);
    if (similar(s.title, realTitle) || accepted) {
      ok++;
      process.stdout.write(accepted ? "~" : ".");
    } else {
      mismatched.push(
        [
          `${s.article.slug}  [${s.article.status}/${s.article.factCheck}]`,
          `    DOI      ${s.resolvedDoi}`,
          `    ghi là   "${s.title}"`,
          `    thật là  "${realTitle}"`,
          `             ${(csl.author ?? [])
            .slice(0, 3)
            .map((a) => a.family ?? a.literal)
            .join(", ")} · ` +
            `${one(csl["container-title"])} ${csl.issued?.["date-parts"]?.[0]?.[0] ?? ""}`,
        ].join("\n"),
      );
      process.stdout.write("X");
    }
  }

  console.log(
    `\n\nKhớp: ${ok} · Lệch: ${mismatched.length} · Không resolve: ${unresolved.length}`,
  );

  if (mismatched.length) {
    console.log("\n===== DOI KHÔNG KHỚP TIÊU ĐỀ =====\n");
    for (const m of mismatched) console.log(m + "\n");
  }
  if (unresolved.length) {
    console.log("\n===== DOI KHÔNG RESOLVE =====\n");
    for (const u of unresolved) console.log("  " + u);
  }

  process.exitCode = mismatched.length ? 1 : 0;
}

main().finally(() => prisma.$disconnect());
