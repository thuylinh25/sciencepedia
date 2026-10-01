import type { AtlasViewDef } from "./views";

/*
 * ## Tổng quan hệ theo lối atlas (2026-09-29)
 *
 * Chủ sản phẩm so với ảnh Human Anatomy Atlas (chỉ để tham chiếu — không lấy
 * hình của nó): tim ở đó là tim + mạch vành + mạch lớn + cây mạch phổi, không
 * phải khối tim trơn 18 mảnh. Hệ "Tim" của BodyParts3D chỉ có thành, khoang và
 * van; mạch vành, động mạch chủ, thân động mạch phổi và cây động/tĩnh mạch phổi
 * nằm ở hệ động mạch/tĩnh mạch. Tổng quan gom chúng lại theo tên — không dời,
 * không nhân bản mảnh. Chỉ phần ngực của tĩnh mạch chủ: tĩnh mạch chủ dưới là
 * một mảnh dài tới chậu, kéo khung xuống bụng.
 *
 * Thẻ hệ và `?system=` mở tổng quan của hệ nếu hệ có (xem `overviewFor`).
 */

// Đồng bộ với `CORONARY_ARTERIES` (views-cardiac.ts): thiếu ĐM nón / nhánh vách ở đây thì
// cấu trúc "Động mạch vành" không nằm trọn trong tổng quan và bảng rơi vào "Phần còn lại".
const CORONARY =
  /coronary|interventricular branch|marginal branch of right|ventricular branch of right|conus branch|diagonal branch|circumflex branch of left|^(left |right )?conus artery$|septal branch of ((left|right) )?(anterior|posterior) interventricular artery$/i;

export const OVERVIEW_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "cardiac-overview",
    systemId: "cardiac",
    kind: "overview",
    name: { vi: "Tim và mạch lớn", en: "Heart and great vessels" },
    direction: "front",
    focus: [
      { systems: ["cardiac"] },
      { systems: ["arterial"], name: CORONARY },
      { systems: ["venous"], name: /cardiac vein|coronary sinus/i },
      { systems: ["arterial"], name: /^(ascending aorta|arch of aorta|pulmonary trunk|(left|right) pulmonary artery)$/i },
      { systems: ["venous"], name: /^superior vena cava$/i },
      // Cây mạch phổi, đậm như ảnh tham chiếu — khung rộng theo nó.
      // "Right anterior segmental artery" (FMA8620, 2 mảnh): FMA xếp vào động mạch
      // phổi nhưng cả hai mảnh nằm ở y 1,09–1,13 m, dưới đáy phổi (~1,2 m), ngang
      // thận — lỗi vị trí của BodyParts3D. Để trong khung là một đoạn mạch lơ lửng
      // dưới tim và khung lệch lên (đo 2026-09-29).
      { systems: ["arterial"], name: /segmental artery|lobar artery/i, exclude: /^right anterior segmental artery$/i },
      { systems: ["venous"], name: /pulmonary vein|segmental vein/i },
    ],
    terms: ["tim", "heart", "mạch vành", "coronary", "tim mạch", "cardiovascular"],
  },
  {
    id: "endocrine-overview",
    systemId: "endocrine",
    kind: "overview",
    name: { vi: "Toàn bộ hệ nội tiết", en: "Whole endocrine system" },
    direction: "front",
    focus: [{ systems: ["endocrine"] }],
    terms: ["nội tiết", "endocrine", "tuyến giáp", "thyroid", "thượng thận", "adrenal", "tuyến yên", "pituitary"],
  },
];
