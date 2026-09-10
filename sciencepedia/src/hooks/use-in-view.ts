"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Báo khi một phần tử lọt vào (gần) khung nhìn — một lần rồi thôi.
 *
 * Dùng để hoãn những thứ đắt tiền cho tới lúc người đọc thật sự cuộn tới.
 * `once` là mặc định vì mọi chỗ dùng hiện nay đều là "nạp rồi giữ": nạp lại
 * khi cuộn qua cuộn lại là phí băng thông và làm mất trạng thái người dùng đã
 * tương tác.
 *
 * `rootMargin` mặc định 200px: bắt đầu nạp trước khi khung lộ ra, để lúc nó
 * vào tầm mắt thì đã có gì đó để xem. Đặt 0 thì người đọc luôn nhìn thấy một
 * ô trống trong khoảng thời gian tải.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {},
) {
  const { rootMargin = "200px", threshold = 0, once = true } = options;

  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Trình duyệt không có IntersectionObserver thì coi như đã hiện: thà nạp
    // sớm còn hơn không bao giờ nạp.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView } as const;
}
