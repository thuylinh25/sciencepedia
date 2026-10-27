"use client";

// Bộ đếm khung hình phục vụ ĐO HIỆU NĂNG trên thiết bị thật (mục còn treo ở
// HANDOFF: FPS trên Android tầm trung chưa từng đo được vì không có thiết bị
// ở phía agent). Chỉ hiện khi URL có ?fps=1 — người dùng thường không bao
// giờ thấy, và vòng rAF chỉ chạy khi được bật nên không tốn gì lúc tắt.
//
// Cách đo: mở /[locale]/human-atlas?fps=1 trên điện thoại, đợi mô hình tải
// xong, xoay mô hình đều tay ~10 giây rồi đọc "TB" (FPS trung bình từ lúc
// bật). Số "FPS" là nhịp khung của trình duyệt trong 1 giây gần nhất — khi
// đang xoay liên tục, nhịp đó chính là nhịp vẽ của cảnh WebGL. Dòng thứ hai
// ghi GPU (qua WEBGL_debug_renderer_info nếu trình duyệt cho đọc), tỉ lệ
// điểm ảnh và kích thước vùng xem — ngữ cảnh bắt buộc phải ghi kèm kết quả đo.

import { useEffect, useState } from "react";

type Reading = {
  fps: number;
  avgFps: number;
  ms: number;
};

function readGpu(): string | null {
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  try {
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    const name = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return typeof name === "string" && name ? name : null;
  } catch {
    return null;
  }
}

export function FpsMeter() {
  const [enabled, setEnabled] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [gpu, setGpu] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("fps");
    if (value !== null && value !== "0") setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let windowFrames = 0;
    const start = windowStart;
    const tick = (now: number) => {
      frames += 1;
      windowFrames += 1;
      if (now - windowStart >= 1000) {
        const windowSec = (now - windowStart) / 1000;
        const totalSec = (now - start) / 1000;
        const fps = windowFrames / windowSec;
        setReading({
          fps,
          avgFps: totalSec > 0 ? frames / totalSec : fps,
          ms: windowFrames > 0 ? (windowSec * 1000) / windowFrames : 0,
        });
        windowStart = now;
        windowFrames = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Canvas của cảnh dựng hơi muộn (nạp động) — thử đọc GPU vài nhịp đầu.
    let tries = 0;
    const gpuTimer = window.setInterval(() => {
      tries += 1;
      const name = readGpu();
      if (name || tries >= 10) {
        if (name) setGpu(name);
        window.clearInterval(gpuTimer);
      }
    }, 500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(gpuTimer);
    };
  }, [enabled]);

  if (!enabled) return null;

  const context = [
    gpu,
    `DPR ${window.devicePixelRatio || 1}`,
    `${window.innerWidth}×${window.innerHeight}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-3 bottom-3 z-50 rounded-md bg-black/70 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-white tabular-nums backdrop-blur-sm"
    >
      {reading ? (
        <div>
          FPS {reading.fps.toFixed(0)} · TB {reading.avgFps.toFixed(0)} ·{" "}
          {reading.ms.toFixed(1)} ms
        </div>
      ) : (
        <div>FPS …</div>
      )}
      <div className="max-w-56 truncate text-white/60">{context}</div>
    </div>
  );
}
