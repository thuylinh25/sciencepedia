import { prisma } from "../src/lib/prisma";

/**
 * Nâng bề ngang bản thu nhỏ (thumb) của mọi ảnh bìa lấy từ Wikimedia Commons.
 *
 *   npm run covers:upgrade              # in kế hoạch, KHÔNG ghi
 *   npm run covers:upgrade -- --write   # thực thi
 *
 * ## Vì sao cần
 *
 * Ảnh bìa Wikimedia đang được lưu ở dạng URL thumb ghim cứng `1280px-`. Ba
 * mươi mốt trong ba mươi sáu ảnh Wikimedia của kho đều đúng con số ấy, tức nó
 * là mặc định của lượt nhập liệu chứ không phải lựa chọn cho từng ảnh.
 *
 * Hero trang bài tràn hết bề ngang cửa sổ. Trên một laptop 1362px × DPR 2 nó
 * cần 2724 điểm ảnh thật; tệp 1280px phải phóng 2,13 lần để phủ. Đó chính là
 * "ảnh bìa mờ, bị kéo dãn" — không phải lỗi `object-fit`, mà là tệp nguồn nhỏ
 * hơn khung gần ba lần về diện tích.
 *
 * Và phần lớn ảnh KHÔNG thiếu điểm ảnh: bản gốc trên Commons là 2200, 4400,
 * 6317, có bản 8000px. Ta đang tự bỏ đi số điểm ảnh đã có sẵn và miễn phí.
 *
 * ## Vì sao 1920, và vì sao KHÔNG phải một con số tuỳ ý
 *
 * Wikimedia không còn dựng thumb theo bề ngang tuỳ ý. Nó chỉ phục vụ một danh
 * sách bề ngang cố định; mọi giá trị ngoài danh sách trả 400 kèm dòng "Use
 * thumbnail sizes listed on https://w.wiki/GHai". Đã dò thật: 1280, 1920,
 * 3840 trả 200; 1024, 1200, 1500, 1536, 1600, 2048, 2560 đều trả 400. Lượt
 * viết đầu của script này nhắm 2560 và bị chặn sạch ba mươi ảnh — con số phải
 * nằm trong danh sách, không phải con số ta thấy hợp lý.
 *
 * Trong danh sách thì 1920 là nấc đúng: hệ số phóng ở khung hero 1362px ×
 * DPR 2 tụt từ 2,13 xuống 1,42 lần. Nấc trên là 3840, gấp bốn lần số điểm ảnh
 * — chỉ màn 1920 ở DPR 2 mới dùng hết, mà cái giá là mỗi ảnh bìa nặng gấp mấy
 * lần khi đi qua bộ tối ưu của Next. Nếu hero vẫn bị báo mờ trên màn lớn thì
 * đây là chỗ nâng, và nâng có ý thức.
 *
 * ## Ảnh gốc không lớn hơn 1280 thì script KHÔNG đụng tới
 *
 * Wikimedia CÓ phóng to khi dựng thumb: xin 1920px của tệp gốc 1884px thì nó
 * trả về đúng 1920px. Nên với tệp gốc 480px, đổi URL sang 1920 vẫn "thành
 * công" và vẫn trả về ảnh — chỉ là ảnh phóng bốn lần, mờ y như cũ nhưng nặng
 * hơn nhiều. Sáu tệp thuộc diện này được liệt kê riêng ở cuối: chúng cần ĐỔI
 * ẢNH, không phải đổi URL, và đó là việc của `image-finder`.
 *
 * ## Vì sao đi chậm và thử lại
 *
 * Xin một nấc thumb chưa ai yêu cầu thì Wikimedia phải DỰNG nó ngay lúc gọi.
 * Bắn ba mươi lượt liên tiếp thì mười sáu lượt trả 429. Không phải lỗi mạng —
 * đó là hạn mức, và cách duy nhất qua được là đi chậm lại. Nghỉ giữa hai lượt
 * và lùi dần khi gặp 429; ba mươi ảnh chạy trong chừng một phút, đổi lại
 * không ảnh nào bị bỏ sót vì một con số 429 thoáng qua.
 *
 * ## Vì sao kiểm HTTP trước khi ghi
 *
 * URL thumb là địa chỉ công khai mà trang sẽ trỏ tới. Một nấc thumb chưa từng
 * được ai yêu cầu thì Wikimedia dựng nó ngay lúc gọi — thường thành công,
 * nhưng với tệp rất lớn thì có thể thất bại. Ghi một URL 404 vào CSDL là đổi
 * "ảnh mờ" thành "không có ảnh", tức làm mọi thứ tệ hơn.
 */

/**
 * Bề ngang đích. PHẢI là một nấc Wikimedia còn phục vụ — xem lý do ở trên.
 * Nấc hợp lệ đã dò được: 1280, 1920, 3840.
 */
const TARGET_WIDTH = 1920;

/** Dưới mức này thì đổi URL chỉ là phóng to, không thêm một chi tiết nào. */
const MIN_ORIGINAL = 1280;

const THUMB = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\/(\d+)px-/;

type Target = {
  bảng: "Article" | "Category";
  id: string;
  trường: "coverImage" | "ogImage";
  nhãn: string;
  url: string;
  tệp: string;
  bềNgangHiệnTại: number;
};

/** Bề ngang bản gốc của từng tệp, hỏi Commons theo lô 20 để đỡ số lượt gọi. */
async function originalWidths(files: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let i = 0; i < files.length; i += 20) {
    const titles = files
      .slice(i, i + 20)
      .map((f) => "File:" + decodeURIComponent(f))
      .join("|");
    const api =
      "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
      encodeURIComponent(titles) +
      "&prop=imageinfo&iiprop=size&format=json";
    const res = await fetch(api, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error("Commons API trả " + res.status);
    const json = (await res.json()) as {
      query: { pages: Record<string, { title: string; imageinfo?: { width: number }[] }> };
    };
    for (const page of Object.values(json.query.pages)) {
      const width = page.imageinfo?.[0]?.width;
      if (width) out.set(page.title.replace(/^File:/, "").replace(/ /g, "_"), width);
    }
  }
  return out;
}

const UA = "SciencepediaBot/1.0 (sciencepedia.contact@gmail.com)";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kiểm một URL thumb, lùi dần khi gặp 429.
 *
 * Trả về mã HTTP cuối cùng. 429 sau khi đã thử hết lượt là 429 thật — lúc đó
 * bỏ qua ảnh ấy và chạy lại script sau còn hơn ghi một URL chưa kiểm được.
 */
async function checkThumb(url: string): Promise<number> {
  let chờ = 1000;
  for (let lần = 0; lần < 5; lần += 1) {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    if (res.status !== 429) return res.status;
    await sleep(chờ);
    chờ *= 2;
  }
  return 429;
}

async function main() {
  const write = process.argv.slice(2).includes("--write");

  console.log("=== NÂNG BỀ NGANG ẢNH BÌA WIKIMEDIA ===");
  console.log(
    write ? "GHI THẬT.\n" : "Chạy thử — không ghi gì. Thêm --write để thực thi.\n",
  );

  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, coverImage: true, ogImage: true },
  });
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, coverImage: true },
  });

  const targets: Target[] = [];
  const collect = (
    bảng: Target["bảng"],
    id: string,
    nhãn: string,
    trường: Target["trường"],
    url: string | null,
  ) => {
    if (!url) return;
    const m = url.match(THUMB);
    if (!m) return;
    targets.push({
      bảng,
      id,
      trường,
      nhãn,
      url,
      tệp: m[1],
      bềNgangHiệnTại: Number(m[2]),
    });
  };

  for (const a of articles) {
    collect("Article", a.id, a.slug, "coverImage", a.coverImage);
    collect("Article", a.id, a.slug, "ogImage", a.ogImage);
  }
  for (const c of categories) {
    collect("Category", c.id, c.slug, "coverImage", c.coverImage);
  }

  if (targets.length === 0) {
    console.log("Không có ảnh bìa Wikimedia dạng thumb nào.");
    return;
  }

  const widths = await originalWidths([...new Set(targets.map((t) => t.tệp))]);

  const nâng: { t: Target; mới: string; bềNgangMới: number }[] = [];
  const quáNhỏ: Target[] = [];
  const khôngTra: Target[] = [];

  for (const t of targets) {
    const gốc = widths.get(decodeURIComponent(t.tệp)) ?? widths.get(t.tệp);
    if (!gốc) {
      khôngTra.push(t);
      continue;
    }
    if (gốc <= MIN_ORIGINAL || t.bềNgangHiệnTại >= TARGET_WIDTH) {
      quáNhỏ.push(t);
      continue;
    }
    const bềNgangMới = TARGET_WIDTH;
    nâng.push({
      t,
      bềNgangMới,
      mới: t.url.replace(`/${t.bềNgangHiệnTại}px-`, `/${bềNgangMới}px-`),
    });
  }

  console.log(`Tìm thấy ${targets.length} ảnh Wikimedia; nâng được ${nâng.length}.\n`);

  let ghi = 0;
  for (const { t, mới, bềNgangMới } of nâng) {
    const status = await checkThumb(mới);
    if (status !== 200) {
      console.log(`⚠ ${t.nhãn} (${t.trường}) — ${bềNgangMới}px trả ${status}, bỏ qua`);
      continue;
    }
    await sleep(600);

    console.log(`${t.nhãn} (${t.trường}): ${t.bềNgangHiệnTại}px → ${bềNgangMới}px`);

    if (write) {
      if (t.bảng === "Article") {
        await prisma.article.update({
          where: { id: t.id },
          data: { [t.trường]: mới },
        });
      } else {
        await prisma.category.update({ where: { id: t.id }, data: { coverImage: mới } });
      }
    }
    ghi += 1;
  }

  if (quáNhỏ.length) {
    console.log(
      `\nẢnh gốc KHÔNG lớn hơn thumb hiện tại — cần đổi ảnh, không đổi URL (${quáNhỏ.length}):`,
    );
    for (const t of quáNhỏ) {
      const gốc = widths.get(decodeURIComponent(t.tệp)) ?? widths.get(t.tệp);
      console.log(`  ${t.nhãn} (${t.trường}) — gốc ${gốc}px`);
    }
  }

  if (khôngTra.length) {
    console.log(`\nKhông tra được trên Commons (${khôngTra.length}):`);
    for (const t of khôngTra) console.log(`  ${t.nhãn} — ${t.tệp}`);
  }

  console.log(
    write
      ? `\nXong. Đã ghi ${ghi} địa chỉ.`
      : `\nSẵn sàng ghi ${ghi} địa chỉ. Chạy lại với --write.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
