"use client";

// Client vì phải quyết định tại thời điểm chạy có mount cảnh WebGL hay không —
// quyết định đó phụ thuộc bề rộng màn hình và thiết lập giảm chuyển động của
// người dùng, hai thứ chỉ biết được ở trình duyệt.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { EARTH_GLOBE } from "@/lib/hero-globe-data";

/**
 * Quả cầu Trái Đất ở cột phải của hero.
 *
 * ## Vì sao phải cẩn thận với khối này
 *
 * Hero là vùng quyết định LCP, và trang chủ là trang nhiều người mở nhất.
 * three.js + @react-three/fiber + drei là vài trăm KB. Nhét thẳng vào hero là
 * cách nhanh nhất để phá Core Web Vitals của cả site. Mục "Hệ Mặt Trời" phía
 * dưới trang chủ đã từng chọn minh hoạ bằng CSS thay vì canvas đúng vì lý do
 * này — khối ở đây không phá lệ đó mà đi vòng qua nó.
 *
 * ## Bốn lớp phòng vệ
 *
 * 1. **`ssr: false` + `next/dynamic`.** three.js không nằm trong bundle của
 *    trang chủ; nó chỉ được tải khi khối này quyết định mount. HTML đầu tiên
 *    không chứa một byte nào của nó.
 *
 * 2. **Chỉ mount sau khi hydrate.** `mounted` bắt đầu là `false`, chỉ bật lên
 *    trong `useEffect`. Nghĩa là quá trình tải và vẽ cảnh 3D bắt đầu SAU khi
 *    trang đã tương tác được, không tranh băng thông với nội dung.
 *
 * 3. **Chỗ đứng cùng kích thước.** Ảnh nền tĩnh chiếm đúng ô vuông mà canvas
 *    sẽ chiếm, nên lúc canvas xuất hiện không đẩy gì cả — CLS bằng 0. Nếu
 *    người dùng không bao giờ đủ điều kiện mount, họ vẫn thấy một quả cầu
 *    trông hợp lý chứ không phải khoảng trống.
 *
 * 4. **Ba điều kiện chặn.** Không mount khi: bật giảm chuyển động, màn hình
 *    hẹp hơn `lg`, hoặc thiết bị báo ít hơn 4 lõi. Xem chú thích ở dưới.
 */
const GlobeScene = dynamic(
  () => import("@/components/solar/globe-scene").then((m) => m.GlobeScene),
  { ssr: false },
);

export function HeroGlobe() {
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // `lg` của Tailwind. Dưới ngưỡng này hero xếp một cột, và một canvas WebGL
    // trên điện thoại vừa tốn pin vừa kéo dài hero — đúng thứ vừa được sửa khi
    // hạ hero từ 88vh xuống 70vh.
    const wide = window.matchMedia("(min-width: 1024px)");

    /**
     * Máy yếu thì bỏ qua. `hardwareConcurrency` là chỉ báo thô nhưng là thứ duy
     * nhất có sẵn không tốn gì; Safari cũ không khai báo thì `?? 8` cho qua,
     * vì chặn nhầm một máy khoẻ tệ hơn là cho qua một máy yếu.
     *
     * Quy tắc CSS `prefers-reduced-motion` toàn cục KHÔNG chạm được vòng lặp
     * `useFrame` của WebGL — nó chỉ tắt animation CSS. Nên ở đây phải kiểm
     * bằng JS và không mount, chứ không phải mount rồi cho đứng yên.
     */
    const capable = (navigator.hardwareConcurrency ?? 8) >= 4;

    const decide = () =>
      setShowScene(!motion.matches && wide.matches && capable);

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
      {/* Chỗ đứng: quả cầu vẽ bằng gradient. Luôn có mặt, canvas chỉ nằm đè
          lên. Không dùng <Image> vì đây thuần CSS, không tải thêm byte nào. */}
      <div
        className="absolute inset-[8%] rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #4f8ff0 0%, #2e6fdb 38%, #123a7a 62%, #061634 100%)",
          boxShadow:
            "0 0 90px -10px rgb(46 111 219 / 0.55), inset -18px -12px 60px rgb(0 0 0 / 0.55)",
        }}
      />

      {showScene && (
        <div className="absolute inset-0">
          <GlobeScene
            body={EARTH_GLOBE}
            spinning
            distance={2.9}
            // Tắt điều khiển: đây là hình minh hoạ, không phải mô hình để
            // nghịch. Bật lên thì OrbitControls nuốt sự kiện `wheel` và người
            // đọc đưa chuột qua quả cầu rồi cuộn sẽ thấy trang đứng im.
            // Muốn nghịch thật thì có trang /solar-system.
            interactive={false}
            transparent
          />
        </div>
      )}
    </div>
  );
}
