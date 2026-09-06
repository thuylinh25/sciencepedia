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
  const cy = 468;
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
  const cy = 440;

  let s = 7;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  // Đám mây xác suất: chấm dày ở trong, thưa dần ra ngoài.
  const cloud: string[] = [];
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.pow(rand(), 0.55) * 415;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.92;
    const o = (1 - rr / 415) * 0.55 + 0.05;
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
    <ellipse cx="${cx}" cy="${cy}" rx="440" ry="408" fill="url(#cloud)"/>`;

  // Hạt nhân: cố ý vẽ NHỎ. Tỉ lệ thật còn nhỏ hơn nhiều bậc, vẽ đúng tỉ lệ
  // thì nó biến mất — nên đây là mức nhỏ nhất còn nhìn thấy được.
  const nucleons = [
    [-9, -6, YELLOW], [8, -8, STAR], [0, 6, YELLOW], [-6, 9, STAR], [11, 5, YELLOW],
  ] as const;
  const nucleus = `
    <circle cx="${cx}" cy="${cy}" r="86" fill="url(#core)"/>
    ${nucleons.map(([dx, dy, c]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="10" fill="${c}"/>`).join("")}`;

  // Vòng đứt nét đánh dấu bờ đám mây — để mắt thấy "thể tích" là của electron.
  const boundary = `<ellipse cx="${cx}" cy="${cy}" rx="408" ry="378" fill="none" stroke="${BLUE}" stroke-width="2.5" opacity="0.5" stroke-dasharray="14 16"/>`;

  // Ba đồng vị hydro: cùng 1 proton (vàng), khác số neutron (trắng).
  const iso = (ox: number, ns: [number, number][]) => `
    <circle cx="${ox}" cy="908" r="52" fill="${SPACE_800}" stroke="${SPACE_700}" stroke-width="3"/>
    <circle cx="${ox}" cy="908" r="13" fill="${YELLOW}"/>
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
  const axis = 408;
  const amp = 148;
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
  const second = `<path d="${path(84, 2, 762)}" fill="none" stroke="${TEAL}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;

  const axes = `
    <line x1="70" y1="${axis}" x2="${W - 70}" y2="${axis}" stroke="${STAR}" stroke-width="2.5" opacity="0.75"/>
    <line x1="70" y1="762" x2="${W - 70}" y2="762" stroke="${STAR}" stroke-width="2" opacity="0.4"/>`;

  // Bước sóng: đo từ đỉnh này tới đỉnh kế tiếp.
  const lam = `
    <line x1="${crest1}" y1="${axis - amp}" x2="${crest1}" y2="${axis - amp - 88}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>
    <line x1="${crest2}" y1="${axis - amp}" x2="${crest2}" y2="${axis - amp - 88}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>
    <line x1="${crest1}" y1="${axis - amp - 62}" x2="${crest2}" y2="${axis - amp - 62}" stroke="${STAR}" stroke-width="3.5" marker-start="url(#b)" marker-end="url(#a)"/>`;

  // Biên độ: từ trục lên đỉnh.
  const ampMark = `
    <line x1="${crest2 + 250}" y1="${axis}" x2="${crest2 + 250}" y2="${axis - amp}" stroke="${STAR}" stroke-width="3.5" marker-start="url(#b)" marker-end="url(#a)"/>
    <line x1="${crest2 + 180}" y1="${axis - amp}" x2="${crest2 + 320}" y2="${axis - amp}" stroke="${STAR}" stroke-width="2" opacity="0.6" stroke-dasharray="8 8"/>`;

  return svg(backdrop(41) + arrow + grid + axes + main + second + lam + ampMark);
}

/* ─────────────────────────── Bộ dựng hình dùng chung ─────────────────────────── */

/**
 * Nền phẳng cho nhóm bài sinh học và sức khoẻ.
 *
 * Nền sao hợp với thiên văn nhưng lạc quẻ hẳn với giấc ngủ và tim mạch — một
 * bài về hệ tim mạch nằm trên nền dải Ngân Hà thì đọc ra là lỗi ghép ảnh. Vẫn
 * giữ đúng hệ màu tối để cả 12 thẻ là một bộ.
 */
function plainBackdrop(): string {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111c33"/>
      <stop offset="100%" stop-color="${SPACE_900}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}

/** Đầu mũi tên. `id` phải khác nhau trong cùng một SVG. */
function arrowHead(id: string, color: string): string {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0 0 L10 5 L0 10 z" fill="${color}"/>
  </marker>`;
}

/** Lưới mảnh làm nền cho các hình có trục toạ độ. */
function faintGrid(rows: number, from: number, to: number): string {
  return Array.from({ length: rows }, (_, i) => {
    const y = from + ((to - from) * i) / (rows - 1);
    return `<line x1="80" y1="${y}" x2="${W - 80}" y2="${y}" stroke="${SPACE_700}" stroke-width="1.5" opacity="0.5"/>`;
  }).join("");
}

/* ─── Ba định luật Newton: ba ô, mỗi ô một định luật ─── */
function newtonLaws(): string {
  const y = 470;
  const bx = [300, 800, 1300];

  const defs = `<defs>${arrowHead("aw", YELLOW)}${arrowHead("at", TEAL)}${arrowHead("ab", BLUE)}</defs>`;

  // 1. Quán tính: vật giữ nguyên vận tốc khi không có lực tác dụng.
  const first = `
    <circle cx="${bx[0] - 118}" cy="${y}" r="46" fill="${BLUE}" opacity="0.55"/>
    <circle cx="${bx[0]}" cy="${y}" r="46" fill="${BLUE}" opacity="0.8"/>
    <line x1="${bx[0] + 70}" y1="${y}" x2="${bx[0] + 250}" y2="${y}" stroke="${STAR}" stroke-width="7" marker-end="url(#aw)"/>`;

  // 2. F = ma: cùng một lực, khối lượng gấp đôi thì gia tốc còn một nửa.
  const second = `
    <circle cx="${bx[1] - 60}" cy="${y - 150}" r="36" fill="${YELLOW}" opacity="0.9"/>
    <line x1="${bx[1] - 15}" y1="${y - 150}" x2="${bx[1] + 250}" y2="${y - 150}" stroke="${YELLOW}" stroke-width="7" marker-end="url(#aw)"/>
    <circle cx="${bx[1] - 60}" cy="${y + 180}" r="64" fill="${YELLOW}" opacity="0.55"/>
    <line x1="${bx[1] + 5}" y1="${y + 180}" x2="${bx[1] + 130}" y2="${y + 180}" stroke="${YELLOW}" stroke-width="7" marker-end="url(#aw)"/>`;

  // 3. Tác dụng và phản tác dụng: hai lực bằng nhau, ngược chiều, trên HAI vật.
  const third = `
    <circle cx="${bx[2] - 96}" cy="${y}" r="54" fill="${TEAL}" opacity="0.85"/>
    <circle cx="${bx[2] + 96}" cy="${y}" r="54" fill="${STAR}" opacity="0.65"/>
    <line x1="${bx[2] - 18}" y1="${y - 108}" x2="${bx[2] - 150}" y2="${y - 108}" stroke="${TEAL}" stroke-width="7" marker-end="url(#at)"/>
    <line x1="${bx[2] + 18}" y1="${y + 108}" x2="${bx[2] + 150}" y2="${y + 108}" stroke="${STAR}" stroke-width="7" marker-end="url(#ab)"/>`;

  const dividers = [560, 1040]
    .map((x) => `<line x1="${x}" y1="170" x2="${x}" y2="790" stroke="${SPACE_700}" stroke-width="2" opacity="0.8"/>`)
    .join("");

  return svg(backdrop(3) + defs + dividers + first + second + third);
}

/* ─── Định luật Kepler: elip có Mặt Trời ở MỘT tiêu điểm, cộng luật diện tích ─── */
function keplerLaws(): string {
  const cx = 830;
  const cy = 470;
  const a = 620;
  const b = 470;
  const c = Math.sqrt(a * a - b * b); // tiêu cự
  const sunX = cx - c;

  const pt = (t: number) => [cx + a * Math.cos(t), cy + b * Math.sin(t)] as const;

  /* Luật 2: bán kính vector quét những diện tích BẰNG NHAU trong những khoảng
     thời gian bằng nhau. Cận nhật thì cung rộng mà bán kính ngắn; viễn nhật
     thì bán kính dài mà cung hẹp. Hai quạt phải bằng diện tích — đó KHÔNG
     phải chi tiết trang trí, đó là toàn bộ nội dung của định luật.

     Bản đầu chọn góc bằng mắt và ra hai quạt lệch nhau nhiều lần. Ở đây diện
     tích được tính thật bằng công thức shoelace rồi dò nhị phân góc viễn nhật
     cho khớp, nên hình đúng theo đúng nghĩa đo được. */
  const fan = (t0: number, t1: number) => {
    const steps = 60;
    const pts: (readonly [number, number])[] = [[sunX, cy]];
    for (let i = 0; i <= steps; i++) {
      pts.push(pt(t0 + ((t1 - t0) * i) / steps));
    }
    return pts;
  };

  const areaOf = (pts: (readonly [number, number])[]) => {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      sum += x0 * y1 - x1 * y0;
    }
    return Math.abs(sum) / 2;
  };

  // Quạt cận nhật (quanh t = π, điểm gần Mặt Trời nhất) — chọn trước.
  const periHalf = Math.PI * 0.17;
  const targetArea = areaOf(fan(Math.PI - periHalf, Math.PI + periHalf));

  // Dò nhị phân nửa góc ở viễn nhật (quanh t = 0) cho cùng diện tích.
  let lo = 0.0005;
  let hi = periHalf;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (areaOf(fan(-mid, mid)) < targetArea) lo = mid;
    else hi = mid;
  }
  const aphHalf = (lo + hi) / 2;

  const sector = (t0: number, t1: number, fill: string) => {
    const pts = fan(t0, t1);
    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(" ");
    return `<path d="${d} Z" fill="${fill}" opacity="0.32"/>`;
  };

  const orbit = (() => {
    const d: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const [x, y] = pt((i / 240) * Math.PI * 2);
      d.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return `<path d="${d.join(" ")} Z" fill="none" stroke="${STAR}" stroke-width="3" opacity="0.55"/>`;
  })();

  const [px, py] = pt(Math.PI - periHalf);
  const [px2, py2] = pt(Math.PI + periHalf);
  const [qx, qy] = pt(-aphHalf);
  const [qx2, qy2] = pt(aphHalf);

  return svg(
    backdrop(5) +
      orbit +
      // cận nhật: cung rộng, bán kính ngắn
      sector(Math.PI - periHalf, Math.PI + periHalf, YELLOW) +
      // viễn nhật: cùng DIỆN TÍCH nhưng cung hẹp hơn nhiều
      sector(-aphHalf, aphHalf, TEAL) +
      `<circle cx="${sunX}" cy="${cy}" r="52" fill="${YELLOW}"/>
       <circle cx="${sunX}" cy="${cy}" r="104" fill="${YELLOW}" opacity="0.15"/>
       <circle cx="${(cx + c).toFixed(1)}" cy="${cy}" r="10" fill="${STAR}" opacity="0.45"/>
       <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="20" fill="${YELLOW}"/>
       <circle cx="${px2.toFixed(1)}" cy="${py2.toFixed(1)}" r="20" fill="${YELLOW}"/>
       <circle cx="${qx.toFixed(1)}" cy="${qy.toFixed(1)}" r="20" fill="${TEAL}"/>
       <circle cx="${qx2.toFixed(1)}" cy="${qy2.toFixed(1)}" r="20" fill="${TEAL}"/>`,
  );
}

/* ─── Tương đối hẹp: đồng hồ ánh sáng, đứng yên và đang chuyển động ─── */
function specialRelativity(): string {
  const topY = 262;
  const botY = 640;

  /* Cùng một đồng hồ, nhìn từ hai hệ quy chiếu. Đứng yên thì ánh sáng đi
     thẳng lên xuống; chuyển động thì nó đi đường zigzag DÀI HƠN. Tốc độ ánh
     sáng như nhau với cả hai, nên quãng dài hơn nghĩa là một "tích tắc" mất
     nhiều thời gian hơn. Toàn bộ giãn nở thời gian nằm trong hình này. */
  const mirrors = (x0: number, x1: number, color: string) => `
    <line x1="${x0}" y1="${topY}" x2="${x1}" y2="${topY}" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x0}" y1="${botY}" x2="${x1}" y2="${botY}" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;

  const still =
    mirrors(210, 430, STAR) +
    `<path d="M320 ${botY} L320 ${topY}" stroke="${YELLOW}" stroke-width="6" stroke-dasharray="18 14"/>
     <circle cx="320" cy="${(topY + botY) / 2}" r="14" fill="${YELLOW}"/>`;

  const movingStart = 760;
  const step = 200;
  const moving =
    mirrors(movingStart - 110, movingStart + 110, STAR) +
    mirrors(movingStart + step - 110, movingStart + step + 110, STAR) +
    mirrors(movingStart + step * 2 - 110, movingStart + step * 2 + 110, STAR) +
    `<path d="M${movingStart} ${botY} L${movingStart + step} ${topY} L${movingStart + step * 2} ${botY}"
       fill="none" stroke="${TEAL}" stroke-width="6" stroke-dasharray="18 14"/>
     <circle cx="${movingStart + step}" cy="${topY}" r="14" fill="${TEAL}"/>
     <line x1="${movingStart - 130}" y1="${botY + 92}" x2="${movingStart + step * 2 + 60}" y2="${botY + 92}"
       stroke="${STAR}" stroke-width="5" marker-end="url(#av)" opacity="0.8"/>`;

  return svg(
    backdrop(9) + `<defs>${arrowHead("av", STAR)}</defs>` + still + moving,
  );
}

/* ─── Khối lượng quán tính và trọng lượng: cùng vật, hai đại lượng khác nhau ─── */
function massVsWeight(): string {
  const y = 430;
  const left = 450;
  const right = 1150;

  /* Cùng một quả cầu ở hai nơi. Mũi tên XUỐNG là trọng lượng — nó ĐỔI theo
     hành tinh. Mũi tên NGANG là lực cần để tăng tốc nó — nó KHÔNG đổi, vì
     khối lượng quán tính không phụ thuộc bạn đang đứng ở đâu. */
  const body = (x: number, weightLen: number, arcR: number, arcColor: string) => `
    <path d="M${x - 300} ${y + 300} A ${arcR} ${arcR} 0 0 1 ${x + 300} ${y + 300}"
      fill="none" stroke="${arcColor}" stroke-width="6" opacity="0.5"/>
    <circle cx="${x}" cy="${y}" r="78" fill="${BLUE}" opacity="0.85"/>
    <line x1="${x}" y1="${y + 94}" x2="${x}" y2="${y + 94 + weightLen}" stroke="${YELLOW}" stroke-width="9" marker-end="url(#aw)"/>
    <line x1="${x - 94}" y1="${y}" x2="${x - 268}" y2="${y}" stroke="${TEAL}" stroke-width="9" marker-end="url(#at)"/>`;

  return svg(
    backdrop(13) +
      `<defs>${arrowHead("aw", YELLOW)}${arrowHead("at", TEAL)}</defs>` +
      `<line x1="800" y1="130" x2="800" y2="880" stroke="${SPACE_700}" stroke-width="2" opacity="0.8"/>` +
      body(left, 232, 820, "#3a5f9e") +
      body(right, 78, 1700, "#3a5f9e"),
  );
}

/* ─── Năng lượng: con lắc, tổng không đổi ─── */
function energy(): string {
  const pivotX = W / 2;
  const pivotY = 150;
  const len = 420;
  const swing = 0.85; // radian, biên độ

  const bob = (angle: number) =>
    [pivotX + Math.sin(angle) * len, pivotY + Math.cos(angle) * len] as const;

  const arcPts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const [x, y] = bob(-swing + (2 * swing * i) / 60);
    arcPts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  /* Ba vị trí, ba cột. Cột nào cũng CAO BẰNG NHAU — đó là toàn bộ ý của bài:
     năng lượng đổi dạng chứ tổng không đổi. Vàng là động năng, lam là thế năng. */
  const BAR_H = 250;
  const bar = (x: number, kineticFraction: number) => {
    const k = BAR_H * kineticFraction;
    const top = 880 - BAR_H;
    return `
      <rect x="${x - 58}" y="${top}" width="116" height="${BAR_H - k}" rx="8" fill="${BLUE}" opacity="0.75"/>
      <rect x="${x - 58}" y="${top + (BAR_H - k)}" width="116" height="${k}" rx="8" fill="${YELLOW}" opacity="0.9"/>
      <rect x="${x - 58}" y="${top}" width="116" height="${BAR_H}" rx="8" fill="none" stroke="${STAR}" stroke-width="2.5" opacity="0.65"/>`;
  };

  const positions: [number, number][] = [
    [-swing, 0],
    [0, 1],
    [swing, 0],
  ];

  return svg(
    backdrop(17) +
      `<path d="${arcPts.join(" ")}" fill="none" stroke="${STAR}" stroke-width="2.5" opacity="0.35" stroke-dasharray="12 12"/>
       <circle cx="${pivotX}" cy="${pivotY}" r="12" fill="${STAR}" opacity="0.8"/>` +
      positions
        .map(([angle, kf]) => {
          const [x, y] = bob(angle);
          const dim = kf === 1 ? 1 : 0.55;
          return `<line x1="${pivotX}" y1="${pivotY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${STAR}" stroke-width="3" opacity="${0.25 + dim * 0.4}"/>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${kf === 1 ? 40 : 34}" fill="${kf === 1 ? YELLOW : BLUE}" opacity="${0.55 + dim * 0.4}"/>`;
        })
        .join("") +
      positions.map(([angle, kf]) => bar(bob(angle)[0], kf)).join(""),
  );
}

/* ─── Thang khoảng cách vũ trụ: các nấc CHỒNG LÊN NHAU ─── */
function distanceLadder(): string {
  const y0 = 262;
  const gap = 128;
  const x0 = 150;
  const x1 = W - 150;

  /* Điều đáng nhớ nhất về thang đo này là các nấc phải CHỒNG LẤN: nấc sau
     được hiệu chuẩn bằng nấc trước ở vùng cả hai cùng đo được. Vẽ chúng thành
     những thanh gối đầu nhau, không phải những đoạn nối đuôi. */
  const rungs: [number, number, string][] = [
    [0.0, 0.3, TEAL], // radar, thị sai
    [0.18, 0.55, BLUE], // sao biến quang Cepheid
    [0.42, 0.8, YELLOW], // siêu tân tinh Ia
    [0.66, 1.0, "#c58cf0"], // dịch chuyển đỏ
  ];

  const axis = `
    <line x1="${x0}" y1="${y0 + gap * 4 + 40}" x2="${x1}" y2="${y0 + gap * 4 + 40}" stroke="${STAR}" stroke-width="3" opacity="0.6"/>
    ${Array.from({ length: 9 }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / 8;
      return `<line x1="${x}" y1="${y0 + gap * 4 + 40}" x2="${x}" y2="${y0 + gap * 4 + 62}" stroke="${STAR}" stroke-width="3" opacity="0.45"/>`;
    }).join("")}`;

  const bars = rungs
    .map(([a, b, color], i) => {
      const xa = x0 + (x1 - x0) * a;
      const xb = x0 + (x1 - x0) * b;
      const y = y0 + gap * i;
      return `<rect x="${xa}" y="${y - 22}" width="${xb - xa}" height="44" rx="22" fill="${color}" opacity="0.85"/>
        <line x1="${xa}" y1="${y + 30}" x2="${xa}" y2="${y0 + gap * 4 + 40}" stroke="${color}" stroke-width="2" opacity="0.3" stroke-dasharray="7 9"/>
        <line x1="${xb}" y1="${y + 30}" x2="${xb}" y2="${y0 + gap * 4 + 40}" stroke="${color}" stroke-width="2" opacity="0.3" stroke-dasharray="7 9"/>`;
    })
    .join("");

  return svg(backdrop(19) + bars + axis);
}

/* ─── Chòm sao Hoàng Đạo: dải hoàng đới và đường đi của Mặt Trời ─── */
function zodiac(): string {
  let s = 29;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  // Hoàng đạo: một cung thoải cắt ngang khung.
  const path = (dy: number) =>
    `M0 ${520 + dy} C ${W * 0.3} ${340 + dy}, ${W * 0.7} ${700 + dy}, ${W} ${430 + dy}`;
  const at = (t: number) => {
    // xấp xỉ đủ tốt cho việc rắc sao dọc cung
    const p0 = [0, 520],
      p1 = [W * 0.3, 340],
      p2 = [W * 0.7, 700],
      p3 = [W, 470];
    const u = 1 - t;
    return [
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ] as const;
  };

  // Dải hoàng đới rộng 8 độ mỗi bên — vùng mà Mặt Trời, Mặt Trăng và các
  // hành tinh luôn nằm trong đó.
  const band = `
    <path d="${path(-88)} L ${W} ${470 + 88} C ${W * 0.7} ${640 + 88}, ${W * 0.3} ${300 + 88}, 0 ${470 + 88} Z"
      fill="${BLUE}" opacity="0.1"/>
    <path d="${path(0)}" fill="none" stroke="${YELLOW}" stroke-width="3" opacity="0.55" stroke-dasharray="16 14"/>`;

  // Bốn chòm sao dọc dải: chấm sao nối bằng nét mảnh.
  const shapes: string[] = [];
  for (let c = 0; c < 4; c++) {
    const [bx, by] = at(0.13 + c * 0.25);
    const n = 4 + Math.floor(rand() * 2);
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      pts.push([bx + (rand() - 0.5) * 230, by + (rand() - 0.5) * 190]);
    }
    shapes.push(
      `<path d="${pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")}"
        fill="none" stroke="${STAR}" stroke-width="2.5" opacity="0.5"/>`,
    );
    shapes.push(
      pts
        .map(
          (p) =>
            `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(4 + rand() * 5).toFixed(1)}" fill="${STAR}"/>`,
        )
        .join(""),
    );
  }

  const [sx, sy] = at(0.62);
  const sun = `
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="96" fill="${YELLOW}" opacity="0.14"/>
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="40" fill="${YELLOW}"/>`;

  return svg(backdrop(29) + band + shapes.join("") + sun);
}

/* ─── Giấc ngủ: biểu đồ giai đoạn qua một đêm ─── */
function sleepStages(): string {
  /* Đây là hypnogram thật, không phải hình trang trí: N3 dồn về nửa đầu đêm,
     REM dài dần về sáng. Bài nói đúng điều đó, và câu quan trọng nhất của nó
     — "cắt hai tiếng cuối là cắt gần trọn REM" — chỉ hiện ra khi nhìn hình. */
  const rows = { REM: 250, N1: 385, N2: 520, N3: 655 };
  const x0 = 140;
  const x1 = W - 140;

  // 5 chu kỳ; mỗi mục là [giai đoạn, phần thời gian của chu kỳ]
  const cycles: [keyof typeof rows, number][][] = [
    [["N1", 0.1], ["N2", 0.3], ["N3", 0.5], ["REM", 0.1]],
    [["N1", 0.06], ["N2", 0.3], ["N3", 0.44], ["REM", 0.2]],
    [["N2", 0.4], ["N3", 0.3], ["REM", 0.3]],
    [["N2", 0.48], ["N3", 0.12], ["REM", 0.4]],
    [["N2", 0.42], ["REM", 0.58]],
  ];

  const total = cycles.length;
  const cycleW = (x1 - x0) / total;
  const pts: [number, number][] = [];
  cycles.forEach((cycle, ci) => {
    let x = x0 + ci * cycleW;
    for (const [stage, frac] of cycle) {
      const w = cycleW * frac;
      pts.push([x, rows[stage]], [x + w, rows[stage]]);
      x += w;
    }
  });

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

  const lanes = Object.entries(rows)
    .map(
      ([stage, y]) =>
        `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${SPACE_700}" stroke-width="2" opacity="0.9"/>
         <circle cx="${x0 - 34}" cy="${y}" r="9" fill="${stage === "REM" ? TEAL : stage === "N3" ? YELLOW : BLUE}" opacity="0.9"/>`,
    )
    .join("");

  // Tô đậm các đoạn REM để mắt thấy chúng dài dần về sáng.
  const remBars = (() => {
    const out: string[] = [];
    for (let i = 0; i < pts.length - 1; i += 2) {
      if (pts[i][1] !== rows.REM) continue;
      out.push(
        `<rect x="${pts[i][0].toFixed(1)}" y="${rows.REM - 34}" width="${(pts[i + 1][0] - pts[i][0]).toFixed(1)}" height="68" rx="12" fill="${TEAL}" opacity="0.32"/>`,
      );
    }
    return out.join("");
  })();

  return svg(
    plainBackdrop() +
      lanes +
      remBars +
      `<path d="${line}" fill="none" stroke="${STAR}" stroke-width="6" stroke-linejoin="round" opacity="0.95"/>`,
  );
}

/* ─── Vận động và tim mạch: hai nhịp tim, cùng một khoảng thời gian ─── */
function cardio(): string {
  const x0 = 130;
  const x1 = W - 130;
  const span = x1 - x0;

  /* Hai vệt trên CÙNG một trục thời gian. Người tập bền bỉ 45 nhịp/phút,
     người ít vận động 72 — con số của bài. Cùng một quãng thời gian mà một
     bên đập ít hơn hẳn: đó là thể tích tống máu tăng, vẽ ra chứ không kể. */
  const trace = (y: number, beats: number, color: string, width: number) => {
    const step = span / beats;
    const d: string[] = [`M${x0} ${y}`];
    for (let i = 0; i < beats; i++) {
      const b = x0 + i * step;
      d.push(
        `L${(b + step * 0.34).toFixed(1)} ${y}`,
        `L${(b + step * 0.4).toFixed(1)} ${y + 18}`,
        `L${(b + step * 0.46).toFixed(1)} ${(y - 128).toFixed(1)}`,
        `L${(b + step * 0.52).toFixed(1)} ${(y + 46).toFixed(1)}`,
        `L${(b + step * 0.58).toFixed(1)} ${y}`,
        `L${(b + step).toFixed(1)} ${y}`,
      );
    }
    return `<path d="${d.join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
  };

  return svg(
    plainBackdrop() +
      faintGrid(7, 170, 830) +
      trace(360, 6, YELLOW, 8) +
      trace(672, 10, "#f0705a", 7),
  );
}

const COVERS: Record<string, () => string> = {
  "song-hap-dan-va-song-trong-luc": gravitationalWaves,
  "nguyen-tu-cau-tao-va-dong-vi": atom,
  "song-buoc-song-tan-so-bien-do": wave,
  "ba-dinh-luat-newton": newtonLaws,
  "dinh-luat-kepler": keplerLaws,
  "thuyet-tuong-doi-hep": specialRelativity,
  "khoi-luong-quan-tinh-va-trong-luong": massVsWeight,
  "nang-luong-la-gi": energy,
  "thang-khoang-cach-vu-tru": distanceLadder,
  "chom-sao-hoang-dao": zodiac,
  "giac-ngu-sau-va-tri-nho": sleepStages,
  "van-dong-va-tim-mach": cardio,
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
