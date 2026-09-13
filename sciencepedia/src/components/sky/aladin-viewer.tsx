"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Loader2, Telescope } from "lucide-react";

import type { SkyView } from "@/hooks/use-aladin";
import { OPEN_BODY_EVENT } from "@/lib/solar-data";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

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
  /** Hai nhánh của breadcrumb khi toàn màn hình: gốc bấm được, lá là chỗ đang đứng */
  crumbRoot?: string;
  crumbCurrent?: string;
  /**
   * Tự mở khi có nơi khác phát `OPEN_BODY_EVENT` mang đúng id này — đường để
   * dải "Khám phá tiếp" ở thẻ khác mở được thẻ này. Xem `body-jump-list`.
   */
  openOnEventId?: string;
  /**
   * Bấm vào bìa là vào thẳng toàn màn hình, không dừng ở khung trong thẻ.
   *
   * Dùng cho thư viện ảnh: khung trong thẻ chỉ cao bằng một ô vuông nhỏ, mà
   * thứ người ta bấm vào để làm là xoay và phóng to một quả cầu — việc đó cần
   * chỗ. Bắt bấm hai lần mới tới nơi dùng được là bắt trả tiền hai lần cho
   * cùng một ý định.
   */
  openFullscreen?: boolean;
  /** Cho bật tự quay — xem chú thích cùng tên ở `AladinCanvas` */
  canSpin?: boolean;
  /** Xem chú thích cùng tên ở `AladinCanvas` */
  showFullscreenToggle?: boolean;
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
  crumbRoot,
  crumbCurrent,
  openOnEventId,
  openFullscreen,
  canSpin,
  showFullscreenToggle,
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

  useEffect(() => {
    if (!openOnEventId) return;
    /*
     * Một sự kiện làm hai việc: mở thẻ đích và ĐÓNG mọi thẻ còn lại.
     *
     * Thiếu vế thứ hai thì thẻ đích có mở cũng vô ích — thẻ đang xem vẫn giữ
     * lớp toàn màn hình phủ kín cửa sổ, và người bấm chỉ thấy đúng cái ảnh cũ
     * nên kết luận là nút hỏng. Gộp vào một sự kiện thay vì phát thêm một sự
     * kiện đóng-tất-cả riêng: hai sự kiện thì phải bảo đảm thứ tự giữa chúng,
     * còn một thì không có thứ tự nào để sai.
     */
    const open = (event: Event) => {
      const target = (event as CustomEvent<string>).detail;
      setClicked(target === openOnEventId);
    };
    window.addEventListener(OPEN_BODY_EVENT, open);
    return () => window.removeEventListener(OPEN_BODY_EVENT, open);
  }, [openOnEventId]);

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
          crumbRoot={crumbRoot}
          crumbCurrent={crumbCurrent}
          openFullscreen={openFullscreen}
          canSpin={canSpin}
          showFullscreenToggle={showFullscreenToggle}
          // Chỉ cho đóng khi chính người đọc đã bấm để mở. Khung tự nạp theo
          // tầm nhìn (trang bản đồ) thì đóng nó chỉ để nó mở lại ngay.
          onClose={clicked ? () => setClicked(false) : undefined}
        />
      ) : (
        <div className="absolute inset-0">
          {posterBackground}
          {poster ?? (
            /*
              Cả tấm bìa là một nút, không chỉ mỗi cái pill ở giữa.

              Người xem đọc một tấm ảnh có dòng chữ "bấm để mở" là một thứ bấm
              được, rồi bấm vào ảnh — trúng chỗ nào cũng phải mở. Con trỏ đổi
              thành bàn tay trên toàn khung nói trước điều đó.

              Cái pill giữ nguyên hình dáng nhưng là <span>: một <button> lồng
              trong <button> là HTML không hợp lệ, và trình đọc màn hình sẽ
              đọc ra hai điều khiển chồng nhau cho cùng một việc.
            */
            <button
              type="button"
              onClick={() => setClicked(true)}
              aria-label={posterCaption ?? label}
              className={cn(
                "group flex size-full cursor-pointer flex-col justify-end p-4 text-left",
                posterBackground
                  ? "relative bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                  : "bg-[radial-gradient(circle_at_50%_35%,#16224a,#04060e_70%)]",
              )}
            >
              {/*
                Chữ nằm ở ĐÁY ảnh, không phải giữa ảnh.

                Bản trước đặt cả một câu "… — bấm để mở bề mặt, xoay và phóng
                to" ngay giữa quả cầu. Câu đó giải thích đúng, nhưng nó đặt
                lớp giải thích lên trên chính thứ đang cần được nhìn, và trong
                một lưới chín thẻ thì chín câu giống hệt nhau ở chín chỗ giống
                hệt nhau lại càng làm mọi thẻ trông như một.

                Ở đáy thì ảnh được để yên, và dải tối sẵn có của gradient đủ
                cho chữ trắng đọc được mà không cần phủ thêm lớp nào.
              */}
              <span className="flex items-center justify-between gap-3">
                {posterCaption && (
                  <span className="min-w-0 truncate text-sm font-medium text-white/90">
                    {posterCaption}
                  </span>
                )}

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors group-hover:bg-white/25">
                  <Telescope className="size-3.5" aria-hidden />
                  {t("open")}
                </span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
