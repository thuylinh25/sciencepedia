"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useLocale } from "next-intl";

/** Số đếm tăng dần khi khối lọt vào khung nhìn. */
export function Counter({
  value,
  duration = 1.6,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const locale = useLocale();

  const format = (n: number) =>
    new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(
      Math.round(n),
    ) + suffix;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!inView || reduced) {
      node.textContent = format(inView || reduced ? value : 0);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });

    return () => controls.stop();
    // `format` được dựng lại mỗi lần render nhưng chỉ phụ thuộc locale/suffix,
    // hai thứ đã nằm trong danh sách này.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration, suffix, reduced, locale]);

  /* HTML dựng sẵn phải mang CON SỐ THẬT, không phải "0".
     StatsBand nói ngay bên dưới rằng "các con số trên là số đếm thật"; nếu
     không có JS (hoặc IntersectionObserver không bao giờ chạy — WebView trong
     ứng dụng) thì cả bốn ô đứng ở 0 và dòng đó thành một lời nói dối.
     Hiệu ứng đếm vẫn giữ nguyên: effect đặt lại về 0 ngay khi mount rồi đếm
     lên khi khối lọt vào khung nhìn. */
  return (
    <span ref={ref} aria-label={String(value)} suppressHydrationWarning>
      {format(value)}
    </span>
  );
}
