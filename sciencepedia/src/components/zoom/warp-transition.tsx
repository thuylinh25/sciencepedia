"use client";
/* 'use client' vì vẽ bằng canvas + requestAnimationFrame. Chỉ chạy trong khoảng
   chuyển cấp của hành trình thu phóng, rồi tự gỡ. */

import { useEffect, useRef } from "react";

type Direction = "in" | "out";

/** Số vệt sao. Đủ dày để đọc ra "đang lao đi", đủ thưa để điện thoại yếu
    không rớt khung — mỗi vệt chỉ là một đoạn thẳng 2D. */
const STREAKS = 160;

/**
 * Lớp "bay xuyên không gian" phủ lên lúc chuyển cấp.
 *
 * Thu vào: vệt sao toả ra từ tâm (ta lao tới trước) và một tên lửa bay từ đáy
 * khung vào giữa, nhỏ dần rồi mất hút vào cảnh kế tiếp. Thu ra: vệt sao rút về
 * tâm và tên lửa từ giữa quay đầu bay ngược ra phía người xem.
 *
 * Vẽ bằng canvas 2D chứ không thêm một cảnh WebGL: lúc này đã có hai cảnh 3D
 * cùng sống để hoà mờ, thêm ngữ cảnh WebGL thứ ba là chỗ điện thoại dễ mất
 * ngữ cảnh nhất.
 */
export function WarpTransition({
  direction,
  durationMs,
}: {
  direction: Direction;
  durationMs: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy);

    /* Mỗi vệt là một hướng cố định và một bán kính. Đi vào: bán kính tăng theo
       cấp số nhân (gần tâm chậm, ra rìa nhanh — đúng phối cảnh khi lao tới).
       Đi ra: ngược lại. Ra khỏi vùng thì sinh lại ở đầu kia. */
    const spawn = () =>
      direction === "in"
        ? 4 + Math.random() * maxR * 0.4
        : maxR * (0.5 + Math.random() * 0.6);
    const stars = Array.from({ length: STREAKS }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: Math.random() * maxR,
      hue: Math.random() < 0.15 ? 210 : Math.random() < 0.1 ? 40 : 0,
    }));

    const start = performance.now();
    let last = start;
    let frame = 0;

    const draw = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      /* Tốc độ lên rồi xuống theo nửa sóng sin: tăng tốc, lao, hãm. */
      const speed = Math.sin(Math.PI * t);
      /* Độ đậm: hiện nhanh, tắt nhanh, để cảnh mới lộ ra ở cuối. */
      const alpha = Math.min(1, t * 6, (1 - t) * 4);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";

      for (const star of stars) {
        const growth = 1 + speed * 5.5 * dt * 2;
        const prev = star.r;
        star.r =
          direction === "in"
            ? star.r * growth + speed * 40 * dt
            : star.r / growth - speed * 40 * dt;

        if (star.r > maxR || star.r < 2) {
          star.r = spawn();
          continue;
        }

        /* Đuôi vệt dài theo tốc độ: đứng yên thì là chấm, lao nhanh thì là
           sợi sáng. */
        const tail = Math.min(
          Math.max(Math.abs(star.r - prev) * 3, 1.5),
          maxR * 0.3,
        );
        const r0 =
          direction === "in" ? Math.max(star.r - tail, 0) : star.r + tail;
        const cos = Math.cos(star.angle);
        const sin = Math.sin(star.angle);
        const near = Math.min(star.r / maxR, 1);

        ctx.strokeStyle =
          star.hue === 0
            ? `rgba(255,255,255,${alpha * (0.2 + near * 0.6)})`
            : `hsla(${star.hue},90%,75%,${alpha * (0.2 + near * 0.6)})`;
        ctx.lineWidth = 0.5 + near * 1.3;
        ctx.beginPath();
        ctx.moveTo(cx + cos * r0, cy + sin * r0);
        ctx.lineTo(cx + cos * star.r, cy + sin * star.r);
        ctx.stroke();
      }

      if (t < 1) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [direction, durationMs]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ ["--warp-ms" as string]: `${durationMs}ms` }}
    >
      {/* Quầng tối ở tâm và viền: kéo mắt vào điểm tụ của phối cảnh. */}
      <div className="warp-vignette absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div
        className={direction === "in" ? "warp-rocket-in" : "warp-rocket-out"}
      >
        <Rocket />
      </div>
    </div>
  );
}

/** Tên lửa vẽ tay, mũi hướng lên. Lửa đuôi chập chờn bằng CSS. */
function Rocket() {
  return (
    <svg viewBox="0 0 64 128" width="64" height="128">
      <defs>
        <linearGradient id="warp-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.45" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#ff4d2e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="warp-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9d2e3" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9aa6bd" />
        </linearGradient>
      </defs>
      <g className="warp-flame">
        <path d="M24 92 Q32 128 40 92 Z" fill="url(#warp-flame)" />
      </g>
      <path d="M20 70 L8 92 L22 88 Z" fill="#ef4444" />
      <path d="M44 70 L56 92 L42 88 Z" fill="#ef4444" />
      <path
        d="M32 4 C46 18 46 52 44 90 L20 90 C18 52 18 18 32 4 Z"
        fill="url(#warp-body)"
      />
      <path
        d="M32 4 C38 10 41 18 42 26 L22 26 C23 18 26 10 32 4 Z"
        fill="#ef4444"
      />
      <circle
        cx="32"
        cy="46"
        r="7"
        fill="#1e3a8a"
        stroke="#93c5fd"
        strokeWidth="2.5"
      />
      <path d="M29 72 L35 72 L34 90 L30 90 Z" fill="#ef4444" />
    </svg>
  );
}
