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
