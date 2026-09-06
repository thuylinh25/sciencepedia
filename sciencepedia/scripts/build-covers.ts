import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

/**
 * Dựng ảnh bìa cho các bài khái niệm trừu tượng.
 *
 *   npm run covers:build            # dựng tất cả
 *   npm run covers:build -- <slug>  # dựng một bài
 *
 * ## Vì sao tự vẽ thay vì đi tìm ảnh
 *
 * Rà 46 bài ngày 2026-09-06: 34 bài có ảnh mạnh, đều là ảnh CHỤP một hiện
 * tượng có thật — hành tinh, cực quang, hố đen M87. 12 bài còn lại đều là bài
 * khái niệm, và ảnh bìa của chúng được chọn theo kiểu "lấy file Commons đầu
 * tiên nghe đúng chủ đề": bài sóng hấp dẫn được gán ảnh chụp toà nhà LIGO
 * giữa bãi đất nâu, bài nguyên tử được gán bảng hạt nhân cắt cúp thành sọc
 * màu vô nghĩa, bài định luật Newton được gán ảnh chụp trang bìa Principia.
 *
 * Không có ảnh chụp nào của "sóng", "năng lượng" hay "định luật". Tìm tiếp
 * trên Commons chỉ lặp lại đúng vấn đề, nên nhóm này phải được VẼ.
 *
 * ## Vì sao không có một chữ nào trong ảnh
 *
 * Site song ngữ vi/en dùng chung một `coverImage`. Chữ trong ảnh sẽ chỉ đúng
 * một thứ tiếng, và không có đường nào dịch nó. Ngoài ra font trong rasterizer
 * không phải font của trình duyệt, nên chữ sẽ nhảy khỏi chỗ đã căn.
 *
 * Nên mọi thông tin ở đây là hình học: mũi tên hai đầu đo biên độ, mũi tên
 * ngang đo bước sóng, tỉ lệ giữa hạt nhân và đám mây electron được vẽ đúng
 * theo tinh thần "hạt nhân nhỏ tới mức nào". Tiêu đề và tóm tắt nằm ngay dưới
 * thẻ đã nói phần chữ rồi.
 *
 * ## Vì sao kết xuất ra WebP chứ không dùng thẳng SVG
 *
 * `next.config.ts` không bật `dangerouslyAllowSVG`, và bật nó sẽ mở đường cho
 * cả SVG từ `upload.wikimedia.org` — một nguồn bên thứ ba đã nằm trong
 * `remotePatterns`. Đổi cấu hình bảo mật ảnh của cả site để tiện cho 12 tấm
 * hình của mình là cái giá sai. WebP ở `/public` không cần `remotePatterns`,
 * không cần nới gì cả, và `next/image` vẫn tối ưu được.
 */

/** Khung ảnh bìa: `aspect-[16/10]` trong article-card.tsx. */
const W = 1600;
const H = 1000;
/** Kết xuất gấp đôi để còn sắc trên màn hình 2x. */
const SCALE = 2;

/* Token màu lấy từ src/app/globals.css, đã quy đổi oklch → hex.
   Chép giá trị chứ không đoán: ảnh phải nằm cùng hệ màu với giao diện. */
const SPACE_900 = "#020718";
const SPACE_800 = "#0b172f";
const SPACE_700 = "#19263f";
const STAR = "#f4f9ff";
const YELLOW = "#facc15";
const BLUE = "#497ef7";
const TEAL = "#00babb";

/** Nền chung: một hệ màu duy nhất cho cả bộ, để 12 thẻ đứng cạnh nhau thành một kho. */
function backdrop(seed: number): string {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const stars: string[] = [];
  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.8 + rand() * 1.9;
    const o = 0.18 + rand() * 0.5;
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${STAR}" opacity="${o.toFixed(2)}"/>`);
  }
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="78%">
      <stop offset="0%" stop-color="${SPACE_800}"/>
      <stop offset="100%" stop-color="${SPACE_900}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars.join("")}`;
}

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

/* ─────────────────── Sóng hấp dẫn: tấm không–thời gian bị võng ───────────────────

   Bài phân biệt sóng hấp dẫn với sóng trọng lực, nên bìa phải cho thấy thứ
   ĐẦU TIÊN: hai khối lượng xoáy vào nhau làm võng hình học xung quanh và bơm
   gợn ra ngoài. Ảnh cũ (toà nhà LIGO) cho thấy máy đo, không cho thấy thứ
   được đo. */
function gravitationalWaves(): string {
  const cx = W / 2;
  const cy = 505;
  /* Chiếu trục lượng: bẹt trục sâu xuống 0,3 lần trục ngang để có góc nhìn
     nghiêng quen thuộc, thay vì phối cảnh một điểm. Phối cảnh làm nửa xa của
     tấm dồn lại thành một vệt, mà nửa xa mới là chỗ gợn còn đọc được. */
  const KX = 690;
  const KZ = 205;

  const DIP = 205; // độ sâu giếng, tính bằng px màn hình
  const SIGMA = 0.24; // bề rộng giếng
  const AMP = 30; // biên độ gợn
  const LAM = 0.26; // bước sóng theo bán kính
  const DECAY = 0.72; // gợn tắt dần ra xa

  /**
   * Độ cao của tấm tại (X, Z).
   *
   * Một hàm duy nhất cho cả giếng lẫn gợn, và đó chính là chỗ bản trước sai:
   * nó vẽ gợn thành ellipse PHẲNG nổi bên trên tấm, nên hình đọc ra thành
   * "hệ hành tinh có vành đai" chứ không phải không–thời gian bị khuấy. Gợn
   * phải nằm TRÊN mặt, tức phải cộng vào cùng một độ cao với giếng.
   */
  const height = (r: number) => {
    const well = DIP * Math.exp(-((r / SIGMA) ** 2));
    // Dập gợn ở sát tâm: trong lòng giếng thì sóng chưa tách ra khỏi nguồn.
    const born = 1 - Math.exp(-((r / 0.3) ** 2));
    const ripple =
      AMP * Math.sin((r / LAM) * Math.PI * 2) * Math.exp(-r / DECAY) * born;
    return well + ripple;
  };

  const project = (X: number, Z: number) =>
    [cx + X * KX, cy + Z * KZ + height(Math.hypot(X, Z))] as const;

  /* Tấm hình TRÒN, không phải hình chữ nhật.
     Bản trước cắt lưới theo ô vuông nên nó cụt hẳn ở hai mép trái phải và
     đọc ra thành một tấm thảm lơ lửng. Không–thời gian không có mép; cắt
     tròn rồi làm mờ rìa thì mắt hiểu là nó còn tiếp ra ngoài khung. */
  const N = 15;
  const STEP = 2 / N;
  const SAMPLES = 84;
  const lines: string[] = [];

  const span = (v: number) => Math.sqrt(Math.max(0, 1 - v * v));

  // Đường theo chiều sâu cố định
  for (let i = 0; i <= N; i++) {
    const Z = -1 + i * STEP;
    const xm = span(Z);
    if (xm < 0.04) continue;
    const d: string[] = [];
    for (let j = 0; j <= SAMPLES; j++) {
      const X = -xm + (2 * xm * j) / SAMPLES;
      const [x, y] = project(X, Z);
      d.push(`${j === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    lines.push(
      `<path d="${d.join(" ")}" fill="none" stroke="#4271c4" stroke-width="2.8" opacity="0.85"/>`,
    );
  }
  // Đường theo chiều ngang cố định
  for (let j = 0; j <= N; j++) {
    const X = -1 + j * STEP;
    const zm = span(X);
    if (zm < 0.04) continue;
    const d: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const Z = -zm + (2 * zm * i) / SAMPLES;
      const [x, y] = project(X, Z);
      d.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    lines.push(
      `<path d="${d.join(" ")}" fill="none" stroke="#4271c4" stroke-width="2.8" opacity="0.6"/>`,
    );
  }

  // Bỏ: quầng tối làm mờ lưới nhưng không làm mờ vòng vàng, nên vòng lại
  // trông tách khỏi mặt — đúng lỗi vừa sửa. Rìa tròn tự nó đã gọn.
  const _vignette = `
    <defs><radialGradient id="vig" cx="50%" cy="50%" r="50%">
      <stop offset="55%" stop-color="${SPACE_900}" stop-opacity="0"/>
      <stop offset="88%" stop-color="${SPACE_900}" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="${SPACE_900}" stop-opacity="1"/>
    </radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy + 30}" rx="${KX + 90}" ry="${KZ + 190}" fill="url(#vig)"/>`;

  /* Đỉnh sóng: quỹ tích r sao cho sin đạt cực đại, tức r = λ/4 + nλ.
     Vẽ chúng bằng chính hàm `height` nên chúng bám đúng mặt tấm — nhìn là
     thấy sóng đang chạy ra, không phải mấy cái vòng dán lên ảnh. */
  const crests: string[] = [];
  for (let n = 1; n <= 3; n++) {
    const r = LAM / 4 + n * LAM;
    const d: string[] = [];
    for (let k = 0; k <= 120; k++) {
      const a = (k / 120) * Math.PI * 2;
      const [x, y] = project(r * Math.cos(a), r * Math.sin(a));
      d.push(`${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    crests.push(
      `<path d="${d.join(" ")} Z" fill="none" stroke="${YELLOW}" stroke-width="${(5.5 - n).toFixed(1)}" opacity="${(0.85 - n * 0.18).toFixed(2)}"/>`,
    );
  }

  // Hai khối lượng đang xoáy vào nhau, đặt đúng trên đáy giếng.
  const [ax, ay] = project(-0.1, -0.03);
  const [bx, by] = project(0.1, 0.03);
  const masses = `
    <circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="31" fill="${SPACE_900}" stroke="${YELLOW}" stroke-width="6"/>
    <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="23" fill="${SPACE_900}" stroke="${TEAL}" stroke-width="6"/>`;

  const glow = `
    <defs><radialGradient id="wellglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${YELLOW}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${YELLOW}" stop-opacity="0"/>
    </radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy + DIP * 0.78}" rx="300" ry="130" fill="url(#wellglow)"/>`;

  return svg(
    backdrop(11) + lines.join("") + glow + crests.join("") + masses,
  );
}

/* ─────────────────── Nguyên tử: hạt nhân bé, đám mây to ───────────────────

   Bài mở đầu bằng đúng một ý: hạt nhân giữ gần hết KHỐI LƯỢNG, electron giữ
   gần hết THỂ TÍCH. Nên bìa vẽ đúng sự tương phản đó — đám mây rộng gần hết
   khung, hạt nhân là một chấm sáng ở giữa. Ảnh cũ là bảng hạt nhân cắt cúp,
   không nói được gì ở cỡ thẻ.

   Ba cụm nhỏ bên dưới là ba đồng vị hydro (1p, 1p1n, 1p2n): cùng số proton,
   khác số neutron — định nghĩa của đồng vị, vẽ chứ không viết. */
function atom(): string {
  const cx = W / 2;
  const cy = 470;

  let s = 7;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  // Đám mây xác suất: chấm dày ở trong, thưa dần ra ngoài.
  const cloud: string[] = [];
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.pow(rand(), 0.55) * 360;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.92;
    const o = (1 - rr / 360) * 0.55 + 0.05;
    cloud.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + rand() * 2).toFixed(2)}" fill="${BLUE}" opacity="${o.toFixed(2)}"/>`);
  }

  const halo = `
    <defs>
      <radialGradient id="cloud" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.42"/>
        <stop offset="55%" stop-color="${BLUE}" stop-opacity="0.13"/>
        <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${YELLOW}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${YELLOW}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="380" ry="350" fill="url(#cloud)"/>`;

  // Hạt nhân: cố ý vẽ NHỎ. Tỉ lệ thật còn nhỏ hơn nhiều bậc, vẽ đúng tỉ lệ
  // thì nó biến mất — nên đây là mức nhỏ nhất còn nhìn thấy được.
  const nucleons = [
    [-9, -6, YELLOW], [8, -8, STAR], [0, 6, YELLOW], [-6, 9, STAR], [11, 5, YELLOW],
  ] as const;
  const nucleus = `
    <circle cx="${cx}" cy="${cy}" r="86" fill="url(#core)"/>
    ${nucleons.map(([dx, dy, c]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="10" fill="${c}"/>`).join("")}`;

  // Vòng đứt nét đánh dấu bờ đám mây — để mắt thấy "thể tích" là của electron.
  const boundary = `<ellipse cx="${cx}" cy="${cy}" rx="352" ry="325" fill="none" stroke="${BLUE}" stroke-width="2.5" opacity="0.5" stroke-dasharray="14 16"/>`;

  // Ba đồng vị hydro: cùng 1 proton (vàng), khác số neutron (trắng).
  const iso = (ox: number, ns: [number, number][]) => `
    <circle cx="${ox}" cy="880" r="52" fill="${SPACE_800}" stroke="${SPACE_700}" stroke-width="3"/>
    <circle cx="${ox}" cy="880" r="13" fill="${YELLOW}"/>
    ${ns.map(([dx, dy]) => `<circle cx="${ox + dx}" cy="${880 + dy}" r="13" fill="${STAR}" opacity="0.92"/>`).join("")}`;
  const isotopes =
    iso(cx - 210, []) + iso(cx, [[22, 10]]) + iso(cx + 210, [[22, 10], [-20, 13]]);

  return svg(backdrop(23) + halo + cloud.join("") + boundary + nucleus + isotopes);
}

/* ─────────────────── Sóng: bước sóng, biên độ, tần số ───────────────────

   Ảnh cũ là line art đen trên nền trắng, đứng giữa giao diện nền tối thì vừa
   chói vừa nghèo nàn. Bài định nghĩa bốn đại lượng, nên bìa đo hai đại lượng
   không gian ngay trên đường sóng, và đặt một sóng tần số gấp đôi phía dưới
   để tần số trở thành thứ SO SÁNH ĐƯỢC chứ không phải một chữ. */
function wave(): string {
  const axis = 430;
  const amp = 190;
  const left = 150;
  const right = 1450;
  const lambda = (right - left) / 3;

  const path = (a: number, k: number, y0: number, phase = 0) => {
    const pts: string[] = [];
    for (let x = left; x <= right; x += 4) {
      const y = y0 - a * Math.sin(((x - left) / lambda) * Math.PI * 2 * k + phase);
      pts.push(`${x === left ? "M" : "L"}${x} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const crest1 = left + lambda * 0.25;
  const crest2 = crest1 + lambda;

  const arrow = `<defs>
    <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="${STAR}"/>
    </marker>
    <marker id="b" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M10 0 L0 5 L10 10 z" fill="${STAR}"/>
    </marker>
  </defs>`;

  const grid = Array.from({ length: 7 }, (_, i) => {
    const y = 140 + i * 130;
    return `<line x1="70" y1="${y}" x2="${W - 70}" y2="${y}" stroke="${SPACE_700}" stroke-width="1.5" opacity="0.45"/>`;
  }).join("");

  // Sóng chính: biên độ lớn, một bước sóng được đo tường minh.
  const main = `<path d="${path(amp, 1, axis)}" fill="none" stroke="${YELLOW}" stroke-width="9" stroke-linecap="round"/>`;
  // Sóng dưới: cùng biên độ nhỏ hơn, tần số gấp đôi — cho mắt so sánh.
  const second = `<path d="${path(95, 2, 800)}" fill="none" stroke="${TEAL}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;

  const axes = `
    <line x1="70" y1="${axis}" x2="${W - 70}" y2="${axis}" stroke="${STAR}" stroke-width="2.5" opacity="0.75"/>
    <line x1="70" y1="800" x2="${W - 70}" y2="800" stroke="${STAR}" stroke-width="2" opacity="0.4"/>`;

  // Bước sóng: đo từ đỉnh này tới đỉnh kế tiếp.
  const lam = `
    <line x1="${crest1}" y1="${axis - amp}" x2="${crest1}" y2="${axis - amp - 108}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>
    <line x1="${crest2}" y1="${axis - amp}" x2="${crest2}" y2="${axis - amp - 108}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>
    <line x1="${crest1}" y1="${axis - amp - 78}" x2="${crest2}" y2="${axis - amp - 78}" stroke="${STAR}" stroke-width="3.5" marker-start="url(#b)" marker-end="url(#a)"/>`;

  // Biên độ: từ trục lên đỉnh.
  const ampMark = `
    <line x1="${crest2 + 250}" y1="${axis}" x2="${crest2 + 250}" y2="${axis - amp}" stroke="${STAR}" stroke-width="3.5" marker-start="url(#b)" marker-end="url(#a)"/>
    <line x1="${crest2 + 180}" y1="${axis - amp}" x2="${crest2 + 320}" y2="${axis - amp}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>`;

  return svg(backdrop(41) + arrow + grid + axes + main + second + lam + ampMark);
}

const COVERS: Record<string, () => string> = {
  "song-hap-dan-va-song-trong-luc": gravitationalWaves,
  "nguyen-tu-cau-tao-va-dong-vi": atom,
  "song-buoc-song-tan-so-bien-do": wave,
};

/* Ghi công cho ảnh tự vẽ.

   Không bỏ trống: ghi công cũ của ba bài này đang trỏ về LIGO Laboratory và
   Wikimedia, mà ảnh thì không còn là của họ nữa. docs/content-rules.md nói
   thẳng ghi công sai người tệ hơn không ghi, nên trường này phải được ghi đè
   cùng lúc với `coverImage`, không để lần sau. */
const CREDIT = "Đồ hoạ: Sciencepedia — dựng bằng `scripts/build-covers.ts`.";
const CREDIT_EN = "Illustration: Sciencepedia — generated by `scripts/build-covers.ts`.";

async function applyToDatabase(slugs: string[]) {
  // Nạp Prisma muộn: lượt dựng ảnh thuần tuý không cần chạm tới CSDL.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const slug of slugs) {
      const article = await prisma.article.findUnique({
        where: { slug },
        select: { id: true, coverImage: true },
      });
      if (!article) {
        console.error(`   ✗ ${slug}: không có bài này trong CSDL`);
        process.exitCode = 1;
        continue;
      }
      await prisma.article.update({
        where: { id: article.id },
        data: {
          coverImage: `/covers/${slug}.webp`,
          coverImageCredit: CREDIT,
          coverImageCreditEn: CREDIT_EN,
        },
      });
      console.log(`   ↳ CSDL: ${article.coverImage ?? "(trống)"}\n              → /covers/${slug}.webp`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const only = argv.filter((a) => !a.startsWith("--"));
  const outDir = join(process.cwd(), "public", "covers");
  mkdirSync(outDir, { recursive: true });

  const slugs = only.length > 0 ? only : Object.keys(COVERS);
  for (const slug of slugs) {
    const make = COVERS[slug];
    if (!make) {
      console.error(`✗ ${slug}: chưa có bản vẽ`);
      process.exitCode = 1;
      continue;
    }
    const source = make();
    // Giữ lại SVG để còn xem và sửa bằng mắt; WebP mới là thứ site dùng.
    writeFileSync(join(outDir, `${slug}.svg`), source, "utf8");
    const out = join(outDir, `${slug}.webp`);
    await sharp(Buffer.from(source), { density: 96 * SCALE })
      .resize(W * SCALE, H * SCALE)
      .webp({ quality: 88 })
      .toFile(out);
    const { size } = statSync(out);
    console.log(
      `✓ /covers/${slug}.webp  ${W * SCALE}×${H * SCALE}  ${(size / 1024).toFixed(0)} KB`,
    );
  }

  if (apply) {
    console.log("");
    await applyToDatabase(slugs.filter((slug) => COVERS[slug]));
  } else {
    console.log("\nChưa ghi CSDL. Thêm --apply để gắn ảnh vào bài.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
