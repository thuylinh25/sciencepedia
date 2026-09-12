"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Số đếm lên khi cuộn tới.
 *
 * `'use client'` vì nó cần `IntersectionObserver` và một vòng animation — hai
 * thứ chỉ có ở trình duyệt. Đặt ở lá: footer vẫn là Server Component, chỉ
 * riêng con số này chạy phía client.
 *
 * ## Vì sao nhận `value` là số và `formatted` là chuỗi
 *
 * Số để đếm, chuỗi để hiển thị lúc chưa chạy và lúc chạy xong. Nếu tự định
 * dạng trong này thì nó phải biết locale, mà locale đang được xử lý ở tầng
 * server bằng `formatMeasure`. Truyền cả hai thì một chỗ quyết định cách viết
 * số cho toàn site.
 *
 * ## Vì sao HTML đầu tiên đã có sẵn con số cuối
 *
 * Trạng thái khởi tạo là `value`, không phải 0. Con số thật nằm trong HTML
 * dựng sẵn, nên người tắt JavaScript và bộ thu thập của máy tìm kiếm đều đọc
 * được nó. Hiệu ứng chỉ hạ nó về 0 rồi đếm lên SAU KHI đã chắc chắn chạy được
 * — nếu không, một lỗi JS sẽ để lại một dãy số 0 trên trang.
 */
export function CountUp({
  value,
  formatted,
  className,
}: {
  value: number;
  formatted: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || done.current) return;

    // Người đã tắt hiệu ứng chuyển động thì thấy thẳng con số cuối.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || done.current) return;
        done.current = true;
        observer.disconnect();

        // 900 ms, đường cong chậm dần. Đủ để mắt bắt được là nó đang đếm mà
        // không bắt ai phải đợi một con số hiện ra.
        const duration = 900;
        const start = performance.now();

        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(step);
        };

        setDisplay(0);
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display === value ? formatted : display.toLocaleString()}
    </span>
  );
}
