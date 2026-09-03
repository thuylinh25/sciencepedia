"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        // Mặc định tối, không theo hệ điều hành: nội dung chủ đạo là ảnh thiên
        // văn và ba cảnh WebGL nền vũ trụ — nền sáng làm chúng trôi nổi trên
        // một khung trắng. `enableSystem` giữ nguyên để người đọc vẫn chọn
        // được "Theo hệ thống" trong nút đổi theme.
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
