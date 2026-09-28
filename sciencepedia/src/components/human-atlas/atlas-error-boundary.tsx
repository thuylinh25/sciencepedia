"use client";

// Client: error boundary của React chỉ viết được bằng class component, và
// nó phải nằm cùng phía với cây nó bảo vệ (trình xem WebGL chạy ở client).

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Cô lập trình xem 3D: WebGL, shader hay dữ liệu hỏng thì chỉ khung atlas
 * hiện thông báo, header, footer và phần chữ của trang vẫn sống.
 *
 * `error.tsx` của route cũng bắt được lỗi này, nhưng nó thay CẢ trang — mất
 * luôn phần giới thiệu và ghi công nằm dưới khung, là phần không hề hỏng.
 */
export class AtlasErrorBoundary extends Component<
  { fallback: (retry: () => void) => ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[human-atlas] trình xem gặp sự cố:", error, info.componentStack);
  }

  private retry = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}
