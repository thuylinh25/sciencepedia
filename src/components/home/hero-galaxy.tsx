"use client";

// Client vì phải quyết định tại thời điểm chạy có mount cảnh WebGL hay không —
// quyết định đó phụ thuộc bề rộng màn hình và thiết lập giảm chuyển động của
// người dùng, hai thứ chỉ biết được ở trình duyệt.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/** Tốc độ quay khi người dùng xin giảm chuyển động. Đặt 0 để dừng hẳn. */
const GENTLE_SPEED = 0.5;
const NORMAL_SPEED = 1.6;

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
 * ## Giảm chuyển động — chuyển động chậm lại, KHÔNG dừng hẳn
 *
 * Quyết định của chủ sản phẩm, ghi lại kèm lý do vì nó đi ngược mặc định của
 * web: cảnh vẫn chạy kể cả khi người dùng bật `prefers-reduced-motion`, chỉ
 * chạy chậm hơn.
 *
 * Bản trước dừng hẳn, và hai lần liên tiếp bị báo là "mô hình 3D bị hỏng" —
 * một cảnh 3D đóng băng trông y hệt một cảnh 3D lỗi, không ai phân biệt được.
 * Đó là lý do không quay lại phương án dừng hẳn.
 *
 * Nếu sau này cần siết lại theo chuẩn trợ năng, chỗ phải sửa là hằng số
 * `GENTLE_SPEED` — đặt về 0 là quay lại hành vi dừng hẳn.
 *
 * Lưu ý quy tắc CSS `prefers-reduced-motion` toàn cục KHÔNG chạm được vòng lặp
 * `useFrame` của WebGL; nó chỉ tắt animation CSS. Nên tốc độ ở đây buộc phải
 * điều khiển bằng JS.
 */
const GalaxyScene = dynamic(
  () => import("@/components/galaxy/galaxy-scene").then((m) => m.GalaxyScene),
  { ssr: false },
);

export function HeroGalaxy({ locale }: { locale: string }) {
  const [showScene, setShowScene] = useState(false);
  const [gentle, setGentle] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  /**
   * Parallax theo con trỏ.
   *
   * Làm bằng `transform` trên khung bọc chứ không đổi camera của cảnh. Ba lý
   * do: không phải sửa `GalaxyScene` (đang dùng chung với trang /milky-way),
   * transform chạy trên compositor nên không tốn một khung dựng WebGL nào, và
   * `GalaxyScene` đã đặt `resize={{ offsetSize: true }}` nên transform không
   * làm canvas đo sai kích thước.
   *
   * Biên độ 14px là cố ý nhỏ. Parallax mạnh trên một khối trang trí gây cảm
   * giác giật khi người đọc chỉ đang đưa chuột qua để bấm ô tìm kiếm.
   */
  useEffect(() => {
    if (gentle) return; // xin giảm chuyển động thì bỏ hẳn parallax theo chuột
    const el = wrap.current;
    if (!el) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return; // gộp về một lần mỗi khung hình
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        el.style.transform = `translate3d(${-x * 28}px, ${-y * 18}px, 0)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [gentle]);

  useEffect(() => {
    // `lg` của Tailwind. Dưới ngưỡng này hero xếp một cột, và một canvas WebGL
    // trên điện thoại vừa tốn pin vừa kéo dài hero — đúng thứ vừa được sửa khi
    // hạ hero từ 88vh xuống 70vh.
    const wide = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      setShowScene(wide.matches);
      setGentle(motion.matches);
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
      ref={wrap}
      className="relative isolate mx-auto aspect-square w-full max-w-[30rem] transition-transform duration-300 ease-out will-change-transform"
    >
      {/* Quầng sáng nền. Nằm dưới canvas trong suốt nên khi cảnh lên nó thành
          ánh nền của đĩa thiên hà chứ không phải một lớp thừa phải gỡ đi. */}
      <div
        className="absolute inset-[4%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(255 224 173 / 0.5) 0%, rgb(127 168 255 / 0.3) 34%, transparent 68%)",
        }}
      />

      {showScene && (
        /**
         * Mặt nạ toả tròn để mép canvas biến mất.
         *
         * Canvas là hình vuông, và dù `alpha` đã bật thì lớp sao nền của cảnh
         * vẫn phủ kín ô vuông đó — kết quả là một mảng sẫm có cạnh thẳng nổi rõ
         * trên nền hero. Mặt nạ làm bốn cạnh mờ dần về trong suốt nên thiên hà
         * trông như đang lơ lửng trong nền chứ không như một tấm ảnh dán lên.
         */
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(circle at 50% 50%, #000 38%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 50%, #000 38%, transparent 72%)",
          }}
        >
          <GalaxyScene
            settings={{
              playing: true,
              // Cảnh quay ở `delta * 0.035 * speed` rad/s. 1.6 cho một vòng
              // khoảng hai phút: thấy rõ là đang sống, vẫn đủ chậm để không
              // kéo mắt khỏi ô tìm kiếm ngay bên cạnh. Từng đặt 0.3 và một
              // vòng mất mười phút — mắt không nhận ra, khối trông như ảnh dán.
              speed: gentle ? GENTLE_SPEED : NORMAL_SPEED,
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
