/**
 * Bốn cấp của hành trình thu phóng, từ vũ trụ quan sát được xuống Trái Đất.
 *
 * Mỗi cấp là một cảnh 3D riêng chứ không phải một cảnh duy nhất phóng to liên
 * tục. Dải tỉ lệ ở đây là khoảng 19 bậc độ lớn, vượt xa độ chính xác của số
 * thực 32-bit mà WebGL dùng, nên ép vào cùng một cảnh thì hình học sẽ rã. Cảm
 * giác liền mạch được tạo bằng cách thu phóng và hoà mờ giữa hai cảnh liền kề
 * — đúng cách các trang "Powers of Ten" vẫn làm.
 */

export type ZoomLevel = {
  id: string;
  name: string;
  nameEn: string;
  /** Kích thước đặc trưng, hiển thị cho người xem */
  size: string;
  sizeEn: string;
  /** Kích thước quy ra mét, dùng để tính bội số giữa hai cấp */
  metres: number;
  blurb: string;
  blurbEn: string;
  /** Trang chi tiết tương ứng, nếu có */
  href?: string;
  color: string;
};

export const ZOOM_LEVELS: ZoomLevel[] = [
  {
    id: "universe",
    name: "Vũ trụ quan sát được",
    nameEn: "The observable universe",
    size: "93 tỉ năm ánh sáng",
    sizeEn: "93 billion light-years",
    metres: 8.8e26,
    blurb:
      "Các thiên hà không rải đều mà tụ thành sợi và tường bao quanh những khoảng rỗng khổng lồ. Đây là cấu trúc lớn nhất mà vũ trụ có.",
    blurbEn:
      "Galaxies are not spread evenly but strung into filaments and walls around enormous voids. This is the largest structure the universe has.",
    href: "/universe",
    color: "#6366f1",
  },
  {
    id: "milky-way",
    name: "Ngân Hà",
    nameEn: "The Milky Way",
    size: "105.000 năm ánh sáng",
    sizeEn: "105,000 light-years",
    metres: 9.9e20,
    blurb:
      "Một trong hàng trăm tỉ thiên hà. Chứa 100–400 tỉ ngôi sao, và Mặt Trời là một trong số đó, cách tâm 26.670 năm ánh sáng.",
    blurbEn:
      "One of hundreds of billions of galaxies, holding 100–400 billion stars. The Sun is one of them, 26,670 light-years from the centre.",
    href: "/milky-way",
    color: "#8b5cf6",
  },
  {
    id: "solar-system",
    name: "Hệ Mặt Trời",
    nameEn: "The Solar System",
    size: "9 tỉ km",
    sizeEn: "9 billion km",
    metres: 9e12,
    blurb:
      "Tám hành tinh quanh một ngôi sao trung bình. Ở tỉ lệ của Ngân Hà, cả hệ này nhỏ hơn một điểm ảnh.",
    blurbEn:
      "Eight planets around an average star. At the scale of the galaxy, the whole system is smaller than a pixel.",
    href: "/solar-system",
    color: "#f59e0b",
  },
  {
    id: "earth",
    name: "Trái Đất",
    nameEn: "Earth",
    size: "12.756 km",
    sizeEn: "12,756 km",
    metres: 1.2756e7,
    blurb:
      "Hành tinh thứ ba, và cho tới nay là nơi duy nhất được biết có sự sống. Toàn bộ lịch sử loài người diễn ra trên lớp vỏ mỏng của quả cầu này.",
    blurbEn:
      "The third planet, and so far the only place known to hold life. All of human history has happened on the thin skin of this ball.",
    color: "#38bdf8",
  },
];

/** Bội số kích thước giữa một cấp và cấp ngay sau nó. */
export function stepRatio(index: number): number | null {
  const current = ZOOM_LEVELS[index];
  const next = ZOOM_LEVELS[index + 1];
  if (!current || !next) return null;
  return current.metres / next.metres;
}
