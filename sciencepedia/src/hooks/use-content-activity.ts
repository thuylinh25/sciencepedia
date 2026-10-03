"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Ghi lịch sử xem cho người đã đăng nhập — `/api/activity`.
 *
 * Không nằm trên đường render: không trả gì, không chặn gì, mọi lệnh gửi là
 * `sendBeacon` (hoặc `fetch keepalive`) không ai chờ. Hỏng thì im lặng.
 *
 * Nhịp gửi: MỘT lượt "view" khi nội dung đã được xem đủ `minSeconds` giây
 * (tab đang hiện), rồi một lượt "duration" mỗi khi người đọc rời đi — tab ẩn,
 * đóng trang, điều hướng, hay đổi sang nội dung khác. Không gửi theo từng giây.
 *
 * Chống đếm trùng:
 *   - Mount/unmount/StrictMode: hẹn giờ "view" bị huỷ ở cleanup, nên lượt mount
 *     giả của StrictMode không gửi gì; lượt "duration" chỉ gửi SAU khi đã có
 *     "view", nên cũng không gửi.
 *   - Tải lại trang, mở tab thứ hai, mount lại sau đó: lượt "view" vẫn gửi,
 *     nhưng server chỉ cộng `viewCount` khi lần xem trước đã cách hơn 30 phút
 *     (`SESSION_GAP` trong `server/activity.ts`). Client không phải nhớ gì.
 */
export function useContentActivity({
  type,
  id,
  label,
  minSeconds,
}: {
  type: "article" | "model";
  /** `null` = chưa có gì để ghi (mô hình chưa tải, chưa mở cấu trúc nào) */
  id: string | null;
  label?: string;
  /** Thời gian xem tối thiểu (tab hiện) trước khi tính là một lượt xem */
  minSeconds: number;
}) {
  const { status } = useSession();
  const active = status === "authenticated" && id !== null;

  // Nhãn đổi theo ngôn ngữ không được coi là nội dung mới
  const labelRef = useRef(label);
  labelRef.current = label;

  useEffect(() => {
    if (!active || id === null) return;

    let viewed = false;
    /** Mili giây đã xem (tab hiện) mà chưa gửi lên */
    let pending = 0;
    let visibleSince: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const send = (event: "view" | "duration", seconds: number) => {
      const payload = JSON.stringify({
        type,
        id,
        event,
        seconds: Math.min(3600, seconds),
        ...(type === "model" && labelRef.current
          ? { label: labelRef.current.slice(0, 200) }
          : {}),
      });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon?.("/api/activity", blob)) return;
      } catch {
        // rơi xuống fetch
      }
      void fetch("/api/activity", {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    };

    const stopClock = () => {
      if (visibleSince !== null) {
        pending += performance.now() - visibleSince;
        visibleSince = null;
      }
      clearTimeout(timer);
    };

    const startClock = () => {
      if (document.visibilityState !== "visible" || visibleSince !== null) return;
      visibleSince = performance.now();
      if (!viewed) {
        timer = setTimeout(markViewed, Math.max(0, minSeconds * 1000 - pending));
      }
    };

    const markViewed = () => {
      stopClock();
      viewed = true;
      // Thời gian đã xem tới lúc đủ điều kiện đi kèm lượt "view"
      send("view", Math.round(pending / 1000));
      pending = 0;
      startClock();
    };

    const flush = () => {
      stopClock();
      const seconds = Math.round(pending / 1000);
      if (viewed && seconds >= 1) {
        send("duration", seconds);
        pending = 0;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else startClock();
    };

    startClock();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      // Rời nội dung này (điều hướng, đổi cấu trúc, unmount)
      flush();
    };
  }, [active, type, id, minSeconds]);
}
