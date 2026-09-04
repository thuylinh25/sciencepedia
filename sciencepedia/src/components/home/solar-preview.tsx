"use client";

// Client vì phải quyết định tại thời điểm chạy có mount cảnh WebGL hay không —
// quyết định đó phụ thuộc bề rộng màn hình, thứ chỉ biết được ở trình duyệt.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";

/**
 * Tốc độ quỹ đạo, dùng cho mọi người bất kể `prefers-reduced-motion`.
 *
 * Con số 2 chứ không phải 1: `orbitSpeed` trong `solar-data` tỉ lệ với chu kỳ
 * THẬT, nên dải giữa các hành tinh là 1.607 (Thuỷ) xuống 0.006 (Hải Vương) —
 * chênh 270 lần. Ở tốc độ 1 thì Trái Đất mất một phút mỗi vòng còn Hải Vương
 * mất ba giờ, tức phần ngoài của mô hình đứng yên với mắt người.
 *
 * Ở 2: Trái Đất ~11 giây một vòng, Sao Mộc ~3 phút, Sao Thổ ~8 phút.
 *
 * KHÔNG nén dải tốc độ cho hành tinh ngoài quay nhanh bằng hành tinh trong:
 * đây là bách khoa toàn thư khoa học, và việc Hải Vương chậm hơn Thuỷ Tinh
 * hàng trăm lần là một sự thật của mô hình chứ không phải lỗi cần chữa.
 */
const NORMAL_SPEED = 2;

/**
 * Camera lùi bao xa.
 *
 * ## Ràng buộc thật là CHIỀU DỌC, không phải chiều ngang
 *
 * Hai lần trước tôi tính nửa bề ngang khung nhìn **tại mặt phẳng gốc** rồi kết
 * luận 66 rồi 72 là đủ. Cả hai lần đều bị báo "mô hình bị khuyết bên dưới", vì
 * phép tính sai chỗ: mép quỹ đạo **gần camera nhất** nằm ở độ sâu nhỏ hơn
 * nhiều so với gốc, mà khung nhìn ở độ sâu nhỏ thì hẹp hơn.
 *
 * Tính đúng, với camera ở `[0, d/2, d]` nhìn về gốc và fov dọc 45°, cho điểm
 * gần nhất `(0, 0, R)` của quỹ đạo bán kính R:
 *
 *   lệch xuống  = 0,447 · R          ← KHÔNG phụ thuộc d
 *   độ sâu      = 1,1176·d − 0,894·R
 *   nửa khung   = 0,4142 · độ sâu
 *
 * Lọt khung khi `0,4142·(1,1176d − 0,894R) > 0,447R`, rút gọn thành
 * **`d > 1,766·R`**.
 *
 * Sao Hải Vương ở 43, cộng bán kính hành tinh thì R ≈ 45 → cần d > 79,5. Kiểm
 * bằng số: d=72 cho lệch xuống 20,1 với nửa khung 16,7 (cắt); d=88 cho 20,1 so
 * với 24,1 (dư 20%).
 *
 * Lùi ra thì mô hình nhỏ đi, nên khung bù lại bằng `max-w-3xl`.
 */
const CAMERA_DISTANCE = 88;

const SolarScene = dynamic(
  () => import("@/components/solar/scene").then((m) => m.SolarScene),
  { ssr: false },
);

const CSS_ORBITS = [
  { size: "45%", duration: "8s", dot: "0.5rem" },
  { size: "62%", duration: "13s", dot: "0.75rem" },
  { size: "80%", duration: "21s", dot: "0.6rem" },
  { size: "98%", duration: "34s", dot: "0.9rem" },
];

/**
 * Mô hình Hệ Mặt Trời trong khối giới thiệu ở giữa trang chủ.
 *
 * ## Vì sao vẫn giữ minh hoạ CSS
 *
 * Khối này trước đây chỉ là bốn vòng tròn CSS, với chú thích "nhẹ hơn nhiều so
 * với nhúng canvas ở trang chủ". Lý do đó vẫn đúng — nên minh hoạ CSS không bị
 * xoá mà **hạ xuống làm chỗ đứng**: nó vẽ ngay trong HTML đầu tiên, và cảnh 3D
 * chỉ đè lên sau. CLS bằng 0, người chưa tải xong thấy một hình có nghĩa, và
 * trên điện thoại — nơi cảnh 3D không mount — vẫn có quỹ đạo xoay.
 *
 * ## Ba lớp phòng vệ hiệu năng
 *
 * 1. `ssr: false` + `next/dynamic` — three.js ở chunk riêng, HTML đầu tiên
 *    không chứa byte nào của nó.
 * 2. Chỉ mount trong `useEffect`, tức sau khi trang đã tương tác được.
 * 3. Chỉ mount từ `lg` trở lên. Cảnh này nặng hơn thiên hà ở hero — tám hành
 *    tinh có texture riêng — nên trên điện thoại bốn vòng tròn CSS là lựa chọn
 *    đúng, không phải lựa chọn kém.
 */
export function SolarPreview() {
  const locale = useLocale();
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const decide = () => setShowScene(wide.matches);

    decide();
    wide.addEventListener("change", decide);
    return () => wide.removeEventListener("change", decide);
  }, []);

  return (
    /*
     * Khung rộng hơn cao, KHÔNG vuông.
     *
     * Đĩa Hệ Mặt Trời nhìn nghiêng ~27° trải theo chiều ngang gấp đôi chiều
     * dọc. Khung càng vuông thì càng phải lùi camera để chứa hết bề ngang, mà
     * lùi camera lại làm hành tinh nhỏ đi. Khung rộng cho cả hai.
     */
    <div
      aria-hidden
      className="relative mx-auto aspect-[16/9] w-full max-w-3xl"
    >
      {/*
       * Chỗ đứng: minh hoạ quỹ đạo bằng CSS, có mặt trong HTML đầu tiên.
       *
       * PHẢI ẩn khi cảnh 3D lên. Canvas bật `alpha`, nên nếu để lại thì các
       * vòng tròn và chấm trắng hiện xuyên qua và chồng lên quỹ đạo thật thành
       * hình đôi. Quầng sáng mềm thì chồng được, đường kẻ cứng thì không.
       *
       * Khung trong phải VUÔNG: các vòng dùng `width: 45%` + `height: 45%` +
       * `rounded-full`. Trong ô vuông đó là hình tròn; trong ô 16/9 thì 45% bề
       * ngang khác 45% chiều cao tính bằng pixel, nên chúng bị bóp thành elip
       * dẹt — thấy rõ trên điện thoại, nơi đây là thứ duy nhất hiển thị.
       */}
      <div
        className={
          showScene ? "hidden" : "absolute inset-0 grid place-items-center"
        }
      >
        <div className="relative aspect-square h-full">
          <div className="absolute inset-0 grid place-items-center">
            {/* Mặt Trời phải ấm. Vàng thương hiệu nằm ở --primary; để nguyên
                bg-accent thì minh hoạ có một mặt trời xanh. */}
            <div className="size-16 rounded-full bg-primary shadow-[0_0_80px_25px_var(--color-primary)]" />
          </div>

          {CSS_ORBITS.map((orbit) => (
            <div
              key={orbit.size}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
              style={{ width: orbit.size, height: orbit.size }}
            >
              <div
                className="absolute inset-0 animate-[spin_var(--d)_linear_infinite]"
                style={{ ["--d" as string]: orbit.duration }}
              >
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90"
                  style={{ width: orbit.dot, height: orbit.dot }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*
       * Không còn mặt nạ toả tròn.
       *
       * Mặt nạ trước đây tồn tại để che mép vuông của lớp sao trong cảnh. Nay
       * `transparent` tắt hẳn lớp sao đó (xem `SolarScene`), nên không còn gì
       * để che — mà mặt nạ thì lại cắt mất rìa dưới của quỹ đạo ngoài cùng, đã
       * bị báo hai lần là "mô hình bị khuyết". Gỡ nguồn gây lỗi rẻ hơn chỉnh
       * liều lượng của thứ đi che nó.
       */}
      {showScene && (
        <div className="absolute inset-0">
          <SolarScene
            settings={{
              playing: true,
              speed: NORMAL_SPEED,
              showOrbits: true,
              // Nhãn là chuyện của trang /solar-system. Ở khung này chúng
              // thành chữ li ti không đọc nổi, và mỗi nhãn là một phần tử HTML
              // chồng lên canvas.
              showLabels: false,
              realScale: false,
            }}
            selectedId={null}
            onSelect={() => {}}
            locale={locale}
            cameraDistance={CAMERA_DISTANCE}
            // Tắt điều khiển: đây là hình minh hoạ nằm giữa một trang cuộn dọc.
            // Bật lên thì OrbitControls nuốt sự kiện wheel và người đọc đưa
            // chuột qua khối này rồi cuộn sẽ thấy trang đứng im. Muốn nghịch
            // thật thì bấm nút ngay bên cạnh để sang /solar-system.
            interactive={false}
            transparent
          />
        </div>
      )}
    </div>
  );
}
