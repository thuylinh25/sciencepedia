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
    slug: "nhung-hat-vo-hinh-tao-nen-the-gioi-vat-chat",
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
