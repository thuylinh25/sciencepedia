import { PrismaClient } from "@prisma/client";

/**
 * Thay năm ảnh bìa đã chết bằng ảnh Wikimedia Commons đã kiểm giấy phép.
 *
 *   npm run covers:replace              # in kế hoạch, KHÔNG ghi
 *   npm run covers:replace -- --write   # thực thi
 *
 * ## Chuyện đã xảy ra
 *
 * Ngày 2026-09-11, `check:covers` báo hàng loạt ảnh bìa hỏng. Kiểm lại từng
 * cái thì phần lớn là **báo động giả**: Node gửi `User-Agent: node` và
 * Wikimedia trả 403 cho mọi request không khai User-Agent mô tả được. Lỗi đó
 * đã sửa trong chính `check-covers.ts`.
 *
 * Sau khi sửa, con số thật là **12/57 chết**, tất cả đều trỏ vào bucket
 * Supabase và đều trả `{"code":"NoSuchKey"}`: hàng dữ liệu giữ đường dẫn, tệp
 * không còn trong bucket. Không có bản sao nào trong kho để khôi phục, nên
 * cách sửa duy nhất là chọn ảnh mới.
 *
 * Script chạy lại được nhiều lần: ghi đè bằng đúng giá trị cũ thì không đổi
 * gì. Giữ cả 12 mục trong một danh sách để lượt sau đọc được LÝ DO từng ảnh
 * được chọn, thay vì thấy một URL trong CSDL và không biết vì sao là nó.
 *
 * ## Vì sao trỏ sang Wikimedia thay vì tải lại lên Supabase
 *
 * Vì mười sáu ảnh bìa khác trong cùng bảng đã trỏ thẳng Wikimedia và chưa cái
 * nào chết. Đường dẫn Wikimedia là địa chỉ nội dung của một tệp có trang mô tả
 * công khai kèm giấy phép — nó không biến mất vì một lượt dọn bucket. Tải lên
 * Supabase thì nhanh hơn nhưng đặt lại đúng năm tệp vào đúng chỗ vừa mất năm
 * tệp, mà không ai biết lần trước chúng mất vì sao.
 *
 * `upload.wikimedia.org` đã có trong `remotePatterns` của `next.config.ts`.
 *
 * ## Giấy phép
 *
 * Tra qua Commons API (`extmetadata`), không đọc từ trang mô tả bằng mắt. Ảnh
 * CC BY và CC BY-SA **bắt buộc ghi nguồn**, nên mỗi ảnh loại đó đều kèm
 * `coverImageCredit` — trang bài render trường này (xem
 * `app/[locale]/articles/[slug]/page.tsx`). Thiếu dòng đó là vi phạm giấy
 * phép, không phải thiếu thẩm mỹ.
 */

const prisma = new PrismaClient();

type Replacement = {
  slug: string;
  url: string;
  /** Vì sao ảnh này hợp với bài — để lượt sau không thay bừa */
  why: string;
  credit: string;
  creditEn: string;
};

const REPLACEMENTS: Replacement[] = [
  {
    slug: "van-dong-thay-doi-tim-va-mach-mau-nhu-the-nao",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Anatomy_Heart_Latin_Tiesworks.jpg/1280px-Anatomy_Heart_Latin_Tiesworks.jpg",
    why: "Bài nói về thay đổi của tim và mạch máu, nên ảnh phải là tim — không phải người đang tập. Bản dựng này thấy rõ cả buồng tim lẫn các mạch lớn.",
    credit: "Tvanbr / Wikimedia Commons — phạm vi công cộng",
    creditEn: "Tvanbr / Wikimedia Commons — public domain",
  },
  {
    slug: "lo-trang-va-lo-sau-hai-nghiem-toan-hoc-chua-ai-nhin-thay",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/70/Wormhole_travel_as_envisioned_by_Les_Bossinas_for_NASA.jpg",
    why: "Bài nói về hai nghiệm toán học CHƯA AI NHÌN THẤY, nên ảnh bìa bắt buộc phải là tranh dựng và phải được gọi đúng tên là tranh dựng. Dòng ghi nguồn nói rõ điều đó.",
    credit:
      "Tranh dựng của Les Bossinas (Cortez III Service Corp.) cho NASA, 1998 — phạm vi công cộng",
    creditEn:
      "Artist's concept by Les Bossinas (Cortez III Service Corp.) for NASA, 1998 — public domain",
  },
  {
    slug: "neu-roi-he-mat-troi-proxima-centauri-se-la-diem-dung-dau-tien",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Alpha%2C_Beta_and_Proxima_Centauri_%281%29.jpg/1280px-Alpha%2C_Beta_and_Proxima_Centauri_%281%29.jpg",
    why: "Ảnh chụp thật cả vùng trời có Alpha, Beta và Proxima Centauri, Proxima được khoanh tròn. Đắt hơn một ảnh cận cảnh một ngôi sao vì nó cho thấy Proxima mờ đến mức nào so với hai sao kia — đúng điều làm người ta bất ngờ.",
    credit: "Skatebiker / Wikimedia Commons — CC BY-SA 3.0",
    creditEn: "Skatebiker / Wikimedia Commons — CC BY-SA 3.0",
  },
  {
    slug: "ba-dinh-luat-kepler-hanh-tinh-chuyen-dong-theo-quy-luat-nao",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Johannes_Kepler.jpg",
    why: "Chân dung Kepler 1610. Đây là lựa chọn sau khi LOẠI ba ứng viên khác: bản khắc Mysterium Cosmographicum vẽ mô hình khối đa diện mà chính Kepler về sau bỏ (đưa lên bìa bài ba định luật là dạy sai), ảnh mô hình sàn bảo tàng đã sờn, và bản quét Astronomia Nova có nội dung nằm lệch trong một khung trắng quá khổ.",
    credit: "Chân dung Johannes Kepler, 1610 — phạm vi công cộng",
    creditEn: "Portrait of Johannes Kepler, 1610 — public domain",
  },
  {
    slug: "nguyen-nhan-cua-mua-do-nghieng-truc-khong-phai-khoang-cach",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/10/Earth-lighting-summer-solstice_EN_-_corrected.png",
    why: "Hình vẽ Trái Đất được chiếu sáng ở hạ chí, thấy rõ trục nghiêng và vùng cực ngày dài. Đó đúng là cơ chế bài khẳng định, chứ không phải hình vẽ quỹ đạo elip — hình quỹ đạo sẽ củng cố ngay chính hiểu lầm mà tiêu đề bài đi bác bỏ.",
    credit:
      'Przemysław „Blueshade" Idzkiewicz / Wikimedia Commons — CC BY-SA 4.0',
    creditEn:
      'Przemysław "Blueshade" Idzkiewicz / Wikimedia Commons — CC BY-SA 4.0',
  },
  {
    slug: "cau-truc-ben-trong-trai-dat",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Earth_cross_section-i18.png/1280px-Earth_cross_section-i18.png",
    why: "Mặt cắt Trái Đất của USGS, bản quốc tế hoá — nhãn là SỐ chứ không phải chữ tiếng Anh, nên không có chữ nước ngoài nằm giữa một bài tiếng Việt. Đúng bốn lớp mà bài mô tả.",
    credit: "USGS / Wikimedia Commons — phạm vi công cộng",
    creditEn: "USGS / Wikimedia Commons — public domain",
  },
  {
    slug: "giac-ngu-sau-lam-gi-voi-tri-nho-cua-ban",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/06/Sobo_1909_646.png",
    why: "Lát cắt não người trong atlas Sobotta 1909, có ghi nhãn hippocampus ở rìa dưới. Chọn hồi hải mã chứ không chọn ảnh người đang ngủ: bài nói giấc ngủ sâu làm gì với TRÍ NHỚ, và hồi hải mã là nơi việc đó diễn ra.",
    credit: "Johannes Sobotta, Atlas giải phẫu người, 1909 — phạm vi công cộng",
    creditEn: "Johannes Sobotta, Atlas of Human Anatomy, 1909 — public domain",
  },
  {
    slug: "big-bang-vu-tru-da-dien-ra-the-nao-trong-138-ti-nam",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/CMB_Timeline300_no_WMAP.jpg/1280px-CMB_Timeline300_no_WMAP.jpg",
    why: "Hình nón dãn nở của NASA/WMAP: trục ngang là 13,8 tỉ năm, đúng đại lượng nằm trong tiêu đề bài. Bản không có logo WMAP, để ảnh bìa không quảng cáo cho một sứ mệnh cụ thể.",
    credit: "NASA / Nhóm khoa học WMAP — phạm vi công cộng",
    creditEn: "NASA / WMAP Science Team — public domain",
  },
  {
    slug: "vi-sao-chiem-tinh-hoc-khong-phai-khoa-hoc",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Cellarius-map-zodiac.jpg",
    why: "Bản đồ hoàng đạo của Cellarius, Harmonia Macrocosmica 1660. Bài không chế nhạo chiêm tinh mà giải thích vì sao nó không phải khoa học, nên ảnh bìa nên là một hiện vật lịch sử thật — thứ chiêm tinh và thiên văn từng dùng chung — chứ không phải một hình biếm hoạ.",
    credit:
      "Andreas Cellarius, Harmonia Macrocosmica, 1660 — phạm vi công cộng",
    creditEn:
      "Andreas Cellarius, Harmonia Macrocosmica, 1660 — public domain",
  },
  {
    slug: "neu-trai-dat-dang-quay-vi-sao-chung-ta-khong-cam-nhan-duoc",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Foucault_pendulum_with_easy-to-track_marks_at_Saitama_Municipal_Youth_Astronomical_Museum.jpg/1280px-Foucault_pendulum_with_easy-to-track_marks_at_Saitama_Municipal_Youth_Astronomical_Museum.jpg",
    why: "Con lắc Foucault là câu trả lời trực tiếp cho câu hỏi trong tiêu đề: ta không cảm nhận được Trái Đất quay, nhưng vẫn có cách NHÌN THẤY nó quay. Bản này có vạch đánh dấu nên hướng đu đổi theo giờ đọc được ngay trên ảnh.",
    credit: "Syced / Wikimedia Commons — CC0",
    creditEn: "Syced / Wikimedia Commons — CC0",
  },
  {
    slug: "cac-chom-sao-hoang-dao",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/12_star_charts_of_the_signs_of_the_Zodiac_by_John_Bevis.jpg/1280px-12_star_charts_of_the_signs_of_the_Zodiac_by_John_Bevis.jpg",
    why: "Đủ mười hai bản đồ sao hoàng đạo của John Bevis trong một khung. Bài nói về cả mười hai chòm, nên một ảnh chụp một chòm sẽ đại diện thiếu.",
    credit: "John Bevis, Uranographia Britannica — phạm vi công cộng",
    creditEn: "John Bevis, Uranographia Britannica — public domain",
  },
  {
    slug: "kinh-james-webb-nhin-nguoc-ve-thuo-vu-tru-so-sinh",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Webb%E2%80%99s_First_Deep_Field_%28MIRI_and_NIRCam_Images_Side_by_Side%29.png/1280px-Webb%E2%80%99s_First_Deep_Field_%28MIRI_and_NIRCam_Images_Side_by_Side%29.png",
    why: "Trường sâu đầu tiên của Webb, đặt cạnh nhau bản hồng ngoại gần (NIRCam) và hồng ngoại giữa (MIRI). Bản đôi đắt hơn bản đơn vì nó cho thấy chính điều làm Webb khác Hubble: cùng một mảnh trời, hai bước sóng, hai bức ảnh khác hẳn nhau.",
    credit: "NASA, ESA, CSA — phạm vi công cộng",
    creditEn: "NASA, ESA, CSA — public domain",
  },
];

const USER_AGENT =
  "SciencepediaCoverCheck/1.0 (+https://sciencepedia-sciencepedia.vercel.app)";

/**
 * Gọi thử ảnh mới TRƯỚC khi ghi.
 *
 * Ghi một đường dẫn chết đè lên một đường dẫn chết khác thì không sửa được gì
 * mà lại xoá mất dấu vết của cái cũ.
 */
async function reachable(url: string): Promise<number> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    return response.status;
  } catch {
    return 0;
  }
}

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "=== THỰC THI ===\n" : "=== CHẠY KHÔ (thêm --write để ghi) ===\n");

  let blocked = false;

  for (const item of REPLACEMENTS) {
    const article = await prisma.article.findUnique({
      where: { slug: item.slug },
      select: { id: true, title: true, coverImage: true, status: true },
    });

    if (!article) {
      console.error(`✗ không có bài nào mang slug "${item.slug}"`);
      blocked = true;
      continue;
    }

    const status = await reachable(item.url);
    const ok = status >= 200 && status < 300;
    if (!ok) blocked = true;

    console.log(`${ok ? "✓" : "✗"} ${article.title}`);
    console.log(`    ${article.status}`);
    console.log(`    cũ  : ${article.coverImage ?? "(trống)"}`);
    console.log(`    mới : ${item.url}  [HTTP ${status}]`);
    console.log(`    vì  : ${item.why}`);
    console.log(`    nguồn: ${item.credit}`);
    console.log();
  }

  if (blocked) {
    console.error("Có mục không gọi được hoặc không tìm thấy bài. Dừng, không ghi gì.");
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log("Chưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  for (const item of REPLACEMENTS) {
    await prisma.article.update({
      where: { slug: item.slug },
      data: {
        coverImage: item.url,
        coverImageCredit: item.credit,
        coverImageCreditEn: item.creditEn,
      },
    });
  }

  console.log(`Đã thay ${REPLACEMENTS.length} ảnh bìa.`);
  console.log("Chạy `npm run check:covers` để xác nhận không còn đường dẫn chết.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
