"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cuộn tới phần tử mà `#hash` trỏ đến sau khi điều hướng phía client.
 *
 * ## Vì sao cần, khi trình duyệt vốn tự làm việc này
 *
 * Trình duyệt chỉ tự cuộn khi nó TẢI một địa chỉ có `#hash`. Điều hướng trong
 * App Router không tải lại trang: router đổi URL rồi vẽ lại cây React, và tới
 * lúc nó thử cuộn thì phần tử đích có thể chưa tồn tại.
 *
 * Đã đo thật: bấm thẻ "Mặt Trăng" ở bậc thang kích thước trên trang Hệ Mặt
 * Trời → URL đổi đúng thành `/vi/space-map#body-moon`, nhưng `scrollY` bằng 0
 * trong khi thẻ Mặt Trăng nằm ở 4657px. Người dùng đọc ra là "liên kết không
 * tới đúng chỗ". Mở thẳng cùng địa chỉ ấy trong thanh địa chỉ thì lại đúng —
 * đó là dấu hiệu phân biệt: hỏng ở ĐIỀU HƯỚNG, không hỏng ở cái neo.
 *
 * ## Vì sao phải thử lại chứ không cuộn một lần
 *
 * Trang bản đồ bầu trời dựng thư viện thiên thể sau vài khung hình, và trang
 * bài dựng ảnh theo lô. Cuộn ngay lúc mount thì `getElementById` trả `null`.
 * Thử lại theo từng khung hình trong khoảng một giây rưỡi là đủ cho mọi trang
 * hiện có, và tự dừng nên không treo lại vòng lặp nào.
 *
 * ## Vì sao tự tính vị trí thay vì dùng `scrollIntoView`
 *
 * Thanh header dính cao 81px, nên `block: "start"` đặt phần tử nằm khuất dưới
 * nó. `block: "center"` chữa được điều đó cho phần tử nhỏ, nhưng KHÔNG chữa
 * cho phần tử cao hơn khung nhìn: lúc ấy trình duyệt tự chuyển về canh mép
 * trên, và mép trên lại chui xuống dưới header. Đã đo: thẻ Mặt Trăng trong thư
 * viện thiên thể dừng ở 69px trong khi header cao 81px, tức cụt 12px.
 *
 * Nên hàm này đọc chiều cao header thật rồi tự tính: phần tử cao hơn chỗ trống
 * thì canh mép trên ngay dưới header, phần tử vừa chỗ trống thì canh giữa phần
 * còn lại. Đọc chiều cao thay vì viết cứng 81px để header đổi cỡ — nó có đổi
 * giữa các bề ngang màn hình — thì đây không phải chỗ phải nhớ sửa theo.
 *
 * ## Vì sao đặt ở layout chứ không ở từng trang
 *
 * Lỗi này thuộc về ĐIỀU HƯỚNG, không thuộc về một trang nào. Mọi liên kết
 * `#hash` trỏ sang route khác đều dính: bậc thang kích thước trỏ tới
 * `#body-moon` và `#oort-cloud`, mục lục bài viết trỏ tới các mục H2. Sửa ở
 * một trang là để lại đúng cái bẫy ấy cho liên kết tiếp theo.
 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    let frame = 0;
    let tries = 0;
    /** ~1,5 giây ở 60fps. Đủ cho trang chậm nhất hiện có. */
    const MAX_TRIES = 90;

    const tick = () => {
      const target = document.getElementById(hash);
      if (target) {
        const header = document.querySelector("header");
        const offset = (header?.getBoundingClientRect().height ?? 0) + 16;
        const room = window.innerHeight - offset;
        const rect = target.getBoundingClientRect();
        const top = rect.top + window.scrollY - offset;

        window.scrollTo({
          top: Math.max(0, rect.height > room ? top : top - (room - rect.height) / 2),
        });
        return;
      }
      if (tries++ < MAX_TRIES) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
