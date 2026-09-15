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

      {/*
        Nền của hai vùng, vẽ TRƯỚC hạt băng để hạt nổi lên trên.

        Xem chú thích ở khối đường biên bên dưới để biết vì sao phải có hai
        dải này. Đặt ở đây vì thứ tự vẽ quyết định: nếu nằm sau nhóm hạt băng
        thì lớp mờ phủ lên chính các hạt, làm nhạt đi thứ nó đang làm nền.
      */}
      <circle
        cx={CX}
        cy={CY}
        r={(radius(20_000) + radius(100_000)) / 2}
        stroke="#bae6fd"
        strokeOpacity="0.07"
        strokeWidth={radius(100_000) - radius(20_000)}
        fill="none"
      />
      <circle
        cx={CX}
        cy={CY}
        r={(radius(2_000) + radius(20_000)) / 2}
        stroke="#7dd3fc"
        strokeOpacity="0.12"
        strokeWidth={radius(20_000) - radius(2_000)}
        fill="none"
      />

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
          {/* Cỡ chữ 18 đơn vị, KHÔNG phải 11.

              Khung vẽ rộng 600 đơn vị nhưng hình hiển thị ở cột 416px, tức thu
              0,69 lần: chữ 11 xuống còn 7,6px trên màn — dưới mức đọc được, và
              đã bị báo đúng như vậy. 18 đơn vị cho 12,5px, ngang cỡ chữ chú
              thích của trang.

              Đây không phải chi tiết trang trí co được. Sáu con số này là thứ
              duy nhất giữ cho thang loga không nói dối — bỏ chúng đi thì đám mây
              trông gần hơn thực tế mấy bậc. Xem khối chú thích đầu tệp. */}
          {/* Độ mờ 0,9 chứ không phải 0,75.

              CẢ SÁU nhãn đều bắt đầu bằng chữ số `1` (1 · 10 · 100 · 1.000 ·
              10.000 · 100.000), mà `1` là glyph mảnh nhất của bộ mono: chỉ một
              nét đứng, không có phần cong nào đỡ. Nó cũng là chữ số mang toàn
              bộ bậc độ lớn — mất nó thì 100.000 đọc thành 00.000, tức nhãn nói
              sai chứ không phải khó đọc.

              0,75 hợp lý khi nhãn chỉ cần lùi sau hình. Ở đây thứ dễ mất nhất
              lại là thứ đắt nhất khi mất, nên đánh đổi ngược lại.

              ĐÍNH CHÍNH: độ mờ KHÔNG phải nguyên nhân của lỗi "mất số đầu
              tiên" đã báo. Nguyên nhân thật nằm ở hiệu ứng `zoom-in-95` của
              hộp thoại — xem chú thích `DialogContent` trong
              `oort-cloud-figure.tsx`. Giữ 0,9 vì nó vẫn đúng về mặt đọc được,
              không phải vì nó chữa lỗi kia. */}
          <text
            x={CX + 6}
            y={CY - radius(au) - 7}
            className="fill-current font-mono"
            fontSize="18"
            opacity="0.9"
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

      {/*
        Ba vùng trong chú giải phải đọc ra là ba VÙNG trên hình.

        Trước đây chỉ Vành đai Kuiper có hình dạng — nó là một dải dày. Đám
        Hills chỉ có hai đường tròn mảnh ở 2.000 và 20.000 AU, còn Đám ngoài
        thì không có đường nào cả, chỉ là chỗ các hạt băng thưa dần. Người đọc
        nhìn chú giải rồi nhìn hình thì không chỉ ra được hai vùng ấy nằm đâu —
        và đã báo đúng như vậy.

        Dựng bằng ĐÚNG kỹ thuật của dải Kuiper: một đường tròn ở bán kính giữa
        vùng, `strokeWidth` bằng bề dày vùng. Rẻ hơn hẳn so với `<path>` hình
        vành khăn hay `<mask>`, và bề dày tự đúng theo thang loga vì cả hai
        bán kính đều đi qua `radius()`.

        Độ mờ rất thấp: đây là nền cho các hạt băng chứ không phải hình chính.
        Vùng ngoài mờ hơn vùng trong, đúng theo mật độ thật — và cũng để hai
        dải chồng nhau không cộng thành một mảng đặc.

        Vẫn giữ hai đường biên mảnh, nay rõ hơn (0,55 thay vì 0,35): dải cho
        biết vùng NẰM ĐÂU, đường biên cho biết nó BẮT ĐẦU và KẾT THÚC ở con số
        nào trên thang chia.
      */}
      {/* Đám Hills — hai đường biên của phần trong */}
      <circle
        cx={CX}
        cy={CY}
        r={radius(20_000)}
        stroke="#7dd3fc"
        strokeOpacity="0.55"
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx={CX}
        cy={CY}
        r={radius(2_000)}
        stroke="#7dd3fc"
        strokeOpacity="0.55"
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
