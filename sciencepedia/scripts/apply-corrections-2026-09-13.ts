import { PrismaClient } from "@prisma/client";

import { MAX_WORDS, prose } from "./check-publish";

/**
 * Đính chính nội dung ĐÃ XUẤT BẢN sau lượt fact-check ngày 2026-09-13 (lô 1 + lô 2).
 *
 *   npx tsx scripts/apply-corrections-2026-09-13.ts            # in kế hoạch, KHÔNG ghi gì
 *   npx tsx scripts/apply-corrections-2026-09-13.ts --write     # thực thi
 *
 * Giữ nguyên bốn điều kiện `science-editor` đã đặt cho lượt 2026-09-05, xem
 * `scripts/apply-corrections.ts`. Nhắc lại ngắn gọn phần đáng nhắc:
 *
 * - Mỗi phép sửa là một cặp find/replace khớp DUY NHẤT một chỗ. Script tự đếm
 *   và dừng nếu khớp 0 hoặc ≥2. Thay "lần xuất hiện đầu tiên" là cách nhanh
 *   nhất để sửa nhầm câu.
 * - `Revision` chụp nội dung TRƯỚC khi đổi, trong cùng transaction với lệnh
 *   sửa, nên lịch sử không thể lệch khỏi nội dung.
 * - Đổi một con số cũ không nguồn lấy một con số mới không nguồn thì không
 *   phải đính chính. Mọi giá trị mới dưới đây đã được MỞ nguồn ra đối chiếu
 *   ngày 2026-09-13, không chép từ trí nhớ. URL nào không mở được thì mục đó
 *   bị loại khỏi lượt này, không đoán.
 * - KHÔNG đụng `factCheck`. Chín bài dưới đây vẫn thiếu `reviewedById` và vẫn
 *   dưới ngưỡng 3 nguồn bậc 1–2, nên sửa xong chuỗi vẫn chưa qua gate accuracy.
 *   Script chỉ đặt `lastVerifiedAt`.
 *
 * ## Hai mục bị LOẠI khỏi lượt này sau khi mở nguồn
 *
 * 1. Nhiệt độ cân bằng Proxima Centauri d. Báo cáo fact-check lô 2 ghi con số
 *    282 K trong bài là sai và giá trị đúng là ~360 K. MỞ NGUỒN RA THÌ NGƯỢC
 *    LẠI: NASA Exoplanet Archive liệt kê 282±23 K, dẫn Suárez Mascareño et al.
 *    2025 (NIRPS). Con số 360 K là giá trị cũ từ bài phát hiện Faria 2022, đã
 *    bị bản phân tích 2025 thay thế. Bài đang ĐÚNG; báo cáo sai. Không sửa.
 *
 * 2. Eris "một thiên thể vành đai Kuiper" trong bài tai-sao-pluto. Về phân
 *    loại động lực học chặt thì Eris là thiên thể đĩa phân tán, nhưng chính
 *    NASA gọi nó là "a member of a group of objects that orbit in a disc-like
 *    zone beyond the orbit of Neptune called the Kuiper Belt". Cách dùng của
 *    bài trùng với cách dùng của NASA. Sửa một lối nói có thể bảo vệ được
 *    thành một lối nói khác không phải đính chính. Không sửa.
 *
 * Cả hai đều là lỗi của báo cáo chứ không phải của bài. Ghi lại ở đây vì lần
 * sau dễ có người "phát hiện" lại chúng.
 */
const prisma = new PrismaClient();

/** Ngày chạy lượt đính chính này — cũng là `lastVerifiedAt` được đặt. */
const VERIFIED_AT = new Date("2026-09-13T00:00:00Z");

/** Cùng hằng số với check-publish.ts và src/lib/rewrite.ts */
const WORDS_PER_MINUTE = 200;

type NewSource = {
  title: string;
  url: string;
  publisher: string;
  year: number;
  /** 1 = bình duyệt · 2 = cơ quan thẩm quyền · 3 = tài liệu giáo dục đại học/bảo tàng */
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
  sources?: NewSource[];
};

// --------------------------------------------------------------- Nguồn dùng chung
//
// Mọi URL dưới đây đã mở được và đọc được nội dung ngày 2026-09-13. Ba URL bị
// chặn khi thử (A&A trả 403, Nature và Springer đòi đăng nhập, PubMed chặn vì
// cookie) nên chỗ nào cần chúng thì đã thay bằng nguồn mở được, hoặc bỏ mục.

/** Số vệ tinh — NASA dẫn lại bảng của JPL Solar System Dynamics, có mốc as-of. */
const NASA_SATURN_MOONS: NewSource = {
  title: "Saturn Moons — 293 confirmed moons as of August 2026",
  url: "https://science.nasa.gov/saturn/moons/",
  publisher: "NASA Science",
  year: 2026,
  tier: 2,
};

const NASA_JUPITER_MOONS: NewSource = {
  title: "Jupiter Moons — 115 IAU-recognised moons as of August 2026",
  url: "https://science.nasa.gov/jupiter/jupiter-moons/",
  publisher: "NASA Science",
  year: 2026,
  tier: 2,
};

const NASA_URANUS_MOONS: NewSource = {
  title: "Uranus Moons — 29 known moons as of August 2026",
  url: "https://science.nasa.gov/uranus/moons/",
  publisher: "NASA Science",
  year: 2026,
  tier: 2,
};

/**
 * Căn cứ cho việc nguồn gốc Phobos/Deimos là câu hỏi mở.
 *
 * Dùng JAXA chứ không dùng bài tổng quan Rosenblatt 2011: Springer đòi đăng
 * nhập nên không đối chiếu được, mà quy tắc lượt này là không trích thứ chưa mở.
 */
const JAXA_MMX: NewSource = {
  title: "Martian Moons eXploration (MMX) — mission overview",
  url: "https://www.mmx.jaxa.jp/en/",
  publisher: "JAXA",
  year: 2026,
  tier: 2,
};

const NASA_MARS_MOONS: NewSource = {
  title: "Mars Moons: Phobos and Deimos",
  url: "https://science.nasa.gov/mars/moons/",
  publisher: "NASA Science",
  year: 2026,
  tier: 2,
};

/**
 * Độ cao Olympus Mons. Bậc 3 chứ không phải 2: đây là trang giáo dục của
 * Mars Space Flight Facility (Arizona State University) vận hành thiết bị
 * THEMIS trên Mars Odyssey, không phải trang cơ quan.
 *
 * Con số 21,9 km là độ cao so với mốc chuẩn (datum) của Sao Hoả. Địa hình nổi
 * so với đồng bằng xung quanh thì tới ~26 km — hai cách đo khác nhau, và đó
 * chính là chỗ bài cũ trượt chân.
 */
const THEMIS_OLYMPUS: NewSource = {
  title: "Olympus Mons — 21.9 km tall",
  url: "https://themis.asu.edu/zoom-20230811a",
  publisher: "Mars Space Flight Facility, Arizona State University (Mars Odyssey THEMIS)",
  year: 2023,
  tier: 3,
};

/** Tuổi Omo I — mốc "con số quen thuộc trước Jebel Irhoud". */
const SMITHSONIAN_OMO: NewSource = {
  title: "Omo I — Homo sapiens, about 195,000 years old",
  url: "https://humanorigins.si.edu/evidence/human-fossils/fossils/omo-i",
  publisher: "Smithsonian National Museum of Natural History",
  year: 2024,
  tier: 3,
};

/** Thiên hà xa nhất được xác nhận. */
const NASA_JADES: NewSource = {
  title: "NASA's James Webb Space Telescope Finds Most Distant Known Galaxy (JADES-GS-z14-0, z = 14.32)",
  url: "https://science.nasa.gov/blogs/webb/2024/05/30/nasas-james-webb-space-telescope-finds-most-distant-known-galaxy/",
  publisher: "NASA Science",
  year: 2024,
  tier: 2,
};

/**
 * Từ trường KHÔNG đủ để bảo vệ khí quyển.
 *
 * A&A trả 403 nên không mở được bản gốc; DOI vẫn ghi vì đó là định danh bền.
 * Nội dung được đối chiếu qua trang giải thích của Viện Không gian Bỉ
 * (BIRA-IASB) — chính nhóm đồng tác giả — nên đính kèm cả hai.
 */
const GUNELL_2018: NewSource = {
  title: "Why an intrinsic magnetic field does not protect a planet against atmospheric escape",
  url: "https://doi.org/10.1051/0004-6361/201832934",
  publisher: "Astronomy & Astrophysics 614, L3",
  year: 2018,
  tier: 1,
  doi: "10.1051/0004-6361/201832934",
};

const BIRA_MAGNETIC: NewSource = {
  title: "Does Earth's magnetic field protect our atmosphere?",
  url: "https://www.aeronomie.be/en/annual-report/does-earths-magnetic-field-protect-our-atmosphere",
  publisher: "Royal Belgian Institute for Space Aeronomy (BIRA-IASB)",
  year: 2019,
  tier: 2,
};

/** Heli có từ vài phút đầu sau Big Bang, không phải từ lõi sao. */
const CERN_EARLY_UNIVERSE: NewSource = {
  title: "The early universe",
  url: "https://home.cern/science/physics/early-universe",
  publisher: "CERN",
  year: 2024,
  tier: 2,
};

/** Nguyên tố nặng nhất sinh ra trong va chạm sao neutron, không phải lõi sao. */
const NASA_KILONOVA: NewSource = {
  title: "NASA Missions Catch First Light from a Gravitational-Wave Event (GW170817 kilonova)",
  url: "https://science.nasa.gov/missions/chandra/nasa-missions-catch-first-light-from-a-gravitational-wave-event/",
  publisher: "NASA Science",
  year: 2017,
  tier: 2,
};

/**
 * Bán kính xích đạo, chu kỳ tự quay sao và gia tốc trọng trường — đủ để tự
 * tính tỉ lệ lực ly tâm thay vì tin vào con số có sẵn.
 *
 * Lưu ý ngược với ghi chú của lượt 09-05: URL NSSDC của Trái Đất mở bình
 * thường, chỉ bảng Sao Kim mới bị chuyển hướng.
 */
const NASA_EARTH_FACTS: NewSource = {
  title: "Earth Fact Sheet",
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  publisher: "NASA NSSDC",
  year: 2024,
  tier: 2,
};

// --------------------------------------------------------------- Danh sách đính chính

const CORRECTIONS: Correction[] = [
  {
    slug: "sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc",
    severity: "S2",
    edits: [
      {
        find: "- **Olympus Mons** — núi lửa cao 22 km, gần gấp ba đỉnh Everest",
        replace:
          "- **Olympus Mons** — núi lửa cao khoảng 21,9 km so với mốc chuẩn của Sao Hoả, tức gấp khoảng hai lần rưỡi đỉnh Everest",
        why: 'Hai vế tự mâu thuẫn: 22 km chỉ gấp 2,5 lần Everest chứ không "gần gấp ba". Con số gấp ba đến từ cách đo khác — địa hình nổi ~26 km so với đồng bằng quanh chân núi — nhưng bài lại ghép nó với chiều cao so với mốc chuẩn. Chọn một cách đo (THEMIS: 21,9 km so với datum) rồi để hai vế khớp.',
      },
      {
        find:
          "- Hai vệ tinh nhỏ Phobos và Deimos, nhiều khả năng là tiểu hành tinh bị bắt giữ",
        replace:
          "- Hai vệ tinh nhỏ Phobos và Deimos, nguồn gốc vẫn chưa ngã ngũ. Quang phổ của chúng giống các tiểu hành tinh nguyên thuỷ, gợi ý chúng bị Sao Hoả bắt giữ; nhưng quỹ đạo gần tròn và gần như nằm trong mặt phẳng xích đạo lại hợp hơn với kịch bản chúng bồi tụ từ một đĩa mảnh vỡ sinh ra sau một vụ va chạm lớn. JAXA xếp đây vào nhóm bài toán chưa có lời giải của thuyết hình thành Hệ Mặt Trời, và lập sứ mệnh MMX để lấy mẫu Phobos đem về phân xử",
        why: '"Nhiều khả năng là tiểu hành tinh bị bắt giữ" trao phần thắng cho một phe trong khi ngành chưa phân xử. NASA viết "thought to be captured asteroids, OR debris from early in the formation of our solar system"; JAXA gọi thẳng đây là "one of the unsolved problems". Bản sửa nói rõ căn cứ của từng phe: quang phổ đứng về bắt giữ, quỹ đạo đứng về va chạm.',
      },
    ],
    sources: [THEMIS_OLYMPUS, JAXA_MMX, NASA_MARS_MOONS],
  },

  {
    slug: "tam-hanh-tinh-cua-he-mat-troi",
    severity: "S2",
    edits: [
      {
        /* Ba dòng liền nhau, khớp cả khối để chắc chắn duy nhất. Sao Hải Vương
           giữ nguyên 16 — NASA vẫn ghi 16, đã kiểm cùng lượt. */
        find:
          "| Sao Mộc | 5,20 | 11,86 năm | 9,9 giờ | 142.984 | 95 |\n" +
          "| Sao Thổ | 9,54 | 29,4 năm | 10,7 giờ | 120.536 | 146 |\n" +
          "| Sao Thiên Vương | 19,2 | 84,0 năm | 17,2 giờ (ngược) | 51.118 | 28 |",
        replace:
          "| Sao Mộc | 5,20 | 11,86 năm | 9,9 giờ | 142.984 | 115 |\n" +
          "| Sao Thổ | 9,54 | 29,4 năm | 10,7 giờ | 120.536 | 293 |\n" +
          "| Sao Thiên Vương | 19,2 | 84,0 năm | 17,2 giờ (ngược) | 51.118 | 29 |",
        why: "Số vệ tinh đã lạc hậu hẳn một bậc. NASA tính tới tháng 8/2026: Sao Thổ 293 (bài ghi 146), Sao Mộc 115 (bài ghi 95), Sao Thiên Vương 29 (bài ghi 28). Sao Hải Vương vẫn 16 nên giữ nguyên — kiểm cả bốn dòng vì lượt này đóng lại mốc as-of mới cho cả bảng.",
      },
      {
        find:
          "Số vệ tinh của bốn hành tinh nhóm ngoài thay đổi theo từng đợt phát hiện mới, con số trong bảng là số đã được đặt tên tính tới năm 2024.",
        replace:
          "Số vệ tinh của bốn hành tinh nhóm ngoài thay đổi theo từng đợt phát hiện mới. Con số trong bảng là số vệ tinh đã được xác nhận, theo NASA tính tới tháng 8/2026 — không phải số đã được đặt tên, vốn ít hơn nhiều. Riêng Sao Thổ nhảy vọt sau khi Trung tâm Tiểu hành tinh của IAU công nhận thêm 128 vệ tinh trong một lần công bố tháng 3/2025.",
        why: 'Chú thích cũ sai ở hai chỗ. Thứ nhất, 146 và 95 là số vệ tinh ĐÃ XÁC NHẬN/đánh số, không phải số đã được ĐẶT TÊN — số được đặt tên nhỏ hơn nhiều, nên chú thích làm con số trông khiêm tốn hơn thực tế. Thứ hai, mốc as-of "năm 2024" có tồn tại nhưng không ai rà lại, nên nó hợp thức hoá một con số đã sai. Mốc mới ghi rõ tới tháng.',
      },
    ],
    sources: [NASA_SATURN_MOONS, NASA_JUPITER_MOONS, NASA_URANUS_MOONS],
  },

  {
    slug: "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
    severity: "S2",
    edits: [
      {
        find:
          "*Homo sapiens* xuất hiện khoảng **300.000 năm trước** — hoá thạch ở Jebel Irhoud, Maroc đã đẩy mốc này lùi xa hơn nhiều so với con số 100.000 năm từng được dùng phổ biến.",
        replace:
          "*Homo sapiens* xuất hiện khoảng **300.000 năm trước** — hoá thạch ở Jebel Irhoud, Maroc đã đẩy mốc này lùi xa hơn con số quen thuộc trước đó là khoảng 195.000 năm, vốn dựa trên hoá thạch Omo I ở Ethiopia.",
        why: 'Con số cũ mà Jebel Irhoud thay thế là ~195.000 năm (Omo I, Ethiopia), không phải 100.000. Mốc 100.000 thuộc về một câu chuyện khác — đợt di cư khỏi châu Phi — nên câu cũ ghép nhầm hai mốc và làm bước nhảy của phát hiện 2017 trông lớn gấp ba lần thực tế.',
      },
      {
        /* Hai dòng bảng dưới đây KHÔNG cần nguồn mới: chúng chỉ là phép quy đổi
           từ chính hai con số đã có trong thân bài (2,4 tỉ năm và 300.000 năm)
           sang thang "một năm dương lịch". Sửa ở đây là sửa số học, không phải
           đổi claim. Mốc 4,54 tỉ năm → 1 ngày = 12,43 triệu năm. */
        find: "| Oxy tích tụ trong khí quyển | cuối tháng 7 |",
        replace: "| Oxy tích tụ trong khí quyển | 21 tháng 6 |",
        why: "Thân bài đặt sự kiện oxy hoá lớn ở 2,4 tỉ năm trước. Quy đổi: (4,54 − 2,4) tỉ / 12,43 triệu = ngày thứ 172 của năm, tức 21/6. Bảng ghi cuối tháng 7, ứng với ~1,9 tỉ năm trước — lệch khoảng nửa tỉ năm so với chính thân bài.",
      },
      {
        find: "| *Homo sapiens* | 23:37 ngày 31 tháng 12 |",
        replace: "| *Homo sapiens* | 23:25 ngày 31 tháng 12 |",
        why: "Thân bài ghi 300.000 năm. Quy đổi: 300.000 / 4,54 tỉ × 365,24 ngày = 34,7 phút trước nửa đêm, tức 23:25. Mốc 23:37 ứng với ~198.000 năm — tức đúng con số cũ mà chính đoạn văn trên vừa được sửa để bỏ đi.",
      },
    ],
    sources: [SMITHSONIAN_OMO],
  },

  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    severity: "S2",
    edits: [
      {
        find: "### Khoảng 1 tỷ năm\n\nNhững thiên hà đầu tiên xuất hiện.",
        replace:
          "### Khoảng 300 triệu năm\n\nNhững thiên hà đầu tiên đã hình thành. Thiên hà xa nhất được xác nhận cho tới nay là JADES-GS-z14-0, ở độ dịch chuyển đỏ 14,32 — tức đã tồn tại chỉ khoảng 290 triệu năm sau Big Bang (số liệu tháng 5/2024; mốc này còn lùi tiếp mỗi lần JWST tìm được thiên hà xa hơn).",
        why: "Mốc 1 tỷ năm lệch khoảng ba lần. JWST đã xác nhận JADES-GS-z14-0 ở 290 triệu năm sau Big Bang, và ngay cả trước JWST thì Hubble đã thấy thiên hà ở mốc ~400 triệu năm. Bản sửa kèm mốc as-of và nói rõ đây là kỷ lục sẽ đổi, vì đúng loại claim này là loại lặng lẽ mục nát.",
      },
    ],
    sources: [NASA_JADES],
  },

  {
    slug: "tu-truong-va-luc-hap-dan-hai-luc-vo-hinh-hai-co-che-khac-nhau",
    severity: "S2",
    edits: [
      {
        find:
          "> Lực hấp dẫn giữ khí quyển lại. Từ trường giữ cho gió Mặt Trời không cướp nó đi. Mất một trong hai là đủ để một hành tinh khô cạn.",
        replace:
          "> Lực hấp dẫn giữ khí quyển lại. Từ trường làm chệch hướng phần lớn gió Mặt Trời. Nhưng đừng rút ra kết luận rằng cứ mất từ trường là mất khí quyển: Sao Kim không có từ trường lưỡng cực toàn cầu mà vẫn giữ được một khí quyển dày đặc, và tốc độ thất thoát khối lượng đo được ở Trái Đất, Sao Kim và Sao Hoả xấp xỉ nhau. Từ trường chắn được một số cơ chế thoát nhưng lại mở ra những cơ chế khác qua hai vùng cực, nên vai trò thật của nó với khí quyển hành tinh vẫn đang được tranh luận.",
        why: 'Câu kết cũ là câu người đọc mang về, và nó sai theo đúng nghĩa kiểm chứng được: Sao Kim là phản ví dụ đứng ngay trong Hệ Mặt Trời. Gunell et al. 2018 cho thấy tốc độ thoát khối lượng ở Trái Đất, Sao Kim và Sao Hoả đều nằm trong khoảng 0,5–2 kg/s, và một Trái Đất giả định không từ trường sẽ mất khí quyển "xấp xỉ bằng, thậm chí ít hơn một chút" so với Trái Đất thật. Đây là bất đồng khoa học thật bị thu thành một câu khẳng định.',
      },
    ],
    sources: [GUNELL_2018, BIRA_MAGNETIC],
  },

  {
    slug: "ngoi-sao-cau-tao-va-vong-doi",
    severity: "S2",
    edits: [
      {
        find:
          '⭐ Có thể nói theo nghĩa đen rằng con người được tạo nên từ "bụi sao". Mọi nguyên tử nặng hơn hydro trong cơ thể chúng ta đều từng được sinh ra trong lõi của những ngôi sao đã tồn tại từ trước khi Mặt Trời hình thành.',
        replace:
          '⭐ Cách nói con người được tạo nên từ "bụi sao" là đúng, nhưng cần nói cho đủ. Carbon, oxy, canxi và sắt trong cơ thể quả thật được tổng hợp trong lòng những ngôi sao đã sống và chết trước khi Mặt Trời hình thành. Heli thì không: phần lớn heli trong vũ trụ đã hình thành ngay trong vài phút đầu tiên sau Big Bang, khi chưa có ngôi sao nào. Còn những nguyên tố nặng nhất — vàng, bạch kim — không ra đời trong lõi một ngôi sao đang cháy ổn định, mà trong những biến cố dữ dội hơn nhiều, trong đó có va chạm giữa hai sao neutron.',
        why: 'Ba chữ làm câu này sai: "theo nghĩa đen", "mọi", và "lõi". Heli đến từ tổng hợp hạt nhân Big Bang chứ không từ sao. Vàng, bạch kim và phần lớn nguyên tố r-process đến từ va chạm sao neutron chứ không từ lõi sao đang cháy. Danh sách C/O/Ca/Fe ngay phía trên thì đúng — chỉ câu tổng kết vống lên, và nó là câu đóng bài nên là thứ đọng lại.',
      },
    ],
    sources: [CERN_EARLY_UNIVERSE, NASA_KILONOVA],
  },

  {
    slug: "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung",
    severity: "S3",
    edits: [
      {
        /* Cắt bỏ, không làm mềm. Không kèm nguồn mới vì không có claim mới. */
        find: "Khoảng 70% mô miễn dịch của cơ thể liên quan đến đường tiêu hóa.\n\n",
        replace: "",
        why: 'Con số "70% hệ miễn dịch nằm ở ruột" là số dân gian: nó được nhắc khắp nơi nhưng không truy về được phép đo sơ cấp nào. Quy tắc 6 của chuẩn biên tập: số không nguồn thì BỎ, không làm mềm thành "phần lớn". Đoạn còn lại vẫn đứng vững vì ba gạch đầu dòng ngay sau đó mới là nội dung thật của mục.',
      },
    ],
  },

  {
    slug: "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
    severity: "S3",
    edits: [
      {
        find: "lực ly tâm chỉ làm giảm trọng lượng của chúng ta khoảng **0,3%**",
        replace: "lực ly tâm chỉ làm giảm trọng lượng của chúng ta khoảng **0,35%**",
        why: "Bài tự mâu thuẫn: thân bài ghi 0,3%, kết luận ghi 0,35% cho cùng một đại lượng. Tính từ số liệu NASA Earth Fact Sheet: ω = 2π/86.164 s = 7,292×10⁻⁵ rad/s; ω²R = (7,292×10⁻⁵)² × 6.378.137 m = 0,03392 m/s²; chia cho g = 9,780 m/s² được 0,347%. Vậy 0,35% đúng, 0,3% là chỗ phải sửa.",
      },
    ],
    sources: [NASA_EARTH_FACTS],
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

  console.log("=== ĐÍNH CHÍNH SAU FACT-CHECK 2026-09-13 (lô 1 + lô 2) ===");
  console.log(write ? "CHẾ ĐỘ GHI\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n");

  let failures = 0;
  const planned: {
    id: string;
    slug: string;
    oldTitle: string;
    oldContent: string;
    newContent: string;
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
        content: true,
        readingTime: true,
        factCheck: true,
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

    // Nguồn đã có rồi thì không thêm trùng
    const existing = new Set(article.sources.map((s) => s.url).filter(Boolean));
    const sources = (correction.sources ?? []).filter((s) => !existing.has(s.url));

    const beforeProse = prose(article.content).length;
    const afterProse = prose(content).length;
    const afterWords = countWords(prose(content));
    const readingTime = expectedReadingTime(content);

    console.log(`${correction.severity}  ${correction.slug}  [factCheck=${article.factCheck}]`);
    for (const edit of correction.edits) {
      console.log(`   • ${edit.why}`);
    }
    console.log(
      `   văn xuôi ${beforeProse.toLocaleString("vi-VN")} → ${afterProse.toLocaleString("vi-VN")} ký tự ` +
        `(${afterWords} từ)` +
        (afterWords > MAX_WORDS ? `  ⚠ trên trần ${MAX_WORDS} từ — bài cũ, được miễn` : ""),
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
      prisma.revision.create({
        data: {
          articleId: p.id,
          title: p.oldTitle,
          content: p.oldContent,
          note: "Bản trước đính chính fact-check 2026-09-13 — xem docs/content/corrections.md",
        },
      }),
      prisma.article.update({
        where: { id: p.id },
        data: {
          content: p.newContent,
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
    `\nXong ${planned.length} bài. factCheck GIỮ NGUYÊN — ` +
      "sửa chuỗi không phải là qua gate accuracy, đó là việc của science-editor.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
