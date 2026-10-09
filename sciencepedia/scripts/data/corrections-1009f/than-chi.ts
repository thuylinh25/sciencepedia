import type { Plan } from "../../lib/corrections";

/** Thống nhất thuật ngữ cho cả kho: "than chì", không "graphit" (chủ sản phẩm chốt 2026-10-09). */
export const THAN_CHI: Plan = {
  slug: "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
  note: "Trước sửa 09/10: thống nhất thuật ngữ 'than chì' cho cả kho",
  fixes: [
    {
      field: "content",
      find: "một mẩu graphit bị nhốt trong tinh thể zircon",
      replace: "một mẩu than chì bị nhốt trong tinh thể zircon",
      why: "Chủ sản phẩm chốt 2026-10-09: 'than chì' cho cả kho (phiếu tu-nguyen-tu-den-kim-cuong, mục E3).",
    },
  ],
  reading: [],
  sources: [],
  minor: true,
};
