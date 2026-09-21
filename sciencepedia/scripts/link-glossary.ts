import { PrismaClient } from "@prisma/client";

import { glossaryKey } from "../src/lib/glossary";

/**
 * Gắn `[[thuật ngữ]]` vào bài đã xuất bản.
 *
 *   npm run glossary:link              # in kế hoạch, KHÔNG ghi gì
 *   npm run glossary:link -- --write   # thực thi
 *
 * ## CHỈ chạy --write SAU KHI code hiểu `[[...]]` đã lên production
 *
 * Bản đang chạy mà chưa có `remarkGlossary` sẽ in nguyên dấu ngoặc vuông ra
 * trang. Kiểm bằng cách mở `/vi/glossary/<slug>` trên site live trước.
 *
 * ## Vì sao neo theo NGỮ CẢNH — cùng lý do với `add-backlinks.ts`
 *
 * Mỗi mục ghi cả cụm bao quanh, khớp đúng MỘT chỗ, đã đọc bằng mắt. Chọn chỗ
 * xuất hiện đầu tiên trong THÂN BÀI; bỏ tiêu đề (mục lục), bảng, và nhãn của
 * link có sẵn (plugin không lồng thuật ngữ trong link). Không gắn thuật ngữ
 * vào chính bài chuyên về nó.
 *
 * ## Vì sao nhãn giữ NGUYÊN chữ gốc
 *
 * `[[khoá|chữ gốc]]` — bỏ cú pháp đi (`stripGlossaryMarkup`) là ra đúng văn bản
 * cũ từng ký tự. Revision chỉ chụp được `content` (bảng không có `contentEn`),
 * nên tính hoàn nguyên được này là thứ bảo đảm cho bản tiếng Anh.
 */
const prisma = new PrismaClient();

type Link = {
  slug: string;
  vi?: [find: string, replace: string];
  en?: [find: string, replace: string];
};

const LINKS: Link[] = [
  {
    slug: "su-ra-doi-cua-he-mat-troi",
    vi: ["**1% động lượng góc**", "**1% [[động lượng góc]]**"],
    en: ["**1% of its angular momentum**", "**1% of its [[dong-luong-goc|angular momentum]]**"],
  },
  {
    slug: "su-ra-doi-cua-he-mat-troi",
    vi: ["vụ nổ siêu tân tinh gần đó", "vụ nổ [[siêu tân tinh]] gần đó"],
    en: ["a nearby supernova", "a nearby [[sieu-tan-tinh|supernova]]"],
  },
  {
    slug: "ba-dinh-luat-kepler-hanh-tinh-chuyen-dong-theo-quy-luat-nao",
    vi: ["**bảo toàn động lượng góc**", "**bảo toàn [[động lượng góc]]**"],
    en: ["**conservation of angular momentum**", "**conservation of [[dong-luong-goc|angular momentum]]**"],
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    vi: ["hiện tượng **dịch chuyển đỏ**", "hiện tượng **[[dịch chuyển đỏ]]**"],
    en: ["exhibit **redshift**", "exhibit **[[dich-chuyen-do|redshift]]**"],
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    vi: ["giả thuyết về **năng lượng tối**", "giả thuyết về **[[năng lượng tối]]**"],
    en: ["hypothesis of **dark energy**", "hypothesis of **[[nang-luong-toi|dark energy]]**"],
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    vi: ["quan sát siêu tân tinh loại Ia", "quan sát [[siêu tân tinh]] loại Ia"],
    en: ["observations of Type Ia supernovae", "observations of Type Ia [[sieu-tan-tinh|supernovae]]"],
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    vi: ["- 27% vật chất tối", "- 27% [[vật chất tối]]"],
    en: ["- 27% dark matter", "- 27% [[vat-chat-toi|dark matter]]"],
  },
  {
    slug: "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh",
    vi: ["bước sóng — dịch chuyển đỏ.", "bước sóng — [[dịch chuyển đỏ]]."],
    en: ["stretched — redshifted.", "stretched — [[dich-chuyen-do|redshifted]]."],
  },
  {
    slug: "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao",
    vi: ["**4,25 năm ánh sáng**", "**4,25 [[năm ánh sáng]]**"],
    en: ["**4.25 light-years**", "**4.25 [[nam-anh-sang|light-years]]**"],
  },
  {
    slug: "da-vu-tru-bon-cap-do-va-mot-cau-hoi-kho",
    vi: ["**46,5 tỷ năm ánh sáng**", "**46,5 tỷ [[năm ánh sáng]]**"],
    en: ["**46.5 billion light-years**", "**46.5 billion [[nam-anh-sang|light-years]]**"],
  },
  {
    slug: "thien-ha-dinh-nghia-va-cach-phan-loai",
    vi: ["chỉ vài nghìn năm ánh sáng", "chỉ vài nghìn [[năm ánh sáng]]"],
    en: ["few thousand light-years across", "few thousand [[nam-anh-sang|light-years]] across"],
  },
  {
    slug: "thien-ha-dinh-nghia-va-cach-phan-loai",
    vi: ["Một lượng lớn vật chất tối bao quanh", "Một lượng lớn [[vật chất tối]] bao quanh"],
    en: ["amount of surrounding dark matter", "amount of surrounding [[vat-chat-toi|dark matter]]"],
  },
  {
    slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
    vi: ["**vật chất tối** thay vì", "**[[vật chất tối]]** thay vì"],
    en: ["**dark matter** rather than", "**[[vat-chat-toi|dark matter]]** rather than"],
  },
  {
    slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
    vi: ["dựa vào phản ứng nhiệt hạch.", "dựa vào [[phản ứng nhiệt hạch]]."],
    en: ["primarily on nuclear fusion.", "primarily on [[phan-ung-nhiet-hach|nuclear fusion]]."],
  },
  {
    slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
    vi: ["các sao neutron quay", "các [[sao neutron]] quay"],
    en: ["rotating neutron stars", "rotating [[sao-neutron|neutron stars]]"],
  },
  {
    slug: "ngoi-sao-cau-tao-va-vong-doi",
    vi: ["duy trì phản ứng nhiệt hạch hydro", "duy trì [[phản ứng nhiệt hạch]] hydro"],
    en: ["sustain hydrogen fusion", "sustain hydrogen [[phan-ung-nhiet-hach|fusion]]"],
  },
  {
    slug: "ngoi-sao-cau-tao-va-vong-doi",
    vi: ["vụ nổ **siêu tân tinh**", "vụ nổ **[[siêu tân tinh]]**"],
    en: ["a **supernova** explosion", "a **[[sieu-tan-tinh|supernova]]** explosion"],
  },
  {
    // Slug đổi 21/09: bài này nay là `nguyen-tu-cau-tao-nen-van-vat`. Mục cũ
    // trỏ slug chết nên lặng lẽ bị bỏ qua mỗi lượt chạy.
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    // Bản EN nói "fusion" bên trong nhãn một link có sẵn — không gắn được.
    vi: ["quá trình **nhiệt hạch**", "quá trình **[[phản ứng nhiệt hạch|nhiệt hạch]]**"],
  },
  {
    slug: "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
    vi: ["xuất hiện **chân trời sự kiện**", "xuất hiện **[[chân trời sự kiện]]**"],
    en: ["an **event horizon** appears", "an **[[chan-troi-su-kien|event horizon]]** appears"],
  },
  {
    slug: "song-hap-dan-va-song-trong-luc-mot-chu-khac-nhau-hai-hien-tuong-khong-lien-quan",
    vi: ["lỗ đen hoặc sao neutron", "lỗ đen hoặc [[sao neutron]]"],
    en: ["black holes or neutron stars", "black holes or [[sao-neutron|neutron stars]]"],
  },
  // KHÔNG gắn: "ho-den-noi-hinh-hoc…" — "sụp đổ sau siêu tân tinh". science-editor
  // (17/09) đánh dấu câu này đảo nhân quả: sụp đổ lõi GÂY RA siêu tân tinh.
  // Đặt tooltip vào một câu sai là chống lưng cho nó. Gắn lại sau khi bài được sửa.
  {
    slug: "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
    vi: ["những siêu tân tinh loại Ia", "những [[siêu tân tinh]] loại Ia"],
    en: ["distant Type Ia supernovae", "distant Type Ia [[sieu-tan-tinh|supernovae]]"],
  },
  {
    slug: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    vi: ["vụ nổ siêu tân tinh trong tương lai", "vụ nổ [[siêu tân tinh]] trong tương lai"],
    en: ["a supernova explosion in the future", "a [[sieu-tan-tinh|supernova]] explosion in the future"],
  },
  // KHÔNG gắn: "20-ngoi-sao…" — câu Vega "khoảng 12.000 năm trước". science-editor
  // (17/09): NASA nói ~14.000 năm; bài nhầm "12.000 TCN" thành "12.000 năm trước".
  // Cùng lý do như trên.
  {
    slug: "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
    vi: ["gọi là **tiến động**", "gọi là **[[tiến động]]**"],
    en: ["called **precession**", "called **[[tien-dong|precession]]**"],
  },
  {
    slug: "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
    vi: ["hiệu ứng nhà kính tích tụ", "[[hiệu ứng nhà kính]] tích tụ"],
    en: ["the greenhouse effect accumulated", "the [[hieu-ung-nha-kinh|greenhouse effect]] accumulated"],
  },
  {
    slug: "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
    vi: ["ước lượng đồng vị oxy", "ước lượng [[đồng vị]] oxy"],
    en: ["oxygen isotope estimates", "oxygen [[dong-vi|isotope]] estimates"],
  },

  /* ---- Đợt 21/09: quét lại toàn kho, 16 chỗ còn sót ----------------------
   *
   * Cách tìm: với mỗi mục từ, lấy những bài NHẮC tới nó bằng chữ thường mà cả
   * bài chưa có lấy một dấu `[[...]]` nào của chính mục từ ấy. Bài đã gắn ở
   * chỗ nhắc đầu tiên thì thôi — quy ước là một lần mỗi bài, không rải khắp.
   *
   * Hai chỗ trong danh sách quét ra đã bị science-editor phủ quyết từ 17/09 và
   * KHÔNG được thêm lại ở đây: câu "sụp đổ sau siêu tân tinh" của bài hố đen
   * (đảo nhân quả) và câu Vega của bài 20 ngôi sao (sai số năm). Hai ghi chú
   * KHÔNG gắn ở phía trên là lý do, không phải sơ suất.
   *
   * Một chỗ nữa bỏ có chủ ý: "Dark energy" trong `nang-luong-la-gi` [en]. Câu
   * ngay sau nó đã có link sang bài vật chất tối — chồng thêm tooltip vào cùng
   * một khái niệm ở cùng một đoạn là nhiễu, không phải phục vụ người đọc. */

  {
    slug: "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do",
    vi: ["Ranh giới ấy gọi là chân trời sự kiện.", "Ranh giới ấy gọi là [[chân trời sự kiện]]."],
    en: [
      "That boundary is called the event horizon.",
      "That boundary is called the [[chan-troi-su-kien|event horizon]].",
    ],
  },
  {
    slug: "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao",
    vi: ["hiện tượng **dịch chuyển đỏ**", "hiện tượng **[[dịch chuyển đỏ]]**"],
    en: ["phenomenon of **redshift**", "phenomenon of **[[dich-chuyen-do|redshift]]**"],
  },
  {
    slug: "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao",
    vi: ["sử dụng **siêu tân tinh loại Ia**", "sử dụng **[[siêu tân tinh]] loại Ia**"],
    en: ["use **Type Ia supernovae**", "use **Type Ia [[sieu-tan-tinh|supernovae]]**"],
  },
  {
    slug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    // Bản VI không dùng chữ "động lượng góc" ở đoạn tương ứng, nên chỉ gắn EN.
    en: [
      "the transfer of **angular momentum**",
      "the transfer of **[[dong-luong-goc|angular momentum]]**",
    ],
  },
  {
    slug: "sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh",
    en: [
      "carrying with it the angular momentum of that entire region",
      "carrying with it the [[dong-luong-goc|angular momentum]] of that entire region",
    ],
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    vi: ["được gọi là **đồng vị**", "được gọi là **[[đồng vị]]**"],
    en: ["the definition of an isotope", "the definition of an [[dong-vi|isotope]]"],
  },
  {
    slug: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    // Lần xuất hiện đầu nằm trong đầu đề BẢNG — bỏ, lấy câu về Sirius.
    vi: ["chỉ 8,6 năm ánh sáng", "chỉ 8,6 [[năm ánh sáng]]"],
    en: ["Only 8.6 light-years from Earth", "Only 8.6 [[nam-anh-sang|light-years]] from Earth"],
  },
  {
    slug: "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
    vi: ["**330 triệu năm ánh sáng**", "**330 triệu [[năm ánh sáng]]**"],
    en: ["**330 million light-years**", "**330 million [[nam-anh-sang|light-years]]**"],
  },
  {
    slug: "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
    vi: ["**Năng lượng tối (Dark Energy)**", "**[[Năng lượng tối]] (Dark Energy)**"],
  },
  {
    slug: "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
    vi: ["quan sát các siêu tân tinh xa", "quan sát các [[siêu tân tinh]] xa"],
  },
  {
    slug: "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no",
    vi: ["thực hiện phản ứng nhiệt hạch", "thực hiện [[phản ứng nhiệt hạch]]"],
  },
  {
    slug: "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no",
    vi: ["các vụ nổ siêu tân tinh", "các vụ nổ [[siêu tân tinh]]"],
  },
  {
    slug: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    en: [
      "ignite nuclear fusion in its core",
      "ignite [[phan-ung-nhiet-hach|nuclear fusion]] in its core",
    ],
  },
  {
    slug: "ngoi-sao-cau-tao-va-vong-doi",
    // Lần đầu là ĐẦU ĐỀ `### Sao neutron` — bỏ, lấy câu về va chạm.
    vi: ["va chạm giữa hai sao neutron", "va chạm giữa hai [[sao neutron]]"],
  },
  {
    slug: "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
    // Neo kéo dài sang dòng sau: một mình "- Sao neutron." quá ngắn để chắc duy nhất.
    vi: [
      "- Sao neutron.\n- Các hành tinh lạnh.",
      "- [[Sao neutron]].\n- Các hành tinh lạnh.",
    ],
  },
  {
    slug: "nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha",
    vi: [
      "- Siêu tân tinh.\n- Nguồn phát tia vũ trụ",
      "- [[Siêu tân tinh]].\n- Nguồn phát tia vũ trụ",
    ],
  },
  /* ---- Đợt 21/09 (2): gắn 10 mục từ vừa qua gate accuracy ---------------
   *
   * Mười mục này soạn cho các cụm **bôi đậm** chưa có định nghĩa. Ghi mục từ
   * vào CSDL KHÔNG làm tooltip xuất hiện: `extractGlossaryKeys` chỉ bắt khoá
   * `[[...]]`, nên chừng nào chưa gắn ở đây thì 22 mục từ vẫn vô hình.
   *
   * Ba chỗ quét ra nhưng KHÔNG gắn, vì chữ giống mà khái niệm khác:
   *
   * - "hệ quy chiếu quán tính" (ba-dinh-luat-kepler, thuyet-tuong-doi-hep) là
   *   inertial frame, không phải quán tính của một vật.
   * - "lực quán tính" (dieu-gi-tao-ra-gio-thuy-trieu) là lực ảo trong hệ quay,
   *   không phải quán tính.
   * - "chuỗi phản ứng proton–proton" (mat-troi) là tên một phản ứng; gắn mục
   *   từ vào giữa tên riêng ấy đọc gãy, và bài đã có chỗ khác tốt hơn.
   *
   * Bản tiếng Anh của `giai-ma-nhung-khoang-trong-rong-voids` KHÔNG được gắn
   * gì: `contentEn` của nó hiện là nội dung một bài khác (chân không vũ trụ).
   * Xem ghi chú cùng tên trong `add-reading-links.ts`.
   */

  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    vi: ["Ánh sáng là **bức xạ điện từ**", "Ánh sáng là **[[bức xạ điện từ]]**"],
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    vi: ["gọi là **photon**", "gọi là **[[photon]]**"],
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    vi: ["gọi là **ánh sáng khả kiến**", "gọi là **[[ánh sáng khả kiến]]**"],
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    vi: ["hội tụ lên **võng mạc**", "hội tụ lên **[[võng mạc]]**"],
  },
  {
    slug: "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
    vi: ["Một photon sinh ra ở lõi", "Một [[photon]] sinh ra ở lõi"],
    en: ["A photon born in the core", "A [[photon]] born in the core"],
  },
  {
    slug: "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
    vi: ["tương tác với từ quyển", "tương tác với [[từ quyển]]"],
    en: ["interact with the magnetosphere", "interact with the [[tu-quyen|magnetosphere]]"],
  },
  {
    slug: "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
    vi: ["- Photon có năng lượng ngày càng thấp.", "- [[Photon]] có năng lượng ngày càng thấp."],
  },
  {
    slug: "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh",
    vi: [
      "Hubble mạnh ở ánh sáng khả kiến và tử ngoại",
      "Hubble mạnh ở [[ánh sáng khả kiến]] và tử ngoại",
    ],
    en: [
      "Visible light emitted by the first galaxies",
      "[[anh-sang-kha-kien|Visible light]] emitted by the first galaxies",
    ],
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    vi: ["- **Proton** mang điện tích dương.", "- **[[Proton]]** mang điện tích dương."],
    en: [
      "a nucleus holding protons and neutrons",
      "a nucleus holding [[proton|protons]] and neutrons",
    ],
  },
  {
    slug: "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang",
    vi: ["- **Proton** mang điện tích dương.", "- **[[Proton]]** mang điện tích dương."],
  },
  {
    slug: "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
    vi: ["**Từ quyển.**", "**[[Từ quyển]].**"],
    en: ["**Magnetosphere.**", "**[[tu-quyen|Magnetosphere]].**"],
  },
  {
    slug: "tu-truong-va-luc-hap-dan-hai-luc-vo-hinh-hai-co-che-khac-nhau",
    vi: ["một khoang gọi là **từ quyển**", "một khoang gọi là **[[từ quyển]]**"],
    en: [
      "a cavity known as the **magnetosphere**",
      "a cavity known as the **[[tu-quyen|magnetosphere]]**",
    ],
  },
  {
    slug: "nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha",
    vi: ["> **Đám mây Oort**", "> **[[Đám mây Oort]]**"],
  },
  {
    slug: "sao-choi-nguon-goc-cau-tao-va-so-phan",
    vi: ["đến từ **đám mây Oort**", "đến từ **[[đám mây Oort]]**"],
    en: ["from the **Oort cloud**", "from the **[[dam-may-oort|Oort cloud]]**"],
  },
  {
    slug: "tai-sao-pluto-khong-con-la-hanh-tinh",
    vi: ["lập ra nhóm **hành tinh lùn**", "lập ra nhóm **[[hành tinh lùn]]**"],
    en: [
      "established the **dwarf planet** category",
      "established the **[[hanh-tinh-lun|dwarf planet]]** category",
    ],
  },
  {
    slug: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    vi: ["nhóm mới: **hành tinh lùn**", "nhóm mới: **[[hành tinh lùn]]**"],
    en: ["a new group: **dwarf planets**", "a new group: **[[hanh-tinh-lun|dwarf planets]]**"],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-nang-va-nhe",
    vi: ["thước đo của **quán tính**", "thước đo của **[[quán tính]]**"],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-nang-va-nhe",
    vi: ["- **a**: gia tốc (m/s²)", "- **a**: [[gia tốc]] (m/s²)"],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-hut-hang-khi-van-toc-thay-doi",
    vi: ["lao về phía trước theo quán tính", "lao về phía trước theo [[quán tính]]"],
    en: ["rush forward due to inertia", "rush forward due to [[quan-tinh|inertia]]"],
  },
  {
    slug: "newton-da-giai-ma-the-gioi-nhu-the-nao",
    en: ["the definition of **inertia**", "the definition of **[[quan-tinh|inertia]]**"],
  },
  {
    slug: "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
    vi: ["chủ yếu cảm nhận **gia tốc**", "chủ yếu cảm nhận **[[gia tốc]]**"],
    en: ["primarily sense **acceleration**", "primarily sense **[[gia-toc|acceleration]]**"],
  },
  {
    slug: "ba-dinh-luat-kepler-hanh-tinh-chuyen-dong-theo-quy-luat-nao",
    vi: [
      "làm hành tinh **gia tốc** về phía Mặt Trời",
      "làm hành tinh **[[gia tốc]]** về phía Mặt Trời",
    ],
  },
];

/** Khoá của mọi `[[...]]` trong một chuỗi thay thế. */
const keysIn = (text: string) =>
  [...text.matchAll(/\[\[([^\]|]+)/g)].map((match) => glossaryKey(match[1]));

function apply(text: string, pair: [string, string] | undefined, label: string) {
  if (!pair) return { text, ok: true };
  const [find, replace] = pair;
  if (text.includes(replace)) {
    console.log(`     ${label}: đã gắn từ trước`);
    return { text, ok: true };
  }
  const count = text.split(find).length - 1;
  if (count !== 1) {
    console.log(`     ${label}: BỎ QUA — cụm neo khớp ${count} chỗ, cần đúng 1`);
    return { text, ok: false };
  }
  console.log(`     ${label}: …${replace}…`);
  return { text: text.replace(find, replace), ok: true };
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  console.log(write ? "=== THỰC THI ===" : "=== CHẠY KHÔ (thêm --write để ghi) ===");

  const terms = await prisma.glossaryTerm.findMany({ select: { slug: true, aliases: true } });
  const known = new Set(terms.flatMap((term) => [term.slug, ...term.aliases]));

  // Gom theo bài: một revision cho mỗi bài, không phải mỗi thuật ngữ
  const bySlug = new Map<string, Link[]>();
  for (const link of LINKS) bySlug.set(link.slug, [...(bySlug.get(link.slug) ?? []), link]);

  let changed = 0;
  for (const [slug, links] of bySlug) {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true, title: true, content: true, contentEn: true, status: true },
    });
    console.log(`\n${slug}`);
    if (article?.status !== "PUBLISHED") {
      console.log(`   BỎ QUA: ${article?.status ?? "không tồn tại"}`);
      continue;
    }

    let content = article.content;
    let contentEn = article.contentEn ?? "";
    for (const link of links) {
      const missing = [...keysIn(link.vi?.[1] ?? ""), ...keysIn(link.en?.[1] ?? "")].filter(
        (key) => !known.has(key),
      );
      if (missing.length) {
        // Gắn thuật ngữ chưa có mục từ thì chỉ hiện chữ thường — vô hại nhưng
        // vô ích, nên không ghi. Chạy khô vẫn kiểm cụm neo để sửa kế hoạch sớm.
        console.log(`   ${write ? "BỎ QUA" : "(chưa có mục từ)"}: ${[...new Set(missing)].join(", ")}`);
        if (write) continue;
      }
      content = apply(content, link.vi, "vi").text;
      if (article.contentEn) contentEn = apply(contentEn, link.en, "en").text;
    }

    const dirty = content !== article.content || contentEn !== (article.contentEn ?? "");
    if (!dirty) continue;
    changed += 1;
    if (!write) continue;

    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          note: "Trước khi gắn [[thuật ngữ]]. contentEn hoàn nguyên được bằng stripGlossaryMarkup().",
        },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { content, ...(article.contentEn ? { contentEn } : {}) },
      }),
    ]);
    console.log("   ĐÃ GHI (kèm revision)");
  }

  console.log(write ? `\nĐã sửa ${changed} bài.` : `\n${changed} bài sẽ đổi. Chưa ghi gì.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
