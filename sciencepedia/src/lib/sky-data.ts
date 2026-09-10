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
 * Mặc định trỏ kênh `latest` của CDS: luôn có bản vá mới, đổi lại CDS có thể
 * đổi API dưới chân chúng ta (xem `src/types/aladin.ts`). Ghim một phiên bản
 * cụ thể bằng biến môi trường khi cần một build tái lập được.
 */
export const ALADIN_SCRIPT_URL =
  process.env.NEXT_PUBLIC_ALADIN_SCRIPT_URL ??
  "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js";

/** Máy chủ phát cả script lẫn ô tile HiPS — đáng preconnect ở route dùng nó. */
export const ALADIN_ORIGIN = "https://aladin.cds.unistra.fr";

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
  | "GALAXY"
  | "NEBULA"
  | "STAR"
  | "CLUSTER"
  | "BLACK_HOLE"
  | "OTHER";

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
};

/**
 * Năm mục đầu là yêu cầu bắt buộc của tính năng; phần còn lại là những thiên
 * thể mà người mới mở bản đồ bầu trời hay tìm tới trước tiên.
 */
export const SKY_TARGETS: SkyTarget[] = [
  {
    id: "m31",
    catalogId: "M31",
    name: "Thiên hà Tiên Nữ",
    nameEn: "Andromeda Galaxy",
    aliases: ["M31", "Messier 31", "NGC 224", "Andromeda", "Tiên Nữ"],
    kind: "GALAXY",
    ra: "00 42 44.330",
    dec: "+41 16 07.50",
    fovDeg: 3,
    constellation: "Tiên Nữ",
    constellationEn: "Andromeda",
    blurb:
      "Thiên hà xoắn ốc lớn gần Ngân Hà nhất, cách khoảng 2,5 triệu năm ánh sáng. Đường kính biểu kiến hơn 3 độ — rộng gấp sáu lần Mặt Trăng tròn.",
    blurbEn:
      "The nearest large spiral galaxy to the Milky Way, about 2.5 million light-years away. It spans over 3 degrees of sky, six times the width of the full Moon.",
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
    constellation: "Xử Nữ",
    constellationEn: "Virgo",
    blurb:
      "Thiên hà elip khổng lồ ở tâm cụm Xử Nữ. Lỗ đen siêu khối lượng của nó là vật thể đầu tiên được chụp ảnh trực tiếp, công bố năm 2019.",
    blurbEn:
      "A giant elliptical galaxy at the centre of the Virgo Cluster. Its supermassive black hole was the first ever imaged directly, published in 2019.",
  },
  {
    id: "m42",
    catalogId: "M42",
    name: "Tinh vân Lạp Hộ",
    nameEn: "Orion Nebula",
    aliases: ["M42", "Messier 42", "NGC 1976", "Orion Nebula", "Lạp Hộ"],
    kind: "NEBULA",
    ra: "05 35 16.8",
    dec: "-05 23 15",
    fovDeg: 2,
    constellation: "Lạp Hộ",
    constellationEn: "Orion",
    blurb:
      "Vùng tạo sao khối lượng lớn gần Trái Đất nhất, cách khoảng 1.300 năm ánh sáng. Mắt thường nhìn thấy được như một vệt mờ trong thanh kiếm chòm Lạp Hộ.",
    blurbEn:
      "The closest region of massive star formation to Earth, about 1,300 light-years away. Visible to the naked eye as a smudge in the sword of Orion.",
  },
  {
    id: "betelgeuse",
    catalogId: "Betelgeuse",
    name: "Betelgeuse",
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
    constellation: "Lạp Hộ",
    constellationEn: "Orion",
    blurb:
      "Sao siêu khổng lồ đỏ ở vai chòm Lạp Hộ, một trong những ngôi sao sáng nhất bầu trời. Độ sáng biến thiên rõ rệt và nó được xem là ứng viên siêu tân tinh.",
    blurbEn:
      "A red supergiant on the shoulder of Orion and one of the brightest stars in the sky. Its brightness varies markedly and it is considered a supernova candidate.",
  },
  {
    id: "sgr-a-star",
    catalogId: "Sgr A*",
    name: "Sagittarius A*",
    nameEn: "Sagittarius A*",
    aliases: [
      "Sgr A*",
      "Sagittarius A*",
      "Sagittarius A star",
      "Nhân Mã A*",
    ],
    kind: "BLACK_HOLE",
    ra: "17 45 40.036",
    dec: "-29 00 28.17",
    fovDeg: 0.3,
    // Tâm Ngân Hà bị bụi che gần như hoàn toàn ở bước sóng khả kiến; ảnh DSS
    // chỉ cho một đám sao mờ. Hồng ngoại gần xuyên qua được lớp bụi đó.
    survey: "P/2MASS/color",
    constellation: "Nhân Mã",
    constellationEn: "Sagittarius",
    blurb:
      "Lỗ đen siêu khối lượng ở tâm Ngân Hà, khối lượng khoảng 4 triệu lần Mặt Trời. Ảnh chụp trực tiếp được công bố năm 2022.",
    blurbEn:
      "The supermassive black hole at the centre of the Milky Way, about four million solar masses. Its direct image was published in 2022.",
  },
  {
    id: "m45",
    catalogId: "M45",
    name: "Cụm sao Tua Rua",
    nameEn: "Pleiades",
    aliases: ["M45", "Messier 45", "Pleiades", "Tua Rua", "Thất Nữ"],
    kind: "CLUSTER",
    ra: "03 46 24.2",
    dec: "+24 06 50",
    fovDeg: 3,
    constellation: "Kim Ngưu",
    constellationEn: "Taurus",
    blurb:
      "Cụm sao phân tán trẻ, cách khoảng 440 năm ánh sáng. Mắt thường thấy sáu tới bảy ngôi; ống nhòm cho thấy hàng trăm.",
    blurbEn:
      "A young open cluster about 440 light-years away. Six or seven stars are visible to the naked eye; binoculars show hundreds.",
  },
  {
    id: "m1",
    catalogId: "M1",
    name: "Tinh vân Con Cua",
    nameEn: "Crab Nebula",
    aliases: ["M1", "Messier 1", "NGC 1952", "Crab Nebula", "Con Cua"],
    kind: "NEBULA",
    ra: "05 34 31.8",
    dec: "+22 01 03",
    fovDeg: 0.4,
    constellation: "Kim Ngưu",
    constellationEn: "Taurus",
    blurb:
      "Tàn dư của siêu tân tinh mà các nhà thiên văn Trung Hoa ghi lại năm 1054. Ở tâm là một sao neutron quay khoảng 30 vòng mỗi giây.",
    blurbEn:
      "The remnant of a supernova recorded by Chinese astronomers in 1054. At its centre is a neutron star spinning about 30 times a second.",
  },
  {
    id: "m51",
    catalogId: "M51",
    name: "Thiên hà Xoáy Nước",
    nameEn: "Whirlpool Galaxy",
    aliases: ["M51", "Messier 51", "NGC 5194", "Whirlpool", "Xoáy Nước"],
    kind: "GALAXY",
    ra: "13 29 52.698",
    dec: "+47 11 42.93",
    fovDeg: 0.6,
    constellation: "Lạp Khuyển",
    constellationEn: "Canes Venatici",
    blurb:
      "Thiên hà xoắn ốc nhìn thẳng mặt, đang tương tác với thiên hà nhỏ NGC 5195. Đây là thiên hà đầu tiên được nhận ra là có cấu trúc xoắn ốc, năm 1845.",
    blurbEn:
      "A face-on spiral interacting with the smaller galaxy NGC 5195. It was the first galaxy recognised as having spiral structure, in 1845.",
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
    constellation: "Xử Nữ",
    constellationEn: "Virgo",
    blurb:
      "Thiên hà xoắn ốc nhìn gần như nghiêng cạnh, với dải bụi tối cắt ngang phần phình sáng — hình dáng đã đặt tên cho nó.",
    blurbEn:
      "A nearly edge-on spiral whose dark dust lane cuts across a bright bulge — the shape that gave it its name.",
  },
  {
    id: "m13",
    catalogId: "M13",
    name: "Cụm sao cầu Vũ Tiên",
    nameEn: "Hercules Globular Cluster",
    aliases: ["M13", "Messier 13", "NGC 6205", "Hercules Cluster"],
    kind: "CLUSTER",
    ra: "16 41 41.634",
    dec: "+36 27 40.75",
    fovDeg: 0.8,
    constellation: "Vũ Tiên",
    constellationEn: "Hercules",
    blurb:
      "Cụm sao cầu sáng nhất bầu trời bắc: vài trăm nghìn ngôi sao già dồn trong một quả cầu rộng khoảng 145 năm ánh sáng.",
    blurbEn:
      "The brightest globular cluster in the northern sky: a few hundred thousand old stars packed into a ball about 145 light-years across.",
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
