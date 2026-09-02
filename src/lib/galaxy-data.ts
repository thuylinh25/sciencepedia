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

/** Bán kính đĩa sao nhìn thấy được: ~50.000 năm ánh sáng. */
export const DISK_RADIUS = 10;

/** Bán kính phần phình trung tâm. */
export const BULGE_RADIUS = 2.2;

/** Ngân Hà là thiên hà xoắn ốc có thanh, với bốn nhánh chính. */
export const ARM_COUNT = 4;

/** Độ xoắn của nhánh — càng lớn thì nhánh cuộn càng chặt. */
export const ARM_SPIN = 0.42;

/**
 * Vị trí Mặt Trời: cách tâm khoảng 26.000 năm ánh sáng, nằm ở rìa trong của
 * nhánh Orion — một nhánh phụ nằm giữa hai nhánh chính Perseus và Sagittarius.
 */
export const SUN_RADIUS_UNITS = 26_000 / LY_PER_UNIT;

/** Đĩa mỏng đến mức nào: 1.000 năm ánh sáng bề dày trên 100.000 đường kính. */
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
    angle: Math.PI * 0.32,
    description:
      "Hệ Mặt Trời nằm cách tâm khoảng 26.000 năm ánh sáng, ở rìa trong nhánh Orion. Nó mất khoảng 230 triệu năm để đi hết một vòng quanh tâm thiên hà.",
    descriptionEn:
      "The Solar System sits about 26,000 light-years from the centre, on the inner edge of the Orion Arm. One lap around the galaxy takes some 230 million years.",
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

export const GALAXY_FACTS = [
  { labelVi: "Đường kính đĩa sao", labelEn: "Disk diameter", value: "~100.000 năm ánh sáng", valueEn: "~100,000 light-years" },
  { labelVi: "Bề dày đĩa mỏng", labelEn: "Thin disk thickness", value: "~1.000 năm ánh sáng", valueEn: "~1,000 light-years" },
  { labelVi: "Số sao ước tính", labelEn: "Estimated stars", value: "100–400 tỉ", valueEn: "100–400 billion" },
  { labelVi: "Khối lượng (gồm quầng tối)", labelEn: "Mass (with dark halo)", value: "~1,5 nghìn tỉ khối lượng Mặt Trời", valueEn: "~1.5 trillion solar masses" },
  { labelVi: "Mặt Trời cách tâm", labelEn: "Sun's distance from centre", value: "~26.000 năm ánh sáng", valueEn: "~26,000 light-years" },
  { labelVi: "Một vòng của Mặt Trời", labelEn: "Sun's orbital period", value: "~230 triệu năm", valueEn: "~230 million years" },
  { labelVi: "Tuổi", labelEn: "Age", value: "~13,6 tỉ năm", valueEn: "~13.6 billion years" },
  { labelVi: "Phân loại", labelEn: "Classification", value: "Xoắn ốc có thanh (SBbc)", valueEn: "Barred spiral (SBbc)" },
];
