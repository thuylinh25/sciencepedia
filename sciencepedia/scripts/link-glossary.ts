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
  /* ---- Đợt 21/09 (3): gắn 10 mục từ của đợt soạn thứ hai ----------------
   *
   * KHÔNG gắn `giả thuyết va chạm lớn` ở hai chỗ quét ra được, vì cùng cụm
   * chữ mà chỉ vụ va chạm KHÁC:
   *
   * - `sao-kim`: "giữa giả thuyết va chạm lớn và giả thuyết thuỷ triều khí
   *   quyển" — bàn về chiều tự quay của Sao Kim.
   * - `sao-hoa`: "một vụ va chạm lớn" — bàn về nguồn gốc Phobos và Deimos.
   *
   * Mục từ định nghĩa vụ va chạm sinh ra MẶT TRĂNG. Gắn vào hai chỗ trên là
   * đưa người đọc một thẻ nói về Mặt Trăng giữa đoạn đang nói về hành tinh
   * khác — cùng loại bẫy với "hệ quy chiếu quán tính" ở đợt trước.
   */

  {
    slug: "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
    vi: ["**Axit hoá đại dương.**", "**[[Axit hoá đại dương]].**"],
    en: ["**Ocean acidification.**", "**[[axit-hoa-dai-duong|Ocean acidification]].**"],
  },
  {
    slug: "tai-sao-pluto-khong-con-la-hanh-tinh",
    vi: ["cùng vùng: **vành đai Kuiper**", "cùng vùng: **[[vành đai Kuiper]]**"],
    en: ["region: the **Kuiper belt**", "region: the **[[vanh-dai-kuiper|Kuiper belt]]**"],
  },
  {
    slug: "sao-hai-vuong-hanh-tinh-tim-ra-bang-toan-hoc",
    vi: [
      "một thiên thể vành đai Kuiper bị bắt giữ",
      "một thiên thể [[vành đai Kuiper]] bị bắt giữ",
    ],
    en: ["a captured Kuiper Belt object", "a captured [[vanh-dai-kuiper|Kuiper Belt]] object"],
  },
  {
    slug: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    vi: [
      "thiên thể khác trong vành đai Kuiper",
      "thiên thể khác trong [[vành đai Kuiper]]",
    ],
    en: [
      "other objects in the Kuiper belt",
      "other objects in the [[vanh-dai-kuiper|Kuiper belt]]",
    ],
  },
  {
    slug: "mat-trang",
    vi: ["được đặt tên **Theia**", "được đặt tên **[[Theia]]**"],
    en: ["named **Theia**", "named **[[Theia]]**"],
  },
  {
    slug: "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
    vi: ["thường được gọi là **Theia**", "thường được gọi là **[[Theia]]**"],
    en: ["commonly referred to as **Theia**", "commonly referred to as **[[Theia]]**"],
  },
  {
    slug: "mat-trang",
    vi: ["**khoá thuỷ triều đồng bộ**", "**[[khoá thuỷ triều]] đồng bộ**"],
    en: [
      "**synchronous tidal locking**",
      "**synchronous [[khoa-thuy-trieu|tidal locking]]**",
    ],
  },
  {
    slug: "neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien",
    vi: ["**khóa thủy triều**", "**[[khóa thủy triều]]**"],
    en: ["**tidally locked**", "**[[khoa-thuy-trieu|tidally locked]]**"],
  },
  {
    slug: "thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi",
    vi: ["**Giãn nở thời gian.**", "**[[Giãn nở thời gian]].**"],
    en: ["**Time dilation.**", "**[[gian-no-thoi-gian|Time dilation]].**"],
  },
  {
    slug: "thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi",
    vi: ["**Co độ dài.**", "**[[Co độ dài]].**"],
    en: ["**Length contraction.**", "**[[co-do-dai|Length contraction]].**"],
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    vi: ["**Tế bào que (Rods)**", "**[[Tế bào que]] (Rods)**"],
  },
  {
    slug: "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
    vi: [
      "Dopamine là một chất dẫn truyền thần kinh",
      "Dopamine là một [[chất dẫn truyền thần kinh]]",
    ],
  },
  {
    slug: "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
    vi: [
      "là chất dẫn truyền thần kinh ức chế chính",
      "là [[chất dẫn truyền thần kinh]] ức chế chính",
    ],
  },
  {
    slug: "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    vi: [
      "các túi nhỏ chứa chất dẫn truyền thần kinh",
      "các túi nhỏ chứa [[chất dẫn truyền thần kinh]]",
    ],
  },
  {
    slug: "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
    vi: [
      "một trong những chất dẫn truyền thần kinh kích thích",
      "một trong những [[chất dẫn truyền thần kinh]] kích thích",
    ],
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    vi: [
      "**năng lượng liên kết hạt nhân**",
      "**[[năng lượng liên kết hạt nhân]]**",
    ],
    en: [
      "the binding energy holding the nucleus together",
      "the [[nang-luong-lien-ket-hat-nhan|binding energy]] holding the nucleus together",
    ],
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    // Bản VI không dùng cụm "số hiệu nguyên tử" ở đoạn tương ứng.
    en: [
      "The **atomic number Z**",
      "The **[[so-hieu-nguyen-tu|atomic number Z]]**",
    ],
  },
  /* ---- Đợt 21/09 (4): gắn 10 mục từ của đợt soạn thứ ba -----------------
   *
   * Ba mục KHÔNG có chỗ gắn, và đó là kết quả đúng chứ không phải thiếu sót:
   *
   * - `crispr` và `ky-thuat-di-truyen`: cả hai chỉ xuất hiện trong chính bài
   *   `crispr-cay-keo-phan-tu-den-tu-vi-khuan`. Quy ước là không gắn thuật
   *   ngữ vào bài chuyên về nó.
   * - `axit-amin`: chưa bài nào trong kho nhắc tới. Mục từ vẫn đáng có, vì
   *   nó là thứ `protein` trỏ sang; nó sẽ có chỗ khi kho có bài sinh hoá.
   *
   * `he-mien-dich-nhan-dien-mot-virus-bang-cach-nao` nhận BA thuật ngữ khác
   * nhau trong một bài — đúng quy ước: giới hạn là một dấu cho mỗi THUẬT NGỮ
   * trong mỗi bài, không phải một dấu cho mỗi bài.
   */

  {
    slug: "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
    vi: ["một đoạn DNA của kẻ tấn công", "một đoạn [[DNA]] của kẻ tấn công"],
    en: ["a segment of the attacker's DNA", "a segment of the attacker's [[DNA]]"],
  },
  {
    slug: "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
    vi: ["thường tạo ra đột biến làm hỏng gene", "thường tạo ra [[đột biến]] làm hỏng gene"],
    en: [
      "often creating mutations that disrupt the gene",
      "often creating [[dot-bien|mutations]] that disrupt the gene",
    ],
  },
  {
    slug: "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    vi: ["beta-amyloid — protein tích tụ", "beta-amyloid — [[protein]] tích tụ"],
    en: [
      "beta-amyloid—a protein that accumulates",
      "beta-amyloid—a [[protein]] that accumulates",
    ],
  },
  {
    slug: "he-mien-dich-nhan-dien-mot-virus-bang-cach-nao",
    vi: ["(protein bề mặt, virus bất hoạt", "([[protein]] bề mặt, virus bất hoạt"],
    en: [
      "(surface proteins, inactivated viruses",
      "(surface [[protein|proteins]], inactivated viruses",
    ],
  },
  {
    slug: "he-mien-dich-nhan-dien-mot-virus-bang-cach-nao",
    vi: ["tái tổ hợp ngẫu nhiên các đoạn gen", "tái tổ hợp ngẫu nhiên các đoạn [[gen]]"],
  },
  {
    slug: "he-mien-dich-nhan-dien-mot-virus-bang-cach-nao",
    vi: ["sản xuất kháng thể gắn vào", "sản xuất [[kháng thể]] gắn vào"],
    en: ["produce antibodies that bind", "produce [[khang-the|antibodies]] that bind"],
  },
  {
    slug: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    vi: [
      "Một gen thành công không phải là gen",
      "Một [[gen]] thành công không phải là gen",
    ],
  },
  {
    slug: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    vi: [
      "các đột biến gây hại xuất hiện ở tuổi già",
      "các [[đột biến]] gây hại xuất hiện ở tuổi già",
    ],
  },
  {
    slug: "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung",
    vi: ["Con người không có enzyme để phân giải", "Con người không có [[enzyme]] để phân giải"],
    en: [
      "Humans lack the enzymes to break down",
      "Humans lack the [[enzyme|enzymes]] to break down",
    ],
  },
  {
    slug: "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai",
    vi: ["Tiết enzyme tiêu hóa.", "Tiết [[enzyme]] tiêu hóa."],
    en: ["Secretion of digestive enzymes.", "Secretion of digestive [[enzyme|enzymes]]."],
  },
  {
    slug: "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai",
    vi: [
      "Hiệu ứng giả dược có thể đóng một phần vai trò",
      "[[Hiệu ứng giả dược]] có thể đóng một phần vai trò",
    ],
  },
  /* ---- Đợt 24/09: quét lại toàn kho sau 17 bài mới -----------------------
   *
   * Cùng cách tìm như đợt 21/09. Những chỗ quét ra mà KHÔNG gắn:
   *
   * - "hệ quy chiếu quán tính", "lực quán tính": đã loại từ đợt trước.
   * - "Quán tính giấc ngủ" (`suc-manh-cua-giac-ngu-trua…`): sleep inertia là
   *   trạng thái lờ đờ sau khi thức dậy, không phải quán tính của vật.
   * - "gia tốc tia vũ trụ", "máy gia tốc miễn phí": động từ / ẩn dụ, không
   *   phải đại lượng gia tốc mà mục từ định nghĩa.
   * - Mọi "general"/"generate" mà máy dò khớp nhầm sang khoá `gene`.
   * - `photon` trong `photon-hat-anh-sang…`, `proton` trong `proton-co-bat-tu…`,
   *   `buc-xa-dien-tu` trong `buc-xa-dien-tu…`, hai mục tối trong bài vật chất
   *   tối–năng lượng tối: bài chuyên về chính thuật ngữ ấy.
   * - "proton–proton" (mat-troi), Vega (20-ngoi-sao), "Dark energy"
   *   (nang-luong-la-gi) [en]: đã loại từ trước, lý do ở các ghi chú trên.
   *
   * Hố đen: bản VI câu "sụp đổ sau siêu tân tinh" đã được sửa đúng nhân quả
   * ("Cú sụp đổ ấy đứng TRƯỚC vụ nổ"), nên nay gắn được. Bản EN VẪN viết
   * "collapses after a supernova" — chưa gắn, cùng lý do như ghi chú 17/09.
   */

  {
    slug: "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do",
    vi: ["đẩy chúng nổ tung thành siêu tân tinh.", "đẩy chúng nổ tung thành [[siêu tân tinh]]."],
  },
  {
    slug: "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
    vi: ["năng lượng photon thấp", "năng lượng [[photon]] thấp"],
  },
  {
    slug: "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
    vi: ["với cả ánh sáng nhìn thấy,", "với cả [[ánh sáng nhìn thấy]],"],
  },
  {
    slug: "ca-phe-va-tra-danh-thuc-nao-bo-nhu-the-nao",
    // Lần đầu tiên `axit-amin` có chỗ gắn — xem ghi chú đợt 21/09 (4).
    vi: ["một amino acid tự nhiên", "một [[amino acid]] tự nhiên"],
  },
  {
    slug: "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
    vi: ["- Photon ánh sáng.", "- [[Photon]] ánh sáng."],
  },
  {
    slug: "chung-ta-dang-song-trong-mot-bong-bong-giac-quan-nho-be-cua-thuc-tai",
    vi: ["trong toàn bộ phổ điện từ.", "trong toàn bộ [[phổ điện từ]]."],
  },
  {
    slug: "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
    vi: ["Electron, photon và các hệ lượng tử", "Electron, [[photon]] và các hệ lượng tử"],
  },
  {
    slug: "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
    vi: ["cách hàng triệu năm ánh sáng.", "cách hàng triệu [[năm ánh sáng]]."],
  },
  {
    slug: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    vi: ["Tia X, proton năng lượng cao", "Tia X, [[proton]] năng lượng cao"],
    en: ["X-rays, high-energy protons,", "X-rays, high-energy [[proton|protons]],"],
  },
  {
    slug: "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
    vi: ["**Enzyme Cas9** — protein thực hiện", "**[[Enzyme]] Cas9** — [[protein]] thực hiện"],
    en: ["**Cas9 enzyme** — a protein that", "**Cas9 [[enzyme]]** — a [[protein]] that"],
  },
  {
    slug: "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
    vi: ["vào bộ gene của mình", "vào bộ [[gene]] của mình"],
    en: ["that disrupt the gene.", "that disrupt the [[gen|gene]]."],
  },
  {
    slug: "dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi",
    vi: ["- Protein.", "- [[Protein]]."],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-hut-hang-khi-van-toc-thay-doi",
    vi: ["cảm nhận **gia tốc thẳng**", "cảm nhận **[[gia tốc]] thẳng**"],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-nang-va-nhe",
    en: ["Mass and inertia are two ways", "Mass and [[quan-tinh|inertia]] are two ways"],
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-nang-va-nhe",
    en: ["the acceleration of an object depends", "the [[gia-toc|acceleration]] of an object depends"],
  },
  {
    slug: "newton-da-giai-ma-the-gioi-nhu-the-nao",
    en: ["mass times acceleration, F = ma", "mass times [[gia-toc|acceleration]], F = ma"],
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    vi: ["các quark kết hợp thành proton và neutron", "các quark kết hợp thành [[proton]] và neutron"],
    en: ["quarks combined to form protons and neutrons", "quarks combined to form [[proton|protons]] and neutrons"],
  },
  {
    slug: "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
    vi: ["chỉ chứa khoảng vài proton hoặc nguyên tử", "chỉ chứa khoảng vài [[proton]] hoặc nguyên tử"],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    vi: ["các phản ứng nhiệt hạch biến hydro", "các [[phản ứng nhiệt hạch]] biến hydro"],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    vi: ["dưới dạng bức xạ điện từ năng lượng cao", "dưới dạng [[bức xạ điện từ]] năng lượng cao"],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    vi: ["Photon chỉ đi được một khoảng rất ngắn", "[[Photon]] chỉ đi được một khoảng rất ngắn"],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    vi: ["biến thành photon ánh sáng khả kiến", "biến thành photon [[ánh sáng khả kiến]]"],
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    vi: ["võng mạc sẽ hấp thụ nó", "[[võng mạc]] sẽ hấp thụ nó"],
  },
  {
    slug: "he-vi-sinh-duong-ruot-hang-chuc-nghin-ti-cu-dan-va-anh-huong-cua-chung",
    vi: ["nhưng số lượng gene của chúng", "nhưng số lượng [[gene]] của chúng"],
    en: ["but their gene count", "but their [[gen|gene]] count"],
  },
  {
    slug: "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    vi: ["chất dẫn truyền thần kinh, gene, môi trường", "chất dẫn truyền thần kinh, [[gene]], môi trường"],
  },
  {
    slug: "photon-hat-anh-sang-thuc-su-la-gi",
    vi: ["cho ánh sáng khả kiến truyền qua", "cho [[ánh sáng khả kiến]] truyền qua"],
  },
  {
    slug: "photon-hat-anh-sang-thuc-su-la-gi",
    vi: ["vào mắt, võng mạc biến thông tin", "vào mắt, [[võng mạc]] biến thông tin"],
  },
  {
    slug: "song-truyen-nang-luong-nhu-the-nao",
    vi: ["Sóng điện từ không cần môi trường truyền.", "[[Sóng điện từ]] không cần môi trường truyền."],
    en: ["a very thin slice of the electromagnetic spectrum.", "a very thin slice of the [[buc-xa-dien-tu|electromagnetic spectrum]]."],
  },
  {
    slug: "song-truyen-nang-luong-nhu-the-nao",
    en: ["Visible light — including", "[[anh-sang-kha-kien|Visible light]] — including"],
  },
  {
    slug: "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
    vi: ["**beta-amyloid**, protein liên quan", "**beta-amyloid**, [[protein]] liên quan"],
  },
  {
    slug: "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
    vi: ["- Proton.\n- Hạt nhân heli.", "- [[Proton]].\n- Hạt nhân heli."],
  },
  {
    slug: "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
    vi: ["- Positron.\n- Photon.", "- Positron.\n- [[Photon]]."],
  },
  {
    slug: "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang",
    en: ["the proton carries exactly that magnitude", "the [[proton]] carries exactly that magnitude"],
  },
  {
    slug: "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
    vi: ["- Từ trường.\n- Gia tốc.", "- Từ trường.\n- [[Gia tốc]]."],
  },
  {
    slug: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    vi: ["nhiều bước sóng ánh sáng khả kiến khác nhau", "nhiều bước sóng [[ánh sáng khả kiến]] khác nhau"],
  },
  {
    slug: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    vi: ["cách chúng ta hơn 4 năm ánh sáng", "cách chúng ta hơn 4 [[năm ánh sáng]]"],
  },
  {
    slug: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    vi: ["nơi mỗi photon mang theo hình ảnh", "nơi mỗi [[photon]] mang theo hình ảnh"],
  },
  {
    slug: "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
    vi: ["các thí nghiệm với photon vướng víu", "các thí nghiệm với [[photon]] vướng víu"],
  },
  {
    slug: "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
    vi: ["- DNA sao chép.", "- [[DNA]] sao chép."],
  },

  /* ---- Đợt 25/09: ba bài 24/09 và câu Vega đã sửa ------------------------
   *
   * Vega: ghi chú "KHÔNG gắn" (17/09) chờ câu được sửa. Bản VI đã đúng từ
   * trước; bản EN vừa sửa trong `add-sources-2026-09-25.ts` (12.000 năm trước
   * → 14.000). Chạy script ấy TRƯỚC, không thì neo EN không khớp.
   *
   * `vi-sao-cang-gan…`: chỗ đầu tiên là "sự giãn thời gian" — nhãn giữ nguyên
   * chữ gốc. Photon ở bài này đã là link bài, không lồng thuật ngữ vào link.
   * "được gia tốc" là động từ, không gắn (cùng lý do đợt 24/09).
   */
  {
    slug: "20-ngoi-sao-sang-nhat-bau-troi-dem",
    vi: ["do hiện tượng tiến động của trục Trái Đất", "do hiện tượng [[tiến động]] của trục Trái Đất"],
    en: ["the precession of Earth's axis", "the [[tien-dong|precession]] of Earth's axis"],
  },
  {
    slug: "vi-sao-cang-gan-toc-do-anh-sang-thoi-gian-troi-cang-cham",
    vi: ["tuân theo cùng sự giãn thời gian.", "tuân theo cùng sự [[giãn nở thời gian|giãn thời gian]]."],
  },
  /* Hai bài viết "mô-men động lượng" — alias đã có trong mục `dong-luong-goc`
   * (ghi chú của mục từ nói rõ alias ấy thêm VÌ chính hai bài này), bản EN đã
   * gắn, nhưng bản VI chưa bao giờ được gắn. Máy dò đợt trước chỉ tìm theo tên
   * mục từ, không theo alias, nên bỏ sót. */
  {
    slug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    vi: ["đó là việc truyền **mô-men động lượng**.", "đó là việc truyền **[[mô-men động lượng]]**."],
  },
  {
    slug: "sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh",
    vi: [
      "mô-men động lượng phải được bảo toàn, nên tốc độ quay tăng vọt",
      "[[mô-men động lượng]] phải được bảo toàn, nên tốc độ quay tăng vọt",
    ],
  },

  /* ---- Đợt 25/09 (2): gắn 10 mục từ đợt 4 vừa qua gate accuracy ---------
   *
   * Không gắn:
   * - "lớp phủ" ở `sao-thien-vuong…`: lớp băng siêu tới hạn của người khổng
   *   lồ băng. Mục `lop-phu` định nghĩa lớp giữa vỏ và lõi của hành tinh ĐÁ —
   *   gắn vào đây là để tooltip nói sai về chính câu nó nằm trong.
   * - "đĩa bồi tụ" ở `ho-den…`: bồi tụ vào lỗ đen. Mục `boi-tu` chỉ kể bồi tụ
   *   trong hình thành hành tinh; không phải sai, nhưng tooltip không giúp
   *   người đang đọc về lỗ đen.
   * - `sao-hoa…` [boi-tu]: cụm ấy nằm trong đoạn về Phobos/Deimos, không nói
   *   về quá trình bồi tụ.
   */
  {
    slug: "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
    vi: ["nơi đường Hoàng Đạo nằm trên thiên cầu", "nơi đường [[Hoàng Đạo]] nằm trên thiên cầu"],
  },
  {
    slug: "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
    vi: ["Nếu không có trợ giúp hấp dẫn:", "Nếu không có [[trợ giúp hấp dẫn]]:"],
  },
  {
    slug: "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
    vi: ["vuông góc với mặt phẳng Hoàng Đạo, tàu phải:", "vuông góc với mặt phẳng [[Hoàng Đạo]], tàu phải:"],
  },
  {
    slug: "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
    vi: ["> **Trợ giúp hấp dẫn (Gravity Assist / Slingshot)**", "> **[[Trợ giúp hấp dẫn]] (Gravity Assist / Slingshot)**"],
  },
  {
    slug: "cac-chom-sao-hoang-dao",
    vi: ["được gọi là **Hoàng Đạo**.", "được gọi là **[[Hoàng Đạo]]**."],
    en: ["is called the **ecliptic**.", "is called the **[[hoang-dao|ecliptic]]**."],
  },
  {
    slug: "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
    vi: ["phương Tây chia hoàng đạo thành 12 cung", "phương Tây chia [[hoàng đạo]] thành 12 cung"],
  },
  {
    slug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    vi: ["nhìn từ phía bắc hoàng đạo", "nhìn từ phía bắc [[hoàng đạo]]"],
    en: ["viewed from the north of the ecliptic", "viewed from the north of the [[hoang-dao|ecliptic]]"],
  },
  {
    slug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    vi: ["Theo mô hình bồi tụ lõi,", "Theo mô hình [[bồi tụ]] lõi,"],
    en: ["According to the core accretion model,", "According to the core [[boi-tu|accretion]] model,"],
  },
  {
    slug: "giai-ma-hanh-tinh-tu-quay-quanh-truc",
    vi: ["ma sát giữa lõi và lớp phủ", "ma sát giữa lõi và [[lớp phủ]]"],
    en: ["friction between the core and the mantle", "friction between the core and the [[lop-phu|mantle]]"],
  },
  {
    slug: "tai-sao-pluto-khong-con-la-hanh-tinh",
    vi: ["nghiêng 17 độ so với mặt phẳng hoàng đạo", "nghiêng 17 độ so với mặt phẳng [[hoàng đạo]]"],
    en: ["tilted 17 degrees relative to the ecliptic plane", "tilted 17 degrees relative to the [[hoang-dao|ecliptic]] plane"],
  },
  {
    slug: "su-ra-doi-cua-he-mat-troi",
    vi: ["gọi là **bồi tụ (accretion)**.", "gọi là **[[bồi tụ]] (accretion)**."],
    en: ["**Accretion, not ring separation.**", "**[[boi-tu|Accretion]], not ring separation.**"],
  },
  {
    slug: "sao-moc-hanh-tinh-quay-nhanh-nhat-va-chiec-phanh-vo-hinh",
    vi: ["giai đoạn **bồi tụ khí mất kiểm soát**", "giai đoạn **[[bồi tụ]] khí mất kiểm soát**"],
    en: ["a phase of **runaway gas accretion**", "a phase of **runaway gas [[boi-tu|accretion]]**"],
  },
  {
    slug: "cuc-quang-anh-sang-do-chinh-khi-quyen-trai-dat-phat-ra",
    vi: ["gọi là **gió Mặt Trời**.", "gọi là **[[gió Mặt Trời]]**."],
    en: ["called the **solar wind**.", "called the **[[gio-mat-troi|solar wind]]**."],
  },
  {
    slug: "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
    vi: ["nguyên tử bị gió mặt trời và va chạm thiên thạch", "nguyên tử bị [[gió mặt trời]] và va chạm thiên thạch"],
    en: ["stripped from its surface by solar wind", "stripped from its surface by [[gio-mat-troi|solar wind]]"],
  },
  {
    slug: "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
    vi: ["đã bóc đi phần lớn lớp phủ đá", "đã bóc đi phần lớn [[lớp phủ]] đá"],
    en: ["stripped away most of its rocky mantle", "stripped away most of its rocky [[lop-phu|mantle]]"],
  },
  {
    slug: "sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc",
    vi: ["Không còn lá chắn, gió mặt trời bào mòn", "Không còn lá chắn, [[gió mặt trời]] bào mòn"],
    en: ["Without this shield, solar wind eroded", "Without this shield, [[gio-mat-troi|solar wind]] eroded"],
  },
  {
    slug: "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
    vi: ["Từ trường này bẻ hướng gió mặt trời", "Từ trường này bẻ hướng [[gió mặt trời]]"],
  },
  {
    slug: "trai-dat-hanh-tinh-duy-nhat-ta-biet-co-su-song",
    vi: ["các mảng trượt trên lớp phủ.", "các mảng trượt trên [[lớp phủ]]."],
    en: ["plates that slide over the mantle.", "plates that slide over the [[lop-phu|mantle]]."],
  },
  {
    slug: "cau-truc-ben-trong-trai-dat",
    vi: ["xuyên qua nổi ranh giới vỏ–manti.", "xuyên qua nổi ranh giới vỏ–[[manti]]."],
    en: ["pierced the crust–mantle boundary.", "pierced the crust–[[lop-phu|mantle]] boundary."],
  },
  {
    slug: "vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi",
    vi: ["là **hồi hải mã (Hippocampus)**.", "là **[[hồi hải mã]] (Hippocampus)**."],
  },
  {
    slug: "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    vi: ["1. Ban ngày, hải mã ghi nhận", "1. Ban ngày, [[hồi hải mã|hải mã]] ghi nhận"],
    en: ["1. During the day, the hippocampus records", "1. During the day, the [[hoi-hai-ma|hippocampus]] records"],
  },
  {
    slug: "thoi-gian-duoi-goc-nhin-luong-tu-vu-tru-co-thuc-su-troi",
    vi: ["Một lời giải quan trọng đến từ **entropy**.", "Một lời giải quan trọng đến từ **[[entropy]]**."],
  },
  {
    slug: "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
    vi: ["đi ngược chiều tăng entropy của tự nhiên", "đi ngược chiều tăng [[entropy]] của tự nhiên"],
    en: ["the direction of increasing entropy in nature", "the direction of increasing [[entropy]] in nature"],
  },
  {
    slug: "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
    vi: ["- **Nhịp sinh học** khiến mức tỉnh táo", "- **[[Nhịp sinh học]]** khiến mức tỉnh táo"],
  },
  {
    slug: "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    vi: ["làm lệch nhịp sinh học, tương tự lệch múi giờ", "làm lệch [[nhịp sinh học]], tương tự lệch múi giờ"],
    en: ["disrupt the circadian rhythm, similar to jet lag", "disrupt the [[nhip-sinh-hoc|circadian rhythm]], similar to jet lag"],
  },
  {
    slug: "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
    vi: ["thay đổi theo nhịp sinh học.", "thay đổi theo [[nhịp sinh học]]."],
  },
  {
    slug: "nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao",
    vi: ["các thành phần đồng hồ sinh học", "các thành phần [[đồng hồ sinh học]]"],
    en: ["also have their own circadian rhythms.", "also have their own [[nhip-sinh-hoc|circadian rhythms]]."],
  },
  {
    slug: "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
    vi: ["hơi nước lại là khí nhà kính mạnh", "hơi nước lại là [[khí nhà kính]] mạnh"],
    en: ["water vapor is itself a potent greenhouse gas", "water vapor is itself a potent [[khi-nha-kinh|greenhouse gas]]"],
  },
  {
    slug: "nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh",
    vi: ["Cả hai đều là khí nhà kính.", "Cả hai đều là [[khí nhà kính]]."],
  },
  {
    slug: "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
    vi: ["**CO₂ và khí nhà kính.**", "**CO₂ và [[khí nhà kính]].**"],
    en: ["**CO₂ and greenhouse gases.**", "**CO₂ and [[khi-nha-kinh|greenhouse gases]].**"],
  },
  {
    slug: "hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau",
    vi: ["Trong một sự kiện El Niño, gió mậu dịch", "Trong một sự kiện [[El Niño]], gió mậu dịch"],
  },
  /* ---- Đợt 25/09 (3): gắn 10 mục từ đợt 5 cho 12 bài chưa có tooltip ----
   *
   * Chỉ gắn vào đúng 12 bài ấy — mục `luc-hap-dan` xuất hiện ở hơn 30 bài,
   * gắn đại trà thuộc một lượt quét riêng, không thuộc lượt phủ bài trống.
   *
   * Không gắn:
   * - "hấp dẫn" ở `neu-phai-roi…`: mọi chỗ đều là tính từ ("ứng viên hấp dẫn").
   * - Bản EN của `nhat-thuc…`: "the shadow area is very narrow" không nói
   *   umbra; bản VI viết "vùng bóng tối" nên gắn được.
   * - Bài `nguyen-nhan-cua-mua…` là bài VỀ độ nghiêng trục, nên gắn điểm chí
   *   chứ không gắn thứ bài đang giải thích.
   */
  {
    slug: "newton-da-giai-ma-the-gioi-nhu-the-nao",
    vi: ["> Mọi vật có khối lượng đều hút nhau bằng lực hấp dẫn.", "> Mọi vật có khối lượng đều hút nhau bằng [[lực hấp dẫn]]."],
    en: ["his theory of universal gravitation", "his theory of [[luc-hap-dan|universal gravitation]]"],
  },
  {
    slug: "runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan",
    vi: ["sở hữu **hệ endocannabinoid (ECS)**", "sở hữu **[[hệ endocannabinoid]] (ECS)**"],
  },
  {
    slug: "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
    vi: ["Các hang và **ống dung nham** dưới bề mặt", "Các hang và **[[ống dung nham]]** dưới bề mặt"],
  },
  {
    slug: "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    vi: ["Nhưng ở đâu đó trên hành trình tiến hóa,", "Nhưng ở đâu đó trên hành trình [[tiến hóa]],"],
  },
  {
    slug: "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
    vi: ["Nguyên nhân chính của thủy triều là lực hấp dẫn của", "Nguyên nhân chính của thủy triều là [[lực hấp dẫn]] của"],
    en: ["The primary cause of tides is the gravitational pull of", "The primary cause of tides is the [[luc-hap-dan|gravitational pull]] of"],
  },
  {
    slug: "sao-thien-vuong-hanh-tinh-lan-nghieng-tren-quy-dao",
    vi: ['được xếp riêng là "người khổng lồ băng".', 'được xếp riêng là "[[người khổng lồ băng]]".'],
    en: ['classified separately as "ice giants."', 'classified separately as "[[nguoi-khong-lo-bang|ice giants]]."'],
  },
  {
    slug: "nang-luong-la-gi",
    vi: ["Đơn vị SI của năng lượng là **joule (J)**.", "Đơn vị SI của năng lượng là **[[joule]] (J)**."],
    en: ["The SI unit of energy is the **joule** (symbol J).", "The SI unit of energy is the **[[joule]]** (symbol J)."],
  },
  {
    slug: "nguyen-nhan-cua-mua-do-nghieng-truc-khong-phai-khoang-cach",
    vi: ["Ngày hạ chí là thời điểm Bắc bán cầu", "Ngày [[hạ chí]] là thời điểm Bắc bán cầu"],
    en: ["The summer solstice is the time when", "The summer [[diem-chi|solstice]] is the time when"],
  },
  {
    slug: "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
    vi: ["**phì đại bệnh lý** do tăng huyết áp:", "**phì đại bệnh lý** do [[tăng huyết áp]]:"],
  },
  {
    slug: "nhat-thuc-va-nguyet-thuc-hai-hien-tuong-che-khuat-khong-doi-xung",
    vi: ["nên vùng bóng tối rất hẹp.", "nên [[vùng bóng tối]] rất hẹp."],
  },
  {
    slug: "sao-tho-vanh-dai-mong-manh-va-ve-tinh-co-dai-duong",
    vi: ["Một dòng tia khí quyển ổn định", "Một [[dòng tia]] khí quyển ổn định"],
    en: ["A stable atmospheric jet stream", "A stable atmospheric [[dong-tia|jet stream]]"],
  },
  {
    slug: "sao-moc-nguoi-khong-lo-khi-va-tam-khien-cua-he",
    vi: ["Lực hấp dẫn của Sao Mộc định hình", "[[Lực hấp dẫn]] của Sao Mộc định hình"],
    en: ["Jupiter's gravity shapes", "Jupiter's [[luc-hap-dan|gravity]] shapes"],
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
