import { stripDiacritics } from "@/lib/utils";

/**
 * Dữ liệu cho bản đồ bầu trời.
 *
 * ## Nguồn toạ độ
 *
 * Mọi toạ độ ở đây là J2000/ICRS, chép từ SIMBAD (CDS) — cùng cơ sở dữ liệu mà
 * Aladin dùng để giải tên, nên khung nhìn không lệch giữa hai đường: bấm vào
 * một mục trong danh sách và gõ tên vào ô tìm kiếm cho ra cùng một chỗ.
 *
 * Toạ độ để dạng chuỗi sexagesimal đúng như nguồn ghi; quy đổi sang độ nằm ở
 * `src/lib/sky-coords.ts`. Xem chú thích ở đó để biết vì sao.
 *
 * ## Vì sao có danh mục viết cứng trong khi Aladin đã có Sesame
 *
 * Sesame giải được mọi tên trong SIMBAD, nhưng nó là một lượt gọi mạng tới
 * Strasbourg: chậm, hỏng khi mạng kém, và không biết tên tiếng Việt. Danh mục
 * này trả kết quả tức thì cho những thiên thể người đọc tìm nhiều nhất, bằng
 * cả tên Việt lẫn tên catalog. Tên lạ vẫn rơi xuống Sesame — hai đường bổ sung
 * nhau chứ không thay nhau.
 *
 * ## `fovDeg`
 *
 * Bề rộng khung nhìn mặc định, đơn vị độ, đặt theo kích thước biểu kiến thật
 * của từng thiên thể. Không có nó thì một FOV dùng chung sẽ hoặc cắt cụt M31
 * (rộng hơn 3°) hoặc biến Sagittarius A* thành một điểm không thấy gì.
 */

/**
 * Địa chỉ script Aladin Lite.
 *
 * ## Vì sao không lấy thẳng từ máy chủ CDS nữa
 *
 * Đo ngày 2026-09-11, cùng lúc, cùng đường truyền:
 *
 *   aladin.cds.unistra.fr/.../v3/latest/aladin.js   1,8 MB —  83 giây
 *   cdn.jsdelivr.net/npm/aladin-lite@3.8.2/...      2,4 MB — 4,5 giây
 *
 * Chậm gấp mười tám lần, và 83 giây thì không còn là "tải lâu" mà là hỏng:
 * mọi khung bản đồ treo ở dòng "Đang tải bản đồ bầu trời…" cho tới khi người
 * xem bỏ đi. Đây chính là lỗi đã bị báo.
 *
 * `aladin-lite` trên npm là gói CHÍNH CHỦ của CDS — kho `cds-astro/aladin-lite`,
 * người phát hành là chính nhóm CDS. Không phải bản sao của bên thứ ba.
 *
 * ## Vì sao ghim 3.8.2 chứ không dùng `latest`
 *
 * `latest` trên npm đang là `3.9.0-beta`. Bản đồ bầu trời là tính năng nặng
 * nhất site và API của Aladin có tiền lệ đổi giữa các bản (xem
 * `src/types/aladin.ts`); nhận một bản beta tự động là mời một lượt hỏng mà
 * không ai bấm nút nào. 3.8.2 là bản ổn định mới nhất.
 *
 * ## Gói này là ES MODULE, không phải script thường
 *
 * Nó kết thúc bằng `export{P as default}` và không gán `window.A` bao giờ.
 * Bản UMD mà CDS tự phát thì có gán. `loadAladin()` trong
 * `hooks/use-aladin.ts` nạp qua một module trung gian để chịu được cả hai
 * dạng — đọc chú thích ở đó TRƯỚC KHI đổi giá trị này, vì lượt đổi CDN ngày
 * 2026-09-11 đã đổi URL mà không đổi cách nạp, và bản đồ chết hẳn.
 *
 * ## Đường lui
 *
 * Đặt `NEXT_PUBLIC_ALADIN_SCRIPT_URL` là quay lại được máy chủ CDS ngay, không
 * cần sửa mã — bản pin theo phiên bản là
 * `https://aladin.cds.unistra.fr/AladinLite/api/v3/3.8.2/aladin.js`. Chậm,
 * nhưng chạy.
 */
export const ALADIN_SCRIPT_URL =
  process.env.NEXT_PUBLIC_ALADIN_SCRIPT_URL ??
  "https://cdn.jsdelivr.net/npm/aladin-lite@3.8.2/dist/aladin.js";

/**
 * Máy chủ CDS — nơi Aladin xin ô tile HiPS và giải tên qua Sesame.
 *
 * Từ 2026-09-11 script KHÔNG lấy từ đây nữa vì quá chậm — máy chủ vẫn phát,
 * chỉ là 57 giây cho 1,8 MB (xem `ALADIN_SCRIPT_URL`). Vẫn đáng preconnect:
 * mỗi khung bản đồ kéo hàng chục ô tile từ đây.
 */
export const ALADIN_ORIGIN = "https://aladin.cds.unistra.fr";

/**
 * Máy chủ phát chính tệp script, suy ra từ `ALADIN_SCRIPT_URL`.
 *
 * Tách khỏi `ALADIN_ORIGIN` vì từ 2026-09-11 hai thứ KHÔNG còn cùng một máy
 * chủ: script lấy từ jsDelivr, còn ô tile HiPS vẫn từ CDS. Trang cần preconnect
 * cả hai, và suy ra từ chính hằng số URL thì đổi nguồn script một chỗ là xong,
 * không phải nhớ sửa thẻ preconnect ở chỗ khác.
 */
export const ALADIN_SCRIPT_ORIGIN = new URL(ALADIN_SCRIPT_URL).origin;

export const DEFAULT_SURVEY = "P/DSS2/color";
export const DEFAULT_FOV_DEG = 1.5;

export type SkySurvey = {
  /** Định danh HiPS trong sổ đăng ký của CDS */
  id: string;
  name: string;
  /** Dải sóng — để người đọc biết mình đang nhìn bằng "mắt" nào */
  band: string;
  bandEn: string;
};

export const SKY_SURVEYS: SkySurvey[] = [
  {
    id: "P/DSS2/color",
    name: "DSS2",
    band: "Khả kiến",
    bandEn: "Visible",
  },
  {
    id: "P/2MASS/color",
    name: "2MASS",
    band: "Hồng ngoại gần",
    bandEn: "Near-infrared",
  },
  {
    id: "P/allWISE/color",
    name: "AllWISE",
    band: "Hồng ngoại giữa",
    bandEn: "Mid-infrared",
  },
  {
    id: "P/SDSS9/color",
    name: "SDSS9",
    band: "Khả kiến, sâu",
    bandEn: "Visible, deep",
  },
  {
    id: "P/Mellinger/color",
    name: "Mellinger",
    band: "Toàn bầu trời",
    bandEn: "All-sky",
  },
];

export type SkyObjectKind =
  "GALAXY" | "NEBULA" | "STAR" | "CLUSTER" | "BLACK_HOLE" | "OTHER";

/**
 * Cần gì để nhìn thấy thiên thể này.
 *
 * Đây là thông tin người đọc hỏi đầu tiên và trang này chưa từng trả lời:
 * "tôi có thấy được nó không". Bốn bậc, xếp theo thiết bị tối thiểu.
 *
 * Ngưỡng lấy theo cấp sao biểu kiến và kích thước biểu kiến, trong điều kiện
 * trời tối tốt — không phải trong thành phố. M31 cấp 3,4 nhìn được bằng mắt
 * thường ở nông thôn nhưng vô hình giữa Hà Nội, và khác biệt đó lớn tới mức
 * phải nói ra trong chú thích chứ không giấu vào một cái nhãn.
 */
export type Visibility =
  "NAKED_EYE" | "BINOCULARS" | "SMALL_SCOPE" | "IMAGE_ONLY";

export const VISIBILITY_LABELS: Record<
  Visibility,
  { emoji: string; label: string; labelEn: string }
> = {
  NAKED_EYE: { emoji: "👁", label: "Mắt thường", labelEn: "Naked eye" },
  BINOCULARS: { emoji: "🔭", label: "Ống nhòm", labelEn: "Binoculars" },
  SMALL_SCOPE: {
    emoji: "🔭",
    label: "Kính thiên văn nhỏ",
    labelEn: "Small telescope",
  },
  IMAGE_ONLY: {
    emoji: "🛰",
    label: "Chỉ qua ảnh thiên văn",
    labelEn: "Astrophotography only",
  },
};

export type SkyTarget = {
  /** Khoá ổn định, dùng trong URL `?object=` */
  id: string;
  /** Định danh catalog chuẩn — thứ Sesame chắc chắn hiểu */
  catalogId: string;
  name: string;
  nameEn: string;
  /** Tên gọi khác, cả Việt lẫn Anh, phục vụ tìm kiếm */
  aliases: string[];
  kind: SkyObjectKind;
  /** J2000, sexagesimal. RA tính bằng giờ, Dec tính bằng độ. */
  ra: string;
  dec: string;
  /** Bề rộng khung nhìn mặc định (độ), theo kích thước biểu kiến */
  fovDeg: number;
  /** Chỉ đặt khi survey mặc định KHÔNG cho thấy được thiên thể này */
  survey?: string;
  constellation: string;
  constellationEn: string;
  blurb: string;
  blurbEn: string;
  /** Thiết bị tối thiểu để nhìn thấy — xem `Visibility` */
  visibility: Visibility;
  /** Ảnh 800×450 trong `/public/images/sky` */
  image: string;
  /**
   * Ghi nguồn ảnh. `null` khi ảnh thuộc phạm vi công cộng.
   *
   * Không phải trang trí: ảnh nào không phải phạm vi công cộng thì đây là
   * điều kiện của giấy phép. Betelgeuse là trường hợp duy nhất — mọi ảnh chụp
   * bề mặt nó đều của ESO/ALMA dưới CC BY 4.0.
   */
  imageCredit: string | null;
  /** Hai tới ba ý ngắn, mỗi ý một sự kiện kiểm được */
  facts: string[];
  factsEn: string[];
};

/**
 * Năm mục đầu là yêu cầu bắt buộc của tính năng; phần còn lại là những thiên
 * thể mà người mới mở bản đồ bầu trời hay tìm tới trước tiên.
 */
export const SKY_TARGETS: SkyTarget[] = [
  {
    /*
     * Tâm Dải Ngân Hà đứng ĐẦU danh sách, trước cả Andromeda.
     *
     * TÊN LÀ MỘT ĐÍNH CHÍNH. Mục này ban đầu đặt tên "Ngân Hà" / "The Milky
     * Way", trong khi cả ảnh lẫn khung nhìn đều là VÙNG TRUNG TÂM trong chòm
     * Nhân Mã. Gọi một vùng cụ thể bằng tên của cả thiên hà khiến người xem
     * tin rằng họ đang nhìn toàn bộ Dải Ngân Hà — nhầm lẫn ấy nằm đúng trên
     * trục mà một bách khoa khoa học không được phép sai.
     *
     * Quy tắc rút ra: đặt tên điểm đến theo THỨ KHUNG HÌNH THẬT SỰ CHỨA, không
     * theo thứ lớn nhất mà nó thuộc về.
     *
     * Bản đồ bầu trời trước đây có 10 điểm đến và không có cái nào là thiên
     * hà của chính chúng ta — trong khi mọi điểm đến còn lại đều nằm BÊN
     * TRONG nó hoặc được nhìn xuyên qua nó. Người mở bản đồ lần đầu không có
     * chỗ nào để thấy mình đang đứng ở đâu.
     *
     * Khác `sgr-a-star` ở quy mô, không ở toạ độ: cùng tâm, nhưng lỗ đen là
     * một điểm 0,3° còn đây là 90° — gần nửa bầu trời, đủ để thấy dải Ngân Hà
     * trải ngang chứ không phải một đám sao sáng.
     *
     * `catalogId` không phải mã catalog thật: thiên hà chứa chính người quan
     * sát thì không có số hiệu trong bất kỳ catalog nào. Trường này chỉ để
     * hiển thị, việc dẫn hướng đi bằng ra/dec, nên để tên thường là trung
     * thực hơn bịa một mã.
     */
    id: "galactic-centre",
    catalogId: "Galactic Centre",
    name: "Tâm Dải Ngân Hà",
    nameEn: "The Galactic Centre",
    aliases: [
      "Galactic Centre",
      "Galactic Center",
      "Tâm Ngân Hà",
      "Vùng trung tâm Dải Ngân Hà",
      "Hướng tâm Ngân Hà",
      "Sagittarius",
    ],
    kind: "GALAXY",
    // Tâm Ngân Hà, cùng toạ độ với Sgr A*.
    ra: "17 45 40.036",
    dec: "-29 00 28.17",
    // 90° — gần nửa bầu trời. Nhỏ hơn thì mất chính thứ cần thấy: dải sáng
    // trải ngang. Aladin chặn cứng ở 180°.
    fovDeg: 90,
    /* Mellinger là ảnh ghép TOÀN BẦU TRỜI ở bước sóng khả kiến, dựng cho đúng
       kiểu nhìn này. DSS2 mặc định là khảo sát theo ô nhỏ, độ sâu cao — kéo nó
       ra 90° thì được một tấm chắp vá lỗ chỗ chứ không ra dải Ngân Hà. */
    survey: "P/Mellinger/color",
    constellation: "Sagittarius",
    constellationEn: "Sagittarius",
    blurb:
      "Vùng trung tâm của Dải Ngân Hà, ở hướng chòm Nhân Mã và cách Mặt Trời khoảng 26.000 năm ánh sáng. Đây là phần dày đặc sao và bụi nhất trên bầu trời — không phải toàn bộ thiên hà, mà là chỗ ta nhìn về khi nhìn vào lõi của nó.",
    blurbEn:
      "The central region of the Milky Way, towards the constellation Sagittarius and about 26,000 light-years from the Sun. It is the densest patch of stars and dust in our sky — not the whole galaxy, but the direction we look when we look towards its core.",
    visibility: "NAKED_EYE",
    image: "/images/sky/galactic-centre.jpg",
    imageCredit: null,
    facts: [
      "Hệ Mặt Trời nằm trong Dải Ngân Hà, cách tâm khoảng 26.000 năm ánh sáng",
      "Ta đang nhìn về phía vùng trung tâm, trong chòm Nhân Mã",
      "Đây là khu vực dày đặc sao và bụi nhất trên bầu trời",
    ],
    factsEn: [
      "The Solar System sits about 26,000 light-years from the galactic centre",
      "We are looking towards that centre, in the constellation Sagittarius",
      "It is the densest patch of stars and dust in our sky",
    ],
  },
  {
    id: "m31",
    catalogId: "M31",
    name: "Thiên hà Andromeda",
    nameEn: "Andromeda Galaxy",
    aliases: ["M31", "Messier 31", "NGC 224", "Andromeda", "Tiên Nữ"],
    kind: "GALAXY",
    ra: "00 42 44.330",
    dec: "+41 16 07.50",
    fovDeg: 3,
    constellation: "Andromeda",
    constellationEn: "Andromeda",
    blurb:
      "Thiên hà xoắn ốc lớn gần Ngân Hà nhất, cách khoảng 2,5 triệu năm ánh sáng. Đường kính biểu kiến hơn 3 độ — rộng gấp sáu lần Mặt Trăng tròn.",
    blurbEn:
      "The nearest large spiral galaxy to the Milky Way, about 2.5 million light-years away. It spans over 3 degrees of sky, six times the width of the full Moon.",
    visibility: "NAKED_EYE",
    image: "/images/sky/m31.jpg",
    imageCredit: null,
    facts: [
      "Thiên hà lớn gần Ngân Hà nhất",
      "Cách 2,5 triệu năm ánh sáng",
      "Đang lao về phía ta 110 km/s",
    ],
    factsEn: [
      "The nearest large galaxy to the Milky Way",
      "2.5 million light-years away",
      "Approaching us at 110 km/s",
    ],
  },
  {
    id: "m87",
    catalogId: "M87",
    name: "Thiên hà M87",
    nameEn: "Messier 87",
    aliases: ["M87", "Messier 87", "NGC 4486", "Virgo A", "Xử Nữ A"],
    kind: "GALAXY",
    ra: "12 30 49.42",
    dec: "+12 23 28.0",
    fovDeg: 0.4,
    constellation: "Virgo",
    constellationEn: "Virgo",
    blurb:
      "Thiên hà elip khổng lồ ở tâm cụm Xử Nữ. Lỗ đen siêu khối lượng của nó là vật thể đầu tiên được chụp ảnh trực tiếp, công bố năm 2019.",
    blurbEn:
      "A giant elliptical galaxy at the centre of the Virgo Cluster. Its supermassive black hole was the first ever imaged directly, published in 2019.",
    visibility: "SMALL_SCOPE",
    image: "/images/sky/m87.jpg",
    imageCredit: null,
    facts: [
      "Chứa hố đen đầu tiên được chụp ảnh trực tiếp",
      "Hố đen nặng khoảng 6,5 tỉ lần Mặt Trời",
      "Nằm ở tâm cụm Virgo",
    ],
    factsEn: [
      "Home to the first black hole ever imaged",
      "That black hole weighs about 6.5 billion Suns",
      "Sits at the heart of the Virgo Cluster",
    ],
  },
  {
    id: "m42",
    catalogId: "M42",
    name: "Tinh vân Orion",
    nameEn: "Orion Nebula",
    aliases: ["M42", "Messier 42", "NGC 1976", "Orion Nebula", "Lạp Hộ"],
    kind: "NEBULA",
    ra: "05 35 16.8",
    dec: "-05 23 15",
    fovDeg: 2,
    constellation: "Orion",
    constellationEn: "Orion",
    blurb:
      "Vùng tạo sao khối lượng lớn gần Trái Đất nhất, cách khoảng 1.300 năm ánh sáng. Mắt thường nhìn thấy được như một vệt mờ trong thanh kiếm chòm Orion.",
    blurbEn:
      "The closest region of massive star formation to Earth, about 1,300 light-years away. Visible to the naked eye as a smudge in the sword of Orion.",
    visibility: "NAKED_EYE",
    image: "/images/sky/m42.jpg",
    imageCredit: null,
    facts: [
      "Vùng tạo sao gần Trái Đất nhất",
      "Cách khoảng 1.300 năm ánh sáng",
      "Nhìn thấy ở thanh kiếm chòm Orion",
    ],
    factsEn: [
      "The closest massive star-forming region to Earth",
      "About 1,300 light-years away",
      "Visible in the sword of Orion",
    ],
  },
  {
    id: "betelgeuse",
    catalogId: "Betelgeuse",
    name: "Sao Betelgeuse",
    nameEn: "Betelgeuse",
    aliases: [
      "Betelgeuse",
      "Alpha Orionis",
      "alf Ori",
      "HD 39801",
      "Sâm Tú Tứ",
    ],
    kind: "STAR",
    ra: "05 55 10.305",
    dec: "+07 24 25.43",
    fovDeg: 0.5,
    constellation: "Orion",
    constellationEn: "Orion",
    blurb:
      "Sao siêu khổng lồ đỏ ở vai chòm Orion, một trong những ngôi sao sáng nhất bầu trời. Độ sáng biến thiên rõ rệt và nó được xem là ứng viên siêu tân tinh.",
    blurbEn:
      "A red supergiant on the shoulder of Orion and one of the brightest stars in the sky. Its brightness varies markedly and it is considered a supernova candidate.",
    visibility: "NAKED_EYE",
    image: "/images/sky/betelgeuse.jpg",
    imageCredit: "ALMA (ESO/NAOJ/NRAO)/E. O'Gorman/P. Kervella — CC BY 4.0",
    facts: [
      "Sao siêu khổng lồ đỏ ở vai chòm Orion",
      "Nếu đặt ở chỗ Mặt Trời, nó nuốt tới quỹ đạo Sao Mộc",
      "Ứng viên siêu tân tinh trong 100.000 năm tới",
    ],
    factsEn: [
      "A red supergiant on Orion's shoulder",
      "Placed at the Sun, it would swallow Jupiter's orbit",
      "A supernova candidate within the next 100,000 years",
    ],
  },
  {
    id: "sgr-a-star",
    catalogId: "Sgr A*",
    name: "Lỗ đen Sagittarius A*",
    nameEn: "Sagittarius A*",
    aliases: ["Sgr A*", "Sagittarius A*", "Sagittarius A star", "Nhân Mã A*"],
    kind: "BLACK_HOLE",
    ra: "17 45 40.036",
    dec: "-29 00 28.17",
    fovDeg: 0.3,
    // Tâm Ngân Hà bị bụi che gần như hoàn toàn ở bước sóng khả kiến; ảnh DSS
    // chỉ cho một đám sao mờ. Hồng ngoại gần xuyên qua được lớp bụi đó.
    survey: "P/2MASS/color",
    constellation: "Sagittarius",
    constellationEn: "Sagittarius",
    blurb:
      "Lỗ đen siêu khối lượng ở tâm Ngân Hà, khối lượng khoảng 4 triệu lần Mặt Trời. Ảnh chụp trực tiếp được công bố năm 2022.",
    blurbEn:
      "The supermassive black hole at the centre of the Milky Way, about four million solar masses. Its direct image was published in 2022.",
    visibility: "IMAGE_ONLY",
    image: "/images/sky/sgr-a-star.jpg",
    imageCredit: null,
    facts: [
      "Hố đen siêu khối lượng ở tâm Ngân Hà",
      "Nặng khoảng 4 triệu lần Mặt Trời",
      "Ảnh trực tiếp công bố năm 2022",
    ],
    factsEn: [
      "The supermassive black hole at the Milky Way's centre",
      "About 4 million times the Sun's mass",
      "First direct image released in 2022",
    ],
  },
  {
    id: "m45",
    catalogId: "M45",
    name: "Cụm sao Pleiades",
    nameEn: "Pleiades",
    aliases: ["M45", "Messier 45", "Pleiades", "Tua Rua", "Thất Nữ"],
    kind: "CLUSTER",
    ra: "03 46 24.2",
    dec: "+24 06 50",
    fovDeg: 3,
    constellation: "Taurus",
    constellationEn: "Taurus",
    blurb:
      "Cụm sao phân tán trẻ, cách khoảng 440 năm ánh sáng. Mắt thường thấy sáu tới bảy ngôi; ống nhòm cho thấy hàng trăm.",
    blurbEn:
      "A young open cluster about 440 light-years away. Six or seven stars are visible to the naked eye; binoculars show hundreds.",
    visibility: "NAKED_EYE",
    image: "/images/sky/m45.jpg",
    imageCredit: null,
    facts: [
      "Cụm sao phân tán trẻ, cách 440 năm ánh sáng",
      "Mắt thường thấy sáu tới bảy ngôi",
      "Ống nhòm cho thấy hàng trăm",
    ],
    factsEn: [
      "A young open cluster 440 light-years away",
      "Six or seven stars to the naked eye",
      "Binoculars reveal hundreds",
    ],
  },
  {
    id: "m1",
    catalogId: "M1",
    name: "Tinh vân Crab",
    nameEn: "Crab Nebula",
    aliases: ["M1", "Messier 1", "NGC 1952", "Crab Nebula", "Con Cua"],
    kind: "NEBULA",
    ra: "05 34 31.8",
    dec: "+22 01 03",
    fovDeg: 0.4,
    constellation: "Taurus",
    constellationEn: "Taurus",
    blurb:
      "Tàn dư của siêu tân tinh mà các nhà thiên văn Trung Hoa ghi lại năm 1054. Ở tâm là một sao neutron quay khoảng 30 vòng mỗi giây.",
    blurbEn:
      "The remnant of a supernova recorded by Chinese astronomers in 1054. At its centre is a neutron star spinning about 30 times a second.",
    visibility: "SMALL_SCOPE",
    image: "/images/sky/m1.jpg",
    imageCredit: null,
    facts: [
      "Tàn dư siêu tân tinh mà sử Trung Hoa ghi năm 1054",
      "Ở tâm là một sao neutron quay 30 vòng mỗi giây",
      "Vẫn đang nở ra 1.500 km/s",
    ],
    factsEn: [
      "Remnant of the supernova Chinese astronomers recorded in 1054",
      "A neutron star at its centre spins 30 times a second",
      "Still expanding at 1,500 km/s",
    ],
  },
  {
    id: "m51",
    catalogId: "M51",
    name: "Thiên hà Whirlpool",
    nameEn: "Whirlpool Galaxy",
    aliases: ["M51", "Messier 51", "NGC 5194", "Whirlpool", "Xoáy Nước"],
    kind: "GALAXY",
    ra: "13 29 52.698",
    dec: "+47 11 42.93",
    fovDeg: 0.6,
    constellation: "Canes Venatici",
    constellationEn: "Canes Venatici",
    blurb:
      "Thiên hà xoắn ốc nhìn thẳng mặt, đang tương tác với thiên hà nhỏ NGC 5195. Đây là thiên hà đầu tiên được nhận ra là có cấu trúc xoắn ốc, năm 1845.",
    blurbEn:
      "A face-on spiral interacting with the smaller galaxy NGC 5195. It was the first galaxy recognised as having spiral structure, in 1845.",
    visibility: "BINOCULARS",
    image: "/images/sky/m51.jpg",
    imageCredit: null,
    facts: [
      "Thiên hà đầu tiên được nhận ra là có cấu trúc xoắn ốc, năm 1845",
      "Đang tương tác với thiên hà nhỏ NGC 5195",
      "Nhìn thẳng mặt nên thấy rõ hai nhánh",
    ],
    factsEn: [
      "The first galaxy recognised as a spiral, in 1845",
      "Interacting with the smaller galaxy NGC 5195",
      "Seen face-on, so both arms stand out",
    ],
  },
  {
    id: "m104",
    catalogId: "M104",
    name: "Thiên hà Sombrero",
    nameEn: "Sombrero Galaxy",
    aliases: ["M104", "Messier 104", "NGC 4594", "Sombrero"],
    kind: "GALAXY",
    ra: "12 39 59.432",
    dec: "-11 37 23.00",
    fovDeg: 0.5,
    constellation: "Virgo",
    constellationEn: "Virgo",
    blurb:
      "Thiên hà xoắn ốc nhìn gần như nghiêng cạnh, với dải bụi tối cắt ngang phần phình sáng — hình dáng đã đặt tên cho nó.",
    blurbEn:
      "A nearly edge-on spiral whose dark dust lane cuts across a bright bulge — the shape that gave it its name.",
    visibility: "BINOCULARS",
    image: "/images/sky/m104.jpg",
    imageCredit: null,
    facts: [
      "Nhìn gần như nghiêng cạnh",
      "Dải bụi tối cắt ngang phần phình sáng",
      "Hình dáng đó đặt tên cho nó",
    ],
    factsEn: [
      "Seen almost exactly edge-on",
      "A dark dust lane cuts across the bright bulge",
      "That shape is what gave it its name",
    ],
  },
  {
    id: "m13",
    catalogId: "M13",
    name: "Cụm sao cầu Hercules",
    nameEn: "Hercules Globular Cluster",
    aliases: ["M13", "Messier 13", "NGC 6205", "Hercules Cluster"],
    kind: "CLUSTER",
    ra: "16 41 41.634",
    dec: "+36 27 40.75",
    fovDeg: 0.8,
    constellation: "Hercules",
    constellationEn: "Hercules",
    blurb:
      "Cụm sao cầu sáng nhất bầu trời bắc: vài trăm nghìn ngôi sao già dồn trong một quả cầu rộng khoảng 145 năm ánh sáng.",
    blurbEn:
      "The brightest globular cluster in the northern sky: a few hundred thousand old stars packed into a ball about 145 light-years across.",
    visibility: "BINOCULARS",
    image: "/images/sky/m13.jpg",
    imageCredit: null,
    facts: [
      "Cụm sao cầu sáng nhất bầu trời bắc",
      "Vài trăm nghìn ngôi sao già trong một quả cầu",
      "Rộng khoảng 145 năm ánh sáng",
    ],
    factsEn: [
      "The brightest globular cluster in the northern sky",
      "Several hundred thousand old stars in one ball",
      "About 145 light-years across",
    ],
  },
];

/** Chuẩn hoá để so khớp: bỏ dấu, bỏ ký tự phụ, gộp khoảng trắng. */
function normalize(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9*]+/g, " ")
    .trim();
}

/** Mọi chuỗi có thể dùng để gọi tên một thiên thể, đã chuẩn hoá sẵn. */
function searchKeys(target: SkyTarget): string[] {
  return [
    target.id,
    target.catalogId,
    target.name,
    target.nameEn,
    ...target.aliases,
  ].map(normalize);
}

/**
 * Tìm chính xác một thiên thể trong danh mục.
 *
 * Khớp đúng trước, khớp tiền tố sau. Không khớp mờ: đoán sai ở đây nghĩa là
 * bay tới nhầm chỗ mà không nói cho người dùng biết, tệ hơn hẳn việc trả
 * `null` để chỗ gọi rơi xuống Sesame.
 */
export function findSkyTarget(query: string): SkyTarget | null {
  const needle = normalize(query);
  if (!needle) return null;

  const exact = SKY_TARGETS.find((target) =>
    searchKeys(target).includes(needle),
  );
  if (exact) return exact;

  return (
    SKY_TARGETS.find((target) =>
      searchKeys(target).some((key) => key.startsWith(needle)),
    ) ?? null
  );
}

/** Gợi ý cho ô tìm kiếm — khớp ở bất kỳ đâu, xếp khớp sát nhất lên trước. */
export function searchSkyTargets(query: string, limit = 6): SkyTarget[] {
  const needle = normalize(query);
  if (!needle) return SKY_TARGETS.slice(0, limit);

  return SKY_TARGETS.map((target) => {
    const keys = searchKeys(target);
    if (keys.includes(needle)) return { target, score: 0 };
    if (keys.some((key) => key.startsWith(needle))) return { target, score: 1 };
    if (keys.some((key) => key.includes(needle))) return { target, score: 2 };
    return { target, score: Number.POSITIVE_INFINITY };
  })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((item) => item.target);
}

export function getSkyTarget(id: string): SkyTarget | null {
  return SKY_TARGETS.find((target) => target.id === id) ?? null;
}
