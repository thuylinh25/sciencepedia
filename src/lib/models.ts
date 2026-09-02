/**
 * Ba mô hình 3D, xếp theo thang bậc kích thước từ nhỏ tới lớn.
 *
 * Thứ tự trong mảng chính là thứ tự bậc thang: `ScaleLadder` lấy phần tử liền
 * trước và liền sau để dựng liên kết "lùi ra / thu vào" ở cuối mỗi trang, nên
 * thêm một mô hình mới chỉ cần chèn đúng chỗ vào đây.
 */

export type ModelStep = {
  id: string;
  href: string;
  /** Khoá dịch trong namespace `nav` */
  navKey: "solarSystem" | "milkyWay" | "universe";
  name: string;
  nameEn: string;
  scale: string;
  scaleEn: string;
  blurb: string;
  blurbEn: string;
  image: string;
  color: string;
};

const thumb = (dir: string, file: string) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${dir}/${file}/1280px-${file}`;

export const MODEL_STEPS: ModelStep[] = [
  {
    id: "solar-system",
    href: "/solar-system",
    navKey: "solarSystem",
    name: "Hệ Mặt Trời",
    nameEn: "The Solar System",
    scale: "~9 tỉ km",
    scaleEn: "~9 billion km",
    blurb:
      "Tám hành tinh chuyển động quanh Mặt Trời, mỗi hành tinh mang bản đồ bề mặt thật và nghiêng đúng trục quay của nó. Bấm vào một hành tinh để xem thông số và mở bài viết.",
    blurbEn:
      "Eight planets orbiting the Sun, each with its real surface map and true axial tilt. Click a planet for its figures and article.",
    image: thumb("a/a9", "Planets2013.jpg"),
    color: "#f59e0b",
  },
  {
    id: "milky-way",
    href: "/milky-way",
    navKey: "milkyWay",
    name: "Ngân Hà",
    nameEn: "The Milky Way",
    scale: "~100.000 năm ánh sáng",
    scaleEn: "~100,000 light-years",
    blurb:
      "Thiên hà của chúng ta với bốn nhánh xoắn ốc, phần phình trung tâm và quầng cụm sao cầu. Có chế độ nhìn ngang đĩa để thấy nó mỏng tới mức nào, và nhãn đánh dấu vị trí Mặt Trời.",
    blurbEn:
      "Our galaxy with its four spiral arms, central bulge and globular-cluster halo. An edge-on view shows how thin the disk is, and a marker gives the Sun's position.",
    image: thumb("1/16", "The_Milky_Way_over_ALMA.jpg"),
    color: "#8b5cf6",
  },
  {
    id: "universe",
    href: "/universe",
    navKey: "universe",
    name: "Vũ trụ",
    nameEn: "The Universe",
    scale: "bán kính 46,5 tỉ năm ánh sáng",
    scaleEn: "46.5 billion light-years in radius",
    blurb:
      "Mạng vũ trụ ở quy mô lớn nhất: các đám thiên hà nối nhau thành sợi, bao quanh những khoảng rỗng khổng lồ. Kèm bậc thang kích thước từ Ngân Hà ra tới chân trời vũ trụ.",
    blurbEn:
      "The cosmic web at the largest scale: galaxy clusters strung into filaments around enormous voids. Includes a scale ladder from the Milky Way out to the cosmic horizon.",
    image: thumb("0/0f", "Cosmic_web.jpg"),
    color: "#6366f1",
  },
];

export function modelNeighbours(id: string) {
  const index = MODEL_STEPS.findIndex((step) => step.id === id);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? MODEL_STEPS[index - 1] : null,
    next: index < MODEL_STEPS.length - 1 ? MODEL_STEPS[index + 1] : null,
  };
}
