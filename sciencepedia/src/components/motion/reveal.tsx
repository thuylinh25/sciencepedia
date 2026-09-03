"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Lưới bài viết đi kèm hiệu ứng hiện dần, nhưng nội dung không được phụ thuộc
 * vào hiệu ứng đó.
 *
 * HTML dựng sẵn ở máy chủ đã mang `opacity: 0` trên từng phần tử, và chỉ
 * IntersectionObserver phía client mới gỡ nó ra. Có những môi trường observer
 * không bao giờ chạy — WebView trong ứng dụng (trình duyệt của Facebook), hoặc
 * phần tử mount lúc tài liệu đang ẩn khi điều hướng phía client. Khi đó cả lưới
 * bài viết vô hình vĩnh viễn mà vẫn chiếm đủ chiều cao, đẩy phân trang khỏi màn
 * hình: người đọc thấy một trang trắng.
 *
 * Hẹn giờ này là lưới an toàn — quá thời gian chờ thì hiện ra bất kể observer.
 */
function useRevealFallback(delay = 600): boolean {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return expired;
}

/**
 * Hiện dần khi cuộn tới. Tự tắt chuyển động nếu người dùng bật
 * "giảm chuyển động" ở cấp hệ điều hành.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const reduced = useReducedMotion();
  const offset = reduced ? OFFSET.none : OFFSET[direction];
  const Component = motion[as];
  const fallback = useRevealFallback();

  return (
    <Component
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      animate={fallback ? { opacity: 1, x: 0, y: 0 } : undefined}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Component>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Bọc một danh sách để các phần tử con hiện lần lượt. */
export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const fallback = useRevealFallback();

  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial={reduced ? false : "hidden"}
      animate={fallback ? "show" : undefined}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={cn(className)}>
      {children}
    </motion.div>
  );
}
