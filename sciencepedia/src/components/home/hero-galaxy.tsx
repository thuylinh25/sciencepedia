"use client";

// Client vì parallax theo con trỏ: nó đọc vị trí chuột và ghi `transform`,
// hai việc chỉ có ở trình duyệt. Bản thân hình thì render ở server.

import { useEffect, useRef, useState } from "react";

import { HeroGalaxyArt } from "@/components/home/hero-galaxy-art";

/**
 * Thiên hà ở cột phải của hero.
 *
 * ## Vì sao KHÔNG còn là cảnh WebGL
 *
 * Bản trước dựng `GalaxyScene` — mô hình Ngân Hà bằng three.js, dùng chung với
 * trang /milky-way. Nó đúng về mặt khoa học nhưng ở hero nó sai việc: mô hình
 * ấy vẽ Ngân Hà nhìn từ ngoài bằng đám hạt màu vàng nhạt, và sau lớp mặt nạ
 * toả tròn cùng độ mờ cần thiết để chữ tiêu đề còn đọc được, thứ còn lại trên
 * màn hình là một vệt sáng mờ mà người xem đọc ra là "ảnh chưa tải xong" —
 * đúng phản hồi đã nhận.
 *
 * Đổi sang hình vẽ vector được ba thứ cùng lúc:
 *
 * 1. **Trang chủ không còn tải three.js.** Vài trăm KB rời khỏi vùng LCP của
 *    trang nhiều người mở nhất. Đây là cái lợi lớn nhất và nó không mất đi khi
 *    thiết kế đổi lần nữa.
 * 2. **Hình có mặt trong HTML đầu tiên.** Không còn khoảng chờ hydrate rồi mới
 *    thấy gì, không còn nhánh `lowPower`, không còn cảnh 3D đóng băng bị nhầm
 *    là hỏng trên máy yếu.
 * 3. **Điều khiển được độ sáng và màu.** Cái mà một cảnh hạt WebGL không cho
 *    làm nếu không sửa chính cảnh đang dùng ở /milky-way.
 *
 * Mô hình 3D thật vẫn còn nguyên và vẫn là nơi để xem Ngân Hà: trang
 * /milky-way, có đường dẫn từ chính hero và từ lưới "Khám phá tương tác".
 *
 * ## Giảm chuyển động — chậm lại, KHÔNG dừng hẳn
 *
 * Giữ nguyên phán quyết cũ của chủ sản phẩm, nay thực thi bằng CSS thay vì JS:
 * đĩa vẫn quay khi người dùng bật `prefers-reduced-motion`, chỉ chậm hơn. Một
 * khối trang trí đứng yên đã hai lần bị báo là "hỏng". Xem `.hero-galaxy-spin`
 * trong `globals.css` — đó là chỗ duy nhất cần sửa nếu muốn dừng hẳn.
 */
export function HeroGalaxy() {
  const wrap = useRef<HTMLDivElement>(null);
  const [gentle, setGentle] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setGentle(motion.matches);

    decide();
    motion.addEventListener("change", decide);
    return () => motion.removeEventListener("change", decide);
  }, []);

  /**
   * Parallax theo con trỏ.
   *
   * Biên độ nhỏ là cố ý. Parallax mạnh trên một khối trang trí gây cảm giác
   * giật khi người đọc chỉ đang đưa chuột qua để bấm ô tìm kiếm.
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

  return (
    <div
      aria-hidden
      ref={wrap}
      /* Trần 40rem: lớn hơn cột lưới của hero (36rem) một chút để quầng sáng
         còn chỗ tràn qua mép — chính chỗ tràn đó tạo cảm giác khối lớn hơn
         khung chứa nó. */
      className="relative isolate mx-auto aspect-square w-full max-w-[40rem] transition-transform duration-300 ease-out will-change-transform"
    >
      {/* Quầng sáng CSS nằm DƯỚI hình vẽ.

          Nó không còn là chỗ đứng tạm chờ WebGL như trước, mà là ánh nền thật
          của đĩa: blur-3xl trải rộng hơn mọi thứ vẽ được trong SVG, nên nó làm
          mềm ranh giới giữa thiên hà và nền hero. */}
      <div
        className="absolute inset-[6%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(255 224 173 / 0.42) 0%, rgb(127 168 255 / 0.28) 34%, transparent 68%)",
        }}
      />

      <HeroGalaxyArt className="absolute inset-0 size-full" />
    </div>
  );
}
