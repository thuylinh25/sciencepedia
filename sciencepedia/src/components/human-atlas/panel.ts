/**
 * Nền chung của mọi bảng nổi trên khung atlas.
 *
 * Dựng từ token của site (`background`, `border`) chứ không chép lớp `.glass`
 * của Human Atlas gốc: bảng phải đọc được trên cả nền sáng lẫn tối của cảnh,
 * còn `.glass` của Sciencepedia gần như trong suốt ở dark theme — chữ nhỏ đặt
 * lên mô hình 3D sẽ chìm.
 */
export const PANEL =
  "rounded-2xl border bg-background/92 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/80";
