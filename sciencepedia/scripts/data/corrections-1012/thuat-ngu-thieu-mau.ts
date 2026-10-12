import type { Plan } from "../../lib/corrections";

/**
 * Gắn hai mục từ glossary mới (seed 2026-10-12) vào bài "Hội chứng thiếu máu" — phiếu thẩm định
 * 12/10 mục E1: `hong-cau`, `hemoglobin`. Sửa chữ, không đổi claim → `minor`.
 */
export const THUAT_NGU_THIEU_MAU: Plan = {
  slug: "hoi-chung-thieu-mau-khi-co-the-van-hanh-nhu-mot-cai-cay-thieu-nuoc",
  note: "Trước khi gắn [[hồng cầu]], [[hemoglobin]] (mục từ glossary mới 12/10)",
  minor: true,
  fixes: [
    { field: "content", find: "cụ thể là các **hồng cầu**", replace: "cụ thể là các **[[hồng cầu]]**", why: "Mục từ `hong-cau`; lần đầu ngoài tiêu đề." },
    { field: "content", find: "chứa **hemoglobin**", replace: "chứa **[[hemoglobin]]**", why: "Mục từ `hemoglobin`; lần đầu ngoài tiêu đề." },
  ],
  reading: [],
  sources: [],
};
