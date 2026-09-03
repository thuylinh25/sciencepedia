"use client";

// Client vì phải quyết định tại thời điểm chạy có mount cảnh WebGL hay không —
// quyết định đó phụ thuộc bề rộng màn hình và thiết lập giảm chuyển động, hai
// thứ chỉ biết được ở trình duyệt.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";

/** Tốc độ quỹ đạo khi người dùng xin giảm chuyển động. Đặt 0 để dừng hẳn. */
const GENTLE_SPEED = 0.35;
const NORMAL_SPEED = 1;

/**
 * Mô hình Hệ Mặt Trời trong khối giới thiệu ở giữa trang chủ.
 *
 * ## Vì sao vẫn giữ minh hoạ CSS
 *
 * Khối này trước đây chỉ là bốn vòng tròn CSS, với chú thích "nhẹ hơn nhiều so
 * với nhúng canvas ở trang chủ". Lý do đó vẫn đúng — nên minh hoạ CSS không bị
 * xoá mà **hạ xuống làm chỗ đứng**: nó vẽ ngay trong HTML đầu tiên, chiếm đúng
 * ô vuông canvas sẽ chiếm, và cảnh 3D chỉ đè lên sau. Ba cái lợi cùng lúc:
 * CLS bằng 0, người chưa tải xong thấy một hình có nghĩa chứ không phải khoảng
 * trống, và ai không đủ điều kiện mount vẫn có quỹ đạo xoay.
 *
 * ## Ba lớp phòng vệ hiệu năng
 *
 * 1. `ssr: false` + `next/dynamic` — three.js ở chunk riêng, HTML đầu tiên
 *    không chứa byte nào của nó.
 * 2. Chỉ mount trong `useEffect`, tức sau khi trang đã tương tác được.
 * 3. Chỉ mount từ `lg` trở lên. Cảnh này nặng hơn thiên hà ở hero — tám hành
 *    tinh có texture riêng cộng 5000 sao nền — nên trên điện thoại thì bốn
 *    vòng tròn CSS là lựa chọn đúng, không phải lựa chọn kém.
 *
 * ## Giảm chuyển động — chậm lại, KHÔNG dừng hẳn
 *
 * Quyết định của chủ sản phẩm, ghi lại kèm lý do vì nó đi ngược mặc định của
 * web: quỹ đạo vẫn chạy kể cả khi người dùng bật `prefers-reduced-motion`,
 * chỉ chậm hơn. Bản trước dừng hẳn và bị báo là "mô hình 3D bị hỏng" — một
 * cảnh 3D đóng băng trông y hệt một cảnh 3D lỗi.
 *
 * Muốn siết lại theo chuẩn trợ năng thì sửa `GENTLE_SPEED`; đặt 0 là quay lại
 * hành vi dừng hẳn.
 *
 * Quy tắc CSS `prefers-reduced-motion` toàn cục KHÔNG chạm được vòng lặp
 * `useFrame` của WebGL — nó chỉ tắt animation CSS, nên tốc độ ở đây buộc phải
 * điều khiển bằng JS.
 */
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

export function SolarPreview() {
  const locale = useLocale();
  const [showScene, setShowScene] = useState(false);
  const [gentle, setGentle] = useState(false);

  useEffect(() => {
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
    /* Khung rộng hơn cao, KHÔNG vuông.

       Đĩa Hệ Mặt Trời nhìn nghiêng là một hình elip rộng gấp rưỡi chiều cao.
       Nhét nó vào khung vuông thì hai bên bị cắt — hành tinh đi qua mép canvas
       bị chặt theo một đường thẳng đứng, trông như lỗi render. Đó là lỗi thật
       đã thấy trong ảnh chụp màn hình, và mặt nạ toả tròn chỉ làm mờ nó đi chứ
       không chữa được gốc.

       Tỉ lệ 16/9 chứ không 7/5: quỹ đạo ngoài cùng (Sao Hải Vương, bán kính
       43 đơn vị cảnh) trải theo chiều NGANG gấp đôi chiều dọc, vì đĩa được
       nhìn nghiêng khoảng 27 độ. Khung càng vuông thì càng phải lùi camera để
       chứa hết bề ngang, mà lùi camera lại làm hành tinh nhỏ đi. Khung rộng
       cho cả hai: chứa đủ và giữ hành tinh to.

       max-w-2xl: to hơn khoảng 40% so với bản gốc max-w-md. */
    <div aria-hidden className="relative mx-auto aspect-[16/9] w-full max-w-2xl">
      {/* Chỗ đứng: minh hoạ quỹ đạo bằng CSS, có mặt trong HTML đầu tiên.

          PHẢI ẩn đi khi cảnh 3D lên. Canvas bật `alpha` nên nếu để lại, các
          vòng tròn và chấm trắng của minh hoạ hiện xuyên qua và chồng lên quỹ
          đạo thật thành hình đôi — trông như cảnh bị lỗi. Quầng sáng mềm thì
          chồng được, còn đường kẻ cứng thì không. */}
      <div
        className={
          showScene ? "hidden" : "absolute inset-0 grid place-items-center"
        }
      >
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

      {showScene && (
        /**
         * Mặt nạ toả tròn — sửa hai lỗi cùng lúc, cả hai thấy được trong ảnh
         * chụp màn hình:
         *
         * 1. Canvas là hình vuông và lớp sao nền của cảnh phủ kín ô vuông đó,
         *    nên dù `alpha` đã bật vẫn có một mảng sáng khác nền, cạnh thẳng,
         *    nổi rõ trên nền vũ trụ của khối.
         * 2. Hành tinh ngoài đi qua rìa khung bị **cắt cụt** ngay tại mép
         *    canvas — một nửa hành tinh biến mất theo đường thẳng đứng. Mặt nạ
         *    làm nó mờ dần thay vì bị chặt.
         *
         * Dải mờ rộng hơn của thiên hà (45%→85% thay vì 38%→72%) vì quỹ đạo
         * ngoài cùng nằm sát mép khung, cần chỗ để tan.
         */
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 82% 88% at 50% 50%, #000 68%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 82% 88% at 50% 50%, #000 68%, transparent 100%)",
          }}
        >
          <SolarScene
            settings={{
              playing: true,
              speed: gentle ? GENTLE_SPEED : NORMAL_SPEED,
              showOrbits: true,
              // Nhãn là chuyện của trang /solar-system. Ở khung này chúng thành
              // chữ li ti không đọc nổi, và mỗi nhãn là một phần tử HTML chồng
              // lên canvas.
              showLabels: false,
              realScale: false,
            }}
            selectedId={null}
            onSelect={() => {}}
            locale={locale}
            // Tắt điều khiển: đây là hình minh hoạ nằm giữa một trang cuộn dọc.
            // Bật lên thì OrbitControls nuốt sự kiện wheel và người đọc đưa
            // chuột qua khối này rồi cuộn sẽ thấy trang đứng im. Muốn nghịch
            // thật thì bấm nút ngay bên cạnh để sang /solar-system.
            /* Tính chứ không đoán. Camera ở [0, d/2, d] nhìn về gốc, fov 45
               độ, nên nửa bề ngang nhìn thấy ở mặt phẳng gốc xấp xỉ
               0,46·d·(tỉ lệ khung) = 0,46·72·1,78 ≈ 59 đơn vị cảnh. Quỹ đạo xa
               nhất là Sao Hải Vương ở 43, cộng bán kính hành tinh và vành đai
               Sao Thổ thì cần chừng 47 — còn dư khoảng 25% để không có gì chạm
               mép. Bản trước đặt 66 với khung 7/5 chỉ cho ra ~43, tức vừa đúng
               mép, và Sao Thổ bị chặt đôi. */
            cameraDistance={72}
            interactive={false}
            transparent
          />
        </div>
      )}
    </div>
  );
}
