import type { ReactNode } from "react";

/**
 * Root layout bắt buộc của Next.js.
 * Thẻ <html>/<body> thật nằm ở src/app/[locale]/layout.tsx vì cần biết locale;
 * layout này chỉ cho các trang ngoài phạm vi locale (ví dụ not-found toàn cục).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
