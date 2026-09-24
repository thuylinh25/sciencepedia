import { PrismaClient } from "@prisma/client";

/**
 * Bổ sung mục "Đọc thêm" cho bài thiếu link nội bộ.
 *
 *   npm run links:reading              # in kế hoạch, KHÔNG ghi gì
 *   npm run links:reading -- --write   # thực thi
 *
 * ## Vì sao là mục Đọc thêm chứ không phải link giữa câu
 *
 * `add-backlinks.ts` nhồi link vào giữa câu, và nó phải neo theo ngữ cảnh rất
 * chặt vì khớp nhầm là tạo ra một link SAI NGHĨA (ghi chú trong file ấy kể
 * đúng một lần suýt xảy ra: "năng lượng" trong bài Big Bang đều là "năng
 * lượng tối"). Cách ấy đắt và chỉ đáng khi câu văn thật sự cần một lối rẽ.
 *
 * Ở đây bài toán khác: 20 bài không có link nào, và ~50 bài còn lại đều đã có
 * mục "## Đọc thêm" ở cuối. Thiếu mục ấy là thiếu một phần của khuôn bài, nên
 * bù đúng phần ấy vừa rẻ vừa đúng kiểu nhà — và không có rủi ro đổi nghĩa câu
 * nào, vì không câu nào bị đụng tới.
 *
 * ## Vì sao đích được chọn tay, không sinh tự động
 *
 * "Bài liên quan" tính bằng thẻ hay danh mục sẽ cho ra những gợi ý đúng loại
 * nhưng vô duyên. Mỗi dòng dưới đây kèm `why` — vì sao người vừa đọc xong bài
 * NÀY lại muốn đọc bài KIA. Chỗ nào không trả lời được câu đó thì không thêm.
 *
 * Ưu tiên đích là bài đang MỒ CÔI (chưa ai trỏ vào) khi nó thật sự liên quan:
 * một liên kết giải quyết được hai đầu.
 */
const prisma = new PrismaClient();

type Plan = { slug: string; to: string[]; why: string };

const PLANS: Plan[] = [
  // ---- Vũ trụ và vật lý ----
  {
    slug: "ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no",
    to: [
      "ngoi-sao-cau-tao-va-vong-doi",
      "su-ra-doi-cua-he-mat-troi",
      "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    ],
    why: "Bài dựng trên ba bước: nguyên tố sinh ra trong sao, tro tàn sao thành Hệ Mặt Trời, vật chất ấy thành ý thức. Mỗi đích là một bước được kể đầy đủ.",
  },
  {
    slug: "bi-mat-dang-sau-cam-giac-nang-va-nhe",
    to: [
      "newton-da-giai-ma-the-gioi-nhu-the-nao",
      "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
      "tu-truong-va-luc-hap-dan-hai-luc-vo-hinh-hai-co-che-khac-nhau",
    ],
    why: "Khối lượng–trọng lượng–quán tính là bộ ba của Newton; phần ISS 'không trọng lượng' nối thẳng sang bài quỹ đạo; và hấp dẫn là lực đang được nói tới suốt bài.",
  },
  {
    slug: "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
    to: [
      "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
      "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
      "thien-ha-dinh-nghia-va-cach-phan-loai",
    ],
    why: "Void hình thành từ thăng giáng mật độ thuở sơ khai (Big Bang), khung mạng nhện do vật chất tối dựng, và thứ đếm được bên trong void là thiên hà.",
  },
  {
    slug: "nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha",
    to: [
      "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
      "sao-choi-nguon-goc-cau-tao-va-so-phan",
      "thien-ha-dinh-nghia-va-cach-phan-loai",
    ],
    why: "Bài đặt giả thuyết thiên văn cho đại tuyệt chủng: một lần tuyệt chủng được kể kỹ, cơ chế mưa sao chổi từ Đám mây Oort, và cấu trúc Ngân Hà mà Hệ Mặt Trời đi xuyên qua.",
  },
  {
    slug: "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
    to: [
      "nguyen-tu-cau-tao-nen-van-vat",
      "ngoi-sao-cau-tao-va-vong-doi",
      "ho-den-noi-hinh-hoc-cua-khong-gian-sup-do",
    ],
    why: "Proton là hạt trong hạt nhân (bài nguyên tử); phần 'xác sao' cần bài vòng đời sao; và lỗ đen là thứ sống sót sau cùng trong kịch bản bài vẽ ra.",
  },
  {
    slug: "su-ra-doi-cua-he-mat-troi",
    to: [
      "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
      "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
      "ba-dinh-luat-kepler-hanh-tinh-chuyen-dong-theo-quy-luat-nao",
    ],
    why: "Ba thứ bài này giải thích nguồn gốc: các hành tinh thành hình, ngôi sao ở tâm, và quy luật chi phối quỹ đạo chúng.",
  },
  {
    slug: "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
    to: [
      "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
      "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
      "ba-dinh-luat-kepler-hanh-tinh-chuyen-dong-theo-quy-luat-nao",
    ],
    why: "Trợ giúp hấp dẫn chỉ hiểu được khi biết vì sao không bay thẳng được, hành tinh nào đứng ở đâu để mà 'đi ké', và quỹ đạo tuân luật gì.",
  },
  {
    slug: "vi-sao-tau-khong-gian-khong-the-bay-thang-dung",
    to: [
      "tuyet-ky-di-ke-hanh-tinh-cach-tau-vu-tru-bay-hang-ty-kilomet-ma-khong-ton-them-nhien-lieu",
      "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
      "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
    ],
    why: "Bài kết luận phải bay ngang và không có hành tinh để 'đi ké' — đúng hai bài kia; và 30 km/s của Trái Đất là chuyển động bài đầu tiên nói tới.",
  },
  {
    slug: "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
    to: [
      "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
      "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
      "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao",
    ],
    why: "Phần giãn nở tăng tốc dựa vào quan sát siêu tân tinh xa — tức là cần bài thang khoảng cách để biết đo thế nào, bài năng lượng tối để biết ai gây ra, và Big Bang để biết bắt đầu từ đâu.",
  },
  {
    slug: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    to: ["vi-sao-tau-khong-gian-khong-the-bay-thang-dung"],
    why: "Bù chỗ mục Đọc thêm bị gỡ (bài chân không vũ trụ không còn tồn tại). Bài này nói về con người trong môi trường ấy; lối rẽ tự nhiên là cách đưa người lên đó.",
  },
  {
    slug: "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh",
    to: ["thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao"],
    why: "Bù chỗ mục Đọc thêm bị gỡ. JWST nhìn ngược thời gian bằng dịch chuyển đỏ — thang khoảng cách là bài giải thích chính cơ chế ấy.",
  },

  // ---- Sự sống, cơ thể, nhận thức ----
  {
    slug: "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    to: [
      "su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian",
      "crispr-cay-keo-phan-tu-den-tu-vi-khuan",
      "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    ],
    why: "Bài lập luận bằng tiến hoá: cần dòng thời gian sự sống, công cụ đang can thiệp vào chính bộ gen ấy, và cái giá tiến hoá khác mà loài người phải trả.",
  },
  {
    slug: "chung-ta-dang-song-trong-mot-bong-bong-giac-quan-nho-be-cua-thuc-tai",
    to: [
      "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
      "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    ],
    why: "Luận điểm trung tâm — não dựng mô hình thực tại chứ không chép lại nó — được kể chi tiết ở bài về mắt; hai bài kia là tầng ý thức và tầng hoá học bên dưới.",
  },
  {
    slug: "huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai",
    to: [
      "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
      "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
    ],
    why: "Bài cân giữa bằng chứng và niềm tin: bài chiêm tinh là cùng một phép cân; cơ chế giảm đau bài nêu là chuyện chất dẫn truyền thần kinh; và mạch máu là hệ bài nói tới ở phần vùng châm nóng lên.",
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    to: [
      "chung-ta-dang-song-trong-mot-bong-bong-giac-quan-nho-be-cua-thuc-tai",
      "song-truyen-nang-luong-nhu-the-nao",
      "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    ],
    why: "Bài mở bằng 'ánh sáng thực chất là gì' — tức là sóng; kết bằng 'não nhìn hay mắt nhìn' — tức là ý thức; và bong bóng giác quan là cùng một luận điểm ở quy mô mọi loài.",
  },
  {
    slug: "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
    to: [
      "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
      "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
      "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai",
    ],
    why: "Ba lối vào cùng câu hỏi: ý thức dựng ra cái ta thấy, ý thức tắt được bằng thuốc, và ý thức là một đánh đổi tiến hoá như cái chết.",
  },
  {
    slug: "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
    to: [
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
      "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
      "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    ],
    why: "Dopamine là một trong các sứ giả hoá học; GABA là mặt đối lập (phanh so với ga); và giấc ngủ là thứ vòng lặp phần thưởng phá hỏng trước tiên.",
  },
  {
    slug: "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
    to: [
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
      "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
      "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    ],
    why: "Cặp đối xứng với bài dopamine, đặt trong khung chung của các chất dẫn truyền, và GABA là chất chi phối giấc ngủ sâu.",
  },
  {
    slug: "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    to: [
      "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
      "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
      "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai",
    ],
    why: "Bài tổng quan nên trỏ tới hai chất đã có bài riêng, và tới nơi phần lớn serotonin thực sự được sản xuất.",
  },
  {
    slug: "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
    to: [
      "y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa",
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
      "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    ],
    why: "Gây mê là phép thử tự nhiên cho câu hỏi ý thức là gì; nó tác động qua chính các thụ thể của chất dẫn truyền; và nó KHÁC giấc ngủ — một hiểu nhầm phổ biến.",
  },

  // ---- Bù link VÀO cho bài mồ côi, từ bài đã có mục Đọc thêm ----
  {
    slug: "toan-canh-dac-diem-8-hanh-tinh-he-mat-troi",
    to: [
      "sao-thuy-the-gioi-da-bi-nung-va-dong-bang-cung-luc",
      "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
      "sao-hai-vuong-hanh-tinh-tim-ra-bang-toan-hoc",
      "tai-sao-pluto-khong-con-la-hanh-tinh",
    ],
    why: "Bài tổng quan 8 hành tinh mà không trỏ tới bài riêng của từng hành tinh thì người đọc hết bài là hết đường đi. Bốn bài này hiện không ai trỏ vào.",
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    to: [
      "vu-tru-khong-bao-gio-dung-yen-chuyen-dong-la-trang-thai-tu-nhien-cua-moi-thu",
      "giai-ma-nhung-khoang-trong-rong-voids-trong-vu-tru",
    ],
    why: "Giãn nở và cấu trúc lớn của vũ trụ là hai phần bài Big Bang chỉ nói lướt; cả hai bài đích đang mồ côi.",
  },
  {
    slug: "ngoi-sao-cau-tao-va-vong-doi",
    to: ["ban-khong-chi-song-trong-vu-tru-ban-la-mot-phan-cua-no"],
    why: "Bài vòng đời sao kết ở chỗ nguyên tố nặng phát tán vào không gian; bài đích kể tiếp chúng đi vào cơ thể người.",
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    to: ["proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra"],
    why: "Bài nguyên tử khẳng định proton là thứ định danh nguyên tố; bài đích hỏi nếu chính nó phân rã thì sao.",
  },
  {
    slug: "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
    to: ["nhung-lan-dai-tuyet-chung-co-lien-quan-toi-hanh-trinh-cua-he-mat-troi-trong-ngan-ha"],
    why: "Một lần tuyệt chủng cụ thể, nối sang câu hỏi liệu các lần tuyệt chủng có chu kỳ thiên văn hay không.",
  },
  {
    slug: "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
    to: ["huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai"],
    why: "Cùng một phép cân bằng chứng trên một hệ niềm tin cổ truyền, nhưng ra kết luận khác — đối chiếu được.",
  },

  /* ---- Đợt 24/09: 17 bài mới không có link nào, ra lẫn vào ---------------
   *
   * Cả 17 bài đều chưa có bản tiếng Anh, nên chỉ danh sách tiếng Việt đổi.
   * Nửa đầu cho mỗi bài mới một mục Đọc thêm; phần lớn đích là chính các bài
   * mới với nhau, vì chúng đến theo cụm (lượng tử, ánh sáng, giấc ngủ, khí
   * hậu). Nửa sau bù link VÀO từ bài cũ cho những bài mà trong cụm không ai
   * trỏ tới — nếu không, cụm ấy chỉ trỏ quanh nhau và vẫn cô lập với kho. */

  // ---- Lượng tử ----
  {
    slug: "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
    to: [
      "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
      "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
      "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
      "photon-hat-anh-sang-thuc-su-la-gi",
    ],
    why: "Bài tổng quan lướt qua bốn thứ mà mỗi thứ đã có bài riêng: chồng chập, cuộc tranh luận vướng víu của Einstein, các ứng dụng, và photon ở phần lưỡng tính sóng–hạt.",
  },
  {
    slug: "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
    to: [
      "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
      "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
      "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
    ],
    why: "Lùi ra bức tranh chung của cơ học lượng tử; đi tiếp sang qubit và QKD mà bài chỉ nêu tên; và con mèo Schrödinger là cùng một mối hoài nghi với câu 'Chúa không chơi xúc xắc'.",
  },
  {
    slug: "ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai",
    to: [
      "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
      "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
      "tu-electron-den-dong-dien-nguon-goc-cua-dien-nang",
    ],
    why: "Mỗi ứng dụng dựa trên một nguyên lý kể ở bài tổng quan; máy tính lượng tử dựa hẳn vào chồng chập; và transistor là chuyện electron dẫn điện trong vật liệu.",
  },
  {
    slug: "vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac",
    to: [
      "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
      "chong-chap-luong-tu-khi-mot-hat-co-the-ton-tai-trong-nhieu-trang-thai",
      "thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi",
    ],
    why: "Thứ Einstein phản đối được giải thích ở hai bài lượng tử; và 'không gì nhanh hơn ánh sáng' — tiền đề của nghịch lý EPR — là của thuyết tương đối hẹp, cũng của chính ông.",
  },

  // ---- Ánh sáng và bức xạ ----
  {
    slug: "photon-hat-anh-sang-thuc-su-la-gi",
    to: [
      "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
      "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
      "co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat",
    ],
    why: "E = hf nối photon với cả phổ điện từ; bài hành trình kể một photon cụ thể sinh ra và thoát khỏi Mặt Trời; và câu hỏi 'sóng hay hạt' là cửa vào cơ học lượng tử.",
  },
  {
    slug: "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
    to: [
      "photon-hat-anh-sang-thuc-su-la-gi",
      "song-truyen-nang-luong-nhu-the-nao",
      "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    ],
    why: "Phần bước sóng–tần số–năng lượng là chuyện năng lượng mỗi photon; sóng điện từ là một loại sóng trong bài sóng; và màu trời là ví dụ đời thường nhất của việc bước sóng quyết định cách ánh sáng tương tác.",
  },
  {
    slug: "hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat",
    to: [
      "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
      "photon-hat-anh-sang-thuc-su-la-gi",
      "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    ],
    why: "Ba chặng của chính hành trình ấy: lò phản ứng nơi năng lượng sinh ra, bản chất thứ đang đi, và võng mạc nơi bài kết thúc.",
  },
  {
    slug: "vi-sao-bau-troi-xanh-hoang-hon-do-va-may-lai-trang",
    to: [
      "buc-xa-dien-tu-tu-song-radio-den-tia-gamma",
      "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
      "thang-khoang-cach-vu-tru-do-toi-sao-va-thien-ha-bang-cach-nao",
    ],
    why: "Tán xạ Rayleigh là chuyện bước sóng; 'vì sao trời không tím' là chuyện độ nhạy của mắt; và phần bầu trời đêm là cửa sổ quá khứ cần biết ta đo khoảng cách tới sao thế nào.",
  },
  {
    slug: "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
    to: [
      "cuc-quang-anh-sang-do-chinh-khi-quyen-trai-dat-phat-ra",
      "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
      "ngoi-sao-cau-tao-va-vong-doi",
    ],
    why: "Từ trường Trái Đất lái hạt mang điện — cũng là thứ tạo ra cực quang; bức xạ với phi hành gia được kể ở bài cơ thể người ngoài không gian; và tàn dư siêu tân tinh là một nguồn bài nêu.",
  },

  // ---- Giấc ngủ, não và cơ thể ----
  {
    slug: "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
    to: [
      "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
      "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
      "he-mien-dich-nhan-dien-mot-virus-bang-cach-nao",
    ],
    why: "Bài liệt kê thứ mất đi khi thiếu ngủ; giấc ngủ sâu là thứ mất đi đầu tiên, ngủ trưa là cách vá tạm, và phần miễn dịch cần biết hệ ấy vốn làm việc thế nào.",
  },
  {
    slug: "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
    to: [
      "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
      "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
      "ca-phe-va-tra-danh-thuc-nao-bo-nhu-the-nao",
    ],
    why: "Bài kết rằng ngủ trưa không thay được giấc đêm — bài thiếu ngủ kể vì sao; quán tính giấc ngủ là chuyện bị đánh thức giữa giấc ngủ sâu; và cà phê là cách chống cơn buồn ngủ trưa còn lại.",
  },
  {
    slug: "ca-phe-va-tra-danh-thuc-nao-bo-nhu-the-nao",
    to: [
      "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
      "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
    ],
    why: "Caffeine chỉ che áp lực giấc ngủ; bài kết đúng câu 'thứ cơ thể cần là giấc ngủ đủ'; và adenosine là một trong các tín hiệu hoá học của não.",
  },
  {
    slug: "runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan",
    to: [
      "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
      "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
      "dopamine-va-chiec-bay-khien-ban-khong-the-roi-dien-thoai",
    ],
    why: "Cùng một buổi chạy nhìn từ tim mạch; endocannabinoid là một nhóm tín hiệu hoá học của não; và dopamine là hệ phần thưởng mà cảm giác 'phê' hay bị nhầm sang.",
  },
  {
    slug: "dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi",
    to: [
      "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai",
      "nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao",
      "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
    ],
    why: "Trục não–ruột là khung của cả bài; nhịn ăn gián đoạn là chuyện kéo dài cái khoảng giữa bữa mà MMC hoạt động; và thiếu ngủ làm lệch chính ghrelin và leptin.",
  },

  // ---- Khí hậu và Hệ Mặt Trời ----
  {
    slug: "hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau",
    to: [
      "nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh",
      "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
      "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
    ],
    why: "Bài tách El Niño khỏi biến đổi khí hậu — bài 1,5°C là phía bên kia; gió và hải lưu là bộ máy mà El Niño làm lệch; và hiệu ứng nhà kính là nguyên nhân thật của xu hướng ấm lên dài hạn.",
  },
  {
    slug: "nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh",
    to: [
      "hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau",
      "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
      "dai-tuyet-chung-permi-lan-su-song-suyt-bien-mat",
    ],
    why: "El Niño cộng lên xu hướng ấm lên thành các năm kỷ lục; Sao Kim là phản hồi dương đi tới tận cùng; và Permi là lần Trái Đất nóng lên nhanh gần nhất mà sự sống suýt không qua.",
  },
  {
    slug: "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
    to: [
      "mat-trang",
      "sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc",
      "sao-tho-vanh-dai-mong-manh-va-ve-tinh-co-dai-duong",
      "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    ],
    why: "Ba điểm đến đầu bảng xếp hạng — Mặt Trăng, Sao Hoả, và Sao Thổ của Titan và Enceladus — đều có bài riêng; và mọi phương án đều vấp cùng một câu hỏi cơ thể người chịu nổi không.",
  },

  // ---- Bù link VÀO cho cụm mới, từ bài cũ ----
  {
    slug: "ruot-he-vi-sinh-vat-va-quyen-luc-cua-bo-nao-thu-hai",
    to: ["dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi"],
    why: "Bài 'bộ não thứ hai' nói ruột gửi tín hiệu lên não; bài đích là tín hiệu quen nhất trong số đó — cơn đói.",
  },
  {
    slug: "nhin-an-gian-doan-anh-huong-toi-he-vi-sinh-duong-ruot-nhu-the-nao",
    to: ["dang-sau-tieng-bung-keu-dieu-gi-xay-ra-khi-chung-ta-doi"],
    why: "Người nhịn ăn gián đoạn sẽ gặp bụng kêu và cơn đói nhiều hơn ai hết; bài đích giải thích chúng và trả lời câu 'axit có ăn mòn dạ dày không'.",
  },
  {
    slug: "sao-hoa-hanh-tinh-do-va-cau-hoi-ve-nuoc",
    to: ["neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi"],
    why: "Nước trên Sao Hoả là tiền đề của mọi kế hoạch định cư; bài đích đặt Sao Hoả cạnh các lựa chọn khác và cân nó.",
  },
  {
    slug: "co-the-nguoi-bien-doi-the-nao-ngoai-vu-tru-khong-bao-ho",
    to: [
      "neu-phai-roi-trai-dat-con-nguoi-co-the-song-o-dau-trong-he-mat-troi",
      "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
    ],
    why: "Bài kể cơ thể chịu gì ngoài không gian; hai lối rẽ là chịu điều đó ở đâu lâu dài, và chính nguồn bức xạ bài nêu.",
  },
  {
    slug: "cuc-quang-anh-sang-do-chinh-khi-quyen-trai-dat-phat-ra",
    to: ["tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay"],
    why: "Cực quang là hạt mang điện từ Mặt Trời bị từ trường lái xuống; tia vũ trụ là những hạt năng lượng cao hơn nhiều bị chính tấm khiên ấy chặn.",
  },
  {
    slug: "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
    to: ["runners-high-vi-sao-chay-bo-co-the-khien-ban-hung-phan"],
    why: "Cùng một buổi vận động sức bền, nhìn từ não thay vì từ tim.",
  },
  {
    slug: "mat-troi-lo-phan-ung-giu-ca-he-hanh-tinh",
    to: ["hanh-trinh-cua-photon-chuyen-di-100000-nam-tu-loi-mat-troi-den-trai-dat"],
    why: "Bài Mặt Trời nhắc photon sinh ra ở lõi mất rất lâu mới ra tới bề mặt; bài đích kể trọn hành trình đó.",
  },
  {
    slug: "mat-khong-thuc-su-nhin-nao-bo-tao-ra-hinh-anh-nhu-the-nao",
    to: ["photon-hat-anh-sang-thuc-su-la-gi"],
    why: "Bài mở bằng câu hỏi ánh sáng thực chất là gì và gọi tên photon; bài đích trả lời câu ấy đầy đủ.",
  },
  {
    slug: "song-truyen-nang-luong-nhu-the-nao",
    to: ["buc-xa-dien-tu-tu-song-radio-den-tia-gamma"],
    why: "Bài sóng nói ánh sáng chỉ là lát mỏng của phổ điện từ; bài đích đi hết cả phổ.",
  },
  {
    slug: "nguyen-tu-cau-tao-nen-van-vat",
    to: ["co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat"],
    why: "Electron trong nguyên tử không đi theo quỹ đạo cổ điển; bài đích là quy luật thật mà nó tuân theo.",
  },
  {
    slug: "thuyet-tuong-doi-hep-khi-thoi-gian-khong-con-tuyet-doi",
    to: ["vi-sao-einstein-noi-chua-khong-choi-tro-xuc-xac"],
    why: "Cùng một Einstein, ở phía cuộc cách mạng mà ông không chấp nhận.",
  },
  {
    slug: "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    to: [
      "thieu-ngu-khoan-no-the-chap-bang-suc-khoe-va-tuong-lai",
      "suc-manh-cua-giac-ngu-trua-ngan-vi-sao-20-phut-co-the-giup-nao-tinh-tao-hon",
    ],
    why: "Bài giấc ngủ sâu nói nó làm gì; hai bài đích nói điều gì xảy ra khi thiếu nó, và vì sao ngủ trưa nên tránh rơi vào nó.",
  },
  {
    slug: "dieu-gi-tao-ra-gio-thuy-trieu-va-cac-dong-hai-luu",
    to: ["hien-tuong-el-nino-khi-dai-duong-noi-gian-va-dao-lon-khi-hau-toan-cau"],
    why: "Bài nói gió mậu dịch và hải lưu vận hành thế nào; El Niño là lúc bộ máy ấy chệch khỏi bình thường.",
  },
  {
    slug: "sao-kim-bai-hoc-ve-hieu-ung-nha-kinh-mat-kiem-soat",
    to: ["nghich-ly-15-do-c-tai-sao-mot-thay-doi-nho-lai-quyet-dinh-so-phan-hanh-tinh"],
    why: "'Bài học' của Sao Kim là bài học cho Trái Đất; bài đích là phiên bản đo được của bài học ấy ở từng nửa độ.",
  },
];

/* Chỗ này từng có một danh sách chặn tay.
 *
 * `giai-ma-nhung-khoang-trong-rong-voids` có `titleEn` và `contentEn` là nội
 * dung của một bài KHÁC (chân không vũ trụ), nên nó bị chặn khỏi mọi danh
 * sách tiếng Anh. Ngày 21/09 chủ kho quyết gỡ hẳn bản tiếng Anh sai ấy khỏi
 * CSDL — văn bản lưu ở `content/salvage/khong-gian-vu-tru-chan-khong.md`.
 *
 * Bài nay không có bản tiếng Anh nào, nên luật chung bên dưới ("chỉ nhận đích
 * CÓ bản tiếng Anh thật") đã phủ đúng trường hợp này. Danh sách chặn tay bị
 * gỡ chứ không giữ lại rỗng: để nguyên thì ngày ai đó dịch bài tử tế, nó vẫn
 * âm thầm chặn.
 */

/** Đầu đề mục Đọc thêm đang dùng trong kho, cả hai ngôn ngữ. */
const HEADING_RE = /^##\s+(Đọc thêm|Read more|Read More|Further reading|Further Reading)\s*$/im;

function addItems(body: string, items: string[], newHeading: string) {
  const match = HEADING_RE.exec(body);
  if (!match) {
    return `${body.trimEnd()}\n\n${newHeading}\n\n${items.join("\n")}\n`;
  }
  // Chèn vào CUỐI danh sách hiện có, không chèn ngay sau đầu đề: thứ tự cũ là
  // thứ tự biên tập viên đã chọn, mục mới là mục bổ sung nên đứng sau.
  const afterHeading = match.index + match[0].length;
  const rest = body.slice(afterHeading);
  const lines = rest.split("\n");
  let last = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*[-*]\s+\[/.test(lines[i])) last = i;
    else if (lines[i].trim() !== "" && last > 0) break;
  }
  lines.splice(last + 1, 0, ...items);
  return body.slice(0, afterHeading) + lines.join("\n");
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  // `--show=<slug>`: in 400 ký tự cuối của bài đó sau khi sửa, để soi markdown
  // sinh ra trước khi ghi. Chèn vào giữa một danh sách có sẵn là chỗ dễ hỏng.
  const showSlug = process.argv.find((a) => a.startsWith("--show="))?.slice(7);

  const all = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, titleEn: true, content: true, contentEn: true },
  });
  const bySlug = new Map(all.map((a) => [a.slug, a]));

  let changedArticles = 0;
  let changedLinks = 0;

  for (const plan of PLANS) {
    const article = bySlug.get(plan.slug);
    if (!article) {
      throw new Error(`Bài không tồn tại hoặc chưa xuất bản: ${plan.slug}`);
    }
    for (const target of plan.to) {
      if (!bySlug.has(target)) throw new Error(`Đích không hợp lệ: ${target}`);
      if (target === plan.slug) throw new Error(`Bài tự trỏ vào mình: ${target}`);
    }

    console.log(`\n${plan.slug}`);
    console.log(`   ${plan.why}`);

    const data: Record<string, string> = {};

    for (const field of ["content", "contentEn"] as const) {
      const body = article[field];
      if (!body) continue;

      let wanted = plan.to.filter((t) => !body.includes(`/articles/${t})`));

      if (field === "contentEn") {
        /* Danh sách tiếng Anh chỉ nhận đích CÓ bản tiếng Anh thật. 15/73 bài
           chưa dịch: chèn nhãn tiếng Việt vào danh sách tiếng Anh vừa xấu vừa
           hứa hão — bấm vào là rơi vào một trang tiếng Việt. */
        wanted = wanted.filter((t) => {
          const target = bySlug.get(t)!;
          if (!target.titleEn || !target.contentEn) {
            console.log(`   contentEn: BỎ ${t} — chưa có bản tiếng Anh`);
            return false;
          }
          return true;
        });
      }

      if (wanted.length === 0) {
        console.log(`   ${field}: không thêm gì`);
        continue;
      }

      const items = wanted.map((t) => {
        const target = bySlug.get(t)!;
        const label = field === "content" ? target.title : target.titleEn!;
        return `- [${label}](/articles/${t})`;
      });

      const next = addItems(body, items, field === "content" ? "## Đọc thêm" : "## Further reading");
      data[field] = next;
      changedLinks += items.length;
      for (const item of items) console.log(`   ${field}: ${item}`);
    }

    if (showSlug === plan.slug && data.content) {
      console.log("   ----- 400 ký tự cuối sau khi sửa -----");
      console.log(data.content.slice(-400));
      console.log("   --------------------------------------");
    }

    if (Object.keys(data).length === 0) continue;
    changedArticles += 1;
    // Hai kế hoạch cùng một bài: kế hoạch sau phải thấy bản đã sửa của kế hoạch
    // trước, không thì lượt ghi thứ hai đè mất mục Đọc thêm vừa thêm.
    const revisionContent = article.content;
    Object.assign(article, data);
    if (!write) continue;

    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: revisionContent,
          note: "Trước khi bổ sung mục Đọc thêm",
        },
      }),
      prisma.article.update({ where: { id: article.id }, data }),
    ]);
    console.log("   ĐÃ GHI (kèm revision)");
  }

  console.log(
    `\n${changedLinks} link trên ${changedArticles} bài.` +
      (write ? "" : " Chưa ghi gì. Thêm --write để thực thi."),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
