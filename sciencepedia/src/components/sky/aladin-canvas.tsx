"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, Loader2, RotateCcw } from "lucide-react";

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
}) {
  const t = useTranslations("sky");
  const { containerRef, status, isFullscreen, goTo, retry } = useAladin({
    enabled: true,
    initialView: view,
  });

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
        className="size-full"
      />

      {/*
        Ở toàn màn hình, khung Aladin là một lớp `position: fixed` đè lên cả
        trang (xem `.aladin-fullscreen` trong `globals.css`), nên nút này phải
        cố định và nằm cao hơn lớp đó. Trong thẻ thì nó chỉ là một nút góc.
      */}
      {onClose && status !== "error" && (
        <button
          type="button"
          onClick={onClose}
          /* Chỉ còn mũi tên, không còn chữ: tấm bìa vừa biến mất ngay
             dưới con trỏ người vừa bấm, nên không ai cần đọc chữ mới hiểu nút
             này trả về đâu. Nhãn vẫn còn cho trình đọc màn hình, nơi không có
             bối cảnh thị giác đó. */
          aria-label={t("backToList")}
          title={t("backToList")}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-black/65 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/85",
            isFullscreen
              ? "fixed top-4 left-4 z-[70]"
              : "absolute top-2 left-2 z-10",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
      )}

      {/* Ghim vào mép trái cửa sổ, không vào khung: ở chế độ bề mặt thiên thể
          khung bị CSS ép về hình vuông giữa màn hình (xem `.aladin-body-view`),
          nên mép trái của nó không phải mép trái của cái người xem đang nhìn. */}
      {fullscreenInfo && isFullscreen && status === "ready" && (
        <div className="fixed top-16 left-4 z-[70] max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-xl">
          {fullscreenInfo}
        </div>
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
