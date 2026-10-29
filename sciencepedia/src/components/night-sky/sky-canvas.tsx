"use client";

import { useEffect, useRef } from "react";

import { zoomFov } from "@/components/night-sky/sky-format";

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
  changeAzimuth: (inc: number) => void;
  /** Lệch phương vị nội bộ của engine: nó tự cập nhật khi người đọc kéo
      khung và khi `changeAzimuth` chạy. Phương vị tâm khung = az_off + 180
      (xem ghi chú ở `currentAzimuth` trong `createSkyEngine`). */
  az_off: number;
  /** Góc nhìn hiện tại (độ). `setFOV` của engine tự kẹp vào [1, 60] và
      KHÔNG tự vẽ lại — muốn hiện ngay phải gọi `draw()` sau đó. */
  fov: number;
  setFOV: (fov: number) => void;
  draw: () => void;
};

declare global {
  interface Window {
    S?: {
      virtualsky: (options: Record<string, unknown>) => VirtualSkyInstance;
    };
  }
}

/** Toạ độ xích đạo tại con trỏ, do engine vẽ tự tính từ phép chiếu của
    nó (`callback.cursor`): RA/Dec đều là ĐỘ thập phân. `x`/`y` là vị trí
    con trỏ theo px trong hệ toạ độ của chính canvas (engine gắn vào sự
    kiện qua `getXY`) — ô đọc bám theo con trỏ nhờ hai số này; null khi
    sự kiện không mang theo. */
export type SkyCursorPos = {
  raDeg: number;
  decDeg: number;
  x: number | null;
  y: number | null;
};

/** Engine handle — thứ duy nhất phần còn lại của trang được phép giữ. */
export type SkyEngine = {
  setObserver: (lat: number, lon: number) => void;
  setTime: (date: Date) => void;
  setAzimuth: (azimuthDeg: number) => void;
  /** Phương vị tâm khung hiện tại (độ, 0 = Bắc) — đọc sống cho HUD la bàn. */
  getAzimuth: () => number;
  /** Góc nhìn hiện tại (độ) — đọc sống cho cụm nút thu phóng. */
  getFov: () => number;
  /** Thu/phóng theo hệ số: factor > 1 là phóng to (góc nhìn hẹp lại).
      Trả góc nhìn THẬT sau khi engine đã kẹp vào [1, 60]. */
  zoomBy: (factor: number) => number;
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
  options: {
    latitude: number;
    longitude: number;
    time: Date;
    lang: string;
    /** Nhận toạ độ tại con trỏ mỗi lần chuột di chuyển trên canvas;
        `null` = con trỏ đã rời canvas, hoặc điểm đó nằm ngoài vùng
        phép chiếu tính ngược được (engine không cho số thì không bịa). */
    onCursor: (pos: SkyCursorPos | null) => void;
  },
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
    callback: {
      // Engine gọi hàm này ở MỖI mousemove với sự kiện đã gắn sẵn
      // `ra`/`dec` (độ) — xem `getXYProperties` trong virtualsky.js.
      // Nó chỉ chạy trên đường chuột; cảm ứng không qua đây, nên ô đọc
      // toạ độ tự nhiên không bao giờ hiện trên thiết bị cảm ứng.
      cursor: (event: {
        ra?: unknown;
        dec?: unknown;
        x?: unknown;
        y?: unknown;
      }) => {
        const ra = event?.ra;
        const dec = event?.dec;
        const px = (value: unknown): number | null =>
          typeof value === "number" && Number.isFinite(value) ? value : null;
        options.onCursor(
          typeof ra === "number" &&
            Number.isFinite(ra) &&
            typeof dec === "number" &&
            Number.isFinite(dec)
            ? { raDeg: ra, decDeg: dec, x: px(event?.x), y: px(event?.y) }
            : null,
        );
      },
      mouseout: () => options.onCursor(null),
    },
  });

  /* Giờ đang chọn, giữ ở đây để setObserver vẽ lại bằng đúng giờ đó chứ
     không phải giờ lúc tạo instance. */
  let currentClock = options.time;
  /* Phương vị tâm khung hiện tại. Engine chỉ có `changeAzimuth(inc)` cộng
     dồn vào `az_off`, mà lúc khởi tạo nó đặt `az_off = az − 180` (az là
     phương vị tâm khung, 0 = Bắc) — nên phương vị tâm khung luôn bằng
     `az_off + 180`, và muốn tới một phương vị tuyệt đối thì cộng phần chênh
     ngắn nhất. Giá trị đầu 180 khớp tuỳ chọn `az` truyền lúc tạo instance. */
  let currentAzimuth = 180;
  let zoomAnim: number | null = null;

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
    setAzimuth(azimuthDeg) {
      const target = ((azimuthDeg % 360) + 360) % 360;
      const delta = ((target - currentAzimuth + 540) % 360) - 180;
      if (delta !== 0) instance.changeAzimuth(delta);
      currentAzimuth = target;
    },
    getAzimuth() {
      // Đọc thẳng az_off thay vì biến theo dõi của ta: người đọc kéo khung
      // thì chỉ engine biết, biến `currentAzimuth` ở trên không hề hay.
      return (((instance.az_off + 180) % 360) + 360) % 360;
    },
    getFov() {
      return instance.fov;
    },
    zoomBy(factor) {
      // setFOV kẹp [1, 60] nhưng không vẽ lại — draw() chốt khung mới.
      // Nội suy hình học trong ~300 ms: chuyển động là bằng chứng mắt
      // thấy được của thu phóng (cắt cứng từng bị nhầm là "không zoom").
      // PATCH-SCIENCEPEDIA-2 trong virtualsky.js khiến setFOV đổi thật
      // hình vẽ của phép chiếu stereo; ở đây chỉ lo phần chuyển động.
      const from = instance.fov;
      const to = zoomFov(from, factor);
      if (zoomAnim !== null) cancelAnimationFrame(zoomAnim);
      zoomAnim = null;
      const reduce =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (to === from || reduce) {
        instance.setFOV(to);
        instance.draw();
        return instance.fov;
      }
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / 300);
        const eased = 1 - Math.pow(1 - t, 3);
        instance.setFOV(from * Math.pow(to / from, eased));
        instance.draw();
        if (t < 1) {
          zoomAnim = requestAnimationFrame(step);
        } else {
          zoomAnim = null;
          instance.setFOV(to);
          instance.draw();
        }
      };
      zoomAnim = requestAnimationFrame(step);
      return to;
    },
    resize() {
      instance.resize();
    },
    destroy() {
      if (zoomAnim !== null) cancelAnimationFrame(zoomAnim);
      zoomAnim = null;
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
  onAzimuth,
  onFov,
  onCursor,
  focusRequest,
  zoomRequest,
}: {
  latitude: number;
  longitude: number;
  time: Date;
  lang: string;
  onReady?: () => void;
  /** Báo phương vị tâm khung cho HUD la bàn: gọi khi lệch ≥ 0,5° so với
      lần báo trước, thăm dò 4 lần/giây — đủ mượt cho một con số đọc tham
      khảo mà không bắt React dựng lại theo từng khung hình kéo. */
  onAzimuth?: (azimuthDeg: number) => void;
  /** Báo góc nhìn cho cụm nút thu phóng: cùng nhịp thăm dò với phương
      vị, gọi khi lệch ≥ 0,5° so với lần báo trước. */
  onFov?: (fovDeg: number) => void;
  /** Toạ độ tại con trỏ theo từng mousemove của engine — nhịp nhanh
      hơn nhịp render nhiều, nên phía nhận phải cập nhật kiểu ra lệnh
      (ghi thẳng DOM), không setState theo từng lần gọi. */
  onCursor?: (pos: SkyCursorPos | null) => void;
  /** Yêu cầu xoay tâm khung tới một phương vị (chọn thiên thể đang ở trên
      chân trời). `nonce` đổi mỗi lần yêu cầu để chọn lại cùng một thiên thể
      vẫn xoay lại được sau khi người đọc đã kéo khung đi chỗ khác. */
  focusRequest?: { azimuthDeg: number; nonce: number } | null;
  /** Yêu cầu thu/phóng theo hệ số (nút bấm và con lăn chuột trên khung
      đều gửi qua đây). `nonce` như ở `focusRequest`. */
  zoomRequest?: { factor: number; nonce: number } | null;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SkyEngine | null>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const azimuthRef = useRef(onAzimuth);
  azimuthRef.current = onAzimuth;
  const fovRef = useRef(onFov);
  fovRef.current = onFov;
  const cursorRef = useRef(onCursor);
  cursorRef.current = onCursor;
  /* Giá trị mới nhất, để instance tạo bất đồng bộ xong không áp trạng thái cũ. */
  const latestRef = useRef({ latitude, longitude, time });
  latestRef.current = { latitude, longitude, time };

  useEffect(() => {
    const element = mountRef.current;
    if (!element) return;
    let cancelled = false;
    let engine: SkyEngine | null = null;
    let azimuthPoll: number | null = null;

    void createSkyEngine(element, {
      ...latestRef.current,
      lang,
      // Callback của engine được chốt một lần lúc tạo instance; chuyển
      // tiếp qua ref để nó luôn gọi bản handler mới nhất của trang cha.
      onCursor: (pos) => cursorRef.current?.(pos),
    })
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

        // Thăm dò phương vị + góc nhìn cho HUD: kéo khung không bắn sự
        // kiện nào ra ngoài, nên chỉ còn cách đọc lại theo nhịp thưa.
        let lastAzimuth = created.getAzimuth();
        azimuthRef.current?.(lastAzimuth);
        let lastFov = created.getFov();
        fovRef.current?.(lastFov);
        azimuthPoll = window.setInterval(() => {
          const azimuth = created.getAzimuth();
          if (Math.abs(azimuth - lastAzimuth) >= 0.5) {
            lastAzimuth = azimuth;
            azimuthRef.current?.(azimuth);
          }
          const fov = created.getFov();
          if (Math.abs(fov - lastFov) >= 0.5) {
            lastFov = fov;
            fovRef.current?.(fov);
          }
        }, 250);
      })
      .catch(() => {
        // Nạp engine hỏng (mất mạng giữa chừng): khung nền vẫn ở đó, trang
        // không sập. Người đọc tải lại trang là thử lại từ đầu.
      });

    const onFullscreenChange = () => {
      // Toàn màn hình đổi kích thước khung mà không phải lúc nào cũng kèm
      // sự kiện resize của cửa sổ — gọi thẳng resize của engine cho chắc.
      // Hai nhịp: chuyển cảnh toàn màn hình có thể ổn định muộn hơn một
      // khung hình, nhịp 150 ms vớt trường hợp canvas đo khung quá sớm.
      requestAnimationFrame(() => engineRef.current?.resize());
      setTimeout(() => engineRef.current?.resize(), 150);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      cancelled = true;
      if (azimuthPoll !== null) window.clearInterval(azimuthPoll);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      engine?.destroy();
      engineRef.current = null;
    };
  }, [lang]);

  useEffect(() => {
    engineRef.current?.setObserver(latitude, longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    // Gộp theo khung hình: kéo thanh trượt thời gian hay chạy thời gian
    // đổi `time` nhanh hơn nhịp vẽ — engine chỉ cần nhận giá trị mới nhất
    // của mỗi khung hình, không cần nhận đủ mọi giá trị trung gian.
    const frame = requestAnimationFrame(() => {
      engineRef.current?.setTime(time);
    });
    return () => cancelAnimationFrame(frame);
  }, [time]);

  useEffect(() => {
    if (focusRequest) {
      engineRef.current?.setAzimuth(focusRequest.azimuthDeg);
    }
  }, [focusRequest]);

  useEffect(() => {
    if (zoomRequest) {
      engineRef.current?.zoomBy(zoomRequest.factor);
    }
  }, [zoomRequest]);

  /* Hai lớp div, cố ý: VirtualSky tự đặt `position: relative` dạng inline
     lên phần tử mang id của nó. Nếu phần tử đó chính là lớp `absolute
     inset-0`, inline style thắng class → nó thành relative, chiều cao suy
     từ nội dung (canvas), và `resize()` của engine đọc `offsetHeight` của
     container = chiều cao canvas cũ → canvas kẹt vĩnh viễn ở kích thước
     lúc khởi tạo (toàn màn hình chỉ phủ ~70% chiều cao, đổi kích thước
     cửa sổ cũng không theo — QA PR #167 bắt được). Lớp ngoài giữ nhiệm vụ
     căng đầy khung; lớp trong `h-full` là container của engine, chiều cao
     luôn bám khung dù engine có ghi đè position. */
  return (
    <div className="absolute inset-0">
      <div ref={mountRef} id={ENGINE_ID} className="h-full w-full" />
    </div>
  );
}
