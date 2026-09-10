"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ALADIN_SCRIPT_URL, DEFAULT_SURVEY } from "@/lib/sky-data";
import type { AladinFactory, AladinInstance } from "@/types/aladin";

/** Một khung nhìn: tâm ở đâu, rộng bao nhiêu, vẽ bằng survey nào. */
export type SkyView = {
  /** Độ */
  ra: number;
  /** Độ */
  dec: number;
  /** Bề rộng khung nhìn, độ */
  fovDeg: number;
  survey?: string;
};

export type AladinStatus = "idle" | "loading" | "ready" | "error";

/**
 * Nạp script Aladin từ CDN — đúng MỘT lần cho cả vòng đời trang.
 *
 * Promise giữ ở mức module chứ không trong state: trang bản đồ bầu trời và
 * khối nhúng trong bài viết có thể cùng tồn tại, và React 19 + StrictMode gọi
 * effect hai lần trong dev. Không có singleton thì mỗi lần như thế là thêm một
 * thẻ `<script>` và một lượt tải ~1 MB.
 */
let aladinPromise: Promise<AladinFactory> | null = null;

export function loadAladin(): Promise<AladinFactory> {
  if (aladinPromise) return aladinPromise;

  aladinPromise = new Promise<AladinFactory>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Aladin chỉ chạy được ở trình duyệt"));
      return;
    }

    // Script đã có sẵn (điều hướng client-side quay lại trang) thì dùng luôn
    if (window.A) {
      const factory = window.A;
      factory.init.then(() => resolve(factory)).catch(reject);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${ALADIN_SCRIPT_URL}"]`,
    );

    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      const factory = window.A;
      if (!factory) {
        reject(new Error("Script Aladin đã tải nhưng không thấy đối tượng A"));
        return;
      }
      // `A.init` mới là lúc WebAssembly sẵn sàng. Gọi `A.aladin` trước đó hỏng.
      factory.init.then(() => resolve(factory)).catch(reject);
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Không tải được Aladin Lite từ CDS")),
      { once: true },
    );

    if (!existing) {
      script.src = ALADIN_SCRIPT_URL;
      script.async = true;
      script.charset = "utf-8";
      document.head.append(script);
    }
  });

  // Hỏng mạng một lần không được khoá vĩnh viễn: xoá cache để lần bấm "thử
  // lại" tiếp theo được phép tải lại từ đầu.
  aladinPromise.catch(() => {
    aladinPromise = null;
  });

  return aladinPromise;
}

/**
 * Aladin Lite v3 vẽ bằng WebGL2. Máy không có thì không có cách nào hạ cấp —
 * phải nói thẳng với người đọc thay vì để một khung đen im lặng.
 */
export function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

type UseAladinOptions = {
  /** Chỉ tạo instance khi cờ này bật — đây là cái chốt của lazy loading */
  enabled: boolean;
  /** Khung nhìn ban đầu. Đổi sau đó thì dùng `goTo`, không dựng lại cảnh. */
  initialView: SkyView;
};

/**
 * Vòng đời một instance Aladin gắn vào `containerRef`.
 *
 * Instance được tạo MỘT lần khi `enabled` bật, không dựng lại theo prop: dựng
 * lại có nghĩa là tải lại toàn bộ ô tile của vùng trời đang xem. Đổi mục tiêu
 * đi qua `goTo`, đổi survey đi qua `setSurvey` — cả hai đều là lệnh trên
 * instance đang sống.
 */
export function useAladin({ enabled, initialView }: UseAladinOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<AladinInstance | null>(null);

  const [status, setStatus] = useState<AladinStatus>("idle");
  const [attempt, setAttempt] = useState(0);

  // Khung nhìn ban đầu đọc qua ref: nó chỉ có ý nghĩa ở lần dựng đầu tiên, và
  // đưa vào mảng phụ thuộc sẽ khiến mỗi lần cha render lại là một lần dựng lại.
  const initialViewRef = useRef(initialView);
  initialViewRef.current = initialView;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    if (!supportsWebGL2()) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadAladin()
      .then((factory) => {
        if (cancelled || !containerRef.current) return;

        const view = initialViewRef.current;
        const instance = factory.aladin(containerRef.current, {
          survey: view.survey ?? DEFAULT_SURVEY,
          fov: view.fovDeg,
          cooFrame: "ICRS",
          showReticle: true,
          showZoomControl: true,
          showFullscreenControl: true,
          showLayersControl: false,
          showGotoControl: false,
          showShareControl: false,
          showSimbadPointerControl: false,
          showProjectionControl: false,
          showSettingsControl: false,
          showContextMenu: false,
          showCooLocation: true,
          showFrame: false,
        });

        instance.gotoRaDec(view.ra, view.dec);

        instanceRef.current = instance;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;

      instanceRef.current?.destroy?.();
      instanceRef.current = null;

      // Aladin nhét canvas và thanh công cụ vào container bằng DOM thuần.
      // React tưởng div này rỗng nên không dọn giúp; không dọn tay thì lần
      // effect thứ hai của StrictMode chồng thêm một bản đồ nữa lên bản cũ.
      container.replaceChildren();
    };
  }, [enabled, attempt]);

  const goTo = useCallback((view: SkyView) => {
    const instance = instanceRef.current;
    if (!instance) return;

    instance.gotoRaDec(view.ra, view.dec);
    instance.setFoV(view.fovDeg);
    if (view.survey) setSurveyOn(instance, view.survey);
  }, []);

  const setSurvey = useCallback((surveyId: string) => {
    const instance = instanceRef.current;
    if (instance) setSurveyOn(instance, surveyId);
  }, []);

  /** Dựng lại từ đầu sau khi lỗi — dùng cho nút "thử lại". */
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { containerRef, status, goTo, setSurvey, retry } as const;
}

/**
 * CDS đổi tên method này giữa các bản v3 và chúng ta bám kênh `latest`, nên
 * gọi cái nào có. Không có cái nào thì bỏ qua: giữ nguyên survey cũ vẫn hơn
 * ném lỗi làm chết cả khung bản đồ.
 */
function setSurveyOn(instance: AladinInstance, surveyId: string): void {
  if (typeof instance.setBaseImageLayer === "function") {
    instance.setBaseImageLayer(surveyId);
    return;
  }
  instance.setImageSurvey?.(surveyId);
}
