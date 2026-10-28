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
 * Thu vào: vệt sao toả ra từ tâm (ta lao tới trước) và một tàu vũ trụ bay chéo
 * từ góc dưới-trái vào giữa, nhỏ dần rồi mất hút vào cảnh kế tiếp. Thu ra: vệt
 * sao rút về tâm và tàu từ giữa quay đầu bay ngược ra phía người xem.
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
      <div className={direction === "in" ? "warp-ship-in" : "warp-ship-out"}>
        <Starship />
      </div>
    </div>
  );
}

/** Tàu vũ trụ vẽ tay: thân bạc nhìn nghiêng, mũi hướng phải, hai động cơ ion
    phụt luồng xanh ra sau. Hướng bay (chéo lên / chéo xuống) do CSS xoay. */
function Starship() {
  return (
    // Tàu là trang trí thuần (lớp bay đã có ngữ cảnh riêng): ẩn khỏi cây
    // trợ năng (Hallmark gate 33, polish 2026-10-28).
    <svg viewBox="0 0 200 84" width="168" height="70" aria-hidden="true">
      <defs>
        <linearGradient id="warp-plume" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.25" stopColor="#7dd3fc" />
          <stop offset="0.6" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="warp-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="0.45" stopColor="#b8c2d0" />
          <stop offset="1" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="warp-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="1" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="warp-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <g className="warp-flame">
        <path d="M44 33 L2 37 L44 41 Z" fill="url(#warp-plume)" />
        <path d="M44 46 L0 51 L44 56 Z" fill="url(#warp-plume)" />
      </g>
      {/* Cánh và đuôi phía xa, tối hơn để ra chiều sâu. */}
      <path d="M84 31 L70 20 L80 20 L104 30 Z" fill="#6b7280" />
      <path d="M52 34 L38 12 L50 12 L76 32 Z" fill="url(#warp-wing)" />
      <path
        d="M46 34 L122 29 C152 29 176 38 196 47 C176 53 152 57 122 58 L50 57 Z"
        fill="url(#warp-hull)"
      />
      <path
        d="M120 31 C136 21 160 27 178 41 C160 38 140 36 120 35 Z"
        fill="url(#warp-glass)"
      />
      <path
        d="M128 29 C140 25 154 28 164 34"
        stroke="#e2e8f0"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        fill="none"
      />
      {/* Hai ống động cơ, miệng phụt sáng xanh. */}
      <rect x="40" y="31" width="34" height="12" rx="5" fill="#6b7280" />
      <rect x="40" y="44" width="34" height="14" rx="6" fill="#4b5563" />
      <ellipse cx="42" cy="37" rx="2.5" ry="5" fill="#bae6fd" />
      <ellipse cx="42" cy="51" rx="3" ry="6" fill="#bae6fd" />
      {/* Cánh phía gần, vuốt ngược. */}
      <path d="M78 53 L60 80 L78 80 L120 55 Z" fill="url(#warp-wing)" />
      <path
        d="M84 44 L150 44 M100 51 L160 50"
        stroke="#475569"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />
    </svg>
  );
}
