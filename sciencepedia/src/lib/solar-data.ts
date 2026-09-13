/**
 * Số liệu Hệ Mặt Trời (nguồn: NASA Planetary Fact Sheet).
 *
 * `displayRadius` là đơn vị của cảnh 3D, KHÔNG phải tỉ lệ thật —
 * nếu vẽ đúng tỉ lệ thì Sao Hải Vương sẽ nằm ngoài màn hình còn các hành tinh đá
 * nhỏ hơn một pixel. Tỉ lệ thật vẫn được giữ trong `realRadiusKm` / `realDistanceKm`
 * để hiển thị trong bảng thông tin và để chế độ "tỉ lệ thực" dùng tới.
 */
export type Planet = {
  id: string;
  name: string;
  nameEn: string;
  /**
   * Slug bài viết tương ứng, **đúng như nó nằm trong cột `Article.slug`**.
   *
   * Không phải một slug lý tưởng hoá. Cho tới 2026-09-11, cả 14 giá trị ở đây
   * đều là tên ngắn gọn kiểu `mat-troi`, `sao-kim`, `trai-dat` — không giá trị
   * nào tồn tại trong cơ sở dữ liệu, vì bài thật mang slug dài theo tiêu đề
   * (`mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh`). Hệ quả: **mọi** liên kết
   * "Đọc bài chi tiết" trong thư viện thiên thể và bảng thông tin đều biến
   * mất, và biến mất trong im lặng.
   *
   * Im lặng là phần đáng ngại hơn. `filterPublishedSlugs` ẩn liên kết khi slug
   * không có bài đã xuất bản — đúng thiết kế, vì nó chặn 404. Nhưng nó cũng
   * làm cho "slug viết sai" và "bài chưa viết" trông giống hệt nhau trên giao
   * diện, nên lỗi này sống được nhiều tháng mà không ai thấy.
   *
   * Thêm thiên thể mới thì **tra slug trong CSDL**, đừng đoán từ tên. Bốn thiên
   * thể còn giữ tên ngắn (`mat-trang`, `eris`, `haumea`, `makemake`) là bốn
   * thiên thể CHƯA có bài — ở đó liên kết ẩn là đúng, và slug ngắn là chỗ dành
   * sẵn cho bài tương lai.
   */
  articleSlug: string;
  color: string;
  emissive?: string;

  displayRadius: number;
  /** Số vòng quay quanh Mặt Trời mỗi đơn vị thời gian của cảnh */
  orbitSpeed: number;
  /** Tốc độ tự quay quanh trục */
  spinSpeed: number;
  /** Độ nghiêng trục quay (độ) */
  axialTilt: number;
  /**
   * Độ lệch tâm quỹ đạo, J2000.
   *
   * Không hành tinh nào đi trên một vòng tròn. Sao Thuỷ lệch 0,206 — khoảng
   * cách tới Mặt Trời của nó dao động từ 46 tới 70 triệu km, tức chênh hơn
   * 50%. Vẽ tròn hết là bỏ mất một trong vài điều mà ai cũng nghe nói nhưng
   * chưa từng nhìn thấy.
   */
  eccentricity: number;
  /**
   * Độ nghiêng mặt phẳng quỹ đạo so với mặt phẳng hoàng đạo, độ.
   *
   * Nhỏ với cả tám hành tinh — lớn nhất là Sao Thuỷ 7° — nhưng KHÔNG bằng
   * không, và chính chỗ khác không đó là lý do nhật thực không xảy ra mỗi
   * tháng. Hành tinh lùn thì nghiêng hẳn: Eris 44°.
   */
  inclinationDeg: number;
  /** Bản đồ bề mặt dạng equirectangular — xem chú thích TEXTURES bên dưới */
  texture: string;
  ring?: { inner: number; outer: number; color: string; opacity: number };

  realRadiusKm: number;
  realDistanceKm: number;
  /** Đơn vị: ngày Trái Đất */
  orbitalPeriodDays: number;
  /** Đơn vị: giờ Trái Đất */
  dayLengthHours: number;
  moons: number;
  /** Nhiệt độ trung bình bề mặt, °C */
  temperatureC: number;
  /** m/s² */
  gravity: number;
  descriptionVi: string;
  descriptionEn: string;
  /** Ảnh chụp thật, dùng làm bìa trong thư viện ảnh */
  photo: BodyPhoto;
  /** Bản đồ bề mặt xem tương tác được; `null` nếu CDS chưa có */
  surface: BodySurface | null;
};

/**
 * Ảnh chụp thật của một thiên thể.
 *
 * Đây KHÔNG phải `texture`. Texture là bản đồ trải phẳng để dán lên quả cầu
 * 3D, một mình nó nhìn không ra cái gì. Ảnh này là một tấm chụp từ tàu thăm
 * dò hoặc kính thiên văn và nó đứng riêng được, nên nó là thứ dùng làm bìa.
 *
 * Ảnh nào không phải ánh sáng nhìn thấy thì `captionVi` phải nói thẳng ra.
 * Bày màu quy ước như màu mắt thấy là sai về khoa học, và người đọc không có
 * cách nào tự biết.
 */
export type BodyPhoto = {
  url: string;
  captionVi: string;
  captionEn: string;
  credit: string;
  /** Trang mô tả trên Wikimedia Commons — chỗ tra giấy phép và nguồn gốc */
  sourceUrl: string;
};

/**
 * Bản đồ bề mặt dạng HiPS của CDS, xem tương tác được bằng Aladin Lite.
 *
 * ## Vì sao không lấy ảnh hành tinh từ survey bầu trời
 *
 * Survey trong `SKY_SURVEYS` (DSS, 2MASS, WISE) chụp thiên cầu theo RA/Dec cố
 * định, mà hành tinh chỉ đi ngang qua rồi bỏ đi — ảnh survey ở vị trí hôm nay
 * của Sao Hoả là ảnh đám sao nền phía sau nó. Chỗ nào hành tinh có lọt vào
 * khung thì nó cháy trắng, vì kính khảo sát phơi sáng cho vật thể mờ. Và
 * đường kính biểu kiến vài chục giây cung ở độ phân giải DSS chỉ ra vài chục
 * pixel.
 *
 * HiPS hành tinh là chuyện khác hẳn: hệ toạ độ gắn vào chính thiên thể
 * (`hips_body` trong file properties), ảnh ghép từ tàu thăm dò, và Aladin Lite
 * tự chuyển sang chế độ thiên thể khi đọc thấy khoá đó.
 *
 * `null` khi CDS chưa có bản đồ nào — Sao Thổ và Sao Thiên Vương đang vậy.
 */
export type BodySurface = {
  /** URL gốc của HiPS, truyền thẳng cho Aladin thay vì mã ID */
  hipsUrl: string;
  captionVi: string;
  captionEn: string;
  credit: string;
};

/**
 * Bản đồ bề mặt hành tinh, bộ 2k của Solar System Scope (giấy phép CC BY 4.0),
 * lấy qua Wikimedia Commons vì máy chủ đó trả về `access-control-allow-origin: *`
 * — WebGL không nạp được texture từ nguồn không cho phép CORS.
 *
 * Ảnh dạng equirectangular: chiều ngang là kinh độ 0–360°, chiều dọc là vĩ độ
 * −90 tới 90°, đúng định dạng mà THREE.SphereGeometry mong đợi.
 */
const TEXTURE_BASE = "https://upload.wikimedia.org/wikipedia/commons/thumb";

/** Trang mô tả file trên Commons — nơi tra giấy phép của từng tấm ảnh. */
const COMMONS_FILE = "https://commons.wikimedia.org/wiki/File:";

/**
 * Máy chủ HiPS hành tinh của CDS. KHÁC `ALADIN_ORIGIN` (nơi phát script), nên
 * trang nào mở bề mặt hành tinh phải `preconnect` cả hai.
 */
export const SURFACE_HIPS_ORIGIN = "https://alasky.cds.unistra.fr";
const SURFACE_BASE = `${SURFACE_HIPS_ORIGIN}/Planets`;

/**
 * Bản đồ mây của Trái Đất — mây trắng trên nền đen, dùng làm `alphaMap`.
 *
 * Cùng bộ Solar System Scope với các bản đồ bề mặt, cùng giấy phép CC BY 4.0,
 * nên `TEXTURE_CREDIT` ngay dưới đây phủ luôn cho nó — không cần thêm một
 * dòng ghi công thứ hai.
 *
 * Đường băng `e/ed` tra từ API Commons ngày 2026-09-13, không đoán: lượt
 * đoán đầu tiên ra `2/2c` và trả 404. Bản gốc 2048×1024, lấy thumb 1280 cho
 * cùng cỡ với các bản đồ bề mặt khác.
 */
export const EARTH_CLOUDS_TEXTURE = `${TEXTURE_BASE}/e/ed/Solarsystemscope_texture_2k_earth_clouds.jpg/1280px-Solarsystemscope_texture_2k_earth_clouds.jpg`;

export const TEXTURE_CREDIT = {
  name: "Solar System Scope",
  url: "https://www.solarsystemscope.com/textures/",
  license: "CC BY 4.0",
};

/**
 * Ký hiệu thiên văn cổ điển của từng thiên thể.
 *
 * Đặt riêng thành bảng tra thay vì thêm một trường vào chín đối tượng dữ
 * liệu: đây là chuyện hiển thị của đúng một khối giao diện, không phải thuộc
 * tính của thiên thể. Trái Đất dùng emoji quả địa cầu chứ không dùng ♁ — ký
 * hiệu đó phần lớn phông hệ thống không có, và ô trống thì tệ hơn.
 */
/**
 * Rút một dòng ghi nguồn dài thành danh sách tổ chức.
 *
 * "CDS / NASA GSFC (SVS 30362)" và "USGS Astrogeology / NASA (qua CDS)" đều
 * đúng, nhưng trên một thẻ rộng 380 px thì chúng chiếm ba dòng và đẩy phần
 * còn lại xuống. Người lướt qua chỉ cần biết dữ liệu đến từ đâu ở mức tổ
 * chức; ai cần đủ thì bấm vào link — link vẫn giữ nguyên, chỉ phần chữ hiện
 * ra là rút gọn.
 *
 * Giữ thứ tự xuất hiện trong chuỗi gốc, vì tổ chức đứng đầu thường là nơi
 * làm ra dữ liệu chứ không phải nơi phân phối nó.
 */
export function shortenCredit(credit: string): string {
  const KNOWN = [
    "NASA",
    "ESA",
    "JPL",
    "USGS",
    "CDS",
    "GSFC",
    "JHUAPL",
    "Carnegie",
    "NOAA",
    "ASU",
  ];

  const found: string[] = [];
  for (const org of KNOWN) {
    if (credit.includes(org) && !found.includes(org)) found.push(org);
  }

  // Không nhận ra tổ chức nào thì trả nguyên văn, đừng nuốt mất ghi nguồn
  return found.length > 0 ? found.join(" · ") : credit;
}

export const BODY_SYMBOL: Record<string, string> = {
  sun: "☉",
  mercury: "☿",
  venus: "♀",
  earth: "🌍",
  moon: "☾",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
};

/**
 * Nhãn phân loại của từng thiên thể.
 *
 * Đặt riêng thành bảng tra thay vì thêm trường vào mười đối tượng dữ liệu,
 * cùng lý do với `BODY_SYMBOL`: đây là chuyện hiển thị của một khối giao
 * diện, không phải thuộc tính vật lý.
 *
 * Mỗi nhãn phải là một mệnh đề kiểm được, không phải một tính từ. "Có nước
 * lỏng" đúng với Trái Đất và sai với Sao Hoả — Sao Hoả có băng nước và có
 * nước mặn chảy theo mùa ở vài chỗ, nhưng không có nước lỏng ổn định trên bề
 * mặt, vì áp suất khí quyển ở đó nằm dưới điểm ba của nước. Nhãn của Sao Hoả
 * vì vậy ghi "Có băng nước".
 */
export const BODY_BADGES: Record<
  string,
  Array<{ emoji: string; label: string; labelEn: string }>
> = {
  sun: [
    { emoji: "⭐", label: "Sao lùn vàng loại G", labelEn: "G-type dwarf star" },
    { emoji: "⚛️", label: "Hợp hạch hydro", labelEn: "Hydrogen fusion" },
  ],
  mercury: [
    { emoji: "🪨", label: "Hành tinh đá", labelEn: "Rocky planet" },
    { emoji: "🌡️", label: "Chênh nhiệt 600 °C", labelEn: "600 °C swing" },
  ],
  venus: [
    { emoji: "🪨", label: "Hành tinh đá", labelEn: "Rocky planet" },
    { emoji: "☁️", label: "Mây acid sulfuric", labelEn: "Sulfuric-acid cloud" },
    { emoji: "🔥", label: "Hiệu ứng nhà kính cực đoan", labelEn: "Runaway greenhouse" },
  ],
  earth: [
    { emoji: "🪨", label: "Hành tinh đá", labelEn: "Rocky planet" },
    { emoji: "🌊", label: "Có nước lỏng", labelEn: "Liquid water" },
    { emoji: "🧬", label: "Có sự sống", labelEn: "Hosts life" },
  ],
  moon: [
    { emoji: "🛰️", label: "Vệ tinh tự nhiên", labelEn: "Natural satellite" },
    { emoji: "🌑", label: "Khí quyển cực mỏng", labelEn: "Near-vacuum" },
    { emoji: "🔒", label: "Khoá thuỷ triều", labelEn: "Tidally locked" },
  ],
  mars: [
    { emoji: "🪨", label: "Hành tinh đá", labelEn: "Rocky planet" },
    { emoji: "❄️", label: "Có băng nước", labelEn: "Water ice" },
    { emoji: "🚀", label: "Mục tiêu thám hiểm", labelEn: "Exploration target" },
  ],
  jupiter: [
    { emoji: "🌀", label: "Hành tinh khí khổng lồ", labelEn: "Gas giant" },
    { emoji: "🔴", label: "Vết Đỏ Lớn", labelEn: "The Great Red Spot" },
  ],
  saturn: [
    { emoji: "🌀", label: "Hành tinh khí khổng lồ", labelEn: "Gas giant" },
    { emoji: "💍", label: "Hệ vành rõ nhất", labelEn: "The clearest ring system" },
  ],
  uranus: [
    { emoji: "🧊", label: "Hành tinh băng khổng lồ", labelEn: "Ice giant" },
    { emoji: "↩️", label: "Quay nằm nghiêng 98°", labelEn: "Tilted 98°" },
  ],
  neptune: [
    { emoji: "🧊", label: "Hành tinh băng khổng lồ", labelEn: "Ice giant" },
    { emoji: "💨", label: "Gió mạnh nhất hệ", labelEn: "Fastest winds" },
  ],
};

/** Sự kiện yêu cầu mở bản đồ bề mặt của một thiên thể — xem `body-jump-list`. */
export const OPEN_BODY_EVENT = "sciencepedia:open-body";

export const SUN = {
  id: "sun",
  name: "Mặt Trời",
  nameEn: "The Sun",
  articleSlug: "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
  color: "#ffb703",
  texture: `${TEXTURE_BASE}/c/cb/Solarsystemscope_texture_2k_sun.jpg/1280px-Solarsystemscope_texture_2k_sun.jpg`,
  displayRadius: 3.2,
  realRadiusKm: 696_340,
  temperatureC: 5500,
  gravity: 274,
  descriptionVi:
    "Ngôi sao trung tâm chiếm 99,86% khối lượng toàn hệ, nơi phản ứng hợp hạch hydro thành heli diễn ra liên tục suốt 4,6 tỉ năm.",
  descriptionEn:
    "The central star holding 99.86% of the system mass, fusing hydrogen into helium continuously for 4.6 billion years.",
  /**
   * Ảnh bìa được dựng TỪ CHÍNH bản đồ mà thẻ này mở ra, không phải một tấm
   * ảnh khác cùng bước sóng.
   *
   * Trước đây bìa là ảnh SDO chụp 10/06/2014, cùng dải 304 Å với bản đồ nhưng
   * khác thời điểm. Mặt Trời đổi bộ mặt từng ngày, nên bấm mở là quầng sáng
   * nhảy chỗ và cả tông màu cũng đổi — người xem tưởng bản đồ hỏng. Cùng một
   * bước sóng vẫn chưa đủ; phải cùng một dữ liệu.
   *
   * Ảnh lấy từ preview của survey, cắt lấy đĩa và thay nền xám của CDS bằng
   * nền tối của khung. 256 px là cỡ lớn nhất CDS phát ra cho preview — đủ cho
   * một tấm bìa, và đổi lại là bấm vào không thấy hình đổi.
   */
  photo: {
    url: "/images/sun-hips-304.jpg",
    captionVi:
      "Bản đồ cầu toàn Mặt Trời ở bước sóng cực tím 304 Å — lớp sắc quyển. CDS ghép từ đoạn phim NASA/GSFC theo dõi toàn bộ bề mặt trong khoảng 01/01–27/09/2012. Màu cam là màu quy ước, mắt người không nhìn thấy bước sóng này. Bấm vào để xoay chính bản đồ này.",
    captionEn:
      "Whole-Sun spherical map at 304 Å in the extreme ultraviolet — the chromosphere. Assembled by CDS from a NASA/GSFC movie tracking the entire surface between 1 January and 27 September 2012. The orange is false colour: the eye cannot see this wavelength. Click to rotate this very map.",
    credit: "CDS / NASA GSFC (SVS 30362)",
    sourceUrl: "https://svs.gsfc.nasa.gov/30362",
  },
  surface: {
    hipsUrl: `${SURFACE_BASE}/CDS_P_Sun_euvi-aia304-2012`,
    captionVi:
      "Bản đồ cầu toàn Mặt Trời ở 304 Å, CDS ghép năm 2012 — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được. Khác hành tinh, Mặt Trời đổi bộ mặt từng ngày, nên đây là một thời điểm cụ thể chứ không phải bộ mặt cố định của nó.",
    captionEn:
      "Whole-Sun spherical map at 304 Å, assembled by CDS in 2012 — the same image shown on the card, now free to rotate and zoom. Unlike a planet, the Sun changes from day to day, so this is one particular moment rather than a fixed face.",
    credit: "CDS / NASA SDO",
  },
};

/**
 * Mặt Trăng.
 *
 * Đứng riêng chứ không nằm trong `PLANETS`: kiểu `Planet` mang `orbitSpeed`
 * và `realDistanceKm` — cả hai đều đo so với Mặt Trời.
 * Nhét Mặt Trăng vào đó thì hoặc phải bịa số, hoặc phải cho những trường ấy
 * thành tuỳ chọn cho cả tám hành tinh vốn luôn có chúng. Thư viện ảnh lấy nó
 * vào danh sách riêng, ngay sau Trái Đất.
 */
export const MOON = {
  id: "moon",
  name: "Mặt Trăng",
  nameEn: "The Moon",
  articleSlug: "mat-trang",
  color: "#cbd5e1",
  texture: `${TEXTURE_BASE}/2/26/Solarsystemscope_texture_2k_moon.jpg/1280px-Solarsystemscope_texture_2k_moon.jpg`,
  realRadiusKm: 1737.4,
  temperatureC: -20,
  gravity: 1.62,
  descriptionVi:
    "Vệ tinh duy nhất của Trái Đất, cách 384.400 km. Nó luôn quay cùng một mặt về phía chúng ta vì chu kỳ tự quay đã bị khoá bằng đúng chu kỳ quỹ đạo.",
  descriptionEn:
    "Earth's only natural satellite, 384,400 km away. It keeps one face turned toward us because its spin is locked to its orbital period.",
  photo: {
    url: "/images/moon-lroc-wac.jpg",
    captionVi:
      "Bản đồ hình thái toàn cầu của máy WAC trên tàu Lunar Reconnaissance Orbiter, 100 m mỗi điểm ảnh. Vùng sẫm quanh cực bắc là bóng thật do Mặt Trời ở đó luôn sà sát chân trời, không phải chỗ thiếu dữ liệu. Bấm vào để xoay chính bản đồ này.",
    captionEn:
      "Global morphologic map from the Wide Angle Camera on Lunar Reconnaissance Orbiter, 100 m per pixel. The dark region around the north pole is genuine shadow — the Sun never rises far above the horizon there — not missing data. Click to rotate this very map.",
    credit: "NASA / GSFC / Arizona State University",
    sourceUrl: "https://wms.lroc.asu.edu/lroc/view_rdr/WAC_GLOBAL",
  },
  surface: {
    hipsUrl: `${SURFACE_BASE}/CDS_P_Moon_LROC-WAC-100m`,
    captionVi:
      "Bản đồ WAC của Lunar Reconnaissance Orbiter — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được.",
    captionEn:
      "The Lunar Reconnaissance Orbiter WAC map — the same image shown on the card, now free to rotate and zoom.",
    credit: "NASA / GSFC / Arizona State University",
  },
};

export const PLANETS: Planet[] = [
  {
    id: "mercury",
    name: "Sao Thuỷ",
    nameEn: "Mercury",
    articleSlug: "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
    color: "#9c8f84",
    displayRadius: 0.38,
    orbitSpeed: 1.607,
    spinSpeed: 0.017,
    axialTilt: 0.03,
    eccentricity: 0.2056,
    inclinationDeg: 7,
    texture: `${TEXTURE_BASE}/9/92/Solarsystemscope_texture_2k_mercury.jpg/1280px-Solarsystemscope_texture_2k_mercury.jpg`,
    realRadiusKm: 2439.7,
    realDistanceKm: 57_900_000,
    orbitalPeriodDays: 88,
    dayLengthHours: 4222.6,
    moons: 0,
    temperatureC: 167,
    gravity: 3.7,
    descriptionVi:
      "Hành tinh nhỏ nhất và gần Mặt Trời nhất. Không có khí quyển đáng kể nên chênh lệch nhiệt độ ngày–đêm lên tới 600°C.",
    descriptionEn:
      "The smallest planet and the closest to the Sun. With almost no atmosphere, its day-night temperature swing reaches 600°C.",
    /**
     * Bìa lấy từ chính bản đồ tăng màu mà thẻ này mở ra, cùng lý do như Mặt
     * Trời: bấm vào thì hình không được đổi.
     *
     * Bìa cũ là ảnh màu thật của MESSENGER. Nó đúng về mặt quang học nhưng
     * sai về mặt truyền đạt ở hai đầu. Một là nó không khớp bản đồ: bấm vào
     * là một quả cầu xám biến thành một quả cầu lam vàng. Hai là ở màu thật,
     * Sao Thuỷ trông y hệt Mặt Trăng — cả hai đều là thiên thể không khí
     * quyển, bề mặt cổ đầy hố va chạm, suất phản chiếu 0,14 với 0,12 — nên
     * người đọc lướt qua thẻ này thường tưởng đặt nhầm ảnh.
     *
     * Đánh đổi phải trả bằng chú thích, không được giấu: đây KHÔNG phải màu
     * mắt thấy, và câu đầu tiên của chú thích phải nói đúng điều đó.
     */
    photo: {
      url: "/images/mercury-mdis-enhanced.jpg",
      captionVi:
        "Không phải màu mắt thấy — nhìn thẳng thì Sao Thuỷ xám như Mặt Trăng. Đây là ảnh tăng màu của máy MDIS trên tàu MESSENGER: ba dải 430, 750 và 1000 nm được phân tích thành phần chính rồi gán vào đỏ, lục, lam, để lộ ra những loại đá mà mắt không tách nổi. Bấm vào để xoay chính bản đồ này.",
      captionEn:
        "Not what the eye would see — to the naked eye Mercury is as grey as the Moon. This is an enhanced-colour mosaic from MESSENGER's MDIS: the 430, 750 and 1000 nm bands run through a principal-component analysis and mapped to red, green and blue, which pulls apart rock types the eye cannot separate. Click to rotate this very map.",
      credit: "USGS Astrogeology / NASA (qua CDS)",
      sourceUrl:
        "https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_basemap_enhanced_color_global_mosaic_665m",
    },
    surface: {
      hipsUrl: `${SURFACE_BASE}/CDS_P_Mercury_MDIS-enhanced-color`,
      captionVi:
        "Ghép ảnh của máy MDIS trên tàu MESSENGER — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được. Màu được đẩy lên để tách các loại đá khác nhau, không phải màu mắt thấy.",
      captionEn:
        "MESSENGER MDIS mosaic — the same image shown on the card, now free to rotate and zoom. Colour is stretched to separate rock types, not what the eye would see.",
      credit: "USGS Astrogeology / NASA",
    },
  },
  {
    id: "venus",
    name: "Sao Kim",
    nameEn: "Venus",
    articleSlug: "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
    color: "#e8c39e",
    displayRadius: 0.62,
    orbitSpeed: 1.174,
    spinSpeed: -0.004,
    axialTilt: 177.4,
    eccentricity: 0.0068,
    inclinationDeg: 3.39,
    texture: `${TEXTURE_BASE}/6/63/Solarsystemscope_texture_2k_venus_atmosphere.jpg/1280px-Solarsystemscope_texture_2k_venus_atmosphere.jpg`,
    realRadiusKm: 6051.8,
    realDistanceKm: 108_200_000,
    orbitalPeriodDays: 224.7,
    dayLengthHours: 2802,
    moons: 0,
    temperatureC: 464,
    gravity: 8.9,
    descriptionVi:
      "Hành tinh nóng nhất hệ vì hiệu ứng nhà kính cực đoan từ khí quyển CO₂ dày đặc. Nó tự quay ngược chiều so với hầu hết hành tinh khác.",
    descriptionEn:
      "The hottest planet, thanks to a runaway greenhouse effect in its dense CO₂ atmosphere. It spins backwards relative to most other planets.",
    /**
     * Bìa dựng từ chính bản đồ radar mà thẻ này mở ra.
     *
     * Bìa cũ là ảnh MESSENGER chụp trong ánh sáng nhìn thấy: một quả cầu
     * trắng ngà không chi tiết, vì mây acid sulfuric che kín bề mặt. Bấm vào
     * thì hiện ra một quả cầu bảy sắc — không còn một điểm chung nào với tấm
     * ảnh vừa bấm.
     *
     * Hai tấm ảnh đó không mâu thuẫn: một tấm là ĐỈNH MÂY, tấm kia là BỀ MẶT
     * dưới lớp mây, đo bằng radar xuyên mây của tàu Magellan. Nhưng chú thích
     * phải nói ra điều đó, vì không ai đoán được từ hai tấm ảnh.
     */
    photo: {
      url: "/images/venus-magellan.jpg",
      captionVi:
        "Không phải màu mắt thấy, và cũng không phải thứ nhìn được từ ngoài: mây acid sulfuric che kín Sao Kim. Đây là bề mặt bên dưới, do radar tàu Magellan quét xuyên mây; màu mã hoá độ cao — lam là đồng bằng thấp, đỏ là cao nguyên. Bấm vào để xoay chính bản đồ này.",
      captionEn:
        "Neither true colour nor anything visible from outside: sulfuric-acid cloud hides Venus completely. This is the surface beneath, mapped by Magellan's cloud-piercing radar, with colour coding elevation — blue for low plains, red for highlands. Click to rotate this very map.",
      credit: "NASA / JPL — Magellan",
      sourceUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA00271",
    },
    surface: {
      hipsUrl: `${SURFACE_BASE}/CDS_P_Venus_Magellan_C3-MDIR-ClrTopo-6600m-color`,
      captionVi:
        "Bản đồ radar của tàu Magellan — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được. Màu mã hoá độ cao chứ không phải màu thật.",
      captionEn:
        "The Magellan radar map — the same image shown on the card, now free to rotate and zoom. Colour codes elevation, not real colour.",
      credit: "NASA / JPL — Magellan",
    },
  },
  {
    id: "earth",
    name: "Trái Đất",
    nameEn: "Earth",
    articleSlug: "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
    color: "#2e6fdb",
    emissive: "#0b2a5c",
    displayRadius: 0.65,
    orbitSpeed: 1,
    spinSpeed: 1,
    axialTilt: 23.4,
    eccentricity: 0.0167,
    inclinationDeg: 0,
    texture: `${TEXTURE_BASE}/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg/1280px-Solarsystemscope_texture_2k_earth_daymap.jpg`,
    realRadiusKm: 6371,
    realDistanceKm: 149_600_000,
    orbitalPeriodDays: 365.2,
    dayLengthHours: 24,
    moons: 1,
    temperatureC: 15,
    gravity: 9.8,
    descriptionVi:
      "Hành tinh duy nhất được biết có sự sống, với nước lỏng trên bề mặt và từ quyển che chắn gió Mặt Trời.",
    descriptionEn:
      "The only planet known to host life, with liquid surface water and a magnetosphere shielding it from the solar wind.",
    /**
     * Bìa dựng từ chính bản đồ Blue Marble mà thẻ này mở ra.
     *
     * Bìa cũ là ảnh Apollo 17 chụp năm 1972 — nổi tiếng, nhưng nó cho thấy
     * châu Phi và Nam Cực dưới một góc chiếu khác hẳn, nên bấm vào là quả cầu
     * xoay sang một bán cầu khác với tông màu khác.
     */
    photo: {
      url: "/images/earth-bluemarble.jpg",
      captionVi:
        "Blue Marble của NASA: ghép từ dữ liệu vệ tinh MODIS, mỗi điểm ảnh lấy ngày quang mây nhất trong tháng nên không có đám mây nào che đất. Đây là bề mặt thật ở màu mắt thấy. Bấm vào để xoay chính bản đồ này.",
      captionEn:
        "NASA's Blue Marble: composed from MODIS satellite data, each pixel taken from the clearest day of the month, so no cloud hides the ground. This is the real surface in visible light. Click to rotate this very map.",
      credit: "NASA Earth Observatory",
      sourceUrl: "https://visibleearth.nasa.gov/collection/1484/blue-marble",
    },
    surface: {
      hipsUrl: `${SURFACE_BASE}/CDS_P_Earth_BlueMarble`,
      captionVi:
        "Bản đồ Blue Marble — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được.",
      captionEn:
        "The Blue Marble map — the same image shown on the card, now free to rotate and zoom.",
      credit: "NASA Earth Observatory",
    },
  },
  {
    id: "mars",
    name: "Sao Hoả",
    nameEn: "Mars",
    articleSlug: "sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc",
    color: "#c1440e",
    displayRadius: 0.45,
    orbitSpeed: 0.531,
    spinSpeed: 0.97,
    axialTilt: 25.2,
    eccentricity: 0.0934,
    inclinationDeg: 1.85,
    texture: `${TEXTURE_BASE}/4/46/Solarsystemscope_texture_2k_mars.jpg/1280px-Solarsystemscope_texture_2k_mars.jpg`,
    realRadiusKm: 3389.5,
    realDistanceKm: 228_000_000,
    orbitalPeriodDays: 687,
    dayLengthHours: 24.7,
    moons: 2,
    temperatureC: -65,
    gravity: 3.7,
    descriptionVi:
      "Màu đỏ đến từ sắt oxit trên bề mặt. Đây là nơi có Olympus Mons — ngọn núi lửa cao nhất trong Hệ Mặt Trời.",
    descriptionEn:
      "Its red colour comes from surface iron oxide. It hosts Olympus Mons, the tallest volcano in the Solar System.",
    photo: {
      url: "/images/mars-viking-mdim21.jpg",
      captionVi:
        "Ghép ảnh màu từ các tàu quỹ đạo Viking, bản MDIM 2.1 của USGS ở 232 m mỗi điểm ảnh. Chỏm băng bắc nằm ở phía trên; vệt sẫm chạy ngang là vùng Syrtis Major. Bấm vào để xoay chính bản đồ này.",
      captionEn:
        "Colour mosaic from the Viking orbiters — the USGS MDIM 2.1 basemap at 232 m per pixel. The north polar cap sits at the top; the dark streak across the middle is Syrtis Major. Click to rotate this very map.",
      credit: "USGS Astrogeology / NASA (Viking)",
      sourceUrl:
        "https://astrogeology.usgs.gov/search/map/mars_viking_mdim21_clrmosaic_global_232m",
    },
    /**
     * Viking MDIM 2.1 chứ không phải bản ghép HRSC của Mars Express.
     *
     * Bản Mars Express phủ kín theo metadata — `moc_sky_fraction` bằng 1 —
     * nhưng chính các ô tile chứa vùng chưa chụp, và chúng là màu đen. Trên
     * quả cầu, nó hiện thành hàng chục vệt đen dọc cắt ngang bề mặt, trông
     * đúng như bản đồ bị hỏng. Không có cách nào phát hiện kiểu hỏng này qua
     * metadata: MOC chỉ biết có tile hay không, không biết trong tile có dữ
     * liệu hay không.
     *
     * MDIM 2.1 cũ hơn và thô hơn (232 m so với 12,5 m chỗ tốt nhất của HRSC)
     * nhưng liền mạch toàn cầu. Một bản đồ thấp phân giải mà kín thì đọc được;
     * một bản đồ sắc nét mà thủng lỗ chỗ thì không.
     */
    surface: {
      hipsUrl: `${SURFACE_BASE}/Mars_Viking_MDIM21`,
      captionVi:
        "Ghép ảnh màu toàn cầu từ các tàu quỹ đạo Viking — chính là tấm ảnh trên thẻ, giờ xoay và phóng to được.",
      captionEn:
        "Global colour mosaic from the Viking orbiters — the same image shown on the card, now free to rotate and zoom.",
      credit: "USGS Astrogeology / NASA",
    },
  },
  {
    id: "jupiter",
    name: "Sao Mộc",
    nameEn: "Jupiter",
    articleSlug: "sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he",
    color: "#d8a47f",
    displayRadius: 1.9,
    orbitSpeed: 0.084,
    spinSpeed: 2.42,
    axialTilt: 3.1,
    eccentricity: 0.0489,
    inclinationDeg: 1.3,
    texture: `${TEXTURE_BASE}/b/be/Solarsystemscope_texture_2k_jupiter.jpg/1280px-Solarsystemscope_texture_2k_jupiter.jpg`,
    realRadiusKm: 69_911,
    realDistanceKm: 778_500_000,
    orbitalPeriodDays: 4331,
    dayLengthHours: 9.9,
    moons: 95,
    temperatureC: -110,
    gravity: 23.1,
    descriptionVi:
      "Hành tinh lớn nhất, khối lượng gấp 2,5 lần tất cả hành tinh còn lại cộng lại. Vết Đỏ Lớn là cơn bão đã tồn tại hàng trăm năm.",
    descriptionEn:
      "The largest planet, 2.5 times the mass of every other planet combined. The Great Red Spot is a storm centuries old.",
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
      captionVi:
        "Kính Hubble chụp trong chương trình theo dõi các hành tinh ngoài. Vết Đỏ Lớn đang thu nhỏ dần qua từng năm.",
      captionEn:
        "Hubble, from its outer-planet monitoring programme. The Great Red Spot has been shrinking year on year.",
      credit: "NASA, ESA và A. Simon (GSFC)",
      sourceUrl: `${COMMONS_FILE}Jupiter_and_its_shrunken_Great_Red_Spot.jpg`,
    },
    surface: {
      hipsUrl: `${SURFACE_BASE}/CDS_P_Jupiter_PIA07782`,
      captionVi:
        "Bản đồ trải phẳng đỉnh tầng mây, dựng từ ảnh tàu Cassini.",
      captionEn:
        "Flattened map of the cloud tops, built from Cassini imagery.",
      credit: "NASA / JPL / Space Science Institute",
    },
  },
  {
    id: "saturn",
    name: "Sao Thổ",
    nameEn: "Saturn",
    articleSlug: "sao-tho-vanh-dai-mong-manh-va-ve-tinh-co-dai-duong",
    color: "#e3d5a1",
    displayRadius: 1.6,
    orbitSpeed: 0.034,
    spinSpeed: 2.24,
    axialTilt: 26.7,
    eccentricity: 0.0565,
    inclinationDeg: 2.49,
    texture: `${TEXTURE_BASE}/e/ea/Solarsystemscope_texture_2k_saturn.jpg/1280px-Solarsystemscope_texture_2k_saturn.jpg`,
    /*
     * Đơn vị là BÁN KÍNH HÀNH TINH, không phải đơn vị cảnh.
     *
     * Trước đây ghi 2,1–3,4 và đó là lý do Sao Thổ trông to hơn Sao Mộc: bề
     * ngang của nó thành 6,8 bán kính, trong khi hai quả cầu vốn đúng tỉ lệ
     * (69.911 km so với 58.232, tức 1,20 lần — và displayRadius 1,9 so với
     * 1,6 đúng bằng 1,19).
     *
     * Số thật: vành C bắt đầu ở 74.500 km và mép ngoài vành A ở 136.780 km,
     * chia cho bán kính 58.232 ra 1,28 và 2,35. Ở con số đó Sao Thổ vẫn rộng
     * hơn Sao Mộc — nhưng đó là sự thật chứ không phải lỗi vẽ.
     */
    ring: { inner: 1.28, outer: 2.35, color: "#d8c9a3", opacity: 0.75 },
    realRadiusKm: 58_232,
    realDistanceKm: 1_432_000_000,
    orbitalPeriodDays: 10_747,
    dayLengthHours: 10.7,
    moons: 146,
    temperatureC: -140,
    gravity: 9,
    descriptionVi:
      "Nổi tiếng với hệ vành đai băng và đá rộng hàng trăm nghìn km nhưng chỉ dày khoảng 10 mét ở nhiều chỗ.",
    descriptionEn:
      "Famous for rings of ice and rock spanning hundreds of thousands of kilometres yet only about ten metres thick in places.",
    photo: {
      url: `${TEXTURE_BASE}/c/c7/Saturn_during_Equinox.jpg/960px-Saturn_during_Equinox.jpg`,
      captionVi:
        "Tàu Cassini ghép từ hàng chục khung ảnh vào kỳ phân điểm năm 2009, khi Mặt Trời chiếu sát rìa vành đai nên mọi gợn cao thấp đều đổ bóng dài.",
      captionEn:
        "A Cassini mosaic of dozens of frames taken at the 2009 equinox, when sunlight grazed the ring plane and every ripple cast a long shadow.",
      credit: "NASA / JPL / Space Science Institute",
      sourceUrl: `${COMMONS_FILE}Saturn_during_Equinox.jpg`,
    },
    // CDS chưa phát HiPS bề mặt cho thiên thể này.
    surface: null,
  },
  {
    id: "uranus",
    name: "Sao Thiên Vương",
    nameEn: "Uranus",
    articleSlug: "sao-thien-vuong-hanh-tinh-lan-nghieng-tren-quy-dao",
    color: "#9fd8e0",
    displayRadius: 1.1,
    orbitSpeed: 0.012,
    spinSpeed: -1.39,
    axialTilt: 97.8,
    eccentricity: 0.0457,
    inclinationDeg: 0.77,
    texture: `${TEXTURE_BASE}/9/95/Solarsystemscope_texture_2k_uranus.jpg/1280px-Solarsystemscope_texture_2k_uranus.jpg`,
    // Vành ε nằm ở 51.149 km, chia cho bán kính 25.559 km ra đúng 2,00
    ring: { inner: 1.64, outer: 2.0, color: "#8fbfd0", opacity: 0.35 },
    realRadiusKm: 25_362,
    realDistanceKm: 2_867_000_000,
    orbitalPeriodDays: 30_589,
    dayLengthHours: 17.2,
    moons: 28,
    temperatureC: -195,
    gravity: 8.7,
    descriptionVi:
      "Trục quay nghiêng gần 98°, nghĩa là hành tinh này lăn nghiêng trên quỹ đạo thay vì quay như con quay.",
    descriptionEn:
      "Its axis is tilted nearly 98°, so the planet rolls along its orbit rather than spinning upright.",
    photo: {
      url: `${TEXTURE_BASE}/3/3d/Uranus2.jpg/960px-Uranus2.jpg`,
      captionVi:
        "Tàu Voyager 2 chụp năm 1986 — con tàu duy nhất từng bay ngang Sao Thiên Vương.",
      captionEn:
        "Voyager 2 in 1986, the only spacecraft ever to fly past Uranus.",
      credit: "NASA / JPL-Caltech",
      sourceUrl: `${COMMONS_FILE}Uranus2.jpg`,
    },
    // CDS chưa phát HiPS bề mặt cho thiên thể này.
    surface: null,
  },
  {
    id: "neptune",
    name: "Sao Hải Vương",
    nameEn: "Neptune",
    articleSlug: "sao-hai-vuong-hanh-tinh-tim-ra-bang-toan-hoc",
    color: "#3b5fd4",
    displayRadius: 1.05,
    orbitSpeed: 0.006,
    spinSpeed: 1.49,
    axialTilt: 28.3,
    eccentricity: 0.0113,
    inclinationDeg: 1.77,
    texture: `${TEXTURE_BASE}/1/1e/Solarsystemscope_texture_2k_neptune.jpg/1280px-Solarsystemscope_texture_2k_neptune.jpg`,
    realRadiusKm: 24_622,
    realDistanceKm: 4_515_000_000,
    orbitalPeriodDays: 59_800,
    dayLengthHours: 16.1,
    moons: 16,
    temperatureC: -200,
    gravity: 11,
    descriptionVi:
      "Hành tinh xa nhất, nơi có gió mạnh nhất Hệ Mặt Trời với vận tốc vượt 2.000 km/h.",
    descriptionEn:
      "The most distant planet, home to the fastest winds in the Solar System at over 2,000 km/h.",
    photo: {
      url: `${TEXTURE_BASE}/5/56/Neptune_Full.jpg/960px-Neptune_Full.jpg`,
      captionVi:
        "Tàu Voyager 2 chụp năm 1989. Vệt sẫm là Đại Hắc Ban, cơn bão đã tan mất khi Hubble nhìn lại vào năm 1994.",
      captionEn:
        "Voyager 2 in 1989. The dark patch is the Great Dark Spot, a storm that had vanished by the time Hubble looked again in 1994.",
      credit: "NASA / JPL",
      sourceUrl: `${COMMONS_FILE}Neptune_Full.jpg`,
    },
    surface: {
      hipsUrl: `${SURFACE_BASE}/CDS_P_Neptune_Voyager2`,
      captionVi:
        "Bản đồ dựng từ ảnh tàu Voyager 2 năm 1989.",
      captionEn:
        "Map built from Voyager 2 imagery taken in 1989.",
      credit: "NASA / JPL — Voyager 2",
    },
  },
];

export const AU_KM = 149_600_000;

/**
 * Hành tinh lùn ngoài Sao Hải Vương.
 *
 * Thêm vào để sửa nốt hiểu sai mà vành đai Kuiper mới chỉ sửa một nửa: hệ
 * không kết thúc ở Sao Hải Vương, và thứ nằm ngoài đó không phải bụi vô danh
 * mà là những thế giới có tên, có đường kính nghìn km, có vệ tinh riêng.
 *
 * Chúng cũng là nơi thấy rõ nhất hai đại lượng mà tám hành tinh giấu đi vì
 * quá nhỏ: Eris lệch tâm 0,44 và nghiêng 44 độ. Vẽ đúng hai con số đó thì
 * người xem hiểu ngay vì sao ranh giới "hành tinh" lại thành một cuộc tranh
 * cãi — quỹ đạo của chúng không giống quỹ đạo hành tinh chút nào.
 */
export const DWARF_PLANETS = [
  {
    id: "pluto",
    name: "Sao Diêm Vương",
    nameEn: "Pluto",
    articleSlug: "tai-sao-pluto-khong-con-la-hanh-tinh",
    color: "#c9b39a",
    au: 39.48,
    eccentricity: 0.2488,
    inclinationDeg: 17.16,
    realRadiusKm: 1188,
    note: "Cộng hưởng 2:3 với Sao Hải Vương, nên dù quỹ đạo cắt qua quỹ đạo Sao Hải Vương thì hai bên không bao giờ gặp nhau.",
    noteEn:
      "Locked in a 2:3 resonance with Neptune, so although their orbits cross, the two never meet.",
  },
  {
    id: "eris",
    name: "Eris",
    nameEn: "Eris",
    articleSlug: "eris",
    color: "#dfe6ef",
    au: 67.78,
    eccentricity: 0.4407,
    inclinationDeg: 44.04,
    realRadiusKm: 1163,
    note: "Phát hiện năm 2005, nặng hơn Sao Diêm Vương — chính nó buộc giới thiên văn định nghĩa lại thế nào là hành tinh.",
    noteEn:
      "Found in 2005 and more massive than Pluto — it is what forced astronomers to define what a planet is.",
  },
  {
    id: "haumea",
    name: "Haumea",
    nameEn: "Haumea",
    articleSlug: "haumea",
    color: "#e8e2d8",
    au: 43.13,
    eccentricity: 0.1912,
    inclinationDeg: 28.21,
    realRadiusKm: 816,
    note: "Quay một vòng chỉ mất 3,9 giờ, nhanh tới mức lực ly tâm kéo nó thành hình quả trứng dài gấp đôi bề ngang.",
    noteEn:
      "It spins once every 3.9 hours, fast enough that centrifugal force has stretched it into an egg twice as long as it is wide.",
  },
  {
    id: "makemake",
    name: "Makemake",
    nameEn: "Makemake",
    articleSlug: "makemake",
    color: "#d8b49c",
    au: 45.43,
    eccentricity: 0.159,
    inclinationDeg: 28.98,
    realRadiusKm: 715,
    note: "Bề mặt phủ băng methane. Mãi tới 2016 mới phát hiện nó có một vệ tinh nhỏ.",
    noteEn:
      "Its surface is coated in methane ice. A small moon was only found in 2016.",
  },
] as const;

/**
 * Ba tiểu hành tinh lớn nhất, đặt đúng bán trục lớn của chúng.
 *
 * Vành đai tiểu hành tinh vẽ bằng vài nghìn chấm vô danh thì đọc ra là một
 * đám bụi. Ba cái tên này nói điều ngược lại: trong đám đó có những vật thể
 * đủ lớn để có tên, và Ceres đủ lớn để tự kéo mình thành hình cầu — nó vừa là
 * tiểu hành tinh vừa là hành tinh lùn.
 */
export const NAMED_ASTEROIDS = [
  {
    id: "ceres",
    name: "Ceres",
    nameEn: "Ceres",
    au: 2.77,
    realRadiusKm: 473,
    note: "Vật thể lớn nhất vành đai, và là hành tinh lùn duy nhất nằm trong quỹ đạo Sao Hải Vương.",
    noteEn:
      "The largest object in the belt, and the only dwarf planet inside Neptune's orbit.",
  },
  {
    id: "vesta",
    name: "Vesta",
    nameEn: "Vesta",
    au: 2.36,
    realRadiusKm: 262,
    note: "Sáng nhất vành đai; những lúc thuận lợi có thể thấy bằng mắt thường.",
    noteEn:
      "The brightest object in the belt; under good conditions it is visible to the naked eye.",
  },
  {
    id: "pallas",
    name: "Pallas",
    nameEn: "Pallas",
    au: 2.77,
    realRadiusKm: 256,
    note: "Quỹ đạo nghiêng 35 độ so với mặt phẳng hoàng đạo — nghiêng nhất trong các vật thể lớn của vành đai.",
    noteEn:
      "Its orbit is tilted 35° to the ecliptic, the steepest of any large belt object.",
  },
] as const;

/**
 * Bảy vệ tinh đáng xem, gắn với hành tinh mẹ.
 *
 * `orbitKm` là bán kính quỹ đạo thật. Nó KHÔNG dùng trực tiếp để vẽ: quỹ đạo
 * Mặt Trăng rộng 384.400 km, còn khoảng cách Trái Đất–Mặt Trời là 149,6 triệu
 * km — tỉ lệ 1:389, nên vẽ đúng tỉ lệ thì mọi vệ tinh nằm trong đúng một điểm
 * ảnh của hành tinh mẹ. Hệ số phóng đại nằm ở `scene.tsx`, cùng chỗ vẽ.
 */
export const MOONS = [
  {
    id: "moon",
    planetId: "earth",
    name: "Mặt Trăng",
    nameEn: "The Moon",
    orbitKm: 384_400,
    realRadiusKm: 1737.4,
    periodDays: 27.3,
    color: "#d6d6d6",
  },
  {
    id: "io",
    planetId: "jupiter",
    name: "Io",
    nameEn: "Io",
    orbitKm: 421_700,
    realRadiusKm: 1821.6,
    periodDays: 1.77,
    color: "#e8d16a",
  },
  {
    id: "europa",
    planetId: "jupiter",
    name: "Europa",
    nameEn: "Europa",
    orbitKm: 671_034,
    realRadiusKm: 1560.8,
    periodDays: 3.55,
    color: "#e0d5c0",
  },
  {
    id: "ganymede",
    planetId: "jupiter",
    name: "Ganymede",
    nameEn: "Ganymede",
    orbitKm: 1_070_412,
    realRadiusKm: 2634.1,
    periodDays: 7.15,
    color: "#b6a894",
  },
  {
    id: "callisto",
    planetId: "jupiter",
    name: "Callisto",
    nameEn: "Callisto",
    orbitKm: 1_882_709,
    realRadiusKm: 2410.3,
    periodDays: 16.69,
    color: "#8d8377",
  },
  {
    id: "titan",
    planetId: "saturn",
    name: "Titan",
    nameEn: "Titan",
    orbitKm: 1_221_870,
    realRadiusKm: 2574.7,
    periodDays: 15.95,
    color: "#d9a441",
  },
  {
    id: "triton",
    planetId: "neptune",
    name: "Triton",
    nameEn: "Triton",
    orbitKm: 354_759,
    realRadiusKm: 1353.4,
    /*
     * Dấu âm là chuyển động NGHỊCH HÀNH: Triton quay quanh Sao Hải Vương
     * ngược chiều hành tinh tự quay. Đó là bằng chứng mạnh nhất cho giả
     * thuyết nó vốn là một vật thể vành đai Kuiper bị bắt giữ, chứ không
     * hình thành cùng hành tinh — nên dấu này phải giữ, không được lấy trị
     * tuyệt đối cho tiện.
     */
    periodDays: -5.88,
    color: "#c7b8a8",
  },
] as const;

/**
 * Bán kính quỹ đạo ở CHẾ ĐỘ GIÁO DỤC: tỉ lệ với căn bậc hai khoảng cách thật.
 *
 * Trước đây tám con số này được đặt tay — 6, 8,4, 11,2, 15, 22, 29, 36, 43 —
 * và bốn hành tinh ngoài cách đều nhau đúng 7 đơn vị. Hệ Mặt Trời thật thì
 * ngược hẳn: khoảng cách giữa Sao Thiên Vương và Sao Hải Vương là 10,9 AU,
 * gấp hơn ba lần khoảng cách Sao Mộc–Sao Thổ trong cùng bậc. Vẽ đều nhau là
 * dạy rằng hệ hành tinh được xếp thành hàng ngay ngắn, mà điều đáng nhớ nhất
 * về nó lại là các khoảng trống cứ mỗi bậc lại nở ra.
 *
 * Căn bậc hai giữ được thứ tự và giữ được việc khoảng cách nở ra, mà vẫn kéo
 * Sao Hải Vương từ 30 AU về một chỗ nhìn thấy được. Nói thành lời thì đây là
 * quy tắc duy nhất: **vẽ xa gấp đôi nghĩa là thật ra xa gấp bốn**.
 *
 * Với hệ số 11,2 cho Trái Đất, tám hành tinh rơi vào 7,0 · 9,5 · 11,2 · 13,8
 * · 25,5 · 34,7 · 49,0 · 61,5. Sao Hải Vương lùi từ 43 ra 61, và các khoảng
 * trống ngoài đo được 11,7 · 9,1 · 14,4 · 12,5 thay vì đều đúng 7.
 *
 * Một hạn chế phải ghi ra vì nó không tự lộ: căn bậc hai nén mạnh dần về
 * phía ngoài, nên khoảng Sao Thiên Vương–Sao Hải Vương vẽ ra HẸP hơn khoảng
 * Sao Thổ–Sao Thiên Vương (12,5 so với 14,4), trong khi thực tế thì ngược
 * lại (11,0 AU so với 9,6). Thứ tự và chiều nở ra là đúng; riêng hai khoảng
 * ngoài cùng bị đảo. Sửa được bằng số mũ lớn hơn, nhưng đổi lại Sao Hải
 * Vương đi quá xa khung hình.
 */
const EDUCATIONAL_EARTH_ORBIT = 11.2;

export function educationalOrbitAu(au: number): number {
  return EDUCATIONAL_EARTH_ORBIT * Math.sqrt(au);
}

/** Bán kính quỹ đạo của một hành tinh ở chế độ giáo dục. */
export function educationalOrbit(planet: Planet): number {
  return educationalOrbitAu(planet.realDistanceKm / AU_KM);
}

/**
 * Hệ số nén đang dùng, để hiện cho người xem thay vì giấu đi.
 *
 * Ở chế độ giáo dục con số này thay đổi theo khoảng cách — đó chính là điều
 * khiến nó cần được nói ra. Hàm trả về "thật xa gấp bao nhiêu lần so với tỉ
 * lệ mà Trái Đất đang được vẽ".
 */
export function compressionAt(au: number): number {
  const drawn = educationalOrbitAu(au) / EDUCATIONAL_EARTH_ORBIT;
  return au / drawn;
}

/** Nén log dùng chung cho mọi thứ đặt theo tỉ lệ thật — hành tinh lẫn vành đai. */
function auToRealScale(au: number): number {
  return 6 + Math.log10(au + 1) * 46;
}

/** Bán kính quỹ đạo theo tỉ lệ thật, nén log để vẫn nhìn được trên màn hình. */
export function realScaleOrbit(planet: Planet): number {
  return auToRealScale(planet.realDistanceKm / AU_KM);
}

/**
 * Vành đai tiểu hành tinh chính, giữa quỹ đạo Sao Hoả và Sao Mộc.
 *
 * Tên đúng là **vành đai tiểu hành tinh**. Cách gọi "vành đai thiên thạch"
 * rất phổ biến nhưng sai: thiên thạch (meteorite) là mảnh đã rơi xuống mặt
 * đất, còn thứ nằm ngoài kia là tiểu hành tinh (asteroid). Kho này đã chốt
 * đính chính những nhầm lẫn cùng loại ở `chom-sao-hoang-dao` ("Thần Nông",
 * "Nhân Mã"), nên nhãn dùng tên đúng.
 *
 * Ranh giới 2,1–3,3 AU là vành đai chính. Nó chiếm khoảng nửa trong của
 * khoảng trống Sao Hoả–Sao Mộc chứ không lấp kín, và mô hình phải cho thấy
 * đúng như vậy.
 */
export const ASTEROID_BELT = {
  id: "asteroid-belt",
  name: "Vành đai tiểu hành tinh",
  nameEn: "Asteroid belt",
  innerAu: 2.1,
  outerAu: 3.3,
  color: "#c2b291",
  /**
   * Khe Kirkwood: những bán kính mà chu kỳ quỹ đạo cộng hưởng với Sao Mộc,
   * nên bị nó dọn gần sạch. Đơn vị AU, kèm bề rộng khe.
   *
   * Vẽ chúng vì một vành đai dày đều là hình sai: cái đáng nhớ nhất về vành
   * đai này là nó CÓ cấu trúc, và cấu trúc đó do Sao Mộc tạo ra.
   */
  kirkwoodGaps: [
    { au: 2.5, width: 0.045 }, // cộng hưởng 3:1
    { au: 2.82, width: 0.035 }, // 5:2
    { au: 2.96, width: 0.025 }, // 7:3
    { au: 3.27, width: 0.04 }, // 2:1
  ],
} as const;

/**
 * Bán kính trong/ngoài của vành đai trong toạ độ cảnh.
 *
 * Chế độ tỉ lệ thật dùng chung công thức nén log với hành tinh. Chế độ hiển
 * thị thì `orbitRadius` của hành tinh là số chỉnh tay chứ không theo công
 * thức nào, nên vành đai được nội suy tuyến tính giữa Sao Hoả và Sao Mộc theo
 * tỉ lệ AU — cách duy nhất giữ cho nó nằm đúng chỗ dù hai con số kia có được
 * chỉnh lại.
 */
/**
 * Vành đai Kuiper.
 *
 * Phần đông đúc nằm trong 30–50 AU, với lõi cộng hưởng quanh 39,4 AU nơi Sao
 * Diêm Vương và các "plutino" bị Sao Hải Vương khoá theo cộng hưởng 2:3. Mép
 * ngoài ở 50 AU là một vách thật chứ không phải chỗ hết dữ liệu: mật độ vật
 * thể sụt hẳn ở đó, và cho tới nay chưa ai giải thích dứt điểm được vì sao.
 *
 * Thêm nó vào là sửa một hiểu sai mà mô hình cũ tạo ra: hệ kết thúc ở Sao Hải
 * Vương. Sao Hải Vương chỉ là hành tinh ngoài cùng, không phải mép ngoài.
 */
export const KUIPER_BELT = {
  id: "kuiper-belt",
  name: "Vành đai Kuiper",
  nameEn: "The Kuiper belt",
  innerAu: 30,
  outerAu: 50,
  /** Cộng hưởng 2:3 với Sao Hải Vương — nơi Sao Diêm Vương ở */
  resonanceAu: 39.4,
  color: "#9fb6d4",
} as const;

/**
 * Đám mây Oort — vẽ theo sơ đồ, không theo tỉ lệ.
 *
 * Đây là chỗ duy nhất trong mô hình mà tỉ lệ bị phá vỡ có chủ ý, nên phải nói
 * thẳng: rìa trong của đám mây Oort ở khoảng 2.000 AU và rìa ngoài có thể tới
 * 100.000 AU. Ngay cả với phép nén căn bậc hai, 100.000 AU sẽ rơi ra 3.540
 * đơn vị cảnh — xa gấp 45 lần vành đai Kuiper, và mọi thứ còn lại của Hệ Mặt
 * Trời co về một chấm.
 *
 * Nên nó được vẽ như một vỏ cầu mờ ngay ngoài vành đai Kuiper, kèm nhãn nói
 * rõ khoảng cách thật. Một sơ đồ có ghi chú thì trung thực; một sơ đồ không
 * ghi chú mới là nói dối.
 */
export const OORT_CLOUD = {
  id: "oort-cloud",
  name: "Đám mây Oort",
  nameEn: "The Oort cloud",
  innerAu: 2_000,
  outerAu: 100_000,
  color: "#7c8db5",
} as const;

/** Bán kính trong/ngoài của vành đai Kuiper trong toạ độ cảnh. */
export function kuiperRadii(realScale: boolean): [number, number] {
  return realScale
    ? [auToRealScale(KUIPER_BELT.innerAu), auToRealScale(KUIPER_BELT.outerAu)]
    : [
        educationalOrbitAu(KUIPER_BELT.innerAu),
        educationalOrbitAu(KUIPER_BELT.outerAu),
      ];
}

export function beltRadii(realScale: boolean): [number, number] {
  if (realScale) {
    return [
      auToRealScale(ASTEROID_BELT.innerAu),
      auToRealScale(ASTEROID_BELT.outerAu),
    ];
  }
  /*
   * Cùng một quy luật với hành tinh, không nội suy giữa Sao Hoả và Sao Mộc
   * nữa. Nội suy tuyến tính giữa hai quỹ đạo cho ra vị trí lệch khỏi chính
   * quy luật đang đặt hai quỹ đạo đó, nên vành đai sẽ không còn nằm đúng chỗ
   * của nó so với hai hàng xóm.
   */
  return [
    educationalOrbitAu(ASTEROID_BELT.innerAu),
    educationalOrbitAu(ASTEROID_BELT.outerAu),
  ];
}

/** Bán kính hành tinh theo tỉ lệ thật so với Trái Đất (nén nhẹ). */
export function realScaleRadius(planet: Planet): number {
  const earthRadii = planet.realRadiusKm / 6371;
  return 0.28 * Math.pow(earthRadii, 0.62);
}

/**
 * Slug của các bài viết có quả cầu 3D.
 *
 * Dùng ở Server Component để quyết định CÓ tải `PlanetGlobe` hay không.
 * Trước đây trang bài gọi `<PlanetGlobe>` vô điều kiện và để component tự trả
 * `null` — nhưng lúc đó JS đã tải xong rồi: cả ~180 bài đều gánh bundle 3D
 * trong khi chỉ 9 bài dùng tới. Kiểm ở phía máy chủ thì bài không phải thiên
 * thể không tải gì cả.
 */
export const SOLAR_BODY_SLUGS: ReadonlySet<string> = new Set([
  SUN.articleSlug,
  ...PLANETS.map((planet) => planet.articleSlug),
]);
