import type { Plan } from "../../lib/corrections";

/**
 * Gắn mục từ glossary mới "Khúc xạ" (slug `khuc-xa`, alias `khuc-xa-anh-sang`; seed 2026-10-12) vào
 * bài lấp lánh của sao — nơi phiếu thẩm định 12/10 mục E5 đề xuất mục từ này. Sửa chữ, không đổi
 * claim → `minor`, không cập nhật lastVerifiedAt.
 */
export const THUAT_NGU_KHUC_XA: Plan = {
  slug: "bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong",
  note: "Trước khi gắn [[khúc xạ ánh sáng]] (mục từ glossary mới 12/10)",
  minor: true,
  fixes: [
    {
      field: "content",
      find: "gọi là **khúc xạ ánh sáng**.",
      replace: "gọi là **[[khúc xạ ánh sáng]]**.",
      why: "Mục từ `khuc-xa` vừa seed; lần xuất hiện đầu tiên ngoài tiêu đề.",
    },
  ],
  reading: [],
  sources: [],
};
