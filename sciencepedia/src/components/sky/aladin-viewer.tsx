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
  /**
   * Thay HẲN tấm bìa mặc định, kể cả nút mở — chỗ gọi tự lo cách kích hoạt.
   * Muốn giữ nút thì dùng `posterBackground`.
   */
  poster?: ReactNode;
  /**
   * Ảnh nằm SAU tấm bìa mặc định, nút mở vẫn nguyên.
   *
   * Đây là đường dùng cho thư viện ảnh hành tinh: tấm ảnh chụp thật vừa là
   * nội dung có giá trị tự thân (server-render, index được, không cần WebGL),
   * vừa là bìa của khung tương tác. Người không bấm vẫn xem được ảnh.
   */
  posterBackground?: ReactNode;
  /** Chú thích trên tấm bìa mặc định */
  posterCaption?: string;
  /** Xem chú thích cùng tên ở `AladinCanvas` — chỉ hiện khi toàn màn hình */
  fullscreenInfo?: ReactNode;
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
  posterBackground,
  posterCaption,
  fullscreenInfo,
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
        // KHÔNG thêm `isolate` ở đây. Nút toàn màn hình của Aladin đặt khung
        // thành `position: fixed`; một stacking context riêng sẽ nhốt nó lại
        // trong thẻ này và các thẻ đứng sau trong lưới sẽ vẽ đè lên.
        // Xem quy tắc `.aladin-fullscreen` trong `globals.css`.
        "relative w-full overflow-hidden rounded-2xl border bg-[#04060e]",
        // Đánh dấu để CSS ép khung toàn màn hình về vuông — đĩa hành tinh là
        // hình tròn, khung bẹt thì cụt hai cực. Xem `.aladin-body-view`.
        view.planetary && "aladin-body-view",
        className,
      )}
    >
      {active ? (
        <AladinCanvas
          view={view}
          label={label}
          fullscreenInfo={fullscreenInfo}
          // Chỉ cho đóng khi chính người đọc đã bấm để mở. Khung tự nạp theo
          // tầm nhìn (trang bản đồ) thì đóng nó chỉ để nó mở lại ngay.
          onClose={clicked ? () => setClicked(false) : undefined}
        />
      ) : (
        <div className="absolute inset-0">
          {posterBackground}
          {poster ?? (
            <div
              className={cn(
                "grid size-full place-items-center px-6 text-center",
                // Có ảnh nền thì phủ một lớp tối để chữ trắng còn đọc được;
                // không có thì vẽ nền sao mờ như cũ.
                posterBackground
                  ? "relative bg-gradient-to-t from-black/85 via-black/35 to-black/15"
                  : "bg-[radial-gradient(circle_at_50%_35%,#16224a,#04060e_70%)]",
              )}
            >
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
