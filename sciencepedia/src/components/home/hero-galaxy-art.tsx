/**
 * Thiên hà xoắn ở hero — minh hoạ SVG tự vẽ.
 *
 * ## Vì sao tự vẽ chứ không dùng ảnh
 *
 * Ba lựa chọn khả dĩ và hai cái bị loại: ảnh chụp thật của NASA/ESO đẹp nhưng
 * là một thiên hà CỤ THỂ, nên một bách khoa khoa học dán nó làm nền trang chủ
 * mà không ghi tên và nguồn thì đang làm đúng cái nó dạy người khác đừng làm;
 * ảnh sinh bằng máy thì vướng chính quy tắc provenance của dự án. Hình vẽ
 * vector không vướng gì cả, nặng vài chục KB, sắc nét ở mọi màn hình, và đổi
 * màu theo bảng màu thương hiệu.
 *
 * ## Vì sao toạ độ được SINH chứ không viết tay
 *
 * Cánh xoắn là đường logarit `r = a·e^(bθ)` — đúng dạng mà thiên hà xoắn có
 * thật. Viết tay vài chục điểm Bézier cho bốn cánh vừa dài vừa không sửa
 * được: muốn cánh mở rộng hơn một chút là phải vẽ lại tất cả. Sinh từ công
 * thức thì chỉ có hai hằng số để chỉnh, và bốn cánh chắc chắn đối xứng.
 *
 * Số ngẫu nhiên đi qua một bộ sinh CÓ HẠT GIỐNG CỐ ĐỊNH, chạy một lần ở tầm
 * module. `Math.random()` ở đây sẽ cho server và client hai bầu trời khác
 * nhau, tức một lỗi hydration trên chính khối chiếm phần lớn màn hình đầu
 * tiên.
 *
 * ## Ràng buộc tương phản
 *
 * Nửa trái của khung để TRỐNG có chủ đích: hero là lưới hai cột và tiêu đề
 * nằm bên trái. Lõi sáng nhất của thiên hà lệch phải, và không có chi tiết
 * sáng nào vượt quá 40% bề ngang. Ai dịch thiên hà vào giữa thì phải hạ độ
 * sáng của nó xuống, nếu không tiêu đề mất tương phản.
 */

/** Bộ sinh số giả ngẫu nhiên mulberry32 — nhỏ, đủ đều, và tái lập được. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bốn cánh, mỗi cánh quét 172° và nở từ bán kính 46 ra 333. */
const ARMS = 4;
const SWEEP = 3.0;
const R0 = 46;
const GROWTH = 0.66;

function armPoint(arm: number, t: number): [number, number] {
  const theta = (arm * 2 * Math.PI) / ARMS + t * SWEEP;
  const r = R0 * Math.exp(GROWTH * t * SWEEP);
  return [Math.cos(theta) * r, Math.sin(theta) * r];
}

type ArmSegment = { d: string; w: number; o: number };

/**
 * Vệt sáng của cánh, CẮT THÀNH ĐOẠN chứ không một nét liền.
 *
 * Một nét liền có bề dày cố định thì đầu ngoài của cánh dừng đột ngột — bản
 * dựng thử cho ra bốn cục sáng cụt ở rìa đĩa, trông như nét vẽ bị xoá dở. Mà
 * SVG không có "stroke thon dần": bề dày là một con số cho cả đường.
 *
 * Cắt làm mười đoạn, mỗi đoạn mảnh hơn và mờ hơn đoạn trước, thì cánh loãng
 * dần ra ngoài đúng như đĩa thật loãng dần — và chỗ nối không thấy được vì cả
 * lớp này nằm dưới một filter làm mờ.
 */
const ARM_SEGMENTS: ArmSegment[] = (() => {
  const out: ArmSegment[] = [];
  const SEGMENTS = 10;
  const STEPS_PER_SEGMENT = 7;

  for (let arm = 0; arm < ARMS; arm += 1) {
    const bright = arm % 2 === 0;

    for (let seg = 0; seg < SEGMENTS; seg += 1) {
      let d = "";
      for (let i = 0; i <= STEPS_PER_SEGMENT; i += 1) {
        // Đoạn sau bắt đầu ở đúng điểm cuối của đoạn trước, không chừa khe
        const t = (seg + i / STEPS_PER_SEGMENT) / SEGMENTS;
        const [x, y] = armPoint(arm, t);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }

      const t = seg / (SEGMENTS - 1);
      out.push({
        d,
        w: (bright ? 56 : 34) * (1 - 0.72 * t),
        o: (bright ? 0.85 : 0.6) * (1 - 0.55 * t),
      });
    }
  }

  return out;
})();

type Cloud = { x: number; y: number; r: number; fill: string; o: number };

/**
 * Vài đám tinh vân màu bám dọc cánh.
 *
 * Không phải trang trí thừa: thiếu chúng thì đĩa chỉ còn vàng ở lõi và trắng
 * xanh ở ngoài, và mắt đọc ra một đám bụi chứ không phải một thiên hà. Màu
 * hồng tím là thứ làm ảnh thiên hà thật trông "sống" — vùng HII nơi sao đang
 * sinh ra. Đặt ở `t` trung bình tới lớn vì đó là chỗ chúng nằm thật.
 */
const CLOUDS: Cloud[] = (() => {
  const rand = mulberry32(31415);
  const out: Cloud[] = [];
  const tints = ["#a46bff", "#ff7ec8", "#5b8cff", "#c07bff"];

  for (let arm = 0; arm < ARMS; arm += 1) {
    for (let i = 0; i < 3; i += 1) {
      const t = 0.42 + rand() * 0.5;
      const [x, y] = armPoint(arm, t);
      out.push({
        x: +(x + (rand() - 0.5) * 40).toFixed(1),
        y: +(y + (rand() - 0.5) * 40).toFixed(1),
        r: +(48 + rand() * 62).toFixed(1),
        fill: tints[Math.floor(rand() * tints.length)],
        o: +(0.1 + rand() * 0.14).toFixed(2),
      });
    }
  }

  return out;
})();

type Speck = { x: number; y: number; r: number; fill: string; o: number };

/**
 * Hạt sao bám theo cánh.
 *
 * Màu đổi theo BÁN KÍNH chứ không ngẫu nhiên, vì đó là điều có thật: vùng lõi
 * toàn sao già ngả vàng, còn ngoài cánh là sao trẻ xanh và vài vùng HII hồng.
 * Một thiên hà tô màu ngẫu nhiên trông ra đồ hoạ trang trí; tô theo bán kính
 * thì nó vẫn là hình vẽ, nhưng là hình vẽ đúng.
 */
const SPECKS: Speck[] = (() => {
  const rand = mulberry32(20260913);
  const out: Speck[] = [];

  for (let arm = 0; arm < ARMS; arm += 1) {
    // Hai cánh chính dày hạt hơn hai cánh phụ — thiên hà thật hiếm khi đều
    const count = arm % 2 === 0 ? 260 : 150;

    for (let i = 0; i < count; i += 1) {
      // `t` lệch về phía ngoài: phần lớn diện tích đĩa nằm ở vành ngoài
      const t = Math.sqrt(rand());
      const [cx, cy] = armPoint(arm, t);

      // Cánh nở dần ra ngoài, nên biên độ tản cũng nở theo
      const spread = 10 + t * 46;
      const jx = (rand() + rand() + rand() - 1.5) * spread;
      const jy = (rand() + rand() + rand() - 1.5) * spread;

      const pick = rand();
      let fill: string;
      if (t < 0.26) fill = pick < 0.75 ? "#ffe2b0" : "#fff6e2";
      else if (t < 0.55) fill = pick < 0.55 ? "#e6ecff" : "#ffd9a8";
      else if (pick < 0.1) fill = "#ff9ad5";
      else if (pick < 0.45) fill = "#9db8ff";
      else fill = "#cfd9ff";

      out.push({
        x: +(cx + jx).toFixed(1),
        y: +(cy + jy).toFixed(1),
        r: +(0.6 + rand() * (t < 0.3 ? 1.1 : 1.9)).toFixed(2),
        fill,
        o: +(0.35 + rand() * 0.6).toFixed(2),
      });
    }
  }

  return out;
})();

/** Sao nền rải khắp khung, ngoài đĩa. */
const FIELD: Speck[] = (() => {
  const rand = mulberry32(77712);
  const out: Speck[] = [];

  for (let i = 0; i < 150; i += 1) {
    const x = rand() * 800;
    const y = rand() * 800;
    // Bỏ những sao rơi vào giữa đĩa: ở đó đã dày hạt, thêm nữa chỉ thành đục
    if (Math.hypot(x - 400, y - 400) < 210) continue;

    out.push({
      x: +x.toFixed(1),
      y: +y.toFixed(1),
      r: +(0.5 + rand() * 1.2).toFixed(2),
      fill: rand() < 0.2 ? "#bcd0ff" : "#ffffff",
      o: +(0.18 + rand() * 0.5).toFixed(2),
    });
  }

  return out;
})();

export function HeroGalaxyArt({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Quầng ngoài: xanh lam ngả tím, tắt hẳn trước mép khung để không
            thấy cạnh vuông của SVG */}
        <radialGradient id="hg-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6f8dff" stopOpacity="0.42" />
          <stop offset="38%" stopColor="#4d5fd6" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#2a2f7a" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0b1024" stopOpacity="0" />
        </radialGradient>

        {/* Lõi: trắng ở tâm, vàng cam ra ngoài — sao già của phình trung tâm */}
        <radialGradient id="hg-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffdf6" stopOpacity="1" />
          <stop offset="22%" stopColor="#ffe7b4" stopOpacity="0.95" />
          <stop offset="52%" stopColor="#ffb765" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>

        {/* Vệt sáng chạy dọc cánh, nằm dưới lớp hạt để cánh không rời rạc */}
        <linearGradient id="hg-arm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#a9c0ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7b6ad8" stopOpacity="0.12" />
        </linearGradient>

        <linearGradient id="hg-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7fa8ff" stopOpacity="0" />
          <stop offset="30%" stopColor="#a9c5ff" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#c8b4ff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7fa8ff" stopOpacity="0" />
        </linearGradient>

        {/* Hành tinh lớn: nửa hướng về lõi thiên hà được chiếu sáng */}
        <radialGradient id="hg-planet" cx="32%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#8fb6ff" />
          <stop offset="38%" stopColor="#2f5bb5" />
          <stop offset="78%" stopColor="#12224e" />
          <stop offset="100%" stopColor="#080e22" />
        </radialGradient>

        <filter id="hg-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="hg-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* Sao nền — đứng yên, không quay theo đĩa */}
      <g>
        {FIELD.map((s, i) => (
          <circle
            key={`f${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.fill}
            opacity={s.o}
          />
        ))}
      </g>

      <circle cx="400" cy="400" r="380" fill="url(#hg-halo)" />

      {/* Đĩa nghiêng. Nghiêng đặt Ở ĐÂY, còn phép quay đặt ở nhóm con — quay
          một hình đã nghiêng quanh tâm khung thì đĩa lắc như đồng xu sắp đổ,
          chứ không xoay trong mặt phẳng của chính nó. */}
      <g transform="translate(400 400) rotate(-18) scale(1 0.58)">
        <g className="hero-galaxy-spin">
          {/* Vòng vô hình ép hộp bao của nhóm về đúng tâm, để
              `transform-origin: center` của CSS rơi vào tâm đĩa thật. */}
          <circle cx="0" cy="0" r="360" fill="none" />

          {/* Vệt sáng của cánh, làm mờ mạnh */}
          <g filter="url(#hg-soft)" opacity="0.75">
            {ARM_SEGMENTS.map((seg, i) => (
              <path
                key={`a${i}`}
                d={seg.d}
                stroke="url(#hg-arm)"
                strokeWidth={seg.w}
                strokeOpacity={seg.o}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </g>

          {/* Tinh vân màu, nằm TRÊN vệt cánh và DƯỚI hạt sao: sao phải sáng
              hơn đám mây sinh ra chúng, nếu không cả vùng trông như bị phủ
              một lớp kính màu. */}
          <g filter="url(#hg-bloom)">
            {CLOUDS.map((c, i) => (
              <circle
                key={`c${i}`}
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill={c.fill}
                opacity={c.o}
              />
            ))}
          </g>

          {/* Hạt sao */}
          <g>
            {SPECKS.map((s, i) => (
              <circle
                key={`s${i}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill={s.fill}
                opacity={s.o}
              />
            ))}
          </g>
        </g>

        {/* Lõi KHÔNG nằm trong nhóm quay: nó đối xứng tròn nên quay hay không
            cũng thế, mà để ngoài thì trình duyệt khỏi vẽ lại nó mỗi khung. */}
        <ellipse cx="0" cy="0" rx="170" ry="150" fill="url(#hg-core)" />
        <ellipse
          cx="0"
          cy="0"
          rx="64"
          ry="56"
          fill="#fff5e0"
          opacity="0.9"
          filter="url(#hg-bloom)"
        />
      </g>

      {/* Quỹ đạo mảnh cắt ngang đĩa — nhắc rằng đây là một hệ đang chuyển
          động, và nối thiên hà với mấy hành tinh ở hai đầu khung. */}
      <ellipse
        cx="400"
        cy="400"
        rx="352"
        ry="118"
        transform="rotate(-18 400 400)"
        stroke="url(#hg-ring)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />

      {/* Hành tinh lớn, góc dưới phải: nằm trên đường quỹ đạo, không trôi tự do */}
      <g>
        <circle
          cx="648"
          cy="612"
          r="92"
          fill="#4f7dff"
          opacity="0.16"
          filter="url(#hg-bloom)"
        />
        <circle cx="648" cy="612" r="62" fill="url(#hg-planet)" />
        {/* Vành sáng phía hướng về lõi thiên hà */}
        <path
          d="M648 550a62 62 0 0 0-43 106"
          stroke="#bcd4ff"
          strokeOpacity="0.5"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* Vệ tinh nhỏ trên cao bên phải */}
      <g>
        <circle
          cx="686"
          cy="176"
          r="34"
          fill="#8fb6ff"
          opacity="0.14"
          filter="url(#hg-bloom)"
        />
        <circle cx="686" cy="176" r="19" fill="url(#hg-planet)" />
      </g>

      {/* Chấm nhỏ bên trái dưới, chỉ để hai đầu quỹ đạo không trống một bên */}
      <circle cx="150" cy="662" r="10" fill="url(#hg-planet)" />
    </svg>
  );
}
