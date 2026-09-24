import { PrismaClient } from "@prisma/client";

/**
 * Bổ sung nguồn cho 17 bài mới xuất bản không có nguồn nào, kèm đính chính
 * những câu nguồn không đỡ được.
 *
 *   npx tsx --env-file-if-exists=.env scripts/add-sources-2026-09-24.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/add-sources-2026-09-24.ts --write   # ghi
 *
 * ## Mỗi nguồn dưới đây đã được MỞ RA ĐỌC, không chỉ kiểm link
 *
 * docs/content-rules.md, "Trích dẫn resolve đúng bài KHÔNG có nghĩa là bài đó
 * nói điều đang viết". Nguồn nào chỉ tìm được tên mà không đọc được nội dung
 * thì KHÔNG vào danh sách, kể cả khi nó là nguồn hay được trích nhất (Fredholm
 * 1999 về caffeine, trang Einstein của Britannica — cả hai chặn không cho đọc).
 *
 * ## Đính chính: câu nào không có nguồn đỡ thì sửa theo nguồn, không giữ
 *
 * Chủ sản phẩm quyết (24/09): gặp câu lệch nguồn thì sửa luôn, có revision.
 * Lý do từng chỗ ghi ở `why`. Bốn dạng lỗi gặp trong đợt này, đều đã có tên
 * trong content-rules: con số không truy được nguồn (14/17 nghiên cứu, 34%/54%
 * của NASA), mất mức dè dặt (IPCC "ít nhất" một lần mỗi thập kỷ, "thêm"
 * 70–90%), nhân quả tự thêm (mắt "tiến hoá để" nhận biết), và dẫn nguồn không
 * kiểm được (Britannica).
 */
const prisma = new PrismaClient();

type Src = {
  title: string;
  publisher: string;
  url: string;
  doi?: string;
  year?: number;
  /** 1 bình duyệt · 2 cơ quan thẩm quyền · 3 giáo dục · 4 báo chí khoa học */
  tier: 1 | 2 | 3 | 4;
};
type Fix = { find: string | RegExp; replace: string; why: string };
type Plan = { slug: string; title?: { from: string; to: string; why: string }; sources: Src[]; fixes?: Fix[] };

const doi = (d: string) => `https://doi.org/${d}`;

const NASA_EMS_INTRO: Src = {
  title: "Introduction to the Electromagnetic Spectrum",
  publisher: "NASA Science",
  url: "https://science.nasa.gov/ems/01_intro/",
  tier: 2,
};
const NASA_EMS_ANATOMY: Src = {
  title: "Anatomy of an Electromagnetic Wave",
  publisher: "NASA Science",
  url: "https://science.nasa.gov/ems/02_anatomy/",
  tier: 2,
};
const NIST_QC: Src = {
  title: "Quantum Computing Explained",
  publisher: "NIST",
  url: "https://www.nist.gov/quantum-information-science/quantum-computing-explained",
  tier: 2,
};
const NIST_CAT_1996: Src = {
  title: "Schroedinger's Cat in an Atomic Cage",
  publisher: "NIST",
  url: "https://www.nist.gov/news-events/news/1996/05/schroedingers-cat-atomic-cage",
  year: 1996,
  tier: 2,
};
const MONROE_1996: Src = {
  title: "A \"Schrödinger Cat\" Superposition State of an Atom",
  publisher: "Science 272:1131–1136 — Monroe, Meekhof, King & Wineland",
  url: doi("10.1126/science.272.5265.1131"),
  doi: "10.1126/science.272.5265.1131",
  year: 1996,
  tier: 1,
};
const NIST_DECOHERENCE_2000: Src = {
  title: "NIST Scientists Cross the Bridge between Atomic and Real Worlds",
  publisher: "NIST",
  url: "https://www.nist.gov/news-events/news/2000/01/nist-scientists-cross-bridge-between-atomic-and-real-worlds",
  year: 2000,
  tier: 2,
};
const GISIN_2002: Src = {
  title: "Quantum cryptography",
  publisher: "Reviews of Modern Physics 74:145 — Gisin, Ribordy, Tittel & Zbinden",
  url: doi("10.1103/RevModPhys.74.145"),
  doi: "10.1103/RevModPhys.74.145",
  year: 2002,
  tier: 1,
};
const NOBEL_2022_PRESS: Src = {
  title: "Press release: The Nobel Prize in Physics 2022",
  publisher: "The Royal Swedish Academy of Sciences — NobelPrize.org",
  url: "https://www.nobelprize.org/prizes/physics/2022/press-release/",
  year: 2022,
  tier: 2,
};
const NCSC_QKD: Src = {
  title: "Quantum networking technologies (white paper)",
  publisher: "UK National Cyber Security Centre",
  url: "https://www.ncsc.gov.uk/whitepaper/quantum-security-technologies",
  tier: 2,
};
const NASA_SUN_FACTS: Src = {
  title: "Sun: Facts",
  publisher: "NASA Science",
  url: "https://science.nasa.gov/sun/facts/",
  tier: 2,
};

const PLANS: Plan[] = [
  {
    slug: "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
    sources: [
      NASA_EMS_INTRO,
      NASA_EMS_ANATOMY,
      {
        title: "CODATA Value: speed of light in vacuum",
        publisher: "NIST",
        url: "https://physics.nist.gov/cgi-bin/cuu/Value?c",
        tier: 2,
      },
      { title: "Radiation Basics", publisher: "U.S. EPA", url: "https://www.epa.gov/radiation/radiation-basics", tier: 2 },
      {
        title: "Ultraviolet radiation (fact sheet)",
        publisher: "World Health Organization",
        url: "https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation",
        year: 2022,
        tier: 2,
      },
    ],
    fixes: [
      {
        find: "Mắt người chỉ tiến hóa để nhận biết một khoảng bước sóng rất nhỏ",
        replace: "Mắt người chỉ nhạy với một khoảng bước sóng rất nhỏ",
        why: "Nhân quả tiến hoá tự thêm. NASA chỉ nói mắt phát hiện được một phần nhỏ của phổ, không nói vì sao.",
      },
    ],
  },
  {
    slug: "ca-phe-va-tra-danh-thuc-nao-bo-nhu-the-nao",
    sources: [
      {
        title: "Adenosine, caffeine, and sleep–wake regulation: state of the science and perspectives",
        publisher: "Journal of Sleep Research 31:e13597 — Reichert, Deboer & Landolt",
        url: doi("10.1111/jsr.13597"),
        doi: "10.1111/jsr.13597",
        year: 2022,
        tier: 1,
      },
      {
        title: "Spilling the Beans: How Much Caffeine is Too Much?",
        publisher: "U.S. Food and Drug Administration",
        url: "https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much",
        tier: 2,
      },
      { title: "Caffeine", publisher: "MedlinePlus, U.S. National Library of Medicine", url: "https://medlineplus.gov/caffeine.html", tier: 2 },
      {
        title:
          "Effects of Tea (Camellia sinensis) or its Bioactive Compounds l-Theanine or l-Theanine plus Caffeine on Cognition, Sleep, and Mood in Healthy Participants: A Systematic Review and Meta-Analysis of Randomized Controlled Trials",
        publisher: "Nutrition Reviews — Payne, Aceves-Martins, Dubost, Greyling & de Roos",
        url: doi("10.1093/nutrit/nuaf054"),
        doi: "10.1093/nutrit/nuaf054",
        year: 2025,
        tier: 1,
      },
      {
        title: "Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed",
        publisher: "Journal of Clinical Sleep Medicine 9:1195–1200 — Drake, Roehrs, Shambroom & Roth",
        url: doi("10.5664/jcsm.3170"),
        doi: "10.5664/jcsm.3170",
        year: 2013,
        tier: 1,
      },
      {
        title: "Coffee and Tea Intake, Dementia Risk, and Cognitive Function",
        publisher: "JAMA 335:961 — Zhang, Liu, Li et al.",
        url: doi("10.1001/jama.2025.27259"),
        doi: "10.1001/jama.2025.27259",
        year: 2026,
        tier: 1,
      },
    ],
  },
  {
    slug: "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
    sources: [NIST_CAT_1996, MONROE_1996, NIST_DECOHERENCE_2000, NIST_QC, GISIN_2002],
  },
  {
    slug: "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
    sources: [
      NOBEL_2022_PRESS,
      NIST_QC,
      NIST_DECOHERENCE_2000,
      MONROE_1996,
      {
        title: "University Physics Volume 3, 7.6 The Quantum Tunneling of Particles through Potential Barriers",
        publisher: "OpenStax, Rice University",
        url: "https://openstax.org/books/university-physics-volume-3/pages/7-6-the-quantum-tunneling-of-particles-through-potential-barriers",
        tier: 3,
      },
    ],
    fixes: [
      {
        // Chỉ khớp ở ĐẦU thân bài: tiêu đề đã có ở <h1> của trang.
        find: /^# Cơ học lượng tử: Thế giới kỳ lạ phía sau vật chất\s*\n+/,
        replace: "",
        why: "Thân bài lặp lại nguyên tiêu đề thành một <h1> thứ hai.",
      },
    ],
  },
  {
    slug: "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
    sources: [
      NOBEL_2022_PRESS,
      {
        title: "Popular science background: How entanglement has become a powerful tool",
        publisher: "The Royal Swedish Academy of Sciences — NobelPrize.org",
        url: "https://www.nobelprize.org/prizes/physics/2022/popular-information/",
        year: 2022,
        tier: 2,
      },
      {
        title:
          "Introduction to Volume 15, The Collected Papers of Albert Einstein: The Berlin Years, Writings and Correspondence, June 1925–May 1927",
        publisher: "Princeton University Press / Einstein Papers Project — Buchwald, Illy, Kox et al. (arXiv:1803.10662)",
        url: "https://arxiv.org/abs/1803.10662",
        year: 2018,
        tier: 2,
      },
      {
        title: "Can Quantum-Mechanical Description of Physical Reality Be Considered Complete?",
        publisher: "Physical Review 47:777 — Einstein, Podolsky & Rosen",
        url: doi("10.1103/PhysRev.47.777"),
        doi: "10.1103/PhysRev.47.777",
        year: 1935,
        tier: 1,
      },
      {
        title: "On the Einstein Podolsky Rosen paradox",
        publisher: "Physics Physique Fizika 1:195 — J. S. Bell",
        url: doi("10.1103/PhysicsPhysiqueFizika.1.195"),
        doi: "10.1103/PhysicsPhysiqueFizika.1.195",
        year: 1964,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "Britannica mô tả câu nói năm 1926 của ông chính là sự phản ứng trước cách diễn giải xác suất của Max Born.",
        replace:
          "Câu nói ấy bắt nguồn từ một lá thư ông gửi Max Born năm 1926, giữa lúc ông phản đối cách Born diễn giải cơ học sóng theo xác suất: \"Dù sao đi nữa, tôi tin chắc rằng Ngài không chơi xúc xắc.\"",
        why: "Dẫn Britannica nhưng không đọc được trang Britannica nào nói vậy. Thay bằng nguồn gốc: Collected Papers vol. 15, Doc. 426.",
      },
    ],
  },
  {
    slug: "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
    sources: [
      NIST_QC,
      {
        title: "Quantum Sensing Explained",
        publisher: "NIST",
        url: "https://www.nist.gov/quantum-information-science/quantum-sensing-explained",
        tier: 2,
      },
      {
        title: "Magnetic Resonance Imaging (MRI)",
        publisher: "National Institute of Biomedical Imaging and Bioengineering, NIH",
        url: "https://www.nibib.nih.gov/science-education/science-topics/magnetic-resonance-imaging-mri",
        tier: 2,
      },
      NCSC_QKD,
      GISIN_2002,
    ],
  },
  {
    slug: "photon-hat-anh-sang-thuc-su-la-gi",
    sources: [
      { title: "The Standard Model", publisher: "CERN", url: "https://home.cern/science/physics/standard-model", tier: 2 },
      NASA_EMS_INTRO,
      NASA_EMS_ANATOMY,
      {
        title: "University Physics Volume 3, 6.2 Photoelectric Effect",
        publisher: "OpenStax, Rice University",
        url: "https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect",
        tier: 3,
      },
      {
        title: "University Physics Volume 3, 6.3 The Compton Effect",
        publisher: "OpenStax, Rice University",
        url: "https://openstax.org/books/university-physics-volume-3/pages/6-3-the-compton-effect",
        tier: 3,
      },
    ],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    title: {
      from: "Hành Trình Của Photon: Chuyến Đi 100.000 Năm Từ Lõi Mặt Trời Đến Trái Đất",
      to: "Hành Trình Của Photon: Hàng Chục Nghìn Năm Từ Lõi Mặt Trời Đến Trái Đất",
      why: "Ước lượng điểm không đặt vào tiêu đề (content-rules). NASA cho khoảng 10.000–170.000 năm, và chính thân bài dùng bậc độ lớn.",
    },
    sources: [
      NASA_SUN_FACTS,
      {
        title: "Technology Through Time #50: Ancient Sunlight",
        publisher: "NASA Sun-Earth Day",
        url: "https://spdf.gsfc.nasa.gov/pub/documents/old/websites/sunearthday.nasa.gov/2007/locations/ttt_sunlight.php",
        year: 2007,
        tier: 2,
      },
      {
        title: "On the photon diffusion time scale for the sun",
        publisher: "The Astrophysical Journal 401:759 — Mitalas & Sills",
        url: doi("10.1086/172103"),
        doi: "10.1086/172103",
        year: 1992,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "Một giá trị thường được NASA sử dụng là khoảng **170.000 năm** để năng lượng bức xạ đi từ vùng lõi tới phía trên vùng bức xạ.",
        replace:
          "Trang thông tin về Mặt Trời của NASA đưa ra con số khoảng **170.000 năm**, còn một tài liệu khác của NASA nói phần lớn các tính toán cho kết quả trong khoảng 10.000 đến 170.000 năm.",
        why: "NASA không nói 'tới phía trên vùng bức xạ' (trang ấy viết 'tới đỉnh vùng đối lưu'). Bỏ lộ trình, giữ con số và nêu dải NASA đưa ra.",
      },
    ],
  },
  {
    slug: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    sources: [
      { title: "Why Is the Sky Blue?", publisher: "NASA Space Place", url: "https://spaceplace.nasa.gov/blue-sky/en/", tier: 2 },
      {
        title: "Human color vision and the unsaturated blue color of the daytime sky",
        publisher: "American Journal of Physics 73:590 — G. S. Smith",
        url: doi("10.1119/1.1858479"),
        doi: "10.1119/1.1858479",
        year: 2005,
        tier: 1,
      },
      {
        title: "How Much Does a Cloud Weigh?",
        publisher: "U.S. Geological Survey",
        url: "https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh",
        tier: 2,
      },
      {
        title: "Messier 31 (The Andromeda Galaxy)",
        publisher: "NASA Science",
        url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/",
        tier: 2,
      },
      NASA_SUN_FACTS,
    ],
  },
  {
    slug: "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
    sources: [
      {
        title: "Review of Particle Physics, 30. Cosmic Rays (rev. 2019)",
        publisher: "Particle Data Group — Beatty, Matthews & Wakely",
        url: "https://pdg.lbl.gov/2020/reviews/rpp2020-rev-cosmic-rays.pdf",
        year: 2020,
        tier: 1,
      },
      {
        title: "Review of Particle Physics, 30. Cosmic Rays (rev. 2024)",
        publisher: "Particle Data Group — Alvarez-Muñiz, Cao, Katz, Mertsch & Spiering",
        url: "https://pdg.lbl.gov/2024/reviews/rpp2024-rev-cosmic-rays.pdf",
        year: 2024,
        tier: 1,
      },
      {
        title: "NAIRAS Ionizing Radiation Model: Extension from Atmosphere to Space (NASA/TP-20230006306)",
        publisher: "NASA Technical Reports Server",
        url: "https://ntrs.nasa.gov/citations/20230006306",
        year: 2023,
        tier: 2,
      },
    ],
    fixes: [
      {
        find: /[ \t]*【[^】]*】/g,
        replace: "",
        why: "Năm ký hiệu trích dẫn của công cụ soạn thảo (【1-03d267】…) lọt vào thân bài, hiện ra trên trang như chữ rác.",
      },
      {
        find: "Muon giống electron ở chỗ mang điện tích âm nhưng có khối lượng lớn hơn nhiều.",
        replace:
          "Muon giống electron ở chỗ mang một điện tích nguyên tố (ở mặt đất có cả muon âm lẫn phản hạt của nó là muon dương) nhưng có khối lượng lớn hơn nhiều.",
        why: "PDG: muon ở mặt đất gồm cả μ+ và μ−. Viết 'mang điện tích âm' là chọn một kể như tất cả.",
      },
    ],
  },
  {
    slug: "hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau",
    sources: [
      {
        title: "What are El Niño and La Niña?",
        publisher: "NOAA National Ocean Service",
        url: "https://oceanservice.noaa.gov/facts/ninonina.html",
        tier: 2,
      },
      {
        title: "World Meteorological Organization declares onset of El Niño conditions",
        publisher: "World Meteorological Organization",
        url: "https://wmo.int/news/media-centre/world-meteorological-organization-declares-onset-of-el-nino-conditions",
        year: 2023,
        tier: 2,
      },
      {
        title: "Viet Nam Drought and Saltwater Intrusion: Transitioning from Emergency to Recovery",
        publisher: "UNDP Viet Nam",
        url: "https://www.undp.org/sites/g/files/zskgke326/files/migration/vn/Recovery-draft-Sep-2016_final.pdf",
        year: 2016,
        tier: 2,
      },
    ],
  },
  {
    slug: "nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh",
    sources: [
      {
        title: "Global Warming of 1.5°C — Summary for Policymakers",
        publisher: "IPCC",
        url: "https://www.ipcc.ch/site/assets/uploads/sites/2/2022/06/SPM_version_report_LR.pdf",
        year: 2018,
        tier: 2,
      },
      {
        title: "Climate Change 2021: The Physical Science Basis — Summary for Policymakers",
        publisher: "IPCC Working Group I",
        url: "https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_SPM.pdf",
        year: 2021,
        tier: 2,
      },
      {
        title: "Quick facts about sea ice",
        publisher: "National Snow and Ice Data Center",
        url: "https://nsidc.org/learn/parts-cryosphere/sea-ice/quick-facts-about-sea-ice",
        tier: 2,
      },
    ],
    fixes: [
      {
        find: "**Khoảng một lần mỗi thập kỷ.**",
        replace: "**Ít nhất một lần mỗi thập kỷ.**",
        why: "IPCC SR1.5 B.4.1: 'at least one per decade'. 'Khoảng' làm mất cận dưới của nguồn.",
      },
      {
        find: "được dự báo có thể suy giảm khoảng:",
        replace: "được dự báo có thể suy giảm thêm khoảng:",
        why: "IPCC: 'decline by a further 70–90%'. Bỏ chữ 'thêm' là tính từ mốc sai.",
      },
    ],
  },
  {
    slug: "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
    sources: [
      { title: "Mars: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/mars/facts/", tier: 2 },
      {
        title: "Mars Fact Sheet",
        publisher: "NASA Goddard Space Flight Center (NSSDCA)",
        url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
        tier: 2,
      },
      { title: "Titan: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/saturn/moons/titan/facts/", tier: 2 },
      {
        title: "NASA's Juno Measures Thickness of Europa's Ice Shell",
        publisher: "NASA",
        url: "https://www.nasa.gov/missions/juno/nasas-juno-measures-thickness-of-europas-ice-shell/",
        year: 2026,
        tier: 2,
      },
      { title: "Enceladus", publisher: "NASA Science", url: "https://science.nasa.gov/saturn/moons/enceladus/", tier: 2 },
      { title: "Moon Water and Ices", publisher: "NASA Science", url: "https://science.nasa.gov/moon/moon-water-and-ices/", tier: 2 },
    ],
    fixes: [
      {
        find: "Áp suất bề mặt thậm chí còn cao hơn Trái Đất một chút.",
        replace: "Áp suất bề mặt còn cao hơn Trái Đất khoảng 60%.",
        why: "NASA: 'about 60 percent greater than on Earth'. 'Một chút' là sai bậc.",
      },
      {
        find: "và tổng lớp vỏ băng có thể còn dày hơn.",
        replace:
          "Nếu bên dưới còn một lớp băng ấm hơn đang đối lưu, tổng lớp vỏ sẽ dày hơn nữa; ngược lại, nếu băng lẫn một lượng muối vừa phải, ước tính này giảm khoảng 5 km.",
        why: "NASA nêu HAI điều kiện, đẩy con số theo hai chiều. Bài chỉ giữ chiều dày thêm.",
      },
    ],
  },
  {
    slug: "runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan",
    sources: [
      {
        title: "A Systematic Review and Meta-Analysis on the Effects of Exercise on the Endocannabinoid System",
        publisher: "Cannabis and Cannabinoid Research 7:388–408 — Desai, Borg, Cuttler et al.",
        url: doi("10.1089/can.2021.0113"),
        doi: "10.1089/can.2021.0113",
        year: 2022,
        tier: 1,
      },
      {
        title: "Exercise-induced euphoria and anxiolysis do not depend on endogenous opioids in humans",
        publisher: "Psychoneuroendocrinology 126:105173 — Siebers, Biedermann, Bindila, Lutz & Fuss",
        url: doi("10.1016/j.psyneuen.2021.105173"),
        doi: "10.1016/j.psyneuen.2021.105173",
        year: 2021,
        tier: 1,
      },
      {
        title: "A runner's high depends on cannabinoid receptors in mice",
        publisher: "PNAS 112:13105–13108 — Fuss, Steinle, Bindila et al.",
        url: doi("10.1073/pnas.1514996112"),
        doi: "10.1073/pnas.1514996112",
        year: 2015,
        tier: 1,
      },
      {
        title: "Exercise-induced endocannabinoid signaling is modulated by intensity",
        publisher: "European Journal of Applied Physiology 113:869–875 — Raichlen, Foster, Seillier, Giuffrida & Gerdeman",
        url: doi("10.1007/s00421-012-2495-5"),
        doi: "10.1007/s00421-012-2495-5",
        year: 2013,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "Một tổng quan hệ thống phát hiện **14 trong 17 nghiên cứu** về vận động cấp tính ghi nhận sự gia tăng này.",
        replace:
          "Một tổng quan hệ thống kèm phân tích gộp năm 2022 ghi nhận khoảng **74%** số mẫu có đo anandamide cho thấy chất này tăng sau vận động cấp tính.",
        why: "Không truy được tổng quan nào ra '14/17'. Desai et al. 2022: 74,4% số mẫu đo AEA tăng sau vận động cấp tính.",
      },
      {
        find: "gặp một vấn đề: endorphin ngoại vi không dễ vượt qua **hàng rào máu não**.",
        replace:
          "không còn đứng một mình: chạy bộ làm tăng trong máu cả β-endorphin lẫn anandamide, và thí nghiệm trên chuột cho thấy chính thụ thể cannabinoid mới trung gian cho hiệu ứng giảm lo âu và giảm đau sau khi chạy.",
        why: "Không mở được toàn văn nào nói câu hàng rào máu não. Thay bằng điều abstract của Fuss 2015 (PNAS) nói thẳng.",
      },
    ],
  },
  {
    slug: "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
    sources: [
      {
        title:
          "Crew factors in flight operations 9: Effects of planned cockpit rest on crew performance and alertness in long-haul operations",
        publisher: "NASA Ames Research Center — Rosekind et al. (NASA Technical Reports Server)",
        url: "https://ntrs.nasa.gov/citations/19950006379",
        tier: 2,
      },
      {
        title: "A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recuperative?",
        publisher: "Sleep 29:831–840 — Brooks & Lack",
        url: doi("10.1093/sleep/29.6.831"),
        doi: "10.1093/sleep/29.6.831",
        year: 2006,
        tier: 1,
      },
      {
        title: "Sleep inertia",
        publisher: "Sleep Medicine Reviews 4:341–353 — Tassi & Muzet",
        url: doi("10.1053/smrv.2000.0098"),
        doi: "10.1053/smrv.2000.0098",
        year: 2000,
        tier: 1,
      },
      {
        title: "The two-process model of sleep regulation: a reappraisal",
        publisher: "Journal of Sleep Research 25:131–143 — Borbély, Daan, Wirz-Justice & Deboer",
        url: doi("10.1111/jsr.12371"),
        doi: "10.1111/jsr.12371",
        year: 2016,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "cải thiện khoảng **34% hiệu suất** và tăng tới **54% mức tỉnh táo** so với nhóm không ngủ.",
        replace:
          "có hiệu suất và mức tỉnh táo sinh lý tốt hơn nhóm không nghỉ, và lợi ích kéo dài tới cả giai đoạn hạ độ cao và hạ cánh.",
        why: "Tóm tắt báo cáo NASA gốc (NTRS 19950006379) không nêu 34%/54%, và không nguồn nào đọc được có hai con số ấy. Giữ đúng điều báo cáo nói.",
      },
    ],
  },
  {
    slug: "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
    sources: [
      {
        title: "Sleep Deprivation and Deficiency: How Sleep Affects Your Health",
        publisher: "National Heart, Lung, and Blood Institute, NIH",
        url: "https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects",
        tier: 2,
      },
      { title: "About Sleep", publisher: "U.S. Centers for Disease Control and Prevention", url: "https://www.cdc.gov/sleep/about/index.html", tier: 2 },
      {
        title: "β-Amyloid accumulation in the human brain after one night of sleep deprivation",
        publisher: "PNAS 115:4483–4488 — Shokri-Kojori, Wang, Wiers et al.",
        url: doi("10.1073/pnas.1721694115"),
        doi: "10.1073/pnas.1721694115",
        year: 2018,
        tier: 1,
      },
      {
        title: "Sleep drives metabolite clearance from the adult brain",
        publisher: "Science 342:373–377 — Xie, Kang, Xu et al.",
        url: doi("10.1126/science.1241224"),
        doi: "10.1126/science.1241224",
        year: 2013,
        tier: 1,
      },
      {
        title: "The hyperarousal model of insomnia: a review of the concept and its evidence",
        publisher: "Sleep Medicine Reviews 14:19–31 — Riemann, Spiegelhalder, Feige et al.",
        url: doi("10.1016/j.smrv.2009.04.002"),
        doi: "10.1016/j.smrv.2009.04.002",
        year: 2010,
        tier: 1,
      },
      {
        title:
          "Ad libitum Weekend Recovery Sleep Fails to Prevent Metabolic Dysregulation during a Repeating Pattern of Insufficient Sleep and Weekend Recovery Sleep",
        publisher: "Current Biology 29:957–967 — Depner, Melanson, Eckel et al.",
        url: doi("10.1016/j.cub.2019.01.069"),
        doi: "10.1016/j.cub.2019.01.069",
        year: 2019,
        tier: 1,
      },
    ],
  },
  {
    slug: "dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi",
    sources: [
      {
        title: "The migrating motor complex: control mechanisms and its role in health and disease",
        publisher: "Nature Reviews Gastroenterology & Hepatology 9:271–285 — Deloose, Janssen, Depoortere & Tack",
        url: doi("10.1038/nrgastro.2012.57"),
        doi: "10.1038/nrgastro.2012.57",
        year: 2012,
        tier: 1,
      },
      {
        title: "Motilin-induced gastric contractions signal hunger in man",
        publisher: "Gut 65:214–224 — Tack, Deloose, Ang et al.",
        url: doi("10.1136/gutjnl-2014-308472"),
        doi: "10.1136/gutjnl-2014-308472",
        year: 2016,
        tier: 1,
      },
      {
        title: "A preprandial rise in plasma ghrelin levels suggests a role in meal initiation in humans",
        publisher: "Diabetes 50:1714–1719 — Cummings, Purnell, Frayo et al.",
        url: doi("10.2337/diabetes.50.8.1714"),
        doi: "10.2337/diabetes.50.8.1714",
        year: 2001,
        tier: 1,
      },
      {
        title: "Symptoms & Causes of Peptic Ulcers (Stomach or Duodenal Ulcers)",
        publisher: "National Institute of Diabetes and Digestive and Kidney Diseases, NIH",
        url: "https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/symptoms-causes",
        tier: 2,
      },
    ],
  },
];

function count(text: string, find: string | RegExp) {
  if (typeof find === "string") return text.split(find).length - 1;
  const re = new RegExp(find.source, find.flags.includes("g") ? find.flags : find.flags + "g");
  return [...text.matchAll(re)].length;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  const accessedAt = new Date("2026-09-24T00:00:00Z");
  let addedSources = 0;
  let fixedArticles = 0;

  for (const plan of PLANS) {
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: { id: true, title: true, content: true, status: true, sources: { select: { url: true, doi: true } } },
    });
    console.log(`\n${plan.slug}`);
    if (!article) throw new Error(`Không có bài ${plan.slug}`);

    const have = new Set(article.sources.flatMap((s) => [s.url, s.doi].filter(Boolean) as string[]));
    const fresh = plan.sources.filter((s) => !have.has(s.url) && !(s.doi && have.has(s.doi)));
    const t12 = plan.sources.filter((s) => s.tier <= 2).length;
    console.log(`   nguồn: +${fresh.length} (đã có ${plan.sources.length - fresh.length}); bậc 1–2 trong kế hoạch: ${t12}`);
    if (t12 < 3) throw new Error(`${plan.slug}: dưới 3 nguồn bậc 1–2`);

    let content = article.content;
    let title = article.title;
    for (const fix of plan.fixes ?? []) {
      const n = count(content, fix.find);
      const global = fix.find instanceof RegExp && fix.find.flags.includes("g");
      if (n === 0) {
        console.log(`   sửa: đã áp dụng hoặc không còn — ${fix.why.slice(0, 60)}…`);
        continue;
      }
      if (n !== 1 && !global) throw new Error(`${plan.slug}: cụm neo khớp ${n} chỗ, cần đúng 1`);
      content = content.replace(fix.find, fix.replace);
      console.log(`   sửa (${n}): ${fix.why}`);
    }
    if (plan.title && title === plan.title.from) {
      title = plan.title.to;
      console.log(`   tiêu đề: ${plan.title.to}`);
    }

    const dirty = content !== article.content || title !== article.title;
    if (dirty) fixedArticles += 1;
    addedSources += fresh.length;
    if (!write) continue;

    await prisma.$transaction([
      ...(dirty
        ? [
            prisma.revision.create({
              data: {
                articleId: article.id,
                title: article.title,
                content: article.content,
                note: "Trước đính chính theo nguồn, đợt bổ sung nguồn 2026-09-24",
              },
            }),
            prisma.article.update({ where: { id: article.id }, data: { content, title } }),
          ]
        : []),
      ...fresh.map((s) =>
        prisma.source.create({
          data: {
            articleId: article.id,
            title: s.title,
            publisher: s.publisher,
            url: s.url,
            doi: s.doi ?? null,
            year: s.year ?? null,
            tier: s.tier,
            accessedAt,
          },
        }),
      ),
    ]);
    console.log("   ĐÃ GHI");
  }

  console.log(
    `\n${addedSources} nguồn, ${fixedArticles} bài đính chính.` + (write ? "" : " Chưa ghi gì."),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
