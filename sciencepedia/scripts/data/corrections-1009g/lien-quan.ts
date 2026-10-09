import type { Plan } from "../../lib/corrections";

/**
 * Link vào cho hai bài thẩm định 09/10 tối (phiếu mục E: cả hai có 0 bài trỏ vào). Cả hai bài đích
 * đang PUBLISHED nên link không dẫn tới trang 404. Không đổi claim → minor.
 */
const DI_TRUYEN = "bi-an-di-truyen-nhung-gi-con-trai-thua-huong-tu-me";
const THIET_KE = "ban-thiet-ke-chung-cua-su-song-vi-sao-cac-loai-dong-vat-co-cau-tao-giong-nhau";

export const LINK_DI_TRUYEN: Plan = {
  slug: "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
  note: "Trước sửa 09/10: thêm link vào cho bài Bí ẩn di truyền",
  fixes: [
    {
      field: "content",
      find: "- [Hệ vi sinh đường ruột: hàng chục nghìn tỉ cư dân và ảnh hưởng của chúng](/articles/he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung)",
      replace:
        "- [Hệ vi sinh đường ruột: hàng chục nghìn tỉ cư dân và ảnh hưởng của chúng](/articles/he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung)\n" +
        `- [Bí ẩn di truyền: những gì con trai thừa hưởng từ mẹ](/articles/${DI_TRUYEN})`,
      why: "Mục Đọc thêm: kho không có câu nào trong bài đã duyệt nói về di truyền từ bố mẹ để neo giữa câu; CRISPR là bài PASSED duy nhất cùng mảng di truyền.",
    },
  ],
  reading: [],
  sources: [],
  minor: true,
};

export const LINK_THIET_KE: Plan = {
  slug: "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the",
  note: "Trước sửa 09/10: thêm link vào cho bài Bản thiết kế chung của sự sống",
  fixes: [
    {
      field: "content",
      find: "Mọi loài sinh vật trên Trái Đất đều là sản phẩm của quá trình tiến hóa.",
      replace: `Mọi loài sinh vật trên Trái Đất đều là sản phẩm của [quá trình tiến hóa](/articles/${THIET_KE}).`,
      why: "Bài đích giải thích tiến hóa để lại dấu vết gì trên cơ thể (đồng nguồn, đồng quy, gen Hox).",
    },
  ],
  reading: [],
  sources: [],
  minor: true,
};
