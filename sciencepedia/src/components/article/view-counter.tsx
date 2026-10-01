"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Eye } from "lucide-react";

import { formatNumber } from "@/lib/utils";

/**
 * Đếm một lượt đọc và hiển thị số lượt đọc của bài.
 *
 * ## Vì sao đếm ở trình duyệt
 *
 * Trang bài được phục vụ từ cache ISR, server component không chạy lại ở phần
 * lớn lượt truy cập — đếm ở đó thì bỏ sót gần hết.
 *
 * ## Vì sao HIỂN THỊ cũng ở trình duyệt
 *
 * Con số từng được in thẳng vào HTML ISR. Lượt đọc đổi liên tục, nên mỗi lần
 * trang tái dựng (5 phút một lần khi có người đọc) lại ra byte khác — Vercel
 * tính ISR Write cho mọi lần như thế, dù bài không ai sửa. Ở đây con số lấy từ
 * chính phản hồi của lượt đếm (`UPDATE … RETURNING`), nên không thêm request
 * hay truy vấn nào so với trước. Xem docs/architecture.md, "ISR phải tất định".
 *
 * Chốt trong `sessionStorage`, giữ luôn con số: cùng một người tải lại trang
 * chỉ tính một lượt và thấy lại số cũ mà không gọi máy chủ. Trình duyệt chặn
 * sessionStorage thì vẫn gửi — thà đếm dư còn hơn không đếm. Lượt đếm bị từ
 * chối (rate limit, lỗi CSDL) thì không có số, và không hiện gì.
 */
export function ViewCounter({ articleId }: { articleId: string }) {
  const locale = useLocale();
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const key = `views:${articleId}`;

    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored !== null) {
        // "" = lượt đếm đang bay (StrictMode chạy effect hai lần ở dev)
        if (stored) setViews(Number(stored));
        return;
      }
      window.sessionStorage.setItem(key, "");
    } catch {
      // không dùng được sessionStorage thì bỏ qua chốt, vẫn đếm
    }

    // keepalive để lượt đọc vẫn được gửi kể cả khi người đọc rời trang ngay
    void fetch(`/api/articles/${articleId}/view`, {
      method: "POST",
      keepalive: true,
    })
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((body: { views?: unknown } | null) => {
        if (typeof body?.views !== "number") return;
        setViews(body.views);
        try {
          window.sessionStorage.setItem(key, String(body.views));
        } catch {
          // như trên
        }
      })
      .catch(() => {
        // Hỏng thì thôi: một lượt đọc không đáng để làm phiền người đọc
      });
  }, [articleId]);

  if (views === null) return null;

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="size-4" />
      {formatNumber(views, locale)}
    </span>
  );
}
