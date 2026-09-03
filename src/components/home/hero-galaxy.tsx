"use client";

// Client vì phải quyết định tại thời điểm chạy có mount cảnh WebGL hay không —
// quyết định đó phụ thuộc bề rộng màn hình và thiết lập giảm chuyển động của
// người dùng, hai thứ chỉ biết được ở trình duyệt.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Ngân Hà xoay ở cột phải của hero.
 *
 * ## Vì sao khối này phải cẩn thận
 *
 * Hero là vùng quyết định LCP, và trang chủ là trang nhiều người mở nhất.
 * three.js + fiber + drei là vài trăm KB. Nhét thẳng vào hero là cách nhanh
 * nhất để phá Core Web Vitals của cả site. Mục "Hệ Mặt Trời" phía dưới trang
 * chủ đã từng chọn minh hoạ bằng CSS thay vì canvas đúng vì lý do này — khối
 * ở đây không phá lệ đó mà đi vòng qua nó.
 *
 * ## Ba lớp phòng vệ
 *
 * 1. **`ssr: false` + `next/dynamic`.** three.js không nằm trong bundle của
 *    trang chủ; nó chỉ được tải khi khối này quyết định mount. HTML đầu tiên
 *    không chứa một byte nào của nó.
 *
 * 2. **Chỉ mount sau khi hydrate.** `mounted` bắt đầu là `false`, chỉ bật lên
 *    trong `useEffect`. Việc tải và dựng cảnh bắt đầu SAU khi trang đã tương
 *    tác được, không tranh băng thông với nội dung.
 *
 * 3. **Chỗ đứng cùng kích thước.** Quầng sáng CSS chiếm đúng ô vuông mà canvas
 *    sẽ chiếm, nên lúc canvas xuất hiện không đẩy gì cả — CLS bằng 0.
 *
 * ## Giảm chuyển động
 *
 * Vẫn dựng thiên hà, chỉ **không cho xoay** (`playing: false`). Bản đầu chặn
 * mount hẳn và hoá ra sai theo hai hướng: người bật thiết lập đó xin ít chuyển
 * động chứ không xin ít nội dung, mà bên nhìn vào thì ảnh chờ phẳng lì trông y
 * như một cảnh 3D hỏng.
 *
 * Lưu ý quy tắc CSS `prefers-reduced-motion` toàn cục KHÔNG chạm được vòng lặp
 * `useFrame` của WebGL; nó chỉ tắt animation CSS. Nên chuyển động của thiên hà
 * buộc phải tắt bằng JS như ở đây.
 */
const GalaxyScene = dynamic(
  () => import("@/components/galaxy/galaxy-scene").then((m) => m.GalaxyScene),
  { ssr: false },
);

export function HeroGalaxy({ locale }: { locale: string }) {
  const [showScene, setShowScene] = useState(false);
  const [spinning, setSpinning] = useState(true);

  useEffect(() => {
    // `lg` của Tailwind. Dưới ngưỡng này hero xếp một cột, và một canvas WebGL
    // trên điện thoại vừa tốn pin vừa kéo dài hero — đúng thứ vừa được sửa khi
    // hạ hero từ 88vh xuống 70vh.
    const wide = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      setShowScene(wide.matches);
      setSpinning(!motion.matches);
    };

    decide();
    motion.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      motion.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="relative isolate mx-auto aspect-square w-full max-w-[26rem]"
    >
      {/* Chỗ đứng: quầng sáng vẽ bằng gradient, không tải thêm byte nào. Nằm
          dưới canvas trong suốt nên khi cảnh lên nó thành ánh nền của đĩa
          thiên hà chứ không phải một lớp thừa phải gỡ đi. */}
      <div
        className="absolute inset-[6%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(255 224 173 / 0.45) 0%, rgb(127 168 255 / 0.28) 34%, transparent 68%)",
        }}
      />

      {showScene && (
        <div className="absolute inset-0">
          <GalaxyScene
            settings={{
              playing: spinning,
              speed: 1,
              // Nhãn và các thiên thể là chuyện của trang /milky-way. Ở hero
              // chúng chỉ thành chữ nhỏ li ti không đọc nổi, và mỗi nhãn là
              // một phần tử HTML chồng lên canvas.
              showLabels: false,
              showSun: false,
              showObjects: false,
              view: "free",
              tour: false,
            }}
            onSelect={() => {}}
            locale={locale}
            onTourStep={() => {}}
            onTourEnd={() => {}}
            // Tắt điều khiển: đây là hình minh hoạ, không phải mô hình để
            // nghịch. Bật lên thì OrbitControls nuốt sự kiện `wheel` và người
            // đọc đưa chuột qua thiên hà rồi cuộn sẽ thấy trang đứng im.
            // Muốn nghịch thật thì có trang /milky-way.
            interactive={false}
            transparent
          />
        </div>
      )}
    </div>
  );
}
