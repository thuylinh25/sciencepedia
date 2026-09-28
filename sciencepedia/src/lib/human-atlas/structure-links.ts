/**
 * Cấu trúc giải phẫu → bài Sciencepedia nói về nó.
 *
 * Khoá là mã FMA (như `names-vi.ts`), giá trị là slug bài. Trang
 * `/[locale]/human-atlas` lọc danh sách này qua `filterPublishedSlugs` lúc
 * render, nên một slug còn ở bản nháp, bị đổi tên hay bị gỡ chỉ làm CTA
 * biến mất — không bao giờ dẫn vào 404.
 *
 * Chỉ ghi bài mà cấu trúc đó là chủ đề chính. Chưa có bài thì KHÔNG ghi, và
 * không viết bài giả để lấp: bảng chi tiết tự ẩn CTA khi không có mục nào.
 */
export const STRUCTURE_ARTICLES: Record<string, string[]> = {
  // Tim
  FMA7088: ["van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao"],
  // Não
  FMA50801: [
    "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
  ],
  // Nhãn cầu trái / phải
  FMA12515: ["mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao"],
  FMA12514: ["mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao"],
  // Ruột già — nơi phần lớn hệ vi sinh đường ruột cư trú
  FMA7201: [
    "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung",
  ],
};

export const STRUCTURE_ARTICLE_SLUGS = [
  ...new Set(Object.values(STRUCTURE_ARTICLES).flat()),
];

/** Bài đã kiểm là PUBLISHED, trang truyền xuống client. */
export type StructureArticle = { slug: string; title: string };
