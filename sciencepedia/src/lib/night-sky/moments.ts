import { wallTimeToUtc } from "@/lib/night-sky/timezone";

/**
 * "Máy thời gian bầu trời" — các khoảnh khắc lịch sử dựng lại được bằng
 * đúng hai thao tác của trang: chọn nơi + chọn lúc.
 *
 * ## Quy tắc biên tập của tệp này
 *
 * Mỗi khoảnh khắc chỉ khẳng định những sự kiện đã ổn định trong sử liệu
 * phổ thông (ngày, nơi, ai làm gì). KHÔNG khẳng định: số người tham dự,
 * lời trích dẫn, phút chính xác của những sự kiện mà nguồn phổ thông chỉ
 * ghi tới mức ngày/giờ, hay "thiên thể X đang ở trên trời lúc đó" — vị trí
 * thiên thể là việc của engine tính (`astro.ts`), panel sẽ tự nói. Đặc
 * biệt với sao chổi Halley: engine VẼ không hề vẽ sao chổi — lời kể chỉ
 * nói khung cảnh là bầu trời của đêm đó, không hứa hẹn thấy sao chổi
 * trong khung.
 *
 * Thời điểm lưu là `Date` tuyệt đối, suy từ GIỜ TƯỜNG tại nơi của khoảnh
 * khắc qua `wallTimeToUtc` — cùng một ngữ nghĩa giờ như mọi nơi khác
 * trên trang, để dòng "Đang xem" đọc ra đúng giờ địa phương lịch sử.
 */

export type SkyMoment = {
  id: string;
  /** Id trong `SKY_LOCATIONS` — khoảnh khắc luôn neo vào một nơi danh mục. */
  locationId: string;
  instant: Date;
  labelVi: string;
  labelEn: string;
  blurbVi: string;
  blurbEn: string;
};

export const SKY_MOMENTS: readonly SkyMoment[] = [
  {
    id: "apollo-11",
    locationId: "houston",
    // 15:17 giờ Houston (CDT) = 20:17 UTC, giờ Eagle chạm xuống.
    instant: wallTimeToUtc("America/Chicago", {
      year: 1969,
      month: 7,
      day: 20,
      hour: 15,
      minute: 17,
    }),
    labelVi: "Apollo 11 hạ cánh · 20/7/1969",
    labelEn: "Apollo 11 landing · 20 Jul 1969",
    blurbVi:
      "Ngày 20 tháng 7 năm 1969, Apollo 11 là sứ mệnh đầu tiên đưa con người lên Mặt Trăng: Neil Armstrong và Buzz Aldrin hạ cánh xuống Biển Tĩnh Lặng bằng khoang Eagle, còn Michael Collins ở lại module chỉ huy trên quỹ đạo. Khung cảnh này dựng lại bầu trời nhìn từ Houston, Texas — nơi đặt Trung tâm Điều khiển Sứ mệnh — vào đúng thời điểm hạ cánh, theo giờ địa phương.",
    blurbEn:
      "On 20 July 1969, Apollo 11 became the first mission to land humans on the Moon: Neil Armstrong and Buzz Aldrin touched down in the Sea of Tranquility in the Eagle lander, while Michael Collins stayed in orbit in the command module. This view rebuilds the sky over Houston, Texas — home of Mission Control — at the moment of touchdown, in local time.",
  },
  {
    id: "eclipse-vietnam-1995",
    locationId: "phan-thiet",
    instant: wallTimeToUtc("Asia/Ho_Chi_Minh", {
      year: 1995,
      month: 10,
      day: 24,
      hour: 9,
      minute: 30,
    }),
    labelVi: "Nhật thực toàn phần tại Việt Nam · 24/10/1995",
    labelEn: "Total solar eclipse in Vietnam · 24 Oct 1995",
    blurbVi:
      "Sáng 24 tháng 10 năm 1995, dải nhật thực toàn phần quét qua miền Trung và miền Nam Việt Nam, trong đó có Phan Thiết — một trong những điểm quan sát được nhắc tới nhiều nhất của sự kiện. Khung cảnh này đặt bạn ở Phan Thiết vào buổi sáng hôm đó; panel bên cạnh cho thấy vị trí tính được của Mặt Trời và Mặt Trăng tại thời điểm đang xem.",
    blurbEn:
      "On the morning of 24 October 1995, the path of a total solar eclipse crossed central and southern Vietnam, including Phan Thiet — one of the most talked-about observing sites of the event. This view places you in Phan Thiet that morning; the side panel shows the computed positions of the Sun and Moon at the selected moment.",
  },
  {
    id: "halley-1986",
    locationId: "ha-noi",
    instant: wallTimeToUtc("Asia/Ho_Chi_Minh", {
      year: 1986,
      month: 2,
      day: 9,
      hour: 21,
      minute: 0,
    }),
    labelVi: "Sao chổi Halley ghé thăm · 9/2/1986",
    labelEn: "Comet Halley visits · 9 Feb 1986",
    blurbVi:
      "Sao chổi Halley quay lại gần Mặt Trời khoảng 75–76 năm một lần. Lần ghé thăm gần nhất đạt điểm cận nhật vào ngày 9 tháng 2 năm 1986 — khung cảnh này dựng lại bầu trời đêm Hà Nội hôm đó, bầu trời mà mọi người ngẩng lên khi cả thế giới đang nói về sao chổi. (Khung trời của trang vẽ sao và hành tinh, không vẽ sao chổi.)",
    blurbEn:
      "Comet Halley returns to the inner Solar System roughly every 75–76 years. Its most recent visit reached perihelion on 9 February 1986 — this view rebuilds Hanoi's night sky that evening, the sky people looked up at while the world was talking about the comet. (The sky view draws stars and planets, not the comet itself.)",
  },
  {
    id: "halley-2061",
    locationId: "ha-noi",
    instant: wallTimeToUtc("Asia/Ho_Chi_Minh", {
      year: 2061,
      month: 7,
      day: 28,
      hour: 21,
      minute: 0,
    }),
    labelVi: "Sao chổi Halley trở lại · 28/7/2061",
    labelEn: "Comet Halley returns · 28 Jul 2061",
    blurbVi:
      "Lần trở lại tiếp theo của sao chổi Halley được dự tính đạt điểm cận nhật vào ngày 28 tháng 7 năm 2061. Khung cảnh này là bầu trời Hà Nội tối hôm đó — một bầu trời chưa ai từng nhìn thấy, nhưng vị trí các hành tinh và Mặt Trăng của nó đã tính trước được. (Khung trời của trang vẽ sao và hành tinh, không vẽ sao chổi.)",
    blurbEn:
      "Comet Halley's next return is expected to reach perihelion on 28 July 2061. This view shows Hanoi's sky that evening — a sky nobody has seen yet, though the positions of its planets and Moon are already computable. (The sky view draws stars and planets, not the comet itself.)",
  },
  {
    id: "independence-1945",
    locationId: "ha-noi",
    instant: wallTimeToUtc("Asia/Ho_Chi_Minh", {
      year: 1945,
      month: 9,
      day: 2,
      hour: 19,
      minute: 0,
    }),
    labelVi: "Tối ngày Độc lập · 2/9/1945",
    labelEn: "Independence evening · 2 Sep 1945",
    blurbVi:
      "Chiều 2 tháng 9 năm 1945, tại Quảng trường Ba Đình ở Hà Nội, bản Tuyên ngôn Độc lập được đọc, khai sinh nước Việt Nam Dân chủ Cộng hoà. Khung cảnh này là bầu trời Hà Nội vào tối hôm đó — bầu trời sao trên đầu thành phố trong đêm lịch sử ấy.",
    blurbEn:
      "On the afternoon of 2 September 1945, at Ba Dinh Square in Hanoi, the Declaration of Independence was read, founding the Democratic Republic of Vietnam. This view shows Hanoi's sky that evening — the starry sky over the city on that historic night.",
  },
];

export function findMoment(id: string): SkyMoment | undefined {
  return SKY_MOMENTS.find((moment) => moment.id === id);
}
