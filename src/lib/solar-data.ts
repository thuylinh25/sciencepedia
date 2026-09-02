/**
 * Số liệu Hệ Mặt Trời (nguồn: NASA Planetary Fact Sheet).
 *
 * `displayRadius` và `orbitRadius` là đơn vị của cảnh 3D, KHÔNG phải tỉ lệ thật —
 * nếu vẽ đúng tỉ lệ thì Sao Hải Vương sẽ nằm ngoài màn hình còn các hành tinh đá
 * nhỏ hơn một pixel. Tỉ lệ thật vẫn được giữ trong `realRadiusKm` / `realDistanceKm`
 * để hiển thị trong bảng thông tin và để chế độ "tỉ lệ thực" dùng tới.
 */
export type Planet = {
  id: string;
  name: string;
  nameEn: string;
  /** Slug bài viết tương ứng trong bách khoa */
  articleSlug: string;
  color: string;
  emissive?: string;

  displayRadius: number;
  orbitRadius: number;
  /** Số vòng quay quanh Mặt Trời mỗi đơn vị thời gian của cảnh */
  orbitSpeed: number;
  /** Tốc độ tự quay quanh trục */
  spinSpeed: number;
  /** Độ nghiêng trục quay (độ) */
  axialTilt: number;
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
};

/**
 * Bản đồ bề mặt hành tinh, bộ 2k của Solar System Scope (giấy phép CC BY 4.0),
 * lấy qua Wikimedia Commons vì máy chủ đó trả về `access-control-allow-origin: *`
 * — WebGL không nạp được texture từ nguồn không cho phép CORS.
 *
 * Ảnh dạng equirectangular: chiều ngang là kinh độ 0–360°, chiều dọc là vĩ độ
 * −90 tới 90°, đúng định dạng mà THREE.SphereGeometry mong đợi.
 */
const TEXTURE_BASE = "https://upload.wikimedia.org/wikipedia/commons";

export const TEXTURE_CREDIT = {
  name: "Solar System Scope",
  url: "https://www.solarsystemscope.com/textures/",
  license: "CC BY 4.0",
};

export const SUN = {
  id: "sun",
  name: "Mặt Trời",
  nameEn: "The Sun",
  articleSlug: "mat-troi",
  color: "#ffb703",
  texture: `${TEXTURE_BASE}/c/cb/Solarsystemscope_texture_2k_sun.jpg`,
  displayRadius: 3.2,
  realRadiusKm: 696_340,
  temperatureC: 5500,
  gravity: 274,
  descriptionVi:
    "Ngôi sao trung tâm chiếm 99,86% khối lượng toàn hệ, nơi phản ứng hợp hạch hydro thành heli diễn ra liên tục suốt 4,6 tỉ năm.",
  descriptionEn:
    "The central star holding 99.86% of the system mass, fusing hydrogen into helium continuously for 4.6 billion years.",
};

export const PLANETS: Planet[] = [
  {
    id: "mercury",
    name: "Sao Thuỷ",
    nameEn: "Mercury",
    articleSlug: "sao-thuy",
    color: "#9c8f84",
    displayRadius: 0.38,
    orbitRadius: 6,
    orbitSpeed: 1.607,
    spinSpeed: 0.017,
    axialTilt: 0.03,
    texture: `${TEXTURE_BASE}/9/92/Solarsystemscope_texture_2k_mercury.jpg`,
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
  },
  {
    id: "venus",
    name: "Sao Kim",
    nameEn: "Venus",
    articleSlug: "sao-kim",
    color: "#e8c39e",
    displayRadius: 0.62,
    orbitRadius: 8.4,
    orbitSpeed: 1.174,
    spinSpeed: -0.004,
    axialTilt: 177.4,
    texture: `${TEXTURE_BASE}/6/63/Solarsystemscope_texture_2k_venus_atmosphere.jpg`,
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
  },
  {
    id: "earth",
    name: "Trái Đất",
    nameEn: "Earth",
    articleSlug: "trai-dat",
    color: "#2e6fdb",
    emissive: "#0b2a5c",
    displayRadius: 0.65,
    orbitRadius: 11.2,
    orbitSpeed: 1,
    spinSpeed: 1,
    axialTilt: 23.4,
    texture: `${TEXTURE_BASE}/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg`,
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
  },
  {
    id: "mars",
    name: "Sao Hoả",
    nameEn: "Mars",
    articleSlug: "sao-hoa",
    color: "#c1440e",
    displayRadius: 0.45,
    orbitRadius: 15,
    orbitSpeed: 0.531,
    spinSpeed: 0.97,
    axialTilt: 25.2,
    texture: `${TEXTURE_BASE}/4/46/Solarsystemscope_texture_2k_mars.jpg`,
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
  },
  {
    id: "jupiter",
    name: "Sao Mộc",
    nameEn: "Jupiter",
    articleSlug: "sao-moc",
    color: "#d8a47f",
    displayRadius: 1.9,
    orbitRadius: 22,
    orbitSpeed: 0.084,
    spinSpeed: 2.42,
    axialTilt: 3.1,
    texture: `${TEXTURE_BASE}/b/be/Solarsystemscope_texture_2k_jupiter.jpg`,
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
  },
  {
    id: "saturn",
    name: "Sao Thổ",
    nameEn: "Saturn",
    articleSlug: "sao-tho",
    color: "#e3d5a1",
    displayRadius: 1.6,
    orbitRadius: 29,
    orbitSpeed: 0.034,
    spinSpeed: 2.24,
    axialTilt: 26.7,
    texture: `${TEXTURE_BASE}/e/ea/Solarsystemscope_texture_2k_saturn.jpg`,
    ring: { inner: 2.1, outer: 3.4, color: "#d8c9a3", opacity: 0.75 },
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
  },
  {
    id: "uranus",
    name: "Sao Thiên Vương",
    nameEn: "Uranus",
    articleSlug: "sao-thien-vuong",
    color: "#9fd8e0",
    displayRadius: 1.1,
    orbitRadius: 36,
    orbitSpeed: 0.012,
    spinSpeed: -1.39,
    axialTilt: 97.8,
    texture: `${TEXTURE_BASE}/9/95/Solarsystemscope_texture_2k_uranus.jpg`,
    ring: { inner: 1.4, outer: 1.7, color: "#8fbfd0", opacity: 0.35 },
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
  },
  {
    id: "neptune",
    name: "Sao Hải Vương",
    nameEn: "Neptune",
    articleSlug: "sao-hai-vuong",
    color: "#3b5fd4",
    displayRadius: 1.05,
    orbitRadius: 43,
    orbitSpeed: 0.006,
    spinSpeed: 1.49,
    axialTilt: 28.3,
    texture: `${TEXTURE_BASE}/1/1e/Solarsystemscope_texture_2k_neptune.jpg`,
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
  },
];

/** Bán kính quỹ đạo theo tỉ lệ thật, nén log để vẫn nhìn được trên màn hình. */
export function realScaleOrbit(planet: Planet): number {
  const au = planet.realDistanceKm / 149_600_000;
  return 6 + Math.log10(au + 1) * 46;
}

/** Bán kính hành tinh theo tỉ lệ thật so với Trái Đất (nén nhẹ). */
export function realScaleRadius(planet: Planet): number {
  const earthRadii = planet.realRadiusKm / 6371;
  return 0.28 * Math.pow(earthRadii, 0.62);
}
