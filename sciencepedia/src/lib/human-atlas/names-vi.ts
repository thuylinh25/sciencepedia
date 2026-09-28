/**
 * Tên tiếng Việt của cấu trúc giải phẫu, khoá theo mã khái niệm FMA.
 *
 * ## Vì sao khoá theo FMA chứ không theo tên tiếng Anh
 *
 * Mã FMA (`FMA7088` = heart) là định danh ổn định của bộ dữ liệu — cả khái
 * niệm (`concepts[].id`) lẫn từng mảnh (`parts[].conceptId`) đều mang nó, nên
 * MỘT mục ở đây dịch được cả kết quả tìm kiếm lẫn mảnh người đọc chạm trên mô
 * hình. Tên tiếng Anh thì khác hoa thường giữa hai chỗ và có thể đổi khi bộ dữ
 * liệu được dựng lại.
 *
 * Mã nội bộ không bao giờ bị thay bằng chữ tiếng Việt: viewer, shader và deep
 * link đều chạy trên mã gốc. Đây chỉ là lớp HIỂN THỊ:
 *
 *   mã FMA → tên tiếng Việt nếu có ở đây → tên tiếng Anh gốc
 *
 * ## Vì sao chưa đủ 3.432 mục
 *
 * Bộ dữ liệu có 3.432 khái niệm. Dịch máy hàng loạt thuật ngữ giải phẫu là
 * cách nhanh nhất để in ra tên sai với giọng rất chắc chắn — trái đúng điều
 * `docs/content-rules.md` cấm. Danh sách này chỉ gồm thuật ngữ chuẩn, thông
 * dụng; mục nào chưa có thì hiện tên tiếng Anh gốc. Bổ sung dần: thêm một
 * dòng `FMAxxxx: "…"`, không cần sửa gì khác.
 */
export const VI_NAMES: Record<string, string> = {
  // Tim và mạch lớn
  FMA7088: "Tim",
  FMA7101: "Tâm thất trái",
  FMA7098: "Tâm thất phải",
  FMA7097: "Tâm nhĩ trái",
  FMA7096: "Tâm nhĩ phải",
  FMA7235: "Van hai lá",
  FMA3734: "Động mạch chủ",
  FMA8612: "Thân động mạch phổi",
  FMA4720: "Tĩnh mạch chủ trên",
  FMA10951: "Tĩnh mạch chủ dưới",
  FMA3939: "Động mạch cảnh chung",
  FMA3951: "Động mạch dưới đòn",
  FMA22689: "Động mạch cánh tay",
  FMA70248: "Động mạch đùi",
  FMA4724: "Tĩnh mạch cảnh trong",
  FMA50735: "Tĩnh mạch cửa gan",
  FMA21376: "Tĩnh mạch hiển lớn",

  // Thần kinh
  FMA50801: "Não",
  FMA67944: "Tiểu não",
  FMA79876: "Thân não",
  FMA7647: "Tủy sống",
  FMA13889: "Tuyến yên",

  // Hô hấp
  FMA7394: "Khí quản",
  FMA7409: "Phế quản",
  FMA7405: "Phế quản chính",
  FMA7396: "Phế quản chính trái",
  FMA7395: "Phế quản chính phải",
  FMA7310: "Phổi trái",
  FMA7309: "Phổi phải",
  FMA13295: "Cơ hoành",

  // Tiêu hoá
  FMA54640: "Lưỡi",
  FMA12516: "Răng",
  FMA7131: "Thực quản",
  FMA7148: "Dạ dày",
  FMA7206: "Tá tràng",
  FMA7207: "Hỗng tràng",
  FMA7208: "Hồi tràng",
  FMA7200: "Ruột non",
  FMA7201: "Ruột già",
  FMA14541: "Manh tràng",
  FMA14542: "Ruột thừa",
  FMA14544: "Trực tràng",
  FMA7197: "Gan",
  FMA7202: "Túi mật",
  FMA7198: "Tụy",

  // Tiết niệu, sinh dục, nội tiết, bạch huyết
  FMA7203: "Thận",
  FMA7205: "Thận trái",
  FMA7204: "Thận phải",
  FMA9704: "Niệu quản",
  FMA15572: "Niệu quản trái",
  FMA15571: "Niệu quản phải",
  FMA15900: "Bàng quang",
  FMA19667: "Niệu đạo",
  FMA9600: "Tuyến tiền liệt",
  FMA7210: "Tinh hoàn",
  FMA9604: "Tuyến thượng thận",
  FMA9607: "Tuyến ức",
  FMA7196: "Lách",

  // Giác quan, bề mặt
  FMA12515: "Nhãn cầu trái",
  FMA12514: "Nhãn cầu phải",
  FMA7163: "Da",

  // Xương
  FMA46565: "Hộp sọ",
  FMA52734: "Xương trán",
  FMA9613: "Xương đỉnh",
  FMA52735: "Xương chẩm",
  FMA52737: "Xương thái dương",
  FMA52736: "Xương bướm",
  FMA9711: "Xương hàm trên",
  FMA52748: "Xương hàm dưới",
  FMA52747: "Xương gò má",
  FMA52745: "Xương mũi",
  FMA52749: "Xương móng",
  FMA13478: "Cột sống",
  FMA12519: "Đốt đội",
  FMA12520: "Đốt trục",
  FMA16202: "Xương cùng",
  FMA7485: "Xương ức",
  FMA7574: "Xương sườn",
  FMA13321: "Xương đòn",
  FMA13394: "Xương vai",
  FMA13303: "Xương cánh tay",
  FMA23131: "Xương cánh tay trái",
  FMA23130: "Xương cánh tay phải",
  FMA23463: "Xương quay",
  FMA23466: "Xương trụ",
  FMA9578: "Khung chậu",
  FMA16585: "Xương chậu",
  FMA16587: "Xương chậu trái",
  FMA16586: "Xương chậu phải",
  FMA9611: "Xương đùi",
  FMA24475: "Xương đùi trái",
  FMA24474: "Xương đùi phải",
  FMA24485: "Xương bánh chè",
  FMA24476: "Xương chày",
  FMA24479: "Xương mác",

  // Cơ
  FMA22314: "Cơ mông lớn",
  FMA22353: "Cơ may",
  FMA13407: "Cơ ức đòn chũm",
};

/** Tên hiển thị theo locale; thiếu bản tiếng Việt thì trả tên tiếng Anh gốc. */
export function displayName(
  locale: string,
  conceptId: string,
  englishName: string,
): string {
  if (locale === "vi") {
    const vi = VI_NAMES[conceptId];
    if (vi) return vi;
  }
  // Bộ dữ liệu có tên viết thường ("vascular tree") lẫn viết hoa ("Left kidney").
  return englishName.charAt(0).toUpperCase() + englishName.slice(1);
}

/** Có tên tiếng Việt thật hay không — để hiện kèm tên gốc cho người học. */
export function hasViName(conceptId: string): boolean {
  return conceptId in VI_NAMES;
}
