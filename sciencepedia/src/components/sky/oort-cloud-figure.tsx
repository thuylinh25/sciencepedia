"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2 } from "lucide-react";

import { OortCloudDiagram } from "@/components/sky/oort-cloud-diagram";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Sơ đồ Đám mây Oort kèm đường phóng to.
 *
 * ## Vì sao cần phóng to khi hình đã là vector
 *
 * SVG không vỡ, nên "mở rộng" ở đây KHÔNG phải chuyện độ nét — nó là chuyện
 * đọc được. Hình có sáu vạch chia ghi số (1 → 100.000 AU), và chính mấy con số
 * ấy là thứ giữ cho thang loga không nói dối: bỏ chúng đi thì đám mây trông
 * gần hơn thực tế mấy bậc. Trong cột 26rem của bố cục hai cột, chữ 11px trong
 * khung 600 đơn vị co xuống chừng 7,6px — nhỏ hơn mức đọc được, tức phần duy
 * nhất KHÔNG được phép mất lại là phần mất trước.
 *
 * Hai đường chữa: nới cột cho hình to hẳn, hoặc giữ bố cục và cho mở rộng.
 * Chọn đường thứ hai vì cột phải đang giữ chú giải màu và khối cảnh báo thang
 * loga — đọc chúng CẠNH hình là cách chúng làm việc, xếp chúng xuống dưới một
 * hình rộng cả trang thì mất thế đối chiếu.
 *
 * ## Vì sao là `<button>` bọc cả hình, không phải một nút nhỏ ở góc
 *
 * Người muốn xem rõ sẽ bấm vào HÌNH, đó là phản xạ có sẵn từ mọi thư viện ảnh.
 * Một nút 32px ở góc buộc họ học một thao tác mới để làm đúng việc họ vừa
 * định làm. Biểu tượng ở góc vẫn còn, nhưng làm dấu hiệu chứ không làm đích
 * bấm — nó nằm trong cùng một `<button>`.
 *
 * ## Bản trong hộp thoại không phải bản phóng to của bản nhỏ
 *
 * Nó là cùng một component dựng lại ở khung lớn hơn, nên vạch chia và nhãn nở
 * theo đúng tỉ lệ thay vì bị kéo giãn cùng nét vẽ.
 *
 * Chiều cao chặn bằng `max-w`, KHÔNG bằng `max-h`. Đo thật trong khung cao
 * 900px: `max-h-[68svh]` không ăn gì cả — SVG là phần tử thay thế có tỉ lệ nội
 * tại, và khi bề ngang đã định bằng `w-full` thì chiều cao suy ra từ tỉ lệ,
 * `max-height` chỉ cắt khung vẽ chứ không thu hình lại. Hộp thoại cao 1177px
 * trong màn 900px, tức cụt đầu. Hình này luôn vuông (viewBox 600×600) nên chặn
 * bề ngang là chặn được cả chiều cao, và tỉ lệ giữ nguyên.
 *
 * Hộp thoại vẫn mang `max-h` kèm `overflow-y-auto` làm lưới an toàn: tiêu đề
 * và dòng chú thích cũng chiếm chỗ, và trên cửa sổ rất thấp thì tổng vẫn có
 * thể vượt màn.
 */
export function OortCloudFigure() {
  const t = useTranslations("sky");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("oortExpand")}
          className="group relative block w-full cursor-zoom-in rounded-2xl border bg-[#04060e] p-4 text-white transition-colors hover:border-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <OortCloudDiagram className="w-full" />

          <span
            aria-hidden
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur transition-colors group-hover:bg-white/20 group-hover:text-white"
          >
            <Maximize2 className="size-3.5" />
            {t("oortExpand")}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-[min(56rem,calc(100vw-2rem))] overflow-y-auto bg-[#04060e] text-white">
        <DialogTitle className="text-base font-semibold">
          {t("oortTitle")}
        </DialogTitle>
        <DialogDescription className="text-xs leading-relaxed text-white/60">
          {t("oortScaleNote")}
        </DialogDescription>

        <OortCloudDiagram className="mx-auto w-full max-w-[68svh]" />
      </DialogContent>
    </Dialog>
  );
}
