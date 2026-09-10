/**
 * Kiểu cho Aladin Lite v3 — thư viện bản đồ bầu trời của CDS (Strasbourg).
 *
 * ## Vì sao nạp từ CDN chứ không `npm i aladin-lite`
 *
 * Gói npm kéo theo một khối WebAssembly hơn 1 MB. Bản đồ bầu trời là MỘT route
 * trong cả site; đưa nó vào build làm nặng mọi thứ khác — cài đặt, build,
 * tracing của Vercel — trong khi phần lớn người đọc không bao giờ mở route đó.
 * Nạp từ CDN thì byte chỉ đi qua dây khi người đọc thật sự cần.
 *
 * Đánh đổi đã chấp nhận: (1) phụ thuộc một máy chủ ngoài — nếu CDS sập thì
 * khung bản đồ hiện thông báo lỗi, phần còn lại của trang vẫn nguyên vẹn vì
 * nội dung là HTML server-render; (2) không có type nào đi kèm, nên chúng ta
 * tự khai — chính là file này.
 *
 * ## Vì sao nhiều method để `?`
 *
 * URL mặc định trỏ tới kênh `latest` của CDS. Giữa các bản v3, CDS có đổi tên
 * method (`setImageSurvey` → `setBaseImageLayer`). Khai báo optional buộc chỗ
 * gọi phải kiểm tra trước khi gọi, nên bản mới đổi tên thì tính năng đó ngừng
 * hoạt động chứ không ném lỗi làm chết cả khung. Ghim phiên bản cứng được qua
 * `NEXT_PUBLIC_ALADIN_SCRIPT_URL` (xem `src/lib/sky-data.ts`).
 */

/** Hệ toạ độ của khung nhìn. Chúng ta luôn dùng J2000 (xích đạo). */
export type AladinCooFrame = "ICRS" | "ICRSd" | "j2000" | "galactic";

export type AladinOptions = {
  /** Định danh HiPS, ví dụ `P/DSS2/color` */
  survey?: string;
  /** Tên thiên thể hoặc chuỗi toạ độ mà Sesame hiểu */
  target?: string;
  /** Bề rộng khung nhìn, đơn vị độ */
  fov?: number;
  cooFrame?: AladinCooFrame;
  /**
   * Màu xoá của canvas WebGL. Mặc định của Aladin là `rgb(60, 60, 60)` — một
   * mảng xám lộ rõ trên nền tối của site, và CSS không đè được vì canvas tự
   * vẽ đè lên nền của thẻ.
   */
  backgroundColor?: string;
  showReticle?: boolean;
  showZoomControl?: boolean;
  showFullscreenControl?: boolean;
  showLayersControl?: boolean;
  showGotoControl?: boolean;
  showShareControl?: boolean;
  showSimbadPointerControl?: boolean;
  showCooGrid?: boolean;
  showCooGridControl?: boolean;
  showProjectionControl?: boolean;
  showSettingsControl?: boolean;
  showContextMenu?: boolean;
  showFrame?: boolean;
  showCooLocation?: boolean;
  showStatusBar?: boolean;
  fullScreen?: boolean;
  reticleColor?: string;
  reticleSize?: number;
  /** Ngôn ngữ của các nhãn do chính Aladin vẽ */
  realFullscreen?: boolean;
};

/** Sự kiện chúng ta lắng nghe. Aladin phát nhiều hơn, đây là phần đang dùng. */
export type AladinEvent = "positionChanged" | "zoomChanged" | "objectClicked";

export type AladinPosition = { ra: number; dec: number };

export type AladinInstance = {
  /** ra, dec tính bằng ĐỘ (không phải giờ) */
  gotoRaDec(ra: number, dec: number): void;
  /** Giải tên qua Sesame rồi bay tới. Bất đồng bộ, báo về qua callback. */
  gotoObject(
    target: string,
    callbacks?: { success?: () => void; error?: (reason?: unknown) => void },
  ): void;
  /** Bề rộng khung nhìn, đơn vị độ */
  setFoV(fov: number): void;
  /** Trả về [rộng, cao] tính bằng độ */
  getFov(): [number, number];
  /** Trả về [ra, dec] tính bằng độ, hệ hiện hành */
  getRaDec(): [number, number];
  on(event: AladinEvent, handler: (...args: never[]) => void): void;
  /** v3 cũ */
  setImageSurvey?(idOrUrl: string): void;
  /** v3 mới — cùng công dụng, khác tên */
  setBaseImageLayer?(idOrUrl: string): void;
  setProjection?(projection: string): void;
  /** Không phải bản v3 nào cũng có; chỗ gọi phải tự dọn DOM nếu thiếu. */
  destroy?(): void;
};

export type AladinFactory = {
  /** Resolve khi WebAssembly đã nạp xong. Gọi `A.aladin` trước đó là hỏng. */
  init: Promise<void>;
  aladin(container: HTMLElement, options?: AladinOptions): AladinInstance;
};

declare global {
  interface Window {
    A?: AladinFactory;
  }
}
