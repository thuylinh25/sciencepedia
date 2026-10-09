import type { Plan } from "../../lib/corrections";

/**
 * Link vào cho bài "Từ nguyên tử đến kim cương" (phiếu 2026-10-09, mục E4: 0 bài trỏ vào).
 * Neo giữa câu ở bài nguyên tử — đúng chỗ bài đích giải thích cách electron lớp ngoài quyết định
 * liên kết và tính chất. Chỉ bản vi: bài đích chưa có bản en. Không đổi claim → minor.
 */
export const LINK_VAO: Plan = {
  slug: "nguyen-tu-cau-tao-nen-van-vat",
  note: "Trước sửa 09/10: thêm link vào cho bài Từ nguyên tử đến kim cương",
  fixes: [
    {
      field: "content",
      find: "Cách sắp xếp này quyết định nhiều tính chất hóa học của mỗi nguyên tố.",
      replace:
        "Cách sắp xếp này quyết định [nhiều tính chất hóa học](/articles/tu-nguyen-tu-den-kim-cuong-dieu-gi-thuc-su-quyet-dinh-tinh-chat-cua-vat-chat) của mỗi nguyên tố.",
      why: "Bài đích giải thích electron lớp ngoài → liên kết → cấu trúc → tính chất (kim cương/than chì, natri/clo).",
    },
  ],
  reading: [],
  sources: [],
  minor: true,
};
