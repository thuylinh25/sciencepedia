/**
 * Ba mô hình 3D, xếp theo thang bậc kích thước từ nhỏ tới lớn.
 *
 * Thứ tự trong mảng chính là thứ tự bậc thang: `ScaleLadder` lấy phần tử liền
 * trước và liền sau để dựng liên kết "lùi ra / thu vào" ở cuối mỗi trang, nên
 * thêm một mô hình mới chỉ cần chèn đúng chỗ vào đây.
 */

import { assetUrl } from "@/lib/asset";

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
    image: assetUrl("explore/planets-2013.jpg"),
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
    image: assetUrl("explore/milky-way-alma.jpg"),
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
    image: assetUrl("explore/cosmic-web.jpg"),
    color: "#6366f1",
  },
];

/**
 * Hai công cụ tương tác KHÔNG nằm trên bậc thang kích thước.
 *
 * ## Vì sao là mảng riêng, không phải `MODEL_STEPS` nới dài ra
 *
 * Cùng lý do đã tách `SCALE_RUNGS` ra, chỉ ngược chiều. `MODEL_STEPS` được
 * SẮP THEO TỈ LỆ, và `modelNeighbours()` lấy phần tử liền trước/liền sau để
 * dựng liên kết "lùi ra / thu vào" ở cuối mỗi trang mô hình. Nhét Bản đồ bầu
 * trời vào cuối mảng đó thì trang Vũ trụ mọc ra một liên kết "lùi ra" dẫn tới
 * bản đồ bầu trời — tức tuyên bố bầu trời lớn hơn vũ trụ. Thứ tự mảng ở đó là
 * một PHÁT BIỂU về tỉ lệ, không phải một danh sách.
 *
 * Hai công cụ này thật sự không có nấc: bản đồ bầu trời là hướng nhìn chứ
 * không phải kích thước, còn hành trình thu phóng đi qua MỌI nấc nên không
 * đứng ở nấc nào. Chúng vẫn là công cụ tương tác đầy đủ và được đếm như vậy —
 * xem `INTERACTIVE_TOOL_COUNT` ở `@/lib/site-tools`.
 *
 * Không có `scale`: thẻ của chúng không mang huy hiệu tỉ lệ đánh số, vì đánh
 * số chúng là đặt chúng lên lại cái thang vừa nói là chúng không thuộc về.
 */
export type ExploreTool = {
  id: string;
  href: string;
  /** Khoá namespace gốc chứa `title` và `subtitle` của chính công cụ đó */
  copyKey: "sky" | "zoom";
  image: string;
  color: string;
};

export const EXPLORE_TOOLS: ExploreTool[] = [
  {
    id: "space-map",
    href: "/space-map",
    copyKey: "sky",
    image: assetUrl("explore/sky-map.jpg"),
    color: "#38bdf8",
  },
  {
    id: "zoom",
    href: "/zoom",
    copyKey: "zoom",
    image: assetUrl("explore/zoom.jpg"),
    color: "#10b981",
  },
];

/**
 * Bậc thang kích thước — bảy nấc từ Mặt Trăng ra tới Ngân Hà.
 *
 * ## Vì sao đây là mảng RIÊNG, không phải `MODEL_STEPS` nới dài ra
 *
 * `MODEL_STEPS` là danh sách MÔ HÌNH 3D chạy được: mỗi phần tử có một trang
 * và một cảnh WebGL. Bậc thang thì là một công cụ GIẢNG GIẢI về tỉ lệ, và nó
 * cần cả những nấc không có mô hình nào — Đám mây Oort, vùng lân cận sao —
 * bởi vì bỏ chúng đi là bỏ mất chính chỗ mà bước nhảy tỉ lệ lớn nhất xảy ra:
 * từ 9 tỉ km lên 100.000 năm ánh sáng là gấp hơn một trăm nghìn lần, và không
 * ai hình dung được cú nhảy đó nếu không có nấc trung gian.
 *
 * Gộp hai thứ vào một mảng thì hoặc bậc thang thiếu nấc, hoặc trang /models
 * mọc ra bốn thẻ dẫn tới hư không.
 *
 * ## Vì sao `href` là tuỳ chọn
 *
 * Sáu nấc có đích thật (mô hình 3D, ảnh EPIC trực tiếp, ảnh bề mặt LRO, sơ đồ
 * Đám mây Oort); riêng nấc lân cận sao chỉ để đối chiếu tỉ lệ. Một nấc không có đích thì KHÔNG được vẽ thành thẻ bấm
 * được — quy tắc đã chốt khi bỏ cột "Tài nguyên" khỏi footer: dựng năm liên
 * kết chết còn tệ hơn không dựng gì.
 *
 * ## Con số lấy ở đâu
 *
 * Đường kính Mặt Trăng, Trái Đất, Mặt Trời là hằng số đo đạc phổ thông, làm
 * tròn tới ba chữ số. Hai nấc còn lại PHẢI giữ mệnh đề dè dặt:
 *
 * - **Đám mây Oort** chưa từng được quan sát trực tiếp; ước lượng rìa ngoài
 *   trải từ 0,03 tới hơn 3 năm ánh sáng tuỳ mô hình. In một con số điểm ở đây
 *   là dựng lên một độ chính xác không tồn tại.
 * - **Lân cận sao** không có biên giới vật lý nào cả; "~10 năm ánh sáng" là
 *   một lát cắt tiện dụng, nên nó đi kèm mốc kiểm được là Proxima Centauri.
 */
export type ScaleRung = {
  id: string;
  /** Chỉ có khi nấc này thật sự dẫn tới một trang */
  href?: string;
  name: string;
  nameEn: string;
  /** Kích thước đặc trưng, đã làm tròn */
  size: string;
  sizeEn: string;
  /** Một dòng, nói vì sao nấc này đáng đứng ở đây */
  note: string;
  noteEn: string;
  emoji: string;
  color: string;
};

export const SCALE_RUNGS: ScaleRung[] = [
  {
    id: "moon",
    /* Mở THẲNG quả cầu Mặt Trăng ở chế độ toàn màn hình trên trang bản đồ
       bầu trời. Không phải một trang riêng, nhưng là ẢNH BỀ MẶT THẬT do LRO
       chụp, tức đúng thứ nấc này hứa hẹn.

       `?body=moon` chứ không phải `#body-moon`: cái neo chỉ cuộn tới tấm bìa
       và bắt người bấm "Khám phá" bấm thêm một lần nữa giữa một lưới chín
       thẻ. Xem chú thích `?body=` trong `aladin-viewer.tsx`. */
    href: "/space-map?body=moon",
    name: "Mặt Trăng",
    nameEn: "The Moon",
    size: "3.475 km",
    sizeEn: "3,475 km",
    note: "Thiên thể duy nhất ngoài Trái Đất mà con người từng đặt chân lên.",
    noteEn: "The only world beyond Earth that people have walked on.",
    emoji: "🌙",
    color: "#cbd5e1",
  },
  {
    id: "earth",
    href: "/earth-live",
    name: "Trái Đất",
    nameEn: "Earth",
    size: "12.742 km",
    sizeEn: "12,742 km",
    note: "Gấp gần bốn lần Mặt Trăng — và là nơi mọi phép đo này được thực hiện.",
    noteEn:
      "Nearly four times the Moon, and where every one of these measurements was made.",
    emoji: "🌍",
    color: "#38bdf8",
  },
  {
    id: "sun",
    /* Cùng lý do với nấc "Mặt Trăng" ở trên: mở THẲNG quả cầu Mặt Trời ở chế
       độ toàn màn hình. Nấc này hứa đường kính 1,39 triệu km và 99,86% khối
       lượng cả hệ — thứ trả được lời hứa đó là bản đồ cầu 304 Å xoay được,
       không phải trang /solar-system vốn mở ra mô hình quỹ đạo tám hành tinh
       với Mặt Trời chỉ là quả cầu vàng ở giữa. */
    href: "/space-map?body=sun",
    name: "Mặt Trời",
    nameEn: "The Sun",
    size: "1,39 triệu km",
    sizeEn: "1.39 million km",
    note: "Đường kính gấp 109 lần Trái Đất; chứa 99,86% khối lượng cả hệ.",
    noteEn: "109 Earths across, and 99.86% of the whole system's mass.",
    emoji: "☀️",
    color: "#f59e0b",
  },
  {
    id: "solar-system",
    href: "/solar-system",
    name: "Hệ Mặt Trời",
    nameEn: "The Solar System",
    size: "~9 tỉ km",
    sizeEn: "~9 billion km",
    note: "Bề ngang quỹ đạo Sao Hải Vương — ánh sáng đi hết chừng tám giờ.",
    noteEn:
      "The width of Neptune's orbit; light takes about eight hours to cross it.",
    emoji: "🪐",
    color: "#fbbf24",
  },
  {
    id: "oort",
    /* Không có ảnh chụp nào của đám mây Oort, nên đích ở đây là SƠ ĐỒ trên
       trang bản đồ bầu trời — có dán nhãn rõ là sơ đồ thang loga. */
    href: "/space-map#oort-cloud",
    name: "Đám mây Oort",
    nameEn: "The Oort Cloud",
    size: "~1–3 năm ánh sáng",
    sizeEn: "~1–3 light-years",
    note: "Vỏ băng bao quanh cả hệ, chưa ai quan sát trực tiếp — nơi sao chổi chu kỳ dài đến từ.",
    noteEn:
      "An icy shell around the whole system, never directly observed — the source of long-period comets.",
    emoji: "❄️",
    color: "#a5b4fc",
  },
  {
    id: "neighbourhood",
    href: "/space-map",
    name: "Lân cận sao",
    nameEn: "Stellar neighbourhood",
    size: "~10 năm ánh sáng",
    sizeEn: "~10 light-years",
    note: "Sao gần nhất, Proxima Centauri, cách 4,2 năm ánh sáng.",
    noteEn: "The nearest star, Proxima Centauri, lies 4.2 light-years away.",
    emoji: "✨",
    color: "#67e8f9",
  },
  {
    id: "milky-way",
    href: "/milky-way",
    name: "Dải Ngân Hà",
    nameEn: "The Milky Way",
    size: "~100.000 năm ánh sáng",
    sizeEn: "~100,000 light-years",
    note: "Gấp mười nghìn lần vùng lân cận sao — và Mặt Trời chỉ là một chấm trong đó.",
    noteEn:
      "Ten thousand times the stellar neighbourhood, and the Sun is one dot inside it.",
    emoji: "🌌",
    color: "#8b5cf6",
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
