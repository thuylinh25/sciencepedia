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
 * thiên thể là việc của engine tính (`astro.ts`), panel sẽ tự nói. Riêng
 * sao chổi Halley: engine vẽ không vẽ sao chổi, nhưng trang tự tính vị
 * trí của nó từ phần tử quỹ đạo JPL (`comets.ts`) và chấm một dấu có
 * đuôi lên khung — vì thế hai khoảnh khắc Halley neo vào đúng buổi rạng
 * sáng mà sao chổi THẬT SỰ ở trên chân trời Hà Nội. Đêm cận nhật
 * 9/2/1986 nó ở −49° và sát Mặt Trời 8°: "đúng ngày" nhưng không ai
 * ngắm được gì (Linh bắt được điểm này ngày 29/10/2026).
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
      month: 3,
      day: 19,
      hour: 5,
      minute: 0,
    }),
    labelVi: "Sao chổi Halley trên trời rạng sáng · 19/3/1986",
    labelEn: "Comet Halley in the dawn sky · 19 Mar 1986",
    blurbVi:
      "Sao chổi Halley đạt điểm cận nhật vào ngày 9/2/1986, nhưng những ngày đó nó nấp sát Mặt Trời nên từ Việt Nam không thể ngắm. Hơn một tháng sau nó mới tách sang vùng trời rạng sáng: khoảng 5 giờ sáng 19/3/1986, từ Hà Nội nó đứng ở độ cao khoảng 26° phía đông nam, trong chòm Nhân Mã, sáng khoảng cấp 5 — một vật thể của ống nhòm và những đôi mắt tinh dưới bầu trời tối. Trong khung, sao chổi là chấm sáng có đuôi tại đúng vị trí tính được của nó.",
    blurbEn:
      "Comet Halley reached perihelion on 9 February 1986, but in those days it hid right next to the Sun and could not be seen from Vietnam. More than a month later it had moved into the pre-dawn sky: around 5 a.m. on 19 March 1986, from Hanoi it stood about 26° up in the southeast, in Sagittarius, at roughly magnitude 5 — an object for binoculars and keen eyes under a dark sky. In the frame, the comet is the small glowing dot with a tail at its computed position.",
  },
  {
    id: "halley-2061",
    locationId: "ha-noi",
    instant: wallTimeToUtc("Asia/Ho_Chi_Minh", {
      year: 2061,
      month: 7,
      day: 16,
      hour: 4,
      minute: 0,
    }),
    labelVi: "Sao chổi Halley trên trời rạng sáng · 16/7/2061",
    labelEn: "Comet Halley in the dawn sky · 16 Jul 2061",
    blurbVi:
      "Sao chổi Halley trở lại với điểm cận nhật dự tính vào ngày 28/7/2061. Nhưng cũng như năm 1986, sát ngày cận nhật nó lặn về phía Mặt Trời; lúc ngắm tốt nhất từ Việt Nam là các buổi rạng sáng giữa tháng 7: khoảng 4 giờ sáng 16/7/2061 nó đứng ở độ cao khoảng 22° phía đông đông bắc, sáng khoảng cấp 3 — thấy được bằng mắt thường dưới bầu trời tối. Vị trí của nó trong khung là vị trí dự báo từ phần tử quỹ đạo đã công bố.",
    blurbEn:
      "Comet Halley returns with a predicted perihelion on 28 July 2061. But as in 1986, close to perihelion it dives toward the Sun; the best viewing window from Vietnam is the pre-dawn sky of mid-July: around 4 a.m. on 16 July 2061 it stands about 22° up in the east-northeast at roughly magnitude 3 — visible to the naked eye under a dark sky. Its position in the frame is forecast from published orbital elements.",
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
