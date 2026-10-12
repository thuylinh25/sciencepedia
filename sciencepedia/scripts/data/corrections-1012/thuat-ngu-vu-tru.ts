import type { Plan } from "../../lib/corrections";

/**
 * Gắn hai mục từ glossary mới (seed 2026-10-12) vào bài "Nón ánh sáng quá khứ" — phiếu thẩm định
 * 12/10 mục E3 đề xuất: `non-anh-sang`, `buc-xa-nen-vi-song-vu-tru` (alias `cmb`). Sửa chữ, không
 * đổi claim → `minor`.
 */
export const THUAT_NGU_VU_TRU: Plan = {
  slug: "non-anh-sang-qua-khu-ban-chat-vat-ly-cua-viec-quan-sat-vu-tru",
  note: "Trước khi gắn [[nón ánh sáng]], [[bức xạ nền vi sóng vũ trụ]] (mục từ glossary mới 12/10)",
  minor: true,
  fixes: [
    {
      field: "content",
      find: "gọi là **nón ánh sáng** (*light cone*)",
      replace: "gọi là **[[nón ánh sáng]]** (*light cone*)",
      why: "Mục từ `non-anh-sang` vừa seed; lần xuất hiện đầu tiên ngoài tiêu đề.",
    },
    {
      field: "content",
      find: "CMB được phát ra khoảng:",
      replace: "[[Bức xạ nền vi sóng vũ trụ|CMB]] được phát ra khoảng:",
      why: "Mục từ `buc-xa-nen-vi-song-vu-tru` vừa seed; tên đầy đủ chỉ nằm ở tiêu đề mục, nên gắn vào chữ CMB đầu tiên của thân mục.",
    },
  ],
  reading: [],
  sources: [],
};
