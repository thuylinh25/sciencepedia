import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Ảnh Open Graph sinh động: /api/og?title=…&category=…
 *
 * Dùng làm ảnh mặc định cho mọi trang chưa có ảnh bìa riêng, nhờ đó link chia sẻ
 * luôn có preview thay vì một ô trống.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = (params.get("title") ?? "Sciencepedia").slice(0, 120);
  const category = params.get("category")?.slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(150deg, #0b1020 0%, #131b3a 55%, #1d1533 100%)",
        }}
      >
        {/* Dải vàng đặc trưng */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10px",
            background: "#FACC15",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#FACC15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
            }}
          >
            ✦
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "26px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Sciencepedia
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {category && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
                fontSize: "24px",
              }}
            >
              {category}
            </div>
          )}
          <div
            style={{
              color: "#ffffff",
              fontSize: title.length > 60 ? "58px" : "72px",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "24px",
          }}
        >
          Bách khoa toàn thư khoa học
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
