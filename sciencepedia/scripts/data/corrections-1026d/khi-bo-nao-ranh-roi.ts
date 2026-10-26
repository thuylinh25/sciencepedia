import type { Plan } from "../../lib/corrections";

/**
 * Touch-up sau 1026c cho bài 'Khi bộ não "rảnh rỗi"…' (phiếu mục F, "Cập nhật … đợt 1026d").
 * Hai sửa về độ chính xác, không thêm nguồn (bài đã có 7 nguồn bậc 1–2 từ 1026c):
 *  - Bỏ mệnh đề "kể cả khi đang nghĩ về điều dễ chịu" (D3, Killingsworth 2010): abstract không
 *    chứng minh tiểu kết quả này; kết quả thật là lang thang sang điều dễ chịu *không vui hơn*,
 *    không phải *kém vui hơn*. Chỉ đọc abstract → bỏ mệnh đề, không khẳng định thay.
 *  - summary + summaryEn: "làm gia tăng / increase" → "đi kèm / be accompanied by", cho nhất quán
 *    với việc hạ nhân quả ở seoDescription và thân bài.
 * factCheck + byline vẫn GIỮ PENDING — người duyệt ký sau khi đọc bản đã sửa.
 */

const SLUG = "khi-bo-nao-ranh-roi-khoa-hoc-noi-gi-ve-mat-trai-cua-su-nhan-roi";

export const NHAN_ROI_D: Plan = {
  slug: SLUG,
  note: "Touch-up 1026d: bỏ mệnh đề Killingsworth chưa đọc được (D3) + hạ 'làm gia tăng/increase' ở summary/summaryEn",
  fixes: [
    {
      field: "content",
      find: "người ta có xu hướng kém vui hơn so với lúc tập trung — kể cả khi đang nghĩ về điều dễ chịu.",
      replace: "người ta có xu hướng kém vui hơn so với lúc tập trung.",
      why: "D3 — bỏ tiểu kết quả không có trong abstract Killingsworth 2010",
    },
    {
      field: "contentEn",
      find: "people tended to be less happy than when they were focused — even when they were thinking about something pleasant.",
      replace: "people tended to be less happy than when they were focused.",
      why: "D3 (EN) — bỏ tiểu kết quả không có trong abstract",
    },
    {
      field: "summary",
      find: "có thể làm gia tăng suy nghĩ miên man, lo âu hoặc tự suy ngẫm tiêu cực.",
      replace: "có thể đi kèm suy nghĩ miên man, lo âu hoặc tự suy ngẫm tiêu cực.",
      why: "Nhất quán — bỏ framing nhân quả 'làm gia tăng'",
    },
    {
      field: "summaryEn",
      find: "this state can increase mind-wandering, anxiety or negative self-reflection.",
      replace: "this state can be accompanied by mind-wandering, anxiety or negative self-reflection.",
      why: "Nhất quán (EN) — bỏ framing nhân quả 'increase'",
    },
  ],
  reading: [],
  sources: [],
  forbid: [
    "kể cả khi đang nghĩ về điều dễ chịu",
    "even when they were thinking about something pleasant",
    "làm gia tăng suy nghĩ miên man",
    "can increase mind-wandering",
  ],
};
