"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Info,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";

import { useAladin, type SkyView } from "@/hooks/use-aladin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Lớp duy nhất trong dự án chạm vào `window.A`.
 *
 * KHÔNG import file này bằng `import` tĩnh ở bất cứ đâu ngoài lệnh
 * `dynamic()` trong `aladin-viewer.tsx`. Import tĩnh sẽ kéo module này vào
 * chunk của route và phá đúng thứ nó sinh ra để bảo vệ: người đọc không mở
 * bản đồ thì không tải một byte nào của nó.
 */
export function AladinCanvas({
  view,
  label,
  onClose,
  fullscreenInfo,
  crumbRoot,
  crumbCurrent,
  openFullscreen,
  canSpin,
}: {
  view: SkyView;
  /** Nhãn cho trình đọc màn hình — canvas WebGL tự nó không mô tả được gì */
  label: string;
  /**
   * Đóng bản đồ và trả khung về tấm bìa. Chỉ truyền khi bản đồ được mở bằng
   * một cú bấm — người đã tự mở thì phải tự đóng được.
   */
  onClose?: () => void;
  /**
   * Thông tin về thiên thể, chỉ hiện khi ở TOÀN MÀN HÌNH.
   *
   * Trong thẻ thì đã có sẵn tên, số đo và mô tả ngay dưới khung, nên vẽ lại
   * là thừa. Toàn màn hình thì khung `position: fixed` phủ kín cửa sổ và
   * nuốt hết phần chữ đó — người xem còn lại một quả cầu không tên.
   */
  fullscreenInfo?: ReactNode;
  /**
   * Breadcrumb thay cho một mũi tên trơ trọi.
   *
   * Mũi tên nói được "lùi lại" nhưng không nói lùi về đâu, và ở toàn màn hình
   * thì không còn gì trên màn hình để đoán. Breadcrumb nói cả hai: đang đứng ở
   * đâu, và bấm thì về đâu. Nó cũng là khung chịu được việc sau này có thêm
   * cấp — thiên thể rồi tới đặc điểm bề mặt — mà không phải nghĩ lại từ đầu.
   */
  crumbRoot?: string;
  crumbCurrent?: string;
  /** Mở thẳng ở chế độ toàn màn hình — xem `useAladin` */
  openFullscreen?: boolean;
  /**
   * Cho bật tự quay. Chỉ bật ở bề mặt thiên thể: xoay một bản đồ bầu trời
   * theo kinh độ không có nghĩa vật lý nào, nó chỉ trôi ngang qua các chòm
   * sao.
   */
  canSpin?: boolean;
}) {
  const t = useTranslations("sky");
  const { containerRef, status, isFullscreen, goTo, panTo, centre, retry } =
    useAladin({
      enabled: true,
      initialView: view,
      fullscreen: openFullscreen,
    });

  /**
   * Bảng thông tin mở sẵn hay không.
   *
   * Trên màn hình rộng thì mở: bảng nằm ở lề trái, còn quả cầu nằm giữa, hai
   * thứ không tranh chỗ nhau.
   *
   * Trên điện thoại thì đóng. Ở đó khung bề mặt thiên thể bị CSS ép về hình
   * vuông rộng bằng cả màn hình (xem `.aladin-body-view`), nên bất cứ thứ gì
   * rộng hơn một nút đều nằm đè lên chính quả cầu. Mở sẵn nghĩa là người mở
   * bản đồ ra thì thấy một bảng chữ, không thấy bản đồ.
   *
   * Đọc bề rộng một lần lúc mount thay vì dùng media query trong CSS, vì đây
   * là trạng thái BAN ĐẦU chứ không phải cách hiển thị: người dùng điện thoại
   * mở bảng ra rồi xoay ngang máy thì bảng phải vẫn mở.
   */
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    setInfoOpen(window.matchMedia("(min-width: 640px)").matches);
  }, []);

  const [spinning, setSpinning] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  /**
   * Tự quay bằng cách dịch tâm khung nhìn theo kinh độ.
   *
   * Aladin không có API quay, nhưng ở chế độ bề mặt thiên thể thì dịch tâm
   * theo kinh độ CHÍNH LÀ quay quả cầu — kinh độ là toạ độ quanh trục.
   *
   * Đọc tâm hiện tại mỗi bước thay vì giữ một biến đếm riêng: người xem kéo
   * chuột giữa lúc đang quay thì chuyển động phải tiếp tục từ chỗ họ vừa kéo
   * tới, không giật về quỹ tích của biến đếm.
   *
   * 0,18 độ mỗi 60 ms là 3 độ mỗi giây, một vòng hai phút.
   *
   * Bản đầu đặt 0,55 (9 độ mỗi giây, một vòng 40 giây) và nó quá nhanh để
   * làm việc mà chuyển động này sinh ra: nhìn kỹ một vùng bề mặt khi nó đi
   * qua. Ở 40 giây một vòng thì mỗi vùng chỉ ở giữa khung vài giây, và người
   * xem phải đuổi theo thay vì quan sát. Hai phút thì đủ chậm để dừng lại
   * bằng mắt mà vẫn thấy rõ là đang quay.
   */
  useEffect(() => {
    if (!spinning || status !== "ready") return;

    const timer = window.setInterval(() => {
      const position = centre();
      if (!position) return;
      panTo((position[0] + 0.18) % 360, position[1]);
    }, 60);

    return () => window.clearInterval(timer);
  }, [spinning, status, centre, panTo]);

  /**
   * Gợi ý "kéo để xoay", tự tắt.
   *
   * Hiện 4,5 giây rồi biến mất, và biến mất ngay khi người xem chạm vào khung
   * — lúc đó họ đã biết nó kéo được, nên câu nhắc trở thành thứ che mất chính
   * cái vừa được khám phá.
   */
  useEffect(() => {
    if (status !== "ready") return;
    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  const dismissHint = useCallback(() => setHintVisible(false), []);

  // So sánh theo giá trị: cha render lại với cùng toạ độ là chuyện thường, mà
  // mỗi lần `goTo` thừa là một lượt yêu cầu ô tile mới.
  const appliedRef = useRef<string>(viewKey(view));

  useEffect(() => {
    if (status !== "ready") return;

    const key = viewKey(view);
    if (key === appliedRef.current) return;

    appliedRef.current = key;
    goTo(view);
  }, [status, view, goTo]);

  return (
    <div className="absolute inset-0">
      {/* Aladin tự chèn canvas vào đây. React luôn coi div này là rỗng —
          xem phần dọn dẹp trong `useAladin`. */}
      <div
        ref={containerRef}
        role="application"
        aria-label={label}
        onPointerDown={dismissHint}
        onWheel={dismissHint}
        className="size-full"
      />

      {/*
        Ở toàn màn hình, khung Aladin là một lớp `position: fixed` đè lên cả
        trang (xem `.aladin-fullscreen` trong `globals.css`), nên nút này phải
        cố định và nằm cao hơn lớp đó. Trong thẻ thì nó chỉ là một nút góc.
      */}
      {/*
        Trong thẻ thì chỉ một nút lùi; breadcrumb để dành cho toàn màn hình.

        Ở trong thẻ, cả lưới thiên thể vẫn nằm ngay xung quanh, nên một đường
        dẫn nhắc "bạn đang ở Hệ Mặt Trời, mục Sao Kim" là nói lại thứ người
        xem đang nhìn thấy — và nó chiếm mất một góc của khung ảnh vốn đã nhỏ.
        Toàn màn hình thì ngược lại: khung phủ kín cửa sổ, không còn gì khác
        trên màn hình để định vị, nên lúc đó đường dẫn mới có việc để làm.
      */}
      {onClose && status !== "error" && !isFullscreen && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("backToList")}
          title={t("backToList")}
          className="absolute top-2 left-2 z-10 inline-flex items-center justify-center rounded-full bg-black/65 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/85"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
      )}

      {onClose && status !== "error" && isFullscreen && (
        <nav
          aria-label={crumbRoot ? `${crumbRoot} / ${crumbCurrent ?? ""}` : undefined}
          className="fixed top-4 left-4 z-[70] flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-1.5 text-xs text-white backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t("backToList")}
            title={t("backToList")}
            className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 font-medium transition-colors hover:bg-white/15"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {crumbRoot}
          </button>

          {crumbCurrent && (
            <>
              <ChevronRight
                className="size-3.5 shrink-0 text-white/40"
                aria-hidden
              />
              <span aria-current="page" className="pr-1.5 text-white/70">
                {crumbCurrent}
              </span>
            </>
          )}
        </nav>
      )}

      {/* Ghim vào mép trái cửa sổ, không vào khung: ở chế độ bề mặt thiên thể
          khung bị CSS ép về hình vuông giữa màn hình (xem `.aladin-body-view`),
          nên mép trái của nó không phải mép trái của cái người xem đang nhìn. */}
      {fullscreenInfo && isFullscreen && status === "ready" && infoOpen && (
        /* Nền đặc hơn và viền sáng hơn bản đầu: bảng nằm trên ảnh bầu trời
           hoặc bề mặt hành tinh, và cả hai đều tối — ở bg-black/70 thì khối
           bảng gần như tan vào nền, chữ vẫn đọc được nhưng mắt không thấy đâu
           là mép bảng. slate-900 là xanh đen chứ không phải đen tuyệt đối,
           nên nó tách khỏi nền bằng sắc màu chứ không chỉ bằng độ sáng. */
        <div className="fixed top-16 left-4 z-[70] max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-900/85 p-4 text-white shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            aria-label={t("close")}
            title={t("close")}
            className="absolute top-3 right-3 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" aria-hidden />
          </button>

          {fullscreenInfo}
        </div>
      )}

      {/* Nút gọi bảng trở lại. Đặt cùng hàng với nút tự quay để mọi điều khiển
          của chế độ toàn màn hình nằm trên một đường, thay vì rải bốn góc. */}
      {fullscreenInfo && isFullscreen && status === "ready" && !infoOpen && (
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label={t("showInfo")}
          title={t("showInfo")}
          className="fixed top-4 right-28 z-[70] inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/85"
        >
          <Info className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("showInfo")}</span>
        </button>
      )}

      {status === "ready" && hintVisible && (
        <div
          className={cn(
            "pointer-events-none flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition-opacity duration-500",
            isFullscreen
              ? "fixed bottom-6 left-1/2 z-[70] -translate-x-1/2"
              : "absolute bottom-3 left-1/2 z-10 -translate-x-1/2",
          )}
        >
          <MousePointer2 className="size-3.5" aria-hidden />
          {t("dragHint")}
        </div>
      )}

      {canSpin && status === "ready" && (
        <button
          type="button"
          onClick={() => setSpinning((value) => !value)}
          aria-label={t("autoRotate")}
          title={t("autoRotate")}
          aria-pressed={spinning}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/85",
            isFullscreen
              ? "fixed top-4 right-16 z-[70]"
              : "absolute top-2 right-12 z-10",
          )}
        >
          {spinning ? (
            <Pause className="size-3.5" aria-hidden />
          ) : (
            <Play className="size-3.5" aria-hidden />
          )}
          <span className="hidden sm:inline">{t("autoRotate")}</span>
        </button>
      )}

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#04060e]">
          <span className="flex items-center gap-3 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-[#04060e] px-6">
          <div className="max-w-sm text-center">
            <AlertTriangle
              className="mx-auto size-6 text-amber-400"
              aria-hidden
            />
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {t("error")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="mt-4 gap-2"
            >
              <RotateCcw className="size-4" />
              {t("retry")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function viewKey(view: SkyView): string {
  return `${view.ra.toFixed(6)}|${view.dec.toFixed(6)}|${view.fovDeg}|${
    view.survey ?? ""
  }`;
}
