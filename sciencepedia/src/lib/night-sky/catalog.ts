/**
 * Danh mục thiên thể cho tìm kiếm và panel thông tin của "Mô phỏng bầu trời".
 *
 * Ba lớp dữ liệu, ba nguồn tin cậy khác nhau — đừng trộn:
 *
 * - **Hệ Mặt Trời** (Mặt Trời, Mặt Trăng, 7 hành tinh): vị trí và giờ mọc/lặn
 *   KHÔNG nằm ở đây; chúng được `astro.ts` tính sống bằng astronomy-engine.
 *   Tệp này chỉ giữ tên song ngữ và mô tả biên tập ngắn.
 * - **Sao sáng**: toạ độ J2000 và cấp sao biểu kiến là giá trị danh mục
 *   chuẩn (sao sáng ít biến động, tra cứu ổn định) — ghi tại đây như dữ
 *   liệu tham chiếu, không phải số đo tại thời điểm xem.
 * - **Chòm sao**: tên tiếng Việt dùng lại đúng bản dịch của Sciencepedia
 *   trong `public/night-sky/lang/vi.json` (engine đang hiển thị những tên
 *   đó — hai nơi nói khác nhau về cùng một chòm là lỗi); toạ độ là tâm
 *   gần đúng của chòm, chỉ để tính độ cao/phương vị tham khảo.
 *
 * Mô tả biên tập chỉ viết cho các thiên thể hệ Mặt Trời, bằng các dữ kiện
 * đã ổn định lâu năm (thứ tự từ Mặt Trời, chu kỳ quỹ đạo, đặc điểm vật lý
 * nổi tiếng). Sao và chòm sao không có mô tả tự do: panel ghép câu trung
 * tính từ chính dữ liệu danh mục (cấp sao, chòm chứa, sao sáng nhất) để
 * không một câu nào là bịa.
 */

import type { BodyName } from "@/lib/night-sky/astro";

export type SkyObjectType = "sun" | "moon" | "planet" | "star" | "constellation";

export type CatalogEntry = {
  id: string;
  type: SkyObjectType;
  nameVi: string;
  nameEn: string;
  /** Thiên thể hệ Mặt Trời: khoá của astronomy-engine. */
  body?: BodyName;
  /** Sao và chòm sao: xích kinh J2000 (giờ) và xích vĩ (độ). */
  raHours?: number;
  decDeg?: number;
  /** Sao: cấp sao biểu kiến trong danh mục chuẩn. */
  magnitude?: number;
  /** Sao: chòm sao chứa nó (id trong cùng danh mục này). */
  constellationId?: string;
  /** Chòm sao: sao sáng nhất, khi thuộc nhóm được biết nhiều nhất. */
  brightestStar?: { vi: string; en: string };
  descriptionVi?: string;
  descriptionEn?: string;
};

const BODIES: CatalogEntry[] = [
  {
    id: "sun",
    type: "sun",
    nameVi: "Mặt Trời",
    nameEn: "Sun",
    body: "Sun",
    descriptionVi:
      "Ngôi sao ở trung tâm Hệ Mặt Trời, một sao dãy chính loại G chứa khoảng 99,86% khối lượng của cả hệ. Ánh sáng từ Mặt Trời mất khoảng 8 phút 20 giây mới tới Trái Đất.",
    descriptionEn:
      "The star at the centre of the Solar System, a G-type main-sequence star holding about 99.86% of the system's mass. Its light takes about 8 minutes 20 seconds to reach Earth.",
  },
  {
    id: "moon",
    type: "moon",
    nameVi: "Mặt Trăng",
    nameEn: "Moon",
    body: "Moon",
    descriptionVi:
      "Vệ tinh tự nhiên duy nhất của Trái Đất, cách chúng ta trung bình khoảng 384.400 km. Mặt Trăng bị khoá thuỷ triều nên luôn hướng cùng một mặt về phía Trái Đất, và chu kỳ pha của nó dài khoảng 29,5 ngày.",
    descriptionEn:
      "Earth's only natural satellite, on average about 384,400 km away. It is tidally locked, always showing the same face to Earth, and its phase cycle lasts about 29.5 days.",
  },
  {
    id: "mercury",
    type: "planet",
    nameVi: "Sao Thủy",
    nameEn: "Mercury",
    body: "Mercury",
    descriptionVi:
      "Hành tinh gần Mặt Trời nhất và nhỏ nhất trong Hệ Mặt Trời, đi hết một vòng quỹ đạo chỉ trong khoảng 88 ngày. Bề mặt đầy hố va chạm và chênh lệch nhiệt độ ngày–đêm cực lớn vì hầu như không có khí quyển giữ nhiệt.",
    descriptionEn:
      "The closest planet to the Sun and the smallest in the Solar System, completing an orbit in just about 88 days. Its cratered surface swings between extreme day and night temperatures because it has almost no atmosphere to hold heat.",
  },
  {
    id: "venus",
    type: "planet",
    nameVi: "Sao Kim",
    nameEn: "Venus",
    body: "Venus",
    descriptionVi:
      "Hành tinh thứ hai từ Mặt Trời và là hành tinh nóng nhất — khí quyển CO₂ dày cùng hiệu ứng nhà kính giữ bề mặt ở khoảng 465 °C. Sao Kim quay quanh trục ngược chiều so với hầu hết hành tinh khác và là thiên thể tự nhiên sáng nhất trên bầu trời sau Mặt Trời và Mặt Trăng.",
    descriptionEn:
      "The second planet from the Sun and the hottest — a thick CO₂ atmosphere and a runaway greenhouse effect keep its surface near 465 °C. Venus rotates backwards compared with most planets and is the brightest natural object in the sky after the Sun and the Moon.",
  },
  {
    id: "mars",
    type: "planet",
    nameVi: "Sao Hỏa",
    nameEn: "Mars",
    body: "Mars",
    descriptionVi:
      "Hành tinh thứ tư, mang màu đỏ cam vì bụi giàu ôxít sắt phủ khắp bề mặt. Sao Hỏa có ngọn núi lửa lớn nhất Hệ Mặt Trời (Olympus Mons) và hai vệ tinh nhỏ, Phobos và Deimos; một năm ở đây dài khoảng 687 ngày Trái Đất.",
    descriptionEn:
      "The fourth planet, coloured rust-red by iron-oxide dust across its surface. Mars hosts the Solar System's largest volcano, Olympus Mons, and two small moons, Phobos and Deimos; its year lasts about 687 Earth days.",
  },
  {
    id: "jupiter",
    type: "planet",
    nameVi: "Sao Mộc",
    nameEn: "Jupiter",
    body: "Jupiter",
    descriptionVi:
      "Hành tinh lớn nhất Hệ Mặt Trời — khối lượng gấp khoảng 2,5 lần tổng khối lượng của mọi hành tinh còn lại cộng lại. Vết Đỏ Lớn của nó là một cơn bão đã hoành hành hàng trăm năm, và Sao Mộc mất khoảng 12 năm Trái Đất cho một vòng quỹ đạo.",
    descriptionEn:
      "The largest planet in the Solar System — about 2.5 times the mass of all the other planets combined. Its Great Red Spot is a storm that has raged for centuries, and Jupiter takes about 12 Earth years to complete one orbit.",
  },
  {
    id: "saturn",
    type: "planet",
    nameVi: "Sao Thổ",
    nameEn: "Saturn",
    body: "Saturn",
    descriptionVi:
      "Hành tinh thứ sáu, nổi tiếng với vành đai rộng làm từ vô số hạt băng và đá quay quanh xích đạo. Mật độ trung bình của Sao Thổ thấp hơn nước, và nó mất khoảng 29,5 năm Trái Đất cho một vòng quanh Mặt Trời.",
    descriptionEn:
      "The sixth planet, famous for its broad rings made of countless ice and rock particles orbiting its equator. Saturn's average density is lower than water's, and it takes about 29.5 Earth years to circle the Sun once.",
  },
  {
    id: "uranus",
    type: "planet",
    nameVi: "Sao Thiên Vương",
    nameEn: "Uranus",
    body: "Uranus",
    descriptionVi:
      "Hành tinh thứ bảy, một người khổng lồ băng quay gần như nằm ngang — trục quay nghiêng khoảng 98° nên mỗi cực lần lượt hướng gần thẳng về phía Mặt Trời. Mê-tan trong khí quyển khiến nó có màu xanh lục nhạt; một năm ở đây dài khoảng 84 năm Trái Đất.",
    descriptionEn:
      "The seventh planet, an ice giant tipped almost completely on its side — its axis tilts about 98°, so each pole takes turns facing the Sun. Methane in its atmosphere gives it a pale blue-green colour, and its year lasts about 84 Earth years.",
  },
  {
    id: "neptune",
    type: "planet",
    nameVi: "Sao Hải Vương",
    nameEn: "Neptune",
    body: "Neptune",
    descriptionVi:
      "Hành tinh xa Mặt Trời nhất, một người khổng lồ băng xanh thẫm với những cơn gió nhanh nhất Hệ Mặt Trời — có lúc vượt 2.000 km/h. Sao Hải Vương mất khoảng 165 năm Trái Đất cho một vòng quỹ đạo và mới hoàn thành đúng một vòng kể từ khi được phát hiện năm 1846.",
    descriptionEn:
      "The most distant planet from the Sun, a deep-blue ice giant with the fastest winds in the Solar System — at times over 2,000 km/h. Neptune takes about 165 Earth years per orbit and has completed just one full circuit since its discovery in 1846.",
  },
];

/** [id, tên, RA J2000 (giờ), Dec (độ), cấp sao, id chòm chứa] */
const STARS: ReadonlyArray<
  readonly [string, string, number, number, number, string]
> = [
  ["sirius", "Sirius", 6.7522, -16.7161, -1.46, "canis-major"],
  ["canopus", "Canopus", 6.3992, -52.6957, -0.74, "carina"],
  ["arcturus", "Arcturus", 14.261, 19.1824, -0.05, "bootes"],
  ["vega", "Vega", 18.6156, 38.7837, 0.03, "lyra"],
  ["capella", "Capella", 5.2782, 45.998, 0.08, "auriga"],
  ["rigel", "Rigel", 5.2423, -8.2016, 0.13, "orion"],
  ["procyon", "Procyon", 7.655, 5.225, 0.34, "canis-minor"],
  ["betelgeuse", "Betelgeuse", 5.9194, 7.407, 0.42, "orion"],
  ["achernar", "Achernar", 1.629, -57.2368, 0.46, "eridanus"],
  ["hadar", "Hadar", 14.0637, -60.373, 0.61, "centaurus"],
  ["altair", "Altair", 19.8464, 8.8683, 0.76, "aquila"],
  ["aldebaran", "Aldebaran", 4.5987, 16.5093, 0.86, "taurus"],
  ["antares", "Antares", 16.4901, -26.432, 0.96, "scorpius"],
  ["spica", "Spica", 13.4199, -11.1613, 0.97, "virgo"],
  ["pollux", "Pollux", 7.7553, 28.0262, 1.14, "gemini"],
  ["fomalhaut", "Fomalhaut", 22.9608, -29.6222, 1.16, "piscis-austrinus"],
  ["deneb", "Deneb", 20.6905, 45.2803, 1.25, "cygnus"],
  ["mimosa", "Mimosa", 12.7953, -59.6888, 1.25, "crux"],
  ["regulus", "Regulus", 10.1395, 11.9672, 1.35, "leo"],
  ["bellatrix", "Bellatrix", 5.4185, 6.3497, 1.64, "orion"],
  ["alnilam", "Alnilam", 5.6036, -1.2019, 1.69, "orion"],
  ["castor", "Castor", 7.5766, 31.8883, 1.93, "gemini"],
  ["polaris", "Polaris", 2.5303, 89.2641, 1.98, "ursa-minor"],
  ["denebola", "Denebola", 11.8177, 14.5721, 2.11, "leo"],
];

/** Tên tiếng Việt truyền thống cho vài sao có tên riêng quen thuộc ở Việt Nam. */
const STAR_NAME_VI: Record<string, string> = {
  sirius: "Sirius (Thiên Lang)",
  vega: "Vega (Chức Nữ)",
  altair: "Altair (Ngưu Lang)",
  polaris: "Polaris (Sao Bắc Cực)",
};

const STAR_ENTRIES: CatalogEntry[] = STARS.map(
  ([id, name, raHours, decDeg, magnitude, constellationId]) => ({
    id: `star-${id}`,
    type: "star" as const,
    nameVi: STAR_NAME_VI[id] ?? name,
    nameEn: name,
    raHours,
    decDeg,
    magnitude,
    constellationId,
  }),
);

/**
 * [id, tên La-tinh (IAU), tên Việt, RA tâm (giờ), Dec tâm (độ), sao sáng nhất?]
 * Tâm chòm là toạ độ gần đúng theo các bảng tâm chòm sao chuẩn — chỉ dùng để
 * tính độ cao/phương vị tham khảo và xoay khung trời tới, không phải ranh giới.
 */
const CONSTELLATIONS: ReadonlyArray<
  readonly [
    string,
    string,
    string,
    number,
    number,
    ({ vi: string; en: string } | null)?,
  ]
> = [
  ["andromeda", "Andromeda", "Tiên Nữ", 0.9, 38.0, { vi: "Alpheratz", en: "Alpheratz" }],
  ["antlia", "Antlia", "Bơm Hơi", 10.1, -33.5],
  ["apus", "Apus", "Thiên Yến", 16.14, -75.2],
  ["aquarius", "Aquarius", "Bảo Bình", 22.28, -10.3],
  ["aquila", "Aquila", "Thiên Ưng", 19.67, 3.4, { vi: "Altair (Ngưu Lang)", en: "Altair" }],
  ["ara", "Ara", "Thiên Đàn", 17.37, -51.8],
  ["aries", "Aries", "Bạch Dương", 2.66, 15.7],
  ["auriga", "Auriga", "Ngự Phu", 6.07, 41.7, { vi: "Capella", en: "Capella" }],
  ["bootes", "Boötes", "Mục Phu", 14.7, 32.8, { vi: "Arcturus", en: "Arcturus" }],
  ["caelum", "Caelum", "Dao Khắc", 4.71, -37.9],
  ["camelopardalis", "Camelopardalis", "Hươu Cao Cổ", 6.0, 69.8],
  ["cancer", "Cancer", "Cự Giải", 8.64, 18.2],
  ["canes-venatici", "Canes Venatici", "Lạp Khuyển", 12.85, 42.5],
  ["canis-major", "Canis Major", "Đại Khuyển", 6.83, -23.7, { vi: "Sirius (Thiên Lang)", en: "Sirius" }],
  ["canis-minor", "Canis Minor", "Tiểu Khuyển", 7.66, 4.5],
  ["capricornus", "Capricornus", "Ma Kết", 21.03, -17.5],
  ["carina", "Carina", "Thuyền Đáy", 8.68, -62.5],
  ["cassiopeia", "Cassiopeia", "Thiên Hậu", 1.32, 61.9, { vi: "Schedar", en: "Schedar" }],
  ["centaurus", "Centaurus", "Bán Nhân Mã", 12.87, -46.9],
  ["cepheus", "Cepheus", "Tiên Vương", 21.9, 64.9],
  ["cetus", "Cetus", "Kình Ngư", 1.87, -8.0],
  ["chamaeleon", "Chamaeleon", "Tắc Kè", 10.6, -78.0],
  ["circinus", "Circinus", "Com Pa", 14.58, -59.8],
  ["columba", "Columba", "Thiên Cáp", 5.85, -34.2],
  ["coma-berenices", "Coma Berenices", "Hậu Phát", 12.71, 22.6],
  ["corona-australis", "Corona Australis", "Nam Miện", 18.63, -41.7],
  ["corona-borealis", "Corona Borealis", "Bắc Miện", 15.84, 33.2],
  ["corvus", "Corvus", "Ô Nha", 12.43, -20.8],
  ["crater", "Crater", "Cự Tước", 11.36, -14.9],
  ["crux", "Crux", "Nam Thập Tự", 12.42, -59.7, { vi: "Acrux", en: "Acrux" }],
  ["cygnus", "Cygnus", "Thiên Nga", 20.58, 44.5, { vi: "Deneb", en: "Deneb" }],
  ["delphinus", "Delphinus", "Hải Đồn", 20.7, 13.8],
  ["dorado", "Dorado", "Kiếm Ngư", 5.24, -58.5],
  ["draco", "Draco", "Thiên Long", 17.0, 65.0],
  ["equuleus", "Equuleus", "Tiểu Mã", 21.19, 8.0],
  ["eridanus", "Eridanus", "Ba Giang", 3.87, -19.0],
  ["fornax", "Fornax", "Thiên Lô", 2.83, -27.5],
  ["gemini", "Gemini", "Song Tử", 7.08, 23.4, { vi: "Pollux", en: "Pollux" }],
  ["grus", "Grus", "Thiên Hạc", 22.46, -46.5],
  ["hercules", "Hercules", "Vũ Tiên", 17.17, 28.8],
  ["horologium", "Horologium", "Thời Chung", 3.27, -50.8],
  ["hydra", "Hydra", "Trường Xà", 11.6, -15.7],
  ["hydrus", "Hydrus", "Thủy Xà", 2.32, -72.7],
  ["indus", "Indus", "Ấn Đệ An", 20.95, -58.5],
  ["lacerta", "Lacerta", "Hiết Hổ", 22.44, 45.7],
  ["leo", "Leo", "Sư Tử", 10.66, 14.0, { vi: "Regulus", en: "Regulus" }],
  ["leo-minor", "Leo Minor", "Tiểu Sư", 10.4, 30.5],
  ["lepus", "Lepus", "Thiên Thố", 5.56, -19.2],
  ["libra", "Libra", "Thiên Bình", 15.19, -16.6],
  ["lupus", "Lupus", "Sài Lang", 15.3, -42.5],
  ["lynx", "Lynx", "Thiên Miêu", 7.99, 48.2],
  ["lyra", "Lyra", "Thiên Cầm", 18.85, 33.0, { vi: "Vega (Chức Nữ)", en: "Vega" }],
  ["mensa", "Mensa", "Sơn Án", 5.6, -78.8],
  ["microscopium", "Microscopium", "Hiển Vi Kính", 20.95, -38.0],
  ["monoceros", "Monoceros", "Kỳ Lân", 7.05, 0.3],
  ["musca", "Musca", "Thương Dăng", 12.5, -69.8],
  ["norma", "Norma", "Củ Xích", 16.05, -46.0],
  ["octans", "Octans", "Nam Cực", 21.5, -80.0],
  ["ophiuchus", "Ophiuchus", "Xà Phu", 17.66, -6.2],
  ["orion", "Orion", "Lạp Hộ", 5.6, 2.2, { vi: "Rigel", en: "Rigel" }],
  ["pavo", "Pavo", "Khổng Tước", 20.1, -69.0],
  ["pegasus", "Pegasus", "Phi Mã", 22.68, 20.9],
  ["perseus", "Perseus", "Anh Tiên", 3.55, 44.3],
  ["phoenix", "Phoenix", "Phượng Hoàng", 0.93, -48.7],
  ["pictor", "Pictor", "Hội Giá", 5.6, -48.2],
  ["pisces", "Pisces", "Song Ngư", 0.9, 12.5],
  ["piscis-austrinus", "Piscis Austrinus", "Nam Ngư", 22.3, -29.8],
  ["puppis", "Puppis", "Thuyền Vĩ", 7.7, -32.0],
  ["pyxis", "Pyxis", "La Bàn", 8.95, -34.0],
  ["reticulum", "Reticulum", "Võng Cổ", 4.23, -62.0],
  ["sagitta", "Sagitta", "Thiên Tiễn", 19.65, 18.9],
  ["sagittarius", "Sagittarius", "Nhân Mã", 19.1, -29.5],
  ["scorpius", "Scorpius", "Thiên Yết", 16.59, -30.7, { vi: "Antares", en: "Antares" }],
  ["sculptor", "Sculptor", "Ngọc Phu", 0.5, -34.0],
  ["scutum", "Scutum", "Thuẫn Bài", 18.67, -10.5],
  ["serpens", "Serpens", "Cự Xà", 17.4, 4.5],
  ["sextans", "Sextans", "Lục Phân Nghi", 10.27, -2.5],
  ["taurus", "Taurus", "Kim Ngưu", 4.71, 15.0, { vi: "Aldebaran", en: "Aldebaran" }],
  ["telescopium", "Telescopium", "Viễn Vọng Kính", 18.3, -47.0],
  ["triangulum", "Triangulum", "Tam Giác", 2.04, 32.5],
  ["triangulum-australe", "Triangulum Australe", "Nam Tam Giác", 15.85, -63.5],
  ["tucana", "Tucana", "Đỗ Quyên", 23.75, -61.0],
  ["ursa-major", "Ursa Major", "Đại Hùng", 11.32, 53.5],
  ["ursa-minor", "Ursa Minor", "Tiểu Hùng", 15.0, 75.0],
  ["vela", "Vela", "Thuyền Phàm", 9.4, -46.8],
  ["virgo", "Virgo", "Xử Nữ", 13.4, -2.5, { vi: "Spica", en: "Spica" }],
  ["volans", "Volans", "Phi Ngư", 7.85, -69.0],
  ["vulpecula", "Vulpecula", "Hồ Ly", 20.4, 24.0],
];

const CONSTELLATION_ENTRIES: CatalogEntry[] = CONSTELLATIONS.map(
  ([slug, latin, nameVi, raHours, decDeg, brightestStar]) => ({
    id: `const-${slug}`,
    type: "constellation" as const,
    nameVi,
    nameEn: latin,
    raHours,
    decDeg,
    ...(brightestStar ? { brightestStar } : {}),
  }),
);

export const SKY_CATALOG: CatalogEntry[] = [
  ...BODIES,
  ...STAR_ENTRIES,
  ...CONSTELLATION_ENTRIES,
];

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return SKY_CATALOG.find((entry) => entry.id === id);
}

/**
 * Chuẩn hoá để tìm không dấu: bỏ dấu thanh/âm tiếng Việt (NFD rồi gạt dấu
 * tổ hợp), `đ` → `d`, thường hoá. Nhờ vậy "sao tho", "Sao Thổ" và "SATURN"
 * đều gặp nhau ở cùng một dạng.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Tìm trong danh mục: khớp đầu tên xếp trước khớp giữa tên; tối đa 8 kết quả. */
export function searchCatalog(query: string): CatalogEntry[] {
  const needle = normalizeSearchText(query);
  if (needle.length < 2) return [];
  const starts: CatalogEntry[] = [];
  const contains: CatalogEntry[] = [];
  for (const entry of SKY_CATALOG) {
    const names = [normalizeSearchText(entry.nameVi), normalizeSearchText(entry.nameEn)];
    if (names.some((name) => name.startsWith(needle))) starts.push(entry);
    else if (names.some((name) => name.includes(needle))) contains.push(entry);
  }
  return [...starts, ...contains].slice(0, 8);
}
