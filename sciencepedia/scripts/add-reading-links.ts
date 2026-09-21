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
    if (!write) continue;

    await prisma.$transaction([
      prisma.revision.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
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
