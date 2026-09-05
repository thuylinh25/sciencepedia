import { PrismaClient } from "@prisma/client";

/**
 * Kiểm tra điều kiện xuất bản — CHỈ ĐỌC.
 *
 *   npm run publish:check                 # rà toàn bộ bài đã PUBLISHED
 *   npm run publish:check -- --slug <s>   # một bài
 *   npm run publish:check -- --draft      # rà cả DRAFT/REVIEW
 *   npm run publish:check -- --json       # máy đọc (dùng cho hook của pipeline)
 *   npm run publish:check -- --links      # kiểm cả URL nguồn có còn sống (chậm)
 *
 * ## Vì sao script này tồn tại
 *
 * Ba gate trong CLAUDE.md hiện là quy ước giữa người với người: agent được dặn
 * phải kiểm, và nếu nó quên thì không có gì phát hiện ra. Dặn dò là lời khuyên,
 * không phải rào chắn — nó hỏng đúng vào ngày không ai ngồi xem.
 *
 * Script này biến những gì kiểm được bằng máy thành bất biến nhị phân, và là
 * chỗ duy nhất định nghĩa chúng. Runner tự động gọi nó qua `--json` trước khi
 * cho phép đổi state sang PUBLISHED; người thì chạy trực tiếp để rà kho.
 *
 * ## Vì sao CHỈ ĐỌC, tuyệt đối
 *
 * Giống `check-graph.ts`: không một lệnh create/update/delete/executeRaw nào.
 * Một cái gate tự sửa dữ liệu để làm chính mình xanh là gate vô dụng. Tính
 * chất chỉ-đọc cũng là điều kiện để nó được phép chạy không cần hỏi trong
 * môi trường tự động.
 *
 * ## Hai mức, không phải một
 *
 * CHẶN — vi phạm một phán quyết đã chốt. Không publish, không ngoại lệ.
 * CẢNH — đáng sửa nhưng có trường hợp hợp lệ, nên không chặn. Ví dụ: ảnh
 *        thuộc phạm vi công cộng không bắt buộc ghi công
 *        (xem docs/content-rules.md, mục "Ghi công ảnh").
 *
 * Trộn hai mức làm một thì hoặc gate quá chặt (chặn bài hợp lệ, người ta sẽ
 * học cách bỏ qua nó), hoặc quá lỏng (không chặn được gì). Cả hai đều kết
 * thúc bằng việc gate bị vô hiệu hoá.
 */
const prisma = new PrismaClient();

/** Ngưỡng lấy từ docs/content-rules.md — sửa ở đó trước, rồi sửa ở đây. */
const MIN_CHARS = 3_000;
const MAX_CHARS = 5_000;
const MIN_INTERNAL_LINKS = 3;
/** Bậc nguồn 1–2 (bình duyệt / cơ quan thẩm quyền) — xem chú thích Source.tier */
const MIN_STRONG_SOURCES = 3;
const STRONG_TIER = 2;
/** Người Việt đọc chừng 200 từ mỗi phút — cùng hằng số với src/lib/rewrite.ts */
const WORDS_PER_MINUTE = 200;

type Finding = { level: "CHẶN" | "CẢNH"; message: string };

/**
 * Bắt link nội bộ trỏ tới một bài khác.
 *
 * Chấp nhận cả `/articles/<slug>` lẫn `/vi/articles/<slug>`: next-intl sinh cả
 * hai dạng tuỳ chỗ viết, và một cái gate từ chối bài chỉ vì tác giả viết kèm
 * tiền tố locale là gate sai chứ không phải bài sai.
 *
 * Chỉ tính link trong cú pháp Markdown `](...)`. URL trần trong văn bản không
 * phải link nội bộ có chủ đích — nó thường nằm trong khối dẫn nguồn.
 */
const INTERNAL_LINK = /\]\(\/(?:[a-z]{2}\/)?articles\/([a-z0-9-]+)\)/gi;

/**
 * Ghi công ảnh chép tay vào thân bài.
 *
 * docs/content-rules.md cấm dứt khoát: ghi công lấy từ `coverImageCredit`, vì
 * `npm run images:credit` cập nhật trường đó khi ảnh đổi, còn dòng chép tay thì
 * ở lại và trở thành ghi công của tấm ảnh cũ. Ghi công sai người tệ hơn không
 * ghi, nên đây là mức CHẶN chứ không phải CẢNH.
 */
const INLINE_CREDIT = /^\s*(?:\*\*|_)?\s*(?:Ảnh bìa|Ảnh|Nguồn ảnh|Image credit)\s*:/im;

/**
 * Bỏ khối dẫn nguồn ở cuối bài trước khi đo.
 *
 * Chốt 2026-09-05. Trần 3.000–5.000 ký tự là ngân sách cho VĂN XUÔI, mà
 * `content` thì gồm cả khối dẫn nguồn dán ở cuối — và docs/content-rules.md
 * cấm cắt khối đó khi rút gọn. Đo cả hai bằng một con số là bắt tác giả trả
 * giá cho phần họ không được phép động vào: bài càng dẫn nhiều nguồn càng bị
 * phạt, đúng ngược điều ta muốn khuyến khích.
 *
 * Phát hiện ra vì cả sáu bài tốt nhất trong kho cùng vượt trần 1–3%
 * (5.035–5.133 ký tự) theo cùng một kiểu. Sáu bài cùng lệch một hướng là dấu
 * hiệu của phép đo sai, không phải của sáu tác giả cùng viết dài.
 *
 * Kho có HAI dạng khối dẫn nguồn, và luật phải nhận cả hai:
 *
 *   feed-sync:  ---\n\nNguồn: **[tiêu đề](url)** — nhà xuất bản.
 *   bài VACA:   ---\n\nBài này viết lại từ **[tiêu đề](url)** của … Bản quyền…
 *
 * Nên không tìm chữ "Nguồn:" mà tìm bất kỳ dấu hiệu xuất xứ nào. Ba điều kiện
 * cùng lúc, để không nuốt nhầm mục cuối của bài dùng `---` để phân đoạn:
 * đuôi phải bắt đầu bằng đường kẻ ngang, ngắn (≤1.000 ký tự), và mang một từ
 * khoá xuất xứ.
 */
const PROVENANCE = /\b(?:Nguồn|Source|Bản quyền|Trang chủ|viết lại từ)\b/i;

export function prose(markdown: string): string {
  const cut = markdown.lastIndexOf("\n---");
  if (cut === -1) return markdown;
  const tail = markdown.slice(cut);
  if (!/^\n-{3,}[ \t]*\n/.test(tail)) return markdown;
  if (tail.length > 1_000) return markdown;
  return PROVENANCE.test(tail) ? markdown.slice(0, cut).trimEnd() : markdown;
}

function countWords(markdown: string): number {
  return markdown.trim().split(/\s+/).length;
}

/** Đọc cờ dạng `--slug ten-bai` hoặc `--slug=ten-bai`. */
function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

/**
 * Một URL còn sống không.
 *
 * HEAD trước vì rẻ; khá nhiều máy chủ trả 405 cho HEAD nên phải lùi về GET.
 * Không phân biệt được "link chết" với "máy chủ chặn bot", nên kết quả này chỉ
 * ở mức CẢNH — chặn bài vì một tường lửa ở đầu kia là chặn nhầm.
 */
async function isAlive(url: string): Promise<boolean> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      if (response.status !== 405 && response.status !== 501) return false;
    } catch {
      return false;
    }
  }
  return false;
}

type ArticleRow = Awaited<ReturnType<typeof loadArticles>>[number];

async function loadArticles(where: object) {
  return prisma.article.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      content: true,
      readingTime: true,
      coverImage: true,
      coverImageCredit: true,
      factCheck: true,
      reviewedById: true,
      reviewedAt: true,
      entityId: true,
      categoryId: true,
      sources: {
        select: { url: true, tier: true, retractedAt: true, title: true },
      },
    },
    orderBy: { slug: "asc" },
  });
}

/**
 * Ai trỏ vào bài này.
 *
 * Chỉ tính bài ĐÃ PUBLISHED: một link từ bản nháp chưa cứu được bài khỏi cảnh
 * mồ côi, vì người đọc và bộ máy tìm kiếm không thấy bản nháp.
 */
function inboundOf(
  slug: string,
  corpus: { slug: string; content: string }[],
): string[] {
  const sources: string[] = [];
  for (const other of corpus) {
    if (other.slug === slug) continue;
    for (const match of other.content.matchAll(INTERNAL_LINK)) {
      if (match[1] === slug) {
        sources.push(other.slug);
        break;
      }
    }
  }
  return sources;
}

async function audit(
  article: ArticleRow,
  publishedSlugs: Set<string>,
  corpus: { slug: string; content: string }[],
  checkLinks: boolean,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const block = (message: string) => findings.push({ level: "CHẶN", message });
  const warn = (message: string) => findings.push({ level: "CẢNH", message });

  // --- Gate accuracy (science-editor) — CLAUDE.md: "không có ngoại lệ" ---
  if (article.factCheck !== "PASSED") {
    block(`factCheck = ${article.factCheck}, cần PASSED`);
  }
  if (!article.reviewedById || !article.reviewedAt) {
    block("chưa có biên tập viên duyệt (reviewedById/reviewedAt rỗng)");
  }

  const strong = article.sources.filter(
    (s) => s.tier <= STRONG_TIER && !s.retractedAt,
  );
  if (strong.length < MIN_STRONG_SOURCES) {
    block(
      `${strong.length}/${MIN_STRONG_SOURCES} nguồn bậc 1–2 còn hiệu lực ` +
        `(tổng ${article.sources.length} nguồn)`,
    );
  }
  const retracted = article.sources.filter((s) => s.retractedAt);
  for (const source of retracted) {
    block(`nguồn đã bị rút vẫn còn trong bài: ${source.title}`);
  }

  // --- Gate SEO (seo-expert) ---
  // Link nội bộ phải trỏ tới bài ĐÃ PUBLISHED. Trỏ vào bản nháp thì người đọc
  // gặp 404 — với người dùng thì "link hỏng", không phải "link chưa tới lượt".
  const linked = new Set<string>();
  for (const match of article.content.matchAll(INTERNAL_LINK)) {
    if (match[1] !== article.slug) linked.add(match[1]);
  }
  const resolved = [...linked].filter((slug) => publishedSlugs.has(slug));
  const dangling = [...linked].filter((slug) => !publishedSlugs.has(slug));

  if (resolved.length < MIN_INTERNAL_LINKS) {
    block(
      `${resolved.length}/${MIN_INTERNAL_LINKS} link nội bộ resolve được` +
        (dangling.length > 0 ? ` (${dangling.length} link chết)` : ""),
    );
  }
  for (const slug of dangling) {
    warn(`link nội bộ không tới đâu: /articles/${slug}`);
  }

  /* Chiều VÀO, không chỉ chiều ra.
     `.claude/skills/seo-optimizer/SKILL.md`: "≥3 contextual out, ≥1 in".

     Vì sao đếm cả hai chiều: một kho mà mọi bài đều đủ 3 link ra nhưng không
     bài nào được trỏ vào vẫn là tập điểm rời rạc — đúng tình trạng của 41 bài
     đầu tiên, tất cả đều 0 link. Bài mới trỏ ra 5 chỗ vẫn không ai tới được
     nó ngoài trang danh sách, và trong knowledge graph nó là một nút treo.

     Trách nhiệm này thuộc về LƯỢT xuất bản, không thuộc về bài: publish bài N
     thì phải thêm một link từ một bài đã có. Nên đây là CHẶN, không phải CẢNH
     — `content-curator` rule 5 nói thẳng "no orphan publishes".

     Miễn trừ duy nhất: kho chưa có bài nào khác để trỏ vào. Không có nó thì
     bài đầu tiên của một kho trống vĩnh viễn không publish được. */
  const otherPublished = [...publishedSlugs].filter((s) => s !== article.slug);
  if (otherPublished.length > 0) {
    const inbound = inboundOf(article.slug, corpus);
    if (inbound.length === 0) {
      block(
        "không bài nào trỏ vào (0 link vào) — thêm link từ một bài đã publish " +
          "trước khi xuất bản bài này",
      );
    }
  }

  if (!article.entityId) {
    /* CHẶN, chốt lại 2026-09-05 sau khi cân nhắc hạ xuống CẢNH.

       Nói cho đúng thực trạng, vì con số này chặn 41/41 bài cũ:

       - ĐANG chạy thật: JSON-LD mất node `about` và mất `sameAs` trỏ Wikidata
         (`src/lib/seo.ts`), nên bài không nối được vào một định danh chung.
       - ĐANG chạy nhưng có fallback: "Bài liên quan" tụt từ quan hệ do biên
         tập khẳng định xuống "cùng danh mục" (`getRelatedForArticle`). Kém
         hơn, không phải mất.
       - CHƯA có giao diện: `getPrerequisites` đã viết xong nhưng không
         component nào gọi; chưa có route learning path nào.

       Nên một nửa giá trị vẫn là tiềm năng, và chặn cả kho vì nó là nặng tay.
       Vẫn giữ CHẶN vì hạ xuống CẢNH có một hệ quả không lùi được: bài mới sẽ
       publish mà không vào graph, và mỗi bài như vậy là một khoản nợ phải đi
       gắn lại sau — lúc đó phải đọc lại bài để biết nó nói về khái niệm nào,
       đắt hơn nhiều so với gắn ngay lúc viết.

       Đây là chỗ ranh giới nằm giữa "nợ đo được" và "nợ phải đào lại". */
    block("chưa gắn entity (entityId rỗng) — bài nằm ngoài knowledge graph");
  }

  // --- Quy tắc nội dung (docs/content-rules.md) ---
  // Đo văn xuôi, không đo khối dẫn nguồn — xem chú thích của `prose()`.
  const body = prose(article.content);
  const length = body.length;
  if (length < MIN_CHARS || length > MAX_CHARS) {
    block(
      `độ dài ${length.toLocaleString("vi-VN")} ký tự văn xuôi, ngoài khoảng ` +
        `${MIN_CHARS.toLocaleString("vi-VN")}–${MAX_CHARS.toLocaleString("vi-VN")}`,
    );
  }

  // readingTime phải khớp nội dung thật, không đặt tay. Cho lệch 1 phút vì
  // cách đếm từ khác nhau ở chỗ dấu câu và Markdown, không vì cho phép áng chừng.
  // Đếm trên văn xuôi vì người đọc không "đọc" danh sách nguồn.
  const expected = Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE));
  if (Math.abs(article.readingTime - expected) > 1) {
    block(`readingTime = ${article.readingTime} nhưng nội dung đọc ~${expected} phút`);
  }

  if (INLINE_CREDIT.test(article.content)) {
    block("ghi công ảnh chép tay trong thân bài — phải nằm ở coverImageCredit");
  }

  // --- Ảnh ---
  if (!article.coverImage) {
    block("chưa có ảnh bìa");
  } else if (!article.coverImageCredit) {
    // CẢNH chứ không CHẶN: ảnh phạm vi công cộng không bắt buộc ghi công.
    warn("ảnh bìa chưa ghi công — chạy `npm run images:credit -- --write`");
  }

  // --- Nguồn còn sống (tuỳ chọn, có mạng) ---
  if (checkLinks) {
    const withUrl = article.sources.filter((s) => s.url);
    const alive = await Promise.all(withUrl.map((s) => isAlive(s.url!)));
    withUrl.forEach((source, i) => {
      if (!alive[i]) warn(`nguồn không truy cập được: ${source.url}`);
    });
  }

  return findings;
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const checkLinks = argv.includes("--links");
  const includeDrafts = argv.includes("--draft");
  const slug = flagValue(argv, "slug");
  const id = flagValue(argv, "id");

  // Tập slug đã publish — dùng để biết một link nội bộ có tới đâu không.
  // Luôn lấy toàn bộ, kể cả khi chỉ kiểm một bài.
  // Toàn văn mọi bài đã publish — cần cho cả hai chiều link. Tải một lần rồi
  // dùng lại: kiểm một bài vẫn phải biết cả kho ai trỏ vào nó.
  // Kho vài nghìn bài thì đổi sang truy vấn ngược bằng SQL; ở quy mô hiện tại
  // một lượt đọc rẻ hơn nhiều lần truy vấn.
  const corpus = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, content: true },
  });
  const publishedSlugs = new Set(corpus.map((a) => a.slug));

  const where = id
    ? { id }
    : slug
      ? { slug }
      : includeDrafts
        ? { status: { in: ["PUBLISHED", "REVIEW", "DRAFT"] as const } }
        : { status: "PUBLISHED" as const };

  const articles = await loadArticles(where);

  if (articles.length === 0) {
    const target = id ?? slug ?? "(không có bài nào khớp)";
    if (asJson) {
      console.log(JSON.stringify({ ok: false, error: `Không tìm thấy bài: ${target}` }));
    } else {
      console.log(`Không tìm thấy bài: ${target}`);
    }
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const article of articles) {
    const findings = await audit(article, publishedSlugs, corpus, checkLinks);
    results.push({ article, findings });
  }

  const failed = results.filter((r) =>
    r.findings.some((f) => f.level === "CHẶN"),
  );

  if (asJson) {
    // Hình dạng này là hợp đồng với hook trong scripts/pipeline.ts. Đổi nó thì
    // phải đổi cả bên kia.
    console.log(
      JSON.stringify(
        {
          ok: failed.length === 0,
          checked: results.length,
          articles: results.map(({ article, findings }) => ({
            slug: article.slug,
            status: article.status,
            ok: !findings.some((f) => f.level === "CHẶN"),
            blocks: findings.filter((f) => f.level === "CHẶN").map((f) => f.message),
            warns: findings.filter((f) => f.level === "CẢNH").map((f) => f.message),
          })),
        },
        null,
        2,
      ),
    );
    process.exitCode = failed.length === 0 ? 0 : 1;
    return;
  }

  console.log("=== KIỂM TRA ĐIỀU KIỆN XUẤT BẢN ===");
  console.log(`Đang kiểm ${results.length} bài\n`);

  for (const { article, findings } of results) {
    if (findings.length === 0) {
      console.log(`✓ ${article.slug}`);
      continue;
    }
    const blocked = findings.some((f) => f.level === "CHẶN");
    console.log(`${blocked ? "✗" : "!"} ${article.slug}  [${article.status}]`);
    for (const finding of findings) {
      console.log(`   ${finding.level}  ${finding.message}`);
    }
    console.log();
  }

  console.log("--- Tổng kết ---");
  console.log(`Qua gate:  ${results.length - failed.length} / ${results.length}`);
  console.log(`Bị chặn:   ${failed.length}`);

  if (failed.length > 0) {
    // Đếm lý do phổ biến nhất: một lỗi lặp trên phần lớn kho là lỗi hệ thống,
    // không phải lỗi của từng bài — và cách sửa hoàn toàn khác.
    const reasons = new Map<string, number>();
    for (const { findings } of results) {
      for (const f of findings) {
        if (f.level !== "CHẶN") continue;
        // Bỏ phần số liệu để gộp các biến thể của cùng một lý do
        const key = f.message.replace(/\d[\d.,]*/g, "N");
        reasons.set(key, (reasons.get(key) ?? 0) + 1);
      }
    }
    console.log("\n--- Lý do bị chặn, theo số bài ---");
    for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) {
      console.log(`${String(count).padStart(4)}  ${reason}`);
    }
  }

  process.exitCode = failed.length === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
