import { PrismaClient } from "@prisma/client";

import { revalidateSite } from "./revalidate-site";

/**
 * Đính chính bài "Khi tế bào gốc 'quên' mình là ai" theo phiếu thẩm định 2026-10-07
 * (docs/content/checks/2026-10-07/khi-te-bao-goc-quen-minh-la-ai.md).
 *
 *   npm run corrections:1008              # in kế hoạch, KHÔNG ghi gì
 *   npm run corrections:1008 -- --write   # thực thi — NGƯỜI chạy
 *
 * Bài lên trang qua form /admin với 0 nguồn và factCheck PENDING. Phiếu thẩm định trả
 * SỬA: không có claim sai nặng, nhưng bài thiếu nguồn (gate accuracy) và có những chỗ
 * khái quát quá tay — gán cho Yamanaka điều Gurdon chứng minh từ 1962, gọi iPSC là
 * "nhắc nhớ" danh tính trong khi nó XOÁ danh tính cũ, "hiệu quả đáng kể" không số liệu.
 *
 * Quy trình theo docs/content-rules.md, "Sửa bài đã publish là đính chính": một mục trong
 * docs/content/corrections.md, Revision chụp bản TRƯỚC trong CÙNG transaction với lệnh
 * sửa và lệnh thêm nguồn, lastVerifiedAt cập nhật. Bài chưa có bản en nên chỉ sửa bản vi.
 *
 * `factCheck` GIỮ NGUYÊN: sửa chuỗi không phải là qua gate — người duyệt đặt sau khi đọc
 * bản đã sửa. Ảnh bìa thiếu alt và ghi công: không biết nguồn ảnh nên không tự điền.
 */
const prisma = new PrismaClient();
const SLUG = "khi-te-bao-goc-quen-minh-la-ai-khung-hoang-danh-tinh-o-cap-do-phan-tu";

type Fix = { field: "summary" | "content"; find: string; replace: string; why: string };

const FIXES: Fix[] = [
  {
    field: "summary",
    find: "Điều giữ cho mỗi tế bào luôn biết mình là ai không nằm ở DNA, mà nằm ở hệ thống điều khiển gọi là **biểu sinh (epigenetics)**.",
    replace:
      "Điều giữ cho mỗi tế bào luôn biết mình là ai không nằm ở trình tự DNA, mà ở cách bộ gene được đọc: một mạng lưới yếu tố phiên mã chọn gene nào hoạt động, và các dấu ấn **biểu sinh (epigenetics)** giữ cho lựa chọn ấy ổn định qua các lần phân chia.",
    why: "Bỏ qua mạng yếu tố phiên mã — thứ quyết định danh tính; biểu sinh chủ yếu GIỮ lựa chọn ấy. Methyl hoá DNA cũng nằm trên DNA.",
  },
  {
    field: "content",
    find: 'Mọi tế bào đều chứa cùng một "cuốn sách hướng dẫn" là bộ gene.',
    replace:
      'Gần như mọi tế bào có nhân trong cơ thể đều mang cùng một "cuốn sách hướng dẫn" là bộ gene. Ngoại lệ đáng kể: hồng cầu trưởng thành không có nhân, còn tế bào lympho B và T tự cắt ghép lại một số đoạn gene để tạo kháng thể và thụ thể.',
    why: "Tuyệt đối hoá, mâu thuẫn chính phần tóm tắt (\"gần như\").",
  },
  {
    field: "content",
    find: "Hai cơ chế quan trọng nhất là:",
    replace: "Hai cơ chế được nghiên cứu nhiều nhất là:",
    why: "Xếp hạng không có căn cứ.",
  },
  {
    field: "content",
    find: "Nhờ vậy, tế bào gốc có thể biệt hóa thành:\n\n- Tế bào máu.\n- Tế bào thần kinh.\n- Tế bào cơ.\n- Tế bào da.\n\nvà duy trì danh tính đó trong suốt cuộc đời.",
    replace:
      "Nhờ vậy, từ một hợp tử ban đầu, các thế hệ tế bào gốc biệt hóa dần thành hàng trăm loại tế bào — máu, thần kinh, cơ, da… — và mỗi loại giữ danh tính ấy qua các lần phân chia.",
    why: "Không loại tế bào gốc trưởng thành nào sinh ra cả bốn loại; câu cũ đọc như một tế bào gốc làm được hết.",
  },
  {
    field: "content",
    find: "Một hiểu lầm phổ biến là tế bào bất thường sẽ tự động kích hoạt apoptosis.",
    replace: "Tế bào bị tổn thương không phải lúc nào cũng chết theo chương trình (apoptosis).",
    why: '"Hiểu lầm phổ biến" không có căn cứ — dựng bia.',
  },
  {
    field: "content",
    find: "Hiện nay, CSCs được xem là một mô hình quan trọng để giải thích:",
    replace: "Hiện nay, CSCs được đề xuất để giải thích một phần:",
    why: "Mô hình tế bào gốc ung thư còn tranh luận; câu cũ trình bày như đã chốt.",
  },
  {
    field: "content",
    find: "- Di căn.\n\nTuy nhiên, nguồn gốc chính xác của CSCs vẫn đang được nghiên cứu.",
    replace:
      '- Di căn.\n\nMô hình này còn tranh luận. Với u hắc tố, khi cấy sang dòng chuột suy giảm miễn dịch nặng hơn, khoảng một phần tư số tế bào u chưa chọn lọc tạo được khối u — tức tế bào có khả năng sinh u không hề hiếm, và không phải khối u nào cũng có một nhóm nhỏ "tế bào gốc" tách biệt.\n\nTuy nhiên, nguồn gốc chính xác của CSCs vẫn đang được nghiên cứu.',
    why: "Quintana et al. 2008: trung bình 27% (cấy đơn bào) và ~25% (pha loãng giới hạn) tế bào u hắc tố chưa chọn lọc tạo khối u ở chuột NOD/SCID Il2rg-/-.",
  },
  {
    field: "content",
    find: "Năm 2006, các yếu tố Yamanaka cho thấy tế bào trưởng thành có thể được đưa trở lại trạng thái giống tế bào gốc.\n\nKhám phá này thay đổi hoàn toàn cách chúng ta hiểu về danh tính tế bào.\n\nĐiều đó chứng minh rằng:\n\n**Danh tính tế bào không cố định vĩnh viễn.**\n\nNó có thể được tái lập trình.",
    replace:
      'Từ năm 1962, thí nghiệm chuyển nhân của John Gurdon ở ếch đã cho thấy nhân của một tế bào đã biệt hóa vẫn giữ đủ thông tin để tạo ra cả một cơ thể.\n\nNăm 2006, Kazutoshi Takahashi và Shinya Yamanaka công bố rằng chỉ bốn yếu tố phiên mã (Oct3/4, Sox2, Klf4, c-Myc) đủ đưa nguyên bào sợi của chuột trở về trạng thái đa năng — gọi là tế bào gốc đa năng cảm ứng (iPSC). Năm 2007, họ làm được điều tương tự với tế bào người. Gurdon và Yamanaka cùng nhận giải Nobel Sinh lý học hoặc Y học năm 2012.\n\nHai công trình dẫn tới cùng một kết luận:\n\n**Danh tính tế bào không cố định vĩnh viễn.**\n\nNhưng tái lập trình hoàn toàn *xoá* danh tính cũ chứ không "nhắc" tế bào nhớ lại nó. Hướng gần với ý "nhắc nhớ" hơn là **tái lập trình một phần**: bật các yếu tố này trong thời gian ngắn, đủ để đẩy dấu ấn biểu sinh về trạng thái trẻ hơn mà tế bào chưa mất danh tính. Ở chuột, cách này đã cải thiện một số dấu hiệu lão hóa và kéo dài tuổi thọ ở mô hình lão hóa sớm, và đảo ngược tình trạng mất thị lực ở mô hình glôcôm và ở chuột già. Chưa có ứng dụng nào được chứng minh ở người.',
    why: "Gán cho Yamanaka điều Gurdon chứng minh từ 1962; iPSC xoá danh tính chứ không nhắc nhớ; \"chứng minh\", \"thay đổi hoàn toàn\" quá tay. Kết quả trên chuột theo đúng abstract Ocampo 2016 và Lu 2020.",
  },
  {
    field: "content",
    find: "Một chiến lược khác là ép tế bào bất thường trưởng thành thay vì cố tiêu diệt chúng.\n\nTrong một số bệnh ung thư máu, cách tiếp cận này đã cho thấy hiệu quả đáng kể.",
    replace:
      "Một chiến lược khác là ép tế bào bất thường trưởng thành thay vì cố tiêu diệt chúng.\n\nVí dụ rõ nhất là bệnh bạch cầu cấp tiền tủy bào (APL). Axit all-trans retinoic (ATRA) đẩy các tế bào ác tính biệt hóa tiếp. Trong một thử nghiệm ngẫu nhiên pha 3 công bố năm 2013 trên bệnh nhân nguy cơ thấp đến trung bình, phối hợp ATRA với arsenic trioxide cho tỉ lệ sống không biến cố sau 2 năm là 97%, so với 86% ở nhóm ATRA cộng hóa trị.",
    why: '"Hiệu quả đáng kể" mơ hồ; ví dụ điển hình có số liệu chắc (Lo-Coco et al., NEJM 2013).',
  },
  {
    field: "content",
    find: "🧬 Một tế bào khỏe mạnh",
    replace: "Một tế bào khỏe mạnh",
    why: "Emoji không hợp giọng bách khoa.",
  },
];

const READING = [
  ["CRISPR: cây kéo phân tử đến từ vi khuẩn", "crispr-cay-keo-phan-tu-den-tu-vi-khuan"],
  ["Hệ miễn dịch nhận diện một virus bằng cách nào", "he-mien-dich-nhan-dien-mot-virus-bang-cach-nao"],
  ["Cái chết dưới góc nhìn tiến hóa: Vì sao tự nhiên không thiết kế chúng ta để sống mãi?", "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai"],
] as const;

const SOURCES = [
  { title: "Induction of pluripotent stem cells from mouse embryonic and adult fibroblast cultures by defined factors", publisher: "Cell", doi: "10.1016/j.cell.2006.07.024", year: 2006, tier: 1 },
  { title: "Induction of pluripotent stem cells from adult human fibroblasts by defined factors", publisher: "Cell", doi: "10.1016/j.cell.2007.11.019", year: 2007, tier: 1 },
  { title: "The Nobel Prize in Physiology or Medicine 2012 — Press release", publisher: "Nobel Prize Outreach", url: "https://www.nobelprize.org/prizes/medicine/2012/press-release/", year: 2012, tier: 2 },
  { title: "Retinoic acid and arsenic trioxide for acute promyelocytic leukemia", publisher: "New England Journal of Medicine", doi: "10.1056/NEJMoa1300874", year: 2013, tier: 1 },
  { title: "Hallmarks of cancer: new dimensions", publisher: "Cancer Discovery", doi: "10.1158/2159-8290.CD-21-1059", year: 2022, tier: 1 },
  { title: "Hallmarks of aging: an expanding universe", publisher: "Cell", doi: "10.1016/j.cell.2022.11.001", year: 2023, tier: 1 },
  { title: "Loss of epigenetic information as a cause of mammalian aging", publisher: "Cell", doi: "10.1016/j.cell.2022.12.027", year: 2023, tier: 1 },
  { title: "Human acute myeloid leukemia is organized as a hierarchy that originates from a primitive hematopoietic cell", publisher: "Nature Medicine", doi: "10.1038/nm0797-730", year: 1997, tier: 1 },
  { title: "Prospective identification of tumorigenic breast cancer cells", publisher: "PNAS", doi: "10.1073/pnas.0530291100", year: 2003, tier: 1 },
  { title: "Efficient tumour formation by single human melanoma cells", publisher: "Nature", doi: "10.1038/nature07567", year: 2008, tier: 1 },
  { title: "In vivo amelioration of age-associated hallmarks by partial reprogramming", publisher: "Cell", doi: "10.1016/j.cell.2016.11.052", year: 2016, tier: 1 },
  { title: "Reprogramming to recover youthful epigenetic information and restore vision", publisher: "Nature", doi: "10.1038/s41586-020-2975-4", year: 2020, tier: 1 },
].map((s) => ({ ...s, url: "url" in s && s.url ? s.url : `https://doi.org/${s.doi}` }));

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const now = new Date();
  const a = await prisma.article.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, title: true, summary: true, content: true, factCheck: true, status: true },
  });

  let summary = a.summary;
  let content = a.content;
  for (const fix of FIXES) {
    const text = fix.field === "summary" ? summary : content;
    // "Đã sửa" = không còn bản cũ mà có bản mới (bản mới có thể chứa bản cũ, vd. bỏ emoji).
    if (!text.includes(fix.find) && text.includes(fix.replace)) {
      console.log(`· đã sửa từ trước: ${fix.find.slice(0, 60)}…`);
      continue;
    }
    const count = text.split(fix.find).length - 1;
    if (count !== 1) throw new Error(`[${fix.field}] cụm cần sửa khớp ${count} chỗ, cần đúng 1: ${fix.find.slice(0, 80)}`);
    const next = text.replace(fix.find, fix.replace);
    if (fix.field === "summary") summary = next;
    else content = next;
    console.log(`\n[${fix.field}] cũ : ${fix.find.slice(0, 120).replace(/\n/g, " ⏎ ")}`);
    console.log(`        mới: ${fix.replace.slice(0, 120).replace(/\n/g, " ⏎ ")}…`);
    console.log(`        vì : ${fix.why}`);
  }
  if (!/^## Đọc thêm/m.test(content)) {
    content = `${content.replace(/\s+$/, "")}\n\n## Đọc thêm\n\n${READING.map(([t, s]) => `- [${t}](/articles/${s})`).join("\n")}\n`;
    console.log(`\n+ mục "Đọc thêm": ${READING.map(([, s]) => s).join(", ")}`);
  }

  const have = new Set(
    (await prisma.source.findMany({ where: { articleId: a.id }, select: { url: true } })).map((s) => s.url),
  );
  const add = SOURCES.filter((s) => !have.has(s.url));
  console.log(`\nnguồn thêm: ${add.length}/${SOURCES.length}   (factCheck ${a.factCheck} — GIỮ NGUYÊN, status ${a.status})`);

  if (!write) {
    console.log("\nChưa ghi gì. Thêm --write để thực thi.");
    return;
  }

  await prisma.$transaction([
    prisma.revision.create({
      data: { articleId: a.id, title: a.title, content: a.content, note: "Trước đính chính 08/10: phiếu thẩm định 2026-10-07 (thêm nguồn, sửa 9 chỗ khái quát quá tay)" },
    }),
    prisma.article.update({ where: { id: a.id }, data: { summary, content, lastVerifiedAt: now } }),
    ...add.map((s) =>
      prisma.source.create({
        data: { articleId: a.id, title: s.title, publisher: s.publisher, url: s.url, doi: "doi" in s ? s.doi : null, year: s.year, tier: s.tier, accessedAt: now },
      }),
    ),
  ]);
  await revalidateSite([SLUG]);
  console.log("\nĐÃ GHI (revision + nội dung + nguồn, cùng transaction). factCheck vẫn giữ — người duyệt đặt sau khi đọc bản đã sửa.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
