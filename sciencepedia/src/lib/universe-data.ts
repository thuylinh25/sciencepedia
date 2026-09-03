/**
 * Tham số mô hình cấu trúc lớn của vũ trụ.
 *
 * Ở quy mô hàng trăm triệu năm ánh sáng, các thiên hà không rải đều mà tụ
 * thành sợi và tường bao quanh những khoảng rỗng khổng lồ — cấu trúc này gọi
 * là mạng vũ trụ (cosmic web). Mô hình ở đây dựng lại hình thái đó bằng cách
 * gieo các nút đám thiên hà rồi nối những nút gần nhau bằng sợi, chứ không mô
 * phỏng động lực học vật chất tối. Số liệu trong `UNIVERSE_SCALES` mới là phần
 * lấy từ quan sát.
 *
 * Một đơn vị của cảnh ≈ 40 triệu năm ánh sáng.
 */

export const MLY_PER_UNIT = 40;

/** Nửa cạnh của khối lập phương chứa mô hình. */
export const BOX_HALF = 12;

/** Số nút đám thiên hà. */
export const NODE_COUNT = 260;

/** Khoảng cách tối đa để hai nút được nối bằng một sợi. */
export const FILAMENT_MAX_DISTANCE = 5.2;

export type UniverseScale = {
  id: string;
  name: string;
  nameEn: string;
  /** Bán kính quy đổi ra đơn vị cảnh; null nghĩa là vượt khỏi khối mô hình */
  radius: number | null;
  size: string;
  sizeEn: string;
  description: string;
  descriptionEn: string;
  color: string;
};

/**
 * Các bậc thang kích thước, từ Ngân Hà ra tới chân trời vũ trụ.
 * Bán kính hiển thị được nén lại cho vừa khung nhìn — nếu vẽ đúng tỉ lệ thì
 * Ngân Hà nhỏ hơn một pixel so với vũ trụ quan sát được.
 */
export const UNIVERSE_SCALES: UniverseScale[] = [
  {
    id: "milky-way",
    name: "Ngân Hà",
    nameEn: "The Milky Way",
    radius: 0.35,
    size: "100.000 năm ánh sáng",
    sizeEn: "100,000 light-years",
    description:
      "Thiên hà của chúng ta, chứa 100–400 tỉ ngôi sao. Ở quy mô của trang này, cả Ngân Hà chỉ là một chấm sáng.",
    descriptionEn:
      "Our galaxy, holding 100–400 billion stars. At the scale of this page, the whole thing is a single dot.",
    color: "#fde047",
  },
  {
    id: "local-group",
    name: "Cụm địa phương",
    nameEn: "The Local Group",
    radius: 1.1,
    size: "~10 triệu năm ánh sáng",
    sizeEn: "~10 million light-years",
    description:
      "Khoảng 80 thiên hà liên kết hấp dẫn với nhau, trong đó Ngân Hà và Andromeda là hai thành viên lớn nhất. Hai thiên hà này đang lao vào nhau và sẽ sáp nhập sau khoảng 4,5 tỉ năm.",
    descriptionEn:
      "About 80 gravitationally bound galaxies, dominated by the Milky Way and Andromeda — which are approaching each other and will merge in roughly 4.5 billion years.",
    color: "#a5b4fc",
  },
  {
    id: "virgo",
    name: "Siêu đám Virgo",
    nameEn: "The Virgo Supercluster",
    radius: 3.2,
    size: "~110 triệu năm ánh sáng",
    sizeEn: "~110 million light-years",
    description:
      "Cụm địa phương chỉ là một nhánh nhỏ ở rìa siêu đám Virgo, nơi tập trung hàng nghìn thiên hà quanh đám Virgo ở trung tâm.",
    descriptionEn:
      "The Local Group is a small outlying branch of the Virgo Supercluster, thousands of galaxies gathered around the Virgo Cluster at its centre.",
    color: "#67e8f9",
  },
  {
    id: "laniakea",
    name: "Siêu đám Laniakea",
    nameEn: "The Laniakea Supercluster",
    radius: 6.5,
    size: "~520 triệu năm ánh sáng",
    sizeEn: "~520 million light-years",
    description:
      "Xác định năm 2014 bằng cách theo dõi hướng chuyển động của các thiên hà: tất cả những thiên hà cùng bị kéo về một điểm hút chung thì thuộc cùng một siêu đám. Toàn bộ siêu đám Virgo nằm gọn trong Laniakea.",
    descriptionEn:
      "Defined in 2014 by tracking galaxy motions: galaxies falling toward the same gravitational focus belong to one supercluster. The entire Virgo Supercluster sits inside Laniakea.",
    color: "#c084fc",
  },
  {
    id: "observable",
    name: "Vũ trụ quan sát được",
    nameEn: "The observable universe",
    radius: null,
    size: "bán kính 46,5 tỉ năm ánh sáng",
    sizeEn: "46.5 billion light-years in radius",
    description:
      "Phần vũ trụ mà ánh sáng đã kịp đi tới chúng ta. Biên của nó không phải một bức tường mà chỉ là giới hạn tầm nhìn — người đứng ở thiên hà khác sẽ có một chân trời khác.",
    descriptionEn:
      "The part of the universe whose light has had time to reach us. Its edge is not a wall but a limit of sight — an observer in another galaxy has a different horizon.",
    color: "#f97316",
  },
];

/**
 * Ba hạng nút trong mạng vũ trụ, phân biệt bằng màu.
 *
 * Không có màu thì mọi chấm sáng như nhau và người xem không đọc được đâu là
 * siêu cụm, đâu là một thiên hà lẻ — đó là lý do mô hình trước trông như một
 * mớ dây điện.
 */
export const NODE_TIERS = {
  supercluster: { color: "#fbbf24", label: "Siêu cụm thiên hà", labelEn: "Supercluster" },
  cluster: { color: "#60a5fa", label: "Cụm thiên hà", labelEn: "Galaxy cluster" },
  galaxy: { color: "#e2e8f0", label: "Thiên hà đơn lẻ", labelEn: "Single galaxy" },
} as const;

export type CosmicLandmark = {
  id: string;
  name: string;
  nameEn: string;
  /** Khoảng cách tới chúng ta, triệu năm ánh sáng */
  distanceMly: number;
  /** Hướng trong mô hình — chỉ để tách các mốc ra cho dễ nhìn, không phải hướng thật trên bầu trời */
  azimuth: number;
  elevation: number;
  tier: keyof typeof NODE_TIERS | "home";
  note: string;
  noteEn: string;
};

/**
 * Các cấu trúc có thật, đặt quanh vị trí của chúng ta ở gốc toạ độ.
 *
 * KHOẢNG CÁCH là số đo thật. HƯỚNG thì không: một mô hình trừu tượng như thế
 * này không có hệ toạ độ bầu trời, nên các mốc được tách ra cho dễ đọc. Điều
 * này được nói rõ trong phần chú thích của trang.
 */
export const COSMIC_LANDMARKS: CosmicLandmark[] = [
  {
    id: "milky-way",
    name: "Ngân Hà — bạn đang ở đây",
    nameEn: "The Milky Way — you are here",
    distanceMly: 0,
    azimuth: 0,
    elevation: 0,
    tier: "home",
    note: "Thiên hà của chúng ta. Ở tỉ lệ này, cả Ngân Hà nhỏ hơn một điểm ảnh — chấm sáng bạn thấy chỉ là dấu vị trí.",
    noteEn: "Our galaxy. At this scale the whole Milky Way is smaller than a pixel; the marker is only a position flag.",
  },
  {
    id: "andromeda",
    name: "Thiên hà Andromeda (M31)",
    nameEn: "The Andromeda Galaxy (M31)",
    distanceMly: 2.5,
    azimuth: 0.6,
    elevation: 0.18,
    tier: "galaxy",
    note: "Thiên hà lớn gần nhất, đang lao về phía chúng ta với tốc độ 110 km/s và sẽ sáp nhập sau khoảng 4,5 tỉ năm.",
    noteEn: "The nearest large galaxy, approaching us at 110 km/s and due to merge in about 4.5 billion years.",
  },
  {
    id: "local-group",
    name: "Cụm địa phương",
    nameEn: "The Local Group",
    distanceMly: 5,
    azimuth: 2.1,
    elevation: -0.12,
    tier: "cluster",
    note: "Khoảng 80 thiên hà liên kết hấp dẫn, trong đó Ngân Hà và Andromeda là hai thành viên áp đảo.",
    noteEn: "Some 80 gravitationally bound galaxies, dominated by the Milky Way and Andromeda.",
  },
  {
    id: "virgo",
    name: "Đám Virgo",
    nameEn: "The Virgo Cluster",
    distanceMly: 54,
    azimuth: 4.0,
    elevation: 0.35,
    tier: "cluster",
    note: "Đám thiên hà gần nhất, khoảng 1.300 thiên hà. Nó là khối lượng chi phối siêu đám mang tên nó.",
    noteEn: "The nearest galaxy cluster, some 1,300 galaxies, and the dominant mass of the supercluster named after it.",
  },
  {
    id: "coma",
    name: "Đám Coma",
    nameEn: "The Coma Cluster",
    distanceMly: 320,
    azimuth: 1.2,
    elevation: 0.7,
    tier: "cluster",
    note: "Nơi Fritz Zwicky năm 1933 nhận ra các thiên hà chuyển động quá nhanh so với khối lượng nhìn thấy — bằng chứng đầu tiên về vật chất tối.",
    noteEn: "Where Fritz Zwicky noticed in 1933 that galaxies moved too fast for their visible mass — the first evidence for dark matter.",
  },
  {
    id: "great-attractor",
    name: "Đại Thu Hút (tâm Laniakea)",
    nameEn: "The Great Attractor (Laniakea's focus)",
    distanceMly: 250,
    azimuth: 5.3,
    elevation: -0.45,
    tier: "supercluster",
    note: "Điểm hút mà toàn bộ siêu đám Laniakea, gồm cả chúng ta, đang rơi về phía đó với tốc độ khoảng 600 km/s.",
    noteEn: "The gravitational focus that all of Laniakea, us included, is falling toward at around 600 km/s.",
  },
];

/** Quy khoảng cách và hướng của một mốc về toạ độ cảnh. */
export function landmarkPosition(
  landmark: CosmicLandmark,
): [number, number, number] {
  const r = landmark.distanceMly / MLY_PER_UNIT;
  return [
    r * Math.cos(landmark.elevation) * Math.cos(landmark.azimuth),
    r * Math.sin(landmark.elevation),
    r * Math.cos(landmark.elevation) * Math.sin(landmark.azimuth),
  ];
}

/**
 * Các nấc của thanh tỉ lệ. Kéo thanh là đổi khoảng cách camera, và tên cấu
 * trúc tương ứng cho biết ở tầm nhìn đó thì thứ gì vừa khung.
 */
export const SCALE_STEPS = [
  { mly: 1, structure: "Hệ Mặt Trời và các sao lân cận", structureEn: "The Solar System and nearby stars", distance: 5 },
  { mly: 10, structure: "Cụm địa phương", structureEn: "The Local Group", distance: 10 },
  { mly: 100, structure: "Siêu đám Virgo", structureEn: "The Virgo Supercluster", distance: 20 },
  { mly: 500, structure: "Siêu đám Laniakea", structureEn: "The Laniakea Supercluster", distance: 36 },
  { mly: 1_000, structure: "Mạng vũ trụ", structureEn: "The cosmic web", distance: 55 },
] as const;

export const UNIVERSE_FACTS = [
  { labelVi: "Tuổi vũ trụ", labelEn: "Age of the universe", value: "13,8 tỉ năm", valueEn: "13.8 billion years" },
  { labelVi: "Bán kính vùng quan sát được", labelEn: "Observable radius", value: "46,5 tỉ năm ánh sáng", valueEn: "46.5 billion light-years" },
  { labelVi: "Số thiên hà ước tính", labelEn: "Estimated galaxies", value: "hàng trăm tỉ tới hai nghìn tỉ", valueEn: "hundreds of billions to two trillion" },
  { labelVi: "Sợi dài nhất đã biết", labelEn: "Largest known filament", value: "Hercules–Corona Borealis, ~10 tỉ năm ánh sáng", valueEn: "Hercules–Corona Borealis, ~10 billion light-years" },
  { labelVi: "Khoảng rỗng lớn", labelEn: "Large voids", value: "đường kính 100–300 triệu năm ánh sáng", valueEn: "100–300 million light-years across" },
  { labelVi: "Thành phần", labelEn: "Composition", value: "68% năng lượng tối, 27% vật chất tối, 5% vật chất thường", valueEn: "68% dark energy, 27% dark matter, 5% ordinary matter" },
  { labelVi: "Độ cong không gian", labelEn: "Spatial curvature", value: "phẳng trong sai số đo được", valueEn: "flat within measurement error" },
  { labelVi: "Vũ trụ có hữu hạn không", labelEn: "Is the universe finite", value: "chưa biết", valueEn: "unknown" },
];
