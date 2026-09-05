import { PrismaClient } from "@prisma/client";

import { prose } from "./check-publish";

/**
 * Đính chính nội dung ĐÃ XUẤT BẢN sau lượt fact-check ngày 2026-09-05.
 *
 *   npm run corrections              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections -- --write   # thực thi
 *
 * ## Vì sao là một script chứ không phải sửa tay
 *
 * Tám bài này đang chạy trên site. Sửa tay từng bài qua Studio thì không để
 * lại dấu vết nào về việc claim cũ là gì, ai đổi, và dựa vào nguồn nào — mà
 * đó chính là ba thứ một đính chính phải trả lời được. Script ghi `Revision`
 * chụp nội dung TRƯỚC khi đổi, trong cùng một transaction với lệnh sửa, nên
 * lịch sử không thể lệch khỏi nội dung.
 *
 * Cùng lý do `scripts/add-backlinks.ts` tồn tại: mọi phép ghi vào `content`
 * đều đi qua một cặp find/replace đã được đọc bằng mắt và khớp DUY NHẤT một
 * chỗ. Thay "lần xuất hiện đầu tiên" là cách nhanh nhất để sửa nhầm câu.
 *
 * ## Vì sao mỗi đính chính đi kèm một nguồn mới
 *
 * Điều kiện của `science-editor` khi duyệt lượt sửa này: đổi một con số cũ
 * không nguồn lấy một con số mới không nguồn thì không phải đính chính, chỉ
 * là đổi phiên bản của cùng một vấn đề. Nên bài nào đổi claim thì bảng
 * `Source` của nó phải nhận được công trình làm căn cứ cho claim mới.
 *
 * Mọi DOI và URL dưới đây đã được mở và đối chiếu ngày 2026-09-05, không
 * chép từ trí nhớ.
 *
 * ## Vì sao KHÔNG đụng vào `factCheck`
 *
 * Sửa xong chuỗi không có nghĩa là bài đã qua gate accuracy: cả tám bài vẫn
 * thiếu `reviewedById`, và bảy trong tám vẫn dưới ngưỡng 3 nguồn bậc 1–2.
 * `factCheck` là việc của người duyệt, không phải hệ quả của một phép thay
 * chuỗi. Script chỉ đặt `lastVerifiedAt` — mốc "lần cuối đối chiếu với nguồn".
 */
const prisma = new PrismaClient();

/** Ngày chạy lượt đính chính này — cũng là `lastVerifiedAt` được đặt. */
const VERIFIED_AT = new Date("2026-09-05T00:00:00Z");

/** Cùng hằng số với check-publish.ts và src/lib/rewrite.ts */
const WORDS_PER_MINUTE = 200;

type NewSource = {
  title: string;
  url: string;
  publisher: string;
  year: number;
  /** 1 = bình duyệt · 2 = cơ quan thẩm quyền */
  tier: number;
  doi?: string;
};

type Edit = {
  /** Chuỗi hiện có, phải khớp DUY NHẤT một chỗ trong `content` */
  find: string;
  /** Chuỗi thay thế. Rỗng nghĩa là cắt bỏ. */
  replace: string;
  /** Vì sao chỗ này sai và vì sao sửa thế này */
  why: string;
};

type Correction = {
  slug: string;
  /** Mức nghiêm trọng theo skill fact-check */
  severity: "S2" | "S3";
  edits: Edit[];
  /** Sửa `title` nếu claim sai nằm trong tiêu đề */
  title?: { find: string; replace: string };
  titleEn?: { find: string; replace: string };
  /** Nguồn làm căn cứ cho claim mới */
  sources?: NewSource[];
};

// --------------------------------------------------------------- Nguồn dùng chung

const SAWALA: NewSource = {
  title: "Apocalypse When? No Certainty of a Milky Way–Andromeda Collision",
  url: "https://doi.org/10.1038/s41550-025-02563-1",
  publisher: "Nature Astronomy",
  year: 2025,
  tier: 1,
  doi: "10.1038/s41550-025-02563-1",
};

/**
 * Bảng số liệu Sao Kim của NASA — căn cứ cho con số 117 ngày.
 *
 * Dùng science.nasa.gov chứ không dùng NSSDC như các bài hành tinh khác:
 * URL NSSDC hiện trả 307 về trang chủ và bảng số liệu không truy cập được.
 */
const NASA_VENUS: NewSource = {
  title: "Venus Facts",
  url: "https://science.nasa.gov/venus/venus-facts/",
  publisher: "NASA Science",
  year: 2024,
  tier: 2,
};

// --------------------------------------------------------------- Danh sách đính chính

const CORRECTIONS: Correction[] = [
  {
    slug: "sao-moc",
    severity: "S2",
    edits: [
      {
        find: "Một xoáy nghịch rộng hơn Trái Đất, được quan sát liên tục từ thế kỷ 17.",
        replace:
          'Một xoáy nghịch rộng hơn Trái Đất, được theo dõi liên tục từ khoảng năm 1831. Cassini từng mô tả một "Vết Vĩnh cửu" ở cùng vùng vĩ độ trong các năm 1665–1713, nhưng cấu trúc đó đã tan biến và không có chuỗi quan sát nào nối nó với vết hiện nay — giới thiên văn xem đây là hai xoáy khác nhau.',
        why: '"Liên tục từ thế kỷ 17" là một claim về chuỗi quan sát, mà chuỗi đó không tồn tại. Sánchez-Lavega 2024 cho thấy vết hiện nay hình thành ~1831 và vết Cassini là cấu trúc khác đã tan.',
      },
    ],
    sources: [
      {
        title: "The Origin of Jupiter's Great Red Spot",
        url: "https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2024GL108993",
        publisher: "Geophysical Research Letters",
        year: 2024,
        tier: 1,
        doi: "10.1029/2024GL108993",
      },
    ],
  },

  {
    slug: "sao-cau-tao-va-tien-hoa",
    severity: "S2",
    edits: [
      {
        find: "Một chi tiết đáng chú ý: phần lớn số sao trong Ngân Hà là loại M — nhỏ, mờ, đỏ. Không một sao loại M nào nhìn được bằng mắt thường, nên [bầu trời đêm](/articles/20-ngoi-sao-sang-nhat-bau-troi-dem) cho ta ấn tượng sai lệch về thành phần thật của thiên hà.",
        replace:
          "Một chi tiết đáng chú ý: phần lớn số sao trong Ngân Hà là sao lùn đỏ — loại M trên dãy chính, nhỏ và mờ tới mức không một sao nào trong số đó nhìn được bằng mắt thường. Các sao M ta thấy được, như Betelgeuse hay Antares, đều là sao khổng lồ hoặc siêu khổng lồ đã rời dãy chính. Nên [bầu trời đêm](/articles/20-ngoi-sao-sang-nhat-bau-troi-dem) cho ta ấn tượng sai lệch về thành phần thật của thiên hà.",
        why: 'Câu cũ tự mâu thuẫn với bảng quang phổ ngay phía trên nó, vốn liệt kê Betelgeuse làm ví dụ lớp M. Bài đang dùng "loại M" cho hai thứ khác nhau — lớp quang phổ và lớp độ trưng. Bản sửa tách hai nghĩa ra.',
      },
    ],
  },

  {
    slug: "big-bang",
    severity: "S2",
    edits: [
      {
        find:
          "| Mặt Trời thành sao lùn trắng | ~8 tỉ năm |\n| Ngân Hà sáp nhập với Andromeda | ~4,5 tỉ năm |",
        replace:
          "| Ngân Hà và Andromeda sáp nhập, nếu xảy ra | ~7–8 tỉ năm (khoảng 50% khả năng) |\n| Mặt Trời thành sao lùn trắng | ~8 tỉ năm |",
        why: "Mốc 4,5 tỉ năm đến từ nghiên cứu 2012 đã bị Sawala 2025 xét lại. Đảo hai dòng sửa luôn lỗi thứ tự thời gian trong bảng: mốc mới 7–8 tỉ năm tự rơi đúng chỗ trước dòng Mặt Trời.",
      },
    ],
    sources: [SAWALA],
  },

  {
    slug: "thien-ha-dinh-nghia-va-phan-loai",
    severity: "S2",
    edits: [
      {
        find:
          "Ngân Hà và Andromeda sẽ sáp nhập sau khoảng 4,5 tỉ năm nữa, và thứ còn lại nhiều khả năng là một thiên hà elip.",
        replace:
          "Ngân Hà và Andromeda đang tiến lại gần nhau, nhưng kết cục thì không chắc chắn như người ta từng nghĩ: một phân tích năm 2025 trên số liệu Gaia và Hubble, có tính thêm Đám mây Magellan Lớn và M33, chỉ cho khoảng 50% khả năng hai thiên hà sáp nhập trong 10 tỉ năm tới — và nếu xảy ra thì nhiều khả năng ở mốc 7–8 tỉ năm chứ không phải 4,5 tỉ năm như con số quen thuộc. Trong kịch bản đó, thứ còn lại nhiều khả năng là một thiên hà elip.",
        why: 'Đây là câu kết của bài, tức thứ người đọc mang về. Nói "sẽ sáp nhập" ở mức chắc chắn tuyệt đối trên một kết quả 50/50 là nâng mức độ dè dặt của nguồn.',
      },
    ],
    sources: [SAWALA],
  },

  {
    slug: "crispr-la-gi",
    severity: "S2",
    edits: [
      {
        find:
          "Tháng 12/2023, các cơ quan quản lý Anh và Mỹ phê duyệt **exagamglogene autotemcel** (Casgevy) cho bệnh hồng cầu hình liềm và beta-thalassemia — liệu pháp dùng CRISPR đầu tiên được chấp thuận.",
        replace:
          "**Exagamglogene autotemcel** (Casgevy) là liệu pháp dùng CRISPR đầu tiên được cơ quan quản lý chấp thuận. MHRA của Anh phê duyệt tháng 11/2023 cho cả bệnh hồng cầu hình liềm lẫn beta-thalassemia. FDA của Mỹ phê duyệt ngày 08/12/2023, nhưng ban đầu chỉ cho hồng cầu hình liềm; chỉ định beta-thalassemia được bổ sung ngày 16/01/2024.",
        why: "Câu cũ gộp hai cơ quan vào một mốc và gán cho mốc đó một chỉ định chưa tồn tại. Bản sửa cố ý chỉ ghi THÁNG cho MHRA: nguồn chia hai giữa ngày cấp phép và ngày công bố, nên ghi một ngày cụ thể là làm con số trông chắc hơn bằng chứng.",
      },
    ],
    sources: [
      {
        title:
          "MHRA authorises world-first gene therapy that aims to cure sickle-cell disease and transfusion-dependent β-thalassemia",
        url: "https://www.gov.uk/government/news/mhra-authorises-world-first-gene-therapy-that-aims-to-cure-sickle-cell-disease-and-transfusion-dependent-thalassemia",
        publisher: "Medicines and Healthcare products Regulatory Agency (UK)",
        year: 2023,
        tier: 2,
      },
      {
        title: "FDA Approves First Gene Therapies to Treat Patients with Sickle Cell Disease",
        url: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapies-treat-patients-sickle-cell-disease",
        publisher: "U.S. Food and Drug Administration",
        year: 2023,
        tier: 2,
      },
    ],
  },

  {
    slug: "sao-kim",
    severity: "S3",
    edits: [
      {
        find:
          "và chậm tới mức một ngày dài 243 ngày Trái Đất — dài hơn năm của nó (225 ngày).",
        replace:
          "và chậm tới mức một vòng tự quay so với các ngôi sao nền mất tới 243 ngày Trái Đất, dài hơn một năm của nó (225 ngày). Nhưng đó là chu kỳ tự quay sao, không phải độ dài một ngày: vì Sao Kim quay ngược chiều với hướng nó đi quanh Mặt Trời, ngày mặt trời ở đó — từ bình minh này tới bình minh kế tiếp — chỉ khoảng 117 ngày Trái Đất, tức ngắn hơn một năm.",
        why: '243 ngày là chu kỳ tự quay SAO. NASA: "sunrise to sunset would take 117 Earth days". Bài sao-thuy trong cùng kho đã viết đúng ("một ngày mặt trời"), nên đây là chỗ kho tự mâu thuẫn.',
      },
    ],
    sources: [NASA_VENUS],
  },

  {
    slug: "tam-hanh-tinh-he-mat-troi",
    severity: "S3",
    edits: [
      {
        find:
          "Sao Kim mất 243 ngày để tự quay một vòng nhưng chỉ mất 225 ngày để đi hết quỹ đạo — một ngày ở đó dài hơn một năm.",
        replace:
          "Sao Kim mất 243 ngày để tự quay một vòng, lâu hơn 225 ngày nó đi hết quỹ đạo — nhưng đó là chu kỳ tự quay sao, không phải độ dài một ngày. Vì Sao Kim quay ngược chiều, ngày mặt trời ở đó chỉ khoảng 117 ngày, tức ngắn hơn một năm.",
        why: 'Cùng lỗi với bài sao-kim. Cột "Chu kỳ tự quay" trong bảng vốn đã đúng — chỉ câu văn xuôi diễn giải nó sai thành "ngày".',
      },
      {
        /* Cắt bù: bài này đang vượt trần 5.000 ký tự văn xuôi (5.137).
           Khối truyền thuyết tên gọi là ví dụ phụ, đúng loại docs/content-rules.md
           cho phép cắt khi rút gọn — khác với khối dẫn nguồn thì không được đụng. */
        find:
          "\n\nSao Thiên Vương là trường hợp riêng: nó được đặt tên trực tiếp theo thần thoại Hy Lạp (Ouranos) chứ không phải La Mã.",
        replace: "",
        why: "Cắt bù để phần thêm ở trên không đẩy bài vượt xa hơn trần độ dài. Chi tiết bị cắt là ví dụ phụ, không phải claim nào khác dựa vào.",
      },
    ],
    sources: [NASA_VENUS],
  },

  {
    slug: "he-vi-sinh-duong-ruot",
    severity: "S3",
    edits: [
      {
        find:
          "Ruột người chứa khoảng 10¹⁴ vi sinh vật, phần lớn là vi khuẩn, tập trung ở đại tràng.",
        replace:
          "Ruột người chứa khoảng 4×10¹³ vi sinh vật — cỡ 40 nghìn tỉ — phần lớn là vi khuẩn và tập trung ở đại tràng. Con số 10¹⁴ vẫn được nhắc rộng rãi, nhưng nó truy về một ước lượng năm 1972; bản dựng lại năm 2016 hạ xuống khoảng 3,8×10¹³, tức cùng thứ tự độ lớn với số tế bào người trong cơ thể.",
        why: 'Giữ lại con số cũ có nêu tên là cách duy nhất để người đọc đã gặp "100 nghìn tỉ" ở nơi khác biết mình vừa đọc gì. Câu "200 gram" ngay sau đó vốn đã lấy từ chính bài Sender 2016, nên giờ hai câu mới cùng một nguồn.',
      },
    ],
    /* Con số sai nằm ngay trong tiêu đề. Bỏ hẳn con số chính xác thay vì thay
       bằng số mới: một ước lượng điểm trong tiêu đề sẽ lại bị trích rời khỏi
       năm đo của nó, đúng cách 10¹⁴ sống sót được 50 năm. "Hàng chục nghìn tỉ"
       đúng dù ước lượng tới có là 3,8×10¹³ hay 10¹⁴. */
    title: {
      find: "Hệ vi sinh đường ruột: 100 nghìn tỉ cư dân và ảnh hưởng của chúng",
      replace: "Hệ vi sinh đường ruột: hàng chục nghìn tỉ cư dân và ảnh hưởng của chúng",
    },
    titleEn: {
      find: "The gut microbiome: 100 trillion residents and what they do",
      replace: "The gut microbiome: tens of trillions of residents and what they do",
    },
    sources: [
      {
        title: "Revised Estimates for the Number of Human and Bacteria Cells in the Body",
        url: "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002533",
        publisher: "PLOS Biology",
        year: 2016,
        tier: 1,
        doi: "10.1371/journal.pbio.1002533",
      },
    ],
  },
];

function countWords(markdown: string): number {
  return markdown.trim().split(/\s+/).length;
}

/** readingTime đúng theo cùng công thức mà gate dùng để kiểm. */
function expectedReadingTime(content: string): number {
  return Math.max(1, Math.round(countWords(prose(content)) / WORDS_PER_MINUTE));
}

/** Đếm số lần `needle` xuất hiện — phải bằng 1 thì phép thay mới an toàn. */
function occurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");

  console.log("=== ĐÍNH CHÍNH SAU FACT-CHECK 2026-09-05 ===");
  console.log(write ? "CHẾ ĐỘ GHI\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  let failures = 0;
  const planned: {
    id: string;
    slug: string;
    oldTitle: string;
    oldContent: string;
    newContent: string;
    newTitle?: string;
    newTitleEn?: string;
    readingTime: number;
    sources: NewSource[];
  }[] = [];

  for (const correction of CORRECTIONS) {
    const article = await prisma.article.findUnique({
      where: { slug: correction.slug },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        content: true,
        readingTime: true,
        sources: { select: { url: true } },
      },
    });

    if (!article) {
      console.error(`✗ ${correction.slug}: không tìm thấy bài`);
      failures++;
      continue;
    }

    let content = article.content;
    let ok = true;

    for (const edit of correction.edits) {
      const found = occurrences(content, edit.find);
      if (found !== 1) {
        console.error(
          `✗ ${correction.slug}: chuỗi cần thay khớp ${found} chỗ (phải là 1)\n` +
            `   "${edit.find.slice(0, 70).replace(/\n/g, "\\n")}…"`,
        );
        ok = false;
        failures++;
        break;
      }
      content = content.replace(edit.find, edit.replace);
    }
    if (!ok) continue;

    // Tiêu đề: kiểm khớp chính xác, không thay mù
    let newTitle: string | undefined;
    if (correction.title) {
      if (article.title !== correction.title.find) {
        console.error(
          `✗ ${correction.slug}: title không khớp kỳ vọng\n` +
            `   có:  "${article.title}"\n   chờ: "${correction.title.find}"`,
        );
        failures++;
        continue;
      }
      newTitle = correction.title.replace;
    }
    let newTitleEn: string | undefined;
    if (correction.titleEn) {
      if (article.titleEn !== correction.titleEn.find) {
        console.error(
          `✗ ${correction.slug}: titleEn không khớp kỳ vọng\n` +
            `   có:  "${article.titleEn}"\n   chờ: "${correction.titleEn.find}"`,
        );
        failures++;
        continue;
      }
      newTitleEn = correction.titleEn.replace;
    }

    // Nguồn đã có rồi thì không thêm trùng
    const existing = new Set(article.sources.map((s) => s.url).filter(Boolean));
    const sources = (correction.sources ?? []).filter((s) => !existing.has(s.url));

    const beforeProse = prose(article.content).length;
    const afterProse = prose(content).length;
    const readingTime = expectedReadingTime(content);

    console.log(`${correction.severity}  ${correction.slug}`);
    for (const edit of correction.edits) {
      console.log(`   • ${edit.why}`);
    }
    if (newTitle) console.log(`   • tiêu đề: "${article.title}"\n            → "${newTitle}"`);
    if (newTitleEn) console.log(`   • titleEn → "${newTitleEn}"`);
    console.log(
      `   văn xuôi ${beforeProse.toLocaleString("vi-VN")} → ${afterProse.toLocaleString("vi-VN")} ký tự` +
        (afterProse > 5_000 ? "  ⚠ trên trần 5.000" : ""),
    );
    if (readingTime !== article.readingTime) {
      console.log(`   readingTime ${article.readingTime} → ${readingTime}`);
    }
    for (const s of sources) {
      console.log(`   + nguồn bậc ${s.tier}: ${s.title} (${s.publisher}, ${s.year})`);
    }
    console.log();

    planned.push({
      id: article.id,
      slug: article.slug,
      oldTitle: article.title,
      oldContent: article.content,
      newContent: content,
      newTitle,
      newTitleEn,
      readingTime,
      sources,
    });
  }

  if (failures > 0) {
    console.error(`\n✗ ${failures} bài không áp được. Không ghi gì cả.`);
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log(`Sẵn sàng áp ${planned.length} bài. Chạy lại với --write để ghi.`);
    return;
  }

  for (const p of planned) {
    await prisma.$transaction([
      // Revision chụp nội dung TRƯỚC khi sửa — đây là bản để đối chiếu
      // "trước đính chính bài trông thế nào".
      prisma.revision.create({
        data: {
          articleId: p.id,
          title: p.oldTitle,
          content: p.oldContent,
          note: "Bản trước đính chính fact-check 2026-09-05 — xem docs/content/corrections.md",
        },
      }),
      prisma.article.update({
        where: { id: p.id },
        data: {
          content: p.newContent,
          ...(p.newTitle ? { title: p.newTitle } : {}),
          ...(p.newTitleEn ? { titleEn: p.newTitleEn } : {}),
          readingTime: p.readingTime,
          lastVerifiedAt: VERIFIED_AT,
        },
      }),
      ...p.sources.map((s) =>
        prisma.source.create({
          data: {
            articleId: p.id,
            title: s.title,
            url: s.url,
            publisher: s.publisher,
            year: s.year,
            tier: s.tier,
            doi: s.doi ?? null,
            accessedAt: VERIFIED_AT,
          },
        }),
      ),
    ]);
    console.log(`✓ ${p.slug} (đã ghi revision, +${p.sources.length} nguồn)`);
  }

  console.log(
    `\nXong ${planned.length} bài. factCheck GIỮ NGUYÊN PENDING — ` +
      "cả tám bài vẫn thiếu người duyệt, đó là việc của science-editor.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
