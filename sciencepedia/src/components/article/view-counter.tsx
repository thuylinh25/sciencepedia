"use client";

import { useEffect } from "react";

/**
 * Báo cho máy chủ rằng bài này vừa được đọc.
 *
 * Không render gì. Đặt trong trang bài viết để đếm được cả những lượt truy cập
 * mà server component không chạy lại — tức phần lớn lượt truy cập, vì trang
 * được phục vụ từ cache ISR.
 *
 * Chốt trong `sessionStorage` để cùng một người tải lại trang nhiều lần chỉ
 * tính một lượt cho tới khi họ đóng tab. Nếu trình duyệt chặn sessionStorage
 * (chế độ riêng tư ở một số trình duyệt) thì vẫn gửi, chỉ là mất phần chống
 * đếm trùng — thà đếm dư còn hơn không đếm.
 */
export function ViewCounter({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `viewed:${articleId}`;

    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // không dùng được sessionStorage thì bỏ qua chốt, vẫn đếm
    }

    // keepalive để lượt đọc vẫn được gửi kể cả khi người đọc rời trang ngay
    void fetch(`/api/articles/${articleId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Hỏng thì thôi: một lượt đọc không đáng để làm phiền người đọc
    });
  }, [articleId]);

  return null;
}
