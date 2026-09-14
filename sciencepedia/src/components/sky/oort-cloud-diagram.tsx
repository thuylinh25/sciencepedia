/**
 * Sơ đồ Đám mây Oort — thang LOGA.
 *
 * ## Vì sao là sơ đồ chứ không phải ảnh
 *
 * Đám mây Oort chưa từng được quan sát trực tiếp. Không có tấm ảnh nào để
 * lấy, và mọi "ảnh đám mây Oort" trôi nổi trên mạng đều là hình vẽ. Nên khối
 * này là hình vẽ, và nó phải NÓI RA điều đó ngay cạnh hình — đặt một hình vẽ
 * vào một trang mang tên "ảnh bầu trời thật từ các khảo sát thiên văn" mà
 * không dán nhãn là mời người đọc hiểu nhầm.
 *
 * ## Vì sao thang loga, và vì sao phải ghi rõ
 *
 * Rìa ngoài đám mây ở khoảng 100.000 AU, còn quỹ đạo Sao Hải Vương ở 30 AU.
 * Vẽ đúng tỉ lệ tuyến tính thì cả Hệ Mặt Trời hành tinh gói gọn trong 0,03%
 * bán kính hình — tức một chấm không nhìn thấy. Thang loga là cách duy nhất
 * để cả hai đầu cùng có mặt trên một hình.
 *
 * Nhưng thang loga bóp méo cảm nhận về khoảng cách theo đúng hướng nguy hiểm:
 * nó khiến đám mây trông GẦN hơn thực tế rất nhiều. Nên hình có vạch chia ghi
 * số, và dòng chú dưới hình nói thẳng đây là thang loga. Một sơ đồ bóp méo mà
 * không khai báo phép bóp méo thì dạy sai.
 *
 * ## Con số lấy ở đâu
 *
 * Ranh giới trong/ngoài (đám Hills ~2.000–20.000 AU, đám ngoài tới ~100.000
 * AU) là khoảng ước lượng phổ biến, và bản thân chúng KHÔNG chắc — chính vì
 * chưa ai quan sát trực tiếp. Hình dùng khoảng chứ không dùng số điểm, và chú
 * thích nói rõ đây là suy ra từ quỹ đạo sao chổi chu kỳ dài chứ không phải đo
 * đạc trực tiếp.
 */

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CX = 300;
const CY = 300;

/** Bán kính vẽ cho một khoảng cách tính bằng AU, theo thang loga. */
function radius(au: number): number {
  return 34 + (272 - 34) * (Math.log10(au) / 5);
}

/** Vạch chia có ghi số — thứ giữ cho thang loga không nói dối. */
const TICKS = [1, 10, 100, 1_000, 10_000, 100_000];

/** Hạt băng của đám mây, rải trong vỏ cầu chiếu xuống mặt phẳng hình. */
const SPECKS = (() => {
  const rand = mulberry32(19501);
  const out: { x: number; y: number; r: number; o: number }[] = [];

  for (let i = 0; i < 520; i += 1) {
    // Phân bố đều theo LOGA giữa 2.000 và 100.000 AU: đó là cách duy nhất để
    // mật độ hạt trên hình phản ánh được vỏ cầu, thay vì dồn hết ra rìa.
    const au = 10 ** (Math.log10(2_000) + rand() * (5 - Math.log10(2_000)));
    const angle = rand() * Math.PI * 2;
    const r = radius(au);

    out.push({
      x: +(CX + Math.cos(angle) * r).toFixed(1),
      y: +(CY + Math.sin(angle) * r).toFixed(1),
      r: +(0.7 + rand() * 1.3).toFixed(2),
      o: +(0.25 + rand() * 0.5).toFixed(2),
    });
  }

  return out;
})();

export function OortCloudDiagram({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="oort-shell" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="82%" stopColor="#7dd3fc" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.04" />
        </radialGradient>
        <radialGradient id="oort-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7e0" />
          <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Vỏ cầu ngoài */}
      <circle cx={CX} cy={CY} r={radius(100_000)} fill="url(#oort-shell)" />

      {/* Vạch chia loga */}
      {TICKS.map((au) => (
        <g key={au}>
          <circle
            cx={CX}
            cy={CY}
            r={radius(au)}
            stroke="currentColor"
            strokeOpacity="0.14"
            strokeDasharray="2 5"
            fill="none"
          />
          <text
            x={CX + 4}
            y={CY - radius(au) - 4}
            className="fill-current font-mono"
            fontSize="11"
            opacity="0.45"
          >
            {au.toLocaleString("vi-VN")} AU
          </text>
        </g>
      ))}

      {/* Hạt băng */}
      <g>
        {SPECKS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#bae6fd"
            opacity={s.o}
          />
        ))}
      </g>

      {/* Đám Hills — phần trong, đặc hơn */}
      <circle
        cx={CX}
        cy={CY}
        r={radius(20_000)}
        stroke="#7dd3fc"
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx={CX}
        cy={CY}
        r={radius(2_000)}
        stroke="#7dd3fc"
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />

      {/* Vành đai Kuiper 30–50 AU */}
      <circle
        cx={CX}
        cy={CY}
        r={(radius(30) + radius(50)) / 2}
        stroke="#a78bfa"
        strokeOpacity="0.55"
        strokeWidth={radius(50) - radius(30)}
        fill="none"
      />

      {/* Quỹ đạo Sao Hải Vương */}
      <circle
        cx={CX}
        cy={CY}
        r={radius(30)}
        stroke="#60a5fa"
        strokeOpacity="0.5"
        fill="none"
      />

      {/* Mặt Trời */}
      <circle cx={CX} cy={CY} r="18" fill="url(#oort-sun)" />
      <circle cx={CX} cy={CY} r="3.5" fill="#fff7e0" />
    </svg>
  );
}
