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
  /**
   * Khung nhìn này là BỀ MẶT MỘT THIÊN THỂ, không phải thiên cầu.
   *
   * Aladin đọc khoá `hips_body` trong file properties của HiPS rồi tự chuyển
   * sang hệ toạ độ gắn vào chính thiên thể đó. Ép `cooFrame: "ICRS"` lúc khởi
   * tạo sẽ chặn mất bước chuyển ấy và khung nhìn rơi về thiên cầu, nên cờ này
   * tồn tại để chỗ khởi tạo biết mà đừng ép.
   *
   * Khi bật, `ra`/`dec` được hiểu là kinh độ / vĩ độ trên thiên thể.
   */
  planetary?: boolean;
};

export type AladinStatus = "idle" | "loading" | "ready" | "error";

/** Nền của khung bản đồ. Trùng `bg-[#04060e]` trong `aladin-viewer.tsx` và
 *  `.aladin-fullscreen` trong `globals.css` — ba chỗ phải cùng một màu. */
const ALADIN_BACKGROUND = "rgb(4, 6, 14)";

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

    /*
     * Dọn thẻ của lượt hỏng trước rồi mới dựng thẻ mới.
     *
     * Bản cũ tìm lại thẻ `<script>` đang có và GẮN THÊM listener vào đó.
     * Với một thẻ đã tải xong hoặc đã lỗi thì `load`/`error` sẽ không bao
     * giờ nổ lần nữa, nên promise của lượt "thử lại" treo vĩnh viễn và khung
     * bản đồ đứng ở "Đang tải bản đồ bầu trời…" — không lỗi, không xong, và
     * không còn nút nào bấm được.
     *
     * Trùng lặp trong cùng một lượt sống của trang đã do `aladinPromise` ở
     * mức module chặn rồi, nên cái cần ở đây chỉ là không để lại rác.
     */
    document.querySelector("script[data-aladin]")?.remove();

    const script = document.createElement("script");

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
      () => reject(new Error("Không tải được Aladin Lite")),
      { once: true },
    );

    /*
     * Nạp qua một module trung gian, KHÔNG trỏ `src` thẳng vào gói.
     *
     * Gói `aladin-lite` trên npm là ES module thuần: nó kết thúc bằng
     * `export{P as default}` và KHÔNG gán `window.A` bao giờ. Trỏ thẳng
     * `<script src>` vào nó thì trình duyệt báo lỗi cú pháp ở `export`,
     * sự kiện `load` vẫn nổ, rồi `window.A` vẫn rỗng — đúng nhánh
     * "đã tải nhưng không thấy đối tượng A" ở trên, và người xem nhận
     * thông báo "máy chủ CDS đang bận" cho một lỗi chẳng liên quan gì tới
     * CDS. Đây là lỗi đã bị báo sau lượt đổi CDN ngày 2026-09-11.
     *
     * Bản UMD mà CDS tự phát thì có gán `window.A`, nhưng máy chủ CDS đo
     * được 57 giây cho 1,8 MB — xem `ALADIN_SCRIPT_URL` trong
     * `lib/sky-data.ts`. Nên đường đúng là giữ CDN nhanh và sửa cách nạp.
     *
     * Module trung gian này chịu được CẢ HAI dạng, nên biến môi trường
     * `NEXT_PUBLIC_ALADIN_SCRIPT_URL` trỏ đi đâu cũng chạy:
     *
     *   · gói ESM  → không gán gì, factory nằm ở `default`
     *   · gói UMD  → vỏ UMD tự gán `globalThis.A`, namespace rỗng
     *
     * `?? window.A` ở cuối là nhánh UMD.
     *
     * Dùng blob chứ không dùng script nội tuyến: blob có `src` nên nó là
     * script NGOÀI, và sự kiện `load`/`error` chạy đúng như mọi script
     * khác. Đường dẫn nhập là URL tuyệt đối nên gốc blob không ảnh hưởng
     * tới việc phân giải, và gói đã nhúng sẵn WebAssembly nên nó không đi
     * xin thêm tệp tương đối nào.
     */
    const loader = `import * as m from ${JSON.stringify(ALADIN_SCRIPT_URL)};
window.A = m.default ?? window.A;`;

    const blobUrl = URL.createObjectURL(
      new Blob([loader], { type: "text/javascript" }),
    );

    script.type = "module";
    script.dataset.aladin = "";
    script.src = blobUrl;
    script.async = true;

    // Giải phóng ngay sau khi trình duyệt đã đọc xong, dù thành hay bại.
    const release = () => URL.revokeObjectURL(blobUrl);
    script.addEventListener("load", release, { once: true });
    script.addEventListener("error", release, { once: true });

    document.head.append(script);
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

/**
 * Bề rộng khung nhìn cần đặt cho Aladin, tính theo tỉ lệ khung hiện tại.
 *
 * Aladin nhận `fov` là bề RỘNG. Với bản đồ bầu trời điều đó vô hại, nhưng quả
 * cầu hành tinh là một đĩa tròn: khung càng bẹt thì chiều cao càng ít độ, và
 * đĩa bị cắt mất hai cực. Thẻ trong lưới là hình vuông nên nhìn đúng, rồi bấm
 * nút toàn màn hình là khung thành 2:1 và Mặt Trời cụt trên cụt dưới.
 *
 * Nên ở chế độ thiên thể, `fovDeg` được hiểu là bề CAO và bề rộng suy ra từ tỉ
 * lệ khung. Quả cầu giữ nguyên kích thước biểu kiến, vuông hay bẹt cũng vậy.
 */
function fovForFrame(element: HTMLElement, view: SkyView): number {
  if (!view.planetary) return view.fovDeg;

  const { width, height } = element.getBoundingClientRect();
  if (!width || !height) return view.fovDeg;

  // Aladin chặn cứng ở 180° trong phép chiếu cầu, nên khung càng bẹt thì càng
  // không cứu được bằng fov — đó là lý do khung toàn màn hình của bề mặt thiên
  // thể bị CSS ép về vuông (`.aladin-body-view` trong `globals.css`).
  return Math.min(180, view.fovDeg * Math.max(1, width / height));
}

type UseAladinOptions = {
  /** Chỉ tạo instance khi cờ này bật — đây là cái chốt của lazy loading */
  enabled: boolean;
  /** Khung nhìn ban đầu. Đổi sau đó thì dùng `goTo`, không dựng lại cảnh. */
  initialView: SkyView;
  /**
   * Mở thẳng ở chế độ toàn màn hình.
   *
   * Dùng được vì "toàn màn hình" của Aladin không phải Fullscreen API của
   * trình duyệt — nó chỉ gắn lớp `aladin-fullscreen` để đặt khung thành
   * `position: fixed`. Không có cử chỉ người dùng nào bị đòi hỏi, nên bật
   * ngay lúc khởi tạo là hợp lệ. Xem quy tắc CSS cùng tên trong globals.css.
   */
  fullscreen?: boolean;
};

/**
 * Vòng đời một instance Aladin gắn vào `containerRef`.
 *
 * Instance được tạo MỘT lần khi `enabled` bật, không dựng lại theo prop: dựng
 * lại có nghĩa là tải lại toàn bộ ô tile của vùng trời đang xem. Đổi mục tiêu
 * đi qua `goTo`, đổi survey đi qua `setSurvey` — cả hai đều là lệnh trên
 * instance đang sống.
 */
export function useAladin({
  enabled,
  initialView,
  fullscreen = false,
}: UseAladinOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<AladinInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const classObserverRef = useRef<MutationObserver | null>(null);

  const [status, setStatus] = useState<AladinStatus>("idle");
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const fullscreenRef = useRef(fullscreen);
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

        const instance = factory.aladin(container, {
          survey: view.survey ?? DEFAULT_SURVEY,
          fov: fovForFrame(container, view),
          fullScreen: fullscreenRef.current,
          // Xem chú thích `planetary` ở SkyView: bề mặt thiên thể phải để
          // Aladin tự chọn hệ toạ độ theo `hips_body`.
          ...(view.planetary ? {} : { cooFrame: "ICRS" as const }),
          // Cùng màu với `bg-[#04060e]` của khung ngoài và với lớp phủ toàn
          // màn hình. Không đặt thì canvas xoá bằng xám mặc định của Aladin và
          // khung nổi lên thành một ô sáng giữa giao diện tối.
          backgroundColor: ALADIN_BACKGROUND,
          // Vòng ngắm chỉ có nghĩa khi đang nhắm vào một điểm trên trời. Đặt
          // lên giữa quả cầu hành tinh thì nó chỉ là vệt bẩn giữa màn hình.
          showReticle: !view.planetary,
          showZoomControl: true,
          /*
           * Tắt nút toàn màn hình của Aladin.
           *
           * Thư viện ảnh đã mở thẳng ở chế độ toàn màn hình ngay khi bấm vào
           * bìa, nên cái nút này chỉ còn một việc: thoát ra khung nhỏ trong
           * thẻ — trạng thái không ai muốn tới, vì đã bấm để xem to thì không
           * bấm tiếp để xem nhỏ. Đường quay lại là breadcrumb.
           *
           * Nó cũng là nút duy nhất trong khung do Aladin tự vẽ, nên nó không
           * theo kiểu dáng của các nút còn lại và luôn lệch một nhịp.
           */
          showFullscreenControl: false,
          showLayersControl: false,
          showGotoControl: false,
          showShareControl: false,
          showSimbadPointerControl: false,
          showProjectionControl: false,
          showSettingsControl: false,
          showContextMenu: false,
          // Trên bề mặt hành tinh, ô này vẫn in RA/Dec của thiên cầu — một
          // con số không liên quan gì tới chỗ con trỏ đang chỉ trên quả cầu.
          // Thà không hiện còn hơn hiện sai.
          showCooLocation: !view.planetary,
          showFrame: false,
        });

        instance.gotoRaDec(view.ra, view.dec);

        instanceRef.current = instance;
        setStatus("ready");

        // Toàn màn hình đổi tỉ lệ khung mà không dựng lại instance, nên bề
        // rộng phải tính lại. Aladin cũng quan sát chính div này để dựng lại
        // canvas; hai observer không giẫm lên nhau vì `setFoV` chỉ đổi độ, và
        // không đổi kích thước phần tử — không có vòng lặp bố cục.
        if (view.planetary && typeof ResizeObserver !== "undefined") {
          const observer = new ResizeObserver(() => {
            const live = instanceRef.current;
            if (!live) return;

            const { width, height } = container.getBoundingClientRect();
            if (!width || !height) return;

            /* Giữ NGUYÊN mức phóng người xem đang đặt, chỉ tính lại bề rộng
               theo tỉ lệ khung mới.

               Bản cũ gọi `fovForFrame(container, view)` — tức tính lại từ
               `view.fovDeg`, giá trị BAN ĐẦU. Mọi lần khung đổi kích thước
               đều ném mức phóng người xem vừa đặt và kéo về mặc định. Với bề
               mặt thiên thể thì `fovDeg` là 180, nên phóng to bao nhiêu cũng
               bị bật ngược về "nhìn trọn quả cầu".

               Và khung đổi kích thước nhiều hơn ta tưởng: bấm nút tự quay làm
               nhãn nút đổi chữ, hàng điều khiển xuống dòng, khung co lại một
               nhịp — đủ để observer nổ. Trên điện thoại, thanh địa chỉ trượt
               đi khi cuộn cũng đổi chiều cao khung. Đó là lỗi "phóng to rồi
               thu nhỏ rồi bấm tự quay thì hỏng" đã bị báo.

               `getFov()` trả [rộng, cao] tính bằng độ. Đại lượng cần giữ là
               chiều NHỎ hơn: nó quyết định kích thước biểu kiến của quả cầu,
               còn chiều lớn hơn chỉ là phần lề thừa của khung bẹt.

               Phép này luỹ đẳng — khung không đổi tỉ lệ thì kết quả bằng đúng
               giá trị đang có, nên không có vòng lặp observer. */
            const [fovWidth, fovHeight] = live.getFov();
            const held = Math.min(fovWidth, fovHeight);
            if (!held || !Number.isFinite(held)) return;

            live.setFoV(Math.min(180, held * Math.max(1, width / height)));
          });
          observer.observe(container);
          resizeObserverRef.current = observer;
        }

        /**
         * Aladin bật/tắt toàn màn hình bằng cách gắn lớp `aladin-fullscreen`
         * lên chính div này, không phát sự kiện nào ra ngoài. Theo dõi thuộc
         * tính `class` là đường duy nhất để React biết — và React cần biết để
         * đặt nút quay lại cho đúng chỗ: trong thẻ thì tuyệt đối, ở toàn màn
         * hình thì cố định và nằm trên lớp phủ.
         */
        if (typeof MutationObserver !== "undefined") {
          const sync = () =>
            setIsFullscreen(container.classList.contains("aladin-fullscreen"));

          const classObserver = new MutationObserver(sync);
          classObserver.observe(container, {
            attributes: true,
            attributeFilter: ["class"],
          });
          classObserverRef.current = classObserver;
          sync();
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      classObserverRef.current?.disconnect();
      classObserverRef.current = null;
      setIsFullscreen(false);

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
    if (containerRef.current) {
      instance.setFoV(fovForFrame(containerRef.current, view));
    }
    if (view.survey) setSurveyOn(instance, view.survey);
  }, []);

  /**
   * Đổi tâm khung nhìn mà KHÔNG chạm vào mức phóng.
   *
   * `goTo` gọi cả `setFoV`, hợp khi nhảy tới một mục tiêu mới nhưng sai khi
   * dùng cho chuyển động liên tục: mỗi khung nó sẽ kéo mức phóng về giá trị
   * tính từ khung nhìn ban đầu, tức là giật lại mọi thao tác phóng to của
   * người xem, mỗi vài chục mili giây một lần.
   */
  const panTo = useCallback((ra: number, dec: number) => {
    instanceRef.current?.gotoRaDec(ra, dec);
  }, []);

  /** Tâm khung nhìn hiện tại, để chuyển động tiếp tục từ đúng chỗ đang đứng. */
  const centre = useCallback((): [number, number] | null => {
    return instanceRef.current?.getRaDec() ?? null;
  }, []);

  const setSurvey = useCallback((surveyId: string) => {
    const instance = instanceRef.current;
    if (instance) setSurveyOn(instance, surveyId);
  }, []);

  /** Dựng lại từ đầu sau khi lỗi — dùng cho nút "thử lại". */
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    containerRef,
    status,
    isFullscreen,
    goTo,
    panTo,
    centre,
    setSurvey,
    retry,
  } as const;
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
