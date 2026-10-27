"use client";

import { useEffect } from "react";

/**
 * Đếm một lượt xem của trang mô hình/công cụ này — không vẽ gì cả.
 *
 * Là nửa phía trình duyệt của `POST /api/tools/[id]/view`, cùng cơ chế với
 * `ViewCounter` của bài viết (đếm ở trình duyệt vì trang được phục vụ từ
 * cache ISR; chốt `sessionStorage` để F5 trong cùng phiên không cộng thêm;
 * route còn rate limit theo IP). Xem docs/architecture.md, mục "Đếm lượt đọc".
 *
 * Khác `ViewCounter` ở đầu ra: trang công cụ không hiển thị số lượt xem ở đâu
 * (con số chỉ về bảng tổng quan admin), nên component này không giữ state và
 * không đọc phản hồi — chốt chỉ cần một dấu "đã đếm", không cần giữ con số.
 * Trình duyệt chặn sessionStorage thì vẫn gửi: thà đếm dư còn hơn không đếm.
 */
export function ToolViewTracker({ toolId }: { toolId: string }) {
  useEffect(() => {
    const key = `tool-views:${toolId}`;

    try {
      // Có dấu rồi (kể cả dấu rỗng của lần mount trước trong StrictMode dev)
      // nghĩa là phiên này đã đếm — hoặc đang đếm — cho công cụ này.
      if (window.sessionStorage.getItem(key) !== null) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // không dùng được sessionStorage thì bỏ qua chốt, vẫn đếm
    }

    // keepalive để lượt xem vẫn được gửi kể cả khi người xem rời trang ngay
    void fetch(`/api/tools/${toolId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Hỏng thì thôi: một lượt xem không đáng để làm phiền người xem
    });
  }, [toolId]);

  return null;
}
