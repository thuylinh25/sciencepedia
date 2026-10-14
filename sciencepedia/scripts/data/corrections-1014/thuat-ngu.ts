import type { Plan } from "../../lib/corrections";

/**
 * Thống nhất thuật ngữ toàn kho theo quyết định của chủ sản phẩm 2026-10-14: "nơron" (không "neuron",
 * "nơ-ron"), "hố đen" (không "lỗ đen"), "lý thuyết dây" (không "thuyết dây"). Chỉ đổi cách gọi, không đổi
 * claim → `minor`: không cập nhật lastVerifiedAt, không gỡ byline. Mỗi fix là nguyên dòng chứa từ cũ (nới
 * thêm dòng kề khi dòng ấy lặp lại trong trường). Sinh bằng một script tạm từ CSDL — không sửa tay.
 * Bản EN giữ "neuron", "black hole", "string theory".
 */

const NOTE = "Trước khi thống nhất thuật ngữ 14/10 (nơron, hố đen, lý thuyết dây)";
const W = "Thuật ngữ chốt 2026-10-14: nơron · hố đen · lý thuyết dây.";

export const T_BIG_BANG_VU_TRU: Plan = {
  slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "- Khoảng 10¹⁰⁰ năm nữa: các lỗ đen cuối cùng bốc hơi.", replace: "- Khoảng 10¹⁰⁰ năm nữa: các hố đen cuối cùng bốc hơi.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_CAC_SAO_TOI_CO: Plan = {
  slug: "cac-sao-toi-co-the-da-de-lai-tieng-vong-duoi-dang-song-hap-dan-khap-vu-tru",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "summary", find: "Năm 2023, các mảng định thời pulsar (PTA) công bố bằng chứng về một nền sóng hấp dẫn tần số cực thấp lan khắp vũ trụ. Một nghiên cứu năm 2026 cho thấy tín hiệu này có thể chủ yếu đến từ các cặp lỗ đen siêu nặng mà hạt giống ban đầu là những \"sao tối\" đã sụp đổ — loại sao khổng lồ giả thuyết của vũ trụ sơ khai. Nếu đúng, các sóng hấp dẫn ngày nay có thể giúp chúng ta nghiên cứu nguồn gốc của những lỗ đen siêu nặng đầu tiên trong vũ trụ.", replace: "Năm 2023, các mảng định thời pulsar (PTA) công bố bằng chứng về một nền sóng hấp dẫn tần số cực thấp lan khắp vũ trụ. Một nghiên cứu năm 2026 cho thấy tín hiệu này có thể chủ yếu đến từ các cặp hố đen siêu nặng mà hạt giống ban đầu là những \"sao tối\" đã sụp đổ — loại sao khổng lồ giả thuyết của vũ trụ sơ khai. Nếu đúng, các sóng hấp dẫn ngày nay có thể giúp chúng ta nghiên cứu nguồn gốc của những hố đen siêu nặng đầu tiên trong vũ trụ.", why: W },
    { field: "content", find: "## Vấn đề của những lỗ đen xuất hiện quá sớm", replace: "## Vấn đề của những hố đen xuất hiện quá sớm", why: W },
    { field: "content", find: "Kính thiên văn James Webb đã phát hiện các lỗ đen đang bồi tụ khi vũ trụ còn rất trẻ, chẳng hạn trong thiên hà GN-z11 ở độ dịch chuyển đỏ 10,6. Cùng với những quasar rất nặng đã biết ở thời kỳ đầu, chúng đặt ra câu hỏi lỗ đen đã lớn nhanh đến vậy bằng cách nào. Một khả năng là chúng được hình thành từ các **hạt giống lỗ đen khối lượng lớn** ngay trong giai đoạn đầu của lịch sử vũ trụ.", replace: "Kính thiên văn James Webb đã phát hiện các hố đen đang bồi tụ khi vũ trụ còn rất trẻ, chẳng hạn trong thiên hà GN-z11 ở độ dịch chuyển đỏ 10,6. Cùng với những quasar rất nặng đã biết ở thời kỳ đầu, chúng đặt ra câu hỏi hố đen đã lớn nhanh đến vậy bằng cách nào. Một khả năng là chúng được hình thành từ các **hạt giống hố đen khối lượng lớn** ngay trong giai đoạn đầu của lịch sử vũ trụ.", why: W },
    { field: "content", find: "Mức độ \"quá sớm, quá nặng\" vẫn đang được tranh luận: một số nghiên cứu cho rằng các lỗ đen Webb tìm thấy nặng hơn nhiều so với thiên hà chủ, trong khi phân tích của Li và cộng sự (2025) cho thấy phần lớn chênh lệch đó có thể do thiên lệch chọn mẫu và sai số đo.", replace: "Mức độ \"quá sớm, quá nặng\" vẫn đang được tranh luận: một số nghiên cứu cho rằng các hố đen Webb tìm thấy nặng hơn nhiều so với thiên hà chủ, trong khi phân tích của Li và cộng sự (2025) cho thấy phần lớn chênh lệch đó có thể do thiên lệch chọn mẫu và sai số đo.", why: W },
    { field: "content", find: "Theo các mô hình của nhóm này, sao tối có thể lớn tới cỡ một triệu lần khối lượng Mặt Trời; một tiền ấn phẩm năm 2025 (chưa qua bình duyệt) của cùng nhóm tính rằng chúng có thể bồi tụ tới khoảng 10⁴–10⁷ lần khối lượng Mặt Trời trước khi sụp đổ thành lỗ đen. Những lỗ đen này có thể trở thành hạt giống của các lỗ đen siêu nặng ngày nay.", replace: "Theo các mô hình của nhóm này, sao tối có thể lớn tới cỡ một triệu lần khối lượng Mặt Trời; một tiền ấn phẩm năm 2025 (chưa qua bình duyệt) của cùng nhóm tính rằng chúng có thể bồi tụ tới khoảng 10⁴–10⁷ lần khối lượng Mặt Trời trước khi sụp đổ thành hố đen. Những hố đen này có thể trở thành hạt giống của các hố đen siêu nặng ngày nay.", why: W },
    { field: "content", find: "Ghodla và Ilie (2026, *Physical Review D*) tính toán rằng nếu sao tối từng đủ phổ biến trong vũ trụ sơ khai — mật độ hạt giống cỡ một hạt giống trong mỗi 1.000 megaparsec khối — thì các cặp lỗ đen siêu nặng lớn lên từ hạt giống sao tối có thể là nguồn đóng góp chính vào nền sóng hấp dẫn mà các PTA đang quan sát.", replace: "Ghodla và Ilie (2026, *Physical Review D*) tính toán rằng nếu sao tối từng đủ phổ biến trong vũ trụ sơ khai — mật độ hạt giống cỡ một hạt giống trong mỗi 1.000 megaparsec khối — thì các cặp hố đen siêu nặng lớn lên từ hạt giống sao tối có thể là nguồn đóng góp chính vào nền sóng hấp dẫn mà các PTA đang quan sát.", why: W },
    { field: "content", find: "Nếu giả thuyết này đúng, nền sóng hấp dẫn — phát ra từ các cặp lỗ đen siêu nặng đang xoắn vào nhau — còn mang dấu vết gián tiếp về nguồn gốc của chúng từ thuở sơ khai của vũ trụ.", replace: "Nếu giả thuyết này đúng, nền sóng hấp dẫn — phát ra từ các cặp hố đen siêu nặng đang xoắn vào nhau — còn mang dấu vết gián tiếp về nguồn gốc của chúng từ thuở sơ khai của vũ trụ.", why: W },
    { field: "content", find: "Theo cách tiếp cận này, thay vì chỉ tìm trực tiếp các sao tối đã biến mất từ lâu, có thể dùng nền sóng hấp dẫn như một \"hóa thạch vũ trụ\" để kiểm tra các kịch bản hình thành những lỗ đen đầu tiên.", replace: "Theo cách tiếp cận này, thay vì chỉ tìm trực tiếp các sao tối đã biến mất từ lâu, có thể dùng nền sóng hấp dẫn như một \"hóa thạch vũ trụ\" để kiểm tra các kịch bản hình thành những hố đen đầu tiên.", why: W },
    { field: "content", find: "🌌 Đây là suy diễn của người viết, không phải kết luận của các bài báo: nếu được xác nhận, sao tối có thể nối vật chất tối, các lỗ đen đầu tiên và nền sóng hấp dẫn ngày nay thành một câu chuyện liền mạch.", replace: "🌌 Đây là suy diễn của người viết, không phải kết luận của các bài báo: nếu được xác nhận, sao tối có thể nối vật chất tối, các hố đen đầu tiên và nền sóng hấp dẫn ngày nay thành một câu chuyện liền mạch.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_DIEM_KY_DI_CUA: Plan = {
  slug: "diem-ky-di-cua-ho-den-noi-hai-tru-cot-vat-ly-va-cham",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "### Thuyết dây (*string theory*)", replace: "### Lý thuyết dây (*string theory*)", why: W },
    { field: "content", find: "Thuyết dây cho rằng các hạt cơ bản không phải là những điểm đơn lẻ mà là các \"dây\" cực nhỏ dao động.", replace: "Lý thuyết dây cho rằng các hạt cơ bản không phải là những điểm đơn lẻ mà là các \"dây\" cực nhỏ dao động.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_GABA_BO_PHANH_CUA: Plan = {
  slug: "gaba-bo-phanh-cua-nao-co-khien-ban-lo-do-ue-oai",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "summary", find: "GABA thường được ví như **\"bộ phanh\" của hệ thần kinh**. Đây là chất dẫn truyền thần kinh ức chế quan trọng, giúp kiểm soát mức độ hưng phấn của các neuron và giữ cho hoạt động của não không trở nên quá kích thích.", replace: "GABA thường được ví như **\"bộ phanh\" của hệ thần kinh**. Đây là chất dẫn truyền thần kinh ức chế quan trọng, giúp kiểm soát mức độ hưng phấn của các nơron và giữ cho hoạt động của não không trở nên quá kích thích.", why: W },
    { field: "content", find: "- **Glutamate**: thúc đẩy hoạt động của neuron.", replace: "- **Glutamate**: thúc đẩy hoạt động của nơron.", why: W },
    { field: "content", find: "- **GABA**: hạn chế khả năng neuron phát tín hiệu.", replace: "- **GABA**: hạn chế khả năng nơron phát tín hiệu.", why: W },
    { field: "content", find: "- Mức độ kích thích của các mạng neuron.", replace: "- Mức độ kích thích của các mạng nơron.", why: W },
    { field: "content", find: "Nhóm thuốc này tăng tác dụng của GABA tại thụ thể GABA-A, khiến hoạt động của nhiều neuron bị ức chế mạnh hơn.", replace: "Nhóm thuốc này tăng tác dụng của GABA tại thụ thể GABA-A, khiến hoạt động của nhiều nơron bị ức chế mạnh hơn.", why: W },
    { field: "content", find: "Hoạt động của não phụ thuộc vào sự cân bằng giữa hàng chục chất dẫn truyền thần kinh và hàng tỷ neuron.", replace: "Hoạt động của não phụ thuộc vào sự cân bằng giữa hàng chục chất dẫn truyền thần kinh và hàng tỷ nơron.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_KHI_TIM_NGUNG_DAP: Plan = {
  slug: "khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "Khi tuần hoàn ngừng, các neuron nhanh chóng mất khả năng duy trì hoạt động bình thường và tổn thương do thiếu máu bắt đầu hình thành.", replace: "Khi tuần hoàn ngừng, các nơron nhanh chóng mất khả năng duy trì hoạt động bình thường và tổn thương do thiếu máu bắt đầu hình thành.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_LO_TRANG_VA_LO: Plan = {
  slug: "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "summary", find: "Lỗ trắng và lỗ sâu thường xuất hiện cùng lỗ đen trong sách khoa học viễn tưởng. Tuy nhiên, khác với lỗ đen đã được quan sát và nghiên cứu trực tiếp, lỗ trắng và lỗ sâu hiện vẫn chỉ là những nghiệm toán học của thuyết tương đối rộng, chưa có bằng chứng quan sát nào xác nhận chúng tồn tại.", replace: "Lỗ trắng và lỗ sâu thường xuất hiện cùng hố đen trong sách khoa học viễn tưởng. Tuy nhiên, khác với hố đen đã được quan sát và nghiên cứu trực tiếp, lỗ trắng và lỗ sâu hiện vẫn chỉ là những nghiệm toán học của thuyết tương đối rộng, chưa có bằng chứng quan sát nào xác nhận chúng tồn tại.", why: W },
    { field: "content", find: "Nghiệm này mô tả một vật thể có lực hấp dẫn mạnh đến mức xuất hiện **[[chân trời sự kiện]]**, ranh giới mà không gì có thể thoát ra ngoài. Đây chính là nền tảng lý thuyết của **lỗ đen**.", replace: "Nghiệm này mô tả một vật thể có lực hấp dẫn mạnh đến mức xuất hiện **[[chân trời sự kiện]]**, ranh giới mà không gì có thể thoát ra ngoài. Đây chính là nền tảng lý thuyết của **hố đen**.", why: W },
    { field: "content", find: "Lỗ trắng có thể được xem là \"phiên bản đảo ngược thời gian\" của lỗ đen.", replace: "Lỗ trắng có thể được xem là \"phiên bản đảo ngược thời gian\" của hố đen.", why: W },
    { field: "content", find: "- Lỗ đen cho vật chất đi vào nhưng không cho thoát ra.", replace: "- Hố đen cho vật chất đi vào nhưng không cho thoát ra.", why: W },
    { field: "content", find: "- Rất không ổn định, chỉ cần một lượng vật chất nhỏ rơi vào là có thể sụp đổ thành lỗ đen.", replace: "- Rất không ổn định, chỉ cần một lượng vật chất nhỏ rơi vào là có thể sụp đổ thành hố đen.", why: W },
    { field: "content", find: "- Liên quan đến các câu hỏi sâu sắc về lỗ đen và thông tin lượng tử.", replace: "- Liên quan đến các câu hỏi sâu sắc về hố đen và thông tin lượng tử.", why: W },
    { field: "content", find: "## Khác gì với lỗ đen?", replace: "## Khác gì với hố đen?", why: W },
    { field: "content", find: "| Lỗ đen | Có |", replace: "| Hố đen | Có |", why: W },
    { field: "content", find: "Trong khi đó, lỗ đen đã được xác nhận bằng nhiều cách:", replace: "Trong khi đó, hố đen đã được xác nhận bằng nhiều cách:", why: W },
    { field: "content", find: "- Phát hiện sóng hấp dẫn từ các vụ hợp nhất lỗ đen (2015).", replace: "- Phát hiện sóng hấp dẫn từ các vụ hợp nhất hố đen (2015).", why: W },
    { field: "content", find: "- Ảnh lỗ đen M87* (2019).", replace: "- Ảnh hố đen M87* (2019).", why: W },
    { field: "content", find: "Lỗ trắng và lỗ sâu đều là những nghiệm hợp lệ về mặt toán học của thuyết tương đối rộng. Tuy nhiên, khác với lỗ đen, chúng chưa từng được quan sát trong tự nhiên và hiện tồn tại nhiều trở ngại vật lý khiến chúng khó có thể xuất hiện trong vũ trụ mà chúng ta quan sát được.", replace: "Lỗ trắng và lỗ sâu đều là những nghiệm hợp lệ về mặt toán học của thuyết tương đối rộng. Tuy nhiên, khác với hố đen, chúng chưa từng được quan sát trong tự nhiên và hiện tồn tại nhiều trở ngại vật lý khiến chúng khó có thể xuất hiện trong vũ trụ mà chúng ta quan sát được.", why: W },
    { field: "content", find: "🕳️ Nói ngắn gọn: **lỗ đen đã bước ra khỏi phương trình để trở thành đối tượng thiên văn thực sự; lỗ trắng và lỗ sâu vẫn đang nằm trong phạm vi của lý thuyết và giả thuyết.**", replace: "🕳️ Nói ngắn gọn: **hố đen đã bước ra khỏi phương trình để trở thành đối tượng thiên văn thực sự; lỗ trắng và lỗ sâu vẫn đang nằm trong phạm vi của lý thuyết và giả thuyết.**", why: W },
    { field: "seoDescription", find: "Lỗ trắng và lỗ sâu thường xuất hiện cùng lỗ đen trong sách khoa học viễn tưởng. Tuy nhiên, khác với lỗ đen đã được quan sát và nghiên cứu trực tiếp, lỗ...", replace: "Lỗ trắng và lỗ sâu thường xuất hiện cùng hố đen trong sách khoa học viễn tưởng. Tuy nhiên, khác với hố đen đã được quan sát và nghiên cứu trực tiếp, lỗ...", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_NGOI_SAO_CAU_TAO: Plan = {
  slug: "ngoi-sao-cau-tao-va-vong-doi",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "### Lỗ đen", replace: "### Hố đen", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_NHUNG_SU_GIA_HOA: Plan = {
  slug: "nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "summary", find: "Bộ não chứa hàng tỷ tế bào thần kinh liên tục trao đổi thông tin. Nhưng giữa phần lớn các neuron tồn tại những khe cực nhỏ gọi là synapse. Để đưa thông tin qua những khe này, hệ thần kinh sử dụng các phân tử hóa học gọi là chất dẫn truyền thần kinh (neurotransmitters). Chúng tham gia vào gần như mọi hoạt động của não, từ chuyển động, trí nhớ và sự tập trung đến cảm xúc, giấc ngủ và cảm giác đau.", replace: "Bộ não chứa hàng tỷ tế bào thần kinh liên tục trao đổi thông tin. Nhưng giữa phần lớn các nơron tồn tại những khe cực nhỏ gọi là synapse. Để đưa thông tin qua những khe này, hệ thần kinh sử dụng các phân tử hóa học gọi là chất dẫn truyền thần kinh (neurotransmitters). Chúng tham gia vào gần như mọi hoạt động của não, từ chuyển động, trí nhớ và sự tập trung đến cảm xúc, giấc ngủ và cảm giác đau.", why: W },
    { field: "content", find: "Khi một xung điện chạy tới đầu neuron, các túi nhỏ chứa [[chất dẫn truyền thần kinh]] giải phóng chúng vào khe synapse.", replace: "Khi một xung điện chạy tới đầu nơron, các túi nhỏ chứa [[chất dẫn truyền thần kinh]] giải phóng chúng vào khe synapse.", why: W },
    { field: "content", find: "Nó làm giảm khả năng neuron phát tín hiệu, giúp ngăn hệ thần kinh trở nên kích thích quá mức. ", replace: "Nó làm giảm khả năng nơron phát tín hiệu, giúp ngăn hệ thần kinh trở nên kích thích quá mức. ", why: W },
    { field: "content", find: "- Truyền tín hiệu giữa các neuron.", replace: "- Truyền tín hiệu giữa các nơron.", why: W },
    { field: "content", find: "Thực tế, một cảm xúc hay hành vi là kết quả của hoạt động phối hợp giữa nhiều mạng neuron, chất dẫn truyền thần kinh, hormone, ký ức và tín hiệu từ cơ thể.", replace: "Thực tế, một cảm xúc hay hành vi là kết quả của hoạt động phối hợp giữa nhiều mạng nơron, chất dẫn truyền thần kinh, hormone, ký ức và tín hiệu từ cơ thể.", why: W },
    { field: "content", find: "🧠 Chất dẫn truyền thần kinh không phải những \"nút bấm cảm xúc\", mà là ngôn ngữ hóa học giúp hàng tỷ neuron phối hợp với nhau. Chính từ mạng lưới giao tiếp khổng lồ ấy mới xuất hiện trí nhớ, vận động, sự tập trung và những trạng thái cảm xúc phức tạp của con người.", replace: "🧠 Chất dẫn truyền thần kinh không phải những \"nút bấm cảm xúc\", mà là ngôn ngữ hóa học giúp hàng tỷ nơron phối hợp với nhau. Chính từ mạng lưới giao tiếp khổng lồ ấy mới xuất hiện trí nhớ, vận động, sự tập trung và những trạng thái cảm xúc phức tạp của con người.", why: W },
    { field: "seoDescription", find: "Khám phá vai trò của các chất dẫn truyền thần kinh như dopamine, serotonin và GABA trong việc kết nối neuron và điều hòa hoạt động của não bộ.", replace: "Khám phá vai trò của các chất dẫn truyền thần kinh như dopamine, serotonin và GABA trong việc kết nối nơron và điều hòa hoạt động của não bộ.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_PROTON_CO_BAT_TU: Plan = {
  slug: "proton-co-bat-tu-dieu-gi-xay-ra-neu-mot-ngay-vat-chat-bat-dau-phan-ra",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "- Lỗ đen.", replace: "- Hố đen.", why: W },
    { field: "content", find: "- Các lỗ đen tồn tại trong thời gian cực dài trước khi mất dần năng lượng qua bức xạ Hawking.", replace: "- Các hố đen tồn tại trong thời gian cực dài trước khi mất dần năng lượng qua bức xạ Hawking.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_SONG_HAP_DAN_VA: Plan = {
  slug: "song-hap-dan-va-song-trong-luc-mot-chu-khac-nhau-hai-hien-tuong-khong-lien-quan",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "Khi các vật thể khổng lồ như lỗ đen hoặc [[sao neutron]] chuyển động mạnh và bất đối xứng, chúng tạo ra những gợn sóng lan truyền trong không–thời gian với tốc độ ánh sáng. Đó chính là **sóng hấp dẫn**.", replace: "Khi các vật thể khổng lồ như hố đen hoặc [[sao neutron]] chuyển động mạnh và bất đối xứng, chúng tạo ra những gợn sóng lan truyền trong không–thời gian với tốc độ ánh sáng. Đó chính là **sóng hấp dẫn**.", why: W },
    { field: "content", find: "Năm 2015, đài quan sát **LIGO** lần đầu tiên phát hiện trực tiếp sóng hấp dẫn từ vụ hợp nhất của hai lỗ đen, xác nhận một dự đoán tồn tại suốt gần 100 năm của Einstein.", replace: "Năm 2015, đài quan sát **LIGO** lần đầu tiên phát hiện trực tiếp sóng hấp dẫn từ vụ hợp nhất của hai hố đen, xác nhận một dự đoán tồn tại suốt gần 100 năm của Einstein.", why: W },
    { field: "content", find: "| Sinh ra từ lỗ đen, sao neutron, các sự kiện vũ trụ cực mạnh | Sinh ra từ gió, trọng lực, địa hình hoặc động đất |", replace: "| Sinh ra từ hố đen, sao neutron, các sự kiện vũ trụ cực mạnh | Sinh ra từ gió, trọng lực, địa hình hoặc động đất |", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_THIEN_HA_DINH_NGHIA: Plan = {
  slug: "thien-ha-dinh-nghia-va-cach-phan-loai",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "- Hầu hết thiên hà lớn có lỗ đen siêu khối lượng ở trung tâm.", replace: "- Hầu hết thiên hà lớn có hố đen siêu khối lượng ở trung tâm.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_THUOC_GAY_ME_DA: Plan = {
  slug: "thuoc-gay-me-da-tat-y-thuc-cua-ban-nhu-the-nao",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "Não hoạt động nhờ hàng tỷ neuron liên tục truyền tín hiệu cho nhau.", replace: "Não hoạt động nhờ hàng tỷ nơron liên tục truyền tín hiệu cho nhau.", why: W },
    { field: "content", find: "Thuốc gây mê làm thay đổi hoạt động của nhiều loại thụ thể và kênh ion trên những neuron này.", replace: "Thuốc gây mê làm thay đổi hoạt động của nhiều loại thụ thể và kênh ion trên những nơron này.", why: W },
    { field: "content", find: "Có thể hình dung GABA giống như một chiếc \"phanh\" giúp giảm khả năng neuron phát tín hiệu.", replace: "Có thể hình dung GABA giống như một chiếc \"phanh\" giúp giảm khả năng nơron phát tín hiệu.", why: W },
    { field: "content", find: "Khi đường truyền này bị thay đổi, khả năng các neuron trao đổi và tích hợp thông tin cũng thay đổi theo.", replace: "Khi đường truyền này bị thay đổi, khả năng các nơron trao đổi và tích hợp thông tin cũng thay đổi theo.", why: W },
    { field: "content", find: "🧠 Gây mê không thực sự \"tắt\" bộ não. Nó tạm thời thay đổi cách hàng tỷ neuron phối hợp và trao đổi thông tin với nhau. Khi mạng lưới tạo nên ý thức bị gián đoạn, thế giới biến mất khỏi trải nghiệm của bạn. Khi thuốc hết tác dụng, mạng lưới kết nối trở lại và bạn tỉnh dậy, thường không có ký ức nào về khoảng thời gian ở giữa.", replace: "🧠 Gây mê không thực sự \"tắt\" bộ não. Nó tạm thời thay đổi cách hàng tỷ nơron phối hợp và trao đổi thông tin với nhau. Khi mạng lưới tạo nên ý thức bị gián đoạn, thế giới biến mất khỏi trải nghiệm của bạn. Khi thuốc hết tác dụng, mạng lưới kết nối trở lại và bạn tỉnh dậy, thường không có ký ức nào về khoảng thời gian ở giữa.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_TIA_VU_TRU_NHUNG: Plan = {
  slug: "tia-vu-tru-nhung-vien-dan-vo-hinh-ban-pha-trai-dat-moi-giay",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "Các ứng viên gồm những môi trường thiên văn cực đoan như vùng xung quanh **hạt nhân thiên hà hoạt động**, nơi các lỗ đen siêu khối lượng và từ trường mạnh có thể tham gia vào quá trình gia tốc hạt.", replace: "Các ứng viên gồm những môi trường thiên văn cực đoan như vùng xung quanh **hạt nhân thiên hà hoạt động**, nơi các hố đen siêu khối lượng và từ trường mạnh có thể tham gia vào quá trình gia tốc hạt.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_VAT_CHAT_TOI_VA: Plan = {
  slug: "vat-chat-toi-va-nang-luong-toi-tran-chien-keo-co-vi-dai-cua-vu-tru",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "- Lỗ đen nguyên thủy.", replace: "- Hố đen nguyên thủy.", why: W },
  ],
  reading: [],
  sources: [],
};

export const T_VI_SAO_CHUNG_TA: Plan = {
  slug: "vi-sao-chung-ta-khong-the-nho-nhung-nam-thang-dau-doi",
  note: NOTE,
  minor: true,
  fixes: [
    { field: "content", find: "Các nghiên cứu còn cho thấy **neurogenesis**, quá trình hình thành neuron mới ở hippocampus, có thể đóng một vai trò.", replace: "Các nghiên cứu còn cho thấy **neurogenesis**, quá trình hình thành nơron mới ở hippocampus, có thể đóng một vai trò.", why: W },
    { field: "content", find: "## Quá nhiều neuron mới có thể làm ký ức khó truy xuất?", replace: "## Quá nhiều nơron mới có thể làm ký ức khó truy xuất?", why: W },
    { field: "content", find: "Ở giai đoạn đầu đời, hippocampus có mức độ tạo neuron mới và tái tổ chức mạng thần kinh rất cao.", replace: "Ở giai đoạn đầu đời, hippocampus có mức độ tạo nơron mới và tái tổ chức mạng thần kinh rất cao.", why: W },
    { field: "content", find: "Một giả thuyết cho rằng khi những neuron mới liên tục được tích hợp vào các mạng hippocampus, các mạch thần kinh từng tham gia lưu giữ ký ức cũng bị thay đổi.", replace: "Một giả thuyết cho rằng khi những nơron mới liên tục được tích hợp vào các mạng hippocampus, các mạch thần kinh từng tham gia lưu giữ ký ức cũng bị thay đổi.", why: W },
  ],
  reading: [],
  sources: [],
};

export const THUAT_NGU: Plan[] = [T_BIG_BANG_VU_TRU, T_CAC_SAO_TOI_CO, T_DIEM_KY_DI_CUA, T_GABA_BO_PHANH_CUA, T_KHI_TIM_NGUNG_DAP, T_LO_TRANG_VA_LO, T_NGOI_SAO_CAU_TAO, T_NHUNG_SU_GIA_HOA, T_PROTON_CO_BAT_TU, T_SONG_HAP_DAN_VA, T_THIEN_HA_DINH_NGHIA, T_THUOC_GAY_ME_DA, T_TIA_VU_TRU_NHUNG, T_VAT_CHAT_TOI_VA, T_VI_SAO_CHUNG_TA];
