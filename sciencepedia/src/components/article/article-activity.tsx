"use client";

// Client vì lịch sử xem đo thời gian ở trình duyệt; trang bài là ISR nên server
// không biết ai đang đọc. Không render gì.

import { useContentActivity } from "@/hooks/use-content-activity";

/** Một lượt xem = ở lại trang ít nhất 5 giây khi tab đang hiện. */
const MIN_READ_SECONDS = 5;

export function ArticleActivity({ articleId }: { articleId: string }) {
  useContentActivity({ type: "article", id: articleId, minSeconds: MIN_READ_SECONDS });
  return null;
}
