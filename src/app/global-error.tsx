"use client";

/**
 * Lưới an toàn cuối cùng: lỗi ném ra từ root layout không được `[locale]/error.tsx`
 * bắt, vì lúc đó layout chứa nó cũng đã hỏng. Không có file này thì người đọc
 * gặp trang trắng của Next thay vì một trang có thể thoát ra được.
 *
 * Phải tự render <html> và <body> vì nó thay thế toàn bộ root layout — cũng vì
 * vậy mà không dùng được next-intl ở đây: chuỗi phải viết cứng song ngữ.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#fbfbfa",
          color: "#1a1a1a",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Đã xảy ra lỗi
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#555" }}>
            Trang không tải được. Vui lòng thử lại.
            <br />
            <span lang="en">Something went wrong. Please try again.</span>
          </p>

          {/* digest là thứ duy nhất nối được lỗi người dùng gặp với log máy chủ */}
          {error.digest ? (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#888",
              }}
            >
              {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.9375rem",
              borderRadius: "0.5rem",
              border: "1px solid #1a1a1a",
              background: "#1a1a1a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Thử lại / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
