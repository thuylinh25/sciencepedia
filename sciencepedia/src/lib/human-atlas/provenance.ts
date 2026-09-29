import { ANATOMY_SOURCES } from "./structures";

/**
 * Nguồn gốc của mọi thứ trên Bản đồ cơ thể người — một chỗ duy nhất.
 *
 * Bảng "Nguồn dữ liệu giải phẫu" (trang giới thiệu lẫn bảng trong viewer) và
 * link nguồn của bảng chi tiết ĐỌC từ đây; không viết cứng giấy phép hay URL
 * trong JSX. Mỗi mục ghi `evidence`: đã kiểm bằng gì, ngày nào — để lần sau
 * không ai phải tin trí nhớ (của người hay của AI).
 *
 * Bốn vai tách bạch, vì chúng thật sự đến từ bốn nơi:
 *   model       — hình 3D, tên tiếng Anh, mã FMA gắn cho mỗi mảnh: BodyParts3D
 *   terminology — tên Latin, đồng nghĩa, cấu trúc cha, TA98: FMA 5.1.0
 *   descriptions— dữ kiện cho mô tả ngắn một số cấu trúc: OpenStax (chỉ dữ kiện)
 *   viewer      — mã trình xem, cách gom 15 hệ + màu, bản chuyển đổi hình học
 *                 cho trình duyệt: dự án Human Atlas
 * Phần Sciencepedia tự làm nằm ở messages (`aboutSheet.sciencepedia*`).
 */
export const ATLAS_PROVENANCE = {
  model: {
    name: "BodyParts3D",
    version: "4.0",
    /** Tệp phát hành chính thức mà 2.234 mảnh đến từ. */
    release: "isa_BP3D_4.0_obj_99.zip",
    holder: "The Database Center for Life Science",
    license: "CC BY 4.0",
    licenseUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
    sourceUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html",
    publication: {
      label: "Mitsuhashi et al., 2009",
      url: "https://doi.org/10.1093/nar/gkn613",
    },
    /**
     * Kiểm 2026-09-28:
     * - Tải `isa_BP3D_4.0_obj_99.zip` từ archive chính thức (dbarchive.biosciencedbc.jp,
     *   143 MB, Last-Modified 2013-05-22): đúng 2.234 tệp OBJ, và 2.234/2.234 mã
     *   mảnh (FJ…) trùng khớp `atlas.json` đang phát. Header OBJ: "Compatibility
     *   version : 4.0", "Build-up logic : FMA 3.0 is_a".
     * - Giấy phép: trang lic.html chính thức (cập nhật 2025-02-27) ghi CC BY 4.0 cho
     *   cơ sở dữ liệu. Chú thích CŨ trong từng tệp OBJ ghi CC BY-SA 2.1 Japan và trỏ
     *   về chính trang ấy — trang của bên cấp phép là căn cứ hiện hành.
     * - Dữ liệu đến tay Sciencepedia qua repo Human Atlas (ashemag), không tải
     *   thẳng từ archive; khớp mã mảnh ở trên là bằng chứng nó đúng bản phát hành này.
     */
    evidence: "official-archive-zip+lic.html, 2026-09-28",
  },
  terminology: {
    ...ANATOMY_SOURCES.fma,
    /** Tệp giấy phép trong chính thư mục phát hành — căn cứ, không phải registry. */
    licenseFileUrl: "http://sig.biostr.washington.edu/share/downloads/fma/release/latest/LICENSE",
  },
  descriptions: ANATOMY_SOURCES["openstax-ap2e"],
  /**
   * Mạng mạch + hạch bạch huyết (BodyParts3D không có). Kiểm 2026-09-29: trang
   * Sketchfab ghi giấy phép `by-nc-sa`; `license.txt` trong gói tải về có câu ghi
   * công bên dưới. Chủ sản phẩm xác nhận Sciencepedia phi thương mại. Bản chuyển
   * đổi (`scripts/import-umcg-lymphatic.ts`) phát hành cùng giấy phép, có
   * LICENSE.txt cạnh khối hình học trên R2.
   */
  lymphatic: {
    name: "Lymphatic System: an overview",
    holder: "E-learning UMCG; Anna Sieben, University of Dundee (CAHID)",
    license: "CC BY-NC-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    sourceUrl: "https://sketchfab.com/3d-models/lymphatic-system-an-overview-00d877fa9fbc44218237dbc0a4cc96e1",
    originalUrl: "https://anatomytool.org/content/dundee-3d-model-lymphatic-system",
  },
  viewer: {
    name: "Human Atlas",
    author: "ashemag",
    license: "MIT",
    sourceUrl: "https://github.com/ashemag/human-atlas",
  },
} as const;
