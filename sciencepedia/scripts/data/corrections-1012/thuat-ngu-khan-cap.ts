import type { Plan } from "../../lib/corrections";

/**
 * Gắn hai mục từ glossary mới (seed 2026-10-12) vào bài "Chế độ khẩn cấp mạn tính" — phiếu thẩm định
 * 12/10 mục E3: `hach-hanh-nhan`, `he-than-kinh-tu-chu` (alias `he-than-kinh-giao-cam`,
 * `he-than-kinh-doi-giao-cam`). Sửa chữ, không đổi claim → `minor`.
 */
export const THUAT_NGU_KHAN_CAP: Plan = {
  slug: "che-do-khan-cap-man-tinh-co-che-sinh-hoc-tu-cang-thang-den-benh-tat",
  note: "Trước khi gắn [[hạch hạnh nhân]], [[hệ thần kinh giao cảm]], [[hệ thần kinh đối giao cảm]] (mục từ glossary mới 12/10)",
  minor: true,
  fixes: [
    { field: "content", find: "**hạch hạnh nhân** (*amygdala*)", replace: "**[[hạch hạnh nhân]]** (*amygdala*)", why: "Mục từ `hach-hanh-nhan`; lần đầu ngoài tiêu đề." },
    { field: "content", find: "kích hoạt **hệ thần kinh giao cảm**", replace: "kích hoạt **[[hệ thần kinh giao cảm]]**", why: "Mục từ `he-than-kinh-tu-chu` (alias giao cảm)." },
    { field: "content", find: "**hệ thần kinh đối giao cảm**", replace: "**[[hệ thần kinh đối giao cảm]]**", why: "Mục từ `he-than-kinh-tu-chu` (alias đối giao cảm)." },
  ],
  reading: [],
  sources: [],
};
