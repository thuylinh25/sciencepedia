"use client";

import { useEffect, useRef } from "react";

/**
 * Khung bầu trời — đảo client bọc engine VirtualSky tự host ở
 * `public/night-sky/` (xem `NOTICE.md` trong thư mục đó về nguồn và giấy
 * phép).
 *
 * ## Vì sao bọc sau một interface hẹp
 *
 * Đây là quyết định kiến trúc chính của trang (xem tài liệu phân tích):
 * phần còn lại của trang chỉ biết `setObserver` / `setTime` / `resize` /
 * `destroy`, không biết engine là VirtualSky. Phase 3 thay engine bằng
 * renderer tự viết thì chỉ tệp này thay đổi. Đừng để bất kỳ component nào
 * khác chạm vào biến toàn cục `S` hay instance VirtualSky.
 *
 * ## Cách engine tự tìm dữ liệu
 *
 * VirtualSky suy thư mục dữ liệu từ `src` của chính thẻ script
 * `virtualsky.js` rồi nạp `stars.json`, `lines_latin.json`, … theo đường
 * dẫn tương đối. Nạp script từ `/night-sky/` là mọi tệp dữ liệu đi theo
 * đúng origin của Sciencepedia — không một request nào ra ngoài.
 *
 * ## Hai cái bẫy của engine khi nhúng vào trang có form
 *
 * - Phím tắt của nó bắt ở cấp `document` (gõ "c" trong ô nhập cũng bật/tắt
 *   chòm sao), nên instance được tạo với `keyboard: false`. Kéo chuột và
 *   cảm ứng vẫn nguyên.
 * - `createSky` gán thẳng `window.onresize`; lúc huỷ instance phải nhả nó
 *   ra, kẻo trang khác giữ một handler trỏ vào canvas đã tháo.
 */

type VirtualSkyInstance = {
  setLatitude: (lat: number) => void;
  setLongitude: (lon: number) => void;
  setClock: (date: Date) => void;
  resize: () => void;
};

declare global {
  interface Window {
    S?: {
      virtualsky: (options: Record<string, unknown>) => VirtualSkyInstance;
    };
  }
}

/** Engine handle — thứ duy nhất phần còn lại của trang được phép giữ. */
export type SkyEngine = {
  setObserver: (lat: number, lon: number) => void;
  setTime: (date: Date) => void;
  resize: () => void;
  destroy: () => void;
};

const ENGINE_ID = "night-sky-starmap";
const ENGINE_SCRIPTS = [
  "/night-sky/stuquery.min.js",
  "/night-sky/virtualsky.js",
] as const;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Không nạp được ${src}`));
    document.head.appendChild(script);
  });
}

/* Nạp một lần cho cả trang: chuyển trang đi rồi quay lại không nạp lại. */
let engineLoad: Promise<void> | null = null;
function ensureEngineScripts(): Promise<void> {
  if (window.S?.virtualsky) return Promise.resolve();
  engineLoad ??= (async () => {
    for (const src of ENGINE_SCRIPTS) await loadScript(src);
  })();
  return engineLoad;
}

async function createSkyEngine(
  element: HTMLElement,
  options: { latitude: number; longitude: number; time: Date; lang: string },
): Promise<SkyEngine> {
  await ensureEngineScripts();
  const S = window.S;
  if (!S?.virtualsky) throw new Error("VirtualSky không khởi tạo được");

  const instance = S.virtualsky({
    id: ENGINE_ID,
    latitude: options.latitude,
    longitude: options.longitude,
    clock: options.time,
    projection: "stereo",
    az: 180,
    showplanets: true,
    showplanetlabels: true,
    constellations: true,
    constellationlabels: true,
    cardinalpoints: true,
    live: false,
    transparent: true,
    keyboard: false,
    lang: options.lang,
    credit: true,
  });

  /* Giờ đang chọn, giữ ở đây để setObserver vẽ lại bằng đúng giờ đó chứ
     không phải giờ lúc tạo instance. */
  let currentClock = options.time;

  return {
    setObserver(lat, lon) {
      instance.setLatitude(lat);
      instance.setLongitude(lon);
      // setLatitude/setLongitude của engine không tự vẽ lại; setClock vẽ.
      instance.setClock(currentClock);
    },
    setTime(date) {
      currentClock = date;
      instance.setClock(date);
    },
    resize() {
      instance.resize();
    },
    destroy() {
      // Mọi lớp phủ của engine (canvas, hộp thông tin, trợ giúp, ghi công)
      // đều nằm trong container — làm rỗng là tháo sạch.
      element.innerHTML = "";
      // createSky đã ghi đè window.onresize bằng handler của instance này.
      window.onresize = null;
    },
  };
}

export function SkyCanvas({
  latitude,
  longitude,
  time,
  lang,
  onReady,
}: {
  latitude: number;
  longitude: number;
  time: Date;
  lang: string;
  onReady?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SkyEngine | null>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  /* Giá trị mới nhất, để instance tạo bất đồng bộ xong không áp trạng thái cũ. */
  const latestRef = useRef({ latitude, longitude, time });
  latestRef.current = { latitude, longitude, time };

  useEffect(() => {
    const element = mountRef.current;
    if (!element) return;
    let cancelled = false;
    let engine: SkyEngine | null = null;

    void createSkyEngine(element, { ...latestRef.current, lang })
      .then((created) => {
        if (cancelled) {
          created.destroy();
          return;
        }
        engine = created;
        engineRef.current = created;
        const latest = latestRef.current;
        created.setObserver(latest.latitude, latest.longitude);
        created.setTime(latest.time);
        readyRef.current?.();
      })
      .catch(() => {
        // Nạp engine hỏng (mất mạng giữa chừng): khung nền vẫn ở đó, trang
        // không sập. Người đọc tải lại trang là thử lại từ đầu.
      });

    const onFullscreenChange = () => {
      // Toàn màn hình đổi kích thước khung mà không phải lúc nào cũng kèm
      // sự kiện resize của cửa sổ — gọi thẳng resize của engine cho chắc.
      requestAnimationFrame(() => engineRef.current?.resize());
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      cancelled = true;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      engine?.destroy();
      engineRef.current = null;
    };
  }, [lang]);

  useEffect(() => {
    engineRef.current?.setObserver(latitude, longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    engineRef.current?.setTime(time);
  }, [time]);

  return <div ref={mountRef} id={ENGINE_ID} className="absolute inset-0" />;
}
