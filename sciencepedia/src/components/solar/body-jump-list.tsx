"use client";

import { useTranslations } from "next-intl";

import { BODY_SYMBOL, OPEN_BODY_EVENT } from "@/lib/solar-data";

export type JumpTarget = {
  id: string;
  name: string;
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
}: {
  targets: JumpTarget[];
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
                /*
                 * Phát sự kiện cho MỌI thiên thể, kể cả thiên thể không có
                 * bản đồ. Thẻ nào trùng id thì mở, mọi thẻ còn lại đóng —
                 * xem chú thích ở `AladinViewer`. Với thiên thể không có
                 * bản đồ thì không thẻ nào mở, và tác dụng duy nhất là đóng
                 * khung đang che kín màn hình, đúng cái cần.
                 */
                window.dispatchEvent(
                  new CustomEvent(OPEN_BODY_EVENT, { detail: target.id }),
                );

                /*
                 * Cuộn ở khung hình SAU. Khung toàn màn hình vừa nhận lệnh
                 * đóng nhưng React chưa vẽ lại, nên lúc này nó vẫn đang phủ
                 * kín cửa sổ và cuộn tới một phần tử nằm dưới nó thì trình
                 * duyệt không có gì để cuộn.
                 */
                requestAnimationFrame(() => {
                  document
                    .getElementById(`body-${target.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
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
