"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Loader2, Telescope } from "lucide-react";

import type { SkyView } from "@/hooks/use-aladin";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Cảnh Aladin nằm ở chunk riêng và chỉ được tải khi component này quyết định
 * kích hoạt. `ssr: false` vì Aladin đọc `window` ngay lúc nạp, và `dynamic`
 * với `ssr: false` chỉ hợp lệ trong Client Component — đó là lý do lớp bọc
 * này tồn tại, giống hệt cách trang Ngân Hà bọc cảnh 3D.
 */
const AladinCanvas = dynamic(
  () => import("@/components/sky/aladin-canvas").then((mod) => mod.AladinCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-[#04060e]">
        <Loader2 className="size-5 animate-spin text-white/60" />
      </div>
    ),
  },
);

export type AladinViewerProps = {
  /** Tâm khung nhìn, bề rộng và survey */
  view: SkyView;
  /** Nhãn cho trình đọc màn hình */
  label: string;
  /**
   * `visible` — nạp khi khung cuộn tới gần tầm nhìn.
   * `click`   — chỉ nạp khi người đọc bấm. Dùng cho khối nhúng trong bài
   *             viết: ở đó bản đồ là phần phụ, không phải thứ người ta vào để
   *             xem, nên không được tự tiêu 1 MB băng thông của họ.
   */
  activation?: "visible" | "click";
  /** Nội dung hiện trước khi kích hoạt. Mặc định là tấm bìa có nút mở. */
  poster?: ReactNode;
  /** Chú thích trên tấm bìa mặc định */
  posterCaption?: string;
  className?: string;
};

/**
 * Khung bản đồ bầu trời, kèm chốt lazy-load.
 *
 * ## Vì sao phải có chốt
 *
 * Aladin Lite kéo về khoảng 1 MB JavaScript + WebAssembly, rồi mới bắt đầu
 * tải ô tile ảnh. Nạp nó ở thời điểm dựng trang sẽ đẩy TBT và LCP của route
 * lên trong khi người đọc còn chưa nhìn tới khung bản đồ.
 *
 * ## Vì sao khung có chiều cao ngay từ HTML đầu tiên
 *
 * Chiều cao đặt bằng CSS ở lớp ngoài, không đợi JavaScript. Nếu để khung tự
 * cao lên lúc Aladin nạp xong thì mọi thứ bên dưới bị đẩy xuống — đúng định
 * nghĩa của CLS.
 */
export function AladinViewer({
  view,
  label,
  activation = "visible",
  poster,
  posterCaption,
  className,
}: AladinViewerProps) {
  const t = useTranslations("sky");
  const { ref, inView } = useInView<HTMLDivElement>();
  const [clicked, setClicked] = useState(false);
  const [saveData, setSaveData] = useState(false);

  /**
   * Người bật chế độ tiết kiệm dữ liệu thì luôn phải tự bấm, kể cả khi chỗ gọi
   * xin `visible`. Họ đã nói rõ là không muốn trình duyệt tự tải thứ nặng, mà
   * đây là thứ nặng nhất cả site.
   */
  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) setSaveData(true);
  }, []);

  const active = clicked || (activation === "visible" && !saveData && inView);

  return (
    <div
      ref={ref}
      className={cn(
        "relative isolate w-full overflow-hidden rounded-2xl border bg-[#04060e]",
        className,
      )}
    >
      {active ? (
        <AladinCanvas view={view} label={label} />
      ) : (
        <div className="absolute inset-0">
          {poster ?? (
            <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_35%,#16224a,#04060e_70%)] px-6 text-center">
              <div>
                <Telescope
                  className="mx-auto size-7 text-white/50"
                  aria-hidden
                />
                {posterCaption && (
                  <p className="mt-3 text-sm text-white/65">{posterCaption}</p>
                )}
                <Button
                  onClick={() => setClicked(true)}
                  className="mt-4 gap-2"
                  size="sm"
                >
                  <Telescope className="size-4" />
                  {t("open")}
                </Button>
                <p className="mt-3 text-xs text-white/40">{t("weight")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
