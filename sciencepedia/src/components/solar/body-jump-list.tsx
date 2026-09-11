"use client";

import { useTranslations } from "next-intl";

import { BODY_SYMBOL, OPEN_BODY_EVENT } from "@/lib/solar-data";

export type JumpTarget = {
  id: string;
  name: string;
  /** Thiên thể có bản đồ bề mặt thì bấm là mở thẳng, không thì chỉ cuộn tới */
  hasSurface: boolean;
};

/**
 * Dải "Khám phá tiếp" ở cuối bảng thông tin toàn màn hình.
 *
 * ## Vì sao là sự kiện trên `window` chứ không phải state dùng chung
 *
 * Mỗi thẻ trong thư viện dựng một instance Aladin riêng, và lý do nằm ở
 * `planet-surface.tsx`: mỗi HiPS bề mặt gắn với một thiên thể khác nhau và
 * Aladin chốt hệ toạ độ ngay lúc khởi tạo. Nâng trạng thái "thẻ nào đang mở"
 * lên component cha đồng nghĩa với việc biến cả lưới — hiện là Server
 * Component, chín thẻ không tốn một byte JavaScript nào cho tới khi có người
 * bấm — thành một cây client. Một sự kiện trên `window` giữ nguyên kiến trúc
 * đó: bên phát không cần biết bên nhận là ai.
 *
 * Thiên thể không có bản đồ thì chỉ cuộn tới thẻ. Vẫn liệt kê nó, vì danh
 * sách này trả lời câu "còn gì nữa" chứ không phải "còn bản đồ nào nữa".
 */
export function BodyJumpList({
  targets,
  onLeave,
}: {
  targets: JumpTarget[];
  /** Đóng khung đang mở trước khi nhảy sang thiên thể khác */
  onLeave?: () => void;
}) {
  const t = useTranslations("solar");

  if (targets.length === 0) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <p className="text-[11px] tracking-widest text-white/40 uppercase">
        {t("exploreNext")}
      </p>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {targets.map((target) => (
          <li key={target.id}>
            <button
              type="button"
              onClick={() => {
                onLeave?.();

                /*
                 * Cuộn trước, mở sau. Aladin đo kích thước khung lúc khởi tạo;
                 * khung còn nằm ngoài màn hình thì phép đo đó vẫn đúng, nhưng
                 * người bấm sẽ không thấy gì xảy ra và tưởng nút hỏng.
                 */
                document
                  .getElementById(`body-${target.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });

                if (target.hasSurface) {
                  window.dispatchEvent(
                    new CustomEvent(OPEN_BODY_EVENT, { detail: target.id }),
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <span aria-hidden className="text-sm leading-none">
                {BODY_SYMBOL[target.id]}
              </span>
              {target.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
