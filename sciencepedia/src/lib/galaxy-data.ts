/**
 * Tham số mô hình Ngân Hà.
 *
 * Đây là mô hình minh hoạ chứ không phải mô phỏng động lực học: các đám sao
 * được rải theo đường xoắn ốc loga có nhiễu ngẫu nhiên, đủ để cho thấy hình
 * dạng và tỉ lệ thật của thiên hà. Số liệu vật lý trong `GALAXY_FACTS` mới là
 * phần lấy từ quan sát.
 *
 * Một đơn vị của cảnh = 5.000 năm ánh sáng.
 */

export const LY_PER_UNIT = 5_000;

/** Bán kính đĩa sao nhìn thấy được: ~52.500 năm ánh sáng (đường kính ~105.000). */
export const DISK_RADIUS = 10.5;

/** Bán kính phần phình trung tâm. */
export const BULGE_RADIUS = 2.2;

/** Ngân Hà là thiên hà xoắn ốc có thanh, với bốn nhánh chính. */
export const ARM_COUNT = 4;

/** Độ xoắn của nhánh — càng lớn thì nhánh cuộn càng chặt. */
export const ARM_SPIN = 0.42;

/**
 * Vị trí Mặt Trời: cách tâm 26.670 năm ánh sáng (8,178 kpc theo phép đo của
 * nhóm GRAVITY năm 2019, sai số dưới 0,5%), nằm ở rìa trong của nhánh Orion —
 * một nhánh phụ giữa hai nhánh chính Perseus và Sagittarius.
 */
export const SUN_LY_FROM_CENTRE = 26_670;
export const SUN_RADIUS_UNITS = SUN_LY_FROM_CENTRE / LY_PER_UNIT;

/** Góc đặt Mặt Trời trên đĩa trong cảnh, radian. */
export const SUN_ANGLE = Math.PI * 0.32;


/** Đĩa mỏng đến mức nào: 1.000 năm ánh sáng bề dày trên 105.000 đường kính. */
export const DISK_THICKNESS = 1_000 / LY_PER_UNIT;

export type GalaxyFeature = {
  id: string;
  name: string;
  nameEn: string;
  /** Khoảng cách từ tâm, tính bằng đơn vị cảnh */
  radius: number;
  /** Góc trên mặt phẳng đĩa, radian */
  angle: number;
  description: string;
  descriptionEn: string;
  color: string;
};

/**
 * Vài mốc được gắn nhãn. Góc của các nhánh chỉ mang tính minh hoạ — vị trí
 * chính xác của chúng vẫn đang được đo lại, và bản đồ nhánh xoắn ốc của Ngân
 * Hà đã được vẽ lại nhiều lần trong hai thập niên qua.
 */
export const GALAXY_FEATURES: GalaxyFeature[] = [
  {
    id: "core",
    name: "Sagittarius A*",
    nameEn: "Sagittarius A*",
    radius: 0,
    angle: 0,
    description:
      "Hố đen siêu khối lượng ở tâm Ngân Hà, nặng khoảng 4,3 triệu lần Mặt Trời. Việc theo dõi quỹ đạo các ngôi sao quanh nó đã mang lại giải Nobel Vật lý 2020.",
    descriptionEn:
      "The supermassive black hole at the galactic centre, about 4.3 million solar masses. Tracking the stars orbiting it won the 2020 Nobel Prize in Physics.",
    color: "#f97316",
  },
  {
    id: "sun",
    name: "Mặt Trời",
    nameEn: "The Sun",
    radius: SUN_RADIUS_UNITS,
    angle: SUN_ANGLE,
    description:
      "Hệ Mặt Trời nằm cách tâm 26.670 năm ánh sáng, ở rìa trong nhánh Orion. Nó mất khoảng 230 triệu năm để đi hết một vòng quanh tâm thiên hà.",
    descriptionEn:
      "The Solar System sits 26,670 light-years from the centre, on the inner edge of the Orion Arm. One lap around the galaxy takes some 230 million years.",
    color: "#fde047",
  },
  {
    id: "perseus",
    name: "Nhánh Perseus",
    nameEn: "Perseus Arm",
    radius: 7.4,
    angle: Math.PI * 0.95,
    description:
      "Một trong hai nhánh xoắn ốc chính, nằm phía ngoài vị trí Mặt Trời.",
    descriptionEn:
      "One of the two major spiral arms, lying outward from the Sun's position.",
    color: "#93c5fd",
  },
  {
    id: "sagittarius",
    name: "Nhánh Sagittarius",
    nameEn: "Sagittarius Arm",
    radius: 6.2,
    angle: Math.PI * 1.75,
    description:
      "Nhánh chính còn lại, nằm phía trong so với Mặt Trời — hướng nhìn về tâm Ngân Hà đi qua nhánh này.",
    descriptionEn:
      "The other major arm, inward of the Sun — the line of sight to the galactic centre passes through it.",
    color: "#a5b4fc",
  },
];

/**
 * Các thiên thể nổi bật trong đĩa và quầng.
 *
 * Vị trí KHÔNG rải ngẫu nhiên: mỗi thiên thể được cho bằng khoảng cách thật
 * tới Mặt Trời và toạ độ thiên hà (kinh độ `l`, vĩ độ `b`), rồi quy về hệ toạ
 * độ lấy tâm Ngân Hà làm gốc. Nhờ vậy tinh vân Lạp Hộ nằm sát Mặt Trời còn
 * tinh vân Carina nằm hẳn ở nhánh trong, đúng như trên bầu trời thật.
 */
export type GalaxyObject = {
  id: string;
  name: string;
  nameEn: string;
  kind: "nebula" | "cluster";
  /** Khoảng cách tới Mặt Trời, năm ánh sáng */
  distanceLy: number;
  /** Kinh độ thiên hà, độ */
  l: number;
  /** Vĩ độ thiên hà, độ */
  b: number;
  color: string;
  note: string;
  noteEn: string;
};

export const GALAXY_OBJECTS: GalaxyObject[] = [
  {
    id: "orion",
    name: "Tinh vân Lạp Hộ (M42)",
    nameEn: "Orion Nebula (M42)",
    kind: "nebula",
    distanceLy: 1_344,
    l: 209,
    b: -19.4,
    color: "#f472b6",
    note: "Vùng sinh sao gần nhất nhìn được bằng mắt thường, ngay trong nhánh Orion cùng với chúng ta.",
    noteEn: "The nearest star-forming region visible to the naked eye, inside the Orion Arm with us.",
  },
  {
    id: "lagoon",
    name: "Tinh vân Đầm Phá (M8)",
    nameEn: "Lagoon Nebula (M8)",
    kind: "nebula",
    distanceLy: 4_100,
    l: 6,
    b: -1.2,
    color: "#fb7185",
    note: "Nằm về hướng tâm Ngân Hà, trong nhánh Sagittarius.",
    noteEn: "Toward the galactic centre, in the Sagittarius Arm.",
  },
  {
    id: "eagle",
    name: "Tinh vân Đại Bàng (M16)",
    nameEn: "Eagle Nebula (M16)",
    kind: "nebula",
    distanceLy: 7_000,
    l: 17,
    b: 0.8,
    color: "#c084fc",
    note: "Nơi có “những cột trụ sáng tạo” mà Hubble và James Webb đều từng chụp.",
    noteEn: "Home of the Pillars of Creation, imaged by both Hubble and James Webb.",
  },
  {
    id: "carina",
    name: "Tinh vân Carina (NGC 3372)",
    nameEn: "Carina Nebula (NGC 3372)",
    kind: "nebula",
    distanceLy: 8_500,
    l: 287.6,
    b: -0.6,
    color: "#f97316",
    note: "Lớn hơn tinh vân Lạp Hộ nhiều lần, chứa ngôi sao bất ổn Eta Carinae.",
    noteEn: "Many times larger than Orion, and home to the unstable star Eta Carinae.",
  },
  {
    id: "omega-centauri",
    name: "Omega Centauri",
    nameEn: "Omega Centauri",
    kind: "cluster",
    distanceLy: 17_000,
    l: 309,
    b: 15,
    color: "#fcd34d",
    note: "Cụm sao cầu sáng nhất bầu trời, có thể là lõi còn lại của một thiên hà lùn bị Ngân Hà nuốt.",
    noteEn: "The brightest globular cluster in the sky, possibly the surviving core of a dwarf galaxy the Milky Way swallowed.",
  },
  {
    id: "m13",
    name: "Cụm sao cầu Hercules (M13)",
    nameEn: "Hercules Cluster (M13)",
    kind: "cluster",
    distanceLy: 22_200,
    l: 59,
    b: 40.9,
    color: "#fde68a",
    note: "Nằm hẳn ngoài mặt phẳng đĩa, trong quầng thiên hà — nơi tập trung các sao già nhất.",
    noteEn: "Well off the disk plane, out in the halo where the oldest stars live.",
  },
];

/**
 * Quy toạ độ thiên hà (khoảng cách tới Mặt Trời, kinh độ l, vĩ độ b) về toạ độ
 * cảnh lấy tâm Ngân Hà làm gốc.
 *
 * Trong hệ thiên hà, Mặt Trời là gốc và hướng l = 0 chỉ thẳng vào tâm. Nên vị
 * trí của một thiên thể so với tâm là: vị trí Mặt Trời cộng vector từ Mặt Trời
 * tới thiên thể đó. Phần còn lại chỉ là xoay cho khớp với góc mà cảnh đang đặt
 * Mặt Trời.
 */
export function galacticToScene(
  distanceLy: number,
  l: number,
  b: number,
): [number, number, number] {
  const d = distanceLy / LY_PER_UNIT;
  const lr = (l * Math.PI) / 180;
  const br = (b * Math.PI) / 180;

  // Trong hệ lấy Mặt Trời làm gốc, +x hướng vào tâm, +y hướng l = 90°
  const gx = -SUN_RADIUS_UNITS + d * Math.cos(br) * Math.cos(lr);
  const gy = d * Math.cos(br) * Math.sin(lr);
  const gz = d * Math.sin(br);

  // Xoay để Mặt Trời rơi đúng vào góc SUN_ANGLE của cảnh
  const theta = SUN_ANGLE + Math.PI;
  return [
    gx * Math.cos(theta) - gy * Math.sin(theta),
    gz,
    gx * Math.sin(theta) + gy * Math.cos(theta),
  ];
}

/**
 * Các chặng của chuyến bay tự động, từ Hệ Mặt Trời vào tới hố đen trung tâm.
 * `distanceFromTarget` là khoảng cách camera đứng cách điểm ngắm, đơn vị cảnh.
 */
export type TourStop = {
  id: string;
  name: string;
  nameEn: string;
  /** Điểm camera ngắm vào, đơn vị cảnh */
  target: [number, number, number];
  distance: number;
  height: number;
  caption: string;
  captionEn: string;
};

export const TOUR_STOPS: TourStop[] = [
  {
    id: "solar-system",
    name: "Hệ Mặt Trời",
    nameEn: "The Solar System",
    target: [
      Math.cos(SUN_ANGLE) * SUN_RADIUS_UNITS,
      0,
      Math.sin(SUN_ANGLE) * SUN_RADIUS_UNITS,
    ],
    distance: 1.6,
    height: 0.5,
    caption:
      "Chúng ta bắt đầu từ đây — một ngôi sao trong hàng trăm tỉ ngôi sao, cách tâm 26.670 năm ánh sáng.",
    captionEn:
      "We start here — one star among hundreds of billions, 26,670 light-years from the centre.",
  },
  {
    id: "orion-arm",
    name: "Nhánh Orion",
    nameEn: "The Orion Arm",
    target: [
      Math.cos(SUN_ANGLE) * SUN_RADIUS_UNITS,
      0,
      Math.sin(SUN_ANGLE) * SUN_RADIUS_UNITS,
    ],
    distance: 5,
    height: 2,
    caption:
      "Mặt Trời nằm ở rìa trong nhánh Orion — một nhánh phụ, không phải nhánh chính.",
    captionEn:
      "The Sun sits on the inner edge of the Orion Arm — a minor spur, not a major arm.",
  },
  {
    id: "sagittarius-arm",
    name: "Nhánh Sagittarius",
    nameEn: "The Sagittarius Arm",
    target: [
      Math.cos(Math.PI * 1.75) * 6.2,
      0,
      Math.sin(Math.PI * 1.75) * 6.2,
    ],
    distance: 6,
    height: 2.5,
    caption:
      "Nhìn về phía tâm, hướng nhìn của chúng ta xuyên qua nhánh Sagittarius.",
    captionEn:
      "Looking inward, our line of sight passes through the Sagittarius Arm.",
  },
  {
    id: "bulge",
    name: "Phần phình trung tâm",
    nameEn: "The central bulge",
    target: [0, 0, 0],
    distance: 6,
    height: 1.6,
    caption:
      "Khối sao già hình thanh dẹt ở giữa, dày đặc tới mức từ đây không nhìn xuyên qua được.",
    captionEn:
      "The bar-shaped mass of old stars at the centre, so dense you cannot see through it.",
  },
  {
    id: "sgr-a",
    name: "Sagittarius A*",
    nameEn: "Sagittarius A*",
    target: [0, 0, 0],
    distance: 1.9,
    height: 0.35,
    caption:
      "Hố đen siêu khối lượng nặng 4,3 triệu lần Mặt Trời. Ảnh chụp đầu tiên của nó công bố năm 2022.",
    captionEn:
      "A supermassive black hole of 4.3 million solar masses. Its first image was published in 2022.",
  },
];

export const GALAXY_FACTS = [
  { labelVi: "Đường kính đĩa sao", labelEn: "Disk diameter", value: "~105.000 năm ánh sáng", valueEn: "~105,000 light-years" },
  { labelVi: "Bề dày đĩa mỏng", labelEn: "Thin disk thickness", value: "~1.000 năm ánh sáng", valueEn: "~1,000 light-years" },
  { labelVi: "Số sao ước tính", labelEn: "Estimated stars", value: "100–400 tỉ", valueEn: "100–400 billion" },
  { labelVi: "Khối lượng (gồm quầng tối)", labelEn: "Mass (with dark halo)", value: "~1,5 nghìn tỉ khối lượng Mặt Trời", valueEn: "~1.5 trillion solar masses" },
  { labelVi: "Mặt Trời cách tâm", labelEn: "Sun's distance from centre", value: "26.670 năm ánh sáng", valueEn: "26,670 light-years" },
  { labelVi: "Một vòng của Mặt Trời", labelEn: "Sun's orbital period", value: "~230 triệu năm", valueEn: "~230 million years" },
  { labelVi: "Tuổi", labelEn: "Age", value: "~13,6 tỉ năm", valueEn: "~13.6 billion years" },
  { labelVi: "Phân loại", labelEn: "Classification", value: "Xoắn ốc có thanh (SBbc)", valueEn: "Barred spiral (SBbc)" },
];
