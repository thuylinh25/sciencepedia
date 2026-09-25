import { PrismaClient } from "@prisma/client";

/**
 * Bổ sung nguồn cho các bài đã xuất bản còn dưới 3 nguồn bậc 1–2, kèm đính
 * chính những câu nguồn không đỡ được.
 *
 *   npx tsx --env-file-if-exists=.env scripts/add-sources-2026-09-25.ts           # chạy khô
 *   npx tsx --env-file-if-exists=.env scripts/add-sources-2026-09-25.ts --write   # ghi
 *
 * Cùng phép làm với `add-sources-2026-09-24.ts`: mỗi nguồn dưới đây đã được
 * MỞ RA ĐỌC (trang, hoặc abstract qua Europe PMC / OpenAlex / trang tạp chí),
 * và mọi DOI đã đối chiếu Crossref. Nguồn chỉ tìm được tên mà không đọc được
 * nội dung thì KHÔNG vào danh sách.
 *
 * ## Khác đợt 24/09: sửa cả bản tiếng Anh
 *
 * Đợt trước chỉ sửa `content`. Nhưng bài có `contentEn` mang đúng câu sai ấy
 * bằng tiếng Anh, và để nguyên thì bản EN tiếp tục nói điều nguồn không đỡ.
 * Nên mỗi đính chính có thể kèm `en`. Revision chỉ chụp `content` (bảng không
 * có cột EN), nên bản EN cũ ghi nguyên văn vào `why` của từng mục — đó là chỗ
 * duy nhất còn giữ nó.
 *
 * ## Lỗi Crossref bắt được trong lượt này
 *
 * DOI của Simcock & Hayne 2002 nhớ theo trí nhớ là `…00438` — Crossref trả về
 * một bài khác cùng số tạp chí (chất lượng nhà trẻ, NICHD). DOI đúng là
 * `…00442`. Josselyn & Frankland 2012 cũng vậy. Đây là đúng lỗi mà
 * `check-citations.ts` được viết ra để bắt.
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
type Fix = { find: string | RegExp; replace: string; en?: [find: string, replace: string]; why: string };
type Plan = { slug: string; sources: Src[]; fixes?: Fix[] };

const doi = (d: string) => `https://doi.org/${d}`;

/* ---- Nguồn dùng lại ở nhiều bài ---- */
const NSSDC: Src = {
  title: "Planetary Fact Sheet",
  publisher: "NASA Goddard Space Flight Center (NSSDCA)",
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  tier: 2,
};
const CHOU_2010: Src = {
  title: "Optical Clocks and Relativity",
  publisher: "Science",
  url: doi("10.1126/science.1192720"),
  doi: "10.1126/science.1192720",
  year: 2010,
  tier: 1,
};
const ASHBY_2003: Src = {
  title: "Relativity in the Global Positioning System",
  publisher: "Living Reviews in Relativity",
  url: doi("10.12942/lrr-2003-1"),
  doi: "10.12942/lrr-2003-1",
  year: 2003,
  tier: 1,
};
const HELLED_2020: Src = {
  title: "Uranus and Neptune: Origin, Evolution and Internal Structure",
  publisher: "Space Science Reviews",
  url: doi("10.1007/s11214-020-00660-3"),
  doi: "10.1007/s11214-020-00660-3",
  year: 2020,
  tier: 1,
};

const BOONSTRA_2015: Src = {
  title: "Neurotransmitters as food supplements: the effects of GABA on brain and behavior",
  publisher: "Frontiers in Psychology",
  url: doi("10.3389/fpsyg.2015.01520"),
  doi: "10.3389/fpsyg.2015.01520",
  year: 2015,
  tier: 1,
};
const RUDOLPH_2011: Src = {
  title: "Beyond classical benzodiazepines: novel therapeutic potential of GABAA receptor subtypes",
  publisher: "Nature Reviews Drug Discovery",
  url: doi("10.1038/nrd3502"),
  doi: "10.1038/nrd3502",
  year: 2011,
  tier: 1,
};
const SCHULTZ_1997: Src = {
  title: "A Neural Substrate of Prediction and Reward",
  publisher: "Science",
  url: doi("10.1126/science.275.5306.1593"),
  doi: "10.1126/science.275.5306.1593",
  year: 1997,
  tier: 1,
};

const NASA_VISIBLE: Src = {
  title: "Visible Light",
  publisher: "NASA Science",
  url: "https://science.nasa.gov/ems/09_visiblelight/",
  tier: 2,
};

const NASA_NSN_ZODIAC: Src = {
  title: "Where are the Planets? (Solar System Star Maps, background: Constellations of the Zodiac)",
  publisher: "NASA JPL Night Sky Network / Astronomical Society of the Pacific",
  url: "https://nightsky.jpl.nasa.gov/media/documents/resources/SolSysStarMaps2.pdf",
  year: 2008,
  tier: 2,
};
const JPL_BASICS_CH4: Src = {
  title: "Basics of Space Flight, Chapter 4: Trajectories",
  publisher: "NASA Jet Propulsion Laboratory",
  url: "https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/",
  tier: 2,
};
const CULLEN_2012: Src = {
  title: "The vestibular system: multimodal integration and encoding of self-motion for motor control",
  publisher: "Trends in Neurosciences",
  url: doi("10.1016/j.tins.2011.12.001"),
  doi: "10.1016/j.tins.2011.12.001",
  year: 2012,
  tier: 1,
};
const NASA_NEWTON: Src = {
  title: "Newton's Laws of Motion",
  publisher: "NASA Glenn Research Center",
  url: "https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/newtons-laws-of-motion/",
  tier: 2,
};

const CONNELLY_2012: Src = {
  title: "The Absolute Chronology and Thermal Processing of Solids in the Solar Protoplanetary Disk",
  publisher: "Science",
  url: doi("10.1126/science.1226919"),
  doi: "10.1126/science.1226919",
  year: 2012,
  tier: 1,
};
const RIESS_1998: Src = {
  title: "Observational Evidence from Supernovae for an Accelerating Universe and a Cosmological Constant",
  publisher: "The Astronomical Journal",
  url: doi("10.1086/300499"),
  doi: "10.1086/300499",
  year: 1998,
  tier: 1,
};
const NASA_DARK_ENERGY: Src = { title: "Dark Energy", publisher: "NASA Science", url: "https://science.nasa.gov/dark-energy/", tier: 2 };
const B2FH_1957: Src = {
  title: "Synthesis of the Elements in Stars",
  publisher: "Reviews of Modern Physics",
  url: doi("10.1103/RevModPhys.29.547"),
  doi: "10.1103/RevModPhys.29.547",
  year: 1957,
  tier: 1,
};

const PLANS: Plan[] = [
  /* ================= Ba bài xuất bản 24/09 ================= */
  {
    slug: "thoi-gian-duoi-goc-nhin-luong-tu-vu-tru-co-thuc-su-troi",
    sources: [
      {
        title: "Evolution without evolution: Dynamics described by stationary observables",
        publisher: "Physical Review D",
        url: doi("10.1103/PhysRevD.27.2885"),
        doi: "10.1103/PhysRevD.27.2885",
        year: 1983,
        tier: 1,
      },
      {
        title: "Quantum Theory of Gravity. I. The Canonical Theory",
        publisher: "Physical Review",
        url: doi("10.1103/PhysRev.160.1113"),
        doi: "10.1103/PhysRev.160.1113",
        year: 1967,
        tier: 1,
      },
      {
        title: "SI base unit: second (s)",
        publisher: "BIPM",
        url: "https://www.bipm.org/en/si-base-units/second",
        tier: 2,
      },
      CHOU_2010,
      ASHBY_2003,
      {
        title: "University Physics Volume 2, §4.6 Entropy",
        publisher: "OpenStax, Rice University",
        url: "https://openstax.org/books/university-physics-volume-2/pages/4-6-entropy",
        tier: 3,
      },
    ],
    fixes: [
      {
        find: "là gì.\n``\n",
        replace: "là gì.\n",
        why: "Hai dấu backtick trần rò từ lượt soạn bài, in ra màn hình như ký tự rác cuối bài.",
      },
    ],
  },
  {
    slug: "vi-sao-cang-gan-toc-do-anh-sang-thoi-gian-troi-cang-cham",
    sources: [
      {
        title: "CODATA Value: speed of light in vacuum",
        publisher: "NIST",
        url: "https://physics.nist.gov/cgi-bin/cuu/Value?c",
        tier: 2,
      },
      {
        title: "Measurements of relativistic time dilatation for positive and negative muons in a circular orbit",
        publisher: "Nature",
        url: doi("10.1038/268301a0"),
        doi: "10.1038/268301a0",
        year: 1977,
        tier: 1,
      },
      CHOU_2010,
      ASHBY_2003,
    ],
  },
  {
    slug: "vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi",
    sources: [
      {
        title: "Hippocampal Neurogenesis Regulates Forgetting During Adulthood and Infancy",
        publisher: "Science",
        url: doi("10.1126/science.1248903"),
        doi: "10.1126/science.1248903",
        year: 2014,
        tier: 1,
      },
      {
        title: "Recovery of “Lost” Infant Memories in Mice",
        publisher: "Current Biology",
        url: doi("10.1016/j.cub.2018.05.059"),
        doi: "10.1016/j.cub.2018.05.059",
        year: 2018,
        tier: 1,
      },
      {
        title: "Breaking the Barrier? Children Fail to Translate Their Preverbal Memories into Language",
        publisher: "Psychological Science",
        url: doi("10.1111/1467-9280.00442"),
        doi: "10.1111/1467-9280.00442",
        year: 2002,
        tier: 1,
      },
      {
        title: "Infantile amnesia: A neurogenic hypothesis",
        publisher: "Learning & Memory",
        url: doi("10.1101/lm.021311.110"),
        doi: "10.1101/lm.021311.110",
        year: 2012,
        tier: 1,
      },
      {
        title: "Hippocampal encoding of memories in human infants",
        publisher: "Science",
        url: doi("10.1126/science.adt7570"),
        doi: "10.1126/science.adt7570",
        year: 2025,
        tier: 1,
      },
    ],
  },

  /* ================= Hệ Mặt Trời và kính Webb ================= */
  {
    slug: "sao-thien-vuong-hanh-tinh-lan-nghieng-tren-quy-dao",
    sources: [
      NSSDC,
      { title: "Uranus: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/uranus/facts/", tier: 2 },
      HELLED_2020,
    ],
    fixes: [
      {
        find: "mỗi cực có 42 năm Trái Đất được chiếu sáng liên tục, rồi 42 năm chìm trong bóng tối.",
        replace:
          "suốt gần một phần tư mỗi năm Thiên Vương (một năm ở đó dài khoảng 84 năm Trái Đất), Mặt Trời chiếu gần như thẳng xuống một cực, còn nửa kia hành tinh chìm trong mùa đông tối kéo dài 21 năm.",
        en: [
          "each pole experiences 42 Earth years of continuous sunlight, followed by 42 years of darkness.",
          "for nearly a quarter of each Uranian year (a year there lasts about 84 Earth years), the Sun shines almost directly over one pole, while the other half of the planet is plunged into a dark winter lasting 21 years.",
        ],
        why: "NASA (Uranus: Facts) nói Mặt Trời chiếu thẳng mỗi cực gần một phần tư năm, nửa kia chịu mùa đông tối 21 năm. Con số 42 năm không có trong nguồn nào đã đọc. EN cũ: \"each pole experiences 42 Earth years of continuous sunlight, followed by 42 years of darkness.\"",
      },
    ],
  },
  {
    slug: "sao-hai-vuong-hanh-tinh-tim-ra-bang-toan-hoc",
    sources: [
      NSSDC,
      { title: "Neptune: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/neptune/neptune-facts/", tier: 2 },
      { title: "Triton", publisher: "NASA Science", url: "https://science.nasa.gov/neptune/moons/triton/", tier: 2 },
      {
        title: "The albedo, effective temperature, and energy balance of Neptune, as determined from Voyager data",
        publisher: "Journal of Geophysical Research: Space Physics",
        url: doi("10.1029/91JA01087"),
        doi: "10.1029/91JA01087",
        year: 1991,
        tier: 1,
      },
      HELLED_2020,
    ],
    fixes: [
      {
        find: "Năm 1846, Johann Galle hướng kính về toạ độ Le Verrier đưa ra và tìm thấy Sao Hải Vương chỉ trong vòng một giờ, lệch chưa tới 1 độ.",
        replace:
          "Năm 1846, Le Verrier gửi kết quả cho Johann Galle ở Đài thiên văn Berlin, và Galle tìm thấy Sao Hải Vương ngay trong đêm tìm kiếm đầu tiên.",
        en: [
          "In 1846, Johann Galle pointed his telescope toward the coordinates provided by Le Verrier and found Neptune within an hour, less than 1 degree off.",
          "In 1846, Le Verrier sent his prediction to Johann Galle at the Berlin Observatory, and Galle found Neptune on his first night of searching.",
        ],
        why: "NASA (Neptune: Facts): Galle tìm thấy \"on his first night of searching\". 'Trong vòng một giờ' và 'lệch chưa tới 1 độ' không có trong nguồn đã đọc. EN cũ: \"…found Neptune within an hour, less than 1 degree off.\"",
      },
      {
        find: "— dấu hiệu rõ ràng rằng nó là một thiên thể [[vành đai Kuiper]] bị bắt giữ. Triton có hoạt động phun trào nitơ và đang dần xoắn vào trong; trong vài tỉ năm nữa nó sẽ bị lực thuỷ triều xé thành một hệ vành đai mới.",
        replace:
          "— vì thế các nhà khoa học cho rằng nó là một thiên thể [[vành đai Kuiper]] bị Sao Hải Vương bắt giữ. Khi bay ngang năm 1989, Voyager 2 còn thấy trên Triton những mạch phun đang hoạt động, khiến nó là một trong số ít vệ tinh còn hoạt động địa chất trong Hệ Mặt Trời.",
        en: [
          "— a clear sign that it is a captured [[vanh-dai-kuiper|Kuiper Belt]] object. Triton exhibits nitrogen geyser activity and is slowly spiraling inward; in a few billion years, it will be torn apart by tidal forces into a new ring system.",
          "— which is why scientists think it is a [[vanh-dai-kuiper|Kuiper Belt]] object captured by Neptune. During its 1989 flyby, Voyager 2 also found active geysers on Triton, making it one of the few geologically active moons in the Solar System.",
        ],
        why: "NASA (Triton): 'Scientists think Triton is a Kuiper Belt Object captured…' — là suy luận, không phải 'dấu hiệu rõ ràng'; Voyager 2 thấy mạch phun hoạt động. Câu Triton xoắn vào trong và bị xé thành vành đai không tìm được nguồn đọc được, nên bỏ. EN cũ: \"— a clear sign that it is a captured Kuiper Belt object. Triton exhibits nitrogen geyser activity and is slowly spiraling inward; in a few billion years, it will be torn apart by tidal forces into a new ring system.\"",
      },
    ],
  },
  {
    slug: "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
    sources: [
      NSSDC,
      { title: "Mercury: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/mercury/facts/", tier: 2 },
      {
        title: "Rotational Period of the Planet Mercury",
        publisher: "Nature",
        url: doi("10.1038/208575a0"),
        doi: "10.1038/208575a0",
        year: 1965,
        tier: 1,
      },
      {
        title: "Mercury Radar Imaging: Evidence for Polar Ice",
        publisher: "Science",
        url: doi("10.1126/science.258.5082.635"),
        doi: "10.1126/science.258.5082.635",
        year: 1992,
        tier: 1,
      },
      {
        title: "Radioactive Elements on Mercury’s Surface from MESSENGER: Implications for the Planet’s Formation and Evolution",
        publisher: "Science",
        url: doi("10.1126/science.1211576"),
        doi: "10.1126/science.1211576",
        year: 2011,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "Giả thuyết được ủng hộ nhiều nhất cho rằng một va chạm khổng lồ thời sơ khai đã bóc đi phần lớn lớp phủ đá, để lại một hành tinh gần như toàn lõi.",
        replace:
          "Từ lâu, một giả thuyết cho rằng một va chạm khổng lồ thời sơ khai đã bóc đi phần lớn lớp phủ đá, để lại một hành tinh gần như toàn lõi. Nhưng tàu MESSENGER đo được trên bề mặt lượng kali — một nguyên tố dễ bay hơi — không khớp với các mô hình đòi hành tinh bị nung cực nóng lúc hình thành, nên nguồn gốc của lõi khổng lồ này vẫn là câu hỏi mở.",
        en: [
          "The most widely supported hypothesis suggests that a massive collision in the early stages of the solar system stripped away most of its rocky mantle, leaving behind a planet that is almost entirely core.",
          "A long-standing hypothesis holds that a massive collision in the early Solar System stripped away most of its rocky mantle, leaving a planet that is almost entirely core. But the MESSENGER spacecraft measured an abundance of potassium — a volatile element — on the surface that is inconsistent with formation models requiring extreme heating, so the origin of this huge core is still an open question.",
        ],
        why: "Peplowski et al. 2011 (Science): tỉ lệ K/Th/U đo bởi MESSENGER 'inconsistent with physical models for the formation of Mercury requiring extreme heating'. 'Được ủng hộ nhiều nhất' là mô tả của trước 2011. EN cũ: \"The most widely supported hypothesis suggests that a massive collision … leaving behind a planet that is almost entirely core.\"",
      },
    ],
  },
  {
    slug: "sao-tho-vanh-dai-mong-manh-va-ve-tinh-co-dai-duong",
    sources: [
      NSSDC,
      { title: "Saturn: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/saturn/facts/", tier: 2 },
      { title: "Enceladus", publisher: "NASA Science", url: "https://science.nasa.gov/saturn/moons/enceladus/", tier: 2 },
      { title: "Titan", publisher: "NASA Science", url: "https://science.nasa.gov/saturn/moons/titan/", tier: 2 },
      {
        title: "Micrometeoroid infall onto Saturn’s rings constrains their age to no more than a few hundred million years",
        publisher: "Science Advances",
        url: doi("10.1126/sciadv.adf8537"),
        doi: "10.1126/sciadv.adf8537",
        year: 2023,
        tier: 1,
      },
    ],
  },
  {
    slug: "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh",
    sources: [
      { title: "Webb Fact Sheet", publisher: "NASA Science", url: "https://science.nasa.gov/mission/webb/fact-sheet/", tier: 2 },
      { title: "Webb Deployment", publisher: "NASA Science", url: "https://science.nasa.gov/mission/webb/deployment/", tier: 2 },
      {
        title: "The Science Performance of JWST as Characterized in Commissioning",
        publisher: "Publications of the Astronomical Society of the Pacific",
        url: doi("10.1088/1538-3873/acb293"),
        doi: "10.1088/1538-3873/acb293",
        year: 2023,
        tier: 1,
      },
      {
        title: "Spectroscopic confirmation of two luminous galaxies at a redshift of 14",
        publisher: "Nature",
        url: doi("10.1038/s41586-024-07860-9"),
        doi: "10.1038/s41586-024-07860-9",
        year: 2024,
        tier: 1,
      },
      {
        title: "Identification of carbon dioxide in an exoplanet atmosphere",
        publisher: "Nature",
        url: doi("10.1038/s41586-022-05269-w"),
        doi: "10.1038/s41586-022-05269-w",
        year: 2023,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "bao gồm 344 điểm hỏng đơn lẻ",
        replace: "bao gồm hơn 300 điểm hỏng đơn lẻ",
        en: ["including 344 single points of failure", "including more than 300 single points of failure"],
        why: "NASA (Webb Deployment): 'over 300 possible single points of failure'. Con số 344 không có trong nguồn đã đọc. EN cũ: \"including 344 single points of failure\".",
      },
    ],
  },
  {
    slug: "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
    sources: [
      { title: "Earth: Facts", publisher: "NASA Science", url: "https://science.nasa.gov/earth/facts/", tier: 2 },
      {
        title: "Stabilization of the Earth's obliquity by the Moon",
        publisher: "Nature",
        url: doi("10.1038/361615a0"),
        doi: "10.1038/361615a0",
        year: 1993,
        tier: 1,
      },
      {
        title: "A negative feedback mechanism for the long-term stabilization of Earth's surface temperature",
        publisher: "Journal of Geophysical Research: Oceans",
        url: doi("10.1029/JC086iC10p09776"),
        doi: "10.1029/JC086iC10p09776",
        year: 1981,
        tier: 1,
      },
      {
        title: "The rise of oxygen in Earth’s early ocean and atmosphere",
        publisher: "Nature",
        url: doi("10.1038/nature13068"),
        doi: "10.1038/nature13068",
        year: 2014,
        tier: 1,
      },
    ],
  },
  /* ================= Não bộ ================= */
  {
    slug: "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
    sources: [
      BOONSTRA_2015,
      RUDOLPH_2011,
      {
        title: "Hooked on benzodiazepines: GABAA receptor subtypes and addiction",
        publisher: "Trends in Neurosciences",
        url: doi("10.1016/j.tins.2011.01.004"),
        doi: "10.1016/j.tins.2011.01.004",
        year: 2011,
        tier: 1,
      },
    ],
  },
  {
    slug: "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
    sources: [
      SCHULTZ_1997,
      {
        title: "Discrete Coding of Reward Probability and Uncertainty by Dopamine Neurons",
        publisher: "Science",
        url: doi("10.1126/science.1077349"),
        doi: "10.1126/science.1077349",
        year: 2003,
        tier: 1,
      },
      {
        title: "Positive affect: nature and brain bases of liking and wanting",
        publisher: "Current Opinion in Behavioral Sciences",
        url: doi("10.1016/j.cobeha.2021.02.013"),
        doi: "10.1016/j.cobeha.2021.02.013",
        year: 2021,
        tier: 1,
      },
    ],
  },
  {
    slug: "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    sources: [
      SCHULTZ_1997,
      {
        title: "The serotonin theory of depression: a systematic umbrella review of the evidence",
        publisher: "Molecular Psychiatry",
        url: doi("10.1038/s41380-022-01661-0"),
        doi: "10.1038/s41380-022-01661-0",
        year: 2022,
        tier: 1,
      },
      {
        title: "Social effects of oxytocin in humans: context and person matter",
        publisher: "Trends in Cognitive Sciences",
        url: doi("10.1016/j.tics.2011.05.002"),
        doi: "10.1016/j.tics.2011.05.002",
        year: 2011,
        tier: 1,
      },
      {
        title: "LTP and LTD: an embarrassment of riches",
        publisher: "Neuron",
        url: doi("10.1016/j.neuron.2004.09.012"),
        doi: "10.1016/j.neuron.2004.09.012",
        year: 2004,
        tier: 1,
      },
      RUDOLPH_2011,
    ],
  },
  {
    slug: "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
    sources: [
      {
        title: "General anaesthesia: from molecular targets to neuronal pathways of sleep and arousal",
        publisher: "Nature Reviews Neuroscience",
        url: doi("10.1038/nrn2372"),
        doi: "10.1038/nrn2372",
        year: 2008,
        tier: 1,
      },
      {
        title: "Anesthesia and the neurobiology of consciousness",
        publisher: "Neuron",
        url: doi("10.1016/j.neuron.2024.03.002"),
        doi: "10.1016/j.neuron.2024.03.002",
        year: 2024,
        tier: 1,
      },
      {
        title: "Towards a Comprehensive Understanding of Anesthetic Mechanisms of Action: A Decade of Discovery",
        publisher: "Trends in Pharmacological Sciences",
        url: doi("10.1016/j.tips.2019.05.001"),
        doi: "10.1016/j.tips.2019.05.001",
        year: 2019,
        tier: 1,
      },
      {
        title: "Anesthesia (fact sheet)",
        publisher: "National Institute of General Medical Sciences (NIH)",
        url: "https://www.nigms.nih.gov/education/fact-sheets/Pages/anesthesia.aspx",
        tier: 2,
      },
    ],
  },
  /* ================= Cơ thể và giác quan ================= */
  {
    slug: "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai",
    sources: [
      {
        title: "Acupuncture for Chronic Pain: Update of an Individual Patient Data Meta-Analysis",
        publisher: "The Journal of Pain",
        url: doi("10.1016/j.jpain.2017.11.005"),
        doi: "10.1016/j.jpain.2017.11.005",
        year: 2018,
        tier: 1,
      },
      {
        title: "Acupuncture for the prevention of tension-type headache",
        publisher: "Cochrane Database of Systematic Reviews",
        url: doi("10.1002/14651858.CD007587.pub2"),
        doi: "10.1002/14651858.CD007587.pub2",
        year: 2016,
        tier: 1,
      },
      {
        title: "Acupuncture and endorphins",
        publisher: "Neuroscience Letters",
        url: doi("10.1016/j.neulet.2003.12.019"),
        doi: "10.1016/j.neulet.2003.12.019",
        year: 2004,
        tier: 1,
      },
      {
        title: "Acupuncture: Effectiveness and Safety",
        publisher: "National Center for Complementary and Integrative Health (NIH)",
        url: "https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety",
        tier: 2,
      },
    ],
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    sources: [
      NASA_VISIBLE,
      {
        title: "How the Eyes Work",
        publisher: "National Eye Institute (NIH)",
        url: "https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work",
        tier: 2,
      },
      {
        title: "The machinery of colour vision",
        publisher: "Nature Reviews Neuroscience",
        url: doi("10.1038/nrn2094"),
        doi: "10.1038/nrn2094",
        year: 2007,
        tier: 1,
      },
    ],
  },
  {
    slug: "chung-ta-dang-song-trong-mot-bong-bong-giac-quan-nho-be-cua-thuc-tai",
    sources: [
      NASA_VISIBLE,
      {
        title: "Molecular basis of infrared detection by snakes",
        publisher: "Nature",
        url: doi("10.1038/nature08943"),
        doi: "10.1038/nature08943",
        year: 2010,
        tier: 1,
      },
      {
        title: "Poor human olfaction is a 19th-century myth",
        publisher: "Science",
        url: doi("10.1126/science.aam7263"),
        doi: "10.1126/science.aam7263",
        year: 2017,
        tier: 1,
      },
    ],
    fixes: [
      {
        find: "Khứu giác của chó mạnh hơn con người hàng chục nghìn lần.",
        replace:
          "Chó phát hiện được rất nhiều loại mùi mà con người bỏ qua — dù con số \"mạnh hơn hàng chục nghìn lần\" hay được nhắc không có phép đo chung nào đỡ, và với một số mùi, người còn nhạy hơn chó.",
        why: "McGann 2017 (Science): con người 'more sensitive than rodents and dogs for some odors'; quan niệm khứu giác người kém là 'a 19th-century myth'. Con số 'hàng chục nghìn lần' không có trong nguồn nào đã đọc. Bài không có bản EN.",
      },
    ],
  },
  {
    slug: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    sources: [
      {
        title: "Pathophysiology, prevention, and treatment of ebullism",
        publisher: "Aviation, Space, and Environmental Medicine",
        url: doi("10.3357/ASEM.3468.2013"),
        doi: "10.3357/ASEM.3468.2013",
        year: 2013,
        tier: 1,
      },
      {
        title: "Ask an Astrophysicist: Space Travel (How would the unprotected human body react to the vacuum of outer space?)",
        publisher: "NASA Goddard Space Flight Center",
        url: "https://imagine.gsfc.nasa.gov/ask_astro/space_travel.html",
        tier: 2,
      },
      {
        title: "Why Space Radiation Matters",
        publisher: "NASA",
        url: "https://www.nasa.gov/missions/analog-field-testing/why-space-radiation-matters/",
        tier: 2,
      },
    ],
    fixes: [
      {
        find: "- Sau khoảng **9–11 giây**, con người sẽ bất tỉnh. Trong tai nạn buồng chân không tại NASA Houston năm 1966, nạn nhân mất ý thức sau 12–15 giây và hồi phục không di chứng.",
        replace:
          "- Sau khoảng **10–15 giây**, con người sẽ bất tỉnh. Trong một tai nạn buồng chân không ở Trung tâm Tàu vũ trụ có người lái của NASA (Houston) giữa thập niên 1960, người thử nghiệm còn tỉnh khoảng 14 giây — xấp xỉ thời gian để máu đã cạn oxy đi từ phổi lên não — và tỉnh lại sau khi buồng được tăng áp trở lại.",
        why: "Trang NASA (Ask an Astrophysicist, trích lời chuyên gia JSC): người thử nghiệm 'remained conscious for about 14 seconds', năm ghi là '65, buồng được tăng áp lại trong vòng 15 giây. Bản VI ghi 9–11 giây và năm 1966, lệch cả nguồn lẫn bản EN (bản EN đã ghi 10–15 giây, không cần sửa).",
      },
    ],
  },
  /* ================= Cơ học, quỹ đạo, đại dương ================= */
  {
    slug: "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
    sources: [
      {
        title: "Tides and Water Levels: Gravity, Inertia, and the Two Bulges",
        publisher: "NOAA National Ocean Service",
        url: "https://oceanservice.noaa.gov/education/tutorial_tides/tides03_gravity.html",
        tier: 2,
      },
      {
        title: "Tides and Water Levels: Frequency of Tides — The Lunar Day",
        publisher: "NOAA National Ocean Service",
        url: "https://oceanservice.noaa.gov/education/tutorial_tides/tides05_lunarday.html",
        tier: 2,
      },
      {
        title: "Currents: The Coriolis Effect",
        publisher: "NOAA National Ocean Service",
        url: "https://oceanservice.noaa.gov/education/tutorial_currents/04currents1.html",
        tier: 2,
      },
    ],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-hut-hang-khi-van-toc-thay-doi",
    sources: [
      NASA_NEWTON,
      CULLEN_2012,
      {
        title: "Anatomy of the vestibular system: A review",
        publisher: "NeuroRehabilitation",
        url: doi("10.3233/NRE-130866"),
        doi: "10.3233/NRE-130866",
        year: 2013,
        tier: 1,
      },
    ],
  },
  {
    slug: "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
    sources: [NASA_NEWTON, CULLEN_2012],
  },
  {
    slug: "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
    sources: [
      JPL_BASICS_CH4,
      {
        title: "Earth Fact Sheet",
        publisher: "NASA Goddard Space Flight Center (NSSDCA)",
        url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
        tier: 2,
      },
      { title: "Ulysses", publisher: "NASA Science", url: "https://science.nasa.gov/mission/ulysses/", tier: 2 },
    ],
  },
  {
    slug: "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
    sources: [
      JPL_BASICS_CH4,
      { title: "Voyager", publisher: "NASA Science", url: "https://science.nasa.gov/mission/voyager/", tier: 2 },
      {
        title: "Voyager 2: First To Visit All Four Giants",
        publisher: "NASA Science",
        url: "https://science.nasa.gov/mission/voyager/voyager-2/",
        tier: 2,
      },
      { title: "Parker Solar Probe", publisher: "NASA Science", url: "https://science.nasa.gov/mission/parker-solar-probe/", tier: 2 },
    ],
    fixes: [
      {
        // Neo kèm dấu xuống dòng: câu thay thế CHỨA cụm "các hành tinh này.", nên neo
        // không có "\n" thì lượt chạy sau lại khớp và chèn câu lần nữa — đã xảy ra
        // một lần ngày 25/09, mục ngay dưới gỡ câu lặp ấy.
        find: "để lần lượt \"đi ké\" qua các hành tinh này.\n",
        replace: "để lần lượt \"đi ké\" qua các hành tinh này. Voyager 2 là tàu duy nhất từng ghé Sao Thiên Vương và Sao Hải Vương.\n",
        why: "Câu cũ đọc như cả hai tàu cùng ghé bốn hành tinh. NASA (Voyager 2): 'the only spacecraft to visit Uranus and Neptune'. Bài không có bản EN.",
      },
      {
        find: "Sao Hải Vương. Voyager 2 là tàu duy nhất từng ghé Sao Thiên Vương và Sao Hải Vương.",
        replace: "Sao Hải Vương.",
        why: "Gỡ câu lặp: lượt --write thứ hai của chính script này chèn câu Voyager 2 lần nữa (neo cũ nằm trong câu thay thế).",
      },
      {
        find: "- Voyager 1 và Voyager 2 có thể vượt ra ngoài Hệ Mặt Trời.",
        replace: "- Voyager 1 và Voyager 2 là hai tàu duy nhất từng hoạt động bên ngoài nhật quyển, trong không gian liên sao.",
        why: "NASA (Voyager): 'the only spacecraft ever to operate outside the heliosphere'. Ra khỏi nhật quyển chưa phải ra khỏi Hệ Mặt Trời — đám mây Oort vẫn còn ở phía trước.",
      },
    ],
  },
  {
    slug: "cac-chom-sao-hoang-dao",
    sources: [
      NASA_NSN_ZODIAC,
      {
        title: "The Constellations",
        publisher: "International Astronomical Union",
        url: "https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx",
        tier: 2,
      },
      { title: "What Are Constellations?", publisher: "NASA Space Place", url: "https://spaceplace.nasa.gov/starfinder2/en/", tier: 2 },
    ],
  },
  {
    slug: "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
    sources: [
      {
        title: "A double-blind test of astrology",
        publisher: "Nature",
        url: doi("10.1038/318419a0"),
        doi: "10.1038/318419a0",
        year: 1985,
        tier: 1,
      },
      {
        title: "Schizotypy, self-referential thinking and the Barnum effect",
        publisher: "Journal of Behavior Therapy and Experimental Psychiatry",
        url: doi("10.1016/j.jbtep.2010.11.003"),
        doi: "10.1016/j.jbtep.2010.11.003",
        year: 2011,
        tier: 1,
      },
      NASA_NSN_ZODIAC,
    ],
  },
  /* ================= Vũ trụ, sao, tiến hoá ================= */
  {
    slug: "su-ra-doi-cua-he-mat-troi",
    sources: [
      CONNELLY_2012,
      { title: "THE 2014 ALMA LONG BASELINE CAMPAIGN: FIRST RESULTS FROM HIGH ANGULAR RESOLUTION OBSERVATIONS TOWARD THE HL TAU REGION", publisher: "The Astrophysical Journal Letters", url: doi("10.1088/2041-8205/808/1/L3"), doi: "10.1088/2041-8205/808/1/L3", year: 2015, tier: 1 },
      { title: "Origin of the orbital architecture of the giant planets of the Solar System", publisher: "Nature", url: doi("10.1038/nature03539"), doi: "10.1038/nature03539", year: 2005, tier: 1 },
      { title: "Exoplanets", publisher: "NASA Science", url: "https://science.nasa.gov/exoplanets/", tier: 2 },
    ],
  },
  {
    slug: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    sources: [
      { title: "Validation of the new Hipparcos reduction", publisher: "Astronomy & Astrophysics", url: doi("10.1051/0004-6361:20078357"), doi: "10.1051/0004-6361:20078357", year: 2007, tier: 1 },
      { title: "Standing on the Shoulders of Giants: New Mass and Distance Estimates for Betelgeuse through Combined Evolutionary, Asteroseismic, and Hydrodynamic Simulations with MESA", publisher: "The Astrophysical Journal", url: doi("10.3847/1538-4357/abb8db"), doi: "10.3847/1538-4357/abb8db", year: 2020, tier: 1 },
      { title: "Hubble Finds That Betelgeuse's Mysterious Dimming Is Due to a Traumatic Outburst", publisher: "NASA Science", url: "https://science.nasa.gov/missions/hubble/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst/", tier: 2 },
      { title: "Star Types", publisher: "NASA Science", url: "https://science.nasa.gov/universe/stars/types/", tier: 2 },
    ],
    fixes: [
      {
        // Bản VI đã sửa từ trước (science-editor 17/09); chỉ bản EN còn sai, nên
        // neo VI là câu cũ đã không còn — mục này chỉ chạm bản EN.
        find: "Từng là Sao Bắc Cực khoảng 12.000 năm trước",
        replace: "Từng là Sao Bắc Cực khoảng 14.000 năm trước",
        en: [
          "- Was the North Star about 12,000 years ago and will return to this position in the future due to Earth's axial precession.",
          "- Was the North Star about 14,000 years ago, and will return to that position in about 12,000 years, due to the precession of Earth's axis.",
        ],
        why: "NASA (Summer Triangle Corner: Vega): 'Ancient humans from 14,000 years ago … it was the Earth's northern pole star', 'in 12,000 years, Vega will return'. Bản EN nhầm 12.000 thành mốc quá khứ. EN cũ: \"- Was the North Star about 12,000 years ago and will return to this position in the future due to Earth's axial precession.\"",
      },
    ],
  },
  {
    slug: "tai-sao-pluto-khong-con-la-hanh-tinh",
    sources: [
      { title: "The Pluto system: Initial results from its exploration by New Horizons", publisher: "Science", url: doi("10.1126/science.aad1815"), doi: "10.1126/science.aad1815", year: 2015, tier: 1 },
    ],
  },
  {
    slug: "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
    sources: [
      { title: "The Particle Problem in the General Theory of Relativity", publisher: "Physical Review", url: doi("10.1103/PhysRev.48.73"), doi: "10.1103/PhysRev.48.73", year: 1935, tier: 1 },
      { title: "Wormholes in spacetime and their use for interstellar travel: A tool for teaching general relativity", publisher: "American Journal of Physics", url: doi("10.1119/1.15620"), doi: "10.1119/1.15620", year: 1988, tier: 1 },
      { title: "Death of White Holes in the Early Universe", publisher: "Physical Review Letters", url: doi("10.1103/PhysRevLett.33.442"), doi: "10.1103/PhysRevLett.33.442", year: 1974, tier: 1 },
      { title: "Observation of Gravitational Waves from a Binary Black Hole Merger", publisher: "Physical Review Letters", url: doi("10.1103/PhysRevLett.116.061102"), doi: "10.1103/PhysRevLett.116.061102", year: 2016, tier: 1 },
      { title: "First M87 Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole", publisher: "The Astrophysical Journal Letters", url: doi("10.3847/2041-8213/ab0ec7"), doi: "10.3847/2041-8213/ab0ec7", year: 2019, tier: 1 },
      { title: "First Sagittarius A* Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole in the Center of the Milky Way", publisher: "The Astrophysical Journal Letters", url: doi("10.3847/2041-8213/ac6674"), doi: "10.3847/2041-8213/ac6674", year: 2022, tier: 1 },
    ],
  },
  {
    slug: "da-vu-tru-bon-cap-do-va-mot-cau-hoi-kho",
    sources: [
      { title: "Parallel universes", publisher: "Science and Ultimate Reality (Cambridge University Press)", url: doi("10.1017/CBO9780511814990.024"), doi: "10.1017/CBO9780511814990.024", year: 2004, tier: 1 },
      { title: "First Observational Tests of Eternal Inflation", publisher: "Physical Review Letters", url: doi("10.1103/PhysRevLett.107.071301"), doi: "10.1103/PhysRevLett.107.071301", year: 2011, tier: 1 },
      { title: "Scientific method: Defend the integrity of physics", publisher: "Nature", url: doi("10.1038/516321a"), doi: "10.1038/516321a", year: 2014, tier: 1 },
    ],
  },
  {
    slug: "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
    sources: [
      { title: "Dark Matter", publisher: "NASA Science", url: "https://science.nasa.gov/dark-matter/", tier: 2 },
      NASA_DARK_ENERGY,
      { title: "Planck 2018 results. VI. Cosmological parameters", publisher: "Astronomy & Astrophysics", url: doi("10.1051/0004-6361/201833910"), doi: "10.1051/0004-6361/201833910", year: 2020, tier: 1 },
      RIESS_1998,
      { title: "Rotation of the Andromeda Nebula from a Spectroscopic Survey of Emission Regions", publisher: "The Astrophysical Journal", url: doi("10.1086/150317"), doi: "10.1086/150317", year: 1970, tier: 1 },
    ],
  },
  {
    slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
    sources: [
      { title: "The NANOGrav 15 yr Data Set: Evidence for a Gravitational-wave Background", publisher: "The Astrophysical Journal Letters", url: doi("10.3847/2041-8213/acdac6"), doi: "10.3847/2041-8213/acdac6", year: 2023, tier: 1 },
      { title: "Dark Matter and the First Stars: A New Phase of Stellar Evolution", publisher: "Physical Review Letters", url: doi("10.1103/PhysRevLett.100.051101"), doi: "10.1103/PhysRevLett.100.051101", year: 2008, tier: 1 },
      { title: "Reconstructing PTA measurements via early seeding of supermassive black holes", publisher: "Physical Review D", url: doi("10.1103/hvfd-8fkr"), doi: "10.1103/hvfd-8fkr", year: 2026, tier: 1 },
    ],
  },
  {
    slug: "neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien",
    sources: [
      { title: "A terrestrial planet candidate in a temperate orbit around Proxima Centauri", publisher: "Nature", url: doi("10.1038/nature19106"), doi: "10.1038/nature19106", year: 2016, tier: 1 },
      { title: "A candidate short-period sub-Earth orbiting Proxima Centauri", publisher: "Astronomy & Astrophysics", url: doi("10.1051/0004-6361/202142337"), doi: "10.1051/0004-6361/202142337", year: 2022, tier: 1 },
      { title: "Proxima Centauri b", publisher: "NASA Science", url: "https://science.nasa.gov/exoplanet-catalog/proxima-centauri-b/", tier: 2 },
    ],
  },
  {
    slug: "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
    sources: [
      { title: "Search for proton decay via p→e+π0 and p→μ+π0 with an enlarged fiducial volume in Super-Kamiokande I-IV", publisher: "Physical Review D", url: doi("10.1103/PhysRevD.102.112011"), doi: "10.1103/PhysRevD.102.112011", year: 2020, tier: 1 },
      { title: "A dying universe: the long-term fate and evolution of astrophysical objects", publisher: "Reviews of Modern Physics", url: doi("10.1103/RevModPhys.69.337"), doi: "10.1103/RevModPhys.69.337", year: 1997, tier: 1 },
      B2FH_1957,
    ],
  },
  {
    slug: "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
    sources: [
      { title: "A million cubic megaparsec void in Bootes", publisher: "The Astrophysical Journal", url: doi("10.1086/183623"), doi: "10.1086/183623", year: 1981, tier: 1 },
      { title: "How filaments of galaxies are woven into the cosmic web", publisher: "Nature", url: doi("10.1038/380603a0"), doi: "10.1038/380603a0", year: 1996, tier: 1 },
      { title: "The Temperature of the Cosmic Microwave Background", publisher: "The Astrophysical Journal", url: doi("10.1088/0004-637X/707/2/916"), doi: "10.1088/0004-637X/707/2/916", year: 2009, tier: 1 },
    ],
  },
  {
    slug: "nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha",
    sources: [
      { title: "Terrestrial mass extinctions, cometary impacts and the Sun's motion perpendicular to the galactic plane", publisher: "Nature", url: doi("10.1038/308709a0"), doi: "10.1038/308709a0", year: 1984, tier: 1 },
      { title: "The evidence for and against astronomical impacts on climate change and mass extinctions: a review", publisher: "International Journal of Astrobiology", url: doi("10.1017/S147355040999005X"), doi: "10.1017/S147355040999005X", year: 2009, tier: 1 },
      { title: "The Chicxulub Asteroid Impact and Mass Extinction at the Cretaceous-Paleogene Boundary", publisher: "Science", url: doi("10.1126/science.1177265"), doi: "10.1126/science.1177265", year: 2010, tier: 1 },
    ],
  },
  {
    slug: "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
    sources: [
      { title: "A relation between distance and radial velocity among extra-galactic nebulae", publisher: "Proceedings of the National Academy of Sciences", url: doi("10.1073/pnas.15.3.168"), doi: "10.1073/pnas.15.3.168", year: 1929, tier: 1 },
      RIESS_1998,
      NASA_DARK_ENERGY,
      { title: "Earth Fact Sheet", publisher: "NASA Goddard Space Flight Center (NSSDCA)", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html", tier: 2 },
    ],
  },
  {
    slug: "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no",
    sources: [
      B2FH_1957,
      { title: "Populating the periodic table: Nucleosynthesis of the elements", publisher: "Science", url: doi("10.1126/science.aau9540"), doi: "10.1126/science.aau9540", year: 2019, tier: 1 },
      CONNELLY_2012,
    ],
    fixes: [
      {
        find: "- Sắt trong máu từng được rèn luyện trong những ngôi sao khổng lồ đã chết từ rất lâu trước khi Mặt Trời ra đời.",
        replace: "- Sắt trong máu được tạo ra trong đời sống và cái chết của những ngôi sao đã tàn từ rất lâu trước khi Mặt Trời ra đời.",
        why: "Johnson 2019 (Science): nguyên tố nặng đến từ sao khối lượng lớn nổ thành siêu tân tinh VÀ từ sao lùn trắng — 'sao khổng lồ' chỉ là một nửa câu chuyện. Viết lại cho khỏi chọn phe. Bài không có bản EN.",
      },
      {
        find: "✨ Sắt trong máu bạn từng nằm trong lõi một ngôi sao.",
        replace: "✨ Sắt trong máu bạn được rèn từ những ngôi sao đã chết.",
        why: "Cùng lý do với câu trên: không phải mọi nguyên tử sắt đều từ lõi một ngôi sao (Johnson 2019).",
      },
    ],
  },
  {
    slug: "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    sources: [
      { title: "Exposing Worry’s Deceit: Percentage of Untrue Worries in Generalized Anxiety Disorder Treatment", publisher: "Behavior Therapy", url: doi("10.1016/j.beth.2019.07.003"), doi: "10.1016/j.beth.2019.07.003", year: 2020, tier: 1 },
      { title: "Chimpanzees: Self-Recognition", publisher: "Science", url: doi("10.1126/science.167.3914.86"), doi: "10.1126/science.167.3914.86", year: 1970, tier: 1 },
      { title: "Two Decades of Terror Management Theory: A Meta-Analysis of Mortality Salience Research", publisher: "Personality and Social Psychology Review", url: doi("10.1177/1088868309352321"), doi: "10.1177/1088868309352321", year: 2010, tier: 1 },
    ],
    fixes: [
      {
        find: "Nhiều nghiên cứu tâm lý học cho thấy phần lớn những điều con người lo lắng hàng ngày thực tế không bao giờ xảy ra, nhưng bộ não vẫn tiêu tốn năng lượng để chuẩn bị cho chúng.",
        replace: "Một nghiên cứu cho những người mắc rối loạn lo âu lan toả ghi lại nỗi lo hằng ngày rồi theo dõi kết cục suốt một tháng: hơn 91% những điều họ lo đã không xảy ra — vậy mà bộ não vẫn tiêu tốn năng lượng để chuẩn bị cho chúng.",
        why: "LaFreniere & Newman 2020 (Behavior Therapy): 91,4% nỗi lo không thành sự thật — nhưng ở 29 người mắc GAD, không phải 'con người' nói chung, và là một nghiên cứu chứ không phải 'nhiều'. Bài không có bản EN.",
      },
    ],
  },
  {
    slug: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    sources: [
      { title: "Evolution of ageing", publisher: "Nature", url: doi("10.1038/270301a0"), doi: "10.1038/270301a0", year: 1977, tier: 1 },
      { title: "Why do we age?", publisher: "Nature", url: doi("10.1038/35041682"), doi: "10.1038/35041682", year: 2000, tier: 1 },
      { title: "Is antagonistic pleiotropy ubiquitous in aging biology?", publisher: "Evolution, Medicine, and Public Health", url: doi("10.1093/emph/eoy033"), doi: "10.1093/emph/eoy033", year: 2018, tier: 1 },
    ],
  },
];

function count(text: string, find: string | RegExp) {
  if (typeof find === "string") return text.split(find).length - 1;
  return (text.match(new RegExp(find.source, find.flags.includes("g") ? find.flags : `${find.flags}g`)) ?? []).length;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");
  const accessedAt = new Date("2026-09-25T00:00:00Z");
  let addedSources = 0;
  let fixedArticles = 0;

  const slugs = PLANS.map((p) => p.slug);
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (dup) throw new Error(`Bài lặp trong PLANS: ${dup}`);

  for (const plan of PLANS) {
    const article = await prisma.article.findUnique({
      where: { slug: plan.slug },
      select: {
        id: true,
        title: true,
        content: true,
        contentEn: true,
        status: true,
        sources: { select: { url: true, doi: true, tier: true } },
      },
    });
    console.log(`\n${plan.slug}`);
    if (!article) throw new Error(`Không có bài ${plan.slug}`);

    const have = new Set(
      article.sources.flatMap((s) => [s.url, s.doi?.toLowerCase()].filter(Boolean) as string[]),
    );
    const fresh = plan.sources.filter((s) => !have.has(s.url) && !(s.doi && have.has(s.doi.toLowerCase())));
    // Tính cả nguồn bậc 1–2 đã có trong bài: gate đếm trên bài, không trên kế hoạch.
    const strongAfter =
      article.sources.filter((s) => s.tier <= 2).length + fresh.filter((s) => s.tier <= 2).length;
    console.log(`   nguồn: +${fresh.length} (đã có ${plan.sources.length - fresh.length}); bậc 1–2 sau khi ghi: ${strongAfter}`);
    if (strongAfter < 3) throw new Error(`${plan.slug}: dưới 3 nguồn bậc 1–2`);

    let content = article.content;
    let contentEn = article.contentEn ?? "";
    for (const fix of plan.fixes ?? []) {
      const n = count(content, fix.find);
      if (n === 0) {
        console.log(`   sửa: đã áp dụng hoặc không còn — ${fix.why.slice(0, 60)}…`);
      } else {
        if (n !== 1) throw new Error(`${plan.slug}: cụm neo khớp ${n} chỗ, cần đúng 1`);
        content = content.replace(fix.find, fix.replace);
        console.log(`   sửa: ${fix.why.slice(0, 140)}…`);
      }
      if (fix.en && article.contentEn) {
        const m = count(contentEn, fix.en[0]);
        if (m === 1) {
          contentEn = contentEn.replace(fix.en[0], fix.en[1]);
          console.log("   sửa EN");
        } else if (!contentEn.includes(fix.en[1])) {
          throw new Error(`${plan.slug}: cụm neo EN khớp ${m} chỗ, cần đúng 1`);
        }
      }
    }

    const dirtyVi = content !== article.content;
    const dirtyEn = article.contentEn !== null && contentEn !== article.contentEn;
    if (dirtyVi || dirtyEn) fixedArticles += 1;
    addedSources += fresh.length;
    if (!write) continue;

    await prisma.$transaction([
      ...(dirtyVi || dirtyEn
        ? [
            prisma.revision.create({
              data: {
                articleId: article.id,
                title: article.title,
                content: article.content,
                note: "Trước đính chính theo nguồn, đợt bổ sung nguồn 2026-09-25. Bản EN cũ của từng câu sửa ghi trong scripts/add-sources-2026-09-25.ts.",
              },
            }),
            prisma.article.update({
              where: { id: article.id },
              data: { content, ...(dirtyEn ? { contentEn } : {}) },
            }),
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

  console.log(`\n${addedSources} nguồn, ${fixedArticles} bài đính chính.` + (write ? "" : " Chưa ghi gì."));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
