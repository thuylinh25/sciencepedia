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

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const format = (n: number) =>
      new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(
        Math.round(n),
      ) + suffix;

    if (!inView || reduced) {
      node.textContent = format(inView ? value : 0);
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
  }, [inView, value, duration, suffix, reduced, locale]);

  return (
    <span ref={ref} aria-label={String(value)}>
      0
    </span>
  );
}
