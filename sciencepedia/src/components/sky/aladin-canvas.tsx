"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

import { useAladin, type SkyView } from "@/hooks/use-aladin";
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
}: {
  view: SkyView;
  /** Nhãn cho trình đọc màn hình — canvas WebGL tự nó không mô tả được gì */
  label: string;
}) {
  const t = useTranslations("sky");
  const { containerRef, status, goTo, retry } = useAladin({
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
